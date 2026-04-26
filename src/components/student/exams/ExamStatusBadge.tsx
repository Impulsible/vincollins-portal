// src/components/student/exams/ExamStatusBadge.tsx
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Unlock, Play } from 'lucide-react'
import type { ExamAttempt, ExamStatus } from '@/app/student/exams/types'

interface ExamStatusBadgeProps {
  status: ExamStatus
  attempt?: ExamAttempt
}

export function ExamStatusBadge({ status, attempt }: ExamStatusBadgeProps) {
  // Show "In Progress" if there's an active attempt
  if (attempt?.status === 'in_progress') {
    return (
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-blue-500 text-white border-0 text-xs">
          <Play className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-green-500 text-white border-0 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      </div>
    )
  }

  if (status === 'upcoming') {
    return (
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-amber-500 text-white border-0 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Upcoming
        </Badge>
      </div>
    )
  }

  if (status === 'available' && !attempt) {
    return (
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-emerald-500 text-white border-0 text-xs">
          <Unlock className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      </div>
    )
  }

  return null
}