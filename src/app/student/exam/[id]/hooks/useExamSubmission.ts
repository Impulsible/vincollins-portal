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
      if (isSubmittingRef.current || !attemptId) return

      const alreadySubmitted = await checkAttemptAlreadySubmitted(attemptId)
      if (alreadySubmitted) {
        toast.warning("This exam has already been submitted.")
        examEndedRef.current = true
        dispatch({ type: "END_EXAM" })
        return
      }

      isSubmittingRef.current = true
      examEndedRef.current = true
      stopTimer()
      dispatch({ type: "SUBMIT_BEGIN" })

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      } catch {
        /* noop */
      }

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
        isSubmittingRef.current = false
        return
      }

      setExamResult(result)
      dispatch({ type: "SUBMIT_SUCCESS" })
      isSubmittingRef.current = false

      const hasTheory = result.status === "pending_theory"
      const msg = hasTheory
        ? `Theory pending grading. Score: ${result.percentage}%`
        : `Score: ${result.percentage}%`

      if (isAuto && reason === "Time expired") {
        toast.error(`⏰ Time's up! Exam auto-submitted. ${msg}`, {
          duration: EXAM_CONFIG.AUTO_SUBMIT_TOAST_DURATION_MS,
        })
      } else {
        toast.success(
          `${isAuto ? "Exam auto-submitted." : "Exam completed!"} ${msg}`,
        )
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