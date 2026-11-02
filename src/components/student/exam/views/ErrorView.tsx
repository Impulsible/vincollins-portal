'use client'

import { Button } from '@/components/ui/button'
import { XCircle, Home, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'

interface ErrorViewProps {
  message: string
  onBack: () => void
}

export function ErrorView({ message, onBack }: ErrorViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute -top-48 -right-48 h-[500px] w-[500px] bg-rose-200/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] bg-slate-200/30 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full"
      >
        <div className="rounded-3xl bg-white shadow-2xl shadow-rose-500/10 overflow-hidden ring-1 ring-slate-200/60">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 px-6 py-8 text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 bg-black/10 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 14 }}
                className="relative inline-flex mb-4"
              >
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl" />
                <div className="relative h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 flex items-center justify-center shadow-2xl">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 mb-2">
                <ShieldAlert className="h-3 w-3 text-white/80" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.14em]">
                  Error
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white leading-tight">
                Something Went Wrong
              </h2>
              <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">
                We couldn&apos;t load the exam environment
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Error message */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 ring-1 ring-slate-200 p-4">
              <p className="text-sm text-slate-700 leading-relaxed text-center font-medium">
                {message}
              </p>
            </div>

            {/* CTA */}
            <Button
              onClick={onBack}
              className="relative w-full h-13 rounded-2xl font-bold text-sm text-white gap-2 shadow-lg shadow-rose-500/25 overflow-hidden group bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 hover:from-rose-700 hover:via-red-700 hover:to-orange-700 transition-all"
              style={{ height: '3.25rem' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Home className="h-4.5 w-4.5" />
              <span>Back to Dashboard</span>
            </Button>

            <p className="text-center text-[11px] text-slate-400">
              If this problem persists, contact your teacher or administrator
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}