// src/components/student/exam/results/TheoryStatus.tsx
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Clock, CheckCheck } from 'lucide-react'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface TheoryStatusProps {
  examResult: ExamResult | null
}

export function TheoryStatus({ examResult }: TheoryStatusProps) {
  if (!examResult) return null

  return (
    <Card className="border-0 shadow-lg bg-[#1a1f2e]">
      <CardContent className="p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#c41e3a]" />
          Theory Status
        </h3>

        {examResult.status === 'pending_theory' ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your theory answers are pending grading by your instructor.
            </p>
          </div>
        ) : examResult.status === 'graded' ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 flex items-center gap-2">
              <CheckCheck className="h-5 w-5" />
              Your theory answers have been graded!
            </p>
            {examResult.graded_by && (
              <p className="text-green-500 text-sm mt-2">
                Graded by: {examResult.graded_by}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
