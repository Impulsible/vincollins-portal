/* eslint-disable react-hooks/set-state-in-effect */
// components/admin/dashboard/WelcomeBanner.tsx - PROPERLY SIZED
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, Calendar, Clock, Timer, Quote,
  Shield, Activity, TrendingUp, Zap, Sun, Moon, Sunset, Sunrise,
  BookOpen, GraduationCap
} from 'lucide-react'

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

// ─── Personalized Quotes ──────────────────────────────
const quotes = {
  morning: [
    "The beautiful thing about learning is that no one can take it away from you.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "Every student can learn, just not on the same day, or in the same way.",
    "Teaching is the one profession that creates all other professions.",
    "The art of teaching is the art of assisting discovery.",
    "Start where you are. Use what you have. Do what you can.",
    "The influence of a good teacher can never be erased.",
    "Your work today shapes the leaders of tomorrow.",
  ],
  afternoon: [
    "Leadership and learning are indispensable to each other.",
    "Education is not the filling of a pail, but the lighting of a fire.",
    "The function of education is to teach one to think intensively and to think critically.",
    "Intelligence plus character — that is the goal of true education.",
    "A person who never made a mistake never tried anything new.",
    "Strive not to be a success, but rather to be of value.",
    "It is the supreme art of the teacher to awaken joy in creative expression and knowledge.",
    "The roots of education are bitter, but the fruit is sweet.",
  ],
  evening: [
    "What we learn with pleasure we never forget.",
    "The mind is not a vessel to be filled, but a fire to be kindled.",
    "Education costs money, but then so does ignorance.",
    "Develop a passion for learning. If you do, you will never cease to grow.",
    "The more that you read, the more things you will know.",
    "Learning never exhausts the mind.",
    "An investment in knowledge pays the best interest.",
  ],
  night: [
    "Take rest; a field that has rested gives a bountiful crop.",
    "Your dedication today will inspire breakthroughs tomorrow.",
    "The best way to predict the future is to create it.",
    "Great administrators are made, not born — and you're proving that daily.",
    "Tomorrow is a new day with new opportunities to impact lives.",
    "Rest well — you've earned it. Tomorrow's challenges await your brilliance.",
  ],
}

const getPersonalizedQuote = (hour: number, firstName: string): { text: string; author: string } => {
  let quoteSet: string[] = []
  if (hour < 12) quoteSet = quotes.morning
  else if (hour < 17) quoteSet = quotes.afternoon
  else if (hour < 21) quoteSet = quotes.evening
  else quoteSet = quotes.night

  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const index = dayOfYear % quoteSet.length
  const text = quoteSet[index].replace(/you/g, firstName)
  return { text, author: '— Educational Wisdom' }
}

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

// ✅ Improved term formatter
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

  useEffect(() => {
    const handleClear = () => localStorage.removeItem(STORAGE_KEY)
    window.addEventListener('beforeunload', handleClear)
    return () => window.removeEventListener('beforeunload', handleClear)
  }, [])

  const greeting = useMemo(() => {
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [now])

  const GreetingIcon = useMemo(() => getGreetingIcon(now.getHours()), [now])
  const quote = useMemo(() => getPersonalizedQuote(now.getHours(), firstName), [now, firstName])
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
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152f] via-[#0b2a5b] to-[#17479e] shadow-xl ring-1 ring-white/10"
      suppressHydrationWarning
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_25%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_30%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/6 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* ✅ RESTORED sensible padding - not too big */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-6">

        {/* ── Row 1: Header + Live Status ── */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="rounded-lg border border-white/15 bg-white/10 backdrop-blur-sm p-1.5 sm:p-2 shrink-0">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-200/80 truncate">
                Admin Portal
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-300/60 shrink-0" />
                <p className="text-[9px] sm:text-[11px] text-blue-300/70 truncate font-semibold">
                  {academicInfo.term} {academicInfo.session && `· ${academicInfo.session}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 sm:px-2.5 py-1 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* ── Row 2: Greeting - REASONABLE SIZE ── */}
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <GreetingIcon className="h-4 w-4 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
            <span className="text-xs sm:text-sm text-blue-100/80 font-medium">{greeting}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight break-words">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-200 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/60 mt-1.5">
            Here&apos;s what&apos;s happening today
          </p>
        </div>

        {/* ── Row 3: Info Tiles - SENSIBLE SIZE ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">

          {/* Date Tile */}
          <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm px-2.5 py-2.5 sm:px-3 sm:py-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-300/80 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-blue-200/60 truncate">
                Date
              </span>
            </div>
            <p className="sm:hidden text-[11px] font-bold text-white leading-tight truncate">
              {dateShort}
            </p>
            <p className="hidden sm:block text-sm font-bold text-white leading-tight truncate">
              {dateFull.split(',')[0]}
            </p>
            <p className="hidden sm:block text-[10px] text-blue-200/70 mt-0.5 truncate">
              {dateFull.split(',').slice(1).join(',').trim()}
            </p>
          </div>

          {/* Time Tile */}
          <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm px-2.5 py-2.5 sm:px-3 sm:py-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-300/80 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-blue-200/60 truncate">
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
            <p className="hidden sm:block text-[10px] text-blue-200/70 mt-0.5">
              Local time
            </p>
          </div>

          {/* Session Tile */}
          <div className="group relative overflow-hidden rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-white/5 backdrop-blur-sm px-2.5 py-2.5 sm:px-3 sm:py-3 hover:border-cyan-300/30 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-300 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-cyan-200/70 truncate">
                Session
              </span>
            </div>
            <p className="sm:hidden font-mono text-[11px] font-bold text-white leading-tight">
              {onlineDurationShort}
            </p>
            <p className="hidden sm:block font-mono text-base font-bold text-white leading-tight tabular-nums">
              {onlineDuration}
            </p>
            <p className="hidden sm:block text-[10px] text-cyan-200/70 mt-0.5">
              Active now
            </p>
          </div>
        </div>

        {/* ── Row 4: Desktop system bar - REASONABLE ── */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 py-3 px-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-400/15 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/60">System</p>
              <p className="text-xs font-bold text-white">All Systems Operational</p>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-400/15 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-blue-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/60">Status</p>
              <p className="text-xs font-bold text-white">Real-time Sync Active</p>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-400/15 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/60">Performance</p>
              <p className="text-xs font-bold text-white">Optimal Response</p>
            </div>
          </div>
        </div>

        {/* ── Mobile system bar ── */}
        <div className="md:hidden flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
          <div className="flex items-center gap-1.5 min-w-0">
            <Activity className="h-3 w-3 text-emerald-300 shrink-0" />
            <span className="text-[10px] font-semibold text-white truncate">All Systems Operational</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Online</span>
          </div>
        </div>

        {/* ── Quote - REASONABLE ── */}
        {quote.text && (
          <div className="relative pt-4 border-t border-white/10">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 backdrop-blur-sm p-1.5 shrink-0 mt-0.5">
                <Quote className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm md:text-[15px] text-blue-50/90 italic leading-relaxed break-words">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-[10px] sm:text-xs text-amber-200/60 mt-1.5 tracking-wide font-medium">
                  {quote.author}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div className="relative h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200" />
    </div>
  )
}