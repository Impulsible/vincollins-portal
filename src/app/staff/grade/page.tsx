// app/staff/grade/page.tsx - FULL DARK MODE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function GradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
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
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 transition-colors duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-colors duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Grading</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Grade student submissions</p>
      </div>
      
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            Grading interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}