// components/staff/StaffLoading.tsx - INSTANT LOADING (No delays)
'use client'

import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'
import { Header } from '@/components/layout/header'

interface StaffLoadingProps {
  profile: any
  onLogout: () => void
}

export default function StaffLoading({ profile, onLogout }: StaffLoadingProps) {
  // ✅ Fast header formatting - no expensive operations
  const formatProfileForHeader = (profile: any) => {
    if (!profile) return undefined
    
    return {
      id: profile.id || '',
      name: profile.display_name || profile.full_name || 'Staff',
      firstName: profile.first_name || profile.display_name?.split(' ')[0] || profile.full_name?.split(' ')[0] || 'Staff',
      email: profile.email || '',
      role: 'teacher' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  // ✅ INSTANT RENDER - No animations that delay perceived loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={onLogout} />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center">
          {/* Faster spinner - no animation delay */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
          
          {/* Immediate text - no fade-in delays */}
          <p className="mt-4 text-slate-600 text-lg font-medium">
            Loading Staff Dashboard...
          </p>
          <p className="mt-2 text-slate-500 text-sm">
            Preparing your teaching workspace 📚
          </p>
          
          {/* Instant bouncing dots - no delay */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce"
                style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}