/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-anonymous-default-export */
// lib/auth.ts
import { supabase } from './supabase'

export interface UserSession {
  id: string
  email: string
  role: string
  vin_id: string
  full_name?: string
  admission_year?: string
}

/**
 * Get the current user session from localStorage
 */
export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const sessionStr = localStorage.getItem('user_session')
    if (!sessionStr) {
      return null
    }

    const session = JSON.parse(sessionStr)
    
    // Validate session has required fields
    if (!session.id || !session.email || !session.role) {
      console.warn('⚠️ Invalid session data, clearing...')
      clearSession()
      return null
    }

    return session
  } catch (err) {
    console.error('❌ Error parsing session:', err)
    clearSession()
    return null
  }
}

/**
 * Set user session in localStorage and cookie
 */
export function setUserSession(userData: UserSession): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const sessionStr = JSON.stringify(userData)
    
    // Store in localStorage
    localStorage.setItem('user_session', sessionStr)
    
    // Store in cookie for middleware
    document.cookie = `user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=86400; SameSite=Lax`
    
    console.log('✅ Session stored for:', userData.email)
  } catch (err) {
    console.error('❌ Error setting session:', err)
  }
}

/**
 * Clear user session (logout)
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Clear localStorage
    localStorage.removeItem('user_session')
    
    // Clear cookie
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    console.log('✅ Session cleared')
  } catch (err) {
    console.error('❌ Error clearing session:', err)
  }
}

/**
 * Logout user (clear session and sign out from Supabase)
 */
export async function logout(): Promise<void> {
  try {
    // Clear custom session
    clearSession()
    
    // Sign out from Supabase (ignore errors)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.log('ℹ️ Supabase sign out skipped')
    }
    
    console.log('✅ Logout complete')
  } catch (err) {
    console.error('❌ Error during logout:', err)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getUserSession() !== null
}

/**
 * Check if user has specific role
 */
export function hasRole(requiredRole: string | string[]): boolean {
  const session = getUserSession()
  if (!session) {
    return false
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(session.role)
}

/**
 * Get user role
 */
export function getUserRole(): string | null {
  const session = getUserSession()
  return session?.role || null
}

/**
 * Refresh session data from database
 */
export async function refreshSession(): Promise<UserSession | null> {
  const session = getUserSession()
  if (!session) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.email)
      .maybeSingle()

    if (error || !data) {
      console.error('❌ Failed to refresh session:', error?.message)
      return session // Return existing session as fallback
    }

    const refreshedSession: UserSession = {
      id: data.id,
      email: data.email,
      role: data.role,
      vin_id: data.vin_id,
      full_name: data.full_name,
      admission_year: data.admission_year
    }

    setUserSession(refreshedSession)
    return refreshedSession
  } catch (err) {
    console.error('❌ Error refreshing session:', err)
    return session
  }
}

/**
 * Get auth header for API requests
 */
export function getAuthHeader(): Record<string, string> {
  const session = getUserSession()
  if (!session) {
    return {}
  }

  return {
    'X-User-Id': session.id,
    'X-User-Role': session.role,
    'X-User-Email': session.email
  }
}

// Export default for convenience
export default {
  getUserSession,
  setUserSession,
  clearSession,
  logout,
  isAuthenticated,
  hasRole,
  getUserRole,
  refreshSession,
  getAuthHeader
}