// app/admin/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { toast } from 'sonner'

interface AdminProfile {
  id: string
  full_name?: string
  name?: string
  email?: string
  photo_url?: string
  avatar_url?: string
  role?: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('admin-overview')
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/admin') setActiveTab('admin-overview')
    else if (pathname?.startsWith('/admin/exams')) setActiveTab('admin-exams')
    else if (pathname?.startsWith('/admin/users')) setActiveTab('admin-users')
    else if (pathname?.startsWith('/admin/settings')) setActiveTab('admin-settings')
    else if (pathname?.startsWith('/admin/reports')) setActiveTab('admin-reports')
    else if (pathname?.startsWith('/admin/approvals')) setActiveTab('admin-approvals')
    else if (pathname?.startsWith('/admin/notifications')) setActiveTab('admin-notifications')
    else if (pathname?.startsWith('/admin/billing')) setActiveTab('admin-billing')
  }, [pathname])

  // Load profile and notifications
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

        // Load notification count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('read', false)
        setNotificationCount(count || 0)
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
        role="admin"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
        onLogout={handleLogout}
        notificationCount={notificationCount}
      />
    </>
  )
}