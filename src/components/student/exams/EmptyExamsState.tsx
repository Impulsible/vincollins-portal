// src/components/student/exams/EmptyExamsState.tsx
'use client'

import { motion } from 'framer-motion'
import { MonitorPlay, Award, Clock } from 'lucide-react'
import type { TabType, StatsState } from '@/app/student/exams/types'

interface EmptyExamsStateProps {
  activeTab: TabType
  stats: StatsState
}

const CONFIG = {
  available: {
    icon: MonitorPlay,
    title: 'No exams available',
    description: 'No exams are available for this term yet. Check back soon!',
    color: 'text-blue-500', bg: 'bg-blue-50',
  },
  completed: {
    icon: Award,
    title: 'No completed exams',
    description: 'Complete available exams to see your results here!',
    color: 'text-emerald-500', bg: 'bg-emerald-50',
  },
  upcoming: {
    icon: Clock,
    title: 'No upcoming exams',
    description: 'No upcoming exams are scheduled at the moment.',
    color: 'text-amber-500', bg: 'bg-amber-50',
  },
}

export function EmptyExamsState({ activeTab, stats }: EmptyExamsStateProps) {
  const { icon: Icon, title, description, color, bg } = CONFIG[activeTab] || CONFIG.available

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center py-20"
    >
      <div className="text-center max-w-sm">
        <div className={cn('h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-5', bg)}>
          <Icon className={cn('h-10 w-10', color)} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// need cn here too
import { cn } from '@/lib/utils'