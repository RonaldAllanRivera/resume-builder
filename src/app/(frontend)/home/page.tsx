import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getFeaturedProjects, getResumeProfile } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: settings?.defaultMetaTitle || 'Home',
    description: settings?.defaultMetaDescription || '',
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const params = await searchParams
  const template = await getTemplate(params.template)
  const settings = await getSiteSettings()
  const profile = await getResumeProfile()
  const featuredProjects = await getFeaturedProjects()

  const { Layout, HomePage: HomePageComponent } = template

  return (
    <Layout>
      <HomePageComponent
        profile={profile}
        featuredProjects={featuredProjects}
        settings={settings}
      />
    </Layout>
  )
}
