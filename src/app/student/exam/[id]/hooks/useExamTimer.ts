"use client"

import { useState, useEffect, useRef } from "react"

export function useExamTimer(
  examStarted: boolean,
  durationMinutes: number,
  examEndedRef: React.MutableRefObject<boolean>,
  onTimeUp: () => void
) {
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  const initializedRef = useRef(false)

  // Keep callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  // Initialize and run timer when exam starts
  useEffect(() => {
    if (!examStarted || examEndedRef.current) return

    // Set initial time from teacher's duration
    if (!initializedRef.current) {
      initializedRef.current = true
      setTimeLeft(durationMinutes * 60)
    }

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up
          clearInterval(timerRef.current!)
          timerRef.current = null
          setTimeout(() => onTimeUpRef.current(), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [examStarted, durationMinutes, examEndedRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      initializedRef.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return { timeLeft, setTimeLeft }
}