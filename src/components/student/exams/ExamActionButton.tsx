// src/components/student/exams/ExamActionButton.tsx - FIXED VERSION

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

export function ExamActionButton({
  status,
  attempt,
  examId,
  onTakeExam,
  onViewResult,
}: ExamActionButtonProps) {
  
  // ✅ Pending Theory - Show View Result (same as completed but with different text)
  if (attempt?.status === 'pending_theory') {
    return (
      <Button
        onClick={() => onViewResult(examId)}
        variant="outline"
        className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 text-sm rounded-xl"
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Theory Pending
        <ChevronRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  // ✅ In Progress - Show Resume
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

  // ✅ Completed - View Result
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

  // ✅ Available - Start Exam
  if (status === 'available') {
    return (
      <Button
        onClick={() => onTakeExam(examId)}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm rounded-xl"
      >
        <MonitorPlay className="mr-2 h-4 w-4" />
        Start Exam
        <ArrowRight className="ml-auto h-4 w-4" />
      </Button>
    )
  }

  // ✅ Upcoming or expired - Not Available
  return (
    <Button disabled variant="outline" className="w-full text-sm rounded-xl opacity-60">
      <Lock className="mr-2 h-4 w-4" />
      {status === 'upcoming' ? 'Not Yet Open' : 'Not Available'}
    </Button>
  )
}