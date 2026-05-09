// src/contexts/UserContext.tsx - OPTIMIZED
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

const AUTH_TIMEOUT = 8000 // ✅ Reduced from 15000
const ADMIN_USER_ID = 'a799693c-97c7-4f8d-baca-82242a98a00c'
const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPromiseRef = useRef<Promise<any> | null>(null)
  const isMountedRef = useRef(true)
  const authTimeoutRef = useRef<NodeJS.Timeout>()
  const initialLoadDoneRef = useRef(false)
  const heartbeatRef = useRef<NodeJS.Timeout>()
  const userRef = useRef<UserProfile | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const setOnlineStatus = useCallback((userId: string, online: boolean) => {
    if (userId === ADMIN_USER_ID) return
    
    const now = new Date().toISOString()
    supabase
      .from('user_online_status')
      .upsert({
        user_id: userId,
        is_online: online,
        last_seen: now,
        updated_at: now,
      }, { onConflict: 'user_id' })
      .then(() => console.log(online ? '🟢 Online:' : '🔴 Offline:', userId), () => {}) // Silently ignore errors
  }, [])

  // ─── Heartbeat ──────────────────────────────────
  const startHeartbeat = useCallback((userId: string) => {
    if (userId === ADMIN_USER_ID) return
    
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    heartbeatRef.current = setInterval(() => {
      setOnlineStatus(userId, true)
    }, 30000)
  }, [setOnlineStatus])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = undefined
    }
  }, [])

  // ─── Fetch Profile ────────────────────────────
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data as UserProfile
    } catch (err) {
      return null
    }
  }, [])

  // ─── Load User ────────────────────────────────
  const loadUser = useCallback(async () => {
    if (fetchPromiseRef.current) return fetchPromiseRef.current

    const fetchPromise = (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session?.user) {
          if (isMountedRef.current) { setUser(null); setLoading(false) }
          return null
        }

        const profile = await fetchUserProfile(session.user.id)
        const userId = profile?.id || session.user.id

        setOnlineStatus(userId, true)
        startHeartbeat(userId)

        if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current)

        if (!profile) {
          const basicProfile: UserProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'User',
            email: session.user.email,
            role: session.user.user_metadata?.role || 'student',
          }
          if (isMountedRef.current) { setUser(basicProfile); setError(null); setLoading(false) }
          return basicProfile
        }

        if (isMountedRef.current) { setUser(profile); setError(null); setLoading(false) }
        return profile
      } catch (err: any) {
        if (isMountedRef.current) setLoading(false)
        return null
      } finally {
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = fetchPromise
    return fetchPromise
  }, [fetchUserProfile, setOnlineStatus, startHeartbeat])

  // ─── Refresh ──────────────────────────────────
  const refreshUser = useCallback(async () => {
    setLoading(true)
    fetchPromiseRef.current = null
    await loadUser()
  }, [loadUser])

  // ─── Sign Out - INSTANT ───────────────────────
  const signOut = useCallback(() => {
    // ✅ IMMEDIATE redirect - user sees portal instantly
    window.location.href = '/portal'
    
    // ✅ Cleanup in background (fire and forget)
    const currentUser = userRef.current
    if (currentUser?.id) {
      setOnlineStatus(currentUser.id, false)
    }
    stopHeartbeat()
    window.dispatchEvent(new Event('student-logout'))
    supabase.auth.signOut().catch(() => {})
    
    // Clear state
    setUser(null)
    setError(null)
    setLoading(false)
  }, [setOnlineStatus, stopHeartbeat])

  // ─── Auth State Listener ──────────────────────
  useEffect(() => {
    isMountedRef.current = true
    
    // ✅ Add loading timeout - never stuck more than 8 seconds
    const loadingTimeout = setTimeout(() => {
      if (loading && isMountedRef.current) {
        console.warn('⚠️ Initial load timed out, showing app')
        setLoading(false)
      }
    }, 8000)

    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      loadUser()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              const profile = await fetchUserProfile(session.user.id)
              const userId = profile?.id || session.user.id
              setOnlineStatus(userId, true)
              startHeartbeat(userId)
            }
            await loadUser()
            break

          case 'SIGNED_OUT':
            stopHeartbeat()
            const currentUser = userRef.current
            if (currentUser?.id) setOnlineStatus(currentUser.id, false)
            setUser(null)
            setLoading(false)
            window.location.href = '/portal'
            break

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              const profile = await fetchUserProfile(session.user.id)
              const userId = profile?.id || session.user.id
              setOnlineStatus(userId, true)
            }
            break

          case 'USER_UPDATED':
            await loadUser()
            break
        }
      }
    )

    return () => {
      isMountedRef.current = false
      clearTimeout(loadingTimeout)
      stopHeartbeat()
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current)
      subscription.unsubscribe()
    }
  }, [loadUser, setOnlineStatus, startHeartbeat, stopHeartbeat, fetchUserProfile, loading])

  const value: UserContextType = {
    user, loading, error, refreshUser, signOut,
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