'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Loader2,
  CheckCircle2,
  FileText,
  Sparkles,
  Heart,
  Clock,
} from 'lucide-react'

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface LoadingViewProps {
  studentName?: string
  /** Fires exactly after 2 minutes — parent transitions to InstructionsView */
  onComplete?: () => void
}

interface LoadingStep {
  label: string
  icon: React.ElementType
  duration: number
}

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const TOTAL_DURATION_MS = 120_000 // 2 minutes exactly

const LOADING_STEPS: LoadingStep[] = [
  { label: 'Verifying your identity', icon: Shield, duration: 4000 },
  { label: 'Loading exam details', icon: FileText, duration: 4000 },
  { label: 'Preparing your questions', icon: Sparkles, duration: 4000 },
  { label: 'Almost ready', icon: CheckCircle2, duration: 4000 },
]

const CALMING_MESSAGES = [
  "Take a slow, deep breath in… and let it out gently.",
  "It's completely normal to feel a little nervous right now.",
  "You've prepared for this. Trust the work you've put in.",
  "One question at a time. That's all you need to focus on.",
  "Your best effort is always enough. Always.",
  "Relax your shoulders. Unclench your jaw. You're safe here.",
  "This exam doesn't define you — it's just a checkpoint.",
  "Close your eyes for a moment. Breathe. Open them when you're ready.",
]

const CALMING_MESSAGE_INTERVAL = 4000

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

const getFirstName = (name?: string): string => {
  if (!name) return ''
  const trimmed = name.trim()
  return trimmed ? trimmed.split(/\s+/)[0] : ''
}

const formatCountdown = (ms: number): string => {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export default function LoadingView({ studentName, onComplete }: LoadingViewProps) {
  const [startTime] = useState(() => Date.now())
  const [remainingMs, setRemainingMs] = useState(TOTAL_DURATION_MS)
  const [stepIndex, setStepIndex] = useState(0)
  const [calmingMsgIndex, setCalmingMsgIndex] = useState(0)

  const isCalmingPhase = stepIndex >= LOADING_STEPS.length
  const isFinished = remainingMs <= 0
  const firstName = getFirstName(studentName)

  /* ── Master clock ── */
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, TOTAL_DURATION_MS - elapsed)
      setRemainingMs(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onComplete?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, onComplete])

  /* ── Step advancement ── */
  useEffect(() => {
    if (stepIndex >= LOADING_STEPS.length) return
    const timer = setTimeout(() => {
      setStepIndex((prev) => prev + 1)
    }, LOADING_STEPS[stepIndex].duration)
    return () => clearTimeout(timer)
  }, [stepIndex])

  /* ── Calming message rotation ── */
  useEffect(() => {
    if (!isCalmingPhase || isFinished) return
    const timer = setInterval(() => {
      setCalmingMsgIndex((prev) => (prev + 1) % CALMING_MESSAGES.length)
    }, CALMING_MESSAGE_INTERVAL)
    return () => clearInterval(timer)
  }, [isCalmingPhase, isFinished])

  /* ── Progress bar ── */
  const elapsedMs = TOTAL_DURATION_MS - remainingMs
  const LOADING_DURATION_MS = LOADING_STEPS.reduce((s, st) => s + st.duration, 0)

  const progress = useMemo(() => {
    if (isFinished) return 100
    if (elapsedMs < LOADING_DURATION_MS) {
      return (elapsedMs / LOADING_DURATION_MS) * 70
    }
    const calmingElapsed = elapsedMs - LOADING_DURATION_MS
    const calmingDuration = TOTAL_DURATION_MS - LOADING_DURATION_MS
    return 70 + (calmingElapsed / calmingDuration) * 25
  }, [elapsedMs, isFinished])

  const ActiveIcon = isCalmingPhase ? Heart : (LOADING_STEPS[stepIndex]?.icon ?? Heart)
  const activeLabel = isCalmingPhase
    ? 'Take a moment to breathe'
    : (LOADING_STEPS[stepIndex]?.label ?? '')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-violet-950/20 transition-colors duration-300"
      role="status"
      aria-live="polite"
      aria-busy={!isFinished}
    >
      {/* ── Background decorations ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-indigo-200/20 dark:bg-indigo-500/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-[22rem] w-[22rem] rounded-full bg-violet-200/20 dark:bg-violet-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 px-6 py-10 shadow-xl shadow-indigo-100/40 dark:shadow-indigo-950/40 backdrop-blur-xl sm:px-10 sm:py-12 transition-colors duration-300"
      >
        {/* ── Countdown ── */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 px-4 py-1.5 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            Exam begins in{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              {formatCountdown(remainingMs)}
            </span>
          </span>
        </div>

        {/* ── Icon tile ── */}
        <div className="relative mb-6">
          <div
            className={`flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl shadow-lg transition-colors duration-700 ${
              isCalmingPhase
                ? 'bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-500 shadow-emerald-200/50 dark:shadow-emerald-900/40'
                : 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-indigo-200/50 dark:shadow-indigo-900/40'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isCalmingPhase ? 'calming' : stepIndex}
                initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 15, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <ActiveIcon
                  className={`h-10 w-10 text-white ${!isCalmingPhase ? 'animate-spin-slow' : ''}`}
                  strokeWidth={1.8}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {!isCalmingPhase && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                className="absolute -right-1.5 -bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 dark:bg-indigo-400 shadow-md"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white dark:text-slate-900" />
              </motion.div>
              <span className="absolute inset-0 animate-ping-slow rounded-2xl bg-indigo-400/15 dark:bg-indigo-400/20" />
              <span className="absolute inset-0 animate-ping-slower rounded-2xl bg-violet-400/10 dark:bg-violet-400/15" />
            </>
          )}
        </div>

        {/* ── Heading ── */}
        <h1 className="mb-1.5 text-center text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
          {isCalmingPhase ? (
            "You're almost there"
          ) : firstName ? (
            <>
              Preparing your exam,{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </>
          ) : (
            'Preparing your exam'
          )}
        </h1>

        {/* ── Step label ── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={isCalmingPhase ? 'calming-label' : stepIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className={`mb-6 text-center text-sm font-medium ${
              isCalmingPhase
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {activeLabel}
            {!isCalmingPhase && (
              <span className="ml-1 inline-flex gap-0.5">
                <span className="animate-bounce-dot">.</span>
                <span className="animate-bounce-dot animation-delay-150">.</span>
                <span className="animate-bounce-dot animation-delay-300">.</span>
              </span>
            )}
          </motion.p>
        </AnimatePresence>

        {/* ── Progress bar ── */}
        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className={`h-full rounded-full transition-colors duration-700 ${
              isCalmingPhase
                ? 'bg-gradient-to-r from-teal-400 to-emerald-400 dark:from-teal-500 dark:to-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400'
            }`}
            style={{ width: `${Math.round(progress)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Loading progress"
          />
        </div>

        {/* ── Step dots ── */}
        {!isCalmingPhase && (
          <div className="mb-4 flex items-center gap-1.5" aria-hidden="true">
            {LOADING_STEPS.map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full transition-all duration-500 ${
                    i < stepIndex
                      ? 'scale-100 bg-indigo-500 dark:bg-indigo-400'
                      : i === stepIndex
                        ? 'scale-125 bg-indigo-500 dark:bg-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-900/60'
                        : 'scale-100 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
                {i < LOADING_STEPS.length - 1 && (
                  <div
                    className={`h-px w-5 transition-colors duration-500 ${
                      i < stepIndex
                        ? 'bg-indigo-300 dark:bg-indigo-700'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
            CALMING PHASE
            ══════════════════════════════════════ */}
        <AnimatePresence>
          {isCalmingPhase && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="flex w-full flex-col items-center"
            >
              {/* Breathing circle */}
              <div className="relative mb-5 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300/25 to-emerald-300/25 dark:from-teal-400/20 dark:to-emerald-400/20"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full bg-gradient-to-br from-teal-300/20 to-cyan-300/20 dark:from-teal-400/15 dark:to-cyan-400/15"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/90 to-emerald-500/90 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/40 sm:h-[4.5rem] sm:w-[4.5rem]">
                  <Heart className="h-7 w-7 text-white" strokeWidth={1.8} fill="currentColor" />
                </div>
              </div>

              {/* Breathing label */}
              <motion.p
                className="mb-5 text-xs font-medium tracking-widest text-teal-600/70 dark:text-teal-400/80 uppercase"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                Breathe in… and out…
              </motion.p>

              {/* ── QUOTE DISPLAY ── */}
              <div className="relative mb-4 flex min-h-[4.5rem] w-full items-center justify-center px-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={calmingMsgIndex}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="text-center text-base leading-relaxed font-medium text-slate-700 dark:text-slate-200 sm:text-lg"
                  >
                    &ldquo;{CALMING_MESSAGES[calmingMsgIndex]}&rdquo;
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Message dot indicators */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {CALMING_MESSAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === calmingMsgIndex
                        ? 'w-5 bg-emerald-400 dark:bg-emerald-500'
                        : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom text ── */}
        {!isCalmingPhase && (
          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
            Setting everything up for a smooth experience
          </p>
        )}
      </motion.div>

      {/* ── Screen reader ── */}
      <span className="sr-only" role="status">
        {isCalmingPhase
          ? `Your exam will begin in ${formatCountdown(remainingMs)}. Take a moment to breathe.`
          : `Loading step ${stepIndex + 1} of ${LOADING_STEPS.length}: ${activeLabel}`}
      </span>

      {/* ── Keyframes ── */}
      <style jsx global>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          75%, 100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.2; }
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-ping-slow { animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-ping-slower { animation: ping-slower 3.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-bounce-dot { animation: bounce-dot 1.4s infinite ease-in-out both; }
        .animation-delay-150 { animation-delay: 0.15s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        @media (prefers-reduced-motion: reduce) {
          .animate-spin-slow,
          .animate-ping-slow,
          .animate-ping-slower,
          .animate-bounce-dot {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}