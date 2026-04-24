// src/components/staff/exams/ExamFilters.tsx - FULLY RESPONSIVE
'use client'

import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, X } from 'lucide-react'

interface ExamFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
}

export function ExamFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: ExamFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
        <Input
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 sm:pl-9 pr-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={onStatusFilterChange} className="w-full sm:w-auto">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:flex h-9 sm:h-10 lg:h-11">
          <TabsTrigger value="all" className="text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3">
            All
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3">
            Pending
          </TabsTrigger>
          <TabsTrigger value="published" className="text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3">
            Published
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}