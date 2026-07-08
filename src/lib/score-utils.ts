// lib/score-utils.ts

export interface ScoreCalculation {
  percentage: number
  totalScore: number
  totalMarks: number
  grade: string
  stage: 'objective' | 'theory' | 'ca'
}

export function calculateScore(
  objectiveScore: number,
  objectiveMax: number,
  theoryScore: number,
  theoryMax: number,
  ca1Score: number | null,
  ca2Score: number | null,
  caGrade?: string | null,
  caPercentage?: number | null
): ScoreCalculation {
  const hasCA = ca1Score !== null && ca2Score !== null
  const caTotal = (ca1Score || 0) + (ca2Score || 0)
  const hasTheory = theoryScore > 0
  const totalExamMax = 60 // Always 60
  const totalMax = 100 // Always 100

  let percentage: number
  let totalScore: number
  let totalMarks: number
  let stage: 'objective' | 'theory' | 'ca'
  let grade: string

  if (hasCA) {
    // Stage 3: Objective + Theory + CA = out of 100
    totalScore = caTotal + objectiveScore + theoryScore
    totalMarks = totalMax
    percentage = Math.round((totalScore / totalMarks) * 100)
    stage = 'ca'
    grade = caGrade || getWAECGrade(percentage)
  } else if (hasTheory) {
    // Stage 2: Objective + Theory = out of 60, scaled to 100
    const examTotal = objectiveScore + theoryScore
    totalScore = Math.round((examTotal / totalExamMax) * 100)
    totalMarks = totalMax
    percentage = totalScore
    stage = 'theory'
    grade = getWAECGrade(percentage)
  } else {
    // Stage 1: Only Objective = out of objectiveMax, scaled to 100
    totalScore = Math.round((objectiveScore / objectiveMax) * 100)
    totalMarks = totalMax
    percentage = totalScore
    stage = 'objective'
    grade = getWAECGrade(percentage)
  }

  // Cap at 100
  if (percentage > 100) percentage = 100

  return {
    percentage,
    totalScore,
    totalMarks,
    grade,
    stage
  }
}

function getWAECGrade(percentage: number): string {
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