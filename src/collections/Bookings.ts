import type { CollectionConfig } from 'payload'
import { adminOrEditor } from '@/access/adminOrEditor'
import { sendStatusEmails } from './Bookings/hooks/sendStatusEmails'
import { setProofToken } from './Bookings/hooks/setProofToken'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['customer', 'package', 'status', 'startAt', 'amount', 'paymentDueAt'],
    group: 'Booking',
  },
  access: {
    read: adminOrEditor,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: {
        description: 'Customer who made the booking',
      },
    },
    {
      name: 'package',
      type: 'relationship',
      relationTo: 'packages',
      required: true,
      admin: {
        description: 'Package that was booked',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_review',
      options: [
        {
          label: 'Pending Review',
          value: 'pending_review',
        },
        {
          label: 'Accepted',
          value: 'accepted',
        },
        {
          label: 'Pending Payment',
          value: 'pending_payment',
        },
        {
          label: 'Payment Submitted (unverified)',
          value: 'payment_submitted',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'In Progress',
          value: 'in_progress',
        },
        {
          label: 'Work Completed',
          value: 'work_completed',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
        {
          label: 'Expired',
          value: 'expired',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
        {
          label: 'Disputed',
          value: 'disputed',
        },
      ],
      admin: {
        description:
          'Booking lifecycle: pending_review → accepted → pending_payment → payment_submitted → paid → in_progress → work_completed. Pending Payment emails the client payment instructions. Payment Submitted means the client uploaded proof — VERIFY IT AGAINST YOUR OWN BANK/GCASH BEFORE setting Paid. Paid emails the client a confirmation.',
      },
    },
    {
      name: 'paymentMode',
      type: 'select',
      defaultValue: 'pay_after_completion',
      options: [
        {
          label: 'Pay After Completion',
          value: 'pay_after_completion',
        },
        {
          label: 'Pay Upfront',
          value: 'pay_upfront',
        },
        {
          label: 'Deposit + Final',
          value: 'deposit_final',
        },
      ],
      admin: {
        description: 'How payment is handled for this booking',
      },
    },
    {
      name: 'depositAmount',
      type: 'number',
      admin: {
        condition: (data) => data.paymentMode === 'deposit_final',
        description: 'Deposit amount in cents (for deposit + final payment mode)',
      },
    },
    {
      name: 'startAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy HH:mm',
        },
        description: 'Booking start time in UTC',
      },
    },
    {
      name: 'endAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy HH:mm',
        },
        description: 'Booking end time in UTC',
      },
    },
    {
      name: 'paymentDueAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          displayFormat: 'MMM dd, yyyy HH:mm',
        },
        description:
          'Computed at creation as startAt minus BookingSettings.depositDueDaysBeforeStart. This is the admin verification deadline — there is deliberately no cron/auto-expiry, so an overdue deposit must be spotted here (sort/filter this column) and handled by hand. Null for consultations, which take no deposit.',
      },
    },
    {
      name: 'timezoneAtBooking',
      type: 'text',
      required: true,
      defaultValue: 'Asia/Manila',
      admin: {
        description: 'Customer timezone at time of booking',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Customer notes or special requirements',
      },
    },
    {
      name: 'termsAcceptedAt',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy HH:mm',
        },
      },
    },
    {
      name: 'paidAt',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy HH:mm',
        },
      },
    },
    {
      name: 'amount',
      type: 'number',
      admin: {
        description: 'Amount paid in cents',
      },
    },
    {
      name: 'currency',
      type: 'text',
      admin: {
        description: 'Currency code (USD, EUR, etc.)',
      },
    },
    {
      name: 'refundAmount',
      type: 'number',
      admin: {
        description: 'Refund amount in cents (if applicable)',
      },
    },
    {
      name: 'refundReason',
      type: 'textarea',
      admin: {
        description: 'Reason for refund',
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for admin use only',
      },
    },
    {
      name: 'paymentProof',
      type: 'upload',
      relationTo: 'paymentProofs',
      admin: {
        description: 'Screenshot the client uploaded as proof of payment. NOT verification — check your own bank/GCash.',
      },
    },
    {
      name: 'proofExtracted',
      type: 'group',
      admin: {
        description: 'Read automatically from the uploaded screenshot. This is what the client CLAIMS, not what was received.',
      },
      fields: [
        {
          name: 'isReceipt',
          type: 'checkbox',
          admin: { readOnly: true, description: 'False if the image does not look like a payment receipt at all.' },
        },
        { name: 'amountMinor', type: 'number', admin: { readOnly: true, description: 'Amount in the smallest currency unit (centavos).' } },
        { name: 'currency', type: 'text', admin: { readOnly: true } },
        { name: 'referenceNumber', type: 'text', admin: { readOnly: true } },
        { name: 'senderName', type: 'text', admin: { readOnly: true } },
        { name: 'paidAt', type: 'text', admin: { readOnly: true } },
        { name: 'channel', type: 'text', admin: { readOnly: true, description: 'e.g. GCash, BPI, Maya.' } },
      ],
    },
    {
      name: 'proofAmountMatches',
      type: 'checkbox',
      admin: {
        readOnly: true,
        description: 'Does the extracted amount equal the booking amount? A mismatch is a red flag; a match still is not proof.',
      },
    },
    {
      name: 'proofToken',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description:
          'Unguessable token used to authorize the unauthenticated payment-proof upload link (/book/proof/[token]). Generated automatically on create — never derived from the id.',
      },
    },
  ],
  hooks: {
    beforeChange: [setProofToken],
    afterChange: [sendStatusEmails],
  },
  timestamps: true,
}
