// app/staff/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  RefreshCw, AlertTriangle,
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

// ── Constants ─────────────────────────────────────────────────────────────────
const TERM_START = new Date('2026-05-04')
const TERM_END = new Date('2026-08-01')
const TOTAL_WEEKS = 13
const CACHE_KEY = 'staff_dashboard_cache'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0,
  activeStudents: 0,
  activeClasses: 0,
  pendingCAScores: 0,
  publishedExams: 0,
  totalExams: 0,
  totalAssignments: 0,
  totalNotes: 0,
  reportCardsGenerated: 0,
  averagePerformance: 0,
  classBreakdown: [],
  pendingTheoryCount: 0,
  pendingTheorySubmissions: [],
  recentSubmissions: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readCache(): DashboardData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null // expired
    return data as DashboardData
  } catch {
    return null
  }
}

function writeCache(data: DashboardData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

function formatDate(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="text-center py-8">
      <Icon className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{title}</p>
      {action && (
        <Button size="sm" variant="outline" onClick={action.onClick}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="h-7 w-7 text-emerald-600" />
          </div>
        </div>
        <p className="mt-4 text-slate-600 text-lg font-medium">
          Loading Staff Dashboard...
        </p>
        <p className="mt-2 text-slate-500 text-sm">
          Preparing your teaching workspace 📚
        </p>
      </div>
    </div>
  )
}

function TimeoutScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center px-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Taking too long
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Check your connection and try again
        </p>
        <Button
          onClick={onRetry}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  )
}

// ── Data fetcher (shared between initial load and refresh) ────────────────────
async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Step 1: Get teacher's exam IDs — needed for theory/grading queries
  const { data: teacherExams } = await supabase
    .from('exams')
    .select('id')
    .eq('created_by', userId)

  const teacherExamIds = (teacherExams ?? []).map((e: any) => e.id)

  // Step 2: Parallel fetches — all independent queries run together
  const [
    examsRes,
    assignmentsRes,
    notesRes,
    studentsRes,
    submissionsRes,
    scoredAttemptsRes,
  ] = await Promise.allSettled([

    // ── Exams ──────────────────────────────────────────────────────────────
    supabase
      .from('exams')
      .select('id, title, subject, class, status, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(10),

    // ── Assignments ────────────────────────────────────────────────────────
    supabase
      .from('assignments')
      .select('id, title, subject, class, classes, status, due_date, total_points, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(5),

    // ── Notes — ONLY columns that exist in the notes table ─────────────────
    // ✅ No session_year filter (column doesn't exist)
    // ✅ No select('*') — explicit safe columns only
    supabase
      .from('notes')
      .select('id, title, subject, status, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(4),

    // ── Students ───────────────────────────────────────────────────────────
    supabase
      .from('profiles')
      .select('class, is_active')
      .eq('role', 'student'),

    // ── Pending theory submissions (teacher's exams only) ──────────────────
    teacherExamIds.length > 0
      ? supabase
          .from('exam_attempts')
          .select('id, exam_id, student_name, submitted_at, status, total_score, percentage')
          .eq('status', 'pending_theory')
          .in('exam_id', teacherExamIds)
          .order('submitted_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),

    // ── Graded scores for performance average ──────────────────────────────
    teacherExamIds.length > 0
      ? supabase
          .from('exam_attempts')
          .select('percentage')
          .in('exam_id', teacherExamIds)
          .eq('status', 'graded')
          .limit(10000)
      : Promise.resolve({ data: [], error: null }),
  ])

  // ── Unpack results safely ─────────────────────────────────────────────────
  const exams =
    examsRes.status === 'fulfilled' && !examsRes.value.error
      ? examsRes.value.data ?? []
      : []

  const rawAssignments =
    assignmentsRes.status === 'fulfilled' && !assignmentsRes.value.error
      ? assignmentsRes.value.data ?? []
      : []

  // ✅ Notes: handle 400 gracefully with a fallback to minimal columns
  let notes: any[] = []
  if (notesRes.status === 'fulfilled') {
    if (notesRes.value.error) {
      console.error('[StaffPage] Notes query error:', notesRes.value.error.message)
      // Fallback — bare minimum columns that definitely exist
      const { data: fallbackNotes } = await supabase
        .from('notes')
        .select('id, title, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(4)
      notes = fallbackNotes ?? []
    } else {
      notes = notesRes.value.data ?? []
    }
  }

  const students =
    studentsRes.status === 'fulfilled' && !studentsRes.value.error
      ? studentsRes.value.data ?? []
      : []

  const submissions =
    submissionsRes.status === 'fulfilled' && !submissionsRes.value.error
      ? submissionsRes.value.data ?? []
      : []

  const scoredAttempts =
    scoredAttemptsRes.status === 'fulfilled' && !scoredAttemptsRes.value.error
      ? scoredAttemptsRes.value.data ?? []
      : []

  // ── Enrich submissions with exam details ──────────────────────────────────
  let enrichedSubmissions: any[] = []
  if (submissions.length > 0) {
    const submissionExamIds = [...new Set(submissions.map((s: any) => s.exam_id))]
    const { data: examDetails } = await supabase
      .from('exams')
      .select('id, title, subject, class')
      .in('id', submissionExamIds)

    const examMap: Record<string, any> = {}
    examDetails?.forEach((e: any) => { examMap[e.id] = e })

    enrichedSubmissions = submissions.map((s: any) => ({
      ...s,
      exam_title: examMap[s.exam_id]?.title ?? 'Unknown Exam',
      exam_subject: examMap[s.exam_id]?.subject ?? '',
      exam_class: examMap[s.exam_id]?.class ?? '',
    }))
  }

  // ── Class breakdown ───────────────────────────────────────────────────────
  const classMap = new Map<string, number>()
  students.forEach((s: any) => {
    if (s.class) classMap.set(s.class, (classMap.get(s.class) ?? 0) + 1)
  })

  // ── Average performance ───────────────────────────────────────────────────
  const scores = (scoredAttempts as any[])
    .map((s) => s.percentage ?? 0)
    .filter((n) => n > 0)

  const averagePerformance =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

  // ── Enrich assignments ────────────────────────────────────────────────────
  const assignments = rawAssignments.map((a: any) => ({
    ...a,
    displaySubject: a.subject ?? 'No Subject',
    displayClass: a.class ?? a.classes?.[0] ?? 'No Class',
  }))

  // ── Build stats ───────────────────────────────────────────────────────────
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
    classBreakdown: Array.from(classMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    pendingTheoryCount: enrichedSubmissions.length,
    pendingTheorySubmissions: enrichedSubmissions,
    recentSubmissions: enrichedSubmissions,
  }

  return { exams, assignments, notes, stats }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StaffDashboardPage() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    () => (typeof window !== 'undefined' ? readCache() : null)
  )
  const [loading, setLoading] = useState(!readCache())
  const [timedOut, setTimedOut] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ── Term info ──────────────────────────────────────────────────────────────
  const termInfo = useMemo(() => {
    const now = new Date()
    if (now < TERM_START) {
      return {
        termName: 'Third Term', sessionYear: '2025/2026',
        currentWeek: 0, totalWeeks: TOTAL_WEEKS,
        weekProgress: 0, displayWeek: 'Starts May 4',
      }
    }
    if (now > TERM_END) {
      return {
        termName: 'Third Term', sessionYear: '2025/2026',
        currentWeek: TOTAL_WEEKS, totalWeeks: TOTAL_WEEKS,
        weekProgress: 100, displayWeek: 'Term Ended',
      }
    }
    const elapsed = now.getTime() - TERM_START.getTime()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const currentWeek = Math.min(Math.floor(elapsed / weekMs) + 1, TOTAL_WEEKS)
    return {
      termName: 'Third Term', sessionYear: '2025/2026',
      currentWeek, totalWeeks: TOTAL_WEEKS,
      weekProgress: (currentWeek / TOTAL_WEEKS) * 100,
      displayWeek: `Week ${currentWeek}/${TOTAL_WEEKS}`,
    }
  }, [])

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(
    async (userId: string, showToast = false) => {
      try {
        setRefreshing(true)

        // 10 second timeout
        timeoutRef.current = setTimeout(() => {
          if (loading) setTimedOut(true)
        }, 10000)

        const data = await fetchDashboardData(userId)
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
    },
    [loading]
  )

  // ── Auth guard + initial fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !contextUser?.id) {
      router.replace('/portal')
      return
    }

    const role = contextUser.role?.toLowerCase()
    if (!['staff', 'teacher', 'admin'].includes(role ?? '')) {
      router.replace('/portal')
      return
    }

    if (fetchedRef.current) return
    fetchedRef.current = true
    loadData(contextUser.id)
  }, [authLoading, isAuthenticated, contextUser, router, loadData])

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // ── Refresh handler ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (!contextUser?.id || refreshing) return
    fetchedRef.current = false
    await loadData(contextUser.id, true)
    fetchedRef.current = true
  }, [contextUser?.id, refreshing, loadData])

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (authLoading) return <LoadingScreen />
  if (!isAuthenticated || !contextUser) return null

  const role = contextUser.role?.toLowerCase()
  if (!['staff', 'teacher', 'admin'].includes(role ?? '')) return null

  if (loading && !dashboardData && timedOut) {
    return <TimeoutScreen onRetry={() => window.location.reload()} />
  }

  if (loading && !dashboardData) return <LoadingScreen />

  // ── Data aliases ───────────────────────────────────────────────────────────
  const exams = dashboardData?.exams ?? []
  const assignments = dashboardData?.assignments ?? []
  const notes = dashboardData?.notes ?? []
  const stats = dashboardData?.stats ?? DEFAULT_STATS

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50">
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
        termInfo={termInfo}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-8">

        {/* Refreshing indicator */}
        {refreshing && (
          <div className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-lg px-3 py-1.5 flex items-center gap-2 text-xs text-slate-500 border">
            <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
            Refreshing...
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 sm:mt-5 flex-wrap">
          <Button
            size="sm"
            onClick={() => router.push('/staff/exams')}
            className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />New Exam
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/staff/assignments/create')}
            variant="outline"
            className="h-9 text-sm"
          >
            <FileText className="h-4 w-4 mr-1.5" />Assignment
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/staff/notes/create')}
            variant="outline"
            className="h-9 text-sm"
          >
            <BookOpen className="h-4 w-4 mr-1.5" />Notes
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/staff/ca-scores')}
            variant="outline"
            className="h-9 text-sm"
          >
            <Calculator className="h-4 w-4 mr-1.5" />CA Scores
          </Button>
          <Button
            size="sm"
            onClick={handleRefresh}
            variant="ghost"
            className="h-9 text-sm ml-auto"
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>

        {/* Pending theory submissions */}
        {stats.recentSubmissions.length > 0 && (
          <div className="mt-4 p-4 bg-white border rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Pending Submissions
                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  {stats.recentSubmissions.length}
                </Badge>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {stats.recentSubmissions.slice(0, 6).map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border hover:border-amber-300 cursor-pointer transition-colors"
                  onClick={() =>
                    router.push(
                      `/staff/exams/${sub.exam_id}/submissions/${sub.id}`
                    )
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {sub.student_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sub.exam_title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500">
                        {formatDate(sub.submitted_at)}
                      </span>
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">
                        Needs Grading
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                  >
                    Grade
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All caught up */}
        {stats.recentSubmissions.length === 0 && stats.totalExams > 0 && (
          <div className="mt-4 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">All caught up!</p>
            <p className="text-xs text-emerald-600 mt-1">
              No pending submissions to grade
            </p>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Recent Exams */}
            <Card className="shadow-sm">
              <CardHeader className="flex-row items-center justify-between py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MonitorPlay className="h-4 w-4 text-emerald-600" />
                  Recent Exams
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link href="/staff/exams">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-3">
                {exams.length === 0 ? (
                  <EmptyState
                    icon={MonitorPlay}
                    title="No exams yet"
                    action={{
                      label: 'Create Exam',
                      onClick: () => router.push('/staff/exams'),
                    }}
                  />
                ) : (
                  <div className="divide-y">
                    {exams.slice(0, 4).map((exam: any) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                        onClick={() =>
                          router.push(`/staff/exams/${exam.id}/submissions`)
                        }
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-blue-50 rounded flex-shrink-0">
                            <MonitorPlay className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {exam.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exam.subject} · {exam.class}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0 ml-2 capitalize"
                        >
                          {exam.status ?? 'draft'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Assignments */}
            <Card className="shadow-sm">
              <CardHeader className="flex-row items-center justify-between py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Recent Assignments
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link href="/staff/assignments">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-3">
                {assignments.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No assignments yet"
                    action={{
                      label: 'New Assignment',
                      onClick: () => router.push('/staff/assignments/create'),
                    }}
                  />
                ) : (
                  <div className="divide-y">
                    {assignments.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                        onClick={() =>
                          router.push(`/staff/assignments/${item.id}`)
                        }
                      >
                        <div className="p-1.5 bg-emerald-50 rounded flex-shrink-0">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.displaySubject} · {item.displayClass}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Notes */}
            <Card className="shadow-sm">
              <CardHeader className="flex-row items-center justify-between py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Study Notes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link href="/staff/notes">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-3">
                {notes.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No notes yet"
                    action={{
                      label: 'Add Notes',
                      onClick: () => router.push('/staff/notes/create'),
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {notes.map((note: any) => (
                      <div
                        key={note.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border hover:border-purple-200 cursor-pointer transition-colors"
                        onClick={() => router.push(`/staff/notes/${note.id}`)}
                      >
                        <div className="p-1.5 bg-purple-50 rounded flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {note.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {note.subject ?? 'General'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Overview */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-semibold">
                      {stats.totalStudents}
                    </p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-semibold">
                      {stats.activeClasses}
                    </p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-semibold">
                      {stats.activeStudents}
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-semibold text-amber-700">
                      {stats.recentSubmissions.length}
                    </p>
                    <p className="text-xs text-amber-600">Need Grading</p>
                  </div>
                </div>

                {stats.classBreakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Class Breakdown
                    </p>
                    <div className="space-y-1">
                      {stats.classBreakdown.slice(0, 5).map((cls) => (
                        <div
                          key={cls.name}
                          className="flex justify-between items-center py-1"
                        >
                          <span className="text-sm">{cls.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {cls.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      Avg Performance
                    </span>
                    <span className="font-semibold">
                      {stats.averagePerformance}%
                    </span>
                  </div>
                  <Progress
                    value={stats.averagePerformance}
                    className="h-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 text-sm"
                  onClick={() => router.push('/staff/ca-scores')}
                >
                  <Calculator className="h-4 w-4 mr-2 text-amber-600" />
                  CA Scores
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 text-sm"
                  onClick={() => router.push('/staff/report-cards')}
                >
                  <FileCheck className="h-4 w-4 mr-2 text-blue-600" />
                  Report Cards
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 text-sm"
                  onClick={() => router.push('/staff/students')}
                >
                  <Users className="h-4 w-4 mr-2 text-emerald-600" />
                  All Students
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}