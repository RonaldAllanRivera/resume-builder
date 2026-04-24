import { Resend } from 'resend'

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

function getAdminEmail(): string {
  return (
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
      Hi ${customer.name}, your booking request has been submitted successfully.
      I&rsquo;ll review it and get back to you within <strong style="color:#fff;">24 hours</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', booking.packageName)}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('End', formatDatetime(booking.endAt, booking.timezone))}
      ${detailRow('Amount', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Payment', paymentModeLabel(booking.paymentMode))}
      ${booking.notes ? detailRow('Notes', booking.notes) : ''}
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
      ${detailRow('Name', customer.name)}
      ${detailRow('Email', customer.email)}
      ${customer.company ? detailRow('Company', customer.company) : ''}
    </table>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Booking</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', booking.packageName)}
      ${detailRow('Start', formatDatetime(booking.startAt, booking.timezone))}
      ${detailRow('End', formatDatetime(booking.endAt, booking.timezone))}
      ${detailRow('Amount', formatCurrency(booking.amount, booking.currency))}
      ${detailRow('Payment', paymentModeLabel(booking.paymentMode))}
      ${booking.notes ? detailRow('Notes', booking.notes) : ''}
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
      Hi ${customer.name}, your payment has been received and your booking is confirmed.
      Looking forward to working with you!
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', booking.packageName)}
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
      A booking payment has been confirmed via Stripe.
    </p>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Customer</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
      ${detailRow('Name', customer.name)}
      ${detailRow('Email', customer.email)}
      ${customer.company ? detailRow('Company', customer.company) : ''}
    </table>

    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.4);">Payment</h3>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:32px;">
      ${detailRow('Package', booking.packageName)}
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
 * Called after `checkout.session.completed` Stripe webhook marks booking as paid.
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
