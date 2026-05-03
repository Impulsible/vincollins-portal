/* eslint-disable react-hooks/set-state-in-effect */
// components/admin/dashboard/WelcomeBanner.tsx - CLEAN & SIMPLE
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
  const [mounted, setMounted] = useState(false)
  const firstName = adminProfile?.full_name?.split(' ')[0] || 'Admin'
  const [now, setNow] = useState<Date | null>(null)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setNow(new Date())

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

  // Clear session on logout/page close
  useEffect(() => {
    const handleClear = () => localStorage.removeItem(STORAGE_KEY)
    window.addEventListener('beforeunload', handleClear)
    return () => window.removeEventListener('beforeunload', handleClear)
  }, [])

  const greeting = useMemo(() => {
    if (!now) return 'Welcome'
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [now])

  const quote = useMemo(() => {
    if (!now) return { text: '', author: '' }
    return getPersonalizedQuote(now.getHours(), firstName)
  }, [now, firstName])

  const formattedDate = useMemo(() => {
    if (!now) return ''
    return now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }, [now])

  const formattedTime = useMemo(() => {
    if (!now) return ''
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [now])

  const onlineDuration = useMemo(() => {
    if (!now || !sessionStart) return '00:00:00'
    const diffMs = now.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [now, sessionStart])

  if (!mounted || !now || !sessionStart) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152f] via-[#0b2a5b] to-[#17479e] p-8 shadow-2xl ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_22%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_28%)]" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-white/15 bg-white/10 p-1.5">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <span className="text-sm text-blue-100/80">Loading...</span>
          </div>
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152f] via-[#0b2a5b] to-[#17479e] p-6 sm:p-8 shadow-2xl ring-1 ring-white/10" suppressHydrationWarning>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_22%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_28%)]" />
      </div>
      <div className="absolute inset-0 bg-black/15" />

      <div className="relative z-10 space-y-5">
        {/* Top Row: Greeting + Time */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-white/15 bg-white/10 p-1.5">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <span className="text-sm text-blue-100/80">Welcome Back, Administrator</span>
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{greeting}, {firstName}!</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2" suppressHydrationWarning>
              <Calendar className="h-4 w-4 text-blue-100/80" />
              <span className="text-sm text-blue-50/95">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2" suppressHydrationWarning>
              <Clock className="h-4 w-4 text-blue-100/80" />
              <span className="font-mono text-sm text-blue-50/95">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-white/10 px-3 py-2" suppressHydrationWarning>
              <Timer className="h-4 w-4 text-cyan-300" />
              <span className="font-mono text-sm text-blue-50/95">{onlineDuration}</span>
            </div>
          </div>
        </div>

        {/* Quote */}
        {quote.text && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-1.5 shrink-0 mt-0.5">
                <Quote className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <p className="text-sm sm:text-base text-blue-50/90 italic leading-relaxed">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-xs text-blue-200/60 mt-1.5 tracking-wide">{quote.author}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}