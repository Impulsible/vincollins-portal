// components/student/StudentWelcomeBanner.tsx - COMPLETE FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GraduationCap, Award } from 'lucide-react'
import { motion } from 'framer-motion'

interface StudentProfile {
  full_name: string
  class: string
  photo_url?: string
}

interface StudentStats {
  completedExams: number
  averageScore: number
  attendance: number
  rank?: number  // FIXED: Made rank optional
}

interface StudentWelcomeBannerProps {
  profile: StudentProfile | null
  stats: StudentStats | null  // FIXED: Made stats nullable
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
  const studentFullName = profile?.full_name || 'Student'
  const firstName = studentFullName.split(' ')[0]
  const studentClass = profile?.class || 'Not Assigned'

  const formattedDate = currentTime.toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // FIXED: Safe access with defaults
  const completedExams = stats?.completedExams ?? 0
  const averageScore = stats?.averageScore ?? 0
  const attendance = stats?.attendance ?? 0
  const rank = stats?.rank ?? 0

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 md:p-8 text-white shadow-2xl mb-8"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{greeting.emoji}</span>
            <span className="text-sm font-medium bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm text-white">
              {formattedDate}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-sm">
            {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">{firstName}</span>!
          </h1>
          
          <p className="text-gray-200 text-sm md:text-base mb-4 max-w-md">
            {greeting.message}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/15 text-white border-0 hover:bg-white/20 transition-colors">
              <GraduationCap className="h-3 w-3 mr-1" />
              {studentClass}
            </Badge>
            {/* FIXED: Only show rank badge if rank > 0 */}
            {rank > 0 && (
              <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white border-0">
                <Award className="h-3 w-3 mr-1 text-amber-300" />
                Rank: #{rank}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-60 group-hover:opacity-100 blur-md transition duration-300" />
          <div className="relative">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-white/20 shadow-xl">
              <AvatarImage src={profile?.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-3xl font-bold">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 ring-2 ring-white">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="group cursor-default">
            <p className="text-2xl font-bold text-white group-hover:text-amber-200 transition-colors">
              {completedExams}
            </p>
            <p className="text-xs text-gray-300">Exams Completed</p>
          </div>
          <div className="group cursor-default">
            <p className="text-2xl font-bold text-white group-hover:text-emerald-200 transition-colors">
              {averageScore}%
            </p>
            <p className="text-xs text-gray-300">Average Score</p>
          </div>
          <div className="group cursor-default">
            <p className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
              {attendance}%
            </p>
            <p className="text-xs text-gray-300">Attendance</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}