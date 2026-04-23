// app/staff/results/page.tsx - FIXED LAYOUT
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ResultsTab } from '@/components/staff/results/ResultsTab'
import { useStaffAuth } from '@/components/staff/hooks/useStaffAuth'
import { useTermSettings } from '@/components/staff/hooks/useTermSettings'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/staff/dashboard/DashboardSkeleton'
import { MobileBottomNav } from '@/components/staff/navigation/MobileBottomNav'
import { useStaffContext } from '@/app/staff/layout'

export default function ResultsPage() {
  const router = useRouter()
  
  const { profile, loading: authLoading } = useStaffAuth()
  const { termInfo } = useTermSettings()
  const { sidebarCollapsed } = useStaffContext()

  const handleTabChange = (tab: string) => {
    router.push(`/staff/${tab === 'overview' ? '' : tab}`)
  }

  if (authLoading) {
    return (
      <div className="p-4 sm:p-5 md:p-6 lg:p-7 pb-24 lg:pb-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-7 space-y-4 sm:space-y-6 pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Results
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          View and manage student examination results
        </p>
      </div>
      
      <MobileBottomNav 
        activeTab="results" 
        onTabChange={handleTabChange} 
      />
      
      <ResultsTab staffProfile={profile} termInfo={termInfo} />
    </div>
  )
}