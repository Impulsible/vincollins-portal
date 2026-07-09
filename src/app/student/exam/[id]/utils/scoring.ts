// app/student/exam/[id]/utils/scoring.ts

import type { Question, TheorySubQuestion } from '../types'

// ============================================
// ✅ FORMAT TIME
// ============================================
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// ============================================
// ✅ FORMAT POINTS
// ============================================
export function formatPoints(points: number): string {
  if (points === 0) return '0 pts'
  if (points === 1) return '1 pt'
  return `${points} pts`
}

// ============================================
// ✅ Calculate score for a single question
// ============================================
export function calculateQuestionScore(
  question: Question,
  answer: string | undefined
): { score: number; isCorrect: boolean | null; isAnswered: boolean } {
  const studentAnswer = (answer || '').trim()
  
  // Not answered
  if (!studentAnswer) {
    return { score: 0, isCorrect: null, isAnswered: false }
  }
  
  // Theory questions
  if (question.type === 'theory') {
    const marks = Number(question.marks || question.points || 10)
    return { score: marks, isCorrect: true, isAnswered: true }
  }
  
  // Objective questions
  const correctAnswer = String(question.correct_answer || '').trim()
  const isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
  const marks = Number(question.marks || question.points || 0.5)
  
  return {
    score: isCorrect ? marks : 0,
    isCorrect,
    isAnswered: true
  }
}

// ============================================
// ✅ Calculate objective score
// ============================================
export function calculateObjectiveScore(
  questions: Question[],
  answers: Record<string, string>
): { score: number; total: number; correct: number; incorrect: number; unanswered: number } {
  const safeQuestions = questions || []
  const safeAnswers = answers || {}
  
  const objectiveQuestions = safeQuestions.filter((q: Question) => q.type !== 'theory')
  
  let score = 0
  let total = 0
  let correct = 0
  let incorrect = 0
  let unanswered = 0

  objectiveQuestions.forEach((q: Question) => {
    const pts = Number(q.marks || q.points || 0.5)
    total += pts
    
    const answer = safeAnswers[q.id]
    const studentAnswer = (answer || '').trim()
    const correctAnswer = String(q.correct_answer || '').trim()

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
  })

  return { score, total, correct, incorrect, unanswered }
}

// ============================================
// ✅ Calculate theory score (including sub-questions)
// ============================================
export function calculateTheoryScore(
  questions: Question[],
  answers: Record<string, string>
): { score: number; total: number; answered: number } {
  const safeQuestions = questions || []
  const safeAnswers = answers || {}
  
  const theoryQuestions = safeQuestions.filter((q: Question) => q.type === 'theory')
  
  let score = 0
  let total = 0
  let answered = 0

  theoryQuestions.forEach((q: Question) => {
    // Check if the main question has sub-questions
    if (q.sub_questions && q.sub_questions.length > 0) {
      q.sub_questions.forEach((subQ: TheorySubQuestion) => {
        const subMarks = subQ.marks || 0
        total += subMarks
        
        const answer = safeAnswers[`${q.id}_${subQ.id || subQ.text}`] || safeAnswers[q.id]
        if (answer?.trim()) {
          score += subMarks
          answered++
        }
      })
    } else {
      const pts = Number(q.marks || q.points || 10)
      total += pts
      
      const answer = safeAnswers[q.id]
      if (answer?.trim()) {
        score += pts
        answered++
      }
    }
  })

  return { score, total, answered }
}

// ============================================
// ✅ Calculate total score (objective + theory)
// ============================================
export function calculateTotalScore(
  questions: Question[],
  answers: Record<string, string>
): {
  objective: { score: number; total: number; correct: number; incorrect: number; unanswered: number }
  theory: { score: number; total: number; answered: number }
  totalScore: number
  totalMarks: number
  percentage: number
} {
  const objective = calculateObjectiveScore(questions, answers)
  const theory = calculateTheoryScore(questions, answers)
  
  const totalScore = objective.score + theory.score
  const totalMarks = objective.total + theory.total
  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0

  return {
    objective,
    theory,
    totalScore,
    totalMarks,
    percentage
  }
}

// ============================================
// ✅ Legacy: calculateScore (backward compatibility)
// ============================================
export function calculateScore(questions: Question[], answers: Record<string, string>) {
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

// ============================================
// ✅ Calculate theory total marks
// ============================================
export function calculateTheoryTotal(questions: Question[]): number {
  const safeQuestions = questions || []
  const theoryQuestions = safeQuestions.filter((q: Question) => q.type === 'theory')
  
  let total = 0
  theoryQuestions.forEach((q: Question) => {
    if (q.sub_questions && q.sub_questions.length > 0) {
      q.sub_questions.forEach((subQ: TheorySubQuestion) => {
        total += subQ.marks || 0
      })
    } else {
      total += Number(q.marks || q.points || 10)
    }
  })
  return total
}

// ============================================
// ✅ Get grade based on percentage
// ============================================
export function getGrade(percentage: number, passingThreshold: number = 50): string {
  const safePercentage = Math.max(0, Math.min(100, percentage))
  
  if (safePercentage >= 80) return 'A'
  if (safePercentage >= 70) return 'B'
  if (safePercentage >= 60) return 'C'
  if (safePercentage >= passingThreshold) return 'P'
  return 'F'
}

// ============================================
// ✅ Get WAEC grade based on percentage
// ============================================
export function getWAECGrade(percentage: number): string {
  const safePercentage = Math.max(0, Math.min(100, percentage))
  
  if (safePercentage >= 75) return 'A1'
  if (safePercentage >= 70) return 'B2'
  if (safePercentage >= 65) return 'B3'
  if (safePercentage >= 60) return 'C4'
  if (safePercentage >= 55) return 'C5'
  if (safePercentage >= 50) return 'C6'
  if (safePercentage >= 45) return 'D7'
  if (safePercentage >= 40) return 'E8'
  return 'F9'
}

// ============================================
// ✅ Get grade color
// ============================================
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'B': 'text-blue-600 bg-blue-50 border-blue-200',
    'C': 'text-amber-600 bg-amber-50 border-amber-200',
    'P': 'text-purple-600 bg-purple-50 border-purple-200',
    'F': 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[grade] || 'text-gray-600 bg-gray-50 border-gray-200'
}

// ============================================
// ✅ Get WAEC grade color
// ============================================
export function getWAECGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A1': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'B2': 'bg-blue-100 text-blue-700 border-blue-300',
    'B3': 'bg-blue-50 text-blue-600 border-blue-200',
    'C4': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    'C5': 'bg-cyan-50 text-cyan-600 border-cyan-200',
    'C6': 'bg-cyan-50 text-cyan-600 border-cyan-200',
    'D7': 'bg-amber-100 text-amber-700 border-amber-300',
    'E8': 'bg-amber-50 text-amber-600 border-amber-200',
    'F9': 'bg-red-100 text-red-700 border-red-300',
  }
  return colors[grade] || 'bg-gray-100 text-gray-600 border-gray-300'
}

// ============================================
// ✅ Get grade remark
// ============================================
export function getGradeRemark(grade: string): string {
  const remarks: Record<string, string> = {
    'A1': 'Excellent',
    'B2': 'Very Good',
    'B3': 'Good',
    'C4': 'Credit',
    'C5': 'Credit',
    'C6': 'Credit',
    'D7': 'Pass',
    'E8': 'Pass',
    'F9': 'Fail',
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'P': 'Pass',
    'F': 'Fail',
  }
  return remarks[grade] || 'N/A'
}

// ============================================
// ✅ Check if student passed
// ============================================
export function isPassed(percentage: number, passingThreshold: number = 50): boolean {
  return percentage >= passingThreshold
}

// ============================================
// ✅ Get progress percentage
// ============================================
export function getProgressPercentage(answered: number, total: number): number {
  if (total <= 0) return 0
  if (answered <= 0) return 0
  if (answered >= total) return 100
  return Math.round((answered / total) * 100)
}

// ============================================
// ✅ Count answered questions
// ============================================
export function countAnsweredQuestions(
  questions: Question[],
  answers: Record<string, string>
): { answered: number; total: number; percentage: number } {
  const safeQuestions = questions || []
  const safeAnswers = answers || {}
  
  let answered = 0
  const total = safeQuestions.length
  
  safeQuestions.forEach((q: Question) => {
    const answer = safeAnswers[q.id]
    if (answer?.trim()) {
      answered++
    }
  })
  
  return {
    answered,
    total,
    percentage: getProgressPercentage(answered, total)
  }
}

// ============================================
// ✅ Get unanswered questions
// ============================================
export function getUnansweredQuestions(
  questions: Question[],
  answers: Record<string, string>
): Question[] {
  const safeQuestions = questions || []
  const safeAnswers = answers || {}
  
  return safeQuestions.filter((q: Question) => {
    const answer = safeAnswers[q.id]
    return !answer?.trim()
  })
}