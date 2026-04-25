// app/student/layout.tsx - CLEANED UP
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { toast } from 'sonner'

interface StudentProfile {
  id: string
  full_name?: string
  email?: string
  photo_url?: string
  class?: string
  department?: string
  vin_id?: string
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/student') setActiveTab('overview')
    else if (pathname?.startsWith('/student/exams')) setActiveTab('exams')
    else if (pathname?.startsWith('/student/results')) setActiveTab('results')
    else if (pathname?.startsWith('/student/profile')) setActiveTab('profile')
    else if (pathname?.startsWith('/student/assignments')) setActiveTab('assignments')
    else if (pathname?.startsWith('/student/attendance')) setActiveTab('attendance')
    else if (pathname?.startsWith('/student/courses')) setActiveTab('courses')
    else if (pathname?.startsWith('/student/performance')) setActiveTab('performance')
    else if (pathname?.startsWith('/student/notifications')) setActiveTab('notifications')
    else if (pathname?.startsWith('/student/settings')) setActiveTab('settings')
    else if (pathname?.startsWith('/student/report-card')) setActiveTab('report-card')
  }, [pathname])

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, photo_url, class, department, vin_id')
          .eq('id', session.user.id)
          .single()
        if (data) setProfile(data)
      }
    }
    loadProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  return (
    <>
      {children}
      <MobileBottomNav 
        role="student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
        onLogout={handleLogout}
      />
    </>
  )
}