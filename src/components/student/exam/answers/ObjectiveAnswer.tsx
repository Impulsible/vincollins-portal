// src/components/student/exam/answers/ObjectiveAnswer.tsx
import { cn } from '@/lib/utils'

interface ObjectiveAnswerProps {
  options: string[]
  selectedValue: string
  onChange: (value: string) => void
}

export function ObjectiveAnswer({ options, selectedValue, onChange }: ObjectiveAnswerProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div className="space-y-2">
      {options.map((opt, idx) => {
        const isSelected = selectedValue === opt
        return (
          <button
            key={idx}
            onClick={() => onChange(opt)}
            className={cn(
              "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150",
              isSelected
                ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-sm"
                : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            )}
          >
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
              isSelected 
                ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            )}>
              {letters[idx]}
            </div>
            <span className={cn(
              "text-sm leading-snug",
              isSelected 
                ? "text-blue-700 dark:text-blue-300 font-medium" 
                : "text-slate-700 dark:text-slate-300"
            )}>
              {opt}
            </span>
          </button>
        )
      })}
    </div>
  )
}