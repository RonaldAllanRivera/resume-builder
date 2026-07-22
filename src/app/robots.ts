import type { MetadataRoute } from 'next'
import { getCanonicalURL } from '@/utilities/getURL'

/**
 * Lives at the app root, NOT inside the (frontend) route group.
 *
 * Production /robots.txt returned a Next.js 404 page — carrying a noindex
 * meta tag — while this file sat in src/app/(frontend)/. The cause was never
 * proven: sitemap.ts served correctly from the identical route group, which
 * rules out "metadata files don't work in route groups". So this sits at the
 * documented root location and is verified against a real production build
 * rather than assumed to work.
 */

// Blocked for every agent. /projects is a contract-compliance restriction,
// not an SEO judgement call — do not "optimize" it away.
const DISALLOW = ['/admin/', '/api/', '/projects', '/project/']

// Explicitly allowed. public/llms.txt already invites LLM crawlers, so the
// stance is stated rather than left to default-allow. They inherit DISALLOW,
// which keeps the /projects restriction intact for them too.
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalURL()

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
