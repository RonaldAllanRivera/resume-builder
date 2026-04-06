import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type { Package } from '@/payload-types'

/**
 * POST /api/bookings/checkout
 *
 * Creates a Stripe Checkout Session for an accepted booking.
 * Only bookings in `accepted` or `pending_payment` status can proceed to checkout.
 *
 * Body: { bookingId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Fetch booking with package details
    const booking = await payload.findByID({
      collection: 'bookings',
      id: bookingId,
      depth: 1,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only accepted bookings can proceed to payment
    if (booking.status !== 'accepted' && booking.status !== 'pending_payment') {
      return NextResponse.json(
        { error: `Booking is not ready for payment. Current status: ${booking.status}` },
        { status: 400 },
      )
    }

    const pkg = booking.package as Package
    if (!pkg || !pkg.name) {
      return NextResponse.json({ error: 'Package data missing from booking' }, { status: 400 })
    }

    // Calculate amount based on payment mode
    let chargeAmount = booking.amount || pkg.price
    let description = pkg.name

    if (booking.paymentMode === 'deposit_final' && booking.depositAmount) {
      chargeAmount = booking.depositAmount
      description = `${pkg.name} — Deposit (50%)`
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (booking.currency || pkg.currency || 'USD').toLowerCase(),
            unit_amount: chargeAmount,
            product_data: {
              name: description,
              description: pkg.shortDescription || undefined,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${serverUrl}/book/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${serverUrl}/book/cancel?booking_id=${bookingId}`,
      metadata: {
        bookingId: String(bookingId),
        paymentMode: booking.paymentMode || 'pay_after_completion',
      },
      customer_email:
        typeof booking.customer === 'object' && booking.customer?.email
          ? booking.customer.email
          : undefined,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
    })

    // Update booking with Stripe session info and status
    await payload.update({
      collection: 'bookings',
      id: bookingId,
      data: {
        status: 'pending_payment',
        stripeCheckoutSessionId: session.id,
      },
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
