'use client'

import { cn } from '@/lib/utils'
import type { Question } from '@/app/student/exam/[id]/types'
import { CheckCircle2, Flag, Circle, Dot } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuestionPaletteProps {
  questions: Question[]
  currentIndex: number
  answers: Record<string, string>
  flaggedQuestions: Set<string>
  onGoToQuestion: (index: number) => void
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  flaggedQuestions,
  onGoToQuestion,
}: QuestionPaletteProps) {
  const answeredCount = questions.filter(q => !!answers[q.id]).length
  const flaggedCount = Array.from(flaggedQuestions).filter(id =>
    questions.some(q => q.id === id)
  ).length
  const unansweredCount = questions.length - answeredCount

  const legendItems = [
    { label: 'Answered', count: answeredCount, dotClass: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
    { label: 'Flagged', count: flaggedCount, dotClass: 'bg-gradient-to-br from-amber-500 to-orange-500' },
    { label: 'Current', count: 1, dotClass: 'bg-gradient-to-br from-indigo-600 to-blue-600' },
    { label: 'Unanswered', count: unansweredCount, dotClass: 'bg-slate-300 dark:bg-slate-600' },
  ]

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <LayoutGridIcon />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Question Palette
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
          {questions.length} total
        </span>
      </div>

      <div className="p-4">
        {/* Palette grid */}
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id]
            const isFlagged = flaggedQuestions.has(q.id)
            const isCurrent = idx === currentIndex

            return (
              <motion.button
                key={q.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onGoToQuestion(idx)}
                className={cn(
                  'relative aspect-square rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-sm ring-1',
                  isCurrent
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-700 dark:to-blue-800 text-white ring-indigo-300 dark:ring-indigo-700 shadow-md shadow-indigo-500/40 dark:shadow-indigo-950/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    : isAnswered && isFlagged
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/60 dark:to-orange-900/50 text-amber-800 dark:text-amber-200 ring-amber-300 dark:ring-amber-700'
                      : isAnswered
                        ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/50 text-emerald-800 dark:text-emerald-200 ring-emerald-300 dark:ring-emerald-700'
                        : isFlagged
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800'
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-700 dark:hover:text-slate-200'
                )}
                title={`Question ${idx + 1}${isAnswered ? ' · Answered' : ''}${isFlagged ? ' · Flagged' : ''}`}
              >
                <span className="tabular-nums">{idx + 1}</span>

                {isFlagged && !isCurrent && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-white dark:ring-slate-900" />
                )}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            {legendItems.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/60 ring-1 ring-slate-100 dark:ring-slate-800"
              >
                <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', item.dotClass)} />
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex-1">
                  {item.label}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LayoutGridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}