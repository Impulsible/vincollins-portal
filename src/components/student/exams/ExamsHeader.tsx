// src/components/student/exams/ExamsHeader.tsx
'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronRight, Home, ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { StudentProfile } from '@/app/student/exams/types'

interface ExamsHeaderProps {
  profile: StudentProfile | null
  stats: { termName: string; sessionYear: string; availableExams?: number; completedExams?: number }
  onBackToDashboard: () => void
}

export function ExamsHeader({ profile, stats, onBackToDashboard }: ExamsHeaderProps) {
  const getSubtitle = () => {
    const parts = []
    if (profile?.class) parts.push(profile.class)
    if (profile?.department) parts.push(profile.department)
    if (stats.termName && stats.sessionYear) parts.push(`${stats.termName} ${stats.sessionYear}`)
    let subtitle = parts.join(' · ')
    if (stats.availableExams !== undefined) subtitle += ` · ${stats.availableExams} Available`
    if (stats.completedExams !== undefined && stats.completedExams > 0) subtitle += `, ${stats.completedExams} Completed`
    return subtitle || 'View and take your exams'
  }

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
          <Link href="/student" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-700 dark:text-slate-200 font-medium">Exams</span>
        </div>
        <Button variant="outline" size="sm" onClick={onBackToDashboard}
          className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-5 sm:p-6 text-white overflow-hidden relative shadow-xl border border-transparent dark:border-slate-800">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">My Exams</h1>
            <p className="text-blue-200/70 text-xs sm:text-sm mt-0.5 truncate">{getSubtitle()}</p>
          </div>
          {stats.availableExams !== undefined && stats.availableExams > 0 && (
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium border border-white/10">
                <span className="text-emerald-300 font-bold">{stats.availableExams}</span> available
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}