// app/staff/layout.tsx - NO HAMBURGER, PROPER SPACING - FULLY FIXED
'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, Bell, LogOut, User, ChevronDown, 
  MonitorPlay, FileText, BookOpen, Users, GraduationCap,
  Calculator, FileCheck, Calendar, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================
// TYPES & INTERFACES
// ============================================
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
  title?: string
}

interface StaffStats {
  totalExams: number
  publishedExams: number
  pendingExams: number
  draftExams: number
  totalStudents?: number
  totalClasses?: number
  totalAssignments?: number
  totalNotes?: number
  pendingGrading?: number
  averagePerformance?: number
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

// ============================================
// DEFAULT VALUES
// ============================================
const defaultStats: StaffStats = {
  totalExams: 0,
  publishedExams: 0,
  pendingExams: 0,
  draftExams: 0,
  totalStudents: 0,
  totalClasses: 0,
  totalAssignments: 0,
  totalNotes: 0,
  pendingGrading: 0,
  averagePerformance: 0,
}

// ============================================
// CONTEXT
// ============================================
const StaffContext = createContext<StaffContextType | null>(null)

export const useStaffContext = () => {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaffContext must be used within StaffLayout')
  }
  return context
}

// ============================================
// LOADING COMPONENT
// ============================================
function StaffLoadingState() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <div className="relative">
            <Briefcase className="h-16 w-16 text-emerald-600" />
            <motion.div
              className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-slate-700 dark:text-slate-300 text-lg font-medium"
        >
          Loading Staff Dashboard
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-slate-500 dark:text-slate-400 text-sm"
        >
          Preparing your teaching workspace
        </motion.p>
        <div className="flex justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-emerald-400"
              animate={{ y: [0, -12, 0] }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DESKTOP TOP BAR COMPONENT
// ============================================
function DesktopTopBar({ 
  profile, 
  activeTab, 
  handleLogout 
}: { 
  profile: StaffProfile | null
  activeTab: string
  handleLogout: () => Promise<void>
}) {
  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      'overview': 'Dashboard Overview',
      'exams': 'Exams Management',
      'assignments': 'Assignments',
      'notes': 'Lesson Notes',
      'attendance': 'Attendance',
      'students': 'Students',
      'schedule': 'Schedule',
      'profile': 'My Profile',
      'report-cards': 'Report Cards',
      'ca-scores': 'CA Scores',
      'results': 'Results',
    }
    return titles[tab] || tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="h-16 lg:h-20 border-b bg-white dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 flex items-center px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {getPageTitle(activeTab)}
            </h1>
            {profile?.department && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {profile.department} Department
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 lg:gap-3 h-9 px-2 lg:px-3">
                <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                  <AvatarImage src={profile?.photo_url || profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs lg:text-sm">
                    {getInitials(profile?.full_name || profile?.first_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'Staff Member'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile?.email || ''}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {}} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// ============================================
// MOBILE TOP BAR COMPONENT
// ============================================
function MobileTopBar({ 
  profile, 
  activeTab 
}: { 
  profile: StaffProfile | null
  activeTab: string
}) {
  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      'overview': 'Dashboard',
      'exams': 'Exams',
      'assignments': 'Assignments',
      'notes': 'Notes',
      'attendance': 'Attendance',
      'students': 'Students',
      'schedule': 'Schedule',
      'profile': 'Profile',
      'report-cards': 'Reports',
      'ca-scores': 'CA Scores',
      'results': 'Results',
    }
    return titles[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] lg:hidden bg-white dark:bg-slate-900 border-b z-40 flex items-center px-4">
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
          <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {getPageTitle(activeTab)}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {profile?.full_name || 'Staff Portal'}
          </p>
        </div>
      </div>
    </header>
  )
}

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================
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
  const [activeTab, setActiveTab] = useState('overview')
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration management
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

  // Active tab management
  useEffect(() => {
    const tabMap: Record<string, string> = {
      '/staff': 'overview',
    }
    
    // Dynamic path matching
    const paths = ['exams', 'assignments', 'notes', 'attendance', 'students', 
                   'schedule', 'profile', 'report-cards', 'ca-scores', 'results']
    
    let matched = false
    for (const path of paths) {
      if (pathname?.startsWith(`/staff/${path}`)) {
        setActiveTab(path)
        matched = true
        break
      }
    }
    
    if (!matched) {
      setActiveTab('overview')
    }
  }, [pathname])

  // Load staff data
  const loadStaffData = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        console.log('No session found, redirecting to login')
        router.replace('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        throw profileError
      }

      if (!profileData) {
        toast.error('Profile not found')
        router.replace('/login')
        return
      }

      const allowedRoles = ['staff', 'admin', 'teacher']
      if (!allowedRoles.includes(profileData.role?.toLowerCase())) {
        toast.error('Access denied. Staff only area.')
        router.replace('/portal')
        return
      }

      setProfile(profileData as StaffProfile)

      // Load exam stats
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('status, id')
        .eq('created_by', session.user.id)

      if (examsError) {
        console.error('Exams error:', examsError)
      }

      const exams = examsData || []
      const examStats = {
        totalExams: exams.length,
        publishedExams: exams.filter(e => e.status === 'published').length,
        pendingExams: exams.filter(e => e.status === 'pending').length,
        draftExams: exams.filter(e => e.status === 'draft').length,
      }

      // Load student count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      if (studentsError) {
        console.error('Students count error:', studentsError)
      }

      // Load assignments count
      const { count: assignmentsCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', session.user.id)

      // Load notes count
      const { count: notesCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', session.user.id)

      // Load pending grading count
      const { count: pendingGradingCount } = await supabase
        .from('ca_scores')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', session.user.id)
        .eq('status', 'pending')

      setStats({
        ...examStats,
        totalStudents: studentsCount || 0,
        totalClasses: 6,
        totalAssignments: assignmentsCount || 0,
        totalNotes: notesCount || 0,
        pendingGrading: pendingGradingCount || 0,
        averagePerformance: 75, // Default or calculate from actual data
      })

    } catch (error) {
      console.error('Error loading staff data:', error)
      toast.error('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Initial data load
  useEffect(() => {
    loadStaffData()
  }, [loadStaffData])

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login')
      } else if (event === 'SIGNED_IN' && session) {
        loadStaffData()
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed, no action needed
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadStaffData, router])

  const refreshData = async () => {
    setLoading(true)
    await loadStaffData()
    toast.success('Dashboard data refreshed')
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.replace('/portal')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  // Don't render until hydrated
  if (!isHydrated && loading) {
    return <StaffLoadingState />
  }

  if (loading) {
    return <StaffLoadingState />
  }

  // Calculate dynamic margins for desktop
  const desktopMarginLeft = sidebarCollapsed ? '80px' : '280px'

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* ============================================ */}
        {/* DESKTOP LAYOUT */}
        {/* ============================================ */}
        <div className="hidden lg:block">
          {/* Sidebar */}
          <StaffSidebar 
            profile={profile}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(prev => !prev)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Main Content Area */}
          <div 
            className="min-h-screen transition-all duration-300 ease-in-out"
            style={{ marginLeft: desktopMarginLeft }}
          >
            {/* Desktop Top Bar */}
            <DesktopTopBar 
              profile={profile}
              activeTab={activeTab}
              handleLogout={handleLogout}
            />

            {/* Page Content */}
            <main className="p-4 lg:p-6 xl:p-8">
              <div className="max-w-[1600px] mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
        </div>

        {/* ============================================ */}
        {/* MOBILE LAYOUT */}
        {/* ============================================ */}
        <div className="lg:hidden">
          {/* Mobile Top Bar */}
          <MobileTopBar 
            profile={profile}
            activeTab={activeTab}
          />

          {/* Page Content */}
          <main className="pt-[60px] pb-24">
            <div className="px-3 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav 
            role="staff"
            activeTab={activeTab}
            onTabChange={(tab: string) => {
              setActiveTab(tab)
              const pathMap: Record<string, string> = {
                'overview': '/staff',
                'exams': '/staff/exams',
                'assignments': '/staff/assignments',
                'notes': '/staff/notes',
                'students': '/staff/students',
                'ca-scores': '/staff/ca-scores',
                'report-cards': '/staff/report-cards',
              }
              const path = pathMap[tab]
              if (path) {
                router.push(path)
              }
            }}
            profile={profile ? {
              full_name: profile.full_name,
              email: profile.email,
              photo_url: profile.photo_url || profile.avatar_url,
            } : null}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </StaffContext.Provider>
  )
}