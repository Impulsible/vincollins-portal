// src/app/student/exam/utils/questionStatus.ts

import type { Question } from "../types"

export type QuestionStatus = "answered" | "flagged" | "current" | "not-answered"

/**
 * Get the status of a question for display purposes
 * Priority order: answered > flagged > current > not-answered
 */
export function getQuestionStatus(
  question: Question | null | undefined,
  index: number,
  currentIndex: number,
  answers: Record<string, string> | null | undefined,
  flaggedQuestions: Set<string> | null | undefined
): QuestionStatus {
  // ✅ Guard against null/undefined
  if (!question) {
    return "not-answered"
  }

  const safeAnswers = answers || {}
  const safeFlagged = flaggedQuestions || new Set()
  
  // ✅ Check if answered (highest priority)
  if (safeAnswers[question.id]?.trim()) {
    return "answered"
  }
  
  // ✅ Check if flagged
  if (safeFlagged.has(question.id)) {
    return "flagged"
  }
  
  // ✅ Check if current
  if (index === currentIndex) {
    return "current"
  }
  
  // ✅ Default
  return "not-answered"
}

/**
 * Count how many questions have been answered
 */
export function getAnsweredCount(answers: Record<string, string> | null | undefined): number {
  const safeAnswers = answers || {}
  return Object.keys(safeAnswers).filter(key => safeAnswers[key]?.trim()).length
}

/**
 * Calculate progress percentage
 */
export function getProgressPercentage(answered: number, total: number): number {
  // ✅ Guard against invalid values
  if (!total || total <= 0) return 0
  if (answered < 0) return 0
  if (answered >= total) return 100
  
  const percentage = (answered / total) * 100
  return Math.min(100, Math.max(0, percentage))
}

/**
 * Check if all required questions are answered
 */
export function isFullyAnswered(
  answers: Record<string, string>,
  totalQuestions: number,
  requiredQuestions?: number
): boolean {
  const answered = getAnsweredCount(answers)
  const required = requiredQuestions || totalQuestions
  return answered >= required
}

/**
 * Get unanswered question indices
 */
export function getUnansweredIndices(
  questions: Question[],
  answers: Record<string, string>
): number[] {
  const safeAnswers = answers || {}
  return questions
    .map((q, index) => (!safeAnswers[q.id]?.trim() ? index : -1))
    .filter(index => index !== -1)
}

/**
 * Get flagged question indices
 */
export function getFlaggedIndices(
  questions: Question[],
  flaggedQuestions: Set<string>
): number[] {
  const safeFlagged = flaggedQuestions || new Set()
  return questions
    .map((q, index) => (safeFlagged.has(q.id) ? index : -1))
    .filter(index => index !== -1)
}