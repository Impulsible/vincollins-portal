// src/components/student/exams/ExamTabs.tsx

'use client'

import { motion } from 'framer-motion'
import { Unlock, Clock, CheckCircle2, AlertCircle } from 'lucide-react'  // ✅ Add AlertCircle
import { cn } from '@/lib/utils'
import type { TabType } from '@/app/student/exams/types'

interface ExamTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  availableCount: number
  upcomingCount: number
  completedCount: number
  expiredCount?: number  // ✅ Add optional expired count
}

// ✅ Add 'expired' tab
const TABS = [
  { value: 'available' as TabType, label: 'Available', icon: Unlock, dot: 'bg-emerald-500' },
  { value: 'upcoming' as TabType, label: 'Upcoming', icon: Clock, dot: 'bg-amber-500' },
  { value: 'completed' as TabType, label: 'Completed', icon: CheckCircle2, dot: 'bg-blue-500' },
  { value: 'expired' as TabType, label: 'Expired', icon: AlertCircle, dot: 'bg-red-500' },  // ✅ Add expired
]

export function ExamTabs({
  activeTab,
  onTabChange,
  availableCount,
  upcomingCount,
  completedCount,
  expiredCount = 0,  // ✅ Default to 0
}: ExamTabsProps) {
  const counts = {
    available: availableCount,
    upcoming: upcomingCount,
    completed: completedCount,
    expired: expiredCount,  // ✅ Include expired
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-5"
    >
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-full sm:w-auto sm:inline-flex">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.value
          const count = counts[tab.value] ?? 0  // ✅ Safe access
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex-1 sm:flex-initial justify-center sm:justify-start',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  isActive ? 'bg-white/60' : tab.dot
                )}
              />
              <Icon className="h-3.5 w-3.5 shrink-0 hidden xs:block" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.substring(0, 4)}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0 rounded-full font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}