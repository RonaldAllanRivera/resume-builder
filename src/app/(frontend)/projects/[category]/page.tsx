import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getProjectsByCategory } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

const categoryLabels: Record<string, string> = {
  'full-stack': 'Full Stack Development',
  wordpress: 'WordPress Development',
  automation: 'Automation & Software Engineering',
  'graphic-design': 'Graphic Design',
}

const validCategories = ['full-stack', 'wordpress', 'automation', 'graphic-design']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const settings = await getSiteSettings()
  const label = categoryLabels[category] || category

  return {
    title: `${label} | ${settings?.siteName || 'Resume'}`,
    description: `${label} projects and portfolio`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProjectCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const { category } = await params

  // Validate category
  if (!validCategories.includes(category)) {
    notFound()
  }

  const searchParamsResolved = await searchParams
  const template = await getTemplate(searchParamsResolved.template)
  const settings = await getSiteSettings()
  const projects = await getProjectsByCategory(category)

  const { Layout, ProjectCategoryPage: ProjectCategoryPageComponent } = template

  return (
    <Layout>
      <ProjectCategoryPageComponent category={category} projects={projects} settings={settings} />
    </Layout>
  )
}

export async function generateStaticParams() {
  return validCategories.map((category) => ({
    category,
  }))
}
