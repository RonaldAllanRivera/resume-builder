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
  stagger = 0.1,
  duration = 0.6,
  delay = 0,
  as: Component = 'div',
  disabled = false,
}: AnimatedTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { words, getWordStyle } = useWordAnimation({ text, stagger, duration, delay })

  if (prefersReducedMotion || disabled) {
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
