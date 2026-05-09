/* eslint-disable @typescript-eslint/no-unused-vars */
// components/student/StudentWelcomeBanner.tsx - COMPLETE WITH PERSONALIZED QUOTES
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GraduationCap, Award, TrendingUp, Clock, CheckCircle2, BookOpen,
  Wifi, WifiOff, AlertCircle, Timer, Quote, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface StudentProfile {
  id?: string
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
  pendingTheoryCount?: number
}

interface StudentWelcomeBannerProps {
  profile: StudentProfile | null
  stats: StudentStats | null
}

const STORAGE_KEY = 'student_session_start'

// ─── Personalized Quotes ──────────────────────────────
const quotes = {
  morning: [
    { text: "The beautiful thing about learning is that no one can take it away from {name}.", author: "B.B. King" },
    { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today, {name}.", author: "Malcolm X" },
    { text: "The expert in anything was once a beginner, {name}. Keep going!", author: "Helen Hayes" },
    { text: "Start where you are, {name}. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Rise and shine, {name}! Today is a new opportunity to learn and grow.", author: "Vincollins" },
    { text: "Every great achievement starts with the decision to try, {name}.", author: "John F. Kennedy" },
    { text: "Morning is nature's way of saying one more time, {name}. Make today count!", author: "Vincollins" },
    { text: "The only way to do great work is to love what you learn, {name}.", author: "Steve Jobs" },
  ],
  afternoon: [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts, {name}.", author: "Winston Churchill" },
    { text: "The harder you work for something, {name}, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Don't watch the clock, {name}; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there, {name}.", author: "Theodore Roosevelt" },
    { text: "You are capable of more than you know, {name}. Keep pushing forward!", author: "Vincollins" },
    { text: "It's not about being the best, {name}. It's about being better than you were yesterday.", author: "Unknown" },
    { text: "Your potential is endless, {name}. Go do what you were created to do.", author: "Vincollins" },
    { text: "Small daily improvements over time lead to stunning results, {name}.", author: "Robin Sharma" },
  ],
  evening: [
    { text: "The mind is not a vessel to be filled, but a fire to be kindled, {name}.", author: "Plutarch" },
    { text: "Learning never exhausts the mind, {name}. It only energizes it.", author: "Leonardo da Vinci" },
    { text: "What we learn with pleasure we never forget, {name}.", author: "Alfred Mercier" },
    { text: "Reflect on what you learned today, {name}. Tomorrow brings new opportunities.", author: "Vincollins" },
    { text: "The beautiful thing about learning is nobody can take it away from {name}.", author: "B.B. King" },
    { text: "Education is not preparation for life; education is life itself, {name}.", author: "John Dewey" },
    { text: "Rest well, {name}. A well-rested mind is a learning mind.", author: "Vincollins" },
    { text: "The future belongs to those who believe in the beauty of their dreams, {name}.", author: "Eleanor Roosevelt" },
  ],
}

// ✅ Helper to get first name from "Surname FirstName Other" format
const getFirstName = (fullName: string): string => {
  if (!fullName) return 'Student'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) return parts[1]
  return parts[0] || 'Student'
}

// ✅ Fixed quote personalization - only replaces {name}
const getPersonalizedQuote = (hour: number, firstName: string) => {
  let quoteSet = quotes.morning
  if (hour >= 12 && hour < 17) quoteSet = quotes.afternoon
  if (hour >= 17) quoteSet = quotes.evening

  const dayOfMonth = new Date().getDate()
  const index = dayOfMonth % quoteSet.length
  const quote = quoteSet[index]
  
  return {
    text: quote.text.replace(/\{name\}/g, firstName),
    author: quote.author
  }
}

const calculateGrade = (percentage: number): { grade: string; color: string; description: string } => {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600', description: 'Excellent' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', description: 'Very Good' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600', description: 'Good' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600', description: 'Pass' }
  return { grade: 'F', color: 'text-red-600', description: 'Fail' }
}

const getSubjectCountForClass = (className: string): number => {
  if (!className) return 17
  const normalizedClass = className.toString().toUpperCase().replace(/\s+/g, '')
  if (normalizedClass.startsWith('JSS')) return 17
  if (normalizedClass.startsWith('SS')) return 10
  return 17
}

export function StudentWelcomeBanner({ profile, stats }: StudentWelcomeBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSessionStart(new Date(stored))
    } else {
      const start = new Date()
      localStorage.setItem(STORAGE_KEY, start.toISOString())
      setSessionStart(start)
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem(STORAGE_KEY)
      setSessionStart(null)
    }
    window.addEventListener('student-logout', handleLogout)
    return () => window.removeEventListener('student-logout', handleLogout)
  }, [])

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsOnline(!!session)
    }
    checkAuthStatus()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setIsOnline(false)
      else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') setIsOnline(!!session)
    })

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const greeting = useMemo(() => {
    if (!currentTime) return { text: 'Welcome', emoji: '👋', message: 'Welcome!' }
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', message: 'Ready to learn something new today?' }
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', message: 'Keep pushing forward!' }
    if (hour < 21) return { text: 'Good Evening', emoji: '🌙', message: 'Time to review what you learned!' }
    return { text: 'Good Night', emoji: '🌙', message: 'Rest well and prepare for tomorrow!' }
  }, [currentTime])

  const quote = useMemo(() => {
    if (!currentTime) return { text: '', author: '' }
    const firstName = getFirstName(profile?.full_name || 'Student')
    return getPersonalizedQuote(currentTime.getHours(), firstName)
  }, [currentTime, profile?.full_name])

  const formattedDate = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }, [currentTime])

  const formattedTime = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [currentTime])

  const onlineDuration = useMemo(() => {
    if (!currentTime || !sessionStart) return '00:00:00'
    const diffMs = currentTime.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [currentTime, sessionStart])

  const firstName = getFirstName(profile?.full_name || 'Student')
  const studentClass = profile?.class || 'Not Assigned'
  const studentDepartment = profile?.department || 'General'
  const totalSubjects = stats?.totalSubjects || getSubjectCountForClass(studentClass)
  const completedExams = stats?.completedExams ?? 0
  const averageScore = stats?.averageScore ?? 0
  const availableExams = stats?.availableExams ?? 0
  const pendingTheoryCount = stats?.pendingTheoryCount ?? 0

  const gradeInfo = stats?.currentGrade && stats?.gradeColor 
    ? { grade: stats.currentGrade, color: stats.gradeColor, description: '' }
    : calculateGrade(averageScore)
  
  const showGrade = completedExams > 0
  const completionPercentage = totalSubjects > 0 ? Math.round((completedExams / totalSubjects) * 100) : 0

  const avatarLetter = firstName.charAt(0).toUpperCase()
  const avatarUrl = profile?.photo_url || undefined

  const statusDisplay = isOnline 
    ? { icon: Wifi, color: 'bg-emerald-500', text: 'Online' }
    : { icon: WifiOff, color: 'bg-gray-400', text: 'Offline' }
  const StatusIcon = statusDisplay.icon

  if (!mounted) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 md:p-8 shadow-2xl mb-8">
        <div className="h-[280px] sm:h-[320px] animate-pulse bg-white/5 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 md:p-8 text-white shadow-2xl mb-8"
      suppressHydrationWarning
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-2xl">{greeting.emoji}</span>
            <span className="text-xs sm:text-sm font-medium bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm text-white">{formattedDate}</span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-cyan-400/10 px-3 py-1 rounded-full text-cyan-200 border border-cyan-400/20">
              <Clock className="h-3.5 w-3.5" />{formattedTime}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-medium bg-white/10 px-3 py-1 rounded-full text-blue-200">
              <Timer className="h-3.5 w-3.5" />{onlineDuration}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Badge className={cn("text-[10px] gap-1 cursor-help", isOnline ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30")}>
                      <StatusIcon className="h-3 w-3" />{statusDisplay.text}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>{isOnline ? 'You are online' : 'You are offline'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-sm">
            {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">{firstName}</span>!
          </h1>
          
          <p className="text-gray-200 text-sm md:text-base mb-3 max-w-md">{greeting.message}</p>

          {quote.text && (
            <div className="flex items-start gap-2 mb-3 max-w-xl">
              <Quote className="h-4 w-4 text-amber-400/60 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-200 text-xs sm:text-sm italic leading-relaxed line-clamp-2">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">— {quote.author}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/15 text-white border-0"><GraduationCap className="h-3 w-3 mr-1" />{studentClass}</Badge>
            {studentDepartment !== 'General' && (
              <Badge className="bg-white/15 text-white border-0"><BookOpen className="h-3 w-3 mr-1" />{studentDepartment}</Badge>
            )}
            <Badge className="bg-white/15 text-white border-0"><Award className="h-3 w-3 mr-1" />{totalSubjects} Subjects</Badge>
          </div>
        </div>
        
        <div className="relative group">
          <div className={cn("absolute -inset-1 bg-gradient-to-r rounded-full opacity-60 group-hover:opacity-100 blur-md transition duration-300", isOnline ? "from-emerald-400 to-teal-400" : "from-gray-400 to-gray-500")} />
          <div className="relative">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-white/20 shadow-xl">
              {avatarUrl && !avatarError ? (
                <AvatarImage src={avatarUrl} alt={firstName} onError={() => setAvatarError(true)} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-3xl font-bold">{avatarLetter}</AvatarFallback>
            </Avatar>
            <span className={cn("absolute -bottom-2 -right-2 rounded-full p-1.5 ring-2 ring-white inline-block", statusDisplay.color, isOnline && "animate-pulse")}>
              <StatusIcon className="h-2.5 w-2.5 text-white" />
            </span>
          </div>
        </div>
      </div>
      
      {pendingTheoryCount > 0 && (
        <div className="relative z-10 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm text-amber-200 font-medium">{pendingTheoryCount} exam{pendingTheoryCount !== 1 ? 's' : ''} pending theory grading</p>
            <p className="text-xs text-amber-300/80">Objective scores are ready. Theory answers will be graded by your teacher soon.</p>
          </div>
        </div>
      )}
      
      <div className="relative z-10 mt-4 pt-4 border-t border-white/15">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">{availableExams}</p>
              <Clock className="h-5 w-5 text-blue-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Available Exams</p>
          </div>
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-green-200 transition-colors">{completedExams}</p>
              <CheckCircle2 className="h-5 w-5 text-green-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Completed</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{completionPercentage}% of term</p>
          </div>
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">{averageScore.toFixed(1)}%</p>
              <TrendingUp className="h-5 w-5 text-amber-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Average Score</p>
          </div>
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              {showGrade ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex"><p className={cn("text-2xl md:text-3xl font-bold", gradeInfo.color)}>{gradeInfo.grade}</p></span>
                    </TooltipTrigger>
                    <TooltipContent><p>{averageScore}% average - {gradeInfo.description}</p></TooltipContent>
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
        
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-300">Term Subject Progress</span>
            <span className="text-xs text-gray-300">{completedExams}/{totalSubjects}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}