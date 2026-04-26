// src/components/student/exams/SubjectFilter.tsx
import { Filter } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { SubjectChip } from './SubjectChip'
import { SearchBar } from './SearchBar'
import { ViewModeToggle } from './ViewModeToggle'
import type { Exam, ExamAttempt, ViewMode, SubjectConfig } from '@/app/student/exams/types'

interface SubjectFilterProps {
  availableSubjects: string[]
  selectedSubject: string
  onSubjectChange: (subject: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  exams: Exam[]
  examAttempts: Record<string, ExamAttempt>
  getSubjectConfig: (subject: string) => SubjectConfig
}

export function SubjectFilter({
  availableSubjects,
  selectedSubject,
  onSubjectChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  exams,
  examAttempts,
  getSubjectConfig,
}: SubjectFilterProps) {
  if (availableSubjects.length === 0) return null

  return (
    <div className="mb-5 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter by Subject
        </h2>
        
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:ml-auto">
          <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>
      </div>

      {/* Subject Chips */}
      <ScrollArea className="w-full whitespace-nowrap pb-3">
        <div className="flex gap-2">
          {/* All Subjects Chip */}
          <SubjectChip
            subject="all"
            label="All Subjects"
            count={exams.length}
            isSelected={selectedSubject === 'all'}
            onClick={() => onSubjectChange('all')}
          />

          {/* Individual Subject Chips */}
          {availableSubjects.map(subject => {
            const config = getSubjectConfig(subject)
            const count = exams.filter(e => e.subject === subject).length
            const hasAttempt = exams
              .filter(e => e.subject === subject)
              .some(e => examAttempts[e.id]?.status === 'completed')

            return (
              <SubjectChip
                key={subject}
                subject={subject}
                label={subject}
                count={count}
                isSelected={selectedSubject === subject}
                hasAttempt={hasAttempt}
                config={config}
                onClick={() => onSubjectChange(subject)}
              />
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}