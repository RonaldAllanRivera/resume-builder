import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllExperiences } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: `Experience | ${settings?.siteName || 'Resume'}`,
    description: 'Professional experience and work history',
  }
}

export const dynamic = 'force-dynamic'

export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const params = await searchParams
  const template = await getTemplate(params.template)
  const settings = await getSiteSettings()
  const experiences = await getAllExperiences()

  const { Layout, ExperiencePage: ExperiencePageComponent } = template

  return (
    <Layout>
      <ExperiencePageComponent experiences={experiences} settings={settings} />
    </Layout>
  )
}
