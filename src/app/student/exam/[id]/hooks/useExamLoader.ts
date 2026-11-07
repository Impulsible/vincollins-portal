// src/app/student/exam/[id]/hooks/useExamLoader.ts
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { calculateScore } from "../utils/scoring"
import { normalizeExamQuestions } from "../utils/questionNormalizer"
import {
  requireSession,
  fetchProfile,
  fetchExam,
  fetchAttempts,
  getCompletedAttempts,
  getActiveAttempt,
  buildExamResult,
  autoSubmitOnUnloadExceeded,
  incrementUnloadCount,
  findInProgressAttempt,
  createAttempt,
} from "../services/examLoaderService"
import type {
  Exam,
  Profile,
  Question,
  ExamResult,
  ResumeData,
  StartAttemptResult,
  UseExamLoaderReturn,
} from "../types"

const MAX_UNLOADS = 3

/**
 * A genuine "security terminated" attempt is one whose status is
 * literally `terminated`. Auto-submits (`is_auto_submitted = true`) are
 * NOT terminations — they're submissions that an admin can revive by
 * granting extra time (which sets status back to `in_progress`).
 */
function isSecurityTerminated(attempt: {
  status?: string | null
  is_auto_submitted?: boolean | null
}): boolean {
  return attempt.status === "terminated"
}

export function useExamLoader(
  examId: string,
  router: ReturnType<typeof useRouter>,
): UseExamLoaderReturn {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [examTerminated, setExamTerminated] = useState(false)

  const loadedRef = useRef(false)

  // ── Main Load ──────────────────────────────────────────────────────────

  const loadExam = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    setLoadError(null)

    try {
      // 1. Auth
      let session: { userId: string; email: string }
      try {
        session = await requireSession()
      } catch {
        router.push("/portal")
        return
      }

      // 2. Profile
      const userProfile = await fetchProfile(session.userId)
      if (userProfile) setProfile(userProfile)

      // 3. Exam
      let examData: Exam
      try {
        examData = await fetchExam(examId)
      } catch {
        setLoadError("Exam not found")
        return
      }
      setExam(examData)

      // 4. Normalize questions
      const { questions, objectiveCount, theoryCount } =
        normalizeExamQuestions(examData)
      setAllQuestions(questions)

      const objectiveMax = objectiveCount || examData.objective_max || 20
      const theoryMax = theoryCount > 0 ? (examData.theory_max || 40) : 0
      const actualTotalMarks = objectiveMax + theoryMax

      // 5. Attempts
      const allAttempts = await fetchAttempts(
        examId,
        userProfile?.id ?? session.userId,
      )
      const completed = getCompletedAttempts(allAttempts)
      const active = getActiveAttempt(allAttempts)
      const completedCount = completed.length

      // ✅ PRIORITY 1: If ANY attempt is currently `in_progress`, prefer
      // resuming over showing a completed/terminated view. This is the
      // critical fix — an admin grant flips status back to `in_progress`,
      // and we MUST resume it even if a previous attempt was auto-submitted.
      if (active) {
        const latest = active
        setAttemptsUsed(completedCount)

        // ✅ Genuine security termination always wins
        if (isSecurityTerminated(latest)) {
          setHasCompletedAttempt(true)
          setExamTerminated(true)
          setExamResult(
            buildExamResult({
              attempt: latest,
              exam: examData,
              objectiveMax,
              theoryMax,
              actualTotalMarks,
              completedCount,
            }),
          )
          return
        }

        // Live attempt → resume flow
        const newUnloadCount = (latest.unload_count || 0) + 1

        if (newUnloadCount >= MAX_UNLOADS) {
          const result = await autoSubmitOnUnloadExceeded({
            attemptId: latest.id,
            answers: latest.answers || {},
            allQuestions: questions,
            exam: examData,
            objectiveMax,
            theoryMax,
            actualTotalMarks,
            unloadCount: newUnloadCount,
            calcScore: calculateScore,
          })
          setHasCompletedAttempt(true)
          setAttemptsUsed(completedCount + 1)
          setExamResult(result)
          return
        }

        const originalStartedAt = latest.started_at
        if (!originalStartedAt) {
          toast.error(
            "Exam data corrupted — missing start time. Contact support.",
          )
          return
        }

        await incrementUnloadCount(latest.id, newUnloadCount)

        setResumeData({
          attemptId: latest.id,
          answers: latest.answers || {},
          started_at: originalStartedAt,
          duration: Number(examData.duration) || 30,
          tabSwitches: latest.tab_switches || 0,
          fullscreenExits: latest.fullscreen_exits || 0,
          unloadCount: newUnloadCount,
          currentIndex: latest.current_index || 0,
          flaggedQuestions: latest.flagged_questions || [],
        })
        setShowResumeDialog(true)
        return
      }

      // Case A: Max attempts reached (no active attempt)
      if (completedCount >= (examData.max_attempts || 1)) {
        setHasCompletedAttempt(true)
        setAttemptsUsed(completedCount)
        const latest = completed[0]
        if (isSecurityTerminated(latest)) setExamTerminated(true)
        setExamResult(
          buildExamResult({
            attempt: latest,
            exam: examData,
            objectiveMax,
            theoryMax,
            actualTotalMarks,
            completedCount,
          }),
        )
        return
      }

      // Case B: Existing attempts, none in-progress
      if (allAttempts.length > 0) {
        const latest = allAttempts[0]
        setAttemptsUsed(completedCount)

        // ✅ Only genuine `status === "terminated"` sets the flag.
        // Auto-submitted attempts are NOT terminations.
        if (isSecurityTerminated(latest)) {
          setHasCompletedAttempt(true)
          setExamTerminated(true)
          setExamResult(
            buildExamResult({
              attempt: latest,
              exam: examData,
              objectiveMax,
              theoryMax,
              actualTotalMarks,
              completedCount,
            }),
          )
          return
        }

        if (
          ["completed", "pending_theory", "graded"].includes(
            String(latest.status),
          )
        ) {
          setHasCompletedAttempt(true)
          setExamResult(
            buildExamResult({
              attempt: latest,
              exam: examData,
              objectiveMax,
              theoryMax,
              actualTotalMarks,
              completedCount,
            }),
          )
          return
        }
      }

      // Case C: No attempts
      setAttemptsUsed(0)
      setHasCompletedAttempt(false)
      setAttemptId(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load exam"
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => {
    loadExam()
  }, [loadExam])

  // ── Start New Attempt ──────────────────────────────────────────────────

  const startNewAttempt = useCallback(async (): Promise<StartAttemptResult | null> => {
    try {
      const session = await requireSession()

      const existing = await findInProgressAttempt(examId, session.userId)
      if (existing?.started_at) {
        // Clear any stale terminated flag when actually resuming
        setExamTerminated(false)
        return {
          attemptId: existing.id,
          isResuming: true,
          attemptNumber: existing.attempt_number,
          started_at: existing.started_at,
        }
      }

      if (!exam || !profile) {
        toast.error("Exam data not loaded")
        return null
      }

      const allAttempts = await fetchAttempts(examId, session.userId)
      const completedCount = getCompletedAttempts(allAttempts).length
      const attemptNumber = completedCount + 1

      const objCount = allQuestions.filter((q) => q.type !== "theory").length
      const theoCount = allQuestions.filter((q) => q.type === "theory").length
      const objectiveMax = objCount || exam.objective_max || 20
      const theoryMax = theoCount > 0 ? (exam.theory_max || 40) : 0
      const actualTotalMarks = objectiveMax + theoryMax

      setExamTerminated(false)
      return await createAttempt({
        examId,
        studentId: session.userId,
        studentName:
          profile.full_name || session.email.split("@")[0] || "Student",
        studentEmail: session.email,
        studentClass: (profile.class as string) || "",
        attemptNumber,
        exam,
        objectiveMax,
        theoryMax,
        actualTotalMarks,
      })
    } catch {
      toast.error("Failed to start exam")
      return null
    }
  }, [examId, exam, profile, allQuestions])

  // ── Resume ─────────────────────────────────────────────────────────────

  const handleResumeExam = useCallback(async (): Promise<ResumeData | null> => {
    if (!resumeData) return null
    if (examTerminated) {
      toast.error("This exam was terminated due to security violations")
      router.push("/student")
      return null
    }
    // ✅ Clear any stale flags while resuming
    setExamTerminated(false)
    return resumeData
  }, [resumeData, examTerminated, router])

  return {
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
  }
}