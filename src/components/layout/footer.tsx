'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, ArrowRight, ChevronRight, Award, Shield, Heart, Sparkles, Send, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Footer Navigation Data
const footerNavItems = {
  academics: [
    { title: 'Crèche/Playgroup', href: '/academics/creche-playgroup' },
    { title: 'Nursery', href: '/academics/nursery' },
    { title: 'Primary', href: '/academics/primary' },
    { title: 'College', href: '/academics/college' },
    { title: 'CBT Platform', href: '/cbt' },
  ],
  about: [
    { title: 'Our Story', href: '/about' },
    { title: 'Mission & Vision', href: '/about/mission' },
    { title: 'Core Values', href: '/about/values' },
    { title: 'Leadership', href: '/about/leadership' },
    { title: 'Contact Us', href: '/contact' },
  ],
  portal: [
    { title: 'Student Portal', href: '/portal' },
    { title: 'Staff Portal', href: '/staff' },
    { title: 'CBT Login', href: '/cbt/login' },
    { title: 'Results Checker', href: '/results' },
    { title: 'Admissions', href: '/admissions' },
  ],
}

const siteConfig = {
  contact: {
    address: '123 Education Road, Ikeja, Lagos, Nigeria',
    phone: '+234 800 123 4567',
    email: 'info@vincollins.edu.ng',
    hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
  },
  links: {
    facebook: 'https://facebook.com/vincollins',
    twitter: 'https://twitter.com/vincollins',
    instagram: 'https://instagram.com/vincollins',
  },
}

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-[#0A2472] text-white overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern-white opacity-[0.02]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5A623]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F5A623]/10 rounded-full blur-3xl" />
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5A623] to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-10 md:gap-12 lg:grid-cols-12">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-5">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md group-hover:shadow-lg transition-all duration-500">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/images/logo.png"
                      alt="Vincollins College Logo"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-[#0A2472] text-xl font-bold">VC</span>';
                        }
                      }}
                    />
                  </div>
                </div>
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
                    Geared Towards Success
                  </span>
                </div>
              </Link>
              
              <p className="text-white/80 text-sm leading-relaxed">
                Providing quality education from Crèche to College. Nurturing future leaders with excellence, integrity, and innovation since 1995.
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                  <Award className="h-3 w-3 text-[#F5A623]" />
                  <span className="text-xs font-medium text-white/90">25+ Years</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                  <Shield className="h-3 w-3 text-[#F5A623]" />
                  <span className="text-xs font-medium text-white/90">Accredited</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                  <Heart className="h-3 w-3 text-[#F5A623]" />
                  <span className="text-xs font-medium text-white/90">500+ Students</span>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex space-x-3 pt-2">
                {[
                  { href: siteConfig.links.facebook, icon: Facebook, label: 'Facebook', color: 'hover:bg-[#1877f2]' },
                  { href: siteConfig.links.twitter, icon: Twitter, label: 'Twitter', color: 'hover:bg-[#1da1f2]' },
                  { href: siteConfig.links.instagram, icon: Instagram, label: 'Instagram', color: 'hover:bg-[#e4405f]' }
                ].map((social) => (
                  <Link 
                    key={social.label}
                    href={social.href} 
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white/80 hover:text-white transition-all duration-300 hover:scale-105",
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
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#F5A623] rounded-full" />
                  Our Schools
                </h3>
                <ul className="space-y-2.5">
                  {footerNavItems.academics.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={item.href} 
                        className="group inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#F5A623] transition-all duration-300"
                      >
                        <ChevronRight className="h-3 w-3 text-[#F5A623]/60 group-hover:text-[#F5A623] transition-all duration-300 group-hover:translate-x-0.5" />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* About */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#F5A623] rounded-full" />
                  About Us
                </h3>
                <ul className="space-y-2.5">
                  {footerNavItems.about.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={item.href} 
                        className="group inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#F5A623] transition-all duration-300"
                      >
                        <ChevronRight className="h-3 w-3 text-[#F5A623]/60 group-hover:text-[#F5A623] transition-all duration-300 group-hover:translate-x-0.5" />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Portal Access */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#F5A623] rounded-full" />
                  Quick Access
                </h3>
                <ul className="space-y-2.5">
                  {footerNavItems.portal.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link 
                          href={item.href} 
                          className={cn(
                            'group inline-flex items-center gap-2 text-sm transition-all duration-300',
                            isActive 
                              ? 'text-[#F5A623] font-medium' 
                              : 'text-white/80 hover:text-[#F5A623]'
                          )}
                        >
                          <ChevronRight className={cn(
                            'h-3 w-3 transition-all duration-300 group-hover:translate-x-0.5',
                            isActive ? 'text-[#F5A623]' : 'text-[#F5A623]/60 group-hover:text-[#F5A623]'
                          )} />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* Contact Column - Fixed White Text */}
            <div className="lg:col-span-3 space-y-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#F5A623] rounded-full" />
                Contact Us
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-white hover:text-white/90 transition-colors duration-300">
                  <div className="p-1 bg-[#F5A623]/20 rounded-lg flex-shrink-0">
                    <MapPin className="h-4 w-4 text-[#F5A623]" />
                  </div>
                  <span className="leading-relaxed text-white">{siteConfig.contact.address}</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-white hover:text-white/90 transition-colors duration-300">
                  <div className="p-1 bg-[#F5A623]/20 rounded-lg flex-shrink-0">
                    <Phone className="h-4 w-4 text-[#F5A623]" />
                  </div>
                  <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="text-white hover:text-[#F5A623] transition-colors">
                    {siteConfig.contact.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-white hover:text-white/90 transition-colors duration-300">
                  <div className="p-1 bg-[#F5A623]/20 rounded-lg flex-shrink-0">
                    <Mail className="h-4 w-4 text-[#F5A623]" />
                  </div>
                  <a href={`mailto:${siteConfig.contact.email}`} className="text-white hover:text-[#F5A623] transition-colors">
                    {siteConfig.contact.email}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="p-1 bg-[#F5A623]/20 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 text-[#F5A623]" />
                  </div>
                  <span className="text-white">{siteConfig.contact.hours}</span>
                </li>
              </ul>

              {/* Contact Button */}
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0A2472] font-bold rounded-lg transition-all duration-300 text-sm shadow-md hover:shadow-xl group w-full sm:w-auto justify-center"
              >
                <Send className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span>Send us a message</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Newsletter */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-white/90 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#F5A623]" />
                  Subscribe to our newsletter
                </p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 px-3 py-2 text-sm bg-white/20 rounded-lg text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/30 transition-all"
                  />
                  <button className="px-4 py-2 text-sm font-semibold bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0A2472] rounded-lg transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/70 text-center md:text-left">
              © {currentYear} Vincollins College. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/sitemap', label: 'Sitemap' }
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-xs text-white/60 hover:text-[#F5A623] transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}