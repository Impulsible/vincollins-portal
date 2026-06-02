// components/ClientLayout.tsx - UPDATED WITH CACHE PREVENTION
'use client'

import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Providers } from '@/components/providers'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { ConditionalHeader } from '@/components/ConditionalHeader'
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper'
import { Loader2 } from 'lucide-react'
import { clearExpiredCache, bustCache } from '@/lib/cache-buster'

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // ✅ Cache prevention on route change
  useEffect(() => {
    // Clear expired cache when entering dashboard pages
    if (pathname?.startsWith('/admin') || 
        pathname?.startsWith('/staff') || 
        pathname?.startsWith('/student')) {
      clearExpiredCache()
    }
  }, [pathname])

  // ✅ Prevent back/forward cache issues
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

  // ✅ Handle online/offline recovery
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online - refreshing...')
      setTimeout(() => window.location.reload(), 500)
    }
    
    window.addEventListener('online', handleOnline)
    
    return () => window.removeEventListener('online', handleOnline)
  }, [])

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
  // ✅ Initial cache cleanup on app start
  useEffect(() => {
    // Clear expired cache once per session
    clearExpiredCache()
    
    // Optional: Enable cache busting for all fetch requests
    if (process.env.NODE_ENV === 'production') {
      bustCache()
    }
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