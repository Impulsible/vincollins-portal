// src/components/student/exams/ExamTabs.tsx
'use client'

import { motion } from 'framer-motion'
import { Unlock, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType } from '@/app/student/exams/types'

interface ExamTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  availableCount: number
  upcomingCount: number
  completedCount: number
  expiredCount?: number
  labels?: Partial<Record<TabType, string>>
}

const getTabs = (labels?: Partial<Record<TabType, string>>) => [
  { value: 'available' as TabType, label: labels?.available || 'Available', icon: Unlock, dot: 'bg-emerald-500' },
  { value: 'upcoming' as TabType, label: labels?.upcoming || 'Upcoming', icon: Clock, dot: 'bg-amber-500' },
  { value: 'completed' as TabType, label: labels?.completed || 'Completed', icon: CheckCircle2, dot: 'bg-blue-500' },
  { value: 'expired' as TabType, label: labels?.expired || 'Expired', icon: AlertCircle, dot: 'bg-red-500' },
]

export function ExamTabs({ activeTab, onTabChange, availableCount, upcomingCount, completedCount, expiredCount = 0, labels }: ExamTabsProps) {
  const TABS = getTabs(labels)
  const counts = { available: availableCount, upcoming: upcomingCount, completed: completedCount, expired: expiredCount }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm w-full sm:w-auto sm:inline-flex overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.value
          const count = counts[tab.value] ?? 0
          return (
            <button key={tab.value} onClick={() => onTabChange(tab.value)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex-1 sm:flex-initial justify-center sm:justify-start whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-white/60 dark:bg-slate-900/40' : tab.dot)} />
              <Icon className="h-3.5 w-3.5 shrink-0 hidden xs:block" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.substring(0, 4)}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0 rounded-full font-bold',
                isActive ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}