'use client'

import { cn } from '@/lib/utils'
import { QuestionContent } from '@/components/shared/QuestionContent'

interface ObjectiveAnswerProps {
  options: string[]
  selectedValue: string
  onChange: (value: string) => void
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function ObjectiveAnswer({
  options = [],
  selectedValue,
  onChange,
}: ObjectiveAnswerProps) {
  // Filter out any blank or null options accidentally passed from DB
  const validOptions = (options || []).filter((opt) => opt !== null && opt !== undefined && String(opt).trim() !== '')

  if (validOptions.length === 0) {
    return (
      <div className="p-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
        No options available for this question.
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {validOptions.map((opt, idx) => {
        const optionStr = String(opt)
        const isSelected = selectedValue === optionStr
        // Fallback letter if more than 8 options exist
        const letter = LETTERS[idx] || String.fromCharCode(65 + idx)

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(optionStr)}
            className={cn(
              "w-full flex items-start sm:items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-150 select-none group",
              isSelected
                ? "border-blue-500 dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
            )}
          >
            {/* Letter Badge */}
            <div
              className={cn(
                "h-7 w-7 min-w-[28px] rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors mt-0.5 sm:mt-0",
                isSelected
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 dark:group-hover:text-blue-400"
              )}
            >
              {letter}
            </div>

            {/* Option Text / Math rendering */}
            <div
              className={cn(
                "text-sm leading-relaxed flex-1 min-w-0 pt-0.5 sm:pt-0",
                isSelected
                  ? "text-blue-900 dark:text-blue-200 font-medium"
                  : "text-slate-700 dark:text-slate-300"
              )}
            >
              <QuestionContent text={optionStr} />
            </div>
          </button>
        )
      })}
    </div>
  )
}