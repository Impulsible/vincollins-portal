// components/staff/StaffWelcomeBanner.tsx - COMPLETE WITH FIXED SPACING
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, Quote, Calendar, Award, 
  Flame, Sparkles, Clock, CheckCircle2, Users,
  FileText, BookOpen, FileCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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

interface Quote {
  text: string
  author: string
}

export function StaffWelcomeBanner({ profile, stats, termInfo }: StaffWelcomeBannerProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [currentQuote, setCurrentQuote] = useState<Quote>({ text: '', author: '' })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅' }
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' }
    if (hour < 21) return { text: 'Good Evening', emoji: '🌆' }
    return { text: 'Good Night', emoji: '🌙' }
  }, [currentTime])

  const getQuote = useCallback((): Quote => {
    const quotes: Quote[] = [
      { text: "Every student can learn, just not on the same day, or in the same way.", author: "George Evans" },
      { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
      { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
      { text: "The great teacher inspires.", author: "William Arthur Ward" },
      { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
      { text: "The dream begins with a teacher who believes in you.", author: "Dan Rather" },
    ]
    return quotes[Math.floor(Math.random() * quotes.length)]
  }, [currentTime])

  useEffect(() => {
    setCurrentQuote(getQuote())
    const quoteTimer = setInterval(() => setCurrentQuote(getQuote()), 1800000)
    return () => clearInterval(quoteTimer)
  }, [getQuote])

  const greeting = getGreeting()
  
  const getFirstName = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    if (!fullName) return 'Teacher'
    return fullName.split(' ')[0]
  }
  
  const firstName = getFirstName()
  
  const getInitials = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    if (!fullName) return 'ST'
    const names = fullName.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return fullName.slice(0, 2).toUpperCase()
  }

  const formattedDate = currentTime.toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const pendingGrading = stats?.pendingGrading || 0
  const avatarUrl = profile?.photo_url || profile?.avatar_url || undefined
  
  const getRoleDisplay = (role?: string): string => {
    if (role === 'admin') return 'Administrator'
    if (role === 'staff' || role === 'teacher') return 'Teacher'
    return role || 'Staff'
  }

  const weekDisplay = useMemo(() => {
    if (termInfo?.displayWeek) {
      return termInfo.displayWeek
    }
    if (termInfo) {
      return `Week ${termInfo.currentWeek}/${termInfo.totalWeeks}`
    }
    return 'Week 0/13'
  }, [termInfo])

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-5 sm:p-6 md:p-7 text-white shadow-2xl border border-slate-600/30 mt-2 sm:mt-3 md:mt-4"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* Top Row: Date, Week, Mobile Avatar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{greeting.emoji}</span>
            <span className="text-xs sm:text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full text-gray-200 border border-white/10">
              {formattedDate}
            </span>
            <span className="text-xs sm:text-sm font-medium bg-amber-500/20 px-3 py-1.5 rounded-full text-amber-200 border border-amber-500/30">
              <Clock className="inline h-3 w-3 mr-1" />
              {weekDisplay}
            </span>
          </div>
          
          {/* Mobile Avatar */}
          <div className="relative group md:hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/50 to-orange-400/50 rounded-full opacity-60 blur-md" />
            <Avatar className="h-12 w-12 ring-2 ring-white/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-700 text-white font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 ring-1 ring-slate-800">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content: Greeting, Quote, Badges */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white">
              {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300">{firstName}</span>!
            </h1>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3"
              >
                <div className="flex items-start gap-2">
                  <Quote className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-200 text-sm italic leading-relaxed">
                      "{currentQuote.text}"
                    </p>
                    <p className="text-xs text-amber-200/80 mt-1 font-medium">
                      — {currentQuote.author}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-white/10 text-gray-200 border border-white/20">
                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                {profile?.department || 'General'}
              </Badge>
              <Badge className="bg-white/10 text-gray-200 border border-white/20">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {getRoleDisplay(profile?.role)}
              </Badge>
            </div>
          </div>
          
          {/* Desktop Avatar */}
          <div className="hidden md:block relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/50 to-orange-400/50 rounded-full opacity-60 group-hover:opacity-100 blur-md transition duration-300" />
            <Avatar className="h-24 w-24 ring-4 ring-white/20 shadow-xl">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-700 text-white text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 ring-2 ring-slate-800">
              <div className="h-2.5 w-2.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Stats Cards - 6 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mt-5 pt-4 border-t border-white/15">
          {/* Published Exams */}
          <div className="group cursor-default bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold text-white">{stats?.publishedExams || 0}</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-300 opacity-80" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300">Published Exams</p>
          </div>
          
          {/* Active Students */}
          <div className="group cursor-default bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold text-white">{stats?.activeStudents || stats?.totalStudents || 0}</p>
              <Users className="h-4 w-4 text-blue-300 opacity-80" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300">Active Students</p>
          </div>
          
          {/* Pending Grading */}
          <div className="group cursor-default bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className={cn(
                "text-lg font-bold",
                pendingGrading > 0 ? "text-amber-300" : "text-white"
              )}>
                {pendingGrading}
              </p>
              {pendingGrading > 0 ? (
                <Flame className="h-4 w-4 text-amber-400 opacity-80" />
              ) : (
                <Award className="h-4 w-4 text-gray-400 opacity-60" />
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300">Pending Grading</p>
          </div>

          {/* Report Cards */}
          <div className="group cursor-default bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold text-white">{stats?.reportCardsGenerated || 0}</p>
              <FileCheck className="h-4 w-4 text-purple-300 opacity-80" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300">Report Cards</p>
          </div>

          {/* Assignments */}
          <div className="group cursor-default bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold text-white">{stats?.totalAssignments || 0}</p>
              <FileText className="h-4 w-4 text-pink-300 opacity-80" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300">Assignments</p>
          </div>

          {/* Study Notes */}
          <div className="group cursor-default bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold text-white">{stats?.totalNotes || 0}</p>
              <BookOpen className="h-4 w-4 text-cyan-300 opacity-80" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300">Study Notes</p>
          </div>
        </div>
        
        {/* Term Progress Bar - Only show if term has started */}
        {termInfo && termInfo.currentWeek > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs text-gray-300">{termInfo.termName} Progress</span>
              </div>
              <span className="text-xs text-gray-300">{weekDisplay}</span>
            </div>
            <Progress value={termInfo.weekProgress} className="h-2 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-500" />
          </div>
        )}
        
        {/* Pending Grading Alert */}
        {pendingGrading > 0 && (
          <div className="mt-3 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <p className="text-sm text-amber-200">
                You have <span className="font-bold">{pendingGrading}</span> submission{pendingGrading !== 1 ? 's' : ''} waiting to be graded
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}