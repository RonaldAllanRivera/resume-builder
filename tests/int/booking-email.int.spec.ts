import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn().mockResolvedValue({ id: 'email_test' })

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

const customer = { name: 'Jane Dev', email: 'jane@example.com', company: null }
const booking = {
  bookingId: 42,
  packageName: 'Website Audit',
  startAt: '2026-08-01T02:00:00.000Z',
  endAt: '2026-08-01T03:00:00.000Z',
  amount: 500000,
  currency: 'PHP',
  paymentMode: 'pay_upfront',
  timezone: 'Asia/Manila',
  // Unguessable per-booking token — the proof-upload link must be keyed off
  // this, never off the sequential bookingId (that's the IDOR this token
  // exists to close).
  proofToken: 'test-proof-token-abc123',
}

describe('sendPaymentInstructionsEmail', () => {
  beforeEach(() => {
    sendMock.mockClear()
    process.env.RESEND_API_KEY = 'test-key'
  })

  it('emails the client the configured payment instructions', async () => {
    const { sendPaymentInstructionsEmail } = await import('@/lib/booking-email')

    await sendPaymentInstructionsEmail(customer, booking, {
      paymentInstructions: 'BPI 1234-5678-90\nGCash 0917-000-0000',
    })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const sent = sendMock.mock.calls[0][0]
    expect(sent.to).toBe('jane@example.com')
    expect(sent.subject).toContain('#42')
    expect(sent.html).toContain('GCash 0917-000-0000')
    // Newlines must render as line breaks, not collapse into one run of text
    expect(sent.html).toContain('<br />')
    // Upload link must point at the proof page keyed by the unguessable
    // token — NOT the sequential bookingId, which is enumerable (IDOR).
    expect(sent.html).toContain('/book/proof/test-proof-token-abc123')
    expect(sent.html).not.toContain('/book/proof/42')
  })

  it('sends nothing when the booking has no proofToken (refuses to send a broken/insecure link)', async () => {
    const { sendPaymentInstructionsEmail } = await import('@/lib/booking-email')

    await sendPaymentInstructionsEmail(
      customer,
      { ...booking, proofToken: undefined },
      { paymentInstructions: 'GCash 0917-000-0000' },
    )

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends nothing when no instructions are configured', async () => {
    const { sendPaymentInstructionsEmail } = await import('@/lib/booking-email')

    await sendPaymentInstructionsEmail(customer, booking, { paymentInstructions: '   ' })

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('escapes HTML in the instructions', async () => {
    const { sendPaymentInstructionsEmail } = await import('@/lib/booking-email')

    await sendPaymentInstructionsEmail(customer, booking, {
      paymentInstructions: '<script>alert(1)</script>',
    })

    const sent = sendMock.mock.calls[0][0]
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).toContain('&lt;script&gt;')
  })
})

describe('sendProofSubmittedAdminEmail', () => {
  beforeEach(() => {
    sendMock.mockClear()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.BOOKING_NOTIFICATION_EMAIL = 'admin@example.com'
  })

  it('addresses the admin, not the customer', async () => {
    const { sendProofSubmittedAdminEmail } = await import('@/lib/booking-email')

    await sendProofSubmittedAdminEmail(customer, booking, {
      extractedAmountMinor: 500000,
      extractedReference: 'REF123',
      amountMatches: true,
    })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const sent = sendMock.mock.calls[0][0]
    expect(sent.to).toBe('admin@example.com')
    expect(sent.to).not.toBe(customer.email)
  })

  it('includes a mismatch warning when amounts do not match', async () => {
    const { sendProofSubmittedAdminEmail } = await import('@/lib/booking-email')

    await sendProofSubmittedAdminEmail(customer, booking, {
      extractedAmountMinor: 100000,
      extractedReference: 'REF123',
      amountMatches: false,
    })

    const sent = sendMock.mock.calls[0][0]
    expect(sent.html.toLowerCase()).toContain('mismatch')
    expect(sent.html).not.toContain('confirmed')
    expect(sent.html).not.toContain('verified')
  })
})

describe('sendBookingRequestEmails (older templates — customer/admin escaping)', () => {
  beforeEach(() => {
    sendMock.mockClear()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.BOOKING_NOTIFICATION_EMAIL = 'admin@example.com'
  })

  it('escapes a malicious customer name in both the customer ack and admin alert HTML', async () => {
    const { sendBookingRequestEmails } = await import('@/lib/booking-email')

    const maliciousCustomer = {
      name: '<script>alert(1)</script>',
      email: 'attacker@example.com',
      company: '<img src=x onerror=alert(2)>',
    }

    await sendBookingRequestEmails(maliciousCustomer, booking)

    expect(sendMock).toHaveBeenCalledTimes(2)
    const [customerSend, adminSend] = sendMock.mock.calls.map((call) => call[0])

    // Customer acknowledgement (buildCustomerBookingRequestHtml)
    expect(customerSend.html).not.toContain('<script>alert(1)</script>')
    expect(customerSend.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')

    // Admin alert (buildAdminBookingAlertHtml) — name AND company
    expect(adminSend.html).not.toContain('<script>alert(1)</script>')
    expect(adminSend.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(adminSend.html).not.toContain('<img src=x onerror=alert(2)>')
    expect(adminSend.html).toContain('&lt;img src=x onerror=alert(2)&gt;')
  })

  it('escapes untrusted booking notes in the admin alert HTML', async () => {
    const { sendBookingRequestEmails } = await import('@/lib/booking-email')

    await sendBookingRequestEmails(customer, {
      ...booking,
      notes: '<script>document.location="https://evil.example"</script>',
    })

    const adminSend = sendMock.mock.calls[1][0]
    expect(adminSend.html).not.toContain('<script>document.location')
    expect(adminSend.html).toContain('&lt;script&gt;document.location')
  })
})
