'use client'

import { useEffect, useState, useRef } from 'react'

interface ScrollTriggerOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollTrigger(options: ScrollTriggerOptions = {}) {
  const { threshold = 0.1, rootMargin = '-100px', triggerOnce = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementVisible = entry.isIntersecting

        if (isElementVisible && (!triggerOnce || !hasTriggered)) {
          setIsVisible(true)
          setHasTriggered(true)
        } else if (!isElementVisible && !triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return {
    elementRef,
    isVisible,
    hasTriggered,
  }
}
