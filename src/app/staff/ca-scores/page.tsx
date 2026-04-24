// app/staff/ca-scores/page.tsx
// ============================================
// CA SCORES PAGE - FULLY RESPONSIVE & FIXED
// ============================================

'use client'

import { useRouter } from 'next/navigation'
import { CAScoresTab } from '@/components/staff/ca-scores'
import { useStaffAuth } from '@/components/staff/hooks/useStaffAuth'
import { useTermSettings } from '@/components/staff/hooks/useTermSettings'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/staff/dashboard'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useStaffContext } from '@/app/staff/layout'
import { Skeleton } from '@/components/ui/skeleton'

export default function CAScoresPage() {
  const router = useRouter()
  
  const { profile, loading: authLoading } = useStaffAuth()
  const { termInfo } = useTermSettings()
  const { sidebarCollapsed, activeTab, setActiveTab } = useStaffContext()

  if (authLoading) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" />
          <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-5 space-y-4 sm:space-y-5 md:space-y-6">
        
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
              CA Scores Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
              Manage continuous assessment scores for students
            </p>
          </div>
          
          {/* Term Info Badge - Responsive */}
          {termInfo && (
            <div className="shrink-0">
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium">
                  {termInfo.termName} {termInfo.sessionYear}
                </span>
                {termInfo.currentWeek > 0 && (
                  <span className="text-[10px] sm:text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Week {termInfo.currentWeek}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Full width */}
        <div className="w-full">
          <CAScoresTab staffProfile={profile} termInfo={termInfo} />
        </div>
      </div>

      {/* Mobile Bottom Navigation - FIXED: removed vin_id */}
      <div className="lg:hidden">
        <MobileBottomNav 
          role="staff"
          activeTab="ca-scores"
          onTabChange={(tab) => {
            setActiveTab(tab)
            router.push(`/staff/${tab === 'overview' ? '' : tab}`)
          }}
          profile={profile ? {
            full_name: profile.full_name ?? undefined,
            name: profile.full_name ?? undefined,
            email: profile.email ?? undefined,
            photo_url: profile.photo_url ?? undefined,
            avatar_url: profile.photo_url ?? undefined,
            class: (profile as any).class ?? undefined,
            department: profile.department ?? undefined,
          } : null}
          onLogout={async () => {
            const { supabase } = await import('@/lib/supabase')
            await supabase.auth.signOut()
            router.push('/portal')
          }}
        />
      </div>
    </div>
  )
}