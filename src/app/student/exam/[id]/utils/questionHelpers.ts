import type { Question } from "../types"

export function getQuestionStatus(
  question: Question,
  index: number,
  currentIndex: number,
  answers: Record<string, string>,
  flaggedQuestions: Set<string>
): "answered" | "flagged" | "current" | "not-answered" {
  if (answers[question.id]) return "answered"
  if (flaggedQuestions.has(question.id)) return "flagged"
  if (index === currentIndex) return "current"
  return "not-answered"
}

export function getAnsweredCount(answers: Record<string, string>): number {
  return Object.keys(answers).filter(key => answers[key]?.trim()).length
}

export function getProgressPercentage(answered: number, total: number): number {
  return total > 0 ? (answered / total) * 100 : 0
}