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

  // Save answers to database
  const saveAnswers = useCallback(async (force = false) => {
    if (!attemptId || !isActive || examEndedRef.current) return
    
    // Skip if no changes and not forced
    const answersStr = JSON.stringify(answers)
    if (!force && answersStr === lastAnswersRef.current) return
    
    // Skip if already saving
    if (autoSaving && !force) return
    
    setAutoSaving(true)
    
    try {
      // Separate objective and theory answers
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
      
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          updated_at: new Date().toISOString()
        })
        .eq('id', attemptId)
      
      if (error) {
        console.error('Auto-save error:', error)
        // Store pending save
        pendingSaveRef.current = true
        return
      }
      
      // Update last saved
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
  }, [attemptId, isActive, answers, questions, autoSaving, examEndedRef])

  // Schedule auto-save
  useEffect(() => {
    if (!isActive || !attemptId || examEndedRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      return
    }
    
    // Save immediately when answers change
    const answersStr = JSON.stringify(answers)
    if (answersStr !== lastAnswersRef.current) {
      // Debounce save to avoid too many requests
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveAnswers()
      }, 2000) // 2 second debounce
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
        // Try to save synchronously
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

  // Cleanup
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

  // Force save (for manual triggers)
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