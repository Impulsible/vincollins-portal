// app/client-layout.tsx - REMOVED ConditionalHeader import
'use client'

import { Suspense } from 'react'
import { UserProvider } from '@/contexts/UserContext'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header' // Use regular Header
import { Loader2 } from 'lucide-react'
import { ProgressBar } from '@/components/ProgressBar'
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProgressBar />
      <UserProvider>
        <Providers>
          <Suspense fallback={
            <div className="h-16 flex items-center justify-center bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          }>
            <Header />
          </Suspense>
          <GlobalLoadingWrapper>
            <div className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </GlobalLoadingWrapper>
        </Providers>
      </UserProvider>
    </>
  )
}