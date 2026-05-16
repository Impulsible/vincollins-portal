// components/ConditionalHeader.tsx - FIXED HOOKS ORDER
'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { useUser } from '@/contexts/UserContext'
import { Loader2 } from 'lucide-react'
import type { HeaderUser } from '@/components/layout/header'

export function ConditionalHeader() {
  const pathname = usePathname()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()
  const [mounted, setMounted] = useState(false)

  // ✅ ALL hooks must be called before any conditional returns
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Build header user - call this hook BEFORE any conditional returns
  const headerUser: HeaderUser | undefined = useMemo(() => {
    if (!isAuthenticated || !contextUser) return undefined

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
  }, [isAuthenticated, contextUser])

  // ✅ Determine if header should be hidden - after hooks but before render logic
  const isExamPage = pathname?.startsWith('/student/exam/')
  const isExamListPage = pathname === '/student/exams'
  const authPages = ['/portal', '/admin/portal', '/forgot-password', '/reset-password']
  const isAuthPage = authPages.some(page => pathname?.startsWith(page))

  // ✅ NOW we can do conditional returns safely
  if (isExamPage && !isExamListPage) return null
  if (isAuthPage) return null

  // Show loading shell during auth check
  if (!mounted || authLoading) {
    return (
      <div className="h-[64px] sm:h-[72px] flex items-center justify-center bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
        <Loader2 className="h-5 w-5 animate-spin text-white/70" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="h-[64px] sm:h-[72px] flex items-center justify-center bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
        <Loader2 className="h-5 w-5 animate-spin text-white/70" />
      </div>
    }>
      <Header user={headerUser} />
    </Suspense>
  )
}