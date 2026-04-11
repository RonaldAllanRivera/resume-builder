'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { ResumeProfile1 } from '@/payload-types'
import { CTAButtons } from './CTAButtons'
import { SearchBar } from './search/SearchBar'
import { AnimatedText } from './AnimatedText'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './Hero.css'

interface HeroProps {
  profile?: ResumeProfile1 | null
}

export function Hero({ profile }: HeroProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isDesktop, setIsDesktop] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Detect desktop devices for animation enablement
  React.useEffect(() => {
    setMounted(true)
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Enable animations only on desktop and when user doesn't prefer reduced motion
  const shouldAnimate = mounted && !prefersReducedMotion && isDesktop

  // Animation variants - Baunfire-inspired professional timing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as const, // Apple-style easing
      },
    },
  }

  const searchBarVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }

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
      <motion.main
        key={shouldAnimate ? 'animated' : 'static'}
        className="relative z-10 flex min-h-[100vh] items-center justify-center px-4 pb-24 pt-30 text-center sm:px-6 sm:pt-22 lg:px-10"
        variants={shouldAnimate ? containerVariants : undefined}
        initial={shouldAnimate ? 'hidden' : undefined}
        animate={shouldAnimate ? 'visible' : undefined}
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex flex-col items-center">
            {/* Subtitle badge - From Resume Profile Headline */}
            {profile?.headline && (
              <motion.p
                className="mb-5 inline-flex rounded-full border border-white/10 bg-[#191a21]/90 px-4 py-2 text-xs font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur sm:text-sm"
                variants={shouldAnimate ? itemVariants : undefined}
              >
                {profile.headline}
              </motion.p>
            )}

            {/* Main heading - From Resume Profile Summary with word-by-word animation */}
            {profile?.summary && (
              <motion.div variants={shouldAnimate ? itemVariants : undefined} className="mb-6">
                <AnimatedText
                  text={profile.summary}
                  className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl md:text-7xl xl:text-[6.4rem]"
                  stagger={0.05}
                  duration={0.6}
                  delay={0.3}
                  as="h1"
                  disabled={!shouldAnimate}
                />
              </motion.div>
            )}

            {/* Description - From Resume Profile heroDescription field */}
            {profile?.heroDescription && (
              <motion.p
                className="mt-6 max-w-3xl text-lg leading-8 text-white/80 sm:text-[1.35rem]"
                variants={shouldAnimate ? itemVariants : undefined}
              >
                {profile.heroDescription}
              </motion.p>
            )}

            {/* CTA Buttons */}
            <motion.div variants={shouldAnimate ? itemVariants : undefined}>
              <CTAButtons className="justify-center" />
            </motion.div>

            {/* Search Bar - Interactive search with popular tags */}
            <motion.div
              className="mt-10 flex justify-center"
              variants={shouldAnimate ? searchBarVariants : undefined}
            >
              <SearchBar placeholder="Search React, Next.js, Laravel, WordPress, AI automation..." />
            </motion.div>
          </div>
        </div>
      </motion.main>

      {/* Cockpit glow effect */}
      <div className="cockpit-glow" />
    </section>
  )
}
