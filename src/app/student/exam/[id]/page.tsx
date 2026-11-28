// src/app/student/exam/[id]/page.tsx
"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, XCircle, UserX, AlertTriangle, RefreshCw } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

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
} from "./constants"

import type { ExamResult } from "./types"

import LoadingView from "@/components/student/exam/views/LoadingView"
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseStartMs(raw: string | undefined | null): number | null {
  if (!raw) return null
  const ms = new Date(raw).getTime()
  return Number.isFinite(ms) ? ms : null
}

function resolveExamDuration(exam: any): number {
  if (!exam) return 60
  const candidate =
    exam.duration_minutes ??
    exam.duration ??
    exam.time_limit_minutes ??
    exam.duration_mins ??
    exam.time_limit
  const parsed = Number(candidate)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60
}

/**
 * Safely requests fullscreen only when supported and does not crash if browser blocks it.
 */
async function safeRequestFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false
  if (document.fullscreenElement) return true

  const el = document.documentElement
  const fn =
    el.requestFullscreen ??
    (el as unknown as { webkitRequestFullscreen?: () => Promise<void> })
      .webkitRequestFullscreen

  if (!fn) return false

  try {
    await fn.call(el)
    return true
  } catch {
    // Browser blocked automatic fullscreen (user gesture required)
    return false
  }
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

  const [calmingDone, setCalmingDone] = useState(false)
  const [isCheckingAdmission, setIsCheckingAdmission] = useState(false)
  const [locallyAdmitted, setLocallyAdmitted] = useState(false)

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

  const dynamicBaseDuration = useMemo(() => resolveExamDuration(exam), [exam])
  const totalDurationMinutes = dynamicBaseDuration + dbExtraMinutes

  const studentCandidateIds = useMemo<string[]>(() => {
    if (!profile) return []
    const p = profile as Record<string, any>
    const ids = [p.id, p.user_id, p.userId, p.student_id, p.studentId]
      .filter(Boolean)
      .map(String)
      .filter((id) => UUID_RE.test(id))
    return Array.from(new Set(ids))
  }, [profile])

  // ── Attendance Exclusion Gate ──────────────────────────────────────────
  const isExcludedFromAttendance = useMemo(() => {
    if (locallyAdmitted) return false
    if (!exam || studentCandidateIds.length === 0) return false

    const excludedList: string[] = ((exam as any).excluded_student_ids || [])
      .map(String)
      .map((s: string) => s.toLowerCase())

    if (excludedList.length === 0) return false

    return studentCandidateIds.some((id) => excludedList.includes(id.toLowerCase()))
  }, [exam, studentCandidateIds, locallyAdmitted])

  // ── Optimized Realtime Attendance Listener (Only connects if student is excluded) ──
  useEffect(() => {
    // Zero-Socket: Do NOT open WebSockets if student is already inside taking the exam or admitted
    if (!examId || studentCandidateIds.length === 0 || state.examStarted || !isExcludedFromAttendance) {
      return
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`exam-admission-${examId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "exams",
          filter: `id=eq.${examId}`,
        },
        (payload: any) => {
          const excludedList: string[] = (payload.new?.excluded_student_ids || [])
            .map(String)
            .map((s: string) => s.toLowerCase())

          const stillExcluded = studentCandidateIds.some((id) =>
            excludedList.includes(id.toLowerCase())
          )

          if (!stillExcluded) {
            toast.success("You have been admitted to the exam hall! Unlocking session...")
            setLocallyAdmitted(true)
          }
        }
      )
      .subscribe()

    const handlePageHide = () => {
      supabase.removeChannel(channel)
    }

    window.addEventListener("pagehide", handlePageHide)

    return () => {
      window.removeEventListener("pagehide", handlePageHide)
      supabase.removeChannel(channel)
    }
  }, [examId, studentCandidateIds, state.examStarted, isExcludedFromAttendance])

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

  useEffect(() => {
    if (liveExtraMinutes !== dbExtraMinutes) {
      setDbExtraMinutes(liveExtraMinutes)
    }
  }, [liveExtraMinutes, dbExtraMinutes])

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
    examDuration: dynamicBaseDuration,
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

  const { timeLeft, cleanup } = useExamTimer({
    examStarted: state.examStarted,
    durationMinutes: totalDurationMinutes,
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

  const enterExam = useCallback(
    async (
      existingAttemptId: string,
      fallbackAnswers: Record<string, string> = {},
      knownStartMs?: number | null,
      _knownExtraMinutes?: number,
    ): Promise<boolean> => {
      let startMs = knownStartMs ?? null
      let extraMin = _knownExtraMinutes ?? 0

      if (startMs == null || !Number.isFinite(startMs) || _knownExtraMinutes == null) {
        const info = await fetchCanonicalStartInfo(existingAttemptId)
        if (startMs == null || !Number.isFinite(startMs)) startMs = info.startedAtMs
        if (_knownExtraMinutes == null) extraMin = info.extraTimeMinutes
      }

      if (startMs == null || !Number.isFinite(startMs)) {
        toast.error("Cannot load exam — missing start time.")
        return false
      }

      const durationMin = dynamicBaseDuration
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
        setTimeout(() => {
          if (!examEndedRef.current) {
            void handleSubmitRef.current(true, "Time already expired on resume")
          }
        }, 3000)
        return true
      }

      restoreTimerRef.current = setTimeout(() => {
        dispatch({ type: "SET_FULLY_RESTORED" })
      }, EXAM_CONFIG.FULLSCREEN_RESTORE_DELAY_MS)

      return true
    },
    [dynamicBaseDuration, setAttemptId, dispatch, setShowResumeDialog],
  )

  const onResumeExam = useCallback(async () => {
    await safeRequestFullscreen()
    setFullscreen(true)

    const data = await handleResumeExam()
    if (!data?.attemptId) return
    const knownStartMs = parseStartMs(data.started_at)
    if (knownStartMs == null) {
      toast.error("Cannot resume — corrupted start time.")
      return
    }
    await enterExam(data.attemptId, data.answers ?? {}, knownStartMs, undefined)
  }, [handleResumeExam, enterExam, setFullscreen])

  useEffect(() => {
    if (isResumeQuery && resumeData && !state.examStarted && !showResumeDialog) {
      onResumeExam()
    }
  }, [isResumeQuery, resumeData, state.examStarted, showResumeDialog, onResumeExam])

  const startExam = useCallback(async () => {
    await safeRequestFullscreen()
    setFullscreen(true)

    dispatch({ type: "START_EXAM_BEGIN" })
    try {
      const result = await startNewAttempt()
      if (!result) {
        dispatch({ type: "START_EXAM_FAIL" })
        return
      }

      const ok = await enterExam(result.attemptId, {}, parseStartMs(result.started_at), undefined)
      if (!ok) {
        dispatch({ type: "START_EXAM_FAIL" })
        return
      }

      toast.success(result.isResuming ? "Exam resumed!" : "Exam started! Good luck!")
    } catch {
      toast.error("Failed to start exam")
      dispatch({ type: "START_EXAM_FAIL" })
    }
  }, [dispatch, setFullscreen, startNewAttempt, enterExam])

  const handleReturnToFullscreen = useCallback(async () => {
    const success = await safeRequestFullscreen()
    if (success) {
      setFullscreen(true)
      setTimeout(() => setShowFullscreenPrompt(false), EXAM_CONFIG.FULLSCREEN_PROMPT_DISMISS_MS)
    } else {
      toast.error("Please click again or press F11 to enter fullscreen.")
    }
  }, [setFullscreen, setShowFullscreenPrompt])

  const handleCheckAdmissionStatus = async () => {
    setIsCheckingAdmission(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("exams")
        .select("excluded_student_ids, is_published, is_active, is_archived, status")
        .eq("id", examId)
        .single()

      if (error) throw error

      const stillLive =
        data?.is_published === true &&
        data?.is_active === true &&
        data?.is_archived !== true &&
        data?.status === "published"

      if (!stillLive) {
        toast.error("This exam is no longer available.")
        router.push("/student/exams")
        return
      }

      const excludedList: string[] = (data?.excluded_student_ids || [])
        .map(String)
        .map((s: string) => s.toLowerCase())

      const stillExcluded = studentCandidateIds.some((id) =>
        excludedList.includes(id.toLowerCase())
      )

      if (!stillExcluded) {
        toast.success("You have been admitted by the invigilator! Unlocking exam...")
        setLocallyAdmitted(true)
      } else {
        toast.error("You are still marked absent. Please notify the invigilator in the hall.")
      }
    } catch (err: any) {
      toast.error("Could not verify status: " + (err.message || "Network issue"))
    } finally {
      setIsCheckingAdmission(false)
    }
  }

  const isTerminated = examTerminated || securityViolated

  const studentDisplayName = useMemo<string | undefined>(() => {
    if (!profile) return undefined
    const p = profile as Record<string, unknown>
    const explicitFirst =
      (p.first_name as string | undefined) ?? (p.firstName as string | undefined)
    if (explicitFirst?.trim()) return explicitFirst.trim()

    const candidate =
      (p.full_name as string | undefined) ??
      (p.fullName as string | undefined) ??
      (p.name as string | undefined)
    return candidate?.toString().trim() || undefined
  }, [profile])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  if (loading || (!calmingDone && !loadError)) {
    return (
      <LoadingView
        studentName={studentDisplayName}
        onComplete={() => setCalmingDone(true)}
      />
    )
  }

  if (loadError) {
    return <ErrorView message={loadError} onBack={() => router.push("/student")} />
  }

  if (isExcludedFromAttendance) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="max-w-md w-full text-center p-6 sm:p-8 border-amber-200 dark:border-amber-900/50 shadow-xl rounded-2xl bg-white dark:bg-slate-900">
          <div className="h-16 w-16 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800/60">
            <UserX className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Exam Hall Verification Required
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 mb-4 border border-amber-300/40 dark:border-amber-700/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            Marked Absent on Hall Attendance
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
            You were marked absent when this examination session was published. Remote access is locked to ensure examination hall integrity.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-400 mb-6 text-left border border-slate-200 dark:border-slate-800 space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">How to gain access:</p>
            <p>1. Present yourself to the invigilator in the hall.</p>
            <p>2. Ask the invigilator to click <strong>"Admit Late"</strong> for you.</p>
            <p>3. This screen will automatically unlock, or you can click below.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/student/exams")}
              className="w-full sm:flex-1 rounded-xl"
            >
              Back to Exams
            </Button>
            <Button
              onClick={handleCheckAdmissionStatus}
              disabled={isCheckingAdmission}
              className="w-full sm:flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
            >
              {isCheckingAdmission ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />Check Status
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950/20 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="max-w-md w-full text-center p-8 border-red-200 dark:border-red-900/50 shadow-lg rounded-2xl bg-white dark:bg-slate-900">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-500 dark:text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Exam Terminated</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">Security Policy Violation</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Your answers have been saved and this attempt is recorded with your current score.
          </p>
          <Button onClick={() => router.push("/student/exams")} className="w-full rounded-xl">
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">
          Restoring exam state…
        </p>
      </div>
    )
  }

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
          derived.theoryCount > 0 && derived.requiredTheory < derived.theoryCount
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