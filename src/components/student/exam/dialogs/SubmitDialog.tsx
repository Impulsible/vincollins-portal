// src/components/student/exam/dialogs/SubmitDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, Send, Loader2, CheckCircle2,
  X, PenTool, Shield, ClipboardCheck,
  TrendingUp, Target, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TheoryInfo {
  required: number
  total: number
  answered: number
}

interface SubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  answeredCount: number
  totalQuestions: number
  unansweredCount: number
  isSubmitting: boolean
  onSubmit: () => void
  theoryInfo?: TheoryInfo
}

export function SubmitDialog({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  unansweredCount,
  isSubmitting,
  onSubmit,
  theoryInfo,
}: SubmitDialogProps) {
  const theoryComplete =
    theoryInfo ? theoryInfo.answered >= theoryInfo.required : true
  const allAnswered     = unansweredCount === 0
  const isFullyComplete = allAnswered && theoryComplete

  const progressPct =
    totalQuestions > 0
      ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
      : 0

  const theoryPct = theoryInfo
    ? Math.min(100, Math.round((theoryInfo.answered / theoryInfo.required) * 100))
    : 100

  // 🎨 Theme
  const theme = isFullyComplete ? {
    gradient: 'from-emerald-500 via-teal-600 to-green-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/30',
    label: 'Ready to Submit',
    sub: 'All required questions answered',
  } : {
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/30',
    label: 'Review Submission',
    sub: `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} remaining`,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] w-[95vw] p-0 gap-0 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto">

        <DialogDescription className="sr-only">
          Confirm your exam submission.
        </DialogDescription>

        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-30 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 🎨 HERO HEADER                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className={cn("relative overflow-hidden bg-gradient-to-br", theme.gradient)}>
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/5 rounded-full -ml-12 -mb-8 blur-xl" />
          
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />

          <DialogHeader className="relative px-6 pt-7 pb-6 text-white text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mx-auto mb-3 w-fit"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/30 blur-xl" />
              <div className="relative h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl">
                {isFullyComplete ? (
                  <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.2} />
                ) : (
                  <ClipboardCheck className="h-6 w-6 text-white" strokeWidth={2.2} />
                )}
              </div>
            </motion.div>

            <DialogTitle className="text-lg font-bold tracking-tight text-white mb-0.5">
              {theme.label}
            </DialogTitle>
            <p className="text-xs text-white/80">
              {theme.sub}
            </p>

            {/* Big progress display */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-4 flex items-end justify-center gap-2"
            >
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums tracking-tighter leading-none">
                  {progressPct}
                </span>
                <span className="text-xl font-bold text-white/70">%</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/70 font-semibold pb-1">
                Complete
              </span>
            </motion.div>
          </DialogHeader>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 📊 BODY                                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="px-6 py-5 space-y-4">

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
                Overall Progress
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {answeredCount}<span className="text-zinc-400 font-normal"> / {totalQuestions}</span>
              </span>
            </div>

            <div className="relative h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  isFullyComplete
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                )}
              />
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { 
                label: 'Answered', 
                value: answeredCount, 
                icon: CheckCircle2, 
                color: 'emerald',
                highlight: true,
              },
              { 
                label: 'Skipped',  
                value: unansweredCount, 
                icon: AlertTriangle, 
                color: 'amber',
                highlight: unansweredCount > 0,
              },
              { 
                label: 'Total',    
                value: totalQuestions,  
                icon: Target, 
                color: 'zinc',
                highlight: false,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 overflow-hidden"
              >
                <stat.icon className={cn("h-3.5 w-3.5 mb-2", 
                  stat.color === 'emerald' && 'text-emerald-500',
                  stat.color === 'amber' && stat.highlight && 'text-amber-500',
                  stat.color === 'amber' && !stat.highlight && 'text-zinc-300 dark:text-zinc-600',
                  stat.color === 'zinc' && 'text-zinc-400',
                )} />
                <p className={cn(
                  "text-xl font-bold tabular-nums leading-none",
                  stat.highlight ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"
                )}>
                  {stat.value}
                </p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mt-1.5">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Theory section */}
          {theoryInfo && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                    <PenTool className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Theory Questions
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {theoryInfo.required} required to submit
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
                    {theoryInfo.answered}
                    <span className="text-zinc-400 dark:text-zinc-600 font-medium"> / {theoryInfo.required}</span>
                  </p>
                  {theoryComplete && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5 inline-block">
                      ✓ Complete
                    </span>
                  )}
                </div>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${theoryPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    className={cn(
                      'h-full rounded-full',
                      theoryComplete
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    )}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-2">
                  {theoryComplete
                    ? theoryInfo.answered > theoryInfo.required
                      ? `${theoryInfo.answered - theoryInfo.required} extra answer${theoryInfo.answered - theoryInfo.required !== 1 ? 's' : ''} beyond the ${theoryInfo.required} required.`
                      : 'All required theory questions have been answered.'
                    : `${theoryInfo.required - theoryInfo.answered} more theory question${theoryInfo.required - theoryInfo.answered !== 1 ? 's' : ''} required to submit.`}
                </p>
              </div>
            </motion.div>
          )}

          {/* Status alerts */}
          {unansweredCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
            >
              <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Unanswered questions will be marked as incorrect and may lower your score.
                </p>
              </div>
            </motion.div>
          )}

          {isFullyComplete && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50"
            >
              <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Perfect! Ready to submit
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  You've answered all required questions. Submit when ready.
                </p>
              </div>
            </motion.div>
          )}

          {/* Policy notice */}
          <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
              <Shield className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Single attempt policy
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                This exam cannot be retaken once submitted. Review carefully before confirming.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-1 grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-12 text-sm font-bold rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Continue Exam
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={cn(
              "h-12 text-sm font-bold rounded-xl text-white shadow-lg transition-all",
              "bg-gradient-to-r hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
              theme.gradient,
              theme.glow,
              isSubmitting && "opacity-70"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}