'use client'

import { Starfield } from '@/templates/rainbow/components/Starfield'

export function StarfieldClient() {
  // Pure black background always visible (no hydration delay)
  // Starfield hidden on mobile via CSS media query (no JS detection needed)
  return (
    <>
      <div className="fixed inset-0 bg-black" style={{ zIndex: -10 }} />
      <div className="hidden md:block">
        <Starfield />
      </div>
    </>
  )
}
