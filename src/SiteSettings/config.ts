import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  access: {
    read: () => true,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
    },
    {
      name: 'defaultMetaTitle',
      type: 'text',
    },
    {
      name: 'defaultMetaDescription',
      type: 'textarea',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
