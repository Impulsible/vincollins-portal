// app/student/page.tsx - UPDATED + NO TAB RELOAD
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
import { useDataFetching } from '@/hooks/useDataFetching'
import { instantLogout } from '@/lib/auth-utils'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { OverviewTab } from '@/components/student/OverviewTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Award, LayoutDashboard } from 'lucide-react'
import { toast } from 'sonner'

// ============================================
// TYPES & CONSTANTS
// ============================================
interface DashboardStats {
  availableExams: any[]
  classmates: any[]
  recentAttempts: any[]
  allAttempts: any[]
  allAssignments: any[]
  recentAssignments: any[]
  allNotes: any[]
  recentNotes: any[]
  passedExams: number
  failedExams: number
  completedExams: number
  trulyCompletedCount: number
  averageScore: number
  trueAverageScore: number
  pendingTheoryCount: number
  caScoresCount: number
  subjectsWithCA: string[]
}

interface DashboardData {
  stats: DashboardStats
  termProgress: any
  reportCardStatus: any
}

const VISIBILITY_REFRESH_INTERVAL = 120000 // ✅ 2 minutes

function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

const DEFAULT_STATS: DashboardStats = {
  availableExams: [],
  classmates: [],
  recentAttempts: [],
  allAttempts: [],
  allAssignments: [],
  recentAssignments: [],
  allNotes: [],
  recentNotes: [],
  passedExams: 0,
  failedExams: 0,
  completedExams: 0,
  trulyCompletedCount: 0,
  averageScore: 0,
  trueAverageScore: 0,
  pendingTheoryCount: 0,
  caScoresCount: 0,
  subjectsWithCA: [],
}

function StudentDashboardContent() {
  const router = useRouter()
  const { user: contextUser } = useUser()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const lastVisibilityRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  // ✅ ALL data fetching in one function
  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    const userId = contextUser?.id
    const userClass = contextUser?.class
    
    if (!userId || !userClass) throw new Error('User data not available')

    // ALL 7 parallel queries
    const [
      progressResult,
      classmatesResult,
      examsResult,
      attemptsResult,
      caScoresResult,
      assignmentsResult,
      notesResult
    ] = await Promise.all([
      supabase.from('student_term_progress').select('*').eq('student_id', userId).eq('term', 'third').eq('session_year', '2025/2026').maybeSingle(),
      supabase.from('profiles').select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id').eq('class', userClass).eq('role', 'student').neq('id', userId).limit(6),
      supabase.from('exams').select('*').eq('status', 'published').eq('class', userClass).limit(20),
      supabase.from('exam_attempts').select('*').eq('student_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('ca_scores').select('*').eq('student_id', userId),
      supabase.from('assignments').select('*').eq('class', userClass).order('created_at', { ascending: false }).limit(10),
      supabase.from('notes').select('*').eq('class', userClass).order('created_at', { ascending: false }).limit(10),
    ])

    // CA Scores processing
    const caScores = caScoresResult.data || []
    const caScoresMap: Record<string, any> = {}
    caScores.forEach((ca: any) => { if (ca.exam_id) caScoresMap[ca.exam_id] = ca })

    // Exam attempts enrichment
    const attempts = attemptsResult.data || []
    const examIds = [...new Set(attempts.map((a: any) => a.exam_id))]
    let examMap: Record<string, any> = {}
    
    if (examIds.length > 0) {
      const { data: examDetails } = await supabase.from('exams').select('id, title, subject').in('id', examIds.slice(0, 50))
      examDetails?.forEach((e: any) => { examMap[e.id] = e })
    }

    // Enriched attempts
    const enrichedAttempts = attempts.map((a: any) => {
      const caScore = caScoresMap[a.exam_id]
      const examScore = Number(a.total_score) || 0
      const ca1Score = caScore?.ca1_score ? Number(caScore.ca1_score) : 0
      const ca2Score = caScore?.ca2_score ? Number(caScore.ca2_score) : 0
      const grandTotal = ca1Score + ca2Score + examScore
      const grandTotalMax = caScore ? 100 : 60
      
      let displayPercentage = a.percentage || 0
      if (caScore && caScore.total_score) {
        displayPercentage = Math.round((Number(caScore.total_score) / 100) * 100)
      }
      
      return {
        ...a,
        exam_title: examMap[a.exam_id]?.title || 'Exam',
        exam_subject: examMap[a.exam_id]?.subject || 'Unknown Subject',
        ca_score: caScore || null,
        grand_total: grandTotal,
        grand_total_max: grandTotalMax,
        display_percentage: displayPercentage,
        has_ca: !!caScore
      }
    })

    // All submitted filter
    const allSubmitted = enrichedAttempts.filter((a: any) => {
      if (['completed', 'pending_theory', 'graded'].includes(a.status)) return true
      if (a.is_auto_submitted) {
        if (a.auto_submit_reason?.toLowerCase().includes('time')) return true
        const unloadCount = a.unload_count || 0
        const tabSwitches = a.tab_switches || 0
        const fullscreenExits = a.fullscreen_exits || 0
        if (unloadCount >= 3 || tabSwitches >= 3 || fullscreenExits >= 3) return true
        return false
      }
      return false
    })
    
    // Truly completed
    const trulyCompleted = allSubmitted.filter((a: any) => 
      ['completed', 'graded'].includes(a.status) || 
      (a.is_auto_submitted && a.auto_submit_reason?.toLowerCase().includes('time'))
    )
    
    // Pending theory
    const pendingTheoryCount = enrichedAttempts.filter((a: any) => a.status === 'pending_theory').length
    
    // Pass/Fail calculation
    const passedExams = allSubmitted.filter((a: any) => {
      if (a.has_ca && a.ca_score?.grade) return !['F9'].includes(a.ca_score.grade)
      return a.is_passed === true || (a.percentage && a.percentage >= 50)
    }).length
    
    const failedExams = allSubmitted.filter((a: any) => {
      if (a.has_ca && a.ca_score?.grade) return a.ca_score.grade === 'F9'
      return a.is_passed === false && a.percentage !== null && a.percentage < 50
    }).length

    // Average score
    const displayAvgScore = allSubmitted.length > 0
      ? Math.round((allSubmitted.reduce((sum: number, a: any) => {
          if (a.has_ca && a.ca_score?.total_score) return sum + Number(a.ca_score.total_score)
          return sum + (a.percentage || 0)
        }, 0) / allSubmitted.length) * 100) / 100
      : 0

    const trueAvgScore = trulyCompleted.length > 0
      ? Math.round((trulyCompleted.reduce((sum: number, a: any) => {
          if (a.has_ca && a.ca_score?.total_score) return sum + Number(a.ca_score.total_score)
          return sum + (a.percentage || 0)
        }, 0) / trulyCompleted.length) * 100) / 100
      : 0

    // Available exams
    const completedAndGradedIds = allSubmitted.map((a: any) => a.exam_id)
    const availableExams = (examsResult.data || []).filter((e: any) => !completedAndGradedIds.includes(e.id))

    return {
      stats: {
        availableExams,
        classmates: classmatesResult.data || [],
        recentAttempts: enrichedAttempts.slice(0, 10),
        allAttempts: enrichedAttempts,
        allAssignments: assignmentsResult.data || [],
        recentAssignments: (assignmentsResult.data || []).slice(0, 5),
        allNotes: notesResult.data || [],
        recentNotes: (notesResult.data || []).slice(0, 5),
        passedExams,
        failedExams,
        completedExams: allSubmitted.length,
        trulyCompletedCount: trulyCompleted.length,
        averageScore: displayAvgScore,
        trueAverageScore: trueAvgScore,
        pendingTheoryCount,
        caScoresCount: caScores.length,
        subjectsWithCA: [...new Set(caScores.map((ca: any) => ca.subject))],
      },
      termProgress: progressResult.data,
      reportCardStatus: null,
    }
  }, [contextUser?.id, contextUser?.class])

  // ✅ Use caching hook - refresh() uses cache, refetch() forces fresh
  const { data: dashboardData, loading, refresh, refetch } = useDataFetching<DashboardData>({
    key: `student-dashboard-${contextUser?.id}`,
    fetcher: fetchDashboardData,
    cacheDuration: 30000,
    enabled: !!contextUser?.id,
  })

  const stats = dashboardData?.stats || DEFAULT_STATS
  const termProgress = dashboardData?.termProgress
  const reportCardStatus = dashboardData?.reportCardStatus

  // ✅ Use visibilitychange instead of focus + skip initial load + longer throttle
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Skip if document just became visible on initial page load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
        return
      }

      if (document.visibilityState === 'visible') {
        // Only refresh if it's been more than 2 minutes
        if (Date.now() - lastVisibilityRef.current > VISIBILITY_REFRESH_INTERVAL && contextUser?.id) {
          lastVisibilityRef.current = Date.now()
          // ✅ Use refresh() instead of refetch() to use cache if available
          refresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refresh, contextUser?.id])

  // ✅ Format profile for header
  const formatProfileForHeader = useCallback(() => {
    if (!contextUser) return undefined
    return {
      id: contextUser.id,
      name: contextUser.full_name || contextUser.first_name || 'Student',
      firstName: contextUser.first_name || contextUser.full_name?.split(' ')[0] || 'Student',
      email: contextUser.email || '',
      role: 'student' as const,
      avatar: contextUser.avatar_url || contextUser.photo_url || undefined,
      isAuthenticated: true
    }
  }, [contextUser])

  const profile = contextUser
  const handleLogout = () => instantLogout()

  // All calculations
  const completedExams = stats.completedExams || 0
  const totalExams = termProgress?.total_subjects || (stats.availableExams?.length + completedExams) || 0
  const availableExams = stats.availableExams?.length || 0
  const avgScore = stats.averageScore ?? 0
  const gradeInfo = calculateGrade(avgScore)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={handleLogout} />
        <div className="flex w-full">
          <div className="hidden lg:block">
            <StudentSidebar
              profile={null}
              onLogout={handleLogout}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              activeTab={activeSection}
              setActiveTab={setActiveSection}
            />
          </div>
          <div className={cn(
            "flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
          )}>
            <div className="text-center px-4">
              <div className="relative mx-auto mb-6 h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                <LayoutDashboard className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-700 mb-1">Loading Dashboard</h2>
              <p className="text-sm text-slate-500">Please wait while we load your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile} onLogout={handleLogout}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeSection} setActiveTab={setActiveSection}
        />

        <div className={cn("flex-1 transition-all duration-300 w-full overflow-x-hidden", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
          <main className="min-h-[calc(100vh-64px)] pt-[72px] lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {activeSection === 'overview' && (
                <OverviewTab 
                  profile={profile} stats={stats}
                  bannerStats={{
                    availableExams, totalExams, completedExams,
                    averageScore: avgScore, currentGrade: gradeInfo.grade, gradeColor: gradeInfo.color,
                    passedExams: stats.passedExams || 0, failedExams: stats.failedExams || 0,
                    pendingTheoryCount: stats.pendingTheoryCount || 0,
                    caScoresCount: stats.caScoresCount || 0,
                    subjectsWithCA: stats.subjectsWithCA || [],
                  }}
                  reportCardStatus={reportCardStatus}
                  welcomeBannerProfile={profile}
                  handleTabChange={setActiveSection}
                  router={router}
                />
              )}
              {activeSection === 'exams' && (
                <Card className="border-0 shadow-sm mt-2">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">My Exams</h3>
                    <p className="text-sm text-slate-500">Go to Exams tab to view your exams</p>
                  </CardContent>
                </Card>
              )}
              {activeSection === 'results' && (
                <Card className="border-0 shadow-sm mt-2">
                  <CardContent className="py-12 text-center">
                    <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">My Results</h3>
                    <p className="text-sm text-slate-500">Go to Results tab to view your results</p>
                  </CardContent>
                </Card>
              )}
              {activeSection === 'classmates' && (
                <ClassmatesTab profile={profile} stats={stats} handleTabChange={setActiveSection} router={router} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboardPage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <StudentDashboardContent />
    </AuthGuard>
  )
}