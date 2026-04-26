// @ts-nocheck
// src/components/student/exam/results/ObjectiveBreakdown.tsx
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface ObjectiveBreakdownProps {
  examResult: ExamResult | null
}

export function ObjectiveBreakdown({ examResult }: ObjectiveBreakdownProps) {
  if (!examResult) return null

  const total = (examResult.correct || 0) + (examResult.incorrect || 0) + (examResult.unanswered || 0)
  const correctPercent = total > 0 ? ((examResult.correct || 0) / total) * 100 : 0
  const incorrectPercent = total > 0 ? ((examResult.incorrect || 0) / total) * 100 : 0
  const unansweredPercent = total > 0 ? ((examResult.unanswered || 0) / total) * 100 : 0

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          Objective Breakdown
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <div className="inline-flex h-10 w-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{examResult.correct || 0}</p>
            <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider">Correct</p>
            <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${correctPercent}%` }} />
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <div className="inline-flex h-10 w-10 rounded-full bg-red-100 items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{examResult.incorrect || 0}</p>
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Wrong</p>
            <div className="mt-2 h-1.5 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${incorrectPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <div className="inline-flex h-10 w-10 rounded-full bg-slate-100 items-center justify-center mb-2">
              <HelpCircle className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-500">{examResult.unanswered || 0}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Skipped</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-300 rounded-full" style={{ width: `${unansweredPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-slate-100">
          <div className="bg-emerald-500 h-full" style={{ width: `${correctPercent}%` }} />
          <div className="bg-red-500 h-full" style={{ width: `${incorrectPercent}%` }} />
          <div className="bg-slate-300 h-full" style={{ width: `${unansweredPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5 px-1">
          <span>{Math.round(correctPercent)}% correct</span>
          <span>{Math.round(incorrectPercent)}% wrong</span>
          <span>{Math.round(unansweredPercent)}% skipped</span>
        </div>
      </CardContent>
    </Card>
  )
}