// components/student/QuickActions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Zap, FileText, Calendar, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickActionsProps {
  onTakeExam: () => void
}

export function QuickActions({ onTakeExam }: QuickActionsProps) {
  const router = useRouter()

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-4">
      <Button 
        className="bg-primary hover:bg-primary/90 shadow-lg"
        onClick={onTakeExam}
      >
        <Zap className="mr-2 h-4 w-4" />
        Take CBT Exam
      </Button>
      <Button variant="outline" onClick={() => router.push('/student/results')}>
        <FileText className="mr-2 h-4 w-4" />
        View Results
      </Button>
      <Button variant="outline" onClick={() => router.push('/student/attendance')}>
        <Calendar className="mr-2 h-4 w-4" />
        Attendance
      </Button>
      <Button variant="outline" onClick={() => router.push('/student/profile')}>
        <User className="mr-2 h-4 w-4" />
        Profile
      </Button>
    </div>
  )
}