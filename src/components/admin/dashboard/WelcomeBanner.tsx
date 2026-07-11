/* eslint-disable react-hooks/set-state-in-effect */
// components/admin/dashboard/WelcomeBanner.tsx - OPTIMIZED (Mobile-first + GPU safe)
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Calendar, Clock, Timer, Quote } from 'lucide-react'

interface AdminProfile {
  id?: string
  full_name?: string
  email?: string
  photo_url?: string
}

interface WelcomeBannerProps {
  adminProfile: AdminProfile | null
  activeTab?: string
}

const STORAGE_KEY = 'admin_session_start'

// ✅ GPU isolation - prevents mobile static/glitch on gradients + blurs
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

export function WelcomeBanner({ adminProfile, activeTab = 'dashboard' }: WelcomeBannerProps) {
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

  const quote = useMemo(() => {
    return getPersonalizedQuote(now.getHours(), firstName)
  }, [now, firstName])

  // ✅ Two date formats: short for mobile, full for desktop
  const formattedDateShort = useMemo(() => {
    return now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }, [now])

  const formattedDateFull = useMemo(() => {
    return now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }, [now])

  // ✅ Time without seconds on mobile to save space
  const formattedTimeShort = useMemo(() => {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [now])

  const formattedTimeFull = useMemo(() => {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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

  // ✅ Shorter duration format for mobile
  const onlineDurationShort = useMemo(() => {
    if (!sessionStart) return '0m'
    const diffMs = now.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }, [now, sessionStart])

  return (
    <div
      style={bannerIsolationStyle}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152f] via-[#0b2a5b] to-[#17479e] p-4 sm:p-6 md:p-8 shadow-2xl ring-1 ring-white/10"
      suppressHydrationWarning
    >
      {/* Decorative radial gradients - contained inside */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_22%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_28%)]" />
      </div>
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      <div className="relative z-10 space-y-3 sm:space-y-5">
        {/* ═══════ Top: Greeting ═══════ */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="rounded-lg border border-white/15 bg-white/10 p-1 sm:p-1.5 shrink-0">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-amber-300" />
            </div>
            <span className="text-[11px] sm:text-sm text-blue-100/80 truncate">
              Welcome Back, Administrator
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight break-words">
            {greeting}, {firstName}!
          </h1>
        </div>

        {/* ═══════ Time Pills - Mobile-friendly layout ═══════ */}
        {/* Mobile: 3 compact pills in a row | Desktop: full detail pills */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 md:gap-3">
          {/* Date pill */}
          <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-white/15 bg-white/10 px-2 py-1.5 sm:px-3 sm:py-2 min-w-0">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-100/80 shrink-0" />
            {/* Mobile short date, desktop full date */}
            <span className="sm:hidden text-[10px] font-medium text-blue-50/95 truncate">
              {formattedDateShort}
            </span>
            <span className="hidden sm:inline text-sm text-blue-50/95 whitespace-nowrap">
              {formattedDateFull}
            </span>
          </div>

          {/* Time pill */}
          <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-white/15 bg-white/10 px-2 py-1.5 sm:px-3 sm:py-2 min-w-0">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-100/80 shrink-0" />
            {/* Mobile: no seconds, Desktop: with seconds */}
            <span className="sm:hidden font-mono text-[10px] font-medium text-blue-50/95 truncate">
              {formattedTimeShort}
            </span>
            <span className="hidden sm:inline font-mono text-sm text-blue-50/95 whitespace-nowrap">
              {formattedTimeFull}
            </span>
          </div>

          {/* Session duration pill */}
          <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-cyan-300/20 bg-white/10 px-2 py-1.5 sm:px-3 sm:py-2 min-w-0">
            <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-300 shrink-0" />
            {/* Mobile: short format (1h 30m), Desktop: full HH:MM:SS */}
            <span className="sm:hidden font-mono text-[10px] font-medium text-blue-50/95 truncate">
              {onlineDurationShort}
            </span>
            <span className="hidden sm:inline font-mono text-sm text-blue-50/95 whitespace-nowrap">
              {onlineDuration}
            </span>
          </div>
        </div>

        {/* ═══════ Quote Section ═══════ */}
        {quote.text && (
          <div className="border-t border-white/10 pt-3 sm:pt-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-1 sm:p-1.5 shrink-0 mt-0.5">
                <Quote className="h-3 w-3 sm:h-4 sm:w-4 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm md:text-base text-blue-50/90 italic leading-relaxed break-words">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-[10px] sm:text-xs text-blue-200/60 mt-1 tracking-wide">
                  {quote.author}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}