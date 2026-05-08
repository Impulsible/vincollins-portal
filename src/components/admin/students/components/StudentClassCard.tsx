// components/admin/students/components/StudentClassCard.tsx

'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, FolderOpen, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CLASS_COLORS } from '../constants'
import { ClassGroup } from '../types'

interface StudentClassCardProps {
  className: string
  group: ClassGroup
  index: number
  onClick: (className: string) => void
}

export function StudentClassCard({ className, group, index, onClick }: StudentClassCardProps) {
  const studentCount = group?.count || 0
  const onlineCount = group?.onlineCount || 0
  const gradient = CLASS_COLORS[className] || 'from-gray-500 to-gray-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0',
          studentCount > 0
            ? 'bg-gradient-to-br from-card to-card/80'
            : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 opacity-70'
        )}
        onClick={() => studentCount > 0 && onClick(className)}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="flex gap-2">
              {onlineCount > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs border-emerald-200">
                  <Wifi className="h-2 w-2 mr-1" />
                  {onlineCount}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs font-medium">
                {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
              </Badge>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-1">{className}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {studentCount > 0 ? `${studentCount} enrolled` : 'No students enrolled'}
          </p>

          <div className="flex items-center justify-between text-sm">
            <span
              className={cn(
                'transition-colors flex items-center gap-1',
                studentCount > 0
                  ? 'text-primary/70 group-hover:text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {studentCount > 0 ? 'View class' : 'Empty class'}
              {studentCount > 0 && (
                <FolderOpen className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}