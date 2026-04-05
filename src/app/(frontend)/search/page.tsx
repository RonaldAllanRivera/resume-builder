import type { Metadata } from 'next/types'
import { Suspense } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getTemplate } from '@/templates/registry'

async function SearchPageContent() {
  const payload = await getPayload({ config: configPromise })

  const siteSettings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  const template = siteSettings?.publicTemplate || 'rainbow'
  const templateComponents = getTemplate(template)
  const TemplateSearchPage = templateComponents.SearchPage

  if (!TemplateSearchPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white">Search page not available for this template</p>
      </div>
    )
  }

  return <TemplateSearchPage />
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050608]" />}>
      <SearchPageContent />
    </Suspense>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Search Portfolio | Allan Rivera',
    description:
      'Search projects, experience, and certifications. Find React, Next.js, Laravel, WordPress, Python, and AI work.',
    openGraph: {
      title: 'Search Portfolio | Allan Rivera',
      description: 'Search projects, experience, and certifications across my portfolio.',
      type: 'website',
    },
  }
}
