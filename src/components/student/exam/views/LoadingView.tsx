'use client'

import { Shield, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function LoadingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-violet-950/20 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05] text-slate-900 dark:text-white"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Decorative blur orbs */}
      <div className="absolute -top-48 -right-48 h-[500px] w-[500px] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-blue-100/20 dark:bg-blue-900/10 rounded-full blur-[120px]" />

      <div className="relative text-center max-w-sm">
        {/* Animated icon cluster */}
        <div className="relative inline-flex mb-8">
          {/* Pulsing concentric rings */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-400/30 to-violet-400/30"
          />
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="absolute -inset-2 rounded-[1.5rem] bg-gradient-to-br from-blue-400/20 to-indigo-400/20"
          />

          {/* Main icon tile */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            className="relative h-22 w-22 rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 dark:shadow-indigo-950/60 ring-1 ring-white/20"
            style={{ width: '5.5rem', height: '5.5rem' }}
          >
            <Shield className="h-11 w-11 text-white drop-shadow-lg" />

            {/* Spinner badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', damping: 12 }}
              className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-900/10 dark:shadow-slate-950/60 flex items-center justify-center ring-1 ring-slate-200/60 dark:ring-slate-700"
            >
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight"
        >
          Loading Exam Environment
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-sm text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto leading-relaxed"
        >
          Preparing your secure exam interface…
        </motion.p>

        {/* Shimmer progress bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden max-w-[220px] mx-auto mt-8"
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent rounded-full"
          />
        </motion.div>

        {/* Bouncing dots */}
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -7, 0], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500"
            />
          ))}
        </div>
      </div>
    </div>
  )
}