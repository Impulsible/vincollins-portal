// src/components/student/exams/ExamCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Clock, CheckCircle2, Lock, Play, Eye, Timer, FileQuestion,
  TrendingUp, AlertCircle, Sparkles, Zap, ArrowRight,
} from 'lucide-react'
import type { Exam, ExamAttempt, ExamStatus, SubjectConfig, ViewMode } from '@/app/student/exams/types'

interface ExamCardProps {
  exam: Exam
  attempt?: ExamAttempt
  status: ExamStatus
  config: SubjectConfig
  viewMode: ViewMode
  onTakeExam: (examId: string) => void
  onViewResult: (examId: string) => void
}

interface GradeInfo {
  grade: string; label: string; color: string; bg: string; border: string; bar: string; ring: string
}

const getWAECGrade = (pct: number): GradeInfo => {
  if (pct >= 75) return { grade: 'A1', label: 'Excellent', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', ring: 'ring-emerald-400' }
  if (pct >= 70) return { grade: 'B2', label: 'Very Good', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', bar: 'bg-gradient-to-r from-blue-400 to-blue-500', ring: 'ring-blue-400' }
  if (pct >= 65) return { grade: 'B3', label: 'Good', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800', bar: 'bg-gradient-to-r from-sky-400 to-sky-500', ring: 'ring-sky-400' }
  if (pct >= 60) return { grade: 'C4', label: 'Credit', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800', bar: 'bg-gradient-to-r from-teal-400 to-teal-500', ring: 'ring-teal-400' }
  if (pct >= 55) return { grade: 'C5', label: 'Credit', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', bar: 'bg-gradient-to-r from-amber-400 to-amber-500', ring: 'ring-amber-400' }
  if (pct >= 50) return { grade: 'C6', label: 'Credit', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800', bar: 'bg-gradient-to-r from-orange-400 to-orange-500', ring: 'ring-orange-400' }
  if (pct >= 45) return { grade: 'D7', label: 'Pass', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500', ring: 'ring-yellow-400' }
  if (pct >= 40) return { grade: 'E8', label: 'Pass', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', bar: 'bg-gradient-to-r from-red-300 to-red-400', ring: 'ring-red-400' }
  return { grade: 'F9', label: 'Fail', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', bar: 'bg-gradient-to-r from-red-500 to-red-600', ring: 'ring-red-500' }
}

interface ScoreData { displayPct: number; displayScore: number; displayTotal: number; hasCA: boolean; isPending: boolean }

const calcScore = (attempt?: ExamAttempt): ScoreData => {
  if (!attempt) return { displayPct: 0, displayScore: 0, displayTotal: 100, hasCA: false, isPending: false }
  const hasCA = !!(attempt.ca1_score !== undefined && attempt.ca1_score !== null) || 
                !!(attempt as any).hasCA || !!(attempt as any).has_ca ||
                !!(attempt as any).ca_total_score
  const isPending = attempt.status === 'pending_theory'
  const obj = attempt.objective_score || 0
  const theory = attempt.theory_score || 0
  const ca1 = attempt.ca1_score || 0
  const ca2 = attempt.ca2_score || 0
  const caTotal = (attempt as any).ca_total_score || (ca1 + ca2)
  const objMax = attempt.objective_total || 30
  
  let displayScore = 0, displayTotal = 100
  if (hasCA) { displayScore = caTotal + obj + theory; displayTotal = 100 }
  else if (theory > 0) { displayScore = obj + theory; displayTotal = 60 }
  else if (obj > 0 && objMax > 0) { displayScore = obj; displayTotal = objMax }

  const storedPct = attempt.percentage
  const displayPct = storedPct != null && storedPct > 0
    ? Math.min(Math.max(Math.round(storedPct), 0), 100)
    : Math.min(Math.max(Math.round((displayScore / (displayTotal || 1)) * 100), 0), 100)

  return { 
    displayPct, 
    displayScore: storedPct != null && storedPct > 0 ? storedPct : displayScore, 
    displayTotal: storedPct != null && storedPct > 0 ? 100 : displayTotal, 
    hasCA, 
    isPending 
  }
}

const STATUS_MAP = {
  completed_pending: { icon: AlertCircle, label: 'Theory Pending', cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  completed: { icon: CheckCircle2, label: 'Completed', cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  upcoming: { icon: Clock, label: 'Upcoming', cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  in_progress: { icon: Zap, label: 'In Progress', cls: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  available: { icon: Lock, label: 'Available', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
} as const

function StatusBadge({ status, attempt }: { status: ExamStatus; attempt?: ExamAttempt }) {
  const key =
    status === 'completed' && attempt?.status === 'pending_theory' ? 'completed_pending'
    : status === 'completed' ? 'completed'
    : status === 'upcoming' ? 'upcoming'
    : attempt?.status === 'in_progress' ? 'in_progress'
    : 'available'
  const { icon: Icon, label, cls } = STATUS_MAP[key]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', cls)}>
      <Icon className="h-2.5 w-2.5" />{label}
    </span>
  )
}

// ✅ Correct Score Breakdown labeling logic:
// If there is a separate theory_score, label objective as 'Obj' and theory as 'Theory'.
// If there is NO separate theory_score, label the exam score as 'Exam'!
function ScoreBreakdown({ attempt, hasCA }: { attempt: ExamAttempt; hasCA: boolean }) {
  const parts: { label: string; value: number }[] = []

  if (hasCA) {
    const ca = (attempt as any).ca_total_score || ((attempt.ca1_score || 0) + (attempt.ca2_score || 0))
    if (ca > 0) parts.push({ label: 'CA', value: ca })
  }

  const hasSeparateTheory = (attempt.theory_score || 0) > 0

  if ((attempt.objective_score || 0) > 0) {
    // If theory score exists separately, label objective as "Obj". Otherwise, label as "Exam"!
    const label = hasSeparateTheory ? 'Obj' : 'Exam'
    parts.push({ label, value: attempt.objective_score! })
  }

  if (hasSeparateTheory) {
    parts.push({ label: 'Theory', value: attempt.theory_score! })
  }

  if (parts.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      {parts.map((p, i) => (
        <span key={p.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-[9px]">+</span>}
          <span className="text-[9px] bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
            {p.label}: {p.value}
          </span>
        </span>
      ))}
    </div>
  )
}

function ScoreRing({ pct, gradeInfo, size = 64 }: { pct: number; gradeInfo: GradeInfo; size?: number }) {
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  const dashOff = circ - (circ * pct) / 100
  const fontSize = size < 64 ? 'text-sm' : 'text-base'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-slate-100 dark:stroke-slate-800" strokeWidth={5} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} className={cn('fill-none', gradeInfo.ring)} stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: dashOff }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-black leading-none', fontSize, gradeInfo.color)}>{pct}%</span>
        <span className={cn('text-[8px] font-bold mt-0.5', gradeInfo.color)}>{gradeInfo.grade}</span>
      </div>
    </div>
  )
}

function ActionButton({ status, attempt, examId, onTakeExam, onViewResult, fullWidth = false }: {
  status: ExamStatus; attempt?: ExamAttempt; examId: string
  onTakeExam: (id: string) => void; onViewResult: (id: string) => void; fullWidth?: boolean
}) {
  const base = cn('h-8 text-xs font-semibold gap-1.5 rounded-xl transition-all duration-150 cursor-pointer', fullWidth && 'w-full')
  if (status === 'completed') return (
    <Button size="sm" onClick={() => onViewResult(examId)} className={cn(base, 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm')}>
      <Eye className="h-3.5 w-3.5" /> View Result <ArrowRight className="h-3 w-3 ml-0.5 opacity-60" />
    </Button>
  )
  if (status === 'upcoming') return (
    <Button size="sm" disabled variant="outline" className={cn(base, 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed')}>
      <Clock className="h-3.5 w-3.5" /> Not Yet Open
    </Button>
  )
  if (attempt?.status === 'in_progress') return (
    <Button size="sm" onClick={() => onTakeExam(examId)} className={cn(base, 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm')}>
      <Zap className="h-3.5 w-3.5" /> Resume
    </Button>
  )
  return (
    <Button size="sm" onClick={() => onTakeExam(examId)} className={cn(base, 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm')}>
      <Play className="h-3.5 w-3.5" /> Start Exam
    </Button>
  )
}

const accentCls = (status: ExamStatus, isPending: boolean, inProgress: boolean) => {
  if (status === 'completed') return isPending ? 'bg-amber-400' : 'bg-emerald-500'
  if (status === 'upcoming') return 'bg-amber-400'
  if (inProgress) return 'bg-blue-500'
  return 'bg-slate-200 dark:bg-slate-700'
}

export function ExamCard({ exam, attempt, status, config, viewMode, onTakeExam, onViewResult }: ExamCardProps) {
  const SubjectIcon = config.icon
  const { displayPct, displayScore, displayTotal, hasCA, isPending } = calcScore(attempt)
  const gradeInfo = getWAECGrade(displayPct)
  const inProgress = attempt?.status === 'in_progress'
  const accent = accentCls(status, isPending, inProgress)
  const isCompleted = status === 'completed' && !!attempt

  if (viewMode === 'list') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="group border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden hover:-translate-y-0.5 rounded-2xl">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              <div className={cn('w-1 shrink-0 rounded-l-xl transition-all duration-200 group-hover:w-1.5', accent)} />
              <div className="flex-1 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/5', config.bgColor)}>
                    <SubjectIcon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate leading-tight">{exam.title}</h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {exam.subject}{exam.class ? ` · ${exam.class}` : ''}{exam.term && exam.session_year ? ` · ${exam.term} ${exam.session_year}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={status} attempt={attempt} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {exam.duration > 0 && <MetaPill icon={Timer} label={`${exam.duration}m`} />}
                      {exam.total_questions > 0 && <MetaPill icon={FileQuestion} label={`${exam.total_questions} Qs`} />}
                      {exam.passing_percentage && <MetaPill icon={TrendingUp} label={`Pass ${exam.passing_percentage}%`} />}
                      {exam.has_theory && <TagPill label="+Theory" cls="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" />}
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 px-3">
                      <ScoreRing pct={displayPct} gradeInfo={gradeInfo} size={56} />
                      <ScoreBreakdown attempt={attempt!} hasCA={hasCA} />
                    </div>
                  )}
                  <div className="hidden sm:flex shrink-0 ml-1">
                    <ActionButton status={status} attempt={attempt} examId={exam.id} onTakeExam={onTakeExam} onViewResult={onViewResult} />
                  </div>
                </div>
                <div className="sm:hidden mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  {isCompleted && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ScoreRing pct={displayPct} gradeInfo={gradeInfo} size={44} />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <ScoreBreakdown attempt={attempt!} hasCA={hasCA} />
                        <ProgressBar pct={displayPct} gradeInfo={gradeInfo} />
                      </div>
                    </div>
                  )}
                  <ActionButton status={status} attempt={attempt} examId={exam.id} onTakeExam={onTakeExam} onViewResult={onViewResult} fullWidth={!isCompleted} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // GRID VIEW
  return (
    <motion.div className="h-full" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
      <Card className="group border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-900 h-full flex flex-col overflow-hidden hover:-translate-y-1 rounded-2xl">
        <CardContent className="p-0 flex flex-col h-full">
          <div className={cn('h-1 w-full shrink-0', accent)} />
          {isCompleted && (
            <div className={cn('h-16 w-full shrink-0 opacity-30', isPending ? 'bg-gradient-to-b from-amber-100 dark:from-amber-900/40 to-transparent' : 'bg-gradient-to-b from-emerald-50 dark:from-emerald-900/30 to-transparent')} />
          )}
          <div className={cn('px-4 pb-4 flex flex-col flex-1', isCompleted ? '-mt-12' : 'pt-4')}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/5', config.bgColor)}>
                <SubjectIcon className={cn('h-5 w-5', config.color)} />
              </div>
              <StatusBadge status={status} attempt={attempt} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">{exam.title}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 mb-3">{exam.subject}</p>
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {exam.duration > 0 && <MetaPill icon={Timer} label={`${exam.duration}m`} />}
              {exam.total_questions > 0 && <MetaPill icon={FileQuestion} label={`${exam.total_questions} Qs`} />}
              {exam.has_theory && <TagPill label="+Theory" cls="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" />}
              {exam.term && exam.session_year && <TagPill label={`${exam.term} ${exam.session_year}`} cls="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700" />}
            </div>
            {isCompleted && (
              <div className={cn('rounded-2xl border p-3 mb-4 space-y-2.5', gradeInfo.bg, gradeInfo.border)}>
                <div className="flex items-center gap-3">
                  <ScoreRing pct={displayPct} gradeInfo={gradeInfo} size={64} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Your Score</span>
                      <span className={cn('text-xs font-bold', gradeInfo.color)}>{gradeInfo.label}</span>
                    </div>
                    <p className={cn('text-[11px] font-semibold', gradeInfo.color)}>{displayScore}/{displayTotal} pts</p>
                    <ProgressBar pct={displayPct} gradeInfo={gradeInfo} />
                  </div>
                </div>
                {isPending && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 rounded-lg px-2 py-1.5 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-3 w-3 shrink-0" /> Theory marking in progress — final grade pending
                  </div>
                )}
                <ScoreBreakdown attempt={attempt!} hasCA={hasCA} />
              </div>
            )}
            {inProgress && (
              <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded-xl px-2.5 py-1.5 mb-3 border border-blue-200 dark:border-blue-800">
                <Sparkles className="h-3 w-3 shrink-0" /> You have an attempt in progress
              </div>
            )}
            <div className="flex-1" />
            {exam.passing_percentage && status !== 'completed' && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Pass mark: {exam.passing_percentage}%
              </p>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <ActionButton status={status} attempt={attempt} examId={exam.id} onTakeExam={onTakeExam} onViewResult={onViewResult} fullWidth />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MetaPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-lg">
      <Icon className="h-3 w-3 text-slate-400 dark:text-slate-500" />{label}
    </span>
  )
}

function TagPill({ label, cls }: { label: string; cls: string }) {
  return <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-lg border', cls)}>{label}</span>
}

function ProgressBar({ pct, gradeInfo }: { pct: number; gradeInfo: GradeInfo }) {
  return (
    <div className="h-1.5 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
      <motion.div className={cn('h-full rounded-full', gradeInfo.bar)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }} />
    </div>
  )
}