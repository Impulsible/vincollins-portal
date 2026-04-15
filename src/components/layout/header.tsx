/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/header.tsx - COMPLETE PREMIUM HEADER
'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { 
  ChevronDown, User, Home, BookOpen, Laptop, Phone, Calendar, Users, FileText,
  Bell, Search, Settings, LogOut, LayoutDashboard, GraduationCap, Menu, X,
  Sparkles, Mail, MapPin, Clock, Facebook, Twitter, Instagram,
  Linkedin, KeyRound, MonitorPlay, BarChart3, TrendingUp,
  HelpCircle, Lock, Timer, Shuffle, Shield, Award, RotateCcw, ArrowRight,
  CheckCircle, ChevronRight, LucideIcon, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// STRICT ROLE TYPES - Only 3 roles allowed
type UserRole = 'admin' | 'teacher' | 'student'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  isAuthenticated: boolean
}

interface SchoolSettings {
  school_name?: string
  logo_path?: string
}

// Navigation item type
interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  tab?: string
  isCbt?: boolean
}

// Helper function to format names - NO DOTS, Proper Capitalization
const formatFullName = (input: string): string => {
  if (!input) return 'User'
  
  return input
    .replace(/\./g, ' ')
    .replace(/[_\-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper to get initials from formatted name
const getInitialsFromName = (name: string): string => {
  if (!name || name === 'User') return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Helper to get first name
const getFirstNameFromName = (name: string): string => {
  if (!name || name === 'User') return 'User'
  return name.trim().split(/\s+/)[0]
}

// Helper to validate and normalize role
const normalizeRole = (role: string | null | undefined): UserRole => {
  if (!role) return 'student'
  
  const lowerRole = role.toLowerCase()
  
  if (lowerRole === 'staff') return 'teacher'
  
  if (lowerRole === 'admin' || lowerRole === 'teacher' || lowerRole === 'student') {
    return lowerRole as UserRole
  }
  
  console.warn(`Unknown role "${role}", defaulting to student`)
  return 'student'
}

// Helper to get dashboard link based on role
const getDashboardLink = (role: UserRole): string => {
  switch (role) {
    case 'admin': return '/admin'
    case 'teacher': return '/staff'
    case 'student': return '/student'
    default: return '/portal'
  }
}

// Navigation for public pages (Home, Portal)
const publicNavigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Admission', href: '/admission', icon: FileText },
  { name: 'Schools', href: '/schools', icon: BookOpen },
  { name: 'CBT Platform', href: '#cbt', icon: Laptop, isCbt: true },
  { name: 'Contact', href: '/contact', icon: Phone },
]

// Student navigation - CLEAN, only dashboard tabs
const studentNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/student?tab=overview', icon: LayoutDashboard, tab: 'overview' },
  { name: 'My Exams', href: '/student?tab=exams', icon: MonitorPlay, tab: 'exams' },
  { name: 'Results', href: '/student?tab=results', icon: GraduationCap, tab: 'results' },
  { name: 'Profile', href: '/student?tab=profile', icon: User, tab: 'profile' },
]

// Teacher navigation - CLEAN, only dashboard tabs
const teacherNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/staff?tab=overview', icon: LayoutDashboard, tab: 'overview' },
  { name: 'Exams', href: '/staff?tab=exams', icon: MonitorPlay, tab: 'exams' },
  { name: 'Assignments', href: '/staff?tab=assignments', icon: FileText, tab: 'assignments' },
  { name: 'Students', href: '/staff?tab=students', icon: Users, tab: 'students' },
  { name: 'Analytics', href: '/staff?tab=analytics', icon: BarChart3, tab: 'analytics' },
]

// Admin navigation - CLEAN, only dashboard tabs
const adminNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard, tab: 'overview' },
  { name: 'Exam Approvals', href: '/admin?tab=exams', icon: MonitorPlay, tab: 'exams' },
  { name: 'User Management', href: '/admin?tab=users', icon: Users, tab: 'users' },
  { name: 'Settings', href: '/admin?tab=settings', icon: Settings, tab: 'settings' },
  { name: 'Reports', href: '/admin?tab=reports', icon: BarChart3, tab: 'reports' },
]

const quickLinks = [
  { name: 'Academic Calendar', href: '/calendar', icon: Calendar },
  { name: 'E-Library', href: '/library', icon: BookOpen },
  { name: 'Student Portal', href: '/portal', icon: GraduationCap },
  { name: 'Staff Portal', href: '/portal', icon: Users },
]

const contactInfo = [
  { icon: MapPin, text: '123 Education Road, Ikeja, Lagos, Nigeria' },
  { icon: Phone, text: '+234 800 123 4567' },
  { icon: Mail, text: 'info@vincollins.edu.ng' },
  { icon: Clock, text: 'Mon-Fri: 8:00 AM - 4:00 PM' },
]

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/vincollins', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/vincollins', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/vincollins', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/school/vincollins', label: 'LinkedIn' },
]

// Premium CBT Features
const cbtFeatures = [
  { 
    title: 'Secure Exam Environment', 
    description: 'Full-screen lockdown mode prevents tab switching, copy-paste, and screenshots during exams', 
    icon: Shield 
  },
  { 
    title: 'Smart Timer System', 
    description: 'Real-time countdown with visual warnings. Auto-submit when time expires', 
    icon: Timer 
  },
  { 
    title: 'Question Randomization', 
    description: 'Questions and options shuffled uniquely for each student to maintain integrity', 
    icon: Shuffle 
  },
  { 
    title: 'Instant Results & Analytics', 
    description: 'Objective questions graded immediately with detailed performance analytics', 
    icon: TrendingUp 
  },
  { 
    title: 'Multi-Format Support', 
    description: 'Support for MCQs, True/False, Theory/Essay questions, and file uploads', 
    icon: FileText 
  },
  { 
    title: 'Auto-Save & Resume', 
    description: 'Progress auto-saved. Resume interrupted exams from where you stopped', 
    icon: RotateCcw 
  },
]

interface HeaderProps {
  user?: User
  onLogout?: () => void
}

function HeaderContent({ user: propUser, onLogout }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  
  const currentYear = new Date().getFullYear()
  const isPortalPage = pathname === '/portal'
  const isHomePage = pathname === '/'

  // Fetch school settings
  useEffect(() => {
    const fetchSchoolSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('school_settings')
          .select('school_name, logo_path')
          .single()
        
        if (!error && data) {
          setSchoolSettings(data)
        }
      } catch (error) {
        console.error('Error fetching school settings:', error)
      }
    }
    fetchSchoolSettings()
  }, [])

  // Check if nav item is active - syncs with sidebar tabs
  const isNavActive = (href: string, tab?: string) => {
    if (tab) {
      const basePath = href.split('?')[0]
      if (pathname === basePath) {
        const urlTab = searchParams.get('tab') || 'overview'
        return urlTab === tab
      }
      return false
    }
    
    if (pathname === href) return true
    if (href === '/' || href === '/staff' || href === '/student' || href === '/admin') {
      return pathname === href
    }
    if (pathname?.startsWith(href + '/')) return true
    return false
  }

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    if (!user?.id) return
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      if (!error) setNotificationCount(count || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch user with avatar
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          setUser(null)
          setLoading(false)
          return
        }

        let userData: any = null
        let userRole: UserRole = 'student'
        
        const { data: profileById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileById) {
          userData = profileById
          userRole = normalizeRole(profileById.role)
        } else {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle()

          if (profileByEmail) {
            userData = profileByEmail
            userRole = normalizeRole(profileByEmail.role)
          }
        }

        if (!userData && session.user.user_metadata?.role) {
          userRole = normalizeRole(session.user.user_metadata.role)
        }

        let rawName = ''
        if (userData?.full_name) {
          rawName = userData.full_name
        } else if (userData?.name) {
          rawName = userData.name
        } else if (session.user.user_metadata?.full_name) {
          rawName = session.user.user_metadata.full_name
        } else if (session.user.email) {
          rawName = session.user.email.split('@')[0]
        } else {
          rawName = 'User'
        }

        const formattedName = formatFullName(rawName)

        setUser({
          id: userData?.id || session.user.id,
          name: formattedName,
          email: userData?.email || session.user.email || '',
          role: userRole,
          avatar: userData?.photo_url || userData?.avatar_url || session.user.user_metadata?.avatar_url,
          isAuthenticated: true
        })

      } catch (err) {
        console.error('❌ Fetch error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  const getNavigation = (): NavigationItem[] => {
    if (isPortalPage || isHomePage || !user?.isAuthenticated) return publicNavigation
    
    switch (user.role) {
      case 'admin': return adminNavigation
      case 'teacher': return teacherNavigation
      case 'student': return studentNavigation
      default: return publicNavigation
    }
  }

  const currentNavigation = getNavigation()

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return getInitialsFromName(user.name)
  }

  const getFirstName = () => {
    if (!user?.name) return 'User'
    return getFirstNameFromName(user.name)
  }

  const getHeaderGreeting = () => {
    if (!user) return 'User'
    return getFirstName()
  }

  const getMobileGreeting = () => {
    if (!user) return 'Welcome!'
    const firstName = getFirstName()
    return `Hi, ${firstName}!`
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-500 text-white'
      case 'teacher': return 'bg-blue-500 text-white'
      case 'student': return 'bg-emerald-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'teacher': return 'Teacher'
      case 'student': return 'Student'
      default: return role
    }
  }

  const handleCbtClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowCbtInfo(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogoutClick = () => {
    setProfileOpen(false)
    setMobileMenuOpen(false)
    setShowSignOutConfirm(true)
  }

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false)
    await supabase.auth.signOut({ scope: 'local' })
    onLogout?.()
    router.push('/')
    router.refresh()
  }

  const handleNotificationClick = () => {
    if (user?.role === 'admin') {
      router.push('/admin?tab=exams')
    } else {
      router.push('/notifications')
    }
  }

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-3">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 animate-pulse" />
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500",
        scrolled ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-2xl py-2" : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-3 sm:py-4"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* CLEAN LOGO - Smaller on mobile */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                className="relative"
              >
                {schoolSettings?.logo_path ? (
                  <div className="relative h-8 w-8 sm:h-11 sm:w-11 group-hover:scale-105 transition-all duration-300">
                    <Image 
                      src={schoolSettings.logo_path} 
                      alt={schoolSettings.school_name || 'Vincollins College Logo'} 
                      width={44}
                      height={44}
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <div className="relative h-8 w-8 sm:h-11 sm:w-11 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <GraduationCap className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                )}
              </motion.div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-xl font-bold text-white leading-tight tracking-wide">
                    Vincollins
                  </span>
                  <span className="text-sm sm:text-xl font-bold text-[#F5A623] leading-tight tracking-wide">
                    College
                  </span>
                </div>
                <span className="text-[8px] sm:text-xs text-white/70 -mt-0.5 tracking-wider font-medium hidden sm:block">
                  GEARED TOWARDS EXCELLENCE
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Perfectly centered */}
            <nav className={cn(
              "hidden lg:flex items-center",
              isPortalPage 
                ? "justify-center flex-1 mr-12" 
                : "justify-center flex-1"
            )}>
              <div className="flex items-center gap-1 xl:gap-2 bg-white/15 rounded-full p-1 shadow-lg">
                {currentNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = isNavActive(item.href, item.tab)
                  const isCbt = item.name === 'CBT Platform' || item.isCbt
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={isCbt ? handleCbtClick : undefined}
                      prefetch={false}
                      className={cn(
                        "relative px-4 xl:px-5 py-2 sm:py-2.5 text-sm font-semibold transition-all duration-300 rounded-full",
                        isActive 
                          ? "text-[#0A2472] bg-white shadow-lg" 
                          : "text-white hover:text-white hover:bg-white/25"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", isActive ? "text-[#0A2472]" : "text-white")} />
                        <span>{item.name}</span>
                        {isCbt && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0.5 bg-[#F5A623] text-[#0A2472] font-bold">
                            CBT
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Right Section - Proper spacing for mobile */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Notifications - Only on dashboard pages */}
              {user?.isAuthenticated && !isPortalPage && !isHomePage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
                        onClick={handleNotificationClick}
                      >
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full text-white text-[10px] sm:text-xs flex items-center justify-center font-bold animate-pulse">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {notificationCount > 0 ? `${notificationCount} new` : 'No new notifications'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* FOR AUTHENTICATED USERS - Show Avatar with Dropdown */}
              {user?.isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-1 sm:gap-2 rounded-full text-white hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 transition-all duration-300 h-auto"
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-1 sm:ring-2 ring-white/50">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-white/30 text-white text-xs sm:text-sm font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-xs sm:text-sm font-semibold leading-tight text-white">
                        Hi, {getHeaderGreeting()}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-white/80">{getRoleDisplayName(user.role)}</p>
                    </div>
                    <ChevronDown className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4 text-white transition-transform duration-300",
                      profileOpen && "rotate-180"
                    )} />
                  </Button>

                  {/* DROPDOWN MENU */}
                  {profileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {/* User Info Header */}
                      <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/20">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-bold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{user.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                            <Badge className={cn("mt-1 sm:mt-1.5 text-xs text-white", getRoleBadgeColor(user.role))}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* DASHBOARD BUTTON - Primary CTA */}
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                        <button
                          onClick={() => {
                            setProfileOpen(false)
                            router.push(getDashboardLink(user.role))
                          }}
                          className="w-full px-3 py-2 sm:py-2.5 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/95 hover:to-[#F5A623] text-[#0A2472] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg text-sm"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>
                            {user.role === 'admin' ? 'Admin Dashboard' : 
                             user.role === 'teacher' ? 'Teacher Dashboard' : 
                             'Student Dashboard'}
                          </span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                      
                      {/* Main Menu Items - Only on dashboard pages */}
                      {!isPortalPage && !isHomePage && (
                        <div className="py-1">
                          <Link 
                            href={user.role === 'student' ? '/student?tab=profile' : user.role === 'admin' ? '/admin?tab=settings' : '/staff?tab=overview'} 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                            onClick={() => setProfileOpen(false)}
                          >
                            <User className="h-4 w-4 text-gray-400" />
                            <span>My Profile</span>
                          </Link>
                          
                          <Link 
                            href="/notifications"
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                            onClick={() => setProfileOpen(false)}
                          >
                            <Bell className="h-4 w-4 text-gray-400" />
                            <span>Notifications</span>
                            {notificationCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-xs">{notificationCount}</Badge>
                            )}
                          </Link>
                          
                          <Link 
                            href={user.role === 'student' ? '/student?tab=settings' : user.role === 'admin' ? '/admin?tab=settings' : '/staff?tab=settings'} 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                            onClick={() => setProfileOpen(false)}
                          >
                            <Settings className="h-4 w-4 text-gray-400" />
                            <span>Settings</span>
                          </Link>
                        </div>
                      )}
                      
                      {/* Quick Links Section */}
                      <div className="py-1 border-t border-gray-100">
                        <p className="px-3 sm:px-4 py-1 sm:py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Quick Links
                        </p>
                        
                        {pathname !== '/' && (
                          <Link 
                            href="/" 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                            onClick={() => setProfileOpen(false)}
                          >
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Home Page</p>
                              <p className="text-[10px] sm:text-xs text-gray-400">Return to main website</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </Link>
                        )}
                        
                        {pathname !== '/portal' && (
                          <Link 
                            href="/portal" 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                            onClick={() => setProfileOpen(false)}
                          >
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                              <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Portal Page</p>
                              <p className="text-[10px] sm:text-xs text-gray-400">Login or switch account</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </Link>
                        )}
                      </div>
                      
                      {/* Sign Out */}
                      <div className="border-t border-gray-100"></div>
                      
                      <div className="p-2">
                        <button 
                          onClick={handleLogoutClick}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PORTAL LOGIN - Desktop only */
                !user?.isAuthenticated && isHomePage && (
                  <Link href="/portal" className="hidden sm:block">
                    <Button className="bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623] text-[#0A2472] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group px-4 sm:px-6 py-2 font-semibold text-sm">
                      <KeyRound className="mr-1.5 sm:mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                      Portal Login
                    </Button>
                  </Link>
                )
              )}

              {/* Hamburger Menu Button - ALWAYS VISIBLE ON MOBILE */}
              <button
                className="lg:hidden relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-all duration-300 text-white hover:bg-white/20 active:scale-95 ml-0.5"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 px-4">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white shadow-2xl border-2 border-primary/30 rounded-full py-6 text-lg pr-12"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* PREMIUM CBT PLATFORM DIALOG */}
      <Dialog open={showCbtInfo} onOpenChange={setShowCbtInfo}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto p-0">
          <div className="relative bg-gradient-to-br from-[#0A2472] via-[#1e3a8a] to-[#0A2472] p-6 sm:p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/10 rounded-full blur-2xl" />
            
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#F5A623]/80 flex items-center justify-center shadow-xl">
                  <Laptop className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
                    Vincollins CBT Platform
                    <Badge className="bg-[#F5A623] text-[#0A2472] ml-2 text-xs">SECURE</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-sm sm:text-base mt-1">
                    Secure, Reliable & Intelligent Online Examination System
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-xl sm:text-3xl font-bold text-[#0A2472]">10k+</p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Exams Delivered</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <p className="text-xl sm:text-3xl font-bold text-[#0A2472]">99.9%</p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Platform Uptime</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <p className="text-xl sm:text-3xl font-bold text-[#0A2472]">256-bit</p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">SSL Encryption</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <p className="text-xl sm:text-3xl font-bold text-[#0A2472]">24/7</p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Tech Support</p>
              </motion.div>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-[#0A2472] mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5A623]" />
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {cbtFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5A623]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0A2472] text-sm sm:text-base">{feature.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end border-t pt-6">
              <Button variant="outline" onClick={() => setShowCbtInfo(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowCbtInfo(false)
                  router.push('/portal')
                }}
                className="bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623] text-[#0A2472] font-bold shadow-md hover:shadow-lg"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Login to Student Portal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 lg:hidden overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] text-white p-5">
              <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 p-2">
                <X className="h-5 w-5" />
              </button>
              <p className="font-semibold text-lg">Vincollins College</p>
              
              {user?.isAuthenticated && (
                <div className="mt-4 p-4 bg-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-white/30 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{getMobileGreeting()}</p>
                      <p className="text-sm text-white/80">{user.name}</p>
                      <Badge className={cn("mt-1 text-white", getRoleBadgeColor(user.role))}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              {currentNavigation.map((item) => {
                const Icon = item.icon
                const isActive = isNavActive(item.href, item.tab)
                const isCbt = item.name === 'CBT Platform' || item.isCbt
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    onClick={(e) => {
                      if (isCbt) {
                        e.preventDefault()
                        setMobileMenuOpen(false)
                        setShowCbtInfo(true)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      isActive ? "bg-[#0A2472]/10 text-[#0A2472] font-semibold" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Dashboard Link for authenticated users */}
            {user?.isAuthenticated && (
              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    router.push(getDashboardLink(user.role))
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg shadow-md"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* Portal Login for unauthenticated users on mobile */}
            {!user?.isAuthenticated && (
              <div className="p-4 border-t">
                <Link
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg shadow-md"
                >
                  <KeyRound className="h-5 w-5" />
                  Portal Login
                </Link>
              </div>
            )}

            <div className="p-4 border-t">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Links</p>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl"
                    >
                      <Icon className="h-4 w-4 text-[#0A2472]" />
                      <span>{link.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Us</p>
              <div className="space-y-2">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-2 py-1.5">
                    <info.icon className="h-4 w-4 text-[#0A2472]" />
                    <span className="text-xs text-gray-600">{info.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t">
              <div className="flex justify-center gap-5">
                {socialLinks.map((social, idx) => {
                  const Icon = social.icon
                  return (
                    <Link
                      key={idx}
                      href={social.href}
                      target="_blank"
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#0A2472] hover:text-white transition-all"
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t text-center">
              <p className="text-xs text-gray-500">© {currentYear} Vincollins College</p>
            </div>

            {user?.isAuthenticated && (
              <div className="p-4 border-t sticky bottom-0 bg-white">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Sign Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to sign out of your account? You&apos;ll need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSignOut}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-500/25"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-3">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 animate-pulse" />
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    }>
      <HeaderContent {...props} />
    </Suspense>
  )
}