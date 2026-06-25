/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  useState, useEffect, useRef, useCallback,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail, Eye, EyeOff, GraduationCap, Shield, Users,
  Loader2, AlertCircle, KeyRound, ArrowRight, Sparkles,
  Phone, Mail as MailIcon, CheckCircle, Lock, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface SchoolSettings {
  logo_path: string
  school_name: string
  school_motto: string
  school_phone?: string
  school_email?: string
}

type UserRole = 'student' | 'teacher' | 'admin'

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    icon: '🛡️',
    emoji: '👑',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    borderColor: '#D8B4FE',
    greeting: 'Welcome back, Administrator',
    message: 'Accessing admin control panel...',
    tabBg: 'data-[state=active]:bg-purple-600',
    infoBg: 'bg-purple-50 border-purple-200 text-purple-700',
    infoText: '🛡️ Administrative dashboard with full system control',
    redirect: '/admin',
  },
  teacher: {
    icon: '📚',
    emoji: '👋',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    greeting: 'Welcome back, Teacher',
    message: 'Loading your teaching dashboard...',
    tabBg: 'data-[state=active]:bg-blue-600',
    infoBg: 'bg-blue-50 border-blue-200 text-blue-700',
    infoText: '📚 Teaching portal for class and exam management',
    redirect: '/staff',
  },
  student: {
    icon: '🎓',
    emoji: '🌟',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    greeting: 'Welcome back, Student',
    message: 'Preparing your learning space...',
    tabBg: 'data-[state=active]:bg-emerald-600',
    infoBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    infoText: '🎓 Student dashboard with CBT exam access',
    redirect: '/student',
  },
} as const

const DEFAULT_SETTINGS: SchoolSettings = {
  logo_path: '',
  school_name: 'Vincollins College',
  school_motto: 'Geared Towards Excellence',
  school_phone: '+234 912 1155 554',
  school_email: 'vincollinscollege@gmail.com',
}

// ── Success Modal ─────────────────────────────────────────────────────────────
interface SuccessModalProps {
  userName: string
  role: UserRole
  redirectPath: string
  onGo: () => void
}

function SuccessModal({ userName, role, redirectPath, onGo }: SuccessModalProps) {
  const config = ROLE_CONFIG[role]
  const firstName = userName.split(' ')[0]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Top accent bar */}
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(90deg, ${config.color}, ${config.color}88)`,
          }}
        />

        <div className="p-8">
          {/* Close / skip */}
          <button
            onClick={onGo}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Go to dashboard"
          >
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-6 relative">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                style={{
                  background: `linear-gradient(135deg, ${config.bgColor}, white)`,
                  border: `3px solid ${config.borderColor}`,
                  boxShadow: `0 0 40px ${config.color}20`,
                }}
              >
                {config.icon}
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2 mb-8">
              <h3 className="text-3xl font-bold text-gray-900">
                Welcome! {config.emoji}
              </h3>
              <p
                className="text-xl font-semibold"
                style={{ color: config.color }}
              >
                {firstName}
              </p>
              <p className="text-gray-500 text-sm">{config.greeting}</p>
              <p className="text-gray-400 text-sm">{config.message}</p>
            </div>

            {/* CTA */}
            <Button
              onClick={onGo}
              className="w-full py-6 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
              }}
            >
              Go to Dashboard Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-gray-400 mt-3">
              Redirecting automatically in 3 seconds...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Rate limit banner ─────────────────────────────────────────────────────────
function LockoutBanner({ remainingSeconds }: { remainingSeconds: number }) {
  const minutes = Math.ceil(remainingSeconds / 60)
  const progress = (remainingSeconds / 300) * 100

  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center space-y-2">
      <div className="flex items-center justify-center gap-2 text-red-700">
        <Lock className="h-4 w-4" />
        <p className="text-sm font-semibold">Account Temporarily Locked</p>
      </div>
      <p className="text-xs text-red-500">
        Too many failed attempts. Try again in{' '}
        <span className="font-bold">
          {minutes} minute{minutes !== 1 ? 's' : ''}
        </span>
      </p>
      <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-400 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const { refreshUser } = useUser()
  const { isLocked, remainingSeconds, checkAndRecord } = useLoginRateLimit()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')

  // School branding
  const [schoolSettings, setSchoolSettings] =
    useState<SchoolSettings>(DEFAULT_SETTINGS)

  // Image states
  const [imageError, setImageError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)

  // Success modal
  const [successData, setSuccessData] = useState<{
    userName: string
    role: UserRole
    redirectPath: string
  } | null>(null)

  // Refs to prevent double-submission and manage redirect timer
  const loginInProgressRef = useRef(false)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const redirectStartedRef = useRef(false)

  // ── Preload hero image ───────────────────────────────────────────────────
  useEffect(() => {
    const img = document.createElement('img')
    img.src = '/images/portal.jpg'
  }, [])

  // ── Clear stale localStorage on portal visit ────────────────────────────
  useEffect(() => {
    try {
      const keysToKeep = ['user_profile', 'auth_user', 'auth_role', 'school_settings', 'pwa-install-dismissed']
      const now = Date.now()
      const lastClear = localStorage.getItem('portalCacheClear')

      if (!lastClear || now - parseInt(lastClear) > 24 * 60 * 60 * 1000) {
        Object.keys(localStorage).forEach((key) => {
          if (!keysToKeep.includes(key) && !key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
        localStorage.setItem('portalCacheClear', now.toString())
      }
    } catch {}

    // Handle bfcache restore
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  // ── Load school settings ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Show cached immediately
        const cached = localStorage.getItem('school_settings')
        if (cached) {
          try {
            setSchoolSettings((prev) => ({ ...prev, ...JSON.parse(cached) }))
          } catch {}
        }

        const { data } = await supabase
          .from('school_settings')
          .select('*')
          .maybeSingle()

        if (data) {
          const settings: SchoolSettings = {
            logo_path: data.logo_path || '',
            school_name: data.school_name || DEFAULT_SETTINGS.school_name,
            school_motto: data.school_motto || DEFAULT_SETTINGS.school_motto,
            school_phone: data.school_phone || DEFAULT_SETTINGS.school_phone,
            school_email: data.school_email || DEFAULT_SETTINGS.school_email,
          }
          setSchoolSettings(settings)
          localStorage.setItem('school_settings', JSON.stringify(settings))
        }
      } catch (err) {
        console.warn('[Portal] Failed to load school settings:', err)
      }
    }
    load()
  }, [])

  // ── Auto redirect timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!successData || redirectStartedRef.current) return

    redirectStartedRef.current = true
    redirectTimerRef.current = setTimeout(() => {
      router.push(successData.redirectPath)
    }, 3000)

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [successData, router])

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  // ── Go to dashboard (manual) ─────────────────────────────────────────────
  const goToDashboard = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    if (!successData) return
    router.push(successData.redirectPath)
  }, [successData, router])

  // ── Role change ──────────────────────────────────────────────────────────
  const handleRoleChange = useCallback((role: UserRole) => {
    setSelectedRole(role)
    setError('')
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Rate limit check
      if (isLocked) {
        setError(
          `Too many failed attempts. Please wait ${Math.ceil(remainingSeconds / 60)} minute(s).`,
        )
        return
      }

      // Prevent double submission
      if (loginInProgressRef.current || loading) return
      loginInProgressRef.current = true
      setLoading(true)
      setError('')
      redirectStartedRef.current = false

      const cleanEmail = email.trim().toLowerCase()
      const cleanPassword = password.trim()

      if (!cleanEmail || !cleanPassword) {
        setError('Please enter both email and password.')
        loginInProgressRef.current = false
        setLoading(false)
        return
      }

      try {
        // ── Sign in ──────────────────────────────────────────────────────
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          })

        if (signInError) {
          const { allowed, message } = checkAndRecord(false)

          if (!allowed) {
            setError(message ?? 'Too many attempts. Please try again later.')
          } else if (signInError.message.includes('Invalid login credentials')) {
            setError(
              message
                ? `Invalid email or password. ${message}`
                : 'Invalid email or password. Please try again.',
            )
          } else if (signInError.message.includes('Email not confirmed')) {
            setError(
              'Please confirm your email address before logging in.',
            )
          } else if (signInError.message.includes('rate_limit')) {
            setError(
              'Too many requests. Please wait a few minutes and try again.',
            )
          } else {
            setError('Login failed. Please check your credentials.')
          }

          loginInProgressRef.current = false
          setLoading(false)
          return
        }

        if (!signInData?.user) {
          setError('Login failed. No user data received.')
          loginInProgressRef.current = false
          setLoading(false)
          return
        }

        // ── Fetch profile ────────────────────────────────────────────────
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, first_name, last_name')
          .eq('id', signInData.user.id)
          .maybeSingle()

        const rawRole =
          profile?.role?.toLowerCase() ??
          signInData.user.user_metadata?.role?.toLowerCase() ??
          'student'

        // Normalise 'staff' → 'teacher' for UI
        const userRole: UserRole =
          rawRole === 'staff'
            ? 'teacher'
            : (rawRole as UserRole)

        // ── Role mismatch check ──────────────────────────────────────────
        if (userRole !== selectedRole) {
          const displayName =
            userRole === 'teacher'
              ? 'Teacher/Staff'
              : userRole.charAt(0).toUpperCase() + userRole.slice(1)
          setError(
            `This account is registered as ${displayName}. Please select the correct tab above.`,
          )
          await supabase.auth.signOut()
          checkAndRecord(false) // counts as failed attempt
          loginInProgressRef.current = false
          setLoading(false)
          return
        }

        // ── Success ──────────────────────────────────────────────────────
        checkAndRecord(true) // clears rate limit

        // Build display name
        let userName =
          profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.full_name ??
              signInData.user.user_metadata?.full_name ??
              signInData.user.email?.split('@')[0] ??
              'User'

        userName = userName
          .split(/[.\s_-]+/)
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')

        const redirectPath = ROLE_CONFIG[userRole].redirect

        // Persist minimal auth info locally
        try {
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ id: signInData.user.id, role: userRole }),
          )
          localStorage.setItem('auth_role', userRole)
          localStorage.setItem(
            'user_profile',
            JSON.stringify({
              id: signInData.user.id,
              full_name: userName,
              first_name: userName.split(' ')[0],
              email: cleanEmail,
              role: userRole,
              timestamp: Date.now(),
            }),
          )
        } catch {}

        setSuccessData({ userName, role: userRole, redirectPath })
        setLoading(false)

        // Refresh user context in background — non-blocking
        refreshUser().catch(console.warn)

        setTimeout(() => {
          loginInProgressRef.current = false
        }, 500)
      } catch (err) {
        console.error('[Portal] Login error:', err)
        setError('An unexpected error occurred. Please try again.')
        loginInProgressRef.current = false
        setLoading(false)
      }
    },
    [
      email, password, selectedRole, loading,
      isLocked, remainingSeconds, checkAndRecord, refreshUser,
    ],
  )

  // ── Role-aware button/tab colors ──────────────────────────────────────────
  const submitBtnClass = {
    admin: 'bg-purple-600 hover:bg-purple-700',
    teacher: 'bg-blue-600 hover:bg-blue-700',
    student: 'bg-emerald-600 hover:bg-emerald-700',
  }[selectedRole]

  const RoleIcon = {
    admin: <Shield className="h-4 w-4" />,
    teacher: <Users className="h-4 w-4" />,
    student: <GraduationCap className="h-4 w-4" />,
  }[selectedRole]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <div className="flex-1 flex pt-16 sm:pt-20">
          <div className="flex w-full">

            {/* ── LEFT: Hero Image ──────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-gradient-to-br from-[#0A2472] to-[#1e3a8a]">
              <div className="relative w-full">
                {!imageError && (
                  <>
                    {!heroLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] animate-pulse z-0" />
                    )}
                    <Image
                      src="/images/portal.jpg"
                      alt="Vincollins College Campus"
                      fill
                      className={cn(
                        'object-cover object-center transition-opacity duration-500 z-0',
                        heroLoaded ? 'opacity-100' : 'opacity-0',
                      )}
                      priority
                      sizes="(max-width: 1024px) 55vw, 60vw"
                      onLoad={() => setHeroLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-10" />

                <div className="relative z-20 flex flex-col justify-center px-12 xl:px-16 py-12 w-full min-h-[calc(100vh-80px)]">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="text-white"
                  >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-8">
                      <Sparkles className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm font-medium tracking-wide">
                        Secure Portal Access
                      </span>
                    </div>

                    {/* School identity */}
                    <div className="flex items-center gap-4 mb-8">
                      {schoolSettings.logo_path ? (
                        <div className="relative h-16 w-16 xl:h-20 xl:w-20 flex-shrink-0">
                          <Image
                            src={schoolSettings.logo_path}
                            alt="School Logo"
                            fill
                            sizes="80px"
                            className={cn(
                              'object-contain transition-opacity duration-300',
                              logoLoaded ? 'opacity-100' : 'opacity-0',
                            )}
                            priority
                            onLoad={() => setLogoLoaded(true)}
                            onError={() => setLogoLoaded(true)}
                          />
                          {!logoLoaded && (
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="h-8 w-8 xl:h-10 xl:w-10 text-white" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl xl:text-3xl font-bold">
                          {schoolSettings.school_name}
                        </h2>
                        <p className="text-white/60 text-sm italic mt-1">
                          &ldquo;{schoolSettings.school_motto}&rdquo;
                        </p>
                      </div>
                    </div>

                    <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight">
                      Welcome to Your{' '}
                      <span className="text-[#F5A623]">Digital Campus</span>
                    </h1>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Login Form ─────────────────────────────────────── */}
            <div className="w-full lg:w-[45%] xl:w-[40%] bg-white flex items-center justify-center py-8 lg:py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >

                  {/* Mobile logo */}
                  <div className="lg:hidden text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                      {schoolSettings.logo_path ? (
                        <div className="relative h-20 w-20 mx-auto mb-3">
                          <Image
                            src={schoolSettings.logo_path}
                            alt="Logo"
                            fill
                            sizes="80px"
                            className="object-contain"
                            priority
                            onLoad={() => setLogoLoaded(true)}
                            onError={() => setLogoLoaded(true)}
                          />
                          {!logoLoaded && (
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] flex items-center justify-center mx-auto mb-3 shadow-xl">
                          <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                      )}
                    </motion.div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {schoolSettings.school_name}
                    </h2>
                    <p className="text-xs text-gray-500 italic mt-1">
                      &ldquo;{schoolSettings.school_motto}&rdquo;
                    </p>
                  </div>

                  {/* Heading */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Sign In
                    </h3>
                    <p className="text-gray-500 text-sm mt-2">
                      Access your personalised portal
                    </p>
                  </div>

                  {/* Role tabs */}
                  <Tabs
                    value={selectedRole}
                    onValueChange={(v) => handleRoleChange(v as UserRole)}
                    className="mb-6"
                  >
                    <TabsList className="grid w-full grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="student"
                        className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-medium">Student</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="teacher"
                        className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                      >
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Teacher</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="admin"
                        className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Admin</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Role info banner */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedRole}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'mb-6 rounded-xl p-3.5 text-center border text-sm font-medium',
                        ROLE_CONFIG[selectedRole].infoBg,
                      )}
                    >
                      {ROLE_CONFIG[selectedRole].infoText}
                    </motion.div>
                  </AnimatePresence>

                  {/* Error alert */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5"
                      >
                        <Alert
                          variant="destructive"
                          className="border-red-200 bg-red-50 text-red-800 rounded-xl"
                        >
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm ml-2">
                            {error}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Lockout banner */}
                  <AnimatePresence>
                    {isLocked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5"
                      >
                        <LockoutBanner remainingSeconds={remainingSeconds} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login form */}
                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (error) setError('')
                          }}
                          className={cn(
                            'pl-10 h-12 rounded-xl border-2 bg-gray-50 focus:bg-white text-sm transition-all',
                            error
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-primary',
                          )}
                          required
                          disabled={loading || isLocked}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            if (error) setError('')
                          }}
                          className={cn(
                            'pl-10 pr-12 h-12 rounded-xl border-2 bg-gray-50 focus:bg-white text-sm transition-all',
                            error
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-primary',
                          )}
                          required
                          disabled={loading || isLocked}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                          tabIndex={-1}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      className={cn(
                        'w-full h-12 text-sm font-semibold text-white',
                        'shadow-lg hover:shadow-xl transition-all rounded-xl mt-2',
                        submitBtnClass,
                        (loading || isLocked) && 'opacity-70 cursor-not-allowed',
                      )}
                      disabled={loading || isLocked}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : isLocked ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Account Locked
                        </>
                      ) : (
                        <>
                          {RoleIcon}
                          <span className="ml-2">Sign In to Portal</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
                      {schoolSettings.school_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{schoolSettings.school_phone}</span>
                        </div>
                      )}
                      {schoolSettings.school_email && (
                        <div className="flex items-center gap-1.5">
                          <MailIcon className="h-3.5 w-3.5" />
                          <span>{schoolSettings.school_email}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-center text-xs text-gray-400">
                      Need assistance?{' '}
                      <Link
                        href="/contact"
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Contact Support
                      </Link>
                    </p>

                    <p className="text-center text-[11px] text-gray-300">
                      © {new Date().getFullYear()}{' '}
                      {schoolSettings.school_name}. All rights reserved.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success modal */}
      <AnimatePresence>
        {successData && (
          <SuccessModal
            userName={successData.userName}
            role={successData.role}
            redirectPath={successData.redirectPath}
            onGo={goToDashboard}
          />
        )}
      </AnimatePresence>
    </>
  )
}