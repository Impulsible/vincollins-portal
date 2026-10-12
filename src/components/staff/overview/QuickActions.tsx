// ============================================
// QUICK ACTIONS COMPONENT - FIXED IMPORTS + DARK MODE
// ============================================

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MonitorPlay, FileText, BookOpen, Users } from 'lucide-react'
import { QUICK_ACTIONS } from '@/lib/staff/constants'
import { TermInfo } from '@/lib/staff/types'

interface QuickActionsProps {
  termInfo: TermInfo
  onCreateExam: () => void
  onUploadAssignment: () => void
  onUploadNote: () => void
  onViewStudents: () => void
}

const iconMap = {
  MonitorPlay,
  FileText,
  BookOpen,
  Users
}

const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-950/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 text-blue-600 dark:text-blue-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-purple-100 dark:bg-purple-950/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 text-purple-600 dark:text-purple-400',
  amber: 'bg-amber-100 dark:bg-amber-950/50 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 text-amber-600 dark:text-amber-400'
}

export function QuickActions({ 
  termInfo, 
  onCreateExam, 
  onUploadAssignment, 
  onUploadNote, 
  onViewStudents 
}: QuickActionsProps) {
  const actionHandlers = {
    createExam: onCreateExam,
    uploadAssignment: onUploadAssignment,
    uploadNote: onUploadNote,
    viewStudents: onViewStudents
  }

  return (
    <section className="transition-colors duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
            Quick Actions
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Create and publish content for {termInfo.termName} {termInfo.sessionYear}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {QUICK_ACTIONS.map((action) => {
          const IconComponent = iconMap[action.icon as keyof typeof iconMap]
          
          return (
            <Card 
              key={action.id}
              className="border-0 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md dark:hover:shadow-slate-950/50 transition-all duration-200 cursor-pointer group overflow-hidden"
              onClick={actionHandlers[action.action as keyof typeof actionHandlers]}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center transition-colors ${colorClasses[action.color as keyof typeof colorClasses]}`}>
                    <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-slate-100">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}