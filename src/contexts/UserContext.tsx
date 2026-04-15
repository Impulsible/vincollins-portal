/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'teacher' | 'student' | 'staff'
  photo_url?: string
  class?: string
  department?: string
}

interface UserContextType {
  user: UserProfile | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUser(null)
        return
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        setUser(null)
        return
      }

      // First try to get profile from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profile) {
        setUser({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          photo_url: profile.photo_url,
          class: profile.class,
          department: profile.department,
        })
      } else {
        // If no profile exists, create one
        const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
        const newProfile = {
          id: authUser.id,
          full_name: fullName,
          email: authUser.email,
          role: 'student',
          created_at: new Date().toISOString(),
        }
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
        
        if (!insertError) {
          setUser({
            id: authUser.id,
            full_name: fullName,
            email: authUser.email || '',
            role: 'student',
          })
        } else {
          // Fallback to auth user data
          setUser({
            id: authUser.id,
            full_name: fullName,
            email: authUser.email || '',
            role: 'student',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}