// src/components/student/exams/ExamScoreProgress.tsx
import { Progress } from '@/components/ui/progress'

interface ExamScoreProgressProps {
  percentage?: number
  score?: number
  total?: number
}

export function ExamScoreProgress({ percentage = 0, score, total }: ExamScoreProgressProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
        <span className="text-muted-foreground">Your Score</span>
        <span className="font-bold text-green-600">
          {percentage.toFixed(1)}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {score !== undefined && total !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">
          {score}/{total} points
        </p>
      )}
    </div>
  )
}