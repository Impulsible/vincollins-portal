// app/staff/page.tsx - MOBILE RESPONSIVE WITH PROPER SPACING
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffWelcomeBanner } from '@/components/staff/StaffWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  MonitorPlay, FileText, BookOpen, Users, ArrowRight, 
  Loader2, CheckCircle2, Calculator, Plus,
  GraduationCap, FileCheck, Briefcase
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

// ============================================
// BEAUTIFUL LOADING COMPONENT
// ============================================
function StaffDashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Briefcase className="h-16 w-16 text-emerald-600 mx-auto" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-slate-600 dark:text-slate-400 text-lg font-medium"
        >
          Loading Staff Dashboard...
        </motion.p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-slate-500 dark:text-slate-500 text-sm"
        >
          Preparing your teaching space ✨
        </motion.p>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-emerald-400"
              animate={{ y: [0, -10, 0] }}
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
    }
  }

  const loadTermInfo = () => {
    try {
      const TERM_START_DATE = new Date('2026-05-04')
      const TERM_END_DATE = new Date('2026-08-01')
      const today = new Date()
      
      const totalWeeks = 13
      
      let currentWeek: number
      let weekProgress: number
      let displayWeek: string
      
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
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (profile?.id) {
      await loadAllData(profile.id)
    }
    toast.success('Dashboard refreshed')
  }

  if (loading) {
    return <StaffDashboardLoading />
  }

  return (
    <div className="mt-6 sm:mt-8 lg:mt-10 px-3 sm:px-5 md:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10 space-y-4 sm:space-y-5 md:space-y-6 max-w-[1600px] mx-auto">
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
      
      {/* Action Buttons - Mobile responsive */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button onClick={() => router.push('/staff/exams/create')} className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm h-9 sm:h-10 flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Exam
        </Button>
        <Button onClick={() => router.push('/staff/assignments/create')} variant="outline" className="text-xs sm:text-sm h-9 sm:h-10 flex-1 sm:flex-none">
          <FileText className="h-4 w-4 mr-1.5" />
          New Assignment
        </Button>
        <Button onClick={() => router.push('/staff/notes/create')} variant="outline" className="text-xs sm:text-sm h-9 sm:h-10 flex-1 sm:flex-none">
          <BookOpen className="h-4 w-4 mr-1.5" />
          Add Notes
        </Button>
        <Button onClick={handleRefresh} variant="ghost" size="sm" className="ml-auto h-9 sm:h-10" disabled={refreshing}>
          <Loader2 className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>
      
      {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
      >
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.totalExams}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Exams</p>
              </div>
              <MonitorPlay className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-emerald-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.publishedExams}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Published</p>
              </div>
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pendingCAScores}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Pending CA</p>
              </div>
              <Calculator className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-amber-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalStudents}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Students</p>
              </div>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Main Content Grid - Single column on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Left column - Takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Recent Exams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                Recent Exams
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
                <Link href="/staff/exams">
                  View All <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6">
              {exams.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <MonitorPlay className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs sm:text-sm">No exams created yet</p>
                  <Button size="sm" className="mt-3 text-xs sm:text-sm" onClick={() => router.push('/staff/exams/create')}>
                    Create Exam
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {exams.slice(0, 5).map((exam: any) => (
                    <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{exam.title}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{exam.subject} • {exam.class}</p>
                        </div>
                      </div>
                      <Badge variant={exam.status === 'published' ? 'default' : 'outline'} className="shrink-0 text-[10px] sm:text-xs">
                        {exam.status || 'draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Recent Assignments
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
                <Link href="/staff/assignments">
                  View All <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6">
              {assignments.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs sm:text-sm">No assignments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">{assignment.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{assignment.subject} • {assignment.class}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Takes 1/3 on desktop */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Recent Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Recent Notes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
                <Link href="/staff/notes">
                  View All <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6">
              {notes.length === 0 ? (
                <div className="text-center py-4">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs sm:text-sm">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] sm:max-h-[250px] overflow-y-auto">
                  {notes.map((note: any) => (
                    <div key={note.id} className="flex items-center gap-2 sm:gap-3 p-2 bg-muted/50 rounded-lg">
                      <BookOpen className="h-4 w-4 text-purple-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{note.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{note.subject || 'General'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Overview */}
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                Class Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total Students</span>
                  <span className="font-bold text-sm sm:text-base">{stats.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Active Classes</span>
                  <span className="font-bold text-sm sm:text-base">{stats.activeClasses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Active Students</span>
                  <span className="font-bold text-sm sm:text-base text-emerald-600">{stats.activeStudents}</span>
                </div>
                
                {stats.classBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Students per Class</p>
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                      {stats.classBreakdown.slice(0, 5).map((cls) => (
                        <div key={cls.name} className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">{cls.name}</span>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">{cls.count}</Badge>
                        </div>
                      ))}
                      {stats.classBreakdown.length > 5 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                          +{stats.classBreakdown.length - 5} more classes
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <Progress value={stats.averagePerformance} className="h-1.5 sm:h-2 mt-2" />
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                  Average performance: {stats.averagePerformance}%
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 text-xs sm:text-sm" 
                  onClick={() => router.push('/staff/students')}
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  View All Students
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-2 sm:py-3 flex-col gap-1 text-xs sm:text-sm" 
                  onClick={() => router.push('/staff/ca-scores')}
                >
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <span className="font-medium">CA Scores</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">{stats.pendingCAScores} pending</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-2 sm:py-3 flex-col gap-1 text-xs sm:text-sm" 
                  onClick={() => router.push('/staff/report-cards')}
                >
                  <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="font-medium">Report Cards</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">Generate</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN EXPORT WITH SUSPENSE
// ============================================
export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<StaffDashboardLoading />}>
      <StaffDashboardContent />
    </Suspense>
  )
}