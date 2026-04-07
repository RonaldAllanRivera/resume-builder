import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate } from '@/utilities/getTemplate'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payment Cancelled',
  description: 'Your payment was cancelled. You can try again or choose a different package.',
}

export default async function BookingCancelPage() {
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
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-10 h-10 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-4">Payment Cancelled</h1>

          <p className="text-xl text-white/80 mb-8">
            Your payment was not completed. No charges have been made.
          </p>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 mb-8">
            <p className="text-white/70 text-sm">
              Your booking request is still on hold. You can return to the pricing page to try again
              or contact me if you have any questions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-6 py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[0_0_20px_rgba(100,180,255,0.4)]"
            >
              Back to Pricing
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/20"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
