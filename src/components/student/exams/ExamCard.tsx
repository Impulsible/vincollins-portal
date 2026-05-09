// src/components/student/exams/ExamCard.tsx - FULL RESPONSIVE FIX V2
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ExamStatusBadge } from './ExamStatusBadge'
import { ExamFeatureBadges } from './ExamFeatureBadges'
import { ExamDetails } from './ExamDetails'
import { ExamScoreProgress } from './ExamScoreProgress'
import { ExamActionButton } from './ExamActionButton'
import type { Exam, ExamAttempt, ExamStatus, SubjectConfig, ViewMode } from '@/app/student/exams/types'

interface ExamCardProps {
  exam: Exam
  attempt?: ExamAttempt
  status: ExamStatus
  config: SubjectConfig
  viewMode: ViewMode
  onTakeExam: (examId: string) => void
  onViewResult: (examId: string) => void
}

export function ExamCard({ exam, attempt, status, config, viewMode, onTakeExam, onViewResult }: ExamCardProps) {
  const SubjectIcon = config.icon
  const displayPct = attempt?.ca_percentage || attempt?.percentage || 0

  // ========== LIST VIEW ==========
  if (viewMode === 'list') {
    return (
      <Card 
        className={cn(
          "group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 w-full",
          status === 'completed' && "bg-gradient-to-r from-green-50/50 to-emerald-50/50",
          status === 'upcoming' && "bg-gradient-to-r from-amber-50/50 to-orange-50/50",
          status === 'available' && "bg-card"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Top color accent - mobile only */}
            <div 
              className="sm:hidden h-1 w-full" 
              style={{ backgroundColor: config.color?.replace('text-', '') || '#22c55e' }} 
            />
            
            {/* Left color accent - desktop only */}
            <div 
              className="hidden sm:block w-1.5 flex-shrink-0 self-stretch" 
              style={{ backgroundColor: config.color?.replace('text-', '') || '#22c55e' }} 
            />
            
            {/* Main content */}
            <div className="flex-1 p-3 sm:p-4">
              {/* Header row: icon + title + badge */}
              <div className="flex items-start gap-3">
                {/* Subject icon */}
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  config.bgColor
                )}>
                  <SubjectIcon className={cn("h-5 w-5", config.color)} />
                </div>
                
                {/* Title + subject + details */}
                <div className="flex-1 min-w-0">
                  {/* Title row with badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {exam.title}
                    </h3>
                    <div className="shrink-0">
                      <ExamStatusBadge status={status} attempt={attempt} />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exam.subject} • {exam.class}
                  </p>
                  
                  {/* Exam details */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <ExamDetails 
                      duration={exam.duration} 
                      totalQuestions={exam.total_questions} 
                      totalMarks={exam.total_marks} 
                      passingPercentage={exam.passing_percentage} 
                    />
                  </div>
                  
                  {/* Feature badges */}
                  <div className="mt-2">
                    <ExamFeatureBadges 
                      hasTheory={exam.has_theory} 
                      proctoringEnabled={exam.proctoring_enabled} 
                    />
                  </div>
                  
                  {/* Score progress - for completed exams */}
                  {status === 'completed' && attempt && (
                    <div className="mt-3 max-w-sm">
                      <ExamScoreProgress 
                        percentage={displayPct} 
                        theoryPending={attempt.status === 'pending_theory'} 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action button - aligned right */}
              <div className="flex justify-end mt-3">
                <ExamActionButton 
                  status={status} 
                  attempt={attempt} 
                  examId={exam.id} 
                  onTakeExam={onTakeExam} 
                  onViewResult={onViewResult} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========== GRID VIEW ==========
  return (
    <Card 
      className={cn(
        "group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col w-full",
        status === 'completed' && "bg-gradient-to-br from-green-50/50 to-emerald-50/50",
        status === 'upcoming' && "bg-gradient-to-br from-amber-50/50 to-orange-50/50",
        status === 'available' && "bg-card"
      )}
    >
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Status badge - top right */}
        <div className="flex justify-end mb-2">
          <ExamStatusBadge status={status} attempt={attempt} />
        </div>
        
        {/* Subject icon + title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0",
            config.bgColor
          )}>
            <SubjectIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base line-clamp-2">
              {exam.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
              {exam.subject}
            </p>
          </div>
        </div>
        
        {/* Feature badges */}
        <div className="mb-3">
          <ExamFeatureBadges 
            hasTheory={exam.has_theory} 
            proctoringEnabled={exam.proctoring_enabled} 
          />
        </div>
        
        {/* Exam details */}
        <div className="mb-3">
          <ExamDetails 
            duration={exam.duration} 
            totalQuestions={exam.total_questions} 
            totalMarks={exam.total_marks} 
            passingPercentage={exam.passing_percentage} 
          />
        </div>
        
        {/* Score progress - for completed exams */}
        {status === 'completed' && attempt && (
          <div className="mb-4">
            <ExamScoreProgress 
              percentage={displayPct} 
              theoryPending={attempt.status === 'pending_theory'} 
            />
          </div>
        )}
        
        {/* Spacer to push button to bottom */}
        <div className="flex-1" />
        
        {/* Action button - always at bottom */}
        <div className="pt-3 border-t border-slate-100/50 mt-auto">
          <ExamActionButton 
            status={status} 
            attempt={attempt} 
            examId={exam.id} 
            onTakeExam={onTakeExam} 
            onViewResult={onViewResult} 
          />
        </div>
      </CardContent>
    </Card>
  )
}