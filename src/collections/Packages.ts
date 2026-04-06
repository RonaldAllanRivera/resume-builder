import type { CollectionConfig } from 'payload'
import { adminOrEditor } from '@/access/adminOrEditor'

export const Packages: CollectionConfig = {
  slug: 'packages',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'currency', 'durationType', 'active', 'sortOrder'],
    group: 'Booking',
  },
  access: {
    read: () => true,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier for URLs (e.g., "30min-consultation")',
      },
    },
    {
      name: 'shortDescription',
      type: 'text',
      required: true,
      admin: {
        description: '1-2 sentence summary for pricing cards',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: "Detailed description of what's included",
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        description: 'Price in cents (e.g., 5000 for $50.00)',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'USD',
      admin: {
        description: '3-letter currency code (USD, EUR, etc.)',
      },
    },
    {
      name: 'durationType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Consultation Call',
          value: 'call',
        },
        {
          label: 'Day Rate',
          value: 'day',
        },
        {
          label: 'Week Rate',
          value: 'week',
        },
        {
          label: 'Month Rate',
          value: 'month',
        },
        {
          label: 'Custom',
          value: 'custom',
        },
      ],
      defaultValue: 'call',
    },
    {
      name: 'durationMinutes',
      type: 'number',
      admin: {
        condition: (data) => data.durationType === 'call',
        description: 'Duration in minutes for consultation calls',
      },
    },
    {
      name: 'deliverables',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'List of deliverables included in this package',
      },
    },
    {
      name: 'limits',
      type: 'array',
      fields: [
        {
          name: 'type',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Package limits (e.g., revisions, response time, meetings)',
      },
    },
    {
      name: 'requiresScheduling',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show this package on the pricing page',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order for displaying packages (lower numbers first)',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        description: 'Stripe Price ID for direct payment processing',
      },
    },
    {
      name: 'stripeProductId',
      type: 'text',
      admin: {
        description: 'Stripe Product ID for catalog management',
      },
    },
  ],
  timestamps: true,
}
