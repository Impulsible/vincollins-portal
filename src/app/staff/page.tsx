// app/staff/page.tsx - FIXED: Correct column names and queries
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
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
  totalStudents: number; activeStudents: number; activeClasses: number
  pendingCAScores: number; publishedExams: number; totalExams: number
  totalAssignments: number; totalNotes: number; reportCardsGenerated: number
  averagePerformance: number; classBreakdown: { name: string; count: number }[]
  pendingTheoryCount: number; pendingTheorySubmissions: any[]; recentSubmissions: any[]
}

interface DashboardData { exams: any[]; assignments: any[]; notes: any[]; stats: DashboardStats }

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
// LOADING SPINNER
// ============================================
function PreparingWorkspace() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
          <Briefcase className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Preparing Your Workspace</h2>
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    </div>
  )
}

// ============================================
// MAIN CONTENT
// ============================================
function StaffDashboardContent() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading } = useUser()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const hasLoadedOnce = useRef(false)

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

  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) throw new Error('Not authenticated')

    // ============================================
    // STEP 1: Fetch basic data in parallel
    // ============================================
    const results = await Promise.allSettled([
      supabase.from('exams')
        .select('id, title, subject, class, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('assignments')
        .select('id, title, subject_id, class_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('notes')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase.from('profiles')
        .select('class, is_active')
        .eq('role', 'student'),
      supabase.from('exam_attempts')
        .select('exam_id, student_name, submitted_at, id, status, total_score, percentage')
        .eq('status', 'pending_theory')
        .order('submitted_at', { ascending: false })
        .limit(20)
    ])

    const examsResult = results[0].status === 'fulfilled' ? results[0].value : { data: [], error: results[0].reason }
    const assignmentsResult = results[1].status === 'fulfilled' ? results[1].value : { data: [], error: results[1].reason }
    const notesResult = results[2].status === 'fulfilled' ? results[2].value : { data: [], error: results[2].reason }
    const studentsResult = results[3].status === 'fulfilled' ? results[3].value : { data: [], error: results[3].reason }
    const submissionsResult = results[4].status === 'fulfilled' ? results[4].value : { data: [], error: results[4].reason }

    if (examsResult.error) console.warn('⚠️ Exams:', examsResult.error)
    if (assignmentsResult.error) console.warn('⚠️ Assignments:', assignmentsResult.error)
    if (notesResult.error) console.warn('⚠️ Notes:', notesResult.error)
    if (studentsResult.error) console.warn('⚠️ Students:', studentsResult.error)
    if (submissionsResult.error) console.warn('⚠️ Submissions:', submissionsResult.error)

    const examData = examsResult?.data || []
    const assignmentData = assignmentsResult?.data || []
    const notesData = notesResult?.data || []
    const studentsData = studentsResult?.data || []
    const recentSubmissions = submissionsResult?.data || []

    // ============================================
    // STEP 2: Enrich assignments with subject/class names
    // ============================================
    let subjectMap: Record<string, string> = {}
    const assignmentSubjectIds = [...new Set(assignmentData.map((a: any) => a.subject_id).filter(Boolean))]
    if (assignmentSubjectIds.length > 0) {
      try {
        const { data: subjects } = await supabase.from('subjects').select('id, name').in('id', assignmentSubjectIds)
        subjects?.forEach((s: any) => { subjectMap[s.id] = s.name })
      } catch (e) {}
    }

    let classMapForAssignments: Record<string, string> = {}
    const assignmentClassIds = [...new Set(assignmentData.map((a: any) => a.class_id).filter(Boolean))]
    if (assignmentClassIds.length > 0) {
      try {
        const { data: classes } = await supabase.from('classes').select('id, name').in('id', assignmentClassIds)
        classes?.forEach((c: any) => { classMapForAssignments[c.id] = c.name })
      } catch (e) {}
    }

    const enrichedAssignments = assignmentData.map((a: any) => ({
      ...a,
      subject: subjectMap[a.subject_id] || 'Unknown',
      class: classMapForAssignments[a.class_id] || 'Unknown'
    }))

    // ============================================
    // STEP 3: Enrich submissions with exam titles
    // ============================================
    const submissionExamIds = [...new Set(recentSubmissions.map((s: any) => s.exam_id))]
    const examTitleMap: Record<string, any> = {}
    if (submissionExamIds.length > 0) {
      try {
        const { data: details } = await supabase.from('exams').select('id, title, subject, class').in('id', submissionExamIds)
        details?.forEach((e: any) => { examTitleMap[e.id] = e })
      } catch (e) {}
    }

    const enrichedSubmissions = recentSubmissions.map((s: any) => ({
      ...s,
      exam_title: examTitleMap[s.exam_id]?.title || 'Unknown Exam',
      exam_subject: examTitleMap[s.exam_id]?.subject || '',
      exam_class: examTitleMap[s.exam_id]?.class || ''
    }))

    // Class breakdown
    const classMap = new Map<string, number>()
    studentsData.forEach((s: any) => { 
      if (s.class) classMap.set(s.class, (classMap.get(s.class) || 0) + 1) 
    })

    // ============================================
    // ✅ STEP 4: TEACHER-SPECIFIC AVERAGE PERFORMANCE
    // Fixed: Use correct column names
    // - ca_scores likely has 'student_id' not 'exam_id'
    // - exam_attempts uses 'status' not 'total_score' for null check
    // ============================================
    const teacherExamIds = examData.map((e: any) => e.id)
    let averagePerformance = 0

    if (teacherExamIds.length > 0) {
      try {
        // ✅ Fetch exam_attempts for this teacher's exams
        // Only get graded ones (not pending_theory)
        const { data: scoredAttempts, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select('total_score, percentage, exam_id')
          .in('exam_id', teacherExamIds)
          .neq('status', 'pending_theory')
          .limit(10000)

        if (attemptsError) {
          console.warn('⚠️ exam_attempts query error:', attemptsError)
        }

        // ✅ Try ca_scores - it might use different column names
        // Try without exam_id filter first to see if table exists
        let caScoresData: any[] = []
        try {
          // First try with exam_id (might fail)
          const { data: ca1, error: caError1 } = await supabase
            .from('ca_scores')
            .select('*')
            .limit(1)
          
          if (!caError1 && ca1 && ca1.length > 0) {
            // Table exists, check what columns it has
            const sampleRow = ca1[0]
            console.log('📊 ca_scores sample row:', Object.keys(sampleRow))
            
            // If it has exam_id, filter by it
            if ('exam_id' in sampleRow) {
              const { data: ca2 } = await supabase
                .from('ca_scores')
                .select('total_score, exam_id')
                .in('exam_id', teacherExamIds)
                .limit(10000)
              caScoresData = ca2 || []
            }
            // If it has no exam_id, try without filter (all CA scores are teacher-specific via RLS?)
            else {
              const { data: ca3 } = await supabase
                .from('ca_scores')
                .select('*')
                .limit(10000)
              caScoresData = ca3 || []
            }
          }
        } catch (e) {
          console.warn('⚠️ ca_scores table might not exist or have different schema:', e)
        }

        const scoredAttemptsList = scoredAttempts || []
        const caScoresList = caScoresData || []

        console.log('📊 [AVG PERF DEBUG]:', {
          teacherExamIds,
          scoredAttemptsCount: scoredAttemptsList.length,
          caScoresCount: caScoresList.length
        })

        // Collect all valid scores
        const allScores: number[] = []

        scoredAttemptsList.forEach((s: any) => {
          const score = s.percentage || s.total_score || 0
          if (score > 0) allScores.push(score)
        })

        caScoresList.forEach((s: any) => {
          const score = s.total_score || s.score || 0
          if (score > 0) allScores.push(score)
        })

        console.log('📊 [AVG PERF RESULT]:', {
          allScoresCount: allScores.length,
          firstFive: allScores.slice(0, 5),
          average: allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : 0
        })

        if (allScores.length > 0) {
          averagePerformance = Math.round(
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length
          )
        }
      } catch (e) {
        console.warn('⚠️ Failed to calculate average performance:', e)
      }
    }

    const stats: DashboardStats = {
      totalStudents: studentsData.length,
      activeStudents: studentsData.filter((s: any) => s.is_active !== false).length,
      activeClasses: classMap.size,
      pendingCAScores: enrichedSubmissions.length,
      publishedExams: examData.filter((e: any) => e.status === 'published').length,
      totalExams: examData.length,
      totalAssignments: assignmentData.length,
      totalNotes: notesData.length,
      reportCardsGenerated: 0,
      averagePerformance,
      classBreakdown: Array.from(classMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      pendingTheoryCount: enrichedSubmissions.length,
      pendingTheorySubmissions: enrichedSubmissions,
      recentSubmissions: enrichedSubmissions
    }

    return { exams: examData, assignments: enrichedAssignments, notes: notesData, stats }
  }, [])

  useEffect(() => {
    if (authLoading || !contextUser?.id) return
    let cancelled = false

    const loadData = async () => {
      setDataLoading(true)
      setLoadError(null)
      try {
        const data = await fetchDashboardData()
        if (!cancelled) {
          setDashboardData(data)
          hasLoadedOnce.current = true
          setDataLoading(false)
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('❌ Dashboard load error:', error)
          setLoadError(error?.message || 'Failed to load dashboard')
          setDataLoading(false)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [contextUser?.id, authLoading, fetchDashboardData])

  const exams = dashboardData?.exams || []
  const assignments = dashboardData?.assignments || []
  const notes = dashboardData?.notes || []
  const stats = dashboardData?.stats || DEFAULT_STATS

  const handleRefresh = async () => {
    setRefreshing(true)
    setLoadError(null)
    try {
      const data = await fetchDashboardData()
      setDashboardData(data)
      toast.success('Dashboard refreshed')
    } catch (error: any) {
      toast.error(error?.message || 'Refresh failed')
    }
    setRefreshing(false)
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

  if (authLoading || dataLoading) {
    return <PreparingWorkspace />
  }

  if (loadError && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Failed to Load Dashboard</h2>
          <p className="text-sm text-slate-500 mb-4">{loadError}</p>
          <Button onClick={handleRefresh} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
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

        {/* Pending Submissions */}
        {stats.recentSubmissions.length > 0 && (
          <div className="mt-4 p-4 bg-white dark:bg-slate-900 border rounded-lg">
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
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border hover:border-amber-300 cursor-pointer"
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

        {/* All caught up */}
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
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><MonitorPlay className="h-4 w-4 text-emerald-600" />Recent Exams</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs"><Link href="/staff/exams">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {exams.length === 0 ? (
                  <EmptyState icon={MonitorPlay} title="No exams yet" action={{ label: 'Create Exam', onClick: () => router.push('/staff/exams') }} />
                ) : (
                  <div className="divide-y">
                    {exams.slice(0, 4).map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                        onClick={() => router.push(`/staff/exams/${exam.id}/submissions`)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-blue-50 rounded"><MonitorPlay className="h-4 w-4 text-blue-600" /></div>
                          <div className="min-w-0"><p className="text-sm font-medium truncate">{exam.title}</p><p className="text-xs text-muted-foreground">{exam.subject} · {exam.class}</p></div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">{exam.status || 'draft'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" />Recent Assignments</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs"><Link href="/staff/assignments">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {assignments.length === 0 ? (
                  <EmptyState icon={FileText} title="No assignments" action={{ label: 'New Assignment', onClick: () => router.push('/staff/assignments/create') }} />
                ) : (
                  <div className="divide-y">
                    {assignments.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                        onClick={() => router.push(`/staff/assignments/${item.id}`)}>
                        <div className="p-1.5 bg-emerald-50 rounded"><FileText className="h-4 w-4 text-emerald-600" /></div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.subject} · {item.class}</p></div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><BookOpen className="h-4 w-4 text-purple-600" />Study Notes</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs"><Link href="/staff/notes">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {notes.length === 0 ? (
                  <EmptyState icon={BookOpen} title="No notes yet" action={{ label: 'Add Notes', onClick: () => router.push('/staff/notes/create') }} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {notes.map((note) => (
                      <div key={note.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:border-purple-200 cursor-pointer transition-colors"
                        onClick={() => router.push(`/staff/notes/${note.id}`)}>
                        <div className="p-1.5 bg-purple-50 rounded"><BookOpen className="h-4 w-4 text-purple-600" /></div>
                        <div className="min-w-0"><p className="text-sm font-medium truncate">{note.title}</p><p className="text-xs text-muted-foreground">General</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" />Overview</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-semibold">{stats.totalStudents}</p><p className="text-xs text-muted-foreground">Students</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-semibold">{stats.activeClasses}</p><p className="text-xs text-muted-foreground">Classes</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-semibold">{stats.activeStudents}</p><p className="text-xs text-muted-foreground">Active</p></div>
                  <div className="p-3 bg-amber-50 rounded-lg"><p className="text-2xl font-semibold text-amber-700">{stats.recentSubmissions.length}</p><p className="text-xs text-amber-600">Need Grading</p></div>
                </div>
                {stats.classBreakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">CLASS BREAKDOWN</p>
                    <div className="space-y-1">
                      {stats.classBreakdown.slice(0, 5).map((cls) => (
                        <div key={cls.name} className="flex justify-between items-center py-1"><span className="text-sm">{cls.name}</span><span className="text-sm text-muted-foreground">{cls.count}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">Performance</span><span className="font-medium">{stats.averagePerformance}%</span></div>
                  <Progress value={stats.averagePerformance} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
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

export default function StaffDashboardPage() {
  return (
    <AuthGuard allowedRoles={['staff', 'admin', 'teacher']}>
      <StaffDashboardContent />
    </AuthGuard>
  )
}