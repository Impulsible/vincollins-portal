// src/app/student/exam/[id]/utils/scoring.ts

import type { Question, TheorySubQuestion } from '../types'

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatPoints(points: number): string {
  if (points === 0) return '0 pts'
  if (points === 1) return '1 pt'
  return `${points} pts`
}

export function calculateQuestionScore(
  question: Question,
  answer: string | undefined,
): { score: number; isCorrect: boolean | null; isAnswered: boolean } {
  const studentAnswer = (answer ?? '').trim()

  if (!studentAnswer) {
    return { score: 0, isCorrect: null, isAnswered: false }
  }

  if (question.type === 'theory') {
    return { score: 0, isCorrect: null, isAnswered: true }
  }

  const correctAnswer = String(question.correct_answer ?? '').trim()
  const isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
  const marks = Number(question.marks ?? question.points ?? 1)

  return {
    score: isCorrect ? marks : 0,
    isCorrect,
    isAnswered: true,
  }
}

export function calculateObjectiveScore(
  questions: Question[],
  answers: Record<string, string>,
): {
  score: number
  total: number
  correct: number
  incorrect: number
  unanswered: number
} {
  const safeQuestions = questions ?? []
  const safeAnswers = answers ?? {}

  const objectiveQuestions = safeQuestions.filter((q) => q.type !== 'theory')

  let score = 0
  let total = 0
  let correct = 0
  let incorrect = 0
  let unanswered = 0

  for (const q of objectiveQuestions) {
    const pts = Number(q.marks ?? q.points ?? 1)
    total += pts

    const studentAnswer = (safeAnswers[q.id] ?? '').trim()
    const correctAnswer = String(q.correct_answer ?? '').trim()

    if (studentAnswer) {
      if (studentAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        score += pts
        correct++
      } else {
        incorrect++
      }
    } else {
      unanswered++
    }
  }

  return { score, total, correct, incorrect, unanswered }
}

export function calculateTheoryScore(
  questions: Question[],
  answers: Record<string, string>,
): { score: number; total: number; answered: number } {
  const safeQuestions = questions ?? []
  const safeAnswers = answers ?? {}

  const theoryQuestions = safeQuestions.filter((q) => q.type === 'theory')

  let score = 0
  let total = 0
  let answered = 0

  for (const q of theoryQuestions) {
    if (q.sub_questions && q.sub_questions.length > 0) {
      for (const subQ of q.sub_questions as TheorySubQuestion[]) {
        const subMarks = Number(subQ.marks ?? 1)
        total += subMarks

        const key = `${q.id}_${subQ.id ?? subQ.text}`
        const answer = safeAnswers[key] ?? safeAnswers[q.id]
        if (answer?.trim()) answered++
      }
    } else {
      const pts = Number(q.marks ?? q.points ?? 10)
      total += pts
      if (safeAnswers[q.id]?.trim()) answered++
    }
  }

  return { score, total, answered }
}

export function calculateTotalScore(
  questions: Question[],
  answers: Record<string, string>,
) {
  const objective = calculateObjectiveScore(questions, answers)
  const theory = calculateTheoryScore(questions, answers)

  const totalScore = objective.score
  const totalMarks = objective.total
  const percentage =
    totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0

  return { objective, theory, totalScore, totalMarks, percentage }
}

export function calculateScore(
  questions: Question[],
  answers: Record<string, string>,
) {
  const result = calculateTotalScore(questions, answers)
  return {
    score: result.totalScore,
    total: result.totalMarks,
    percentage: result.percentage,
    correct: result.objective.correct,
    incorrect: result.objective.incorrect,
    unanswered: result.objective.unanswered,
  }
}

export function getGrade(percentage: number, passingThreshold = 50): string {
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= passingThreshold) return 'P'
  return 'F'
}

export function getWAECGrade(percentage: number): string {
  if (percentage >= 75) return 'A1'
  if (percentage >= 70) return 'B2'
  if (percentage >= 65) return 'B3'
  if (percentage >= 60) return 'C4'
  if (percentage >= 55) return 'C5'
  if (percentage >= 50) return 'C6'
  if (percentage >= 45) return 'D7'
  if (percentage >= 40) return 'E8'
  return 'F9'
}