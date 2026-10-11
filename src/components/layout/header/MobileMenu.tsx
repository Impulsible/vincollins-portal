'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  X, LayoutDashboard, Users, MonitorPlay, FileCheck, GraduationCap, Briefcase, BarChart3,
  LogOut, ArrowRight, Bell, Home, KeyRound, Calendar, BookOpen, Search,
  Mail, MapPin, Phone, Clock, Facebook, Twitter, Instagram, Linkedin, ChevronRight,
  FileText, MessageSquare, Activity, Laptop, PhoneCall, ClipboardList
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { HeaderUser, SchoolSettings } from './types'

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/vincollins', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/vincollins', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/vincollins', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/school/vincollins', label: 'LinkedIn' },
]

const contactInfoData = [
  { icon: MapPin, text: '7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos' },
  { icon: Phone, text: '+234 912 1155 554' },
  { icon: Mail, text: 'vincollinscollege@gmail.com' },
  { icon: Clock, text: 'Mon-Fri: 8:00 AM - 4:00 PM' },
]

// Navigation maps
const publicNavItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Admission', href: '/admission', icon: FileText },
  { name: 'Schools', href: '/schools', icon: BookOpen },
  { name: 'CBT Platform', href: '#cbt', icon: Laptop },
  { name: 'Contact', href: '/contact', icon: PhoneCall },
]

const dashboardNavMap: Record<string, { name: string; href: string; icon: any }[]> = {
  admin: [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: GraduationCap },
    { name: 'Staff', href: '/admin/staff', icon: Briefcase },
    { name: 'Exam Approvals', href: '/admin/exams', icon: MonitorPlay },
    { name: 'Live Monitor', href: '/admin/monitor', icon: Activity },
  ],
  teacher: [
    { name: 'Overview', href: '/staff', icon: LayoutDashboard },
    { name: 'Exams', href: '/staff/exams', icon: MonitorPlay },
    { name: 'CA Scores', href: '/staff/ca-scores', icon: ClipboardList },
    { name: 'Students', href: '/staff/students', icon: Users },
    { name: 'Analytics', href: '/staff/analytics', icon: BarChart3 },
  ],
  student: [
    { name: 'Overview', href: '/student', icon: LayoutDashboard },
    { name: 'My Exams', href: '/student/exams', icon: MonitorPlay },
    { name: 'Results', href: '/student/results', icon: GraduationCap },
    { name: 'Classmates', href: '/student/classmates', icon: Users },
    { name: 'Report Card', href: '/student/report-card', icon: FileCheck },
  ],
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-purple-500 text-white border-none',
  teacher: 'bg-blue-500 text-white border-none',
  student: 'bg-emerald-500 text-white border-none',
}

const roleDisplayNames: Record<string, string> = {
  admin: 'Administrator', teacher: 'Teacher', student: 'Student',
}

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0][0]?.toUpperCase() || 'U'
}

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  user: HeaderUser | null
  schoolSettings: SchoolSettings | null
  onSignOut: () => void
  pathname: string
}

export const MobileMenu = memo(function MobileMenu({ open, onClose, user, schoolSettings, onSignOut, pathname }: MobileMenuProps) {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [avatarError, setAvatarError] = useState(false)
  const isAuthenticated = user?.isAuthenticated ?? false
  
  // Get avatar URL from user
  const getAvatarUrl = () => {
    if (avatarError) return undefined
    if (user?.avatar) return user.avatar
    // Try to get from localStorage if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('user_profile')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          return parsed.photo_url || parsed.avatar_url || undefined
        } catch {
          return undefined
        }
      }
    }
    return undefined
  }

  const avatarUrl = getAvatarUrl()
  
  // Determine which nav to show based on current page
  const isDashboardPage = pathname?.startsWith('/admin') || pathname?.startsWith('/staff') || pathname?.startsWith('/student')
  const isPortalPage = pathname === '/portal'
  
  // Show dashboard nav on dashboard pages, public nav everywhere else
  const navItems = isDashboardPage && isAuthenticated
    ? (dashboardNavMap[user?.role || 'student'] || dashboardNavMap.student)
    : publicNavItems

  // Check if a specific href is active
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    if (href === '#cbt') return false
    if (href === '/admin') return pathname === '/admin'
    if (href === '/staff') return pathname === '/staff'
    if (href === '/student') return pathname === '/student'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const handleNav = (href: string) => { 
    onClose()
    if (href === '#cbt') return
    router.push(href) 
  }
  
  const goToDashboard = () => {
    onClose()
    const urls: Record<string, string> = { admin: '/admin', teacher: '/staff', student: '/student' }
    router.push(urls[user?.role || 'student'] || '/student')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-colors" onClick={onClose} />
          
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full xs:w-[320px] sm:w-[380px] bg-white dark:bg-slate-950 z-50 shadow-2xl border-l border-transparent dark:border-slate-800/80 lg:hidden flex flex-col transition-colors duration-300">
            
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 border-b border-transparent dark:border-slate-800/80 p-4 sm:p-6 flex items-center justify-between transition-colors duration-300">
              <div className="flex items-center gap-3 min-w-0">
                {schoolSettings?.logo_path ? (
                  <Image src={schoolSettings.logo_path} alt="Logo" width={40} height={40} className="rounded-lg flex-shrink-0" />
                ) : (
                  <div className="h-10 w-10 bg-white/20 dark:bg-slate-800/80 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-white dark:text-blue-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">Vincollins College</p>
                  {isAuthenticated && <p className="text-white/70 dark:text-slate-400 text-xs truncate">Hi, {user?.firstName || 'User'}!</p>}
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/20 dark:bg-slate-800 hover:bg-white/30 dark:hover:bg-slate-700 flex items-center justify-center text-white transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User Info - with Profile Image */}
            {isDashboardPage && isAuthenticated && (
              <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/80 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20 dark:ring-blue-500/20 flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                    {avatarUrl && !avatarError ? (
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={user?.name || 'User'} 
                        onError={() => setAvatarError(true)}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
                    <Badge className={cn("mt-1 text-[10px] uppercase font-bold tracking-wider", roleBadgeColors[user?.role || 'student'])}>
                      {roleDisplayNames[user?.role || 'student']}
                    </Badge>
                  </div>
                </div>
                {/* Show "Go to Dashboard" on public pages */}
                {!isDashboardPage && (
                  <button onClick={goToDashboard} className="mt-3 w-full py-2.5 bg-[#F5A623] hover:bg-[#e09612] text-[#0A2472] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />Go to Dashboard<ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <ScrollArea className="flex-1">
              <nav className="p-4">
                {/* Section label changes based on context */}
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
                  {isDashboardPage ? 'Dashboard' : 'Navigation'}
                </p>
                
                {/* Only ONE active item at a time */}
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNav(item.href)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                          active
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 shadow-sm font-semibold'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900'
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-colors",
                          active ? 'text-primary dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
                        )} />
                        <span className="flex-1 text-left">{item.name}</span>
                        {active && (
                          <span className="h-2 w-2 rounded-full bg-primary dark:bg-blue-400 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Quick Links - Portal & Home for dashboard users */}
                {isDashboardPage && (
                  <>
                    <div className="my-4 border-t border-gray-100 dark:border-slate-800/80" />
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Quick Links</p>
                    <div className="space-y-1">
                      <button onClick={() => handleNav('/')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 cursor-pointer transition-colors">
                        <Home className="h-4 w-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                        <span>Home Page</span>
                      </button>
                      {!isPortalPage && (
                        <button onClick={() => handleNav('/portal')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer transition-colors border border-amber-100 dark:border-amber-900/30">
                          <KeyRound className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                          <span>Portal page</span>
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Contact Info + Social + Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800/80">
                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-2">Contact Info</p>
                    {contactInfoData.map((info, idx) => (
                      <div key={idx} className="flex items-start gap-2 px-2 text-xs text-gray-500 dark:text-slate-400">
                        <info.icon className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{info.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-3 mb-4">
                    {socialLinks.map((s, idx) => (
                      <a key={idx} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="h-9 w-9 rounded-full bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-[#0A2472] dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors flex-shrink-0 border border-transparent dark:border-slate-800">
                        <s.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">© {currentYear} Vincollins College</p>
                    <p className="text-[9px] text-gray-400/80 dark:text-slate-500/80 mt-0.5">Geared Towards Excellence</p>
                  </div>

                  {/* Portal Login for public pages */}
                  {!isAuthenticated && !isPortalPage && (
                    <button onClick={() => handleNav('/portal')} className="flex items-center justify-center gap-2 w-full py-3 bg-[#F5A623] hover:bg-[#e09612] text-[#0A2472] rounded-xl font-bold shadow-md text-sm mb-3 transition-colors cursor-pointer">
                      <KeyRound className="h-4 w-4" />Portal Login
                    </button>
                  )}

                  {/* Sign Out for authenticated users */}
                  {isAuthenticated && (
                    <button onClick={() => { onClose(); onSignOut() }}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl font-semibold text-sm transition-colors cursor-pointer border border-red-100 dark:border-red-900/30">
                      <LogOut className="h-4 w-4" />Sign Out
                    </button>
                  )}
                </div>
              </nav>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})