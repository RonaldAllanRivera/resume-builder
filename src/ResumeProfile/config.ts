import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

type UserWithRoles = {
  roles?: string[]
}

const getRoles = (user: unknown): string[] => {
  const roles = (user as UserWithRoles | undefined)?.roles
  return Array.isArray(roles) ? roles : []
}

const isAdminOrEditor = (user: unknown): boolean => {
  const roles = getRoles(user)
  return roles.includes('admin') || roles.includes('editor')
}

export const ResumeProfile: GlobalConfig = {
  slug: 'resumeProfile',
  access: {
    read: () => true,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'headline',
      type: 'text',
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'email',
      type: 'text',
      access: {
        read: ({ req: { user }, doc }) => {
          if (isAdminOrEditor(user)) return true
          return Boolean((doc as { publishEmail?: boolean } | undefined)?.publishEmail)
        },
      },
    },
    {
      name: 'publishEmail',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'phone',
      type: 'text',
      access: {
        read: ({ req: { user }, doc }) => {
          if (isAdminOrEditor(user)) return true
          return Boolean((doc as { publishPhone?: boolean } | undefined)?.publishPhone)
        },
      },
    },
    {
      name: 'publishPhone',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'address',
      type: 'textarea',
      access: {
        read: ({ req: { user }, doc }) => {
          if (isAdminOrEditor(user)) return true
          return Boolean((doc as { publishAddress?: boolean } | undefined)?.publishAddress)
        },
      },
    },
    {
      name: 'publishAddress',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      access: {
        read: ({ req: { user }, doc }) => {
          if (isAdminOrEditor(user)) return true
          return Boolean((doc as { publishDateOfBirth?: boolean } | undefined)?.publishDateOfBirth)
        },
      },
    },
    {
      name: 'publishDateOfBirth',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
