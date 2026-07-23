import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('structured data', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
  })

  it('Person schema uses the canonical www host and lists competencies', async () => {
    const { generatePersonSchema } = await import('@/utilities/jsonLd')

    const schema = generatePersonSchema(
      { fullName: 'Ronald Allan Rivera', headline: 'Senior Full-Stack Developer' } as never,
      { siteName: 'Ronald Allan Rivera', socialLinks: [] } as never,
    )

    expect(schema.url).toBe('https://www.allanai.dev')
    expect(Array.isArray(schema.knowsAbout)).toBe(true)
    expect(schema.knowsAbout as string[]).toContain('Laravel')
  })

  it('WebSite schema uses the canonical www host', async () => {
    const { generateWebSiteSchema } = await import('@/utilities/jsonLd')
    const schema = generateWebSiteSchema({ siteName: 'x', defaultMetaDescription: 'y' } as never)

    expect(schema.url).toBe('https://www.allanai.dev')
  })

  it('certification schema marks entries as credentials', async () => {
    const { generateCertificationSchema } = await import('@/utilities/jsonLd')
    const schema = generateCertificationSchema({
      title: 'TypeScript Essential Training',
      issuer: 'LinkedIn Learning',
    } as never)

    expect(schema['@type']).toBe('EducationalOccupationalCredential')
    expect(schema.recognizedBy).toMatchObject({ name: 'LinkedIn Learning' })
  })
})

describe('llms.txt', () => {
  const llms = readFileSync(join(process.cwd(), 'public/llms.txt'), 'utf8')

  it('uses the canonical www host throughout', () => {
    expect(llms).not.toMatch(/https:\/\/allanai\.dev/)
    expect(llms).toMatch(/https:\/\/www\.allanai\.dev/)
  })

  it('does not point LLMs at crawler-blocked or redirecting paths', () => {
    // /projects is Disallow-ed in robots.txt for contract compliance, and
    // /experience now 308-redirects to /#experience. Listing either here was a
    // contradictory signal.
    expect(llms).not.toMatch(/allanai\.dev\/projects/)
    expect(llms).not.toMatch(/allanai\.dev\/experience/)
  })
})
