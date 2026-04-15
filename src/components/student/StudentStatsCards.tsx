/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/student/StudentStatsCards.tsx - FULLY UPDATED
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, TrendingUp, Calendar, Trophy, 
  Award, Star, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface StudentStatsCardsProps {
  stats: {
    completedExams: number
    averageScore: number
    attendance: number
    rank: number
    totalPoints?: number
    streak?: number
    lastExamScore?: number | null
    totalExams?: number
    passedExams?: number
    failedExams?: number
  }
  loading?: boolean
  className?: string
}

export default function StudentStatsCards({ stats, loading = false, className }: StudentStatsCardsProps) {
  const [prevStats, setPrevStats] = useState(stats)
  const [animatedValues, setAnimatedValues] = useState(stats)
  
  useEffect(() => {
    setPrevStats(animatedValues)
    
    // Animate number changes
    const duration = 800
    const steps = 40
    const interval = duration / steps
    
    let currentStep = 0
    
    const timer = setInterval(() => {
      currentStep++
      const progress = Math.min(currentStep / steps, 1)
      
      setAnimatedValues({
        completedExams: Math.round((prevStats.completedExams || 0) + ((stats.completedExams || 0) - (prevStats.completedExams || 0)) * progress),
        averageScore: Math.round((prevStats.averageScore || 0) + ((stats.averageScore || 0) - (prevStats.averageScore || 0)) * progress),
        attendance: Math.round((prevStats.attendance || 0) + ((stats.attendance || 0) - (prevStats.attendance || 0)) * progress),
        rank: Math.round((prevStats.rank || 0) + ((stats.rank || 0) - (prevStats.rank || 0)) * progress),
        totalPoints: stats.totalPoints || 0,
        streak: stats.streak || 0,
        lastExamScore: stats.lastExamScore || null,
        totalExams: stats.totalExams || 0,
        passedExams: stats.passedExams || 0,
        failedExams: stats.failedExams || 0
      })
      
      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)
    
    return () => clearInterval(timer)
  }, [stats])
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-600 dark:bg-emerald-500'
    if (score >= 60) return 'bg-blue-600 dark:bg-blue-500'
    if (score >= 40) return 'bg-amber-600 dark:bg-amber-500'
    return 'bg-red-600 dark:bg-red-500'
  }
  
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { text: '1st', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Trophy }
    if (rank === 2) return { text: '2nd', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800', icon: Trophy }
    if (rank === 3) return { text: '3rd', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30', icon: Trophy }
    return { text: `#${rank}`, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/30', icon: Award }
  }
  
  const rankDisplay = getRankDisplay(animatedValues.rank || 0)
  
  const cards = [
    {
      title: 'Completed Exams',
      value: animatedValues.completedExams || 0,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      progressColor: 'bg-emerald-600',
      showProgress: false,
      suffix: '',
      description: (stats.streak || 0) > 0 
        ? `${stats.streak} day streak 🔥` 
        : stats.totalExams 
          ? `${stats.passedExams || 0} passed, ${stats.failedExams || 0} failed`
          : 'Keep going!'
    },
    {
      title: 'Average Score',
      value: animatedValues.averageScore || 0,
      icon: TrendingUp,
      color: getScoreColor(animatedValues.averageScore || 0),
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      progressColor: getProgressColor(animatedValues.averageScore || 0),
      showProgress: true,
      suffix: '%',
      description: stats.lastExamScore 
        ? `Last exam: ${stats.lastExamScore}%` 
        : stats.totalExams 
          ? `${stats.totalExams} exams taken`
          : 'No exams yet'
    },
    {
      title: 'Attendance',
      value: animatedValues.attendance || 0,
      icon: Calendar,
      color: (animatedValues.attendance || 0) >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 
             (animatedValues.attendance || 0) >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      progressColor: (animatedValues.attendance || 0) >= 90 ? 'bg-emerald-600' : 
                    (animatedValues.attendance || 0) >= 75 ? 'bg-amber-600' : 'bg-red-600',
      showProgress: true,
      suffix: '%',
      description: (animatedValues.attendance || 0) >= 90 ? 'Excellent! 🎉' : 
                   (animatedValues.attendance || 0) >= 75 ? 'Good 👍' : 'Needs improvement 📚'
    },
    {
      title: 'Class Rank',
      value: rankDisplay.text,
      icon: rankDisplay.icon,
      color: rankDisplay.color,
      bgColor: rankDisplay.bgColor,
      progressColor: 'bg-purple-600',
      showProgress: false,
      suffix: '',
      description: stats.totalPoints 
        ? `${stats.totalPoints} total points` 
        : stats.totalExams 
          ? `Out of ${stats.totalExams} students`
          : 'Keep learning! 📖'
    }
  ]
  
  if (loading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-lg dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded mt-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-6 relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-slate-800/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                    <div className="flex items-baseline gap-1">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`${card.title}-${card.value}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={cn("text-3xl font-bold", card.color)}
                        >
                          {card.value}{card.suffix}
                        </motion.p>
                      </AnimatePresence>
                      
                      {/* Show trend indicator */}
                      {card.title === 'Average Score' && stats.lastExamScore && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded-full",
                            (stats.lastExamScore || 0) >= (animatedValues.averageScore || 0)
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {(stats.lastExamScore || 0) >= (animatedValues.averageScore || 0) ? '↑' : '↓'}
                        </motion.span>
                      )}
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                  
                  <motion.div 
                    className={cn("p-3 rounded-2xl", card.bgColor)}
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <card.icon className={cn("h-6 w-6", card.color)} />
                  </motion.div>
                </div>
                
                {card.showProgress && (
                  <div className="mt-4 space-y-1">
                    <Progress 
                      value={typeof card.value === 'number' ? card.value : 0} 
                      className={cn("h-2 bg-gray-100 dark:bg-gray-800", `[&>div]:${card.progressColor}`)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium">{typeof card.value === 'number' ? card.value : 0}%</span>
                    </div>
                  </div>
                )}
                
                {/* Achievement badge for top rank */}
                {card.title === 'Class Rank' && (animatedValues.rank || 0) <= 3 && (animatedValues.rank || 0) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-2 -right-2"
                  >
                    <div className="bg-yellow-400 rounded-full p-1 shadow-lg">
                      <Star className="h-4 w-4 text-white fill-white" />
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}