// components/staff/StaffWelcomeBanner.tsx - PRODUCTION DASHBOARD BANNER (WIDER)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, Quote, Calendar, Flame, 
  Clock, CheckCircle2, Users, Award,
  FileText, BookOpen, FileCheck, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StaffProfile {
  id?: string
  full_name?: string
  name?: string
  department?: string
  role?: string
  photo_url?: string | null
  avatar_url?: string | null
}

interface StaffStats {
  totalExams?: number
  publishedExams?: number
  totalStudents?: number
  activeStudents?: number
  pendingGrading?: number
  totalAssignments?: number
  totalNotes?: number
  reportCardsGenerated?: number
  averagePerformance?: number
}

interface TermInfo {
  termName: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  startDate?: string
  endDate?: string
  displayWeek?: string
}

interface StaffWelcomeBannerProps {
  profile: StaffProfile | null
  stats: StaffStats | null
  termInfo?: TermInfo
}

const quotes = [
  { text: "Every student can learn, just not on the same day, or in the same way.", author: "George Evans" },
  { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
  { text: "The great teacher inspires.", author: "William Arthur Ward" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
  { text: "The dream begins with a teacher who believes in you.", author: "Dan Rather" },
]

export default function StaffWelcomeBanner({ profile, stats, termInfo }: StaffWelcomeBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentQuote, setCurrentQuote] = useState(quotes[0])

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    const quoteTimer = setInterval(() => {
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])
    }, 1800000)
    
    return () => { clearInterval(timer); clearInterval(quoteTimer) }
  }, [])

  const getGreeting = useCallback(() => {
    if (!currentTime) return { text: 'Welcome', emoji: '👋' }
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good morning', emoji: '🌅' }
    if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' }
    return { text: 'Good evening', emoji: '🌙' }
  }, [currentTime])
  
  const firstName = (profile?.full_name || profile?.name || 'Teacher').split(' ')[0]
  
  const getInitials = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    if (!fullName) return 'ST'
    const names = fullName.split(' ')
    return names.length >= 2 
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : fullName.slice(0, 2).toUpperCase()
  }

  const formattedDate = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }, [currentTime])

  const pendingGrading = stats?.pendingGrading || 0
  const greeting = getGreeting()
  const weekDisplay = termInfo?.displayWeek || (termInfo ? `Week ${termInfo.currentWeek}/${termInfo.totalWeeks}` : '')
  const roleDisplay = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'staff' || profile?.role === 'teacher' ? 'Teacher' : profile?.role || 'Staff'

  if (!mounted) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 shadow-2xl mb-6 sm:mb-8">
        <div className="h-[260px] sm:h-[280px] lg:h-[300px] animate-pulse bg-white/5 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 text-white shadow-2xl mb-6 sm:mb-8"
    >
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          {/* Date & Week Badge Row */}
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl">{greeting.emoji}</span>
            <span className="text-xs sm:text-sm font-medium bg-white/15 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-white">
              {formattedDate}
            </span>
            {weekDisplay && (
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium bg-amber-400/10 px-2 sm:px-3 py-1 rounded-full text-amber-200 border border-amber-400/20">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {weekDisplay}
              </span>
            )}
          </div>
          
          {/* Main Greeting */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-white drop-shadow-sm">
            {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">{firstName}</span>!
          </h1>
          
          {/* Quote */}
          <div className="flex items-start gap-2 mb-3 sm:mb-4 max-w-2xl">
            <Quote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400/60 shrink-0 mt-0.5 sm:mt-1" />
            <div>
              <p className="text-gray-200 text-xs sm:text-sm md:text-base italic leading-relaxed line-clamp-2">
                "{currentQuote.text}"
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 font-medium">
                — {currentQuote.author}
              </p>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className="bg-white/15 text-white border-0 text-xs sm:text-sm">
              <GraduationCap className="h-3 w-3 mr-1" />
              {profile?.department || 'General Department'}
            </Badge>
            <Badge className="bg-white/15 text-white border-0 text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              {roleDisplay}
            </Badge>
          </div>
        </div>
        
        {/* Avatar */}
        <div className="relative group hidden sm:block">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 ring-4 ring-white/20 shadow-xl">
            <AvatarImage src={profile?.photo_url || profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl sm:text-3xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full ring-2 ring-white flex items-center justify-center">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Pending Grading Alert */}
      {pendingGrading > 0 && (
        <div className="relative z-10 mt-3 sm:mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
          <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm text-amber-200 font-medium">
              {pendingGrading} submission{pendingGrading !== 1 ? 's' : ''} waiting for grading
            </p>
            <p className="text-[10px] sm:text-xs text-amber-300/80">Review and grade pending theory submissions</p>
          </div>
        </div>
      )}
      
      {/* Stats Section */}
      <div className="relative z-10 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/15">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          
          <div className="group cursor-default bg-white/5 rounded-xl p-2.5 sm:p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {stats?.publishedExams || 0}
              </p>
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300 opacity-60" />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-300">Published Exams</p>
          </div>

          <div className="group cursor-default bg-white/5 rounded-xl p-2.5 sm:p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {stats?.activeStudents || stats?.totalStudents || 0}
              </p>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 opacity-60" />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-300">Active Students</p>
          </div>

          <div className="group cursor-default bg-white/5 rounded-xl p-2.5 sm:p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className={cn(
                "text-xl sm:text-2xl md:text-3xl font-bold transition-colors",
                pendingGrading > 0 ? "text-amber-300" : "text-white group-hover:text-amber-200"
              )}>
                {pendingGrading}
              </p>
              {pendingGrading > 0 ? (
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 opacity-60" />
              ) : (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 opacity-60" />
              )}
            </div>
            <p className={cn(
              "text-[10px] sm:text-xs md:text-sm",
              pendingGrading > 0 ? "text-amber-200" : "text-gray-300"
            )}>
              Pending Grading
            </p>
          </div>

          <div className="group cursor-default bg-white/5 rounded-xl p-2.5 sm:p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {stats?.averagePerformance || 0}%
              </p>
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300 opacity-60" />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-300">Avg Performance</p>
          </div>
        </div>
        
        {/* Term Progress Bar */}
        {termInfo && termInfo.currentWeek > 0 && (
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs text-gray-300">{termInfo.termName} Progress</span>
              <span className="text-[10px] sm:text-xs text-gray-300">{weekDisplay}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${termInfo.weekProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}