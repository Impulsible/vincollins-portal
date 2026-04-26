// src/components/student/exam/dialogs/ResultDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle, XCircle, Award, Target, FileText,
  Clock, Sparkles, AlertTriangle, ArrowLeft
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
    router.push('/student/exams')
  }

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-2xl w-[95vw] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-0">
        
        {/* ===== RESULT BANNER ===== */}
        <div className={cn(
          "relative p-8 sm:p-10 text-center overflow-hidden",
          isTerminated
            ? "bg-gradient-to-br from-red-500 via-red-600 to-rose-700"
            : isPassed
              ? "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600"
              : "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700"
        )}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/3 rounded-full" />
          
          <div className="relative z-10">
            <div className="inline-flex h-20 w-20 rounded-full bg-white/20 items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
              {isTerminated ? (
                <AlertTriangle className="h-10 w-10 text-white" />
              ) : isPassed ? (
                <Sparkles className="h-10 w-10 text-white" />
              ) : (
                <XCircle className="h-10 w-10 text-white" />
              )}
            </div>
            
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
              {isTerminated 
                ? 'Exam Terminated' 
                : isPassed 
                  ? 'Excellent Work!' 
                  : 'Exam Completed'}
            </DialogTitle>
            
            <p className="text-white/80 text-sm sm:text-base font-medium max-w-md mx-auto">
              {isTerminated
                ? 'Security policy violation detected'
                : isPassed
                  ? 'You have successfully passed this examination'
                  : 'Keep studying and try again next time'}
            </p>
          </div>
        </div>

        {/* ===== SCORE SECTION ===== */}
        <div className="p-6 sm:p-8 lg:p-10">
          {!isTerminated && (
            <>
              {/* Score Display - Wide Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Percentage */}
                <div className="md:col-span-1 flex flex-col items-center justify-center">
                  <div className={cn(
                    "text-7xl font-black tracking-tighter",
                    isPassed ? "text-emerald-600" : "text-slate-700"
                  )}>
                    {examResult.percentage}
                    <span className="text-3xl text-slate-300 font-normal">%</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {examResult.score} / {examResult.total} points
                  </p>
                  <Progress 
                    value={examResult.percentage} 
                    className={cn(
                      "h-2 mt-3 w-full max-w-[160px]",
                      isPassed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-slate-400"
                    )} 
                  />
                </div>

                {/* Stats Cards */}
                <div className="md:col-span-2 grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center flex flex-col justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-600">{examResult.correct}</p>
                    <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">Correct</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center flex flex-col justify-center">
                    <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-500">{examResult.incorrect}</p>
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">Wrong</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center flex flex-col justify-center">
                    <span className="text-2xl text-slate-300 font-bold block mb-2">—</span>
                    <p className="text-2xl font-bold text-slate-400">{examResult.unanswered}</p>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Skipped</p>
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Score Details - Wide Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <Target className="h-5 w-5 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-400 font-medium uppercase">Passing Score</p>
                  <p className="text-lg font-bold text-slate-800">{examResult.passing_percentage}%</p>
                </div>
                
                {examResult.objective_score !== undefined && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <Award className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-xs text-blue-400 font-medium uppercase">Objective Score</p>
                    <p className="text-lg font-bold text-blue-700">
                      {examResult.objective_score}/{examResult.objective_total}
                    </p>
                  </div>
                )}
                
                {examResult.theory_total > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <FileText className="h-5 w-5 text-purple-500 mb-2" />
                    <p className="text-xs text-purple-400 font-medium uppercase">Theory Score</p>
                    <p className="text-lg font-bold text-purple-700">
                      {examResult.status === 'graded'
                        ? `${examResult.theory_score}/${examResult.theory_total}`
                        : `Pending / ${examResult.theory_total}`
                      }
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Badge */}
          <div className="mt-6 flex justify-center">
            <Badge className={cn(
              "px-5 py-2 text-sm font-semibold rounded-full",
              examResult.status === 'graded'
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : examResult.status === 'pending_theory'
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : examResult.status === 'terminated'
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
            )}>
              {examResult.status === 'graded'
                ? '✓ Fully Graded'
                : examResult.status === 'pending_theory'
                  ? '⏳ Pending Theory Review'
                  : examResult.status === 'terminated'
                    ? '🚫 Terminated'
                    : '✓ Objective Graded'}
            </Badge>
          </div>

          {/* Notices */}
          {examResult.status === 'pending_theory' && (
            <div className="flex items-center gap-3 mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-amber-700 text-sm">
                Your theory answers are pending review by your instructor.
              </p>
            </div>
          )}

          {isTerminated && (
            <div className="flex items-center gap-3 mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">
                This exam was terminated due to security violations.
              </p>
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10 pt-2">
          <Button
            onClick={handleClose}
            size="lg"
            className="w-full h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Exams
          </Button>
          <p className="text-center text-xs text-slate-400 mt-3">
            You can view detailed results anytime from your dashboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}