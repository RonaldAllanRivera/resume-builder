import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { MetadataRoute } from 'next'

let payload: Payload
let entries: MetadataRoute.Sitemap

const PUBLISHED_SLUG = 'seo-sitemap-published-fixture'
const DRAFT_SLUG = 'seo-sitemap-draft-fixture'

// Posts.content is required, so an empty root fails validation — it needs a
// real paragraph node.
const lexicalBody = {
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: 'Sitemap fixture body.',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      },
    ],
  },
}

describe('sitemap.xml', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
    payload = await getPayload({ config: await config })

    // Sweep leftovers so a rerun against the shared test DB is deterministic.
    for (const slug of [PUBLISHED_SLUG, DRAFT_SLUG]) {
      await payload.delete({
        collection: 'posts',
        where: { slug: { equals: slug } },
        context: { disableRevalidate: true },
      })
    }

    await payload.create({
      collection: 'posts',
      draft: false,
      // Revalidation hooks call revalidatePath, which needs a Next.js request
      // context that doesn't exist under Vitest.
      context: { disableRevalidate: true },
      data: {
        title: 'Sitemap Published Fixture',
        slug: PUBLISHED_SLUG,
        _status: 'published',
        content: lexicalBody,
      } as never,
    })

    await payload.create({
      collection: 'posts',
      draft: true,
      context: { disableRevalidate: true },
      data: {
        title: 'Sitemap Draft Fixture',
        slug: DRAFT_SLUG,
        _status: 'draft',
        content: lexicalBody,
      } as never,
    })

    const mod = await import('@/app/sitemap')
    entries = await mod.default()
  })

  afterAll(async () => {
    for (const slug of [PUBLISHED_SLUG, DRAFT_SLUG]) {
      await payload.delete({
        collection: 'posts',
        where: { slug: { equals: slug } },
        context: { disableRevalidate: true },
      })
    }
  })

  const urls = () => entries.map((e) => e.url)

  it('emits only canonical www URLs', () => {
    for (const url of urls()) {
      expect(url.startsWith('https://www.allanai.dev'), `bad host: ${url}`).toBe(true)
    }
  })

  it('includes the core static routes', () => {
    expect(urls()).toEqual(
      expect.arrayContaining([
        'https://www.allanai.dev',
        'https://www.allanai.dev/services',
        'https://www.allanai.dev/certifications',
        'https://www.allanai.dev/contact',
        'https://www.allanai.dev/posts',
      ]),
    )
  })

  it('includes published posts', () => {
    expect(urls()).toContain(`https://www.allanai.dev/posts/${PUBLISHED_SLUG}`)
  })

  it('excludes draft posts', () => {
    expect(urls()).not.toContain(`https://www.allanai.dev/posts/${DRAFT_SLUG}`)
  })

  it('excludes the contract-blocked project routes', () => {
    for (const url of urls()) {
      expect(url, `project route leaked: ${url}`).not.toMatch(/\/projects?(\/|$)/)
    }
  })

  it('carries a lastModified on every entry', () => {
    for (const entry of entries) {
      expect(entry.lastModified, `missing lastModified for ${entry.url}`).toBeDefined()
    }
  })

  it('uses the document updatedAt for posts, not a request-time now', async () => {
    const post = await payload.find({
      collection: 'posts',
      where: { slug: { equals: PUBLISHED_SLUG } },
      limit: 1,
    })

    const entry = entries.find((e) => e.url.endsWith(`/posts/${PUBLISHED_SLUG}`))
    expect(entry).toBeDefined()

    const expected = new Date(post.docs[0]!.updatedAt).getTime()
    const actual = new Date(entry!.lastModified as Date).getTime()
    expect(actual).toBe(expected)
  })

  it('emits no duplicate URLs', () => {
    const all = urls()
    expect(new Set(all).size).toBe(all.length)
  })
})
