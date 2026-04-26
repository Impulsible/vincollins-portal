'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Loader2 } from 'lucide-react'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide Header on CBT exam pages
  const isExamPage = pathname?.startsWith('/student/exam/')
  const isExamListPage = pathname === '/student/exams'
  
  // Show nothing on CBT exam, show Header on exam list and all other pages
  if (isExamPage && !isExamListPage) return null
  
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