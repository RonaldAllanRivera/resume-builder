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
