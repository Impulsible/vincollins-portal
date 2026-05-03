/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/page.tsx - USES ADMIN LAYOUT (NO DUPLICATE HEADER/SIDEBAR)
'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
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
  MessageSquare, CheckCircle2, XCircle, Clock, Bell, BookOpen
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

// ========== PROFILE CACHE ==========
let profileCache: { data: AdminProfile; timestamp: number } | null = null
const CACHE_DURATION = 60000 // 1 minute

// ========== HELPERS ==========
function formatFullName(name: string): string {
  if (!name) return ''
  return name.split(/[\s._-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

// Map routes to tab IDs for syncing
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

const getTabFromPathname = (pathname: string): string => {
  if (routeToTabMap[pathname]) return routeToTabMap[pathname]
  for (const [route, tab] of Object.entries(routeToTabMap)) {
    if (pathname?.startsWith(route + '/')) return tab
  }
  return 'overview'
}

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
  
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)
  
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, activeExams: 0,
    pendingSubmissions: 0,
  })

  // ========== SYNC TAB WITH ROUTE ==========
  useEffect(() => {
    const tabForCurrentRoute = getTabFromPathname(pathname)
    if (tabForCurrentRoute !== activeTab) {
      setActiveTab(tabForCurrentRoute)
    }
  }, [pathname])

  // ========== AUTH CHECK (WITH CACHE) ==========
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/portal'); return }

        // Return cached profile if valid
        if (profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
          setProfile(profileCache.data)
          setAuthChecking(false)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, full_name, email, photo_url')
          .eq('id', session.user.id)
          .single()

        if (!profileData || !['admin', 'staff'].includes(profileData.role?.toLowerCase())) {
          toast.error('Access denied')
          router.push('/portal')
          return
        }

        const adminProfile: AdminProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: formatFullName(profileData.full_name || 'Administrator'),
          role: profileData.role.toLowerCase(),
          photo_url: profileData.photo_url
        }
        
        profileCache = { data: adminProfile, timestamp: Date.now() }
        setProfile(adminProfile)
        setAuthChecking(false)
      } catch (err) {
        router.push('/portal')
      }
    }
    checkAuth()
  }, [router])

  // ========== LOAD ALL DATA (PARALLEL + OPTIMIZED) ==========
  const loadAllData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const [
        profilesResult,
        examsResult,
        inquiriesResult,
        reportsResult
      ] = await Promise.allSettled([
        supabase.from('profiles')
          .select('id, role, full_name, email, photo_url')
          .limit(1000),
        
        supabase.from('exams')
          .select('id, title, subject, class, status, duration, total_questions, total_marks, has_theory, questions, theory_questions, instructions, passing_percentage, pass_mark, teacher_name, department, created_at, created_by')
          .order('created_at', { ascending: false })
          .limit(100),
        
        supabase.from('inquiries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        
        supabase.from('report_cards')
          .select('id, status')
          .eq('status', 'pending')
          .limit(100)
      ])

      // Process profiles
      if (profilesResult.status === 'fulfilled' && profilesResult.value.data) {
        const profiles = profilesResult.value.data
        const studentsList = profiles.filter((p: any) => p.role === 'student')
        const staffList = profiles.filter((p: any) => p.role === 'staff')
        setStudents(studentsList)
        setStaff(staffList)
        setStats(prev => ({ 
          ...prev, 
          totalStudents: studentsList.length, 
          totalStaff: staffList.length 
        }))
      }

      // Process exams
      if (examsResult.status === 'fulfilled' && examsResult.value.data) {
        const examsData = examsResult.value.data
        const pendingList: PendingExam[] = examsData
          .filter((e: any) => e.status === 'pending')
          .map((e: any) => ({
            id: e.id, title: e.title, subject: e.subject, class: e.class,
            duration: e.duration || 60, total_questions: e.total_questions || 0,
            total_marks: e.total_marks || 0, has_theory: e.has_theory || false,
            questions: e.questions || [], theory_questions: e.theory_questions || [],
            instructions: e.instructions || '', passing_percentage: e.passing_percentage || e.pass_mark || 50,
            teacher_name: e.teacher_name || 'Unknown', department: e.department || 'General',
            created_at: e.created_at, created_by: e.created_by
          }))
        const publishedList = examsData.filter((e: any) => e.status === 'published')
        
        setPendingExams(pendingList)
        setPendingExamsCount(pendingList.length)
        setPublishedExams(publishedList)
        setStats(prev => ({ ...prev, activeExams: publishedList.length }))
      }

      // Process inquiries
      if (inquiriesResult.status === 'fulfilled' && inquiriesResult.value.data) {
        const inquiriesData = inquiriesResult.value.data
        setInquiries(inquiriesData)
        setPendingInquiries(inquiriesData.filter((i: any) => i.status === 'pending').length)
      }

      // Process reports
      if (reportsResult.status === 'fulfilled' && reportsResult.value.data) {
        setPendingReports(reportsResult.value.data.length)
      }

    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!authChecking) loadAllData()
  }, [authChecking, loadAllData])

  // Real-time updates (only for exams)
  useEffect(() => {
    const channel = supabase.channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => loadAllData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAllData])

  // ========== ACTIONS ==========
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    toast.success('Data refreshed')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    const targetRoute = tabToRouteMap[tab]
    if (targetRoute && pathname !== targetRoute) {
      router.replace(targetRoute)
    }
  }

  const handleApproveExam = async (exam: PendingExam) => {
    if (!confirm(`Approve "${exam.title}"?\n\nPublish to ${exam.class} students?`)) return
    setApprovingId(exam.id)
    try {
      const { error } = await supabase.from('exams').update({ 
        status: 'published', published_at: new Date().toISOString() 
      }).eq('id', exam.id)
      if (error) throw error
      toast.success('✅ Exam approved! Notifications sent.')
      await loadAllData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setApprovingId(null)
    }
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
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // ========== LOADING STATE ==========
  if (authChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Shield className="h-16 w-16 text-purple-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg font-medium">Loading Admin Dashboard...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="h-2 w-2 rounded-full bg-purple-400"
                animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ========== RENDER (Header + Sidebar provided by AdminLayout) ==========
  return (
    <>
      {/* Mobile Nav */}
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
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1">{tab.label}</span>
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
                    <tab.icon className="h-5 w-5 text-slate-600" />
                    <span className="text-xs mt-1">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence mode="wait">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
            <WelcomeBanner adminProfile={profile} activeTab={activeTab} />
            
            {pendingExamsCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-800">{pendingExamsCount} exam(s) pending approval</p>
                    <p className="text-sm text-amber-600">Review and publish exams submitted by teachers</p>
                  </div>
                </div>
                <Button onClick={() => handleTabChange('exams')} className="bg-amber-600 hover:bg-amber-700 shrink-0">
                  Review Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
            
            <StatsCards 
              stats={{ ...stats, pendingReports }} 
              onStudentClick={() => handleTabChange('students')} 
              onStaffClick={() => handleTabChange('staff')} 
              onExamsClick={() => handleTabChange('exams')} 
              onSubmissionsClick={() => {}} 
              onBroadSheetClick={() => handleTabChange('broad-sheet')}
              onReportCardsClick={() => handleTabChange('report-cards')}
            />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickActionCard icon={BookOpen} label="Broad Sheet" desc="Student results overview" onClick={() => handleTabChange('broad-sheet')} />
              <QuickActionCard icon={MonitorPlay} label="Exam Approvals" desc={`${pendingExamsCount} pending`} onClick={() => handleTabChange('exams')} alert={pendingExamsCount > 0} />
              <QuickActionCard icon={FileCheck} label="Report Cards" desc={`${pendingReports} pending`} onClick={() => handleTabChange('report-cards')} alert={pendingReports > 0} />
              <QuickActionCard icon={MessageSquare} label="Inquiries" desc={`${pendingInquiries} pending`} onClick={() => handleTabChange('inquiries')} alert={pendingInquiries > 0} />
            </div>
            
            <RecentActivityFeed />
          </motion.div>
        )}

        {/* BROAD SHEET TAB */}
        {activeTab === 'broad-sheet' && (
          <motion.div key="broad-sheet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <BroadSheetPage />
          </motion.div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <StudentManagement students={students} onRefresh={handleRefresh} loading={refreshing} />
          </motion.div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <StaffManagement staff={staff} onRefresh={handleRefresh} 
              onAddStaff={async () => { throw new Error('Not implemented') }}
              onUpdateStaff={async () => { throw new Error('Not implemented') }}
              onDeleteStaff={async () => { throw new Error('Not implemented') }}
              onResetPassword={async () => { throw new Error('Not implemented') }}
            />
          </motion.div>
        )}

        {/* EXAMS TAB */}
        {activeTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Exam Approvals</h1>
                <p className="text-muted-foreground">{pendingExamsCount} pending • {publishedExams.length} published</p>
              </div>
              <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
                <Loader2 className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh
              </Button>
            </div>

            {/* Pending */}
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-600" />Pending Approval ({pendingExamsCount})</CardTitle></CardHeader>
              <CardContent>
                {pendingExams.length === 0 ? (
                  <div className="text-center py-12"><CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-muted-foreground">All caught up!</p></div>
                ) : (
                  <div className="space-y-4">
                    {pendingExams.map((exam) => (
                      <div key={exam.id} className="border rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
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
                          <div className="flex sm:flex-col gap-2 self-end sm:self-center">
                            <Button onClick={() => handleApproveExam(exam)} className="bg-emerald-600 hover:bg-emerald-700" size="sm" disabled={approvingId === exam.id}>
                              {approvingId === exam.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}Approve
                            </Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" size="sm" onClick={() => handleRejectExam(exam)}>
                              <XCircle className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Published */}
            {publishedExams.length > 0 && (
              <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Published ({publishedExams.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {publishedExams.map((exam: any) => (
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
        )}

        {/* REPORT CARDS */}
        {activeTab === 'report-cards' && (
          <motion.div key="report-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ReportCardApproval onRefresh={handleRefresh} />
          </motion.div>
        )}

        {/* INQUIRIES */}
        {activeTab === 'inquiries' && (
          <motion.div key="inquiries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminInquiriesTab inquiries={inquiries} onNavigate={handleTabChange} />
          </motion.div>
        )}

        {/* FALLBACK */}
        {!['overview', 'broad-sheet', 'students', 'staff', 'exams', 'report-cards', 'inquiries'].includes(activeTab) && (
          <motion.div className="flex flex-col items-center justify-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <School className="h-16 w-16 text-purple-400 mx-auto" />
            <h2 className="text-2xl font-bold capitalize mt-4">{activeTab.replace('-', ' ')}</h2>
            <p className="text-muted-foreground">Under development</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Quick Action Card Component
function QuickActionCard({ icon: Icon, label, desc, onClick, alert }: { icon: any; label: string; desc: string; onClick: () => void; alert?: boolean }) {
  return (
    <div onClick={onClick} className={cn("p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 bg-white", alert ? "border-amber-300 bg-amber-50/30" : "border-slate-100")}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-purple-600" /></div>
        <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-slate-400">{desc}</p></div>
        {alert && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
      </div>
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