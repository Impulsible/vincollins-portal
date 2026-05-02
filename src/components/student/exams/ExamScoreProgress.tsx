// src/components/student/exams/ExamScoreProgress.tsx - UPDATED
import { Progress } from '@/components/ui/progress'
import { Clock } from 'lucide-react'

interface ExamScoreProgressProps {
  percentage?: number
  score?: number
  total?: number
  theoryPending?: boolean
}

export function ExamScoreProgress({ percentage = 0, score, total, theoryPending = false }: ExamScoreProgressProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
        <span className="text-muted-foreground">Your Score</span>
        <span className="font-bold text-green-600">{Math.round(percentage)}%</span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-2" />
      {score !== undefined && total !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">{score}/{total} marks</p>
      )}
      {theoryPending && (
        <div className="flex items-center gap-1 mt-1 text-amber-600 text-xs">
          <Clock className="h-3 w-3" />
          <span>Theory pending</span>
        </div>
      )}
    </div>
  )
}