import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { sendPaymentConfirmedEmails } from '@/lib/booking-email'
import type { Booking, Customer, Package } from '@/payload-types'

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events for payment lifecycle.
 * Validates webhook signature before processing.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId

        if (!bookingId) {
          console.error('Webhook: No bookingId in session metadata')
          break
        }

        const updatedBooking = await payload.update({
          collection: 'bookings',
          id: Number(bookingId),
          data: {
            status: 'paid',
            stripePaymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id || null,
            paidAt: new Date().toISOString(),
          },
        })

        console.log(`Booking ${bookingId} marked as paid`)

        // Fetch with depth to resolve customer + package relationships
        const fullBooking = await payload.findByID({
          collection: 'bookings',
          id: Number(bookingId),
          depth: 1,
        }) as Booking & { customer: Customer; package: Package }

        const bookingCustomer = fullBooking.customer
        const bookingPackage = fullBooking.package

        if (
          bookingCustomer &&
          typeof bookingCustomer === 'object' &&
          bookingCustomer.email &&
          bookingPackage &&
          typeof bookingPackage === 'object'
        ) {
          sendPaymentConfirmedEmails(
            {
              name: bookingCustomer.name,
              email: bookingCustomer.email,
              company: bookingCustomer.company || null,
            },
            {
              bookingId: Number(bookingId),
              packageName: typeof bookingPackage.name === 'string' ? bookingPackage.name : String(bookingPackage.name),
              startAt: fullBooking.startAt ?? '',
              endAt: fullBooking.endAt ?? '',
              amount: fullBooking.amount ?? 0,
              currency: fullBooking.currency ?? 'usd',
              paymentMode: fullBooking.paymentMode ?? 'pay_after_completion',
              notes: fullBooking.notes || null,
              timezone: bookingCustomer.timezone || undefined,
            },
          ).catch((err) => console.error('sendPaymentConfirmedEmails failed:', err))
        }

        void updatedBooking
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId

        if (!bookingId) break

        // Revert booking to accepted so client can try again
        const booking = await payload.findByID({
          collection: 'bookings',
          id: Number(bookingId),
        })

        if (booking.status === 'pending_payment') {
          await payload.update({
            collection: 'bookings',
            id: Number(bookingId),
            data: { status: 'accepted' },
          })
          console.log(`Booking ${bookingId} reverted to accepted after payment expiry`)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id

        if (!paymentIntentId) break

        const { docs: bookings } = await payload.find({
          collection: 'bookings',
          where: { stripePaymentIntentId: { equals: paymentIntentId } },
          limit: 1,
        })

        if (bookings.length > 0) {
          await payload.update({
            collection: 'bookings',
            id: bookings[0].id,
            data: {
              status: 'refunded',
              refundAmount: charge.amount_refunded,
            },
          })
          console.log(`Booking ${bookings[0].id} marked as refunded`)
        }
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const paymentIntentId =
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent?.id

        if (!paymentIntentId) break

        const { docs: bookings } = await payload.find({
          collection: 'bookings',
          where: { stripePaymentIntentId: { equals: paymentIntentId } },
          limit: 1,
        })

        if (bookings.length > 0) {
          await payload.update({
            collection: 'bookings',
            id: bookings[0].id,
            data: {
              status: 'disputed',
              adminNotes: `Dispute created: ${dispute.reason || 'No reason provided'}`,
            },
          })
          console.log(`Booking ${bookings[0].id} marked as disputed`)
        }
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
