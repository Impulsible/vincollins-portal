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

const TERMINAL_STATUSES = new Set([
  "pending_theory",
  "graded",
  "completed",
  "terminated",
  "submitted",
])

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
  const totalSeconds = Math.max(0, Math.floor(durationMinutes * 60))

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (startTime != null && Number.isFinite(startTime)) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      return Math.max(0, totalSeconds - elapsed)
    }
    return 0
  })
  const [isTimeUp, setIsTimeUp] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const onTimeUpRef = useRef(onTimeUp)
  const onTimeWarningRef = useRef(onTimeWarning)
  const onTimeSyncRef = useRef(onTimeSync)

  const startTimeRef = useRef<number | null>(
    startTime != null && Number.isFinite(startTime) ? startTime : null
  )
  const extensionSecondsRef = useRef(0)
  const durationSecondsRef = useRef(totalSeconds)
  const prevDurationRef = useRef(totalSeconds)

  const hasAutoSubmittedRef = useRef(false)
  const warningTriggeredRef = useRef(false)
  const stoppedRef = useRef(false)

  useEffect(() => { onTimeUpRef.current = onTimeUp }, [onTimeUp])
  useEffect(() => { onTimeWarningRef.current = onTimeWarning }, [onTimeWarning])
  useEffect(() => { onTimeSyncRef.current = onTimeSync }, [onTimeSync])

  // ✅ Live-extension: react to `durationMinutes` prop changes
  useEffect(() => {
    const next = Math.max(0, Math.floor(durationMinutes * 60))
    const prev = prevDurationRef.current
    if (next > prev) {
      // Treat as an extension
      extensionSecondsRef.current += next - prev
      // If we had already auto-submitted / stopped, revive the timer
      if (hasAutoSubmittedRef.current) hasAutoSubmittedRef.current = false
      if (stoppedRef.current) stoppedRef.current = false
      warningTriggeredRef.current = false
    }
    prevDurationRef.current = next
    durationSecondsRef.current = next
  }, [durationMinutes])

  const calculateTimeLeft = useCallback(() => {
    const dur = durationSecondsRef.current + extensionSecondsRef.current
    if (startTimeRef.current == null) return dur
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
    return Math.max(0, dur - elapsed)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (syncIntervalRef.current) { clearInterval(syncIntervalRef.current); syncIntervalRef.current = null }
    stoppedRef.current = true
  }, [])

  const syncTimeWithServer = useCallback(async () => {
    if (!attemptId || !examStarted || examEndedRef.current || stoppedRef.current) return
    try {
      const { data, error } = await supabase
        .from("exam_attempts")
        .select("submitted_at, status")
        .eq("id", attemptId)
        .single()
      if (error) return
      const isFinal =
        !!data?.submitted_at ||
        (data?.status != null && TERMINAL_STATUSES.has(String(data.status)))
      if (isFinal) {
        stopTimer()
        examEndedRef.current = true
        setIsTimeUp(true)
        setTimeLeft(0)
      }
    } catch (e) {
      console.error("Time sync error:", e)
    }
  }, [attemptId, examStarted, examEndedRef, stopTimer])

  useEffect(() => {
    if (!examStarted || examEndedRef.current) { stopTimer(); return }

    // Wait for a real startTime
    if (startTime == null || !Number.isFinite(startTime)) {
      return
    }

    hasAutoSubmittedRef.current = false
    warningTriggeredRef.current = false
    stoppedRef.current = false
    startTimeRef.current = startTime

    const initial = calculateTimeLeft()
    setTimeLeft(initial)
    setIsTimeUp(initial <= 0)

    if (initial <= 0 && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true
      setIsTimeUp(true)
      examEndedRef.current = true
      if (autoSubmit) {
        toast.error("⏰ Time's up! Auto-submitting your exam...")
        setTimeout(() => onTimeUpRef.current(), 500)
      } else {
        onTimeUpRef.current()
      }
      return
    }

    stopTimer()
    stoppedRef.current = false

    timerRef.current = setInterval(() => {
      // If extension un-stopped us, resume; otherwise kill
      if (examEndedRef.current || stoppedRef.current) {
        if (stoppedRef.current && !examEndedRef.current) {
          stoppedRef.current = false
        } else {
          stopTimer()
          return
        }
      }

      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      onTimeSyncRef.current?.(remaining)

      // ✅ Revived after extension
      if (remaining > 0 && hasAutoSubmittedRef.current && !examEndedRef.current) {
        hasAutoSubmittedRef.current = false
        setIsTimeUp(false)
        warningTriggeredRef.current = false
      }

      if (remaining <= 300 && remaining > 0 && !warningTriggeredRef.current) {
        warningTriggeredRef.current = true
        const m = Math.floor(remaining / 60)
        const s = remaining % 60
        const str =
          m > 0
            ? `${m} minute${m > 1 ? "s" : ""}${s > 0 ? ` and ${s} second${s !== 1 ? "s" : ""}` : ""}`
            : `${s} second${s !== 1 ? "s" : ""}`
        toast.warning(`⚠️ Time is running out! ${str} remaining`)
        onTimeWarningRef.current?.(remaining)
      }

      if (remaining <= 0 && !hasAutoSubmittedRef.current && !examEndedRef.current) {
        hasAutoSubmittedRef.current = true
        setIsTimeUp(true)
        // ✅ Do NOT kill the interval — allow an extension to revive us
        if (autoSubmit) {
          toast.error("⏰ Time's up! Auto-submitting your exam...")
          setTimeout(() => onTimeUpRef.current(), 1200)
        } else {
          onTimeUpRef.current()
        }
      }
    }, 1000)

    syncIntervalRef.current = setInterval(() => {
      if (!examEndedRef.current && !stoppedRef.current) void syncTimeWithServer()
    }, 60_000)

    return () => { stopTimer() }
  }, [
    examStarted,
    startTime,
    autoSubmit,
    calculateTimeLeft,
    syncTimeWithServer,
    stopTimer,
    examEndedRef,
  ])

  const formatTime = useCallback((seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }, [])

  const getTimeComponents = useCallback((seconds: number): TimeComponents => {
    const s = Math.max(0, Math.floor(seconds))
    return { hours: Math.floor(s / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 }
  }, [])

  const isTimeRunningLow = timeLeft > 0 && timeLeft <= 300

  const getProgress = useCallback(() => {
    const total = durationSecondsRef.current + extensionSecondsRef.current
    if (total <= 0) return 0
    return Math.max(0, Math.min(100, (timeLeft / total) * 100))
  }, [timeLeft])

  const getTimeColor = useCallback(() => {
    if (timeLeft <= 0) return "text-red-500"
    if (timeLeft <= 300) return "text-amber-500"
    if (timeLeft <= 600) return "text-yellow-500"
    return "text-emerald-500"
  }, [timeLeft])

  const getTimeStatus = useCallback(() => {
    if (timeLeft <= 0) return "Time Expired"
    if (timeLeft <= 300) return "Critical"
    if (timeLeft <= 600) return "Running Low"
    return "Good"
  }, [timeLeft])

  const cleanup = useCallback(() => { stopTimer() }, [stopTimer])

  const resetTimer = useCallback(
    (newDurationMinutes?: number, newStartTime?: number) => {
      if (newDurationMinutes != null && Number.isFinite(newDurationMinutes)) {
        durationSecondsRef.current = Math.max(0, Math.floor(newDurationMinutes * 60))
        prevDurationRef.current = durationSecondsRef.current
      }
      extensionSecondsRef.current = 0
      startTimeRef.current =
        newStartTime != null && Number.isFinite(newStartTime) ? newStartTime : Date.now()
      hasAutoSubmittedRef.current = false
      warningTriggeredRef.current = false
      stoppedRef.current = false
      const next = calculateTimeLeft()
      setTimeLeft(next)
      setIsTimeUp(next <= 0)
    },
    [calculateTimeLeft]
  )

  const extendTime = useCallback(
    (additionalMinutes: number) => {
      if (!Number.isFinite(additionalMinutes) || additionalMinutes === 0) return
      extensionSecondsRef.current += Math.floor(additionalMinutes * 60)
      const next = calculateTimeLeft()
      setTimeLeft(next)
      if (next > 0) {
        setIsTimeUp(false)
        if (next > 300) warningTriggeredRef.current = false
        hasAutoSubmittedRef.current = false
      }
      toast.success(
        `⏰ Time extended by ${additionalMinutes} minute${additionalMinutes !== 1 ? "s" : ""}`
      )
    },
    [calculateTimeLeft]
  )

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
    totalSeconds: durationSecondsRef.current + extensionSecondsRef.current,
    isTimeExpired: timeLeft <= 0,
  }
}