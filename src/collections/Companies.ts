import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const Companies: CollectionConfig = {
  slug: 'companies',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['name', 'website', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'about',
      type: 'textarea',
    },
    {
      name: 'toneNotes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
