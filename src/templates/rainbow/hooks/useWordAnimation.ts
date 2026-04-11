'use client'

import { useEffect, useState } from 'react'

interface WordAnimationProps {
  text: string
  stagger?: number
  duration?: number
  delay?: number
}

export function useWordAnimation({ text, stagger = 0.1, duration = 0.6, delay = 0 }: WordAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [words, setWords] = useState<string[]>([])

  useEffect(() => {
    // Split text into words, preserving spaces
    const wordArray = text.split(' ').filter(word => word.length > 0)
    setWords(wordArray)
    
    // Start animation after delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [text, delay])

  return {
    words,
    isVisible,
    getWordDelay: (index: number) => index * stagger,
    getWordStyle: (index: number) => ({
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out`,
      transitionDelay: `${index * stagger}s`,
    }),
  }
}
