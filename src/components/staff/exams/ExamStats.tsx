'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle2,
  BookOpen,
  Calculator,
  ShieldCheck,
  Archive,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExamStatsProps {
  totalExams: number
  draftCount: number
  pendingCount: number
  approvedCount: number        // ✅ Always counted and displayed
  publishedCount: number
  archivedCount?: number
  totalMarks?: number
  averageMarks?: number
  balancedExams?: number
  activeFilter?: string
  onFilterChange?: (filter: string) => void
}

interface StatItem {
  id: string
  label: string
  value: number
  color: string
  bgLight: string
  borderLight: string
  icon: React.ElementType
  gradientFrom: string
  gradientTo: string
  barBg: string
  description?: string
}

export function ExamStats({
  totalExams,
  draftCount,
  pendingCount,
  approvedCount = 0,
  publishedCount,
  archivedCount = 0,
  totalMarks = 0,
  averageMarks = 0,
  balancedExams = 0,
  activeFilter,
  onFilterChange,
}: ExamStatsProps) {
  // ✅ 5 Core Lifecycle Stat Cards (Always Visible)
  const lifecycleStats: StatItem[] = [
    {
      id: 'all',
      label: 'Total Exams',
      value: totalExams,
      color: 'text-blue-600 dark:text-blue-400',
      bgLight: 'bg-blue-50/50 dark:bg-blue-950/20',
      borderLight: 'border-blue-200 dark:border-blue-800/50',
      icon: BookOpen,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-indigo-600',
      barBg: 'bg-blue-500',
    },
    {
      id: 'draft',
      label: 'Drafts',
      value: draftCount,
      color: 'text-slate-600 dark:text-slate-300',
      bgLight: 'bg-slate-50/50 dark:bg-slate-900/40',
      borderLight: 'border-slate-200 dark:border-slate-800',
      icon: FileText,
      gradientFrom: 'from-slate-500',
      gradientTo: 'to-slate-600',
      barBg: 'bg-slate-500',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: pendingCount,
      color: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-50/50 dark:bg-amber-950/20',
      borderLight: 'border-amber-200 dark:border-amber-800/50',
      icon: Clock,
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-600',
      barBg: 'bg-amber-500',
    },
    {
      id: 'approved',
      label: 'Approved',
      value: approvedCount,
      color: 'text-teal-600 dark:text-teal-400',
      bgLight: 'bg-teal-50/50 dark:bg-teal-950/20',
      borderLight: 'border-teal-200 dark:border-teal-800/50',
      icon: ShieldCheck,
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-emerald-600',
      barBg: 'bg-teal-500',
      description: 'Ready to publish',
    },
    {
      id: 'published',
      label: 'Published',
      value: publishedCount,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgLight: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      borderLight: 'border-emerald-200 dark:border-emerald-800/50',
      icon: CheckCircle2,
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-600',
      barBg: 'bg-emerald-500',
      description: 'Active for students',
    },
  ]

  // Optional Archived & Marks Metrics
  const extraStats: StatItem[] = []

  if (archivedCount > 0) {
    extraStats.push({
      id: 'archived',
      label: 'Archived',
      value: archivedCount,
      color: 'text-purple-600 dark:text-purple-400',
      bgLight: 'bg-purple-50/50 dark:bg-purple-950/20',
      borderLight: 'border-purple-200 dark:border-purple-800/50',
      icon: Archive,
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-700',
      barBg: 'bg-purple-500',
    })
  }

  if (totalMarks > 0) {
    extraStats.push({
      id: 'total_marks',
      label: 'Total Marks',
      value: totalMarks,
      color: 'text-violet-600 dark:text-violet-400',
      bgLight: 'bg-violet-50/50 dark:bg-violet-950/20',
      borderLight: 'border-violet-200 dark:border-violet-800/50',
      icon: Calculator,
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-purple-600',
      barBg: 'bg-violet-500',
      description: 'Sum of all exams',
    })
  }

  if (averageMarks > 0) {
    extraStats.push({
      id: 'avg_marks',
      label: 'Avg Marks',
      value: averageMarks,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgLight: 'bg-indigo-50/50 dark:bg-indigo-950/20',
      borderLight: 'border-indigo-200 dark:border-indigo-800/50',
      icon: TrendingUp,
      gradientFrom: 'from-indigo-500',
      gradientTo: 'to-blue-600',
      barBg: 'bg-indigo-500',
      description: 'Per exam benchmark',
    })
  }

  if (balancedExams > 0 && totalExams > 0) {
    const percentage = Math.round((balancedExams / totalExams) * 100)
    extraStats.push({
      id: 'balanced',
      label: 'Balanced',
      value: balancedExams,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgLight: 'bg-cyan-50/50 dark:bg-cyan-950/20',
      borderLight: 'border-cyan-200 dark:border-cyan-800/50',
      icon: ShieldCheck,
      gradientFrom: 'from-cyan-500',
      gradientTo: 'to-teal-600',
      barBg: 'bg-cyan-500',
      description: `${percentage}% compliance`,
    })
  }

  const allStats = [...lifecycleStats, ...extraStats]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <motion.div
      className={cn(
        'grid gap-2.5 sm:gap-3 md:gap-4 w-full',
        allStats.length === 5
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {allStats.map((stat) => {
        const Icon = stat.icon
        const isInteractive = Boolean(
          onFilterChange && stat.id !== 'total_marks' && stat.id !== 'avg_marks'
        )
        const isSelected = activeFilter === stat.id

        return (
          <motion.div
            key={stat.id}
            variants={itemVariants}
            whileHover={isInteractive ? { scale: 1.02, y: -2 } : undefined}
            whileTap={isInteractive ? { scale: 0.98 } : undefined}
            onClick={() => isInteractive && onFilterChange?.(stat.id)}
            className={cn('w-full', isInteractive && 'cursor-pointer')}
          >
            <Card
              className={cn(
                'relative overflow-hidden transition-all duration-200 border rounded-xl shadow-xs',
                isSelected
                  ? 'ring-2 ring-primary border-transparent shadow-md'
                  : 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs',
                stat.bgLight,
                stat.borderLight
              )}
            >
              {/* Top Accent Gradient Line */}
              <div
                className={cn(
                  'h-1 w-full bg-gradient-to-r',
                  stat.gradientFrom,
                  stat.gradientTo
                )}
              />

              <CardContent className="p-3 sm:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate mb-1">
                      {stat.label}
                    </p>
                    <p
                      className={cn(
                        'text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight',
                        stat.color
                      )}
                    >
                      {stat.value.toLocaleString()}
                    </p>
                    {stat.description && (
                      <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                        {stat.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      'h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 shadow-xs',
                      stat.gradientFrom,
                      stat.gradientTo
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
                  </div>
                </div>

                {/* Progress bar relative to total */}
                {totalExams > 0 &&
                  stat.id !== 'all' &&
                  stat.id !== 'total_marks' &&
                  stat.id !== 'avg_marks' && (
                    <div className="mt-2.5 sm:mt-3">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            stat.barBg
                          )}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((stat.value / totalExams) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}