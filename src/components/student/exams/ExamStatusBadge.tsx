// src/components/student/exams/ExamStatusBadge.tsx
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Unlock, Play, Lock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamAttempt, ExamStatus } from '@/app/student/exams/types'

interface ExamStatusBadgeProps {
  status: ExamStatus
  attempt?: ExamAttempt
  className?: string
  showTooltip?: boolean
}

const getStatusConfig = (status: ExamStatus, attempt?: ExamAttempt) => {
  if (attempt?.status === 'in_progress') return { label: 'In Progress', icon: Play, className: 'bg-blue-500 text-white border-0' }
  if (attempt?.status === 'pending_theory') return { label: 'Theory Pending', icon: AlertCircle, className: 'bg-amber-500 text-white border-0' }
  switch (status) {
    case 'completed': return { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-500 text-white border-0' }
    case 'upcoming': return { label: 'Upcoming', icon: Clock, className: 'bg-amber-500 text-white border-0' }
    case 'available': return { label: 'Ready', icon: Unlock, className: 'bg-emerald-500 text-white border-0' }
    case 'expired': return { label: 'Expired', icon: Lock, className: 'bg-slate-500 dark:bg-slate-600 text-white border-0' }
    default: return null
  }
}

export function ExamStatusBadge({ status, attempt, className }: ExamStatusBadgeProps) {
  const config = getStatusConfig(status, attempt)
  if (!config) return null
  const Icon = config.icon
  return (
    <div className={cn("absolute top-3 right-3 z-10", className)}>
      <Badge className={cn("text-xs font-medium", config.className)}>
        <Icon className="h-3 w-3 mr-1" />{config.label}
      </Badge>
    </div>
  )
}