// components/staff/StaffWelcomeBanner.tsx - PROFESSIONAL, RESPONSIVE & HYDRATION SAFE
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
    const randomIndex = Math.floor(Math.random() * quotes.length)
    setCurrentQuote(quotes[randomIndex])
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    const quoteTimer = setInterval(() => {
      const newIndex = Math.floor(Math.random() * quotes.length)
      setCurrentQuote(quotes[newIndex])
    }, 1800000)
    
    return () => {
      clearInterval(timer)
      clearInterval(quoteTimer)
    }
  }, [])

  const getGreeting = useCallback(() => {
    if (!currentTime) return { text: 'Welcome', emoji: '👋' }
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅' }
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' }
    if (hour < 21) return { text: 'Good Evening', emoji: '🌆' }
    return { text: 'Good Night', emoji: '🌙' }
  }, [currentTime])
  
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

  const formattedDate = currentTime?.toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) || 'Loading...'

  const pendingGrading = stats?.pendingGrading || 0
  const avatarUrl = profile?.photo_url || profile?.avatar_url || undefined
  
  const getRoleDisplay = (role?: string): string => {
    if (role === 'admin') return 'Administrator'
    if (role === 'staff' || role === 'teacher') return 'Teacher'
    return role || 'Staff'
  }

  const weekDisplay = useMemo(() => {
    if (termInfo?.displayWeek) return termInfo.displayWeek
    if (termInfo) return `Week ${termInfo.currentWeek}/${termInfo.totalWeeks}`
    return 'Week 0/13'
  }, [termInfo])

  const greeting = getGreeting()

  // Show nothing on server to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 mt-2">
        <div className="h-[280px] sm:h-[320px] md:h-[360px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 mt-2">
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
        "p-4 sm:p-5 md:p-6 text-white shadow-2xl border border-slate-600/30",
        "w-full"
      )}>
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Top Row: Date & Week */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl md:text-2xl">{greeting.emoji}</span>
              <span className="text-[10px] sm:text-xs font-medium bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-gray-200">
                {formattedDate}
              </span>
              <span className="text-[10px] sm:text-xs font-medium bg-amber-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-amber-200">
                <Clock className="inline h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                {weekDisplay}
              </span>
            </div>
            
            {/* Mobile Avatar */}
            <div className="relative md:hidden">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-white/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-700 text-white font-bold text-xs sm:text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Main Content: Greeting, Quote, Badges */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-white">
                {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300">{firstName}</span>!
              </h1>
              
              <div className="mb-2 sm:mb-3">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Quote className="h-3 w-3 sm:h-4 sm:w-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-200 text-xs sm:text-sm italic leading-relaxed line-clamp-2">
                      "{currentQuote.text}"
                    </p>
                    <p className="text-[10px] sm:text-xs text-amber-200/80 mt-0.5 sm:mt-1 font-medium">
                      — {currentQuote.author}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                <Badge className="bg-white/10 text-gray-200 border border-white/20 text-[10px] sm:text-xs">
                  <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                  {profile?.department || 'General'}
                </Badge>
                <Badge className="bg-white/10 text-gray-200 border border-white/20 text-[10px] sm:text-xs">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                  {getRoleDisplay(profile?.role)}
                </Badge>
              </div>
            </div>
            
            {/* Desktop Avatar */}
            <div className="hidden md:block relative group shrink-0">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 ring-4 ring-white/20 shadow-xl">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-700 text-white text-base sm:text-lg lg:text-xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 ring-2 ring-slate-800">
                <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-5 lg:mt-6 pt-3 sm:pt-4 border-t border-white/15">
            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white">{stats?.publishedExams || 0}</p>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-300 opacity-80" />
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">Published Exams</p>
            </div>
            
            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white">{stats?.activeStudents || stats?.totalStudents || 0}</p>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300 opacity-80" />
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">Active Students</p>
            </div>
            
            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <p className={cn("text-base sm:text-lg lg:text-xl font-bold", pendingGrading > 0 ? "text-amber-300" : "text-white")}>
                  {pendingGrading}
                </p>
                {pendingGrading > 0 ? (
                  <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 opacity-80" />
                ) : (
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 opacity-60" />
                )}
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">Pending Grading</p>
            </div>

            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white">{stats?.reportCardsGenerated || 0}</p>
                <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 text-purple-300 opacity-80" />
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">Report Cards</p>
            </div>

            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white">{stats?.totalAssignments || 0}</p>
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-pink-300 opacity-80" />
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">Assignments</p>
            </div>

            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white">{stats?.totalNotes || 0}</p>
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-300 opacity-80" />
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">Study Notes</p>
            </div>
          </div>
          
          {/* Term Progress Bar */}
          {termInfo && termInfo.currentWeek > 0 && (
            <div className="mt-3 sm:mt-4 lg:mt-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-300" />
                  <span className="text-[10px] sm:text-xs text-gray-300">{termInfo.termName} Progress</span>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-300">{weekDisplay}</span>
              </div>
              <Progress value={termInfo.weekProgress} className="h-1.5 sm:h-2 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-500" />
            </div>
          )}
          
          {/* Pending Grading Alert */}
          {pendingGrading > 0 && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                <p className="text-[10px] sm:text-xs text-amber-200">
                  You have <span className="font-bold">{pendingGrading}</span> submission{pendingGrading !== 1 ? 's' : ''} waiting to be graded
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}