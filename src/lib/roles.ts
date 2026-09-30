import type { Role } from '@/types/api'

export function canReview(role: Role | undefined) {
  return role === 'manager' || role === 'admin'
}
