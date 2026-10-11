/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, Calendar, Clock, Timer, Quote,
  Shield, Activity, TrendingUp, Zap, Sun, Moon, Sunset, Sunrise,
  GraduationCap, Globe2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminProfile {
  id?: string
  full_name?: string
  email?: string
  photo_url?: string
}

interface TermInfo {
  term: string
  session: string
}

interface WelcomeBannerProps {
  adminProfile: AdminProfile | null
  activeTab?: string
  termInfo?: TermInfo | null
}

const STORAGE_KEY = 'admin_session_start'

const bannerIsolationStyle = {
  WebkitTransform: 'translateZ(0)' as const,
  transform: 'translateZ(0)' as const,
  contain: 'paint' as const,
  isolation: 'isolate' as const,
}

// ─── Nigerian Languages Leadership & Vision Packs ───
interface LanguagePack {
  language: string
  flag: string
  morning: string
  afternoon: string
  evening: string
  night: string
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
    night: 'Good night',
    emoji: '🌅',
    quote: {
      text: 'Leadership and learning are indispensable to each other, {name}.',
      translation: '',
      author: 'John F. Kennedy'
    }
  },
  {
    language: 'Yoruba',
    flag: '🪘',
    morning: 'Ẹ káàrọ̀',
    afternoon: 'Ẹ káàsán',
    evening: 'Ẹ káalẹ́',
    night: 'Ẹ káalẹ́ jẹ́jẹ́',
    emoji: '🙌🏾',
    quote: {
      text: 'Ọwọ́ alápá ni yóò tún àjọ yìí ṣe fún {name}.',
      translation: 'It is the hands of the committed builder that will repair the community.',
      author: 'Yoruba Proverb'
    }
  },
  {
    language: 'Igbo',
    flag: '🥁',
    morning: 'Ụtụtụ ọma',
    afternoon: 'Ehihie ọma',
    evening: 'Mgbede ọma',
    night: 'Abalị ọma',
    emoji: '☀️',
    quote: {
      text: 'Onye ndu nwere anya abụọ na-ahụ ụzọ nke ọma, {name}.',
      translation: 'A visionary leader possesses two sets of eyes to see far ahead.',
      author: 'Igbo Proverb'
    }
  },
  {
    language: 'Hausa',
    flag: '🕌',
    morning: 'Ina kwana',
    afternoon: 'Barka da rana',
    evening: 'Barka da yamma',
    night: 'Barka da dare',
    emoji: '🌙',
    quote: {
      text: 'Gyaran kaza baya hana ta kwana, {name}.',
      translation: 'A good manager meticulously cares for the details of their shelter.',
      author: 'Hausa Proverb'
    }
  },
  {
    language: 'Pidgin',
    flag: '🤝🏾',
    morning: 'How body this morning?',
    afternoon: 'How afternoon dey go?',
    evening: 'How evening dey run?',
    night: 'How night dey look?',
    emoji: '🤜🏾',
    quote: {
      text: 'Better leader na the one wey show the road, and clear path for others, {name}.',
      translation: 'A true leader guides the community and creates pathways for development.',
      author: 'Nigerian Proverb'
    }
  },
  {
    language: 'Efik/Ibibio',
    flag: '🌴',
    morning: 'Mmesiere',
    afternoon: 'Idem mfo?',
    evening: 'Amesiere',
    night: 'De mfon',
    emoji: '🌴',
    quote: {
      text: 'Ọniọñ owo isisatke usuñ idemesie, {name}.',
      translation: 'A wise manager values counsel and never navigates alone.',
      author: 'Efik Proverb'
    }
  },
  {
    language: 'Edo (Bini)',
    flag: '👑',
    morning: 'Vbènyà ówiè',
    afternoon: 'Kóyo ùghọ̀nvbé',
    evening: 'Kóyo ótá',
    night: 'Kóyo vbe okhie',
    emoji: '👑',
    quote: {
      text: 'Aza ne ọ gbe gha sẹvbe uzo na ya rriọn, {name}.',
      translation: 'The vault of wisdom is unlocked only through dedicated custodianship.',
      author: 'Edo Proverb'
    }
  },
  {
    language: 'Fulfulde (Fulani)',
    flag: '🐄',
    morning: 'Jam waali',
    afternoon: 'Jam weeti',
    evening: 'Jam hiiri',
    night: 'Jam jemma',
    emoji: '🪔',
    quote: {
      text: 'Horende danyi hoorende woni ko haani, {name}.',
      translation: 'A calm mind is the bedrock of strategic administration.',
      author: 'Fulfulde Proverb'
    }
  },
  {
    language: 'Tiv',
    flag: '🌾',
    morning: 'M sugh u iyange',
    afternoon: 'M sugh u iyange na mimi',
    evening: 'M sugh u ityôgh',
    night: 'M sugh u tugh',
    emoji: '🌾',
    quote: {
      text: 'Kwagh u dedoo gba gbe u kure, {name}.',
      translation: 'Excellent administrative work requires patience to bear fruit.',
      author: 'Tiv Proverb'
    }
  },
  {
    language: 'Nupe',
    flag: '🎋',
    morning: 'A gaba o',
    afternoon: 'A chenchin',
    evening: 'A kyeta o',
    night: 'A lo tsu',
    emoji: '🎋',
    quote: {
      text: 'Agbara kpata zhi efo nyan kpere, {name}.',
      translation: 'True oversight demands infinite patience and careful calculation.',
      author: 'Nupe Proverb'
    }
  },
  {
    language: 'Kanuri',
    flag: '🐫',
    morning: 'Ndaro',
    afternoon: 'Ndaro kaure',
    evening: 'Ndaro bariga',
    night: 'Ndaro dinis',
    emoji: '🐫',
    quote: {
      text: 'Karanganyi ye daji nzeroro dinya, {name}.',
      translation: 'Oversight ensures that learning remains a beacon for the world.',
      author: 'Kanuri Proverb'
    }
  },
  {
    language: 'Ijaw',
    flag: '🚣🏾',
    morning: 'Ebi mienemi',
    afternoon: 'Ebi mien seimi',
    evening: 'Ebi mien koromo',
    night: 'Ebi mien jemma',
    emoji: '🌊',
    quote: {
      text: 'Aru na-eme keme e-gbele timi ye ye fọ, {name}.',
      translation: 'The pilot who knows the currents safely guides the entire ship.',
      author: 'Ijaw Proverb'
    }
  }
]

const getGreetingIcon = (hour: number) => {
  if (hour >= 5 && hour < 12) return Sunrise
  if (hour >= 12 && hour < 17) return Sun
  if (hour >= 17 && hour < 21) return Sunset
  return Moon
}

const format12Hour = (date: Date, withSeconds = false): { time: string; period: string } => {
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const hoursStr = String(hours).padStart(2, '0')
  const time = withSeconds ? `${hoursStr}:${minutes}:${seconds}` : `${hoursStr}:${minutes}`
  return { time, period }
}

const formatTermName = (term: string): string => {
  if (!term) return 'Current Term'
  const cleaned = String(term).toLowerCase().trim()

  if (cleaned.includes('third') || cleaned.includes('3rd') || cleaned === '3' || cleaned === 'three') return 'Third Term'
  if (cleaned.includes('second') || cleaned.includes('2nd') || cleaned === '2' || cleaned === 'two') return 'Second Term'
  if (cleaned.includes('first') || cleaned.includes('1st') || cleaned === '1' || cleaned === 'one') return 'First Term'

  return term.split(/[_\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function WelcomeBanner({ adminProfile, activeTab = 'dashboard', termInfo }: WelcomeBannerProps) {
  const [now, setNow] = useState<Date>(() => new Date())
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [langIndex, setLangIndex] = useState<number>(0)

  // 1. Calculate base identity variables
  const firstName = adminProfile?.full_name?.split(' ')[0] || 'Admin'

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSessionStart(new Date(stored))
    } else {
      const start = new Date()
      localStorage.setItem(STORAGE_KEY, start.toISOString())
      setSessionStart(start)
    }
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Rotate through 12 languages every 6 seconds
  useEffect(() => {
    const rotator = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % NIGERIAN_LANGUAGES.length)
    }, 6000)
    return () => clearInterval(rotator)
  }, [])

  useEffect(() => {
    const handleClear = () => localStorage.removeItem(STORAGE_KEY)
    window.addEventListener('beforeunload', handleClear)
    return () => window.removeEventListener('beforeunload', handleClear)
  }, [])

  // 2. Synced Multi-lingual Quote and Phrase matching
  const activeLang = NIGERIAN_LANGUAGES[langIndex]

  const currentGreeting = useMemo(() => {
    const hour = now.getHours()
    let phrase = activeLang.morning
    if (hour >= 12 && hour < 17) phrase = activeLang.afternoon
    if (hour >= 17 && hour < 21) phrase = activeLang.evening
    if (hour >= 21 || hour < 5) phrase = activeLang.night

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
  }, [now, activeLang, firstName])

  const greetingWord = useMemo(() => {
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [now])

  const GreetingIcon = useMemo(() => getGreetingIcon(now.getHours()), [now])
  const timeShort = useMemo(() => format12Hour(now, false), [now])
  const timeFull = useMemo(() => format12Hour(now, true), [now])

  const dateShort = useMemo(() => {
    return now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }, [now])

  const dateFull = useMemo(() => {
    return now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }, [now])

  const onlineDuration = useMemo(() => {
    if (!sessionStart) return '00:00:00'
    const diffMs = now.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [now, sessionStart])

  const onlineDurationShort = useMemo(() => {
    if (!sessionStart) return '0m'
    const diffMs = now.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }, [now, sessionStart])

  const academicInfo = useMemo(() => {
    if (termInfo?.term && termInfo?.session) {
      return {
        term: formatTermName(termInfo.term),
        session: termInfo.session,
      }
    }
    return {
      term: 'Loading...',
      session: '',
    }
  }, [termInfo])

  return (
    <div
      style={bannerIsolationStyle}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-2xl border border-slate-800/80 mb-6 sm:mb-8"
      suppressHydrationWarning
    >
      {/* Background Decorator Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-7">
        
        {/* ── Row 1: Header Badge + System Sync State ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 shrink-0">
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                Admin Portal
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="h-3 w-3 text-slate-500 shrink-0" />
                <p className="text-[10px] sm:text-xs text-slate-400 truncate font-semibold">
                  {academicInfo.term} {academicInfo.session && `· ${academicInfo.session}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* ── Row 2: Dynamic Multi-lingual Greeting ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm text-slate-400 font-medium">{greetingWord}</span>
          </div>

          {/* Languages switch container */}
          <div className="min-h-[45px] sm:min-h-[50px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={langIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center flex-wrap gap-2 sm:gap-3"
              >
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight break-words">
                  <span>{currentGreeting.phrase}</span>,{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                    {firstName}
                  </span>
                  <span className="ml-2 inline-block animate-bounce">{currentGreeting.emoji}</span>
                </h1>
                
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md self-center">
                  <Globe2 className="h-3 w-3" />
                  {currentGreeting.language}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Row 3: Admin Diagnostics Tiles ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {/* Calendar Widget */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm px-3 py-3 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Date
              </span>
            </div>
            <p className="sm:hidden text-[11px] font-bold text-white leading-tight truncate">
              {dateShort}
            </p>
            <p className="hidden sm:block text-sm font-bold text-white leading-tight truncate">
              {dateFull.split(',')[0]}
            </p>
            <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5 truncate">
              {dateFull.split(',').slice(1).join(',').trim()}
            </p>
          </div>

          {/* Time Widget */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm px-3 py-3 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Time
              </span>
            </div>
            <div className="sm:hidden flex items-baseline gap-1">
              <p className="font-mono text-[11px] font-bold text-white leading-tight">
                {timeShort.time}
              </p>
              <span className="text-[9px] font-bold text-amber-300">{timeShort.period}</span>
            </div>
            <div className="hidden sm:flex items-baseline gap-1.5">
              <p className="font-mono text-base font-bold text-white leading-tight tabular-nums">
                {timeFull.time}
              </p>
              <span className="text-xs font-bold text-amber-300">{timeFull.period}</span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5">
              Local time
            </p>
          </div>

          {/* Session Widget */}
          <div className="group relative overflow-hidden rounded-xl border border-purple-500/15 bg-purple-500/5 backdrop-blur-sm px-3 py-3 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-indigo-300/80 truncate">
                Session
              </span>
            </div>
            <p className="sm:hidden font-mono text-[11px] font-bold text-white leading-tight">
              {onlineDurationShort}
            </p>
            <p className="hidden sm:block font-mono text-base font-bold text-white leading-tight tabular-nums">
              {onlineDuration}
            </p>
            <p className="hidden sm:block text-[10px] text-indigo-300/60 mt-0.5">
              Active now
            </p>
          </div>
        </div>

        {/* ── Row 4: Desktop Operational Stats Bar ── */}
        <div className="hidden md:flex items-center justify-between gap-3 lg:gap-4 py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">System</p>
              <p className="text-xs font-bold text-white">All Systems Operational</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
              <p className="text-xs font-bold text-white">Real-time Sync Active</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Performance</p>
              <p className="text-xs font-bold text-white">Optimal Response</p>
            </div>
          </div>
        </div>

        {/* ── Mobile Operational Stats Bar ── */}
        <div className="md:hidden flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm mb-4">
          <div className="flex items-center gap-1.5 min-w-0">
            <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-semibold text-slate-200 truncate">All Systems Operational</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
          </div>
        </div>

        {/* ── Row 5: Dynamic Synced Quote Card with Translation ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`admin-quote-${langIndex}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative pt-4 border-t border-slate-800/80"
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="rounded-lg border border-purple-500/25 bg-purple-500/10 backdrop-blur-sm p-1.5 shrink-0 mt-0.5">
                <Quote className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm md:text-base text-slate-100 italic leading-relaxed break-words font-medium">
                  &ldquo;{currentGreeting.quote.text}&rdquo;
                </p>
                {currentGreeting.quote.translation && (
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1 italic">
                    &rarr; {currentGreeting.quote.translation}
                  </p>
                )}
                <p className="text-[10px] sm:text-xs text-purple-300/60 mt-1.5 tracking-wide font-medium">
                  — {currentGreeting.quote.author}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom neon accent bar */}
      <div className="relative h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600" />
    </div>
  )
}