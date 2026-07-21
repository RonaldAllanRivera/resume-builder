import { Resend } from 'resend'
import { getServerSideURL } from '@/utilities/getURL'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingEmailData {
  bookingId: number
  packageName: string
  startAt: string
  endAt: string
  amount: number
  currency: string
  paymentMode: string
  notes?: string | null
  timezone?: string
  /**
   * Unguessable per-booking token used to authorize the proof-upload link.
   * Only required for `sendPaymentInstructionsEmail` (the email that contains
   * the upload link) — never the sequential `bookingId`, which is enumerable.
   */
  proofToken?: string
  /**
   * Deposit amount in minor units (centavos/cents), and the percentage it
   * represents of the package price. Both null/undefined for consultations,
   * which take no deposit — `buildCustomerPaymentInstructionsHtml` must not
   * render a deadline line in that case.
   */
  depositAmount?: number | null
  depositPercent?: number | null
  /**
   * ISO datetime the deposit must clear by (startAt minus
   * BookingSettings.depositDueDaysBeforeStart). Null for consultations.
   */
  paymentDueAt?: string | null
}

export interface CustomerEmailData {
  name: string
  email: string
  company?: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResend(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
}

function getAdminEmail(override?: string): string {
  return (
    override?.trim() ||
    process.env.BOOKING_NOTIFICATION_EMAIL ||
    process.env.CONTACT_FORM_TO_EMAIL ||
    ''
  )
}

function getFromEmail(): string {
  const email = process.env.CONTACT_FORM_FROM_EMAIL || 'noreply@yourdomain.com'
  const name = process.env.CONTACT_FORM_FROM_NAME?.replace(/- Contact Form$/, '').trim() || 'Ronald Allan Rivera'
  return `${name} <${email}>`
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

function formatDatetime(iso: string, timezone?: string): string {
  const tz = timezone || process.env.BOOKING_TIMEZONE || 'UTC'
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function paymentModeLabel(mode: string): string {
  switch (mode) {
    case 'pay_upfront':
      return 'Pay Upfront'
    case 'deposit_final':
      return '50% Deposit + Final Payment'
    case 'pay_after_completion':
      return 'Pay After Completion'
    default:
      return mode
  }
}

// ---------------------------------------------------------------------------
// Shared HTML shell
// ---------------------------------------------------------------------------

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0e17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0e17;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header gradient bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#ec4899,#6366f1);height:4px;border-radius:4px 4px 0 0;"></td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#191a21;border-radius:0 0 12px 12px;padding:40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.6;">
              Ronald Allan Rivera &mdash; Senior Full-Stack Developer<br/>
              This is an automated message. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#fff;font-size:13px;vertical-align:top;">${value}</td>
  </tr>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Plain-text (from the BookingSettings textarea) → email-safe HTML with line breaks. */
function toEmailHtml(input: string): string {
  return escapeHtml(input.trim()).replace(/\r?\n/g, '<br />')
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function buildCustomerBookingRequestHtml(
  customer: CustomerEmailData,
  booking: BookingEmailData,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
      Booking Request Received
    </h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;">
      Hi ${escapeHtml(customer.name)}, your booking request has been submitted successfully.
      I&rsquo;ll review it and get back to you within <strong style="color:#fff;">24 hours</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', escapeHtml(booking.packageName))}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('End', formatDatetime(booking.endAt, booking.timezone))}
      ${detailRow('Amount', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Payment', paymentModeLabel(booking.paymentMode))}
      ${booking.notes ? detailRow('Notes', escapeHtml(booking.notes)) : ''}
      ${detailRow('Reference', `#${booking.bookingId}`)}
    </table>

    <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:13px;">
      <strong style="color:rgba(255,255,255,0.7);">What happens next?</strong><br/>
      Once I review your request I&rsquo;ll send you a confirmation email.
      ${booking.paymentMode === 'pay_after_completion' ? 'Payment is due after the work is completed.' : 'Payment instructions will be included in the confirmation.'}
    </p>
  `
  return emailShell('Booking Request Received', body)
}

function buildAdminBookingAlertHtml(
  customer: CustomerEmailData,
  booking: BookingEmailData,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
      New Booking Request
    </h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;">
      A new booking request has been submitted and is awaiting your review.
    </p>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Customer</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
      ${detailRow('Name', escapeHtml(customer.name))}
      ${detailRow('Email', escapeHtml(customer.email))}
      ${customer.company ? detailRow('Company', escapeHtml(customer.company)) : ''}
    </table>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Booking</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', escapeHtml(booking.packageName))}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('End', formatDatetime(booking.endAt, booking.timezone))}
      ${detailRow('Amount', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Payment', paymentModeLabel(booking.paymentMode))}
      ${booking.notes ? detailRow('Notes', escapeHtml(booking.notes)) : ''}
      ${detailRow('Booking ID', `#${booking.bookingId}`)}
    </table>

    <a href="${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin/collections/bookings/${booking.bookingId}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:9999px;font-size:14px;">
      Review in Admin &rarr;
    </a>
  `
  return emailShell('New Booking Request', body)
}

function buildCustomerPaymentConfirmedHtml(
  customer: CustomerEmailData,
  booking: BookingEmailData,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
      Payment Confirmed
    </h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;">
      Hi ${escapeHtml(customer.name)}, your payment has been received and your booking is confirmed.
      Looking forward to working with you!
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', escapeHtml(booking.packageName))}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('End', formatDatetime(booking.endAt, booking.timezone))}
      ${detailRow('Amount Paid', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Reference', `#${booking.bookingId}`)}
      ${detailRow('Status', '<span style="color:#4ade80;font-weight:700;">Paid ✓</span>')}
    </table>

    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;">
      Please keep this email as your payment receipt.
      I&rsquo;ll reach out with any additional details before the scheduled start time.
    </p>
  `
  return emailShell('Payment Confirmed', body)
}

function buildAdminPaymentReceivedHtml(
  customer: CustomerEmailData,
  booking: BookingEmailData,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
      Payment Received
    </h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;">
      You marked this booking as paid.
    </p>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Customer</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
      ${detailRow('Name', escapeHtml(customer.name))}
      ${detailRow('Email', escapeHtml(customer.email))}
      ${customer.company ? detailRow('Company', escapeHtml(customer.company)) : ''}
    </table>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Payment</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', escapeHtml(booking.packageName))}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('End', formatDatetime(booking.endAt, booking.timezone))}
      ${detailRow('Amount', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Booking ID', `#${booking.bookingId}`)}
      ${detailRow('Status', '<span style="color:#4ade80;font-weight:700;">Paid ✓</span>')}
    </table>

    <a href="${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin/collections/bookings/${booking.bookingId}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:9999px;font-size:14px;">
      View Booking in Admin &rarr;
    </a>
  `
  return emailShell('Payment Received', body)
}

/**
 * "Your 50% deposit (₱500.00) must clear by Friday, 8 August 2026." — or
 * empty string when there is no deposit/deadline to state (consultations,
 * which take no payment to book). Deliberately requires BOTH depositAmount
 * and paymentDueAt so a partially-populated booking never renders a
 * half-sentence or an "Invalid Date".
 */
function buildDeadlineLine(booking: BookingEmailData): string {
  if (booking.depositAmount == null || !booking.paymentDueAt) return ''

  const percent = booking.depositPercent ?? 50
  const depositFormatted = formatCurrency(booking.depositAmount, booking.currency)
  const deadlineFormatted = formatDatetime(booking.paymentDueAt, booking.timezone)

  return `<p style="margin:0 0 24px;color:#fff;font-size:14px;line-height:1.7;">
    Your ${percent}% deposit (<strong>${depositFormatted}</strong>) must clear by
    <strong>${deadlineFormatted}</strong>.
  </p>`
}

function buildCustomerPaymentInstructionsHtml(
  customer: CustomerEmailData,
  booking: BookingEmailData,
  paymentInstructions: string,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
      Payment Instructions
    </h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;">
      Hi ${escapeHtml(customer.name)}, your booking is accepted. Here is how to settle payment.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', escapeHtml(booking.packageName))}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('Amount Due', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Reference', `#${booking.bookingId}`)}
    </table>

    ${buildDeadlineLine(booking)}

    <div style="background:#0d0e17;border-radius:8px;padding:24px;margin-bottom:32px;">
      <p style="margin:0 0 12px;color:rgba(255,255,255,0.5);font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">
        How to pay
      </p>
      <p style="margin:0;color:#fff;font-size:14px;line-height:1.8;">
        ${toEmailHtml(paymentInstructions)}
      </p>
    </div>

    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;">
      Please quote reference <strong style="color:#fff;">#${booking.bookingId}</strong> with your
      payment. I&rsquo;ll confirm by email as soon as it arrives.
    </p>

    <a href="${getServerSideURL()}/book/proof/${booking.proofToken}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:9999px;font-size:14px;">
      Once you&rsquo;ve paid, upload your receipt here &rarr;
    </a>
  `

  return emailShell(`Payment Instructions – ${booking.packageName}`, body)
}

function buildAdminProofSubmittedHtml(
  customer: CustomerEmailData,
  booking: BookingEmailData,
  opts: ProofSubmittedOptions,
): string {
  const claimedAmount =
    opts.extractedAmountMinor != null
      ? formatCurrency(opts.extractedAmountMinor, booking.currency)
      : 'Not detected'
  const claimedReference = opts.extractedReference
    ? escapeHtml(opts.extractedReference)
    : 'Not detected'

  const body = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
      Payment Proof Submitted
    </h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;">
      The client uploaded a payment screenshot for booking
      <strong style="color:#fff;">#${booking.bookingId}</strong>. A screenshot is a
      <strong style="color:#fff;">claim</strong>, not proof &mdash; it can be edited or
      reused. Check the amounts below against your own bank or GCash records before
      marking this booking paid.
    </p>

    ${
      !opts.amountMatches
        ? `<div style="background:#3a1a1a;border:1px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;color:#fca5a5;font-size:14px;font-weight:700;">
        Mismatch: the claimed amount does not match the amount due for this booking.
      </p>
    </div>`
        : ''
    }

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Customer</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
      ${detailRow('Name', escapeHtml(customer.name))}
      ${detailRow('Email', escapeHtml(customer.email))}
      ${customer.company ? detailRow('Company', escapeHtml(customer.company)) : ''}
    </table>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Client&rsquo;s Claim (not yet checked)</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', escapeHtml(booking.packageName))}
      ${detailRow('Amount Due', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Amount Claimed', claimedAmount)}
      ${detailRow('Reference Claimed', claimedReference)}
      ${detailRow('Booking ID', `#${booking.bookingId}`)}
    </table>

    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;">
      Log into your bank or GCash app and match the amount and reference above to an
      actual incoming transfer. Only mark this booking as paid once you have checked it
      yourself.
    </p>

    <a href="${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin/collections/bookings/${booking.bookingId}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:9999px;font-size:14px;">
      Review in Admin &rarr;
    </a>
  `
  return emailShell('Payment Proof Submitted', body)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send acknowledgement to customer + new booking alert to admin.
 * Called after a booking is created in `pending_review` status.
 * Fire-and-forget — never throws so it cannot block the API response.
 */
export async function sendBookingRequestEmails(
  customer: CustomerEmailData,
  booking: BookingEmailData,
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — booking request emails skipped')
    return
  }

  const fromEmail = getFromEmail()
  const adminEmail = getAdminEmail()

  const sends: Promise<unknown>[] = []

  // 1. Acknowledgement → customer
  sends.push(
    resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: `Booking Request Received – ${booking.packageName} (#${booking.bookingId})`,
      html: buildCustomerBookingRequestHtml(customer, booking),
    }),
  )

  // 2. Alert → admin (skip if admin email not configured)
  if (adminEmail) {
    sends.push(
      resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `New Booking Request from ${customer.name} – ${booking.packageName}`,
        html: buildAdminBookingAlertHtml(customer, booking),
      }),
    )
  }

  const results = await Promise.allSettled(sends)
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`booking-email: send[${i}] failed:`, r.reason)
    }
  })
}

/**
 * Send payment confirmation to customer + payment receipt to admin.
 * Called by the Bookings afterChange hook when an admin marks the booking paid.
 * Fire-and-forget — never throws so it cannot block the webhook response.
 */
export async function sendPaymentConfirmedEmails(
  customer: CustomerEmailData,
  booking: BookingEmailData,
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — payment confirmation emails skipped')
    return
  }

  const fromEmail = getFromEmail()
  const adminEmail = getAdminEmail()

  const sends: Promise<unknown>[] = []

  // 1. Confirmation → customer
  sends.push(
    resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: `Payment Confirmed – ${booking.packageName} (#${booking.bookingId})`,
      html: buildCustomerPaymentConfirmedHtml(customer, booking),
    }),
  )

  // 2. Receipt → admin
  if (adminEmail) {
    sends.push(
      resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `Payment Received from ${customer.name} – ${booking.packageName}`,
        html: buildAdminPaymentReceivedHtml(customer, booking),
      }),
    )
  }

  const results = await Promise.allSettled(sends)
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`booking-email: send[${i}] failed:`, r.reason)
    }
  })
}

export interface PaymentInstructionsOptions {
  /** Plain text from BookingSettings.paymentInstructions. */
  paymentInstructions: string
  /** Overrides BOOKING_NOTIFICATION_EMAIL. Currently unused — customer-only email. */
  adminEmail?: string
}

/**
 * Email the client how to pay.
 * Called by the Bookings afterChange hook on entry to `pending_payment`.
 * Fire-and-forget — never throws, so a mail failure cannot roll back the status change.
 */
export async function sendPaymentInstructionsEmail(
  customer: CustomerEmailData,
  booking: BookingEmailData,
  opts: PaymentInstructionsOptions,
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — payment instructions email skipped')
    return
  }

  if (!opts.paymentInstructions?.trim()) {
    console.warn(
      `booking-email: BookingSettings.paymentInstructions is empty — no instructions sent for booking #${booking.bookingId}`,
    )
    return
  }

  if (!booking.proofToken) {
    console.warn(
      `booking-email: booking #${booking.bookingId} has no proofToken — refusing to send a broken proof-upload link`,
    )
    return
  }

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: customer.email,
      subject: `Payment Instructions – ${booking.packageName} (#${booking.bookingId})`,
      html: buildCustomerPaymentInstructionsHtml(customer, booking, opts.paymentInstructions),
    })
  } catch (err) {
    console.error('booking-email: sendPaymentInstructionsEmail failed:', err)
  }
}

export interface ProofSubmittedOptions {
  /** Overrides BOOKING_NOTIFICATION_EMAIL. */
  adminEmail?: string
  /** Amount (minor units) extracted from the client-uploaded screenshot, or null if not detected. */
  extractedAmountMinor: number | null
  /** Reference/transaction number extracted from the screenshot, or null if not detected. */
  extractedReference: string | null
  /** Whether the extracted amount matches the amount due for this booking. */
  amountMatches: boolean
}

/**
 * Notify the admin that the client submitted payment proof.
 * ADMIN ONLY — the client receives nothing here, because a client-uploaded
 * screenshot is a claim, not proof: screenshots are trivially forged. The
 * admin must check the claimed amount/reference against their own bank or
 * GCash records before marking the booking paid.
 * Fire-and-forget — never throws, so a mail failure cannot block the upload.
 */
export async function sendProofSubmittedAdminEmail(
  customer: CustomerEmailData,
  booking: BookingEmailData,
  opts: ProofSubmittedOptions,
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — proof submitted admin email skipped')
    return
  }

  const adminEmail = getAdminEmail(opts.adminEmail)
  if (!adminEmail) {
    console.warn(
      `booking-email: no admin email configured — proof submitted notification skipped for booking #${booking.bookingId}`,
    )
    return
  }

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: adminEmail,
      subject: `Payment Proof Submitted by ${customer.name} – ${booking.packageName} (#${booking.bookingId})`,
      html: buildAdminProofSubmittedHtml(customer, booking, opts),
    })
  } catch (err) {
    console.error('booking-email: sendProofSubmittedAdminEmail failed:', err)
  }
}
