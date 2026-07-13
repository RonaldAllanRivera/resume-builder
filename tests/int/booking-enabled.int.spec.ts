import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bookings/route'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

let payload: Payload

function buildBookingRequest(email: string) {
  return new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageSlug: 'does-not-matter',
      startAt: '2026-08-01T02:00:00.000Z',
      endAt: '2026-08-01T03:00:00.000Z',
      customer: { name: 'Jane', email, timezone: 'Asia/Manila' },
    }),
  })
}

describe('bookingEnabled kill switch', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    // Never leave this global in a state that poisons later suites.
    await payload.updateGlobal({ slug: 'bookingSettings', data: { bookingEnabled: true } })
  })

  it('rejects submissions with 503 when bookings are disabled, and creates no booking row', async () => {
    await payload.updateGlobal({ slug: 'bookingSettings', data: { bookingEnabled: false } })

    const { totalDocs: before } = await payload.find({ collection: 'bookings', limit: 0 })

    const res = await POST(buildBookingRequest(`jane-disabled-${Date.now()}@example.com`))

    expect(res.status).toBe(503)

    const { totalDocs: after } = await payload.find({ collection: 'bookings', limit: 0 })
    expect(after).toBe(before)
  })

  it('does not 503 when bookings are enabled (guard does not misfire)', async () => {
    await payload.updateGlobal({ slug: 'bookingSettings', data: { bookingEnabled: true } })

    const res = await POST(buildBookingRequest(`jane-enabled-${Date.now()}@example.com`))

    // The referenced package doesn't exist, so this request still fails —
    // just not with the 503 kill-switch response.
    expect(res.status).not.toBe(503)
  })
})
