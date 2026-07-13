import { describe, it, expect, vi, beforeEach } from 'vitest'

const parseMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse: parseMock }
  },
}))

const PNG = Buffer.from('fake-png-bytes')

describe('extractReceipt', () => {
  beforeEach(() => {
    parseMock.mockReset()
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
  })

  it('returns the structured extraction from the model', async () => {
    parseMock.mockResolvedValue({
      parsed_output: {
        isReceipt: true,
        amountMinor: 500000,
        currency: 'PHP',
        referenceNumber: '1234567890',
        senderName: 'Jane Dev',
        paidAt: '2026-08-01T10:15:00+08:00',
        channel: 'GCash',
      },
    })

    const { extractReceipt } = await import('@/lib/receipt-ocr')
    const result = await extractReceipt(PNG, 'image/png')

    expect(result.isReceipt).toBe(true)
    expect(result.amountMinor).toBe(500000)
    expect(result.channel).toBe('GCash')

    // It must send the image to the model as a base64 image block
    const sentParams = parseMock.mock.calls[0][0]
    expect(sentParams.model).toBe('claude-opus-4-8')
    const imageBlock = sentParams.messages[0].content.find((b: { type: string }) => b.type === 'image')
    expect(imageBlock.source.media_type).toBe('image/png')
    expect(imageBlock.source.data).toBe(PNG.toString('base64'))
  })

  it('degrades safely to an empty extraction when the model call throws', async () => {
    parseMock.mockRejectedValue(new Error('api down'))

    const { extractReceipt } = await import('@/lib/receipt-ocr')
    const result = await extractReceipt(PNG, 'image/png')

    // A failed extraction must NOT look like a verified receipt
    expect(result.isReceipt).toBe(false)
    expect(result.amountMinor).toBeNull()
  })

  it('degrades safely when the image is not a receipt', async () => {
    parseMock.mockResolvedValue({
      parsed_output: {
        isReceipt: false,
        amountMinor: null,
        currency: null,
        referenceNumber: null,
        senderName: null,
        paidAt: null,
        channel: null,
      },
    })

    const { extractReceipt } = await import('@/lib/receipt-ocr')
    const result = await extractReceipt(PNG, 'image/png')

    expect(result.isReceipt).toBe(false)
    expect(result.amountMinor).toBeNull()
  })
})
