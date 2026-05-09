// components/layout/header/MobileMenu.tsx - CLEAN LOGO, NO BACKGROUND
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  X, LayoutDashboard, Users, MonitorPlay, FileCheck, GraduationCap, Briefcase, BarChart3, 
  LogOut, ArrowRight, Bell, Home, KeyRound, Calendar, BookOpen, Search,
  Mail, MapPin, Phone, Clock,
  Facebook, Twitter, Instagram, Linkedin,
  ChevronRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  photo_url?: string
  isAuthenticated: boolean
}

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  user?: User
  onLogout?: () => void
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/vincollins', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/vincollins', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/vincollins', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/school/vincollins', label: 'LinkedIn' },
]

const contactInfo = [
  { icon: MapPin, text: '7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos' },
  { icon: Phone, text: '+234 912 1155 554' },
  { icon: Mail, text: 'vincollinscollege@gmail.com' },
  { icon: Clock, text: 'Mon-Fri: 8:00 AM - 4:00 PM' },
]

const navMap: Record<string, { name: string; href: string; icon: React.ElementType }[]> = {
  admin: [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: GraduationCap },
    { name: 'Staff', href: '/admin/staff', icon: Briefcase },
    { name: 'Exam Approvals', href: '/admin/exams', icon: MonitorPlay },
    { name: 'Reports', href: '/admin/report-cards', icon: FileCheck },
  ],
  teacher: [
    { name: 'Overview', href: '/staff', icon: LayoutDashboard },
    { name: 'Exams', href: '/staff/exams', icon: MonitorPlay },
    { name: 'Assignments', href: '/staff/assignments', icon: FileCheck },
    { name: 'Students', href: '/staff/students', icon: Users },
    { name: 'Analytics', href: '/staff/analytics', icon: BarChart3 },
  ],
  student: [
    { name: 'Overview', href: '/student', icon: LayoutDashboard },
    { name: 'My Exams', href: '/student/exams', icon: MonitorPlay },
    { name: 'Results', href: '/student/results', icon: GraduationCap },
    { name: 'Profile', href: '/student/profile', icon: Users },
  ],
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-500 text-white',
  teacher: 'bg-blue-500 text-white',
  student: 'bg-emerald-500 text-white',
}

const roleNames: Record<string, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
}

export default function MobileMenu({ open, onClose, user, onLogout }: MobileMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const currentYear = new Date().getFullYear()
  
  const items = navMap[user?.role || 'student'] || navMap.student
  const isDashboardPage = pathname?.startsWith('/admin') || pathname?.startsWith('/staff') || pathname?.startsWith('/student')

  useEffect(() => {
    if (open && !schoolLogo && !logoLoaded) {
      const fetchLogo = async () => {
        try {
          const { data } = await supabase
            .from('school_settings')
            .select('logo_path')
            .single()
          if (data?.logo_path) {
            setSchoolLogo(data.logo_path)
          }
        } catch {
          // Silently fail
        } finally {
          setLogoLoaded(true)
        }
      }
      fetchLogo()
    }
  }, [open, schoolLogo, logoLoaded])

  useEffect(() => {
    setLogoError(false)
  }, [schoolLogo])

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0]?.toUpperCase() || 'U'
  }

  const getFirstName = (name: string) => {
    if (!name) return 'User'
    const parts = name.split(' ')
    if (parts.length >= 2) return parts[1]
    return parts[0] || 'User'
  }

  const handleNavClick = (href: string) => {
    onClose()
    router.push(href)
  }

  const handleSignOut = () => {
    onClose()
    onLogout?.()
  }

  const goToDashboard = () => {
    onClose()
    const urls: Record<string, string> = { admin: '/admin', teacher: '/staff', student: '/student' }
    router.push(urls[user?.role || 'student'] || '/student')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      onClose()
      setSearchQuery('')
    }
  }

  const studentPhotoUrl = user?.photo_url || user?.avatar || null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full xs:w-[340px] sm:w-[400px] bg-white z-50 shadow-2xl lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-[#0A2472] via-[#0d2b8a] to-[#1e3a8a] px-4 sm:px-5 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Logo - just the image, no background */}
                  {schoolLogo && !logoError ? (
                    <Image 
                      src={schoolLogo} 
                      alt="School Logo" 
                      width={44} 
                      height={44}
                      className="object-contain flex-shrink-0"
                      onError={() => setLogoError(true)}
                      priority={false}
                    />
                  ) : (
                    <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm sm:text-base truncate">
                      Vincollins College
                    </p>
                    <p className="text-white/60 text-[10px] sm:text-xs truncate">
                      Geared Towards Excellence
                    </p>
                    {user?.isAuthenticated && (
                      <p className="text-white/80 text-[10px] sm:text-xs mt-0.5 font-medium">
                        👋 Hi, {getFirstName(user.name)}!
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors flex-shrink-0 ml-3 active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* User Profile Card */}
            {user?.isAuthenticated && (
              <div className="flex-shrink-0 mx-4 -mt-3 sm:mx-5 sm:-mt-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20 flex-shrink-0 shadow-sm">
                      {studentPhotoUrl && !avatarError ? (
                        <AvatarImage 
                          src={studentPhotoUrl} 
                          alt={user.name}
                          onError={() => setAvatarError(true)}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={cn("text-[10px] sm:text-xs font-medium", roleColors[user.role])}>
                          {roleNames[user.role]}
                        </Badge>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" title="Online" />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={goToDashboard} 
                    className="mt-3 w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transition-all active:scale-[0.98]"
                  >
                    <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}
                    </span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 mt-3 sm:mt-4">
              <nav className="px-4 sm:px-5 pb-6">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  Main Menu
                </p>
                
                <div className="space-y-0.5 mb-6">
                  {items.map((item) => {
                    const Icon = item.icon
                    const active = pathname?.startsWith(item.href)
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavClick(item.href)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          active 
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm font-semibold border border-emerald-100' 
                            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                          active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-500'
                        )}>
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        <ChevronRight className={cn(
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          active ? 'text-emerald-500' : 'text-gray-300'
                        )} />
                      </button>
                    )
                  })}
                </div>

                {isDashboardPage && (
                  <>
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        Quick Links
                      </p>
                      <div className="space-y-0.5">
                        <button onClick={() => handleNavClick('/')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors group">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <Home className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-sm">Home Page</p>
                            <p className="text-[10px] text-gray-400 truncate">Return to main website</p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        </button>
                        <button onClick={() => handleNavClick('/portal')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors group">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                            <KeyRound className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-sm">Portal Login</p>
                            <p className="text-[10px] text-gray-400 truncate">Login or switch account</p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        </button>
                        {user?.isAuthenticated && (
                          <button onClick={() => { onClose(); router.push(user.role === 'student' ? '/student/notifications' : '/staff/notifications') }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors group">
                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                              <Bell className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium text-sm">Notifications</p>
                              <p className="text-[10px] text-gray-400 truncate">View your alerts</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {!isDashboardPage && (
                  <>
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        Quick Links
                      </p>
                      <div className="space-y-0.5">
                        <button onClick={() => handleNavClick('/calendar')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 text-gray-500" />
                          </div>
                          <span>Academic Calendar</span>
                        </button>
                        <button onClick={() => handleNavClick('/library')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                          </div>
                          <span>E-Library</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <form onSubmit={handleSearch}>
                        <div className="relative">
                          <Input 
                            type="search" 
                            placeholder="Search the site..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full bg-gray-50 border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 transition-all" 
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </form>
                    </div>
                  </>
                )}

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Contact Info
                  </p>
                  <div className="space-y-2.5">
                    {contactInfo.map((info, idx) => {
                      const Icon = info.icon
                      return (
                        <div key={idx} className="flex items-start gap-2.5 px-2">
                          <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="h-3.5 w-3.5 text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-600 leading-relaxed">{info.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Follow Us
                  </p>
                  <div className="flex items-center gap-2 px-2">
                    {socialLinks.map((social, idx) => {
                      const Icon = social.icon
                      return (
                        <a 
                          key={idx} 
                          href={social.href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-90 flex-shrink-0" 
                          aria-label={social.label}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-center mb-4">
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      © {currentYear} Vincollins College
                    </p>
                    <p className="text-[9px] text-gray-300 mt-0.5">
                      Geared Towards Excellence
                    </p>
                  </div>

                  {!user?.isAuthenticated ? (
                    <button 
                      onClick={() => handleNavClick('/portal')} 
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transition-all active:scale-[0.98] text-sm"
                    >
                      <KeyRound className="h-4 w-4 flex-shrink-0" />
                      <span>Portal Login</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleSignOut} 
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold text-sm transition-colors active:scale-[0.98]"
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
  )
}