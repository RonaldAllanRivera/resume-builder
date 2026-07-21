import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { TZDate } from '@date-fns/tz'
import { findMatchingRule, isWithinBookingWindow } from '@/lib/booking-availability'

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

/**
 * GET /api/availability/slots?date=2026-04-15&packageSlug=30min-consultation
 *
 * Returns available time slots for a given date and package.
 * Only exposes available slots — never internal schedule rules.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const packageSlug = searchParams.get('packageSlug')

  if (!date || !packageSlug) {
    return NextResponse.json(
      { error: 'Missing required parameters: date, packageSlug' },
      { status: 400 },
    )
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    // Fetch the package (public read access)
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

    // Fetch active availability rules (using Local API — bypasses access control intentionally)
    const { docs: rules } = await payload.find({
      collection: 'availabilityRules',
      where: { active: { equals: true } },
      limit: 10,
    })

    if (rules.length === 0) {
      return NextResponse.json({ slots: [], message: 'No availability configured' })
    }

    const requestedDate = new Date(date + 'T00:00:00')
    const now = new Date()

    // Find a rule that matches the requested day of week
    const rule = findMatchingRule(rules, requestedDate)

    if (!rule) {
      return NextResponse.json({ slots: [], message: 'Not available on this day' })
    }

    const window = isWithinBookingWindow({
      startAt: requestedDate,
      pkg,
      rule,
      now,
    })

    if (!window.ok) {
      return NextResponse.json({ slots: [], message: window.reason })
    }

    // Check blocked dates
    const blockedDates = (rule.blockedDates as Array<{ date: string; reason?: string }>) || []
    const isBlocked = blockedDates.some((blocked) => {
      const blockedDate = new Date(blocked.date)
      return blockedDate.toISOString().split('T')[0] === date
    })

    if (isBlocked) {
      return NextResponse.json({ slots: [], message: 'This date is unavailable' })
    }

    // Generate time slots
    const startTime = rule.startTime || '09:00'
    const endTime = rule.endTime || '17:00'
    const slotDuration = pkg.durationMinutes || rule.slotDurationMinutes || 30
    const bufferMinutes = rule.bufferMinutes || 15
    const ruleTimezone = rule.timezone || 'Asia/Manila'

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    // Create dates in the rule's timezone, then convert to UTC
    // This ensures 18:00 in Manila becomes the correct UTC timestamp
    const [year, month, day] = date.split('-').map(Number)
    const dayStart = new TZDate(year, month - 1, day, startHour, startMin, 0, 0, ruleTimezone)
    const dayEnd = new TZDate(year, month - 1, day, endHour, endMin, 0, 0, ruleTimezone)

    // Fetch existing bookings for this date to exclude
    const dateStart = new Date(date + 'T00:00:00.000Z')
    const dateEnd = new Date(date + 'T23:59:59.999Z')

    const { docs: existingBookings } = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          { startAt: { greater_than_equal: dateStart.toISOString() } },
          { startAt: { less_than_equal: dateEnd.toISOString() } },
          {
            status: {
              in: ['pending_review', 'accepted', 'pending_payment', 'paid', 'in_progress'],
            },
          },
        ],
      },
      limit: 50,
    })

    // Generate slots
    const slots: TimeSlot[] = []
    const current = new Date(dayStart)

    while (current.getTime() + slotDuration * 60 * 1000 <= dayEnd.getTime()) {
      const slotStart = new Date(current)
      const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000)

      // Check if slot conflicts with existing bookings
      const isBooked = existingBookings.some((booking) => {
        const bookingStart = new Date(booking.startAt)
        const bookingEnd = new Date(booking.endAt)
        return slotStart < bookingEnd && slotEnd > bookingStart
      })

      // Check if slot is in the past
      const isPast = slotStart <= now

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBooked && !isPast,
      })

      // Move to next slot (duration + buffer)
      current.setMinutes(current.getMinutes() + slotDuration + bufferMinutes)
    }

    // Check max bookings per day
    const maxPerDay = rule.maxBookingsPerDay ?? 8
    const bookedCount = existingBookings.length
    const remainingSlots = maxPerDay - bookedCount

    if (remainingSlots <= 0) {
      return NextResponse.json({
        slots: slots.map((s) => ({ ...s, available: false })),
        message: 'Fully booked for this day',
      })
    }

    return NextResponse.json({
      slots,
      timezone: rule.timezone || 'Asia/Manila',
      packageSlug,
      date,
    })
  } catch (error) {
    console.error('Error fetching availability slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
