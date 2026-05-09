// components/layout/header/HeaderActions.tsx - PROPER SPACING
'use client'

import { lazy, Suspense } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NotificationBell = lazy(() => import('./NotificationBell'))
const ProfileDropdown = lazy(() => import('./ProfileDropdown'))

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  isAuthenticated: boolean
}

interface HeaderActionsProps {
  user?: User
  onLogout?: () => void
  onMobileMenuToggle: () => void
  mobileMenuOpen: boolean
}

export default function HeaderActions({ 
  user, 
  onLogout, 
  onMobileMenuToggle, 
  mobileMenuOpen 
}: HeaderActionsProps) {
  const isAuthenticated = user?.isAuthenticated ?? false

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <a 
          href="/portal" 
          className="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 bg-[#F5A623] text-[#0A2472] rounded-full font-semibold text-xs sm:text-sm hover:bg-[#F5A623]/90 transition-colors"
        >
          Portal Login
        </a>
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full text-white hover:bg-white/20"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {/* Notification Bell */}
      <div className="relative flex-shrink-0">
        <Suspense fallback={
          <div className="h-9 w-9 rounded-full bg-white/20 animate-pulse" />
        }>
          <NotificationBell userId={user?.id} role={user?.role} />
        </Suspense>
      </div>

      {/* Profile Dropdown - added margin via the button itself (ml-1) */}
      <div className="relative flex-shrink-0">
        <Suspense fallback={
          <div className="h-9 w-9 rounded-full bg-white/20 animate-pulse" />
        }>
          <ProfileDropdown user={user!} onLogout={onLogout} />
        </Suspense>
      </div>

      {/* Mobile Menu Toggle - only on mobile/tablet */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full text-white hover:bg-white/20 flex-shrink-0 ml-1 sm:ml-2"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait">
          {mobileMenuOpen ? (
            <motion.div 
              key="close" 
              initial={{ rotate: -90, opacity: 0 }} 
              animate={{ rotate: 0, opacity: 1 }} 
              exit={{ rotate: 90, opacity: 0 }} 
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div 
              key="menu" 
              initial={{ rotate: 90, opacity: 0 }} 
              animate={{ rotate: 0, opacity: 1 }} 
              exit={{ rotate: -90, opacity: 0 }} 
              transition={{ duration: 0.15 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}