'use client'

import React from 'react'
import type { ResumeProfile1 } from '@/payload-types'
import { CTAButtons } from './CTAButtons'
import './Hero.css'

interface HeroProps {
  profile?: ResumeProfile1 | null
}

export function Hero({ profile }: HeroProps) {
  return (
    <section className="space-hero relative overflow-hidden min-h-screen">
      {/* Hero overlay */}
      <div className="hero-overlay absolute inset-0" />

      {/* Main content */}
      <main className="relative z-10 flex min-h-[100vh] items-center justify-center px-4 pb-24 pt-28 text-center sm:px-6 sm:pt-32 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex flex-col items-center">
            {/* Subtitle badge - From Resume Profile Headline */}
            {profile?.headline && (
              <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur sm:text-sm">
                {profile.headline}
              </p>
            )}

            {/* Main heading - From Resume Profile Summary */}
            {profile?.summary && (
              <h1 className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl md:text-7xl xl:text-[6.4rem]">
                {profile.summary}
              </h1>
            )}

            {/* Description - From Resume Profile heroDescription field */}
            {profile?.heroDescription && (
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80 sm:text-[1.35rem]">
                {profile.heroDescription}
              </p>
            )}

            {/* CTA Buttons */}
            <CTAButtons className="justify-center" />

            {/* Tech stack tags */}
            <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/75">
                Laravel
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/75">
                Django
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/75">
                React
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/75">
                Next.js
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/75">
                WordPress
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/75">
                Automation
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Cockpit glow effect */}
      <div className="cockpit-glow" />
    </section>
  )
}
