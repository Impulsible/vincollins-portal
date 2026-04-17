// components/student/StudentWelcomeBanner.tsx - COMPLETELY FIXED
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GraduationCap, Award, TrendingUp, Clock, CheckCircle2, BookOpen
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface StudentProfile {
  full_name: string
  class: string
  department?: string
  photo_url?: string
  vin_id?: string
  subject_count?: number
}

interface StudentStats {
  completedExams: number
  averageScore: number
  availableExams?: number
  totalExams?: number
  totalSubjects?: number
  currentGrade?: string
  gradeColor?: string
}

interface StudentWelcomeBannerProps {
  profile: StudentProfile | null
  stats: StudentStats | null
}

// Simple Grading
const calculateGrade = (percentage: number): { grade: string; color: string; description: string } => {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600', description: 'Excellent' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', description: 'Very Good' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600', description: 'Good' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600', description: 'Pass' }
  return { grade: 'F', color: 'text-red-600', description: 'Fail' }
}

export function StudentWelcomeBanner({ profile, stats }: StudentWelcomeBannerProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', message: 'Ready to learn something new today?' }
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', message: 'Keep pushing forward!' }
    if (hour < 21) return { text: 'Good Evening', emoji: '🌙', message: 'Time to review what you learned!' }
    return { text: 'Good Night', emoji: '🌙', message: 'Rest well and prepare for tomorrow!' }
  }

  const greeting = getGreeting()
  
  // FIXED: Properly extract first name - take the FIRST word
  const studentFullName = profile?.full_name || 'Student'
  const nameParts = studentFullName.trim().split(/\s+/)
  const firstName = nameParts[0] || 'Student'  // Always first part!
  
  const studentClass = profile?.class || 'Not Assigned'
  const studentDepartment = profile?.department || 'General'
  
  // FIXED: Get subject count - JSS=17, SSS=10
  const totalSubjects = stats?.totalSubjects || (studentClass?.startsWith('JSS') ? 17 : 10)

  const formattedDate = currentTime.toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // FIXED: Use stats directly from props
  const completedExams = stats?.completedExams ?? 0
  const averageScore = stats?.averageScore ?? 0
  const availableExams = stats?.availableExams ?? 0

  // FIXED: Calculate grade based on average score
  const gradeInfo = stats?.currentGrade && stats?.gradeColor 
    ? { grade: stats.currentGrade, color: stats.gradeColor, description: '' }
    : calculateGrade(averageScore)
  
  const showGrade = completedExams > 0
  const completionPercentage = totalSubjects > 0 ? Math.round((completedExams / totalSubjects) * 100) : 0

  // FIXED: Get first letter of FIRST NAME for avatar
  const avatarLetter = firstName.charAt(0).toUpperCase()

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 md:p-8 text-white shadow-2xl mb-8"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{greeting.emoji}</span>
            <span className="text-sm font-medium bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm text-white">
              {formattedDate}
            </span>
          </div>
          
          {/* FIXED: Display FIRST NAME */}
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-sm">
            {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">{firstName}</span>!
          </h1>
          
          <p className="text-gray-200 text-sm md:text-base mb-4 max-w-md">
            {greeting.message}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/15 text-white border-0">
              <GraduationCap className="h-3 w-3 mr-1" />
              {studentClass}
            </Badge>
            {studentDepartment !== 'General' && (
              <Badge className="bg-white/15 text-white border-0">
                <BookOpen className="h-3 w-3 mr-1" />
                {studentDepartment}
              </Badge>
            )}
            <Badge className="bg-white/15 text-white border-0">
              <Award className="h-3 w-3 mr-1" />
              {totalSubjects} Subjects
            </Badge>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-60 group-hover:opacity-100 blur-md transition duration-300" />
          <div className="relative">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-white/20 shadow-xl">
              <AvatarImage src={profile?.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-3xl font-bold">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 ring-2 ring-white">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          
          {/* Available Exams */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {availableExams}
              </p>
              <Clock className="h-5 w-5 text-blue-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Available Exams</p>
          </div>

          {/* Completed Exams */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-green-200 transition-colors">
                {completedExams}
              </p>
              <CheckCircle2 className="h-5 w-5 text-green-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Exams Completed</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {completionPercentage}% of term subjects
            </p>
          </div>

          {/* Average Score */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {averageScore}%
              </p>
              <TrendingUp className="h-5 w-5 text-amber-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Average Score</p>
          </div>

          {/* Current Grade */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              {showGrade ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className={cn(
                        "text-2xl md:text-3xl font-bold transition-colors",
                        gradeInfo.color
                      )}>
                        {gradeInfo.grade}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{averageScore}% average - {gradeInfo.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-400">-</p>
              )}
              <Award className="h-5 w-5 text-yellow-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Current Grade</p>
          </div>
        </div>
        
        {/* Subject Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-300">Term Subject Progress</span>
            <span className="text-xs text-gray-300">{completedExams}/{totalSubjects} Subjects</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}