// app/staff/ca-scores/page.tsx - UPDATED TO USE FULL CAScoresTab
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
import { CAScoresTab } from '@/components/staff/ca-scores'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function CAScoresContent() {
  const router = useRouter()
  const { user: contextUser } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const lastVisibilityRef = useRef(0)

  // ✅ Use UserContext profile
  useEffect(() => {
    if (contextUser) {
      setProfile(contextUser)
      setLoading(false)
    }
  }, [contextUser])

  // ✅ Visibility change refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastVisibilityRef.current > 120000) {
          lastVisibilityRef.current = Date.now()
          // Component will refresh itself
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading CA Scores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">CA Scores</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage continuous assessment scores for your students</p>
        </div>
        {/* ✅ Pass profile and term info to the existing CAScoresTab */}
        <CAScoresTab 
          staffProfile={profile} 
          termInfo={{ 
            termCode: 'third', 
            sessionYear: '2025/2026', 
            termName: 'Third Term' 
          }} 
        />
      </div>
    </div>
  )
}

export default function CAScoresPage() {
  return (
    <AuthGuard allowedRoles={['staff', 'admin', 'teacher']}>
      <CAScoresContent />
    </AuthGuard>
  )
}