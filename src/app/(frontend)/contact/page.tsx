import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate } from '@/utilities/getTemplate'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with me for your next project or collaboration opportunity.',
  openGraph: {
    title: 'Contact',
    description: 'Get in touch with me for your next project or collaboration opportunity.',
  },
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
