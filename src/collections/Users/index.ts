import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { adminOnly, isAdmin } from '../../access/adminOnly'
import { adminOrSelf } from '../../access/adminOrSelf'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: async ({ req }) => {
      if (isAdmin(req.user)) return true

      const existing = await req.payload.find({
        collection: 'users',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
      })

      return existing.totalDocs === 0
    },
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
    hidden: ({ user }) => {
      return !isAdmin(user)
    },
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor'],
      defaultValue: ['editor'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const existing = await req.payload.find({
            collection: 'users',
            depth: 0,
            limit: 1,
            overrideAccess: true,
            req,
          })

          if (existing.totalDocs === 0) {
            return {
              ...data,
              roles: ['admin'],
            }
          }
        }

        const hasRolesField =
          typeof data === 'object' &&
          data !== null &&
          Object.prototype.hasOwnProperty.call(data, 'roles')

        const roles = Array.isArray((data as { roles?: unknown })?.roles)
          ? ((data as { roles?: string[] }).roles ?? [])
          : []

        if ((operation === 'create' || hasRolesField) && roles.length === 0) {
          return {
            ...data,
            roles: ['editor'],
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
