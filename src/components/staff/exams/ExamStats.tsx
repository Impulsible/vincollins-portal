// src/components/staff/exams/ExamStats.tsx - UPDATED

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle2, BookOpen, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamStatsProps {
  totalExams: number
  draftCount: number
  pendingCount: number
  publishedCount: number
  // ✅ Optional: mark stats from database
  totalMarks?: number
  averageMarks?: number
  balancedExams?: number
}

interface StatItem {
  label: string
  value: number
  color: string
  icon: React.ElementType
  gradientFrom: string
  gradientTo: string
  description?: string
}

export function ExamStats({ 
  totalExams, 
  draftCount, 
  pendingCount, 
  publishedCount,
  totalMarks = 0,
  averageMarks = 0,
  balancedExams = 0,
}: ExamStatsProps) {
  const stats: StatItem[] = [
    { 
      label: 'Total Exams', 
      value: totalExams, 
      color: 'text-blue-600 dark:text-blue-400',
      icon: BookOpen,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600'
    },
    { 
      label: 'Drafts', 
      value: draftCount, 
      color: 'text-slate-600 dark:text-slate-400',
      icon: FileText,
      gradientFrom: 'from-slate-500',
      gradientTo: 'to-slate-600'
    },
    { 
      label: 'Pending', 
      value: pendingCount, 
      color: 'text-amber-600 dark:text-amber-400',
      icon: Clock,
      gradientFrom: 'from-yellow-500',
      gradientTo: 'to-amber-600'
    },
    { 
      label: 'Published', 
      value: publishedCount, 
      color: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-600'
    }
  ]

  // ✅ Add mark stats if available
  const markStats: StatItem[] = []
  
  if (totalMarks > 0) {
    markStats.push({
      label: 'Total Marks',
      value: totalMarks,
      color: 'text-purple-600 dark:text-purple-400',
      icon: Calculator,
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      description: 'All exams combined'
    })
  }
  
  if (averageMarks > 0) {
    markStats.push({
      label: 'Avg Marks',
      value: averageMarks,
      color: 'text-indigo-600 dark:text-indigo-400',
      icon: Calculator,
      gradientFrom: 'from-indigo-500',
      gradientTo: 'to-indigo-600',
      description: 'Per exam average'
    })
  }
  
  if (balancedExams > 0 && totalExams > 0) {
    markStats.push({
      label: 'Balanced',
      value: balancedExams,
      color: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-teal-600',
      description: `${Math.round((balancedExams / totalExams) * 100)}% of exams`
    })
  }

  // Combine stats
  const allStats = [...stats, ...markStats]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  }

  return (
    <motion.div 
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {allStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="w-full"
          >
            <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
              <div className={cn(
                "bg-gradient-to-br p-0.5",
                stat.gradientFrom,
                stat.gradientTo
              )}>
                <CardContent className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-[calc(0.5rem-1px)]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className={cn(
                        "text-xl sm:text-2xl md:text-3xl font-bold",
                        stat.color
                      )}>
                        {stat.value}
                      </p>
                      {stat.description && (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                          {stat.description}
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      "h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 ml-2",
                      stat.gradientFrom,
                      stat.gradientTo
                    )}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Optional progress bar for visual effect */}
                  {stat.value > 0 && totalExams > 0 && stat.label !== 'Total Marks' && stat.label !== 'Avg Marks' && (
                    <div className="mt-2 sm:mt-3">
                      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            stat.gradientFrom.replace('from-', 'bg-'),
                            stat.gradientTo.replace('to-', 'bg-')
                          )}
                          style={{ 
                            width: `${(stat.value / totalExams) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}