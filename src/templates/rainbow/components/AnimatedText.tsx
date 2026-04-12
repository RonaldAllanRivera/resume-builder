'use client'

import React from 'react'
import { useWordAnimation } from '../hooks/useWordAnimation'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface AnimatedTextProps {
  text: string
  className?: string
  stagger?: number
  duration?: number
  delay?: number
  as?: keyof React.JSX.IntrinsicElements
  disabled?: boolean
}

export function AnimatedText({
  text,
  className = '',
  stagger = 0.1, // Delay between each word (in seconds)
  duration = 0.6, // Animation duration per word
  delay = 0, // Initial delay before animation starts
  as: Component = 'div',
  disabled = false,
}: AnimatedTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isDesktop, setIsDesktop] = React.useState(false)

  // Detect desktop devices for animation enablement
  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const { words, getWordStyle } = useWordAnimation({ text, stagger, duration, delay })

  // Disable animations on mobile, reduced motion, or when explicitly disabled
  if (prefersReducedMotion || disabled || !isDesktop) {
    return <Component className={className}>{text}</Component>
  }

  return (
    <Component className={className}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span style={getWordStyle(index)} className="inline-block">
            {word}
          </span>
          {index < words.length - 1 && <span> </span>}
        </React.Fragment>
      ))}
    </Component>
  )
}
