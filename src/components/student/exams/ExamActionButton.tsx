// src/components/student/exams/ExamActionButton.tsx
import { Button } from '@/components/ui/button'
import { MonitorPlay, Award, Lock, ChevronRight, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react'
import type { ExamAttempt, ExamStatus } from '@/app/student/exams/types'

interface ExamActionButtonProps {
  status: ExamStatus
  attempt?: ExamAttempt
  examId: string
  onTakeExam: (examId: string) => void
  onViewResult: (examId: string) => void
}

export function ExamActionButton({ status, attempt, examId, onTakeExam, onViewResult }: ExamActionButtonProps) {
  if (attempt?.status === 'pending_theory') {
    return (
      <Button onClick={() => onViewResult(examId)} variant="outline"
        className="w-full border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-sm rounded-xl cursor-pointer">
        <AlertCircle className="mr-2 h-4 w-4" /> Theory Pending
        <ChevronRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  if (attempt?.status === 'in_progress') {
    return (
      <Button onClick={() => onTakeExam(examId)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl cursor-pointer">
        <RotateCcw className="mr-2 h-4 w-4" /> Resume Exam
        <ArrowRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  if (status === 'completed') {
    return (
      <Button onClick={() => onViewResult(examId)} variant="outline"
        className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-sm rounded-xl cursor-pointer">
        <Award className="mr-2 h-4 w-4" /> View Result
        <ChevronRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  if (status === 'available') {
    return (
      <Button onClick={() => onTakeExam(examId)}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm rounded-xl cursor-pointer">
        <MonitorPlay className="mr-2 h-4 w-4" /> Start Exam
        <ArrowRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button disabled variant="outline"
      className="w-full text-sm rounded-xl opacity-60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
      <Lock className="mr-2 h-4 w-4" />
      {status === 'upcoming' ? 'Not Yet Open' : 'Not Available'}
    </Button>
  )
}