// app/staff/attendance/page.tsx
// ============================================
// ATTENDANCE PAGE - FIXED
// ============================================

'use client'

import { useRouter } from 'next/navigation'
import { AttendanceTab } from '@/components/staff/attendance'
import { useStaffAuth } from '@/components/staff/hooks/useStaffAuth'
import { useTermSettings } from '@/components/staff/hooks/useTermSettings'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/staff/dashboard'
import { useStaffContext } from '@/app/staff/layout'

export default function AttendancePage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Attendance Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Track and manage student attendance records
        </p>
      </div>
      
      <AttendanceTab staffProfile={profile} termInfo={termInfo} />
    </div>
  )
}