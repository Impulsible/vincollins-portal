'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogIn, Home, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react'

export function SimpleTwoStageSplash({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [stage, setStage] = useState<'logo' | 'main' | 'hidden'>('logo')
  const [logoReady, setLogoReady] = useState(false)

  // Safely manage hydration boundary
  useEffect(() => {
    setMounted(true)
    if (stage === 'logo') {
      const timer = setTimeout(() => {
        setStage('main')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [stage])

  const handleLogin = () => {
    setStage('hidden')
    router.push('/portal')
  }

  const handleGoHome = () => {
    setStage('hidden')
    router.push('/')
  }

  if (!mounted) return null
  if (stage === 'hidden') return <>{children}</>

  return (
    <AnimatePresence mode="wait">
      {/* STAGE 1: LOGO REVEAL */}
      {stage === 'logo' && (
        <motion.div
          key="simple-logo-stage"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#060D1F] via-[#0A162F] to-[#0D244D]"
        >
          {/* Subtle Ambient Radial Glowing Core */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_65%)] pointer-events-none select-none" />

          <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
            
            <motion.div
              initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 1.2, type: 'spring', damping: 14 }}
              className="relative w-28 h-28 rounded-3xl bg-white/[0.02] backdrop-blur-xl p-4 border border-white/10 shadow-2xl flex items-center justify-center"
            >
              {!logoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-3xl">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              )}
              <Image
                src="/favicon.png"
                alt="Vincollins Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain"
                onLoad={() => setLogoReady(true)}
                onError={(e) => {
                  e.currentTarget.src = '/favicon.png'
                  setLogoReady(true)
                }}
              />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6 text-2xl font-black text-white tracking-widest uppercase"
            >
              Vincollins
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.7 }}
              className="text-[10px] font-bold tracking-[0.3em] text-white uppercase mt-1"
            >
              Academic Portal
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 flex gap-2"
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-400/60"
                />
              ))}
            </motion.div>

          </div>
        </motion.div>
      )}

      {/* STAGE 2: MAIN ENTRY POINT */}
      {stage === 'main' && (
        <motion.div
          key="simple-main-stage"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#060D1F]"
        >
          {/* Dynamic Graphic Background Layer */}
          <div className="absolute inset-0">
            <Image
              src="/images/app.jpg"
              alt="Backing"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
          </div>

          {/* Interactive Navigation Content block */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-sm mx-auto w-full">
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl p-3 shadow-2xl flex items-center justify-center"
            >
              <Image
                src="/favicon.png"
                alt="Vincollins badge"
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-2xl font-black text-white text-center uppercase tracking-wider"
            >
              Vincollins College
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-white/50 text-center text-xs leading-relaxed"
            >
              Access a premium academic management portal built for modern institutions and progressive education spaces.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-col gap-3 w-full"
            >
              <Button
                onClick={handleLogin}
                className="w-full py-6 font-extrabold text-xs uppercase tracking-widest text-white rounded-xl shadow-xl transition-all hover:brightness-110 flex items-center justify-center gap-2 border-0"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                }}
              >
                <LogIn className="w-4 h-4" />
                Portal Login
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full py-6 bg-white/[0.03] hover:bg-white/[0.08] text-white border-white/10 hover:border-white/20 hover:text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Website Home
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center gap-4 text-white/30 text-[10px] font-bold uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/50" /> Secure SSL
              </span>
              <span className="w-px h-3 bg-white/10" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400/50" /> Premium UI
              </span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}