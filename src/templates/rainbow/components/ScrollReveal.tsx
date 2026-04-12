'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useScrollTrigger } from '../hooks/useScrollTrigger'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  threshold?: number
  rootMargin?: string
  staggerChildren?: number
}

/**
 * Reusable scroll-triggered animation component
 * - Desktop only (≥768px)
 * - Respects prefers-reduced-motion
 * - Slow, elegant slide-up animation (Baunfire-style)
 * - Supports staggered children animations
 * - Optimized for 99 Lighthouse score
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0, // Delay before animation starts (in seconds)
  duration = 0.9, // Animation duration (0.9s = slow Baunfire-style)
  threshold = 0.5, // How much of element must be visible (0.5 = 50%)
  rootMargin = '0px', // Offset from viewport edge (0px = no offset)
  staggerChildren = 0, // Delay between each child animation (0 = no stagger)
}: ScrollRevealProps) {
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

  // Scroll trigger
  const { elementRef, isVisible } = useScrollTrigger({ threshold, rootMargin })

  // Animation variants - slow, elegant Baunfire-style
  const containerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1] as const, // Apple-style easing
        staggerChildren: staggerChildren,
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
      key={shouldAnimate && isVisible ? 'animated' : 'static'}
      className={className}
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
  )
}
