// app/admin/page.tsx

'use client'

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
import { WelcomeBanner } from '@/components/admin/dashboard/WelcomeBanner'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
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
  RefreshCw, AlertTriangle, X, Megaphone,
  TrendingUp, ChevronRight, Sparkles
} from 'lucide-react'
import AdminLoading from '@/components/admin/AdminLoading'
import type { Student } from '@/components/admin/students/types'

// ── Lazy-loaded heavy components ──────────────────────────────────────────────
const StudentManagement = dynamic(
  () => import('@/components/admin/students/StudentManagement').then(m => ({ default: m.StudentManagement })),
  { ssr: false }
)
const StaffManagement = dynamic(
  () => import('@/components/admin/staff/StaffManagement').then(m => ({ default: m.StaffManagement })),
  { ssr: false }
)
const ReportCardApproval = dynamic(
  () => import('@/components/admin/report-cards/ReportCardApproval').then(m => ({ default: m.ReportCardApproval })),
  { ssr: false }
)
const BroadSheetPage = dynamic(() => import('@/app/admin/broad-sheet/page'), { ssr: false })
const AdminInquiriesTab = dynamic(
  () => import('@/components/admin/inquiries/AdminInquiriesTab').then(m => ({ default: m.AdminInquiriesTab })),
  { ssr: false }
)
const AnnouncementsManager = dynamic(
  () => import('@/components/admin/announcements/AnnouncementsManager').then(m => ({ default: m.AnnouncementsManager })),
  { ssr: false }
)

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
const CACHE_DURATION = 60000

const routeToTabMap: Record<string, string> = {
  '/admin': 'overview',
  '/admin/broad-sheet': 'broad-sheet',
  '/admin/students': 'students',
  '/admin/staff': 'staff',
  '/admin/exams': 'exams',
  '/admin/report-cards': 'report-cards',
  '/admin/inquiries': 'inquiries',
  '/admin/monitor': 'cbt-monitor',
  '/admin/announcements': 'announcements',
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
  'announcements': '/admin/announcements',
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

// ── Suspense fallback ─────────────────────────────────────────────────────────
const TabFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
    </div>
    <p className="text-sm text-slate-400 font-medium">Loading…</p>
  </div>
)

// ── Quick Action Card ─────────────────────────────────────────────────────────
interface QuickActionCardProps {
  icon: React.ElementType
  label: string
  desc: string
  onClick: () => void
  alert?: boolean
  color?: string
}

const quickActionColors: Record<string, { bg: string; icon: string; ring: string }> = {
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'hover:ring-violet-200' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'hover:ring-emerald-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'hover:ring-blue-200' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'hover:ring-amber-200' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'hover:ring-rose-200' },
}

function QuickActionCard({ icon: Icon, label, desc, onClick, alert, color = 'violet' }: QuickActionCardProps) {
  const colors = quickActionColors[color] || quickActionColors.violet
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-left p-4 rounded-2xl border border-slate-200/80 bg-white',
        'hover:border-slate-300 hover:shadow-md transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        'ring-2 ring-transparent',
        colors.ring,
        alert && 'border-amber-200 bg-amber-50/30'
      )}
      aria-label={`${label}: ${desc}`}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
          alert ? 'bg-amber-100' : colors.bg
        )}>
          <Icon className={cn('h-5 w-5', alert ? 'text-amber-600' : colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{desc}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {alert && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-label="Alert" />
          )}
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </button>
  )
}

// ── Pending-exam row ──────────────────────────────────────────────────────────
function PendingExamCard({
  exam,
  onApprove,
  onReject,
  approving,
}: {
  exam: PendingExam
  onApprove: (e: PendingExam) => void
  onReject: (e: PendingExam) => void
  approving: boolean
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-bold text-base text-slate-800">{exam.title}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-3 w-3" /> Pending
            </span>
            {exam.has_theory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                Theory
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
            {[
              { label: 'Subject', value: exam.subject },
              { label: 'Class', value: exam.class },
              { label: 'Teacher', value: exam.teacher_name },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-slate-400 mb-0.5 uppercase tracking-wider text-[10px] font-medium">{label}</p>
                <p className="font-semibold text-slate-700 truncate">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              `${exam.total_questions} Questions`,
              `${exam.total_marks} Marks`,
              `${exam.duration} min`,
              `Pass: ${exam.passing_percentage}%`,
            ].map(label => (
              <span
                key={label}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex sm:flex-col gap-2 self-end sm:self-center shrink-0">
          <Button
            onClick={() => onApprove(exam)}
            disabled={approving}
            size="sm"
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-xs px-4"
          >
            {approving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject(exam)}
            size="sm"
            className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 text-xs px-4"
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard content ────────────────────────────────────────────────────
function AdminDashboardContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { user: contextUser, loading: authLoading } = useUser()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(() => getTabFromPathname(pathname))
  const [error, setError] = useState<Error | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [publishedExams, setPublishedExams] = useState<Exam[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [dismissedBanner, setDismissedBanner] = useState(false)

  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)

  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, activeExams: 0, pendingSubmissions: 0,
  })

  const isMountedRef = useRef(true)
  const lastLoadTimeRef = useRef(0)
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  const initialLoadDoneRef = useRef(false)

  useEffect(() => {
    if (contextUser && isMountedRef.current) {
      setProfile({
        id: contextUser.id,
        full_name: contextUser.full_name || 'Administrator',
        email: contextUser.email || '',
        role: contextUser.role?.toLowerCase() || 'admin',
        photo_url: contextUser.photo_url || undefined,
      })
    }
  }, [contextUser])

  useEffect(() => {
    const t = getTabFromPathname(pathname)
    if (t !== activeTab) setActiveTab(t)
  }, [pathname, activeTab])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const loadAllData = useCallback(async (forceRefresh = false) => {
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
      const [profilesRes, examsRes, inquiriesRes, reportsRes] = await Promise.allSettled([
        supabase.from('profiles').select('id, role, full_name, email, photo_url, vin_id, class, department, is_active, phone, address, password_changed, created_at').limit(1000),
        supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('report_cards').select('id, status').eq('status', 'pending').limit(500),
      ])

      if (!isMountedRef.current) return

      let newStudents: Student[] = []
      let newStaff: Staff[] = []
      let newPendingExams: PendingExam[] = []
      let newPublishedExams: Exam[] = []
      let newInquiries: Inquiry[] = []

      if (profilesRes.status === 'fulfilled' && !profilesRes.value.error && profilesRes.value.data) {
        const profiles = profilesRes.value.data as Record<string, unknown>[]
        newStudents = profiles.filter(p => p.role === 'student').map(mapToStudent)
        newStaff = profiles.filter(p => p.role === 'staff').map(mapToStaff)
        setStudents(newStudents)
        setStaff(newStaff)
        setStats(prev => ({ ...prev, totalStudents: newStudents.length, totalStaff: newStaff.length }))
      }

      if (examsRes.status === 'fulfilled' && !examsRes.value.error && examsRes.value.data) {
        const examsData = examsRes.value.data as Exam[]
        newPendingExams = examsData.filter(e => e.status === 'pending').map(e => ({
          id: e.id, title: e.title, subject: e.subject, class: e.class,
          duration: e.duration ?? 60, total_questions: e.total_questions ?? 0,
          total_marks: e.total_marks ?? 0, has_theory: e.has_theory ?? false,
          questions: e.questions ?? [], theory_questions: e.theory_questions ?? [],
          instructions: e.instructions ?? '', passing_percentage: e.passing_percentage ?? e.pass_mark ?? 50,
          teacher_name: e.teacher_name ?? 'Unknown', department: e.department ?? 'General',
          created_at: e.created_at, created_by: e.created_by,
        }))
        newPublishedExams = examsData.filter(e => e.status === 'published')
        setPendingExams(newPendingExams)
        setPublishedExams(newPublishedExams)
        setPendingExamsCount(newPendingExams.length)
        setStats(prev => ({ ...prev, activeExams: newPublishedExams.length }))
      }

      if (inquiriesRes.status === 'fulfilled' && !inquiriesRes.value.error && inquiriesRes.value.data) {
        newInquiries = inquiriesRes.value.data as Inquiry[]
        setInquiries(newInquiries)
        setPendingInquiries(newInquiries.filter(i => i.status === 'pending').length)
      }

      let newPendingReports = 0
      if (reportsRes.status === 'fulfilled' && !reportsRes.value.error && reportsRes.value.data) {
        newPendingReports = reportsRes.value.data.length
        setPendingReports(newPendingReports)
      }

      cacheRef.current.set('dashboardData', {
        data: {
          students: newStudents, staff: newStaff,
          pendingExams: newPendingExams, publishedExams: newPublishedExams,
          inquiries: newInquiries, pendingExamsCount: newPendingExams.length,
          pendingReports: newPendingReports, pendingInquiries: newInquiries.filter(i => i.status === 'pending').length,
          stats: { totalStudents: newStudents.length, totalStaff: newStaff.length, activeExams: newPublishedExams.length, pendingSubmissions: 0 },
        },
        timestamp: now,
      })
      lastLoadTimeRef.current = now
      setDataLoaded(true)
      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
      if (isMountedRef.current) setError(err instanceof Error ? err : new Error('Failed to load data'))
    } finally {
      if (isMountedRef.current) { setLoading(false); setRefreshing(false) }
    }
  }, [])

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
    if (targetRoute && pathname !== targetRoute) router.replace(targetRoute, { scroll: false })
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

  const tabContent = useMemo(() => {
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Failed to load dashboard</h3>
            <p className="text-sm text-slate-400 mb-6">{error.message}</p>
            <Button onClick={handleRetry} className="bg-slate-900 hover:bg-slate-800 text-white">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      // ── Overview ──────────────────────────────────────────────────
      case 'overview':
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Welcome */}
            <WelcomeBanner adminProfile={profile} activeTab={activeTab} />

            {/* Pending-exams alert banner */}
            <AnimatePresence>
              {pendingExamsCount > 0 && !dismissedBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
                    <button
                      onClick={() => setDismissedBanner(true)}
                      className="absolute top-3 right-3 p-1 rounded-lg hover:bg-amber-100 transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5 text-amber-500" />
                    </button>
                    <div className="flex items-center gap-3 pr-6">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Bell className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">
                          {pendingExamsCount} Exam{pendingExamsCount !== 1 ? 's' : ''} Awaiting Approval
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Review and publish teacher-submitted exams
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleTabChange('exams')}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm h-8 text-xs shrink-0"
                    >
                      Review Now
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <StatsCards
              stats={{ ...stats, pendingReports }}
              onStudentClick={() => handleTabChange('students')}
              onStaffClick={() => handleTabChange('staff')}
              onExamsClick={() => handleTabChange('exams')}
              onSubmissionsClick={() => {}}
              onBroadSheetClick={() => handleTabChange('broad-sheet')}
              onReportCardsClick={() => handleTabChange('report-cards')}
            />

            {/* Quick actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <QuickActionCard
                  icon={BookOpen} label="Broad Sheet" desc="View all results"
                  color="blue"
                  onClick={() => handleTabChange('broad-sheet')}
                />
                <QuickActionCard
                  icon={MonitorPlay}
                  label="Exam Approvals"
                  desc={pendingExamsCount > 0 ? `${pendingExamsCount} pending review` : 'All reviewed'}
                  color="violet"
                  onClick={() => handleTabChange('exams')}
                  alert={pendingExamsCount > 0}
                />
                <QuickActionCard
                  icon={FileCheck}
                  label="Report Cards"
                  desc={pendingReports > 0 ? `${pendingReports} pending approval` : 'All approved'}
                  color="emerald"
                  onClick={() => handleTabChange('report-cards')}
                  alert={pendingReports > 0}
                />
                <QuickActionCard
                  icon={MessageSquare}
                  label="Inquiries"
                  desc={pendingInquiries > 0 ? `${pendingInquiries} unanswered` : 'All answered'}
                  color="rose"
                  onClick={() => handleTabChange('inquiries')}
                  alert={pendingInquiries > 0}
                />
                <QuickActionCard
                  icon={Megaphone} label="Announcements" desc="Send updates"
                  color="amber"
                  onClick={() => handleTabChange('announcements')}
                />
              </div>
            </div>
          </motion.div>
        )

      // ── Announcements ─────────────────────────────────────────────
      case 'announcements':
        return (
          <Suspense fallback={<TabFallback />}>
            <AnnouncementsManager profile={profile} />
          </Suspense>
        )

      // ── Broad Sheet ───────────────────────────────────────────────
      case 'broad-sheet':
        return (
          <Suspense fallback={<TabFallback />}>
            <BroadSheetPage />
          </Suspense>
        )

      // ── Students ──────────────────────────────────────────────────
      case 'students':
        return (
          <Suspense fallback={<TabFallback />}>
            <StudentManagement students={students} onRefresh={handleRefresh} loading={refreshing} />
          </Suspense>
        )

      // ── Staff ─────────────────────────────────────────────────────
      case 'staff':
        return (
          <Suspense fallback={<TabFallback />}>
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

      // ── Exams ─────────────────────────────────────────────────────
      case 'exams':
        return (
          <motion.div
            key="exams"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Exam Approvals</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {pendingExamsCount > 0
                    ? `${pendingExamsCount} exam${pendingExamsCount !== 1 ? 's' : ''} awaiting review`
                    : 'All exams reviewed'} · {publishedExams.length} published
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="border-slate-200 hover:bg-slate-50 h-8 text-xs"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
                Refresh
              </Button>
            </div>

            {/* Pending card */}
            <Card className="border border-slate-200/80 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    Pending Approval
                  </CardTitle>
                  {pendingExamsCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                      {pendingExamsCount}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {pendingExams.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="font-medium text-slate-700 text-sm">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No exams pending review</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingExams.map(exam => (
                      <PendingExamCard
                        key={exam.id}
                        exam={exam}
                        onApprove={handleApproveExam}
                        onReject={handleRejectExam}
                        approving={approvingId === exam.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Published card */}
            {publishedExams.length > 0 && (
              <Card className="border border-slate-200/80 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      Published Exams
                    </CardTitle>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      {publishedExams.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-2">
                    {publishedExams.slice(0, 10).map(exam => (
                      <div
                        key={exam.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{exam.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {exam.subject} · {exam.class} · {exam.teacher_name}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Published
                        </span>
                      </div>
                    ))}
                    {publishedExams.length > 10 && (
                      <p className="text-center text-xs text-slate-400 pt-2">
                        + {publishedExams.length - 10} more published exams
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )

      // ── Report Cards ──────────────────────────────────────────────
      case 'report-cards':
        return (
          <Suspense fallback={<TabFallback />}>
            <ReportCardApproval onRefresh={handleRefresh} />
          </Suspense>
        )

      // ── Inquiries ─────────────────────────────────────────────────
      case 'inquiries':
        return (
          <Suspense fallback={<TabFallback />}>
            <AdminInquiriesTab inquiries={inquiries} onNavigate={handleTabChange} />
          </Suspense>
        )

      // ── Fallback ──────────────────────────────────────────────────
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <School className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Coming soon</p>
          </div>
        )
    }
  }, [
    activeTab, error, profile,
    pendingExamsCount, pendingReports, pendingInquiries,
    stats, students, staff, pendingExams, publishedExams, inquiries,
    refreshing, approvingId, dismissedBanner,
    handleTabChange, handleRefresh, handleApproveExam, handleRejectExam, handleRetry,
  ])

  if (authLoading || (loading && !dataLoaded && !error)) {
    return <AdminLoading profile={profile} onLogout={() => {}} />
  }

  return (
    <div className="w-full overflow-x-hidden min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tabContent}
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading admin dashboard…</p>
        </div>
      }>
        <AdminDashboardContent />
      </Suspense>
    </AuthGuard>
  )
}