// app/student/page.tsx - Updated with CA scores integration
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { OverviewTab } from '@/components/student/OverviewTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Award } from 'lucide-react'

function DashboardSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
      <Skeleton className="h-40 sm:h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    availableExams: [],
    classmates: [],
    recentAttempts: [],
    allAssignments: [],
    recentAssignments: [],
    allNotes: [],
    recentNotes: [],
    passedExams: 0,
    failedExams: 0,
    completedExams: 0
  })
  const [reportCardStatus, setReportCardStatus] = useState<any>(null)
  const [termProgress, setTermProgress] = useState<any>(null)

  const loadProfileAndData = useCallback(async () => {
    try {
      let { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
        if (!session) { router.push('/portal'); return }
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // Load term progress
        const { data: progress } = await supabase
          .from('student_term_progress')
          .select('*')
          .eq('student_id', profileData.id)
          .eq('term', 'third')
          .eq('session_year', '2025/2026')
          .maybeSingle()
        
        if (progress) setTermProgress(progress)

        // Load classmates
        const { data: classmates } = await supabase
          .from('profiles')
          .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
          .eq('class', profileData.class)
          .eq('role', 'student')
          .neq('id', profileData.id)
          .limit(6)

        // Load exams
        const { data: exams } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .eq('class', profileData.class)
          .limit(20)

        // Load exam attempts
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('student_id', profileData.id)
          .order('created_at', { ascending: false })

        // Load CA scores for this student
        const { data: caScores } = await supabase
          .from('ca_scores')
          .select('*')
          .eq('student_id', profileData.id)

        // Create CA scores map by exam_id
        const caScoresMap: Record<string, any> = {}
        caScores?.forEach((ca: any) => {
          if (ca.exam_id) {
            caScoresMap[ca.exam_id] = ca
          }
        })

        // Get exam details for attempts
        const examIds = [...new Set((attempts || []).map((a: any) => a.exam_id))]
        let examMap: Record<string, any> = {}
        
        if (examIds.length > 0) {
          const { data: examDetails } = await supabase
            .from('exams')
            .select('id, title, subject')
            .in('id', examIds)
          examDetails?.forEach((e: any) => { examMap[e.id] = e })
        }

        // Enrich attempts with exam info and CA scores
        const enrichedAttempts = (attempts || []).map((a: any) => {
          const caScore = caScoresMap[a.exam_id]
          const examScore = Number(a.total_score) || 0
          const ca1Score = caScore?.ca1_score ? Number(caScore.ca1_score) : 0
          const ca2Score = caScore?.ca2_score ? Number(caScore.ca2_score) : 0
          const grandTotal = ca1Score + ca2Score + examScore
          const grandTotalMax = caScore ? 100 : 60
          
          // Use CA percentage if available for display, otherwise exam percentage
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

        // All submitted attempts (for average calculation)
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
        
        // Truly completed (for term progress)
        const trulyCompleted = allSubmitted.filter((a: any) => 
          ['completed', 'graded'].includes(a.status) || 
          (a.is_auto_submitted && a.auto_submit_reason?.toLowerCase().includes('time'))
        )
        
        // Pending theory count
        const pendingTheoryCount = enrichedAttempts.filter((a: any) => 
          a.status === 'pending_theory'
        ).length
        
        // Pass/Fail with CA scores considered
        const passedExams = allSubmitted.filter((a: any) => {
          if (a.has_ca && a.ca_score?.grade) {
            return !['F'].includes(a.ca_score.grade)
          }
          return a.is_passed === true || (a.percentage && a.percentage >= 50)
        }).length
        
        const failedExams = allSubmitted.filter((a: any) => {
          if (a.has_ca && a.ca_score?.grade) {
            return a.ca_score.grade === 'F'
          }
          return a.is_passed === false && a.percentage !== null && a.percentage < 50
        }).length

        // ✅ Average using CA scores when available, otherwise exam scores
        const displayAvgScore = allSubmitted.length > 0
          ? Math.round((allSubmitted.reduce((sum: number, a: any) => {
              if (a.has_ca && a.ca_score?.total_score) {
                return sum + Number(a.ca_score.total_score) // CA total is /100
              }
              return sum + (a.percentage || 0)
            }, 0) / allSubmitted.length) * 100) / 100
          : 0

        // True average from completed/graded (for term progress)
        const trueAvgScore = trulyCompleted.length > 0
          ? Math.round((trulyCompleted.reduce((sum: number, a: any) => {
              if (a.has_ca && a.ca_score?.total_score) {
                return sum + Number(a.ca_score.total_score)
              }
              return sum + (a.percentage || 0)
            }, 0) / trulyCompleted.length) * 100) / 100
          : 0

        // Available exams (not yet submitted)
        const completedAndGradedIds = allSubmitted.map((a: any) => a.exam_id)
        const availableExams = (exams || []).filter((e: any) => !completedAndGradedIds.includes(e.id))

        // Load assignments and notes
        const { data: assignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('class', profileData.class)
          .order('created_at', { ascending: false })
          .limit(10)

        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('class', profileData.class)
          .order('created_at', { ascending: false })
          .limit(10)

        setStats({
          availableExams,
          classmates: classmates || [],
          recentAttempts: enrichedAttempts.slice(0, 10),
          allAttempts: enrichedAttempts,
          allAssignments: assignments || [],
          recentAssignments: assignments?.slice(0, 5) || [],
          allNotes: notes || [],
          recentNotes: notes?.slice(0, 5) || [],
          passedExams,
          failedExams,
          completedExams: allSubmitted.length,
          trulyCompletedCount: trulyCompleted.length,
          averageScore: displayAvgScore,
          trueAverageScore: trueAvgScore,
          pendingTheoryCount,
          caScoresCount: caScores?.length || 0,
          subjectsWithCA: [...new Set(caScores?.map((ca: any) => ca.subject) || [])],
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadProfileAndData() }, [loadProfileAndData])

  // Refresh on focus/visibility
  useEffect(() => {
    const handleFocus = () => loadProfileAndData()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProfileAndData])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadProfileAndData()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadProfileAndData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const completedExams = stats.completedExams || 0
  const totalExams = termProgress?.total_subjects || (stats.availableExams?.length + completedExams) || 0
  const availableExams = stats.availableExams?.length || 0
  const avgScore = stats.averageScore ?? 0
  const gradeInfo = calculateGrade(avgScore)
  const currentGrade = gradeInfo.grade
  const pendingTheoryCount = stats.pendingTheoryCount || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72" />
          <div className="flex-1">
            <main className="pt-[72px] lg:pt-20 pb-8"><DashboardSkeleton /></main>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center"><p className="text-slate-500">Redirecting to login...</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile} onLogout={handleLogout}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeSection} setActiveTab={setActiveSection}
        />

        <div className={cn("flex-1 transition-all duration-300 w-full overflow-x-hidden", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
          <main className="min-h-[calc(100vh-64px)] pt-[72px] lg:pt-20 pb-12 px-4 sm:px-6 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {activeSection === 'overview' && (
                <OverviewTab 
                  profile={profile} stats={stats}
                  bannerStats={{
                    availableExams, totalExams, completedExams,
                    averageScore: avgScore, currentGrade, gradeColor: gradeInfo.color,
                    passedExams: stats.passedExams || 0, failedExams: stats.failedExams || 0,
                    pendingTheoryCount,
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
                <Card className="border-0 shadow-md mt-2">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">My Exams</h3>
                    <p className="text-sm text-muted-foreground">Your exams will appear here</p>
                  </CardContent>
                </Card>
              )}
              {activeSection === 'results' && (
                <Card className="border-0 shadow-md mt-2">
                  <CardContent className="py-12 text-center">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">My Results</h3>
                    <p className="text-sm text-muted-foreground">Your results will appear here</p>
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