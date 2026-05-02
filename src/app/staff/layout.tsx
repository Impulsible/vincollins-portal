// app/staff/layout.tsx - FIXED - NO type=eq.theory ERROR
'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { NotificationDropdown } from '@/components/staff/NotificationDropdown'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, LogOut, User, ChevronDown, GraduationCap, Settings,
  Bell
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
// TYPES
// ============================================
interface StaffProfile {
  id: string; full_name?: string; first_name?: string; last_name?: string
  email?: string; role?: string; avatar_url?: string; photo_url?: string | null
  department?: string; title?: string
}

interface StaffStats {
  totalExams: number; publishedExams: number; pendingExams: number; draftExams: number
  totalStudents?: number; totalClasses?: number; totalAssignments?: number
  totalNotes?: number; pendingGrading?: number; averagePerformance?: number
  pendingTheoryCount?: number
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
  totalExams: 0, publishedExams: 0, pendingExams: 0, draftExams: 0,
  totalStudents: 0, totalClasses: 0, totalAssignments: 0, totalNotes: 0,
  pendingGrading: 0, averagePerformance: 0, pendingTheoryCount: 0
}

const StaffContext = createContext<StaffContextType | null>(null)

export const useStaffContext = () => {
  const context = useContext(StaffContext)
  if (!context) throw new Error('useStaffContext must be used within StaffLayout')
  return context
}

// ============================================
// LOADING
// ============================================
function StaffLoadingState() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="inline-block">
          <Briefcase className="h-16 w-16 text-emerald-600" />
        </motion.div>
        <p className="mt-6 text-slate-700 text-lg font-medium">Loading Staff Dashboard</p>
        <p className="mt-2 text-slate-500 text-sm">Preparing your teaching workspace</p>
        <div className="flex justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="h-2.5 w-2.5 rounded-full bg-emerald-400"
              animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DESKTOP TOP BAR
// ============================================
function DesktopTopBar({ profile, activeTab, handleLogout }: { profile: StaffProfile | null; activeTab: string; handleLogout: () => Promise<void> }) {
  const router = useRouter()
  
  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      'overview': 'Dashboard Overview', 'exams': 'Exams Management', 'assignments': 'Assignments',
      'notes': 'Lesson Notes', 'students': 'Students', 'report-cards': 'Report Cards',
      'ca-scores': 'CA Scores', 'results': 'Results', 'notifications': 'Notifications',
    }
    return titles[tab] || tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="h-16 lg:h-20 border-b bg-white flex items-center px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-semibold text-slate-900 truncate">{getPageTitle(activeTab)}</h1>
            {profile?.department && <p className="text-xs text-muted-foreground truncate hidden sm:block">{profile.department} Department</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {profile?.id && <NotificationDropdown userId={profile.id} />}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 lg:gap-3 h-9 px-2 lg:px-3">
                <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                  <AvatarImage src={profile?.photo_url || profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs lg:text-sm">
                    {getInitials(profile?.full_name || profile?.first_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || 'Staff Member'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile?.email || ''}</p>
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
              <DropdownMenuItem onClick={() => router.push('/staff/notifications')} className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />Notifications
              </DropdownMenuItem>
              <DropdownMenuItem><User className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// ============================================
// MOBILE TOP BAR
// ============================================
function MobileTopBar({ profile, activeTab }: { profile: StaffProfile | null; activeTab: string }) {
  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      'overview': 'Dashboard', 'exams': 'Exams', 'assignments': 'Assignments',
      'notes': 'Notes', 'students': 'Students', 'report-cards': 'Reports',
      'ca-scores': 'CA Scores', 'results': 'Results', 'notifications': 'Notifications',
    }
    return titles[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] lg:hidden bg-white border-b z-40 flex items-center px-4">
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 shrink-0">
          <Briefcase className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm text-slate-900">{getPageTitle(activeTab)}</h1>
          <p className="text-[11px] text-muted-foreground truncate">{profile?.full_name || 'Staff Portal'}</p>
        </div>
      </div>
    </header>
  )
}

// ============================================
// MAIN LAYOUT
// ============================================
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [stats, setStats] = useState<StaffStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    const saved = localStorage.getItem('staff-sidebar-collapsed')
    if (saved !== null) setSidebarCollapsed(saved === 'true')
  }, [])

  useEffect(() => {
    if (isHydrated) localStorage.setItem('staff-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed, isHydrated])

  useEffect(() => {
    const paths = ['exams', 'assignments', 'notes', 'students', 'report-cards', 'ca-scores', 'results', 'notifications']
    let matched = false
    for (const path of paths) {
      if (pathname?.startsWith(`/staff/${path}`)) { setActiveTab(path); matched = true; break }
    }
    if (!matched && pathname === '/staff') setActiveTab('overview')
  }, [pathname])

  const loadStaffData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/portal'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!profileData) { toast.error('Profile not found'); router.replace('/portal'); return }

      const allowedRoles = ['staff', 'admin', 'teacher']
      if (!allowedRoles.includes(profileData.role?.toLowerCase())) {
        toast.error('Access denied'); router.replace('/portal'); return
      }

      setProfile(profileData as StaffProfile)

      const { data: examsData } = await supabase.from('exams').select('status, id').eq('created_by', session.user.id)
      const exams = examsData || []

      let studentsCount = 0
      try { const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'); studentsCount = count || 0 } catch {}

      let assignmentsCount = 0
      try { const { count } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('created_by', session.user.id); assignmentsCount = count || 0 } catch {}

      let notesCount = 0
      try { const { count } = await supabase.from('notes').select('*', { count: 'exact', head: true }); notesCount = count || 0 } catch {}

      let pendingGradingCount = 0
      try { const { count } = await supabase.from('ca_scores').select('*', { count: 'exact', head: true }).eq('teacher_id', session.user.id); pendingGradingCount = count || 0 } catch {}

      // FIXED: Count pending theory from exam_attempts, NOT exams
      let pendingTheoryCount = 0
      try { 
        const { count } = await supabase.from('exam_attempts').select('*', { count: 'exact', head: true })
          .eq('status', 'pending_theory')
        pendingTheoryCount = count || 0 
      } catch {}

      setStats({
        totalExams: exams.length,
        publishedExams: exams.filter(e => e.status === 'published').length,
        pendingExams: exams.filter(e => e.status === 'pending').length,
        draftExams: exams.filter(e => e.status === 'draft').length,
        totalStudents: studentsCount,
        totalClasses: 6,
        totalAssignments: assignmentsCount,
        totalNotes: notesCount,
        pendingGrading: pendingGradingCount,
        averagePerformance: 75,
        pendingTheoryCount: pendingTheoryCount
      })
    } catch (error) { console.error('Error loading staff data:', error) }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { loadStaffData() }, [loadStaffData])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/portal')
    })
    return () => { subscription?.unsubscribe() }
  }, [router])

  const refreshData = async () => { setLoading(true); await loadStaffData(); toast.success('Dashboard data refreshed') }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.replace('/portal')
  }

  if (!isHydrated && loading) return <StaffLoadingState />
  if (loading) return <StaffLoadingState />

  const desktopMarginLeft = sidebarCollapsed ? '80px' : '280px'

  return (
    <StaffContext.Provider value={{ profile, stats, refreshData, sidebarCollapsed, setSidebarCollapsed, handleLogout, activeTab, setActiveTab }}>
      <div className="min-h-screen bg-slate-50">
        <div className="hidden lg:block">
          <StaffSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="min-h-screen transition-all duration-300 ease-in-out" style={{ marginLeft: desktopMarginLeft }}>
            <DesktopTopBar profile={profile} activeTab={activeTab} handleLogout={handleLogout} />
            <main className="p-4 lg:p-6 xl:p-8">
              <div className="max-w-[1600px] mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
        </div>

        <div className="lg:hidden">
          <MobileTopBar profile={profile} activeTab={activeTab} />
          <main className="pt-[60px] pb-24">
            <div className="px-3 py-4">
              <AnimatePresence mode="wait">
                <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <MobileBottomNav 
            role="staff" activeTab={activeTab}
            onTabChange={(tab: string) => {
              setActiveTab(tab)
              const pathMap: Record<string, string> = {
                'overview': '/staff', 'exams': '/staff/exams', 'assignments': '/staff/assignments',
                'notes': '/staff/notes', 'students': '/staff/students',
                'ca-scores': '/staff/ca-scores', 'report-cards': '/staff/report-cards',
                'notifications': '/staff/notifications',
              }
              const path = pathMap[tab]
              if (path) router.push(path)
            }}
            profile={profile ? { full_name: profile.full_name, email: profile.email, photo_url: profile.photo_url || profile.avatar_url } : null}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </StaffContext.Provider>
  )
}