import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTemplate } from '@/utilities/getTemplate'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booking Confirmed - Thank You',
  description: 'Your booking has been confirmed and payment received.',
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; booking_id?: string }>
}) {
  const { booking_id } = await searchParams
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })

  const template = await getTemplate(settings.publicTemplate || 'rainbow')
  const { Layout } = template

  let bookingInfo: { packageName: string; startAt: string } | null = null

  if (booking_id) {
    try {
      const booking = await payload.findByID({
        collection: 'bookings',
        id: Number(booking_id),
        depth: 1,
      })
      if (booking) {
        const pkg =
          typeof booking.package === 'object' && booking.package !== null
            ? booking.package
            : null
        bookingInfo = {
          packageName: pkg?.name || 'Your Package',
          startAt: booking.startAt,
        }
      }
    } catch {
      // Booking not found — still show success page
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#050608] text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-10 h-10 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Payment Successful!
          </h1>

          <p className="text-xl text-white/80 mb-8">
            Thank you for your payment. Your booking is now confirmed.
          </p>

          {bookingInfo && (
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Package</span>
                <span className="font-semibold">{bookingInfo.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Scheduled</span>
                <span className="font-semibold">
                  {new Date(bookingInfo.startAt).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className="font-semibold text-green-400">Paid</span>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 mb-8">
            <h2 className="font-semibold mb-3">What Happens Next?</h2>
            <ol className="text-left text-white/70 text-sm space-y-2 list-decimal list-inside">
              <li>You will receive a confirmation email with booking details</li>
              <li>I will begin working on your project as scheduled</li>
              <li>You will receive updates on progress</li>
              <li>Payment will be released to my bank after work is completed</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/20"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-6 py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[0_0_20px_rgba(100,180,255,0.4)]"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
