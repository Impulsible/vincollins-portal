/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, ArrowRight, ChevronRight, Award, Shield, Heart, Sparkles, Send, Clock, GraduationCap, Lock, Timer, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Footer Navigation Data - Added unique id for each portal item
const footerNavItems = {
  academics: [
    { id: 'creche', title: 'Crèche/Playgroup', href: '/academics/creche-playgroup' },
    { id: 'nursery', title: 'Nursery', href: '/academics/nursery' },
    { id: 'primary', title: 'Primary', href: '/academics/primary' },
    { id: 'college', title: 'College', href: '/academics/college' },
    { id: 'cbt', title: 'CBT Platform', href: '#cbt', isCbt: true },
  ],
  about: [
    { id: 'story', title: 'Our Story', href: '/about' },
    { id: 'mission', title: 'Mission & Vision', href: '/about/mission' },
    { id: 'values', title: 'Core Values', href: '/about/values' },
    { id: 'leadership', title: 'Leadership', href: '/about/leadership' },
    { id: 'contact', title: 'Contact Us', href: '/contact' },
  ],
  portal: [
    { id: 'student-portal', title: 'Student Portal', href: '/portal' },
    { id: 'staff-portal', title: 'Staff Portal', href: '/portal' },
    { id: 'admin-portal', title: 'Admin Portal', href: '/portal' },
    { id: 'results', title: 'Results Checker', href: '/results' },
    { id: 'admissions', title: 'Admissions', href: '/admissions' },
  ],
}

const siteConfig = {
  contact: {
    address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
    phone: '08023013110',
    email: 'vincollinscollege@gmail.com',
    hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
  },
  links: {
    facebook: 'https://facebook.com/vincollins',
    twitter: 'https://twitter.com/vincollins',
    instagram: 'https://instagram.com/vincollins',
  },
}

// CBT Features
const cbtFeatures = [
  { title: 'Secure Exam Environment', description: 'Full-screen lockdown with tab-switch detection', icon: Lock },
  { title: 'Smart Timer System', description: 'Real-time countdown with auto-submit feature', icon: Timer },
  { title: 'Question Randomization', description: 'Dynamic shuffling of questions and options', icon: Shuffle },
  { title: 'Instant Results', description: 'Immediate grading for objective questions', icon: Sparkles },
]

interface SchoolSettings {
  school_name?: string
  logo_path?: string
}

export function Footer() {
  const pathname = usePathname()
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [showCbtInfo, setShowCbtInfo] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string>('student')

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setIsAuthenticated(true)
          
          // Get user role from profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (profileData?.role) {
            const role = profileData.role.toLowerCase()
            setUserRole(role === 'staff' ? 'teacher' : role)
          } else if (session.user.user_metadata?.role) {
            const role = session.user.user_metadata.role.toLowerCase()
            setUserRole(role === 'staff' ? 'teacher' : role)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  const handleCbtClick = (e: React.MouseEvent, isCbt: boolean) => {
    if (isCbt) {
      e.preventDefault()
      setShowCbtInfo(true)
    }
  }

  // Helper to get dashboard link based on role
  const getDashboardLink = (role: string): string => {
    switch (role) {
      case 'admin': return '/admin'
      case 'teacher': return '/staff'
      case 'student': return '/student'
      default: return '/portal'
    }
  }

  // Smart Portal Navigation - For security, always go to /portal page
  // The /portal page will automatically redirect logged-in users to their dashboard
  const handlePortalClick = (e: React.MouseEvent) => {
    // Always navigate to /portal for security
    // The portal page will handle the redirect logic for authenticated users
    e.preventDefault()
    router.push('/portal')
  }

  return (
    <>
      <footer className="relative bg-[#0A2472] text-white overflow-hidden">
        {/* Simple background elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5A623]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F5A623]/5 rounded-full blur-3xl" />
        
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#F5A623] to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
          {/* Main Footer Content */}
          <div className="py-14 lg:py-20">
            <div className="grid grid-cols-1 gap-10 md:gap-12 lg:grid-cols-12">
              {/* Brand Column */}
              <div className="lg:col-span-4 space-y-6">
                <Link href="/" className="inline-flex items-center gap-3 group">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                    className="relative"
                  >
                    {schoolSettings?.logo_path ? (
                      <div className="relative h-14 w-14 group-hover:scale-105 transition-all duration-300">
                        <Image 
                          src={schoolSettings.logo_path} 
                          alt={schoolSettings.school_name || 'Vincollins College Logo'} 
                          width={56}
                          height={56}
                          className="object-contain"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="relative h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                        <GraduationCap className="h-7 w-7 text-[#0A2472]" />
                      </div>
                    )}
                  </motion.div>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-['Dancing_Script',cursive] text-3xl sm:text-4xl font-bold text-white leading-tight group-hover:text-[#F5A623] transition-colors">
                        Vincollins
                      </span>
                      <span className="font-['Dancing_Script',cursive] text-3xl sm:text-4xl text-[#F5A623] leading-tight">
                        College
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#F5A623]/80 tracking-wide block mt-1">
                      Geared Towards Excellence
                    </span>
                  </div>
                </Link>
                
                <p className="text-white/70 text-sm leading-relaxed max-w-md">
                  Providing quality education from Crèche to College. Nurturing future leaders with excellence, integrity, and innovation since 2022.
                </p>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                    <Award className="h-3.5 w-3.5 text-[#F5A623]" />
                    <span className="text-xs font-medium text-white/90">4+ Years</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                    <Shield className="h-3.5 w-3.5 text-[#F5A623]" />
                    <span className="text-xs font-medium text-white/90">Accredited</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                    <Heart className="h-3.5 w-3.5 text-[#F5A623]" />
                    <span className="text-xs font-medium text-white/90">50+ Alumni</span>
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="flex space-x-3 pt-2">
                  {[
                    { href: siteConfig.links.facebook, icon: Facebook, label: 'Facebook', color: 'hover:bg-[#1877f2] hover:border-[#1877f2]' },
                    { href: siteConfig.links.twitter, icon: Twitter, label: 'Twitter', color: 'hover:bg-[#1da1f2] hover:border-[#1da1f2]' },
                    { href: siteConfig.links.instagram, icon: Instagram, label: 'Instagram', color: 'hover:bg-[#e4405f] hover:border-[#e4405f]' }
                  ].map((social) => (
                    <Link 
                      key={social.label}
                      href={social.href} 
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:text-white transition-all duration-300 hover:scale-110 border border-white/20",
                        social.color
                      )}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <social.icon className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation Columns */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-8">
                {/* Academics */}
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#F5A623] rounded-full" />
                    Our Schools
                  </h3>
                  <ul className="space-y-3">
                    {footerNavItems.academics.map((item) => (
                      <li key={item.id}>
                        <Link 
                          href={item.href}
                          onClick={(e) => item.isCbt && handleCbtClick(e, true)}
                          className="group inline-flex items-center gap-2 text-sm text-white/70 hover:text-[#F5A623] transition-all duration-300"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-[#F5A623]/60 group-hover:text-[#F5A623] transition-all duration-300 group-hover:translate-x-0.5" />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* About */}
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#F5A623] rounded-full" />
                    About Us
                  </h3>
                  <ul className="space-y-3">
                    {footerNavItems.about.map((item) => (
                      <li key={item.id}>
                        <Link 
                          href={item.href} 
                          className="group inline-flex items-center gap-2 text-sm text-white/70 hover:text-[#F5A623] transition-all duration-300"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-[#F5A623]/60 group-hover:text-[#F5A623] transition-all duration-300 group-hover:translate-x-0.5" />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Portal Access - ALL GO TO /portal FOR SECURITY */}
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#F5A623] rounded-full" />
                    Portals
                  </h3>
                  <ul className="space-y-3">
                    {footerNavItems.portal.map((item) => {
                      const isActive = pathname === item.href
                      const isPortalLink = item.href === '/portal'
                      
                      return (
                        <li key={item.id}>
                          {isPortalLink ? (
                            // Portal links - Use onClick handler for security
                            <a
                              href="/portal"
                              onClick={handlePortalClick}
                              className={cn(
                                'group inline-flex items-center gap-2 text-sm transition-all duration-300 cursor-pointer',
                                isActive 
                                  ? 'text-[#F5A623] font-medium' 
                                  : 'text-white/70 hover:text-[#F5A623]'
                              )}
                            >
                              <ChevronRight className={cn(
                                'h-3.5 w-3.5 transition-all duration-300 group-hover:translate-x-0.5',
                                isActive ? 'text-[#F5A623]' : 'text-[#F5A623]/60 group-hover:text-[#F5A623]'
                              )} />
                              <span>{item.title}</span>
                            </a>
                          ) : (
                            // Non-portal links - Regular Next.js Link
                            <Link 
                              href={item.href}
                              className={cn(
                                'group inline-flex items-center gap-2 text-sm transition-all duration-300',
                                isActive 
                                  ? 'text-[#F5A623] font-medium' 
                                  : 'text-white/70 hover:text-[#F5A623]'
                              )}
                            >
                              <ChevronRight className={cn(
                                'h-3.5 w-3.5 transition-all duration-300 group-hover:translate-x-0.5',
                                isActive ? 'text-[#F5A623]' : 'text-[#F5A623]/60 group-hover:text-[#F5A623]'
                              )} />
                              <span>{item.title}</span>
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {/* Contact Column */}
              <div className="lg:col-span-3 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#F5A623] rounded-full" />
                  Contact Us
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm group">
                    <div className="p-2 bg-[#F5A623]/10 rounded-lg flex-shrink-0 group-hover:bg-[#F5A623]/20 transition-colors">
                      <MapPin className="h-4 w-4 text-[#F5A623]" />
                    </div>
                    <span className="leading-relaxed text-white/80">{siteConfig.contact.address}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm group">
                    <div className="p-2 bg-[#F5A623]/10 rounded-lg flex-shrink-0 group-hover:bg-[#F5A623]/20 transition-colors">
                      <Phone className="h-4 w-4 text-[#F5A623]" />
                    </div>
                    <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="text-white/80 hover:text-[#F5A623] transition-colors">
                      {siteConfig.contact.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-3 text-sm group">
                    <div className="p-2 bg-[#F5A623]/10 rounded-lg flex-shrink-0 group-hover:bg-[#F5A623]/20 transition-colors">
                      <Mail className="h-4 w-4 text-[#F5A623]" />
                    </div>
                    <a href={`mailto:${siteConfig.contact.email}`} className="text-white/80 hover:text-[#F5A623] transition-colors">
                      {siteConfig.contact.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-3 text-sm group">
                    <div className="p-2 bg-[#F5A623]/10 rounded-lg flex-shrink-0 group-hover:bg-[#F5A623]/20 transition-colors">
                      <Clock className="h-4 w-4 text-[#F5A623]" />
                    </div>
                    <span className="text-white/80">{siteConfig.contact.hours}</span>
                  </li>
                </ul>

                {/* Contact Button */}
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg transition-all duration-300 text-sm shadow-md hover:shadow-lg group w-full sm:w-auto justify-center"
                >
                  <Send className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Send us a message</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Newsletter */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-white/90 mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#F5A623]" />
                    Subscribe to our newsletter
                  </p>
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-sm bg-white/10 rounded-lg text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/30 transition-all"
                      required
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2.5 text-sm font-semibold bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0A2472] rounded-lg transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      {subscribed ? 'Subscribed!' : 'Subscribe'}
                    </button>
                  </form>
                  {subscribed && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-[#F5A623] mt-2"
                    >
                      Thank you for subscribing!
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="py-6 border-t border-white/15">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/60 text-center md:text-left">
                © {currentYear} Vincollins College. All rights reserved. 
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {[
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms of Service' },
                  { href: '/cookies', label: 'Cookie Policy' },
                  { href: '/sitemap', label: 'Sitemap' }
                ].map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className="text-xs text-white/50 hover:text-[#F5A623] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CBT Info Dialog */}
      <Dialog open={showCbtInfo} onOpenChange={setShowCbtInfo}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">CBT Platform</DialogTitle>
            <DialogDescription>
              Computer-Based Testing System for secure online examinations
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {cbtFeatures.map((feature, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <feature.icon className="h-6 w-6 text-[#0A2472] mb-2" />
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => router.push('/portal')} className="flex-1">
              Login to Access CBT
            </Button>
            <Button variant="outline" onClick={() => setShowCbtInfo(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}