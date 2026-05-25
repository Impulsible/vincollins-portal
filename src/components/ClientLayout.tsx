// components/ClientLayout.tsx - FIXED (No loading spinner)
'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Providers } from '@/components/providers'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { ConditionalHeader } from '@/components/ConditionalHeader'
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper'
import { Loader2 } from 'lucide-react'

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
          <ConditionalHeader />
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
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </Suspense>
    </UserProvider>
  )
}