import type { Access } from 'payload'

type UserWithRoles = {
  roles?: string[]
}

const getRoles = (user: unknown): string[] => {
  const roles = (user as UserWithRoles | undefined)?.roles
  return Array.isArray(roles) ? roles : []
}

export const adminOrEditor: Access = ({ req: { user } }) => {
  const roles = getRoles(user)
  return roles.includes('admin') || roles.includes('editor')
}
