import type { CollectionConfig } from 'payload'
import { adminOrEditor } from '@/access/adminOrEditor'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['customer', 'package', 'status', 'startAt', 'amount'],
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
          label: 'Payment Released',
          value: 'payment_released',
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
          'Booking lifecycle: pending_review → accepted → pending_payment → paid → in_progress → work_completed → payment_released',
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
      name: 'stripeCheckoutSessionId',
      type: 'text',
      admin: {
        description: 'Stripe Checkout Session ID',
      },
    },
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      admin: {
        description: 'Stripe Payment Intent ID',
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
  ],
  timestamps: true,
}
