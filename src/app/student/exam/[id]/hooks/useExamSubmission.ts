// src/app/student/exam/[id]/hooks/useExamSubmission.ts
"use client"

import { useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  submitExam,
  checkAttemptAlreadySubmitted,
} from "../services/examSubmissionService"
import { EXAM_CONFIG } from "../constants"
import type { ExamAction } from "./useExamReducer"
import type { ExamResult, Question } from "../types"

interface UseExamSubmissionParams {
  attemptId: string | null
  examId: string
  studentId: string | undefined
  allQuestions: Question[]
  answers: Record<string, string>
  examDuration: number
  passingPercentage: number
  maxAttempts: number
  tabSwitches: number
  fullscreenExits: number
  theoryQuestionCount: number
  dispatch: React.Dispatch<ExamAction>
  setExamResult: (r: ExamResult) => void
  examEndedRef: React.MutableRefObject<boolean>
  stopTimer: () => void
}

export function useExamSubmission({
  attemptId,
  examId,
  studentId,
  allQuestions,
  answers,
  examDuration,
  passingPercentage,
  maxAttempts,
  tabSwitches,
  fullscreenExits,
  theoryQuestionCount,
  dispatch,
  setExamResult,
  examEndedRef,
  stopTimer,
}: UseExamSubmissionParams) {
  const isSubmittingRef = useRef(false)

  const handleSubmit = useCallback(
    async (isAuto = false, reason = "manual") => {
      // 1. Synchronous lock check: Prevents double-click submission races immediately
      if (isSubmittingRef.current || !attemptId || examEndedRef.current) return

      // Lock instantly before ANY async network calls
      isSubmittingRef.current = true
      examEndedRef.current = true
      stopTimer()
      dispatch({ type: "SUBMIT_BEGIN" })

      try {
        // 2. Safe fullscreen exit
        if (typeof document !== "undefined" && document.fullscreenElement) {
          try {
            await document.exitFullscreen()
          } catch {
            /* browser fullscreen exit ignore */
          }
        }

        // 3. Fast double-submission guard check
        const alreadySubmitted = await checkAttemptAlreadySubmitted(attemptId)
        if (alreadySubmitted) {
          toast.warning("This exam has already been submitted.")
          dispatch({ type: "END_EXAM" })
          return
        }

        // 4. Submit to database with 3-tier scoring logic
        const { success, result, error } = await submitExam({
          attemptId,
          examId,
          studentId,
          answers,
          allQuestions,
          examDuration,
          passingPercentage,
          maxAttempts,
          tabSwitches,
          fullscreenExits,
          isAuto,
          reason,
          theoryQuestionCount,
        })

        if (!success || !result) {
          toast.error(`Failed to submit exam: ${error ?? "Unknown error"}`)
          dispatch({ type: "SUBMIT_FAIL" })
          // Allow student to retry submission if an unexpected network error occurs
          isSubmittingRef.current = false
          examEndedRef.current = false
          return
        }

        // 5. Store completed result
        setExamResult(result)
        dispatch({ type: "SUBMIT_SUCCESS" })

        const hasTheory = result.status === "pending_theory"
        const msg = hasTheory
          ? `Theory submitted for grading. Objective score: ${result.percentage}%`
          : `Score: ${result.percentage}%`

        if (isAuto && reason === "Time expired") {
          toast.error(`⏰ Time's up! Exam auto-submitted. ${msg}`, {
            duration: EXAM_CONFIG.AUTO_SUBMIT_TOAST_DURATION_MS,
          })
        } else {
          toast.success(
            `${isAuto ? "Exam auto-submitted." : "Exam completed successfully!"} ${msg}`,
          )
        }
      } catch (err: any) {
        toast.error(`Submission error: ${err?.message || "Please check connection"}`)
        dispatch({ type: "SUBMIT_FAIL" })
        isSubmittingRef.current = false
        examEndedRef.current = false
      }
    },
    [
      attemptId,
      examId,
      studentId,
      answers,
      allQuestions,
      examDuration,
      passingPercentage,
      maxAttempts,
      tabSwitches,
      fullscreenExits,
      theoryQuestionCount,
      dispatch,
      setExamResult,
      examEndedRef,
      stopTimer,
    ],
  )

  return { handleSubmit, isSubmittingRef }
}