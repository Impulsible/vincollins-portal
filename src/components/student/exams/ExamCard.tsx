// src/components/student/exams/ExamCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Clock, BookOpen, CheckCircle2, Lock, ChevronRight,
  Play, Eye, RotateCcw, Timer, FileQuestion, Award,
  TrendingUp, AlertCircle,
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

const getWAECGrade = (pct: number) => {
  if (pct >= 75) return { grade: 'A1', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' }
  if (pct >= 70) return { grade: 'B2', color: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-500' }
  if (pct >= 65) return { grade: 'B3', color: 'text-sky-600',     bg: 'bg-sky-50',     bar: 'bg-sky-500' }
  if (pct >= 60) return { grade: 'C4', color: 'text-cyan-600',    bg: 'bg-cyan-50',    bar: 'bg-cyan-500' }
  if (pct >= 55) return { grade: 'C5', color: 'text-teal-600',    bg: 'bg-teal-50',    bar: 'bg-teal-500' }
  if (pct >= 50) return { grade: 'C6', color: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-500' }
  if (pct >= 45) return { grade: 'D7', color: 'text-orange-600',  bg: 'bg-orange-50',  bar: 'bg-orange-500' }
  if (pct >= 40) return { grade: 'E8', color: 'text-yellow-600',  bg: 'bg-yellow-50',  bar: 'bg-yellow-500' }
  return           { grade: 'F9', color: 'text-red-600',     bg: 'bg-red-50',     bar: 'bg-red-500' }
}

function StatusChip({ status, attempt }: { status: ExamStatus; attempt?: ExamAttempt }) {
  const isPending = attempt?.status === 'pending_theory'
  if (status === 'completed')
    return (
      <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
        isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
        {isPending ? <AlertCircle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
        {isPending ? 'Theory Pending' : 'Completed'}
      </span>
    )
  if (status === 'upcoming')
    return <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock className="h-2.5 w-2.5" />Upcoming</span>
  if (attempt?.status === 'in_progress')
    return <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><RotateCcw className="h-2.5 w-2.5" />In Progress</span>
  return <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"><Lock className="h-2.5 w-2.5" />Available</span>
}

function ActionBtn({ status, attempt, examId, onTakeExam, onViewResult }: {
  status: ExamStatus; attempt?: ExamAttempt; examId: string
  onTakeExam: (id: string) => void; onViewResult: (id: string) => void
}) {
  if (status === 'completed') {
    return (
      <Button size="sm" onClick={() => onViewResult(examId)}
        className="h-8 text-xs gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto">
        <Eye className="h-3.5 w-3.5" /> View Result
      </Button>
    )
  }
  if (status === 'upcoming') {
    return (
      <Button size="sm" disabled variant="outline"
        className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 w-full sm:w-auto opacity-60">
        <Clock className="h-3.5 w-3.5" /> Not Yet Open
      </Button>
    )
  }
  if (attempt?.status === 'in_progress') {
    return (
      <Button size="sm" onClick={() => onTakeExam(examId)}
        className="h-8 text-xs gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto">
        <RotateCcw className="h-3.5 w-3.5" /> Resume
      </Button>
    )
  }
  return (
    <Button size="sm" onClick={() => onTakeExam(examId)}
      className="h-8 text-xs gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
      <Play className="h-3.5 w-3.5" /> Start Exam
    </Button>
  )
}

export function ExamCard({ exam, attempt, status, config, viewMode, onTakeExam, onViewResult }: ExamCardProps) {
  const SubjectIcon = config.icon
  const displayPct = attempt?.ca_percentage ?? attempt?.percentage ?? 0
  const gradeInfo = getWAECGrade(displayPct)
  const isPending = attempt?.status === 'pending_theory'

  // ── LIST VIEW ─────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <Card className={cn(
        'border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white group overflow-hidden',
        'hover:-translate-y-0.5'
      )}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Left accent bar */}
            <div className={cn(
              'w-1 shrink-0 rounded-l-xl transition-all duration-200 group-hover:w-1.5',
              status === 'completed' ? (isPending ? 'bg-amber-400' : 'bg-emerald-500')
                : status === 'upcoming' ? 'bg-amber-400'
                : attempt?.status === 'in_progress' ? 'bg-blue-500'
                : 'bg-slate-300'
            )} />

            <div className="flex-1 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                {/* Subject icon */}
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', config.bgColor)}>
                  <SubjectIcon className={cn('h-5 w-5', config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{exam.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{exam.subject} · {exam.class}</p>
                    </div>
                    <StatusChip status={status} attempt={attempt} />
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Timer className="h-3 w-3" /> {exam.duration}m
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <FileQuestion className="h-3 w-3" /> {exam.total_questions} Qs
                    </span>
                    {exam.passing_percentage && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <TrendingUp className="h-3 w-3" /> Pass: {exam.passing_percentage}%
                      </span>
                    )}
                    {exam.has_theory && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">+Theory</span>
                    )}
                  </div>

                  {/* Score bar for completed */}
                  {status === 'completed' && attempt && (
                    <div className="mt-3 max-w-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Score</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-black', gradeInfo.color)}>{displayPct}%</span>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0 rounded-md', gradeInfo.bg, gradeInfo.color)}>
                            {isPending ? '⏳' : gradeInfo.grade}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', gradeInfo.bar)}
                          initial={{ width: 0 }}
                          animate={{ width: `${displayPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0 self-center ml-2 hidden sm:block">
                  <ActionBtn status={status} attempt={attempt} examId={exam.id} onTakeExam={onTakeExam} onViewResult={onViewResult} />
                </div>
              </div>

              {/* Mobile action button */}
              <div className="sm:hidden mt-3 pt-2 border-t border-slate-100">
                <ActionBtn status={status} attempt={attempt} examId={exam.id} onTakeExam={onTakeExam} onViewResult={onViewResult} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── GRID VIEW ─────────────────────────────────────
  return (
    <Card className={cn(
      'border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-white group h-full flex flex-col overflow-hidden',
      'hover:-translate-y-1'
    )}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Coloured top bar */}
        <div className={cn(
          'h-1 w-full',
          status === 'completed' ? (isPending ? 'bg-amber-400' : 'bg-emerald-500')
            : status === 'upcoming' ? 'bg-amber-400'
            : attempt?.status === 'in_progress' ? 'bg-blue-500'
            : 'bg-slate-200'
        )} />

        <div className="p-4 flex flex-col flex-1">
          {/* Header: icon + status */}
          <div className="flex items-start justify-between mb-3">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', config.bgColor)}>
              <SubjectIcon className={cn('h-5 w-5', config.color)} />
            </div>
            <StatusChip status={status} attempt={attempt} />
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug mb-1">{exam.title}</h3>
          <p className="text-[11px] text-slate-400 mb-3">{exam.subject}</p>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Timer className="h-3 w-3" /> {exam.duration}m
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <FileQuestion className="h-3 w-3" /> {exam.total_questions} Qs
            </span>
            {exam.has_theory && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">+Theory</span>
            )}
          </div>

          {/* Score for completed */}
          {status === 'completed' && attempt && (
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={cn('text-lg font-black', gradeInfo.color)}>{displayPct}%</span>
                <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-lg', gradeInfo.bg, gradeInfo.color)}>
                  {isPending ? '⏳ Pending' : gradeInfo.grade}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', gradeInfo.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${displayPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action button */}
          <div className="pt-3 border-t border-slate-100 mt-2">
            <ActionBtn status={status} attempt={attempt} examId={exam.id} onTakeExam={onTakeExam} onViewResult={onViewResult} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}