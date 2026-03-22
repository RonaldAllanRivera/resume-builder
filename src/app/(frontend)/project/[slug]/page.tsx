import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getProjectBySlug, getAllProjects } from '@/utilities/fetchPublicData'
import { generateProjectSchema } from '@/utilities/jsonLd'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  const settings = await getSiteSettings()

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} | ${settings?.siteName || 'Resume'}`,
    description: project.summary || '',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const searchParamsResolved = await searchParams
  const template = await getTemplate(searchParamsResolved.template)
  const settings = await getSiteSettings()

  const projectSchema = generateProjectSchema(project)

  const { Layout, ProjectDetailPage: ProjectDetailPageComponent } = template

  return (
    <>
      <JsonLd data={projectSchema} />
      <Layout>
        <ProjectDetailPageComponent slug={slug} project={project} settings={settings} />
      </Layout>
    </>
  )
}

export async function generateStaticParams() {
  const projects = await getAllProjects()

  return projects.map((project) => ({
    slug: project.slug,
  }))
}
