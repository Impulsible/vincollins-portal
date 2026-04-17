// components/student/SetDStatsCards.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Calendar, BookOpen, Flame, Zap, Trophy, TrendingUp, 
  Award, Target, CheckCircle, ArrowRight, Clock, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TermInfo {
  termName: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  startDate: string
  endDate: string
}

interface BestSubject {
  name: string
  score: number
}

interface SetDStatsCardsProps {
  termInfo: TermInfo
  totalSubjects: number
  completedExams: number
  studyStreak: number
  bestSubject: BestSubject | null
  studentClass?: string
  className?: string
}

export function SetDStatsCards({
  termInfo,
  totalSubjects,
  completedExams,
  studyStreak,
  bestSubject,
  studentClass,
  className
}: SetDStatsCardsProps) {
  const router = useRouter()
  const [showStreakModal, setShowStreakModal] = useState(false)
  
  const remainingSubjects = totalSubjects - completedExams
  const calculateGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const handleTermClick = () => {
    router.push('/student/calendar')
  }

  const handleRemainingClick = () => {
    router.push('/student/exams?filter=available')
  }

  const handleStreakClick = () => {
    setShowStreakModal(true)
  }

  const handleBestSubjectClick = () => {
    if (bestSubject) {
      router.push(`/student/results?subject=${encodeURIComponent(bestSubject.name)}`)
    } else {
      router.push('/student/exams')
    }
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", className)}>
        
        {/* Card 1: Current Term - CLICKABLE */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
            onClick={handleTermClick}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-blue-600 font-medium truncate">{termInfo.termName}</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-800 truncate group-hover:text-blue-900 transition-colors">
                    Week {termInfo.currentWeek}/{termInfo.totalWeeks}
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5 truncate">{termInfo.sessionYear}</p>
                </div>
                <div className="relative">
                  <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <Progress value={termInfo.weekProgress} className="h-1.5 mt-3" />
              <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View Calendar <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Subjects Remaining - CLICKABLE */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
            onClick={handleRemainingClick}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-emerald-600 font-medium">Remaining</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-800 group-hover:text-emerald-900 transition-colors">
                    {remainingSubjects}
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 truncate">
                    of {totalSubjects} subjects
                  </p>
                </div>
                <div className="relative">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500 shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="absolute -bottom-1 -right-1 h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <Progress 
                value={totalSubjects > 0 ? (remainingSubjects / totalSubjects) * 100 : 0} 
                className="h-1.5 mt-3" 
              />
              <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Browse Available Exams <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: Study Streak - CLICKABLE */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
            onClick={handleStreakClick}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-amber-600 font-medium">Study Streak</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl sm:text-2xl font-bold text-amber-800 group-hover:text-amber-900 transition-colors">
                      {studyStreak}
                    </p>
                    <span className="text-sm text-amber-600">days</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {studyStreak > 0 ? 'Keep it up!' : 'Start today!'}
                  </p>
                </div>
                <div className="relative">
                  <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="absolute -bottom-1 -right-1 h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View Streak Details <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 4: Best Subject - CLICKABLE */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
            onClick={handleBestSubjectClick}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-purple-600 font-medium">Best Subject</p>
                  {bestSubject ? (
                    <>
                      <p className="text-base sm:text-lg font-bold text-purple-800 truncate group-hover:text-purple-900 transition-colors">
                        {bestSubject.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm sm:text-base font-bold text-purple-700">
                          {bestSubject.score}%
                        </span>
                        <Badge className={cn(
                          "text-xs",
                          calculateGrade(bestSubject.score).color === 'text-emerald-600' ? 'bg-emerald-100' :
                          calculateGrade(bestSubject.score).color === 'text-blue-600' ? 'bg-blue-100' :
                          calculateGrade(bestSubject.score).color === 'text-amber-600' ? 'bg-amber-100' :
                          calculateGrade(bestSubject.score).color === 'text-orange-600' ? 'bg-orange-100' :
                          'bg-red-100'
                        )}>
                          <span className={calculateGrade(bestSubject.score).color}>
                            {calculateGrade(bestSubject.score).grade}
                          </span>
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-base sm:text-lg font-bold text-purple-800">--</p>
                      <p className="text-[10px] sm:text-xs text-purple-600 mt-0.5">Complete an exam</p>
                    </>
                  )}
                </div>
                <div className="relative">
                  <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="absolute -bottom-1 -right-1 h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-[10px] text-purple-500 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {bestSubject ? 'View Subject Results' : 'Take an Exam'} <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Study Streak Modal */}
      <Dialog open={showStreakModal} onOpenChange={setShowStreakModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flame className="h-5 w-5 text-amber-500" />
              Study Streak
            </DialogTitle>
            <DialogDescription>
              Your consecutive days of learning activity
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-full mb-4">
                <Flame className={cn(
                  "h-12 w-12",
                  studyStreak >= 7 ? "text-amber-600" : 
                  studyStreak >= 3 ? "text-amber-500" : "text-amber-400"
                )} />
              </div>
              <p className="text-4xl font-bold text-gray-900">{studyStreak}</p>
              <p className="text-sm text-gray-500 mt-1">day{studyStreak !== 1 ? 's' : ''} streak</p>
            </div>
            
            <div className="mt-6 space-y-3">
              {studyStreak >= 7 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Weekly Warrior!</p>
                    <p className="text-xs text-green-600">You've studied for a full week!</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Next Milestone</p>
                  <p className="text-xs text-blue-600">
                    {studyStreak < 3 ? '3 days' : studyStreak < 7 ? '7 days' : studyStreak < 14 ? '14 days' : '30 days'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-800">Tip</p>
                  <p className="text-xs text-purple-600">
                    Complete at least one activity daily to maintain your streak!
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowStreakModal(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}