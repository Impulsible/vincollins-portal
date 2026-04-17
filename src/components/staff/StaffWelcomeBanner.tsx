/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/StaffWelcomeBanner.tsx - UPDATED WITH TERM INFO
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { GraduationCap, BookOpen, Users, Quote, Calendar, Clock, Award, Flame, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StaffProfile {
  id?: string
  full_name?: string
  name?: string
  email?: string
  department?: string
  photo_url?: string | null
  avatar_url?: string | null
  role?: string
}

interface StaffStats {
  totalExams?: number
  totalStudents?: number
  publishedExams?: number
  totalAssignments?: number
  totalNotes?: number
  pendingGrading?: number
  pendingSubmissions?: number
  activeStudents?: number
}

interface TermInfo {
  termName: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  startDate: string
  endDate: string
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
    if (hour < 21) return { text: 'Good Evening', emoji: '🌙' }
    return { text: 'Good Night', emoji: '🌙' }
  }, [currentTime])

  const getQuote = useCallback((): Quote => {
    const hour = currentTime.getHours()
    
    const morningQuotes: Quote[] = [
      { text: "Every student can learn, just not on the same day, or in the same way.", author: "George Evans" },
      { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
      { text: "Today is a new day full of possibilities. Make it count for your students.", author: "Unknown" },
      { text: "A teacher takes a hand, opens a mind, and touches a heart.", author: "Unknown" },
      { text: "The influence of a good teacher can never be erased.", author: "Unknown" },
    ]
    
    const afternoonQuotes: Quote[] = [
      { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
      { text: "The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires.", author: "William Arthur Ward" },
      { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
      { text: "Your students may forget what you said, but they will never forget how you made them feel.", author: "Carl Buechner" },
      { text: "The best teachers teach from the heart, not from the book.", author: "Unknown" },
    ]
    
    const eveningQuotes: Quote[] = [
      { text: "Teaching is the greatest act of optimism.", author: "Colleen Wilcox" },
      { text: "What the teacher is, is more important than what he teaches.", author: "Karl Menninger" },
      { text: "The dream begins with a teacher who believes in you.", author: "Dan Rather" },
      { text: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai" },
      { text: "Teachers plant seeds that grow forever.", author: "Unknown" },
    ]
    
    const nightQuotes: Quote[] = [
      { text: "Rest well. Tomorrow brings another opportunity to shape young minds.", author: "Unknown" },
      { text: "A good teacher is like a candle - it consumes itself to light the way for others.", author: "Mustafa Kemal Atatürk" },
      { text: "Teaching is the profession that teaches all other professions. Take time to recharge.", author: "Unknown" },
      { text: "The best preparation for tomorrow is doing your best today. Rest now.", author: "H. Jackson Brown Jr." },
      { text: "Your dedication today creates their success tomorrow. Good night, teacher.", author: "Unknown" },
    ]

    const quotesByHour = hour < 12 ? morningQuotes : 
                         hour < 17 ? afternoonQuotes : 
                         hour < 21 ? eveningQuotes : 
                         nightQuotes
    
    return quotesByHour[Math.floor(Math.random() * quotesByHour.length)]
  }, [currentTime])

  useEffect(() => {
    const updateQuote = () => setCurrentQuote(getQuote())
    updateQuote()
    
    const quoteTimer = setInterval(updateQuote, 1800000)
    return () => clearInterval(quoteTimer)
  }, [getQuote])

  const greeting = getGreeting()
  
  const formatDisplayName = (name: string): string => {
    if (!name) return ''
    let formatted = name.replace(/\./g, ' ')
    formatted = formatted.replace(/\s+/g, ' ').trim()
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    return formatted
  }

  const getDisplayName = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    return formatDisplayName(fullName)
  }

  const getFirstName = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    if (!fullName) return ''
    const formattedName = formatDisplayName(fullName)
    return formattedName.split(' ')[0]
  }
  
  const firstName = getFirstName()
  const displayName = getDisplayName()

  const getInitials = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    if (!fullName) return 'ST'
    const formattedName = formatDisplayName(fullName)
    const names = formattedName.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return names[0].slice(0, 2).toUpperCase()
  }

  const getAvatarUrl = (): string | undefined => {
    const url = profile?.photo_url || profile?.avatar_url
    return url || undefined
  }

  const formattedDate = currentTime.toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const pendingGrading = stats?.pendingGrading || stats?.pendingSubmissions || 0

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 p-4 sm:p-6 md:p-8 text-white shadow-2xl mb-8 border border-blue-800/30"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400/15 to-teal-400/15 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{greeting.emoji}</span>
            <span className="text-xs sm:text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/20">
              {formattedDate}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
            {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300">{firstName || 'Teacher'}</span>!
          </h1>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-4 max-w-lg"
            >
              <div className="flex items-start gap-2">
                <Quote className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-100 text-sm md:text-base italic leading-relaxed font-medium">
                    &ldquo;{currentQuote.text}&rdquo;
                  </p>
                  <p className="text-xs text-blue-200 mt-1 font-medium">
                    — {currentQuote.author}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors font-medium text-xs">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
              {profile?.department || 'Department'}
            </Badge>
            <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors font-medium text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              {stats?.totalExams || 0} Exams
            </Badge>
            <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors font-medium text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              {stats?.totalStudents || 0} Students
            </Badge>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-60 group-hover:opacity-100 blur-md transition duration-300" />
          <div className="relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 ring-4 ring-white/30 shadow-xl">
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-2xl sm:text-3xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 ring-2 ring-slate-900">
              <div className="h-2.5 w-2.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section with Term Info */}
      <div className="relative z-10 mt-6 pt-5 border-t border-white/20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          
          {/* Term Progress Card */}
          {termInfo && (
            <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Week {termInfo.currentWeek}/{termInfo.totalWeeks}
                </p>
                <Calendar className="h-5 w-5 text-blue-300 opacity-60" />
              </div>
              <p className="text-xs md:text-sm text-gray-300">{termInfo.termName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{termInfo.sessionYear}</p>
              <Progress value={termInfo.weekProgress} className="h-1 mt-2" />
            </div>
          )}

          {/* Published Exams */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                {stats?.publishedExams || 0}
              </p>
              <BookOpen className="h-5 w-5 text-blue-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Published Exams</p>
            <p className="text-[10px] text-gray-400 mt-0.5">of {stats?.totalExams || 0} total</p>
          </div>

          {/* Active Students */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-emerald-200 transition-colors">
                {stats?.activeStudents || 0}
              </p>
              <Users className="h-5 w-5 text-emerald-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Active Students</p>
            <p className="text-[10px] text-gray-400 mt-0.5">of {stats?.totalStudents || 0} total</p>
          </div>

          {/* Pending Grading */}
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className={cn(
                "text-lg sm:text-xl md:text-2xl font-bold transition-colors",
                pendingGrading > 0 ? "text-amber-200 group-hover:text-amber-100" : "text-white group-hover:text-amber-200"
              )}>
                {pendingGrading}
              </p>
              <Award className="h-5 w-5 text-amber-300 opacity-60" />
            </div>
            <p className="text-xs md:text-sm text-gray-300">Pending Grading</p>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {pendingGrading > 0 ? 'Needs attention' : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Second Row: Assignments & Notes */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-3">
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg md:text-xl font-bold text-white">{stats?.totalAssignments || 0}</p>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300 opacity-60" />
            </div>
            <p className="text-xs text-gray-300">Assignments</p>
          </div>
          <div className="group cursor-default bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg md:text-xl font-bold text-white">{stats?.totalNotes || 0}</p>
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-pink-300 opacity-60" />
            </div>
            <p className="text-xs text-gray-300">Study Notes</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}