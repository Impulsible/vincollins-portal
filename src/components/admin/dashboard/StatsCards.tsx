 // components/admin/dashboard/StatsCards.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown,
  GraduationCap,
  Users,
  BookOpen,
  FileCheck,
  Trophy,
  ArrowRight,
  CalendarCheck,
  Award,
  Zap
} from 'lucide-react'
import { memo, useMemo } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  trend?: number
  color: string
  bgGradient: string
  subtitle?: string
  delay?: number
  onClick?: () => void
}

const StatCard = memo(({
  title,
  value,
  icon: Icon,
  trend,
  color,
  bgGradient,
  subtitle,
  delay = 0,
  onClick,
}: StatCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }
  
  return (
    <div 
      onClick={handleClick}
      className="block group cursor-pointer"
    >
      <Card className="relative h-full overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:from-gray-900 dark:to-gray-800/50 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${delay}ms` }}>
        
        {/* Animated gradient background */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5', bgGradient)} />
        
        {/* Top accent bar */}
        <div className={cn('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', bgGradient)} />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

        <CardContent className="relative p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3 lg:gap-4">
            
            {/* Left side - Content */}
            <div className="flex-1 space-y-2 lg:space-y-3">
              <div>
                <p className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {title}
                </p>
                {subtitle && (
                  <p className="text-[10px] lg:text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>
                )}
              </div>

              <div>
                <h3 className="text-2xl lg:text-4xl font-bold tracking-tight text-foreground">
                  {value}
                </h3>
                
                {trend !== undefined && (
                  <div className="mt-2 lg:mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 lg:px-2.5 lg:py-1 text-[10px] lg:text-xs font-medium backdrop-blur-sm">
                    {trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={cn(
                        'font-semibold',
                        trend >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {Math.abs(trend)}%
                    </span>
                    <span className="text-muted-foreground hidden sm:inline">vs last month</span>
                  </div>
                )}
              </div>

              {/* View details link */}
              <div className="pt-1 lg:pt-2">
                <span className="inline-flex items-center gap-1 text-[10px] lg:text-xs font-medium text-muted-foreground transition-all duration-200 group-hover:gap-2 group-hover:text-primary">
                  View Details
                  <ArrowRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>

            {/* Right side - Icon with beautiful styling */}
            <div className="relative shrink-0">
              {/* Animated pulse ring */}
              <div className={cn('absolute inset-0 rounded-2xl opacity-20 animate-pulse', color)} />
              
              {/* Icon container with gradient background */}
              <div className={cn(
                'relative flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-xl lg:rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl',
                bgGradient
              )}>
                <Icon className="h-5 w-5 lg:h-7 lg:w-7 text-white drop-shadow-sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

StatCard.displayName = 'StatCard'

interface StatsCardsProps {
  stats: {
    totalStudents: number
    totalStaff: number
    activeExams: number
    pendingSubmissions: number
    passRate: number
    attendanceRate?: number
    totalRevenue?: number
  }
  isLoading?: boolean
  onStudentClick?: () => void
  onStaffClick?: () => void
  onExamsClick?: () => void
  onSubmissionsClick?: () => void
  onResultsClick?: () => void
  onAttendanceClick?: () => void
}

export function StatsCards({ 
  stats, 
  isLoading = false, 
  onStudentClick,
  onStaffClick,
  onExamsClick,
  onSubmissionsClick,
  onResultsClick,
  onAttendanceClick
}: StatsCardsProps) {
  const cards = useMemo(() => {
    return [
      {
        title: 'Total Students',
        value: stats.totalStudents?.toLocaleString() || '0',
        trend: 12,
        color: 'bg-emerald-500',
        bgGradient: 'from-emerald-500 via-emerald-600 to-teal-600',
        subtitle: 'Currently enrolled',
        delay: 0,
        onClick: onStudentClick
      },
      {
        title: 'Total Staff',
        value: stats.totalStaff?.toLocaleString() || '0',
        trend: 8,
        color: 'bg-blue-500',
        bgGradient: 'from-blue-500 via-blue-600 to-indigo-600',
        subtitle: 'Active members',
        delay: 100,
        onClick: onStaffClick
      },
      {
        title: 'Active Exams',
        value: stats.activeExams || 0,
        trend: -5,
        color: 'bg-amber-500',
        bgGradient: 'from-amber-500 via-amber-600 to-orange-600',
        subtitle: 'Currently running',
        delay: 200,
        onClick: onExamsClick
      },
      {
        title: 'Pending Submissions',
        value: stats.pendingSubmissions || 0,
        trend: 23,
        color: 'bg-purple-500',
        bgGradient: 'from-purple-500 via-purple-600 to-fuchsia-600',
        subtitle: 'Awaiting review',
        delay: 300,
        onClick: onSubmissionsClick
      },
      {
        title: 'Pass Rate',
        value: `${stats.passRate || 0}%`,
        trend: 7,
        color: 'bg-rose-500',
        bgGradient: 'from-rose-500 via-rose-600 to-pink-600',
        subtitle: 'Overall average',
        delay: 400,
        onClick: onResultsClick
      },
      {
        title: 'Attendance Rate',
        value: `${stats.attendanceRate || 94}%`,
        trend: 5,
        color: 'bg-cyan-500',
        bgGradient: 'from-cyan-500 via-cyan-600 to-sky-600',
        subtitle: 'This month',
        delay: 500,
        onClick: onAttendanceClick
      }
    ]
  }, [stats, onStudentClick, onStaffClick, onExamsClick, onSubmissionsClick, onResultsClick, onAttendanceClick])

  const getIcon = (title: string): React.ElementType => {
    const iconMap: Record<string, React.ElementType> = {
      'Total Students': GraduationCap,
      'Total Staff': Users,
      'Active Exams': BookOpen,
      'Pending Submissions': FileCheck,
      'Pass Rate': Trophy,
      'Attendance Rate': CalendarCheck,
      'Total Revenue': Award,
    }
    return iconMap[title] || Zap
  }

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="relative h-full overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg">
            <CardContent className="relative p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3 lg:gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-24 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded-full dark:bg-gray-700 w-32 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-20 animate-pulse" />
                </div>
                <div className="h-12 w-12 lg:h-16 lg:w-16 bg-gray-200 rounded-xl lg:rounded-2xl animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          {...card}
          icon={getIcon(card.title)}
        />
      ))}
    </div>
  )
}

export default StatsCards