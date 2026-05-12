// lib/auth-utils.ts
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