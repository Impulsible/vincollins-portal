// app/admin/announcements/page.tsx
'use client'

import { AnnouncementsManager } from '@/components/admin/announcements/AnnouncementsManager'
import { useUser } from '@/contexts/UserContext'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AdminAnnouncementsPage() {
  const { user } = useUser()

  const profile = user ? {
    id: user.id,
    full_name: user.full_name || 'Administrator',
    email: user.email || '',
    role: user.role || 'admin',
    photo_url: user.photo_url || undefined
  } : null

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 sm:mb-5 flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
      >
        <Link href="/admin" className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Announcements</span>
      </motion.div>

      <AnnouncementsManager profile={profile} hideHeader={false} />
    </div>
  )
}