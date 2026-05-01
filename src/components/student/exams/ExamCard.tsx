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
  viewMode: ViewMode  // 👈 Add this
  onTakeExam: (examId: string) => void
  onViewResult: (examId: string) => void
}

export function ExamCard({
  exam,
  attempt,
  status,
  config,
  viewMode,  // 👈 Add this
  onTakeExam,
  onViewResult,
}: ExamCardProps) {
  const SubjectIcon = config.icon

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex",
        // 👇 Add grid/list specific styles
        viewMode === 'grid' 
          ? "flex-col"
          : "flex-row items-center gap-4 p-4",
        status === 'completed' && "bg-gradient-to-br from-green-50/50 to-emerald-50/50",
        status === 'upcoming' && "bg-gradient-to-br from-amber-50/50 to-orange-50/50",
        status === 'available' && "bg-card"
      )}
    >
      {/* Status Badge */}
      <ExamStatusBadge status={status} attempt={attempt} />

      <CardContent className={cn(
        "flex-1 flex",
        viewMode === 'grid' 
          ? "p-4 sm:p-5 flex-col" 
          : "p-0 flex-row items-center gap-4"
      )}>
        {/* Subject Icon & Title */}
        <div className={cn(
          "flex items-center gap-3",
          viewMode === 'grid' ? "mb-3" : "flex-shrink-0"
        )}>
          <div
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0",
              config.bgColor
            )}
          >
            <SubjectIcon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className={cn(
            "min-w-0",
            viewMode === 'list' && "hidden sm:block"
          )}>
            <h3 className="font-bold text-sm sm:text-base line-clamp-2">
              {exam.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {exam.subject}
            </p>
          </div>
        </div>

        {/* List View - Show title if hidden above */}
        {viewMode === 'list' && (
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base line-clamp-1">
              {exam.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {exam.subject}
            </p>
          </div>
        )}

        {/* Feature Badges */}
        <ExamFeatureBadges
          hasTheory={exam.has_theory}
          proctoringEnabled={exam.proctoring_enabled}
        />

        {/* Exam Details Grid */}
        <div className={viewMode === 'list' ? 'flex-shrink-0' : ''}>
          <ExamDetails
            duration={exam.duration}
            totalQuestions={exam.total_questions}
            totalMarks={exam.total_marks}
            passingPercentage={exam.passing_percentage}
          />
        </div>

        {/* Score Progress (completed only) */}
        {status === 'completed' && attempt && (
          <div className={viewMode === 'list' ? 'w-32 flex-shrink-0' : ''}>
            <ExamScoreProgress
              percentage={attempt.percentage}
            />
          </div>
        )}

        {viewMode === 'grid' && <div className="flex-1" />}

        {/* Action Button */}
        <div className={cn(
          viewMode === 'grid' ? "pt-3 mt-auto" : "flex-shrink-0"
        )}>
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