// src/components/student/exam/views/ResumeDialog.tsx

'use client'

import { Button } from '@/components/ui/button'
import {
  RotateCcw, Clock, AlertTriangle, Shield,
  ChevronRight, History, RefreshCw, XCircle,
  Monitor, Maximize2, Globe, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — MUST match useExamLoader.ts
// ─────────────────────────────────────────────────────────────────────────────

interface ResumeData {
  attemptId: string
  answers: Record<string, string>
  started_at: string
  duration: number
  tabSwitches: number
  fullscreenExits: number
  unloadCount: number
  attemptNumber?: number
  currentIndex?: number
  flaggedQuestions?: string[]
  timeLeft?: number
}

interface ResumeDialogProps {
  resumeData: ResumeData | null
  totalQuestions: number
  onResume: () => void
  maxAttempts?: number
  attemptsUsed?: number
  unloadCount?: number
  examTerminated?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// TERMINATED VIEW
// ─────────────────────────────────────────────────────────────────────────────

function TerminatedView({ resumeData }: { resumeData: ResumeData | null }) {
  const violations = [
    { label: 'Tab Switches', value: resumeData?.tabSwitches ?? 0, icon: Globe, gradient: 'from-rose-500 to-pink-600' },
    { label: 'Fullscreen Exits', value: resumeData?.fullscreenExits ?? 0, icon: Maximize2, gradient: 'from-red-500 to-rose-600' },
    { label: 'Page Refreshes', value: resumeData?.unloadCount ?? 0, icon: RefreshCw, gradient: 'from-orange-500 to-red-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-100 dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute -top-48 -right-48 h-[500px] w-[500px] bg-rose-200/20 dark:bg-rose-900/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] bg-red-200/20 dark:bg-red-900/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full"
      >
        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-rose-500/10 dark:shadow-rose-950/30 overflow-hidden ring-1 ring-rose-200/60 dark:ring-rose-900/40">
          <div className="relative bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 dark:from-rose-700 dark:via-red-700 dark:to-orange-700 px-6 py-8 text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 bg-black/10 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', damping: 14 }}
                className="relative inline-flex mb-4"
              >
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl" />
                <div className="relative h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 flex items-center justify-center shadow-2xl">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.14em]">
                  Terminated
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Exam Terminated
              </h2>
              <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">
                Your exam was auto-submitted due to excessive security violations
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-2.5">
              {violations.map((v, i) => (
                <motion.div
                  key={v.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800 dark:to-slate-800/70 ring-1 ring-slate-200 dark:ring-slate-700 p-3 text-center"
                >
                  <div className={cn('h-8 w-8 rounded-xl bg-gradient-to-br mx-auto mb-2 flex items-center justify-center shadow-sm', v.gradient)}>
                    <v.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">{v.value}</div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{v.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 ring-1 ring-rose-200 dark:ring-rose-900/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-sm">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-200 leading-tight">Security policy enforced</p>
                  <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1 leading-relaxed">
                    Your responses have been saved and submitted automatically.
                    Please contact your teacher or exam administrator for assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RESUME DIALOG
// ─────────────────────────────────────────────────────────────────────────────

export function ResumeDialog({
  resumeData,
  totalQuestions,
  onResume,
  maxAttempts = 1,
  attemptsUsed = 0,
  unloadCount = 0,
  examTerminated = false,
}: ResumeDialogProps) {
  const answeredCount = Object.keys(resumeData?.answers || {}).length
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // ✅ Compute timeLeft LIVE from started_at + duration — cannot drift
  const timeLeft = (() => {
    if (resumeData?.started_at && resumeData?.duration) {
      const startMs = new Date(resumeData.started_at).getTime()
      if (Number.isFinite(startMs)) {
        const elapsed = Math.floor((Date.now() - startMs) / 1000)
        return Math.max(0, resumeData.duration * 60 - elapsed)
      }
    }
    if (typeof resumeData?.timeLeft === 'number') return resumeData.timeLeft
    return 0
  })()

  const isLowTime = timeLeft < 300
  const isCriticalTime = timeLeft < 60
  const isLastUnload = unloadCount >= 2

  if (examTerminated) {
    return <TerminatedView resumeData={resumeData} />
  }

  const timeTheme = isCriticalTime
    ? {
        gradient: 'from-rose-500 to-red-600',
        bg: 'from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40',
        ring: 'ring-rose-200 dark:ring-rose-900/50',
        text: 'text-rose-700 dark:text-rose-300',
        value: 'text-rose-600 dark:text-rose-400',
        icon: 'text-rose-500 dark:text-rose-400',
      }
    : isLowTime
      ? {
          gradient: 'from-amber-500 to-orange-600',
          bg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
          ring: 'ring-amber-200 dark:ring-amber-900/50',
          text: 'text-amber-700 dark:text-amber-300',
          value: 'text-amber-600 dark:text-amber-400',
          icon: 'text-amber-500 dark:text-amber-400',
        }
      : {
          gradient: 'from-blue-500 to-indigo-600',
          bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
          ring: 'ring-blue-200 dark:ring-blue-900/50',
          text: 'text-blue-700 dark:text-blue-300',
          value: 'text-blue-700 dark:text-blue-300',
          icon: 'text-blue-500 dark:text-blue-400',
        }

  const securityItems = [
    { label: 'Tab Switches', value: resumeData?.tabSwitches || 0, limit: 3, icon: Globe, warn: (resumeData?.tabSwitches || 0) >= 2 },
    { label: 'Fullscreen Exits', value: resumeData?.fullscreenExits || 0, limit: 3, icon: Monitor, warn: (resumeData?.fullscreenExits || 0) >= 2 },
    { label: 'Page Refreshes', value: unloadCount, limit: 3, icon: RefreshCw, warn: isLastUnload },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-violet-950/20 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute -top-48 -right-48 h-[500px] w-[500px] bg-indigo-200/20 dark:bg-indigo-900/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] bg-violet-200/20 dark:bg-violet-900/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full"
      >
        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-950/30 overflow-hidden ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-700 dark:via-blue-700 dark:to-violet-700 px-6 py-8 text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 bg-violet-300/20 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 14 }}
                className="relative inline-flex mb-4"
              >
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl" />
                <div className="relative h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 flex items-center justify-center shadow-2xl">
                  <History className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 mb-2">
                <Sparkles className="h-3 w-3 text-white/80" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.14em]">
                  Session Found
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Resume Exam
              </h2>
              <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">
                Pick up right where you left off
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 ring-1 text-center', timeTheme.bg, timeTheme.ring)}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className={cn('h-5 w-5', timeTheme.icon)} />
                <span className={cn('text-sm font-semibold', timeTheme.text)}>Time Remaining</span>
              </div>
              <p className={cn('text-4xl font-extrabold tracking-tight tabular-nums', timeTheme.value)}>
                {formatTime(timeLeft)}
              </p>
              {isCriticalTime && (
                <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5 font-bold animate-pulse">⚠ Time is critically low!</p>
              )}
              {isLowTime && !isCriticalTime && (
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-1.5 font-semibold">Time is running low — stay focused</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800 dark:to-slate-800/70 ring-1 ring-slate-200 dark:ring-slate-700 p-4"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Progress</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                  {answeredCount}
                  <span className="text-slate-400 dark:text-slate-500 font-normal mx-0.5">/</span>
                  {totalQuestions}
                </span>
              </div>
              <div className="relative h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full shadow-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium tabular-nums">
                {Math.round(progressPercent)}% complete
                <span className="text-slate-300 dark:text-slate-600 mx-1.5">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{totalQuestions - answeredCount} remaining</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-2.5 px-0.5">
                <Shield className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em]">
                  Security Status
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {securityItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'relative overflow-hidden rounded-xl p-2.5 text-center ring-1 transition-colors',
                      item.warn
                        ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 ring-rose-200 dark:ring-rose-900/50'
                        : 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 ring-slate-200 dark:ring-slate-700'
                    )}
                  >
                    <div className={cn(
                      'h-7 w-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center',
                      item.warn
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-sm'
                        : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600'
                    )}>
                      <item.icon className={cn('h-3.5 w-3.5', item.warn ? 'text-white' : 'text-slate-600 dark:text-slate-300')} />
                    </div>
                    <div className={cn('text-base font-extrabold tabular-nums', item.warn ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200')}>
                      {item.value}
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">/{item.limit}</span>
                    </div>
                    <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5 leading-tight">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              {isLastUnload && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-2 text-center animate-pulse">
                  ⚠ Next page refresh will terminate your exam!
                </p>
              )}
            </motion.div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Attempt <span className="font-bold text-slate-700 dark:text-slate-300">{attemptsUsed + 1}</span>
                <span className="text-slate-400 dark:text-slate-500 mx-0.5">of</span>{maxAttempts}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertTriangle className="h-3 w-3" />
                Must resume to continue
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onResume}
                className="relative w-full h-14 rounded-2xl font-bold text-base text-white gap-2.5 shadow-xl shadow-indigo-500/30 dark:shadow-indigo-950/50 overflow-hidden group bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-700 hover:via-blue-700 hover:to-violet-700 dark:from-indigo-700 dark:via-blue-700 dark:to-violet-700 dark:hover:from-indigo-800 dark:hover:via-blue-800 dark:hover:to-violet-800 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <RotateCcw className="h-5 w-5" />
                <span>Resume Exam</span>
                <ChevronRight className="h-5 w-5 ml-auto" />
              </Button>
            </motion.div>

            <div className="flex items-start gap-2.5 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 ring-1 ring-amber-200 dark:ring-amber-900/50 rounded-2xl p-3.5">
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm mt-0.5">
                <AlertTriangle className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                Once resumed, you must complete the exam. Closing the page or switching
                tabs will be recorded as a security violation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}