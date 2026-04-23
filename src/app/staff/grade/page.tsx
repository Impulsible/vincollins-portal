// app/staff/grade/page.tsx - FIXED: NO CONTEXT
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// ❌ REMOVED: import { useStaff } from '@/contexts/StaffContext'
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Grading</h1>
        <p className="text-muted-foreground text-sm mt-1">Grade student submissions</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Grading interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}