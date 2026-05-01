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
  if (exams.length === 0) return null

  return (
    <div
      className={cn(
        "pb-8 sm:pb-12 lg:pb-16", // Add bottom padding
        viewMode === 'grid'
          ? "grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "flex flex-col gap-3 sm:gap-4"
      )}
    >
      {exams.map((exam) => {
        const status = getExamStatus(exam)
        const attempt = examAttempts[exam.id]
        const config = getSubjectConfig(exam.subject)

        return (
          <ExamCard
            key={exam.id}
            exam={exam}
            attempt={attempt}
            status={status}
            config={config}
            viewMode={viewMode}
            onTakeExam={onTakeExam}
            onViewResult={onViewResult}
          />
        )
      })}
    </div>
  )
}