import type { Metadata } from 'next/types'
import { Suspense } from 'react'
import { SearchPage as RainbowSearchPage } from '@/templates/rainbow/SearchPage'

export const metadata: Metadata = {
  title: 'Search Portfolio | Ronald Allan Rivera',
  description:
    'Search projects, experience, and certifications. Find React, Next.js, Laravel, WordPress, Python, and AI work.',
  openGraph: {
    title: 'Search Portfolio | Ronald Allan Rivera',
    description: 'Search projects, experience, and certifications across my portfolio.',
    type: 'website',
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RainbowSearchPage />
    </Suspense>
  )
}
