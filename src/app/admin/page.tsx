// app/admin/page.tsx - FIXED
'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  RefreshCw
} from 'lucide-react'

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

// ========== TYPES ==========
interface PendingExam {
  id: string; title: string; subject: string; class: string
  duration: number; total_questions: number; total_marks: number
  has_theory: boolean; questions: any[]; theory_questions: any[]
  instructions: string; passing_percentage: number
  teacher_name: string; department: string; created_at: string; created_by: string
}

interface AdminProfile {
  id: string; full_name: string; email: string; role: string; photo_url?: string
}

// ========== CONSTANTS ==========
const LOAD_TIMEOUT = 8000
const CACHE_DURATION = 60000
const routeToTabMap: Record<string, string> = {
  '/admin': 'overview', '/admin/broad-sheet': 'broad-sheet',
  '/admin/students': 'students', '/admin/staff': 'staff',
  '/admin/exams': 'exams', '/admin/report-cards': 'report-cards',
  '/admin/inquiries': 'inquiries', '/admin/monitor': 'cbt-monitor',
}
const tabToRouteMap: Record<string, string> = {
  'overview': '/admin', 'broad-sheet': '/admin/broad-sheet',
  'students': '/admin/students', 'staff': '/admin/staff',
  'exams': '/admin/exams', 'report-cards': '/admin/report-cards',
  'inquiries': '/admin/inquiries', 'cbt-monitor': '/admin/monitor',
}

function formatFullName(name: string): string {
  if (!name) return ''
  return name.split(/[\s._-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

const getTabFromPathname = (pathname: string): string => {
  if (routeToTabMap[pathname]) return routeToTabMap[pathname]
  for (const [route, tab] of Object.entries(routeToTabMap)) {
    if (pathname?.startsWith(route + '/')) return tab
  }
  return 'overview'
}

let profileCache: { data: AdminProfile; timestamp: number } | null = null

// ========== MAIN COMPONENT ==========
function AdminDashboardContent() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [activeTab, setActiveTab] = useState(() => getTabFromPathname(pathname || '/admin'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [students, setStudents] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [publishedExams, setPublishedExams] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)
  
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, activeExams: 0, pendingSubmissions: 0,
  })

  // ✅ Use ref to prevent re-subscribing realtime channel
  const loadAllDataRef = useRef<() => Promise<void>>()

  useEffect(() => {
    const tabForCurrentRoute = getTabFromPathname(pathname)
    if (tabForCurrentRoute !== activeTab) setActiveTab(tabForCurrentRoute)
  }, [pathname])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const timeout = setTimeout(() => { setAuthChecking(false); setLoadError(true) }, LOAD_TIMEOUT)
        const { data: { session } } = await supabase.auth.getSession()
        clearTimeout(timeout)
        if (!session?.user) { router.push('/portal'); return }
        if (profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
          setProfile(profileCache.data)
          setAuthChecking(false)
          return
        }
        const { data: profileData } = await supabase
          .from('profiles').select('role, full_name, email, photo_url')
          .eq('id', session.user.id).single()
        if (!profileData || !['admin', 'staff'].includes(profileData.role?.toLowerCase())) {
          router.push('/portal'); return
        }
        const adminProfile: AdminProfile = {
          id: session.user.id, email: session.user.email || '',
          full_name: formatFullName(profileData.full_name || 'Administrator'),
          role: profileData.role.toLowerCase(), photo_url: profileData.photo_url
        }
        profileCache = { data: adminProfile, timestamp: Date.now() }
        setProfile(adminProfile)
        setAuthChecking(false)
      } catch { setAuthChecking(false); setLoadError(true) }
    }
    checkAuth()
  }, [router])

  // ✅ Stable loadAllData - not recreated every render
  const loadAllData = useCallback(async () => {
    setLoadError(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const results = await Promise.race([
        Promise.allSettled([
          supabase.from('profiles').select('id, role, full_name, email, photo_url').limit(500),
          supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('report_cards').select('id, status').eq('status', 'pending').limit(100)
        ]),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), LOAD_TIMEOUT)).then(() => null)
      ])

      if (!results) { setLoadError(true); setLoading(false); return }

      const [profilesResult, examsResult, inquiriesResult, reportsResult] = results as any

      if (profilesResult.status === 'fulfilled' && profilesResult.value.data) {
        const profiles = profilesResult.value.data
        setStudents(profiles.filter((p: any) => p.role === 'student'))
        setStaff(profiles.filter((p: any) => p.role === 'staff'))
        setStats(prev => ({ ...prev, totalStudents: profiles.filter((p: any) => p.role === 'student').length, totalStaff: profiles.filter((p: any) => p.role === 'staff').length }))
      }

      if (examsResult.status === 'fulfilled' && examsResult.value.data) {
        const examsData = examsResult.value.data
        const pendingList: PendingExam[] = examsData.filter((e: any) => e.status === 'pending').map((e: any) => ({
          id: e.id, title: e.title, subject: e.subject, class: e.class,
          duration: e.duration || 60, total_questions: e.total_questions || 0,
          total_marks: e.total_marks || 0, has_theory: e.has_theory || false,
          questions: e.questions || [], theory_questions: e.theory_questions || [],
          instructions: e.instructions || '', passing_percentage: e.passing_percentage || e.pass_mark || 50,
          teacher_name: e.teacher_name || 'Unknown', department: e.department || 'General',
          created_at: e.created_at, created_by: e.created_by
        }))
        setPendingExams(pendingList)
        setPendingExamsCount(pendingList.length)
        setPublishedExams(examsData.filter((e: any) => e.status === 'published'))
        setStats(prev => ({ ...prev, activeExams: examsData.filter((e: any) => e.status === 'published').length }))
      }

      if (inquiriesResult.status === 'fulfilled' && inquiriesResult.value.data) {
        const data = inquiriesResult.value.data
        setInquiries(data)
        setPendingInquiries(data.filter((i: any) => i.status === 'pending').length)
      }

      if (reportsResult.status === 'fulfilled' && reportsResult.value.data) {
        setPendingReports(reportsResult.value.data.length)
      }
    } catch { setLoadError(true) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  // ✅ Store in ref for realtime channel
  loadAllDataRef.current = loadAllData

  useEffect(() => {
    if (!authChecking) loadAllData()
  }, [authChecking])

  // ✅ Stable realtime subscription - only subscribes ONCE
  useEffect(() => {
    const channel = supabase.channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        loadAllDataRef.current?.()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // ✅ Empty deps - subscribes ONCE

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    toast.success('Data refreshed')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    const targetRoute = tabToRouteMap[tab]
    if (targetRoute && pathname !== targetRoute) router.replace(targetRoute)
  }

  const handleApproveExam = async (exam: PendingExam) => {
    if (!confirm(`Approve "${exam.title}"?\n\nPublish to ${exam.class} students?`)) return
    setApprovingId(exam.id)
    try {
      const { error } = await supabase.from('exams').update({ 
        status: 'published', published_at: new Date().toISOString() 
      }).eq('id', exam.id)
      if (error) throw error
      toast.success('✅ Exam approved!')
      await loadAllData()
    } catch (err: any) { toast.error(err.message) }
    finally { setApprovingId(null) }
  }

  const handleRejectExam = async (exam: PendingExam) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    try {
      const { error } = await supabase.from('exams').update({ 
        status: 'rejected', review_notes: reason, rejected_at: new Date().toISOString() 
      }).eq('id', exam.id)
      if (error) throw error
      toast.success('Exam rejected.')
      await loadAllData()
    } catch (err: any) { toast.error(err.message) }
  }

  if (authChecking || (loading && !loadError)) {
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

  if (loadError && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-slate-400 mx-auto" />
          <p className="mt-4 text-slate-600 text-lg font-medium">Failed to load dashboard</p>
          <Button onClick={() => { setLoadError(false); setLoading(true); loadAllData() }} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 lg:pb-0">
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Home' },
            { id: 'broad-sheet', icon: BookOpen, label: 'Broad' },
            { id: 'students', icon: Users, label: 'Students' },
            { id: 'exams', icon: MonitorPlay, label: 'Exams' }
          ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={cn("flex flex-col items-center py-2 px-1 rounded-lg relative", activeTab === tab.id ? "text-purple-600 bg-purple-50" : "text-slate-500")}>
              <tab.icon className="h-5 w-5" /><span className="text-[10px] mt-1">{tab.label}</span>
              {tab.id === 'exams' && pendingExamsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-red-500">{pendingExamsCount}</Badge>
              )}
            </button>
          ))}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex flex-col items-center py-2 px-1 rounded-lg text-slate-500">
            <Menu className="h-5 w-5" /><span className="text-[10px] mt-1">More</span>
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t p-4 mb-2 rounded-t-xl">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'staff', icon: Briefcase, label: 'Staff' },
                  { id: 'report-cards', icon: FileCheck, label: 'Reports' },
                  { id: 'inquiries', icon: MessageSquare, label: 'Inquiries' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-100">
                    <tab.icon className="h-5 w-5 text-slate-600" /><span className="text-xs mt-1">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
            <WelcomeBanner adminProfile={profile} activeTab={activeTab} />
            {pendingExamsCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Bell className="h-6 w-6 text-amber-600" /><div><p className="font-bold text-amber-800">{pendingExamsCount} exam(s) pending</p><p className="text-sm text-amber-600">Review and publish exams</p></div></div>
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
        )}
        {activeTab === 'broad-sheet' && <motion.div key="broad-sheet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><BroadSheetPage /></motion.div>}
        {activeTab === 'students' && <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><StudentManagement students={students} onRefresh={handleRefresh} loading={refreshing} /></motion.div>}
        {activeTab === 'staff' && <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><StaffManagement staff={staff} onRefresh={handleRefresh} onAddStaff={async () => {}} onUpdateStaff={async () => {}} onDeleteStaff={async () => {}} onResetPassword={async () => {}} /></motion.div>}
        {activeTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl font-bold">Exam Approvals</h1><p className="text-muted-foreground">{pendingExamsCount} pending • {publishedExams.length} published</p></div><Button onClick={handleRefresh} variant="outline" disabled={refreshing}><Loader2 className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh</Button></div>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-600" />Pending ({pendingExamsCount})</CardTitle></CardHeader>
              <CardContent>{pendingExams.length === 0 ? <div className="text-center py-12"><CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-muted-foreground">All caught up!</p></div> : <div className="space-y-4">{pendingExams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-5 bg-white"><div className="flex flex-col sm:flex-row justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><h3 className="font-bold text-lg">{exam.title}</h3><Badge className="bg-amber-100 text-amber-800">Pending</Badge></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm"><div><span className="text-muted-foreground">Subject:</span><p className="font-medium">{exam.subject}</p></div><div><span className="text-muted-foreground">Class:</span><p className="font-medium">{exam.class}</p></div><div><span className="text-muted-foreground">Teacher:</span><p className="font-medium">{exam.teacher_name}</p></div></div><div className="flex flex-wrap gap-2 mt-3 text-xs"><Badge variant="outline">{exam.total_questions} questions</Badge><Badge variant="outline">{exam.total_marks} marks</Badge><Badge variant="outline">{exam.duration} mins</Badge><Badge variant="outline">Pass: {exam.passing_percentage}%</Badge>{exam.has_theory && <Badge variant="secondary">Theory</Badge>}</div></div><div className="flex sm:flex-col gap-2 self-end"><Button onClick={() => handleApproveExam(exam)} className="bg-emerald-600" size="sm" disabled={approvingId === exam.id}>{approvingId === exam.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}Approve</Button><Button variant="outline" className="text-red-600" size="sm" onClick={() => handleRejectExam(exam)}><XCircle className="h-4 w-4 mr-1" />Reject</Button></div></div></div>
              ))}</div>}</CardContent></Card>
            {publishedExams.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Published ({publishedExams.length})</CardTitle></CardHeader><CardContent><div className="space-y-3">{publishedExams.map((exam: any) => <div key={exam.id} className="flex justify-between items-center p-4 border rounded-lg bg-emerald-50/50"><div><p className="font-medium">{exam.title}</p><p className="text-sm text-muted-foreground">{exam.subject} • {exam.class} • {exam.teacher_name}</p></div><Badge className="bg-emerald-100 text-emerald-700">Published</Badge></div>)}</div></CardContent></Card>}
          </motion.div>
        )}
        {activeTab === 'report-cards' && <motion.div key="report-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><ReportCardApproval onRefresh={handleRefresh} /></motion.div>}
        {activeTab === 'inquiries' && <motion.div key="inquiries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><AdminInquiriesTab inquiries={inquiries} onNavigate={handleTabChange} /></motion.div>}
        {!['overview', 'broad-sheet', 'students', 'staff', 'exams', 'report-cards', 'inquiries'].includes(activeTab) && <motion.div className="flex flex-col items-center justify-center py-20"><School className="h-16 w-16 text-purple-400 mx-auto" /><h2 className="text-2xl font-bold capitalize mt-4">{activeTab.replace('-', ' ')}</h2><p className="text-muted-foreground">Under development</p></motion.div>}
      </AnimatePresence>
    </div>
  )
}

function QuickActionCard({ icon: Icon, label, desc, onClick, alert }: { icon: any; label: string; desc: string; onClick: () => void; alert?: boolean }) {
  return (
    <div onClick={onClick} className={cn("p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 bg-white", alert ? "border-amber-300 bg-amber-50/30" : "border-slate-100")}>
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-purple-600" /></div><div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-slate-400">{desc}</p></div>{alert && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}</div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AdminDashboardContent />
    </Suspense>
  )
}