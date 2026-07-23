import React from 'react'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { getAllCertifications } from '@/utilities/fetchPublicData'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import {
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateCertificationSchema,
} from '@/utilities/jsonLd'
import { canonicalPath } from '@/utilities/getURL'

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
      {/*
        These three generators already existed in jsonLd.ts and were never
        called. EducationalOccupationalCredential per certification is what
        makes the 60+ list legible to search and answer engines as credentials
        rather than as a wall of text.
      */}
      <JsonLd
        data={generateWebPageSchema(
          'Certifications',
          'Professional certifications in full-stack development, Python, Laravel, WordPress, React, AI/ML, cloud, and DevOps.',
          canonicalPath('/certifications'),
        )}
      />
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: canonicalPath('/') },
          { name: 'Certifications', url: canonicalPath('/certifications') },
        ])}
      />
      {certifications.map((cert) => (
        <JsonLd key={cert.id} data={generateCertificationSchema(cert)} />
      ))}

      <CertificationsPageComponent certifications={certifications} settings={settings} />
    </Layout>
  )
}
