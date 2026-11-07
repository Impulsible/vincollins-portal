// src/app/student/exam/[id]/page.tsx
"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, XCircle } from "lucide-react"

import { useExamLoader } from "./hooks/useExamLoader"
import { useExamSecurity } from "./hooks/useExamSecurity"
import { useAutoSave } from "./hooks/useAutoSave"
import { useNetworkStatus } from "./hooks/useNetworkStatus"
import { useExamTimer } from "./hooks/useExamTimer"
import { useExamReducer } from "./hooks/useExamReducer"
import { useExamSubmission } from "./hooks/useExamSubmission"
import { useExtraTimeSync } from "./hooks/useExtraTimeSync"

import { fetchCanonicalStartInfo } from "./services/examSubmissionService"

import {
  EXAM_CONFIG,
  DEFAULT_PASSING_PERCENTAGE,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_EXAM_DURATION,
} from "./constants"

import type { ExamResult } from "./types"

import { LoadingView } from "@/components/student/exam/views/LoadingView"
import { ErrorView } from "@/components/student/exam/views/ErrorView"
import { InstructionsView } from "@/components/student/exam/views/InstructionsView"
import { ResumeDialog } from "@/components/student/exam/views/ResumeDialog"
import { ExamInterface } from "@/components/student/exam/views/ExamInterface"
import { CompletedView } from "@/components/student/exam/views/CompletedView"
import { FullscreenPrompt } from "@/components/student/exam/views/FullscreenPrompt"
import { SubmitDialog } from "@/components/student/exam/dialogs/SubmitDialog"
import { ResultDialog } from "@/components/student/exam/dialogs/ResultDialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ── Helpers ────────────────────────────────────────────────────────────────

function parseStartMs(raw: string | undefined | null): number | null {
  if (!raw) return null
  const ms = new Date(raw).getTime()
  return Number.isFinite(ms) ? ms : null
}

async function requestFullscreen(): Promise<void> {
  const el = document.documentElement
  const fn =
    el.requestFullscreen ??
    (el as unknown as { webkitRequestFullscreen?: () => Promise<void> })
      .webkitRequestFullscreen
  if (fn) await fn.call(el)
}

// ── Page Component ─────────────────────────────────────────────────────────

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const examId = params.id as string
  const isResumeQuery = searchParams.get("resume") === "true"

  const examEndedRef = useRef(false)
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    state,
    dispatch,
    updateAnswer,
    toggleFlag,
    navigate,
    goToQuestion,
  } = useExamReducer()

  const {
    loading,
    loadError,
    exam,
    profile,
    allQuestions,
    hasCompletedAttempt,
    examResult,
    setExamResult,
    attemptId,
    setAttemptId,
    attemptsUsed,
    resumeData,
    showResumeDialog,
    setShowResumeDialog,
    examTerminated,
    handleResumeExam,
    startNewAttempt,
  } = useExamLoader(examId, router)

  const { isOnline } = useNetworkStatus()

  const [dbStartTime, setDbStartTime] = useState<number | null>(null)
  const [dbExtraMinutes, setDbExtraMinutes] = useState<number>(0)
  const [extraTimeBanner, setExtraTimeBanner] = useState<{ delta: number; ts: number } | null>(null)

  // ✅ Realtime + polling sync for extra time grants
  const { extraMinutes: liveExtraMinutes } = useExtraTimeSync({
    attemptId: attemptId ?? undefined,
    enabled: state.examStarted && state.isFullyRestored,
    examEndedRef,
    initialExtraMinutes: dbExtraMinutes,
    onExtraTimeGranted: (newTotal, delta) => {
      setDbExtraMinutes(newTotal)
      setExtraTimeBanner({ delta, ts: Date.now() })
      if (examEndedRef.current) examEndedRef.current = false
    },
  })

  // Reflect external change into state that feeds the timer
  useEffect(() => {
    if (liveExtraMinutes !== dbExtraMinutes) {
      setDbExtraMinutes(liveExtraMinutes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveExtraMinutes])

  // Derived counts (memoized)
  const derived = useMemo(() => {
    const theoryQuestions = allQuestions.filter((q) => q.type === "theory")
    const objectiveQuestions = allQuestions.filter((q) => q.type !== "theory")
    const theoryCount = theoryQuestions.length
    const objectiveCount = objectiveQuestions.length
    const requiredTheory = exam?.required_theory_count ?? theoryCount
    const answeredTheory = theoryQuestions.filter(
      (q) => (state.answers[q.id] ?? "").trim(),
    ).length
    const answeredTotal = Object.values(state.answers).filter(
      (v: string) => v?.trim(),
    ).length
    const requiredTotal = objectiveCount + requiredTheory
    const unanswered = Math.max(0, requiredTotal - answeredTotal)
    const progress =
      requiredTotal > 0
        ? Math.min(100, (answeredTotal / requiredTotal) * 100)
        : 0

    return {
      theoryCount,
      objectiveCount,
      requiredTheory,
      answeredTheory,
      answeredTotal,
      requiredTotal,
      unanswered,
      progress,
    }
  }, [allQuestions, exam?.required_theory_count, state.answers])

  const stopTimerRef = useRef<() => void>(() => {})
  const handleSubmitRef = useRef<
    (isAuto?: boolean, reason?: string) => Promise<void>
  >(async () => {})

  const { handleSubmit } = useExamSubmission({
    attemptId,
    examId,
    studentId: profile?.id,
    allQuestions,
    answers: state.answers,
    examDuration: Number(exam?.duration) || DEFAULT_EXAM_DURATION,
    passingPercentage: exam?.passing_percentage ?? DEFAULT_PASSING_PERCENTAGE,
    maxAttempts: exam?.max_attempts ?? DEFAULT_MAX_ATTEMPTS,
    tabSwitches: 0,
    fullscreenExits: 0,
    theoryQuestionCount: derived.theoryCount,
    dispatch,
    setExamResult: setExamResult as (r: ExamResult) => void,
    examEndedRef,
    stopTimer: () => stopTimerRef.current(),
  })

  handleSubmitRef.current = handleSubmit

  // ✅ Timer total = base duration + live extra minutes
  const baseDurationMinutes = Number(exam?.duration) || DEFAULT_EXAM_DURATION
  const durationMinutes = baseDurationMinutes + dbExtraMinutes

  const { timeLeft, cleanup } = useExamTimer({
    examStarted: state.examStarted,
    durationMinutes,
    examEndedRef,
    startTime: dbStartTime ?? undefined,
    attemptId: attemptId ?? undefined,
    examId,
    autoSubmit: true,
    onTimeUp: () => handleSubmitRef.current(true, "Time expired"),
  })

  stopTimerRef.current = cleanup

  const {
    tabSwitches,
    fullscreenExits,
    setFullscreen,
    showFullscreenPrompt: securityFullscreenPrompt,
    setShowFullscreenPrompt,
    securityViolated,
  } = useExamSecurity({
    examStarted: state.examStarted && state.isFullyRestored,
    examEndedRef,
    onViolation: () => router.push("/student/exams"),
    initialTabSwitches: resumeData?.tabSwitches ?? 0,
    initialFullscreenExits: resumeData?.fullscreenExits ?? 0,
    attemptId: attemptId ?? undefined,
    answers: state.answers,
    questions: allQuestions,
    onAutoSubmit: async (reason: string) => {
      await handleSubmitRef.current(true, reason)
    },
  })

  const { autoSaving, lastSaved } = useAutoSave({
    attemptId: attemptId ?? undefined,
    isActive: state.examStarted && state.isFullyRestored,
    answers: state.answers,
    questions: allQuestions,
    examEndedRef,
  })

  useEffect(() => {
    return () => {
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current)
    }
  }, [])

  // ── Enter Exam ─────────────────────────────────────────────────────────

  const enterExam = useCallback(
    async (
      existingAttemptId: string,
      fallbackAnswers: Record<string, string> = {},
      knownStartMs?: number | null,
      /** @deprecated always re-read from DB for the freshest extra time */
      _knownExtraMinutes?: number,
    ): Promise<boolean> => {
      let startMs = knownStartMs ?? null
      let extraMin = _knownExtraMinutes ?? 0

      // Always fetch fresh extra minutes + canonical start from DB
      if (
        startMs == null ||
        !Number.isFinite(startMs) ||
        _knownExtraMinutes == null
      ) {
        const info = await fetchCanonicalStartInfo(existingAttemptId)
        if (startMs == null || !Number.isFinite(startMs)) {
          startMs = info.startedAtMs
        }
        if (_knownExtraMinutes == null) {
          extraMin = info.extraTimeMinutes
        }
      }

      if (startMs == null || !Number.isFinite(startMs)) {
        toast.error("Cannot load exam — missing start time.")
        return false
      }

      const durationMin = Math.max(
        1,
        Number(exam?.duration) || DEFAULT_EXAM_DURATION,
      )
      const totalSec = (durationMin + extraMin) * 60
      const elapsed = Math.floor((Date.now() - startMs) / 1000)
      const remaining = Math.max(0, totalSec - elapsed)

      setAttemptId(existingAttemptId)
      setDbStartTime(startMs)
      setDbExtraMinutes(extraMin)
      dispatch({ type: "ENTER_EXAM", answers: fallbackAnswers })
      examEndedRef.current = false
      setShowResumeDialog(false)

      if (remaining <= 0) {
        dispatch({ type: "SET_FULLY_RESTORED" })
        // 3s grace — if admin grants extra in that window, live sync revives us
        setTimeout(() => {
          if (!examEndedRef.current) {
            void handleSubmitRef.current(true, "Time already expired on resume")
          }
        }, 3000)
        return true
      }

      restoreTimerRef.current = setTimeout(() => {
        dispatch({ type: "SET_FULLY_RESTORED" })
        requestFullscreen().catch(() => {})
      }, EXAM_CONFIG.FULLSCREEN_RESTORE_DELAY_MS)

      return true
    },
    [exam?.duration, setAttemptId, dispatch, setShowResumeDialog],
  )

  // ── Resume ─────────────────────────────────────────────────────────────

  const onResumeExam = useCallback(async () => {
    const data = await handleResumeExam()
    if (!data?.attemptId) return

    const knownStartMs = parseStartMs(data.started_at)
    if (knownStartMs == null) {
      toast.error("Cannot resume — corrupted start time.")
      return
    }

    await enterExam(data.attemptId, data.answers ?? {}, knownStartMs, undefined)
  }, [handleResumeExam, enterExam])

  useEffect(() => {
    if (
      isResumeQuery &&
      resumeData &&
      !state.examStarted &&
      !showResumeDialog
    ) {
      onResumeExam()
    }
  }, [
    isResumeQuery,
    resumeData,
    state.examStarted,
    showResumeDialog,
    onResumeExam,
  ])

  // ── Start ──────────────────────────────────────────────────────────────

  const startExam = useCallback(async () => {
    dispatch({ type: "START_EXAM_BEGIN" })
    try {
      await requestFullscreen()
      setFullscreen(true)

      const result = await startNewAttempt()
      if (!result) {
        dispatch({ type: "START_EXAM_FAIL" })
        return
      }

      const ok = await enterExam(
        result.attemptId,
        {},
        parseStartMs(result.started_at),
        undefined,
      )

      if (!ok) {
        dispatch({ type: "START_EXAM_FAIL" })
        return
      }

      toast.success(
        result.isResuming ? "Exam resumed!" : "Exam started! Good luck!",
      )
    } catch {
      toast.error("Failed to start exam")
      dispatch({ type: "START_EXAM_FAIL" })
    }
  }, [dispatch, setFullscreen, startNewAttempt, enterExam])

  // ── Fullscreen return ──────────────────────────────────────────────────

  const handleReturnToFullscreen = useCallback(async () => {
    try {
      await requestFullscreen()
      setFullscreen(true)
      setTimeout(
        () => setShowFullscreenPrompt(false),
        EXAM_CONFIG.FULLSCREEN_PROMPT_DISMISS_MS,
      )
    } catch {
      toast.error("Please press F11 to enter fullscreen.")
    }
  }, [setFullscreen, setShowFullscreenPrompt])

  const isTerminated = examTerminated || securityViolated

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) return <LoadingView />

  if (loadError) {
    return (
      <ErrorView message={loadError} onBack={() => router.push("/student")} />
    )
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950/20 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="max-w-md w-full text-center p-8 border-red-200 dark:border-red-900/50 shadow-lg rounded-2xl bg-white dark:bg-slate-900">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle
              className="h-10 w-10 text-red-500 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
            Exam Terminated
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            Security Policy Violation
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Your answers have been saved and this attempt is recorded with your
            current score.
          </p>
          <Button
            onClick={() => router.push("/student/exams")}
            className="w-full rounded-xl"
          >
            Back to Exams
          </Button>
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
        maxAttempts={exam?.max_attempts ?? 1}
        attemptsUsed={attemptsUsed}
        unloadCount={resumeData?.unloadCount ?? 0}
        examTerminated={examTerminated}
      />
    )
  }

  if (hasCompletedAttempt && !state.examStarted && !state.showResultDialog) {
    return (
      <CompletedView
        exam={exam}
        profile={profile}
        examResult={examResult}
        allQuestions={allQuestions}
        onBackToDashboard={() => router.push("/student")}
        onViewFullResults={() => dispatch({ type: "SHOW_RESULT" })}
      />
    )
  }

  if (!state.examStarted && state.showInstructions) {
    return (
      <InstructionsView
        exam={exam!}
        profile={profile}
        allQuestions={allQuestions}
        startingExam={state.startingExam}
        onStart={startExam}
        onCancel={() => router.push("/student/exams")}
      />
    )
  }

  if (securityFullscreenPrompt) {
    return (
      <FullscreenPrompt
        fullscreenExits={fullscreenExits}
        onReturnToFullscreen={handleReturnToFullscreen}
      />
    )
  }

  if (!state.isFullyRestored) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">
          Restoring exam state…
        </p>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN EXAM UI
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <>
      {extraTimeBanner && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
          onAnimationEnd={() => {
            setTimeout(() => setExtraTimeBanner(null), 6000)
          }}
        >
          ⏱️ +{extraTimeBanner.delta} min added! Timer extended.
        </div>
      )}

      <ExamInterface
        exam={exam}
        profile={profile}
        allQuestions={allQuestions}
        currentIndex={state.currentIndex}
        answers={state.answers}
        flaggedQuestions={state.flaggedQuestions}
        answeredCount={derived.answeredTotal}
        unansweredCount={derived.unanswered}
        progressPercentage={derived.progress}
        timeLeft={timeLeft}
        tabSwitches={tabSwitches}
        fullscreenExits={fullscreenExits}
        isOnline={isOnline}
        autoSaving={autoSaving}
        lastSaved={lastSaved}
        showQuestionPalette={state.showQuestionPalette}
        onUpdateAnswer={updateAnswer}
        onToggleFlag={toggleFlag}
        onNavigate={(dir) => navigate(dir, allQuestions.length - 1)}
        onGoToQuestion={goToQuestion}
        onTogglePalette={() => dispatch({ type: "TOGGLE_PALETTE" })}
        onSubmit={() => dispatch({ type: "SHOW_SUBMIT_DIALOG" })}
      />

      <SubmitDialog
        open={state.showSubmitDialog}
        onOpenChange={(open: boolean) =>
          dispatch(
            open
              ? { type: "SHOW_SUBMIT_DIALOG" }
              : { type: "HIDE_SUBMIT_DIALOG" },
          )
        }
        answeredCount={derived.answeredTotal}
        totalQuestions={derived.requiredTotal}
        unansweredCount={derived.unanswered}
        isSubmitting={state.isSubmitting}
        onSubmit={() => handleSubmit(false)}
        theoryInfo={
          derived.theoryCount > 0 &&
          derived.requiredTheory < derived.theoryCount
            ? {
                required: derived.requiredTheory,
                total: derived.theoryCount,
                answered: derived.answeredTheory,
              }
            : undefined
        }
      />

      <ResultDialog
        open={state.showResultDialog}
        onOpenChange={(open: boolean) => {
          dispatch({ type: "HIDE_RESULT" })
          if (!open) router.push("/student/exams")
        }}
        examResult={examResult}
      />
    </>
  )
}