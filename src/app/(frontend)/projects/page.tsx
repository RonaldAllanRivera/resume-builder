import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllProjects } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: `Projects | ${settings?.siteName || 'Resume'}`,
    description:
      'Explore full-stack web development projects including SaaS platforms, WordPress solutions, AI automation systems, and e-commerce applications built with Python, Laravel, React, and Next.js.',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const params = await searchParams
  const template = await getTemplate(params.template)
  const settings = await getSiteSettings()
  const projects = await getAllProjects()

  const { Layout, ProjectsPage: ProjectsPageComponent } = template

  return (
    <Layout>
      <ProjectsPageComponent projects={projects} settings={settings} />
    </Layout>
  )
}
