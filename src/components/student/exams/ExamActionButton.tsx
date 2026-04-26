// src/components/student/exams/ExamActionButton.tsx
import { Button } from '@/components/ui/button'
import { MonitorPlay, Award, Lock, ChevronRight, ArrowRight, RotateCcw } from 'lucide-react'
import type { ExamAttempt, ExamStatus } from '@/app/student/exams/types'

interface ExamActionButtonProps {
  status: ExamStatus
  attempt?: ExamAttempt
  examId: string
  onTakeExam: (examId: string) => void
  onViewResult: (examId: string) => void
}

export function ExamActionButton({
  status,
  attempt,
  examId,
  onTakeExam,
  onViewResult,
}: ExamActionButtonProps) {
  // In Progress - Show Resume
  if (attempt?.status === 'in_progress') {
    return (
      <Button
        onClick={() => onTakeExam(examId)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Resume Exam
        <ArrowRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  // Completed - View Result
  if (status === 'completed') {
    return (
      <Button
        onClick={() => onViewResult(examId)}
        variant="outline"
        className="w-full border-green-200 text-green-700 hover:bg-green-50 text-sm rounded-xl"
      >
        <Award className="mr-2 h-4 w-4" />
        View Result
        <ChevronRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  // Available - Start Exam
  if (status === 'available') {
    return (
      <Button
        onClick={() => onTakeExam(examId)}
        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-sm rounded-xl"
      >
        <MonitorPlay className="mr-2 h-4 w-4" />
        Start Exam
        <ArrowRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  // Upcoming or expired
  return (
    <Button disabled variant="outline" className="w-full text-sm rounded-xl">
      <Lock className="mr-2 h-4 w-4" />
      Not Available
    </Button>
  )
}