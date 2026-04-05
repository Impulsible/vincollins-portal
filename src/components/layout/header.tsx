/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  ChevronDown, 
  User, 
  LogIn,
  Home,
  BookOpen,
  Briefcase,
  Laptop,
  Phone,
  Calendar,
  Users,
  FileText,
  Bell,
  Search,
  Settings,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Menu,
  X,
  Sparkles,
  Award,
  Heart,
  Shield,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Copyright,
  KeyRound
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student' | 'staff'
  avatar?: string
  isAuthenticated: boolean
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Admission', href: '/admission', icon: FileText },
  { name: 'Schools', href: '/schools', icon: BookOpen },
  { name: 'CBT Platform', href: '/cbt', icon: Laptop },
  { name: 'Contact', href: '/contact', icon: Phone },
]

const studentNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/courses', icon: BookOpen },
  { name: 'Exams', href: '/exams', icon: FileText },
  { name: 'Results', href: '/results', icon: GraduationCap },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Fees', href: '/fees', icon: Briefcase },
]

const teacherNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Classes', href: '/classes', icon: Users },
  { name: 'Exam Management', href: '/exams/manage', icon: FileText },
  { name: 'Grade Students', href: '/grades', icon: GraduationCap },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Resources', href: '/resources', icon: BookOpen },
]

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users Management', href: '/users', icon: Users },
  { name: 'Courses', href: '/courses/manage', icon: BookOpen },
  { name: 'Exams', href: '/exams/manage', icon: FileText },
  { name: 'Fees Management', href: '/fees/manage', icon: Briefcase },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/vincollins', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/vincollins', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/vincollins', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/school/vincollins', label: 'LinkedIn' },
]

const contactInfo = [
  { icon: MapPin, text: '123 Education Road, Ikeja, Lagos, Nigeria' },
  { icon: Phone, text: '+234 800 123 4567' },
  { icon: Mail, text: 'info@vincollins.edu.ng' },
  { icon: Clock, text: 'Mon-Fri: 8:00 AM - 4:00 PM' },
]

interface HeaderProps {
  user?: User
  onLogout?: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Check if user is on portal page
  const isPortalPage = pathname === '/portal'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen])

  const getNavigation = () => {
    if (!user?.isAuthenticated) return navigation
    
    switch (user.role) {
      case 'student':
        return studentNavigation
      case 'teacher':
        return teacherNavigation
      case 'admin':
        return adminNavigation
      default:
        return navigation
    }
  }

  const currentNavigation = getNavigation()

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getFirstName = () => {
    if (!user?.name) return 'User'
    return user.name.split(' ')[0]
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500",
        scrolled ? "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] shadow-xl py-2" : "bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] py-3"
      )}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Section */}
            <Link 
              href={user?.isAuthenticated ? '/dashboard' : '/'} 
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <div className="relative">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 p-[2px] shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors" />
                  <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/logo.png"
                      alt="Vincollins College Logo"
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const fallbackSpan = document.createElement('span')
                          fallbackSpan.className = 'text-primary font-bold text-lg'
                          fallbackSpan.textContent = 'VC'
                          parent.appendChild(fallbackSpan)
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-['Dancing_Script',cursive] font-bold text-white leading-tight">
                  Vincollins College
                </span>
                <span className="text-[10px] sm:text-xs text-white/80 -mt-0.5">Geared Towards Excellence</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center gap-1 xl:gap-2 bg-white/10 backdrop-blur-sm rounded-full p-1">
                {currentNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full",
                        isActive 
                          ? "text-primary bg-white shadow-md" 
                          : "text-white hover:text-white hover:bg-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="rounded-full text-white hover:bg-white/20 transition-all duration-300"
              >
                <Search className="h-5 w-5" />
              </Button>

              {user?.isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-white hover:bg-white/20 transition-all duration-300"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-primary animate-pulse" />
                </Button>
              )}

              {user?.isAuthenticated ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-full text-white hover:bg-white/20 px-3 transition-all duration-300"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-white/50">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-white/20 text-white text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium leading-tight text-white">Hi, {getFirstName()}</p>
                      <p className="text-[10px] text-white/70 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-white transition-transform duration-300",
                      profileOpen && "rotate-180"
                    )} />
                  </Button>

                  {profileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-primary capitalize mt-0.5">{user.role}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <GraduationCap className="h-4 w-4" />
                          <span>My Progress</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 p-2">
                        <button 
                          onClick={onLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Portal Login button - points to /portal
                !isPortalPage && (
                  <Link href="/portal">
                    <Button className="bg-secondary hover:bg-secondary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group px-6 py-2">
                      <KeyRound className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                      Portal Login
                    </Button>
                  </Link>
                )
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 text-white hover:bg-white/20 z-50"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 px-4 animate-fade-in">
              <div className="max-w-2xl mx-auto">
                <Input
                  type="search"
                  placeholder="Search for courses, exams, students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white shadow-xl border-primary/20 rounded-full"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {profileOpen && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setProfileOpen(false)}
          />
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div 
            ref={mobileMenuRef}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-out overflow-y-auto"
            style={{ transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)' }}
          >
            {/* Close button */}
            <div className="sticky top-0 right-0 flex justify-end p-4 bg-white border-b z-10">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* User Info for Mobile */}
            {user?.isAuthenticated && (
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="px-2 py-0.5 bg-primary/10 rounded-full">
                        <p className="text-xs text-primary capitalize font-medium">{user.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="p-4">
              <div className="space-y-1">
                {currentNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 text-base font-medium transition-all duration-200 py-3 px-4 rounded-xl",
                        isActive 
                          ? "text-primary bg-primary/10" 
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-gray-500"
                      )} />
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Quick Resources */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                Quick Resources
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/results" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <GraduationCap className="h-4 w-4" />
                  <span>Check Results</span>
                </Link>
                <Link href="/calendar" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <Calendar className="h-4 w-4" />
                  <span>Academic Calendar</span>
                </Link>
                <Link href="/library" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen className="h-4 w-4" />
                  <span>E-Library</span>
                </Link>
                <Link href="/support" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <Heart className="h-4 w-4" />
                  <span>Student Support</span>
                </Link>
              </div>
            </div>

            {/* Contact Info */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                Contact Information
              </p>
              <div className="space-y-2">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1.5">
                    <info.icon className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-xs text-gray-600">{info.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                Connect With Us
              </p>
              <div className="flex justify-center gap-3">
                {socialLinks.map((social, idx) => {
                  const Icon = social.icon
                  return (
                    <Link
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-secondary hover:text-white transition-all duration-300"
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Award className="h-3 w-3 text-secondary" />
                  <span>25+ Years of Excellence</span>
                </div>
                <div className="w-px h-3 bg-gray-300" />
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Shield className="h-3 w-3 text-secondary" />
                  <span>Fully Accredited</span>
                </div>
                <div className="w-px h-3 bg-gray-300" />
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Heart className="h-3 w-3 text-secondary" />
                  <span>500+ Students</span>
                </div>
              </div>
            </div>

            {/* Copyright Section */}
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-100">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Copyright className="h-3 w-3" />
                  <span>{currentYear} Vincollins College.</span>
                  <span>All rights reserved.</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-[10px] text-gray-400">
                  <Link href="/privacy" className="hover:text-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link href="/terms" className="hover:text-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Terms of Service
                  </Link>
                  <span>•</span>
                  <Link href="/accessibility" className="hover:text-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Accessibility
                  </Link>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Designed with <Heart className="h-2 w-2 inline text-red-500" /> for excellence in education
                </p>
              </div>
            </div>

            {/* Mobile Bottom Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
              {user?.isAuthenticated ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-full border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600" 
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              ) : (
                !isPortalPage && (
                  <Link href="/portal" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-primary to-[#1e3a8a] hover:from-primary/90 hover:to-[#1e3a8a]/90 text-white rounded-full shadow-md">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Portal Login
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}