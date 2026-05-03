/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/dashboard/StatsCards.tsx - FIXED FOR YOUR DATABASE
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, TrendingDown, GraduationCap, Users,
  BookOpen, FileCheck, ArrowRight
} from 'lucide-react'
import { memo, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  trend?: number
  trendLabel?: string
  color: string
  bgGradient: string
  subtitle?: string
  delay?: number
  onClick?: () => void
  live?: boolean
  liveValue?: number
}

const StatCard = memo(({
  title, value, icon: Icon, trend, trendLabel = 'vs last month',
  color, bgGradient, subtitle, delay = 0, onClick, live = false, liveValue,
}: StatCardProps) => {
  const displayValue = liveValue !== undefined ? liveValue : value
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.001, duration: 0.3 }}
      onClick={onClick}
      className="block group cursor-pointer"
    >
      <Card className="relative h-full overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:from-gray-900 dark:to-gray-800/50">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5', bgGradient)} />
        <div className={cn('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', bgGradient)} />
        {live && (
          <div className="absolute top-2 right-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        )}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        <CardContent className="relative p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3 lg:gap-4">
            <div className="flex-1 space-y-2 lg:space-y-3">
              <div>
                <p className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
                {subtitle && <p className="text-[10px] lg:text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>}
              </div>
              <div>
                <h3 className="text-2xl lg:text-4xl font-bold tracking-tight text-foreground">
                  {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
                </h3>
                {trend !== undefined && (
                  <div className="mt-2 lg:mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 lg:px-2.5 lg:py-1 text-[10px] lg:text-xs font-medium backdrop-blur-sm">
                    {trend >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                    <span className={cn('font-semibold', trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{Math.abs(trend)}%</span>
                    <span className="text-muted-foreground hidden sm:inline">{trendLabel}</span>
                  </div>
                )}
              </div>
              <div className="pt-1 lg:pt-2">
                <span className="inline-flex items-center gap-1 text-[10px] lg:text-xs font-medium text-muted-foreground transition-all duration-200 group-hover:gap-2 group-hover:text-primary">
                  View Details <ArrowRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
            <div className="relative shrink-0">
              <div className={cn('absolute inset-0 rounded-2xl opacity-20 animate-pulse', color)} />
              <div className={cn('relative flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-xl lg:rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl', bgGradient)}>
                <Icon className="h-5 w-5 lg:h-7 lg:w-7 text-white drop-shadow-sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
StatCard.displayName = 'StatCard'

interface StatsCardsProps {
  stats: {
    totalStudents: number
    totalStaff: number
    activeExams: number
    pendingSubmissions: number
    passRate?: number
    attendanceRate?: number
    totalRevenue?: number
    pendingReports?: number
  }
  isLoading?: boolean
  onStudentClick?: () => void
  onStaffClick?: () => void
  onExamsClick?: () => void
  onSubmissionsClick?: () => void
  onResultsClick?: () => void
  onAttendanceClick?: () => void
  onBroadSheetClick?: () => void
  onReportCardsClick?: () => void
}

export function StatsCards({ 
  stats: initialStats, 
  isLoading = false, 
  onStudentClick, onStaffClick, onExamsClick, onSubmissionsClick,
  onBroadSheetClick, onReportCardsClick
}: StatsCardsProps) {
  const [liveStats] = useState(initialStats)
  const [onlineCounts, setOnlineCounts] = useState({ students: 0, staff: 0 })
  
  // ✅ Fetch active exams from exam_attempts (your actual table)
  const [activeExamsCount, setActiveExamsCount] = useState(initialStats.activeExams)
  
  // ✅ Fetch pending report cards
  const [pendingReportsCount, setPendingReportsCount] = useState(initialStats.pendingReports || 0)

  // Real-time presence tracking
  useEffect(() => {
    const presenceChannel = supabase.channel('stats-presence')
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        let studentsOnline = 0
        let staffOnline = 0
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.role === 'student') studentsOnline++
            if (presence.role === 'staff') staffOnline++
          })
        })
        setOnlineCounts({ students: studentsOnline, staff: staffOnline })
      })
      .subscribe()
    return () => { presenceChannel.unsubscribe() }
  }, [])

  // ✅ Fetch active exams from exam_attempts where status = 'in_progress'
  useEffect(() => {
    const fetchActiveExams = async () => {
      const { count } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')
      if (count !== null) setActiveExamsCount(count)
    }
    fetchActiveExams()

    // Real-time subscription to exam_attempts
    const channel = supabase
      .channel('stats-active-exams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, () => {
        fetchActiveExams()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ✅ Fetch pending report cards
  useEffect(() => {
    const fetchPendingReports = async () => {
      const { count } = await supabase
        .from('report_cards')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (count !== null) setPendingReportsCount(count)
    }
    fetchPendingReports()

    const channel = supabase
      .channel('stats-pending-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_cards' }, () => {
        fetchPendingReports()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ✅ Fetch pending exams (for submissions count)
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(initialStats.pendingSubmissions)
  
  useEffect(() => {
    const fetchPendingExams = async () => {
      const { count } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (count !== null) setPendingSubmissionsCount(count)
    }
    fetchPendingExams()

    const channel = supabase
      .channel('stats-pending-exams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        fetchPendingExams()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const cards = useMemo(() => [
    {
      title: 'Total Students',
      value: liveStats.totalStudents || 0,
      trend: 12,
      color: 'bg-emerald-500',
      bgGradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      subtitle: onlineCounts.students > 0 ? `${onlineCounts.students} online now` : 'Currently enrolled',
      delay: 0,
      onClick: onStudentClick,
      live: onlineCounts.students > 0,
      icon: GraduationCap
    },
    {
      title: 'Total Staff',
      value: liveStats.totalStaff || 0,
      trend: 8,
      color: 'bg-blue-500',
      bgGradient: 'from-blue-500 via-blue-600 to-indigo-600',
      subtitle: onlineCounts.staff > 0 ? `${onlineCounts.staff} online now` : 'Active members',
      delay: 100,
      onClick: onStaffClick,
      live: onlineCounts.staff > 0,
      icon: Users
    },
    {
      title: 'Active Exams',
      value: liveStats.activeExams || 0,
      liveValue: activeExamsCount,
      trend: activeExamsCount > 0 ? 15 : 0,
      color: 'bg-amber-500',
      bgGradient: 'from-amber-500 via-amber-600 to-orange-600',
      subtitle: activeExamsCount > 0 ? `${activeExamsCount} in progress` : 'No active exams',
      delay: 200,
      onClick: onExamsClick,
      live: activeExamsCount > 0,
      icon: BookOpen
    },
    {
      title: 'Pending Approvals',
      value: liveStats.pendingSubmissions || 0,
      liveValue: pendingSubmissionsCount,
      trend: pendingSubmissionsCount > 0 ? 23 : 0,
      color: 'bg-purple-500',
      bgGradient: 'from-purple-500 via-purple-600 to-fuchsia-600',
      subtitle: pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} exams to review` : 'All reviewed',
      delay: 300,
      onClick: onSubmissionsClick,
      live: pendingSubmissionsCount > 0,
      icon: FileCheck
    },
    {
      title: 'Broad Sheet',
      value: liveStats.totalStudents || 0,
      color: 'bg-indigo-500',
      bgGradient: 'from-indigo-500 via-indigo-600 to-violet-600',
      subtitle: 'Generate Report Cards',
      delay: 400,
      onClick: onBroadSheetClick,
      icon: BookOpen
    },
    {
      title: 'Report Cards',
      value: pendingReportsCount,
      trend: undefined,
      color: 'bg-teal-500',
      bgGradient: 'from-teal-500 via-teal-600 to-emerald-600',
      subtitle: pendingReportsCount > 0 ? `${pendingReportsCount} pending review` : 'All approved',
      delay: 500,
      onClick: onReportCardsClick,
      live: pendingReportsCount > 0,
      icon: FileCheck
    }
  ], [liveStats, onlineCounts, activeExamsCount, pendingSubmissionsCount, pendingReportsCount, onStudentClick, onStaffClick, onExamsClick, onSubmissionsClick, onBroadSheetClick, onReportCardsClick])

  return (
    <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  )
}

export default StatsCards