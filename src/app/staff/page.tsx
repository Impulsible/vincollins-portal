// app/staff/page.tsx - PRODUCTION STAFF DASHBOARD - FIXED NOTES QUERY
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
  GraduationCap, FileCheck, Briefcase, Clock, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

// ============================================
// TYPES
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

interface TermInfo {
  termName: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  displayWeek: string
}

// ============================================
// CONSTANTS
// ============================================
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
// LOADING SKELETON
// ============================================
function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3 sm:space-y-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-fit"
        >
          <Briefcase className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-emerald-600/80" />
        </motion.div>
        <p className="text-sm sm:text-base text-muted-foreground font-medium">Loading Dashboard...</p>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400/80"
              animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="text-center py-6 sm:py-8">
      <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD CONTENT
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
  const [termInfo, setTermInfo] = useState<TermInfo>({
    termName: 'Third Term', sessionYear: '2025/2026',
    currentWeek: 0, totalWeeks: TOTAL_WEEKS, weekProgress: 0, displayWeek: 'Starts May 4'
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
    const initialize = async () => {
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
      } catch (error) { console.error('Init error:', error); router.replace('/portal') }
      finally { setLoading(false) }
    }
    initialize()
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

      const examsList = examsData || []
      const assignmentsList = assignmentsData || []
      const notesList = notesData || []
      const students = studentsData || []
      const scores = scoresData || []
      const pendingSubmissions = pendingTheoryData || []

      setExams(examsList)
      setAssignments(assignmentsList)
      setNotes(notesList)

      const pendingExamIds = [...new Set(pendingSubmissions.map((s: any) => s.exam_id))]
      let examTitleMap: Record<string, any> = {}
      if (pendingExamIds.length > 0) {
        const { data: pendingExamDetails } = await supabase
          .from('exams').select('id, title, subject, class').in('id', pendingExamIds)
        pendingExamDetails?.forEach((e: any) => { examTitleMap[e.id] = e })
      }

      const enrichedPending = pendingSubmissions.map((s: any) => ({
        ...s,
        exam_title: examTitleMap[s.exam_id]?.title || 'Unknown Exam',
        exam_subject: examTitleMap[s.exam_id]?.subject || 'Unknown',
        exam_class: examTitleMap[s.exam_id]?.class || '—'
      }))

      const classMap = new Map<string, number>()
      students.forEach((s: any) => {
        if (s.class) classMap.set(s.class, (classMap.get(s.class) || 0) + 1)
      })
      const breakdown = Array.from(classMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

      const avgPerf = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + (s.total_score || 0), 0) / scores.length) : 0

      setStats({
        totalStudents: students.length,
        activeStudents: students.filter(s => s.is_active !== false).length,
        activeClasses: classMap.size,
        pendingCAScores: pendingTheoryCount || 0,
        publishedExams: examsList.filter(e => e.status === 'published').length,
        totalExams: examsList.length,
        totalAssignments: assignmentsList.length,
        totalNotes: notesList.length,
        reportCardsGenerated: 0,
        averagePerformance: avgPerf,
        classBreakdown: breakdown,
        pendingTheoryCount: pendingTheoryCount || 0,
        pendingTheorySubmissions: enrichedPending
      })
    } catch (error) { console.error('Data load error:', error); toast.error('Failed to load dashboard') }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (profile?.id) await loadDashboardData(profile.id)
    toast.success('Dashboard refreshed')
    setRefreshing(false)
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
  }

  const navigateTo = (path: string) => {
    window.location.href = path
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <div className="px-1 pt-1 sm:px-2 sm:pt-2">
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
      </div>

      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-16 sm:pb-8">
        <div className="space-y-4 sm:space-y-5 mt-3 sm:mt-4">
          
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Button onClick={() => navigateTo('/staff/exams')} className="h-9 sm:h-10 text-[11px] sm:text-xs md:text-sm bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />Create Exam
            </Button>
            <Button onClick={() => navigateTo('/staff/assignments/create')} variant="outline" className="h-9 sm:h-10 text-[11px] sm:text-xs md:text-sm">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />Assignment
            </Button>
            <Button onClick={() => navigateTo('/staff/notes/create')} variant="outline" className="h-9 sm:h-10 text-[11px] sm:text-xs md:text-sm">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />Add Notes
            </Button>
            <Button onClick={handleRefresh} variant="outline" className="h-9 sm:h-10 text-[11px] sm:text-xs md:text-sm" disabled={refreshing}>
              <Loader2 className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5", refreshing && "animate-spin")} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              
              {/* Pending Theory Grading */}
              {stats.pendingTheorySubmissions.length > 0 && (
                <Card className="shadow-sm border-amber-200/60 dark:border-amber-700/30 bg-amber-50/30">
                  <CardHeader className="flex-row items-center justify-between p-3 sm:p-4 md:p-5 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                      <span className="truncate">Pending Theory Grading</span>
                    </CardTitle>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">{stats.pendingTheoryCount} pending</Badge>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-5 pt-0 sm:pt-1">
                    <div className="space-y-1.5 sm:space-y-2 max-h-[400px] overflow-y-auto">
                      {stats.pendingTheorySubmissions.map((sub: any) => (
                        <div 
                          key={sub.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 sm:p-3 bg-white rounded-lg border border-amber-100"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-md flex-shrink-0">
                              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate">{sub.student_name || 'Unknown Student'}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {sub.exam_title} • {sub.exam_subject} • {sub.exam_class}
                              </p>
                              <p className="text-[10px] text-amber-600 mt-0.5">Submitted: {formatDate(sub.submitted_at)}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="h-7 text-[10px] sm:text-xs self-end sm:self-center flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateTo(`/staff/exams/${sub.exam_id}/submissions?tab=pending_theory`)
                            }}
                          >
                            Grade Theory
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Exams */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="flex-row items-center justify-between p-3 sm:p-4 md:p-5 pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Recent Exams</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] sm:text-xs h-7 sm:h-8">
                    <Link href="/staff/exams">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-5 pt-0 sm:pt-1">
                  {exams.length === 0 ? (
                    <EmptyState icon={MonitorPlay} title="No exams created yet" />
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {exams.slice(0, 5).map((exam) => (
                        <div 
                          key={exam.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 sm:p-2.5 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors active:scale-[0.98]"
                          onClick={() => navigateTo(`/staff/exams/${exam.id}`)}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md flex-shrink-0">
                              <MonitorPlay className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate">{exam.title}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{exam.subject} • {exam.class}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={exam.status === 'published' ? 'default' : 'outline'} 
                            className={cn("text-[10px] sm:text-xs self-end sm:self-center flex-shrink-0", exam.status === 'published' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")}
                          >
                            {exam.status || 'draft'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Assignments */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="flex-row items-center justify-between p-3 sm:p-4 md:p-5 pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Recent Assignments</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] sm:text-xs h-7 sm:h-8">
                    <Link href="/staff/assignments">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-5 pt-0 sm:pt-1">
                  {assignments.length === 0 ? (
                    <EmptyState icon={FileText} title="No assignments yet" />
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-muted/50 rounded-lg">
                          <div className="p-1 sm:p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex-shrink-0">
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{assignment.title}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{assignment.subject} • {assignment.class}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 sm:space-y-5">
              
              {/* Recent Notes */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="flex-row items-center justify-between p-3 sm:p-4 pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                    <span className="truncate">Recent Notes</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] sm:text-xs h-7 sm:h-8">
                    <Link href="/staff/notes">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 sm:pt-1">
                  {notes.length === 0 ? (
                    <EmptyState icon={BookOpen} title="No notes yet" />
                  ) : (
                    <div className="space-y-1.5 max-h-[200px] sm:max-h-[240px] md:max-h-[280px] overflow-y-auto">
                      {notes.map((note) => (
                        <div key={note.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-muted/50 rounded-lg">
                          <div className="p-1 sm:p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md flex-shrink-0">
                            <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{note.title}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{note.subject || 'General'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Class Overview */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Class Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { label: 'Total Students', value: stats.totalStudents },
                      { label: 'Active Classes', value: stats.activeClasses },
                      { label: 'Pending Grading', value: stats.pendingCAScores, highlight: true },
                      { label: 'Active Students', value: stats.activeStudents }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-muted/40 rounded-lg">
                        <span className="text-xs sm:text-sm text-muted-foreground">{item.label}</span>
                        <span className={cn("font-bold text-sm sm:text-base", item.highlight && "text-amber-600")}>{item.value}</span>
                      </div>
                    ))}
                    
                    {stats.classBreakdown.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2">By Class</p>
                        <div className="space-y-1 max-h-[120px] overflow-y-auto">
                          {stats.classBreakdown.slice(0, 5).map((cls) => (
                            <div key={cls.name} className="flex justify-between items-center px-2 py-1 rounded-md hover:bg-muted/40">
                              <span className="text-xs sm:text-sm truncate mr-2">{cls.name}</span>
                              <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">{cls.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Performance</span>
                        <span className="text-[10px] sm:text-xs font-medium">{stats.averagePerformance}%</span>
                      </div>
                      <Progress value={stats.averagePerformance} className="h-1.5 sm:h-2" />
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigateTo('/staff/students')}>
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />View All Students
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1 text-xs hover:border-amber-300 transition-colors" onClick={() => navigateTo('/staff/ca-scores')}>
                      <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                      <span className="font-medium text-[10px] sm:text-xs">CA Scores</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">{stats.pendingCAScores} pending</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1 text-xs hover:border-blue-300 transition-colors" onClick={() => navigateTo('/staff/report-cards')}>
                      <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      <span className="font-medium text-[10px] sm:text-xs">Report Cards</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">Generate</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
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