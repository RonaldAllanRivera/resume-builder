import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const ResumeProfiles: CollectionConfig = {
  slug: 'resumeProfiles',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['name', 'updatedAt'],
    useAsTitle: 'name',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'resumeText',
      type: 'textarea',
      admin: {
        description:
          'Optional. Use this for profile focus / constraints (e.g. “WordPress-focused”, “Laravel-heavy”, “Highlight ACF + performance”).',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
