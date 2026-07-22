import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

/**
 * The canonical public origin, normalized: protocol + host, never a trailing
 * slash. Every SEO surface (sitemap, robots, canonical tags, JSON-LD) resolves
 * through this so the host can't drift between them again.
 *
 * The www-vs-non-www split that broke indexing came from three places
 * disagreeing: vercel.json said www, the Vercel dashboard env var said non-www,
 * and getServerSideURL read the dashboard var. The dashboard wins at runtime,
 * so that is the one that has to say www — no code change substitutes for it.
 */
export const getCanonicalURL = (): string => {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  return raw.replace(/\/+$/, '')
}

/** Join a path onto the canonical origin. `canonicalPath('/')` returns the bare origin. */
export const canonicalPath = (path: string): string => {
  const origin = getCanonicalURL()
  if (!path || path === '/') return origin
  return `${origin}/${path.replace(/^\/+/, '')}`
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
