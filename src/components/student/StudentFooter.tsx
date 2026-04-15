'use client'

import { GraduationCap, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import Link from 'next/link'

export function StudentFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left Section - Copyright */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <GraduationCap className="h-4 w-4" />
            <span>© {currentYear} Vincollins College.</span>
            <span>All rights reserved.</span>
          </div>

          {/* Center Section - Quick Links */}
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
              Privacy
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link href="/terms" className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
              Terms
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link href="/help" className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
              Help
            </Link>
          </div>

          {/* Right Section - Social Links */}
          <div className="flex items-center gap-3">
            <Link 
              href="https://facebook.com/vincollins" 
              target="_blank"
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-white transition-all duration-300"
            >
              <Facebook className="h-3.5 w-3.5" />
            </Link>
            <Link 
              href="https://twitter.com/vincollins" 
              target="_blank"
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-white transition-all duration-300"
            >
              <Twitter className="h-3.5 w-3.5" />
            </Link>
            <Link 
              href="https://instagram.com/vincollins" 
              target="_blank"
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-white transition-all duration-300"
            >
              <Instagram className="h-3.5 w-3.5" />
            </Link>
            <Link 
              href="https://linkedin.com/school/vincollins" 
              target="_blank"
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-white transition-all duration-300"
            >
              <Linkedin className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}