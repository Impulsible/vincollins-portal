// components/exam/ExamGrading.tsx
'use client'

import { useMemo } from 'react'

interface GradingProps {
  questions: any[]
  answers: any
  submissionData: any
}

export function useExamGrading(submissionData: any) {
  const calculateScore = useMemo(() => {
    if (!submissionData) return { score: 0, total: 0, percentage: 0, passed: false }

    const { answers, option_mappings, mapped_correct_answers, question_order, questions, exam } = submissionData
    const { objective = {}, theory = {} } = answers || {}

    let totalScore = 0
    let totalPossible = 0

    // Grade objective questions
    Object.entries(objective).forEach(([questionId, studentAnswer]: [string, any]) => {
      const question = questions?.find((q: any) => q.id === questionId)
      if (!question) return

      totalPossible += question.points || 1

      // Check if we have a mapped correct answer (for shuffled options)
      const correctAnswer = mapped_correct_answers?.[questionId] || question.correct_answer
      
      if (studentAnswer === correctAnswer) {
        totalScore += question.points || 1
      }
    })

    // Add theory scores (manually graded later)
    const theoryPoints = Object.keys(theory).reduce((sum, qId) => {
      const question = questions?.find((q: any) => q.id === qId)
      return sum + (question?.points || 5)
    }, 0)
    totalPossible += theoryPoints

    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0
    const passed = percentage >= (exam?.pass_mark || 50)

    return { score: totalScore, total: totalPossible, percentage, passed }
  }, [submissionData])

  return calculateScore
}