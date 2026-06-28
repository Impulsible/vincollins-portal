// src/components/TwoStageSplashScreen.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  ArrowRight,
  LogIn,
  Home,
  CheckCircle,
  Clock,
  School,
  Globe,
  Key,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/* ═══════════════════════════════════════════════
   Types & Constants
═══════════════════════════════════════════════ */
interface TwoStageSplashScreenProps {
  children: React.ReactNode
  onLogin?: () => void
  onGoHome?: () => void
}

type Stage = 'init' | 'logo' | 'transition' | 'main' | 'exiting' | 'done'

const TRUST = [
  { icon: Lock, label: 'Secure' },
  { icon: CheckCircle, label: 'Trusted' },
  { icon: Clock, label: '24/7 Support' },
  { icon: Award, label: 'Excellence' },
] as const

const FEATURES = [
  { icon: School, title: 'Nursery', sub: 'Ages 1 – 5' },
  { icon: BookOpen, title: 'Primary', sub: 'Ages 5 – 11' },
  { icon: GraduationCap, title: 'College', sub: 'Ages 11 – 17' },
] as const

const BG = '#060D1F'

/* ═══════════════════════════════════════════════
   Global style injection — prevents white flash
   on initial load and route changes
═══════════════════════════════════════════════ */
function InjectDarkBackground() {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'splash-dark-bg'
    style.textContent = `
      html, body { background-color: ${BG} !important; }
      #__next, main { background-color: ${BG}; }
    `
    document.head.appendChild(style)
    document.documentElement.style.backgroundColor = BG
    document.body.style.backgroundColor = BG

    return () => {
      const el = document.getElementById('splash-dark-bg')
      if (el) el.remove()
    }
  }, [])
  return null
}

/* ═══════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════ */
export function TwoStageSplashScreen({
  children,
  onLogin,
  onGoHome,
}: TwoStageSplashScreenProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [stage, setStage] = useState<Stage>('init')
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'home' | 'portal'>('home')
  const [isApp, setIsApp] = useState(false)
  const [logoSpinDone, setLogoSpinDone] = useState(false)
  const [childrenReady, setChildrenReady] = useState(false)

  const mountedRef = useRef(true)
  const currentYear = new Date().getFullYear()

  // Cleanup ref
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  /* ── Detect PWA ── */
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      nav.standalone === true

    setIsApp(standalone)

    if (standalone) {
      setStage('logo')
    } else {
      setStage('done')
    }

    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = (e: MediaQueryListEvent) => setIsApp(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /* ── Logo spin complete → wait, then transition ── */
  useEffect(() => {
    if (stage !== 'logo') return
    const spinTimer = setTimeout(() => {
      if (mountedRef.current) setLogoSpinDone(true)
    }, 1800)
    return () => clearTimeout(spinTimer)
  }, [stage])

  /* ── Logo stage → transition stage ── */
  useEffect(() => {
    if (stage !== 'logo') return
    const id = setTimeout(() => {
      if (mountedRef.current) setStage('transition')
    }, 3200)
    return () => clearTimeout(id)
  }, [stage])

  /* ── Transition stage → main stage ── */
  useEffect(() => {
    if (stage !== 'transition') return
    const id = setTimeout(() => {
      if (mountedRef.current) setStage('main')
    }, 600)
    return () => clearTimeout(id)
  }, [stage])

  /* ── Progress bar ── */
  useEffect(() => {
    if (stage !== 'main') return

    let cur = 0
    const id = setInterval(() => {
      if (!mountedRef.current) { clearInterval(id); return }
      cur += Math.random() * 8 + 2
      if (cur >= 100) {
        cur = 100
        clearInterval(id)
      }
      setProgress(Math.min(cur, 100))
    }, 150)
    return () => clearInterval(id)
  }, [stage])

  /* ── Preload children behind splash ── */
  useEffect(() => {
    if (stage === 'main' || stage === 'exiting' || stage === 'done') {
      const timer = setTimeout(() => {
        if (mountedRef.current) setChildrenReady(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [stage])

  /* ── Exit handlers — no flash ── */
  const handleExit = useCallback(
    (target: 'home' | 'portal') => {
      if (stage === 'exiting' || stage === 'done') return
      setStage('exiting')

      // Wait for fade-out to complete before navigating
      setTimeout(() => {
        if (!mountedRef.current) return

        // Clean up dark background override
        const styleEl = document.getElementById('splash-dark-bg')
        if (styleEl) styleEl.remove()
        document.documentElement.style.backgroundColor = ''
        document.body.style.backgroundColor = ''

        setStage('done')

        if (target === 'portal') {
          onLogin ? onLogin() : router.push('/portal')
        } else {
          onGoHome ? onGoHome() : router.push('/')
        }
      }, 500)
    },
    [stage, onLogin, onGoHome, router],
  )

  const handleGoHome = useCallback(() => handleExit('home'), [handleExit])
  const handlePortalLogin = useCallback(() => handleExit('portal'), [handleExit])
  const handleSkip = useCallback(() => handleExit('home'), [handleExit])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/favicon.png'
  }, [])

  const handleBackgroundError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const p = e.currentTarget.parentElement
    if (p) p.style.background = BG
    e.currentTarget.style.display = 'none'
  }, [])

  /* ═══════════════════════════════════════════════
     Render Gates
  ═══════════════════════════════════════════════ */

  // Still detecting — solid dark, no white
  if (stage === 'init') {
    return (
      <>
        <InjectDarkBackground />
        <div className="fixed inset-0 z-[9999]" style={{ backgroundColor: BG }} />
      </>
    )
  }

  // Not a PWA — render children immediately, no splash
  if (!isApp && stage === 'done') {
    return <>{children}</>
  }

  // Splash complete — render children
  if (stage === 'done') {
    return <>{children}</>
  }

  return (
    <>
      <InjectDarkBackground />

      {/* ── Preloaded children hidden behind splash ── */}
      {childrenReady && (
        <div
          className="fixed inset-0 z-0"
          style={{ backgroundColor: BG, visibility: 'hidden' }}
          aria-hidden
        >
          {children}
        </div>
      )}

      {/* ── Splash overlay ── */}
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════
            STAGE: Logo Spin
        ════════════════════════════════════════ */}
        {stage === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
            style={{ backgroundColor: BG }}
          >
            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.18, scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="w-[500px] h-[500px] rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, #1E4FD8 0%, #0A2472 45%, transparent 70%)',
                  }}
                />
              </motion.div>
              <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-[0.06] blur-3xl bg-blue-600" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-[0.06] blur-3xl bg-blue-800" />
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center select-none">
              {/* Orbit rings */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                transition={{
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.8, type: 'spring', bounce: 0.3 },
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                }}
                className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-white/[0.04]"
                aria-hidden
              >
                <motion.span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400/40"
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: -360 }}
                transition={{
                  opacity: { duration: 0.4, delay: 0.15 },
                  scale: { duration: 0.8, type: 'spring', bounce: 0.3, delay: 0.15 },
                  rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
                }}
                className="absolute w-40 h-40 md:w-52 md:h-52 rounded-full border border-white/[0.06]"
                aria-hidden
              >
                <motion.span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-300/30"
                  animate={{ opacity: [0.15, 0.6, 0.15] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>

              {/* Logo — 3D Y-axis spin */}
              <motion.div
                initial={{ rotateY: 0, scale: 0.3, opacity: 0 }}
                animate={{ rotateY: 720, scale: 1, opacity: 1 }}
                transition={{
                  rotateY: { duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 0.8, type: 'spring', bounce: 0.4 },
                  opacity: { duration: 0.3 },
                }}
                className="relative z-10"
                style={{ perspective: 800, transformStyle: 'preserve-3d' }}
              >
                {/* Glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0.25] }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="absolute inset-[-24px] rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
                    filter: 'blur(16px)',
                  }}
                  aria-hidden
                />

                {/* Shimmer */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1, delay: 1.9, ease: 'easeInOut' }}
                  className="absolute inset-0 z-20 overflow-hidden rounded-full pointer-events-none"
                  aria-hidden
                >
                  <div
                    className="w-1/3 h-full"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                </motion.div>

                <Image
                  src="/favicon.png"
                  alt="Vincollins College"
                  width={88}
                  height={88}
                  className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-2xl relative z-10"
                  priority
                  onError={handleImageError}
                />
              </motion.div>

              {/* Text — appears after spin */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={logoSpinDone ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 text-center"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={logoSpinDone ? { opacity: 1 } : {}}
                  transition={{ delay: 0.05 }}
                  className="text-white/40 text-xs font-medium tracking-[0.3em] uppercase mb-2"
                >
                  Welcome to
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={logoSpinDone ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none"
                >
                  Vincollins College
                </motion.h1>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={logoSpinDone ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.25, duration: 0.5, type: 'spring', bounce: 0.4 }}
                  className="text-2xl md:text-3xl font-bold tracking-tight leading-none mt-1"
                  style={{ color: '#60A5FA' }}
                >
                  App
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={logoSpinDone ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4 }}
                  className="mt-3 text-white/40 text-[11px] font-light tracking-[0.25em] uppercase"
                >
                  Geared towards excellence
                </motion.p>
              </motion.div>

              {/* Audio-bar loader */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={logoSpinDone ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-10 flex items-center gap-1.5"
                aria-label="Loading"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: 'easeInOut',
                    }}
                    className="block w-[3px] rounded-full"
                    style={{
                      height: 20,
                      background: 'linear-gradient(to top, #3B82F6, #93C5FD)',
                    }}
                    aria-hidden
                  />
                ))}
              </motion.div>
            </div>

            {/* Version */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={logoSpinDone ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="absolute bottom-8 text-white/12 text-[10px] tracking-widest"
              aria-hidden
            >
              v{process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0.0'} &bull; {currentYear}
            </motion.p>
          </motion.div>
        )}

        {/* ════════════════════════════════════════
            STAGE: Transition (dark bridge)
        ════════════════════════════════════════ */}
        {stage === 'transition' && (
          <motion.div
            key="bridge"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: BG }}
          />
        )}

        {/* ════════════════════════════════════════
            STAGE: Main Splash
        ════════════════════════════════════════ */}
        {stage === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
            style={{ backgroundColor: BG }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <motion.div
                initial={{ scale: 1.12, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src="/images/app.jpg"
                  alt="Vincollins College Campus"
                  fill
                  className="object-cover"
                  priority
                  onError={handleBackgroundError}
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Top accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-0 left-0 right-0 h-[2px] z-20 origin-left"
              style={{
                background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
              }}
            />

            <div className="relative z-10 flex-1 flex flex-col min-h-screen w-full">
              {/* Header */}
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between px-6 pt-6"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/favicon.png"
                    alt="Vincollins College"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                    onError={handleImageError}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">Vincollins College</p>
                    <p className="text-white/40 text-[10px] tracking-wider uppercase">
                      Geared towards excellence
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-white/40 hover:text-white/80 text-xs font-medium tracking-wide uppercase transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  Skip
                </button>
              </motion.div>

              {/* Body */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3,
                    type: 'spring',
                    bounce: 0.45,
                  }}
                >
                  <Image
                    src="/favicon.png"
                    alt="Vincollins College"
                    width={72}
                    height={72}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl"
                    onError={handleImageError}
                  />
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 30, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4 text-2xl md:text-3xl font-extrabold text-white text-center tracking-tight drop-shadow-lg"
                >
                  Vincollins College
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="mt-1 text-sm font-medium text-blue-300 drop-shadow-md"
                >
                  Geared towards excellence
                </motion.p>

                {/* Tabs */}
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6, type: 'spring', bounce: 0.3 }}
                  className="mt-6 w-full max-w-sm"
                >
                  <Tabs
                    defaultValue="home"
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'home' | 'portal')}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                      <TabsTrigger
                        value="home"
                        className="rounded-xl py-2.5 flex items-center gap-2 font-semibold text-sm transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"
                      >
                        <Home className="w-3.5 h-3.5" />
                        Home
                      </TabsTrigger>
                      <TabsTrigger
                        value="portal"
                        className="rounded-xl py-2.5 flex items-center gap-2 font-semibold text-sm transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Portal Login
                      </TabsTrigger>
                    </TabsList>

                    {/* Home Tab */}
                    <TabsContent value="home" className="mt-4">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md"
                      >
                        <div className="flex flex-col items-center text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, type: 'spring', bounce: 0.5 }}
                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 bg-blue-500/10 border border-blue-500/25"
                          >
                            <Globe className="w-6 h-6 text-blue-300" />
                          </motion.div>
                          <h3 className="text-white font-bold text-lg drop-shadow-md">
                            Welcome Home
                          </h3>
                          <p className="text-white/60 text-sm mt-1.5 max-w-xs leading-relaxed drop-shadow-sm">
                            Explore our programs, latest news, events, and everything about
                            Vincollins College.
                          </p>
                          <Button
                            onClick={handleGoHome}
                            className="mt-5 w-full font-bold py-6 rounded-xl transition-all active:scale-[0.98] group text-white border-0"
                            style={{
                              background:
                                'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                              boxShadow: '0 8px 24px rgba(29,78,216,0.4)',
                            }}
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Enter App
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* Portal Tab */}
                    <TabsContent value="portal" className="mt-4">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md"
                      >
                        <div className="flex flex-col items-center text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, type: 'spring', bounce: 0.5 }}
                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 bg-emerald-500/10 border border-emerald-500/25"
                          >
                            <LogIn className="w-6 h-6 text-emerald-300" />
                          </motion.div>
                          <h3 className="text-white font-bold text-lg drop-shadow-md">
                            Access Your Portal
                          </h3>
                          <p className="text-white/60 text-sm mt-1.5 max-w-xs leading-relaxed drop-shadow-sm">
                            Login to access your dashboard, view results, and manage your
                            academic journey.
                          </p>
                          <Button
                            onClick={handlePortalLogin}
                            variant="outline"
                            className="mt-5 w-full py-6 rounded-xl font-bold transition-all active:scale-[0.98] group text-white border-white/20 hover:bg-white/10"
                          >
                            <LogIn className="w-4 h-4 mr-2 text-emerald-300" />
                            Go to Portal
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </motion.div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6 grid grid-cols-3 gap-2 w-full max-w-sm"
                >
                  {FEATURES.map(({ icon: Icon, title, sub }, index) => (
                    <motion.div
                      key={title}
                      initial={{ y: 20, opacity: 0, scale: 0.85 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.95 + index * 0.1,
                        duration: 0.4,
                        type: 'spring',
                        bounce: 0.35,
                      }}
                      className="rounded-xl p-3 border border-white/[0.07] text-center bg-white/5 backdrop-blur-sm"
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1.5 text-blue-300" />
                      <h4 className="text-white text-[11px] font-bold drop-shadow-sm">
                        {title}
                      </h4>
                      <p className="text-white/35 text-[9px] mt-0.5">{sub}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                  className="mt-5 w-full max-w-sm"
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-white/40 text-[10px] font-semibold tracking-widest uppercase drop-shadow-sm">
                      Loading
                    </span>
                    <span className="text-white/40 text-[10px] font-bold tabular-nums drop-shadow-sm">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-[3px] rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #1D4ED8, #60A5FA)',
                      }}
                    />
                  </div>
                </motion.div>

                {/* Trust */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="mt-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5"
                >
                  {TRUST.map(({ icon: Icon, label }, i) => (
                    <span key={label} className="flex items-center">
                      <span className="flex items-center gap-1 text-white/30 text-[10px] font-medium drop-shadow-sm">
                        <Icon className="w-2.5 h-2.5" />
                        {label}
                      </span>
                      {i < TRUST.length - 1 && (
                        <span className="w-px h-3 bg-white/10 mx-2" aria-hidden />
                      )}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="px-6 py-4 text-center"
              >
                <p className="text-white/20 text-[10px] tracking-widest drop-shadow-sm">
                  © {currentYear} Vincollins College. All rights reserved.
                </p>
                <p className="text-white/10 text-[9px] tracking-wider mt-0.5 drop-shadow-sm">
                  Geared towards excellence
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════
            STAGE: Exiting — smooth fade to dark
        ════════════════════════════════════════ */}
        {stage === 'exiting' && (
          <motion.div
            key="exit"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: BG }}
          />
        )}
      </AnimatePresence>
    </>
  )
}