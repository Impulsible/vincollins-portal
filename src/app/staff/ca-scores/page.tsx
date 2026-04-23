// app/staff/ca-scores/page.tsx
// ============================================
// CA SCORES PAGE - FIXED
// ============================================

'use client'

import { useRouter } from 'next/navigation'
import { CAScoresTab } from '@/components/staff/ca-scores'
import { useStaffAuth } from '@/components/staff/hooks/useStaffAuth'
import { useTermSettings } from '@/components/staff/hooks/useTermSettings'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/staff/dashboard'
import { MobileBottomNav } from '@/components/staff/navigation'
import { useStaffContext } from '@/app/staff/layout'

export default function CAScoresPage() {
  const router = useRouter()
  
  const { profile, loading: authLoading } = useStaffAuth()
  const { termInfo } = useTermSettings()
  const { sidebarCollapsed } = useStaffContext()

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          CA Scores Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage continuous assessment scores for students
        </p>
      </div>
      
      <CAScoresTab staffProfile={profile} termInfo={termInfo} />
      <MobileBottomNav 
        activeTab="ca-scores" 
        onTabChange={(tab) => router.push(`/staff/${tab === 'overview' ? '' : tab}`)} 
      />
    </div>
  )
}