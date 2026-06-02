// components/VersionBanner.tsx - Only show on dashboard pages
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, RefreshCw } from 'lucide-react'

const APP_VERSION = '2.0.0'

export function VersionBanner() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ✅ Only show on dashboard pages, NOT on portal or auth pages
  const isDashboardPage = pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/staff') || 
                          pathname?.startsWith('/student')
  
  const isAuthPage = pathname === '/portal' || 
                     pathname === '/forgot-password' || 
                     pathname === '/reset-password'

  useEffect(() => {
    // Don't show on portal or auth pages
    if (!isDashboardPage || isAuthPage) return

    const seenVersion = localStorage.getItem('versionBannerSeen')
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || APP_VERSION
    
    if (seenVersion !== currentVersion) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        localStorage.setItem('versionBannerSeen', currentVersion)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [isDashboardPage, isAuthPage])

  const handleDismiss = () => {
    setShow(false)
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || APP_VERSION
    localStorage.setItem('versionBannerSeen', currentVersion)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    localStorage.removeItem('versionBannerSeen')
    window.location.reload()
  }

  // ✅ Don't render on portal or auth pages
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
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">✨ New Version Loaded!</p>
                <p className="text-xs text-white/80 mt-0.5">
                  Your dashboard has been updated to the latest version.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    v{process.env.NEXT_PUBLIC_APP_VERSION || APP_VERSION}
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