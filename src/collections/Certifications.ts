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
      name: 'category',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Frontend & JavaScript',
          value: 'frontend-javascript',
        },
        {
          label: 'Laravel & Backend',
          value: 'laravel-backend',
        },
        {
          label: 'Python & Django',
          value: 'python-django',
        },
        {
          label: 'WordPress',
          value: 'wordpress',
        },
        {
          label: 'AI & Machine Learning',
          value: 'ai-ml',
        },
        {
          label: 'Cloud, DevOps & Architecture',
          value: 'cloud-devops',
        },
        {
          label: 'Git & Collaboration',
          value: 'git-collaboration',
        },
        {
          label: 'Video & Creative',
          value: 'video-creative',
        },
        {
          label: 'General Development',
          value: 'general-dev',
        },
      ],
      defaultValue: 'general-dev',
      admin: {
        position: 'sidebar',
      },
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
