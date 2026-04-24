// app/staff/page.tsx - FULLY RESPONSIVE ALL SCREENS, PROPER MOBILE SPACING
'use client'

import { useState, useEffect, Suspense } from 'react'
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
  Loader2, CheckCircle2, Calculator, Plus,
  GraduationCap, FileCheck, Briefcase, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

// ============================================
// LOADING COMPONENT
// ============================================
function StaffDashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center w-full max-w-sm">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-fit"
        >
          <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-emerald-600" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 sm:mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium"
        >
          Loading Dashboard...
        </motion.p>
        <div className="flex justify-center gap-1.5 mt-3 sm:mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
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
  
  const [stats, setStats] = useState({
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
    classBreakdown: [] as { name: string; count: number }[]
  })

  const [termInfo, setTermInfo] = useState({
    termName: 'Third Term',
    sessionYear: '2025/2026',
    currentWeek: 0,
    totalWeeks: 13,
    weekProgress: 0,
    startDate: '2026-05-04',
    endDate: '2026-08-01',
    displayWeek: 'Starts May 4'
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/portal')
        return
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        if (profileData.role !== 'staff' && profileData.role !== 'admin' && profileData.role !== 'teacher') {
          toast.error('Access denied. Staff only.')
          router.replace('/portal')
          return
        }
        setProfile(profileData)
        await loadAllData(profileData.id)
        loadTermInfo()
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/portal')
    } finally {
      setLoading(false)
    }
  }

  const loadTermInfo = () => {
    try {
      const TERM_START_DATE = new Date('2026-05-04')
      const TERM_END_DATE = new Date('2026-08-01')
      const today = new Date()
      const totalWeeks = 13
      
      let currentWeek: number, weekProgress: number, displayWeek: string
      
      if (today < TERM_START_DATE) {
        currentWeek = 0
        weekProgress = 0
        displayWeek = 'Starts May 4'
      } else if (today > TERM_END_DATE) {
        currentWeek = totalWeeks
        weekProgress = 100
        displayWeek = 'Term Ended'
      } else {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weeksPassed = Math.floor((today.getTime() - TERM_START_DATE.getTime()) / msPerWeek) + 1
        currentWeek = Math.min(Math.max(1, weeksPassed), totalWeeks)
        weekProgress = (currentWeek / totalWeeks) * 100
        displayWeek = `Week ${currentWeek}/${totalWeeks}`
      }

      setTermInfo({
        termName: 'Third Term',
        sessionYear: '2025/2026',
        currentWeek: currentWeek,
        totalWeeks: totalWeeks,
        weekProgress: weekProgress,
        startDate: TERM_START_DATE.toISOString(),
        endDate: TERM_END_DATE.toISOString(),
        displayWeek: displayWeek
      })

    } catch (error) {
      console.error('Error loading term info:', error)
    }
  }

  const loadAllData = async (userId: string) => {
    try {
      const [examsRes, assignmentsRes, notesRes, studentsRes, pendingCARes, classScoresRes] = await Promise.all([
        supabase.from('exams').select('*').eq('created_by', userId).order('created_at', { ascending: false }),
        supabase.from('assignments').select('*').eq('created_by', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('notes').select('*').eq('created_by', userId).order('created_at', { ascending: false }).limit(4),
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('ca_scores').select('*', { count: 'exact', head: true }).eq('teacher_id', userId).eq('status', 'pending'),
        supabase.from('ca_scores').select('total_score, student_id')
      ])
      
      const examsData = examsRes.data || []
      const studentsData = studentsRes.data || []
      
      setExams(examsData)
      setAssignments(assignmentsRes.data || [])
      setNotes(notesRes.data || [])
      
      const publishedExams = examsData.filter(e => e.status === 'published').length
      
      const classMap = new Map<string, number>()
      studentsData.forEach((student: any) => {
        if (student.class) {
          classMap.set(student.class, (classMap.get(student.class) || 0) + 1)
        }
      })
      
      const classBreakdown = Array.from(classMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
      
      const activeClasses = classMap.size
      const activeStudents = studentsData.filter(s => s.is_active !== false).length
      
      const scoresData = classScoresRes.data || []
      const averagePerformance = scoresData.length > 0
        ? Math.round(scoresData.reduce((sum, s) => sum + (s.total_score || 0), 0) / scoresData.length)
        : 0
      
      setStats({
        totalStudents: studentsData.length,
        activeStudents: activeStudents,
        activeClasses: activeClasses,
        pendingCAScores: pendingCARes.count || 0,
        publishedExams: publishedExams,
        totalExams: examsData.length,
        totalAssignments: (assignmentsRes.data || []).length,
        totalNotes: (notesRes.data || []).length,
        reportCardsGenerated: 0,
        averagePerformance: averagePerformance,
        classBreakdown: classBreakdown
      })
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load dashboard data')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (profile?.id) {
      await loadAllData(profile.id)
    }
    toast.success('Dashboard refreshed')
    setRefreshing(false)
  }

  const handleExamClick = (examId: string) => {
    router.push(`/staff/exams/${examId}`)
  }

  if (loading) {
    return <StaffDashboardLoading />
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-slate-50/50 dark:bg-slate-950/50">
      
      {/* BANNER - Full width, close to header */}
      <div className="w-full px-0.5 sm:px-1 pt-0.5 sm:pt-1">
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

      {/* CONTENT AREA */}
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-20 sm:pb-8">
        <div className="space-y-3 sm:space-y-4 md:space-y-5 mt-3 sm:mt-4 md:mt-5">
          
          {/* ACTION BUTTONS - 2x2 on mobile, 4 across on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Button 
              onClick={() => router.push('/staff/exams')} 
              className="bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-10 w-full text-[11px] sm:text-xs md:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Create Exam
            </Button>
            <Button 
              onClick={() => router.push('/staff/assignments/create')} 
              variant="outline" 
              className="h-9 sm:h-10 w-full text-[11px] sm:text-xs md:text-sm"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              New Assignment
            </Button>
            <Button 
              onClick={() => router.push('/staff/notes/create')} 
              variant="outline" 
              className="h-9 sm:h-10 w-full text-[11px] sm:text-xs md:text-sm"
            >
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Add Notes
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="h-9 sm:h-10 w-full text-[11px] sm:text-xs md:text-sm"
              disabled={refreshing}
            >
              <Loader2 className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
          
          {/* MAIN CONTENT - Stack on mobile, side by side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-5">
              
              {/* Recent Exams */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                    <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Recent Exams</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 flex-shrink-0">
                    <Link href="/staff/exams" className="flex items-center">
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                  {exams.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <MonitorPlay className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs sm:text-sm">No exams created yet</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2 text-xs text-emerald-600"
                        onClick={() => router.push('/staff/exams')}
                      >
                        Create your first exam
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {exams.slice(0, 5).map((exam: any) => (
                        <div 
                          key={exam.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors active:scale-[0.98]"
                          onClick={() => handleExamClick(exam.id)}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md flex-shrink-0">
                              <MonitorPlay className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate">{exam.title}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {exam.subject} • {exam.class}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={exam.status === 'published' ? 'default' : 'outline'} 
                            className={cn(
                              "text-[10px] sm:text-xs self-end sm:self-center flex-shrink-0",
                              exam.status === 'published' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            )}
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
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Recent Assignments</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 flex-shrink-0">
                    <Link href="/staff/assignments" className="flex items-center">
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                  {assignments.length === 0 ? (
                    <div className="text-center py-4 sm:py-6">
                      <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs sm:text-sm">No assignments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {assignments.map((assignment: any) => (
                        <div 
                          key={assignment.id} 
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div className="p-1 sm:p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex-shrink-0">
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{assignment.title}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {assignment.subject} • {assignment.class}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              
              {/* Recent Notes */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                    <span className="truncate">Recent Notes</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 flex-shrink-0">
                    <Link href="/staff/notes" className="flex items-center">
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                  {notes.length === 0 ? (
                    <div className="text-center py-4">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs sm:text-sm">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[180px] sm:max-h-[220px] md:max-h-[250px] overflow-y-auto">
                      {notes.map((note: any) => (
                        <div 
                          key={note.id} 
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                          <div className="p-1 sm:p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md flex-shrink-0">
                            <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{note.title}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {note.subject || 'General'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Class Overview */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardHeader className="pb-2 px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Class Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                      <span className="text-xs sm:text-sm text-muted-foreground">Total Students</span>
                      <span className="font-bold text-sm sm:text-base">{stats.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                      <span className="text-xs sm:text-sm text-muted-foreground">Active Classes</span>
                      <span className="font-bold text-sm sm:text-base">{stats.activeClasses}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                      <span className="text-xs sm:text-sm text-muted-foreground">Active Students</span>
                      <span className="font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">{stats.activeStudents}</span>
                    </div>
                    
                    {stats.classBreakdown.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2">Students per Class</p>
                        <div className="space-y-1 max-h-[120px] sm:max-h-[150px] overflow-y-auto">
                          {stats.classBreakdown.slice(0, 5).map((cls) => (
                            <div key={cls.name} className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-muted/40">
                              <span className="text-xs sm:text-sm truncate mr-2">{cls.name}</span>
                              <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">{cls.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Performance</span>
                        <span className="text-[10px] sm:text-xs font-medium">{stats.averagePerformance}%</span>
                      </div>
                      <Progress value={stats.averagePerformance} className="h-1.5 sm:h-2" />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs sm:text-sm h-8 sm:h-9"
                      onClick={() => router.push('/staff/students')}
                    >
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                      View All Students
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/30">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-1.5 text-xs sm:text-sm hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                      onClick={() => router.push('/staff/ca-scores')}
                    >
                      <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium text-[10px] sm:text-xs">CA Scores</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {stats.pendingCAScores} pending
                      </span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-1.5 text-xs sm:text-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      onClick={() => router.push('/staff/report-cards')}
                    >
                      <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
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
// MAIN EXPORT
// ============================================
export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<StaffDashboardLoading />}>
      <StaffDashboardContent />
    </Suspense>
  )
}