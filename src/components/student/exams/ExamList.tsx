// src/components/student/exams/ExamList.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
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

export function ExamList({ exams, examAttempts, viewMode, getExamStatus, getSubjectConfig, onTakeExam, onViewResult }: ExamListProps) {
  if (exams.length === 0) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'pb-12',
          viewMode === 'grid'
            ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'flex flex-col gap-3 max-w-4xl mx-auto'
        )}
      >
        {exams.map((exam, i) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <ExamCard
              exam={exam}
              attempt={examAttempts[exam.id]}
              status={getExamStatus(exam)}
              config={getSubjectConfig(exam.subject)}
              viewMode={viewMode}
              onTakeExam={onTakeExam}
              onViewResult={onViewResult}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}