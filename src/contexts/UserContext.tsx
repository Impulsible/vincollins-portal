// src/contexts/UserContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ─── TYPES ───────────────────────────────────────────
interface UserProfile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
  avatar_url?: string
  photo_url?: string | null
  department?: string
  title?: string
  class?: string
  is_active?: boolean
}

interface UserContextType {
  user: UserProfile | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

// ─── CONSTANTS ───────────────────────────────────────
const AUTH_TIMEOUT = 5000 // 5 seconds timeout for auth operations

// ─── CONTEXT ─────────────────────────────────────────
const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Refs for preventing race conditions
  const fetchPromiseRef = useRef<Promise<any> | null>(null)
  const isMountedRef = useRef(true)
  const authTimeoutRef = useRef<NodeJS.Timeout>()

  // ─── Fetch User Profile ────────────────────────────
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
    }
  }, [])

  // ─── Load User ──────────────────────────────────────
  const loadUser = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchPromiseRef.current) {
      console.log('🔒 User fetch already in progress, reusing promise')
      return fetchPromiseRef.current
    }

    const fetchPromise = (async () => {
      try {
        console.log('🔄 Starting user fetch...')
        
        // Set timeout for auth check
        const timeoutPromise = new Promise((_, reject) => {
          authTimeoutRef.current = setTimeout(() => {
            reject(new Error('Auth check timeout'))
          }, AUTH_TIMEOUT)
        })

        // Get session with timeout
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as any

        // Clear timeout
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current)
        }

        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!session?.user) {
          console.log('No active session')
          if (isMountedRef.current) {
            setUser(null)
            setLoading(false)
          }
          return null
        }

        console.log('✅ Session found for:', session.user.email)

        // Fetch user profile
        const profile = await fetchUserProfile(session.user.id)
        
        if (!profile && isMountedRef.current) {
          console.error('No profile found for user:', session.user.id)
          setError('Profile not found')
          setLoading(false)
          return null
        }

        if (isMountedRef.current) {
          console.log('✅ Profile loaded:', profile?.full_name)
          setUser(profile)
          setError(null)
        }

        return profile
      } catch (err: any) {
        console.error('❌ Error loading user:', err.message)
        if (isMountedRef.current) {
          setError(err.message)
          setUser(null)
        }
        return null
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = fetchPromise
    return fetchPromise
  }, [fetchUserProfile])

  // ─── Refresh User ───────────────────────────────────
  const refreshUser = useCallback(async () => {
    setLoading(true)
    fetchPromiseRef.current = null // Clear cached promise
    await loadUser()
    if (isMountedRef.current) {
      toast.success('User data refreshed')
    }
  }, [loadUser])

  // ─── Sign Out ───────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out...')
      await supabase.auth.signOut()
      
      if (isMountedRef.current) {
        setUser(null)
        setError(null)
        toast.success('Signed out successfully')
      }
      
      // Redirect based on role
      router.replace('/portal')
    } catch (err: any) {
      console.error('Sign out error:', err)
      if (isMountedRef.current) {
        toast.error('Failed to sign out')
      }
    }
  }, [router])

  // ─── Auth State Listener ────────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    
    // Initial load
    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Auth event: ${event}`, session?.user?.email)

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in')
            await loadUser()
            break

          case 'SIGNED_OUT':
            console.log('🚪 User signed out')
            if (isMountedRef.current) {
              setUser(null)
              setLoading(false)
              router.replace('/portal')
            }
            break

          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed')
            // Don't reload user on token refresh to prevent flickering
            break

          case 'USER_UPDATED':
            console.log('👤 User updated')
            await loadUser()
            break

          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery')
            router.push('/reset-password')
            break

          default:
            console.log(`⚠️ Unhandled auth event: ${event}`)
            // For unknown events, verify session is still valid
            if (!session) {
              console.log('No session on unknown event, checking...')
              await loadUser()
            }
        }
      }
    )

    // Cleanup
    return () => {
      isMountedRef.current = false
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
      subscription.unsubscribe()
    }
  }, [loadUser, router])

  // ─── Value ──────────────────────────────────────────
  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default UserContext