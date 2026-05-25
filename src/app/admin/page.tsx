// app/admin/page.tsx - FULLY UPDATED (Loading Admin Dashboard text)
'use client'

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
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
  Loader2, Shield, ArrowRight, MonitorPlay,
  Users, FileCheck, School, MessageSquare, 
  CheckCircle2, XCircle, Clock, Bell, BookOpen,
  RefreshCw, AlertTriangle, X
} from 'lucide-react'
import type { Student } from '@/components/admin/students/types'

// ========== LAZY LOAD HEAVY COMPONENTS ==========
const StudentManagement = dynamic(
  () => import('@/components/admin/students/StudentManagement').then(mod => ({ default: mod.StudentManagement })),
  { ssr: false }
)
const StaffManagement = dynamic(
  () => import('@/components/admin/staff/StaffManagement').then(mod => ({ default: mod.StaffManagement })),
  { ssr: false }
)
const ReportCardApproval = dynamic(
  () => import('@/components/admin/report-cards/ReportCardApproval').then(mod => ({ default: mod.ReportCardApproval })),
  { ssr: false }
)
const BroadSheetPage = dynamic(
  () => import('@/app/admin/broad-sheet/page'),
  { ssr: false }
)
const AdminInquiriesTab = dynamic(
  () => import('@/components/admin/inquiries/AdminInquiriesTab').then(mod => ({ default: mod.AdminInquiriesTab })),
  { ssr: false }
)

// ========== TYPES ==========
interface PendingExam {
  id: string; title: string; subject: string; class: string
  duration: number; total_questions: number; total_marks: number
  has_theory: boolean; questions: Record<string, unknown>[]
  theory_questions: Record<string, unknown>[]
  instructions: string; passing_percentage: number
  teacher_name: string; department: string; created_at: string; created_by: string
}

interface Staff {
  id: string; role: string; full_name: string; email: string
  photo_url?: string; vin_id: string; department: string
  phone: string; address: string; is_active: boolean
  password_changed: boolean; created_at: string; title?: string; date_joined?: string
}

interface Inquiry { id: string; status: string; [key: string]: unknown }

interface Exam {
  id: string; title: string; subject: string; class: string
  teacher_name: string; status: string; duration?: number
  total_questions?: number; total_marks?: number; has_theory?: boolean
  questions?: Record<string, unknown>[]; theory_questions?: Record<string, unknown>[]
  instructions?: string; passing_percentage?: number; pass_mark?: number
  department?: string; created_at: string; created_by: string
}

// ========== CONSTANTS ==========
const CACHE_DURATION = 60000 // 1 minute cache

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
  const { user: contextUser, loading: authLoading } = useUser()
  
  // State
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(() => getTabFromPathname(pathname))
  const [error, setError] = useState<Error | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [publishedExams, setPublishedExams] = useState<Exam[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [dismissedBanner, setDismissedBanner] = useState(false)
  
  // Counts
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)
  
  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, activeExams: 0, pendingSubmissions: 0,
  })

  // Refs
  const isMountedRef = useRef(true)
  const lastLoadTimeRef = useRef(0)
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  const initialLoadDoneRef = useRef(false)

  // Set profile from UserContext
  useEffect(() => {
    if (contextUser && isMountedRef.current) {
      setProfile({
        id: contextUser.id,
        full_name: contextUser.full_name || 'Administrator',
        email: contextUser.email || '',
        role: contextUser.role?.toLowerCase() || 'admin',
        photo_url: contextUser.photo_url || undefined
      })
    }
  }, [contextUser])

  // Sync tab with pathname - NO AUTO RELOAD
  useEffect(() => {
    const tabForCurrentRoute = getTabFromPathname(pathname)
    if (tabForCurrentRoute !== activeTab) {
      setActiveTab(tabForCurrentRoute)
    }
  }, [pathname, activeTab])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load data with caching
  const loadAllData = useCallback(async (forceRefresh = false) => {
    // Check cache
    const now = Date.now()
    if (!forceRefresh && lastLoadTimeRef.current && (now - lastLoadTimeRef.current) < CACHE_DURATION) {
      const cached = cacheRef.current.get('dashboardData')
      if (cached) {
        setStudents(cached.data.students || [])
        setStaff(cached.data.staff || [])
        setPendingExams(cached.data.pendingExams || [])
        setPublishedExams(cached.data.publishedExams || [])
        setInquiries(cached.data.inquiries || [])
        setPendingExamsCount(cached.data.pendingExamsCount || 0)
        setPendingReports(cached.data.pendingReports || 0)
        setPendingInquiries(cached.data.pendingInquiries || 0)
        setStats(cached.data.stats || { totalStudents: 0, totalStaff: 0, activeExams: 0, pendingSubmissions: 0 })
        setDataLoaded(true)
        setLoading(false)
        setRefreshing(false)
        return
      }
    }

    try {
      // Fetch all data in parallel
      const [profilesRes, examsRes, inquiriesRes, reportsRes] = await Promise.allSettled([
        supabase.from('profiles').select('id, role, full_name, email, photo_url, vin_id, class, department, is_active, phone, address, password_changed, created_at').limit(1000),
        supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('report_cards').select('id, status').eq('status', 'pending').limit(500)
      ])

      if (!isMountedRef.current) return

      // Process profiles
      if (profilesRes.status === 'fulfilled' && !profilesRes.value.error && profilesRes.value.data) {
        const profiles = profilesRes.value.data as Record<string, unknown>[]
        const studentList = profiles.filter(p => p.role === 'student').map(mapToStudent)
        const staffList = profiles.filter(p => p.role === 'staff').map(mapToStaff)
        
        setStudents(studentList)
        setStaff(staffList)
        setStats(prev => ({
          ...prev,
          totalStudents: studentList.length,
          totalStaff: staffList.length
        }))
      }

      // Process exams
      if (examsRes.status === 'fulfilled' && !examsRes.value.error && examsRes.value.data) {
        const examsData = examsRes.value.data as Exam[]
        const pending = examsData.filter(e => e.status === 'pending').map(e => ({
          id: e.id, title: e.title, subject: e.subject, class: e.class,
          duration: e.duration ?? 60, total_questions: e.total_questions ?? 0,
          total_marks: e.total_marks ?? 0, has_theory: e.has_theory ?? false,
          questions: e.questions ?? [], theory_questions: e.theory_questions ?? [],
          instructions: e.instructions ?? '', passing_percentage: e.passing_percentage ?? e.pass_mark ?? 50,
          teacher_name: e.teacher_name ?? 'Unknown', department: e.department ?? 'General',
          created_at: e.created_at, created_by: e.created_by
        }))
        const published = examsData.filter(e => e.status === 'published')
        
        setPendingExams(pending)
        setPublishedExams(published)
        setPendingExamsCount(pending.length)
        setStats(prev => ({ ...prev, activeExams: published.length }))
      }

      // Process inquiries
      if (inquiriesRes.status === 'fulfilled' && !inquiriesRes.value.error && inquiriesRes.value.data) {
        const inquiryData = inquiriesRes.value.data as Inquiry[]
        setInquiries(inquiryData)
        setPendingInquiries(inquiryData.filter(i => i.status === 'pending').length)
      }

      // Process reports
      if (reportsRes.status === 'fulfilled' && !reportsRes.value.error && reportsRes.value.data) {
        setPendingReports(reportsRes.value.data.length)
      }

      // Update cache
      const currentData = {
        students, staff, pendingExams, publishedExams, inquiries,
        pendingExamsCount, pendingReports, pendingInquiries, stats
      }
      cacheRef.current.set('dashboardData', {
        data: currentData,
        timestamp: now
      })
      lastLoadTimeRef.current = now
      setDataLoaded(true)
      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to load data'))
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [students, staff, pendingExams, publishedExams, inquiries, pendingExamsCount, pendingReports, pendingInquiries, stats])

  // Initial load - ONLY ONCE
  useEffect(() => {
    if (contextUser?.id && !initialLoadDoneRef.current && !dataLoaded) {
      initialLoadDoneRef.current = true
      loadAllData()
    }
  }, [contextUser?.id, dataLoaded, loadAllData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadAllData(true)
    toast.success('Dashboard refreshed')
  }, [loadAllData])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    const targetRoute = tabToRouteMap[tab]
    if (targetRoute && pathname !== targetRoute) {
      router.replace(targetRoute, { scroll: false })
    }
  }, [pathname, router])

  const handleApproveExam = useCallback(async (exam: PendingExam) => {
    if (!confirm(`Approve "${exam.title}"? This will publish it to ${exam.class} students.`)) return
    setApprovingId(exam.id)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', exam.id)
      
      if (error) throw error
      toast.success('Exam approved and published!')
      await loadAllData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve exam')
    } finally {
      setApprovingId(null)
    }
  }, [loadAllData])

  const handleRejectExam = useCallback(async (exam: PendingExam) => {
    const reason = prompt('Please enter reason for rejection:')
    if (!reason) return
    
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'rejected', review_notes: reason, rejected_at: new Date().toISOString() })
        .eq('id', exam.id)
      
      if (error) throw error
      toast.success('Exam rejected')
      await loadAllData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject exam')
    }
  }, [loadAllData])

  const handleRetry = useCallback(() => {
    setError(null)
    setLoading(true)
    initialLoadDoneRef.current = false
    loadAllData(true)
  }, [loadAllData])

  // Memoized tab content
  const tabContent = useMemo(() => {
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mx-auto" />
            <p className="mt-4 text-slate-600 text-base sm:text-lg font-medium">Failed to load dashboard</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">{error.message}</p>
            <Button onClick={handleRetry} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6 px-2 sm:px-0"
          >
            <WelcomeBanner adminProfile={profile} activeTab={activeTab} />
            
            <AnimatePresence>
              {pendingExamsCount > 0 && !dismissedBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3 sm:p-4"
                >
                  <button
                    onClick={() => setDismissedBanner(true)}
                    className="absolute top-2 right-2 p-1 hover:bg-amber-100 rounded-full transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4 text-amber-600" />
                  </button>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pr-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800 text-sm sm:text-base">
                          {pendingExamsCount} Exam{pendingExamsCount !== 1 ? 's' : ''} Pending Approval
                        </p>
                        <p className="text-xs sm:text-sm text-amber-600">
                          Review and publish teacher-created exams
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleTabChange('exams')} 
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                    >
                      Review Now <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <StatsCards 
              stats={{ ...stats, pendingReports }} 
              onStudentClick={() => handleTabChange('students')} 
              onStaffClick={() => handleTabChange('staff')} 
              onExamsClick={() => handleTabChange('exams')} 
              onSubmissionsClick={() => {}} 
              onBroadSheetClick={() => handleTabChange('broad-sheet')} 
              onReportCardsClick={() => handleTabChange('report-cards')} 
            />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <QuickActionCard 
                icon={BookOpen} 
                label="Broad Sheet" 
                desc="View results" 
                onClick={() => handleTabChange('broad-sheet')} 
              />
              <QuickActionCard 
                icon={MonitorPlay} 
                label="Exams" 
                desc={`${pendingExamsCount} pending`} 
                onClick={() => handleTabChange('exams')} 
                alert={pendingExamsCount > 0} 
              />
              <QuickActionCard 
                icon={FileCheck} 
                label="Report Cards" 
                desc={`${pendingReports} pending`} 
                onClick={() => handleTabChange('report-cards')} 
                alert={pendingReports > 0} 
              />
              <QuickActionCard 
                icon={MessageSquare} 
                label="Inquiries" 
                desc={`${pendingInquiries} pending`} 
                onClick={() => handleTabChange('inquiries')} 
                alert={pendingInquiries > 0} 
              />
            </div>
            
            <RecentActivityFeed />
          </motion.div>
        )
      
      case 'broad-sheet':
        return (
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>}>
            <BroadSheetPage />
          </Suspense>
        )
      
      case 'students':
        return (
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>}>
            <StudentManagement 
              students={students} 
              onRefresh={handleRefresh} 
              loading={refreshing} 
            />
          </Suspense>
        )
      
      case 'staff':
        return (
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>}>
            <StaffManagement 
              staff={staff} 
              onRefresh={handleRefresh} 
              onAddStaff={async () => {}} 
              onUpdateStaff={async () => {}} 
              onDeleteStaff={async () => {}} 
              onResetPassword={async () => {}} 
            />
          </Suspense>
        )
      
      case 'exams':
        return (
          <motion.div
            key="exams"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6 px-2 sm:px-0"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Exam Approvals</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {pendingExamsCount} pending • {publishedExams.length} published
                </p>
              </div>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
                className="w-full sm:w-auto"
              >
                <Loader2 className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  Pending Approval ({pendingExamsCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingExams.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">All exams have been reviewed!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingExams.map((exam) => (
                      <div key={exam.id} className="border rounded-lg p-3 sm:p-5 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-bold text-base sm:text-lg">{exam.title}</h3>
                              <Badge className="bg-amber-100 text-amber-800 text-xs">Pending</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div>
                                <span className="text-muted-foreground">Subject:</span>
                                <p className="font-medium text-sm">{exam.subject}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Class:</span>
                                <p className="font-medium text-sm">{exam.class}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Teacher:</span>
                                <p className="font-medium text-sm truncate">{exam.teacher_name}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                              <Badge variant="outline" className="text-xs">{exam.total_questions} Qs</Badge>
                              <Badge variant="outline" className="text-xs">{exam.total_marks} marks</Badge>
                              <Badge variant="outline" className="text-xs">{exam.duration} min</Badge>
                              <Badge variant="outline" className="text-xs">Pass: {exam.passing_percentage}%</Badge>
                              {exam.has_theory && <Badge variant="secondary" className="text-xs">Theory</Badge>}
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-center">
                            <Button 
                              onClick={() => handleApproveExam(exam)} 
                              className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none" 
                              size="sm"
                              disabled={approvingId === exam.id}
                            >
                              {approvingId === exam.id ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 flex-1 sm:flex-none" 
                              size="sm"
                              onClick={() => handleRejectExam(exam)}
                            >
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Reject
                            </Button>
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
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    Published ({publishedExams.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {publishedExams.slice(0, 10).map((exam) => (
                      <div key={exam.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 sm:p-4 border rounded-lg bg-emerald-50/50">
                        <div>
                          <p className="font-medium text-sm sm:text-base">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam.subject} • {exam.class} • {exam.teacher_name}
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Published</Badge>
                      </div>
                    ))}
                    {publishedExams.length > 10 && (
                      <p className="text-center text-xs text-muted-foreground pt-2">
                        +{publishedExams.length - 10} more exams
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )
      
      case 'report-cards':
        return (
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>}>
            <ReportCardApproval onRefresh={handleRefresh} />
          </Suspense>
        )
      
      case 'inquiries':
        return (
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>}>
            <AdminInquiriesTab inquiries={inquiries} onNavigate={handleTabChange} />
          </Suspense>
        )
      
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <School className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto" />
            <h2 className="text-xl sm:text-2xl font-bold capitalize mt-4">{activeTab.replace('-', ' ')}</h2>
            <p className="text-sm text-muted-foreground mt-2">Coming soon</p>
          </div>
        )
    }
  }, [activeTab, error, profile, pendingExamsCount, pendingReports, pendingInquiries, stats, students, staff, pendingExams, publishedExams, inquiries, refreshing, approvingId, dismissedBanner, handleTabChange, handleRefresh, handleApproveExam, handleRejectExam, handleRetry])

  // ✅ LOADING STATE - UPDATED with "Loading Admin Dashboard..."
  if (authLoading || (loading && !dataLoaded && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-base sm:text-lg font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      {tabContent}
    </div>
  )
}

// Mobile-optimized Quick Action Card
function QuickActionCard({ 
  icon: Icon, 
  label, 
  desc, 
  onClick, 
  alert 
}: { 
  icon: React.ElementType; 
  label: string; 
  desc: string; 
  onClick: () => void; 
  alert?: boolean;
}) {
  return (
    <div 
      onClick={onClick} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => { 
        if (e.key === 'Enter' || e.key === ' ') { 
          e.preventDefault(); 
          onClick(); 
        } 
      }} 
      className={cn(
        "p-2 sm:p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500",
        alert ? "border-amber-300 bg-amber-50/30" : "border-slate-100"
      )}
      aria-label={`${label}: ${desc}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold truncate">{label}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">{desc}</p>
        </div>
        {alert && (
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 animate-pulse shrink-0" aria-label="Alert" />
        )}
      </div>
    </div>
  )
}

// Main export with error boundary
export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }>
        <AdminDashboardContent />
      </Suspense>
    </AuthGuard>
  )
}