
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/header.tsx - FULL OPTIMIZED WITH DISPLAY NAME
'use client'

import { useState, useEffect, useRef, useCallback, Suspense, forwardRef, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, User, Home, BookOpen, Laptop, Phone, Calendar, Users, FileText,
  Search, Settings, LogOut, LayoutDashboard, GraduationCap, Menu, X,
  Sparkles, Mail, MapPin, Clock, Facebook, Twitter, Instagram,
  Linkedin, KeyRound, MonitorPlay, BarChart3, TrendingUp,
  Timer, Shuffle, Shield, Award, RotateCcw, ArrowRight,
  ChevronRight, Bell, CheckCircle2, AlertCircle, Trash2,
  Briefcase, FileCheck, Activity, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPES
// ============================================
type UserRole = 'admin' | 'teacher' | 'student'

interface User {
  id: string
  name: string
  firstName: string
  email: string
  role: UserRole
  avatar?: string
  isAuthenticated: boolean
}

interface SchoolSettings {
  school_name?: string
  logo_path?: string
  school_phone?: string
  school_email?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  metadata: any
  created_at: string
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  tab?: string
  isCbt?: boolean
  isDropdown?: boolean
  dropdownItems?: { name: string; href: string; icon: any }[]
}

interface HeaderProps {
  user?: User
  onLogout?: () => void
}

// ============================================
// UTILITY FUNCTIONS (outside component)
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
// STATIC DATA
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
  { 
    name: 'User Management', 
    href: '#', 
    icon: Users, 
    isDropdown: true,
    dropdownItems: [
      { name: 'Students', href: '/admin/students', icon: GraduationCap },
      { name: 'Staff', href: '/admin/staff', icon: Briefcase },
      { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
    ]
  },
  { name: 'Exam Approvals', href: '/admin/exams', icon: MonitorPlay },
  { name: 'Reports', href: '/admin/report-cards', icon: FileCheck },
  { name: 'Monitor', href: '/admin/monitor', icon: Activity },
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

const notificationIcons: Record<string, JSX.Element> = {
  exam_graded: <Award className="h-4 w-4 text-green-500" />,
  new_exam: <BookOpen className="h-4 w-4 text-blue-500" />,
  needs_grading: <AlertCircle className="h-4 w-4 text-orange-500" />,
  new_student: <CheckCircle2 className="h-4 w-4 text-purple-500" />,
}

const getNotificationIcon = (type: string): JSX.Element => {
  return notificationIcons[type] || <Bell className="h-4 w-4 text-gray-500" />
}

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-purple-500 text-white',
  teacher: 'bg-blue-500 text-white',
  student: 'bg-emerald-500 text-white',
}

const roleDisplayNames: Record<UserRole, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
}

// ============================================
// MEMOIZED SUB-COMPONENTS
// ============================================
const NotificationTrigger = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  (props, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          "relative h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300",
          "inline-flex items-center justify-center",
          props.className
        )}
      >
        <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
        {props.children}
      </button>
    )
  }
)
NotificationTrigger.displayName = 'NotificationTrigger'

const Logo = memo(({ schoolSettings }: { schoolSettings: SchoolSettings | null }) => (
  <Link href="/" className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 group flex-shrink-0">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
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
    <div className="flex flex-col">
      <div className="flex items-baseline gap-0.5 sm:gap-1">
        <span 
          className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-wide group-hover:text-[#F5A623] transition-colors duration-300"
          style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
        >
          Vincollins
        </span>
        <span 
          className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#F5A623] leading-tight tracking-wide"
          style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
        >
          College
        </span>
      </div>
      <span className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-white/60 -mt-0.5 tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-0.5">
        Geared Towards Excellence
      </span>
    </div>
  </Link>
))
Logo.displayName = 'Logo'

const HeaderSkeleton = memo(() => (
  <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3">
    <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-full bg-white/20 animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 sm:h-6 w-24 sm:w-28 lg:w-32 bg-white/20 rounded animate-pulse" />
            <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full animate-pulse" />
      </div>
    </div>
  </header>
))
HeaderSkeleton.displayName = 'HeaderSkeleton'

// ============================================
// MAIN HEADER COMPONENT
// ============================================
function HeaderContent({ user: propUser, onLogout }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // State
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [contactInfo, setContactInfo] = useState([
    { icon: MapPin, text: '7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos' },
    { icon: Phone, text: '+234 912 1155 554' },
    { icon: Mail, text: 'vincollinscollege@gmail.com' },
    { icon: Clock, text: 'Mon-Fri: 8:00 AM - 4:00 PM' },
  ])
  
  // Refs
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const fetchInProgress = useRef(false)
  
  // Derived state
  const currentYear = new Date().getFullYear()
  const isPortalPage = pathname === '/portal'
  const isHomePage = pathname === '/'
  const isPublicPage = pathname === '/' || pathname === '/admission' || pathname === '/schools' || pathname === '/contact'
  const isDashboardPage = !isPublicPage && !isPortalPage && !isHomePage

  // ============================================
  // EFFECTS
  // ============================================
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileOpen(false)
    setNotificationOpen(false)
    setUserMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  // Escape key to close mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch school settings
  useEffect(() => {
    let cancelled = false
    const fetchSchoolSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('school_settings')
          .select('school_name, logo_path, school_phone, school_email')
          .single()
        
        if (!cancelled && !error && data) {
          setSchoolSettings(data)
          setContactInfo(prev => [
            prev[0],
            { ...prev[1], text: data.school_phone || prev[1].text },
            { ...prev[2], text: data.school_email || prev[2].text },
            prev[3],
          ])
        }
      } catch (error) {
        console.error('Error fetching school settings:', error)
      }
    }
    fetchSchoolSettings()
    return () => { cancelled = true }
  }, [])

  // ============================================
  // FETCH USER - WITH NAME FIX
  // Profile: LastName FirstName MiddleName
  // Greeting: FirstName only
  // ============================================
  useEffect(() => {
    let cancelled = false
    
    const fetchUser = async () => {
      if (fetchInProgress.current) return
      fetchInProgress.current = true
      setLoading(true)
      
      try {
        let { data: { session } } = await supabase.auth.getSession()
        
        // Retry once if session is null (handles lock conflicts)
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const retry = await supabase.auth.getSession()
          session = retry.data.session
        }
        
        if (cancelled || !session) {
          if (!cancelled) setUser(null)
          return
        }

        let userData: any = null
        let userRole: UserRole = 'student'
        
        // Fetch profile by ID
        const { data: profileById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileById) {
          userData = profileById
          userRole = normalizeRole(profileById.role)
        } else {
          // Fallback: Fetch by email
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

        // Get role from metadata if no profile found
        if (!userData && session.user.user_metadata?.role) {
          userRole = normalizeRole(session.user.user_metadata.role)
        }

        // ============================================
        // NAME RESOLUTION
        // Profile displays: LastName FirstName MiddleName
        // Greeting displays: FirstName only
        // ============================================
        let fullName = ''
        let firstName = ''
        
        // Build full name from individual fields (LAST, FIRST, MIDDLE order for profile)
        if (userData?.first_name) {
          const nameParts: string[] = []
          // Last name first for profile display
          if (userData?.last_name) nameParts.push(userData.last_name)
          // First name second
          nameParts.push(userData.first_name)
          // Middle name last
          if (userData?.middle_name) nameParts.push(userData.middle_name)
          fullName = nameParts.join(' ').trim()
          // First name for greeting
          firstName = userData.first_name.trim()
        }
        
        // If no first_name, try display_name
        if (!fullName && userData?.display_name && userData.display_name.trim() !== '') {
          fullName = userData.display_name.trim()
          firstName = fullName.split(' ')[0]
        }
        
        // If still no name, try full_name
        if (!fullName && userData?.full_name && userData.full_name.trim() !== '') {
          fullName = userData.full_name.trim()
          firstName = fullName.split(' ')[0]
        }
        
        // Fallback to generic name field
        if (!fullName && userData?.name && userData.name.trim() !== '') {
          fullName = userData.name.trim()
          firstName = fullName.split(' ')[0]
        }
        
        // Fallback to auth metadata
        if (!fullName && session.user.user_metadata?.full_name) {
          fullName = session.user.user_metadata.full_name.trim()
          firstName = fullName.split(' ')[0]
        }
        
        // Last resort: email prefix
        if (!fullName && session.user.email) {
          firstName = session.user.email.split('@')[0]
          fullName = formatFullName(firstName)
        }
        
        // Absolute fallback
        if (!fullName) {
          fullName = 'User'
          firstName = 'User'
        }

        // Format names properly
        const formattedFullName = formatFullName(fullName)
        const formattedFirstName = formatFullName(firstName)

        // Get avatar URL from multiple possible sources
        const avatarUrl = userData?.avatar_url || 
                         userData?.photo_url || 
                         userData?.avatar || 
                         session.user.user_metadata?.avatar_url ||
                         session.user.user_metadata?.photo_url ||
                         session.user.user_metadata?.avatar

        // Store both full name and first name separately
        if (!cancelled) {
          setUser({
            id: userData?.id || session.user.id,
            name: formattedFullName,       // Full name for profile (Last First Middle)
            firstName: formattedFirstName,  // First name for greeting
            email: userData?.email || session.user.email || '',
            role: userRole,
            avatar: avatarUrl,
            isAuthenticated: true
          })
          setAvatarError(false)
        }

      } catch (err) {
        console.error('Fetch error:', err)
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
        fetchInProgress.current = false
      }
    }

    fetchUser()
    return () => { cancelled = true }
  }, [])

  // ============================================
  // NOTIFICATIONS
  // ============================================
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [user?.id, loadNotifications])

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user?.id) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    toast.success('All notifications marked as read')
  }

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // ============================================
  // NAVIGATION HELPERS
  // ============================================
  const isNavActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '#') return false
    if (href === '/student') return pathname === '/student'
    if (href === '/staff') return pathname === '/staff'
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname?.startsWith(href + '/')
  }, [pathname])

  const isUserManagementActive = useCallback(() => {
    return !!(pathname?.startsWith('/admin/students') || 
              pathname?.startsWith('/admin/staff') || 
              pathname?.startsWith('/admin/inquiries'))
  }, [pathname])

  const getNavigation = useCallback((): NavigationItem[] => {
    if (isPublicPage || isPortalPage || isHomePage) return publicNavigation
    if (!user?.isAuthenticated) return publicNavigation
    switch (user.role) {
      case 'admin': return adminNavigation
      case 'teacher': return teacherNavigation
      case 'student': return studentNavigation
      default: return publicNavigation
    }
  }, [isPublicPage, isPortalPage, isHomePage, user])

  // ============================================
  // NAME HELPERS
  // ============================================
  const getUserInitials = useCallback(() => {
    if (!user?.name) return 'U'
    return getInitialsFromName(user.name)
  }, [user?.name])

  const getFirstName = useCallback((): string => {
    if (!user?.firstName || user.firstName === 'User') return 'User'
    return user.firstName
  }, [user?.firstName])

  // ============================================
  // HANDLERS
  // ============================================
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

  const goToDashboard = () => {
    setProfileOpen(false)
    setMobileMenuOpen(false)
    const url = getDashboardLink(user?.role || 'student')
    window.location.replace(url)
  }

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id)
    setNotificationOpen(false)
    if (notification.link) router.push(notification.link)
  }

  const handleViewAllNotifications = () => {
    setNotificationOpen(false)
    const role = user?.role || 'student'
    router.push(role === 'student' ? '/student/notifications' : '/staff/notifications')
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return <HeaderSkeleton />
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const currentNavigation = getNavigation()
  const userName = user?.name || 'User'
  const userInitials = getUserInitials()
  const userFirstName = getFirstName()
  const userRole = user?.role || 'student'

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500",
        scrolled 
          ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-2xl py-1.5 sm:py-2" 
          : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-2 sm:py-3 lg:py-4"
      )}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-4">
            
            {/* LOGO */}
            <Logo schoolSettings={schoolSettings} />

            {/* Desktop Navigation */}
            <nav className={cn(
              "hidden lg:flex items-center",
              isPortalPage 
                ? "justify-center flex-1 mr-8 xl:mr-12" 
                : "justify-center flex-1"
            )}>
              <div className="flex items-center gap-0.5 xl:gap-1.5 bg-white/15 backdrop-blur-sm rounded-full p-0.5 lg:p-1 shadow-lg">
                {currentNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = isNavActive(item.href) || (item.isDropdown && isUserManagementActive())
                  const isCbt = item.name === 'CBT Platform' || item.isCbt
                  
                  if (item.isDropdown && item.dropdownItems) {
                    return (
                      <DropdownMenu key={item.name} open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "relative px-3 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-full whitespace-nowrap flex items-center gap-1.5 lg:gap-2",
                              isUserManagementActive()
                                ? "text-[#0A2472] bg-white shadow-lg" 
                                : "text-white hover:text-white hover:bg-white/25"
                            )}
                          >
                            <Icon className={cn(
                              "h-3.5 w-3.5 lg:h-4 lg:w-4",
                              isUserManagementActive() ? "text-[#0A2472]" : "text-white"
                            )} />
                            <span className="hidden xl:inline">{item.name}</span>
                            <span className="lg:hidden xl:hidden">Users</span>
                            <ChevronDown className={cn(
                              "h-3 w-3 lg:h-3.5 lg:w-3.5 transition-transform duration-300",
                              userMenuOpen && "rotate-180"
                            )} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48 mt-2">
                          {item.dropdownItems.map((subItem) => {
                            const SubIcon = subItem.icon
                            const isSubActive = pathname?.startsWith(subItem.href)
                            return (
                              <DropdownMenuItem key={subItem.name} asChild>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "flex items-center gap-2 cursor-pointer",
                                    isSubActive && "bg-primary/10 text-primary font-medium"
                                  )}
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <SubIcon className="h-4 w-4" />
                                  <span>{subItem.name}</span>
                                </Link>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={isCbt ? handleCbtClick : undefined}
                      prefetch={false}
                      className={cn(
                        "relative px-3 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-full whitespace-nowrap",
                        isActive 
                          ? "text-[#0A2472] bg-white shadow-lg" 
                          : "text-white hover:text-white hover:bg-white/25"
                      )}
                    >
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <Icon className={cn(
                          "h-3.5 w-3.5 lg:h-4 lg:w-4",
                          isActive ? "text-[#0A2472]" : "text-white"
                        )} />
                        <span className="hidden xl:inline">{item.name}</span>
                        <span className="lg:hidden xl:hidden">
                          {item.name === 'CBT Platform' ? 'CBT' : 
                           item.name === 'Exam Approvals' ? 'Exams' :
                           item.name === 'User Management' ? 'Users' :
                           item.name === 'My Exams' ? 'Exams' : 
                           item.name.substring(0, 4)}
                        </span>
                        {isCbt && (
                          <Badge variant="secondary" className="ml-0.5 text-[8px] lg:text-[10px] px-1 lg:px-1.5 py-0 lg:py-0.5 bg-[#F5A623] text-[#0A2472] font-bold">
                            CBT
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
              >
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </Button>

              {/* Notification Bell */}
              {user?.isAuthenticated && !isPortalPage && !isHomePage && (
                <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "relative rounded-full text-white hover:bg-white/20 transition-all duration-300",
                        "flex items-center justify-center",
                        "h-8 w-8 xs:h-8 xs:w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11"
                      )}
                    >
                      <Bell className="h-4 w-4 xs:h-4 xs:w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-5.5 lg:w-5.5" />
                      <AnimatePresence>
                        {unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5 bg-red-500 rounded-full text-white text-[8px] xs:text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] flex items-center justify-center font-bold"
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    align={isMobile ? "center" : "end"}
                    side="bottom"
                    sideOffset={isMobile ? 8 : 12}
                    className={cn(
                      "w-[calc(100vw-32px)] max-w-[380px] sm:max-w-[400px] md:max-w-[420px] lg:max-w-[440px]",
                      "p-0 rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden bg-white",
                      "mx-auto left-0 right-0 sm:left-auto sm:right-0"
                    )}
                  >
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            {unreadCount > 0 
                              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` 
                              : "You're all caught up!"}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={markAllAsRead}
                            className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 hover:bg-gray-100"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <ScrollArea className="max-h-[350px] sm:max-h-[400px] md:max-h-[450px] lg:max-h-[500px]">
                      {notifications.length === 0 ? (
                        <div className="py-10 sm:py-12 px-4 sm:px-6 text-center">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-100 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">No notifications yet</p>
                          <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">
                            We'll notify you when something important happens
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                "px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50/80 transition-colors cursor-pointer group relative",
                                !notification.read && "bg-blue-50/40 hover:bg-blue-50/60"
                              )}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex gap-2 sm:gap-3">
                                <div className="shrink-0 mt-0.5">
                                  <div className={cn(
                                    "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center",
                                    !notification.read ? "bg-blue-100" : "bg-gray-100"
                                  )}>
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-0.5 sm:mb-1">
                                    <p className={cn(
                                      "text-xs sm:text-sm font-medium leading-tight",
                                      !notification.read ? "text-gray-900" : "text-gray-600"
                                    )}>
                                      {notification.title}
                                    </p>
                                    <span className="text-[9px] sm:text-[10px] text-gray-400 shrink-0 whitespace-nowrap ml-2">
                                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                              
                              {!notification.read && (
                                <div className="ml-9 sm:ml-10 mt-1">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500 rounded-full" />
                                    <span className="text-[9px] sm:text-[10px] font-medium text-blue-600">New</span>
                                  </span>
                                </div>
                              )}
                              
                              <button
                                className="absolute right-2 sm:right-3 top-2 sm:top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200"
                                onClick={(e) => deleteNotification(notification.id, e)}
                              >
                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 hover:text-red-500" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="p-2.5 sm:p-3 border-t border-gray-100 bg-gray-50/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs sm:text-sm h-8 sm:h-9 font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        onClick={handleViewAllNotifications}
                      >
                        View All Notifications
                        <ChevronRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* User Profile / Login Button */}
              {user?.isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 rounded-full text-white hover:bg-white/20 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 transition-all duration-300 h-auto"
                  >
                    <Avatar className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 ring-1 sm:ring-2 ring-white/50">
                      {user.avatar && !avatarError ? (
                        <AvatarImage 
                          src={user.avatar} 
                          alt={userName}
                          onError={() => setAvatarError(true)}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-white/30 text-white text-xs sm:text-sm font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-xs lg:text-sm font-semibold leading-tight text-white truncate max-w-[80px] lg:max-w-[120px]">
                        Hi, {userFirstName}
                      </p>
                      <p className="text-[8px] lg:text-[10px] text-white/80 truncate max-w-[80px] lg:max-w-[120px]">
                        {roleDisplayNames[userRole]}
                      </p>
                    </div>
                    <ChevronDown className={cn(
                      "h-3 w-3 lg:h-4 lg:w-4 text-white transition-transform duration-300",
                      profileOpen && "rotate-180"
                    )} />
                  </Button>

                  {profileOpen && (
                    <div className={cn(
                      "absolute bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50",
                      "top-full mt-2 right-0",
                      "w-[260px] xs:w-[280px] sm:w-72 md:w-80 lg:w-80",
                      "max-w-[calc(100vw-2rem)]"
                    )}>
                      <div className="p-2 xs:p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
                          <Avatar className={cn(
                            "ring-2 ring-primary/20",
                            "h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14"
                          )}>
                            {user.avatar && !avatarError ? (
                              <AvatarImage src={user.avatar} alt={userName} onError={() => setAvatarError(true)} className="object-cover" />
                            ) : null}
                            <AvatarFallback className={cn(
                              "bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold",
                              "text-sm xs:text-base sm:text-lg"
                            )}>
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-semibold text-gray-900 truncate", "text-xs xs:text-sm sm:text-base")}>
                              {userName}
                            </p>
                            <p className={cn("text-gray-500 truncate", "text-[10px] xs:text-xs sm:text-sm")}>
                              {user.email}
                            </p>
                            <Badge className={cn("mt-1 xs:mt-1.5 text-white", "text-[10px] xs:text-xs", roleBadgeColors[userRole])}>
                              {roleDisplayNames[userRole]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {(isPublicPage || isHomePage || isPortalPage) && (
                        <div className="p-2 xs:p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                          <button
                            onClick={goToDashboard}
                            className={cn(
                              "w-full px-2 xs:px-3 py-1.5 xs:py-2 sm:py-2.5",
                              "bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/95 hover:to-[#F5A623]",
                              "text-[#0A2472] rounded-lg transition-all duration-300",
                              "flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg",
                              "text-xs xs:text-sm"
                            )}
                          >
                            <LayoutDashboard className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            <span>
                              {userRole === 'admin' ? 'Admin Dashboard' : 
                               userRole === 'teacher' ? 'Teacher Dashboard' : 
                               'Student Dashboard'}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4 ml-1" />
                          </button>
                        </div>
                      )}
                      
                      {!isPortalPage && !isHomePage && !isPublicPage && (
                        <div className="py-1">
                          <Link 
                            href={userRole === 'student' ? '/student/profile' : userRole === 'admin' ? '/admin/settings' : '/staff'} 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 text-xs xs:text-sm"
                            onClick={() => setProfileOpen(false)}
                          >
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <span>My Profile</span>
                          </Link>
                          
                          <Link 
                            href={userRole === 'student' ? '/student/notifications' : '/staff/notifications'}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 text-xs xs:text-sm"
                            onClick={() => setProfileOpen(false)}
                          >
                            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-[10px] xs:text-xs">{unreadCount}</Badge>
                            )}
                          </Link>
                          
                          <Link 
                            href={userRole === 'student' ? '/student/settings' : userRole === 'admin' ? '/admin/settings' : '/staff/settings'} 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 text-xs xs:text-sm"
                            onClick={() => setProfileOpen(false)}
                          >
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <span>Settings</span>
                          </Link>
                        </div>
                      )}
                      
                      <div className="py-1 border-t border-gray-100">
                        <p className="px-3 sm:px-4 py-1 sm:py-2 font-semibold text-gray-400 uppercase tracking-wider text-[9px] xs:text-[10px] sm:text-xs">
                          Quick Links
                        </p>
                        
                        {pathname !== '/' && (
                          <Link 
                            href="/" 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group text-xs xs:text-sm"
                            onClick={() => setProfileOpen(false)}
                          >
                            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-xs xs:text-sm">Home Page</p>
                              <p className="text-[8px] xs:text-[10px] text-gray-400">Return to main website</p>
                            </div>
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </Link>
                        )}
                        
                        {pathname !== '/portal' && (
                          <Link 
                            href="/portal" 
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 group text-xs xs:text-sm"
                            onClick={() => setProfileOpen(false)}
                          >
                            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                              <KeyRound className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-xs xs:text-sm">Portal Page</p>
                              <p className="text-[8px] xs:text-[10px] text-gray-400">Login or switch account</p>
                            </div>
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </Link>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-100"></div>
                      
                      <div className="p-2">
                        <button 
                          onClick={handleLogoutClick}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3 text-xs xs:text-sm"
                        >
                          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                !user?.isAuthenticated && isPublicPage && (
                  <Link href="/portal" className="hidden sm:block">
                    <Button className="bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 hover:from-[#F5A623]/90 hover:to-[#F5A623] text-[#0A2472] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm">
                      <KeyRound className="mr-1 sm:mr-1.5 lg:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:rotate-12 transition-transform" />
                      <span className="hidden sm:inline">Portal Login</span>
                      <span className="sm:hidden">Login</span>
                    </Button>
                  </Link>
                )
              )}

              {/* Hamburger Menu Button */}
              <button
                type="button"
                className="lg:hidden relative h-10 w-10 min-w-[40px] flex items-center justify-center rounded-full transition-all duration-300 text-white hover:bg-white/20 active:scale-95 ml-0.5 z-50 pointer-events-auto"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMobileMenuOpen(prev => !prev)
                }}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                style={{ touchAction: 'manipulation' }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 sm:mt-3 px-3 sm:px-4"
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

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full xs:w-[320px] sm:w-[380px] bg-white z-50 shadow-2xl lg:hidden flex flex-col"
            >
              {/* Mobile Menu Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {schoolSettings?.logo_path ? (
                    <Image src={schoolSettings.logo_path} alt="Logo" width={40} height={40} className="rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">Vincollins College</p>
                    {user?.isAuthenticated && (
                      <p className="text-white/70 text-xs truncate">Hi, {userFirstName}!</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors flex-shrink-0 ml-2"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Info (if authenticated) */}
              {user?.isAuthenticated && (
                <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 flex-shrink-0">
                      {user.avatar && !avatarError ? (
                        <AvatarImage src={user.avatar} alt={userName} onError={() => setAvatarError(true)} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <Badge className={`mt-1 text-xs inline-block ${roleBadgeColors[userRole]}`}>
                        {roleDisplayNames[userRole]}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Dashboard Button for public pages */}
                  {(isPublicPage || isHomePage || isPortalPage) && (
                    <button
                      onClick={goToDashboard}
                      className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                      <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {userRole === 'admin' ? 'Admin Dashboard' : 
                         userRole === 'teacher' ? 'Teacher Dashboard' : 
                         'Student Dashboard'}
                      </span>
                      <ArrowRight className="h-4 w-4 flex-shrink-0" />
                    </button>
                  )}
                </div>
              )}

              {/* Scrollable Content */}
              <ScrollArea className="flex-1">
                <nav className="p-4">
                  {/* Navigation Items */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {currentNavigation.map((item) => {
                      const Icon = item.icon
                      const isActive = isNavActive(item.href) || (item.isDropdown && isUserManagementActive())
                      const isCbt = item.name === 'CBT Platform' || item.isCbt

                      if (item.isDropdown && item.dropdownItems) {
                        return (
                          <div key={item.name} className="mb-2">
                            <div className="flex items-center gap-3 px-3 py-2.5 text-gray-700 font-medium text-sm">
                              <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="flex-1 truncate">{item.name}</span>
                            </div>
                            <div className="ml-4 pl-6 space-y-1 border-l-2 border-gray-100">
                              {item.dropdownItems.map((subItem) => {
                                const SubIcon = subItem.icon
                                const isSubActive = pathname?.startsWith(subItem.href)
                                return (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                      isSubActive 
                                        ? 'bg-primary/10 text-primary font-medium' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <SubIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{subItem.name}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={(e) => {
                            if (isCbt) {
                              e.preventDefault()
                              setShowCbtInfo(true)
                            }
                            setMobileMenuOpen(false)
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive 
                              ? 'bg-primary/10 text-primary shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isCbt && (
                            <Badge className="bg-[#F5A623] text-[#0A2472] text-[10px] py-0 px-1.5 font-bold flex-shrink-0">
                              CBT
                            </Badge>
                          )}
                          {isActive && (
                            <motion.div 
                              layoutId="mobileActiveIndicator"
                              className="h-2 w-2 rounded-full bg-primary flex-shrink-0" 
                            />
                          )}
                        </Link>
                      )
                    })}
                  </div>

                  {/* Public Pages Only */}
                  {!isDashboardPage && (
                    <>
                      <div className="my-4 border-t border-gray-100" />

                      {!user?.isAuthenticated && (
                        <>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                            Navigate To
                          </p>
                          <div className="space-y-1 mb-4">
                            {pathname !== '/' && (
                              <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                                  <Home className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">Home Page</p>
                                  <p className="text-[10px] text-gray-400 truncate">Return to main website</p>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                              </Link>
                            )}
                            
                            {pathname !== '/portal' && (
                              <Link
                                href="/portal"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                                  <KeyRound className="h-3.5 w-3.5 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">Portal Login</p>
                                  <p className="text-[10px] text-gray-400 truncate">Login or switch account</p>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                              </Link>
                            )}
                          </div>
                        </>
                      )}

                      {/* Quick Links */}
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                        Quick Links
                      </p>
                      <div className="space-y-1">
                        <Link
                          href="/calendar"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">Academic Calendar</span>
                        </Link>
                        <Link
                          href="/library"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <BookOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">E-Library</span>
                        </Link>
                      </div>

                      {/* Search on Mobile */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          if (searchQuery.trim()) {
                            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                            setMobileMenuOpen(false)
                            setSearchQuery('')
                          }
                        }}>
                          <div className="relative">
                            <Input
                              type="search"
                              placeholder="Search..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-gray-50 border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </form>
                      </div>

                      {/* Notifications Link */}
                      {user?.isAuthenticated && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false)
                              const role = user?.role || 'student'
                              router.push(role === 'student' ? '/student/notifications' : '/staff/notifications')
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors w-full"
                          >
                            <Bell className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="flex-1 text-left truncate">Notifications</span>
                            {unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs flex-shrink-0">{unreadCount}</Badge>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Contact Info, Social Links, Copyright, Sign Out */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-2">
                        Contact Info
                      </p>
                      {contactInfo.map((info, idx) => {
                        const Icon = info.icon
                        return (
                          <div key={idx} className="flex items-start gap-2 px-2 text-xs text-gray-500">
                            <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{info.text}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {socialLinks.map((s, idx) => {
                        const Icon = s.icon
                        return (
                          <a
                            key={idx}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#0A2472] hover:text-white transition-colors flex-shrink-0"
                            aria-label={s.label}
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        )
                      })}
                    </div>

                    {/* Copyright */}
                    <div className="text-center mb-4">
                      <p className="text-[10px] text-gray-400">
                        © {currentYear} Vincollins College
                      </p>
                      <p className="text-[9px] text-gray-300 mt-0.5">
                        Geared Towards Excellence
                      </p>
                    </div>

                    {/* Login Button for non-authenticated users */}
                    {!user?.isAuthenticated && (
                      <Link
                        href="/portal"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/90 text-[#0A2472] rounded-xl font-semibold shadow-md hover:shadow-lg transition-all mb-3 text-sm"
                      >
                        <KeyRound className="h-4 w-4 flex-shrink-0" />
                        <span>Portal Login</span>
                      </Link>
                    )}

                    {/* Sign Out button for authenticated users */}
                    {user?.isAuthenticated && (
                      <button
                        onClick={handleLogoutClick}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors"
                      >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </nav>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CBT Platform Dialog */}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-[#0A2472]">10k+</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">Exams Delivered</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-[#0A2472]">99.9%</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">Platform Uptime</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-[#0A2472]">256-bit</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">SSL Encryption</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-[#0A2472]">24/7</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">Tech Support</p>
              </motion.div>
            </div>

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
                    className="flex items-start gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all border border-gray-100"
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

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
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
// EXPORT - Memoized for performance
// ============================================
export const Header = memo(function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderContent {...props} />
    </Suspense>
  )
})