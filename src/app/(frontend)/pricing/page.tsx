import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate } from '@/utilities/getTemplate'

export const metadata: Metadata = {
  title: 'Pricing - Hire Me',
  description:
    'Professional freelance services with transparent pricing. Choose from consultation calls, day rates, week rates, and monthly packages.',
  openGraph: {
    title: 'Pricing - Hire Me',
    description: 'Professional freelance services with transparent pricing',
    type: 'website',
  },
}

export default async function PricingPageRoute() {
  const payload = await getPayload({ config })

  // Fetch site settings
  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  // Fetch packages
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

  // Get the template component
  const template = await getTemplate(settings.publicTemplate || 'rainbow')
  const { Layout, PricingPage } = template

  if (!PricingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Pricing page not available for this template.</p>
      </div>
    )
  }

  return (
    <Layout>
      <PricingPage packages={packages} />
    </Layout>
  )
}
