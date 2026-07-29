'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import StaffWelcomeBanner from '@/components/staff/StaffWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  MonitorPlay, FileText, BookOpen, Users, ArrowRight,
  Loader2, Calculator, Plus, GraduationCap, FileCheck,
  Clock, Briefcase, ChevronRight, CheckCircle2,
  RefreshCw, AlertTriangle, Calendar, Zap, Bell,
  BarChart3, Target, Activity, BookMarked, TrendingUp,
  UserCheck, UserX, CalendarDays
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number
  activeStudents: number
  activeClasses: number
  pendingCAScores: number
  publishedExams: number
  totalExams: number
  totalAssignments: number
  totalNotes: number
  reportCardsGenerated: number
  averagePerformance: number
  classBreakdown: { name: string; count: number }[]
  pendingTheoryCount: number
  pendingTheorySubmissions: any[]
  recentSubmissions: any[]
}

interface DashboardData {
  exams: any[]
  assignments: any[]
  notes: any[]
  stats: DashboardStats
}

interface TermInfo {
  termName: string
  termCode: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  displayWeek: string
  startDate: Date | null
  endDate: Date | null
  isCurrent: boolean
}

const CACHE_KEY = 'staff_dashboard_cache'
const CACHE_TTL_MS = 5 * 60 * 1000

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0, activeStudents: 0, activeClasses: 0,
  pendingCAScores: 0, publishedExams: 0, totalExams: 0,
  totalAssignments: 0, totalNotes: 0, reportCardsGenerated: 0,
  averagePerformance: 0, classBreakdown: [],
  pendingTheoryCount: 0, pendingTheorySubmissions: [], recentSubmissions: [],
}

// ── Helper Components ─────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mb-4 text-center">{subtitle}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick} className="bg-slate-800 hover:bg-slate-700 text-white h-8 text-xs px-3">
          <Plus className="h-3 w-3 mr-1.5" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="h-9 w-9 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-emerald-200 animate-ping opacity-30" />
        </div>
        <p className="text-slate-800 text-xl font-semibold">Loading Dashboard</p>
        <p className="mt-1.5 text-slate-400 text-sm">Preparing your workspace...</p>
      </div>
    </div>
  )
}

function TimeoutScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center px-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Connection Issue</h3>
        <p className="text-sm text-slate-500 mb-6">Check your connection and try again.</p>
        <Button onClick={onRetry} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6">
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose'
  trend?: string
}) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-500', badge: 'text-emerald-600 bg-emerald-50' },
    blue: { bg: 'bg-blue-50 border-blue-100', icon: 'bg-blue-500', badge: 'text-blue-600 bg-blue-50' },
    violet: { bg: 'bg-violet-50 border-violet-100', icon: 'bg-violet-500', badge: 'text-violet-600 bg-violet-50' },
    amber: { bg: 'bg-amber-50 border-amber-100', icon: 'bg-amber-500', badge: 'text-amber-600 bg-amber-50' },
    rose: { bg: 'bg-rose-50 border-rose-100', icon: 'bg-rose-500', badge: 'text-rose-600 bg-rose-50' },
  }
  const c = colorMap[color]

  return (
    <div className={cn('rounded-2xl p-4 border shadow-sm', c.bg)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-sm', c.icon)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {trend && (
          <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', c.badge)}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  badge,
  href,
  iconColor = 'text-slate-600',
  iconBg = 'bg-slate-100',
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  badge?: string
  href?: string
  iconColor?: string
  iconBg?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {badge && (
          <Badge className="text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-700 border-0 font-medium">
            {badge}
          </Badge>
        )}
      </div>
      {href && (
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-slate-500 hover:text-slate-800 px-2">
          <Link href={href}>
            All <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readCache(): DashboardData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data as DashboardData
  } catch { return null }
}

function writeCache(data: DashboardData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

function formatDate(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function getStatusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'active': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'closed': return 'bg-rose-100 text-rose-600 border-rose-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

// ── Data Fetcher ──────────────────────────────────────────────────────────────

async function fetchDashboardData(
  userId: string, termCode?: string, sessionYear?: string
): Promise<DashboardData> {
  let examIdQuery = supabase.from('exams').select('id').eq('created_by', userId)
  if (termCode && sessionYear) examIdQuery = examIdQuery.eq('term', termCode).eq('session_year', sessionYear)
  const { data: teacherExams } = await examIdQuery
  const teacherExamIds = (teacherExams ?? []).map((e: any) => e.id)

  let examsQuery = supabase.from('exams')
    .select('id, title, subject, class, status, created_at, term, session_year')
    .eq('created_by', userId).order('created_at', { ascending: false }).limit(10)
  if (termCode && sessionYear) examsQuery = examsQuery.eq('term', termCode).eq('session_year', sessionYear)

  let assignmentsQuery = supabase.from('assignments')
    .select('id, title, subject, class, classes, status, due_date, total_points, created_at')
    .eq('created_by', userId).order('created_at', { ascending: false }).limit(5)
  if (termCode && sessionYear) assignmentsQuery = assignmentsQuery.eq('term', termCode).eq('session_year', sessionYear)

  let notesQuery = supabase.from('notes')
    .select('id, title, subject, status, created_at')
    .eq('created_by', userId).order('created_at', { ascending: false }).limit(4)
  if (termCode && sessionYear) notesQuery = notesQuery.eq('term', termCode).eq('session_year', sessionYear)

  const [examsRes, assignmentsRes, notesRes, studentsRes] = await Promise.allSettled([
    examsQuery, assignmentsQuery, notesQuery,
    supabase.from('profiles').select('class, is_active').eq('role', 'student'),
  ])

  const exams = examsRes.status === 'fulfilled' && !examsRes.value.error ? examsRes.value.data ?? [] : []
  const rawAssignments = assignmentsRes.status === 'fulfilled' && !assignmentsRes.value.error ? assignmentsRes.value.data ?? [] : []

  let notes: any[] = []
  if (notesRes.status === 'fulfilled') {
    if (notesRes.value.error) {
      const { data: fallbackNotes } = await supabase.from('notes').select('id, title, created_at')
        .eq('created_by', userId).order('created_at', { ascending: false }).limit(4)
      notes = fallbackNotes ?? []
    } else {
      notes = notesRes.value.data ?? []
    }
  }

  const students = studentsRes.status === 'fulfilled' && !studentsRes.value.error ? studentsRes.value.data ?? [] : []

  let submissionsRes
  if (teacherExamIds.length > 0) {
    let query = supabase.from('exam_attempts')
      .select('id, exam_id, student_name, submitted_at, status, total_score, percentage')
      .eq('status', 'pending_theory').in('exam_id', teacherExamIds)
    if (termCode && sessionYear) query = query.eq('term', termCode).eq('session_year', sessionYear)
    submissionsRes = await query.order('submitted_at', { ascending: false }).limit(20)
  } else {
    submissionsRes = { data: [], error: null }
  }

  const submissions = submissionsRes.data ?? []
  let enrichedSubmissions: any[] = []
  if (submissions.length > 0) {
    const submissionExamIds = [...new Set(submissions.map((s: any) => s.exam_id))]
    const { data: examDetails } = await supabase.from('exams').select('id, title, subject, class').in('id', submissionExamIds)
    const examMap: Record<string, any> = {}
    examDetails?.forEach((e: any) => { examMap[e.id] = e })
    enrichedSubmissions = submissions.map((s: any) => ({
      ...s,
      exam_title: examMap[s.exam_id]?.title ?? 'Unknown Exam',
      exam_subject: examMap[s.exam_id]?.subject ?? '',
      exam_class: examMap[s.exam_id]?.class ?? '',
    }))
  }

  const classMap = new Map<string, number>()
  students.forEach((s: any) => { if (s.class) classMap.set(s.class, (classMap.get(s.class) ?? 0) + 1) })

  let caScoresMap: Record<string, any> = {}
  let caOnlyScores: any[] = []
  if (teacherExamIds.length > 0) {
    let caQuery = supabase.from('ca_scores').select('exam_id, student_id, percentage, total_score').in('exam_id', teacherExamIds)
    if (termCode && sessionYear) caQuery = caQuery.eq('term', termCode).eq('session_year', sessionYear)
    const { data: caData } = await caQuery
    if (caData) {
      caData.forEach((ca: any) => { caScoresMap[`${ca.student_id}|${ca.exam_id}`] = ca })
      caOnlyScores = caData
    }
  }

  const studentExamScores: number[] = []
  const seenPairs = new Set<string>()
  if (teacherExamIds.length > 0) {
    let attemptsQuery = supabase.from('exam_attempts')
      .select('student_id, exam_id, percentage, status')
      .in('exam_id', teacherExamIds).in('status', ['completed', 'graded'])
    if (termCode && sessionYear) attemptsQuery = attemptsQuery.eq('term', termCode).eq('session_year', sessionYear)
    const { data: allAttempts } = await attemptsQuery
    if (allAttempts) {
      allAttempts.forEach((a: any) => {
        const key = `${a.student_id}|${a.exam_id}`
        if (seenPairs.has(key)) return
        seenPairs.add(key)
        const ca = caScoresMap[key]
        const pct = ca?.percentage ?? a.percentage ?? 0
        if (pct > 0) studentExamScores.push(pct)
      })
    }
    caOnlyScores.forEach((ca: any) => {
      const key = `${ca.student_id}|${ca.exam_id}`
      if (!seenPairs.has(key) && ca.percentage > 0) studentExamScores.push(ca.percentage)
    })
  }

  const averagePerformance = studentExamScores.length > 0
    ? Math.round(studentExamScores.reduce((a, b) => a + b, 0) / studentExamScores.length) : 0

  const assignments = rawAssignments.map((a: any) => ({
    ...a,
    displaySubject: a.subject ?? 'No Subject',
    displayClass: a.class ?? a.classes?.[0] ?? 'No Class',
  }))

  const stats: DashboardStats = {
    totalStudents: students.length,
    activeStudents: students.filter((s: any) => s.is_active !== false).length,
    activeClasses: classMap.size,
    pendingCAScores: enrichedSubmissions.length,
    publishedExams: exams.filter((e: any) => e.status === 'published').length,
    totalExams: exams.length,
    totalAssignments: assignments.length,
    totalNotes: notes.length,
    reportCardsGenerated: 0,
    averagePerformance,
    classBreakdown: Array.from(classMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    pendingTheoryCount: enrichedSubmissions.length,
    pendingTheorySubmissions: enrichedSubmissions,
    recentSubmissions: enrichedSubmissions,
  }

  return { exams, assignments, notes, stats }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    () => (typeof window !== 'undefined' ? readCache() : null)
  )
  const [loading, setLoading] = useState(() => typeof window !== 'undefined' ? !readCache() : true)
  const [timedOut, setTimedOut] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTermCode, setCurrentTermCode] = useState<string>('')
  const [currentSessionYear, setCurrentSessionYear] = useState<string>('')
  const [termInfo, setTermInfo] = useState<TermInfo>({
    termName: '', termCode: '', sessionYear: '',
    currentWeek: 0, totalWeeks: 13, weekProgress: 0,
    displayWeek: 'Loading...', startDate: null, endDate: null, isCurrent: false,
  })
  const [isLoadingTerm, setIsLoadingTerm] = useState(true)

  const fetchedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTermInfo = useCallback(async () => {
    setIsLoadingTerm(true)
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('school_settings').select('current_term, current_session')
        .order('created_at', { ascending: false }).limit(1).single()
      if (settingsError) return

      if (settings?.current_term && settings?.current_session) {
        setCurrentTermCode(settings.current_term)
        setCurrentSessionYear(settings.current_session)
      }

      const { data: termData, error: termError } = await supabase
        .from('terms').select('term_name, term_code, session_year, start_date, end_date')
        .eq('term_code', settings?.current_term || '').eq('session_year', settings?.current_session || '').single()
      if (termError) return

      const now = new Date()
      const startDate = termData?.start_date ? new Date(termData.start_date) : null
      const endDate = termData?.end_date ? new Date(termData.end_date) : null
      let currentWeek = 0, weekProgress = 0, displayWeek = 'Not started', totalWeeks = 13

      if (startDate && endDate) {
        const diffTime = endDate.getTime() - startDate.getTime()
        totalWeeks = Math.max(Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000)), 1)
        if (now < startDate) {
          displayWeek = `Starts ${startDate.toLocaleDateString()}`
        } else if (now > endDate) {
          currentWeek = totalWeeks; weekProgress = 100; displayWeek = 'Term Ended'
        } else {
          const elapsed = now.getTime() - startDate.getTime()
          currentWeek = Math.min(Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1, totalWeeks)
          weekProgress = (currentWeek / totalWeeks) * 100
          displayWeek = `Week ${currentWeek} of ${totalWeeks}`
        }
      }

      setTermInfo({
        termName: termData?.term_name || settings?.current_term || '',
        termCode: termData?.term_code || settings?.current_term || '',
        sessionYear: termData?.session_year || settings?.current_session || '',
        currentWeek, totalWeeks, weekProgress, displayWeek, startDate, endDate, isCurrent: true,
      })
    } catch (error) {
      console.error('Error fetching term info:', error)
    } finally {
      setIsLoadingTerm(false)
    }
  }, [])

  const loadData = useCallback(async (userId: string, showToast = false) => {
    try {
      setRefreshing(true)
      timeoutRef.current = setTimeout(() => setTimedOut(true), 10000)
      const data = await fetchDashboardData(userId, currentTermCode, currentSessionYear)
      setDashboardData(data)
      writeCache(data)
      setLoading(false)
      if (showToast) toast.success('Dashboard refreshed')
    } catch (err) {
      console.error('[StaffPage] fetchDashboardData error:', err)
      if (showToast) toast.error('Refresh failed. Please try again.')
    } finally {
      setRefreshing(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [currentTermCode, currentSessionYear])

  const handleRefresh = useCallback(async () => {
    if (!contextUser?.id || refreshing) return
    fetchedRef.current = false
    await Promise.all([loadData(contextUser.id, true), fetchTermInfo()])
    fetchedRef.current = true
  }, [contextUser?.id, refreshing, loadData, fetchTermInfo])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !contextUser?.id) { router.replace('/portal'); return }
    const role = contextUser.role?.toLowerCase()
    if (!['staff', 'teacher', 'admin'].includes(role ?? '')) { router.replace('/portal'); return }
    const init = async () => {
      await fetchTermInfo()
      if (!fetchedRef.current && currentTermCode && currentSessionYear) {
        fetchedRef.current = true
        loadData(contextUser.id)
      }
    }
    init()
  }, [authLoading, isAuthenticated, contextUser, router, loadData, fetchTermInfo])

  useEffect(() => {
    if (contextUser?.id && !isLoadingTerm && fetchedRef.current && currentTermCode && currentSessionYear) {
      loadData(contextUser.id)
    }
  }, [currentTermCode, currentSessionYear, contextUser?.id, loadData, isLoadingTerm])

  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) } }, [])

  const exams = dashboardData?.exams ?? []
  const assignments = dashboardData?.assignments ?? []
  const notes = dashboardData?.notes ?? []
  const stats = dashboardData?.stats ?? DEFAULT_STATS
  const userRole = contextUser?.role?.toLowerCase() ?? ''
  const isValidRole = ['staff', 'teacher', 'admin'].includes(userRole)
  const pendingCount = stats.recentSubmissions.length

  if (authLoading || isLoadingTerm) return <LoadingScreen />
  if (!isAuthenticated || !contextUser) return null
  if (!isValidRole) return null
  if (loading && !dashboardData && timedOut) return <TimeoutScreen onRetry={() => window.location.reload()} />
  if (loading && !dashboardData) return <LoadingScreen />

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── ORIGINAL BANNER — kept as-is, just passes data ────────────── */}
      <StaffWelcomeBanner
        profile={contextUser}
        stats={{
          totalExams: stats.totalExams,
          publishedExams: stats.publishedExams,
          totalStudents: stats.totalStudents,
          activeStudents: stats.activeStudents,
          pendingGrading: stats.pendingCAScores,
          totalAssignments: stats.totalAssignments,
          totalNotes: stats.totalNotes,
          reportCardsGenerated: stats.reportCardsGenerated,
          averagePerformance: stats.averagePerformance,
        }}
        termInfo={{
          termName: termInfo.termName,
          sessionYear: termInfo.sessionYear,
          currentWeek: termInfo.currentWeek,
          totalWeeks: termInfo.totalWeeks,
          weekProgress: termInfo.weekProgress,
          displayWeek: termInfo.displayWeek,
        }}
      />

      {/* ── Dashboard Content ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Stats + Quick Actions Row ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Exams"
            value={stats.totalExams}
            icon={MonitorPlay}
            color="blue"
            trend={stats.publishedExams > 0 ? `${stats.publishedExams} live` : undefined}
          />
          <StatCard
            label="Assignments"
            value={stats.totalAssignments}
            icon={FileText}
            color="violet"
          />
          <StatCard
            label="Study Notes"
            value={stats.totalNotes}
            icon={BookOpen}
            color="emerald"
          />
          <StatCard
            label="Needs Grading"
            value={pendingCount}
            icon={Clock}
            color={pendingCount > 0 ? 'amber' : 'emerald'}
            trend={pendingCount > 0 ? 'Action needed' : 'All done!'}
          />
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-7 text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'New Exam', icon: MonitorPlay, href: '/staff/exams', gradient: 'from-blue-500 to-indigo-600', desc: 'Create & publish' },
              { label: 'Assignment', icon: FileText, href: '/staff/assignments/create', gradient: 'from-violet-500 to-purple-600', desc: 'Give homework' },
              { label: 'Add Notes', icon: BookOpen, href: '/staff/notes/create', gradient: 'from-emerald-500 to-teal-600', desc: 'Share resources' },
              { label: 'CA Scores', icon: Calculator, href: '/staff/ca-scores', gradient: 'from-amber-500 to-orange-600', desc: 'Record scores' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="group flex flex-col items-start gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all shadow-sm hover:shadow-md text-left"
              >
                <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform', action.gradient)}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="text-[11px] text-slate-400">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Performance Banner ───────────────────────────────────────── */}
        {stats.averagePerformance > 0 && (
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-slate-700">Average Student Performance</p>
                <span className={cn('text-lg font-bold',
                  stats.averagePerformance >= 75 ? 'text-emerald-600' :
                  stats.averagePerformance >= 50 ? 'text-amber-600' : 'text-rose-600'
                )}>
                  {stats.averagePerformance}%
                </span>
              </div>
              <Progress value={stats.averagePerformance} className="h-1.5" />
            </div>
            <Badge className={cn('flex-shrink-0 text-xs border hidden sm:inline-flex',
              stats.averagePerformance >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              stats.averagePerformance >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-rose-50 text-rose-600 border-rose-200'
            )}>
              {stats.averagePerformance >= 75 ? '🎯 Great' : stats.averagePerformance >= 50 ? '📈 Fair' : '⚠️ Low'}
            </Badge>
          </div>
        )}

        {/* ── Pending Grading ──────────────────────────────────────────── */}
        {pendingCount > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Pending Grading</p>
                  <p className="text-[11px] text-slate-400">{pendingCount} submission{pendingCount !== 1 ? 's' : ''} awaiting review</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-semibold">{pendingCount}</Badge>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {stats.recentSubmissions.slice(0, 6).map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => router.push(`/staff/exams/${sub.exam_id}/submissions/${sub.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <GraduationCap className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{sub.student_name ?? 'Unknown'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{sub.exam_title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(sub.submitted_at)}</p>
                  </div>
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                    <ChevronRight className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                </button>
              ))}
            </div>
            {pendingCount > 6 && (
              <div className="px-4 pb-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => router.push('/staff/exams')} className="text-xs text-amber-600 hover:text-amber-700">
                  View all {pendingCount} submissions <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ) : stats.totalExams > 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">All caught up!</p>
              <p className="text-xs text-emerald-600">No submissions pending — great work! 🎉</p>
            </div>
          </div>
        ) : null}

        {/* ── Main Content Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Recent Exams */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={MonitorPlay}
                title="Recent Exams"
                badge={termInfo.termName || undefined}
                href="/staff/exams"
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
              />
              <div className="p-3">
                {exams.length === 0 ? (
                  <EmptyState
                    icon={MonitorPlay}
                    title="No exams yet"
                    subtitle={currentTermCode ? `None found for ${termInfo.termName}` : 'Create your first exam to get started'}
                    action={{ label: 'Create Exam', onClick: () => router.push('/staff/exams') }}
                  />
                ) : (
                  <div className="space-y-1">
                    {exams.slice(0, 5).map((exam: any) => (
                      <button
                        key={exam.id}
                        onClick={() => router.push(`/staff/exams/${exam.id}/submissions`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <MonitorPlay className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{exam.title}</p>
                          <p className="text-[11px] text-slate-400">{exam.subject} · {exam.class}</p>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] flex-shrink-0 font-medium capitalize border', getStatusStyle(exam.status))}>
                          {exam.status ?? 'draft'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={FileText}
                title="Recent Assignments"
                badge={termInfo.termName || undefined}
                href="/staff/assignments"
                iconColor="text-violet-600"
                iconBg="bg-violet-50"
              />
              <div className="p-3">
                {assignments.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No assignments yet"
                    subtitle="Create assignments for your students"
                    action={{ label: 'New Assignment', onClick: () => router.push('/staff/assignments/create') }}
                  />
                ) : (
                  <div className="space-y-1">
                    {assignments.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => router.push(`/staff/assignments/${item.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400">{item.displaySubject} · {item.displayClass}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Study Notes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={BookOpen}
                title="Study Notes"
                badge={termInfo.termName || undefined}
                href="/staff/notes"
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
              />
              <div className="p-3">
                {notes.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No notes yet"
                    subtitle="Share study materials with your students"
                    action={{ label: 'Add Notes', onClick: () => router.push('/staff/notes/create') }}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {notes.map((note: any) => (
                      <button
                        key={note.id}
                        onClick={() => router.push(`/staff/notes/${note.id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <BookMarked className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{note.title}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{note.subject ?? 'General'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">

            {/* Overview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Overview</h3>
                {termInfo.termName && (
                  <Badge className="text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-700 border-0 font-medium ml-auto">
                    {termInfo.termName}
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Students', value: stats.totalStudents, bg: 'bg-blue-50', text: 'text-blue-700' },
                    { label: 'Active', value: stats.activeStudents, bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    { label: 'Classes', value: stats.activeClasses, bg: 'bg-violet-50', text: 'text-violet-700' },
                    { label: 'Published', value: stats.publishedExams, bg: 'bg-teal-50', text: 'text-teal-700' },
                  ].map((item) => (
                    <div key={item.label} className={cn('rounded-xl p-3 text-center', item.bg)}>
                      <p className={cn('text-xl font-bold', item.text)}>{item.value}</p>
                      <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                {stats.classBreakdown.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Class Breakdown
                    </p>
                    <div className="space-y-2">
                      {stats.classBreakdown.slice(0, 5).map((cls) => {
                        const pct = stats.totalStudents > 0 ? Math.round((cls.count / stats.totalStudents) * 100) : 0
                        return (
                          <div key={cls.name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-slate-700">{cls.name}</span>
                              <span className="text-[11px] text-slate-400">{cls.count}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Quick Tools</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {[
                  { label: 'Attendance', icon: CalendarDays, href: '/staff/attendance', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'CA Scores', icon: Calculator, href: '/staff/ca-scores', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Report Cards', icon: FileCheck, href: '/staff/report-cards', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'All Students', icon: Users, href: '/staff/students', color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    onClick={() => router.push(tool.href)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', tool.bg)}>
                      <tool.icon className={cn('h-3.5 w-3.5', tool.color)} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">{tool.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Term Activity */}
            {termInfo.weekProgress > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-300">Term Activity</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Exams Created', value: stats.totalExams, max: 10, color: 'from-blue-500 to-indigo-500' },
                    { label: 'Assignments', value: stats.totalAssignments, max: 10, color: 'from-violet-500 to-purple-500' },
                    { label: 'Notes Shared', value: stats.totalNotes, max: 10, color: 'from-emerald-500 to-teal-500' },
                  ].map((item) => {
                    const pct = Math.min((item.value / item.max) * 100, 100)
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-slate-400">{item.label}</span>
                          <span className="text-[11px] font-semibold text-white">{item.value}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className={cn('h-1.5 rounded-full bg-gradient-to-r transition-all', item.color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Refresh Indicator ─────────────────────────────────── */}
      {refreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full shadow-xl text-xs font-medium">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
          Refreshing...
        </div>
      )}
    </div>
  )
}