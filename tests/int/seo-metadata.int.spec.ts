import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Regression guard. Payload's starter-template branding shipped to production
 * unnoticed: live HTML served og:title "Payload Website Template" and
 * twitter:creator @payloadcms, so every social share of the site credited
 * Payload rather than Allan. Assert it can't come back.
 */
describe('production metadata carries no Payload template branding', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
  })

  it('mergeOpenGraph defaults mention neither Payload nor the template OG image', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = JSON.stringify(mergeOpenGraph())

    expect(og).not.toMatch(/payload/i)
    expect(og).not.toMatch(/website-template-OG/i)
  })

  it('mergeOpenGraph defaults use the canonical www host', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = JSON.stringify(mergeOpenGraph())

    expect(og).toMatch(/https:\/\/www\.allanai\.dev/)
    expect(og).not.toMatch(/"https:\/\/allanai\.dev/)
  })

  it('caller-supplied values still override the defaults', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = mergeOpenGraph({ title: 'Custom Title' })

    expect(og?.title).toBe('Custom Title')
  })

  it('caller-supplied images win over the default OG image', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = mergeOpenGraph({ images: [{ url: 'https://www.allanai.dev/custom.png' }] })

    expect(JSON.stringify(og)).toMatch(/custom\.png/)
  })
})
