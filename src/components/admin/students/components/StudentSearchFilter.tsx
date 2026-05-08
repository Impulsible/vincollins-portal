// components/admin/students/components/StudentSearchFilter.tsx

'use client'

import { Search, X, FolderOpen, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CLASSES } from '../constants'
import { ClassGroup } from '../types'

interface StudentSearchFilterProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  classFilter: string
  setClassFilter: (filter: string) => void
  selectedClass: string | null
  setSelectedClass: (className: string | null) => void
  classGroups: Record<string, ClassGroup>
  totalStudents: number
  onRefresh: () => void
  onBackToClasses: () => void
}

export function StudentSearchFilter({
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  selectedClass,
  setSelectedClass,
  classGroups,
  totalStudents,
  onRefresh,
  onBackToClasses,
}: StudentSearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, VIN ID, or Admission No..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {!selectedClass && (
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes ({totalStudents})</SelectItem>
              {CLASSES.map(cls => {
                const count = classGroups[cls]?.count || 0
                return count > 0 ? (
                  <SelectItem key={cls} value={cls}>
                    {cls} ({count})
                  </SelectItem>
                ) : null
              })}
            </SelectContent>
          </Select>
        )}

        {selectedClass && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {selectedClass}
              <button onClick={() => setSelectedClass(null)} className="ml-2 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
            <Button variant="ghost" size="sm" onClick={onBackToClasses}>
              <FolderOpen className="mr-2 h-4 w-4" />
              All Classes
            </Button>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}