// components/student/AvailableExamsList.tsx - FULLY RESPONSIVE
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonitorPlay, ChevronRight, Clock, FileText, Award, Target } from 'lucide-react'
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

interface AvailableExamsListProps {
  exams: Exam[]
  onTakeExam: (examId: string) => void
  onViewAll?: () => void
  showViewAll?: boolean
  compact?: boolean
  currentTerm?: string
}

export function AvailableExamsList({ 
  exams, 
  onTakeExam, 
  onViewAll, 
  showViewAll = false,
  compact = false,
  currentTerm
}: AvailableExamsListProps) {
  
  const displayExams = compact ? exams.slice(0, 3) : exams

  return (
    <Card className="border-0 shadow-lg w-full overflow-hidden">
      <CardHeader className={cn(
        "px-3 sm:px-4 md:px-6",
        compact ? "pb-2 pt-3 sm:pt-4" : "pb-3 pt-4 sm:pt-6"
      )}>
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl">
              <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Available Exams
              {currentTerm && (
                <Badge variant="outline" className="ml-1 sm:ml-2 text-[9px] sm:text-[10px] md:text-xs">
                  {currentTerm}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-[11px] sm:text-xs">
              {compact ? 'Recent available exams' : 'Start any available exam instantly'}
            </CardDescription>
          </div>
          {showViewAll && onViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="h-7 sm:h-8 text-xs sm:text-sm w-fit"
            >
              View All <ChevronRight className="ml-0.5 sm:ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(
        "px-3 sm:px-4 md:px-6",
        compact ? "space-y-2 pb-3 sm:pb-4" : "space-y-3 sm:space-y-4 pb-4 sm:pb-6"
      )}>
        {displayExams.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <MonitorPlay className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40 mx-auto mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">No exams available at the moment</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">Check back later for new exams</p>
          </div>
        ) : (
          <>
            {displayExams.map((exam, index) => (
              <div 
                key={exam.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-1 xs:gap-2">
                    <p className="font-semibold text-sm sm:text-base break-words line-clamp-2">
                      {exam.title}
                    </p>
                    {exam.has_theory && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-purple-50 text-purple-700 shrink-0 w-fit">
                        Includes Theory
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{exam.subject}</p>
                  <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {exam.total_questions} Qs
                    </span>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {exam.total_marks} marks
                    </span>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {exam.duration} mins
                    </span>
                    {exam.passing_percentage && (
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {exam.passing_percentage}% pass
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onTakeExam(exam.id)}
                  className="bg-primary hover:bg-primary/90 shrink-0 w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                >
                  Take Exam
                  <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            ))}
            
            {/* Show "View All" button at bottom for compact mode with many exams */}
            {compact && exams.length > 3 && onViewAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 sm:mt-3 h-8 sm:h-9 text-xs sm:text-sm"
                onClick={onViewAll}
              >
                View all {exams.length} exams
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}