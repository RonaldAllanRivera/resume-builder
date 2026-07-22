import { describe, it, expect, beforeEach, afterAll } from 'vitest'

const ORIGINAL_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
const ORIGINAL_VERCEL_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL

describe('getCanonicalURL', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = ORIGINAL_SERVER_URL
    process.env.VERCEL_PROJECT_PRODUCTION_URL = ORIGINAL_VERCEL_URL
  })

  it('returns the configured origin without a trailing slash', async () => {
    const { getCanonicalURL } = await import('@/utilities/getURL')
    expect(getCanonicalURL()).toBe('https://www.allanai.dev')
  })

  it('strips a trailing slash from the env var', async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev/'
    const { getCanonicalURL } = await import('@/utilities/getURL')
    expect(getCanonicalURL()).toBe('https://www.allanai.dev')
  })

  it('joins paths onto the canonical origin', async () => {
    const { canonicalPath } = await import('@/utilities/getURL')
    expect(canonicalPath('/services')).toBe('https://www.allanai.dev/services')
    expect(canonicalPath('services')).toBe('https://www.allanai.dev/services')
    expect(canonicalPath('/')).toBe('https://www.allanai.dev')
  })

  it('falls back to localhost when nothing is configured', async () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    const { getCanonicalURL } = await import('@/utilities/getURL')
    expect(getCanonicalURL()).toBe('http://localhost:3000')
  })
})
