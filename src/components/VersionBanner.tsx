// components/VersionBanner.tsx - FIXED (Shows only once per version, not on every login)
'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, RefreshCw } from 'lucide-react'
import packageJson from '../../package.json'

const CURRENT_VERSION = packageJson.version

export function VersionBanner() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasCheckedRef = useRef(false) // ✅ Prevent multiple checks

  const isDashboardPage = pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/staff') || 
                          pathname?.startsWith('/student')
  
  const isAuthPage = pathname === '/portal' || 
                     pathname === '/forgot-password' || 
                     pathname === '/reset-password'

  useEffect(() => {
    // ✅ Only check once per session
    if (hasCheckedRef.current) return
    if (!isDashboardPage || isAuthPage) return

    hasCheckedRef.current = true

    const seenVersion = localStorage.getItem('versionBannerSeen')
    
    // Only show if version changed
    if (seenVersion !== CURRENT_VERSION) {
      setShow(true)
      // Mark as seen immediately
      localStorage.setItem('versionBannerSeen', CURRENT_VERSION)
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShow(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [isDashboardPage, isAuthPage]) // ✅ Dependencies don't cause re-runs

  const handleDismiss = () => {
    setShow(false)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  if (!isDashboardPage || isAuthPage) return null
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow-2xl overflow-hidden">
          <div className="relative p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">✨ New Update Available!</p>
                <p className="text-xs text-white/80 mt-0.5">
                  The dashboard has been updated to the latest version.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    v{CURRENT_VERSION}
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-xs font-medium underline underline-offset-2 hover:text-white/90 transition-colors flex items-center gap-1"
                  >
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      'Refresh Now'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}