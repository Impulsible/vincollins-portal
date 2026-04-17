/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/header.tsx - COMPLETE FIXED VERSION
'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, User, Home, BookOpen, Laptop, Phone, Calendar, Users, FileText,
  Bell, Search, Settings, LogOut, LayoutDashboard, GraduationCap, Menu, X,
  Sparkles, Mail, MapPin, Clock, Facebook, Twitter, Instagram,
  Linkedin, KeyRound, MonitorPlay, BarChart3, TrendingUp, Camera,
  HelpCircle, Lock, Timer, Shuffle, Shield, Award, RotateCcw, ArrowRight,
  CheckCircle, ChevronRight, LucideIcon, UserCircle, LogIn
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ============================================
// TYPES
// ============================================

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

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  tab?: string
  isCbt?: boolean
}

// ============================================
// HELPER FUNCTIONS - FIXED FIRST NAME
// ============================================

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

const getInitialsFromName = (name: string): string => {
  if (!name || name === 'User') return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// FIXED: Always returns FIRST name
const getFirstNameFromName = (name: string): string => {
  if (!name || name === 'User') return 'User'
  
  // Handle email addresses
  if (name.includes('@')) {
    name = name.split('@')[0]
  }
  
  // Clean the name - replace dots, underscores, hyphens with spaces
  const cleaned = name.replace(/\./g, ' ').replace(/[_\-]/g, ' ').trim()
  
  // Split by spaces and get the FIRST word
  const parts = cleaned.split(/\s+/).filter(part => part.length > 0)
  
  if (parts.length === 0) return 'User'
  
  // Capitalize first letter
  const firstName = parts[0]
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
}

const normalizeRole = (role: string | null | undefined): UserRole => {
  if (!role) return 'student'
  const lowerRole = role.toLowerCase()
  if (lowerRole === 'staff') return 'teacher'
  if (lowerRole === 'admin' || lowerRole === 'teacher' || lowerRole === 'student') {
    return lowerRole as UserRole
  }
  return 'student'
}

const getDashboardLink = (role: UserRole | string): string => {
  const roleStr = String(role).toLowerCase()
  if (roleStr === 'admin') return '/admin'
  if (roleStr === 'teacher' || roleStr === 'staff') return '/staff'
  if (roleStr === 'student') return '/student'
  return '/portal'
}

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const isDashboardPath = (pathname: string): boolean => {
  return pathname?.startsWith('/student') || 
         pathname?.startsWith('/staff') || 
         pathname?.startsWith('/admin')
}

// ============================================
// NAVIGATION CONFIGURATIONS
// ============================================

const publicNavigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Admission', href: '/admission', icon: FileText },
  { name: 'Schools', href: '/schools', icon: BookOpen },
  { name: 'CBT Platform', href: '#cbt', icon: Laptop, isCbt: true },
  { name: 'Contact', href: '/contact', icon: Phone },
]

const studentNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/student', icon: LayoutDashboard },
  { name: 'My Exams', href: '/student/exams', icon: MonitorPlay },
  { name: 'Results', href: '/student/results', icon: GraduationCap },
  { name: 'Profile', href: '/student/profile', icon: User },
]

const teacherNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/staff', icon: LayoutDashboard },
  { name: 'Exams', href: '/staff/exams', icon: MonitorPlay },
  { name: 'Assignments', href: '/staff/assignments', icon: FileText },
  { name: 'Students', href: '/staff/students', icon: Users },
  { name: 'Analytics', href: '/staff/analytics', icon: BarChart3 },
]

const adminNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Exam Approvals', href: '/admin/exams', icon: MonitorPlay },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
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

const cbtFeatures = [
  { title: 'Secure Exam Environment', description: 'Full-screen lockdown mode prevents tab switching, copy-paste, and screenshots during exams', icon: Shield },
  { title: 'Smart Timer System', description: 'Real-time countdown with visual warnings. Auto-submit when time expires', icon: Timer },
  { title: 'Question Randomization', description: 'Questions and options shuffled uniquely for each student to maintain integrity', icon: Shuffle },
  { title: 'Instant Results & Analytics', description: 'Objective questions graded immediately with detailed performance analytics', icon: TrendingUp },
  { title: 'Multi-Format Support', description: 'Support for MCQs, True/False, Theory/Essay questions, and file uploads', icon: FileText },
  { title: 'Auto-Save & Resume', description: 'Progress auto-saved. Resume interrupted exams from where you stopped', icon: RotateCcw },
]

interface HeaderProps {
  user?: User
  onLogout?: () => void
}

// ============================================
// MAIN HEADER COMPONENT
// ============================================

function HeaderContent({ user: propUser, onLogout }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  
  const currentYear = new Date().getFullYear()
  const isPortalPage = pathname === '/portal'
  const isHomePage = pathname === '/'
  const isPublicPage = pathname === '/' || pathname === '/admission' || pathname === '/schools' || pathname === '/contact'
  const onDashboardPage = isDashboardPath(pathname)

  // Debug log for name
  useEffect(() => {
    if (user) {
      console.log('🔵 Header User:', {
        rawName: user.name,
        firstName: getFirstNameFromName(user.name),
        role: user.role
      })
    }
  }, [user])

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

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/student') return pathname === '/student'
    if (href === '/staff') return pathname === '/staff'
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname?.startsWith(href + '/')
  }

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

  // Fetch user
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

        console.log('📝 Raw name from DB:', rawName)
        const formattedName = formatFullName(rawName)
        const firstName = getFirstNameFromName(rawName)
        console.log('✅ First name extracted:', firstName)

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser()
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user?.isAuthenticated) {
      fetchNotificationCount()
    }
  }, [user, fetchNotificationCount])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
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
    if (user?.isAuthenticated && onDashboardPage) {
      switch (user.role) {
        case 'admin': return adminNavigation
        case 'teacher': return teacherNavigation
        case 'student': return studentNavigation
        default: return studentNavigation
      }
    }
    return publicNavigation
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
    setDropdownOpen(false)
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
    setDropdownOpen(false)
    if (user?.role === 'admin') {
      router.push('/admin/exams')
    } else {
      router.push('/notifications')
    }
  }

  const goToDashboard = () => {
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    const url = getDashboardLink(user?.role || 'student')
    router.push(url)
  }

  const goToProfile = () => {
    setDropdownOpen(false)
    const profileUrl = user?.role === 'student' ? '/student/profile' : 
                       user?.role === 'admin' ? '/admin/settings' : '/staff'
    router.push(profileUrl)
  }

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-3">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 animate-pulse" />
              <div className="h-6 w-24 sm:w-32 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500",
        scrolled ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-2xl py-1.5 sm:py-2" : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-3 group flex-shrink-0">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                className="relative"
              >
                {schoolSettings?.logo_path ? (
                  <div className="relative h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 group-hover:scale-105 transition-all duration-300">
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
                  <div className="relative h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <GraduationCap className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                )}
              </motion.div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                  <span className="font-dancing text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-wide group-hover:text-[#F5A623] transition-colors duration-300">
                    Vincollins
                  </span>
                  <span className="font-dancing text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#F5A623] leading-tight tracking-wide">
                    College
                  </span>
                </div>
                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] text-white/60 -mt-0.5 tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-0.5">
                  Geared Towards Excellence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className={cn(
              "hidden lg:flex items-center",
              isPortalPage ? "justify-center flex-1 mr-12" : "justify-center flex-1"
            )}>
              <div className="flex items-center gap-0.5 xl:gap-1.5 2xl:gap-2 bg-white/15 rounded-full p-0.5 sm:p-1 shadow-lg">
                {currentNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = isNavActive(item.href)
                  const isCbt = item.name === 'CBT Platform' || item.isCbt
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={isCbt ? handleCbtClick : undefined}
                      prefetch={false}
                      className={cn(
                        "relative px-2.5 sm:px-3 lg:px-4 xl:px-5 py-1.5 sm:py-2 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-full whitespace-nowrap",
                        isActive 
                          ? "text-[#0A2472] bg-white shadow-lg" 
                          : "text-white hover:text-white hover:bg-white/25"
                      )}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                        <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", isActive ? "text-[#0A2472]" : "text-white")} />
                        <span className="hidden xl:inline">{item.name}</span>
                        {isCbt && (
                          <Badge variant="secondary" className="ml-0.5 text-[9px] lg:text-[10px] px-1 py-0 bg-[#F5A623] text-[#0A2472] font-bold">
                            CBT
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Right Section - Avatar & Actions */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
              >
                <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
              </Button>

              {/* Notifications */}
              {user?.isAuthenticated && onDashboardPage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
                        onClick={handleNotificationClick}
                      >
                        <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 bg-red-500 rounded-full text-white text-[9px] sm:text-[10px] md:text-xs flex items-center justify-center font-bold animate-pulse">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {notificationCount > 0 ? `${notificationCount} new notifications` : 'No new notifications'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* AUTHENTICATED USER - AVATAR DROPDOWN */}
              {user?.isAuthenticated ? (
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative flex items-center gap-1 xs:gap-1.5 sm:gap-2 rounded-full text-white hover:bg-white/20 px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 h-auto transition-all duration-300"
                    >
                      <div className="relative">
                        <Avatar className={cn(
                          "ring-1 sm:ring-2 ring-white/50 transition-all",
                          "h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                        )}>
                          <AvatarImage 
                            src={user.avatar} 
                            alt={user.name}
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px] xs:text-xs sm:text-sm">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-2 w-2 xs:h-2.5 xs:w-2.5 sm:h-3 sm:w-3 bg-green-500 rounded-full border-1.5 sm:border-2 border-white"></span>
                      </div>
                      
                      {/* FIXED: Display FIRST NAME */}
                      <div className="hidden sm:block text-left">
                        <p className="text-xs lg:text-sm font-semibold leading-tight text-white whitespace-nowrap">
                          Hi, {getFirstName()}
                        </p>
                        <p className="text-[9px] lg:text-[10px] text-white/80 flex items-center gap-1">
                          <span className={cn("w-1.5 h-1.5 rounded-full hidden lg:block", 
                            user.role === 'admin' ? 'bg-purple-400' : 
                            user.role === 'teacher' ? 'bg-blue-400' : 'bg-emerald-400'
                          )}></span>
                          <span className="hidden md:inline">{getRoleDisplayName(user.role)}</span>
                        </p>
                      </div>
                      
                      {/* FIXED: Mobile FIRST NAME */}
                      <span className="sm:hidden text-white text-[10px] xs:text-xs font-medium max-w-[60px] xs:max-w-[80px] truncate">
                        Hi, {getFirstName()}
                      </span>
                      
                      <ChevronDown className={cn(
                        "h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-white transition-transform duration-300",
                        dropdownOpen && "rotate-180"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    className="w-[260px] xs:w-[280px] sm:w-[320px] md:w-[360px] lg:w-[380px] p-0 overflow-hidden"
                    align="end"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 ring-2 ring-primary/20">
                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm sm:text-base md:text-lg font-bold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate text-xs sm:text-sm md:text-base">
                              {user.name}
                            </p>
                            <p className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                            <Badge className={cn("mt-1 sm:mt-1.5 text-[9px] xs:text-[10px] sm:text-xs text-white", getRoleBadgeColor(user.role))}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3">
                          <div className="text-center p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-base sm:text-lg font-bold text-primary">12</p>
                            <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-500">Exams</p>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-base sm:text-lg font-bold text-green-600">85%</p>
                            <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-500">Avg Score</p>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-base sm:text-lg font-bold text-amber-600">3</p>
                            <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-500">Pending</p>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    {!onDashboardPage && (
                      <>
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-50 to-orange-50">
                          <Button
                            onClick={goToDashboard}
                            className="w-full bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/95 hover:to-[#F5A623] text-[#0A2472] font-semibold shadow-md hover:shadow-lg text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                          >
                            <LayoutDashboard className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {user?.role === 'admin' ? 'Admin Dashboard' : 
                             user?.role === 'teacher' ? 'Teacher Dashboard' : 
                             'Student Dashboard'}
                            <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={goToProfile} className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm">
                        <User className="mr-2 sm:mr-3 h-4 w-4 text-gray-500" />
                        <span>My Profile</span>
                        <DropdownMenuShortcut className="text-[10px] sm:text-xs">⌘P</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      
                      {onDashboardPage && (
                        <DropdownMenuItem onClick={handleNotificationClick} className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm">
                          <Bell className="mr-2 sm:mr-3 h-4 w-4 text-gray-500" />
                          <span>Notifications</span>
                          {notificationCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0">
                              {notificationCount}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem onClick={() => { setDropdownOpen(false); router.push(user?.role === 'student' ? '/student/settings' : user?.role === 'admin' ? '/admin/settings' : '/staff/settings') }} className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm">
                        <Settings className="mr-2 sm:mr-3 h-4 w-4 text-gray-500" />
                        <span>Settings</span>
                        <DropdownMenuShortcut className="text-[10px] sm:text-xs">⌘S</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuLabel className="text-[10px] sm:text-xs font-semibold text-gray-400 px-3 py-1 sm:py-2">
                      Quick Links
                    </DropdownMenuLabel>
                    
                    <DropdownMenuGroup>
                      {pathname !== '/' && (
                        <DropdownMenuItem onClick={() => { setDropdownOpen(false); router.push('/') }} className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm">
                          <Home className="mr-2 sm:mr-3 h-4 w-4 text-blue-500" />
                          <span>Home Page</span>
                        </DropdownMenuItem>
                      )}
                      
                      {pathname !== '/portal' && (
                        <DropdownMenuItem onClick={() => { setDropdownOpen(false); router.push('/portal') }} className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm">
                          <KeyRound className="mr-2 sm:mr-3 h-4 w-4 text-emerald-500" />
                          <span>Portal Page</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleLogoutClick}
                      className="cursor-pointer py-2 sm:py-2.5 text-red-600 hover:!bg-red-50 hover:!text-red-700 text-xs sm:text-sm"
                    >
                      <LogOut className="mr-2 sm:mr-3 h-4 w-4" />
                      <span>Sign Out</span>
                      <DropdownMenuShortcut className="text-[10px] sm:text-xs">⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                !user?.isAuthenticated && isPublicPage && (
                  <Link href="/portal" className="hidden sm:block">
                    <Button className="bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623] text-[#0A2472] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 h-8 sm:h-9 md:h-10 font-semibold text-xs sm:text-sm">
                      <KeyRound className="mr-1 sm:mr-1.5 md:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:rotate-12 transition-transform" />
                      <span className="hidden xs:inline">Portal</span> Login
                    </Button>
                  </Link>
                )
              )}

              {!user?.isAuthenticated && isPublicPage && (
                <Link href="/portal" className="sm:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 xs:h-9 xs:w-9 rounded-full text-white hover:bg-white/20"
                  >
                    <LogIn className="h-4 w-4 xs:h-4.5 xs:w-4.5" />
                  </Button>
                </Link>
              )}

              {/* HAMBURGER MENU BUTTON - INTACT */}
              <button
                className="lg:hidden relative h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-all duration-300 text-white hover:bg-white/20 active:scale-95 ml-0.5"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-4.5 w-4.5 xs:h-5 xs:w-5" /> : <Menu className="h-4.5 w-4.5 xs:h-5 xs:w-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 px-3 sm:px-4">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white shadow-2xl border-2 border-primary/30 rounded-full py-4 sm:py-5 md:py-6 text-base sm:text-lg pr-12"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* CBT DIALOG */}
      <Dialog open={showCbtInfo} onOpenChange={setShowCbtInfo}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto p-0">
          <div className="relative bg-gradient-to-br from-[#0A2472] via-[#1e3a8a] to-[#0A2472] p-4 sm:p-6 md:p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-blue-500/10 rounded-full blur-2xl" />
            
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#F5A623]/80 flex items-center justify-center shadow-xl">
                  <Laptop className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl md:text-3xl font-bold text-white flex items-center gap-2">
                    Vincollins CBT Platform
                    <Badge className="bg-[#F5A623] text-[#0A2472] ml-2 text-[10px] sm:text-xs">SECURE</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-xs sm:text-sm md:text-base mt-1">
                    Secure, Reliable & Intelligent Online Examination System
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
              {[
                { value: '10k+', label: 'Exams Delivered', color: 'blue' },
                { value: '99.9%', label: 'Platform Uptime', color: 'emerald' },
                { value: '256-bit', label: 'SSL Encryption', color: 'amber' },
                { value: '24/7', label: 'Tech Support', color: 'purple' },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className={cn(
                  "text-center p-2 sm:p-3 md:p-4 bg-gradient-to-br rounded-xl border",
                  stat.color === 'blue' && "from-blue-50 to-indigo-50 border-blue-100",
                  stat.color === 'emerald' && "from-emerald-50 to-teal-50 border-emerald-100",
                  stat.color === 'amber' && "from-amber-50 to-orange-50 border-amber-100",
                  stat.color === 'purple' && "from-purple-50 to-pink-50 border-purple-100",
                )}>
                  <p className="text-lg sm:text-xl md:text-3xl font-bold text-[#0A2472]">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="mb-4 sm:mb-6 md:mb-8">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#0A2472] mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5A623]" />
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {cbtFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[#F5A623]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0A2472] text-xs sm:text-sm md:text-base">{feature.title}</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end border-t pt-4 sm:pt-6">
              <Button variant="outline" onClick={() => setShowCbtInfo(false)} size="sm" className="sm:size-default">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowCbtInfo(false)
                  router.push('/portal')
                }}
                className="bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623] text-[#0A2472] font-bold shadow-md hover:shadow-lg text-xs sm:text-sm"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Login to Student Portal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MOBILE MENU - FULLY INTACT */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full max-w-[280px] xs:max-w-[320px] sm:max-w-sm bg-white z-50 lg:hidden overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] text-white p-4 sm:p-5">
              <button onClick={() => setMobileMenuOpen(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12">
                  {schoolSettings?.logo_path ? (
                    <Image 
                      src={schoolSettings.logo_path} 
                      alt="Logo" 
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg">Vincollins College</p>
                  <p className="text-[10px] sm:text-xs text-white/70">Geared Towards Excellence</p>
                </div>
              </div>
              
              {user?.isAuthenticated && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/10 rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/30">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-white/30 text-white text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* FIXED: First name in mobile menu */}
                      <p className="font-bold text-sm sm:text-base truncate">
                        {getTimeBasedGreeting()}, {getFirstName()}
                      </p>
                      <p className="text-xs sm:text-sm text-white/80 truncate">{user.name}</p>
                      <Badge className={cn("mt-1 text-[10px] sm:text-xs text-white", getRoleBadgeColor(user.role))}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4">
              {currentNavigation.map((item) => {
                const Icon = item.icon
                const isActive = isNavActive(item.href)
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
                      "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base",
                      isActive ? "bg-[#0A2472]/10 text-[#0A2472] font-semibold" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {user?.isAuthenticated && !onDashboardPage && (
              <div className="p-3 sm:p-4 border-t">
                <button
                  onClick={goToDashboard}
                  className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
                >
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  Go to Dashboard
                </button>
              </div>
            )}

            {!user?.isAuthenticated && isPublicPage && (
              <div className="p-3 sm:p-4 border-t">
                <Link
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg shadow-md text-sm sm:text-base"
                >
                  <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
                  Portal Login
                </Link>
              </div>
            )}

            {user?.isAuthenticated && onDashboardPage && (
              <div className="p-3 sm:p-4 border-t bg-gray-50/50">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Quick Switch</p>
                <div className="space-y-1">
                  {pathname !== '/' && (
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-all text-sm"
                    >
                      <Home className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      <span>Home Page</span>
                    </Link>
                  )}
                  {pathname !== '/portal' && (
                    <Link
                      href="/portal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-all text-sm"
                    >
                      <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                      <span>Portal Page</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 sm:p-4 border-t">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Quick Links</p>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl"
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0A2472]" />
                      <span className="truncate">{link.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Contact Us</p>
              <div className="space-y-1.5 sm:space-y-2">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-2 py-1 sm:py-1.5">
                    <info.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0A2472] shrink-0" />
                    <span className="text-[10px] sm:text-xs text-gray-600">{info.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t">
              <div className="flex justify-center gap-4 sm:gap-5">
                {socialLinks.map((social, idx) => {
                  const Icon = social.icon
                  return (
                    <Link
                      key={idx}
                      href={social.href}
                      target="_blank"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#0A2472] hover:text-white transition-all"
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t text-center">
              <p className="text-[10px] sm:text-xs text-gray-500">© {currentYear} Vincollins College</p>
            </div>

            {user?.isAuthenticated && (
              <div className="p-3 sm:p-4 border-t sticky bottom-0 bg-white">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 text-sm"
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
        <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              Sign Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Are you sure you want to sign out of your account? You&apos;ll need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSignOut}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-500/25 text-sm"
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
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/20 animate-pulse" />
              <div className="h-5 w-20 sm:h-6 sm:w-28 md:w-32 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    }>
      <HeaderContent {...props} />
    </Suspense>
  )
}