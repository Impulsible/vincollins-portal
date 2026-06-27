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
import { calculateScore, calculateTheoryTotal, formatTime } from './utils/scoring'
import type { ExamState, ExamResult } from './types'

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
    startNewAttempt,
  } = useExamLoader(examId, router)

  const isOnline = useNetworkStatus()

  const { timeLeft, setTimeLeft } = useExamTimer(
    examState.examStarted, exam?.duration || 30, examEndedRef,
    () => handleSubmit(true, 'Time expired')
  )

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
      
      const result = await startNewAttempt()
      
      if (result) {
        setAttemptId(result.attemptId)
        setExamState(prev => ({ 
          ...prev, 
          examStarted: true, 
          showInstructions: false, 
          startingExam: false 
        }))
        setTimeLeft((exam?.duration || 30) * 60)
        examEndedRef.current = false
        toast.success('Exam started! Good luck!')
      } else {
        setExamState(prev => ({ ...prev, startingExam: false }))
      }
    } catch (error: any) {
      console.error('Start exam error:', error)
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

  // ============================================
  // ✅ SUBMIT EXAM - COMPLETE FIXED VERSION
  // ============================================
  const handleSubmit = useCallback(async (isAuto = false, reason = 'manual') => {
    // ✅ Prevent multiple submissions
    if (isSubmittingRef.current || examEndedRef.current) {
      console.log('⚠️ Submit already in progress or exam ended')
      return
    }
    
    isSubmittingRef.current = true
    examEndedRef.current = true

    setExamState(prev => ({ ...prev, examEnded: true, isSubmitting: true, showSubmitDialog: false }))
    
    // ✅ Try to exit fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.warn('Fullscreen exit error:', e)
    }

    try {
      console.log('📝 Starting submit process...')
      
      // Calculate objective score
      const result = calculateScore(allQuestions, examState.answers)
      console.log('📊 Score calculated:', result)
      
      const passingScore = exam?.passing_percentage || 50
      const objectiveMax = exam?.objective_max || 20
      const theoryMax = exam?.theory_max || 40
      const hasTheory = exam?.has_theory && theoryQuestionCount > 0

      // Calculate percentage
      let displayPercentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
      const isPassed = displayPercentage >= passingScore

      // Separate answers
      const objectiveAnswers: Record<string, string> = {}
      const theoryAnswers: Record<string, string> = {}
      allQuestions.forEach((q: any) => {
        if (q.type === 'theory') {
          theoryAnswers[q.id] = examState.answers[q.id] || ''
        } else {
          objectiveAnswers[q.id] = examState.answers[q.id] || ''
        }
      })

      const status = hasTheory ? 'pending_theory' : 'completed'

      // ✅ Get CA scores (for display only - not stored in exam_attempts)
      let caTotalScore = 0
      let ca1Score = 0
      let ca2Score = 0
      
      if (profile?.id) {
        try {
          const { data: caData } = await supabase
            .from('ca_scores')
            .select('ca1_score, ca2_score')
            .eq('student_id', profile.id)
            .eq('exam_id', examId)
            .maybeSingle()
          
          if (caData) {
            ca1Score = Number(caData.ca1_score) || 0
            ca2Score = Number(caData.ca2_score) || 0
            caTotalScore = ca1Score + ca2Score
            console.log('✅ CA Scores (display):', { ca1Score, ca2Score, caTotalScore })
          }
        } catch (caError) {
          console.warn('⚠️ Error fetching CA scores:', caError)
        }
      }

      // ✅ UPDATE the attempt - ONLY columns that exist in exam_attempts
      if (attemptId) {
        console.log('📝 Updating attempt:', attemptId)
        
        const updateData = {
          status: status,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_auto_submitted: isAuto,
          auto_submit_reason: isAuto ? reason : null,
          tab_switches: tabSwitches || 0,
          fullscreen_exits: fullscreenExits || 0,
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          objective_score: result.score,
          objective_total: objectiveMax,
          theory_score: 0,
          theory_total: theoryMax,
          total_score: result.score,
          total_marks: objectiveMax,
          percentage: displayPercentage,
          is_passed: isPassed,
          correct_count: result.correct || 0,
          incorrect_count: result.incorrect || 0,
          unanswered_count: result.unanswered || 0
        }

        console.log('📤 Update data:', updateData)

        const { error } = await supabase
          .from('exam_attempts')
          .update(updateData)
          .eq('id', attemptId)

        if (error) {
          console.error('❌ Submit error:', error)
          toast.error('Failed to save exam results: ' + error.message)
          setExamState(prev => ({ ...prev, isSubmitting: false }))
          isSubmittingRef.current = false
          examEndedRef.current = false
          return
        }
        
        console.log('✅ Attempt updated successfully')
      } else {
        console.error('❌ No attempt ID found')
        toast.error('No active exam session found')
        setExamState(prev => ({ ...prev, isSubmitting: false }))
        isSubmittingRef.current = false
        examEndedRef.current = false
        return
      }

      // ✅ Get all attempts count
      const { data: allAttempts } = await supabase
        .from('exam_attempts')
        .select('id, status')
        .eq('exam_id', examId)
        .eq('student_id', profile?.id)
        .in('status', ['completed', 'graded', 'pending_theory', 'terminated'])

      const totalCompletedAttempts = allAttempts?.length || 1

      // ✅ Calculate final percentage with CA for display only
      let finalPercentage = displayPercentage
      if (caTotalScore > 0) {
        const totalWithCA = objectiveMax + 40
        const scoreWithCA = result.score + caTotalScore
        finalPercentage = totalWithCA > 0 ? Math.round((scoreWithCA / totalWithCA) * 100) : 0
      }

      const finalResult: ExamResult = {
        ...result,
        theory_score: 0,
        theory_total: theoryMax,
        is_passed: isPassed,
        passing_percentage: passingScore,
        status: status,
        attempts_used: totalCompletedAttempts,
        max_attempts: exam?.max_attempts || 10,
        submitted_at: new Date().toISOString(),
        percentage: finalPercentage,
        total_score: result.score,
        total_marks: objectiveMax,
        objective_score: result.score,
        objective_total: objectiveMax,
        ca_score: caTotalScore,
        ca1_score: ca1Score,
        ca2_score: ca2Score,
        grade: isPassed ? 'P' : 'F'
      }

      setExamResult(finalResult)
      setExamState(prev => ({ ...prev, examStarted: false, isSubmitting: false, showResultDialog: true }))
      
      toast.success(
        hasTheory 
          ? `Exam submitted! Theory pending grading. Score: ${finalPercentage}% (Attempt ${totalCompletedAttempts}/${exam?.max_attempts || 10})` 
          : `Exam completed! Score: ${finalPercentage}% (Attempt ${totalCompletedAttempts}/${exam?.max_attempts || 10})`
      )
      
      console.log('✅ Submit complete!')
      
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      toast.error('Failed to submit exam: ' + (error.message || 'Unknown error'))
      setExamState(prev => ({ ...prev, isSubmitting: false }))
      isSubmittingRef.current = false
      examEndedRef.current = false
    }
  }, [allQuestions, examState.answers, exam, attemptId, tabSwitches, fullscreenExits, profile, examId, theoryQuestionCount])

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
        resumeData={resumeData}
        totalQuestions={allQuestions.length}
        onResume={onResumeExam}
        maxAttempts={exam?.max_attempts || 1}
        attemptsUsed={attemptsUsed}
        unloadCount={resumeData?.unloadCount || 0}
        examTerminated={examTerminated}
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
        exam={exam!} 
        profile={profile} 
        allQuestions={allQuestions}
        startingExam={examState.startingExam} 
        onStart={startExam}
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