// src/contexts/UserContext.tsx - FINAL FIXED
'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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
const AUTH_TIMEOUT = 15000

// ─── CONTEXT ─────────────────────────────────────────
const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPromiseRef = useRef<Promise<any> | null>(null)
  const isMountedRef = useRef(true)
  const authTimeoutRef = useRef<NodeJS.Timeout>()
  const initialLoadDoneRef = useRef(false)

  // ─── Fetch User Profile ────────────────────────────
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No profile found')
          return null
        }
        throw error
      }
      return data as UserProfile
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
    }
  }, [])

  // ─── Load User ──────────────────────────────────────
  const loadUser = useCallback(async () => {
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current
    }

    const fetchPromise = (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session?.user) {
          if (isMountedRef.current) {
            setUser(null)
            setLoading(false)
          }
          return null
        }

        const profilePromise = fetchUserProfile(session.user.id)
        const timeoutPromise = new Promise<null>((_, reject) => {
          authTimeoutRef.current = setTimeout(() => {
            reject(new Error('Profile fetch timeout'))
          }, AUTH_TIMEOUT)
        })

        const profile = await Promise.race([profilePromise, timeoutPromise])

        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current)
        }

        if (!profile) {
          const basicProfile: UserProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            role: session.user.user_metadata?.role || 'student',
          }
          
          if (isMountedRef.current) {
            setUser(basicProfile)
            setError(null)
            setLoading(false)
          }
          return basicProfile
        }

        if (isMountedRef.current) {
          setUser(profile)
          setError(null)
          setLoading(false)
        }

        return profile
      } catch (err: any) {
        console.error('Error loading user:', err.message)
        if (isMountedRef.current) {
          setLoading(false)
        }
        return null
      } finally {
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = fetchPromise
    return fetchPromise
  }, [fetchUserProfile])

  // ─── Refresh User ───────────────────────────────────
  const refreshUser = useCallback(async () => {
    setLoading(true)
    fetchPromiseRef.current = null
    await loadUser()
  }, [loadUser])

  // ─── Sign Out (IMMEDIATE REDIRECT) ──────────────────
  const signOut = useCallback(async () => {
    try {
      // Clear state immediately
      setUser(null)
      setError(null)
      setLoading(false)
      
      // Sign out from Supabase (fire and forget)
      supabase.auth.signOut().catch(console.error)
      
      // Immediate hard redirect - don't wait for anything
      window.location.href = '/portal'
      
    } catch (err: any) {
      console.error('Sign out error:', err)
      window.location.href = '/portal'
    }
  }, [])

  // ─── Auth State Listener ────────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      loadUser()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return

        switch (event) {
          case 'SIGNED_IN':
            await loadUser()
            break

          case 'SIGNED_OUT':
            setUser(null)
            setLoading(false)
            window.location.href = '/portal'
            break

          case 'TOKEN_REFRESHED':
            break

          case 'USER_UPDATED':
            await loadUser()
            break

          case 'PASSWORD_RECOVERY':
            window.location.href = '/reset-password'
            break
        }
      }
    )

    return () => {
      isMountedRef.current = false
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
      subscription.unsubscribe()
    }
  }, [loadUser])

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