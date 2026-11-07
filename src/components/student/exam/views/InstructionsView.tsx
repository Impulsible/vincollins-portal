// src/components/student/exam/views/InstructionsView.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen, User, Clock, Calendar, Camera,
  FileText, Shield, Lock, Loader2, Award,
  Target, AlertCircle, CheckCircle2, ArrowLeft,
  MonitorPlay, Wifi, Eye, PenTool, CheckSquare,
  Sparkles, Zap, GraduationCap, ShieldCheck,
  Hash, Timer, TrendingUp, ChevronRight, Info,
} from 'lucide-react'
import Image from 'next/image'
import { TERM_NAMES, TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'
import type { Exam, Question } from '@/app/student/exam/[id]/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StudentProfile {
  photo_url?: string | null
  full_name?: string | null
  vin_id?: string | null
  class?: string | null
  email?: string | null
}

interface InstructionsViewProps {
  exam: Exam
  profile: StudentProfile | null
  allQuestions: Question[]
  startingExam: boolean
  onStart: () => void
  onCancel: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE EXTRACTORS
// ─────────────────────────────────────────────────────────────────────────────

function safeString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return fallback
}

function safeNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

export function InstructionsView({
  exam,
  profile,
  allQuestions,
  startingExam,
  onStart,
  onCancel,
}: InstructionsViewProps) {
  const [agreedToRules, setAgreedToRules] = useState(false)

  const examTitle = safeString(exam?.title, 'Exam')
  const examSubject = safeString(exam?.subject, '—')
  const examClass = safeString(exam?.class, '')
  const examDuration = safeNumber(exam?.duration, 30)
  const examPassingPct = safeNumber(exam?.passing_percentage, 50)
  const examInstructions = safeString(exam?.instructions, '')
  const examTermRaw = safeString(exam?.term, '')
  const examSession = safeString(exam?.session_year, 'Current Session')

  const objectiveQuestions = allQuestions.filter(q => q.type !== 'theory')
  const theoryQuestions = allQuestions.filter(q => q.type === 'theory')

  const objectivePoints = objectiveQuestions.reduce(
    (sum, q) => sum + Number(q.points || 1),
    0,
  )
  const theoryPoints = theoryQuestions.reduce(
    (sum, q) => sum + Number(q.points || 1),
    0,
  )
  const totalPoints = objectivePoints + theoryPoints

  const objectivePct = totalPoints > 0 ? Math.round((objectivePoints / totalPoints) * 100) : 0
  const theoryPct = totalPoints > 0 ? Math.round((theoryPoints / totalPoints) * 100) : 0

  const termLabel = examTermRaw
    ? (TERM_NAMES[examTermRaw as keyof typeof TERM_NAMES] ?? examTermRaw)
    : 'Current Term'

  const sessionLabel = examSession
  const hasTheory = theoryQuestions.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎨 TOP BAR                                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-700 dark:to-indigo-700 items-center justify-center shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-950/50">
                <MonitorPlay className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {examTitle}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap mt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <BookOpen className="h-3 w-3" />{examSubject}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="flex items-center gap-1 font-medium">
                    <GraduationCap className="h-3 w-3" />{examClass}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                  <span className="hidden sm:flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" />
                    {termLabel} · {sessionLabel}
                  </span>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white border-0 shadow-md shadow-emerald-200 dark:shadow-emerald-950/50 px-3 py-1 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready to Start
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 👤 LEFT COLUMN — CANDIDATE                                   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-4">
              
              {/* Candidate Verification Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-slate-950/50 bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
                  <div className="relative bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-700 dark:via-indigo-700 dark:to-blue-700 px-4 py-3 overflow-hidden">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                    <h3 className="relative text-white font-bold text-xs text-center flex items-center justify-center gap-2 tracking-wide uppercase">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Candidate Verification
                    </h3>
                  </div>
                  
                  <CardContent className="p-5 flex flex-col items-center bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50">
                    <div className="relative mb-4">
                      <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 rounded-2xl opacity-20 blur" />
                      
                      {profile?.photo_url ? (
                        <div className="relative w-40 h-48 sm:w-44 sm:h-52 border-[3px] border-white dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-950/50">
                          <Image
                            src={profile.photo_url}
                            alt={profile.full_name || 'Student'}
                            width={192}
                            height={224}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                          <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-700 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-40 h-48 sm:w-44 sm:h-52 border-[3px] border-white dark:border-slate-700 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-xl">
                          <User className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-600 text-white text-[10px] font-bold px-3 py-1 shadow-xl border border-white/20 tracking-wider">
                          <Hash className="h-2.5 w-2.5 mr-1" />
                          {profile?.vin_id || 'STUDENT'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 text-center space-y-0.5 w-full">
                      <h3 className="text-slate-900 dark:text-slate-100 font-bold text-base leading-tight">
                        {profile?.full_name || 'Student'}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                          <GraduationCap className="h-2.5 w-2.5" />
                          {profile?.class ?? '—'}
                        </span>
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 text-[11px] truncate pt-1">{profile?.email}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="hidden lg:block"
              >
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Exam Snapshot</p>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {[
                      { icon: Timer, label: 'Duration', value: `${examDuration} min`, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
                      { icon: Award, label: 'Total Marks', value: `${totalPoints} pts`, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' },
                      { icon: Target, label: 'Pass Mark', value: `${examPassingPct}%`, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <span className={cn("h-6 w-6 rounded-lg flex items-center justify-center", stat.color)}>
                            <stat.icon className="h-3 w-3" />
                          </span>
                          {stat.label}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tabular-nums">{stat.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 📄 RIGHT COLUMN — MAIN CONTENT                               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { icon: FileText, label: 'Questions', value: String(allQuestions.length), gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
                { icon: Award, label: 'Total Marks', value: String(totalPoints), gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
                { icon: Target, label: 'Pass Mark', value: `${examPassingPct}%`, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
                { icon: Lock, label: 'Attempts', value: '1', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-950/50 transition-all p-4 overflow-hidden group"
                >
                  <div className={cn("absolute top-0 right-0 h-16 w-16 opacity-10 rounded-full -mr-6 -mt-6 blur-xl bg-gradient-to-br group-hover:opacity-20 transition-opacity", item.gradient)} />
                  <div className="relative">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-2", item.bg, item.text)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">{item.value}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1.5">{item.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Question & Marks Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/60 dark:to-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Question Distribution
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {totalPoints} total marks
                  </span>
                </div>
                
                <CardContent className="p-4 sm:p-5">
                  {totalPoints > 0 && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-[11px] font-medium">
                          <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            Objective ({objectivePct}%)
                          </span>
                          {hasTheory && (
                            <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                              <span className="h-2 w-2 rounded-full bg-purple-500" />
                              Theory ({theoryPct}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${objectivePct}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full" 
                        />
                        {hasTheory && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${theoryPct}%` }}
                            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full" 
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 rounded-xl p-4 border border-blue-200/60 dark:border-blue-900/50 overflow-hidden group">
                      <div className="absolute top-0 right-0 h-20 w-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                      <div className="relative flex items-start gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-200 dark:shadow-blue-950/50">
                          <CheckSquare className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                            {objectiveQuestions.length} Objective
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mt-0.5">
                            {objectivePoints} marks
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400" />
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                              Auto-graded instantly
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasTheory && (
                      <div className="relative bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/30 rounded-xl p-4 border border-purple-200/60 dark:border-purple-900/50 overflow-hidden group">
                        <div className="absolute top-0 right-0 h-20 w-20 bg-purple-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="relative flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-md shadow-purple-200 dark:shadow-purple-950/50">
                            <PenTool className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-purple-900 dark:text-purple-200">
                              {theoryQuestions.length} Theory
                            </p>
                            <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
                              {theoryPoints} marks
                            </p>
                            <div className="mt-2 flex items-center gap-1">
                              <User className="h-2.5 w-2.5 text-purple-500 dark:text-purple-400" />
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                Teacher reviewed
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Instructions */}
            {examInstructions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <div className="relative px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Exam Instructions</h3>
                  </div>
                  <CardContent className="p-4 sm:p-5">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">{examInstructions}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Security Rules */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                <div className="relative px-4 sm:px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Security & Monitoring</h3>
                </div>
                <CardContent className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { icon: Eye, text: `Tab switches limited to ${TAB_SWITCH_LIMIT}`, sub: 'Exceeding triggers auto-submit' },
                      { icon: MonitorPlay, text: `Fullscreen exits limited to ${FULLSCREEN_EXIT_LIMIT}`, sub: 'Exceeding triggers auto-submit' },
                      { icon: Clock, text: 'Timer runs continuously', sub: 'Auto-submits when expired' },
                      { icon: Wifi, text: 'Progress saved automatically', sub: 'Every 30 seconds in background' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0 shadow-sm">
                          <item.icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{item.text}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Theory Notice */}
            {hasTheory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="relative bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30 border border-purple-200/60 dark:border-purple-900/50 rounded-2xl p-4 sm:p-5 overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-32 w-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-md shadow-purple-200 dark:shadow-purple-950/50">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      Two-Part Grading System
                    </p>
                    <p className="text-xs text-purple-800 dark:text-purple-300 mt-1.5 leading-relaxed">
                      Your <strong className="font-bold">{objectivePoints} objective marks</strong> are graded instantly upon submission. 
                      The <strong className="font-bold">{theoryPoints} theory marks</strong> require teacher review — 
                      your result will show as <strong className="font-bold text-fuchsia-700 dark:text-fuchsia-400">"Pending Review"</strong> until finalized.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Agreement & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <Card className="border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/50 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <label className={cn(
                    "flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all mb-5",
                    agreedToRules 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50" 
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}>
                    <div className="relative shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreedToRules}
                        onChange={(e) => setAgreedToRules(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className={cn(
                        "h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center",
                        agreedToRules 
                          ? "bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600" 
                          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 peer-hover:border-slate-400 dark:peer-hover:border-slate-500"
                      )}>
                        {agreedToRules && <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        agreedToRules ? "text-emerald-900 dark:text-emerald-200" : "text-slate-800 dark:text-slate-200"
                      )}>
                        I agree to the exam rules and conditions
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        I understand that violating security rules will trigger automatic submission, and I acknowledge this exam cannot be retaken.
                      </p>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={onCancel}
                      className="flex-1 order-2 sm:order-1 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Exams
                    </Button>
                    <Button
                      onClick={onStart}
                      disabled={startingExam || !agreedToRules}
                      className={cn(
                        "flex-1 order-1 sm:order-2 h-12 rounded-xl font-bold text-white shadow-lg transition-all",
                        "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-700 dark:via-indigo-700 dark:to-blue-700",
                        "hover:shadow-xl hover:shadow-indigo-300 dark:hover:shadow-indigo-950/50 hover:scale-[1.01] active:scale-[0.99]",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                      )}
                    >
                      {startingExam ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Start Exam Now
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {!agreedToRules && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-[11px] text-amber-700 dark:text-amber-400 mt-4 flex items-center justify-center gap-1 font-medium"
                    >
                      <AlertCircle className="h-3 w-3" />
                      Please accept the agreement above to continue
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-2">
              <Info className="h-3 w-3" />
              <span>Single-attempt exam · Ensure a quiet environment with stable internet connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}