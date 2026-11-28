// src/app/student/exam/[id]/hooks/useAutoSave.ts

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

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

  // Separate objective choices from theory answers
  const partitionAnswers = useCallback((currentAnswers: Record<string, string>) => {
    const objectiveAnswers: Record<string, string> = {}
    const theoryAnswers: Record<string, string> = {}

    questions.forEach((q) => {
      const ans = currentAnswers[q.id] || ""
      if (q.type === "theory") {
        theoryAnswers[q.id] = ans
      } else {
        objectiveAnswers[q.id] = ans
      }
    })

    return { objectiveAnswers, theoryAnswers }
  }, [questions])

  // Single-query write (0-Egress, No double-read)
  const saveAnswers = useCallback(async (force = false) => {
    if (!attemptId || !isActive || examEndedRef.current) return

    const answersStr = JSON.stringify(answers)
    if (!force && answersStr === lastAnswersRef.current) return
    if (autoSaving && !force) return

    setAutoSaving(true)

    try {
      const { objectiveAnswers, theoryAnswers } = partitionAnswers(answers)
      const supabase = createClient()

      // Single fast UPDATE: updates only answers payload, returns 0 bytes of egress
      const { error } = await supabase
        .from("exam_attempts")
        .update({
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          updated_at: new Date().toISOString(),
        })
        .eq("id", attemptId)
        .is("submitted_at", null) // Atomic: only updates if attempt is NOT already submitted

      if (error) {
        pendingSaveRef.current = true
        return
      }

      lastAnswersRef.current = answersStr
      setLastSaved(new Date())
      pendingSaveRef.current = false
    } catch (error) {
      pendingSaveRef.current = true
    } finally {
      if (isMountedRef.current) {
        setAutoSaving(false)
      }
    }
  }, [attemptId, isActive, answers, autoSaving, examEndedRef, partitionAnswers])

  // Debounced auto-save (saves 2 seconds after user stops typing)
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

  // Fallback periodic auto-save (every 30 seconds if changes pending)
  useEffect(() => {
    if (!isActive || !attemptId || examEndedRef.current) return

    const intervalId = setInterval(() => {
      if (pendingSaveRef.current) {
        saveAnswers(true)
      }
    }, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [isActive, attemptId, interval, saveAnswers, examEndedRef])

  // Save on page unload / crash protection
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isActive && attemptId && !examEndedRef.current) {
        const answersStr = JSON.stringify(answers)
        if (answersStr !== lastAnswersRef.current) {
          navigator.sendBeacon(
            "/api/save-exam-progress",
            JSON.stringify({
              attemptId,
              answers: answers,
              timestamp: Date.now(),
            })
          )
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
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