import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { sendBookingRequestEmails } from '@/lib/booking-email'
import { findMatchingRule, isWithinBookingWindow } from '@/lib/booking-availability'

/**
 * POST /api/bookings
 *
 * Submit a booking request. Creates a customer (or finds existing) and a booking
 * in `pending_review` status. The freelancer has 24 hours to accept/decline.
 *
 * Body: {
 *   packageSlug: string
 *   startAt: string (ISO datetime)
 *   endAt: string (ISO datetime)
 *   customer: { name: string, email: string, phone?: string, company?: string, timezone?: string }
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const bookingSettings = await payload.findGlobal({ slug: 'bookingSettings', depth: 0 })

    if (bookingSettings?.bookingEnabled === false) {
      return NextResponse.json(
        { error: 'Bookings are currently closed. Please use the contact form.' },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { packageSlug, startAt, endAt, customer, notes } = body

    // Validate required fields
    if (!packageSlug || !startAt || !endAt || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: 'Missing required fields: packageSlug, startAt, endAt, customer.name, customer.email' },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    if (startDate <= new Date()) {
      return NextResponse.json({ error: 'Booking must be in the future' }, { status: 400 })
    }

    // Find the package
    const { docs: packages } = await payload.find({
      collection: 'packages',
      where: {
        slug: { equals: packageSlug },
        active: { equals: true },
      },
      limit: 1,
    })

    if (packages.length === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const pkg = packages[0]

    // Enforce the lead-time / availability window — this is the fix: the
    // slots endpoint only hid non-compliant dates from the calendar, but
    // this endpoint accepted them outright. Share the resolution logic with
    // the slots endpoint so the two cannot drift apart.
    const { docs: rules } = await payload.find({
      collection: 'availabilityRules',
      where: { active: { equals: true } },
      limit: 10,
    })

    const matchingRule = findMatchingRule(rules, startDate)

    if (!matchingRule) {
      return NextResponse.json(
        { error: 'No availability configured for this day. Please choose a different date.' },
        { status: 400 },
      )
    }

    const window = isWithinBookingWindow({
      startAt: startDate,
      pkg,
      rule: matchingRule,
      now: new Date(),
    })

    if (!window.ok) {
      return NextResponse.json({ error: window.reason }, { status: 400 })
    }

    // Check for double booking
    const { docs: conflicting } = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          { startAt: { less_than: endAt } },
          { endAt: { greater_than: startAt } },
          {
            status: {
              in: [
                'pending_review',
                'accepted',
                'pending_payment',
                'paid',
                'in_progress',
              ],
            },
          },
        ],
      },
      limit: 1,
    })

    if (conflicting.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please select a different time.' },
        { status: 409 },
      )
    }

    // Find or create customer
    const { docs: existingCustomers } = await payload.find({
      collection: 'customers',
      where: { email: { equals: customer.email } },
      limit: 1,
    })

    let customerId: number

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id
      // Update customer info if changed
      await payload.update({
        collection: 'customers',
        id: customerId,
        data: {
          name: customer.name,
          ...(customer.phone && { phone: customer.phone }),
          ...(customer.company && { company: customer.company }),
          ...(customer.timezone && { timezone: customer.timezone }),
        },
      })
    } else {
      const newCustomer = await payload.create({
        collection: 'customers',
        data: {
          email: customer.email,
          name: customer.name,
          phone: customer.phone || undefined,
          company: customer.company || undefined,
          timezone: customer.timezone || 'America/New_York',
        },
      })
      customerId = newCustomer.id
    }

    // Determine payment mode based on package type. Consultations take no
    // payment to book (the call itself is the sales conversation — friction
    // there costs leads); every paid package (day/week/month) requires a
    // deposit up front, with the balance invoiced manually after the work.
    const paymentMode: 'pay_after_completion' | 'deposit_final' =
      pkg.durationType === 'call' ? 'pay_after_completion' : 'deposit_final'

    const depositPercent = bookingSettings?.depositPercent ?? 50
    const depositDueDaysBeforeStart = bookingSettings?.depositDueDaysBeforeStart ?? 3

    // paymentDueAt is the admin's guaranteed verification window before the
    // session starts — stored (not computed on read) so the admin list can
    // sort/filter by it. Consultations never enter pending_payment, so they
    // get no deadline.
    let paymentDueAt: string | undefined
    if (paymentMode === 'deposit_final') {
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() - depositDueDaysBeforeStart)
      paymentDueAt = dueDate.toISOString()
    }

    // Create booking
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        customer: customerId,
        package: pkg.id,
        status: 'pending_review',
        paymentMode,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        timezoneAtBooking: customer.timezone || 'America/New_York',
        notes: notes || undefined,
        amount: pkg.price,
        currency: pkg.currency,
        ...(paymentMode === 'deposit_final' && {
          depositAmount: Math.round((pkg.price * depositPercent) / 100),
        }),
        ...(paymentDueAt && { paymentDueAt }),
      },
    })

    // Fire-and-forget — email failure must not block the booking response
    sendBookingRequestEmails(
      {
        name: customer.name,
        email: customer.email,
        company: customer.company || null,
      },
      {
        bookingId: booking.id,
        packageName: typeof pkg.name === 'string' ? pkg.name : String(pkg.name),
        startAt: booking.startAt ?? startDate.toISOString(),
        endAt: booking.endAt ?? endDate.toISOString(),
        amount: booking.amount ?? pkg.price,
        currency: booking.currency ?? pkg.currency,
        paymentMode: booking.paymentMode ?? paymentMode,
        notes: booking.notes || null,
        timezone: customer.timezone,
      },
    ).catch((err) => console.error('sendBookingRequestEmails failed:', err))

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      message: 'Booking request submitted. You will receive a confirmation email within 24 hours.',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
