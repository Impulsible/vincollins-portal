// src/components/TwoStageSplashScreen.tsx

'use client'

import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  ArrowRight,
  ShieldCheck,
  QrCode,
  LogIn,
  Home,
  CheckCircle2,
  BookOpen,
  Award,
  Laptop,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const DARK_THEME = '#050B18'
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '2.4.0'

type Stage = 'intro' | 'bridge' | 'card' | 'exit' | 'done'
type ExitTarget = 'home' | 'portal'

interface TwoStageSplashProps {
  children: ReactNode
  onLogin?: () => void
  onGoHome?: () => void
}

function lockDarkScreen() {
  if (typeof window === 'undefined') return
  document.documentElement.style.backgroundColor = DARK_THEME
  document.body.style.backgroundColor = DARK_THEME
}

function unlockDarkScreen() {
  if (typeof window === 'undefined') return
  document.documentElement.style.backgroundColor = ''
  document.body.style.backgroundColor = ''
}

function isFreshAppLaunch(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('launch') === 'app'
  } catch {
    return false
  }
}

function clearLaunchParam() {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('launch')
    window.history.replaceState({}, '', url.pathname + (url.search || ''))
  } catch {}
}

function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

export function TwoStageSplashScreen({
  children,
  onLogin,
  onGoHome,
}: TwoStageSplashProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [show, setShow] = useState<boolean | null>(null)
  const [stage, setStage] = useState<Stage>('intro')
  const [spinDone, setSpinDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [routeReady, setRouteReady] = useState(false)
  const [year, setYear] = useState<number>(2026)
  const [logoLoaded, setLogoLoaded] = useState(false)

  const exitTargetRef = useRef<ExitTarget | null>(null)
  const isNavigating = useRef(false)
  const isMounted = useRef(true)
  const isDecided = useRef(false)

  useEffect(() => {
    setYear(new Date().getFullYear())
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (isDecided.current) return
    isDecided.current = true

    const isStandalone = isPWA()
    const freshLaunch = isFreshAppLaunch()

    if (!isStandalone || !freshLaunch) {
      setShow(false)
      return
    }

    clearLaunchParam()
    lockDarkScreen()
    setShow(true)
  }, [])

  useEffect(() => {
    if (!show || stage !== 'intro') return
    const spinTimer = setTimeout(() => {
      if (isMounted.current) setSpinDone(true)
    }, 1600)

    const stageTimer = setTimeout(() => {
      if (isMounted.current) setStage('bridge')
    }, 2800)

    return () => {
      clearTimeout(spinTimer)
      clearTimeout(stageTimer)
    }
  }, [show, stage])

  useEffect(() => {
    if (!show || stage !== 'bridge') return
    const bridgeTimer = setTimeout(() => {
      if (isMounted.current) setStage('card')
    }, 400)
    return () => clearTimeout(bridgeTimer)
  }, [show, stage])

  useEffect(() => {
    if (!show || stage !== 'card') return
    let currentProgress = 0
    const interval = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(interval)
        return
      }
      currentProgress += Math.random() * 15 + 5
      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(interval)
      }
      setProgress(Math.min(currentProgress, 100))
    }, 100)
    return () => clearInterval(interval)
  }, [show, stage])

  useEffect(() => {
    if (stage !== 'done' || isNavigating.current) return

    const target = exitTargetRef.current
    if (!target) return
    isNavigating.current = true

    if (target === 'portal') {
      if (onLogin) onLogin()
      else router.push('/portal')
    } else {
      if (pathname === '/') {
        unlockDarkScreen()
        setRouteReady(true)
      } else if (onGoHome) {
        onGoHome()
      } else {
        router.replace('/')
      }
    }
  }, [stage, pathname, onLogin, onGoHome, router])

  useEffect(() => {
    if (stage !== 'done') return
    const target = exitTargetRef.current
    if (!target) return

    if (target === 'home' && pathname === '/') {
      unlockDarkScreen()
      setRouteReady(true)
    } else if (target === 'portal' && pathname?.startsWith('/portal')) {
      unlockDarkScreen()
      setRouteReady(true)
    }
  }, [stage, pathname])

  const startExit = (target: ExitTarget) => {
    if (!isMounted.current || stage === 'exit' || stage === 'done') return
    exitTargetRef.current = target
    setRouteReady(false)
    isNavigating.current = false
    setStage('exit')

    setTimeout(() => {
      if (isMounted.current) setStage('done')
    }, 450)
  }

  const onImageError = (e: SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/favicon.png'
  }

  const onBgError = (e: SyntheticEvent<HTMLImageElement>) => {
    const parent = e.currentTarget.parentElement
    if (parent) parent.style.background = DARK_THEME
    e.currentTarget.style.display = 'none'
  }

  if (show === null) return null
  if (!show) return <>{children}</>

  if (stage === 'done') {
    if (!routeReady) {
      return (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[9999]"
          style={{ backgroundColor: DARK_THEME }}
        />
      )
    }
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      {/* ── STAGE 1: LOGO IGNITION ── */}
      {stage === 'intro' && (
        <motion.div
          key="intro-stage"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans select-none"
          style={{ backgroundColor: DARK_THEME }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.3 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[130px] bg-gradient-to-tr from-emerald-500/20 via-blue-600/20 to-teal-400/20"
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center px-4 max-w-sm">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-emerald-500/20"
              >
                <span className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              </motion.div>

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border border-blue-500/20"
              >
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
              </motion.div>

              <motion.div
                initial={{ scale: 0.2, rotateY: 180, opacity: 0 }}
                animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                transition={{ duration: 1.2, type: 'spring', damping: 14 }}
                className="relative z-10 w-24 h-24 rounded-3xl bg-white/[0.04] border border-white/20 backdrop-blur-2xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.25)] flex items-center justify-center transform-gpu"
              >
                <Image
                  src="/favicon.png"
                  alt="Vincollins Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  priority
                  onError={onImageError}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={spinDone ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mt-4"
            >
              <span className="text-emerald-400 text-[10px] font-extrabold uppercase tracking-[0.35em] block mb-1">
                Welcome to
              </span>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                Vincollins College
              </h1>
              <p className="text-white/40 text-[11px] font-medium tracking-[0.25em] uppercase mt-2 italic">
                &ldquo;Geared towards excellence&rdquo;
              </p>
            </motion.div>

            <div className="mt-8 flex items-center gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  className="w-1 h-5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300"
                />
              ))}
            </div>
          </div>

          <p className="absolute bottom-6 text-white/20 text-[9px] tracking-widest font-mono">
            PORTAL ENGINE v{APP_VERSION} &bull; {year}
          </p>
        </motion.div>
      )}

      {/* ── STAGE 2: BRIDGE ── */}
      {stage === 'bridge' && (
        <motion.div
          key="bridge-stage"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999]"
          style={{ backgroundColor: DARK_THEME }}
        />
      )}

      {/* ── STAGE 3: CAMPUS BACKGROUND + SMART CARD ── */}
      {stage === 'card' && (
        <motion.div
          key="card-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto font-sans"
          style={{ backgroundColor: DARK_THEME }}
        >
          {/* ── CLEAR, VISIBLE CAMPUS BACKGROUND ── */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src="/images/app.jpg"
                alt="Vincollins College Campus"
                fill
                className="object-cover object-center"
                priority
                sizes="100vw"
                onError={onBgError}
              />
            </motion.div>

            {/* Light vignette only — keeps campus clearly visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          </div>

          {/* Top bar */}
          <div className="relative z-10 w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-white/15 border border-white/25 backdrop-blur-md shadow-lg">
                <Image
                  src="/favicon.png"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  onError={onImageError}
                />
              </div>
              <span className="text-white font-black tracking-widest text-[11px] uppercase drop-shadow-md">
                Vincollins
              </span>
            </div>

            <button
              onClick={() => startExit('home')}
              className="text-[10px] text-white hover:text-white uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 backdrop-blur-md transition-all shadow-lg"
            >
              Skip
            </button>
          </div>

          {/* Smart card */}
          <div className="relative z-10 w-full max-w-sm my-auto py-4">
            <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/40 via-white/20 to-emerald-400/30 shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="bg-[#0B1224]/75 backdrop-blur-2xl rounded-[23px] p-6 flex flex-col items-center text-center relative overflow-hidden border border-white/10">
                
                {/* Soft scan line */}
                <motion.div
                  animate={{ y: ['-100%', '320%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-emerald-300/10 to-transparent pointer-events-none"
                />

                {/* Status row */}
                <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-400/30 font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Student Access Verified
                  </div>
                  <span className="text-[10px] font-mono text-white/60 tracking-wider">
                    ONLINE
                  </span>
                </div>

                {/* ── CENTER: REAL SCHOOL LOGO ── */}
                <div className="my-5 relative">
                  <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-white/25 via-white/10 to-emerald-400/20 p-[2px] shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                    <div className="w-full h-full rounded-[14px] bg-white/95 flex items-center justify-center overflow-hidden relative">
                      {!logoLoaded && (
                        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                      )}
                      <Image
                        src="/favicon.png"
                        alt="Vincollins College Logo"
                        width={88}
                        height={88}
                        className="w-[88%] h-[88%] object-contain"
                        priority
                        onLoad={() => setLogoLoaded(true)}
                        onError={(e) => {
                          onImageError(e)
                          setLogoLoaded(true)
                        }}
                      />
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-[3px] border-[#0B1224] shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3px]" />
                  </div>
                </div>

                <h2 className="text-xl font-black text-white tracking-tight drop-shadow-sm">
                  Academic Portal Access
                </h2>
                <p className="text-white/75 text-xs mt-1.5 max-w-[260px] leading-relaxed">
                  Sign in to access real-time CBT examinations, grades, timetable, and attendance rosters.
                </p>

                {/* Actions */}
                <div className="mt-6 w-full space-y-2.5">
                  <Button
                    onClick={() => startExit('portal')}
                    className="w-full py-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/35 transition-all hover:scale-[1.01] active:scale-[0.98] border-0"
                  >
                    <LogIn className="w-4 h-4 mr-2" /> Authenticate Portal
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>

                  <Button
                    onClick={() => startExit('home')}
                    variant="outline"
                    className="w-full py-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all"
                  >
                    <Home className="w-4 h-4 mr-2" /> School Website
                  </Button>
                </div>

                {/* Feature pills */}
                <div className="mt-6 grid grid-cols-3 gap-2 w-full pt-4 border-t border-white/10">
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.06] border border-white/10">
                    <Laptop className="w-3.5 h-3.5 text-emerald-300 mb-1" />
                    <span className="text-white font-bold text-[9px] uppercase">CBT Engine</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.06] border border-white/10">
                    <Award className="w-3.5 h-3.5 text-sky-300 mb-1" />
                    <span className="text-white font-bold text-[9px] uppercase">Results</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.06] border border-white/10">
                    <BookOpen className="w-3.5 h-3.5 text-violet-300 mb-1" />
                    <span className="text-white font-bold text-[9px] uppercase">E-Library</span>
                  </div>
                </div>

                <div className="mt-4 w-full flex items-center justify-between text-[9px] text-white/45 font-medium">
                  <span className="flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-white/50" /> AUTH-SEC-READY
                  </span>
                  <span>SESSION {year}</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 px-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/70 text-[9px] font-bold tracking-widest uppercase drop-shadow">
                  Engine Readiness
                </span>
                <span className="text-emerald-300 text-[10px] font-bold font-mono drop-shadow">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/30 border border-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_10px_#34d399]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center pb-2">
            <p className="text-white/60 text-[9px] tracking-[0.25em] uppercase font-medium drop-shadow">
              &copy; {year} Vincollins College &bull; All Rights Reserved
            </p>
          </div>
        </motion.div>
      )}

      {/* ── STAGE 4: EXIT ── */}
      {stage === 'exit' && (
        <motion.div
          key="exit-stage"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999]"
          style={{ backgroundColor: DARK_THEME }}
        />
      )}
    </AnimatePresence>
  )
}