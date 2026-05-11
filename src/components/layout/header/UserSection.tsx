// components/layout/header/UserSection.tsx - INDEPENDENT DROPDOWNS
'use client'

import { useState, useRef, useEffect, memo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Menu, X, Search, ChevronDown, User, Settings, LogOut, 
  LayoutDashboard, ArrowRight, Home, KeyRound
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { HeaderUser, Notification } from './types'
import { NotificationPopover } from './NotificationPopover'

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-purple-500 text-white',
  teacher: 'bg-blue-500 text-white',
  student: 'bg-emerald-500 text-white',
}

const roleDisplayNames: Record<string, string> = {
  admin: 'Administrator', teacher: 'Teacher', student: 'Student',
}

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0][0]?.toUpperCase() || 'U'
}

interface UserSectionProps {
  user: HeaderUser | null
  isAuthenticated: boolean
  pathname: string
  notifications: Notification[]
  unreadCount: number
  isPublicPage: boolean
  onSearchToggle: () => void
  onMobileToggle: () => void
  onSignOut: () => void
  mobileMenuOpen: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (id: string) => void
}

export const UserSection = memo(function UserSection({
  user, isAuthenticated, pathname, notifications, unreadCount, isPublicPage,
  onSearchToggle, onMobileToggle, onSignOut, mobileMenuOpen,
  onMarkAsRead, onMarkAllAsRead, onDeleteNotification
}: UserSectionProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const isHomePage = pathname === '/'
  const isPortalPage = pathname === '/portal'
  const isDashboardPage = !isPublicPage && !isPortalPage && !isHomePage

  // Close profile dropdown on outside click
  useEffect(() => {
    const cb = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', cb)
    return () => document.removeEventListener('mousedown', cb)
  }, [])

  // Close notification popover on outside click
  useEffect(() => {
    const cb = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', cb)
    return () => document.removeEventListener('mousedown', cb)
  }, [])

  const handleProfileToggle = useCallback(() => {
    setNotificationOpen(false) // Close notifications when opening profile
    setProfileOpen(prev => !prev)
  }, [])

  const handleNotificationToggle = useCallback((open: boolean) => {
    setProfileOpen(false) // Close profile when opening notifications
    setNotificationOpen(open)
  }, [])

  const goToDashboard = () => {
    setProfileOpen(false)
    const urls: Record<string, string> = { admin: '/admin', teacher: '/staff', student: '/student' }
    router.push(urls[user?.role || 'student'] || '/student')
  }

  return (
    // ✅ No gap, each item manages its own space
    <div className="flex items-center">
      
      {/* Search Button */}
      <Button variant="ghost" size="icon" onClick={onSearchToggle}
        className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 mx-0.5">
        <Search className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Notification Bell - independent */}
      {isAuthenticated && !isPortalPage && !isHomePage && (
        <div ref={notifRef} className="inline-flex">
          <NotificationPopover
            open={notificationOpen}
            onOpenChange={handleNotificationToggle}
            notifications={notifications}
            unreadCount={unreadCount}
            userRole={user?.role}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onDelete={onDeleteNotification}
          />
        </div>
      )}

      {/* Profile / Login - independent */}
      <div ref={profileRef} className="inline-flex">
        {isAuthenticated ? (
          <div>
            <button onClick={handleProfileToggle}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full text-white hover:bg-white/20 px-2 sm:px-3 py-1 transition-all mx-0.5">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-white/50">
                {user?.avatar && !avatarError ? (
                  <AvatarImage src={user.avatar} alt={user?.name} onError={() => setAvatarError(true)} />
                ) : null}
                <AvatarFallback className="bg-white/30 text-white text-xs font-bold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-xs lg:text-sm font-semibold text-white truncate max-w-[80px]">Hi, {user?.firstName || 'User'}</p>
                <p className="text-[8px] lg:text-[10px] text-white/80">{roleDisplayNames[user?.role || 'student']}</p>
              </div>
              <ChevronDown className={cn("h-3 w-3 text-white transition-transform", profileOpen && "rotate-180")} />
            </button>

            {/* Profile Dropdown - absolutely positioned relative to its own container */}
            {profileOpen && (
              <div className="absolute right-0 top-[64px] w-72 sm:w-80 bg-white rounded-xl shadow-2xl border z-[60] overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                        {user?.name ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                      <Badge className={cn("mt-1 text-xs text-white", roleBadgeColors[user?.role || 'student'])}>
                        {roleDisplayNames[user?.role || 'student']}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {isPublicPage && (
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                    <button onClick={goToDashboard} className="w-full py-2.5 bg-[#F5A623] text-[#0A2472] rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <LayoutDashboard className="h-4 w-4 shrink-0" />Go to Dashboard<ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                )}
                
                {isDashboardPage && (
                  <div className="py-1">
                    <Link href={user?.role === 'student' ? '/student/profile' : '/staff/settings'}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      onClick={() => setProfileOpen(false)}>
                      <User className="h-4 w-4 text-gray-400 shrink-0" />My Profile
                    </Link>
                    <Link href={user?.role === 'student' ? '/student/settings' : '/staff/settings'}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      onClick={() => setProfileOpen(false)}>
                      <Settings className="h-4 w-4 text-gray-400 shrink-0" />Settings
                    </Link>
                  </div>
                )}
                
                <div className="py-1 border-t">
                  {pathname !== '/' && (
                    <Link href="/" className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      onClick={() => setProfileOpen(false)}>
                      <Home className="h-4 w-4 text-gray-400 shrink-0" />Home Page
                    </Link>
                  )}
                  {pathname !== '/portal' && (
                    <Link href="/portal" className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      onClick={() => setProfileOpen(false)}>
                      <KeyRound className="h-4 w-4 text-gray-400 shrink-0" />Portal Page
                    </Link>
                  )}
                </div>
                
                <div className="border-t p-2">
                  <button onClick={() => { setProfileOpen(false); onSignOut() }}
                    className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-3">
                    <LogOut className="h-4 w-4 shrink-0" />Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          isPublicPage && (
            <Link href="/portal" className="hidden sm:inline-flex items-center px-4 py-2 bg-[#F5A623] text-[#0A2472] rounded-full font-semibold text-sm mx-0.5">
              <KeyRound className="mr-1.5 h-4 w-4" />Portal Login
            </Link>
          )
        )}
      </div>

      {/* Mobile Toggle */}
      <button onClick={onMobileToggle}
        className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-full text-white hover:bg-white/20 ml-0.5">
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
  )
})