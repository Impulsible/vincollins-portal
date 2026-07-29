// src/components/student/exams/ExamDetails.tsx - FIXED VERSION

import { Clock, FileText, Award, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamDetailsProps {
  duration: number
  totalQuestions: number
  totalMarks: number
  passingPercentage?: number
  className?: string
}

export function ExamDetails({
  duration,
  totalQuestions,
  totalMarks,
  passingPercentage,
  className,
}: ExamDetailsProps) {
  // ✅ Only show passing percentage if provided
  const details = [
    { icon: Clock, label: 'Duration', value: `${duration} min` },
    { icon: FileText, label: 'Questions', value: `${totalQuestions} Qs` },
    { icon: Award, label: 'Points', value: `${totalMarks} pts` },
  ]

  // ✅ Add passing percentage only if it exists
  if (passingPercentage !== undefined && passingPercentage !== null) {
    details.push({ 
      icon: Target, 
      label: 'Pass Mark', 
      value: `${passingPercentage}%` 
    })
  }

  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs sm:text-sm",
      className
    )}>
      {details.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{value}</span>
        </div>
      ))}
    </div>
  )
}