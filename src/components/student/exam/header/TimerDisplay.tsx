// src/app/student/exam/[id]/components/TimerDisplay.tsx
'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import { TIME_WARNING_THRESHOLD } from '@/app/student/exam/[id]/constants'

interface TimerDisplayProps {
  timeLeft: number
}

export function TimerDisplay({ timeLeft }: TimerDisplayProps) {
  const isWarning = timeLeft < TIME_WARNING_THRESHOLD
  const isDanger = timeLeft < 60

  return (
    <div
      className={cn(
        'relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-bold text-sm transition-all overflow-hidden ring-1',
        isDanger
          ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-rose-300 dark:ring-rose-700 shadow-lg shadow-rose-500/30 dark:shadow-rose-950/50 animate-pulse'
          : isWarning
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/50 shadow-sm'
            : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/70 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700'
      )}
    >
      <Clock className={cn(
        'h-4 w-4 shrink-0',
        isDanger 
          ? 'text-white' 
          : isWarning 
          ? 'text-amber-600 dark:text-amber-400' 
          : 'text-slate-500 dark:text-slate-400'
      )} />
      <span className="tabular-nums tracking-wider text-[15px]">
        {formatTime(timeLeft)}
      </span>
    </div>
  )
}