// app/staff/schedule/page.tsx - FIXED LAYOUT
'use client'

import { useRouter } from 'next/navigation'
import { ScheduleTab } from '@/components/staff/schedule'
import { useStaffAuth } from '@/components/staff/hooks/useStaffAuth'
import { useTermSettings } from '@/components/staff/hooks/useTermSettings'
import { DashboardSkeleton } from '@/components/staff/dashboard'
import { MobileBottomNav } from '@/components/staff/navigation'
import { useStaffContext } from '@/app/staff/layout'

export default function SchedulePage() {
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
          Schedule
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          View and manage your class schedule and upcoming events
        </p>
      </div>
      
      <MobileBottomNav 
        activeTab="schedule" 
        onTabChange={handleTabChange} 
      />
      
      <ScheduleTab staffProfile={profile} termInfo={termInfo} />
    </div>
  )
}