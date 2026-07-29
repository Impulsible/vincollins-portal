// src/components/student/exams/ExamScoreProgress.tsx - FIXED VERSION

import { Progress } from '@/components/ui/progress'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamScoreProgressProps {
  percentage?: number
  score?: number
  total?: number
  theoryPending?: boolean
  className?: string
  label?: string  // ✅ Dynamic label
}

export function ExamScoreProgress({ 
  percentage, 
  score, 
  total, 
  theoryPending = false,
  className,
  label = 'Your Score'  // ✅ Only fallback
}: ExamScoreProgressProps) {
  // ✅ Only show if percentage exists
  if (percentage === undefined && score === undefined) {
    return null
  }

  const displayPercentage = percentage !== undefined ? Math.round(percentage) : 0
  const isPassing = displayPercentage >= 50  // ✅ This should ideally come from database

  return (
    <div className={cn("mb-3", className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        {percentage !== undefined && (
          <span className={cn(
            "font-bold",
            theoryPending ? "text-amber-600" : isPassing ? "text-green-600" : "text-red-600"
          )}>
            {displayPercentage}%
          </span>
        )}
      </div>
      
      {percentage !== undefined && (
        <Progress value={Math.min(displayPercentage, 100)} className="h-2" />
      )}
      
      {score !== undefined && total !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">
          {score}/{total} marks
        </p>
      )}
      
      {theoryPending && (
        <div className="flex items-center gap-1 mt-1 text-amber-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>Theory pending</span>
        </div>
      )}
    </div>
  )
}