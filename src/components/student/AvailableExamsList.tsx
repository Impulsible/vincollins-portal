// components/student/AvailableExamsList.tsx - FULLY RESPONSIVE with term locking & proper bottom spacing
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MonitorPlay, 
  ChevronRight, 
  Clock, 
  FileText, 
  Award, 
  Target, 
  CheckCircle, 
  Lock, 
  Sparkles,
  Trophy,
  Inbox
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ========== TYPES ==========
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
}

// ========== HELPER FUNCTIONS ==========
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

// ========== LOADING SKELETON ==========
const LoadingSkeleton = ({ compact = false }) => (
  <Card className="border-0 shadow-lg w-full overflow-hidden">
    <CardHeader className={compact ? "px-4 py-3" : "px-4 sm:px-6 py-4 sm:py-6"}>
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          <Skeleton className="h-3 sm:h-4 w-48 sm:w-56 mt-1" />
        </div>
        <Skeleton className="h-8 sm:h-9 w-24 sm:w-28" />
      </div>
    </CardHeader>
    <CardContent className={compact ? "px-4 pb-4" : "px-4 sm:px-6 pb-4 sm:pb-6"}>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="flex-1">
              <Skeleton className="h-4 sm:h-5 w-40 sm:w-56" />
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mt-1" />
              <div className="flex gap-3 mt-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-8 sm:h-9 w-24 sm:w-28 mt-2 sm:mt-0" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// ========== EMPTY STATE COMPONENT ==========
const EmptyState = ({ exams, selectedTerm, currentSession, availableTerms, onTermChange }: any) => (
  <div className="text-center py-12 sm:py-16 md:py-20">
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Inbox className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
    </div>
    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">No Exams Available</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
      {exams.length === 0 
        ? "No exams have been created for your class yet. Check back later for new assessments."
        : `No exams are currently available for ${selectedTerm} ${currentSession}.`}
    </p>
    {exams.length > 0 && availableTerms.length > 1 && (
      <div className="mt-6">
        <p className="text-xs text-muted-foreground mb-3">Try switching to another term:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {availableTerms.map((term: string) => (
            <Button
              key={term}
              variant={term === selectedTerm ? "default" : "outline"}
              size="sm"
              onClick={() => onTermChange(term)}
              className={term === selectedTerm ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {term}
            </Button>
          ))}
        </div>
      </div>
    )}
    {exams.length === 0 && (
      <div className="mt-6 p-4 bg-amber-50 rounded-lg max-w-md mx-auto">
        <p className="text-xs text-amber-700">
          <Sparkles className="inline h-3 w-3 mr-1" />
          No exams have been assigned to your class yet. Please contact your teacher or check back later.
        </p>
      </div>
    )}
  </div>
)

// ========== MAIN COMPONENT ==========
export function AvailableExamsList({ 
  exams, 
  onTakeExam, 
  onViewAll, 
  showViewAll = false,
  compact = false,
  currentTerm = '1st Term',
  currentSession = '2025/2026',
  completedExams = [],
  onTermChange,
  isLoading = false
}: AvailableExamsListProps) {
  
  const availableTerms = getAvailableTerms(exams)
  const normalizedCurrentTerm = normalizeTerm(currentTerm || '')
  const [selectedTerm, setSelectedTerm] = useState<string>(normalizedCurrentTerm)
  
  useEffect(() => {
    setSelectedTerm(normalizeTerm(currentTerm || ''))
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
    return <LoadingSkeleton compact={compact} />
  }

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-lg w-full overflow-hidden">
        <CardHeader className={cn(
          "px-4 py-3 sm:px-5 md:px-6",
          compact ? "pb-2" : "pb-3 sm:pb-4"
        )}>
          {/* Header Row */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
              {/* Title Section */}
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
              
              {/* Actions Row */}
              <div className="flex items-center gap-2">
                {/* Term Selector */}
                {availableTerms.length > 0 && (
                  <Select value={selectedTerm} onValueChange={handleTermChange}>
                    <SelectTrigger className={cn(
                      "h-8 text-xs sm:h-9 sm:text-sm",
                      compact ? "w-[110px] sm:w-[130px]" : "w-[120px] sm:w-[140px]"
                    )}>
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
                              {!progress.isCompleted && progress.completedCount > 0 && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {progress.completedCount}/{progress.totalSubjects}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
                
                {/* View All Button */}
                {showViewAll && onViewAll && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onViewAll}
                    className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden xs:inline">View All</span>
                    <span className="xs:hidden">All</span>
                    <ChevronRight className="ml-0.5 sm:ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Term Progress Bar - Only show if not compact and has subjects */}
            {!compact && termProgress.totalSubjects > 0 && (
              <div className="mt-1">
                <div className="flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground mb-1">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Term Progress
                  </span>
                  <span className="font-medium">
                    {Math.round(termProgress.percentage)}% Complete
                  </span>
                </div>
                <Progress 
                  value={termProgress.percentage} 
                  className="h-1.5 sm:h-2 bg-slate-100"
                />
                {termProgress.isCompleted && (
                  <p className="text-[10px] sm:text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    All subjects completed! You can now proceed to the next term.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={cn(
          "px-4 pb-6 sm:pb-8 md:pb-10", // ✅ Increased bottom padding to prevent footer sticking
          compact ? "space-y-2" : "space-y-3 sm:space-y-4"
        )}>
          {/* Empty State - With proper bottom spacing */}
          {displayExams.length === 0 && (
            <EmptyState 
              exams={exams}
              selectedTerm={selectedTerm}
              currentSession={currentSession}
              availableTerms={availableTerms}
              onTermChange={handleTermChange}
            />
          )}
          
          {/* Exams List */}
          {displayExams.length > 0 && (
            <div className="space-y-2 sm:space-y-3 pb-4">
              {displayExams.map((exam) => {
                const completed = isExamCompleted(exam.id, selectedTerm, completedExams)
                const examProgress = getTermProgress(selectedTerm, currentSession, exams, completedExams)
                const isTermSubjectsCompleted = examProgress.isCompleted
                const isDisabled = completed || isTermSubjectsCompleted
                
                return (
                  <div 
                    key={exam.id} 
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl transition-all",
                      completed ? "bg-green-50 border border-green-100" : "bg-slate-50 hover:bg-slate-100",
                      isTermSubjectsCompleted && !completed && "opacity-75"
                    )}
                  >
                    {/* Exam Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-1 sm:gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <p className={cn(
                              "font-semibold text-sm sm:text-base break-words",
                              completed && "text-green-700"
                            )}>
                              {exam.title}
                            </p>
                            {exam.has_theory && (
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-purple-50 text-purple-700 border-purple-200 shrink-0">
                                Theory
                              </Badge>
                            )}
                            {completed && (
                              <Badge className="text-[9px] sm:text-[10px] bg-green-100 text-green-700 border-green-200 shrink-0">
                                <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{exam.subject}</p>
                        </div>
                      </div>
                      
                      {/* Exam Meta */}
                      <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 mt-1.5 sm:mt-2">
                        <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {exam.total_questions} Questions
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {exam.total_marks} Marks
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {formatDuration(exam.duration)}
                        </span>
                        {exam.passing_percentage && (
                          <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                            <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {exam.passing_percentage}% Pass
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    {isDisabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="shrink-0 w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm opacity-50"
                          >
                            {completed ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Done
                              </>
                            ) : (
                              <>
                                <Lock className="mr-1 h-3 w-3" />
                                Locked
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {completed 
                              ? "You've already completed this exam" 
                              : "Complete all subjects in this term first"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onTakeExam(exam.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 shrink-0 w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        Take Exam
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          
          {/* View All Button at bottom for compact mode */}
          {compact && filteredExams.length > 3 && onViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={onViewAll}
            >
              View all {filteredExams.length} exams
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default AvailableExamsList