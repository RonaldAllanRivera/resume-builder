import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bookings/route'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

/**
 * Covers the payment-policy fix in `POST /api/bookings`: `paymentMode` /
 * `depositAmount` derivation was inverted — consultations were marked
 * `pay_upfront` and paid delivery work `pay_after_completion`, the opposite
 * of how the business runs. Also covers `paymentDueAt`, the stored deadline
 * that gives the admin a guaranteed window to verify the deposit landed in
 * their own bank/GCash before the session starts.
 *
 * Fixtures are `Date.now()`-suffixed (package slugs are `unique: true`) so
 * this suite re-runs cleanly against a dirty DB. The availability rule here
 * covers every day of the week with a 1-day advance notice so date math for
 * lead-time enforcement (covered separately in booking-lead-time.int.spec.ts)
 * never interferes with these assertions.
 */

let payload: Payload
let ruleId: number
const packageIds: number[] = []
const createdBookingIds: number[] = []

const DEPOSIT_PERCENT = 50
const DEPOSIT_DUE_DAYS = 3

/** A future date `daysOut` days from now, at a distinct time so repeat runs never collide. */
function futureBookableDate(daysOut: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysOut)
  const t = Date.now() + daysOut
  d.setHours(9 + (t % 8), t % 60, 0, 0)
  return d
}

async function createPackage(
  durationType: 'call' | 'day' | 'week' | 'month',
  price: number,
) {
  const pkg = await payload.create({
    collection: 'packages',
    data: {
      name: `Payment Policy Test (${durationType})`,
      slug: `payment-policy-${durationType}-${Date.now()}`,
      shortDescription: `Test package for ${durationType} payment policy.`,
      price,
      currency: 'PHP',
      durationType,
      durationMinutes: durationType === 'call' ? 30 : undefined,
      active: true,
    },
  })
  packageIds.push(pkg.id as number)
  return pkg
}

function buildBookingRequest(opts: { packageSlug: string; startAt: Date; email: string }) {
  const endAt = new Date(opts.startAt.getTime() + 60 * 60 * 1000)
  return new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageSlug: opts.packageSlug,
      startAt: opts.startAt.toISOString(),
      endAt: endAt.toISOString(),
      customer: { name: 'Jane Payment Policy', email: opts.email, timezone: 'Asia/Manila' },
    }),
  })
}

describe('POST /api/bookings payment policy + deposit deadline', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    await payload.updateGlobal({
      slug: 'bookingSettings',
      data: {
        bookingEnabled: true,
        depositPercent: DEPOSIT_PERCENT,
        depositDueDaysBeforeStart: DEPOSIT_DUE_DAYS,
      },
    })

    const rule = await payload.create({
      collection: 'availabilityRules',
      data: {
        name: `Payment Policy Test Rule ${Date.now()}`,
        timezone: 'Asia/Manila',
        daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'],
        startTime: '09:00',
        endTime: '22:00',
        slotDurationMinutes: 30,
        bufferMinutes: 15,
        advanceNoticeDays: 1,
        maxAdvanceDays: 90,
        confirmationWindowHours: 24,
        maxBookingsPerDay: 50,
        active: true,
      },
    })
    ruleId = rule.id as number
  })

  afterAll(async () => {
    for (const id of createdBookingIds) {
      await payload.delete({ collection: 'bookings', id }).catch(() => {})
    }
    for (const id of packageIds) {
      await payload.delete({ collection: 'packages', id }).catch(() => {})
    }
    await payload.delete({ collection: 'availabilityRules', id: ruleId }).catch(() => {})
  })

  it('a consultation (call) is pay_after_completion with no deposit and no payment deadline', async () => {
    const pkg = await createPackage('call', 250000)

    const res = await POST(
      buildBookingRequest({
        packageSlug: pkg.slug,
        startAt: futureBookableDate(3),
        email: `jane-call-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()
    expect(res.status).toBe(201)
    createdBookingIds.push(body.bookingId)

    const booking = await payload.findByID({ collection: 'bookings', id: body.bookingId })
    expect(booking.paymentMode).toBe('pay_after_completion')
    expect(booking.depositAmount ?? null).toBeNull()
    expect(booking.paymentDueAt ?? null).toBeNull()
  })

  it('a day-rate package is deposit_final at 50% of price, due 3 days before start', async () => {
    const pkg = await createPackage('day', 2000000)
    const startAt = futureBookableDate(10)

    const res = await POST(
      buildBookingRequest({
        packageSlug: pkg.slug,
        startAt,
        email: `jane-day-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()
    expect(res.status).toBe(201)
    createdBookingIds.push(body.bookingId)

    const booking = await payload.findByID({ collection: 'bookings', id: body.bookingId })
    expect(booking.paymentMode).toBe('deposit_final')
    expect(booking.depositAmount).toBe(1000000) // 50% of 2,000,000

    const expectedDue = new Date(startAt)
    expectedDue.setDate(expectedDue.getDate() - DEPOSIT_DUE_DAYS)
    expect(booking.paymentDueAt).toBeTruthy()
    expect(new Date(booking.paymentDueAt as string).toISOString()).toBe(expectedDue.toISOString())
  })

  it('a week-rate package is deposit_final at 50% of price', async () => {
    const pkg = await createPackage('week', 5000000)
    const startAt = futureBookableDate(11)

    const res = await POST(
      buildBookingRequest({
        packageSlug: pkg.slug,
        startAt,
        email: `jane-week-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()
    expect(res.status).toBe(201)
    createdBookingIds.push(body.bookingId)

    const booking = await payload.findByID({ collection: 'bookings', id: body.bookingId })
    expect(booking.paymentMode).toBe('deposit_final')
    expect(booking.depositAmount).toBe(2500000) // 50% of 5,000,000

    const expectedDue = new Date(startAt)
    expectedDue.setDate(expectedDue.getDate() - DEPOSIT_DUE_DAYS)
    expect(new Date(booking.paymentDueAt as string).toISOString()).toBe(expectedDue.toISOString())
  })

  it('a month-rate package is deposit_final at 50% of price', async () => {
    const pkg = await createPackage('month', 20000000)
    const startAt = futureBookableDate(12)

    const res = await POST(
      buildBookingRequest({
        packageSlug: pkg.slug,
        startAt,
        email: `jane-month-${Date.now()}@example.com`,
      }),
    )
    const body = await res.json()
    expect(res.status).toBe(201)
    createdBookingIds.push(body.bookingId)

    const booking = await payload.findByID({ collection: 'bookings', id: body.bookingId })
    expect(booking.paymentMode).toBe('deposit_final')
    expect(booking.depositAmount).toBe(10000000) // 50% of 20,000,000

    const expectedDue = new Date(startAt)
    expectedDue.setDate(expectedDue.getDate() - DEPOSIT_DUE_DAYS)
    expect(new Date(booking.paymentDueAt as string).toISOString()).toBe(expectedDue.toISOString())
  })
})
