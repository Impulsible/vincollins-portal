// app/staff/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { toast } from 'sonner'

interface StaffProfile {
  id: string
  full_name?: string
  name?: string
  email?: string
  photo_url?: string
  avatar_url?: string
  department?: string
  position?: string
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('staff-overview')
  const [profile, setProfile] = useState<StaffProfile | null>(null)

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/staff') setActiveTab('staff-overview')
    else if (pathname?.startsWith('/staff/exams')) setActiveTab('staff-exams')
    else if (pathname?.startsWith('/staff/students')) setActiveTab('staff-students')
    else if (pathname?.startsWith('/staff/profile')) setActiveTab('staff-profile')
    else if (pathname?.startsWith('/staff/assignments')) setActiveTab('staff-assignments')
    else if (pathname?.startsWith('/staff/analytics')) setActiveTab('staff-analytics')
    else if (pathname?.startsWith('/staff/notifications')) setActiveTab('staff-notifications')
    else if (pathname?.startsWith('/staff/settings')) setActiveTab('staff-settings')
  }, [pathname])

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
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
        role="staff"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
        onLogout={handleLogout}
      />
    </>
  )
}