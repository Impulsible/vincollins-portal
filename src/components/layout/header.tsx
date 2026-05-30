// components/layout/header.tsx - SHOW HEADER IMMEDIATELY
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

// ✅ Simple loading shell - no animation, just static placeholder
const HeaderShell = memo(() => (
  <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3">
    <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  </header>
))
HeaderShell.displayName = 'HeaderShell'

function HeaderContent({ user: propUser, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const { 
    user: fetchedUser, 
    schoolSettings, 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isLoading,
    isAuthenticated 
  } = useHeaderData()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Use prop user if provided, otherwise fetched user
  const user = propUser || fetchedUser

  // Determine page type for navigation
  const isHomePage = pathname === '/'
  const isPortalPage = pathname === '/portal'
  
  const publicPages = ['/', '/admission', '/schools', '/contact']
  const isPublicPage = publicPages.includes(pathname || '') || pathname?.startsWith('/admission') || pathname?.startsWith('/schools')
  
  const isStudentPage = pathname?.startsWith('/student')
  const isStaffPage = pathname?.startsWith('/staff')
  const isAdminPage = pathname?.startsWith('/admin')
  const isDashboardPage = isStudentPage || isStaffPage || isAdminPage

  // Navigation decision
  const showPublicNav = !isAuthenticated || (isPublicPage || isHomePage || isPortalPage)
  const showDashboardNav = isAuthenticated && isDashboardPage

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

  // ✅ Show header shell during hydration only (very brief)
  if (!isHydrated) {
    return <HeaderShell />
  }

  // ✅ Always show header - use cached data if available
  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500",
        scrolled ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-2xl py-1.5 sm:py-2" : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3 lg:py-4"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-3">
            
            <Logo schoolSettings={schoolSettings} />

            <div className="hidden lg:flex flex-1 justify-center">
              <DesktopNav 
                userRole={showDashboardNav ? user?.role : undefined}
                pathname={pathname} 
                isPublic={showPublicNav}
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

export const Header = memo(function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderShell />}>
      <HeaderContent {...props} />
    </Suspense>
  )
})

export default Header