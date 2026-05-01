// src/components/student/exams/ExamCard.tsx
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

export function ExamCard({
  exam,
  attempt,
  status,
  config,
  viewMode,
  onTakeExam,
  onViewResult,
}: ExamCardProps) {
  const SubjectIcon = config.icon

  // List View
  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          "group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300",
          status === 'completed' && "bg-gradient-to-r from-green-50/50 to-emerald-50/50",
          status === 'upcoming' && "bg-gradient-to-r from-amber-50/50 to-orange-50/50",
          status === 'available' && "bg-card"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Mobile: Top color bar, Desktop: Left color bar */}
            <div 
              className="sm:hidden h-1 w-full" 
              style={{ backgroundColor: config.color?.replace('text-', '') || '#22c55e' }} 
            />
            <div 
              className="hidden sm:block w-1.5 flex-shrink-0 self-stretch" 
              style={{ backgroundColor: config.color?.replace('text-', '') || '#22c55e' }} 
            />
            
            <div className="flex-1 p-3 sm:p-4">
              {/* Status Badge */}
              <div className="mb-2 sm:mb-0 sm:absolute sm:top-3 sm:right-3">
                <ExamStatusBadge status={status} attempt={attempt} />
              </div>

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    config.bgColor
                  )}
                >
                  <SubjectIcon className={cn("h-5 w-5", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                  <h3 className="font-semibold text-sm truncate">{exam.title}</h3>
                  <p className="text-xs text-muted-foreground">{exam.subject} • {exam.class}</p>
                  
                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <ExamDetails
                      duration={exam.duration}
                      totalQuestions={exam.total_questions}
                      totalMarks={exam.total_marks}
                      passingPercentage={exam.passing_percentage}
                    />
                  </div>

                  {/* Feature Badges */}
                  <div className="mt-2">
                    <ExamFeatureBadges
                      hasTheory={exam.has_theory}
                      proctoringEnabled={exam.proctoring_enabled}
                    />
                  </div>

                  {/* Score for completed */}
                  {status === 'completed' && attempt && (
                    <div className="mt-3 max-w-xs">
                      <ExamScoreProgress percentage={attempt.percentage} />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-3 sm:right-3">
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

  // Grid View (unchanged, just ensure it has proper spacing)
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col",
        status === 'completed' && "bg-gradient-to-br from-green-50/50 to-emerald-50/50",
        status === 'upcoming' && "bg-gradient-to-br from-amber-50/50 to-orange-50/50",
        status === 'available' && "bg-card"
      )}
    >
      <ExamStatusBadge status={status} attempt={attempt} />

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0",
              config.bgColor
            )}
          >
            <SubjectIcon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base line-clamp-2">
              {exam.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {exam.subject}
            </p>
          </div>
        </div>

        <ExamFeatureBadges
          hasTheory={exam.has_theory}
          proctoringEnabled={exam.proctoring_enabled}
        />

        <ExamDetails
          duration={exam.duration}
          totalQuestions={exam.total_questions}
          totalMarks={exam.total_marks}
          passingPercentage={exam.passing_percentage}
        />

        {status === 'completed' && attempt && (
          <ExamScoreProgress percentage={attempt.percentage} />
        )}

        <div className="flex-1" />

        <div className="pt-3 mt-auto">
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