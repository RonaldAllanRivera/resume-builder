import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTemplate } from '@/utilities/getTemplate'
import { BookingFlow } from '@/templates/rainbow/components/BookingFlow'

type Args = {
  params: Promise<{ packageSlug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { packageSlug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'packages',
    where: {
      slug: { equals: packageSlug },
      active: { equals: true },
    },
    limit: 1,
  })

  const pkg = docs[0]
  if (!pkg) {
    return { title: 'Package Not Found' }
  }

  return {
    title: `Book ${pkg.name} - Hire Me`,
    description: pkg.shortDescription || `Book ${pkg.name} for your project`,
  }
}

export default async function BookingPageRoute({ params }: Args) {
  const { packageSlug } = await params
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  const { docs } = await payload.find({
    collection: 'packages',
    where: {
      slug: { equals: packageSlug },
      active: { equals: true },
    },
    limit: 1,
  })

  const pkg = docs[0]
  if (!pkg) {
    notFound()
  }

  const template = await getTemplate(settings.publicTemplate || 'rainbow')
  const { Layout } = template

  return (
    <Layout>
      <div className="min-h-screen bg-[#050608] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <BookingFlow pkg={pkg} />
        </div>
      </div>
    </Layout>
  )
}
