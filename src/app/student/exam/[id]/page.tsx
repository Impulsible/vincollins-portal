// src/app/student/exam/[id]/page.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useExamLoader } from './hooks/useExamLoader'
import { useExamTimer } from './hooks/useExamTimer'
import { useExamSecurity } from './hooks/useExamSecurity'
import { useAutoSave } from './hooks/useAutoSave'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { calculateScore, calculateTheoryTotal } from './utils/scoring'
import type { ExamState, ExamResult } from './types'
import { CURRENT_TERM, CURRENT_SESSION } from './constants'

import { LoadingView } from '@/components/student/exam/views/LoadingView'
import { ErrorView } from '@/components/student/exam/views/ErrorView'
import { InstructionsView } from '@/components/student/exam/views/InstructionsView'
import { ResumeDialog } from '@/components/student/exam/views/ResumeDialog'
import { ExamInterface } from '@/components/student/exam/views/ExamInterface'
import { CompletedView } from '@/components/student/exam/views/CompletedView'
import { FullscreenPrompt } from '@/components/student/exam/views/FullscreenPrompt'
import { SubmitDialog } from '@/components/student/exam/dialogs/SubmitDialog'
import { ResultDialog } from '@/components/student/exam/dialogs/ResultDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const isSubmittingRef = useRef(false)
  const examEndedRef = useRef(false)

  const [examState, setExamState] = useState<ExamState>({
    currentIndex: 0, answers: {}, flaggedQuestions: new Set(),
    examStarted: false, examEnded: false, showInstructions: true,
    showQuestionPalette: false, showSubmitDialog: false,
    showResultDialog: false, showFullscreenPrompt: false,
    startingExam: false, isSubmitting: false,
  })

  const {
    loading, loadError, exam, profile, allQuestions,
    hasCompletedAttempt, examResult, setExamResult,
    attemptId, setAttemptId, attemptsUsed,
    resumeData, showResumeDialog, setShowResumeDialog,
    examTerminated, setExamTerminated,
    handleResumeExam, handleStartNewAttempt, handleDiscardAndStart,
  } = useExamLoader(examId, router)

  const isOnline = useNetworkStatus()

  const { timeLeft, setTimeLeft } = useExamTimer(
    examState.examStarted, exam?.duration || 30, examEndedRef,
    () => handleSubmit(true, 'Time expired')
  )

  // ✅ FIXED: Pass initial violations and attemptId for persistence
  const { tabSwitches, fullscreenExits, fullscreen, setFullscreen, showFullscreenPrompt, setShowFullscreenPrompt, enterFullscreen } = useExamSecurity(
    examState.examStarted,
    examEndedRef,
    () => handleSubmit(true, 'Security violation'),
    resumeData?.tabSwitches || 0,
    resumeData?.fullscreenExits || 0,
    attemptId
  )

  const { autoSaving, lastSaved } = useAutoSave(attemptId, examState.examStarted, examState.answers, allQuestions, examEndedRef)

  const isTerminated = examTerminated

  const theoryQuestionCount = allQuestions.filter(q => q.type === 'theory').length
  const requiredTheory = exam?.required_theory_count || theoryQuestionCount
  const answeredTheoryCount = allQuestions.filter(q => q.type === 'theory' && (examState.answers[q.id] || '').trim()).length
  const objectiveCount = allQuestions.filter(q => q.type !== 'theory').length
  const requiredTotal = objectiveCount + requiredTheory
  const answeredCount = Object.keys(examState.answers).filter(k => examState.answers[k]?.trim()).length
  const requiredUnanswered = Math.max(0, requiredTotal - answeredCount)
  const progressPercentage = requiredTotal > 0 ? Math.min(100, (answeredCount / requiredTotal) * 100) : (allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0)

  useEffect(() => {
    if (!examState.showResultDialog && hasCompletedAttempt && !examState.examStarted) {
      router.push('/student/exams')
    }
  }, [examState.showResultDialog])

  // ===== START EXAM =====
  const startExam = async () => {
    setExamState(prev => ({ ...prev, startingExam: true }))
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen()
      setFullscreen(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: att, error: insertError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId, student_id: session.user.id,
            student_name: profile?.full_name || session.user.email?.split('@')[0] || 'Student',
            student_email: session.user.email || '', student_class: profile?.class || '',
            status: 'in_progress', started_at: new Date().toISOString(),
            tab_switches: 0, fullscreen_exits: 0, unload_count: 0,
            attempt_number: attemptsUsed + 1,
            term: exam?.term || CURRENT_TERM, session_year: exam?.session_year || CURRENT_SESSION,
          }).select('id').single()

        if (insertError) {
          console.error('Insert error:', insertError)
          toast.error('Failed to start exam')
          setExamState(prev => ({ ...prev, startingExam: false }))
          return
        }
        if (att) setAttemptId(att.id)
      }

      setExamState(prev => ({ ...prev, examStarted: true, showInstructions: false, startingExam: false }))
      setTimeLeft((exam?.duration || 30) * 60)
      examEndedRef.current = false
      toast.success('Exam started! Good luck!')
    } catch (error: any) {
      toast.error('Failed to start exam')
      setExamState(prev => ({ ...prev, startingExam: false }))
    }
  }

  // ===== RESUME EXAM =====
  const onResumeExam = async () => {
    const data = await handleResumeExam()
    if (data) {
      setAttemptId(data.attemptId)
      setTimeLeft(data.timeLeft)
      setExamState(prev => ({ ...prev, answers: data.answers || {}, examStarted: true, showInstructions: false }))
      examEndedRef.current = false
      setShowResumeDialog(false)
    }
  }

  // ===== SUBMIT EXAM =====
  const handleSubmit = useCallback(async (isAuto = false, reason = 'manual') => {
    if (isSubmittingRef.current || examEndedRef.current) return
    isSubmittingRef.current = true
    examEndedRef.current = true

    setExamState(prev => ({ ...prev, examEnded: true, isSubmitting: true, showSubmitDialog: false }))
    if (document.fullscreenElement) { try { await document.exitFullscreen() } catch (e) {} }

    try {
      const result = calculateScore(allQuestions, examState.answers)
      const theoryTotal = calculateTheoryTotal(allQuestions)
      const passingScore = exam?.passing_percentage || 50
      const isPassed = result.percentage >= passingScore

      const objectiveAnswers: Record<string, string> = {}
      const theoryAnswers: Record<string, string> = {}
      allQuestions.forEach((q: any) => {
        if (q.type === 'theory') theoryAnswers[q.id] = examState.answers[q.id] || ''
        else objectiveAnswers[q.id] = examState.answers[q.id] || ''
      })

      const hasTheory = exam?.has_theory && theoryQuestionCount > 0
      const status = hasTheory ? 'pending_theory' : 'completed'

      if (attemptId) {
        await supabase.from('exam_attempts').update({
          status: status, submitted_at: new Date().toISOString(),
          is_auto_submitted: isAuto, auto_submit_reason: isAuto ? reason : null,
          tab_switches: tabSwitches, fullscreen_exits: fullscreenExits,
          answers: objectiveAnswers, theory_answers: theoryAnswers,
          objective_score: result.score, objective_total: result.total,
          theory_total: theoryTotal, total_score: result.score,
          total_marks: result.total + theoryTotal, percentage: result.percentage,
          is_passed: isPassed, correct_count: result.correct,
          incorrect_count: result.incorrect, unanswered_count: result.unanswered,
        }).eq('id', attemptId)
      }

      const finalResult: ExamResult = {
        ...result, theory_score: 0, theory_total: theoryTotal,
        is_passed: isPassed, passing_percentage: passingScore, status: status,
        attempts_used: attemptsUsed + 1, max_attempts: exam?.max_attempts || 1,
        submitted_at: new Date().toISOString(),
      }

      setExamResult(finalResult)
      setExamState(prev => ({ ...prev, examStarted: false, isSubmitting: false, showResultDialog: true }))
      toast.success(isAuto ? 'Exam submitted due to: ' + reason : hasTheory ? 'Exam submitted! Theory answers will be graded.' : 'Exam submitted successfully!')
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error('Failed to submit exam')
      setExamState(prev => ({ ...prev, isSubmitting: false }))
      isSubmittingRef.current = false
      examEndedRef.current = false
    }
  }, [allQuestions, examState.answers, exam, attemptId, tabSwitches, fullscreenExits, attemptsUsed, profile, examId, theoryQuestionCount])

  const updateAnswer = (questionId: string, value: string) => {
    setExamState(prev => ({ ...prev, answers: { ...prev.answers, [questionId]: value } }))
  }

  const toggleFlag = (questionId: string) => {
    setExamState(prev => {
      const newFlags = new Set(prev.flaggedQuestions)
      newFlags.has(questionId) ? newFlags.delete(questionId) : newFlags.add(questionId)
      return { ...prev, flaggedQuestions: newFlags }
    })
  }

  const navigate = (direction: 'prev' | 'next') => {
    setExamState(prev => ({
      ...prev,
      currentIndex: direction === 'prev' ? Math.max(0, prev.currentIndex - 1) : Math.min(allQuestions.length - 1, prev.currentIndex + 1),
    }))
  }

  const goToQuestion = (index: number) => {
    setExamState(prev => ({ ...prev, currentIndex: index, showQuestionPalette: false }))
  }

  // ===== RENDER =====
  if (loading) return <LoadingView />
  if (loadError) return <ErrorView message={loadError} onBack={() => router.push('/student')} />

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-red-200 shadow-lg rounded-2xl bg-white">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Exam Terminated</h2>
          <p className="text-red-600 mb-4">Security Policy Violation</p>
          <p className="text-slate-500 text-sm mb-6">This attempt has been recorded with your current score.</p>
          <Button onClick={() => router.push('/student/exams')} className="w-full rounded-xl">Back to Exams</Button>
        </Card>
      </div>
    )
  }

  if (showResumeDialog) {
    return (
      <ResumeDialog
        resumeData={resumeData} totalQuestions={allQuestions.length}
        onResume={onResumeExam}
        onNewAttempt={() => { setShowResumeDialog(false); startExam() }}
        onDiscard={() => { setShowResumeDialog(false); setExamState(prev => ({ ...prev, showInstructions: true })) }}
        maxAttempts={exam?.max_attempts || 1} attemptsUsed={attemptsUsed}
        unloadCount={resumeData?.unloadCount || 0}
      />
    )
  }

  if (hasCompletedAttempt && !examState.examStarted && !examState.showResultDialog) {
    return (
      <CompletedView
        exam={exam} profile={profile} examResult={examResult} allQuestions={allQuestions}
        onBackToDashboard={() => router.push('/student')}
        onViewFullResults={() => setExamState(prev => ({ ...prev, showResultDialog: true }))}
      />
    )
  }

  if (!examState.examStarted && examState.showInstructions) {
    return (
      <InstructionsView
        exam={exam!} profile={profile} allQuestions={allQuestions}
        startingExam={examState.startingExam} onStart={startExam}
        onCancel={() => router.push('/student/exams')}
      />
    )
  }

  if (showFullscreenPrompt) {
    return <FullscreenPrompt fullscreenExits={fullscreenExits} onReturnToFullscreen={enterFullscreen} />
  }

  return (
    <>
      <ExamInterface
        exam={exam} profile={profile} allQuestions={allQuestions}
        currentIndex={examState.currentIndex} answers={examState.answers}
        flaggedQuestions={examState.flaggedQuestions} answeredCount={answeredCount}
        unansweredCount={requiredUnanswered} progressPercentage={progressPercentage}
        timeLeft={timeLeft} tabSwitches={tabSwitches} fullscreenExits={fullscreenExits}
        isOnline={isOnline} autoSaving={autoSaving} lastSaved={lastSaved}
        showQuestionPalette={examState.showQuestionPalette}
        onUpdateAnswer={updateAnswer} onToggleFlag={toggleFlag}
        onNavigate={navigate} onGoToQuestion={goToQuestion}
        onTogglePalette={() => setExamState(prev => ({ ...prev, showQuestionPalette: !prev.showQuestionPalette }))}
        onSubmit={() => setExamState(prev => ({ ...prev, showSubmitDialog: true }))}
      />
      <SubmitDialog
        open={examState.showSubmitDialog}
        onOpenChange={(open: boolean) => setExamState(prev => ({ ...prev, showSubmitDialog: open }))}
        answeredCount={answeredCount} totalQuestions={requiredTotal}
        unansweredCount={requiredUnanswered} isSubmitting={examState.isSubmitting}
        onSubmit={() => handleSubmit(false)}
        theoryInfo={theoryQuestionCount > 0 && requiredTheory < theoryQuestionCount ? {
          required: requiredTheory, total: theoryQuestionCount, answered: answeredTheoryCount
        } : undefined}
      />
      <ResultDialog
        open={examState.showResultDialog}
        onOpenChange={(open: boolean) => { setExamState(prev => ({ ...prev, showResultDialog: open })); if (!open) router.push('/student/exams') }}
        examResult={examResult}
      />
    </>
  )
}