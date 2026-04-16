'use client'

import React from 'react'
import type { ResumeProfile1 } from '@/payload-types'
import { CTAButtons } from './CTAButtons'
import { SearchBar } from './search/SearchBar'
import { AnimatedText } from './AnimatedText'
import { HeroReveal } from './HeroReveal'

interface HeroProps {
  profile?: ResumeProfile1 | null
}

export function Hero({ profile }: HeroProps) {
  return (
    <section className="space-hero relative overflow-hidden min-h-screen bg-transparent">
      {/* CSS overrides to hide hero gradients and show starfield */}
      <style jsx>{`
        .space-hero {
          background: transparent !important;
        }
        .space-hero::before {
          display: none !important;
        }
        .space-hero::after {
          display: none !important;
        }
      `}</style>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[100vh] items-center justify-center px-4 pb-24 pt-30 text-center sm:px-6 sm:pt-22 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <HeroReveal
            className="flex flex-col items-center"
            staggerChildren={0.15} // 0.15s delay between each element
            delay={0.2} // Wait 0.2s before starting animations
            duration={0.8} // 0.8s animation duration
          >
            {/* Subtitle badge - From Resume Profile Headline */}
            {profile?.headline && (
              <p className="mb-5 inline-flex rounded-full border border-white/10 bg-[#191a21]/90 px-4 py-2 text-xs font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur sm:text-sm">
                {profile.headline}
              </p>
            )}

            {/* Main heading - From Resume Profile Summary with word-by-word animation */}
            {profile?.summary && (
              <div className="mb-6">
                <AnimatedText
                  text={profile.summary}
                  className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl md:text-7xl xl:text-[6.4rem]"
                  stagger={0.05} // 0.05s delay between each word
                  duration={0.6} // 0.6s per word animation
                  delay={0.3} // Wait 0.3s before word animation starts
                  as="h1"
                />
              </div>
            )}

            {/* Description - From Resume Profile heroDescription field */}
            {profile?.heroDescription && (
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80 sm:text-[1.35rem]">
                {profile.heroDescription}
              </p>
            )}

            {/* CTA Buttons */}
            <div>
              <CTAButtons className="justify-center" />
            </div>

            {/* Search Bar - Interactive search with popular tags */}
            <div className="mt-10 flex justify-center">
              <SearchBar placeholder="Search React, Next.js, Laravel, WordPress, AI automation..." />
            </div>
          </HeroReveal>
        </div>
      </main>

      {/* Cockpit glow effect */}
      <div className="cockpit-glow" />
    </section>
  )
}
