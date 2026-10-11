// src/components/student/exams/TermProgressCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Award, RefreshCw, TrendingUp, CheckCircle2, Calendar } from 'lucide-react'
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
    case 'A': return { bg: 'bg-emerald-500', soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' }
    case 'B': return { bg: 'bg-blue-500',    soft: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-200 dark:border-blue-800' }
    case 'C': return { bg: 'bg-amber-500',   soft: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800' }
    case 'P': return { bg: 'bg-orange-500',  soft: 'bg-orange-50 dark:bg-orange-950/40',  text: 'text-orange-700 dark:text-orange-300',  border: 'border-orange-200 dark:border-orange-800' }
    case 'F': return { bg: 'bg-red-500',     soft: 'bg-red-50 dark:bg-red-950/40',     text: 'text-red-700 dark:text-red-300',     border: 'border-red-200 dark:border-red-800' }
    default:  return { bg: 'bg-slate-400',   soft: 'bg-slate-50 dark:bg-slate-800/60',   text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700' }
  }
}

export function TermProgressCard({ 
  stats, availableTerms, selectedTermSession, onTermChange, onRefresh,
  studentClass, studentDepartment, isLoading = false
}: TermProgressCardProps) {
  const completionPct = stats.totalSubjects > 0 ? Math.round((stats.completed / stats.totalSubjects) * 100) : 0
  const displayGrade = stats.completed > 0 && stats.currentGrade && stats.currentGrade !== 'N/A' ? stats.currentGrade : null
  const gradeStyle = displayGrade ? getGradeStyle(displayGrade) : getGradeStyle('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (availableTerms.length > 0 && !selectedTermSession && !isInitialized && !isLoading) {
      const currentTerm = availableTerms.find(t => t.is_current === true)
      if (currentTerm) {
        onTermChange(`${currentTerm.term}|${currentTerm.session_year}`)
        setIsInitialized(true)
        return
      }
      const sortedTerms = [...availableTerms].sort((a, b) => {
        const aYear = parseInt(a.session_year.split('/')[0])
        const bYear = parseInt(b.session_year.split('/')[0])
        return bYear - aYear
      })
      if (sortedTerms.length > 0) {
        onTermChange(`${sortedTerms[0].term}|${sortedTerms[0].session_year}`)
        setIsInitialized(true)
      }
    }
  }, [availableTerms, selectedTermSession, onTermChange, isInitialized, isLoading])

  useEffect(() => {
    if (availableTerms.length > 0) setIsInitialized(false)
  }, [availableTerms.length])

  const getCurrentTermLabel = () => {
    if (!selectedTermSession) return 'Select term'
    const term = availableTerms.find(
      t => t.term === selectedTermSession.term && t.session_year === selectedTermSession.session_year
    )
    return term ? term.label : `${selectedTermSession.term} ${selectedTermSession.session_year}`
  }

  const isTermCurrent = (term: TermOption) => {
    return term.is_current || 
      (selectedTermSession && 
       term.term === selectedTermSession.term && 
       term.session_year === selectedTermSession.session_year)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden transition-colors duration-300">
        <CardContent className="p-0">
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className={cn('h-full', displayGrade ? gradeStyle.bg : 'bg-blue-500')}
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 sm:flex-initial sm:min-w-[240px]">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                {isLoading ? (
                  <span className="text-sm text-slate-400 dark:text-slate-500">Loading terms...</span>
                ) : availableTerms.length > 0 ? (
                  <Select
                    value={selectedTermSession ? `${selectedTermSession.term}|${selectedTermSession.session_year}` : ''}
                    onValueChange={(value) => { onTermChange(value); setIsInitialized(true) }}
                  >
                    <SelectTrigger className="border-0 h-auto p-0 shadow-none focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent w-full">
                      <SelectValue placeholder="Select term">{getCurrentTermLabel()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {availableTerms.map(t => (
                        <SelectItem key={`${t.term}|${t.session_year}`} value={`${t.term}|${t.session_year}`} className="text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{t.label}</span>
                            {isTermCurrent(t) && (
                              <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-slate-400 dark:text-slate-500">No terms available</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {stats.completed}/{stats.totalSubjects} done
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
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
                variant="ghost" size="icon"
                onClick={() => { setIsInitialized(false); onRefresh() }}
                className="h-8 w-8 rounded-xl shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" 
                title="Refresh" disabled={isLoading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500 dark:text-slate-400', isLoading && 'animate-spin')} />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Term Completion</span>
                <span className={cn('font-bold', displayGrade ? gradeStyle.text : 'text-slate-500 dark:text-slate-400')}>
                  {isLoading ? '...' : `${completionPct}%`}
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', displayGrade ? gradeStyle.bg : 'bg-blue-500')}
                  initial={{ width: 0 }}
                  animate={{ width: isLoading ? 0 : `${completionPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
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