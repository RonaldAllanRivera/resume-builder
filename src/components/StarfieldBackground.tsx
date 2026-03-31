'use client'

import { useEffect } from 'react'
import { Starfield } from '@/templates/rainbow/components/Starfield'

export function StarfieldBackground() {
  useEffect(() => {
    console.log('StarfieldBackground: Component mounted')
  }, [])

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]" style={{ zIndex: -10 }}>
      <Starfield />
    </div>
  )
}
