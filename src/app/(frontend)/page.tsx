import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import {
  getFeaturedProjects,
  getResumeProfile,
  getAllExperiences,
  getAllEducations,
  getAllCertifications,
} from '@/utilities/fetchPublicData'
import { generatePersonSchema, generateWebSiteSchema } from '@/utilities/jsonLd'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: settings?.defaultMetaTitle || settings?.siteName || 'Home',
    description: settings?.defaultMetaDescription || '',
  }
}

export const dynamic = 'force-dynamic'

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
  const experiences = await getAllExperiences()
  const educations = await getAllEducations()
  const certifications = await getAllCertifications()

  const personSchema = generatePersonSchema(profile, settings)
  const webSiteSchema = generateWebSiteSchema(settings)

  const { Layout, HomePage: HomePageComponent } = template

  return (
    <>
      <JsonLd data={personSchema} />
      <JsonLd data={webSiteSchema} />
      <Layout>
        <HomePageComponent
          profile={profile}
          featuredProjects={featuredProjects}
          experiences={experiences}
          educations={educations}
          certifications={certifications}
          settings={settings}
        />
      </Layout>
    </>
  )
}
