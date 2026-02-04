import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const CoverLetterSettings: GlobalConfig = {
  slug: 'coverLetterSettings',
  access: {
    read: adminOrEditor,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'defaultGreetingTemplate',
      type: 'text',
      defaultValue: 'Hi {{posterName}},',
      required: true,
    },
    {
      name: 'defaultHeader',
      type: 'textarea',
    },
    {
      name: 'defaultFooter',
      type: 'textarea',
      defaultValue:
        'Best regards,\nRonald Allan Rivera\nSenior Full-Stack Web Developer\nhttps://allanwebdesign.com\nEmail: jaeron.rivera@gmail.com\nMobile: +63-927-023-8592\nLinkedIn: https://www.linkedin.com/in/ronald-allan-rivera-a43aaa63/\nGitHub: https://github.com/RonaldAllanRivera/\nResume: {{resumeUrl}}',
    },
  ],
}
