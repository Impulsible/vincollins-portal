// src/components/SimpleTwoStageSplash.tsx

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogIn, Home, ArrowRight, Shield, Sparkles } from 'lucide-react'

export function SimpleTwoStageSplash({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [stage, setStage] = useState<'logo' | 'main' | 'hidden'>('logo')

  useEffect(() => {
    if (stage === 'logo') {
      const timer = setTimeout(() => setStage('main'), 2800)
      return () => clearTimeout(timer)
    }
  }, [stage])

  const handleLogin = () => {
    setStage('hidden')
    router.push('/login')
  }

  const handleGoHome = () => {
    setStage('hidden')
    router.push('/dashboard')
  }

  if (stage === 'hidden') return <>{children}</>

  return (
    <AnimatePresence>
      {/* Stage 1: Logo Animation */}
      {stage === 'logo' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-700 to-teal-700"
        >
          <motion.div
            initial={{ scale: 0.3, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, type: 'spring' }}
            className="relative w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-2xl p-4 border border-white/20"
          >
            <Image
              src="/icon-512x512.png"
              alt="Logo"
              width={120}
              height={120}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-3xl font-bold text-white"
          >
            Welcome to Vincollins College
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-white/60"
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Stage 2: Main Splash */}
      {stage === 'main' && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
        >
          {/* Background */}
          <div className="absolute inset-0">
            <Image
              src="/splash-bg.jpg"
              alt="Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-xl p-3 border border-white/20"
            >
              <Image
                src="/icon-512x512.png"
                alt="Vincollins College"
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-3xl font-bold text-white text-center"
            >
              Vincollins College
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-white/70 text-center max-w-md text-sm"
            >
              Smart Education Management System for modern learning environments.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs"
            >
              <Button
                onClick={handleLogin}
                className="flex-1 bg-white hover:bg-white/90 text-emerald-700 font-semibold py-5 rounded-xl shadow-lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 py-5 rounded-xl"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex items-center gap-3 text-white/30 text-xs"
            >
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Secure
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Premium
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}