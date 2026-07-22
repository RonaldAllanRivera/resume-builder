import type { Metadata } from 'next'
import { getCanonicalURL } from './getURL'

const SITE_NAME = 'Ronald Allan Rivera'

const DEFAULT_TITLE =
  'Ronald Allan Rivera | Full-Stack Developer, AI Automation, Laravel, WordPress, React'

const DEFAULT_DESCRIPTION =
  'Senior full-stack developer with 20+ years building Python automation, Laravel and Django backends, WordPress plugins, and React/Next.js frontends for SaaS platforms and startups.'

/**
 * These defaults previously carried Payload's starter-template branding
 * ("Payload Website Template", "An open-source website built with Payload and
 * Next.js") and shipped that way to production — so every LinkedIn, Slack, or
 * X share of the site advertised Payload instead of Allan.
 *
 * The image URL resolves through getCanonicalURL() so it can't drift onto the
 * non-www host, which redirects — and some scrapers drop redirecting images
 * rather than following them.
 */
const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  siteName: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  url: getCanonicalURL(),
  locale: 'en_US',
  images: [
    {
      url: `${getCanonicalURL()}/og-default.png`,
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} — Senior Full-Stack Developer`,
    },
  ],
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
