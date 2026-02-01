import type { Access } from 'payload'

type UserWithRolesAndId = {
  id?: number | string
  roles?: string[]
}

const getUser = (user: unknown): UserWithRolesAndId | undefined => {
  if (!user || typeof user !== 'object') return undefined
  return user as UserWithRolesAndId
}

export const adminOrSelf: Access = ({ req: { user } }) => {
  const u = getUser(user)
  if (!u?.id) return false

  const roles = Array.isArray(u.roles) ? u.roles : []
  if (roles.includes('admin')) return true

  const id = typeof u.id === 'number' ? u.id : Number(u.id)
  if (!Number.isFinite(id)) return false

  return {
    id: {
      equals: id,
    },
  }
}
