// components/layout/header.tsx - REFACTORED NON-BLOCKING HEADER
'use client'

import { useState, useEffect, Suspense, lazy, memo } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useHeaderData } from './header/useHeaderData'
import { Logo } from './header/Logo'
import { DesktopNav } from './header/DesktopNav'
import { UserSection } from './header/UserSection'
import { SearchBar } from './header/SearchBar'
import { MobileMenu } from './header/MobileMenu'
import { SignOutDialog } from './header/SignOutDialog'

const CBTDialog = lazy(() => import('./header/CBTDialog'))

export interface HeaderUser {
  id: string
  name: string
  firstName: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  isAuthenticated: boolean
}

interface HeaderProps {
  user?: HeaderUser
  onLogout?: () => void
}

// ✅ Static shell for initial SSR - renders immediately
const HeaderShell = memo(() => (
  <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3">
    <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <Logo schoolSettings={null} />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  </header>
))
HeaderShell.displayName = 'HeaderShell'

function HeaderContent({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // ✅ Non-blocking - all data loads in background
  const { user, schoolSettings, notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useHeaderData()
  const isAuthenticated = user?.isAuthenticated ?? false

  // Scroll detection
  useEffect(() => {
    const cb = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', cb, { passive: true })
    return () => window.removeEventListener('scroll', cb)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  const isPortalPage = pathname === '/portal'
  const isHomePage = pathname === '/'
  const isPublicPage = pathname === '/' || pathname === '/admission' || pathname === '/schools' || pathname === '/contact'

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500",
        scrolled ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-2xl py-1.5 sm:py-2" : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3 lg:py-4"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-3">
            
            <Logo schoolSettings={schoolSettings} />

            {/* ✅ ALWAYS SHOW DESKTOP NAV - public links for unauthenticated users */}
            <div className="hidden lg:flex flex-1 justify-center">
              <DesktopNav 
                userRole={user?.role} 
                pathname={pathname} 
                isPublic={!isAuthenticated || isPublicPage || isPortalPage || isHomePage}
                onCbtClick={() => setShowCbtInfo(true)} 
              />
            </div>

            <UserSection
              user={user}
              isAuthenticated={isAuthenticated}
              pathname={pathname}
              notifications={notifications}
              unreadCount={unreadCount}
              isPublicPage={isPublicPage || isPortalPage || isHomePage}
              onSearchToggle={() => setSearchOpen(!searchOpen)}
              onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
              onSignOut={() => setShowSignOut(true)}
              mobileMenuOpen={mobileMenuOpen}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
            />
          </div>
        </div>

        <SearchBar open={searchOpen} query={searchQuery} onChange={setSearchQuery} onClose={() => setSearchOpen(false)} />
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        schoolSettings={schoolSettings}
        onSignOut={() => setShowSignOut(true)}
        pathname={pathname}
      />

      <Suspense fallback={null}>
        {showCbtInfo && <CBTDialog open={showCbtInfo} onClose={() => setShowCbtInfo(false)} />}
      </Suspense>

      <SignOutDialog open={showSignOut} onClose={() => setShowSignOut(false)} onLogout={onLogout} />
    </>
  )
}

// ✅ Main export - same import path for all pages
export const Header = memo(function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderShell />}>
      <HeaderContent onLogout={props.onLogout} />
    </Suspense>
  )
})

// ✅ Default export for existing imports
export default Header