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
  startTime?: number // Server-provided start time
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
  const [isWarningShown, setIsWarningShown] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  const onTimeWarningRef = useRef(onTimeWarning)
  const startTimeRef = useRef<number | null>(null)
  const hasAutoSubmittedRef = useRef(false)
  const warningTriggeredRef = useRef(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Sync time with server
  const syncTimeWithServer = useCallback(async () => {
    if (!attemptId || !examId || !examStarted) return

    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('started_at, duration_minutes, remaining_time, status')
        .eq('id', attemptId)
        .single()

      if (error) {
        console.error('Failed to sync time with server:', error)
        return
      }

      if (data) {
        const serverStartTime = new Date(data.started_at).getTime()
        const durationSeconds = data.duration_minutes * 60
        const elapsed = Math.floor((Date.now() - serverStartTime) / 1000)
        const remaining = Math.max(0, durationSeconds - elapsed)

        // Update local time if server time is different
        const difference = Math.abs(remaining - timeLeft)
        if (difference > 5) {
          setTimeLeft(remaining)
          if (onTimeSync) {
            onTimeSync(remaining)
          }
        }

        // Check if exam should be auto-submitted
        if (remaining <= 0 && data.status !== 'completed' && data.status !== 'graded') {
          if (!hasAutoSubmittedRef.current) {
            hasAutoSubmittedRef.current = true
            setIsTimeUp(true)
            toast.error("⏰ Time's up! Auto-submitting your exam...")
            setTimeout(() => {
              onTimeUpRef.current()
            }, 1500)
          }
        }

        // Update remaining time in database periodically
        if (remaining > 0 && remaining % 30 === 0) {
          await supabase
            .from('exam_attempts')
            .update({ remaining_time: remaining })
            .eq('id', attemptId)
        }
      }
    } catch (error) {
      console.error('Time sync error:', error)
    }
  }, [attemptId, examId, examStarted, timeLeft, onTimeSync])

  // Initialize timer when exam starts
  useEffect(() => {
    if (!examStarted || examEndedRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
      return
    }

    // Reset auto-submit flag
    hasAutoSubmittedRef.current = false
    warningTriggeredRef.current = false
    setIsWarningShown(false)

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
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      // Check for time warning at 5 minutes
      if (remaining <= 300 && remaining > 0 && !warningTriggeredRef.current) {
        warningTriggeredRef.current = true
        setIsWarningShown(true)
        
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
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        
        if (!hasAutoSubmittedRef.current && !examEndedRef.current) {
          hasAutoSubmittedRef.current = true
          setIsTimeUp(true)
          
          if (autoSubmit) {
            toast.error("⏰ Time's up! Auto-submitting your exam...")
            setTimeout(() => {
              onTimeUpRef.current()
            }, 1500)
          } else {
            onTimeUpRef.current()
          }
        }
      }
    }, 1000)

    // Start sync interval (every 30 seconds)
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }
    syncIntervalRef.current = setInterval(() => {
      if (!examEndedRef.current) {
        syncTimeWithServer()
      }
    }, 30000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
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
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Reset timer
  const resetTimer = useCallback((newDuration?: number, newStartTime?: number) => {
    if (newDuration) {
      // Update duration
    }
    if (newStartTime) {
      startTimeRef.current = newStartTime
    } else {
      startTimeRef.current = Date.now()
    }
    const initialTime = calculateTimeLeft()
    setTimeLeft(initialTime)
    setIsTimeUp(false)
    setIsWarningShown(false)
    hasAutoSubmittedRef.current = false
    warningTriggeredRef.current = false
  }, [calculateTimeLeft])

  // Extend time
  const extendTime = useCallback((additionalMinutes: number) => {
    const additionalSeconds = additionalMinutes * 60
    setTimeLeft(prev => prev + additionalSeconds)
    toast.success(`⏰ Time extended by ${additionalMinutes} minute${additionalMinutes > 1 ? 's' : ''}`)
    
    if (attemptId) {
      supabase
        .from('exam_attempts')
        .update({ 
          remaining_time: timeLeft + additionalSeconds,
          duration_minutes: durationMinutes + additionalMinutes
        })
        .eq('id', attemptId)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to update extended time:', error)
          }
        })
    }
  }, [attemptId, durationMinutes, timeLeft])

  return {
    timeLeft,
    setTimeLeft,
    isTimeUp,
    isWarningShown,
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