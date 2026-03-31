import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllExperiences } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: `Experience | ${settings?.siteName || 'Resume'}`,
    description:
      '20+ years of professional experience in full-stack web development, specializing in Python, Laravel, WordPress, React, and Next.js. Proven track record building scalable SaaS platforms and enterprise applications.',
  }
}

// ISR: Revalidate every 1 hour - experience updates infrequently
export const revalidate = 3600

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
