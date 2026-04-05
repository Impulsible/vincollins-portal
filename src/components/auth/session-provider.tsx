/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface SessionContextType {
  user: any
  userRole: string | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
})

export const useSession = () => useContext(SessionContext)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkSession()
  }, [pathname])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        
        // Get user role from database
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', session.user.id)
          .single()
        
        setUserRole(userData?.role || null)
      } else {
        setUser(null)
        setUserRole(null)
      }
    } catch (error) {
      console.error('Session error:', error)
      setUser(null)
      setUserRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    router.push('/portal')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SessionContext.Provider value={{ user, userRole, isLoading, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}