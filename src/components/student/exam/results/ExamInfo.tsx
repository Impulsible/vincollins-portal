// src/components/student/exam/results/ExamInfo.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Exam, ExamResult, Question } from '@/app/student/exam/[id]/types'

interface ExamInfoProps {
  exam: Exam | null
  allQuestions: Question[]
  examResult: ExamResult | null
}

export function ExamInfo({ exam, allQuestions, examResult }: ExamInfoProps) {
  return (
    <Card className="border-0 shadow-lg bg-[#1a1f2e]">
      <CardContent className="p-6">
        <h3 className="font-semibold text-white mb-4">Exam Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Subject:</span>{' '}
            <span className="text-white font-medium">{exam?.subject}</span>
          </div>
          <div>
            <span className="text-gray-400">Class:</span>{' '}
            <span className="text-white font-medium">{exam?.class}</span>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>{' '}
            <span className="text-white font-medium">
              {exam?.duration} minutes
            </span>
          </div>
          <div>
            <span className="text-gray-400">Questions:</span>{' '}
            <span className="text-white font-medium">{allQuestions.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Submitted:</span>{' '}
            <span className="text-white font-medium">
              {examResult?.submitted_at
                ? new Date(examResult.submitted_at).toLocaleString()
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>{' '}
            <Badge
              className={
                examResult?.status === 'graded'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }
            >
              {examResult?.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
