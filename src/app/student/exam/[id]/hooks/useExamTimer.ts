// src/app/student/exam/[id]/hooks/useExamTimer.ts

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ExamTimerOptions {
  examStarted: boolean
  durationMinutes: number
  examEndedRef: React.MutableRefObject<boolean>
  onTimeUp: () => void
  onTimeWarning?: (timeLeft: number) => void
  autoSubmit?: boolean
  startTime?: number
  examId?: string
  attemptId?: string
  onTimeSync?: (remaining: number) => void
}

interface TimeComponents {
  hours: number
  minutes: number
  seconds: number
}

export function useExamTimer({
  examStarted,
  durationMinutes,
  examEndedRef,
  onTimeUp,
  onTimeWarning,
  autoSubmit = true,
  startTime,
  examId,
  attemptId,
  onTimeSync,
}: ExamTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  const onTimeWarningRef = useRef(onTimeWarning)
  const startTimeRef = useRef<number | null>(null)
  const hasAutoSubmittedRef = useRef(false)
  const warningTriggeredRef = useRef(false)

  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  useEffect(() => {
    onTimeWarningRef.current = onTimeWarning
  }, [onTimeWarning])

  // Calculate time left based on start time or duration
  const calculateTimeLeft = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const totalSeconds = durationMinutes * 60
      const remaining = Math.max(0, totalSeconds - elapsed)
      return remaining
    }
    return durationMinutes * 60
  }, [durationMinutes])

  // ✅ FIXED: Simplified sync with server - only check submitted_at
  const syncTimeWithServer = useCallback(async () => {
    if (!attemptId || !examId || !examStarted || examEndedRef.current) return

    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('submitted_at, status')
        .eq('id', attemptId)
        .single()

      if (error) {
        console.error('Failed to sync time with server:', error)
        return
      }

      // ✅ If already submitted, stop timer
      if (data?.submitted_at || ['pending_theory', 'graded', 'completed', 'terminated'].includes(data?.status)) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        examEndedRef.current = true
        onTimeUpRef.current()
        return
      }
    } catch (error) {
      console.error('Time sync error:', error)
    }
  }, [attemptId, examId, examStarted, examEndedRef])

  // Initialize timer when exam starts
  useEffect(() => {
    if (!examStarted || examEndedRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Reset auto-submit flag
    hasAutoSubmittedRef.current = false
    warningTriggeredRef.current = false

    // Initialize start time
    if (startTime) {
      startTimeRef.current = startTime
    } else if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    // Set initial time left
    const initialTime = calculateTimeLeft()
    setTimeLeft(initialTime)

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Start timer
    timerRef.current = setInterval(() => {
      // ✅ Check if exam ended
      if (examEndedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        return
      }

      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      // Check for time warning at 5 minutes
      if (remaining <= 300 && remaining > 0 && !warningTriggeredRef.current) {
        warningTriggeredRef.current = true
        
        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        const timeString = minutes > 0 
          ? `${minutes} minute${minutes > 1 ? 's' : ''}${seconds > 0 ? ` and ${seconds} second${seconds > 1 ? 's' : ''}` : ''}`
          : `${seconds} second${seconds > 1 ? 's' : ''}`
        
        toast.warning(`⚠️ Time is running out! ${timeString} remaining`)
        
        if (onTimeWarningRef.current) {
          onTimeWarningRef.current(remaining)
        }
      }

      // Check if time is up
      if (remaining <= 0 && !hasAutoSubmittedRef.current && !examEndedRef.current) {
        hasAutoSubmittedRef.current = true
        setIsTimeUp(true)
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        
        if (autoSubmit) {
          toast.error("⏰ Time's up! Auto-submitting your exam...")
          setTimeout(() => {
            onTimeUpRef.current()
          }, 1500)
        } else {
          onTimeUpRef.current()
        }
      }
    }, 1000)

    // ✅ FIXED: Sync with server every 60 seconds (check if submitted)
    const syncInterval = setInterval(() => {
      if (!examEndedRef.current) {
        syncTimeWithServer()
      }
    }, 60000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      clearInterval(syncInterval)
    }
  }, [examStarted, examEndedRef, durationMinutes, startTime, calculateTimeLeft, autoSubmit, syncTimeWithServer])

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 0) seconds = 0
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get time components
  const getTimeComponents = useCallback((seconds: number): TimeComponents => {
    if (seconds < 0) seconds = 0
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return { hours, minutes, seconds: secs }
  }, [])

  // Check if time is running low (less than 5 minutes)
  const isTimeRunningLow = timeLeft > 0 && timeLeft <= 300

  // Get progress percentage (0-100)
  const getProgress = useCallback(() => {
    const totalSeconds = durationMinutes * 60
    if (totalSeconds === 0) return 0
    return Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))
  }, [timeLeft, durationMinutes])

  // Get time status color
  const getTimeColor = useCallback(() => {
    if (timeLeft <= 0) return 'text-red-500'
    if (timeLeft <= 300) return 'text-amber-500'
    if (timeLeft <= 600) return 'text-yellow-500'
    return 'text-emerald-500'
  }, [timeLeft])

  // Get time status label
  const getTimeStatus = useCallback(() => {
    if (timeLeft <= 0) return 'Time Expired'
    if (timeLeft <= 300) return 'Critical'
    if (timeLeft <= 600) return 'Running Low'
    return 'Good'
  }, [timeLeft])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Reset timer
  const resetTimer = useCallback((newDuration?: number, newStartTime?: number) => {
    if (newDuration) {
      // Update duration if needed
    }
    if (newStartTime) {
      startTimeRef.current = newStartTime
    } else {
      startTimeRef.current = Date.now()
    }
    const initialTime = calculateTimeLeft()
    setTimeLeft(initialTime)
    setIsTimeUp(false)
    hasAutoSubmittedRef.current = false
    warningTriggeredRef.current = false
  }, [calculateTimeLeft])

  // ✅ FIXED: Extend time - only updates local state, no DB columns
  const extendTime = useCallback((additionalMinutes: number) => {
    const additionalSeconds = additionalMinutes * 60
    setTimeLeft(prev => prev + additionalSeconds)
    toast.success(`⏰ Time extended by ${additionalMinutes} minute${additionalMinutes > 1 ? 's' : ''}`)
  }, [])

  return {
    timeLeft,
    setTimeLeft,
    isTimeUp,
    formatTime,
    getTimeComponents,
    isTimeRunningLow,
    getProgress,
    getTimeColor,
    getTimeStatus,
    resetTimer,
    extendTime,
    cleanup,
    syncTimeWithServer,
    totalSeconds: durationMinutes * 60,
    isTimeExpired: timeLeft <= 0,
  }
}