// ============================================
// REPORT CARD STATS COMPONENT - WITH DARK MODE
// ============================================

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCheck } from 'lucide-react'

interface ReportCardStatsProps {
  total: number
  pending: number
  approved: number
  published: number
  rejected: number
  onViewAll?: () => void
}

export function ReportCardStats({ 
  total, 
  pending, 
  approved, 
  published, 
  rejected,
  onViewAll 
}: ReportCardStatsProps) {
  return (
    <Card 
      className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 cursor-pointer hover:shadow-md dark:hover:shadow-slate-950/50 transition-all overflow-hidden"
      onClick={onViewAll}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium truncate">
              Report Cards
            </p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-800 dark:text-purple-300">
              {total}
            </p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {pending > 0 && (
                <Badge className="bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 text-[9px] sm:text-[10px] px-1.5 border-0">
                  {pending} Pending
                </Badge>
              )}
              {published > 0 && (
                <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-[9px] sm:text-[10px] px-1.5 border-0">
                  {published} Published
                </Badge>
              )}
            </div>
          </div>
          <FileCheck className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-purple-500 dark:text-purple-400 opacity-70 shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}