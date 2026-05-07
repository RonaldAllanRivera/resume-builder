import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate } from '@/utilities/getTemplate'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Services — Hire Me',
  description:
    'Freelance engineering services and engagement options. Consultations, project work, and retainers — pick the package that fits.',
  openGraph: {
    title: 'Services — Hire Me',
    description: 'Freelance packages and engagement options',
    type: 'website',
  },
}

export default async function ServicesPageRoute() {
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  const { docs: packages } = await payload.find({
    collection: 'packages',
    where: {
      active: {
        equals: true,
      },
    },
    sort: 'sortOrder',
    limit: 10,
  })

  const template = await getTemplate(settings.publicTemplate || 'rainbow')
  const { Layout, PricingPage } = template

  if (!PricingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Services page not available for this template.</p>
      </div>
    )
  }

  return (
    <Layout>
      <PricingPage packages={packages} />
    </Layout>
  )
}
