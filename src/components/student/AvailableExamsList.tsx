// components/student/AvailableExamsList.tsx - UPDATED WITH ACCOUNT ARCHIVE COMPLIANCE
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MonitorPlay, ChevronRight, Clock, FileText, Award, 
  Target, CheckCircle, Lock, Sparkles, Trophy, Inbox, ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Exam {
  id: string
  title: string
  subject: string
  duration: number
  total_questions: number
  total_marks: number
  passing_percentage?: number
  has_theory?: boolean
  term?: string
  session_year?: string
  starts_at?: string
  ends_at?: string
}

interface CompletedExam {
  exam_id: string
  subject: string
  term: string
  session_year: string
  score: number
  passed: boolean
  completed_at: string
}

interface AvailableExamsListProps {
  exams: Exam[]
  onTakeExam: (examId: string) => void
  onViewAll?: () => void
  showViewAll?: boolean
  compact?: boolean
  currentTerm?: string
  currentSession?: string
  completedExams?: CompletedExam[]
  onTermChange?: (term: string) => void
  isLoading?: boolean
  isActiveAccount?: boolean // 👈 Added status prop
}

const normalizeTerm = (term: string = ''): string => {
  const termLower = term?.toLowerCase() || ''
  if (termLower === 'first' || termLower === '1st' || termLower === '1') return '1st Term'
  if (termLower === 'second' || termLower === '2nd' || termLower === '2') return '2nd Term'
  if (termLower === 'third' || termLower === '3rd' || termLower === '3') return '3rd Term'
  return term || 'Unknown Term'
}

const getAvailableTerms = (exams: Exam[]): string[] => {
  const terms = new Set(
    exams
      .map(exam => exam?.term)
      .filter((term): term is string => Boolean(term))
      .map(term => normalizeTerm(term))
  )
  return Array.from(terms).sort()
}

const getTermSubjects = (term: string, session: string, exams: Exam[]): string[] => {
  const subjects = new Set(
    exams
      .filter(e => normalizeTerm(e.term || '') === term && e.session_year === session)
      .map(e => e.subject)
  )
  return Array.from(subjects)
}

const getTermProgress = (
  term: string,
  session: string,
  exams: Exam[],
  completedExams: CompletedExam[]
): { completedCount: number; totalSubjects: number; percentage: number; isCompleted: boolean } => {
  const termSubjects = getTermSubjects(term, session, exams)
  const completedSubjects = new Set(
    completedExams
      .filter(ce => normalizeTerm(ce.term) === term && ce.session_year === session && ce.passed)
      .map(ce => ce.subject)
  )
  
  const totalSubjects = termSubjects.length
  const completedCount = completedSubjects.size
  const percentage = totalSubjects > 0 ? (completedCount / totalSubjects) * 100 : 0
  
  return {
    completedCount,
    totalSubjects,
    percentage,
    isCompleted: totalSubjects > 0 && completedCount === totalSubjects
  }
}

const isExamCompleted = (examId: string, term: string, completedExams: CompletedExam[]): boolean => {
  return completedExams.some(ce => ce.exam_id === examId && normalizeTerm(ce.term) === term)
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr${hours !== 1 ? 's' : ''}`
}

export function AvailableExamsList({ 
  exams, 
  onTakeExam, 
  onViewAll, 
  showViewAll = false,
  compact = false,
  currentTerm = '',
  currentSession = '',
  completedExams = [],
  onTermChange,
  isLoading = false,
  isActiveAccount = true // 👈 Default to true
}: AvailableExamsListProps) {
  
  const availableTerms = getAvailableTerms(exams)
  const normalizedCurrentTerm = normalizeTerm(currentTerm || '')
  const [selectedTerm, setSelectedTerm] = useState<string>(normalizedCurrentTerm)
  
  useEffect(() => {
    if (currentTerm) {
      setSelectedTerm(normalizeTerm(currentTerm))
    }
  }, [currentTerm])
  
  const filteredExams = exams.filter(exam => {
    const examTerm = normalizeTerm(exam.term || '')
    return examTerm === selectedTerm && exam.session_year === currentSession
  })
  
  const termProgress = getTermProgress(selectedTerm, currentSession, exams, completedExams)
  const isTermLocked = termProgress.isCompleted && termProgress.totalSubjects > 0
  const displayExams = compact ? filteredExams.slice(0, 3) : filteredExams
  
  const handleTermChange = (term: string) => {
    setSelectedTerm(term)
    if (onTermChange) {
      onTermChange(term)
    }
  }
  
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg w-full">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  // 🚫 CRITICAL: Render clean Archive warning message if account is disabled/left school
  if (!isActiveAccount) {
    return (
      <Card className="border-0 shadow-lg w-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MonitorPlay className="h-5 w-5 text-slate-400" />
            <span>Learning Assessments</span>
          </CardTitle>
          <CardDescription>CBT and Terminal Exams Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="py-8 sm:py-12 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Assessment Engine Locked</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto px-4">
            New exams are restricted for archived student profiles. Check the <strong>My Results</strong> tab to view your past transcripts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-lg w-full overflow-hidden">
        <CardHeader className={cn(
          "px-4 py-3 sm:px-5 md:px-6",
          compact ? "pb-2" : "pb-3 sm:pb-4"
        )}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl">
                  <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <span>Available Exams</span>
                  {!compact && termProgress.totalSubjects > 0 && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-700">
                      {termProgress.completedCount}/{termProgress.totalSubjects} Subjects Done
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {compact ? 'Recent exams ready for you' : 'Start any available exam instantly'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                {availableTerms.length > 1 && (
                  <Select value={selectedTerm} onValueChange={handleTermChange}>
                    <SelectTrigger className="h-8 text-xs w-[120px]">
                      <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTerms.map(term => {
                        const progress = getTermProgress(term, currentSession, exams, completedExams)
                        return (
                          <SelectItem key={term} value={term}>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span>{term}</span>
                              {progress.isCompleted && progress.totalSubjects > 0 && (
                                <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-6 sm:pb-8">
          {displayExams.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No exams available for this term</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayExams.map((exam) => {
                const completed = isExamCompleted(exam.id, selectedTerm, completedExams)
                return (
                  <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-semibold text-sm">{exam.title}</p>
                      <p className="text-xs text-slate-400">{exam.subject}</p>
                    </div>
                    {completed ? (
                      <Badge className="bg-green-100 text-green-700">Completed</Badge>
                    ) : (
                      <Button size="sm" onClick={() => onTakeExam(exam.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                        Take Exam
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default AvailableExamsList