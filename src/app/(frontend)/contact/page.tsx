import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: `Contact | ${settings?.siteName || 'Resume'}`,
    description:
      'Hire a senior full-stack developer for your web development, SaaS, AI automation, or WordPress project. Specializing in Python, Laravel, React, and Next.js. 24-hour response time.',
    openGraph: {
      title: 'Contact',
      description: 'Get in touch with me for your next project or collaboration opportunity.',
    },
  }
}

export default async function ContactRoute() {
  const payload = await getPayload({ config })

  // Fetch site settings
  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  // Get the template component
  const { ContactPage } = await getTemplate(settings.publicTemplate || 'rainbow')

  if (!ContactPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Contact page not available for this template.</p>
      </div>
    )
  }

  return <ContactPage settings={settings} />
}
