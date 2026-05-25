// components/AuthGuard.tsx - NO LOADING SPINNER (Instant redirect, no skeleton)
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export function AuthGuard({ children, allowedRoles, redirectTo = '/portal' }: AuthGuardProps) {
  const { user, loading: userLoading, refreshUser } = useUser()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const checkDoneRef = useRef(false)

  // Direct Supabase check as backup (only once)
  useEffect(() => {
    if (checkDoneRef.current) return
    
    const checkDirectAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          const role = profile?.role?.toLowerCase() || 
                       session.user.user_metadata?.role?.toLowerCase() || 
                       'student'
          const mappedRole = role === 'staff' ? 'teacher' : role
          
          if (!user && refreshUser && !checkDoneRef.current) {
            await refreshUser()
          }
        }
      } catch (error) {
        console.error('AuthGuard direct check error:', error)
      } finally {
        if (!checkDoneRef.current) {
          checkDoneRef.current = true
        }
      }
    }
    
    checkDirectAuth()
  }, [user, refreshUser])

  // Handle redirects (only once) - NO LOADING STATE
  useEffect(() => {
    if (hasRedirected.current) return
    
    // Wait for auth to be ready
    if (userLoading) return

    const effectiveAuth = user ? {
      isAuthenticated: true,
      role: user.role?.toLowerCase()
    } : null

    if (!effectiveAuth?.isAuthenticated) {
      hasRedirected.current = true
      router.replace(redirectTo)
      return
    }

    const userRole = effectiveAuth.role || ''
    if (!allowedRoles.includes(userRole)) {
      hasRedirected.current = true
      router.replace(redirectTo)
      return
    }
    
    // Access granted - render children immediately
    hasRedirected.current = true
  }, [userLoading, user, allowedRoles, redirectTo, router])

  // ✅ NO LOADING SPINNER - Return null while checking (no skeleton)
  // This prevents the "Loading your learning experience" from appearing
  
  // If still loading, return null (nothing renders)
  if (userLoading) {
    return null
  }

  // Check if authenticated
  const effectiveAuth = user ? {
    isAuthenticated: true,
    role: user.role?.toLowerCase()
  } : null

  if (!effectiveAuth?.isAuthenticated) {
    return null
  }

  const userRole = effectiveAuth.role || ''
  if (!allowedRoles.includes(userRole)) {
    return null
  }

  return <>{children}</>
}