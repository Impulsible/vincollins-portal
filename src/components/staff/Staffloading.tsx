// components/staff/StaffLoading.tsx
// ============================================
// STAFF DASHBOARD LOADING STATE
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'
import { Header } from '@/components/layout/header'

interface StaffLoadingProps {
  profile: any
  onLogout: () => void
}

export default function StaffLoading({ profile, onLogout }: StaffLoadingProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatProfileForHeader = (profile: any) => {
    if (!profile) return undefined
    
    return {
      id: profile.id || '',
      name: profile.display_name || profile.full_name || 'Staff',
      firstName: profile.first_name || profile.display_name?.split(' ')[0] || profile.full_name?.split(' ')[0] || 'Staff',  // ✅ ADD THIS
      email: profile.email || '',
      role: 'teacher' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  // Show minimal loading on server to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={onLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse mx-auto" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-4 mx-auto" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-2 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // Show full animated loading on client
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={onLogout} />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Briefcase className="h-16 w-16 text-emerald-600 mx-auto" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-slate-600 text-lg font-medium"
          >
            Loading Staff Dashboard...
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-slate-500 text-sm"
          >
            Preparing your teaching workspace 📚
          </motion.p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}