// src/components/student/exam/dialogs/ResultDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  X, Clock, Target, PenTool, Shield,
  Trophy, BookOpen, Timer, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface ResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examResult: ExamResult | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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
    case 'C4':
    case 'C5':
    case 'C6': return 'Credit'
    case 'D7':
    case 'E8': return 'Pass'
    default:   return 'Fail'
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

// ✅ Safely format seconds → "Xm Ys"
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ResultDialog({
  open,
  onOpenChange,
  examResult,
}: ResultDialogProps) {
  const router = useRouter()

  if (!examResult) return null

  const isPassed        = examResult.is_passed
  const isTerminated    = examResult.status === 'terminated'
  const isPendingTheory = examResult.status === 'pending_theory'
  const pct             = examResult.percentage ?? 0
  const grade           = getWAECGrade(pct)
  const remark          = getGradeRemark(grade)
  const progressPct     = Math.min(100, pct)

  // Accuracy — correct out of attempted (skipped excluded)
  const totalAttempted = (examResult.correct ?? 0) + (examResult.incorrect ?? 0)
  const accuracy = totalAttempted > 0
    ? Math.round(((examResult.correct ?? 0) / totalAttempted) * 100)
    : 0

  const handleClose = () => {
    onOpenChange(false)
    router.push('/student/exams')
  }

  const statusText = isTerminated
    ? 'Terminated'
    : isPendingTheory
    ? 'Pending Review'
    : isPassed
    ? 'Passed'
    : 'Not Passed'

  const StatusIcon = isTerminated
    ? AlertTriangle
    : isPassed
    ? Trophy
    : XCircle

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[420px] w-[95vw] p-0 gap-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <DialogHeader className="sr-only">
          <DialogTitle>Exam Result</DialogTitle>
          <DialogDescription>Score: {pct}%</DialogDescription>
        </DialogHeader>

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 h-6 w-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5 text-zinc-400" />
        </button>

        {/* ── Header ── */}
        <div className="px-6 pt-7 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <StatusIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                {statusText}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isTerminated
                  ? 'Security violation detected during session'
                  : isPendingTheory
                  ? 'Theory answers pending teacher review'
                  : isPassed
                  ? 'You have passed this examination'
                  : 'Below the required pass mark'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* Score section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">
                Your Score
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {pct}%
                </span>
                {!isTerminated && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                      {grade}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-500">
                      {remark}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar with pass mark tick */}
            <div className="relative">
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    isTerminated
                      ? 'bg-zinc-300 dark:bg-zinc-600'
                      : isPassed
                      ? 'bg-zinc-900 dark:bg-zinc-100'
                      : 'bg-zinc-400 dark:bg-zinc-500',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* Pass mark tick line */}
              <div
                className="absolute top-0 h-1.5 w-0.5 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                style={{ left: `${examResult.passing_percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>0%</span>
              <span className="flex items-center gap-1">
                <Target className="h-2.5 w-2.5" />
                {examResult.passing_percentage}% to pass
              </span>
              <span>100%</span>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
              {[
                {
                  label:  'Correct',
                  value:  examResult.correct ?? 0,
                  active: (examResult.correct ?? 0) > 0,
                },
                {
                  label:  'Wrong',
                  value:  examResult.incorrect ?? 0,
                  active: (examResult.incorrect ?? 0) > 0,
                },
                {
                  label:  'Skipped',
                  value:  examResult.unanswered ?? 0,
                  active: false,
                },
                {
                  label:  'Points',
                  value:  `${examResult.score}/${examResult.total}`,
                  active: false,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-0.5 py-2.5 bg-white dark:bg-zinc-950"
                >
                  <span className={cn(
                    'text-sm font-semibold tabular-nums',
                    stat.active
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-400',
                  )}>
                    {stat.value}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Accuracy + Duration row */}
          <div className="grid grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 py-2.5 px-3.5 bg-white dark:bg-zinc-950">
              <Target className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {accuracy}%
                </p>
                <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest">
                  Accuracy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 py-2.5 px-3.5 bg-white dark:bg-zinc-950">
              <Timer className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <div>
                {/* ✅ time_spent can be optional or non-numeric on ExamResult */}
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {formatDuration(parseSeconds(examResult.time_spent))}
                </p>
                <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest">
                  Duration
                </p>
              </div>
            </div>
          </div>

          {/* Score breakdown card */}
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">

            <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">
                Breakdown
              </span>
            </div>

            {/* Objective */}
            {examResult.objective_score !== undefined && (
              <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-3.5 w-3.5 text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Objective
                    </p>
                    <p className="text-[10px] text-zinc-400">Auto-graded</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {examResult.objective_score}
                  <span className="text-zinc-300 dark:text-zinc-600 font-normal">
                    {' '}/{' '}{examResult.objective_total}
                  </span>
                </span>
              </div>
            )}

            {/* Theory */}
            {(examResult.theory_total ?? 0) > 0 && (
              <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <PenTool className="h-3.5 w-3.5 text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Theory
                    </p>
                    <p className="text-[10px] text-zinc-400">Teacher graded</p>
                  </div>
                </div>
                {isPendingTheory ? (
                  <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    Pending
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                    {examResult.theory_score ?? '—'}
                    <span className="text-zinc-300 dark:text-zinc-600 font-normal">
                      {' '}/{' '}{examResult.theory_total}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Pass mark */}
            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center gap-2.5">
                <Target className="h-3.5 w-3.5 text-zinc-500" />
                <div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Pass Mark
                  </p>
                  <p className="text-[10px] text-zinc-400">Required</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {examResult.passing_percentage}%
              </span>
            </div>
          </div>

          {/* Grade summary */}
{!isTerminated && (
  <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
    <div className="flex items-center gap-2.5">
      <Hash className="h-3.5 w-3.5 text-zinc-500" />
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Grade
      </p>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {grade}
      </span>
      <span className="text-[11px] text-zinc-500">
        {remark}
      </span>
    </div>
  </div>
)}

          {/* Notice — pending or terminated */}
          {(isPendingTheory || isTerminated) && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              {isTerminated
                ? <Shield className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                : <Clock className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />}
              <div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isTerminated ? 'Session terminated' : 'Pending review'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  {isTerminated
                    ? 'Your exam was terminated due to a policy violation. Contact your teacher for further details.'
                    : 'Theory answers are under review. Your final grade will update automatically once marked.'}
                </p>
              </div>
            </div>
          )}

          {/* CA notice */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <BookOpen className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Continuous Assessment
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                CA scores are managed separately. Your final report card combines exam + CA.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-1">
          <Button
            onClick={handleClose}
            className="w-full h-11 text-sm font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exams
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}