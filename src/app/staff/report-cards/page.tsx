// app/staff/report-cards/page.tsx - PROFESSIONAL WITH PROPER SPACING
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ReportCardsTab } from '@/components/staff/report-cards/ReportCardsTab'
import { useTermSettings } from '@/components/staff/hooks/useTermSettings'
import { DashboardSkeleton } from '@/components/staff/dashboard/DashboardSkeleton'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { FileCheck } from 'lucide-react'

export default function ReportCardsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { termInfo, loading: termLoading } = useTermSettings()

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/portal')
        return
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        if (profileData.role !== 'staff' && profileData.role !== 'admin' && profileData.role !== 'teacher') {
          toast.error('Access denied. Staff only.')
          router.replace('/portal')
          return
        }
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/portal')
    } finally {
      setAuthLoading(false)
    }
  }

  const loading = authLoading || termLoading || !mounted

  const getTermDisplay = () => {
    if (!mounted) return 'Current Term'
    if (termInfo?.termName) return termInfo.termName
    if (termInfo?.term) return termInfo.term
    return 'Current Term'
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-5 md:px-6 lg:px-7 pb-6 sm:pb-7 md:pb-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <motion.div 
      className="px-4 sm:px-5 md:px-6 lg:px-7 pb-6 sm:pb-7 md:pb-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shrink-0">
          <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
            Report Cards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Generate and manage student report cards • {getTermDisplay()}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full overflow-x-auto">
        <ReportCardsTab staffProfile={profile} termInfo={termInfo} />
      </div>
    </motion.div>
  )
}