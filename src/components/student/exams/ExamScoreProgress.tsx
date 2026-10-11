// src/components/student/exams/ExamScoreProgress.tsx
import { Progress } from '@/components/ui/progress'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamScoreProgressProps {
  percentage?: number
  score?: number
  total?: number
  theoryPending?: boolean
  className?: string
  label?: string
}

export function ExamScoreProgress({ percentage, score, total, theoryPending = false, className, label = 'Your Score' }: ExamScoreProgressProps) {
  if (percentage === undefined && score === undefined) return null
  const displayPercentage = percentage !== undefined ? Math.round(percentage) : 0
  const isPassing = displayPercentage >= 50

  return (
    <div className={cn("mb-3", className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        {percentage !== undefined && (
          <span className={cn("font-bold", theoryPending ? "text-amber-600 dark:text-amber-400" : isPassing ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {displayPercentage}%
          </span>
        )}
      </div>
      {percentage !== undefined && <Progress value={Math.min(displayPercentage, 100)} className="h-2 bg-slate-100 dark:bg-slate-800" />}
      {score !== undefined && total !== undefined && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{score}/{total} marks</p>
      )}
      {theoryPending && (
        <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 text-xs">
          <AlertCircle className="h-3 w-3" /><span>Theory pending</span>
        </div>
      )}
    </div>
  )
}