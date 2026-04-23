// src/components/staff/exams/ExamStats.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface ExamStatsProps {
  totalExams: number
  draftCount: number
  pendingCount: number
  publishedCount: number
}

export function ExamStats({ totalExams, draftCount, pendingCount, publishedCount }: ExamStatsProps) {
  const stats = [
    { label: 'Total Exams', value: totalExams, color: 'from-blue-500 to-blue-600', icon: '📚' },
    { label: 'Drafts', value: draftCount, color: 'from-slate-500 to-slate-600', icon: '📝' },
    { label: 'Pending', value: pendingCount, color: 'from-yellow-500 to-amber-600', icon: '⏳' },
    { label: 'Published', value: publishedCount, color: 'from-green-500 to-emerald-600', icon: '✅' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-br ${stat.color} p-0.5`}>
              <CardContent className="p-5 bg-white dark:bg-slate-900 rounded-[calc(0.5rem-1px)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className="text-3xl opacity-50">{stat.icon}</div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}