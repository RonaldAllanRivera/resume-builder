import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllEducations } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: `Education | ${settings?.siteName || 'Resume'}`,
    description: 'Educational background and academic achievements',
  }
}

export const dynamic = 'force-dynamic'

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const params = await searchParams
  const template = await getTemplate(params.template)
  const settings = await getSiteSettings()
  const educations = await getAllEducations()

  const { Layout, EducationPage: EducationPageComponent } = template

  return (
    <Layout>
      <EducationPageComponent educations={educations} settings={settings} />
    </Layout>
  )
}
