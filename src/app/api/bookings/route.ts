import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { sendBookingRequestEmails } from '@/lib/booking-email'

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

    const payload = await getPayload({ config })

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

    // Determine payment mode based on package type
    let paymentMode: 'pay_after_completion' | 'pay_upfront' | 'deposit_final' = 'pay_after_completion'
    if (pkg.durationType === 'call') {
      paymentMode = 'pay_upfront'
    } else if (pkg.durationType === 'month') {
      paymentMode = 'deposit_final'
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
          depositAmount: Math.round(pkg.price * 0.5),
        }),
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
