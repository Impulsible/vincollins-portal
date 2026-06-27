"use client"

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useAutoSave(
  attemptId: string | null,
  examStarted: boolean,
  answers: Record<string, string>,
  allQuestions: any[],
  examEndedRef: React.MutableRefObject<boolean>
) {
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousAnswersRef = useRef<string>('')

  useEffect(() => {
    if (!attemptId || !examStarted || examEndedRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const answersString = JSON.stringify(answers)
      if (answersString === previousAnswersRef.current) return
      previousAnswersRef.current = answersString

      setAutoSaving(true)
      try {
        const objectiveAnswers: Record<string, string> = {}
        const theoryAnswers: Record<string, string> = {}
        
        allQuestions.forEach((q: any) => {
          if (q.type === 'theory') {
            theoryAnswers[q.id] = answers[q.id] || ''
          } else {
            objectiveAnswers[q.id] = answers[q.id] || ''
          }
        })

        const result = calculateObjectiveScore(allQuestions, answers)

        const updateData: any = {
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          last_auto_save: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (result && result.total > 0) {
          updateData.objective_score = result.score
          updateData.objective_total = result.total
          updateData.correct_count = result.correct
          updateData.incorrect_count = result.incorrect
          updateData.unanswered_count = result.unanswered
          updateData.percentage = Math.round((result.score / result.total) * 100)
        }

        const { error } = await supabase
          .from('exam_attempts')
          .update(updateData)
          .eq('id', attemptId)

        if (error) {
          console.error('Auto-save error:', error)
        } else {
          setLastSaved(new Date())
        }
      } catch (error) {
        console.error('Auto-save error:', error)
      } finally {
        setAutoSaving(false)
      }
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [attemptId, examStarted, answers, allQuestions, examEndedRef])

  return { autoSaving, lastSaved }
}

function calculateObjectiveScore(questions: any[], answers: Record<string, string>) {
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

  return { score, total, correct, incorrect, unanswered }
}