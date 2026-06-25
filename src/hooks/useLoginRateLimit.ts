// src/hooks/useLoginRateLimit.ts
'use client'

import { useState, useCallback, useRef } from 'react'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000  // 5 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000   // 15 minute window
const STORAGE_KEY = 'login_attempts'

interface AttemptRecord {
  attempts: number
  firstAttemptAt: number
  lockedUntil: number | null
}

function getRecord(): AttemptRecord {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { attempts: 0, firstAttemptAt: Date.now(), lockedUntil: null }
    return JSON.parse(raw) as AttemptRecord
  } catch {
    return { attempts: 0, firstAttemptAt: Date.now(), lockedUntil: null }
  }
}

function saveRecord(record: AttemptRecord) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {}
}

function clearRecord() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function useLoginRateLimit() {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isLocked, setIsLocked] = useState(() => {
    const record = getRecord()
    if (record.lockedUntil && record.lockedUntil > Date.now()) return true
    return false
  })
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const startCountdown = useCallback((until: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current)

    countdownRef.current = setInterval(() => {
      const secs = Math.ceil((until - Date.now()) / 1000)
      if (secs <= 0) {
        setIsLocked(false)
        setRemainingSeconds(0)
        clearRecord()
        if (countdownRef.current) clearInterval(countdownRef.current)
      } else {
        setRemainingSeconds(secs)
      }
    }, 1000)
  }, [])

  const checkAndRecord = useCallback(
    (success: boolean): { allowed: boolean; message?: string } => {
      const record = getRecord()
      const now = Date.now()

      // Already locked
      if (record.lockedUntil && record.lockedUntil > now) {
        const secs = Math.ceil((record.lockedUntil - now) / 1000)
        setIsLocked(true)
        setRemainingSeconds(secs)
        startCountdown(record.lockedUntil)
        return {
          allowed: false,
          message: `Too many failed attempts. Try again in ${Math.ceil(secs / 60)} minute${secs > 60 ? 's' : ''}.`,
        }
      }

      // Success — clear record
      if (success) {
        clearRecord()
        setIsLocked(false)
        setRemainingSeconds(0)
        return { allowed: true }
      }

      // Reset window if it's been more than 15 minutes
      const windowExpired = now - record.firstAttemptAt > ATTEMPT_WINDOW_MS
      const newAttempts = windowExpired ? 1 : record.attempts + 1
      const newFirstAttempt = windowExpired ? now : record.firstAttemptAt

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = now + LOCKOUT_DURATION_MS
        const updated: AttemptRecord = {
          attempts: newAttempts,
          firstAttemptAt: newFirstAttempt,
          lockedUntil,
        }
        saveRecord(updated)
        setIsLocked(true)
        startCountdown(lockedUntil)
        return {
          allowed: false,
          message: `Too many failed attempts. Account locked for 5 minutes.`,
        }
      }

      // Record the failed attempt
      saveRecord({ attempts: newAttempts, firstAttemptAt: newFirstAttempt, lockedUntil: null })
      const attemptsLeft = MAX_ATTEMPTS - newAttempts

      return {
        allowed: true,
        message:
          attemptsLeft <= 2
            ? `Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before lockout`
            : undefined,
      }
    },
    [startCountdown]
  )

  return { isLocked, remainingSeconds, checkAndRecord }
}