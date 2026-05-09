/**
 * Resolves the Lighthouse Performance state for the homepage CredibilityStrip.
 *
 * - The audit URL is `LIGHTHOUSE_AUDIT_URL` (override) or `NEXT_PUBLIC_SERVER_URL`.
 *   If neither is set or the resolved URL is not publicly reachable (localhost,
 *   127.0.0.1, vercel.app preview), this returns `{ mobile: null, desktop: null }`
 *   and the badges hide entirely.
 * - For a public URL, both `mobile` and `desktop` strategies are fetched in
 *   parallel from Google's PageSpeed Insights v5 API. Each fetch is cached
 *   for 24h via Next.js fetch ISR; an 8s `AbortController` timeout prevents
 *   a slow API from blocking the homepage on cache miss.
 * - The `reportUrl` for each strategy is always constructed (from the audit
 *   URL + form factor) — even when the score fetch fails, so the
 *   CredibilityStrip can still render a "Lighthouse Report ↗" link that
 *   sends visitors to a fresh PageSpeed analysis. `score` is `null` on
 *   API failure or 429 rate-limit; the consumer decides how to render.
 *
 * Env vars:
 * - `NEXT_PUBLIC_SERVER_URL` — the canonical site URL (default audit target).
 * - `LIGHTHOUSE_AUDIT_URL`   — optional override; useful in local dev to point
 *                              at the production domain so the badge renders.
 * - `PAGESPEED_API_KEY`      — strongly recommended in production. The public
 *                              quota gets 429-throttled on bursts.
 */

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const PAGESPEED_REPORT_BASE = 'https://pagespeed.web.dev/analysis'
const FETCH_TIMEOUT_MS = 8000
const REVALIDATE_SECONDS = 60 * 60 * 24 // 24 hours

export type LighthouseStrategy = 'mobile' | 'desktop'

export interface LighthouseStrategyResult {
  /** Public PageSpeed report link for this URL + strategy. Always present when the audit URL is public. */
  reportUrl: string
  /** Performance score 0–100. `null` if the API call failed or returned no score. */
  score: number | null
}

export interface LighthouseScores {
  mobile: LighthouseStrategyResult | null
  desktop: LighthouseStrategyResult | null
}

function resolveAuditUrl(): string | null {
  const candidate = process.env.LIGHTHOUSE_AUDIT_URL || process.env.NEXT_PUBLIC_SERVER_URL
  if (!candidate) return null
  if (
    candidate.includes('localhost') ||
    candidate.includes('127.0.0.1') ||
    candidate.includes('vercel.app')
  ) {
    return null
  }
  return candidate
}

function buildReportUrl(targetUrl: string, strategy: LighthouseStrategy): string {
  const params = new URLSearchParams({ url: targetUrl, form_factor: strategy })
  return `${PAGESPEED_REPORT_BASE}?${params.toString()}`
}

async function fetchScore(
  targetUrl: string,
  strategy: LighthouseStrategy,
): Promise<number | null> {
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

    return Math.round(rawScore * 100)
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getLighthouseScore(): Promise<LighthouseScores> {
  const targetUrl = resolveAuditUrl()
  if (!targetUrl) return { mobile: null, desktop: null }

  const [mobileScore, desktopScore] = await Promise.all([
    fetchScore(targetUrl, 'mobile'),
    fetchScore(targetUrl, 'desktop'),
  ])

  return {
    mobile: { reportUrl: buildReportUrl(targetUrl, 'mobile'), score: mobileScore },
    desktop: { reportUrl: buildReportUrl(targetUrl, 'desktop'), score: desktopScore },
  }
}
