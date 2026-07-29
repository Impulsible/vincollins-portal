// src/components/student/exams/SubjectChip.tsx - FIXED VERSION

import { Badge } from '@/components/ui/badge'
import { CheckCircle, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubjectConfig } from '@/app/student/exams/types'

interface SubjectChipProps {
  subject: string
  label: string
  count: number
  isSelected: boolean
  hasAttempt?: boolean
  config?: SubjectConfig
  onClick: () => void
  // ✅ Dynamic truncation options
  maxLabelLength?: number
  showIcon?: boolean
  showCheckmark?: boolean
}

export function SubjectChip({
  subject,
  label,
  count,
  isSelected,
  hasAttempt,
  config,
  onClick,
  maxLabelLength = 12,  // ✅ Only fallback
  showIcon = true,
  showCheckmark = true,
}: SubjectChipProps) {
  const SubjectIcon = config?.icon || BookOpen
  
  // ✅ Dynamic label truncation
  const displayLabel = subject === 'all' 
    ? label 
    : label.length > maxLabelLength 
      ? label.substring(0, maxLabelLength) + '...' 
      : label

  return (
    <Badge
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm flex items-center gap-2 shrink-0",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        hasAttempt && "border-green-300"
      )}
      onClick={onClick}
    >
      {showIcon && config && <SubjectIcon className="h-3.5 w-3.5" />}
      
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{displayLabel}</span>
      
      <span className={cn(
        "ml-1 px-2 py-0.5 rounded-full text-xs",
        isSelected ? "bg-background/20" : "bg-muted"
      )}>
        {count}
      </span>
      
      {showCheckmark && hasAttempt && (
        <CheckCircle className="h-3 w-3 text-green-500 ml-0.5" />
      )}
    </Badge>
  )
}