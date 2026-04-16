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

function getVisibleState(direction: Direction) {
  if (direction === 'left' || direction === 'right') return { opacity: 1, x: 0, y: 0 }
  return { opacity: 1, x: 0, y: 0 }
}

/**
 * Reusable scroll-triggered animation component
 * - Desktop only (≥768px)
 * - Respects prefers-reduced-motion
 * - Slow, elegant slide animation (Baunfire-style)
 * - Supports staggered children animations
 * - Supports directional slide: 'up' | 'left' | 'right'
 * - Optimized for 99 Lighthouse score
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
  const visible = getVisibleState(direction)

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

  // Item variants always slide up for staggered grids
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
    <>
      {!mounted && (
        <style jsx global>{`
          @media (min-width: 768px) {
            .scroll-reveal-content {
              opacity: 0;
            }
          }
        `}</style>
      )}

      <motion.div
        ref={elementRef}
        key={shouldAnimate && isVisible ? 'animated' : 'static'}
        className={`${className} scroll-reveal-content`}
        variants={shouldAnimate ? containerVariants : undefined}
        initial={shouldAnimate ? 'hidden' : undefined}
        animate={shouldAnimate && isVisible ? 'visible' : undefined}
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
