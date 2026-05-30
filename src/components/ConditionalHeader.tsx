// components/ConditionalHeader.tsx - OPTIMIZED FOR SPEED (No delays)
'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { useUser } from '@/contexts/UserContext'
import type { HeaderUser } from '@/components/layout/header'

export function ConditionalHeader() {
  const pathname = usePathname()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Build header user from context or cached data
  const headerUser: HeaderUser | undefined = useMemo(() => {
    // If we have context user, use it
    if (isAuthenticated && contextUser) {
      const displayName = contextUser.full_name || contextUser.first_name || 'User'
      const nameParts = displayName.split(' ')
      const firstName = nameParts.length >= 2 ? nameParts[1] : nameParts[0]
      
      const role = contextUser.role?.toLowerCase()
      let mappedRole: 'admin' | 'teacher' | 'student'
      
      if (role === 'admin') mappedRole = 'admin'
      else if (role === 'staff' || role === 'teacher') mappedRole = 'teacher'
      else mappedRole = 'student'

      return {
        id: contextUser.id,
        name: displayName,
        firstName,
        email: contextUser.email || '',
        role: mappedRole,
        avatar: contextUser.avatar_url || contextUser.photo_url || undefined,
        isAuthenticated: true
      }
    }
    
    // ✅ Fallback: Try to get cached user for faster display
    if (typeof window !== 'undefined' && !contextUser) {
      const cachedProfile = localStorage.getItem('user_profile')
      if (cachedProfile) {
        try {
          const cached = JSON.parse(cachedProfile)
          if (cached && cached.id) {
            const displayName = cached.full_name || cached.first_name || 'User'
            const nameParts = displayName.split(' ')
            const firstName = nameParts.length >= 2 ? nameParts[1] : nameParts[0]
            
            let mappedRole: 'admin' | 'teacher' | 'student' = 'student'
            const role = cached.role?.toLowerCase()
            if (role === 'admin') mappedRole = 'admin'
            else if (role === 'staff' || role === 'teacher') mappedRole = 'teacher'
            
            return {
              id: cached.id,
              name: displayName,
              firstName,
              email: cached.email || '',
              role: mappedRole,
              avatar: cached.avatar_url || cached.photo_url || undefined,
              isAuthenticated: true
            }
          }
        } catch (e) {
          // Invalid cache
        }
      }
    }
    
    return undefined
  }, [isAuthenticated, contextUser])

  // ✅ Determine if header should be hidden
  const isExamPage = pathname?.startsWith('/student/exam/') && !pathname?.startsWith('/student/exams')
  const isAuthPage = ['/portal', '/admin/portal', '/forgot-password', '/reset-password'].some(
    page => pathname?.startsWith(page)
  )
  const shouldHideHeader = isExamPage || isAuthPage

  // ✅ Don't render anything on pages where header should be hidden
  if (!mounted || shouldHideHeader) {
    return null
  }

  // ✅ Show header immediately - use cached data if available
  // The Header component will handle its own loading states
  return (
    <Suspense fallback={
      <div className="h-[64px] sm:h-[72px] bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
          <div className="hidden lg:flex gap-4">
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white/20 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    }>
      <Header user={headerUser} />
    </Suspense>
  )
}