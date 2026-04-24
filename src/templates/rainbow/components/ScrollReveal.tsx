'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useScrollTrigger } from '../hooks/useScrollTrigger'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

type Direction = 'up' | 'left' | 'right'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  threshold?: number
  rootMargin?: string
  staggerChildren?: number
  /** Slide-in direction. Default: 'up' */
  direction?: Direction
}

function getHiddenState(direction: Direction) {
  if (direction === 'left') return { opacity: 0, x: '-100vw', y: 0 }
  if (direction === 'right') return { opacity: 0, x: '100vw', y: 0 }
  return { opacity: 0, x: 0, y: 60 }
}

/**
 * Reusable scroll-triggered animation component.
 *
 * How FOUC is prevented (same principle as HeroReveal):
 *   - `initial="hidden"` is unconditional — Framer Motion writes opacity: 0
 *     to the SSR HTML before any JS runs. No flash on first paint.
 *   - No `key` changes → no unmount/remount flash when scroll fires.
 *   - Mobile: snaps to visible after hydration (transition: 0).
 *   - Desktop: animates when element enters viewport via IntersectionObserver.
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.9,
  threshold = 0.5,
  rootMargin = '0px',
  staggerChildren = 0,
  direction = 'up',
}: ScrollRevealProps) {
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
  const { elementRef, isVisible } = useScrollTrigger({ threshold, rootMargin })

  const hidden = getHiddenState(direction)
  const visible = { opacity: 1, x: 0, y: 0 }

  const containerVariants = {
    hidden,
    visible: {
      ...visible,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
        staggerChildren,
        delayChildren: delay,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 60 },
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
      ref={elementRef}
      className={`${className} will-animate`}
      variants={containerVariants}
      // Object form — written as inline styles on SSR HTML before any JS runs.
      initial={hidden}
      animate={
        !mounted ? hidden :
        !shouldAnimate ? visible :
        isVisible ? 'visible' : hidden
      }
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
