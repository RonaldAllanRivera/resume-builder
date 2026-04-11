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
}

export function AnimatedText({
  text,
  className = '',
  stagger = 0.1,
  duration = 0.6,
  delay = 0,
  as: Component = 'div',
}: AnimatedTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { words, getWordStyle } = useWordAnimation({ text, stagger, duration, delay })

  if (prefersReducedMotion) {
    return <Component className={className}>{text}</Component>
  }

  return (
    <Component className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} style={getWordStyle(index)} className="inline-block">
          {word}
          {index < words.length - 1 && ' '}
        </span>
      ))}
    </Component>
  )
}
