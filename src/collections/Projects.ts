import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { adminOrEditor } from '../access/adminOrEditor'

const formatSlug = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: authenticatedOrPublished,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'featured', 'updatedAt'],
    useAsTitle: 'title',
    components: {
      edit: {
        editMenuItems: ['@/components/DeleteVersionsMenuItem#DeleteVersionsMenuItem'],
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'techStack',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'repoUrl',
      type: 'text',
    },
    {
      name: 'liveUrl',
      type: 'text',
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
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data

        const title = typeof data.title === 'string' ? data.title : ''
        const slug = typeof data.slug === 'string' ? data.slug : ''

        if (!slug && title) {
          return {
            ...data,
            slug: formatSlug(title),
          }
        }

        return data
      },
    ],
  },
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
