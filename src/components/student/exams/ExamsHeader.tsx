// src/components/student/exams/ExamsHeader.tsx
'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronRight, Home, ArrowLeft, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import type { StudentProfile } from '@/app/student/exams/types'

interface ExamsHeaderProps {
  profile: StudentProfile | null
  stats: { termName: string; sessionYear: string }
  onBackToDashboard: () => void
}

export function ExamsHeader({ profile, stats, onBackToDashboard }: ExamsHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Link href="/student" className="hover:text-slate-600 transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-700 font-medium">Exams</span>
        </div>
        <Button variant="outline" size="sm" onClick={onBackToDashboard}
          className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 hover:border-slate-300">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Button>
      </div>

      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-6 text-white overflow-hidden relative shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">My Exams</h1>
            <p className="text-blue-200/70 text-xs sm:text-sm mt-0.5">
              {profile?.class && <span>{profile.class} · </span>}
              {profile?.department && <span>{profile.department} · </span>}
              <span>{stats.termName} {stats.sessionYear}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}