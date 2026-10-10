// app/student/layout.tsx - NAVIGATION ENFORCEMENT & BLOCKS FOR INACTIVE PROFILES
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { StudentPresence } from '@/components/student/StudentPresence'
import StudentLoading from '@/components/student/StudentLoading'
import { ErrorBoundary } from '@/components/error-boundary'
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
  is_active?: boolean // 👈 Added
}

// Tab ↔ path mapping
const PATH_TO_TAB: Record<string, string> = {
  '/student': 'overview',
  '/student/announcements': 'announcements',
  '/student/exams': 'exams',
  '/student/results': 'results',
  '/student/profile': 'profile',
  '/student/assignments': 'assignments',
  '/student/attendance': 'attendance',
  '/student/courses': 'courses',
  '/student/performance': 'performance',
  '/student/notifications': 'notifications',
  '/student/settings': 'settings',
  '/student/report-card': 'report-card',
}

function getTabFromPath(pathname: string): string {
  if (PATH_TO_TAB[pathname]) return PATH_TO_TAB[pathname]
  for (const [path, tab] of Object.entries(PATH_TO_TAB)) {
    if (path !== '/student' && pathname.startsWith(path)) return tab
  }
  return 'overview'
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(pathname || '/student'))

  const isExamPage = pathname?.startsWith('/student/exam/')

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(getTabFromPath(pathname || '/student'))
  }, [pathname])

  // Load profile with active status check
  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[StudentLayout] Session error:', sessionError)
        router.replace('/portal')
        return
      }

      if (!session?.user) {
        router.replace('/portal')
        return
      }

      setUserId(session.user.id)

      // Fetch profile and include is_active state
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, first_name, email, photo_url, class, department, vin_id, is_active')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('[StudentLayout] Profile error:', profileError)
        toast.error('Failed to load profile. Please try again.')
        return
      }

      // Verify they are a student
      const { data: roleData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (roleData?.role && !['student'].includes(roleData.role.toLowerCase())) {
        toast.error('Access denied. This portal is for students only.')
        await supabase.auth.signOut()
        router.replace('/portal')
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('[StudentLayout] Unexpected error:', error)
      toast.error('Something went wrong. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // 🚫 CRITICAL ENFORCEMENT: Block inactive students from live system pages
  useEffect(() => {
    if (profile && profile.is_active === false) {
      const allowedTabs = ['overview', 'results', 'profile']
      const currentTab = getTabFromPath(pathname || '/student')

      if (!allowedTabs.includes(currentTab)) {
        toast.error('This section is disabled for archived student accounts.')
        router.replace('/student')
      }
    }
  }, [pathname, profile, router])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_role')
        localStorage.removeItem('user_profile')
        router.replace('/portal')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = useCallback(async () => {
    try {
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
        } catch {
          // Non-fatal
        }
      }

      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('user_profile')
      sessionStorage.removeItem('login_attempts')

      await supabase.auth.signOut({ scope: 'local' })
      toast.success('Logged out successfully')
      router.replace('/portal')
    } catch (err) {
      console.error('[StudentLayout] Logout error:', err)
      router.replace('/portal')
    }
  }, [userId, router])

  const handleTabChange = useCallback((tab: string) => {
    // Block inactive tab changes manually
    if (profile && profile.is_active === false) {
      const allowedTabs = ['overview', 'results', 'profile']
      if (!allowedTabs.includes(tab)) {
        toast.error('This action is disabled for archived accounts.')
        return
      }
    }

    setActiveTab(tab)
    const pathMap: Record<string, string> = {
      overview: '/student',
      announcements: '/student/announcements',
      exams: '/student/exams',
      results: '/student/results',
      profile: '/student/profile',
      assignments: '/student/assignments',
      attendance: '/student/attendance',
      courses: '/student/courses',
      performance: '/student/performance',
      notifications: '/student/notifications',
      settings: '/student/settings',
      'report-card': '/student/report-card',
    }
    const path = pathMap[tab]
    if (path) router.push(path)
  }, [router, profile])

  if (loading) {
    return <StudentLoading profile={profile} onLogout={handleLogout} />
  }

  if (isExamPage) {
    // Prevent inactive students from launching the Exam CBT module
    if (profile && profile.is_active === false) {
      router.replace('/student')
      return null
    }

    return (
      <ErrorBoundary variant="student">
        {children}
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary variant="student">
      {userId && profile?.is_active !== false && <StudentPresence userId={userId} />}
      {children}
      <MobileBottomNav
        role="student"
        activeTab={activeTab}
        onTabChange={handleTabChange}
        profile={profile
          ? {
              full_name: profile.full_name,
              email: profile.email,
              photo_url: profile.photo_url,
            }
          : null
        }
        onLogout={handleLogout}
      />
    </ErrorBoundary>
  )
}