// src/components/student/exams/TermProgressCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { History, Award, RefreshCw, TrendingUp, CheckCircle2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatsState, TermOption, TermSession } from '@/app/student/types'

interface TermProgressCardProps {
  stats: StatsState
  availableTerms: TermOption[]
  selectedTermSession: TermSession | null
  onTermChange: (value: string) => void
  onRefresh: () => void
  studentClass?: string
  studentDepartment?: string
  isLoading?: boolean
}

const getGradeStyle = (grade: string) => {
  switch (grade) {
    case 'A': return { bg: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
    case 'B': return { bg: 'bg-blue-500',    soft: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' }
    case 'C': return { bg: 'bg-amber-500',   soft: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' }
    case 'P': return { bg: 'bg-orange-500',  soft: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' }
    case 'F': return { bg: 'bg-red-500',     soft: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' }
    default:  return { bg: 'bg-slate-400',   soft: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200' }
  }
}

export function TermProgressCard({ 
  stats, 
  availableTerms, 
  selectedTermSession, 
  onTermChange, 
  onRefresh,
  studentClass,
  studentDepartment,
  isLoading = false
}: TermProgressCardProps) {
  const completionPct = stats.totalSubjects > 0 ? Math.round((stats.completed / stats.totalSubjects) * 100) : 0
  const displayGrade = stats.completed > 0 && stats.currentGrade && stats.currentGrade !== 'N/A' ? stats.currentGrade : null
  const gradeStyle = displayGrade ? getGradeStyle(displayGrade) : getGradeStyle('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Auto-select the current term when availableTerms changes
  useEffect(() => {
    if (availableTerms.length > 0 && !selectedTermSession && !isInitialized && !isLoading) {
      // Priority 1: Find the current term (marked as current)
      const currentTerm = availableTerms.find(t => t.is_current === true)
      
      if (currentTerm) {
        onTermChange(`${currentTerm.term}|${currentTerm.session_year}`)
        setIsInitialized(true)
        return
      }

      // Priority 2: Find the most recent term based on session_year
      const sortedTerms = [...availableTerms].sort((a, b) => {
        const aYear = parseInt(a.session_year.split('/')[0])
        const bYear = parseInt(b.session_year.split('/')[0])
        return bYear - aYear
      })
      
      if (sortedTerms.length > 0) {
        const mostRecent = sortedTerms[0]
        onTermChange(`${mostRecent.term}|${mostRecent.session_year}`)
        setIsInitialized(true)
      }
    }
  }, [availableTerms, selectedTermSession, onTermChange, isInitialized, isLoading])

  // Reset initialization when availableTerms changes (after refresh)
  useEffect(() => {
    if (availableTerms.length > 0) {
      setIsInitialized(false)
    }
  }, [availableTerms.length])

  // Get current term label for display
  const getCurrentTermLabel = () => {
    if (!selectedTermSession) return 'Select term'
    const term = availableTerms.find(
      t => t.term === selectedTermSession.term && t.session_year === selectedTermSession.session_year
    )
    return term ? term.label : `${selectedTermSession.term} ${selectedTermSession.session_year}`
  }

  // Check if a term is current
  const isTermCurrent = (term: TermOption) => {
    return term.is_current || 
      (selectedTermSession && 
       term.term === selectedTermSession.term && 
       term.session_year === selectedTermSession.session_year)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
      <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-0">

          {/* Top coloured progress strip */}
          <div className="h-1 w-full bg-slate-100 overflow-hidden">
            <motion.div
              className={cn('h-full', displayGrade ? gradeStyle.bg : 'bg-blue-500')}
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>

          <div className="p-4 sm:p-5">
            {/* Top row: term selector + grade + refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">

              {/* Term selector with current term indicator */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-initial sm:min-w-[240px]">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                {isLoading ? (
                  <span className="text-sm text-slate-400">Loading terms...</span>
                ) : availableTerms.length > 0 ? (
                  <Select
                    value={selectedTermSession ? `${selectedTermSession.term}|${selectedTermSession.session_year}` : ''}
                    onValueChange={(value) => {
                      onTermChange(value)
                      setIsInitialized(true)
                    }}
                  >
                    <SelectTrigger className="border-0 h-auto p-0 shadow-none focus:ring-0 text-sm font-semibold text-slate-700 bg-transparent w-full">
                      <SelectValue placeholder="Select term">
                        {getCurrentTermLabel()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableTerms.map(t => {
                        const isCurrent = isTermCurrent(t)
                        
                        return (
                          <SelectItem key={`${t.term}|${t.session_year}`} value={`${t.term}|${t.session_year}`}>
                            <div className="flex items-center gap-2">
                              <span>{t.label}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-slate-400">No terms available</span>
                )}
              </div>

              {/* Stats chips */}
              <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {stats.completed}/{stats.totalSubjects} done
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  {stats.averageScore}% avg
                </div>
                {displayGrade && (
                  <div className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border', gradeStyle.soft, gradeStyle.text, gradeStyle.border)}>
                    <Award className="h-3.5 w-3.5" />
                    Grade {displayGrade}
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setIsInitialized(false)
                  onRefresh()
                }}
                className="h-8 w-8 rounded-xl shrink-0 hover:bg-slate-100" 
                title="Refresh"
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', isLoading && 'animate-spin')} />
              </Button>
            </div>

            {/* Progress bar area */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Term Completion</span>
                <span className={cn('font-bold', displayGrade ? gradeStyle.text : 'text-slate-500')}>
                  {isLoading ? '...' : `${completionPct}%`}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', displayGrade ? gradeStyle.bg : 'bg-blue-500')}
                  initial={{ width: 0 }}
                  animate={{ width: isLoading ? 0 : `${completionPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {isLoading ? 'Loading...' : (
                  <>
                    {stats.completed} of {stats.totalSubjects} subjects completed
                    {stats.averageScore > 0 && ` · Average: ${stats.averageScore}%`}
                    {displayGrade && ` · Grade: ${displayGrade}`}
                    {studentClass && ` · Class: ${studentClass}`}
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}