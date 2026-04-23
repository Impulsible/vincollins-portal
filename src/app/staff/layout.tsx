// app/staff/layout.tsx - SIMPLE FIXED LAYOUT
'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Briefcase, GraduationCap, Menu, X } from 'lucide-react'

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

function StaffLayoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Briefcase className="h-16 w-16 text-emerald-600 mx-auto" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-slate-600 dark:text-slate-400 text-lg font-medium"
        >
          Loading Staff Portal...
        </motion.p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-slate-500 dark:text-slate-500 text-sm"
        >
          Preparing your teaching space ✨
        </motion.p>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-emerald-400"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
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

  if (loading) {
    return <StaffLayoutLoading />
  }

  if (!isHydrated) {
    return null
  }

  return (
    <StaffContext.Provider value={{ 
      profile, 
      stats, 
      refreshData, 
      sidebarCollapsed, 
      setSidebarCollapsed,
      handleLogout
    }}>
      {/* Mobile Header - Fixed at top */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-white">Staff Portal</span>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
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

        {/* Main Content Area */}
        <div className={`
          flex-1
          pt-14 lg:pt-0
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
        `}>
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </StaffContext.Provider>
  )
}