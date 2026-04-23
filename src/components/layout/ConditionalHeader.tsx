// src/components/layout/ConditionalHeader.tsx
'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Loader2 } from 'lucide-react'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide header on these routes
  const hiddenRoutes = ['/staff', '/admin', '/student/exam', '/portal']
  const shouldShowHeader = !hiddenRoutes.some(route => pathname?.startsWith(route))
  
  if (!shouldShowHeader) return null
  
  return (
    <Suspense fallback={
      <div className="h-16 flex items-center justify-center bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
    }>
      <Header />
    </Suspense>
  )
}