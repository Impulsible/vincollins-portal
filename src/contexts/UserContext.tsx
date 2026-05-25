// src/contexts/UserContext.tsx - FULLY CORRECTED VERSION
'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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
  signOut: () => void
  isAuthenticated: boolean
}

const ADMIN_USER_ID = 'a799693c-97c7-4f8d-baca-82242a98a00c'
const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPromiseRef = useRef<Promise<any> | null>(null)
  const isMountedRef = useRef(true)
  const heartbeatRef = useRef<NodeJS.Timeout>()
  const userRef = useRef<UserProfile | null>(null)
  const lastRefreshTimeRef = useRef(0)
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    userRef.current = user
    if (user && isMountedRef.current) {
      localStorage.setItem('auth_user', JSON.stringify({ id: user.id, role: user.role }))
    } else if (!user && isMountedRef.current) {
      localStorage.removeItem('auth_user')
    }
  }, [user])

  const setOnlineStatus = useCallback((userId: string, online: boolean) => {
    if (userId === ADMIN_USER_ID) return
    
    const now = new Date().toISOString()
    // ✅ Fixed: No .match(), use void to ignore promise
    void supabase
      .from('user_online_status')
      .upsert({
        user_id: userId,
        is_online: online,
        last_seen: now,
        updated_at: now,
      }, { onConflict: 'user_id' })
  }, [])

  const startHeartbeat = useCallback((userId: string) => {
    if (userId === ADMIN_USER_ID) return
    
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    heartbeatRef.current = setInterval(() => {
      setOnlineStatus(userId, true)
    }, 60000)
  }, [setOnlineStatus])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = undefined
    }
  }, [])

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }
      return data as UserProfile
    } catch (err) {
      console.error('Profile fetch exception:', err)
      return null
    }
  }, [])

  const loadUser = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (fetchPromiseRef.current) return fetchPromiseRef.current

    const fetchPromise = (async () => {
      try {
        setLoading(true)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (isMountedRef.current) { 
            setUser(null)
            setLoading(false)
          }
          return null
        }

        if (!session?.user) {
          if (isMountedRef.current) { 
            setUser(null)
            setLoading(false)
            localStorage.removeItem('auth_user')
          }
          return null
        }

        const profile = await fetchUserProfile(session.user.id)
        const userId = profile?.id || session.user.id

        // Only update online status if not admin
        if (userId !== ADMIN_USER_ID) {
          setOnlineStatus(userId, true)
          startHeartbeat(userId)
        }

        if (!profile) {
          const basicProfile: UserProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'User',
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
        console.error('Error loading user:', err)
        if (isMountedRef.current) {
          setError(err.message)
          setLoading(false)
        }
        return null
      } finally {
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = fetchPromise
    return fetchPromise
  }, [fetchUserProfile, setOnlineStatus, startHeartbeat])

  const refreshUser = useCallback(async () => {
    // Rate limiting: minimum 5 seconds between refreshes
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current
    
    if (timeSinceLastRefresh < 5000) {
      console.log('Rate limiting refresh, skipping...')
      return
    }
    
    lastRefreshTimeRef.current = now
    fetchPromiseRef.current = null
    await loadUser()
  }, [loadUser])

  const signOut = useCallback(() => {
    const currentUser = userRef.current
    
    // Clear all timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    if (currentUser?.id && currentUser.id !== ADMIN_USER_ID) {
      setOnlineStatus(currentUser.id, false)
    }
    stopHeartbeat()
    
    localStorage.clear()
    sessionStorage.clear()
    
    setUser(null)
    setError(null)
    setLoading(false)
    
    // Sign out from Supabase without waiting
    void supabase.auth.signOut().catch(() => {})
    
    // Hard redirect
    window.location.replace('/portal')
  }, [setOnlineStatus, stopHeartbeat])

  useEffect(() => {
    isMountedRef.current = true
    
    // Load user with a small delay to prevent race conditions
    const timer = setTimeout(() => {
      loadUser()
    }, 100)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event)
        
        // Ignore TOKEN_REFRESHED events completely
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔑 Token refreshed (ignoring to prevent rate limits)')
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in, loading profile...')
          await loadUser()
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          stopHeartbeat()
          setUser(null)
          setLoading(false)
          localStorage.removeItem('auth_user')
        } else if (event === 'USER_UPDATED') {
          await refreshUser()
        } else if (event === 'INITIAL_SESSION') {
          console.log('📦 Initial session loaded')
          // Only load if we don't have a user yet
          if (!userRef.current) {
            await loadUser()
          }
        }
      }
    )

    return () => {
      clearTimeout(timer)
      isMountedRef.current = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      stopHeartbeat()
      subscription.unsubscribe()
    }
  }, [loadUser, refreshUser, stopHeartbeat])

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

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) throw new Error('useUser must be used within a UserProvider')
  return context
}

export default UserContext