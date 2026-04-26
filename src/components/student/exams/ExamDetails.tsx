// src/components/student/exams/ExamDetails.tsx
import { Clock, FileText, Award, Target } from 'lucide-react'

interface ExamDetailsProps {
  duration: number
  totalQuestions: number
  totalMarks: number
  passingPercentage?: number
}

export function ExamDetails({
  duration,
  totalQuestions,
  totalMarks,
  passingPercentage = 50,
}: ExamDetailsProps) {
  const details = [
    { icon: Clock, label: 'Duration', value: `${duration} min` },
    { icon: FileText, label: 'Questions', value: `${totalQuestions} Qs` },
    { icon: Award, label: 'Points', value: `${totalMarks} pts` },
    { icon: Target, label: 'Pass Mark', value: `${passingPercentage}%` },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
      {details.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{value}</span>
        </div>
      ))}
    </div>
  )
}