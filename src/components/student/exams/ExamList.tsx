// src/components/student/exams/ExamList.tsx
import { cn } from '@/lib/utils'
import { ExamCard } from './ExamCard'
import type { Exam, ExamAttempt, ViewMode, ExamStatus, SubjectConfig } from '@/app/student/exams/types'

interface ExamListProps {
  exams: Exam[]
  examAttempts: Record<string, ExamAttempt>
  viewMode: ViewMode
  getExamStatus: (exam: Exam) => ExamStatus
  getSubjectConfig: (subject: string) => SubjectConfig
  onTakeExam: (examId: string) => void
  onViewResult: (examId: string) => void
}

export function ExamList({
  exams,
  examAttempts,
  viewMode,
  getExamStatus,
  getSubjectConfig,
  onTakeExam,
  onViewResult,
}: ExamListProps) {
  return (
    <div
      className={cn(
        viewMode === 'grid'
          ? "grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "space-y-3 sm:space-y-4"
      )}
    >
      {exams.map((exam) => {
        const status = getExamStatus(exam)
        const attempt = examAttempts[exam.id]
        const config = getSubjectConfig(exam.subject)

        return (
          <div key={exam.id} className={viewMode === 'grid' ? 'h-full' : ''}>
            <ExamCard
              exam={exam}
              attempt={attempt}
              status={status}
              config={config}
              viewMode={viewMode}
              onTakeExam={onTakeExam}
              onViewResult={onViewResult}
            />
          </div>
        )
      })}
    </div>
  )
}