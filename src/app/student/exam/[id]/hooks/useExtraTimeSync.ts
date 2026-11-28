// src/app/student/exam/[id]/hooks/useExtraTimeSync.ts
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { fetchAttemptExtraSnapshot } from "../services/examSubmissionService"

interface UseExtraTimeSyncOptions {
  attemptId: string | undefined
  enabled: boolean
  examEndedRef: React.MutableRefObject<boolean>
  initialExtraMinutes: number
  pollIntervalMs?: number
  onExtraTimeGranted?: (newTotalMinutes: number, deltaMinutes: number) => void
}

export interface UseExtraTimeSyncReturn {
  extraMinutes: number
  refresh: () => Promise<void>
}

export function useExtraTimeSync({
  attemptId,
  enabled,
  examEndedRef,
  initialExtraMinutes,
  // Optimized: Poll once every 60 seconds (slashes 45,000 queries across 5 exams)
  pollIntervalMs = 60_000, 
  onExtraTimeGranted,
}: UseExtraTimeSyncOptions): UseExtraTimeSyncReturn {
  const [extraMinutes, setExtraMinutes] = useState<number>(initialExtraMinutes)
  const lastAppliedRef = useRef<number>(initialExtraMinutes)
  const grantCallbackRef = useRef(onExtraTimeGranted)
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)

  useEffect(() => {
    grantCallbackRef.current = onExtraTimeGranted
  }, [onExtraTimeGranted])

  useEffect(() => {
    if (initialExtraMinutes > lastAppliedRef.current) {
      lastAppliedRef.current = initialExtraMinutes
      setExtraMinutes(initialExtraMinutes)
    }
  }, [initialExtraMinutes])

  const applyNewTotal = useCallback((next: number, source: string) => {
    const prev = lastAppliedRef.current
    if (next === prev) return
    if (next < prev) {
      lastAppliedRef.current = next
      setExtraMinutes(next)
      return
    }
    const delta = next - prev
    lastAppliedRef.current = next
    setExtraMinutes(next)

    // Revive the "ended" flag so extensions can resurrect a dead timer
    if (examEndedRef.current) examEndedRef.current = false

    toast.success(
      `⏱️ ${delta} extra minute${delta !== 1 ? "s" : ""} granted! Your timer has been extended.`,
      { duration: 5000 },
    )
    grantCallbackRef.current?.(next, delta)
  }, [examEndedRef])

  const refresh = useCallback(async () => {
    if (!attemptId || !enabled || isFetchingRef.current) return
    
    // Throttle manual refreshes to at most once every 10 seconds
    const now = Date.now()
    if (now - lastFetchTimeRef.current < 10_000) return

    isFetchingRef.current = true
    lastFetchTimeRef.current = now

    try {
      const snap = await fetchAttemptExtraSnapshot(attemptId)
      if (snap && Number.isFinite(snap.extraTimeMinutes)) {
        applyNewTotal(snap.extraTimeMinutes, "refresh")
      }
    } catch {
      // Fail silently to avoid interrupting the student
    } finally {
      isFetchingRef.current = false
    }
  }, [attemptId, enabled, applyNewTotal])

  // Efficient Polling Fallback (No dead Realtime WebSockets)
  useEffect(() => {
    if (!attemptId || !enabled) return

    const intervalId = setInterval(() => {
      void refresh()
    }, pollIntervalMs)

    return () => clearInterval(intervalId)
  }, [attemptId, enabled, pollIntervalMs, refresh])

  // Visibility / Focus Refresh (debounced)
  useEffect(() => {
    if (!attemptId || !enabled) return

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh()
      }
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [attemptId, enabled, refresh])

  return { extraMinutes, refresh }
}