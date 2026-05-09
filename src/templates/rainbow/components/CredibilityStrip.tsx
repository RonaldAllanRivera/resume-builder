import React from 'react'
import {
  getLighthouseScore,
  type LighthouseStrategyResult,
} from '@/utilities/getLighthouseScore'

const GITHUB_URL = 'https://github.com/RonaldAllanRivera/resume-builder'
const MIN_DISPLAY_SCORE = 90

const itemClass =
  'transition hover:text-white focus-visible:text-white focus-visible:outline-none'
const externalLinkProps = { target: '_blank' as const, rel: 'noopener noreferrer' }

interface BadgeProps {
  data: LighthouseStrategyResult
  className: string
}

/**
 * One Lighthouse badge, scoped to a viewport via `className` (e.g. "md:hidden"
 * for mobile, "hidden md:block" for desktop).
 *
 * - score ≥ {@link MIN_DISPLAY_SCORE} → "Lighthouse 92 ↗" (real number, links to live report)
 * - score below threshold OR API failed → "Lighthouse Report ↗" (no number, link still works)
 *   We never show low numbers, but we never hide the verification link either.
 */
function LighthouseBadge({ data, className }: BadgeProps) {
  const showNumber = typeof data.score === 'number' && data.score >= MIN_DISPLAY_SCORE
  return (
    <li className={className}>
      <a href={data.reportUrl} {...externalLinkProps} className={itemClass}>
        {showNumber ? `Lighthouse ${data.score} ↗` : 'Lighthouse Report ↗'}
      </a>
    </li>
  )
}

/**
 * Credibility strip on the homepage: live Lighthouse Performance score
 * (mobile and desktop in parallel; CSS picks the right one for the viewport),
 * plus TypeScript and Open source items.
 *
 * Async Server Component — fetches `getLighthouseScore()` server-side once
 * per render with that utility cached 24h via Next.js fetch ISR. SSR'd
 * directly into the homepage HTML; no client bundle impact.
 */
export async function CredibilityStrip() {
  const { mobile, desktop } = await getLighthouseScore()

  return (
    <section
      aria-label="Site credibility"
      className="border-y border-white/10 bg-black/20 py-3 text-center text-xs uppercase tracking-[0.2em] text-white/60"
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {mobile && <LighthouseBadge data={mobile} className="md:hidden" />}
        {desktop && <LighthouseBadge data={desktop} className="hidden md:block" />}

        <li>
          <span>TypeScript</span>
        </li>

        <li>
          <a href={GITHUB_URL} {...externalLinkProps} className={itemClass}>
            Open source ↗
          </a>
        </li>
      </ul>
    </section>
  )
}
