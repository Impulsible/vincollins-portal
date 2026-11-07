// src/components/student/exam/dialogs/ResultDialog.tsx
'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  X, Clock, Target, PenTool, Shield,
  Trophy, BookOpen, Timer, Hash, Sparkles,
  TrendingUp, Award, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface ResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examResult: ExamResult | null
}

const getWAECGrade = (pct: number): string => {
  if (pct >= 75) return 'A1'
  if (pct >= 70) return 'B2'
  if (pct >= 65) return 'B3'
  if (pct >= 60) return 'C4'
  if (pct >= 55) return 'C5'
  if (pct >= 50) return 'C6'
  if (pct >= 45) return 'D7'
  if (pct >= 40) return 'E8'
  return 'F9'
}

const getGradeRemark = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'Excellent'
    case 'B2': return 'Very Good'
    case 'B3': return 'Good'
    case 'C4': case 'C5': case 'C6': return 'Credit'
    case 'D7': case 'E8': return 'Pass'
    default: return 'Fail'
  }
}

const parseSeconds = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

export function ResultDialog({ open, onOpenChange, examResult }: ResultDialogProps) {
  const router = useRouter()

  if (!examResult) return null

  const isPassed = examResult.is_passed
  const isTerminated = examResult.status === 'terminated'
  const isPendingTheory = examResult.status === 'pending_theory'

  const questionsAttempted = (examResult.correct ?? 0) + (examResult.incorrect ?? 0) + (examResult.unanswered ?? 0)

  let objectiveMax = examResult.objective_total || 20
  const objectiveScore = examResult.objective_score ?? 0

  if (objectiveScore > objectiveMax) {
    objectiveMax = questionsAttempted > 0 ? questionsAttempted : 30
  }

  const theoryMax = examResult.theory_total || 0
  const theoryScore = examResult.theory_score ?? 0

  const currentScore = objectiveScore + theoryScore
  const currentPct = objectiveMax > 0 ? Math.round((currentScore / (objectiveMax + theoryMax)) * 100) : 0
  const objectivePct = (objectiveMax + theoryMax) > 0 ? Math.round((objectiveScore / (objectiveMax + theoryMax)) * 100) : 0
  const theoryPotentialPct = (objectiveMax + theoryMax) > 0 ? Math.round((theoryMax / (objectiveMax + theoryMax)) * 100) : 0

  const grade = isPendingTheory ? '—' : getWAECGrade(currentPct)
  const remark = isPendingTheory ? 'Pending Review' : getGradeRemark(grade)

  const totalAttempted = (examResult.correct ?? 0) + (examResult.incorrect ?? 0)
  const accuracy = totalAttempted > 0
    ? Math.round(((examResult.correct ?? 0) / totalAttempted) * 100)
    : 0

  const handleClose = () => {
    onOpenChange(false)
    router.push('/student/exams')
  }

  // 🎨 Theme configuration based on status
  const theme = isTerminated ? {
    gradient: 'from-slate-700 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950',
    accent: 'bg-slate-500',
    accentText: 'text-slate-100',
    icon: AlertTriangle,
    label: 'Session Terminated',
    sub: 'Security violation detected',
    glow: 'shadow-slate-500/20 dark:shadow-slate-950/40',
    chipBg: 'bg-slate-100 dark:bg-slate-800',
    chipText: 'text-slate-700 dark:text-slate-300',
  } : isPendingTheory ? {
    gradient: 'from-blue-500 via-indigo-600 to-violet-600 dark:from-blue-600 dark:via-indigo-700 dark:to-violet-700',
    accent: 'bg-blue-500',
    accentText: 'text-blue-100',
    icon: Clock,
    label: 'Awaiting Review',
    sub: 'Theory answers pending grade',
    glow: 'shadow-blue-500/30 dark:shadow-blue-950/50',
    chipBg: 'bg-blue-50 dark:bg-blue-950/40',
    chipText: 'text-blue-700 dark:text-blue-300',
  } : isPassed ? {
    gradient: 'from-emerald-500 via-teal-600 to-green-600 dark:from-emerald-600 dark:via-teal-700 dark:to-green-700',
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-100',
    icon: Trophy,
    label: 'Congratulations!',
    sub: 'You have passed this examination',
    glow: 'shadow-emerald-500/30 dark:shadow-emerald-950/50',
    chipBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    chipText: 'text-emerald-700 dark:text-emerald-300',
  } : {
    gradient: 'from-rose-500 via-red-600 to-orange-600 dark:from-rose-600 dark:via-red-700 dark:to-orange-700',
    accent: 'bg-rose-500',
    accentText: 'text-rose-100',
    icon: XCircle,
    label: 'Not Passed',
    sub: 'Below the required pass mark',
    glow: 'shadow-rose-500/30 dark:shadow-rose-950/50',
    chipBg: 'bg-rose-50 dark:bg-rose-950/40',
    chipText: 'text-rose-700 dark:text-rose-300',
  }

  const StatusIcon = theme.icon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[440px] w-[95vw] p-0 gap-0 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl dark:shadow-black/60 rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Exam Result</DialogTitle>
          <DialogDescription>
            {isPendingTheory ? 'Theory grading pending' : `Score: ${currentPct}%`}
          </DialogDescription>
        </DialogHeader>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 🎨 HERO HEADER                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className={cn("relative overflow-hidden bg-gradient-to-br", theme.gradient)}>
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-white/5 rounded-full -ml-16 -mb-10 blur-xl" />
          <div className="absolute top-1/2 left-1/4 h-24 w-24 bg-white/5 rounded-full blur-2xl" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative px-6 pt-8 pb-7 text-white">
            {/* Icon with pulsing glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mx-auto mb-4 w-fit"
            >
              <div className={cn("absolute inset-0 rounded-2xl blur-xl", theme.accent, "opacity-60")} />
              <div className="relative h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl">
                <StatusIcon className="h-7 w-7 text-white" strokeWidth={2.2} />
              </div>
              {isPassed && !isPendingTheory && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <h2 className="text-lg font-bold tracking-tight mb-1">{theme.label}</h2>
              <p className="text-xs text-white/80">{theme.sub}</p>
            </motion.div>

            {/* Score Display */}
            {!isPendingTheory && !isTerminated && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-5 flex items-end justify-center gap-2"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tabular-nums tracking-tighter leading-none">
                    {currentPct}
                  </span>
                  <span className="text-2xl font-bold text-white/70">%</span>
                </div>
                <div className="pb-1 flex flex-col items-start">
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Grade</span>
                  <span className="text-xl font-bold leading-none">{grade}</span>
                </div>
              </motion.div>
            )}

            {isPendingTheory && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-5 flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Preliminary: {currentPct}%</span>
                </div>
              </motion.div>
            )}

            {/* Remark pill */}
            {!isPendingTheory && !isTerminated && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 flex justify-center"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold tracking-wide">
                  <Award className="h-3 w-3" />
                  {remark}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 📊 BODY                                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="px-6 py-5 space-y-4">

          {/* Progress bar with pass mark */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
                Score Progress
              </span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Target className="h-2.5 w-2.5" />
                Pass: {examResult.passing_percentage}%
              </span>
            </div>

            <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              {/* Score bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${objectivePct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full z-10',
                  isTerminated ? 'bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600'
                  : isPendingTheory ? 'bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600'
                  : isPassed ? 'bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600'
                  : 'bg-gradient-to-r from-rose-400 to-red-500 dark:from-rose-500 dark:to-red-600'
                )}
              />
              {/* Pending theory ghost bar */}
              {isPendingTheory && theoryMax > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${theoryPotentialPct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 }}
                  className="absolute inset-y-0 bg-amber-200/50 dark:bg-amber-800/40"
                  style={{ left: `${objectivePct}%` }}
                />
              )}
              {/* Pass mark line */}
              <div
                className="absolute inset-y-0 w-0.5 bg-zinc-900 dark:bg-white z-20 rounded-full"
                style={{ left: `${examResult.passing_percentage}%` }}
              >
                <div className="absolute -top-1 -left-[3px] h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Correct', value: examResult.correct ?? 0, icon: CheckCircle, color: 'emerald' },
              { label: 'Wrong', value: examResult.incorrect ?? 0, icon: XCircle, color: 'rose' },
              { label: 'Skipped', value: examResult.unanswered ?? 0, icon: Hash, color: 'amber' },
              { label: 'Points', value: `${currentScore}`, sub: `/${objectiveMax + theoryMax}`, icon: Zap, color: 'violet' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-2.5 overflow-hidden"
              >
                <stat.icon className={cn("h-3 w-3 mb-1.5",
                  stat.color === 'emerald' && 'text-emerald-500 dark:text-emerald-400',
                  stat.color === 'rose' && 'text-rose-500 dark:text-rose-400',
                  stat.color === 'amber' && 'text-amber-500 dark:text-amber-400',
                  stat.color === 'violet' && 'text-violet-500 dark:text-violet-400',
                )} />
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
                    {stat.value}
                  </span>
                  {stat.sub && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tabular-nums">{stat.sub}</span>
                  )}
                </div>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block mt-0.5">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
                  {accuracy}<span className="text-xs text-zinc-400">%</span>
                </p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mt-1">Accuracy</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center">
                <Timer className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
                  {formatDuration(parseSeconds(examResult.time_spent))}
                </p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mt-1">Duration</p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
            <div className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
                Score Breakdown
              </span>
            </div>

            {objectiveMax > 0 && (
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Objective</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Auto-graded</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                    {objectiveScore}
                    <span className="text-zinc-400 dark:text-zinc-600 font-medium"> / {objectiveMax}</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {Math.round((objectiveScore / objectiveMax) * 100)}%
                  </p>
                </div>
              </div>
            )}

            {theoryMax > 0 && (
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                    <PenTool className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Theory</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Teacher graded</p>
                  </div>
                </div>
                {isPendingTheory ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    <Clock className="h-2.5 w-2.5" /> Pending
                  </span>
                ) : (
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                      {theoryScore}
                      <span className="text-zinc-400 dark:text-zinc-600 font-medium"> / {theoryMax}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {theoryMax > 0 ? Math.round((theoryScore / theoryMax) * 100) : 0}%
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                  <Target className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Required</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Pass mark</p>
                </div>
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {examResult.passing_percentage}<span className="text-zinc-400">%</span>
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {(isPendingTheory || isTerminated) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-start gap-3 px-3.5 py-3 rounded-xl border",
                isTerminated
                  ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
              )}
            >
              {isTerminated ? (
                <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={cn("text-xs font-semibold",
                  isTerminated ? "text-slate-800 dark:text-slate-200" : "text-amber-900 dark:text-amber-200"
                )}>
                  {isTerminated ? 'Session terminated' : 'Awaiting theory review'}
                </p>
                <p className={cn("text-[11px] mt-0.5 leading-relaxed",
                  isTerminated ? "text-slate-600 dark:text-slate-400" : "text-amber-700 dark:text-amber-400"
                )}>
                  {isTerminated
                    ? 'Your exam was terminated due to a policy violation. Contact your teacher for further details.'
                    : 'Theory answers are under review. Your final grade will update automatically once marked.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* CA Info */}
          <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
            <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
              <BookOpen className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Continuous Assessment
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                CA scores are managed separately. Your final report card combines exam + CA scores.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-1">
          <Button
            onClick={handleClose}
            className={cn(
              "w-full h-12 text-sm font-bold rounded-xl text-white shadow-lg transition-all",
              "bg-gradient-to-r hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
              theme.gradient,
              theme.glow
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exams
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}