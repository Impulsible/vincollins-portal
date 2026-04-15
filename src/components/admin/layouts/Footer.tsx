// components/admin/layouts/Footer.tsx
'use client'

import { Heart, ShieldCheck, Globe } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        {/* Left - Copyright */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>© {currentYear} Vincollins College</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Admin Portal</span>
        </div>

        {/* Center - Made with love */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
          <span>Made with</span>
          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 animate-pulse" />
          <span>for education</span>
        </div>

        {/* Right - Status */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Secure Connection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}