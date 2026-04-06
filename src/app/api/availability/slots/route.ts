import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

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
    const dayOfWeek = requestedDate.getDay() === 0 ? 7 : requestedDate.getDay() // ISO: Mon=1, Sun=7

    // Check advance notice
    const rule = rules[0] // Use first active rule
    const advanceNoticeDays = rule.advanceNoticeDays ?? 7
    const maxAdvanceDays = rule.maxAdvanceDays ?? 60

    const minDate = new Date(now)
    minDate.setDate(minDate.getDate() + advanceNoticeDays)
    minDate.setHours(0, 0, 0, 0)

    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
    maxDate.setHours(23, 59, 59, 999)

    if (requestedDate < minDate) {
      return NextResponse.json({
        slots: [],
        message: `Bookings require at least ${advanceNoticeDays} days advance notice`,
      })
    }

    if (requestedDate > maxDate) {
      return NextResponse.json({
        slots: [],
        message: `Bookings can only be made up to ${maxAdvanceDays} days in advance`,
      })
    }

    // Check if the day is available
    const daysOfWeek = (rule.daysOfWeek as string[]) || []
    if (!daysOfWeek.includes(String(dayOfWeek))) {
      return NextResponse.json({ slots: [], message: 'Not available on this day' })
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

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const dayStart = new Date(date + 'T00:00:00')
    dayStart.setHours(startHour, startMin, 0, 0)

    const dayEnd = new Date(date + 'T00:00:00')
    dayEnd.setHours(endHour, endMin, 0, 0)

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
