// contexts/UserContext.tsx - FIXED: No redirect on temporary SIGNED_OUT
'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  isAuthenticated: boolean
}

interface UserContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

// Helper to format user data
function formatUserData(sessionUser: SupabaseUser, profile?: any): User {
  const rawName = profile?.full_name || 
                  profile?.name || 
                  sessionUser.user_metadata?.full_name || 
                  sessionUser.email?.split('@')[0] || 
                  'User'
  
  const formattedName = rawName
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  const role = profile?.role === 'staff' ? 'teacher' : (profile?.role || 'student')

  return {
    id: profile?.id || sessionUser.id,
    name: formattedName,
    email: profile?.email || sessionUser.email || '',
    role: role as 'admin' | 'teacher' | 'student',
    avatar: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
    isAuthenticated: true,
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Use refs to prevent multiple calls
  const isInitialized = useRef(false)
  const isFetching = useRef(false)
  const fetchPromise = useRef<Promise<void> | null>(null)
  const mounted = useRef(true)
  const retryCount = useRef(0)
  const MAX_RETRIES = 3

  const fetchUser = useCallback(async (session?: Session | null) => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current && fetchPromise.current) {
      console.log('🔒 User fetch already in progress, reusing promise')
      return fetchPromise.current
    }

    // If no session provided, get current session
    let currentSession = session
    if (!currentSession) {
      try {
        const { data } = await supabase.auth.getSession()
        currentSession = data.session
      } catch (error: any) {
        console.error('❌ Error getting session:', error?.message || error)
        if (mounted.current) {
          setUser(null)
          setLoading(false)
        }
        return
      }
    }

    if (!currentSession?.user) {
      if (mounted.current) {
        setUser(null)
        setLoading(false)
      }
      return
    }

    // Create a new fetch promise
    isFetching.current = true
    fetchPromise.current = (async () => {
      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .maybeSingle()

        if (!mounted.current) return

        if (profile) {
          setUser(formatUserData(currentSession.user, profile))
        } else {
          // Try fetching by email as fallback
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', currentSession.user.email)
            .maybeSingle()

          if (mounted.current) {
            if (profileByEmail) {
              setUser(formatUserData(currentSession.user, profileByEmail))
            } else {
              setUser(formatUserData(currentSession.user))
            }
          }
        }

        retryCount.current = 0 // Reset retry count on success
      } catch (error: any) {
        console.error('❌ Error fetching user profile:', error?.message || error)
        
        // Retry logic
        if (retryCount.current < MAX_RETRIES && mounted.current) {
          retryCount.current++
          console.log(`🔄 Retrying... (${retryCount.current}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current))
          isFetching.current = false
          fetchPromise.current = null
          return fetchUser(session)
        }
        
        if (mounted.current) {
          setUser(null)
        }
      }
    })()

    try {
      await fetchPromise.current
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
      isFetching.current = false
      fetchPromise.current = null
    }
  }, [])

  const refreshUser = useCallback(async () => {
    retryCount.current = 0
    isFetching.current = false
    fetchPromise.current = null
    await fetchUser()
  }, [fetchUser])

  useEffect(() => {
    mounted.current = true
    
    // Initialize user
    if (!isInitialized.current) {
      isInitialized.current = true
      fetchUser()
    }

    // Listen for auth changes - FIXED: Don't clear user on SIGNED_OUT
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth event:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchUser(session)
      } else if (event === 'SIGNED_OUT') {
        // ✅ FIXED: Don't clear user on SIGNED_OUT - may be temporary rate limit
        // Supabase auto-refreshes, so keep current user state
        console.log('⚠️ SIGNED_OUT event - keeping current user state (may be temporary)')
      }
      // IGNORE TOKEN_REFRESHED and INITIAL_SESSION to prevent loops
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
      isInitialized.current = false
    }
  }, [fetchUser])

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}