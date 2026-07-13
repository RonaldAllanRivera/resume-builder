import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const sendMock = vi.fn().mockResolvedValue({ id: 'email_test' })

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

let payload: Payload
let packageId: number
let customerId: number

async function createBooking(): Promise<number> {
  const booking = await payload.create({
    collection: 'bookings',
    data: {
      customer: customerId,
      package: packageId,
      status: 'pending_review',
      startAt: '2026-08-01T02:00:00.000Z',
      endAt: '2026-08-01T03:00:00.000Z',
      timezoneAtBooking: 'Asia/Manila',
      amount: 500000,
      currency: 'PHP',
    },
  })
  return booking.id as number
}

describe('Bookings afterChange status emails', () => {
  beforeAll(async () => {
    process.env.RESEND_API_KEY = 'test-key'
    payload = await getPayload({ config: await config })

    await payload.updateGlobal({
      slug: 'bookingSettings',
      data: {
        bookingEnabled: true,
        paymentInstructions: 'BPI 1234-5678-90\nGCash 0917-000-0000',
      },
    })

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name: 'Test Audit',
        slug: `test-audit-${Date.now()}`,
        shortDescription: 'A test package for status email tests.',
        price: 500000,
        currency: 'PHP',
        durationType: 'call',
        active: true,
      },
    })
    packageId = pkg.id as number

    const cust = await payload.create({
      collection: 'customers',
      data: { name: 'Jane Dev', email: 'jane@example.com' },
    })
    customerId = cust.id as number
  })

  beforeEach(() => {
    sendMock.mockClear()
  })

  it('emails payment instructions on entry to pending_payment', async () => {
    const id = await createBooking()
    sendMock.mockClear() // ignore the creation-time request emails

    await payload.update({
      collection: 'bookings',
      id,
      data: { status: 'pending_payment' },
    })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const sent = sendMock.mock.calls[0][0]
    expect(sent.to).toBe('jane@example.com')
    expect(sent.subject).toContain('Payment Instructions')
    expect(sent.html).toContain('GCash 0917-000-0000')
  })

  it('emails a confirmation on entry to paid', async () => {
    const id = await createBooking()
    await payload.update({ collection: 'bookings', id, data: { status: 'pending_payment' } })
    sendMock.mockClear()

    await payload.update({ collection: 'bookings', id, data: { status: 'paid' } })

    const subjects = sendMock.mock.calls.map((c) => c[0].subject as string)
    expect(subjects.some((s) => s.includes('Payment Confirmed'))).toBe(true)
  })

  it('sends nothing when the status does not change', async () => {
    const id = await createBooking()
    await payload.update({ collection: 'bookings', id, data: { status: 'pending_payment' } })
    sendMock.mockClear()

    // Re-save with the same status — an admin editing notes must not re-invoice the client
    await payload.update({
      collection: 'bookings',
      id,
      data: { status: 'pending_payment', adminNotes: 'touched' },
    })

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends nothing for statuses with no email attached', async () => {
    const id = await createBooking()
    sendMock.mockClear()

    await payload.update({ collection: 'bookings', id, data: { status: 'accepted' } })

    expect(sendMock).not.toHaveBeenCalled()
  })
})
