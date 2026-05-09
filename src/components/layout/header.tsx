// components/layout/header.tsx - LIGHTWEIGHT MAIN HEADER (ALL DETAILS PRESERVED)
'use client'

import { Suspense, lazy, useState } from 'react'
import { Logo } from './header/Logo'
import { DesktopNav } from './header/DesktopNav'
import { cn } from '@/lib/utils'

// ✅ Lazy load heavy components
const HeaderActions = lazy(() => import('./header/HeaderActions'))
const MobileMenu = lazy(() => import('./header/MobileMenu'))

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  isAuthenticated: boolean
}

interface HeaderProps {
  user?: User
  onLogout?: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthenticated = user?.isAuthenticated ?? false

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3 lg:py-4 transition-all duration-300"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-3">
            
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation - only if authenticated */}
            {isAuthenticated && (
              <div className="hidden lg:flex flex-1 justify-center">
                <DesktopNav userRole={user?.role} />
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Suspense fallback={<div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />}>
                <HeaderActions
                  user={user}
                  onLogout={onLogout}
                  onMobileMenuToggle={() => setMobileMenuOpen(prev => !prev)}
                  mobileMenuOpen={mobileMenuOpen}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Suspense fallback={null}>
        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          onLogout={onLogout}
        />
      </Suspense>
    </>
  )
}

export default Header