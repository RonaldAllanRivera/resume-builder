import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { canonicalPath } from '@/utilities/getURL'

/**
 * Regenerate hourly as a safety net. The Posts/Pages revalidate hooks call
 * revalidatePath('/sitemap.xml') for an immediate refresh on publish; this
 * bounds the staleness if a hook is ever bypassed (e.g. a direct DB write or
 * a seed script running with disableRevalidate).
 */
export const revalidate = 3600

/**
 * Static routes always present.
 *
 * /projects and /project/* are deliberately absent for contract compliance —
 * they stay reachable to visitors but are hidden from crawlers. See the
 * matching disallow list in src/app/robots.ts. Do not "fix" this.
 */
const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/certifications', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/posts', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: canonicalPath(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const seen = new Set(entries.map((e) => e.url))

  try {
    const payload = await getPayload({ config: configPromise })

    // overrideAccess: false so unpublished drafts can never leak into the
    // sitemap. Each entry carries the document's real updatedAt — the previous
    // implementation stamped every URL with a request-time `new Date()`, which
    // tells crawlers the entire site changed on every fetch, and they learn to
    // discount the signal entirely.
    const [posts, pages] = await Promise.all([
      payload.find({
        collection: 'posts',
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'pages',
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
      }),
    ])

    for (const post of posts.docs) {
      if (!post.slug) continue
      const url = canonicalPath(`/posts/${post.slug}`)
      if (seen.has(url)) continue
      seen.add(url)
      entries.push({
        url,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    for (const page of pages.docs) {
      // 'home' renders at / and is already covered by STATIC_ROUTES.
      if (!page.slug || page.slug === 'home') continue
      const url = canonicalPath(`/${page.slug}`)
      if (seen.has(url)) continue
      seen.add(url)
      entries.push({
        url,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (err) {
    // A DB blip must not take the whole sitemap down — serving the static
    // routes beats returning a 500 to Googlebot.
    console.error('[sitemap] failed to load CMS routes, serving static only:', err)
  }

  return entries
}
