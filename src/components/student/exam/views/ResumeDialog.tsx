// src/components/student/exam/views/ResumeDialog.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  RotateCcw, Clock, CheckCircle2, AlertCircle, Shield,
  ChevronRight, History, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import type { ResumeData } from '@/app/student/exam/[id]/types'

interface ResumeDialogProps {
  resumeData: ResumeData | null
  totalQuestions: number
  onResume: () => void
  onNewAttempt: () => void
  onDiscard: () => void
  maxAttempts?: number
  attemptsUsed?: number
  unloadCount?: number
}

export function ResumeDialog({
  resumeData, totalQuestions, onResume, onNewAttempt, onDiscard,
  maxAttempts = 1, attemptsUsed = 0, unloadCount = 0,
}: ResumeDialogProps) {
  const answeredCount = Object.keys(resumeData?.answers || {}).length
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const timeLeft = resumeData?.timeLeft || 0
  const isLowTime = timeLeft < 300
  const remainingAttempts = maxAttempts - attemptsUsed
  const isLastUnload = unloadCount >= 2

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border border-slate-200 bg-white shadow-xl rounded-2xl overflow-hidden">
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center text-white">
          <div className="inline-flex h-16 w-16 rounded-full bg-white/20 items-center justify-center mb-3 backdrop-blur-sm">
            <History className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Resume Exam?</h2>
          <p className="text-blue-100 text-sm mt-1">You have an exam session in progress</p>
        </div>

        <CardContent className="p-6">
          
          {/* Time Remaining */}
          <div className={cn(
            "rounded-xl p-4 mb-4 text-center border",
            isLowTime ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className={cn("h-5 w-5", isLowTime ? "text-red-500" : "text-blue-500")} />
              <span className="text-sm font-medium text-slate-600">Time Remaining</span>
            </div>
            <p className={cn("text-3xl font-black tracking-tight", isLowTime ? "text-red-600" : "text-blue-700")}>
              {formatTime(timeLeft)}
            </p>
            {isLowTime && <p className="text-red-500 text-xs mt-1 font-medium">Time is running low!</p>}
          </div>

          {/* Progress */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Progress</span>
              <span className="text-sm font-bold text-slate-700">{answeredCount} / {totalQuestions} answered</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-slate-400 mt-2">{Math.round(progressPercent)}% complete</p>
          </div>

          {/* Security Status */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
            <Shield className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="text-xs text-slate-500 space-y-0.5">
              <p className="font-medium text-slate-700">Security Status</p>
              <p>Tab switches: {resumeData?.tabSwitches || 0}/3 • Fullscreen: {resumeData?.fullscreenExits || 0}/3</p>
              <p className={cn(isLastUnload && "text-red-500 font-medium")}>
                <RefreshCw className="h-3 w-3 inline mr-0.5" />
                Page refreshes: {unloadCount}/3
                {isLastUnload && " — WARNING: Next refresh will terminate exam!"}
              </p>
            </div>
          </div>

          {/* Attempts Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
            <span>Attempt {attemptsUsed + 1} of {maxAttempts}</span>
            <span>{remainingAttempts} remaining</span>
          </div>

          <Separator className="mb-4" />

          {/* Actions */}
          <div className="space-y-2.5">
            <Button onClick={onResume} size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
              <RotateCcw className="mr-2 h-5 w-5" />
              Resume Where You Left Off
              <ChevronRight className="ml-auto h-5 w-5" />
            </Button>
            {remainingAttempts > 0 && (
              <Button variant="outline" onClick={onNewAttempt}
                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 h-11 rounded-xl">
                Start Fresh Attempt
              </Button>
            )}
            <Button variant="ghost" onClick={onDiscard}
              className="w-full text-slate-400 hover:text-slate-600 h-11 rounded-xl text-sm">
              Discard Progress & Return
            </Button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Closing this page or switching tabs during the exam may be recorded as a security violation. 
              Violations can result in automatic exam submission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}