// components/staff/StaffWelcomeBanner.tsx - PRODUCTION DASHBOARD BANNER (WIDER)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, Quote, Calendar, Flame, 
  Clock, CheckCircle2, Users,
  FileText, BookOpen, FileCheck, Sparkles
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
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="h-[260px] sm:h-[280px] lg:h-[300px] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-[2rem] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="pt-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 shadow-xl border border-slate-700/30 mx-3 sm:mx-4 lg:mx-5">
        
        {/* Large Background Accents */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-[350px] h-[350px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-blue-500/8 to-purple-500/8 rounded-full blur-3xl" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative p-5 sm:p-7 lg:p-9">
          {/* Header with Date & Avatar */}
          <div className="flex items-start justify-between gap-6 mb-5 sm:mb-7">
            <div className="flex-1 min-w-0">
              {/* Date & Week Badge Row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="text-2xl sm:text-3xl" role="img" aria-label={greeting.text}>
                  {greeting.emoji}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
                  {formattedDate}
                </span>
                {weekDisplay && (
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-amber-300/90 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    <Clock className="h-3.5 w-3.5" />
                    {weekDisplay}
                  </span>
                )}
              </div>

              {/* Main Greeting */}
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {greeting.text},{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                    {firstName}
                  </span>
                  <span className="ml-2">👋</span>
                </h1>
              </div>

              {/* Quote */}
              <div className="flex items-start gap-2.5 mb-4 max-w-2xl">
                <Quote className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400/60 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm sm:text-base text-slate-300 italic leading-relaxed line-clamp-2">
                    "{currentQuote.text}"
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    — {currentQuote.author}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-600/30">
                  <GraduationCap className="h-4 w-4" />
                  {profile?.department || 'General Department'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-600/30">
                  <Sparkles className="h-4 w-4" />
                  {roleDisplay}
                </span>
              </div>
            </div>

            {/* Avatar */}
            <div className="hidden sm:block shrink-0 relative">
              <Avatar className="h-20 w-20 lg:h-24 lg:w-24 ring-[3px] ring-slate-600/50 shadow-2xl">
                <AvatarImage src={profile?.photo_url || profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xl lg:text-2xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-emerald-500 rounded-full ring-[3px] ring-slate-800 flex items-center justify-center">
                <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Cards - Larger & More Refined */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-slate-700/40">
            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 sm:p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats?.publishedExams || 0}</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Published Exams</p>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 sm:p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats?.activeStudents || stats?.totalStudents || 0}</span>
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Active Students</p>
            </div>

            <div className={cn(
              "hover:bg-white/10 transition-colors rounded-xl p-3.5 sm:p-4 border",
              pendingGrading > 0 
                ? "bg-amber-500/10 border-amber-500/30" 
                : "bg-white/5 border-slate-700/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xl sm:text-2xl lg:text-3xl font-bold",
                  pendingGrading > 0 ? "text-amber-400" : "text-white"
                )}>
                  {pendingGrading}
                </span>
                {pendingGrading > 0 ? (
                  <Flame className="h-5 w-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <p className={cn(
                "text-[11px] sm:text-xs font-medium",
                pendingGrading > 0 ? "text-amber-400/80" : "text-slate-400"
              )}>
                Pending Grading
              </p>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 sm:p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats?.reportCardsGenerated || 0}</span>
                <FileCheck className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Report Cards</p>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 sm:p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats?.totalAssignments || 0}</span>
                <FileText className="h-5 w-5 text-pink-400" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Assignments</p>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 sm:p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats?.totalNotes || 0}</span>
                <BookOpen className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Study Notes</p>
            </div>
          </div>

          {/* Bottom Section: Progress & Alert */}
          <div className="mt-5 sm:mt-6 space-y-3">
            {/* Term Progress */}
            {termInfo && termInfo.currentWeek > 0 && (
              <div className="bg-slate-700/20 rounded-xl p-3.5 sm:p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-slate-300 font-medium">{termInfo.termName} Progress</span>
                  </div>
                  <span className="text-sm text-slate-400 font-medium">{weekDisplay}</span>
                </div>
                <Progress value={termInfo.weekProgress} className="h-2 bg-slate-600/50 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-500 [&>div]:transition-all [&>div]:duration-700" />
              </div>
            )}

            {/* Pending Grading Alert */}
            {pendingGrading > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                  <Flame className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-amber-200 font-medium">
                    {pendingGrading} submission{pendingGrading !== 1 ? 's' : ''} waiting for grading
                  </p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Review and grade pending theory submissions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}