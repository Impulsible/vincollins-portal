// components/admin/students/components/ViewModeToggle.tsx

'use client'

import { cn } from '@/lib/utils'
import { FolderOpen, Users } from 'lucide-react'
import { ViewMode } from '../types'

interface ViewModeToggleProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  onClearSelection: () => void
}

export function ViewModeToggle({ viewMode, setViewMode, onClearSelection }: ViewModeToggleProps) {
  return (
    <div className="flex bg-muted rounded-lg p-1">
      <button
        onClick={() => {
          setViewMode('classes')
          onClearSelection()
        }}
        className={cn(
          'px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2',
          viewMode === 'classes'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <FolderOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Classes</span>
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={cn(
          'px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2',
          viewMode === 'list'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">All Students</span>
      </button>
    </div>
  )
}