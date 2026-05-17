import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import {
  getFeaturedProjects,
  getAllProjects,
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

// ISR: revalidate every 5 minutes. The page is statically generated; new
// requests within the 5-minute window serve the cached HTML. After the
// window expires, the next request triggers a background regeneration.
//
// IMPORTANT: do not add `searchParams`, `cookies()`, `headers()`, or
// `useSearchParams()` access to this page. Any of those opt the route out
// of static rendering and back into per-request serverless execution
// (which is what we just fixed). Verified via Vercel cache headers:
//   cache: MISS  →  searchParams was accessed (dynamic)
//   cache: HIT   →  static + ISR (the goal)
export const revalidate = 300

export default async function HomePage() {
  const template = await getTemplate()
  const settings = await getSiteSettings()
  const profile = await getResumeProfile()
  const featuredProjects = await getFeaturedProjects()
  const _allProjects = await getAllProjects() // Fetched for cache warming, not used in HomePage
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
