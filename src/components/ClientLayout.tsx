// components/ClientLayout.tsx - Remove bustCache call
'use client'

import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Providers } from '@/components/providers'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { ConditionalHeader } from '@/components/ConditionalHeader'
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper'
import { Loader2 } from 'lucide-react'
import { clearExpiredCache } from '@/lib/cache-buster'  // ✅ Only import clearExpiredCache

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname?.startsWith('/admin') || 
        pathname?.startsWith('/staff') || 
        pathname?.startsWith('/student')) {
      clearExpiredCache()
    }
  }, [pathname])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('Page restored from bfcache - reloading...')
        window.location.reload()
      }
    }
    
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online - refreshing...')
      setTimeout(() => window.location.reload(), 500)
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const isExamPage = pathname?.startsWith('/student/exam/')
  const isExamListPage = pathname === '/student/exams'
  const hideHeader = isExamPage && !isExamListPage

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
  // ✅ Only clear cache - NO bustCache() call
  useEffect(() => {
    clearExpiredCache()
  }, [])

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