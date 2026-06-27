// app/student/exam/[id]/utils/scoring.ts

import type { Question } from '../types'

// ============================================
// ✅ FORMAT TIME
// ============================================
export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================
// ✅ FORMAT POINTS - ADD THIS
// ============================================
export function formatPoints(points: number): string {
  return `${points} pt${points !== 1 ? 's' : ''}`
}

// ============================================
// ✅ Calculate objective score
// ============================================
export function calculateScore(questions: Question[], answers: Record<string, string>) {
  const objectiveQuestions = questions.filter((q: any) => q.type !== 'theory')
  let score = 0, total = 0, correct = 0, incorrect = 0, unanswered = 0

  objectiveQuestions.forEach((q: any) => {
    const pts = Number(q.marks || q.points || 1)
    total += pts
    const answer = answers[q.id]
    const correctAnswer = String(q.correct_answer || '').trim()

    if (answer?.trim()) {
      if (answer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
        score += pts
        correct++
      } else {
        incorrect++
      }
    } else {
      unanswered++
    }
  })

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  return { 
    score, 
    total, 
    percentage, 
    correct, 
    incorrect, 
    unanswered 
  }
}

// ============================================
// ✅ Calculate theory total marks
// ============================================
export function calculateTheoryTotal(questions: Question[]) {
  const theoryQuestions = questions.filter((q: any) => q.type === 'theory')
  let total = 0
  theoryQuestions.forEach((q: any) => {
    total += Number(q.marks || q.points || 1)
  })
  return total
}

// ============================================
// ✅ Get grade based on percentage
// ============================================
export function getGrade(percentage: number): string {
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'P'
  return 'F'
}

// ============================================
// ✅ Get WAEC grade based on percentage
// ============================================
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

// ============================================
// ✅ Get grade color
// ============================================
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-600'
    case 'B': return 'text-blue-600'
    case 'C': return 'text-amber-600'
    case 'P': return 'text-purple-500'
    case 'F': return 'text-red-600'
    default: return 'text-gray-600'
  }
}