'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GraduationCap, Quote, Calendar, Flame, 
  Clock, CheckCircle2, Users, Award, Sparkles, Timer, Globe2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

const STORAGE_KEY = 'staff_session_start'

// Nigerian Language Pack — Greetings + Culturally Relevant Quotes
interface LanguagePack {
  language: string
  flag: string
  morning: string
  afternoon: string
  evening: string
  emoji: string
  quote: {
    text: string
    translation: string
    author: string
  }
}

const NIGERIAN_LANGUAGES: LanguagePack[] = [
  {
    language: 'English',
    flag: '🇳🇬',
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    emoji: '🌅',
    quote: {
      text: 'A good teacher is like a candle — it consumes itself to light the way for others.',
      translation: '',
      author: 'Mustafa Kemal Atatürk'
    }
  },
  {
    language: 'Yoruba',
    flag: '🪘',
    morning: 'Ẹ káàrọ̀',
    afternoon: 'Ẹ káàsán',
    evening: 'Ẹ káalẹ́',
    emoji: '🙌🏾',
    quote: {
      text: 'Bí a bá ń gun igi, à máa wo ìsàlẹ̀.',
      translation: 'When climbing a tree, always look down to maintain balance.',
      author: 'Yoruba Proverb'
    }
  },
  {
    language: 'Igbo',
    flag: '🥁',
    morning: 'Ụtụtụ ọma',
    afternoon: 'Ehihie ọma',
    evening: 'Mgbede ọma',
    emoji: '☀️',
    quote: {
      text: 'Onye kwe, Chi ya ekwe.',
      translation: 'If one agrees, their personal god agrees too.',
      author: 'Igbo Proverb'
    }
  },
  {
    language: 'Hausa',
    flag: '🕌',
    morning: 'Ina kwana',
    afternoon: 'Barka da rana',
    evening: 'Barka da yamma',
    emoji: '🌙',
    quote: {
      text: 'Ilimi gishirin zuciya ne.',
      translation: 'Knowledge is the salt of the mind.',
      author: 'Hausa Proverb'
    }
  },
  {
    language: 'Pidgin',
    flag: '🤝🏾',
    morning: 'How body this morning?',
    afternoon: 'How afternoon dey go?',
    evening: 'How evening dey run?',
    emoji: '🤜🏾',
    quote: {
      text: 'No condition is permanent, better days dey come.',
      translation: 'Nothing lasts forever; better days are ahead.',
      author: 'Nigerian Street Wisdom'
    }
  },
  {
    language: 'Efik/Ibibio',
    flag: '🌴',
    morning: 'Mmesiere',
    afternoon: 'Idem mfo?',
    evening: 'Amesiere',
    emoji: '🌴',
    quote: {
      text: 'Ifiọk edi inyene oro owo mîkemeke ndibô.',
      translation: 'Wisdom is a wealth that cannot be stolen.',
      author: 'Efik Proverb'
    }
  },
  {
    language: 'Edo (Bini)',
    flag: '👑',
    morning: 'Vbènyà ówiè',
    afternoon: 'Kóyo ùghọ̀nvbé',
    evening: 'Kóyo ótá',
    emoji: '👑',
    quote: {
      text: 'Ẹbẹ ne ọ yan ne ọ gha ló.',
      translation: 'What is written on your palm, you will experience in life.',
      author: 'Benin (Edo) Proverb'
    }
  },
  {
    language: 'Fulfulde (Fulani)',
    flag: '🐄',
    morning: 'Jam waali',
    afternoon: 'Jam weeti',
    evening: 'Jam hiiri',
    emoji: '🪔',
    quote: {
      text: 'Ganndal ɓuri jawdi.',
      translation: 'Knowledge is better than wealth.',
      author: 'Fulfulde Proverb'
    }
  },
  {
    language: 'Tiv',
    flag: '🌾',
    morning: 'M sugh u iyange',
    afternoon: 'M sugh u iyange na mimi',
    evening: 'M sugh u ityôgh',
    emoji: '🌾',
    quote: {
      text: 'Fan kwagh ka ngu i i vihi ga.',
      translation: 'Wisdom is something that never spoils.',
      author: 'Tiv Proverb'
    }
  },
  {
    language: 'Nupe',
    flag: '🎋',
    morning: 'A gaba o',
    afternoon: 'A chenchin',
    evening: 'A kyeta o',
    emoji: '🎋',
    quote: {
      text: 'Agbara kpata zhi efo gan.',
      translation: 'Patience is the key to a peaceful life.',
      author: 'Nupe Proverb'
    }
  },
  {
    language: 'Kanuri',
    flag: '🐫',
    morning: 'Ndaro',
    afternoon: 'Ndaro kaure',
    evening: 'Ndaro bariga',
    emoji: '🐫',
    quote: {
      text: 'Karangenyi ye tanda-ro.',
      translation: 'Learning has no end.',
      author: 'Kanuri Proverb'
    }
  },
  {
    language: 'Ijaw',
    flag: '🚣🏾',
    morning: 'Ebi mienemi',
    afternoon: 'Ebi mien seimi',
    evening: 'Ebi mien koromo',
    emoji: '🌊',
    quote: {
      text: 'Beni oyinbo kiri timi ye ye.',
      translation: 'The one who knows the river never drowns.',
      author: 'Ijaw Proverb'
    }
  }
]

export default function StaffWelcomeBanner({ profile, stats, termInfo }: StaffWelcomeBannerProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [langIndex, setLangIndex] = useState<number>(0)

  // Track session timer & dynamic clock
  useEffect(() => {
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

  // Rotate through Nigerian languages every 6 seconds
  useEffect(() => {
    const rotator = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % NIGERIAN_LANGUAGES.length)
    }, 6000)
    return () => clearInterval(rotator)
  }, [])

  // Clear session on page close
  useEffect(() => {
    const handleClear = () => localStorage.removeItem(STORAGE_KEY)
    window.addEventListener('beforeunload', handleClear)
    return () => window.removeEventListener('beforeunload', handleClear)
  }, [])

  // Current Active Language Pack
  const activeLang = NIGERIAN_LANGUAGES[langIndex]

  // Match time of day to proper greeting phrase
  const currentGreeting = useMemo(() => {
    const hour = currentTime.getHours()
    let phrase = activeLang.morning
    if (hour >= 12 && hour < 17) phrase = activeLang.afternoon
    if (hour >= 17) phrase = activeLang.evening

    return {
      phrase,
      language: activeLang.language,
      flag: activeLang.flag,
      emoji: activeLang.emoji
    }
  }, [currentTime, activeLang])

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
    return currentTime.toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }, [currentTime])

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [currentTime])

  const onlineDuration = useMemo(() => {
    if (!sessionStart) return '00:00:00'
    const diffMs = currentTime.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [currentTime, sessionStart])

  const pendingGrading = stats?.pendingGrading || 0
  const weekDisplay = termInfo?.displayWeek || (termInfo ? `Week ${termInfo.currentWeek}/${termInfo.totalWeeks}` : '')
  const roleDisplay = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'staff' || profile?.role === 'teacher' ? 'Teacher' : profile?.role || 'Staff'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 sm:p-5 md:p-6 lg:p-8 text-white shadow-2xl mb-6 sm:mb-8 border border-slate-800"
      suppressHydrationWarning
    >
      {/* Background Neon Glow Accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div className="flex-1 w-full">
          {/* Top Info Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
            <span className="text-sm font-medium bg-white/10 dark:bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm text-slate-200 border border-white/10">
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-blue-500/10 px-3 py-1 rounded-full text-blue-300 border border-blue-500/20">
              <Clock className="h-3.5 w-3.5" />
              {formattedTime}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-medium bg-white/5 px-3 py-1 rounded-full text-indigo-300 border border-white/5">
              <Timer className="h-3.5 w-3.5" />
              {onlineDuration}
            </span>
            {weekDisplay && (
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium bg-amber-500/10 px-3 py-1 rounded-full text-amber-300 border border-amber-500/20">
                <Calendar className="h-3.5 w-3.5" />
                {weekDisplay}
              </span>
            )}
          </div>

          {/* Dynamic Multi-Language Greeting */}
          <div className="min-h-[50px] sm:min-h-[60px] flex flex-col justify-center mb-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={langIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center flex-wrap gap-2 sm:gap-3"
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
                  <span>{currentGreeting.phrase}</span>,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-200">
                    {firstName}
                  </span>
                  <span className="ml-2 inline-block animate-bounce">{currentGreeting.emoji}</span>
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md self-center">
                  <Globe2 className="h-3 w-3" />
                  {currentGreeting.language}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dynamic Culturally Relevant Proverb Quote */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`quote-${langIndex}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-start gap-2 mb-4 max-w-2xl"
            >
              <Quote className="h-4 w-4 text-amber-400/70 shrink-0 mt-1" />
              <div>
                <p className="text-gray-200 text-xs sm:text-sm italic leading-relaxed font-medium">
                  &ldquo;{activeLang.quote.text}&rdquo;
                </p>
                {activeLang.quote.translation && (
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1 italic">
                    &rarr; {activeLang.quote.translation}
                  </p>
                )}
                <p className="text-[10px] text-amber-300/60 mt-1 font-medium">
                  — {activeLang.quote.author}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Secondary Role and Department Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2.5 py-1">
              <GraduationCap className="h-3.5 w-3.5 mr-1 text-blue-400" />
              {profile?.department || 'General Department'}
            </Badge>
            <Badge className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-400" />
              {roleDisplay}
            </Badge>
          </div>
        </div>

        {/* Profile Avatar Card */}
        <div className="relative group hidden sm:block shrink-0">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 ring-4 ring-slate-800/80 shadow-2xl transition-transform duration-300 group-hover:scale-105">
            <AvatarImage src={profile?.photo_url || profile?.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white text-2xl sm:text-3xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full ring-4 ring-slate-900 flex items-center justify-center">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Pending Grading Alert */}
      {pendingGrading > 0 && (
        <div className="relative z-10 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
          <Flame className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <p className="text-xs sm:text-sm text-amber-200 font-medium">
              You have {pendingGrading} submission{pendingGrading !== 1 ? 's' : ''} awaiting grading.
            </p>
            <p className="text-[10px] sm:text-xs text-amber-300/60">Take a moment to review and submit student grades.</p>
          </div>
        </div>
      )}

      {/* Mini Dashboard Metrics Stats Row */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="group cursor-default bg-white/5 border border-slate-800 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
                {stats?.publishedExams || 0}
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-400 opacity-80" />
            </div>
            <p className="text-xs text-slate-400">Published Exams</p>
          </div>

          <div className="group cursor-default bg-white/5 border border-slate-800 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
                {stats?.activeStudents || stats?.totalStudents || 0}
              </p>
              <Users className="h-5 w-5 text-blue-400 opacity-80" />
            </div>
            <p className="text-xs text-slate-400">Active Students</p>
          </div>

          <div className="group cursor-default bg-white/5 border border-slate-800 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className={cn(
                "text-xl sm:text-2xl md:text-3xl font-bold transition-colors",
                pendingGrading > 0 ? "text-amber-300" : "text-white group-hover:text-blue-300"
              )}>
                {pendingGrading}
              </p>
              {pendingGrading > 0 ? (
                <Flame className="h-5 w-5 text-amber-400 opacity-80 animate-pulse" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-slate-500 opacity-80" />
              )}
            </div>
            <p className={cn(
              "text-xs",
              pendingGrading > 0 ? "text-amber-400" : "text-slate-400"
            )}>
              Pending Grading
            </p>
          </div>

          <div className="group cursor-default bg-white/5 border border-slate-800 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
                {stats?.averagePerformance || 0}%
              </p>
              <Award className="h-5 w-5 text-amber-300 opacity-80" />
            </div>
            <p className="text-xs text-slate-400">Avg Performance</p>
          </div>
        </div>

        {/* Dynamic Week Progress Bar */}
        {termInfo && termInfo.currentWeek > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{termInfo.termName} Progress</span>
              <span className="text-xs text-slate-300">{weekDisplay}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${termInfo.weekProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}