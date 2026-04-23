// ============================================
// STAFF DASHBOARD UTILITIES
// ============================================

import { StaffProfile } from './types'

export function formatFullName(name: string): string {
  if (!name) return ''
  const words = name.split(/[\s._-]+/)
  const formattedWords = words.map(word => {
    if (word.length === 0) return ''
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
  return formattedWords.join(' ')
}

export function getInitials(name: string): string {
  if (!name) return 'ST'
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function formatProfileForHeader(profile: StaffProfile | null) {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Staff User',
    email: profile.email,
    role: 'teacher' as const,
    avatar: profile.photo_url,
    isAuthenticated: true
  }
}