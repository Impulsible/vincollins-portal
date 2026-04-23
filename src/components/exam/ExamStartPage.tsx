// components/exam/ExamStartPage.tsx - SELF-CONTAINED VERSION
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ExamStartPage({ examId, studentId }: { examId: string; studentId: string }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [canTake, setCanTake] = useState(false)
  const [errorReason, setErrorReason] = useState('')
  const [attemptInfo, setAttemptInfo] = useState<{
    currentAttempt: number
    maxAttempts: number
  } | null>(null)

  // Inline check function
  const checkCanTakeExam = useCallback(async (examId: string, studentId: string) => {
    try {
      const { data: submission, error } = await supabase
        .from('exam_submissions')
        .select('id, attempt_number, max_attempts, status, submitted_at')
        .eq('exam_id', examId)
        .eq('submitted_by', studentId)
        .maybeSingle()

      if (error) throw error

      if (!submission) {
        return { canTake: true, currentAttempt: 0, maxAttempts: 1 }
      }

      if (submission.submitted_at && submission.status !== 'pending') {
        if (submission.attempt_number >= submission.max_attempts) {
          return {
            canTake: false,
            reason: 'You have exhausted all attempts for this exam',
            currentAttempt: submission.attempt_number,
            maxAttempts: submission.max_attempts
          }
        }
      }

      return {
        canTake: true,
        currentAttempt: submission.attempt_number,
        maxAttempts: submission.max_attempts,
        submissionId: submission.id
      }
    } catch (error) {
      console.error('Error checking exam access:', error)
      return { canTake: false, reason: 'Error checking exam access' }
    }
  }, [])

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const result = await checkCanTakeExam(examId, studentId)
    setCanTake(result.canTake)
    setErrorReason(result.reason || '')
    setAttemptInfo({
      currentAttempt: result.currentAttempt || 0,
      maxAttempts: result.maxAttempts || 1
    })
    setChecking(false)
  }

  const handleStartExam = async () => {
    router.push(`/student/exam/${examId}`)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!canTake) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Cannot Take Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorReason}</AlertDescription>
          </Alert>
          {attemptInfo && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm">
                Attempts used: {attemptInfo.currentAttempt} of {attemptInfo.maxAttempts}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Ready to Begin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <p className="text-sm">
            Attempt #{attemptInfo?.currentAttempt ? attemptInfo.currentAttempt + 1 : 1}
          </p>
        </div>
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Once you start, the timer will begin.</p>
        </div>
        <Button onClick={handleStartExam} className="w-full" size="lg">
          Start Exam
        </Button>
      </CardContent>
    </Card>
  )
}