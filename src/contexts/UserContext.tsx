// src/contexts/UserContext.tsx - COMPLETE FIXED VERSION WITH NO .catch() ERROR
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
const AUTH_TIMEOUT_MS = 15000
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
  const isBackgroundRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const authStartedRef = useRef(false)

  useEffect(() => {
    userRef.current = user
    if (user && isMountedRef.current) {
      localStorage.setItem('auth_user', JSON.stringify({ id: user.id, role: user.role }))
      localStorage.setItem('user_profile', JSON.stringify(user))
    } else if (!user && isMountedRef.current) {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('user_profile')
    }
  }, [user])

  // Auth timeout protection
  useEffect(() => {
    if (loading && authStartedRef.current) {
      authTimeoutRef.current = setTimeout(() => {
        if (loading && isMountedRef.current && !initialLoadDoneRef.current) {
          console.warn('Auth is taking longer than expected, but continuing to wait...')
        }
      }, AUTH_TIMEOUT_MS)
    }

    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
    }
  }, [loading])

  // Track when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden
      isBackgroundRef.current = isHidden
      
      if (isHidden) {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
          heartbeatRef.current = undefined
        }
      } else {
        console.log('App returned to foreground - no auto refresh performed')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // ✅ FIXED: No .catch() - using async/await instead
  const setOnlineStatus = useCallback(async (userId: string, online: boolean) => {
    if (userId === ADMIN_USER_ID) return
    if (isBackgroundRef.current && !online) return
    
    const now = new Date().toISOString()
    try {
      await supabase
        .from('user_online_status')
        .upsert({
          user_id: userId,
          is_online: online,
          last_seen: now,
          updated_at: now,
        }, { onConflict: 'user_id' })
    } catch (error) {
      // Silently fail - don't log to avoid console spam
    }
  }, [])

  const startHeartbeat = useCallback((userId: string) => {
    if (userId === ADMIN_USER_ID) return
    if (isBackgroundRef.current) return
    
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    heartbeatRef.current = setInterval(() => {
      if (!isBackgroundRef.current && userRef.current?.id === userId) {
        setOnlineStatus(userId, true)
      }
    }, 120000)
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
        if (error.code !== 'PGRST116') {
          console.error('Profile fetch error:', error)
        }
        return null
      }
      return data as UserProfile
    } catch (err) {
      return null
    }
  }, [])

  const loadUser = useCallback(async () => {
    if (fetchPromiseRef.current) return fetchPromiseRef.current

    authStartedRef.current = true
    
    const fetchPromise = (async () => {
      try {
        // Show cached profile immediately if available
        const cachedProfile = localStorage.getItem('user_profile')
        if (cachedProfile && !initialLoadDoneRef.current) {
          try {
            const cached = JSON.parse(cachedProfile)
            if (cached && cached.id) {
              setUser(cached)
            }
          } catch (e) {
            // Invalid cache, ignore
          }
        }
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
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
            localStorage.removeItem('user_profile')
          }
          return null
        }

        const profile = await fetchUserProfile(session.user.id)
        const userId = profile?.id || session.user.id

        if (userId !== ADMIN_USER_ID && !isBackgroundRef.current) {
          await setOnlineStatus(userId, true)
          startHeartbeat(userId)
        }

        let finalProfile: UserProfile
        if (!profile) {
          finalProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'User',
            email: session.user.email,
            role: session.user.user_metadata?.role || 'student',
          }
        } else {
          finalProfile = profile
        }

        if (isMountedRef.current) { 
          setUser(finalProfile)
          setError(null)
          initialLoadDoneRef.current = true
          setLoading(false)
        }
        return finalProfile
      } catch (err: any) {
        if (!err?.message?.includes('lock') && !err?.message?.includes('Lock')) {
          console.error('Error loading user:', err)
        }
        if (isMountedRef.current) {
          setError(err.message)
          setLoading(false)
        }
        return null
      } finally {
        fetchPromiseRef.current = null
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current)
        }
      }
    })()

    fetchPromiseRef.current = fetchPromise
    return fetchPromise
  }, [fetchUserProfile, setOnlineStatus, startHeartbeat])

  const refreshUser = useCallback(async () => {
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current
    
    if (isBackgroundRef.current) {
      console.log('App in background, skipping refresh')
      return
    }
    
    if (timeSinceLastRefresh < 10000) {
      console.log('Rate limiting refresh, skipping...')
      return
    }
    
    lastRefreshTimeRef.current = now
    fetchPromiseRef.current = null
    await loadUser()
  }, [loadUser])

  const signOut = useCallback(() => {
    const currentUser = userRef.current
    
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
    
    supabase.auth.signOut()
    
    window.location.replace('/portal')
  }, [setOnlineStatus, stopHeartbeat])

  // Initialize ONLY ONCE on mount
  useEffect(() => {
    if (fetchPromiseRef.current) return
    if (initialLoadDoneRef.current) return
    
    isMountedRef.current = true
    
    // Load user
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          return
        }
        
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in')
          if (!userRef.current && session?.user) {
            await loadUser()
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          stopHeartbeat()
          setUser(null)
          setLoading(false)
          localStorage.removeItem('auth_user')
          localStorage.removeItem('user_profile')
          initialLoadDoneRef.current = false
        } else if (event === 'USER_UPDATED') {
          console.log('📝 User updated')
          await refreshUser()
        } else if (event === 'INITIAL_SESSION') {
          if (!userRef.current && session?.user && !initialLoadDoneRef.current) {
            await loadUser()
          }
        }
      }
    )

    return () => {
      isMountedRef.current = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
      stopHeartbeat()
      subscription.unsubscribe()
    }
  }, [loadUser, stopHeartbeat, refreshUser])

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