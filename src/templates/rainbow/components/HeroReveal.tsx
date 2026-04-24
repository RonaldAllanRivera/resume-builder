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
 * Reusable on-load animation component for hero sections.
 *
 * How FOUC is prevented:
 *   - `initial="hidden"` is unconditional — Framer Motion applies the hidden
 *     variant styles (opacity: 0) to the SSR HTML on first paint. No JS needed.
 *   - `animate` is controlled by `mounted` state only, never by a key change.
 *   - No key change = no unmount/remount = no visible-then-hidden flash.
 *   - Mobile: snaps to visible instantly (transition: 0) after hydration.
 *   - Desktop: animates normally after hydration.
 */
export function HeroReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  staggerChildren = 0,
}: HeroRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isDesktop, setIsDesktop] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const shouldAnimate = mounted && !prefersReducedMotion && isDesktop

  // Variants always defined — Framer Motion reads `hidden` during SSR to set
  // inline styles (opacity: 0) before any JS runs.
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
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
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }

  return (
    <motion.div
      className={`${className} will-animate`}
      variants={containerVariants}
      // Object form — Framer Motion writes this as an inline style on the SSR
      // HTML before any JS runs, so the element is hidden on first paint.
      initial={{ opacity: 0 }}
      animate={mounted ? 'visible' : { opacity: 0 }}
      transition={mounted && !shouldAnimate ? { duration: 0 } : undefined}
    >
      {staggerChildren > 0 && shouldAnimate
        ? React.Children.map(children, (child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
}
