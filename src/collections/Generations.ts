import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const Generations: CollectionConfig = {
  slug: 'generations',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['jobAd', 'resumeProfile', 'status', 'updatedAt'],
    useAsTitle: 'jobAd',
    components: {
      edit: {
        editMenuItems: [
          '@/components/GenerateDraftsMenuItem#GenerateDraftsMenuItem',
          '@/components/DeleteVersionsMenuItem#DeleteVersionsMenuItem',
        ],
      },
    },
  },
  fields: [
    {
      name: 'jobAd',
      type: 'relationship',
      relationTo: 'jobAds',
      required: true,
    },
    {
      name: 'resumeProfile',
      type: 'relationship',
      relationTo: 'resumeProfiles',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: ['draft', 'generating', 'ready_for_review', 'approved', 'exported', 'failed'],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'resumeDraft',
      type: 'textarea',
    },
    {
      name: 'applicationLetter',
      type: 'textarea',
    },
    {
      name: 'toneNotes',
      type: 'textarea',
      admin: {
        description:
          'Optional. Tone/voice notes for this attempt (overrides company tone notes and defaults).',
      },
    },
    {
      name: 'applicationLetterStyle',
      type: 'textarea',
      admin: {
        description:
          'Optional. Paste your preferred letter style here to override the global default for this attempt.',
      },
    },
    {
      name: 'coverLetterGreeting',
      type: 'text',
      admin: {
        description: 'Optional override. Example: Hi Mike,',
      },
    },
    {
      name: 'coverLetterHeader',
      type: 'textarea',
    },
    {
      name: 'coverLetterFooter',
      type: 'textarea',
    },
    {
      name: 'promptVersion',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'model',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'temperature',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'inputHash',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'resumeGoogleDocUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'coverLetterGoogleDocUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'exportedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
