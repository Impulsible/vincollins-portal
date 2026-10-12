'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  GraduationCap,
  Quote,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  Timer,
  Globe2,
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
      author: 'Mustafa Kemal Atatürk',
    },
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
      author: 'Yoruba Proverb',
    },
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
      author: 'Igbo Proverb',
    },
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
      author: 'Hausa Proverb',
    },
  },
  {
    language: 'Pidgin',
    flag: '🤝🏾',
    morning: 'How body this morning?',
    afternoon: 'How afternoon dey go?',
    evening: 'How evening dey run?',
    emoji: ' tip',
    quote: {
      text: 'No condition is permanent, better days dey come.',
      translation: 'Nothing lasts forever; better days are ahead.',
      author: 'Nigerian Street Wisdom',
    },
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
      author: 'Efik Proverb',
    },
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
      author: 'Benin (Edo) Proverb',
    },
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
      author: 'Fulfulde Proverb',
    },
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
      author: 'Tiv Proverb',
    },
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
      author: 'Nupe Proverb',
    },
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
      author: 'Kanuri Proverb',
    },
  },
  {
    language: 'Ijaw',
    flag: '🛶',
    morning: 'Ebi mienemi',
    afternoon: 'Ebi mien seimi',
    evening: 'Ebi mien koromo',
    emoji: '🌊',
    quote: {
      text: 'Beni oyinbo kiri timi ye ye.',
      translation: 'The one who knows the river never drowns.',
      author: 'Ijaw Proverb',
    },
  },
]

function formatSessionDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export default function StaffWelcomeBanner({
  profile,
  stats,
  termInfo,
}: StaffWelcomeBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [langIndex, setLangIndex] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Session timer + clock
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

  // Respect reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Language rotator (paused if reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return
    const rotator = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % NIGERIAN_LANGUAGES.length)
    }, 6000)
    return () => clearInterval(rotator)
  }, [prefersReducedMotion])

  // Clear session only on explicit staff logout (not every refresh)
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem(STORAGE_KEY)
      setSessionStart(null)
    }
    window.addEventListener('staff-logout', handleLogout)
    return () => window.removeEventListener('staff-logout', handleLogout)
  }, [])

  const activeLang = NIGERIAN_LANGUAGES[langIndex]

  const currentGreeting = useMemo(() => {
    if (!currentTime) {
      return { phrase: 'Welcome', language: 'English', emoji: '👋', flag: '🇳🇬' }
    }
    const hour = currentTime.getHours()
    let phrase = activeLang.morning
    if (hour >= 12 && hour < 17) phrase = activeLang.afternoon
    if (hour >= 17) phrase = activeLang.evening
    return {
      phrase,
      language: activeLang.language,
      flag: activeLang.flag,
      emoji: activeLang.emoji,
    }
  }, [currentTime, activeLang])

  const subtitle = useMemo(() => {
    if (!currentTime) return 'Welcome back.'
    const hour = currentTime.getHours()
    if (hour < 12) return 'Ready to inspire your students today?'
    if (hour < 17) return 'Keep up the great work with your classes.'
    if (hour < 21) return 'Wrap up grading and plan for tomorrow.'
    return 'Rest well — your students need you sharp tomorrow.'
  }, [currentTime])

  // Staff names are typically "First Last" (unlike student SURNAME FIRST)
  const firstName = (profile?.full_name || profile?.name || 'Teacher').trim().split(/\s+/)[0]

  const getInitials = (): string => {
    const fullName = profile?.full_name || profile?.name || ''
    if (!fullName) return 'ST'
    const names = fullName.trim().split(/\s+/)
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : fullName.slice(0, 2).toUpperCase()
  }

  const formattedDate = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [currentTime])

  const formattedTime = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [currentTime])

  const sessionLabel = useMemo(() => {
    if (!currentTime || !sessionStart) return 'Session 0s'
    const totalSeconds = Math.max(
      0,
      Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000)
    )
    return `Session ${formatSessionDuration(totalSeconds)}`
  }, [currentTime, sessionStart])

  const pendingGrading = stats?.pendingGrading || 0
  const publishedExams = stats?.publishedExams || 0
  const activeStudents = stats?.activeStudents || stats?.totalStudents || 0
  const averagePerformance = stats?.averagePerformance || 0
  const hasPerformance = averagePerformance > 0

  const weekDisplay =
    termInfo?.displayWeek ||
    (termInfo ? `Week ${termInfo.currentWeek}/${termInfo.totalWeeks}` : '')

  const roleDisplay =
    profile?.role === 'admin'
      ? 'Administrator'
      : profile?.role === 'staff' || profile?.role === 'teacher'
        ? 'Teacher'
        : profile?.role || 'Staff'

  const avatarUrl = profile?.photo_url || profile?.avatar_url || undefined

  const cycleLanguage = () => {
    setLangIndex((prev) => (prev + 1) % NIGERIAN_LANGUAGES.length)
  }

  if (!mounted || !currentTime) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl mb-6 sm:mb-8 border border-slate-800">
        <div className="h-[260px] sm:h-[300px] animate-pulse bg-white/5 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 sm:p-5 md:p-6 lg:p-8 text-white shadow-2xl mb-6 sm:mb-8 border border-slate-800"
      suppressHydrationWarning
    >
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div className="flex-1 w-full min-w-0">
          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <span className="text-[11px] sm:text-xs font-medium bg-white/10 px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-sm text-slate-200 border border-white/10">
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium bg-blue-500/10 px-2.5 sm:px-3 py-1 rounded-full text-blue-300 border border-blue-500/20">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              {formattedTime}
            </span>
            {/* Labeled — no longer looks like a second clock */}
            <span
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium bg-white/5 px-2.5 sm:px-3 py-1 rounded-full text-indigo-300 border border-white/5"
              title="How long you've been in this session"
            >
              <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              {sessionLabel}
            </span>
            {weekDisplay && (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium bg-amber-500/10 px-2.5 sm:px-3 py-1 rounded-full text-amber-300 border border-amber-500/20">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {weekDisplay}
              </span>
            )}
          </div>

          {/* Greeting + mobile avatar — fixed min-height kills layout jump */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1 min-h-[56px] sm:min-h-[64px] flex flex-col justify-center">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={langIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center flex-wrap gap-2"
                  aria-live="polite"
                >
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
                    <span>{currentGreeting.phrase}</span>,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-200">
                      {firstName}
                    </span>
                    {/* Smaller emoji — no bounce (was causing visual noise) */}
                    <span className="ml-1.5 inline-block text-lg sm:text-xl">
                      {currentGreeting.emoji}
                    </span>
                  </h1>

                  <button
                    type="button"
                    onClick={cycleLanguage}
                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md hover:bg-blue-500/20 transition-colors shrink-0"
                    title="Tap to switch language"
                  >
                    <Globe2 className="h-3 w-3" />
                    {currentGreeting.language}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile avatar */}
            <div className="sm:hidden shrink-0 pt-1">
              <Avatar className="h-11 w-11 ring-2 ring-blue-400/30 shadow-lg">
                {avatarUrl && !avatarError ? (
                  <AvatarImage
                    src={avatarUrl}
                    alt={firstName}
                    onError={() => setAvatarError(true)}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white text-sm font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-3 max-w-md">
            {subtitle}
          </p>

          {/* Quote — fixed min-height prevents jump on long/short proverbs */}
          <div className="min-h-[52px] sm:min-h-[64px] flex items-center mb-4">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`quote-${langIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2 max-w-2xl w-full"
              >
                <Quote className="h-3.5 w-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-200 text-xs sm:text-sm italic leading-relaxed font-medium">
                    &ldquo;{activeLang.quote.text}&rdquo;
                  </p>
                  {activeLang.quote.translation && (
                    <p className="hidden sm:block text-[10px] sm:text-xs text-slate-400 mt-0.5 italic">
                      &rarr; {activeLang.quote.translation}
                    </p>
                  )}
                  <p className="text-[10px] text-amber-300/60 mt-0.5 font-medium">
                    — {activeLang.quote.author}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Role badges */}
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

        {/* Desktop avatar — online pip removed for a cleaner look */}
        <div className="relative group hidden sm:block shrink-0 self-center">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-40 group-hover:opacity-80 blur-md transition duration-300" />
          <div className="relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 ring-4 ring-slate-800/80 shadow-2xl transition-transform duration-300 group-hover:scale-105">
              {avatarUrl && !avatarError ? (
                <AvatarImage
                  src={avatarUrl}
                  alt={firstName}
                  onError={() => setAvatarError(true)}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white text-2xl sm:text-3xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Pending grading alert */}
      {pendingGrading > 0 && (
        <div className="relative z-10 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
          <Flame className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <p className="text-xs sm:text-sm text-amber-200 font-medium">
              You have {pendingGrading} submission{pendingGrading !== 1 ? 's' : ''}{' '}
              awaiting grading.
            </p>
            <p className="text-[10px] sm:text-xs text-amber-300/60">
              Take a moment to review and submit student grades.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="relative z-10 mt-5 sm:mt-6 pt-4 border-t border-slate-800/80">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Published exams */}
          <div className="group cursor-default bg-white/5 border border-slate-800 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p
                className={cn(
                  'text-xl sm:text-2xl md:text-3xl font-bold transition-colors',
                  publishedExams > 0
                    ? 'text-white group-hover:text-blue-300'
                    : 'text-slate-500'
                )}
              >
                {publishedExams}
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-400 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Published Exams</p>
            {publishedExams === 0 && (
              <p className="text-[10px] text-slate-500 mt-0.5">None published yet</p>
            )}
          </div>

          {/* Active students */}
          <div className="group cursor-default bg-white/5 border border-slate-800 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p
                className={cn(
                  'text-xl sm:text-2xl md:text-3xl font-bold transition-colors',
                  activeStudents > 0
                    ? 'text-white group-hover:text-blue-300'
                    : 'text-slate-500'
                )}
              >
                {activeStudents}
              </p>
              <Users className="h-5 w-5 text-blue-400 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Active Students</p>
            {activeStudents === 0 && (
              <p className="text-[10px] text-slate-500 mt-0.5">No students linked</p>
            )}
          </div>

          {/* Pending grading — emphasize when > 0 */}
          <div
            className={cn(
              'group cursor-default bg-white/5 border rounded-xl p-3 hover:bg-white/10 transition-colors',
              pendingGrading > 0 ? 'border-amber-500/30' : 'border-slate-800'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <p
                className={cn(
                  'text-xl sm:text-2xl md:text-3xl font-bold transition-colors',
                  pendingGrading > 0
                    ? 'text-amber-300'
                    : 'text-slate-500 group-hover:text-blue-300'
                )}
              >
                {pendingGrading}
              </p>
              {pendingGrading > 0 ? (
                <Flame className="h-5 w-5 text-amber-400 opacity-80 animate-pulse shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-slate-500 opacity-80 shrink-0" />
              )}
            </div>
            <p
              className={cn(
                'text-xs',
                pendingGrading > 0 ? 'text-amber-400' : 'text-slate-400'
              )}
            >
              Pending Grading
            </p>
            {pendingGrading === 0 && (
              <p className="text-[10px] text-slate-500 mt-0.5">All caught up</p>
            )}
          </div>

          {/* Avg performance */}
          <div
            className={cn(
              'group cursor-default bg-white/5 border rounded-xl p-3 hover:bg-white/10 transition-colors',
              hasPerformance ? 'border-amber-500/20' : 'border-slate-800'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <p
                className={cn(
                  'text-xl sm:text-2xl md:text-3xl font-bold transition-colors',
                  hasPerformance
                    ? 'text-white group-hover:text-blue-300'
                    : 'text-slate-500'
                )}
              >
                {hasPerformance ? `${averagePerformance}%` : '—'}
              </p>
              <Award className="h-5 w-5 text-amber-300 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Avg Performance</p>
            {!hasPerformance && (
              <p className="text-[10px] text-slate-500 mt-0.5">After first results</p>
            )}
          </div>
        </div>

        {/* Term week progress */}
        {termInfo && termInfo.currentWeek > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{termInfo.termName} Progress</span>
              <span className="text-xs text-slate-300">{weekDisplay}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, termInfo.weekProgress))}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Term Progress</span>
            <span className="text-[11px] text-slate-500">No active term data</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}