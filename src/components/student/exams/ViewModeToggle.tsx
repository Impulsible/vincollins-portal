// src/components/student/exams/ViewModeToggle.tsx - FIXED VERSION

import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/app/student/exams/types'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
  // ✅ Optional customization
  className?: string
  size?: 'sm' | 'md' | 'lg'
  labels?: {
    grid?: string
    list?: string
  }
}

export function ViewModeToggle({ 
  viewMode, 
  onChange, 
  className,
  size = 'sm',
  labels = { grid: 'Grid view', list: 'List view' }
}: ViewModeToggleProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4.5 w-4.5',
    lg: 'h-5 w-5'
  }

  return (
    <div className={cn("flex items-center bg-background rounded-lg border p-0.5 self-start", className)}>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className={cn("p-0", sizeClasses[size])}
        title={labels.grid}
        aria-label={labels.grid}
      >
        <LayoutGrid className={cn("shrink-0", iconSizes[size])} />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        className={cn("p-0", sizeClasses[size])}
        title={labels.list}
        aria-label={labels.list}
      >
        <List className={cn("shrink-0", iconSizes[size])} />
      </Button>
    </div>
  )
}