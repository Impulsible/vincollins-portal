// app/staff/page.tsx - COMPLETE UPDATED VERSION WITH TEACHER-SPECIFIC SUBMISSIONS
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
  Loader2, Calculator, Plus,
  GraduationCap, FileCheck, Clock, Briefcase,
  ChevronRight, CheckCircle2, RefreshCw, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// ============================================
// TYPES & CONSTANTS
// ============================================
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

const TERM_START = new Date('2026-05-04')
const TERM_END = new Date('2026-08-01')
const TOTAL_WEEKS = 13

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0, activeStudents: 0, activeClasses: 0,
  pendingCAScores: 0, publishedExams: 0, totalExams: 0,
  totalAssignments: 0, totalNotes: 0, reportCardsGenerated: 0,
  averagePerformance: 0, classBreakdown: [],
  pendingTheoryCount: 0, pendingTheorySubmissions: [], recentSubmissions: []
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ icon: Icon, title, action }: { icon: any; title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="text-center py-8">
      <Icon className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{title}</p>
      {action && (
        <Button size="sm" variant="outline" onClick={action.onClick}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />{action.label}
        </Button>
      )}
    </div>
  )
}

// ============================================
// TIMEOUT ERROR
// ============================================
function LoadingTimeoutError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center px-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Taking too long</h3>
        <p className="text-sm text-slate-500 mb-4">Tap retry to load faster</p>
        <Button onClick={onRetry} className="bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT - INSTANT RENDER with cached data
// ============================================
function StaffDashboardContent() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(() => {
    // ✅ INSTANT: Load from cache immediately on first render
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('staff_dashboard_cache')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch (e) {
          return null
        }
      }
    }
    return null
  })
  
  const [loading, setLoading] = useState(!dashboardData)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const dataFetchedRef = useRef(false)
  const redirectCheckedRef = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const termInfo = useMemo(() => {
    const now = new Date()
    let currentWeek = 0, weekProgress = 0, displayWeek = ''
    if (now < TERM_START) { displayWeek = 'Starts May 4' }
    else if (now > TERM_END) { currentWeek = TOTAL_WEEKS; weekProgress = 100; displayWeek = 'Term Ended' }
    else {
      const elapsed = now.getTime() - TERM_START.getTime()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      currentWeek = Math.min(Math.floor(elapsed / weekMs) + 1, TOTAL_WEEKS)
      weekProgress = (currentWeek / TOTAL_WEEKS) * 100
      displayWeek = `Week ${currentWeek}/${TOTAL_WEEKS}`
    }
    return { termName: 'Third Term', sessionYear: '2025/2026', currentWeek, totalWeeks: TOTAL_WEEKS, weekProgress, displayWeek }
  }, [])

  // ✅ Integrated auth check
  useEffect(() => {
    if (redirectCheckedRef.current) return
    
    if (!authLoading) {
      redirectCheckedRef.current = true
      
      if (!isAuthenticated || !contextUser) {
        router.replace('/portal')
        return
      }
      
      const userRole = contextUser.role?.toLowerCase()
      const allowedRoles = ['staff', 'teacher', 'admin']
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.replace('/portal')
        return
      }
    }
  }, [authLoading, isAuthenticated, contextUser, router])

  // ✅ Fetch data in background - doesn't block rendering
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !contextUser?.id) return
    
    const userRole = contextUser.role?.toLowerCase()
    if (userRole !== 'staff' && userRole !== 'teacher' && userRole !== 'admin') return
    
    if (dataFetchedRef.current) return

    const fetchData = async () => {
      dataFetchedRef.current = true
      setRefreshing(true)
      
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) setLoadingTimeout(true)
      }, 10000)
      
      try {
        const userId = contextUser.id

        // Fetch exams created by this teacher
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('id, title, subject, class, status, created_at')
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        // Fetch assignments created by this teacher
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, title, subject, class, classes, status, due_date, total_points, created_at')
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        // Fetch notes created by this teacher
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('id, title, created_at')
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
          .limit(4)

        // Fetch students (all students for stats)
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('class, is_active')
          .eq('role', 'student')

        // ✅ FIXED: Only fetch pending theory submissions for exams created by this teacher
        const teacherExamIds = examData?.map(e => e.id) || []
        
        let submissions: any[] = []
        let examTitleMap: Record<string, any> = {}

        if (teacherExamIds.length > 0) {
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('exam_attempts')
            .select('exam_id, student_name, submitted_at, id, status, total_score, percentage')
            .eq('status', 'pending_theory')
            .in('exam_id', teacherExamIds)
            .order('submitted_at', { ascending: false })
            .limit(20)

          if (!submissionsError && submissionsData) {
            submissions = submissionsData
            
            const submissionExamIds = [...new Set(submissions.map((s: any) => s.exam_id))]
            if (submissionExamIds.length > 0) {
              const { data: examDetails } = await supabase
                .from('exams')
                .select('id, title, subject, class')
                .in('id', submissionExamIds)
              examDetails?.forEach((e: any) => { examTitleMap[e.id] = e })
            }
          }
        }

        const enrichedSubmissions = submissions.map((s: any) => ({
          ...s,
          exam_title: examTitleMap[s.exam_id]?.title || 'Unknown Exam',
          exam_subject: examTitleMap[s.exam_id]?.subject || '',
          exam_class: examTitleMap[s.exam_id]?.class || ''
        }))

        // Handle potential errors but don't crash
        const exams = examError ? [] : examData || []
        const assignments = assignmentError ? [] : assignmentData || []
        const notes = notesError ? [] : notesData || []
        const students = studentsError ? [] : studentsData || []

        // Calculate class breakdown
        const classMap = new Map<string, number>()
        students.forEach((s: any) => { 
          if (s.class) classMap.set(s.class, (classMap.get(s.class) || 0) + 1) 
        })

        // Calculate average performance from this teacher's graded exams
        let averagePerformance = 0
        if (teacherExamIds.length > 0) {
          const { data: scoredAttempts } = await supabase
            .from('exam_attempts')
            .select('percentage')
            .in('exam_id', teacherExamIds)
            .eq('status', 'graded')
            .limit(10000)

          const allScores: number[] = []
          scoredAttempts?.forEach((s: any) => {
            const score = s.percentage || 0
            if (score > 0) allScores.push(score)
          })

          if (allScores.length > 0) {
            averagePerformance = Math.round(
              allScores.reduce((sum, score) => sum + score, 0) / allScores.length
            )
          }
        }

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
          recentSubmissions: enrichedSubmissions
        }

        // Enrich assignments
        const enrichedAssignments = assignments.map((a: any) => ({
          ...a,
          displaySubject: a.subject || 'No Subject',
          displayClass: a.class || (a.classes && a.classes[0]) || 'No Class'
        }))

        const newData = { 
          exams, 
          assignments: enrichedAssignments, 
          notes, 
          stats 
        }
        
        setDashboardData(newData)
        setLoading(false)
        
        // Cache for instant loading next time
        localStorage.setItem('staff_dashboard_cache', JSON.stringify(newData))
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setRefreshing(false)
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
      }
    }

    fetchData()

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
    }
  }, [contextUser?.id, authLoading, isAuthenticated, contextUser?.role, loading])

  const exams = dashboardData?.exams || []
  const assignments = dashboardData?.assignments || []
  const notes = dashboardData?.notes || []
  const stats = dashboardData?.stats || DEFAULT_STATS

  const handleRefresh = async () => {
    if (!isAuthenticated || !contextUser?.id) return
    
    setRefreshing(true)
    dataFetchedRef.current = false
    try {
      const userId = contextUser.id

      // Get teacher's exams first
      const { data: teacherExams } = await supabase
        .from('exams')
        .select('id')
        .eq('created_by', userId)
      
      const teacherExamIds = teacherExams?.map(e => e.id) || []

      // Fetch exams
      const { data: examData } = await supabase
        .from('exams')
        .select('id, title, subject, class, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch assignments
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('id, title, subject, class, classes, status, due_date, total_points, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('id, title, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(4)

      // Fetch students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('class, is_active')
        .eq('role', 'student')

      // ✅ FIXED: Only fetch submissions for teacher's exams
      let submissions: any[] = []
      let examTitleMap: Record<string, any> = {}

      if (teacherExamIds.length > 0) {
        const { data: submissionsData } = await supabase
          .from('exam_attempts')
          .select('exam_id, student_name, submitted_at, id, status, total_score, percentage')
          .eq('status', 'pending_theory')
          .in('exam_id', teacherExamIds)
          .order('submitted_at', { ascending: false })
          .limit(20)

        if (submissionsData) {
          submissions = submissionsData
          
          const submissionExamIds = [...new Set(submissions.map((s: any) => s.exam_id))]
          if (submissionExamIds.length > 0) {
            const { data: examDetails } = await supabase
              .from('exams')
              .select('id, title, subject, class')
              .in('id', submissionExamIds)
            examDetails?.forEach((e: any) => { examTitleMap[e.id] = e })
          }
        }
      }

      const enrichedSubmissions = submissions.map((s: any) => ({
        ...s,
        exam_title: examTitleMap[s.exam_id]?.title || 'Unknown Exam',
        exam_subject: examTitleMap[s.exam_id]?.subject || '',
        exam_class: examTitleMap[s.exam_id]?.class || ''
      }))

      const exams = examData || []
      const assignments = assignmentData || []
      const notes = notesData || []
      const students = studentsData || []

      // Calculate class breakdown
      const classMap = new Map<string, number>()
      students.forEach((s: any) => { 
        if (s.class) classMap.set(s.class, (classMap.get(s.class) || 0) + 1) 
      })

      // Calculate average performance
      let averagePerformance = 0
      if (teacherExamIds.length > 0) {
        const { data: scoredAttempts } = await supabase
          .from('exam_attempts')
          .select('percentage')
          .in('exam_id', teacherExamIds)
          .eq('status', 'graded')
          .limit(10000)

        const allScores: number[] = []
        scoredAttempts?.forEach((s: any) => {
          const score = s.percentage || 0
          if (score > 0) allScores.push(score)
        })

        if (allScores.length > 0) {
          averagePerformance = Math.round(
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length
          )
        }
      }

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
        recentSubmissions: enrichedSubmissions
      }

      const enrichedAssignments = assignments.map((a: any) => ({
        ...a,
        displaySubject: a.subject || 'No Subject',
        displayClass: a.class || (a.classes && a.classes[0]) || 'No Class'
      }))

      const newData = { exams, assignments: enrichedAssignments, notes, stats }
      setDashboardData(newData)
      localStorage.setItem('staff_dashboard_cache', JSON.stringify(newData))
      toast.success('Dashboard refreshed')
    } catch (error) {
      toast.error('Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const formatDate = (d?: string) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    } catch { return '' }
  }

  const profile = contextUser

  // Handle auth redirects
  if (!authLoading && (!isAuthenticated || !contextUser)) {
    return null
  }

  const userRole = contextUser?.role?.toLowerCase()
  if (!authLoading && userRole !== 'staff' && userRole !== 'teacher' && userRole !== 'admin') {
    return null
  }

  // Show loading only on first visit (no cache)
  if (loading && !dashboardData && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Staff Dashboard...</p>
          <p className="mt-2 text-slate-500 text-sm">Preparing your teaching workspace 📚</p>
        </div>
      </div>
    )
  }

  if (loading && loadingTimeout) {
    return <LoadingTimeoutError onRetry={() => window.location.reload()} />
  }

  // RENDER INSTANTLY - with cached or fresh data
  return (
    <div className="min-h-screen bg-slate-50/50">
      <StaffWelcomeBanner
        profile={profile}
        stats={{
          totalExams: stats.totalExams,
          publishedExams: stats.publishedExams,
          totalStudents: stats.totalStudents,
          activeStudents: stats.activeStudents,
          pendingGrading: stats.pendingCAScores,
          totalAssignments: stats.totalAssignments,
          totalNotes: stats.totalNotes,
          reportCardsGenerated: stats.reportCardsGenerated,
          averagePerformance: stats.averagePerformance
        }}
        termInfo={termInfo}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Refreshing indicator - subtle */}
        {refreshing && (
          <div className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-lg px-3 py-1.5 flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Refreshing...
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 sm:mt-5 flex-wrap">
          <Button size="sm" onClick={() => router.push('/staff/exams')} className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" />New Exam
          </Button>
          <Button size="sm" onClick={() => router.push('/staff/assignments/create')} variant="outline" className="h-9 text-sm">
            <FileText className="h-4 w-4 mr-1.5" />Assignment
          </Button>
          <Button size="sm" onClick={() => router.push('/staff/notes/create')} variant="outline" className="h-9 text-sm">
            <BookOpen className="h-4 w-4 mr-1.5" />Notes
          </Button>
          <Button size="sm" onClick={() => router.push('/staff/ca-scores')} variant="outline" className="h-9 text-sm">
            <Calculator className="h-4 w-4 mr-1.5" />CA Scores
          </Button>
          <Button size="sm" onClick={handleRefresh} variant="ghost" className="h-9 text-sm ml-auto" disabled={refreshing}>
            <Loader2 className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />Refresh
          </Button>
        </div>

        {/* Pending Submissions - Only shows teacher's own submissions */}
        {stats.recentSubmissions.length > 0 && (
          <div className="mt-4 p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Pending Submissions
                <Badge className="text-xs bg-amber-100 text-amber-700">{stats.recentSubmissions.length}</Badge>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {stats.recentSubmissions.slice(0, 6).map((sub: any) => (
                <div key={sub.id}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-md border hover:border-amber-300 cursor-pointer"
                  onClick={() => router.push(`/staff/exams/${sub.exam_id}/submissions/${sub.id}`)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sub.student_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub.exam_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500">{formatDate(sub.submitted_at)}</span>
                      <Badge className="text-[10px] bg-amber-100 text-amber-700">Needs Grading</Badge>
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 shrink-0">Grade</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All caught up - Only shows when teacher has no pending submissions */}
        {stats.recentSubmissions.length === 0 && stats.totalExams > 0 && (
          <div className="mt-4 p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">All caught up!</p>
            <p className="text-xs text-emerald-600 mt-1">No pending submissions to grade</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Recent Exams */}
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MonitorPlay className="h-4 w-4 text-emerald-600" />Recent Exams
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link href="/staff/exams">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {exams.length === 0 ? (
                  <EmptyState icon={MonitorPlay} title="No exams yet" action={{ label: 'Create Exam', onClick: () => router.push('/staff/exams') }} />
                ) : (
                  <div className="divide-y">
                    {exams.slice(0, 4).map((exam) => (
                      <div key={exam.id} 
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                        onClick={() => router.push(`/staff/exams/${exam.id}/submissions`)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-blue-50 rounded"><MonitorPlay className="h-4 w-4 text-blue-600" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{exam.title}</p>
                            <p className="text-xs text-muted-foreground">{exam.subject} · {exam.class}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">{exam.status || 'draft'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Assignments */}
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />Recent Assignments
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link href="/staff/assignments">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {assignments.length === 0 ? (
                  <EmptyState icon={FileText} title="No assignments" action={{ label: 'New Assignment', onClick: () => router.push('/staff/assignments/create') }} />
                ) : (
                  <div className="divide-y">
                    {assignments.map((item) => (
                      <div key={item.id} 
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                        onClick={() => router.push(`/staff/assignments/${item.id}`)}>
                        <div className="p-1.5 bg-emerald-50 rounded"><FileText className="h-4 w-4 text-emerald-600" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.displaySubject || item.subject || 'No Subject'} · {item.displayClass || item.class || (item.classes?.[0]) || 'No Class'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Notes */}
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />Study Notes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link href="/staff/notes">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {notes.length === 0 ? (
                  <EmptyState icon={BookOpen} title="No notes yet" action={{ label: 'Add Notes', onClick: () => router.push('/staff/notes/create') }} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {notes.map((note) => (
                      <div key={note.id} 
                        className="flex items-center gap-3 p-2.5 rounded-lg border hover:border-purple-200 cursor-pointer transition-colors"
                        onClick={() => router.push(`/staff/notes/${note.id}`)}>
                        <div className="p-1.5 bg-purple-50 rounded"><BookOpen className="h-4 w-4 text-purple-600" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{note.title}</p>
                          <p className="text-xs text-muted-foreground">General</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Overview Stats */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-semibold">{stats.totalStudents}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-semibold">{stats.activeClasses}</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-semibold">{stats.activeStudents}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-semibold text-amber-700">{stats.recentSubmissions.length}</p>
                    <p className="text-xs text-amber-600">Need Grading</p>
                  </div>
                </div>
                
                {stats.classBreakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">CLASS BREAKDOWN</p>
                    <div className="space-y-1">
                      {stats.classBreakdown.slice(0, 5).map((cls) => (
                        <div key={cls.name} className="flex justify-between items-center py-1">
                          <span className="text-sm">{cls.name}</span>
                          <span className="text-sm text-muted-foreground">{cls.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-medium">{stats.averagePerformance}%</span>
                  </div>
                  <Progress value={stats.averagePerformance} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start h-10 text-sm" onClick={() => router.push('/staff/ca-scores')}>
                  <Calculator className="h-4 w-4 mr-2 text-amber-600" />CA Scores
                </Button>
                <Button variant="outline" className="w-full justify-start h-10 text-sm" onClick={() => router.push('/staff/report-cards')}>
                  <FileCheck className="h-4 w-4 mr-2 text-blue-600" />Report Cards
                </Button>
                <Button variant="outline" className="w-full justify-start h-10 text-sm" onClick={() => router.push('/staff/students')}>
                  <Users className="h-4 w-4 mr-2 text-emerald-600" />All Students
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// EXPORT
// ============================================
export default function StaffDashboardPage() {
  return <StaffDashboardContent />
}