/**
 * Fetches the live Lighthouse Performance score from Google's PageSpeed
 * Insights API for the configured site. Used by `CredibilityStrip` so the
 * homepage always shows an honest, current score instead of a hardcoded one.
 *
 * - Two strategies are fetched in parallel: `mobile` (harder) and `desktop`.
 * - Each fetch is cached for 24h via Next.js `revalidate` so we hit the API
 *   at most once per strategy per day, well under the 25k/day public quota.
 * - An 8-second `AbortController` timeout keeps a slow API from blocking
 *   the homepage on cache miss.
 * - Returns `null` for any strategy that fails or scores below the configured
 *   threshold so the badge can hide gracefully.
 *
 * Env vars:
 * - `NEXT_PUBLIC_SERVER_URL` — required. The site URL to audit.
 * - `PAGESPEED_API_KEY`     — optional. Lifts public rate limit if set.
 */

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const PAGESPEED_REPORT_BASE = 'https://pagespeed.web.dev/analysis'
const FETCH_TIMEOUT_MS = 8000
const REVALIDATE_SECONDS = 60 * 60 * 24 // 24 hours

export type LighthouseStrategy = 'mobile' | 'desktop'

export interface LighthouseScore {
  /** Performance score, 0–100. */
  score: number
  /** Public PageSpeed report link for the same URL + strategy. */
  reportUrl: string
}

export interface LighthouseScores {
  mobile: LighthouseScore | null
  desktop: LighthouseScore | null
}

function buildReportUrl(targetUrl: string, strategy: LighthouseStrategy): string {
  const params = new URLSearchParams({ url: targetUrl, form_factor: strategy })
  return `${PAGESPEED_REPORT_BASE}?${params.toString()}`
}

async function fetchOneStrategy(
  targetUrl: string,
  strategy: LighthouseStrategy,
): Promise<LighthouseScore | null> {
  const apiUrl = new URL(PAGESPEED_API)
  apiUrl.searchParams.set('url', targetUrl)
  apiUrl.searchParams.set('strategy', strategy)
  apiUrl.searchParams.append('category', 'performance')
  if (process.env.PAGESPEED_API_KEY) {
    apiUrl.searchParams.set('key', process.env.PAGESPEED_API_KEY)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(apiUrl.toString(), {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS, tags: [`lighthouse:${strategy}`] },
    })
    if (!res.ok) return null

    const data = (await res.json()) as {
      lighthouseResult?: { categories?: { performance?: { score?: number } } }
    }
    const rawScore = data?.lighthouseResult?.categories?.performance?.score
    if (typeof rawScore !== 'number') return null

    return {
      score: Math.round(rawScore * 100),
      reportUrl: buildReportUrl(targetUrl, strategy),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Returns the Lighthouse Performance scores for the configured site, fetched
 * in parallel for both mobile and desktop strategies. Returns `{ mobile: null,
 * desktop: null }` if no public site URL is configured (e.g. local dev or a
 * Vercel preview).
 */
export async function getLighthouseScore(): Promise<LighthouseScores> {
  const targetUrl = process.env.NEXT_PUBLIC_SERVER_URL

  if (
    !targetUrl ||
    targetUrl.includes('localhost') ||
    targetUrl.includes('127.0.0.1') ||
    targetUrl.includes('vercel.app')
  ) {
    return { mobile: null, desktop: null }
  }

  const [mobile, desktop] = await Promise.all([
    fetchOneStrategy(targetUrl, 'mobile'),
    fetchOneStrategy(targetUrl, 'desktop'),
  ])

  return { mobile, desktop }
}
