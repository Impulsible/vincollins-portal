/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GraduationCap, Award, TrendingUp, Clock, CheckCircle2, BookOpen,
  AlertCircle, Timer, Quote, Globe2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  onRefresh?: () => void
}

const STORAGE_KEY = 'student_session_start'

const getSubjectCountByClassLevel = (className: string): number => {
  if (!className) return 0
  const normalizedClass = className.trim().toUpperCase().replace(/\s/g, '')
  if (normalizedClass.includes('JSS1') || normalizedClass.includes('JSS2') || normalizedClass.includes('JSS3')) return 17
  if (normalizedClass.includes('SS1') || normalizedClass.includes('SS2') || normalizedClass.includes('SS3')) return 10
  return 0
}

interface LanguagePack {
  language: string
  flag: string
  morning: string
  afternoon: string
  evening: string
  emoji: string
  quote: { text: string; translation: string; author: string }
}

const NIGERIAN_LANGUAGES: LanguagePack[] = [
  {
    language: 'English', flag: '🇳🇬',
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', emoji: '🌅',
    quote: { text: 'The beautiful thing about learning is that no one can take it away from {name}.', translation: '', author: 'B.B. King' }
  },
  {
    language: 'Yoruba', flag: '🪘',
    morning: 'Ẹ káàrọ̀', afternoon: 'Ẹ káàsán', evening: 'Ẹ káalẹ́', emoji: '🙌🏾',
    quote: { text: 'Ìmọ̀ bí kò bá kà, á dẹ rẹ́rẹ́ fún {name}.', translation: 'Knowledge, if not put to work or studied, diminishes.', author: 'Yoruba Wisdom' }
  },
  {
    language: 'Igbo', flag: '🥁',
    morning: 'Ụtụtụ ọma', afternoon: 'Ehihie ọma', evening: 'Mgbede ọma', emoji: '☀️',
    quote: { text: 'Onye ajụjụ anaghị efu ụzọ, {name}.', translation: 'He who asks questions never gets lost.', author: 'Igbo Proverb' }
  },
  {
    language: 'Hausa', flag: '🕌',
    morning: 'Ina kwana', afternoon: 'Barka da rana', evening: 'Barka da yamma', emoji: '🌙',
    quote: { text: 'Neman ilimi daga kogi yake, ya {name}.', translation: 'Seeking knowledge is like drawing from an endless ocean.', author: 'Hausa Proverb' }
  },
  {
    language: 'Pidgin', flag: '🤝🏻',
    morning: 'How body this morning?', afternoon: 'How afternoon dey go?', evening: 'How evening dey run?', emoji: '🤜🏻',
    quote: { text: 'School na light, ignorance na dark. Book no dey lie, {name}.', translation: 'Education is light, ignorance is darkness. Hard study never fails.', author: 'Nigerian Student Proverb' }
  },
  {
    language: 'Efik/Ibibio', flag: '🌴',
    morning: 'Mmesiere', afternoon: 'Idem mfo?', evening: 'Amesiere', emoji: '🌴',
    quote: { text: 'Ifiọk ekama kpukpru ntiñe uwem fọ, {name}.', translation: 'Wisdom and knowledge hold up all the pillars of your life.', author: 'Efik Proverb' }
  },
  {
    language: 'Edo (Bini)', flag: '👑',
    morning: 'Vbènyà ówiè', afternoon: 'Kóyo ùghọ̀nvbé', evening: 'Kóyo ótá', emoji: '👑',
    quote: { text: 'Uhùmwu nọ rhiẹna ọ mwan a na gha zẹ, {name}.', translation: 'It is a prepared mind that receives wisdom and shines.', author: 'Edo Proverb' }
  },
  {
    language: 'Fulfulde (Fulani)', flag: '🐄',
    morning: 'Jam waali', afternoon: 'Jam weeti', evening: 'Jam hiiri', emoji: '🪔',
    quote: { text: 'Ganndal ko gural joomum, ya {name}.', translation: 'Knowledge is the shield of its owner.', author: 'Fulfulde Proverb' }
  },
  {
    language: 'Tiv', flag: '🌾',
    morning: 'M sugh u iyange', afternoon: 'M sugh u iyange na mimi', evening: 'M sugh u ityôgh', emoji: '🌾',
    quote: { text: 'Fankwagh ngu a mgbian ga, ka i kpa gbilin ga fán gba {name}.', translation: 'Wisdom has no sibling; it is earned through dedication.', author: 'Tiv Proverb' }
  },
  {
    language: 'Nupe', flag: '🎋',
    morning: 'A gaba o', afternoon: 'A chenchin', evening: 'A kyeta o', emoji: '🎋',
    quote: { text: 'Iye chin kpan gbaragbata e gba {name}.', translation: 'Knowledge lights up the dark paths of your future.', author: 'Nupe Proverb' }
  },
  {
    language: 'Kanuri', flag: '🐫',
    morning: 'Ndaro', afternoon: 'Ndaro kaure', evening: 'Ndaro bariga', emoji: '🐫',
    quote: { text: 'Karanganyi daji dunya ye nzeroro, {name}.', translation: 'Your studies will pave a bright highway to your world.', author: 'Kanuri Proverb' }
  },
  {
    language: 'Ijaw', flag: '🛶',
    morning: 'Ebi mienemi', afternoon: 'Ebi mien seimi', evening: 'Ebi mien koromo', emoji: '🌊',
    quote: { text: 'Gbori diri gho gbele, gbori nengi wari, {name}.', translation: 'A child who studies books builds a house of honor.', author: 'Ijaw Proverb' }
  }
]

const getFirstName = (fullName: string): string => {
  if (!fullName) return 'Student'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) return parts[1]
  return parts[0] || 'Student'
}

const isDepartmentRedundant = (className: string, department?: string) => {
  if (!department || department === 'General') return true
  const c = className.trim().toLowerCase()
  const d = department.trim().toLowerCase()
  return c.includes(d)
}

async function getGradeFromDB(percentage: number): Promise<{ grade: string; color: string; description: string }> {
  try {
    const { data, error } = await supabase
      .from('grade_system')
      .select('grade, color, description')
      .lte('min_score', percentage)
      .gte('max_score', percentage)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      if (percentage >= 80) return { grade: 'A', color: 'text-emerald-400', description: 'Excellent' }
      if (percentage >= 70) return { grade: 'B', color: 'text-blue-400', description: 'Very Good' }
      if (percentage >= 60) return { grade: 'C', color: 'text-amber-400', description: 'Good' }
      if (percentage >= 50) return { grade: 'P', color: 'text-purple-400', description: 'Pass' }
      return { grade: 'F', color: 'text-red-400', description: 'Fail' }
    }

    return {
      grade: data.grade,
      color: data.color || 'text-slate-400',
      description: data.description || ''
    }
  } catch (error) {
    console.error('Error fetching grade:', error)
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-400', description: 'Excellent' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-400', description: 'Very Good' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-400', description: 'Good' }
    if (percentage >= 50) return { grade: 'P', color: 'text-purple-400', description: 'Pass' }
    return { grade: 'F', color: 'text-red-400', description: 'Fail' }
  }
}

async function getSubjectCountFromDB(className: string): Promise<number> {
  if (!className) return 0
  try {
    const classCount = getSubjectCountByClassLevel(className)
    if (classCount > 0) return classCount

    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('subject')
      .eq('class', className)
      .not('subject', 'is', null)

    if (!examsError && exams && exams.length > 0) {
      const uniqueSubjects = new Set(exams.map((e: any) => e.subject))
      if (uniqueSubjects.size > 0) return uniqueSubjects.size
    }
    return 0
  } catch (error) {
    console.error('Error fetching subject count:', error)
    return getSubjectCountByClassLevel(className)
  }
}

function formatSessionDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function StudentWelcomeBanner({ profile, stats, onRefresh }: StudentWelcomeBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [liveStats, setLiveStats] = useState<StudentStats | null>(stats)
  const [subjectCount, setSubjectCount] = useState<number>(0)
  const [langIndex, setLangIndex] = useState<number>(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const firstName = getFirstName(profile?.full_name || 'Student')
  const studentClass = profile?.class || 'Not Assigned'
  const studentDepartment = profile?.department || 'General'
  const showDepartment = !isDepartmentRedundant(studentClass, studentDepartment)

  useEffect(() => { setLiveStats(stats) }, [stats])

  useEffect(() => {
    if (profile?.class) {
      getSubjectCountFromDB(profile.class).then(setSubjectCount).catch(() => {
        setSubjectCount(getSubjectCountByClassLevel(profile.class))
      })
    }
  }, [profile?.class])

  // Realtime stats listener
  useEffect(() => {
    if (!profile?.id) return

    const attemptsChannel = supabase
      .channel(`student-stats-attempts-${profile.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'exam_attempts',
        filter: `student_id=eq.${profile.id}`
      }, () => { onRefresh?.() })
      .subscribe()

    const caScoresChannel = supabase
      .channel(`student-stats-ca-${profile.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'ca_scores',
        filter: `student_id=eq.${profile.id}`
      }, () => { onRefresh?.() })
      .subscribe()

    const reportCardsChannel = supabase
      .channel(`student-stats-rc-${profile.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'report_cards',
        filter: `student_id=eq.${profile.id}`
      }, () => { onRefresh?.() })
      .subscribe()

    return () => {
      attemptsChannel.unsubscribe()
      caScoresChannel.unsubscribe()
      reportCardsChannel.unsubscribe()
    }
  }, [profile?.id, onRefresh])

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
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    const rotator = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % NIGERIAN_LANGUAGES.length)
    }, 6000)
    return () => clearInterval(rotator)
  }, [prefersReducedMotion])

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem(STORAGE_KEY)
      setSessionStart(null)
    }
    window.addEventListener('student-logout', handleLogout)
    return () => window.removeEventListener('student-logout', handleLogout)
  }, [])

  const greeting = useMemo(() => {
    if (!currentTime) return { text: 'Welcome', emoji: '👋', message: 'Welcome!' }
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', message: 'Ready to learn something new today?' }
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', message: 'Keep pushing forward!' }
    if (hour < 21) return { text: 'Good Evening', emoji: '🌙', message: 'Time to review what you learned!' }
    return { text: 'Good Night', emoji: '🌙', message: 'Rest well and prepare for tomorrow!' }
  }, [currentTime])

  const currentGreeting = useMemo(() => {
    if (!currentTime) {
      return { phrase: 'Welcome', language: 'English', emoji: '👋', quote: { text: '', translation: '', author: '' } }
    }
    const hour = currentTime.getHours()
    const activeLang = NIGERIAN_LANGUAGES[langIndex]
    let phrase = activeLang.morning
    if (hour >= 12 && hour < 17) phrase = activeLang.afternoon
    if (hour >= 17) phrase = activeLang.evening
    return {
      phrase,
      language: activeLang.language,
      flag: activeLang.flag,
      emoji: activeLang.emoji,
      quote: {
        text: activeLang.quote.text.replace(/\{name\}/g, firstName),
        translation: activeLang.quote.translation,
        author: activeLang.quote.author
      }
    }
  }, [currentTime, langIndex, firstName])

  const formattedDate = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }, [currentTime])

  const formattedTime = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }, [currentTime])

  const sessionLabel = useMemo(() => {
    if (!currentTime || !sessionStart) return 'Session 0s'
    const totalSeconds = Math.max(0, Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000))
    return `Session ${formatSessionDuration(totalSeconds)}`
  }, [currentTime, sessionStart])

  const totalSubjects = liveStats?.totalSubjects || subjectCount || getSubjectCountByClassLevel(studentClass) || 0
  const completedExams = liveStats?.completedExams ?? 0
  const averageScore = liveStats?.averageScore ?? 0
  const availableExams = liveStats?.availableExams ?? 0
  const pendingTheoryCount = liveStats?.pendingTheoryCount ?? 0

  const [gradeInfo, setGradeInfo] = useState<{ grade: string; color: string; description: string }>({
    grade: 'N/A', color: 'text-slate-400', description: ''
  })

  useEffect(() => {
    if (liveStats?.currentGrade && liveStats?.gradeColor) {
      setGradeInfo({ grade: liveStats.currentGrade, color: liveStats.gradeColor, description: '' })
    } else if (averageScore > 0) {
      getGradeFromDB(averageScore).then(setGradeInfo).catch(console.error)
    } else {
      setGradeInfo({ grade: 'N/A', color: 'text-slate-400', description: '' })
    }
  }, [liveStats?.currentGrade, liveStats?.gradeColor, averageScore])

  const showGrade = completedExams > 0 && gradeInfo.grade !== 'N/A'
  const completionPercentage = totalSubjects > 0 ? Math.round((completedExams / totalSubjects) * 100) : 0
  const hasProgress = completedExams > 0
  const avatarLetter = firstName.charAt(0).toUpperCase()
  const avatarUrl = profile?.photo_url || undefined

  const cycleLanguage = () => {
    setLangIndex((prev) => (prev + 1) % NIGERIAN_LANGUAGES.length)
  }

  if (!mounted) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-5 sm:p-6 md:p-8 shadow-2xl mb-8 border border-slate-700/50 dark:border-slate-800">
        <div className="h-[260px] sm:h-[300px] animate-pulse bg-white/5 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 md:p-8 text-white shadow-2xl mb-8 border border-slate-700/40 dark:border-slate-800/80"
      suppressHydrationWarning
    >
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-6">
        <div className="flex-1 w-full min-w-0">
          
          {/* Top Meta Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
            <span className="text-[11px] sm:text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm text-slate-200 border border-white/10">
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full text-emerald-300 border border-emerald-500/20">
              <Clock className="h-3 w-3 shrink-0" />
              {formattedTime}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-[11px] sm:text-xs bg-white/5 px-2.5 py-1 rounded-full text-indigo-300 border border-white/5">
              <Timer className="h-3 w-3 shrink-0" />
              {sessionLabel}
            </span>
          </div>

          {/* Heading Container with FIXED MIN-HEIGHT to prevent layout jumps */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1 min-h-[56px] sm:min-h-[64px] flex flex-col justify-center relative">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={langIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center flex-wrap gap-2"
                >
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm leading-snug">
                    <span>{currentGreeting.phrase}</span>,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                      {firstName}
                    </span>
                    <span className="ml-2 inline-block text-lg sm:text-xl">{currentGreeting.emoji}</span>
                  </h1>

                  <button
                    type="button"
                    onClick={cycleLanguage}
                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md hover:bg-emerald-500/20 transition-colors shrink-0"
                    title="Tap to switch language"
                  >
                    <Globe2 className="h-3 w-3" />
                    {currentGreeting.language}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile Avatar */}
            <div className="sm:hidden shrink-0 pt-1">
              <Avatar className="h-11 w-11 ring-2 ring-emerald-400/30 shadow-lg">
                {avatarUrl && !avatarError ? (
                  <AvatarImage src={avatarUrl} alt={firstName} onError={() => setAvatarError(true)} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-sm font-bold">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-3 max-w-md">
            {greeting.message}
          </p>

          {/* Quote Container with FIXED MIN-HEIGHT to prevent layout jumps */}
          <div className="min-h-[52px] sm:min-h-[60px] flex items-center mb-4">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`student-quote-${langIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2 max-w-xl w-full"
              >
                <Quote className="h-3.5 w-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-200 text-xs sm:text-sm italic leading-relaxed font-medium">
                    &ldquo;{currentGreeting.quote.text}&rdquo;
                  </p>
                  {currentGreeting.quote.translation && (
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 italic">
                      &rarr; {currentGreeting.quote.translation}
                    </p>
                  )}
                  <p className="text-[10px] text-amber-300/60 mt-0.5 font-medium">
                    — {currentGreeting.quote.author}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-slate-800/80 text-slate-200 border border-slate-700 text-xs px-2.5 py-1">
              <GraduationCap className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              {studentClass}
            </Badge>
            {showDepartment && (
              <Badge className="bg-slate-800/80 text-slate-200 border border-slate-700 text-xs px-2.5 py-1">
                <BookOpen className="h-3.5 w-3.5 mr-1 text-teal-400" />
                {studentDepartment}
              </Badge>
            )}
            <Badge className="bg-slate-800/80 text-slate-200 border border-slate-700 text-xs px-2.5 py-1">
              <Award className="h-3.5 w-3.5 mr-1 text-amber-400" />
              {totalSubjects} Subjects
            </Badge>
          </div>
        </div>

        {/* Desktop Avatar */}
        <div className="relative group shrink-0 hidden sm:block self-center">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-50 group-hover:opacity-90 blur-md transition duration-300" />
          <div className="relative">
            <Avatar className="h-20 w-20 md:h-28 md:w-28 ring-4 ring-slate-800/80 shadow-2xl transition-transform duration-300 group-hover:scale-105">
              {avatarUrl && !avatarError ? (
                <AvatarImage src={avatarUrl} alt={firstName} onError={() => setAvatarError(true)} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-2xl md:text-3xl font-bold">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Pending Theory Notice */}
      {pendingTheoryCount > 0 && (
        <div className="relative z-10 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-sm text-amber-200 font-medium">
                {pendingTheoryCount} exam{pendingTheoryCount !== 1 ? 's' : ''} pending theory grading
              </p>
              <p className="text-xs text-amber-300/70">
                Your current score includes CA and objective marks. Theory answers will increase your final score once graded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-700/60">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          <div className="group cursor-default bg-white/5 border border-slate-700/50 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className={cn("text-2xl md:text-3xl font-bold transition-colors", availableExams > 0 ? "text-white group-hover:text-emerald-300" : "text-slate-500")}>
                {availableExams}
              </p>
              <Clock className="h-5 w-5 text-blue-400 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Available Exams</p>
            {availableExams === 0 && <p className="text-[10px] text-slate-500 mt-0.5">None open yet</p>}
            {availableExams > 0 && <p className="text-[10px] text-blue-300/80 mt-0.5">Ready to take</p>}
          </div>

          <div className="group cursor-default bg-white/5 border border-slate-700/50 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className={cn("text-2xl md:text-3xl font-bold transition-colors", completedExams > 0 ? "text-white group-hover:text-emerald-300" : "text-slate-500")}>
                {completedExams}
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-400 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Completed</p>
            {completedExams > 0 ? (
              <p className="text-[10px] text-emerald-400/80 mt-0.5">{completionPercentage}% of term</p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-0.5">No exams taken</p>
            )}
          </div>

          <div className={cn("group cursor-default bg-white/5 border rounded-xl p-3 hover:bg-white/10 transition-colors", hasProgress ? "border-teal-500/30" : "border-slate-700/50")}>
            <div className="flex items-center justify-between mb-1">
              <p className={cn("text-2xl md:text-3xl font-bold transition-colors", hasProgress ? "text-white group-hover:text-emerald-300" : "text-slate-500")}>
                {hasProgress ? `${averageScore.toFixed(1)}%` : '—'}
              </p>
              <TrendingUp className="h-5 w-5 text-teal-400 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Average Score</p>
            {!hasProgress && <p className="text-[10px] text-slate-500 mt-0.5">After first result</p>}
          </div>

          <div className={cn("group cursor-default bg-white/5 border rounded-xl p-3 hover:bg-white/10 transition-colors", showGrade ? "border-amber-500/30" : "border-slate-700/50")}>
            <div className="flex items-center justify-between mb-1">
              {showGrade ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <p className={cn("text-2xl md:text-3xl font-bold", gradeInfo.color)}>{gradeInfo.grade}</p>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{averageScore.toFixed(2)}% average {gradeInfo.description ? `– ${gradeInfo.description}` : ''}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-slate-500">—</p>
              )}
              <Award className="h-5 w-5 text-amber-400 opacity-80 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">Current Grade</p>
            {!showGrade && <p className="text-[10px] text-slate-500 mt-0.5">After first result</p>}
          </div>
        </div>

        {/* Progress Bar */}
        {hasProgress ? (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Term Subject Progress</span>
              <span className="text-xs text-slate-300">{completedExams}/{totalSubjects}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Term Subject Progress</span>
            <span className="text-[11px] text-slate-500">Not started · {totalSubjects} subjects this term</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}