import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('BookingSettings global', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('persists payment instructions and the enabled flag', async () => {
    await payload.updateGlobal({
      slug: 'bookingSettings',
      data: {
        bookingEnabled: true,
        paymentInstructions: 'BPI 1234-5678-90\nGCash 0917-000-0000',
        paymentTermsSummary: 'Payment by invoice after acceptance.',
      },
    })

    const settings = await payload.findGlobal({ slug: 'bookingSettings' })

    expect(settings.bookingEnabled).toBe(true)
    expect(settings.paymentInstructions).toContain('GCash')
    expect(settings.paymentTermsSummary).toBe('Payment by invoice after acceptance.')
  })

  it('denies an unauthenticated read (payment instructions must not be public)', async () => {
    await payload.updateGlobal({
      slug: 'bookingSettings',
      data: {
        paymentInstructions: 'BPI 1234-5678-90\nGCash 0917-000-0000',
      },
    })

    await expect(
      payload.findGlobal({ slug: 'bookingSettings', overrideAccess: false }),
    ).rejects.toThrow(/not allowed to perform this action/i)
  })
})
