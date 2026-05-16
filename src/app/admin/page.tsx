// app/admin/page.tsx - FULLY OPTIMIZED + AUTH GUARD + NO TAB RELOAD
'use client'

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo, Component } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
import { instantLogout } from '@/lib/auth-utils'
import { WelcomeBanner } from '@/components/admin/dashboard/WelcomeBanner'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { RecentActivityFeed } from '@/components/admin/dashboard/RecentActivityFeed'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, Shield, ArrowRight, LayoutDashboard, MonitorPlay,
  Users, Briefcase, Menu, FileCheck, School,
  MessageSquare, CheckCircle2, XCircle, Clock, Bell, BookOpen,
  RefreshCw, AlertTriangle
} from 'lucide-react'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Student } from '@/components/admin/students/types'

// ========== LAZY LOAD HEAVY COMPONENTS ==========
const StudentManagement = dynamic(
  () => import('@/components/admin/students/StudentManagement').then(mod => ({ default: mod.StudentManagement })),
  { loading: () => <TabLoader /> }
)

const StaffManagement = dynamic(
  () => import('@/components/admin/staff/StaffManagement').then(mod => ({ default: mod.StaffManagement })),
  { loading: () => <TabLoader /> }
)

const ReportCardApproval = dynamic(
  () => import('@/components/admin/report-cards/ReportCardApproval').then(mod => ({ default: mod.ReportCardApproval })),
  { loading: () => <TabLoader /> }
)

const BroadSheetPage = dynamic(
  () => import('@/app/admin/broad-sheet/page'),
  { loading: () => <TabLoader /> }
)

const AdminInquiriesTab = dynamic(
  () => import('@/components/admin/inquiries/AdminInquiriesTab').then(mod => ({ default: mod.AdminInquiriesTab })),
  { loading: () => <TabLoader /> }
)

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )
}

// ========== ERROR BOUNDARY ==========
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
        <p className="mt-4 text-slate-600 text-lg font-medium">Something went wrong</p>
        <p className="text-sm text-slate-400 mt-2">{error.message}</p>
        <Button onClick={resetError} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    </div>
  )
}

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; resetError: () => void }> }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props
      return <Fallback error={this.state.error} resetError={this.resetError} />
    }
    return this.props.children
  }
}

// ========== TYPES ==========
interface PendingExam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  has_theory: boolean
  questions: Record<string, unknown>[]
  theory_questions: Record<string, unknown>[]
  instructions: string
  passing_percentage: number
  teacher_name: string
  department: string
  created_at: string
  created_by: string
}

interface Staff {
  id: string
  role: string
  full_name: string
  email: string
  photo_url?: string
  vin_id: string
  department: string
  phone: string
  address: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  title?: string
  date_joined?: string
}

interface Inquiry {
  id: string
  status: string
  [key: string]: unknown
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  teacher_name: string
  status: string
  duration?: number
  total_questions?: number
  total_marks?: number
  has_theory?: boolean
  questions?: Record<string, unknown>[]
  theory_questions?: Record<string, unknown>[]
  instructions?: string
  passing_percentage?: number
  pass_mark?: number
  department?: string
  created_at: string
  created_by: string
}

interface AdminData {
  students: Student[]
  staff: Staff[]
  pendingExams: PendingExam[]
  publishedExams: Exam[]
  inquiries: Inquiry[]
  pendingReports: number
  stats: {
    totalStudents: number
    totalStaff: number
    activeExams: number
    pendingSubmissions: number
  }
}

// ========== CONSTANTS ==========
const LOAD_TIMEOUT = 8000
const VISIBILITY_REFRESH_INTERVAL = 120000

const routeToTabMap: Record<string, string> = {
  '/admin': 'overview',
  '/admin/broad-sheet': 'broad-sheet',
  '/admin/students': 'students',
  '/admin/staff': 'staff',
  '/admin/exams': 'exams',
  '/admin/report-cards': 'report-cards',
  '/admin/inquiries': 'inquiries',
  '/admin/monitor': 'cbt-monitor',
}

const tabToRouteMap: Record<string, string> = {
  'overview': '/admin',
  'broad-sheet': '/admin/broad-sheet',
  'students': '/admin/students',
  'staff': '/admin/staff',
  'exams': '/admin/exams',
  'report-cards': '/admin/report-cards',
  'inquiries': '/admin/inquiries',
  'cbt-monitor': '/admin/monitor',
}

// ========== UTILITIES ==========
function formatFullName(name: string): string {
  if (!name) return ''
  return name.split(/[\s._-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

const getTabFromPathname = (pathname: string | null): string => {
  if (!pathname) return 'overview'
  if (routeToTabMap[pathname]) return routeToTabMap[pathname]
  for (const [route, tab] of Object.entries(routeToTabMap)) {
    if (pathname.startsWith(route + '/')) return tab
  }
  return 'overview'
}

function mapToStudent(p: Record<string, unknown>): Student {
  return {
    id: p.id as string, role: p.role as string, full_name: p.full_name as string,
    email: p.email as string, photo_url: p.photo_url as string | undefined,
    vin_id: (p.vin_id as string) || '', class: (p.class as string) || '',
    department: (p.department as string) || '', is_active: (p.is_active as boolean) ?? true,
    phone: (p.phone as string) || '', address: (p.address as string) || '',
    password_changed: (p.password_changed as boolean) ?? false,
    created_at: (p.created_at as string) || new Date().toISOString(),
  } as Student
}

function mapToStaff(p: Record<string, unknown>): Staff {
  return {
    id: p.id as string, role: p.role as string, full_name: p.full_name as string,
    email: p.email as string, photo_url: p.photo_url as string | undefined,
    vin_id: (p.vin_id as string) || '', department: (p.department as string) || '',
    phone: (p.phone as string) || '', address: (p.address as string) || '',
    is_active: (p.is_active as boolean) ?? true,
    password_changed: (p.password_changed as boolean) ?? false,
    created_at: (p.created_at as string) || new Date().toISOString(),
  }
}

// ========== MAIN COMPONENT ==========
function AdminDashboardContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { user: contextUser } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(() => getTabFromPathname(pathname))
  const [error, setError] = useState<Error | null>(null)
  
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [publishedExams, setPublishedExams] = useState<Exam[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)
  
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, activeExams: 0, pendingSubmissions: 0,
  })

  const loadAllDataRef = useRef<() => Promise<void>>()
  const abortControllerRef = useRef<AbortController>()
  const supabaseChannelRef = useRef<ReturnType<typeof supabase.channel>>()
  const lastVisibilityRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const mountedRef = useRef(true)

  // ✅ Set profile from UserContext
  useEffect(() => {
    if (contextUser) {
      setProfile({
        id: contextUser.id,
        full_name: contextUser.full_name || 'Administrator',
        email: contextUser.email || '',
        role: contextUser.role?.toLowerCase() || 'admin',
        photo_url: contextUser.photo_url || undefined
      })
    }
  }, [contextUser])

  // Sync tab with pathname
  useEffect(() => {
    const tabForCurrentRoute = getTabFromPathname(pathname)
    if (tabForCurrentRoute !== activeTab) setActiveTab(tabForCurrentRoute)
  }, [pathname, activeTab])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  // Load all data
  const loadAllData = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoadError(false)
    setError(null)

    try {
      const fetchPromises = [
        supabase.from('profiles').select('id, role, full_name, email, photo_url, vin_id, class, department, is_active, phone, address, password_changed, created_at').limit(500),
        supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('report_cards').select('id, status').eq('status', 'pending').limit(100)
      ]

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Data load timeout')), LOAD_TIMEOUT)
      )

      const results = await Promise.race([Promise.allSettled(fetchPromises), timeoutPromise])

      if (controller.signal.aborted || !mountedRef.current) return

      const [profilesResult, examsResult, inquiriesResult, reportsResult] = results as PromiseSettledResult<{
        data: unknown[] | null; error: PostgrestError | null
      }>[]

      if (profilesResult.status === 'fulfilled' && !profilesResult.value.error && profilesResult.value.data) {
        const profiles = profilesResult.value.data as Record<string, unknown>[]
        const studentProfiles: Student[] = profiles.filter(p => p.role === 'student').map(mapToStudent)
        const staffProfiles: Staff[] = profiles.filter(p => p.role === 'staff').map(mapToStaff)
        setStudents(studentProfiles)
        setStaff(staffProfiles)
        setStats(prev => ({ ...prev, totalStudents: studentProfiles.length, totalStaff: staffProfiles.length }))
      }

      if (examsResult.status === 'fulfilled' && !examsResult.value.error && examsResult.value.data) {
        const examsData = examsResult.value.data as Exam[]
        const pendingList: PendingExam[] = examsData.filter(e => e.status === 'pending').map(e => ({
          id: e.id, title: e.title, subject: e.subject, class: e.class,
          duration: e.duration ?? 60, total_questions: e.total_questions ?? 0,
          total_marks: e.total_marks ?? 0, has_theory: e.has_theory ?? false,
          questions: e.questions ?? [], theory_questions: e.theory_questions ?? [],
          instructions: e.instructions ?? '', passing_percentage: e.passing_percentage ?? e.pass_mark ?? 50,
          teacher_name: e.teacher_name ?? 'Unknown', department: e.department ?? 'General',
          created_at: e.created_at, created_by: e.created_by
        }))
        setPendingExams(pendingList)
        setPendingExamsCount(pendingList.length)
        setPublishedExams(examsData.filter(e => e.status === 'published'))
        setStats(prev => ({ ...prev, activeExams: examsData.filter(e => e.status === 'published').length }))
      }

      if (inquiriesResult.status === 'fulfilled' && !inquiriesResult.value.error && inquiriesResult.value.data) {
        const inquiryData = inquiriesResult.value.data as Inquiry[]
        setInquiries(inquiryData)
        setPendingInquiries(inquiryData.filter(i => i.status === 'pending').length)
      }

      if (reportsResult.status === 'fulfilled' && !reportsResult.value.error && reportsResult.value.data) {
        setPendingReports(reportsResult.value.data.length)
      }

      setDataLoaded(true)
    } catch (err) {
      if (err instanceof Error && err.message === 'Data load timeout') {
        setLoadError(true); setError(err)
        toast.error('Data loading timed out. Please try again.')
      } else if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Error loading data:', err)
        setLoadError(true)
        setError(err instanceof Error ? err : new Error('Failed to load data'))
      }
    } finally {
      if (!controller.signal.aborted && mountedRef.current) {
        setLoading(false); setRefreshing(false)
      }
    }
  }, [])

  loadAllDataRef.current = loadAllData

  // Initial data load
  useEffect(() => {
    if (contextUser?.id && !dataLoaded) loadAllData()
  }, [contextUser?.id, dataLoaded, loadAllData])

  // ✅ Use visibilitychange instead of focus for tab return refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isInitialLoadRef.current) { isInitialLoadRef.current = false; return }
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastVisibilityRef.current > VISIBILITY_REFRESH_INTERVAL && contextUser?.id) {
          lastVisibilityRef.current = Date.now()
          loadAllDataRef.current?.()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [contextUser?.id])

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => loadAllDataRef.current?.())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => loadAllDataRef.current?.())
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Failed to subscribe to real-time updates')
      })

    supabaseChannelRef.current = channel

    return () => { supabase.removeChannel(channel).catch(console.error) }
  }, [profile?.id])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadAllData()
    toast.success('Data refreshed')
  }, [loadAllData])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    const targetRoute = tabToRouteMap[tab]
    if (targetRoute && pathname !== targetRoute) router.replace(targetRoute)
  }, [pathname, router])

  const handleApproveExam = useCallback(async (exam: PendingExam) => {
    if (!confirm(`Approve "${exam.title}"?\n\nPublish to ${exam.class} students?`)) return
    setApprovingId(exam.id)
    try {
      const { error } = await supabase.from('exams').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', exam.id)
      if (error) throw error
      toast.success('✅ Exam approved!')
      await loadAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve exam')
    } finally { setApprovingId(null) }
  }, [loadAllData])

  const handleRejectExam = useCallback(async (exam: PendingExam) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    try {
      const { error } = await supabase.from('exams').update({ status: 'rejected', review_notes: reason, rejected_at: new Date().toISOString() }).eq('id', exam.id)
      if (error) throw error
      toast.success('Exam rejected.')
      await loadAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject exam')
    }
  }, [loadAllData])

  const handleRetry = useCallback(() => {
    setLoadError(false); setLoading(true); setError(null); loadAllData()
  }, [loadAllData])

  // Memoized tab content
  const tabContent = useMemo(() => {
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
            <p className="mt-4 text-slate-600 text-lg font-medium">An error occurred</p>
            <p className="text-sm text-slate-400 mt-2">{error.message}</p>
            <Button onClick={handleRetry} className="mt-4"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
            <WelcomeBanner adminProfile={profile} activeTab={activeTab} />
            {pendingExamsCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-amber-600" />
                  <div><p className="font-bold text-amber-800">{pendingExamsCount} exam(s) pending</p><p className="text-sm text-amber-600">Review and publish exams</p></div>
                </div>
                <Button onClick={() => handleTabChange('exams')} className="bg-amber-600 hover:bg-amber-700 shrink-0">Review Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </motion.div>
            )}
            <StatsCards stats={{ ...stats, pendingReports }} onStudentClick={() => handleTabChange('students')} onStaffClick={() => handleTabChange('staff')} onExamsClick={() => handleTabChange('exams')} onSubmissionsClick={() => {}} onBroadSheetClick={() => handleTabChange('broad-sheet')} onReportCardsClick={() => handleTabChange('report-cards')} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickActionCard icon={BookOpen} label="Broad Sheet" desc="Student results" onClick={() => handleTabChange('broad-sheet')} />
              <QuickActionCard icon={MonitorPlay} label="Exam Approvals" desc={`${pendingExamsCount} pending`} onClick={() => handleTabChange('exams')} alert={pendingExamsCount > 0} />
              <QuickActionCard icon={FileCheck} label="Report Cards" desc={`${pendingReports} pending`} onClick={() => handleTabChange('report-cards')} alert={pendingReports > 0} />
              <QuickActionCard icon={MessageSquare} label="Inquiries" desc={`${pendingInquiries} pending`} onClick={() => handleTabChange('inquiries')} alert={pendingInquiries > 0} />
            </div>
            <RecentActivityFeed />
          </motion.div>
        )
      case 'broad-sheet':
        return <motion.div key="broad-sheet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><BroadSheetPage /></motion.div>
      case 'students':
        return <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><StudentManagement students={students} onRefresh={handleRefresh} loading={refreshing} /></motion.div>
      case 'staff':
        return <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><StaffManagement staff={staff} onRefresh={handleRefresh} onAddStaff={async () => {}} onUpdateStaff={async () => {}} onDeleteStaff={async () => {}} onResetPassword={async () => {}} /></motion.div>
      case 'exams':
        return (
          <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div><h1 className="text-2xl font-bold">Exam Approvals</h1><p className="text-muted-foreground">{pendingExamsCount} pending • {publishedExams.length} published</p></div>
              <Button onClick={handleRefresh} variant="outline" disabled={refreshing}><Loader2 className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh</Button>
            </div>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-600" />Pending ({pendingExamsCount})</CardTitle></CardHeader>
              <CardContent>
                {pendingExams.length === 0 ? (
                  <div className="text-center py-12"><CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-muted-foreground">All caught up!</p></div>
                ) : (
                  <div className="space-y-4">
                    {pendingExams.map((exam) => (
                      <div key={exam.id} className="border rounded-lg p-5 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2"><h3 className="font-bold text-lg">{exam.title}</h3><Badge className="bg-amber-100 text-amber-800">Pending</Badge></div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                              <div><span className="text-muted-foreground">Subject:</span><p className="font-medium">{exam.subject}</p></div>
                              <div><span className="text-muted-foreground">Class:</span><p className="font-medium">{exam.class}</p></div>
                              <div><span className="text-muted-foreground">Teacher:</span><p className="font-medium">{exam.teacher_name}</p></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                              <Badge variant="outline">{exam.total_questions} questions</Badge>
                              <Badge variant="outline">{exam.total_marks} marks</Badge>
                              <Badge variant="outline">{exam.duration} mins</Badge>
                              <Badge variant="outline">Pass: {exam.passing_percentage}%</Badge>
                              {exam.has_theory && <Badge variant="secondary">Theory</Badge>}
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 self-end">
                            <Button onClick={() => handleApproveExam(exam)} className="bg-emerald-600" size="sm" disabled={approvingId === exam.id}>
                              {approvingId === exam.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}Approve
                            </Button>
                            <Button variant="outline" className="text-red-600" size="sm" onClick={() => handleRejectExam(exam)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {publishedExams.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Published ({publishedExams.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {publishedExams.map((exam) => (
                      <div key={exam.id} className="flex justify-between items-center p-4 border rounded-lg bg-emerald-50/50">
                        <div><p className="font-medium">{exam.title}</p><p className="text-sm text-muted-foreground">{exam.subject} • {exam.class} • {exam.teacher_name}</p></div>
                        <Badge className="bg-emerald-100 text-emerald-700">Published</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )
      case 'report-cards':
        return <motion.div key="report-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><ReportCardApproval onRefresh={handleRefresh} /></motion.div>
      case 'inquiries':
        return <motion.div key="inquiries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><AdminInquiriesTab inquiries={inquiries} onNavigate={handleTabChange} /></motion.div>
      default:
        return (
          <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <School className="h-16 w-16 text-purple-400 mx-auto" />
            <h2 className="text-2xl font-bold capitalize mt-4">{activeTab.replace('-', ' ')}</h2>
            <p className="text-muted-foreground">Under development</p>
          </motion.div>
        )
    }
  }, [activeTab, error, profile, pendingExamsCount, pendingReports, pendingInquiries, stats, students, staff, pendingExams, publishedExams, inquiries, refreshing, approvingId, handleRefresh, handleTabChange, handleApproveExam, handleRejectExam, handleRetry])

  if (loading && !loadError && !dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Shield className="h-16 w-16 text-purple-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (loadError && !dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-slate-400 mx-auto" />
          <p className="mt-4 text-slate-600 text-lg font-medium">Failed to load dashboard</p>
          {error && <p className="text-sm text-slate-400 mt-2">{error.message}</p>}
          <Button onClick={handleRetry} className="mt-4"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
        </div>
      </div>
    )
  }

  return <AnimatePresence mode="wait">{tabContent}</AnimatePresence>
}

function QuickActionCard({ icon: Icon, label, desc, onClick, alert }: { icon: React.ElementType; label: string; desc: string; onClick: () => void; alert?: boolean }) {
  return (
    <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }} className={cn("p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500", alert ? "border-amber-300 bg-amber-50/30" : "border-slate-100")} aria-label={`${label}: ${desc}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-purple-600" /></div>
        <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-slate-400">{desc}</p></div>
        {alert && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-label="Alert" />}
      </div>
    </div>
  )
}

// ✅ Wrap with AuthGuard
export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ErrorBoundary fallback={ErrorFallback}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <AdminDashboardContent />
        </Suspense>
      </ErrorBoundary>
    </AuthGuard>
  )
}