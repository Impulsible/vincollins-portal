// src/components/student/exams/EmptyExamsState.tsx - FIXED VERSION

'use client'

import { motion } from 'framer-motion'
import { MonitorPlay, Award, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType, StatsState } from '@/app/student/exams/types'

interface EmptyExamsStateProps {
  activeTab: TabType
  stats: StatsState
}

// ✅ Dynamic config - uses stats for dynamic messages
const getConfig = (activeTab: TabType, stats: StatsState) => {
  const baseConfigs = {
    available: {
      icon: MonitorPlay,
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
    },
    completed: {
      icon: Award,
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
    },
    upcoming: {
      icon: Clock,
      color: 'text-amber-500', 
      bg: 'bg-amber-50',
    },
    expired: {
      icon: Clock,
      color: 'text-slate-500', 
      bg: 'bg-slate-50',
    },
  }

  const base = baseConfigs[activeTab] || baseConfigs.available

  // ✅ Dynamic titles and descriptions based on stats
  const titles = {
    available: 'No exams available',
    completed: 'No completed exams',
    upcoming: 'No upcoming exams',
    expired: 'No expired exams',
  }

  const descriptions = {
    available: stats.termName && stats.sessionYear 
      ? `No exams are available for ${stats.termName} ${stats.sessionYear} yet. Check back soon!`
      : 'No exams are available for this term yet. Check back soon!',
    completed: 'Complete available exams to see your results here!',
    upcoming: 'No upcoming exams are scheduled at the moment.',
    expired: 'There are no exams that have expired.',
  }

  return {
    ...base,
    title: titles[activeTab] || titles.available,
    description: descriptions[activeTab] || descriptions.available,
  }
}

export function EmptyExamsState({ activeTab, stats }: EmptyExamsStateProps) {
  const { icon: Icon, title, description, color, bg } = getConfig(activeTab, stats)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center py-20"
    >
      <div className="text-center max-w-sm">
        <div className={cn('h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-5', bg)}>
          <Icon className={cn('h-10 w-10', color)} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        {/* ✅ Show current term info if available */}
        {stats.termName && stats.sessionYear && activeTab === 'available' && (
          <p className="text-xs text-slate-400 mt-3">
            Current term: {stats.termName} {stats.sessionYear}
          </p>
        )}
      </div>
    </motion.div>
  )
}