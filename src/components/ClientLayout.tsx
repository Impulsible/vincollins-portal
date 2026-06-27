// src/components/ClientLayout.tsx

'use client'

import { usePathname } from 'next/navigation'
import { Providers } from '@/components/providers'
import { UserProvider } from '@/contexts/UserContext'
import { ConditionalHeader } from '@/components/ConditionalHeader'
import { PWAProvider } from '@/components/PWAProvider'

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // ✅ Debug: Log the current path
  console.log('📍 ClientLayout - Current path:', pathname)

  // Student exam pages - hide header during active exam
  const isExamPage = pathname?.startsWith('/student/exam/')
  const isExamListPage = pathname === '/student/exams'
  const hideHeader = isExamPage && !isExamListPage

  // Auth pages - no header
  const authPages = ['/portal', '/admin/portal', '/forgot-password', '/reset-password']
  const isAuthPage = authPages.some(page => pathname?.startsWith(page))

  // ✅ Staff exam sub-routes - SHOULD show header
  const isStaffExamRoute = pathname?.startsWith('/staff/exams/')
  const shouldShowHeader = !hideHeader && !isAuthPage

  console.log('📍 ClientLayout - shouldShowHeader:', shouldShowHeader)

  return (
    <Providers>
      <PWAProvider>
        {shouldShowHeader && <ConditionalHeader />}
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </PWAProvider>
    </Providers>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </UserProvider>
  )
}