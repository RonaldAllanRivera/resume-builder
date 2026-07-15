import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate } from '@/utilities/getTemplate'
import { PaymentProofUpload } from '@/templates/rainbow/components/PaymentProofUpload'

type Args = {
  params: Promise<{ bookingId: string }>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upload Payment Proof',
  robots: { index: false, follow: false },
}

export default async function ProofUploadPageRoute({ params }: Args) {
  const { bookingId } = await params
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  const template = await getTemplate(settings.publicTemplate || 'rainbow')
  const { Layout } = template

  return (
    <Layout>
      <div className="min-h-screen bg-[#050608] text-white py-20 px-4">
        <div className="max-w-lg mx-auto">
          <PaymentProofUpload bookingId={bookingId} />
        </div>
      </div>
    </Layout>
  )
}
