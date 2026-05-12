// components/layout/header/MobileMenu.tsx - CONTEXT-AWARE NAVIGATION
'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  X, LayoutDashboard, Users, MonitorPlay, FileCheck, GraduationCap, Briefcase, BarChart3,
  LogOut, ArrowRight, Bell, Home, KeyRound, Calendar, BookOpen, Search,
  Mail, MapPin, Phone, Clock, Facebook, Twitter, Instagram, Linkedin, ChevronRight,
  FileText, MessageSquare, Activity, Laptop, PhoneCall
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    { name: 'Reports', href: '/admin/report-cards', icon: FileCheck },
    { name: 'Live Monitor', href: '/admin/monitor', icon: Activity },
  ],
  teacher: [
    { name: 'Overview', href: '/staff', icon: LayoutDashboard },
    { name: 'Exams', href: '/staff/exams', icon: MonitorPlay },
    { name: 'Assignments', href: '/staff/assignments', icon: FileText },
    { name: 'Students', href: '/staff/students', icon: Users },
    { name: 'Analytics', href: '/staff/analytics', icon: BarChart3 },
  ],
  student: [
    { name: 'Overview', href: '/student', icon: LayoutDashboard },
    { name: 'My Exams', href: '/student/exams', icon: MonitorPlay },
    { name: 'Results', href: '/student/results', icon: GraduationCap },
    { name: 'Classmates', href: '/student/classmates', icon: Users },
    { name: 'Profile', href: '/student/profile', icon: Users },
  ],
}

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
  const isAuthenticated = user?.isAuthenticated ?? false
  
  // ✅ Determine which nav to show based on current page
  const isDashboardPage = pathname?.startsWith('/admin') || pathname?.startsWith('/staff') || pathname?.startsWith('/student')
  const isPortalPage = pathname === '/portal'
  
  // ✅ Show dashboard nav on dashboard pages, public nav everywhere else
  const navItems = isDashboardPage && isAuthenticated
    ? (dashboardNavMap[user?.role || 'student'] || dashboardNavMap.student)
    : publicNavItems

  // ✅ Check if a specific href is active
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
    if (href === '#cbt') return // CBT handled separately
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
          
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full xs:w-[320px] sm:w-[380px] bg-white z-50 shadow-2xl lg:hidden flex flex-col">
            
            {/* Header */}
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
                  {isAuthenticated && <p className="text-white/70 text-xs truncate">Hi, {user?.firstName || 'User'}!</p>}
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User Info - only on dashboard pages */}
            {isDashboardPage && isAuthenticated && (
              <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                    <Badge className={cn("mt-1 text-xs", roleBadgeColors[user?.role || 'student'])}>
                      {roleDisplayNames[user?.role || 'student']}
                    </Badge>
                  </div>
                </div>
                {/* Show "Go to Dashboard" on public pages */}
                {!isDashboardPage && (
                  <button onClick={goToDashboard} className="mt-3 w-full py-2.5 bg-[#F5A623] text-[#0A2472] rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />Go to Dashboard<ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <ScrollArea className="flex-1">
              <nav className="p-4">
                {/* ✅ Section label changes based on context */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  {isDashboardPage ? 'Dashboard' : 'Navigation'}
                </p>
                
                {/* ✅ Only ONE active item at a time */}
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNav(item.href)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-all",
                          active
                            ? 'bg-primary/10 text-primary shadow-sm font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          active ? 'text-primary' : 'text-gray-400'
                        )} />
                        <span className="flex-1 text-left">{item.name}</span>
                        {/* ✅ Active indicator */}
                        {active && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* ✅ Quick Links - Portal & Home for dashboard users */}
                {isDashboardPage && (
                  <>
                    <div className="my-4 border-t border-gray-100" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Quick Links</p>
                    <div className="space-y-1">
                      <button onClick={() => handleNav('/')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                        <Home className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Home Page</span>
                      </button>
                      {!isPortalPage && (
                        <button onClick={() => handleNav('/portal')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 bg-amber-50/50">
                          <KeyRound className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span>Portal Login</span>
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* ✅ Contact Info + Social + Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-2">Contact Info</p>
                    {contactInfoData.map((info, idx) => (
                      <div key={idx} className="flex items-start gap-2 px-2 text-xs text-gray-500">
                        <info.icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{info.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-3 mb-4">
                    {socialLinks.map((s, idx) => (
                      <a key={idx} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#0A2472] hover:text-white transition-colors flex-shrink-0">
                        <s.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-[10px] text-gray-400">© {currentYear} Vincollins College</p>
                    <p className="text-[9px] text-gray-300">Geared Towards Excellence</p>
                  </div>

                  {/* ✅ Portal Login for public pages */}
                  {!isAuthenticated && !isPortalPage && (
                    <button onClick={() => handleNav('/portal')} className="flex items-center justify-center gap-2 w-full py-3 bg-[#F5A623] text-[#0A2472] rounded-xl font-semibold shadow-md text-sm mb-3">
                      <KeyRound className="h-4 w-4" />Portal Login
                    </button>
                  )}

                  {/* ✅ Sign Out for authenticated users */}
                  {isAuthenticated && (
                    <button onClick={() => { onClose(); onSignOut() }}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium text-sm">
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