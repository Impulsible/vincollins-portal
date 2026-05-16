// components/ClientLayout.tsx
'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Providers } from '@/components/providers'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { ConditionalHeader } from '@/components/ConditionalHeader'
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper'
import { Loader2 } from 'lucide-react'

function HeaderShell() {
  return (
    <div className="h-[64px] sm:h-[72px] flex items-center justify-center bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
      <Loader2 className="h-5 w-5 animate-spin text-white/70" />
    </div>
  )
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading, isAuthenticated } = useUser()
  const [authResolved, setAuthResolved] = useState(false)
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (!loading && !initialLoadDone.current) {
      initialLoadDone.current = true
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        setAuthResolved(true)
      })
    }
  }, [loading])

  // Pages that shouldn't show header
  const isExamPage = pathname?.startsWith('/student/exam/')
  const isExamListPage = pathname === '/student/exams'
  const hideHeader = isExamPage && !isExamListPage

  // Auth pages that shouldn't show header
  const authPages = ['/portal', '/admin/portal', '/forgot-password', '/reset-password']
  const isAuthPage = authPages.some(page => pathname?.startsWith(page))

  const shouldShowHeader = !hideHeader && !isAuthPage

  return (
    <Providers>
      {shouldShowHeader && (
        <div className="transition-opacity duration-300">
          {!authResolved ? (
            <HeaderShell />
          ) : (
            <ConditionalHeader />
          )}
        </div>
      )}
      
      <GlobalLoadingWrapper>
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </GlobalLoadingWrapper>
    </Providers>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </Suspense>
    </UserProvider>
  )
}