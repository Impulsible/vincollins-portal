// lib/signOut.ts
import { supabase } from '@/lib/supabase'

export async function signOutAndRedirect() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut({ scope: 'local' })
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    // Clear all local storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`)
      })
      
      // Force redirect to portal - always happens
      window.location.replace('/portal')
    }
  }
}