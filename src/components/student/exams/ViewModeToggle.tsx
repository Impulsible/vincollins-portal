// src/components/student/exams/ViewModeToggle.tsx
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import type { ViewMode } from '@/app/student/exams/types'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center bg-background rounded-lg border p-0.5 self-start">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className="h-8 w-8 p-0"
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        className="h-8 w-8 p-0"
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}