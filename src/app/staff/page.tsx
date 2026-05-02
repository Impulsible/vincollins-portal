// app/staff/page.tsx - PRODUCTION STAFF DASHBOARD
'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StaffWelcomeBanner from '@/components/staff/StaffWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  MonitorPlay, FileText, BookOpen, Users, ArrowRight, 
  Loader2, Calculator, Plus,
  GraduationCap, FileCheck, Briefcase, Clock, AlertCircle,
  ChevronRight, MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
}

const TERM_START = new Date('2026-05-04')
const TERM_END = new Date('2026-08-01')
const TOTAL_WEEKS = 13

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0, activeStudents: 0, activeClasses: 0,
  pendingCAScores: 0, publishedExams: 0, totalExams: 0,
  totalAssignments: 0, totalNotes: 0, reportCardsGenerated: 0,
  averagePerformance: 0, classBreakdown: [],
  pendingTheoryCount: 0, pendingTheorySubmissions: []
}

// ============================================
// SKELETON
// ============================================
function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="relative mx-auto w-fit">
          <Briefcase className="h-10 w-10 text-slate-400 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  )
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
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ============================================
// MAIN CONTENT
// ============================================
function StaffDashboardContent() {
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS)
  const [termInfo, setTermInfo] = useState({
    termName: 'Third Term', sessionYear: '2025/2026',
    currentWeek: 0, totalWeeks: TOTAL_WEEKS, weekProgress: 0, displayWeek: ''
  })

  const calculateTermWeek = useCallback(() => {
    const now = new Date()
    if (now < TERM_START) return { week: 0, progress: 0, display: 'Starts May 4' }
    if (now > TERM_END) return { week: TOTAL_WEEKS, progress: 100, display: 'Term Ended' }
    const elapsed = now.getTime() - TERM_START.getTime()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const week = Math.min(Math.floor(elapsed / weekMs) + 1, TOTAL_WEEKS)
    return { week, progress: (week / TOTAL_WEEKS) * 100, display: `Week ${week}/${TOTAL_WEEKS}` }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace('/portal'); return }
        
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        
        if (!profileData || !['staff', 'admin', 'teacher'].includes(profileData.role)) {
          toast.error('Access denied'); router.replace('/portal'); return
        }

        setProfile(profileData)
        const { week, progress, display } = calculateTermWeek()
        setTermInfo(prev => ({ ...prev, currentWeek: week, weekProgress: progress, displayWeek: display }))
        await loadDashboardData(profileData.id)
      } catch (error) {
        console.error('Init error:', error)
        router.replace('/portal')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router, calculateTermWeek])

  const loadDashboardData = async (userId: string) => {
    try {
      const [
        { data: examsData },
        { data: assignmentsData },
        { data: notesData },
        { data: studentsData },
        { data: scoresData },
        { count: pendingTheoryCount },
        { data: pendingTheoryData }
      ] = await Promise.all([
        supabase.from('exams').select('*').eq('created_by', userId).order('created_at', { ascending: false }),
        supabase.from('assignments').select('*').eq('created_by', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('ca_scores').select('total_score'),
        supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('status', 'pending_theory'),
        supabase.from('exam_attempts').select('exam_id, student_id, student_name, student_email, submitted_at, id').eq('status', 'pending_theory').order('submitted_at', { ascending: false })
      ])

      const pendingSubmissions = pendingTheoryData || []
      setExams(examsData || [])
      setAssignments(assignmentsData || [])
      setNotes(notesData || [])

      const pendingExamIds = [...new Set(pendingSubmissions.map((s: any) => s.exam_id))]
      const examTitleMap: Record<string, any> = {}
      if (pendingExamIds.length > 0) {
        const { data: details } = await supabase.from('exams').select('id, title, subject, class').in('id', pendingExamIds)
        details?.forEach((e: any) => { examTitleMap[e.id] = e })
      }

      const enrichedPending = pendingSubmissions.map((s: any) => ({
        ...s,
        exam_title: examTitleMap[s.exam_id]?.title || 'Unknown',
        exam_subject: examTitleMap[s.exam_id]?.subject || '',
        exam_class: examTitleMap[s.exam_id]?.class || ''
      }))

      const students = studentsData || []
      const classMap = new Map<string, number>()
      students.forEach((s: any) => { if (s.class) classMap.set(s.class, (classMap.get(s.class) || 0) + 1) })
      
      const scores = scoresData || []
      const avgPerf = scores.length ? Math.round(scores.reduce((sum, s) => sum + (s.total_score || 0), 0) / scores.length) : 0

      setStats({
        totalStudents: students.length,
        activeStudents: students.filter(s => s.is_active !== false).length,
        activeClasses: classMap.size,
        pendingCAScores: pendingTheoryCount || 0,
        publishedExams: (examsData || []).filter(e => e.status === 'published').length,
        totalExams: (examsData || []).length,
        totalAssignments: (assignmentsData || []).length,
        totalNotes: (notesData || []).length,
        reportCardsGenerated: 0,
        averagePerformance: avgPerf,
        classBreakdown: Array.from(classMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        pendingTheoryCount: pendingTheoryCount || 0,
        pendingTheorySubmissions: enrichedPending
      })
    } catch (error) {
      console.error('Data load error:', error)
      toast.error('Failed to load dashboard')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (profile?.id) await loadDashboardData(profile.id)
    toast.success('Dashboard refreshed')
    setRefreshing(false)
  }

  const formatDate = (d?: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Welcome Banner */}
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

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 sm:mt-5 flex-wrap">
          <Button 
            size="sm"
            onClick={() => router.push('/staff/exams')} 
            className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Exam
          </Button>
          <Button 
            size="sm"
            onClick={() => router.push('/staff/assignments/create')} 
            variant="outline" 
            className="h-9 text-sm"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Assignment
          </Button>
          <Button 
            size="sm"
            onClick={() => router.push('/staff/notes/create')} 
            variant="outline" 
            className="h-9 text-sm"
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            Notes
          </Button>
          <Button 
            size="sm"
            onClick={handleRefresh} 
            variant="ghost" 
            className="h-9 text-sm ml-auto" 
            disabled={refreshing}
          >
            <Loader2 className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Pending Grading Alert */}
        {stats.pendingTheorySubmissions.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Pending Theory Submissions</span>
                <Badge className="bg-amber-100 text-amber-700 text-xs">{stats.pendingTheoryCount}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {stats.pendingTheorySubmissions.slice(0, 3).map((sub: any) => (
                <div 
                  key={sub.id} 
                  className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-md border border-amber-100 dark:border-amber-900/50 hover:border-amber-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/staff/exams/${sub.exam_id}/submissions?tab=pending_theory`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sub.student_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub.exam_title}</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">{formatDate(sub.submitted_at)}</p>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 shrink-0">Grade</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Left: Exams & Assignments */}
          <div className="lg:col-span-2 space-y-4">
            {/* Exams */}
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MonitorPlay className="h-4 w-4 text-emerald-600" />
                  Recent Exams
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
                      <div 
                        key={exam.id} 
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors"
                        onClick={() => router.push(`/staff/exams/${exam.id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <MonitorPlay className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{exam.title}</p>
                            <p className="text-xs text-muted-foreground">{exam.subject} · {exam.class}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                          {exam.status || 'draft'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Recent Assignments
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
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors"
                        onClick={() => router.push(`/staff/assignments/${item.id}`)}
                      >
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.subject} · {item.class}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes - Moved here from right sidebar */}
            <Card>
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Study Notes
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
                      <div 
                        key={note.id} 
                        className="flex items-center gap-3 p-2.5 rounded-lg border hover:border-purple-200 dark:hover:border-purple-800 cursor-pointer transition-colors"
                        onClick={() => router.push(`/staff/notes/${note.id}`)}
                      >
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{note.title}</p>
                          <p className="text-xs text-muted-foreground">{note.subject || 'General'}</p>
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
            {/* Class Stats */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-semibold">{stats.totalStudents}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-semibold">{stats.activeClasses}</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-semibold">{stats.activeStudents}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <p className="text-2xl font-semibold text-amber-700">{stats.pendingCAScores}</p>
                    <p className="text-xs text-amber-600">Pending</p>
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

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 text-sm"
                  onClick={() => router.push('/staff/ca-scores')}
                >
                  <Calculator className="h-4 w-4 mr-2 text-amber-600" />
                  CA Scores
                  {stats.pendingCAScores > 0 && (
                    <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">{stats.pendingCAScores}</Badge>
                  )}
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

// ============================================
// PAGE EXPORT
// ============================================
export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StaffDashboardContent />
    </Suspense>
  )
}