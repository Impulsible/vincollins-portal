// src/components/student/exam/dialogs/ResultDialog.tsx
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle, XCircle, Award, Target, FileText,
  Clock, Sparkles, AlertTriangle, ArrowLeft, X, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { ExamResult } from '@/app/student/exam/[id]/types'

interface ResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examResult: ExamResult | null
}

export function ResultDialog({
  open,
  onOpenChange,
  examResult,
}: ResultDialogProps) {
  const router = useRouter()

  if (!examResult) return null

  const isPassed = examResult.is_passed
  const isTerminated = examResult.status === 'terminated'

  const handleClose = () => {
    onOpenChange(false)
    router.push('/student/exams')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[95vw] sm:max-w-xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-0">
        
        {/* Close Button */}
        <button onClick={handleClose}
          className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>

        {/* ===== BANNER ===== */}
        <div className={cn(
          "p-6 sm:p-8 text-center",
          isTerminated ? "bg-red-50" : isPassed ? "bg-emerald-50" : "bg-slate-50"
        )}>
          <div className={cn(
            "inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-3",
            isTerminated ? "bg-red-100" : isPassed ? "bg-emerald-100" : "bg-slate-100"
          )}>
            {isTerminated ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : isPassed ? (
              <Trophy className="h-8 w-8 text-emerald-600" />
            ) : (
              <XCircle className="h-8 w-8 text-slate-500" />
            )}
          </div>
          <h2 className={cn(
            "text-xl sm:text-2xl font-bold",
            isTerminated ? "text-red-700" : isPassed ? "text-emerald-700" : "text-slate-700"
          )}>
            {isTerminated ? 'Exam Terminated' : isPassed ? 'Excellent Work!' : 'Exam Completed'}
          </h2>
          <p className={cn(
            "text-sm mt-1",
            isTerminated ? "text-red-600" : isPassed ? "text-emerald-600" : "text-slate-500"
          )}>
            {isTerminated ? 'Security violation detected' : isPassed ? 'You passed this examination' : 'Better luck next time'}
          </p>
        </div>

        {/* ===== SCORE ===== */}
        <div className="p-6">
          {!isTerminated && (
            <>
              {/* Big Score */}
              <div className="text-center mb-6">
                <div className={cn(
                  "text-6xl font-black tracking-tight",
                  isPassed ? "text-emerald-600" : "text-slate-700"
                )}>
                  {examResult.percentage}<span className="text-2xl text-slate-300 font-normal">%</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {examResult.score} out of {examResult.total} points
                </p>
                <Progress value={examResult.percentage} 
                  className={cn("h-2 mt-3 max-w-[180px] mx-auto", isPassed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-slate-400")} />
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-emerald-600">{examResult.correct}</p>
                  <p className="text-[10px] text-emerald-500 font-semibold uppercase">Correct</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-red-500">{examResult.incorrect}</p>
                  <p className="text-[10px] text-red-400 font-semibold uppercase">Wrong</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-xl text-slate-300 font-bold block mb-1">—</span>
                  <p className="text-xl font-bold text-slate-400">{examResult.unanswered}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Skipped</p>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Passing Score</span>
                  <span className="font-semibold text-slate-700">{examResult.passing_percentage}%</span>
                </div>
                {examResult.objective_score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Objective</span>
                    <span className="font-semibold text-slate-700">{examResult.objective_score}/{examResult.objective_total}</span>
                  </div>
                )}
                {examResult.theory_total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Theory</span>
                    <span className="font-semibold text-slate-700">
                      {examResult.status === 'graded' ? `${examResult.theory_score}/${examResult.theory_total}` : `Pending / ${examResult.theory_total}`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Badge */}
          <div className="mt-5 flex justify-center">
            <Badge className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full",
              examResult.status === 'graded' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              examResult.status === 'pending_theory' ? "bg-amber-100 text-amber-700 border-amber-200" :
              examResult.status === 'terminated' ? "bg-red-100 text-red-700 border-red-200" :
              "bg-blue-100 text-blue-700 border-blue-200"
            )}>
              {examResult.status === 'graded' ? '✓ Graded' : 
               examResult.status === 'pending_theory' ? '⏳ Pending Review' :
               examResult.status === 'terminated' ? '🚫 Terminated' : '✓ Completed'}
            </Badge>
          </div>

          {/* Notices */}
          {examResult.status === 'pending_theory' && (
            <div className="flex items-center gap-2 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              Theory answers pending instructor review.
            </div>
          )}
          {isTerminated && (
            <div className="flex items-center gap-2 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              Exam terminated due to security violations.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button onClick={handleClose} size="lg"
            className="w-full h-11 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}