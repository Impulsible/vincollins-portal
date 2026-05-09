// app/student/page.tsx - OPTIMIZED STUDENT DASHBOARD
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
import { Button } from '@/components/ui/button'
import { BookOpen, Award, LayoutDashboard, RefreshCw } from 'lucide-react'

const LOAD_TIMEOUT = 8000 // ✅ Max loading time

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
  const [loadError, setLoadError] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    availableExams: [], classmates: [], recentAttempts: [], allAssignments: [],
    recentAssignments: [], allNotes: [], recentNotes: [],
    passedExams: 0, failedExams: 0, completedExams: 0
  })
  const [reportCardStatus, setReportCardStatus] = useState<any>(null)
  const [termProgress, setTermProgress] = useState<any>(null)

  const loadProfileAndData = useCallback(async () => {
    setLoadError(false)
    try {
      // ✅ Timeout for auth
      const authTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )

      const sessionPromise = supabase.auth.getSession()
      const result = await Promise.race([sessionPromise, authTimeout]) as any
      let session = result?.data?.session

      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
      }

      if (!session) { router.push('/portal'); return }

      // ✅ Race all data fetches against timeout
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Data timeout')), LOAD_TIMEOUT)
      )

      const dataPromise = Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('student_term_progress').select('*').eq('student_id', session.user.id).eq('term', 'third').eq('session_year', '2025/2026').maybeSingle(),
        supabase.from('profiles').select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id').eq('class', '').eq('role', 'student').neq('id', session.user.id).limit(6),
        supabase.from('exams').select('*').eq('status', 'published').limit(20),
        supabase.from('exam_attempts').select('*').eq('student_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('ca_scores').select('*').eq('student_id', session.user.id),
        supabase.from('assignments').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      const results = await Promise.race([dataPromise, timeoutPromise.then(() => null)])

      if (!results) {
        setLoadError(true)
        setLoading(false)
        return
      }

      const [profileResult, progressResult, classmatesResult, examsResult, attemptsResult, caScoresResult, assignmentsResult, notesResult] = results as any

      const profileData = profileResult?.data
      if (!profileData) {
        setLoading(false)
        return
      }

      setProfile(profileData)
      if (progressResult?.data) setTermProgress(progressResult.data)

      // Get classmates with the correct class
      const classmatesData = classmatesResult?.data || []
      
      // Re-fetch classmates with correct class
      const { data: realClassmates } = await supabase
        .from('profiles')
        .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
        .eq('class', profileData.class)
        .eq('role', 'student')
        .neq('id', profileData.id)
        .limit(6)

      const exams = examsResult?.data || []
      const attempts = attemptsResult?.data || []
      const caScores = caScoresResult?.data || []

      // Process data (same logic as before, just with safety checks)
      const caScoresMap: Record<string, any> = {}
      caScores?.forEach((ca: any) => { if (ca.exam_id) caScoresMap[ca.exam_id] = ca })

      const examIds = [...new Set((attempts || []).map((a: any) => a.exam_id))]
      let examMap: Record<string, any> = {}
      
      if (examIds.length > 0) {
        const { data: examDetails } = await supabase.from('exams').select('id, title, subject').in('id', examIds)
        examDetails?.forEach((e: any) => { examMap[e.id] = e })
      }

      const enrichedAttempts = (attempts || []).map((a: any) => {
        const caScore = caScoresMap[a.exam_id]
        const examScore = Number(a.total_score) || 0
        const ca1Score = caScore?.ca1_score ? Number(caScore.ca1_score) : 0
        const ca2Score = caScore?.ca2_score ? Number(caScore.ca2_score) : 0
        const grandTotal = ca1Score + ca2Score + examScore
        
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
          display_percentage: displayPercentage,
          has_ca: !!caScore
        }
      })

      const allSubmitted = enrichedAttempts.filter((a: any) => 
        ['completed', 'pending_theory', 'graded'].includes(a.status) ||
        (a.is_auto_submitted && a.auto_submit_reason?.toLowerCase().includes('time'))
      )

      const passedExams = allSubmitted.filter((a: any) => 
        a.has_ca && a.ca_score?.grade ? !['F9'].includes(a.ca_score.grade) : (a.is_passed === true || (a.percentage && a.percentage >= 50))
      ).length

      const failedExams = allSubmitted.filter((a: any) => 
        a.has_ca && a.ca_score?.grade ? a.ca_score.grade === 'F9' : (a.is_passed === false && a.percentage !== null && a.percentage < 50)
      ).length

      const displayAvgScore = allSubmitted.length > 0
        ? Math.round(allSubmitted.reduce((sum: number, a: any) => 
            sum + (a.has_ca && a.ca_score?.total_score ? Number(a.ca_score.total_score) : (a.percentage || 0)), 0) / allSubmitted.length)
        : 0

      const completedAndGradedIds = allSubmitted.map((a: any) => a.exam_id)
      const availableExams = exams.filter((e: any) => !completedAndGradedIds.includes(e.id))

      setStats({
        availableExams,
        classmates: realClassmates || classmatesData,
        recentAttempts: enrichedAttempts.slice(0, 10),
        allAttempts: enrichedAttempts,
        allAssignments: assignmentsResult?.data || [],
        recentAssignments: (assignmentsResult?.data || []).slice(0, 5),
        allNotes: notesResult?.data || [],
        recentNotes: (notesResult?.data || []).slice(0, 5),
        passedExams, failedExams,
        completedExams: allSubmitted.length,
        averageScore: displayAvgScore,
        pendingTheoryCount: enrichedAttempts.filter((a: any) => a.status === 'pending_theory').length,
        caScoresCount: caScores?.length || 0,
        subjectsWithCA: [...new Set(caScores?.map((ca: any) => ca.subject) || [])],
      })
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadProfileAndData() }, [loadProfileAndData])

  // ✅ Only reload on focus if not just loaded
  const lastLoadRef = useState(0)
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now()
      if (now - lastLoadRef[0] > 30000) { // Only reload if 30s since last load
        lastLoadRef[0] = now
        loadProfileAndData()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProfileAndData, lastLoadRef])

  const handleLogout = async () => {
    window.location.href = '/portal' // ✅ Instant redirect
    supabase.auth.signOut().catch(() => {})
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

  // ✅ Loading with timeout
  if (loading && !loadError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={handleLogout} />
        <div className="flex w-full">
          <div className="hidden lg:block">
            <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab={activeSection} setActiveTab={setActiveSection} />
          </div>
          <div className={cn("flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
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

  // ✅ Error state
  if (loadError && !profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <LayoutDashboard className="h-16 w-16 text-slate-400 mx-auto" />
            <p className="mt-4 text-slate-600 text-lg font-medium">Failed to load dashboard</p>
            <Button onClick={loadProfileAndData} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center"><p className="text-slate-500">Redirecting to login...</p></div>
        </div>
      </div>
    )
  }

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