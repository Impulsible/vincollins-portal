// src/components/student/exams/SubjectFilter.tsx
'use client'

import { motion } from 'framer-motion'
import { Filter, Search, LayoutGrid, List, BookOpen, CheckCircle } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  availableSubjects, selectedSubject, onSubjectChange, searchQuery,
  onSearchChange, viewMode, onViewModeChange, exams, examAttempts, getSubjectConfig,
}: SubjectFilterProps) {
  if (availableSubjects.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
      {/* Top row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search exams..."
            value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm bg-white border-slate-200 rounded-xl"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shrink-0">
          {(['grid', 'list'] as ViewMode[]).map(mode => (
            <button key={mode} onClick={() => onViewModeChange(mode)}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150',
                viewMode === mode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}>
              {mode === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Subject chips */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {/* All chip */}
          <SubjectChipNew
            label="All Subjects"
            count={exams.length}
            isSelected={selectedSubject === 'all'}
            onClick={() => onSubjectChange('all')}
          />
          {availableSubjects.map(subject => {
            const config = getSubjectConfig(subject)
            const SubjectIcon = config.icon
            const count = exams.filter(e => e.subject === subject).length
            const hasAttempt = exams.filter(e => e.subject === subject).some(e => examAttempts[e.id]?.status === 'completed')
            return (
              <SubjectChipNew
                key={subject}
                label={subject}
                count={count}
                isSelected={selectedSubject === subject}
                hasAttempt={hasAttempt}
                icon={SubjectIcon}
                iconColor={config.color}
                iconBg={config.bgColor}
                onClick={() => onSubjectChange(subject)}
              />
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  )
}

function SubjectChipNew({
  label, count, isSelected, hasAttempt, icon: Icon, iconColor, iconBg, onClick,
}: {
  label: string; count: number; isSelected: boolean; hasAttempt?: boolean
  icon?: any; iconColor?: string; iconBg?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 border transition-all duration-150',
        isSelected
          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      {Icon && !isSelected && (
        <span className={cn('h-4 w-4 rounded flex items-center justify-center', iconBg)}>
          <Icon className={cn('h-2.5 w-2.5', iconColor)} />
        </span>
      )}
      {!Icon && <BookOpen className="h-3 w-3 opacity-60" />}
      <span>{label.length > 14 ? label.substring(0, 14) + '…' : label}</span>
      <span className={cn(
        'px-1.5 py-0 rounded-full text-[10px] font-semibold',
        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
      )}>
        {count}
      </span>
      {hasAttempt && !isSelected && (
        <CheckCircle className="h-3 w-3 text-emerald-500" />
      )}
    </button>
  )
}