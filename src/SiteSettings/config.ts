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
      type: 'tabs',
      tabs: [
        {
          label: 'Template',
          fields: [
            {
              name: 'publicTemplate',
              type: 'select',
              required: true,
              defaultValue: 'rainbow',
              options: [
                {
                  label: 'Rainbow',
                  value: 'rainbow',
                },
              ],
              admin: {
                description: 'Choose the template for your public site. Changes apply instantly.',
              },
            },
          ],
        },
        {
          label: 'Navigation',
          fields: [
            {
              name: 'showExperience',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show Experience in Navigation',
            },
            {
              name: 'showEducation',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show Education in Navigation',
            },
            {
              name: 'showProjects',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show Projects in Navigation',
            },
            {
              name: 'showCertifications',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show Certifications in Navigation',
            },
          ],
        },
        {
          label: 'Social Links',
          fields: [
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
        },
      ],
    },
  ],
}
