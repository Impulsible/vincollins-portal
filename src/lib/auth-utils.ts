// lib/auth-utils.ts - COMPLETE WITH CACHED AUTH STATE
import { supabase } from '@/lib/supabase'

let isSigningOut = false

export function instantLogout() {
  if (isSigningOut) {
    return
  }
  isSigningOut = true

  // Clear storage immediately
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // Silently fail
  }

  // Hard redirect - nothing can override this
  window.location.replace('/portal')

  // Background cleanup
  setTimeout(() => {
    supabase.auth.signOut().catch(() => {})
    isSigningOut = false
  }, 1000)
}

// ✅ Add this function for synchronous auth state checking
export interface CachedAuthState {
  isAuthenticated: boolean
  user: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
    email?: string
    role?: string
    avatar_url?: string
    photo_url?: string | null
    class?: string
  } | null
}

export function getCachedAuthState(): CachedAuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null }
  }
  
  const cachedProfile = localStorage.getItem('user_profile')
  if (!cachedProfile) {
    return { isAuthenticated: false, user: null }
  }
  
  try {
    const profile = JSON.parse(cachedProfile)
    if (profile && profile.id) {
      return {
        isAuthenticated: true,
        user: {
          id: profile.id,
          full_name: profile.full_name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          role: profile.role,
          avatar_url: profile.avatar_url,
          photo_url: profile.photo_url,
          class: profile.class,
        }
      }
    }
  } catch (e) {
    // Invalid cache
    return { isAuthenticated: false, user: null }
  }
  
  return { isAuthenticated: false, user: null }
}

// ✅ Helper to get cached user for header (synchronous)
export function getCachedHeaderUser() {
  const { isAuthenticated, user } = getCachedAuthState()
  if (!isAuthenticated || !user) return null
  
  const displayName = user.full_name || user.first_name || 'User'
  const nameParts = displayName.split(' ')
  const firstName = nameParts.length >= 2 ? nameParts[1] : nameParts[0]
  
  let role: 'admin' | 'teacher' | 'student' = 'student'
  const userRole = user.role?.toLowerCase()
  if (userRole === 'admin') role = 'admin'
  else if (userRole === 'staff' || userRole === 'teacher') role = 'teacher'
  
  return {
    id: user.id,
    name: displayName,
    firstName,
    email: user.email || '',
    role,
    avatar: user.avatar_url || user.photo_url || undefined,
    isAuthenticated: true
  }
}