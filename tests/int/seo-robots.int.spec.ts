import { describe, it, expect, beforeAll } from 'vitest'
import type { MetadataRoute } from 'next'

let result: MetadataRoute.Robots

const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']
const MUST_DISALLOW = ['/admin/', '/api/', '/projects', '/project/']

describe('robots.txt', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
    const mod = await import('@/app/robots')
    result = mod.default()
  })

  const rules = () => (Array.isArray(result.rules) ? result.rules : [result.rules])

  it('points at the sitemap on the canonical www host', () => {
    expect(result.sitemap).toBe('https://www.allanai.dev/sitemap.xml')
  })

  it('allows the general crawler', () => {
    const wildcard = rules().find((r) => r.userAgent === '*')
    expect(wildcard).toBeDefined()
    expect(wildcard!.allow).toBe('/')
  })

  it.each(AI_CRAWLERS)('explicitly allows %s', (agent) => {
    const rule = rules().find((r) => r.userAgent === agent)
    expect(rule, `no rule for ${agent}`).toBeDefined()
    expect(rule!.allow).toBe('/')
  })

  it('disallows admin, api and the contract-blocked project routes for every agent', () => {
    for (const rule of rules()) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
      for (const path of MUST_DISALLOW) {
        expect(disallow, `${String(rule.userAgent)} must disallow ${path}`).toContain(path)
      }
    }
  })

  it('never advertises the non-www host', () => {
    expect(JSON.stringify(result)).not.toMatch(/https:\/\/allanai\.dev/)
  })
})
