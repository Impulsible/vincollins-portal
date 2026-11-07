// src/components/student/exam/results/TheoryStatus.tsx
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Clock, CheckCheck, PenTool } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface TheoryStatusProps {
  examResult: ExamResult | null
}

export function TheoryStatus({ examResult }: TheoryStatusProps) {
  if (!examResult) return null

  const theoryMax = examResult.theory_total || 0
  const isPending = examResult.status === 'pending_theory'
  const isGraded = examResult.status === 'graded'

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-2xl transition-colors duration-300">
      <CardContent className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          Theory Status
        </h3>

        {isPending && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-amber-700 dark:text-amber-300 font-medium text-sm">
                Pending Teacher Review
              </p>
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-1 leading-relaxed">
                Your objective score has been saved. Your theory answers 
                (worth <strong className="text-amber-700 dark:text-amber-300">{theoryMax} marks</strong>) 
                are currently being graded by your instructor.
              </p>
            </div>
          </div>
        )}

        {isGraded && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                Theory Fully Graded
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                Your theory answers have been reviewed and added to your final score.
              </p>
              {examResult.graded_by && (
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
                    Graded By
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    {examResult.graded_by}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isPending && !isGraded && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              This exam has no pending theory sections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}