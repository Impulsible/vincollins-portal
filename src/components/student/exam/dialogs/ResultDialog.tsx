// src/components/student/exam/dialogs/ResultDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, X, Trophy, Minus, Clock
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
  const isPendingTheory = examResult.status === 'pending_theory'

  const handleClose = () => {
    onOpenChange(false)
    router.push('/student/exams')
  }

  const getStatusBadge = () => {
    if (isTerminated) return { label: 'Terminated', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800' }
    if (isPendingTheory) return { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800' }
    if (examResult.status === 'graded') return { label: 'Graded', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' }
    return { label: 'Completed', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800' }
  }

  const statusBadge = getStatusBadge()

  const getScoreColor = () => {
    if (isTerminated) return 'text-red-600 dark:text-red-400'
    if (isPassed) return 'text-emerald-600 dark:text-emerald-400'
    return 'text-amber-600 dark:text-amber-400'
  }

  const getProgressColor = () => {
    if (isTerminated) return '[&>div]:bg-red-500'
    if (isPassed) return '[&>div]:bg-emerald-500'
    return '[&>div]:bg-amber-500'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[96vw] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden p-0">
        
        <DialogHeader className="sr-only">
          <DialogTitle>{isTerminated ? 'Exam Terminated' : isPassed ? 'Exam Passed' : 'Exam Not Passed'}</DialogTitle>
          <DialogDescription>{isTerminated ? 'Security violations detected' : `Score: ${examResult.percentage}%`}</DialogDescription>
        </DialogHeader>
        
        <button onClick={handleClose} className="absolute top-3 right-3 z-20 h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center">
          <X className="h-3.5 w-3.5 text-slate-500" />
        </button>

        {/* Single horizontal row layout */}
        <div className="flex items-center gap-6 p-5">
          
          {/* Left: Score */}
          <div className="flex-shrink-0 text-center min-w-[100px]">
            <p className={cn("text-5xl font-black tracking-tighter leading-none", getScoreColor())}>
              {examResult.percentage}<span className="text-xl text-slate-300 dark:text-slate-600 font-normal">%</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">{examResult.score}/{examResult.total} pts</p>
            {isPendingTheory && <p className="text-[10px] text-amber-500 mt-0.5">*Pending</p>}
          </div>

          {/* Middle: Status + Stats */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Status row */}
            <div className="flex items-center gap-3">
              {isTerminated ? <AlertTriangle className="h-4 w-4 text-red-500" /> : isPassed ? <Trophy className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-amber-500" />}
              <span className={cn("text-xs font-bold uppercase", isTerminated ? "text-red-600" : isPassed ? "text-emerald-600" : "text-amber-600")}>
                {isTerminated ? 'Terminated' : isPassed ? 'Passed' : 'Not Passed'}
              </span>
              <Badge className={cn("text-[10px] px-2 py-0.5 rounded-full border", statusBadge.className)}>{statusBadge.label}</Badge>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"><CheckCircle className="h-3 w-3 text-emerald-500" />{examResult.correct}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"><XCircle className="h-3 w-3 text-red-400" />{examResult.incorrect}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"><Minus className="h-3 w-3 text-slate-400" />{examResult.unanswered}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <Progress value={examResult.percentage} className={cn("h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full", getProgressColor())} />
              <div className="flex justify-between text-[10px] text-slate-400"><span>0%</span><span>{examResult.passing_percentage}% pass</span><span>100%</span></div>
            </div>

            {/* Details inline */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Pass: <strong className="text-slate-700 dark:text-slate-300">{examResult.passing_percentage}%</strong></span>
              {examResult.objective_score !== undefined && <span>Obj: <strong className="text-slate-700 dark:text-slate-300">{examResult.objective_score}/{examResult.objective_total}</strong></span>}
              {examResult.theory_total > 0 && <span className="italic text-slate-400">Theory: graded by teacher</span>}
            </div>
          </div>

          {/* Right: Button */}
          <div className="flex-shrink-0">
            <Button onClick={handleClose} size="sm" className="h-9 px-4 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Exams
            </Button>
          </div>
        </div>

        {/* Bottom notice if needed */}
        {(isPendingTheory || isTerminated) && (
          <div className={cn("px-5 py-2 text-xs flex items-center gap-2", isTerminated ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-t border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-t border-amber-200 dark:border-amber-800")}>
            {isTerminated ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
            <span>{isTerminated ? 'Security violations detected during exam session.' : 'Theory pending review. Final score will update once graded.'}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}