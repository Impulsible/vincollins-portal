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
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
              isSelected
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {letters[idx]}
            </div>
            <span className={cn(
              "text-base",
              isSelected ? "text-blue-700 font-medium" : "text-slate-700"
            )}>
              {opt}
            </span>
          </button>
        )
      })}
    </div>
  )
}