// app/staff/layout.tsx
'use client'

import {
  useState, useEffect, createContext,
  useContext, useCallback, useRef,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { NotificationDropdown } from '@/components/staff/NotificationDropdown'
import { ErrorBoundary } from '@/components/error-boundary'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, LogOut, User, ChevronDown, GraduationCap,
  Settings, Bell, Megaphone, RefreshCw,
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
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
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
  pendingTheoryCount: 0,
}

// ── Tab ↔ Path mapping ────────────────────────────────────────────────────────
const STAFF_PATHS: Record<string, string> = {
  overview: '/staff',
  exams: '/staff/exams',
  assignments: '/staff/assignments',
  notes: '/staff/notes',
  students: '/staff/students',
  'ca-scores': '/staff/ca-scores',
  'report-cards': '/staff/report-cards',
  results: '/staff/results',
  notifications: '/staff/notifications',
  announcements: '/staff/announcements',
}

const DESKTOP_TITLES: Record<string, string> = {
  overview: 'Dashboard Overview',
  exams: 'Exams Management',
  assignments: 'Assignments',
  notes: 'Lesson Notes',
  students: 'Students',
  'report-cards': 'Report Cards',
  'ca-scores': 'CA Scores',
  results: 'Results',
  notifications: 'Notifications',
  announcements: 'Announcements',
}

const MOBILE_TITLES: Record<string, string> = {
  overview: 'Dashboard',
  exams: 'Exams',
  assignments: 'Assignments',
  notes: 'Notes',
  students: 'Students',
  'report-cards': 'Reports',
  'ca-scores': 'CA Scores',
  results: 'Results',
  notifications: 'Notifications',
  announcements: 'Announcements',
}

function getTabFromPathname(pathname: string): string {
  if (pathname === '/staff') return 'overview'
  for (const [tab, path] of Object.entries(STAFF_PATHS)) {
    if (tab !== 'overview' && pathname.startsWith(path)) return tab
  }
  return 'overview'
}

// ── Context ───────────────────────────────────────────────────────────────────
const StaffContext = createContext<StaffContextType | null>(null)

export const useStaffContext = () => {
  const ctx = useContext(StaffContext)
  if (!ctx) throw new Error('useStaffContext must be used within StaffLayout')
  return ctx
}

// ── Loading State ─────────────────────────────────────────────────────────────
function StaffLoadingState() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <Briefcase className="h-16 w-16 text-emerald-600" />
        </motion.div>
        <p className="mt-6 text-slate-700 text-lg font-medium">
          Loading Staff Dashboard
        </p>
        <p className="mt-2 text-slate-500 text-sm">
          Preparing your teaching workspace
        </p>
        <div className="flex justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-emerald-400"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Desktop Top Bar ───────────────────────────────────────────────────────────
function DesktopTopBar({
  profile,
  activeTab,
  onLogout,
  onRefresh,
  isRefreshing,
}: {
  profile: StaffProfile | null
  activeTab: string
  onLogout: () => Promise<void>
  onRefresh: () => Promise<void>
  isRefreshing: boolean
}) {
  const router = useRouter()

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="h-16 lg:h-20 border-b bg-white flex items-center px-4 lg:px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Page title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 flex-shrink-0">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-semibold text-slate-900 truncate">
              {DESKTOP_TITLES[activeTab] ??
                activeTab.charAt(0).toUpperCase() +
                  activeTab.slice(1).replace('-', ' ')}
            </h1>
            {profile?.department && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {profile.department} Department
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard data"
            className={cn(
              'hidden sm:flex items-center justify-center',
              'h-9 w-9 rounded-lg border border-gray-200',
              'text-gray-500 hover:text-emerald-600 hover:border-emerald-300',
              'hover:bg-emerald-50 transition-all',
              isRefreshing && 'opacity-50 cursor-not-allowed',
            )}
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </button>

          {/* Notifications */}
          {profile?.id && <NotificationDropdown userId={profile.id} />}

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 lg:gap-3 h-9 px-2 lg:px-3"
              >
                <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                  <AvatarImage
                    src={profile?.photo_url || profile?.avatar_url || undefined}
                  />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs lg:text-sm">
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
                  <p className="text-xs text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/staff/announcements')}
                className="cursor-pointer"
              >
                <Megaphone className="mr-2 h-4 w-4" />
                Announcements
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/staff/notifications')}
                className="cursor-pointer"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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

// ── Mobile Top Bar ────────────────────────────────────────────────────────────
function MobileTopBar({
  profile,
  activeTab,
  onRefresh,
  isRefreshing,
}: {
  profile: StaffProfile | null
  activeTab: string
  onRefresh: () => Promise<void>
  isRefreshing: boolean
}) {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] lg:hidden bg-white border-b z-40 flex items-center px-4 shadow-sm">
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 flex-shrink-0">
          <Briefcase className="h-4 w-4 text-emerald-600" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm text-slate-900">
            {MOBILE_TITLES[activeTab] ??
              activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {profile?.full_name || 'Staff Portal'}
          </p>
        </div>

        {/* Mobile refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'flex items-center justify-center h-8 w-8 rounded-lg',
            'text-gray-500 hover:text-emerald-600',
            'hover:bg-emerald-50 transition-all',
            isRefreshing && 'opacity-50',
          )}
        >
          <RefreshCw
            className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
          />
        </button>
      </div>
    </header>
  )
}

// ── Fetch stats helper ────────────────────────────────────────────────────────
async function fetchStaffStats(userId: string): Promise<StaffStats> {
  const [
    examsRes,
    studentsRes,
    assignmentsRes,
    notesRes,
    gradingRes,
    theoryRes,
  ] = await Promise.allSettled([
    supabase.from('exams').select('status, id').eq('created_by', userId),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student'),
    supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId),
    supabase
      .from('notes')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('ca_scores')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', userId),
    supabase
      .from('exam_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_theory'),
  ])

  const exams =
    examsRes.status === 'fulfilled' ? examsRes.value.data ?? [] : []
  const studentsCount =
    studentsRes.status === 'fulfilled' ? studentsRes.value.count ?? 0 : 0
  const assignmentsCount =
    assignmentsRes.status === 'fulfilled'
      ? assignmentsRes.value.count ?? 0
      : 0
  const notesCount =
    notesRes.status === 'fulfilled' ? notesRes.value.count ?? 0 : 0
  const pendingGradingCount =
    gradingRes.status === 'fulfilled' ? gradingRes.value.count ?? 0 : 0
  const pendingTheoryCount =
    theoryRes.status === 'fulfilled' ? theoryRes.value.count ?? 0 : 0

  return {
    totalExams: exams.length,
    publishedExams: exams.filter((e) => e.status === 'published').length,
    pendingExams: exams.filter((e) => e.status === 'pending').length,
    draftExams: exams.filter((e) => e.status === 'draft').length,
    totalStudents: studentsCount,
    totalClasses: 6,
    totalAssignments: assignmentsCount,
    totalNotes: notesCount,
    pendingGrading: pendingGradingCount,
    averagePerformance: 75,
    pendingTheoryCount,
  }
}

// ── Main Layout ───────────────────────────────────────────────────────────────
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState(() =>
    getTabFromPathname(pathname || '/staff'),
  )
  const [isHydrated, setIsHydrated] = useState(false)

  // Track if we've already loaded to avoid double-fetching
  const hasLoadedRef = useRef(false)

  // ── Hydration: restore sidebar preference ──────────────────────────────────
  useEffect(() => {
    setIsHydrated(true)
    try {
      const saved = localStorage.getItem('staff-sidebar-collapsed')
      if (saved !== null) setSidebarCollapsed(saved === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem('staff-sidebar-collapsed', String(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed, isHydrated])

  // ── Sync active tab with URL ───────────────────────────────────────────────
  useEffect(() => {
    const tab = getTabFromPathname(pathname || '/staff')
    setActiveTab(tab)
  }, [pathname])

  // ── Load staff data ────────────────────────────────────────────────────────
  const loadStaffData = useCallback(
    async (showToast = false) => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.warn('[StaffLayout] No authenticated user')
          router.replace('/portal')
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          console.error('[StaffLayout] Profile error:', profileError)
          toast.error('Profile not found. Please contact your administrator.')
          router.replace('/portal')
          return
        }

        const allowedRoles = ['staff', 'admin', 'teacher']
        if (!allowedRoles.includes(profileData.role?.toLowerCase() ?? '')) {
          toast.error('Access denied. This portal is for staff only.')
          router.replace('/portal')
          return
        }

        setProfile(profileData as StaffProfile)

        // Fetch stats in parallel — non-fatal if individual queries fail
        const newStats = await fetchStaffStats(user.id)
        setStats(newStats)

        if (showToast) toast.success('Dashboard refreshed')
      } catch (err) {
        console.error('[StaffLayout] Unexpected error:', err)
        if (showToast) toast.error('Failed to refresh. Please try again.')
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    },
    [router],
  )

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadStaffData()
    }
  }, [loadStaffData])

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Clear all local auth data
        try {
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_role')
          localStorage.removeItem('user_profile')
          sessionStorage.removeItem('login_attempts')
        } catch {}
        router.replace('/portal')
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('[StaffLayout] Token refreshed silently')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    await loadStaffData(true)
  }, [loadStaffData])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('user_profile')
      sessionStorage.removeItem('login_attempts')

      await supabase.auth.signOut({ scope: 'local' })
      toast.success('Logged out successfully')
      router.replace('/portal')
    } catch (err) {
      console.error('[StaffLayout] Logout error:', err)
      // Force redirect anyway
      router.replace('/portal')
    }
  }, [router])

  // ── Tab change with navigation ─────────────────────────────────────────────
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab)
      const path = STAFF_PATHS[tab]
      if (path) router.push(path)
    },
    [router],
  )

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!isHydrated || loading) return <StaffLoadingState />

  const desktopMarginLeft = sidebarCollapsed ? '80px' : '280px'

  return (
    <StaffContext.Provider
      value={{
        profile,
        stats,
        refreshData,
        sidebarCollapsed,
        setSidebarCollapsed,
        handleLogout,
        activeTab,
        setActiveTab,
      }}
    >
      <div className="min-h-screen bg-slate-50">

        {/* ── DESKTOP ────────────────────────────────────────────────────── */}
        <div className="hidden lg:block">
          <StaffSidebar
            profile={profile}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />

          <div
            className="min-h-screen transition-all duration-300 ease-in-out"
            style={{ marginLeft: desktopMarginLeft }}
          >
            <DesktopTopBar
              profile={profile}
              activeTab={activeTab}
              onLogout={handleLogout}
              onRefresh={refreshData}
              isRefreshing={isRefreshing}
            />

            <main className="p-4 lg:p-6 xl:p-8">
              <div className="max-w-[1600px] mx-auto">
                <ErrorBoundary variant="staff">
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
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>

        {/* ── MOBILE ─────────────────────────────────────────────────────── */}
        <div className="lg:hidden">
          <MobileTopBar
            profile={profile}
            activeTab={activeTab}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />

          <main className="pt-[60px] pb-24">
            <div className="px-3 py-4">
              <ErrorBoundary variant="staff">
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
              </ErrorBoundary>
            </div>
          </main>

          <MobileBottomNav
            role="staff"
            activeTab={activeTab}
            onTabChange={handleTabChange}
            profile={
              profile
                ? {
                    full_name: profile.full_name,
                    email: profile.email,
                    photo_url: profile.photo_url || profile.avatar_url,
                  }
                : null
            }
            onLogout={handleLogout}
          />
        </div>
      </div>
    </StaffContext.Provider>
  )
}