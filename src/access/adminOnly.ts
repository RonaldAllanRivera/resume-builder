import type { Access } from 'payload'

type UserWithRoles = {
  id?: string
  roles?: string[]
}

const getRoles = (user: unknown): string[] => {
  const roles = (user as UserWithRoles | undefined)?.roles
  return Array.isArray(roles) ? roles : []
}

export const isAdmin = (user: unknown): boolean => {
  return getRoles(user).includes('admin')
}

export const adminOnly: Access = ({ req: { user } }) => {
  return isAdmin(user)
}
