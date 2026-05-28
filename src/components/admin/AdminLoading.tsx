// components/admin/AdminLoading.tsx - NO SKELETON LOADER
// ============================================
// ADMIN DASHBOARD LOADING STATE
// ============================================

'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Header } from '@/components/layout/header'

interface AdminLoadingProps {
  profile: any
  onLogout: () => void
}

export default function AdminLoading({ profile, onLogout }: AdminLoadingProps) {
  const formatProfileForHeader = (profile: any) => {
    if (!profile) return undefined
    
    return {
      id: profile.id || '',
      name: profile.display_name || profile.full_name || 'Administrator',
      firstName: profile.first_name || profile.display_name?.split(' ')[0] || profile.full_name?.split(' ')[0] || 'Admin',
      email: profile.email || '',
      role: 'admin' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  // ✅ NO SKELETON - Just the beautiful animated loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={onLogout} />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Shield className="h-16 w-16 text-purple-600 mx-auto" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-slate-600 text-lg font-medium"
          >
            Loading Admin Dashboard...
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-slate-500 text-sm"
          >
            Preparing your administrative workspace 🛡️
          </motion.p>
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-purple-400"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}