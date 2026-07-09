// src/app/student/exam/[id]/hooks/useAutoSave.ts

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface UseAutoSaveProps {
  attemptId: string | undefined
  isActive: boolean
  answers: Record<string, string>
  questions: any[]
  examEndedRef: React.MutableRefObject<boolean>
  interval?: number
}

export function useAutoSave({
  attemptId,
  isActive,
  answers,
  questions,
  examEndedRef,
  interval = 30000,
}: UseAutoSaveProps) {
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSaveRef = useRef<boolean>(false)
  const lastAnswersRef = useRef<string>("")
  const isMountedRef = useRef(true)

  const calculateScores = useCallback((answers: Record<string, string>) => {
    let objectiveScore = 0
    let theoryScore = 0
    let correctCount = 0
    let incorrectCount = 0
    let unansweredCount = 0

    questions.forEach(q => {
      const answer = answers[q.id] || ''
      const isTheory = q.type === 'theory'
      
      if (isTheory) {
        if (answer && answer.trim()) {
          theoryScore += q.marks || q.points || 10
        }
      } else {
        const maxScore = q.marks || q.points || 0.5
        const correctAnswer = String(q.correct_answer || '').trim()
        const studentAnswer = answer.trim()
        
        if (studentAnswer) {
          if (studentAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            objectiveScore += maxScore
            correctCount++
          } else {
            incorrectCount++
          }
        } else {
          unansweredCount++
        }
      }
    })

    const totalScore = objectiveScore + theoryScore
    const totalMax = questions.reduce((sum, q) => sum + (q.marks || q.points || (q.type === 'theory' ? 10 : 0.5)), 0)
    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

    return {
      objectiveScore,
      theoryScore,
      totalScore,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalMax
    }
  }, [questions])

  // ✅ Check if attempt is already submitted
  const checkSubmitted = useCallback(async (): Promise<boolean> => {
    if (!attemptId) return true
    
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('submitted_at, status')
        .eq('id', attemptId)
        .single()
      
      if (error) {
        console.error('Failed to check submission status:', error)
        return false
      }
      
      if (data?.submitted_at) return true
      if (['pending_theory', 'graded', 'completed', 'terminated'].includes(data?.status)) return true
      
      return false
    } catch (error) {
      console.error('Error checking submission status:', error)
      return false
    }
  }, [attemptId])

  // ✅ Save answers with submission check
  const saveAnswers = useCallback(async (force = false) => {
    if (!attemptId || !isActive || examEndedRef.current) return
    
    // ✅ Check if already submitted
    const isSubmitted = await checkSubmitted()
    if (isSubmitted) {
      console.log('⛔ Attempt already submitted - skipping auto-save')
      return
    }
    
    const answersStr = JSON.stringify(answers)
    if (!force && answersStr === lastAnswersRef.current) return
    if (autoSaving && !force) return
    
    setAutoSaving(true)
    
    try {
      const objectiveAnswers: Record<string, string> = {}
      const theoryAnswers: Record<string, string> = {}
      
      questions.forEach(q => {
        const answer = answers[q.id] || ''
        if (q.type === 'theory') {
          theoryAnswers[q.id] = answer
        } else {
          objectiveAnswers[q.id] = answer
        }
      })
      
      const scores = calculateScores(answers)
      
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          objective_score: scores.objectiveScore,
          theory_score: scores.theoryScore,
          total_score: scores.totalScore,
          percentage: scores.percentage,
          correct_count: scores.correctCount,
          incorrect_count: scores.incorrectCount,
          unanswered_count: scores.unansweredCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', attemptId)
      
      if (error) {
        console.error('Auto-save error:', error)
        pendingSaveRef.current = true
        return
      }
      
      lastAnswersRef.current = answersStr
      setLastSaved(new Date())
      pendingSaveRef.current = false
      
    } catch (error) {
      console.error('Auto-save error:', error)
      pendingSaveRef.current = true
    } finally {
      if (isMountedRef.current) {
        setAutoSaving(false)
      }
    }
  }, [attemptId, isActive, answers, questions, autoSaving, examEndedRef, calculateScores, checkSubmitted])

  // Schedule auto-save
  useEffect(() => {
    if (!isActive || !attemptId || examEndedRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      return
    }
    
    const answersStr = JSON.stringify(answers)
    if (answersStr !== lastAnswersRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveAnswers()
      }, 2000)
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [answers, isActive, attemptId, saveAnswers, examEndedRef])

  // Periodic auto-save
  useEffect(() => {
    if (!isActive || !attemptId || examEndedRef.current) return
    
    const intervalId = setInterval(() => {
      if (pendingSaveRef.current) {
        saveAnswers(true)
      } else {
        saveAnswers()
      }
    }, interval)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [isActive, attemptId, interval, saveAnswers, examEndedRef])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isActive && attemptId && !examEndedRef.current) {
        const answersStr = JSON.stringify(answers)
        if (answersStr !== lastAnswersRef.current) {
          navigator.sendBeacon('/api/save-exam-progress', JSON.stringify({
            attemptId,
            answers: answers,
            timestamp: Date.now()
          }))
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isActive, attemptId, answers, examEndedRef])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [])

  const forceSave = useCallback(async () => {
    await saveAnswers(true)
  }, [saveAnswers])

  return {
    autoSaving,
    lastSaved,
    forceSave,
    hasPendingSave: pendingSaveRef.current,
  }
}