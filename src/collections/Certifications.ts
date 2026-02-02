import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { adminOrEditor } from '../access/adminOrEditor'

export const Certifications: CollectionConfig = {
  slug: 'certifications',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: authenticatedOrPublished,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['title', 'issuer', 'issueDate', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'issuer',
      type: 'text',
    },
    {
      name: 'duration',
      type: 'text',
    },
    {
      name: 'issueDate',
      type: 'date',
    },
    {
      name: 'expirationDate',
      type: 'date',
    },
    {
      name: 'credentialId',
      type: 'text',
    },
    {
      name: 'credentialUrl',
      type: 'text',
    },
    {
      name: 'certificate',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  timestamps: true,
}
