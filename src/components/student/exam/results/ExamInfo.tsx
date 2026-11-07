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
  const trueObjectiveMax = allQuestions.filter(q => q.type !== 'theory').reduce((sum, q) => sum + Number(q.points || 1), 0)
  const trueTheoryMax = allQuestions.filter(q => q.type === 'theory').reduce((sum, q) => sum + Number(q.points || 1), 0)
  const examTotalMax = trueObjectiveMax + trueTheoryMax

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-2xl transition-colors duration-300">
      <CardContent className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Exam Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Subject:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">{exam?.subject}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Class:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">{String(exam?.class ?? 'N/A')}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Duration:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">{exam?.duration} minutes</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Questions:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">{allQuestions.length}</span>
          </div>
          
          <div>
            <span className="text-slate-500 dark:text-slate-400">Exam Total:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">{examTotalMax} Marks</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Objective Max:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">{trueObjectiveMax} Marks</span>
          </div>
          
          <div>
            <span className="text-slate-500 dark:text-slate-400">Submitted:</span>{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {examResult?.submitted_at ? new Date(examResult.submitted_at).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Status:</span>{' '}
            <Badge className={
              examResult?.status === 'graded' 
                ? 'bg-green-500/20 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' 
                : 'bg-yellow-500/20 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'
            }>
              {examResult?.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}