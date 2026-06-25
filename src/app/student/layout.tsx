// app/student/layout.tsx
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
}

// Tab ↔ path mapping — single source of truth
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
  // Exact match first
  if (PATH_TO_TAB[pathname]) return PATH_TO_TAB[pathname]
  // Prefix match
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

  // Load profile
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

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, first_name, email, photo_url, class, department, vin_id')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('[StudentLayout] Profile error:', profileError)
        // Profile missing — might be first login, show empty state
        toast.error('Failed to load profile. Please try again.')
        return
      }

      // Verify they're actually a student
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

  // Listen for auth changes (session expiry, logout from another tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Clear local storage auth data
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_role')
        localStorage.removeItem('user_profile')
        router.replace('/portal')
      }
      if (event === 'TOKEN_REFRESHED') {
        console.log('[StudentLayout] Token refreshed')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = useCallback(async () => {
    try {
      // Mark offline in presence
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

      // Clear all local auth data
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('user_profile')
      sessionStorage.removeItem('login_attempts')

      await supabase.auth.signOut({ scope: 'local' })
      toast.success('Logged out successfully')
      router.replace('/portal')
    } catch (err) {
      console.error('[StudentLayout] Logout error:', err)
      // Force redirect anyway
      router.replace('/portal')
    }
  }, [userId, router])

  const handleTabChange = useCallback((tab: string) => {
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
  }, [router])

  if (loading) {
    return <StudentLoading profile={profile} onLogout={handleLogout} />
  }

  // Exam pages — no nav, no presence, full focus mode
  if (isExamPage) {
    return (
      <ErrorBoundary variant="student">
        {children}
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary variant="student">
      {userId && <StudentPresence userId={userId} />}
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