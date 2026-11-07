// src/app/student/exam/[id]/hooks/useExtraTimeSync.ts
"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
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
  pollIntervalMs = 15_000,
  onExtraTimeGranted,
}: UseExtraTimeSyncOptions): UseExtraTimeSyncReturn {
  const [extraMinutes, setExtraMinutes] = useState<number>(initialExtraMinutes)
  const lastAppliedRef = useRef<number>(initialExtraMinutes)
  const grantCallbackRef = useRef(onExtraTimeGranted)
  useEffect(() => { grantCallbackRef.current = onExtraTimeGranted }, [onExtraTimeGranted])

  useEffect(() => {
    if (initialExtraMinutes > lastAppliedRef.current) {
      lastAppliedRef.current = initialExtraMinutes
      setExtraMinutes(initialExtraMinutes)
    }
  }, [initialExtraMinutes])

  const applyNewTotal = (next: number, source: string) => {
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
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(`[useExtraTimeSync] applied +${delta}m via ${source}`)
    }
  }

  const refresh = async () => {
    if (!attemptId || !enabled) return
    const snap = await fetchAttemptExtraSnapshot(attemptId)
    applyNewTotal(snap.extraTimeMinutes, "manual-refresh")
  }

  // Realtime
  useEffect(() => {
    if (!attemptId || !enabled) return

    const channel = supabase
      .channel(`attempt-extra-${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "exam_attempts",
          filter: `id=eq.${attemptId}`,
        },
        (payload) => {
          const row = payload.new as { extra_time_minutes?: number } | null
          const next = Number(row?.extra_time_minutes)
          if (Number.isFinite(next)) {
            applyNewTotal(next, "realtime")
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, enabled])

  // Polling fallback
  useEffect(() => {
    if (!attemptId || !enabled) return
    const id = setInterval(() => {
      void (async () => {
        const snap = await fetchAttemptExtraSnapshot(attemptId)
        applyNewTotal(snap.extraTimeMinutes, "poll")
      })()
    }, pollIntervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, enabled, pollIntervalMs])

  // Visibility / focus refresh
  useEffect(() => {
    if (!attemptId || !enabled) return
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, enabled])

  return { extraMinutes, refresh }
}