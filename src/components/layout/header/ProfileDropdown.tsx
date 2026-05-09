// components/layout/header/ProfileDropdown.tsx - COMPACT WIDE PANEL
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, User, Settings, LogOut, LayoutDashboard, ArrowRight, Shield } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
}

interface ProfileDropdownProps {
  user: User
  onLogout?: () => void
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-500',
  teacher: 'bg-blue-500',
  student: 'bg-emerald-500',
}

const roleNames: Record<string, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
}

const roleIcons: Record<string, any> = {
  admin: Shield,
  teacher: User,
  student: User,
}

export default function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1024)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const RoleIcon = roleIcons[user.role] || User

  // SSR-safe window detection
  useEffect(() => {
    setMounted(true)
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open])

  const getInitials = () => {
    const parts = user.name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0]?.toUpperCase() || 'U'
  }

  const getFirstName = () => {
    const parts = user.name.split(' ')
    if (parts.length >= 2) return parts[1]
    return parts[0] || 'User'
  }

  const handleSignOut = () => {
    setOpen(false)
    onLogout?.()
  }

  const goToDashboard = () => {
    setOpen(false)
    const urls: Record<string, string> = { admin: '/admin', teacher: '/staff', student: '/student' }
    router.push(urls[user.role] || '/student')
  }

  const isMobile = mounted && windowWidth < 640

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 rounded-full text-white hover:bg-white/20 transition-all duration-300",
          "px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5",
          "ml-1 sm:ml-1.5 lg:ml-2"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 ring-1 sm:ring-2 ring-white/50 shrink-0">
          {user.avatar && !avatarError ? (
            <AvatarImage src={user.avatar} alt={user.name} onError={() => setAvatarError(true)} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-white/30 text-white text-[10px] sm:text-xs font-bold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden lg:block text-left min-w-0 max-w-[120px]">
          <p className="text-sm font-semibold leading-tight text-white truncate">
            Hi, {getFirstName()}
          </p>
          <p className="text-[10px] text-white/80 truncate">
            {roleNames[user.role]}
          </p>
        </div>
        <ChevronDown className={cn(
          "h-3 w-3 lg:h-4 lg:w-4 text-white transition-transform duration-300 shrink-0",
          open && "rotate-180"
        )} />
      </button>

      {/* Full-width backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Panel - Below header, left-aligned, compact width */}
      {open && (
        <div 
          className={cn(
            "fixed z-50 bg-white shadow-2xl border border-gray-200 overflow-hidden",
            // Positioned below the header
            "top-[57px] sm:top-[65px] lg:top-[73px]",
            // Left-aligned, responsive width
            "left-0 right-0 sm:left-auto sm:right-4",
            // Reduced width
            "w-full sm:w-[340px] lg:w-[360px]",
            // Rounded corners
            "sm:rounded-2xl",
            // Animation
            "animate-in fade-in-0 slide-in-from-top-2 duration-200"
          )}
          style={{
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
        >
          {/* User Header */}
          <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white shadow-lg shrink-0">
                {user.avatar && !avatarError ? (
                  <AvatarImage src={user.avatar} alt={user.name} onError={() => setAvatarError(true)} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <Badge className={cn("mt-1 text-[10px] sm:text-xs text-white", roleColors[user.role])}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleNames[user.role]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dashboard Button */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <button
              onClick={goToDashboard}
              className="w-full py-2.5 bg-[#F5A623] text-[#0A2472] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#F5A623]/90 transition-colors active:scale-[0.98] shadow-sm"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push(user.role === 'student' ? '/student/profile' : '/staff/settings') }}
              className="w-full px-3 sm:px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium">My Profile</p>
                <p className="text-[10px] text-gray-400">View and edit your profile</p>
              </div>
            </button>
            <button
              onClick={() => { setOpen(false); router.push(user.role === 'student' ? '/student/settings' : '/staff/settings') }}
              className="w-full px-3 sm:px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Settings className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Settings</p>
                <p className="text-[10px] text-gray-400">Preferences and account settings</p>
              </div>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t p-2.5 sm:p-3">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 text-left text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-3 transition-colors px-2"
            >
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-[10px] text-red-400">Log out of your account</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}