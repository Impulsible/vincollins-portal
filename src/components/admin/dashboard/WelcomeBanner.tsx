/* eslint-disable react-hooks/set-state-in-effect */
// components/admin/dashboard/WelcomeBanner.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Calendar,
  Clock,
  TrendingUp,
  Timer,
  Users,
  Wifi,
} from 'lucide-react'
import { useAdminPresence } from '@/hooks/useAdminPresence'

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

export function WelcomeBanner({
  adminProfile,
  activeTab = 'dashboard',
}: WelcomeBannerProps) {
  const [mounted, setMounted] = useState(false)
  const firstName = adminProfile?.full_name?.split(' ')[0] || 'Admin'

  const [now, setNow] = useState<Date | null>(null)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)

  const { onlineAdmins, onlineCount, isConnected } = useAdminPresence({
    adminProfile,
    activeTab,
  })

  // Only run on client side
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

    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const greeting = useMemo(() => {
    if (!now) return 'Welcome'
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [now])

  const formattedDate = useMemo(() => {
    if (!now) return ''
    return now.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [now])

  const formattedTime = useMemo(() => {
    if (!now) return ''
    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [now])

  const onlineDuration = useMemo(() => {
    if (!now || !sessionStart) return '00:00:00'
    const diffMs = now.getTime() - sessionStart.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`
  }, [now, sessionStart])

  const liveActivityText = useMemo(() => {
    if (!isConnected) return 'Connecting to live activity...'
    if (onlineCount <= 1) return 'You are the only admin online'
    return `${onlineCount} admins currently active`
  }, [isConnected, onlineCount])

  const currentTabViewers = useMemo(() => {
    return onlineAdmins.filter((admin) => admin.page === activeTab).length
  }, [onlineAdmins, activeTab])

  // Show loading state on server to prevent hydration mismatch
  if (!mounted || !now || !sessionStart) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152f] via-[#0b2a5b] to-[#17479e] p-8 shadow-2xl ring-1 ring-white/10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_22%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_28%)]" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-white/15 bg-white/10 p-1.5">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <span className="text-sm text-blue-100/80">Loading...</span>
            </div>
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-28 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152f] via-[#0b2a5b] to-[#17479e] p-8 shadow-2xl ring-1 ring-white/10"
      suppressHydrationWarning
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_22%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_28%)]" />
      </div>

      <div className="absolute inset-0 bg-black/15" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-white/15 bg-white/10 p-1.5">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <span className="text-sm text-blue-100/80">
              Welcome Back, Administrator
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white md:text-4xl">
            {greeting}, {firstName}!
          </h1>

          <p className="max-w-md text-sm text-blue-50/80 md:text-base">
            Your dashboard is updating in real time with live admin presence.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-3">
            <div 
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2"
              suppressHydrationWarning
            >
              <Calendar className="h-4 w-4 text-blue-100/80" />
              <span className="text-sm text-blue-50/95">{formattedDate}</span>
            </div>

            <div 
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2"
              suppressHydrationWarning
            >
              <Clock className="h-4 w-4 text-blue-100/80" />
              <span className="font-mono text-sm text-blue-50/95">
                {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div 
              className="flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-white/10 px-3 py-2"
              suppressHydrationWarning
            >
              <Timer className="h-4 w-4 text-cyan-300" />
              <span className="font-mono text-sm text-blue-50/95">
                Online: {onlineDuration}
              </span>
            </div>

            <div 
              className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-white/10 px-3 py-2"
              suppressHydrationWarning
            >
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <span className="text-sm text-blue-50/95">
                {liveActivityText}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div 
              className="flex items-center gap-2 rounded-xl border border-sky-300/20 bg-white/10 px-3 py-2"
              suppressHydrationWarning
            >
              <Users className="h-4 w-4 text-sky-300" />
              <span className="text-sm text-blue-50/95">
                Live admins: {onlineCount}
              </span>
            </div>

            <div 
              className="flex items-center gap-2 rounded-xl border border-violet-300/20 bg-white/10 px-3 py-2"
              suppressHydrationWarning
            >
              <Wifi className="h-4 w-4 text-violet-300" />
              <span className="text-sm text-blue-50/95">
                On this page: {currentTabViewers}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}