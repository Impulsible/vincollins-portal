/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/header.tsx - FULLY RESPONSIVE PROFESSIONAL HEADER
'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, User, Home, BookOpen, Laptop, Phone, Calendar, Users, FileText,
  Bell, Search, Settings, LogOut, LayoutDashboard, GraduationCap, Menu, X,
  Sparkles, Mail, MapPin, Clock, Facebook, Twitter, Instagram,
  Linkedin, KeyRound, MonitorPlay, BarChart3, TrendingUp,
  HelpCircle, Lock, Timer, Shuffle, Shield, RotateCcw, ArrowRight,
  ChevronRight, LucideIcon, MoreHorizontal, UserCircle
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// STRICT ROLE TYPES - Only 3 roles allowed
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
  requiresAuth?: boolean
}

// ============================================
// HELPER FUNCTIONS
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

const getFirstNameFromName = (name: string): string => {
  if (!name || name === 'User') return 'User'
  return name.trim().split(/\s+/)[0]
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
  { title: 'Secure Exam Environment', description: 'Full-screen lockdown mode prevents tab switching, copy-paste, and screenshots', icon: Shield },
  { title: 'Smart Timer System', description: 'Real-time countdown with visual warnings. Auto-submit when time expires', icon: Timer },
  { title: 'Question Randomization', description: 'Questions and options shuffled uniquely for each student', icon: Shuffle },
  { title: 'Instant Results & Analytics', description: 'Objective questions graded immediately with detailed analytics', icon: TrendingUp },
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
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  
  const currentYear = new Date().getFullYear()
  const isPortalPage = pathname === '/portal'
  const isHomePage = pathname === '/'
  const isPublicPage = pathname === '/' || pathname === '/admission' || pathname === '/schools' || pathname === '/contact'

  // ============================================
  // FETCH SCHOOL SETTINGS
  // ============================================
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

  // ============================================
  // ACTIVE ROUTE CHECK
  // ============================================
  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/student') return pathname === '/student'
    if (href === '/staff') return pathname === '/staff'
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  // ============================================
  // FETCH NOTIFICATION COUNT
  // ============================================
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

  // ============================================
  // FETCH USER DATA WITH AVATAR SUPPORT
  // ============================================
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
        
        // Fetch profile with all fields including avatar
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

        // Get avatar from multiple possible sources
        const avatarUrl = userData?.avatar_url || 
                         userData?.photo_url || 
                         userData?.avatar || 
                         session.user.user_metadata?.avatar_url ||
                         session.user.user_metadata?.avatar

        setUser({
          id: userData?.id || session.user.id,
          name: formattedName,
          email: userData?.email || session.user.email || '',
          role: userRole,
          avatar: avatarUrl,
          isAuthenticated: true
        })

        setAvatarError(false)

        // Subscribe to real-time profile updates for avatar changes
        const profileSubscription = supabase
          .channel('profile-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${userData?.id || session.user.id}`
            },
            (payload) => {
              const updatedProfile = payload.new
              if (updatedProfile.avatar_url || updatedProfile.photo_url || updatedProfile.avatar) {
                setUser(prev => prev ? {
                  ...prev,
                  avatar: updatedProfile.avatar_url || updatedProfile.photo_url || updatedProfile.avatar
                } : null)
                setAvatarError(false)
              }
            }
          )
          .subscribe()

        return () => {
          profileSubscription.unsubscribe()
        }

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
    window.location.replace(url)
  }

  const handleAvatarError = () => {
    setAvatarError(true)
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3 lg:py-4">
        <div className="max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-full bg-white/20 animate-pulse" />
              <div className="space-y-1">
                <div className="h-5 sm:h-6 lg:h-7 w-24 sm:w-28 lg:w-32 bg-white/20 rounded animate-pulse" />
                <div className="h-2 sm:h-2.5 w-16 sm:w-20 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300",
        scrolled 
          ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-2xl py-1.5 sm:py-2 lg:py-2.5" 
          : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3 lg:py-4"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
            
            {/* ============================================ */}
            {/* LOGO SECTION - Responsive */}
            {/* ============================================ */}
            <Link href="/" className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 group flex-shrink-0">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                {schoolSettings?.logo_path ? (
                  <div className="relative h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12 group-hover:scale-105 transition-all duration-300">
                    <Image 
                      src={schoolSettings.logo_path} 
                      alt={schoolSettings.school_name || 'Vincollins College Logo'} 
                      width={48}
                      height={48}
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <div className="relative h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <GraduationCap className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                )}
              </motion.div>
              
              {/* School Name - Responsive Text Sizes */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5 xs:gap-1">
                  <span className="font-['Dancing_Script',cursive] text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight tracking-wide group-hover:text-[#F5A623] transition-colors duration-300">
                    Vincollins
                  </span>
                  <span className="font-['Dancing_Script',cursive] text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#F5A623] leading-tight tracking-wide">
                    College
                  </span>
                </div>
                <span className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] xl:text-[11px] text-white/60 -mt-0.5 tracking-[0.15em] xs:tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-0.5">
                  Geared Towards Excellence
                </span>
              </div>
            </Link>

            {/* ============================================ */}
            {/* DESKTOP NAVIGATION - Hidden on mobile, shown on lg+ */}
            {/* ============================================ */}
            <nav className={cn(
              "hidden lg:flex items-center",
              isPortalPage ? "justify-center flex-1 mr-8 xl:mr-12" : "justify-center flex-1"
            )}>
              <div className="flex items-center gap-0.5 xl:gap-1 2xl:gap-2 bg-white/10 backdrop-blur-sm rounded-full p-0.5 xl:p-1 shadow-lg">
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
                        "relative px-3 xl:px-4 2xl:px-5 py-1.5 lg:py-2 text-xs lg:text-sm xl:text-base font-semibold transition-all duration-300 rounded-full whitespace-nowrap",
                        isActive 
                          ? "text-[#0A2472] bg-white shadow-lg" 
                          : "text-white/90 hover:text-white hover:bg-white/20"
                      )}
                    >
                      <div className="flex items-center gap-1.5 xl:gap-2">
                        <Icon className={cn(
                          "h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-4.5 xl:w-4.5",
                          isActive ? "text-[#0A2472]" : "text-white/90"
                        )} />
                        <span className="hidden xl:inline">{item.name}</span>
                        <span className="xl:hidden">
                          {item.name === 'CBT Platform' ? 'CBT' : 
                           item.name === 'Exam Approvals' ? 'Exams' :
                           item.name === 'User Management' ? 'Users' :
                           item.name === 'My Exams' ? 'Exams' : item.name}
                        </span>
                        {isCbt && (
                          <Badge variant="secondary" className="ml-0.5 xl:ml-1 text-[8px] xl:text-[10px] px-1 xl:px-1.5 py-0 xl:py-0.5 bg-[#F5A623] text-[#0A2472] font-bold">
                            CBT
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* ============================================ */}
            {/* RIGHT SECTION - Actions */}
            {/* ============================================ */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0">
              
              {/* Search Button - Hidden on mobile, shown on sm+ */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchOpen(!searchOpen)}
                      className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Search</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Notifications - Only for authenticated users */}
              {user?.isAuthenticated && !isPortalPage && !isHomePage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
                        onClick={handleNotificationClick}
                      >
                        <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 bg-red-500 rounded-full text-white text-[8px] sm:text-[10px] lg:text-xs flex items-center justify-center font-bold animate-pulse">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">
                        {notificationCount > 0 ? `${notificationCount} new notification${notificationCount > 1 ? 's' : ''}` : 'No new notifications'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* ============================================ */}
              {/* AUTHENTICATED USER - Avatar with Dropdown */}
              {/* ============================================ */}
              {user?.isAuthenticated ? (
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-1 sm:gap-1.5 lg:gap-2 rounded-full text-white hover:bg-white/20 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 transition-all duration-300 h-auto",
                        "border border-transparent hover:border-white/20"
                      )}
                    >
                      <Avatar className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 ring-1 sm:ring-2 ring-white/30 transition-all">
                        {user.avatar && !avatarError ? (
                          <AvatarImage 
                            src={user.avatar} 
                            alt={user.name}
                            onError={handleAvatarError}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback 
                          className={cn(
                            "bg-gradient-to-br from-white/20 to-white/10 text-white text-xs sm:text-sm font-bold",
                            "backdrop-blur-sm"
                          )}
                          style={{
                            background: user.avatar && !avatarError ? 'transparent' : undefined
                          }}
                        >
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* User Info - Hidden on mobile, shown on md+ */}
                      <div className="hidden md:block text-left">
                        <p className="text-xs lg:text-sm font-semibold leading-tight text-white truncate max-w-[80px] lg:max-w-[120px]">
                          Hi, {getFirstName()}
                        </p>
                        <p className="text-[8px] lg:text-[10px] text-white/70 truncate max-w-[80px] lg:max-w-[120px]">
                          {getRoleDisplayName(user.role)}
                        </p>
                      </div>
                      
                      <ChevronDown className={cn(
                        "h-3 w-3 lg:h-4 lg:w-4 text-white/80 transition-transform duration-300",
                        dropdownOpen && "rotate-180"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    align="end" 
                    sideOffset={8}
                    className="w-60 xs:w-64 sm:w-72 lg:w-80 p-1 rounded-xl shadow-2xl border border-gray-100"
                  >
                    {/* User Info Header */}
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 ring-2 ring-primary/20">
                            {user.avatar && !avatarError ? (
                              <AvatarImage 
                                src={user.avatar} 
                                alt={user.name}
                                onError={handleAvatarError}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm sm:text-base lg:text-lg font-bold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                              {user.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                            <Badge className={cn(
                              "mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-white",
                              getRoleBadgeColor(user.role)
                            )}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    {/* Dashboard Button - On home/portal pages */}
                    {(isHomePage || isPortalPage) && (
                      <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                        <button
                          onClick={goToDashboard}
                          className="w-full px-3 py-2 sm:py-2.5 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/95 hover:to-[#F5A623] text-[#0A2472] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg text-xs sm:text-sm"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>
                            {user?.role === 'admin' ? 'Admin Dashboard' : 
                             user?.role === 'teacher' ? 'Teacher Dashboard' : 
                             'Student Dashboard'}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                        </button>
                      </div>
                    )}
                    
                    {/* Main Menu Items - Only on dashboard pages */}
                    {!isPortalPage && !isHomePage && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link 
                            href={user.role === 'student' ? '/student/profile' : user.role === 'admin' ? '/admin/settings' : '/staff'} 
                            className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 cursor-pointer flex items-center gap-2 sm:gap-3"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <span>My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link 
                            href="/notifications"
                            className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 cursor-pointer flex items-center gap-2 sm:gap-3"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <span>Notifications</span>
                            {notificationCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-[10px] sm:text-xs">
                                {notificationCount}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link 
                            href={user.role === 'student' ? '/student/settings' : user.role === 'admin' ? '/admin/settings' : '/staff/settings'} 
                            className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 cursor-pointer flex items-center gap-2 sm:gap-3"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {/* Quick Links Section */}
                    <DropdownMenuLabel className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5 sm:py-2">
                      Quick Links
                    </DropdownMenuLabel>
                    
                    {pathname !== '/' && (
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/" 
                          className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 cursor-pointer flex items-center gap-2 sm:gap-3 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-xs sm:text-sm">Home Page</p>
                            <p className="text-[8px] sm:text-[10px] text-gray-400">Return to main website</p>
                          </div>
                          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {pathname !== '/portal' && (
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/portal" 
                          className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 cursor-pointer flex items-center gap-2 sm:gap-3 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <KeyRound className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-xs sm:text-sm">Portal Page</p>
                            <p className="text-[8px] sm:text-[10px] text-gray-400">Login or switch account</p>
                          </div>
                          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {/* Sign Out */}
                    <DropdownMenuItem 
                      onClick={handleLogoutClick}
                      className="text-red-600 hover:text-red-700 focus:text-red-700 cursor-pointer px-3 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Portal Login - For unauthenticated users on public pages */
                !user?.isAuthenticated && isPublicPage && (
                  <Link href="/portal" className="hidden sm:block">
                    <Button className={cn(
                      "bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623]",
                      "text-[#0A2472] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group",
                      "px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm"
                    )}>
                      <KeyRound className="mr-1 sm:mr-1.5 lg:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 group-hover:rotate-12 transition-transform" />
                      <span className="hidden sm:inline">Portal Login</span>
                      <span className="sm:hidden">Login</span>
                    </Button>
                  </Link>
                )
              )}

              {/* ============================================ */}
              {/* MOBILE MENU BUTTON - Shown on mobile, hidden on lg+ */}
              {/* ============================================ */}
              <button
                className="lg:hidden relative h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full transition-all duration-300 text-white hover:bg-white/20 active:scale-95 ml-0.5"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5" />
                ) : (
                  <Menu className="h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>

          {/* ============================================ */}
          {/* SEARCH BAR - Animated */}
          {/* ============================================ */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 sm:mt-2 lg:mt-3 px-3 sm:px-4"
              >
                <div className="max-w-xl lg:max-w-2xl mx-auto">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Input
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white shadow-2xl border-2 border-primary/30 rounded-full py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg pr-10 sm:pr-12"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ============================================ */}
      {/* CBT INFO DIALOG */}
      {/* ============================================ */}
      <Dialog open={showCbtInfo} onOpenChange={setShowCbtInfo}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[85vh] overflow-y-auto p-0">
          <div className="relative bg-gradient-to-br from-[#0A2472] via-[#1e3a8a] to-[#0A2472] p-4 sm:p-6 lg:p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-blue-500/10 rounded-full blur-2xl" />
            
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#F5A623]/80 flex items-center justify-center shadow-xl">
                  <Laptop className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                    Vincollins CBT Platform
                    <Badge className="bg-[#F5A623] text-[#0A2472] text-[10px] sm:text-xs">SECURE</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-xs sm:text-sm lg:text-base mt-1">
                    Secure, Reliable & Intelligent Online Examination System
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
              {[
                { value: '10k+', label: 'Exams Delivered', color: 'blue' },
                { value: '99.9%', label: 'Platform Uptime', color: 'emerald' },
                { value: '256-bit', label: 'SSL Encryption', color: 'amber' },
                { value: '24/7', label: 'Tech Support', color: 'purple' },
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }} 
                  className={cn(
                    "text-center p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border",
                    stat.color === 'blue' && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
                    stat.color === 'emerald' && "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100",
                    stat.color === 'amber' && "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100",
                    stat.color === 'purple' && "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100",
                  )}
                >
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-[#0A2472]">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[#0A2472] mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5A623]" />
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                {cbtFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-[#F5A623]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0A2472] text-xs sm:text-sm lg:text-base">{feature.title}</p>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600">{feature.description}</p>
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
                size="sm"
                className="sm:size-default bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623] text-[#0A2472] font-bold shadow-md hover:shadow-lg"
              >
                <KeyRound className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Login to Student Portal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MOBILE MENU - Slide from right */}
      {/* ============================================ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[280px] xs:max-w-sm sm:max-w-md bg-white z-50 lg:hidden overflow-y-auto"
            >
              {/* Mobile Menu Header */}
              <div className="bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] text-white p-4 sm:p-5">
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
                >
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
                    <p className="text-[9px] sm:text-xs text-white/70">Geared Towards Excellence</p>
                  </div>
                </div>
                
                {user?.isAuthenticated && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/30">
                        {user.avatar && !avatarError ? (
                          <AvatarImage 
                            src={user.avatar} 
                            alt={user.name}
                            onError={handleAvatarError}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-white/30 text-white text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">Hi, {getFirstName()}!</p>
                        <p className="text-xs text-white/80 truncate">{user.name}</p>
                        <Badge className={cn("mt-1 text-[10px] text-white", getRoleBadgeColor(user.role))}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Navigation Items */}
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
                        "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-sm",
                        isActive ? "bg-[#0A2472]/10 text-[#0A2472] font-semibold" : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{item.name}</span>
                      {isCbt && (
                        <Badge className="ml-auto bg-[#F5A623] text-[#0A2472] text-[10px]">CBT</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Dashboard Link for authenticated users on home/portal */}
              {user?.isAuthenticated && (isHomePage || isPortalPage) && (
                <div className="p-3 sm:p-4 border-t">
                  <button
                    onClick={goToDashboard}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                  </button>
                </div>
              )}

              {/* Portal Login for unauthenticated */}
              {!user?.isAuthenticated && isPublicPage && (
                <div className="p-3 sm:p-4 border-t">
                  <Link
                    href="/portal"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg shadow-md text-sm"
                  >
                    <KeyRound className="h-4 w-4" />
                    Portal Login
                  </Link>
                </div>
              )}

              {/* Quick Switch for Dashboard Pages */}
              {user?.isAuthenticated && !isPortalPage && !isHomePage && (
                <div className="p-3 sm:p-4 border-t bg-gray-50/50">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                    Quick Switch
                  </p>
                  <div className="space-y-1">
                    {pathname !== '/' && (
                      <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-all text-sm"
                      >
                        <Home className="h-4 w-4 text-blue-500" />
                        <span>Home Page</span>
                      </Link>
                    )}
                    {pathname !== '/portal' && (
                      <Link
                        href="/portal"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-all text-sm"
                      >
                        <KeyRound className="h-4 w-4 text-emerald-500" />
                        <span>Portal Page</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="p-3 sm:p-4 border-t">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                  Quick Links
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {quickLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl"
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0A2472]" />
                        <span className="truncate">{link.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-3 sm:p-4 border-t">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                  Contact Us
                </p>
                <div className="space-y-1.5 sm:space-y-2">
                  {contactInfo.map((info, idx) => (
                    <div key={idx} className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 py-1 sm:py-1.5">
                      <info.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0A2472] shrink-0" />
                      <span className="text-[10px] sm:text-xs text-gray-600">{info.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
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

              {/* Copyright */}
              <div className="p-3 sm:p-4 border-t text-center">
                <p className="text-[9px] sm:text-xs text-gray-500">
                  © {currentYear} Vincollins College
                </p>
              </div>

              {/* Sign Out */}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* SIGN OUT CONFIRMATION DIALOG */}
      {/* ============================================ */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              Sign Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base text-slate-500">
              Are you sure you want to sign out of your account? You&apos;ll need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSignOut}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-500/25 text-sm"
            >
              <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================
// EXPORT WITH SUSPENSE
// ============================================
export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 animate-pulse" />
              <div className="space-y-1">
                <div className="h-5 sm:h-6 w-24 sm:w-32 bg-white/20 rounded animate-pulse" />
                <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    }>
      <HeaderContent {...props} />
    </Suspense>
  )
}