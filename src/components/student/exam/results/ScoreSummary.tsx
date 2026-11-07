// src/components/student/exam/results/ScoreSummary.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Award, CheckCircle, XCircle, Target, TrendingUp, FileText, Clock, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface ScoreSummaryProps {
  examResult: ExamResult | null
}

export function ScoreSummary({ examResult }: ScoreSummaryProps) {
  if (!examResult) return null

  const isPending = examResult.status === 'pending_theory'
  const isPassed = examResult.is_passed && !isPending

  const totalExamMax = examResult.total || 60
  const trueObjectiveMax = examResult.objective_total || 20
  const trueTheoryMax = totalExamMax - trueObjectiveMax

  const currentScore = examResult.objective_score || 0
  const scorePercent = totalExamMax > 0 ? Math.round((currentScore / totalExamMax) * 100) : 0

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden transition-colors duration-300">
      {/* Score Header */}
      <div className={cn(
        "p-6 text-center transition-colors",
        isPending
          ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20"
          : isPassed 
          ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20"
          : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20"
      )}>
        <div className={cn(
          "inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-3 shadow-sm",
          isPending 
            ? "bg-amber-100 dark:bg-amber-900/50" 
            : isPassed 
            ? "bg-emerald-100 dark:bg-emerald-900/50" 
            : "bg-red-100 dark:bg-red-900/50"
        )}>
          {isPending ? (
            <Clock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
          ) : isPassed ? (
            <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Award className="h-8 w-8 text-red-400 dark:text-red-500" />
          )}
        </div>
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Overall Score
        </h3>
        <p className={cn(
          "text-5xl font-black tracking-tight mt-1",
          isPending 
            ? "text-amber-600 dark:text-amber-400" 
            : isPassed 
            ? "text-emerald-700 dark:text-emerald-300" 
            : "text-red-700 dark:text-red-300"
        )}>
          {currentScore}
          <span className="text-2xl text-slate-300 dark:text-slate-600 font-normal">/{totalExamMax}</span>
        </p>
        
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {isPending ? (
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full">
              Pending Theory Grade
            </span>
          ) : (
            <>
              <TrendingUp className={cn("h-4 w-4", isPassed ? "text-emerald-500 dark:text-emerald-400" : "text-red-400 dark:text-red-500")} />
              <span className={cn("text-lg font-bold", isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                {scorePercent}%
              </span>
            </>
          )}
        </div>

        {!isPending && (
          <Progress 
            value={scorePercent} 
            className={cn(
              "h-2 mt-3 max-w-[200px] mx-auto bg-slate-200 dark:bg-slate-700",
              isPassed 
                ? "[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400" 
                : "[&>div]:bg-red-400 dark:[&>div]:bg-red-500"
            )} 
          />
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Pass/Fail Status */}
        <div className={cn(
          "rounded-xl p-4 text-center border-2 flex items-center justify-center gap-3",
          isPending 
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
            : isPassed
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
            : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
        )}>
          {isPending ? (
            <>
              <Clock className="h-6 w-6 text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-amber-700 dark:text-amber-300">Awaiting Results</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Theory grading in progress</p>
              </div>
            </>
          ) : isPassed ? (
            <>
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">Passed!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Congratulations on passing</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500 dark:text-red-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-red-600 dark:text-red-400">Not Passed</p>
                <p className="text-xs text-red-500 dark:text-red-400">Better luck next time</p>
              </div>
            </>
          )}
        </div>

        <Separator className="dark:bg-slate-800" />

        {/* Passing Requirement */}
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            Passing Score
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{examResult.passing_percentage}%</span>
        </div>

        <Separator className="dark:bg-slate-800" />

        {/* Objective/Theory Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-3.5 text-center border border-blue-100 dark:border-blue-900/50">
            <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-blue-500 dark:text-blue-400 font-medium uppercase tracking-wide mb-1">Objective</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {currentScore}
              <span className="text-sm text-blue-400 dark:text-blue-500 font-normal">/{trueObjectiveMax}</span>
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/40 rounded-xl p-3.5 text-center border border-purple-100 dark:border-purple-900/50">
            <Award className="h-4 w-4 text-purple-500 dark:text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-purple-500 dark:text-purple-400 font-medium uppercase tracking-wide mb-1">Theory</p>
            {examResult.status === 'graded' ? (
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {examResult.theory_score || 0}
                <span className="text-sm text-purple-400 dark:text-purple-500 font-normal">/{trueTheoryMax}</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-normal">/{trueTheoryMax}</span>
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "text-center py-2 rounded-lg text-xs font-semibold",
          examResult.status === 'graded'
            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            : examResult.status === 'pending_theory'
            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
            : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
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