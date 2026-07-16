import type { CollectionAfterChangeHook } from 'payload'

import {
  sendPaymentConfirmedEmails,
  sendPaymentInstructionsEmail,
  sendProofSubmittedAdminEmail,
  type BookingEmailData,
  type CustomerEmailData,
} from '@/lib/booking-email'

/**
 * Fires the client-facing email attached to a booking status transition.
 *
 * pending_payment → the client is told how to pay (this IS the invoice)
 * paid           → the client is told the payment landed
 *
 * Guards on an actual status *change*, so re-saving a booking (editing notes,
 * fixing a date) never re-sends an email. Fire-and-forget: a mail failure must
 * never roll back the status change the admin just made.
 */
export const sendStatusEmails: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return doc
  if (doc.status === previousDoc?.status) return doc
  if (
    doc.status !== 'pending_payment' &&
    doc.status !== 'payment_submitted' &&
    doc.status !== 'paid'
  ) {
    return doc
  }

  try {
    // depth may be 0 here, so the relationships can arrive as bare IDs — resolve them.
    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
    const packageId = typeof doc.package === 'object' ? doc.package.id : doc.package

    const customerDoc = await req.payload.findByID({
      collection: 'customers',
      id: customerId,
      depth: 0,
      req,
    })

    const packageDoc = await req.payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 0,
      req,
    })

    const customer: CustomerEmailData = {
      name: customerDoc.name,
      email: customerDoc.email,
      company: customerDoc.company ?? null,
    }

    const booking: BookingEmailData = {
      bookingId: doc.id,
      packageName: packageDoc.name,
      startAt: doc.startAt,
      endAt: doc.endAt,
      amount: doc.amount ?? packageDoc.price,
      currency: doc.currency ?? packageDoc.currency,
      paymentMode: doc.paymentMode,
      notes: doc.notes ?? null,
      timezone: doc.timezoneAtBooking,
      proofToken: doc.proofToken ?? undefined,
    }

    if (doc.status === 'pending_payment') {
      const settings = await req.payload.findGlobal({ slug: 'bookingSettings', depth: 0, req })

      await sendPaymentInstructionsEmail(customer, booking, {
        paymentInstructions: settings.paymentInstructions ?? '',
        adminEmail: settings.notificationEmail ?? undefined,
      })
    } else if (doc.status === 'payment_submitted') {
      // The client uploaded proof. This confirms NOTHING — it is a claim.
      // Tell the admin to go verify it against their own bank/GCash.
      // Deliberately no email to the client: nothing has been confirmed yet.
      const settings = await req.payload.findGlobal({ slug: 'bookingSettings', depth: 0, req })

      await sendProofSubmittedAdminEmail(customer, booking, {
        adminEmail: settings.notificationEmail ?? undefined,
        extractedAmountMinor: doc.proofExtracted?.amountMinor ?? null,
        extractedReference: doc.proofExtracted?.referenceNumber ?? null,
        amountMatches: doc.proofAmountMatches === true,
      })
    } else {
      await sendPaymentConfirmedEmails(customer, booking)
    }
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `sendStatusEmails failed for booking #${doc.id} (status ${doc.status})`,
    })
  }

  return doc
}
