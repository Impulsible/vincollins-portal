// app/loading.tsx
'use client'

import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Vincollins
            </span>
            <span className="text-xl font-bold text-primary">
              College
            </span>
          </div>
        </div>
        
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60"
            initial={{ width: "0%" }}
            animate={{ 
              width: ["0%", "100%", "0%"],
              x: ["0%", "0%", "100%"]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Loading your experience
        </p>
      </div>
    </div>
  )
}