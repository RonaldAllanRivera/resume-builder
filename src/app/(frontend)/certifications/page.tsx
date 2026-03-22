import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllCertifications } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: `Certifications | ${settings?.siteName || 'Resume'}`,
    description: 'Professional certifications and credentials',
  }
}

export const dynamic = 'force-dynamic'

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
