// src/components/student/exam/dialogs/SubmitDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, Send, Loader2, CheckCircle2,
  X, PenTool, Shield, ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TheoryInfo {
  required: number
  total: number
  answered: number
}

interface SubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  answeredCount: number
  totalQuestions: number
  unansweredCount: number
  isSubmitting: boolean
  onSubmit: () => void
  theoryInfo?: TheoryInfo
}

export function SubmitDialog({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  unansweredCount,
  isSubmitting,
  onSubmit,
  theoryInfo,
}: SubmitDialogProps) {
  const theoryComplete =
    theoryInfo ? theoryInfo.answered >= theoryInfo.required : true
  const allAnswered     = unansweredCount === 0
  const isFullyComplete = allAnswered && theoryComplete

  const progressPct =
    totalQuestions > 0
      ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] w-[95vw] p-0 gap-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">

        <DialogDescription className="sr-only">
          Confirm your exam submission.
        </DialogDescription>

        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-20 h-6 w-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5 text-zinc-400" />
        </button>

        {/* ── Header ── */}
        <div className="px-6 pt-7 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                  Submit Exam
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Review your progress before submitting
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* Progress section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">
                Progress
              </span>
              <span className="text-xs text-zinc-500">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {answeredCount}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">
                  {' '}/{' '}{totalQuestions}
                </span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isFullyComplete
                    ? 'bg-zinc-900 dark:bg-zinc-100'
                    : 'bg-zinc-400 dark:bg-zinc-500',
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
              {[
                { label: 'Answered', value: answeredCount,   active: true },
                { label: 'Skipped',  value: unansweredCount, active: unansweredCount > 0 },
                { label: 'Total',    value: totalQuestions,  active: false },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-0.5 py-2.5 bg-white dark:bg-zinc-950"
                >
                  <span className={cn(
                    'text-sm font-semibold tabular-nums',
                    stat.active && stat.label === 'Skipped'
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : stat.active
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-400',
                  )}>
                    {stat.value}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Theory section */}
          {theoryInfo && (
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-2.5">
                  <PenTool className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Theory Questions
                  </span>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {theoryInfo.answered}
                  <span className="text-zinc-300 dark:text-zinc-600 font-normal">
                    {' '}/{' '}{theoryInfo.required} required
                  </span>
                </span>
              </div>
              <div className="px-3.5 py-2.5">
                {/* Theory progress */}
                <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      theoryComplete
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : 'bg-zinc-400',
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (theoryInfo.answered / theoryInfo.required) * 100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {theoryComplete
                    ? theoryInfo.answered > theoryInfo.required
                      ? `${theoryInfo.answered - theoryInfo.required} extra beyond the ${theoryInfo.required} required.`
                      : 'All required theory questions answered.'
                    : `${theoryInfo.required - theoryInfo.answered} more required to submit.`}
                </p>
              </div>
            </div>
          )}

          {/* Status messages */}
          {unansweredCount > 0 && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <AlertTriangle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Unanswered questions will be marked as incorrect.
                </p>
              </div>
            </div>
          )}

          {isFullyComplete && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <CheckCircle2 className="h-4 w-4 text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Ready to submit
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  All required questions have been answered.
                </p>
              </div>
            </div>
          )}

          {/* Policy notice */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <Shield className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Single attempt
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                This exam cannot be retaken once submitted.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-1 grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 text-sm font-semibold rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Continue
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-11 text-sm font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}