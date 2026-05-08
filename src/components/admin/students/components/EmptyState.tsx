// components/admin/students/components/EmptyState.tsx

'use client'

import { Users } from 'lucide-react'

interface EmptyStateProps {
  searchQuery?: string
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <Users className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div className="text-center">
        <p className="text-muted-foreground font-medium">No students found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {searchQuery
            ? 'Try a different search term'
            : 'Click "Add Student" to get started'}
        </p>
      </div>
    </div>
  )
}