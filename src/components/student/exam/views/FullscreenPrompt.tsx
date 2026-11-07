// src/components/student/exam/views/FullscreenPrompt.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Maximize2, AlertTriangle, Shield, ShieldAlert, Lock } from 'lucide-react'
import { FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface FullscreenPromptProps {
  fullscreenExits: number
  onReturnToFullscreen: () => void
}

const getVisibleHeight = () =>
  typeof window === 'undefined'
    ? 0
    : Math.floor(window.visualViewport?.height ?? window.innerHeight)

export function FullscreenPrompt({
  fullscreenExits,
  onReturnToFullscreen,
}: FullscreenPromptProps) {
  const isLastWarning = fullscreenExits >= FULLSCREEN_EXIT_LIMIT - 1
  const isCritical = fullscreenExits >= FULLSCREEN_EXIT_LIMIT - 1
  const buttonRef = useRef<HTMLButtonElement>(null)
  const remaining = Math.max(0, FULLSCREEN_EXIT_LIMIT - fullscreenExits)

  const [mounted, setMounted] = useState(false)
  const [vh, setVh] = useState(0)

  useEffect(() => {
    setMounted(true)
    const update = () => setVh(getVisibleHeight())
    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    buttonRef.current?.focus()
  }, [mounted])

  const compact = vh > 0 && vh < 760

  const theme = isCritical
    ? {
        gradient: 'from-rose-600 via-red-600 to-orange-600 dark:from-rose-700 dark:via-red-700 dark:to-orange-700',
        buttonGradient: 'from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 dark:from-rose-700 dark:to-red-800 dark:hover:from-rose-800 dark:hover:to-red-900',
        buttonShadow: 'shadow-rose-500/40 dark:shadow-rose-950/50',
        progressFill: 'from-rose-500 to-red-500',
        alertBg: 'from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40',
        alertRing: 'ring-rose-200 dark:ring-rose-900/50',
        alertText: 'text-rose-800 dark:text-rose-200',
        icon: AlertTriangle,
        iconLabel: 'Critical',
      }
    : {
        gradient: 'from-amber-500 via-orange-500 to-amber-600 dark:from-amber-600 dark:via-orange-600 dark:to-amber-700',
        buttonGradient: 'from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 dark:from-amber-700 dark:to-orange-800 dark:hover:from-amber-800 dark:hover:to-orange-900',
        buttonShadow: 'shadow-amber-500/40 dark:shadow-amber-950/50',
        progressFill: 'from-amber-500 to-orange-500',
        alertBg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
        alertRing: 'ring-amber-200 dark:ring-amber-900/50',
        alertText: 'text-amber-800 dark:text-amber-200',
        icon: ShieldAlert,
        iconLabel: 'Warning',
      }

  const Icon = theme.icon

  if (!mounted) return null

  const content = (
    <div
      className="bg-slate-950/85 dark:bg-black/90 backdrop-blur-xl overflow-y-auto overflow-x-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: vh || '100dvh',
        zIndex: 2147483000,
      }}
    >
      <div className="flex items-center justify-center p-3" style={{ minHeight: '100%' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md"
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br rounded-[2rem] blur-2xl opacity-40',
              theme.gradient
            )}
          />

          <div
            className="relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl dark:shadow-black/60 ring-1 ring-slate-200 dark:ring-slate-800"
            style={{ maxHeight: vh ? vh - 24 : 'calc(100dvh - 1.5rem)' }}
          >
            {/* HERO */}
            <div
              className={cn(
                'relative shrink-0 overflow-hidden bg-gradient-to-br px-5 text-center',
                compact ? 'py-3' : 'py-5 sm:py-6',
                theme.gradient
              )}
            >
              <div className="absolute -top-16 -right-16 h-36 w-36 bg-white/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-36 w-36 bg-black/10 rounded-full blur-3xl" />
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />

              <div className="relative">
                <div className={cn('relative inline-flex', compact ? 'mb-1.5' : 'mb-3')}>
                  <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg" />
                  <div
                    className={cn(
                      'relative rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center shadow-xl',
                      compact ? 'h-10 w-10 rounded-xl' : 'h-14 w-14 sm:h-16 sm:w-16',
                      isCritical && 'animate-pulse'
                    )}
                  >
                    <Icon className={cn('text-white', compact ? 'h-5 w-5' : 'h-7 w-7 sm:h-8 sm:w-8')} />
                  </div>
                </div>

                {!compact && (
                  <div className="block">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 mb-1.5">
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full bg-white',
                          isCritical && 'animate-pulse'
                        )}
                      />
                      <span className="text-[10px] font-bold text-white uppercase tracking-[0.14em]">
                        {theme.iconLabel}
                      </span>
                    </div>
                  </div>
                )}

                <h2 className={cn('font-bold text-white leading-tight', compact ? 'text-lg' : 'text-xl sm:text-2xl')}>
                  {isLastWarning ? 'Final Warning' : 'Return to Fullscreen'}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
                  {isLastWarning
                    ? 'One more exit will auto-submit your exam'
                    : 'Fullscreen mode is required for this exam'}
                </p>
              </div>
            </div>

            {/* BODY */}
            <div
              className={cn(
                'flex-1 min-h-0 overflow-y-auto overscroll-contain',
                compact ? 'p-3 space-y-2.5' : 'p-4 sm:p-5 space-y-3.5 sm:space-y-4'
              )}
            >
              {/* Violation counter */}
              <div
                className={cn(
                  'relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800 dark:to-slate-800/70 ring-1 ring-slate-200 dark:ring-slate-800 px-4 text-center',
                  compact ? 'py-2.5' : 'py-4'
                )}
              >
                <div className="flex items-baseline justify-center gap-1.5 mb-1.5">
                  <motion.span
                    key={fullscreenExits}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                    className={cn(
                      'font-extrabold tabular-nums bg-clip-text text-transparent bg-gradient-to-br',
                      compact ? 'text-3xl' : 'text-4xl sm:text-5xl',
                      isCritical ? 'from-rose-600 to-red-700 dark:from-rose-400 dark:to-red-500' : 'from-amber-600 to-orange-700 dark:from-amber-400 dark:to-orange-500'
                    )}
                  >
                    {fullscreenExits}
                  </motion.span>
                  <span className="text-xl text-slate-300 dark:text-slate-600 font-light">/</span>
                  <span className="text-xl text-slate-500 dark:text-slate-400 font-bold tabular-nums">
                    {FULLSCREEN_EXIT_LIMIT}
                  </span>
                </div>

                <p className={cn('text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]', compact ? 'mb-2' : 'mb-3')}>
                  Fullscreen exits detected
                </p>

                <div className="flex justify-center items-center gap-1.5">
                  {Array.from({ length: FULLSCREEN_EXIT_LIMIT }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        i < fullscreenExits
                          ? cn('w-6 sm:w-7 bg-gradient-to-r shadow-sm', theme.progressFill)
                          : 'w-2 bg-slate-200 dark:bg-slate-700'
                      )}
                    />
                  ))}
                </div>

                {remaining > 0 && (
                  <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 font-medium">
                    <span className={cn('font-bold', isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}>
                      {remaining}
                    </span>{' '}
                    warning{remaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>

              {/* Alert banner */}
              <div
                className={cn(
                  'relative overflow-hidden rounded-xl bg-gradient-to-br p-3 ring-1',
                  theme.alertBg,
                  theme.alertRing
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      'flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center shadow-sm',
                      isCritical
                        ? 'bg-gradient-to-br from-rose-500 to-red-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold leading-snug', theme.alertText)}>
                      {isLastWarning
                        ? 'One more exit will auto-submit your exam!'
                        : 'Exam must remain in fullscreen mode'}
                    </p>
                    <p className={cn('text-xs mt-0.5 opacity-80 leading-snug', theme.alertText)}>
                      {isLastWarning
                        ? 'Return to fullscreen immediately to avoid termination.'
                        : 'Exiting fullscreen is recorded as a security violation.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="h-5 w-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Shield className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="font-semibold uppercase tracking-wider">
                  Security violation #{fullscreenExits}
                </span>
              </div>
            </div>

            {/* FOOTER */}
            <div className={cn('shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900', compact ? 'p-3' : 'p-4 sm:p-5')}>
              <Button
                ref={buttonRef}
                onClick={onReturnToFullscreen}
                className={cn(
                  'relative w-full rounded-2xl font-bold text-sm sm:text-base text-white gap-2 shadow-xl transition-all overflow-hidden group bg-gradient-to-br',
                  compact ? 'h-10' : 'h-12',
                  theme.buttonGradient,
                  theme.buttonShadow
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Maximize2 className="h-5 w-5" />
                <span>Return to Fullscreen Now</span>
              </Button>

              <div className={cn('flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500', compact ? 'mt-1.5' : 'mt-2.5')}>
                <Lock className="h-3 w-3 shrink-0" />
                <span>
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold ring-1 ring-slate-200 dark:ring-slate-700">
                    F11
                  </kbd>{' '}
                  or click the button above
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  return createPortal(content, document.fullscreenElement ?? document.body)
}