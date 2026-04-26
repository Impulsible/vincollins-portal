// src/components/student/exam/results/ScoreSummary.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Award, CheckCircle, XCircle, Target, TrendingUp, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface ScoreSummaryProps {
  examResult: ExamResult | null
}

export function ScoreSummary({ examResult }: ScoreSummaryProps) {
  if (!examResult) return null

  const isPassed = examResult.is_passed
  const scorePercent = examResult.percentage || 0

  return (
    <Card className="border border-slate-200 shadow-md bg-white rounded-2xl overflow-hidden">
      {/* Score Header */}
      <div className={cn(
        "p-6 text-center",
        isPassed 
          ? "bg-gradient-to-br from-emerald-50 to-green-50" 
          : "bg-gradient-to-br from-red-50 to-rose-50"
      )}>
        <div className={cn(
          "inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-3 shadow-sm",
          isPassed ? "bg-emerald-100" : "bg-red-100"
        )}>
          {isPassed ? (
            <Award className="h-8 w-8 text-emerald-600" />
          ) : (
            <Award className="h-8 w-8 text-red-400" />
          )}
        </div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Overall Score
        </h3>
        <p className={cn(
          "text-5xl font-black tracking-tight mt-1",
          isPassed ? "text-emerald-700" : "text-red-700"
        )}>
          {examResult.score}
          <span className="text-2xl text-slate-300 font-normal">/{examResult.total}</span>
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <TrendingUp className={cn("h-4 w-4", isPassed ? "text-emerald-500" : "text-red-400")} />
          <span className={cn("text-lg font-bold", isPassed ? "text-emerald-600" : "text-red-500")}>
            {scorePercent}%
          </span>
        </div>
        <Progress 
          value={scorePercent} 
          className={cn("h-2 mt-3 max-w-[200px] mx-auto", isPassed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-400")} 
        />
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Pass/Fail Status */}
        <div className={cn(
          "rounded-xl p-4 text-center border-2 flex items-center justify-center gap-3",
          isPassed
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        )}>
          {isPassed ? (
            <>
              <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-emerald-700">Passed!</p>
                <p className="text-xs text-emerald-600">Congratulations on passing</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-red-600">Not Passed</p>
                <p className="text-xs text-red-500">Better luck next time</p>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Passing Requirement */}
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-slate-500 flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-400" />
            Passing Score
          </span>
          <span className="font-semibold text-slate-800">{examResult.passing_percentage}%</span>
        </div>

        <Separator />

        {/* Objective/Theory Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3.5 text-center border border-blue-100">
            <FileText className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Objective</p>
            <p className="text-xl font-bold text-blue-700">
              {examResult.objective_score || examResult.score}
              <span className="text-sm text-blue-400 font-normal">/{examResult.objective_total || examResult.total}</span>
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3.5 text-center border border-purple-100">
            <Award className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-purple-500 font-medium uppercase tracking-wide mb-1">Theory</p>
            {examResult.status === 'graded' ? (
              <p className="text-xl font-bold text-purple-700">
                {examResult.theory_score || 0}
                <span className="text-sm text-purple-400 font-normal">/{examResult.theory_total || 0}</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-slate-300">—/{examResult.theory_total || 0}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "text-center py-2 rounded-lg text-xs font-semibold",
          examResult.status === 'graded'
            ? "bg-emerald-100 text-emerald-700"
            : examResult.status === 'pending_theory'
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        )}>
          {examResult.status === 'graded'
            ? '✓ Fully Graded'
            : examResult.status === 'pending_theory'
            ? '⏳ Pending Theory Grading'
            : '✓ Objective Graded'}
        </div>
      </CardContent>
    </Card>
  )
}