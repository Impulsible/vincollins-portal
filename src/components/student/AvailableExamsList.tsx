// components/student/AvailableExamsList.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MonitorPlay, ChevronRight } from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: string
  duration: number
  total_questions: number
  total_marks: number
}

interface AvailableExamsListProps {
  exams: Exam[]
  onTakeExam: (examId: string) => void
}

export function AvailableExamsList({ exams, onTakeExam }: AvailableExamsListProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorPlay className="h-5 w-5 text-primary" />
          Available Exams
        </CardTitle>
        <CardDescription>Start any available exam instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No exams available at the moment
          </p>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="flex justify-between items-center border-b pb-4 last:border-0">
              <div>
                <p className="font-semibold">{exam.title}</p>
                <p className="text-sm text-muted-foreground">{exam.subject}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{exam.total_questions} questions</span>
                  <span>{exam.total_marks} marks</span>
                  <span>{exam.duration} mins</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onTakeExam(exam.id)}
                className="bg-primary hover:bg-primary/90"
              >
                Take Exam
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}