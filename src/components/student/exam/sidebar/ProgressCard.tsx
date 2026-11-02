'use client'

import { CheckCircle2, Flag, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProgressCardProps {
  answeredCount: number
  flaggedCount: number
  unansweredCount: number
  progressPercentage: number
}

export function ProgressCard({
  answeredCount,
  flaggedCount,
  unansweredCount,
  progressPercentage,
}: ProgressCardProps) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900">Exam Progress</h4>
          <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent tabular-nums">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 ring-1 ring-emerald-200/60 p-2.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-emerald-700 tabular-nums leading-none">
              {answeredCount}
            </p>
            <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wider mt-1">
              Answered
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 ring-1 ring-amber-200/60 p-2.5 text-center">
            <Flag className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-amber-700 tabular-nums leading-none">
              {flaggedCount}
            </p>
            <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider mt-1">
              Flagged
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 ring-1 ring-slate-200/60 p-2.5 text-center">
            <HelpCircle className="h-4 w-4 text-slate-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-slate-600 tabular-nums leading-none">
              {unansweredCount}
            </p>
            <p className="text-[9px] font-bold text-slate-500/70 uppercase tracking-wider mt-1">
              Remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}