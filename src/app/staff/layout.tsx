// app/staff/layout.tsx - HYDRATION-SAFE LOADER
'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { toast } from 'sonner'
import { Briefcase, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StaffProfile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
  avatar_url?: string
  photo_url?: string | null
  department?: string
}

interface StaffStats {
  totalExams: number
  publishedExams: number
  pendingExams: number
  draftExams: number
  totalStudents?: number
  totalClasses?: number
}

interface StaffContextType {
  profile: StaffProfile | null
  stats: StaffStats
  refreshData: () => Promise<void>
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  handleLogout: () => Promise<void>
  activeTab: string
  setActiveTab: (tab: string) => void
}

const defaultStats: StaffStats = {
  totalExams: 0,
  publishedExams: 0,
  pendingExams: 0,
  draftExams: 0,
  totalStudents: 0,
  totalClasses: 0,
}

const StaffContext = createContext<StaffContextType | null>(null)

export const useStaffContext = () => {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaffContext must be used within StaffLayout')
  }
  return context
}

// Simple loading component without framer-motion to avoid hydration issues
function StaffLoadingState() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        <div className="inline-block">
          <Briefcase className="h-16 w-16 text-emerald-600 animate-spin-slow" />
        </div>
        <div className="mt-4 text-slate-600 dark:text-slate-400 text-lg font-medium">
          Loading Staff Dashboard
        </div>
        <div className="mt-2 text-slate-500 dark:text-slate-500 text-sm">
          Preparing your teaching workspace
        </div>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [stats, setStats] = useState<StaffStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsHydrated(true)
    const saved = localStorage.getItem('staff-sidebar-collapsed')
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('staff-sidebar-collapsed', String(sidebarCollapsed))
    }
  }, [sidebarCollapsed, isHydrated])

  useEffect(() => {
    if (pathname === '/staff') {
      setActiveTab('overview')
    } else if (pathname?.startsWith('/staff/exams')) {
      setActiveTab('exams')
    } else if (pathname?.startsWith('/staff/assignments')) {
      setActiveTab('assignments')
    } else if (pathname?.startsWith('/staff/notes')) {
      setActiveTab('notes')
    } else if (pathname?.startsWith('/staff/attendance')) {
      setActiveTab('attendance')
    } else if (pathname?.startsWith('/staff/students')) {
      setActiveTab('students')
    } else if (pathname?.startsWith('/staff/schedule')) {
      setActiveTab('schedule')
    } else if (pathname?.startsWith('/staff/profile')) {
      setActiveTab('profile')
    } else if (pathname?.startsWith('/staff/report-cards')) {
      setActiveTab('report-cards')
    } else if (pathname?.startsWith('/staff/ca-scores')) {
      setActiveTab('ca-scores')
    } else if (pathname?.startsWith('/staff/results')) {
      setActiveTab('results')
    }
  }, [pathname])

  const loadStaffData = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError

      if (profileData?.role !== 'staff' && profileData?.role !== 'admin' && profileData?.role !== 'teacher') {
        toast.error('Access denied. Staff only area.')
        router.push('/dashboard')
        return
      }

      setProfile(profileData as StaffProfile)

      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('status')
        .eq('created_by', session.user.id)

      if (examsError) throw examsError

      const examStats = {
        totalExams: examsData?.length || 0,
        publishedExams: examsData?.filter(e => e.status === 'published').length || 0,
        pendingExams: examsData?.filter(e => e.status === 'pending').length || 0,
        draftExams: examsData?.filter(e => e.status === 'draft').length || 0,
      }

      const { count: studentsCount } = await supabase
        .from('student_profiles')
        .select('*', { count: 'exact', head: true })

      setStats({
        ...examStats,
        totalStudents: studentsCount || 0,
        totalClasses: 6,
      })

    } catch (error) {
      console.error('Error loading staff data:', error)
      toast.error('Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadStaffData()
  }, [loadStaffData])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        loadStaffData()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadStaffData, router])

  const refreshData = async () => {
    await loadStaffData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  // Format profile for MobileBottomNav
  const navProfile = profile ? {
    full_name: profile.full_name,
    email: profile.email,
    photo_url: profile.photo_url || profile.avatar_url,
  } : null

  // Show loading state only after mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <Briefcase className="h-16 w-16 text-emerald-600 mx-auto animate-pulse" />
        </div>
      </div>
    )
  }

  if (loading) {
    return <StaffLoadingState />
  }

  return (
    <StaffContext.Provider value={{ 
      profile, 
      stats, 
      refreshData, 
      sidebarCollapsed, 
      setSidebarCollapsed,
      handleLogout,
      activeTab,
      setActiveTab
    }}>
      {/* Mobile menu button - only visible on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-lg rounded-full h-10 w-10"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile sidebar drawer overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={false}
          onToggle={() => {}}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setMobileMenuOpen(false)
          }}
        />
      </div>

      {/* DESKTOP LAYOUT - Fixed sidebar on left */}
      <div className="hidden lg:block">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* DESKTOP MAIN CONTENT - Minimal spacing */}
      <div className="hidden lg:block min-h-screen bg-slate-50 dark:bg-slate-950" style={{ marginLeft: sidebarCollapsed ? '80px' : '288px' }}>
        <main className="min-h-screen">
          <div>
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE MAIN CONTENT - Full width, with bottom padding for bottom nav */}
      <div className="lg:hidden min-h-screen bg-slate-50 dark:bg-slate-950">
        <main className="min-h-screen">
          <div className="pt-2 pb-20 px-3">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <div className="lg:hidden">
        <MobileBottomNav 
          role="staff"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profile={navProfile}
          onLogout={handleLogout}
        />
      </div>
    </StaffContext.Provider>
  )
}