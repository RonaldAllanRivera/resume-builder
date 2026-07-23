import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllCertifications } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    alternates: { canonical: '/certifications' },
    title: `Certifications | ${settings?.siteName || 'Resume'}`,
    description:
      '60+ professional certifications in full-stack development, Python, Laravel, WordPress, React, Next.js, AI/ML, cloud computing, and DevOps. Continuous learning in modern web technologies and best practices.',
  }
}

// ISR: Revalidate every 1 hour - certifications update infrequently
export const revalidate = 3600

export default async function CertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const params = await searchParams
  const template = await getTemplate(params.template)
  const settings = await getSiteSettings()
  const certifications = await getAllCertifications()

  const { Layout, CertificationsPage: CertificationsPageComponent } = template

  return (
    <Layout>
      <CertificationsPageComponent certifications={certifications} settings={settings} />
    </Layout>
  )
}
