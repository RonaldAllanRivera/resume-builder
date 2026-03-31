'use client'

import { useEffect, useState } from 'react'
import { Starfield } from '@/templates/rainbow/components/Starfield'

export function StarfieldClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#0a0a0f]" style={{ zIndex: -1 }} />
      <Starfield />
    </>
  )
}
