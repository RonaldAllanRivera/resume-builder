import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bookings/route'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

/**
 * Covers the bug fixed here: `POST /api/bookings` only checked "is the date
 * in the future", so a client could bypass the advance-notice window that
 * `GET /api/availability/slots` merely hides in the calendar UI. These tests
 * hit the real route handler (not the pure helpers — those are covered in
 * booking-availability.int.spec.ts) to prove the window is now enforced
 * server-side.
 *
 * Availability rules and bookings are real DB state shared across the test
 * run, so:
 *   - The rule we create deliberately excludes Sunday, and the "no matching
 *     rule" case books a Sunday — giving us a day with zero rule coverage
 *     without needing to touch/guess at rules other suites might leave behind.
 *   - Every offset date is nudged off Sunday so the "inside/outside window"
 *     cases always land on a day our rule covers.
 *   - Customer emails and package slugs are suffixed with Date.now() (both
 *     are `unique: true` columns) and booking times carry a Date.now()-derived
 *     minute/hour so re-running against a dirty DB never collides with a
 *     booking a previous run left behind.
 */

let payload: Payload
let ruleId: number
let paidPackageId: number
let paidPackageSlug: string
let consultPackageId: number
let consultPackageSlug: string
const createdBookingIds: number[] = []

// Rule covers Mon–Sat only, so Sunday is guaranteed to have no matching rule.
const RULE_DAYS: ('1' | '2' | '3' | '4' | '5' | '6' | '7')[] = ['1', '2', '3', '4', '5', '6']

function nudgeOffSunday(d: Date): Date {
  const nudged = new Date(d)
  if (nudged.getDay() === 0) nudged.setDate(nudged.getDate() + 1)
  return nudged
}

/** A future date `daysOut` days from now, on a day the test rule covers. */
function daysFromNow(daysOut: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysOut)
  const nudged = nudgeOffSunday(d)
  // Give each call a distinct time-of-day so repeat test runs against a
  // dirty DB don't collide with a slot booked by a previous run.
  const t = Date.now() + daysOut
  nudged.setHours(9 + (t % 8), t % 60, 0, 0)
  return nudged
}

/** The next Sunday at least `minDaysOut` days away — a day no rule covers. */
function nextUncoveredSunday(minDaysOut = 3): Date {
  const d = new Date()
  d.setDate(d.getDate() + minDaysOut)
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
}

function buildBookingRequest(opts: {
  packageSlug: string
  startAt: Date
  email: string
}) {
  const endAt = new Date(opts.startAt.getTime() + 30 * 60 * 1000)
  return new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageSlug: opts.packageSlug,
      startAt: opts.startAt.toISOString(),
      endAt: endAt.toISOString(),
      customer: { name: 'Jane Lead-Time', email: opts.email, timezone: 'Asia/Manila' },
    }),
  })
}

async function bookingCount(): Promise<number> {
  const { totalDocs } = await payload.find({ collection: 'bookings', limit: 0 })
  return totalDocs
}

/**
 * Deletes bookings left behind by a prior run of this suite.
 *
 * `daysFromNow(daysOut)` always lands on the same calendar day for a given
 * `daysOut` (it only nudges the time-of-day), so a booking this suite created
 * on an earlier run — one that crashed before `afterAll` ran, or one that ran
 * against this same persistent test-DB volume in a previous session — can
 * still be sitting in the exact `startAt`/`endAt` window a later run
 * re-derives. `POST /api/bookings`'s double-booking check then (correctly)
 * 409s against the leftover. Sweep anything tied to this suite's distinctive
 * customer emails before creating anything new.
 */
async function sweepLeftoverBookings(payload: Payload) {
  // Full sweep: other suites leave bookings at hardcoded dates that the
  // route's overlap check treats as conflicting (see the identical helper in
  // booking-payment-policy.int.spec.ts for the full rationale). Dedicated
  // test DB + serial suites make this safe.
  const { docs: bookings } = await payload.find({ collection: 'bookings', limit: 0 })
  for (const booking of bookings) {
    await payload.delete({ collection: 'bookings', id: booking.id }).catch(() => {})
  }
}

describe('POST /api/bookings enforces the lead-time window', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    await sweepLeftoverBookings(payload)

    await payload.updateGlobal({ slug: 'bookingSettings', data: { bookingEnabled: true } })

    const rule = await payload.create({
      collection: 'availabilityRules',
      data: {
        name: `Lead-Time Test Rule ${Date.now()}`,
        timezone: 'Asia/Manila',
        daysOfWeek: RULE_DAYS,
        startTime: '09:00',
        endTime: '22:00',
        slotDurationMinutes: 30,
        bufferMinutes: 15,
        advanceNoticeDays: 7,
        maxAdvanceDays: 60,
        maxBookingsPerDay: 20,
        active: true,
      },
    })
    ruleId = rule.id as number

    paidPackageSlug = `lead-time-paid-${Date.now()}`
    const paidPackage = await payload.create({
      collection: 'packages',
      data: {
        name: 'Lead-Time Test Day Rate',
        slug: paidPackageSlug,
        shortDescription: 'A test package with no advanceNoticeDays override.',
        price: 20000,
        currency: 'USD',
        durationType: 'day',
        active: true,
        // advanceNoticeDays intentionally omitted — inherits the rule's 7.
      },
    })
    paidPackageId = paidPackage.id as number

    consultPackageSlug = `lead-time-consult-${Date.now()}`
    const consultPackage = await payload.create({
      collection: 'packages',
      data: {
        name: 'Lead-Time Test Consultation',
        slug: consultPackageSlug,
        shortDescription: 'A test package with a 2-day advanceNoticeDays override.',
        price: 2500,
        currency: 'USD',
        durationType: 'call',
        durationMinutes: 30,
        advanceNoticeDays: 2,
        active: true,
      },
    })
    consultPackageId = consultPackage.id as number
  })

  afterAll(async () => {
    for (const id of createdBookingIds) {
      await payload.delete({ collection: 'bookings', id }).catch(() => {})
    }
    await payload.delete({ collection: 'packages', id: paidPackageId }).catch(() => {})
    await payload.delete({ collection: 'packages', id: consultPackageId }).catch(() => {})
    await payload.delete({ collection: 'availabilityRules', id: ruleId }).catch(() => {})
  })

  it('rejects a paid-package booking inside the 7-day window with 400, creating no booking', async () => {
    const before = await bookingCount()

    const res = await POST(
      buildBookingRequest({
        packageSlug: paidPackageSlug,
        startAt: daysFromNow(3),
        email: `jane-inside-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/advance notice/i)

    const after = await bookingCount()
    expect(after).toBe(before)
  })

  it('accepts a paid-package booking outside the 7-day window', async () => {
    const res = await POST(
      buildBookingRequest({
        packageSlug: paidPackageSlug,
        startAt: daysFromNow(14),
        email: `jane-outside-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    createdBookingIds.push(body.bookingId)
  })

  it('honours a per-package advanceNoticeDays override (2 days) at a date the 7-day rule would reject', async () => {
    const startAt = daysFromNow(3)

    // Sanity: the same offset is rejected for the paid (no-override) package.
    const rejected = await POST(
      buildBookingRequest({
        packageSlug: paidPackageSlug,
        startAt,
        email: `jane-control-${Date.now()}@example.com`,
      }),
    )
    expect(rejected.status).toBe(400)

    const accepted = await POST(
      buildBookingRequest({
        packageSlug: consultPackageSlug,
        startAt,
        email: `jane-override-${Date.now()}@example.com`,
      }),
    )
    const body = await accepted.json()

    expect(accepted.status).toBe(201)
    createdBookingIds.push(body.bookingId)
  })

  it('rejects a booking on a day with no matching availability rule', async () => {
    const before = await bookingCount()

    const res = await POST(
      buildBookingRequest({
        packageSlug: paidPackageSlug,
        startAt: nextUncoveredSunday(),
        email: `jane-norule-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeTruthy()

    const after = await bookingCount()
    expect(after).toBe(before)
  })
})
