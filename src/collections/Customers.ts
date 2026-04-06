import type { CollectionConfig } from 'payload'
import { adminOrEditor } from '@/access/adminOrEditor'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'company', 'createdAt'],
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
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Phone number with country code',
      },
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'America/New_York',
      admin: {
        description: 'Customer timezone for scheduling',
      },
    },
    {
      name: 'company',
      type: 'text',
      admin: {
        description: 'Company or organization',
      },
    },
    {
      name: 'marketingConsent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Customer consented to marketing communications',
      },
    },
    {
      name: 'providers',
      type: 'array',
      fields: [
        {
          name: 'provider',
          type: 'select',
          options: [
            {
              label: 'Google',
              value: 'google',
            },
            {
              label: 'GitHub',
              value: 'github',
            },
            {
              label: 'LinkedIn',
              value: 'linkedin',
            },
          ],
        },
        {
          name: 'providerAccountId',
          type: 'text',
          admin: {
            description: 'Account ID from the provider',
          },
        },
      ],
      admin: {
        description: 'OAuth providers linked to this customer',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this customer',
      },
    },
  ],
  timestamps: true,
}
