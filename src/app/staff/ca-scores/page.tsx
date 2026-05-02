// app/staff/ca-scores/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CAScoresTab } from '@/components/staff/ca-scores'
import { Loader2 } from 'lucide-react'

export default function CAScoresPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!data || !['staff', 'admin', 'teacher'].includes(data.role)) { router.push('/portal'); return }
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">CA Scores</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage continuous assessment scores</p>
        </div>
        <CAScoresTab staffProfile={profile} termInfo={{ termCode: 'third', sessionYear: '2025/2026', termName: 'Third Term' }} />
      </div>
    </div>
  )
}