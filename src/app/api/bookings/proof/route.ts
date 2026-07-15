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

// Multipart encoding adds a small amount of overhead on top of the raw file
// bytes (boundary markers, per-part headers, the bookingId field). This is
// slack for the streaming bound below, NOT a relaxation of the 10 MB limit —
// the authoritative check remains `file.size > MAX_FILE_SIZE` further down.
const MULTIPART_OVERHEAD_ALLOWANCE = 64 * 1024 // 64 KB

// Awaiting payment: freshly invoiced, or a re-upload of a corrected screenshot
// after a first submission that turned out to be wrong/unreadable. Any other
// status means this booking isn't in a state where proof makes sense.
const AWAITING_PAYMENT_STATUSES = new Set(['pending_payment', 'payment_submitted'])

// Rate limiting store (in-memory). Every accepted upload triggers a BILLED
// Claude vision call (see extractReceipt below), and this route is
// unauthenticated, so it's a direct cost-amplification target. Same
// in-memory-Map-per-IP shape as src/app/api/search/route.ts and
// src/app/(frontend)/api/contact/route.ts.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 5 // Max proof uploads per window
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (record && now > record.resetTime) {
    rateLimitStore.delete(ip)
  }

  const current = rateLimitStore.get(ip)

  if (!current) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }

  current.count++
  return true
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown'
}

/**
 * Wrap a ReadableStream so it errors out the moment more than `limit` bytes
 * have passed through it, instead of only checking the size after the whole
 * body has been buffered.
 *
 * Why this is needed: `request.formData()` fully buffers the body into
 * memory before we can inspect anything. The `Content-Length` pre-check
 * above is a fast-fail for the common case, but it is client-supplied and
 * therefore spoofable — an attacker can send a small (or absent, e.g. via
 * chunked transfer-encoding) `Content-Length` while streaming an arbitrarily
 * large body, forcing us to buffer it all before the authoritative
 * `file.size` check ever runs. Bounding the stream itself closes that gap:
 * the parser aborts as soon as the byte count crosses the limit, so memory
 * use is capped regardless of what the headers claim.
 */
function boundedStream(stream: ReadableStream<Uint8Array>, limit: number): ReadableStream<Uint8Array> {
  let received = 0
  const reader = stream.getReader()

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      received += value.byteLength
      if (received > limit) {
        controller.error(new Error('PAYLOAD_TOO_LARGE'))
        await reader.cancel()
        return
      }
      controller.enqueue(value)
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}

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
    // Rate limiting — first, before any parsing. Every accepted upload below
    // triggers a billed Claude vision call; this route is unauthenticated,
    // so an unbounded caller is a direct cost-amplification attack.
    const ip = getClientIP(request)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    // Fast-fail on a spoofed/oversized Content-Length header before touching
    // the body at all. This is best-effort — the header is client-supplied,
    // absent for chunked transfer-encoding, and can understate the true
    // body size — so it must never be relied on alone. The bounded stream
    // below is the real guard against unbounded buffering, and the raw
    // `file.size` check further down is the authoritative 10 MB limit.
    const contentLength = request.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds the 10 MB limit.' }, { status: 413 })
    }

    let formData: FormData
    try {
      if (!request.body) {
        return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
      }
      // Cap how many bytes `formData()` is ever allowed to buffer, so a
      // spoofed Content-Length or chunked body with no length header at all
      // can't force this route to hold an arbitrarily large payload in
      // memory before the size check below gets a chance to run.
      const bounded = boundedStream(request.body, MAX_FILE_SIZE + MULTIPART_OVERHEAD_ALLOWANCE)
      const boundedRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: bounded,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' })
      formData = await boundedRequest.formData()
    } catch (err) {
      if (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE') {
        return NextResponse.json({ error: 'File exceeds the 10 MB limit.' }, { status: 413 })
      }
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
