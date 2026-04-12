'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface HeroRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  staggerChildren?: number
}

/**
 * Reusable on-load animation component for Hero section
 * - Desktop only (≥768px)
 * - Respects prefers-reduced-motion
 * - Staggered entrance animations
 * - Optimized for 99 Lighthouse score
 */
export function HeroReveal({
  children,
  className = '',
  delay = 0, // Delay before animation starts (in seconds)
  duration = 0.8, // Animation duration (0.8s for hero)
  staggerChildren = 0, // Delay between each child animation (0 = no stagger)
}: HeroRevealProps) {
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

  // Animation variants - Hero entrance style
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerChildren,
        delayChildren: delay,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1] as const, // Apple-style easing
      },
    },
  }

  return (
    <>
      {/* CSS to hide content until mounted (prevents flash on desktop) */}
      {!mounted && (
        <style jsx global>{`
          @media (min-width: 768px) {
            .hero-reveal-content {
              opacity: 0;
            }
          }
        `}</style>
      )}

      <motion.div
        key={shouldAnimate ? 'animated' : 'static'}
        className={`${className} hero-reveal-content`}
        variants={shouldAnimate ? containerVariants : undefined}
        initial={shouldAnimate ? 'hidden' : undefined}
        animate={shouldAnimate ? 'visible' : undefined}
      >
        {staggerChildren > 0 && shouldAnimate
          ? React.Children.map(children, (child, index) => (
              <motion.div key={index} variants={itemVariants}>
                {child}
              </motion.div>
            ))
          : children}
      </motion.div>
    </>
  )
}
