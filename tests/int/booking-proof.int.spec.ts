// This suite exercises a multipart/form-data upload through NextRequest,
// which expects Node's own (undici) FormData/File. jsdom (the project's
// default test environment) provides its own, incompatible implementations
// that cause NextRequest#formData() to hang indefinitely. Force the node
// environment for just this file.
// @vitest-environment node

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { Booking } from '@/payload-types'
import { NextRequest } from 'next/server'

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// The route must NEVER make a real model call — mock the extraction module.
const extractReceiptMock = vi.fn()
vi.mock('@/lib/receipt-ocr', () => ({
  extractReceipt: (...args: unknown[]) => extractReceiptMock(...args),
}))

// The transition to `payment_submitted` fires the admin-email hook. Mock the
// transport so the test never touches the network.
const sendMock = vi.fn().mockResolvedValue({ id: 'email_test' })
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

// Imported after the mocks above so the route picks up the mocked modules.
const { POST } = await import('@/app/api/bookings/proof/route')

let payload: Payload
let packageId: number
let customerId: number
const customerEmail = `proof-jane-${Date.now()}@example.com`
const BOOKING_AMOUNT = 500000 // PHP 5,000.00 in centavos

// Payload's upload handling sniffs the actual file content, not just the
// declared Content-Type — a real (if minimal) 1x1 PNG is needed for the
// `paymentProofs` collection to accept the file.
const VALID_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

const PERFECT_MATCH_EXTRACTION = {
  isReceipt: true,
  amountMinor: BOOKING_AMOUNT,
  currency: 'PHP',
  referenceNumber: 'REF-PERFECT-123',
  senderName: 'Jane Dev',
  paidAt: '2026-08-01T10:15:00+08:00',
  channel: 'GCash',
}

const MISMATCH_EXTRACTION = {
  ...PERFECT_MATCH_EXTRACTION,
  amountMinor: BOOKING_AMOUNT - 50000,
  referenceNumber: 'REF-MISMATCH-456',
}

async function createBooking(status: Booking['status']): Promise<number> {
  const booking = await payload.create({
    collection: 'bookings',
    data: {
      customer: customerId,
      package: packageId,
      status,
      startAt: '2026-08-01T02:00:00.000Z',
      endAt: '2026-08-01T03:00:00.000Z',
      timezoneAtBooking: 'Asia/Manila',
      amount: BOOKING_AMOUNT,
      currency: 'PHP',
    },
  })
  return booking.id as number
}

function buildProofRequest(opts: {
  bookingId?: string | number
  mimetype?: string
  bytes?: Buffer
  filename?: string
  includeFile?: boolean
  includeBookingId?: boolean
} = {}) {
  const {
    bookingId,
    mimetype = 'image/png',
    bytes = VALID_PNG_BYTES,
    filename = 'proof.png',
    includeFile = true,
    includeBookingId = true,
  } = opts

  const formData = new FormData()
  if (includeBookingId) {
    formData.set('bookingId', String(bookingId))
  }
  if (includeFile) {
    formData.set('file', new File([bytes], filename, { type: mimetype }))
  }

  return new NextRequest('http://localhost/api/bookings/proof', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/bookings/proof', () => {
  beforeAll(async () => {
    process.env.RESEND_API_KEY = 'test-key'
    payload = await getPayload({ config: await config })

    await payload.updateGlobal({
      slug: 'bookingSettings',
      data: {
        bookingEnabled: true,
        paymentInstructions: 'GCash 0917-000-0000',
        notificationEmail: `admin-proof-${Date.now()}@example.com`,
      },
    })

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name: 'Proof Test Package',
        slug: `proof-test-package-${Date.now()}`,
        shortDescription: 'A test package for payment-proof tests.',
        price: BOOKING_AMOUNT,
        currency: 'PHP',
        durationType: 'call',
        active: true,
      },
    })
    packageId = pkg.id as number

    const cust = await payload.create({
      collection: 'customers',
      data: { name: 'Jane Dev', email: customerEmail },
    })
    customerId = cust.id as number
  })

  beforeEach(() => {
    extractReceiptMock.mockReset()
    sendMock.mockClear()
  })

  it('creates a paymentProofs doc, links it, writes proofExtracted, and moves to payment_submitted', async () => {
    extractReceiptMock.mockResolvedValue(PERFECT_MATCH_EXTRACTION)
    const bookingId = await createBooking('pending_payment')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(202)

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.status).toBe('payment_submitted')
    expect(updated.paymentProof).toBeTruthy()
    expect(updated.proofExtracted?.referenceNumber).toBe('REF-PERFECT-123')
    expect(updated.proofExtracted?.channel).toBe('GCash')
    expect(updated.proofExtracted?.amountMinor).toBe(BOOKING_AMOUNT)

    const proofDocId =
      typeof updated.paymentProof === 'object' ? updated.paymentProof?.id : updated.paymentProof
    const proofDoc = await payload.findByID({ collection: 'paymentProofs', id: proofDocId! })
    expect(proofDoc).toBeTruthy()
    expect(proofDoc.mimeType).toBe('image/png')
  })

  it('sets proofAmountMatches true when the extracted amount equals the booking amount', async () => {
    extractReceiptMock.mockResolvedValue(PERFECT_MATCH_EXTRACTION)
    const bookingId = await createBooking('pending_payment')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(202)

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.proofAmountMatches).toBe(true)
  })

  it('sets proofAmountMatches false when the extracted amount differs from the booking amount', async () => {
    extractReceiptMock.mockResolvedValue(MISMATCH_EXTRACTION)
    const bookingId = await createBooking('pending_payment')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(202)

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.proofAmountMatches).toBe(false)
  })

  it('a mismatched amount still stores the proof and still moves to payment_submitted (no silent reject, no auto-approve)', async () => {
    extractReceiptMock.mockResolvedValue(MISMATCH_EXTRACTION)
    const bookingId = await createBooking('pending_payment')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(202)

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.status).toBe('payment_submitted')
    expect(updated.paymentProof).toBeTruthy()
    expect(updated.proofExtracted?.referenceNumber).toBe('REF-MISMATCH-456')
    expect(updated.proofAmountMatches).toBe(false)
  })

  it('NEVER sets status to paid, even on a perfect amount match — this is the load-bearing security assertion', async () => {
    extractReceiptMock.mockResolvedValue(PERFECT_MATCH_EXTRACTION)
    const bookingId = await createBooking('pending_payment')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(202)

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.status).not.toBe('paid')
    expect(updated.status).toBe('payment_submitted')

    // The response body itself must never claim the payment is confirmed/verified/received.
    const body = await res.json()
    const message = JSON.stringify(body).toLowerCase()
    expect(message).not.toContain('confirmed')
    expect(message).not.toContain('verified')
    expect(message).not.toContain('received')
    expect(message).toContain('review')
  })

  it('rejects a proof upload against a booking that is not awaiting payment', async () => {
    extractReceiptMock.mockResolvedValue(PERFECT_MATCH_EXTRACTION)
    const bookingId = await createBooking('pending_review')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(409)

    // No proof was linked, no extraction was run, no status change happened.
    expect(extractReceiptMock).not.toHaveBeenCalled()
    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.status).toBe('pending_review')
    expect(updated.paymentProof).toBeFalsy()
  })

  it('allows a re-upload against a booking already in payment_submitted (corrected screenshot)', async () => {
    extractReceiptMock.mockResolvedValue(PERFECT_MATCH_EXTRACTION)
    const bookingId = await createBooking('payment_submitted')

    const res = await POST(buildProofRequest({ bookingId }))
    expect(res.status).toBe(202)

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.status).toBe('payment_submitted')
  })

  it('rejects an unsupported mime type before touching extraction', async () => {
    const bookingId = await createBooking('pending_payment')

    const res = await POST(
      buildProofRequest({ bookingId, mimetype: 'application/pdf', filename: 'proof.pdf' }),
    )
    expect(res.status).toBe(400)
    expect(extractReceiptMock).not.toHaveBeenCalled()

    const updated = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    expect(updated.status).toBe('pending_payment')
  })

  it('rejects a file over the 10 MB cap', async () => {
    const bookingId = await createBooking('pending_payment')
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1, 1)

    const res = await POST(buildProofRequest({ bookingId, bytes: oversized }))
    expect(res.status).toBe(413)
    expect(extractReceiptMock).not.toHaveBeenCalled()
  })

  it('rejects a missing bookingId', async () => {
    const res = await POST(buildProofRequest({ includeBookingId: false }))
    expect(res.status).toBe(400)
    expect(extractReceiptMock).not.toHaveBeenCalled()
  })

  it('rejects a bookingId that does not exist, without leaking booking details', async () => {
    const res = await POST(buildProofRequest({ bookingId: 999999999 }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(JSON.stringify(body).toLowerCase()).not.toContain('customer')
  })
})
