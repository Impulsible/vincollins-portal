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

  // 🛠️ Dynamic bounds from DB
  const theoryMax = examResult.theory_total || 0
  const isPending = examResult.status === 'pending_theory'
  const isGraded = examResult.status === 'graded'

  return (
    <Card className="border-0 shadow-lg bg-[#1a1f2e]">
      <CardContent className="p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-purple-400" />
          Theory Status
        </h3>

        {isPending && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 font-medium text-sm">
                Pending Teacher Review
              </p>
              <p className="text-amber-500/80 text-xs mt-1 leading-relaxed">
                Your objective score has been saved. Your theory answers 
                (worth <strong className="text-amber-400">{theoryMax} marks</strong>) 
                are currently being graded by your instructor.
              </p>
            </div>
          </div>
        )}

        {isGraded && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-medium text-sm">
                Theory Fully Graded
              </p>
              <p className="text-emerald-500/80 text-xs mt-1">
                Your theory answers have been reviewed and added to your final score.
              </p>
              {examResult.graded_by && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20">
                  <p className="text-emerald-600 text-[10px] uppercase tracking-wider font-semibold">
                    Graded By
                  </p>
                  <p className="text-emerald-400 text-xs font-medium">
                    {examResult.graded_by}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isPending && !isGraded && (
          <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-4">
            <p className="text-slate-400 text-sm">
              This exam has no pending theory sections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}