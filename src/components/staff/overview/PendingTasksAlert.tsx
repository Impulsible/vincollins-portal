// ============================================
// PENDING TASKS ALERT COMPONENT
// ============================================

'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, ArrowRight } from 'lucide-react'

interface PendingTasksAlertProps {
  count: number
  termName: string
  onGradeNow: () => void
}

export function PendingTasksAlert({ count, termName, onGradeNow }: PendingTasksAlertProps) {
  if (count === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 text-sm sm:text-base">
                  Pending Grading Tasks
                </p>
                <p className="text-xs sm:text-sm text-amber-600">
                  You have {count} exam submissions waiting for {termName}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={onGradeNow} 
              className="bg-amber-600 hover:bg-amber-700 text-white h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
            >
              Grade Now <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}