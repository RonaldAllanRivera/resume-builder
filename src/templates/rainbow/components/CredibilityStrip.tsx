import React from 'react'
import { getLighthouseScore } from '@/utilities/getLighthouseScore'

const GITHUB_URL = 'https://github.com/RonaldAllanRivera/resume-builder'
const MIN_DISPLAY_SCORE = 90

const itemClass =
  'transition hover:text-white focus-visible:text-white focus-visible:outline-none'
const externalLinkProps = { target: '_blank' as const, rel: 'noopener noreferrer' }

/**
 * Credibility strip on the homepage: live Lighthouse Performance score
 * (mobile and desktop in parallel; CSS picks the right one for the viewport),
 * plus TypeScript and Open source items.
 *
 * - Async Server Component: fetches `getLighthouseScore()` server-side once
 *   per render, with that utility cached 24h via Next.js fetch ISR.
 * - Lighthouse badge hides if score is below {@link MIN_DISPLAY_SCORE} or
 *   the API call failed — graceful: never shows a poor number.
 * - Each badge links to the live PageSpeed report for the same form factor
 *   so visitors can verify the score.
 */
export async function CredibilityStrip() {
  const { mobile, desktop } = await getLighthouseScore()

  const showMobile = !!mobile && mobile.score >= MIN_DISPLAY_SCORE
  const showDesktop = !!desktop && desktop.score >= MIN_DISPLAY_SCORE

  return (
    <section
      aria-label="Site credibility"
      className="border-y border-white/10 bg-black/20 py-3 text-center text-xs uppercase tracking-[0.2em] text-white/60"
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {/* Mobile-viewport Lighthouse badge */}
        {showMobile && mobile && (
          <li className="md:hidden">
            <a href={mobile.reportUrl} {...externalLinkProps} className={itemClass}>
              Lighthouse {mobile.score} ↗
            </a>
          </li>
        )}

        {/* Desktop-viewport Lighthouse badge */}
        {showDesktop && desktop && (
          <li className="hidden md:block">
            <a href={desktop.reportUrl} {...externalLinkProps} className={itemClass}>
              Lighthouse {desktop.score} ↗
            </a>
          </li>
        )}

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
