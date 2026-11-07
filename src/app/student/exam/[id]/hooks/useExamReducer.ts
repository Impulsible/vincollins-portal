// src/app/student/exam/[id]/hooks/useExamReducer.ts
"use client"

import { useReducer, useCallback } from "react"

export interface ExamState {
  currentIndex: number
  answers: Record<string, string>
  flaggedQuestions: Set<string>
  examStarted: boolean
  examEnded: boolean
  showInstructions: boolean
  showQuestionPalette: boolean
  showSubmitDialog: boolean
  showResultDialog: boolean
  startingExam: boolean
  isSubmitting: boolean
  isFullyRestored: boolean
}

export const INITIAL_EXAM_STATE: ExamState = {
  currentIndex: 0,
  answers: {} as Record<string, string>,
  flaggedQuestions: new Set<string>(),
  examStarted: false,
  examEnded: false,
  showInstructions: true,
  showQuestionPalette: false,
  showSubmitDialog: false,
  showResultDialog: false,
  startingExam: false,
  isSubmitting: false,
  isFullyRestored: false,
}

export type ExamAction =
  | { type: "SET_ANSWER"; questionId: string; value: string }
  | { type: "TOGGLE_FLAG"; questionId: string }
  | { type: "NAVIGATE"; direction: "prev" | "next"; maxIndex: number }
  | { type: "GO_TO_QUESTION"; index: number }
  | { type: "TOGGLE_PALETTE" }
  | { type: "START_EXAM_BEGIN" }
  | { type: "START_EXAM_FAIL" }
  | { type: "ENTER_EXAM"; answers: Record<string, string> }
  | { type: "SET_FULLY_RESTORED" }
  | { type: "SHOW_SUBMIT_DIALOG" }
  | { type: "HIDE_SUBMIT_DIALOG" }
  | { type: "SUBMIT_BEGIN" }
  | { type: "SUBMIT_FAIL" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SHOW_RESULT" }
  | { type: "HIDE_RESULT" }
  | { type: "END_EXAM" }

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      }

    case "TOGGLE_FLAG": {
      const next = new Set(state.flaggedQuestions)
      if (next.has(action.questionId)) next.delete(action.questionId)
      else next.add(action.questionId)
      return { ...state, flaggedQuestions: next }
    }

    case "NAVIGATE":
      return {
        ...state,
        currentIndex:
          action.direction === "prev"
            ? Math.max(0, state.currentIndex - 1)
            : Math.min(action.maxIndex, state.currentIndex + 1),
      }

    case "GO_TO_QUESTION":
      return {
        ...state,
        currentIndex: action.index,
        showQuestionPalette: false,
      }

    case "TOGGLE_PALETTE":
      return { ...state, showQuestionPalette: !state.showQuestionPalette }

    case "START_EXAM_BEGIN":
      return { ...state, startingExam: true }

    case "START_EXAM_FAIL":
      return { ...state, startingExam: false }

    case "ENTER_EXAM":
      return {
        ...state,
        answers: action.answers,
        examStarted: true,
        showInstructions: false,
        startingExam: false,
      }

    case "SET_FULLY_RESTORED":
      return { ...state, isFullyRestored: true }

    case "SHOW_SUBMIT_DIALOG":
      return { ...state, showSubmitDialog: true }

    case "HIDE_SUBMIT_DIALOG":
      return { ...state, showSubmitDialog: false }

    case "SUBMIT_BEGIN":
      return {
        ...state,
        examEnded: true,
        isSubmitting: true,
        showSubmitDialog: false,
      }

    case "SUBMIT_FAIL":
      return { ...state, isSubmitting: false }

    case "SUBMIT_SUCCESS":
      return {
        ...state,
        examStarted: false,
        isSubmitting: false,
        showResultDialog: true,
      }

    case "SHOW_RESULT":
      return { ...state, showResultDialog: true }

    case "HIDE_RESULT":
      return { ...state, showResultDialog: false }

    case "END_EXAM":
      return { ...state, examStarted: false, examEnded: true }

    default:
      return state
  }
}

export function useExamReducer() {
  const [state, dispatch] = useReducer(examReducer, INITIAL_EXAM_STATE)

  const updateAnswer = useCallback(
    (questionId: string, value: string) =>
      dispatch({ type: "SET_ANSWER", questionId, value }),
    [],
  )

  const toggleFlag = useCallback(
    (questionId: string) => dispatch({ type: "TOGGLE_FLAG", questionId }),
    [],
  )

  const navigate = useCallback(
    (direction: "prev" | "next", maxIndex: number) =>
      dispatch({ type: "NAVIGATE", direction, maxIndex }),
    [],
  )

  const goToQuestion = useCallback(
    (index: number) => dispatch({ type: "GO_TO_QUESTION", index }),
    [],
  )

  return { state, dispatch, updateAnswer, toggleFlag, navigate, goToQuestion }
}