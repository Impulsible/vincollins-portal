// src/components/student/exam/dialogs/SubmitDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Send, Loader2, FileText, CheckCircle2, Info } from 'lucide-react'
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
  const theoryComplete = theoryInfo ? theoryInfo.answered >= theoryInfo.required : true
  const canSubmit = unansweredCount === 0 || (theoryInfo && theoryComplete)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Submit Exam?
          </DialogTitle>
          <p className="text-slate-500 text-sm">
            Review your answers before submitting
          </p>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* Overall Progress */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Progress</span>
              <span className="text-sm font-bold text-slate-800">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  answeredCount === totalQuestions ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${Math.min(100, (answeredCount / totalQuestions) * 100)}%` }}
              />
            </div>
          </div>

          {/* Theory info */}
          {theoryInfo && (
            <div className={cn(
              "rounded-xl p-4 border text-sm",
              theoryComplete
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            )}>
              <div className="flex items-center gap-2 font-semibold mb-2">
                <FileText className={cn(
                  "h-4 w-4",
                  theoryComplete ? "text-emerald-600" : "text-amber-600"
                )} />
                <span className={theoryComplete ? "text-emerald-800" : "text-amber-800"}>
                  Theory Questions
                </span>
              </div>
              <p className={theoryComplete ? "text-emerald-700" : "text-amber-700"}>
                You answered <strong>{theoryInfo.answered}</strong> of <strong>{theoryInfo.required}</strong> required
                (out of {theoryInfo.total} total theory questions).
              </p>
              {!theoryComplete && (
                <p className="text-red-600 text-xs mt-2 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  You need to answer at least {theoryInfo.required} theory questions.
                </p>
              )}
              {theoryComplete && theoryInfo.answered >= theoryInfo.required && (
                <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {theoryInfo.answered > theoryInfo.required 
                    ? `You've answered extra theory questions beyond the required ${theoryInfo.required}.`
                    : 'Required theory questions completed!'}
                </p>
              )}
            </div>
          )}

          {/* Unanswered warning */}
          {unansweredCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium text-sm">
                  {unansweredCount} required question{unansweredCount > 1 ? 's' : ''} unanswered
                </p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Unanswered questions will be marked as incorrect.
                </p>
              </div>
            </div>
          )}

          {/* All complete */}
          {canSubmit && unansweredCount === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-800 font-medium text-sm">
                  All required questions answered!
                </p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  You're ready to submit your exam.
                </p>
              </div>
            </div>
          )}

          {/* One-attempt warning */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-xs font-medium">Single Attempt Policy</p>
              <p className="text-blue-600 text-xs mt-0.5">
                This exam can only be taken once. Once submitted, you cannot retake it.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl w-full sm:w-auto order-2 sm:order-1"
          >
            Continue Exam
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full sm:w-auto order-1 sm:order-2 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Exam
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}