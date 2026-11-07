'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Send, LayoutGrid, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionNavigationProps {
  currentIndex: number
  totalQuestions: number
  onPrevious: () => void
  onNext: () => void
  onTogglePalette: () => void
  onSubmit: () => void
}

export function QuestionNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onTogglePalette,
  onSubmit,
}: QuestionNavigationProps) {
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalQuestions - 1
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      <div className="relative h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 gap-1.5 font-semibold text-sm disabled:opacity-40 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {currentIndex + 1}
            </span>
            <span className="text-slate-300 dark:text-slate-600 text-sm">/</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">{totalQuestions}</span>
          </div>

          <Button
            variant="outline"
            onClick={onTogglePalette}
            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 font-semibold text-sm shadow-sm"
            title="Question palette"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Palette</span>
          </Button>
        </div>

        {isLast ? (
          <Button
            onClick={onSubmit}
            className={cn(
              'relative h-11 rounded-xl font-bold text-sm text-white gap-1.5 shadow-md overflow-hidden group',
              'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
              'dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800',
              'shadow-emerald-500/30 dark:shadow-emerald-950/50'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Sparkles className="h-4 w-4" />
            <span>Submit</span>
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className={cn(
              'relative h-11 rounded-xl font-bold text-sm text-white gap-1.5 shadow-md overflow-hidden group',
              'bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800',
              'dark:from-indigo-700 dark:to-blue-800 dark:hover:from-indigo-800 dark:hover:to-blue-900',
              'shadow-indigo-500/30 dark:shadow-indigo-950/50'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}