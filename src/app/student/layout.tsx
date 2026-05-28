// app/student/layout.tsx - WITH ANNOUNCEMENTS TAB & LOADING STATE

'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { StudentPresence } from '@/components/student/StudentPresence'
import StudentLoading from '@/components/student/StudentLoading'
import { toast } from 'sonner'

interface StudentProfile {
  id: string
  full_name?: string
  display_name?: string
  first_name?: string
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
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if current route is an exam page (CBT interface)
  const isExamPage = pathname?.startsWith('/student/exam/')

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/student') setActiveTab('overview')
    else if (pathname?.startsWith('/student/announcements')) setActiveTab('announcements')
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

  // Load profile and get user ID for presence
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, first_name, email, photo_url, class, department, vin_id')
            .eq('id', session.user.id)
            .single()
          
          if (error) throw error
          if (data) setProfile(data)
        } else {
          router.push('/portal')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  const handleLogout = async () => {
    // Mark user as offline before logout
    if (userId) {
      try {
        const channel = supabase.channel('online-students')
        await channel.subscribe()
        await channel.track({
          user_id: userId,
          status: 'offline',
          last_seen: new Date().toISOString(),
        })
        await channel.unsubscribe()
      } catch (error) {
        console.error('Error marking offline:', error)
      }
    }
    
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  // Show loading state
  if (loading) {
    return <StudentLoading profile={profile} onLogout={handleLogout} />
  }

  // For exam pages, render ONLY children (no nav, no presence tracking on exam pages)
  if (isExamPage) {
    return <>{children}</>
  }

  // For all other student pages, render with nav and presence tracking
  return (
    <>
      {/* ✅ Real-time presence tracking - broadcasts online status to admin */}
      {userId && <StudentPresence userId={userId} />}
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