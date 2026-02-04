import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const JobAds: CollectionConfig = {
  slug: 'jobAds',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['title', 'company', 'posterName', 'status', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
    },
    {
      name: 'jobUrl',
      type: 'text',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'posterName',
      type: 'text',
    },
    {
      name: 'jobDescription',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: ['new', 'ready', 'generating', 'done', 'failed'],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
