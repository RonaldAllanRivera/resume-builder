import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { extractReceipt, type ReceiptMediaType } from '@/lib/receipt-ocr'

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set<ReceiptMediaType>([
  'image/png',
  'image/jpeg',
  'image/webp',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// Awaiting payment: freshly invoiced, or a re-upload of a corrected screenshot
// after a first submission that turned out to be wrong/unreadable. Any other
// status means this booking isn't in a state where proof makes sense.
const AWAITING_PAYMENT_STATUSES = new Set(['pending_payment', 'payment_submitted'])

/**
 * POST /api/bookings/proof
 *
 * UNAUTHENTICATED — the client submitting proof has no account on this site.
 * Every input here (mime type, size, bookingId, file bytes) is hostile until
 * validated.
 *
 * Stores the uploaded screenshot, runs Claude-vision extraction on it for the
 * admin's convenience, and moves the booking to `payment_submitted`.
 *
 * ⚠️ SECURITY (read twice): this route must NEVER set a booking's status to
 * `paid`, under any circumstances, including a perfect amount match. A
 * payment screenshot is trivially forged — fake GCash/bank receipt generators
 * are a commodity scam tool. `extractReceipt` reports what the image CLAIMS;
 * it is not verification. Ground truth is the admin looking at their own bank
 * account. `payment_submitted` means "client claims they paid, unverified".
 * Only a human sets `paid`, from the admin panel.
 *
 * Body: multipart/form-data { bookingId: string, file: File }
 */
export async function POST(request: NextRequest) {
  try {
    // Best-effort early rejection of oversized uploads before we buffer the
    // body — Content-Length is client-supplied and not authoritative, so the
    // size is re-checked against the parsed file below regardless.
    const contentLength = request.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds the 10 MB limit.' }, { status: 413 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
    }

    const bookingIdRaw = formData.get('bookingId')
    const file = formData.get('file')

    if (typeof bookingIdRaw !== 'string' || !bookingIdRaw.trim()) {
      return NextResponse.json({ error: 'Missing bookingId.' }, { status: 400 })
    }

    const bookingId = Number(bookingIdRaw)
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Invalid bookingId.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file.' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PNG, JPEG, and WebP are accepted.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds the 10 MB limit.' }, { status: 413 })
    }

    const payload = await getPayload({ config })

    const booking = await payload
      .findByID({ collection: 'bookings', id: bookingId, depth: 0 })
      .catch(() => null)

    // Unauthenticated caller — do not leak whether the id merely doesn't
    // exist vs. anything else about the booking.
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    if (!AWAITING_PAYMENT_STATUSES.has(booking.status)) {
      return NextResponse.json(
        { error: 'This booking is not currently awaiting payment.' },
        { status: 409 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mediaType = file.type as ReceiptMediaType

    const proofDoc = await payload.create({
      collection: 'paymentProofs',
      data: {},
      file: {
        name: file.name || `proof-${Date.now()}`,
        data: buffer,
        mimetype: file.type,
        size: buffer.length,
      },
    })

    // What the image CLAIMS — not verification. See the file-level warning.
    const extracted = await extractReceipt(buffer, mediaType)

    const proofAmountMatches = extracted.amountMinor === booking.amount

    // SECURITY: `status` here is always 'payment_submitted' — never derive it
    // from `extracted` or `proofAmountMatches`. Do not add a code path that
    // sets 'paid' from this endpoint.
    await payload.update({
      collection: 'bookings',
      id: bookingId,
      data: {
        paymentProof: proofDoc.id,
        proofExtracted: {
          isReceipt: extracted.isReceipt,
          amountMinor: extracted.amountMinor,
          currency: extracted.currency,
          referenceNumber: extracted.referenceNumber,
          senderName: extracted.senderName,
          paidAt: extracted.paidAt,
          channel: extracted.channel,
        },
        proofAmountMatches,
        status: 'payment_submitted',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Your payment proof has been submitted and is under review.',
      },
      { status: 202 },
    )
  } catch (error) {
    console.error('Error processing payment proof:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
