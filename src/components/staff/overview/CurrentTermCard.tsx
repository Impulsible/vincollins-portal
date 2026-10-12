// ============================================
// CURRENT TERM CARD COMPONENT - WITH DARK MODE
// ============================================

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar } from 'lucide-react'
import { TermInfo } from '@/lib/staff/types'

interface CurrentTermCardProps {
  termInfo: TermInfo
  onViewCalendar?: () => void
}

export function CurrentTermCard({ termInfo, onViewCalendar }: CurrentTermCardProps) {
  return (
    <Card 
      className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 cursor-pointer hover:shadow-md dark:hover:shadow-slate-950/50 transition-all overflow-hidden"
      onClick={onViewCalendar}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Current Academic Term
            </p>
            <p className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-200">
              {termInfo.termName} {termInfo.sessionYear}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Progress 
                value={termInfo.weekProgress} 
                className="h-1.5 flex-1 bg-blue-100 dark:bg-blue-950/50" 
              />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                Week {termInfo.currentTerm?.toString?.() ?? termInfo.currentWeek}/{termInfo.totalWeeks}
              </span>
            </div>
          </div>
          <Badge className="bg-blue-600 hover:bg-blue-600 dark:bg-blue-600 text-white shrink-0 border-0">
            Active Term
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}