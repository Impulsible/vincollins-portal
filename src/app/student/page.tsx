// src/app/student/page.tsx - FIXED: Accurate CA + Objective + Theory Averaging
'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { instantLogout, getCachedHeaderUser } from '@/lib/auth-utils'
import { Header, HeaderUser } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { OverviewTab } from '@/components/student/OverviewTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Award, RefreshCw, AlertTriangle, Loader2, GraduationCap, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

const LOADING_TIMEOUT_MS = 10000

function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600 dark:text-emerald-400' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600 dark:text-amber-400' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600 dark:text-orange-400' }
  return { grade: 'F', color: 'text-red-600 dark:text-red-400' }
}

// ============================================
// NORMALISERS
// ============================================
const normYear = (c?: string | null): string => {
  const n = (c || '').toUpperCase().replace(/\s/g, '')
  for (const y of ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']) {
    if (n.includes(y)) return y
  }
  return n
}

const extractYear = normYear

const normTerm = (t?: string | null): string => {
  const s = (t || '').toLowerCase().replace(/term/g, '').trim()
  const map: Record<string, string> = { '1st': 'first', '2nd': 'second', '3rd': 'third' }
  return map[s] || s
}

const deptOf = (c?: string | null): string | undefined =>
  ['Science', 'Arts', 'Commercial'].find(d => (c || '').toLowerCase().includes(d.toLowerCase()))

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

const cachedHeaderUser = getCachedHeaderUser()

// ============================================
// DYNAMIC TERM FETCHING
// ============================================
async function fetchCurrentTermAndSession(): Promise<{ term: string; session: string }> {
  try {
    const { data: termData, error: termError } = await supabase
      .from('terms')
      .select('term_code, session_year')
      .eq('is_current', true)
      .single()

    if (!termError && termData) {
      return { term: termData.term_code, session: termData.session_year }
    }

    const { data: settings, error: settingsError } = await supabase
      .from('school_settings')
      .select('current_term, current_session')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!settingsError && settings?.current_term && settings?.current_session) {
      return { term: settings.current_term, session: settings.current_session }
    }
    return { term: '', session: '' }
  } catch (error) {
    return { term: '', session: '' }
  }
}

// ============================================
// PUBLISHED EXAMS
// ============================================
async function fetchPublishedExams(
  userClass: string,
  department: string | undefined,
  term: string,
  session: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('status', 'published')
    .eq('is_active', true)
    .eq('session_year', session)
    .order('created_at', { ascending: false })

  if (error) return []

  const studentDept = (deptOf(userClass) || department || '').toLowerCase()

  return (data || []).filter((e: any) => {
    if (e.is_archived === true) return false
    if (normTerm(e.term) !== normTerm(term)) return false
    if (normYear(e.class) !== normYear(userClass)) return false

    const examDept = deptOf(e.class)
    if (examDept && examDept.toLowerCase() !== studentDept) return false

    const t = (e.target_audience || '').toLowerCase()
    return !t || t === 'all' || t === 'all students' || t === studentDept
  })
}

// ============================================
// DASHBOARD LOADER
// ============================================
async function buildDashboardData(params: {
  userId: string
  userClass: string
  department?: string
  term: string
  session: string
}): Promise<{ data: DashboardData | null; isActive: boolean }> {
  const { userId, userClass, department, term, session } = params
  const userYear = extractYear(userClass)

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', userId)
    .single()

  const isUserActive = myProfile?.is_active !== false

  if (!userClass) return { data: null, isActive: isUserActive }

  let classmates: any[] = []
  let exams: any[] = []
  let assignments: any[] = []
  let notes: any[] = []

  if (isUserActive) {
    const { data: classmatesData } = await supabase
      .from('profiles')
      .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
      .eq('role', 'student')
      .eq('is_active', true)
      .neq('id', userId)
      .ilike('class', `%${userYear}%`)

    classmates = classmatesData || []
    exams = await fetchPublishedExams(userClass, department, term, session)

    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .eq('status', 'published')
      .or(`classes.cs.{${userClass}},class.eq.${userClass}`)
      .order('created_at', { ascending: false })
      .limit(10)

    assignments = assignmentsData || []

    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('class', userClass)
      .order('created_at', { ascending: false })
      .limit(10)

    notes = notesData || []
  }

  const { data: attemptsData } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('student_id', userId)
    .eq('term', term)
    .eq('session_year', session)
    .order('created_at', { ascending: false })

  const { data: caScoresData } = await supabase
    .from('ca_scores')
    .select('*')
    .eq('student_id', userId)
    .eq('term', term)
    .eq('academic_year', session)
    .order('created_at', { ascending: false })

  const { data: progressData } = await supabase
    .from('student_term_progress')
    .select('*')
    .eq('student_id', userId)
    .eq('term', term)
    .eq('session_year', session)
    .maybeSingle()

  const attempts = attemptsData || []
  const caScores = caScoresData || []
  const progress = progressData

  const caScoresMap: Record<string, any> = {}
  caScores.forEach((ca: any) => { if (ca.exam_id) caScoresMap[ca.exam_id] = ca })

  const examIds = [...new Set(attempts.map((a: any) => a.exam_id))]
  const examMap: Record<string, any> = {}

  if (examIds.length > 0) {
    const { data: examDetails } = await supabase
      .from('exams')
      .select('id, title, subject, objective_max, theory_max')
      .in('id', examIds.slice(0, 50))
    examDetails?.forEach((e: any) => { examMap[e.id] = e })
  }

  const enrichedAttempts = attempts.map((a: any) => {
    const caScore = caScoresMap[a.exam_id]
    const exam = examMap[a.exam_id]
    return {
      ...a,
      exam_title: exam?.title || 'Exam',
      exam_subject: exam?.subject || 'Unknown Subject',
      objective_total: a.objective_total || exam?.objective_max || 20,
      theory_total: a.theory_total || exam?.theory_max || 40,
      ca_score: caScore || null,
      has_ca: !!caScore
    }
  })

  const allSubmitted = enrichedAttempts.filter((a: any) =>
    ['completed', 'pending_theory', 'graded'].includes(a.status)
  )

  const pendingTheoryCount = enrichedAttempts.filter((a: any) => a.status === 'pending_theory').length

  // 🛠️ THE FIX: FORCE CA1 + CA2 MATH
  let totalPct = 0, passedCount = 0, failedCount = 0

  allSubmitted.forEach((a: any) => {
    const objectiveMax = Number(a.objective_total) || 20
    const theoryMax = Number(a.theory_total) || 40
    const objScore = Number(a.objective_score) || 0
    const thyScore = Number(a.theory_score) || 0
    
    // FORCE CA Math: Add CA1 + CA2 directly (Ignore total_score entirely)
    const ca1 = Number(a.ca_score?.ca1_score) || 0
    const ca2 = Number(a.ca_score?.ca2_score) || 0
    const caTotal = ca1 + ca2

    let percentage = 0

    if (a.status === "pending_theory") {
      percentage = objectiveMax > 0 ? Math.round((objScore / objectiveMax) * 100) : 0
    } else if (a.status === "completed" || a.status === "graded") {
      if (caTotal > 0) {
        const totalScore = caTotal + objScore + thyScore
        percentage = Math.round((totalScore / 100) * 100)
      } else {
        const examMax = objectiveMax + theoryMax
        const totalScore = objScore + thyScore
        percentage = examMax > 0 ? Math.round((totalScore / examMax) * 100) : 0
      }
    }

    a.percentage = Math.min(Math.max(percentage, 0), 100)
    totalPct += a.percentage
    
    if (a.percentage >= 40) passedCount++
    else failedCount++
  })

  const avgScore = allSubmitted.length > 0
    ? Number((totalPct / allSubmitted.length).toFixed(2))
    : 0

  const completedAndGradedIds = allSubmitted.map((a: any) => a.exam_id)
  const availableExams = exams.filter((e: any) => !completedAndGradedIds.includes(e.id))

  const data: DashboardData = {
    stats: {
      availableExams,
      classmates,
      recentAttempts: enrichedAttempts.slice(0, 10),
      allAttempts: enrichedAttempts,
      allAssignments: assignments,
      recentAssignments: assignments.slice(0, 5),
      allNotes: notes,
      recentNotes: notes.slice(0, 5),
      passedExams: passedCount,
      failedExams: failedCount,
      completedExams: allSubmitted.length,
      trulyCompletedCount: allSubmitted.length,
      averageScore: avgScore,
      trueAverageScore: avgScore,
      pendingTheoryCount,
      caScoresCount: caScores.length,
      subjectsWithCA: [...new Set(caScores.map((ca: any) => ca.subject))] as string[],
    },
    termProgress: progress,
    reportCardStatus: null,
  }

  return { data, isActive: isUserActive }
}

// ============================================
// UI COMPONENTS
// ============================================
function LoadingSpinner() {
  const loadingMessages = [
    { text: "Loading your learning space...", emoji: "📚" },
    { text: "Preparing your dashboard...", emoji: "🎓" },
    { text: "Almost there...", emoji: "✨" }
  ]
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex((prev) => (prev + 1) % loadingMessages.length), 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center z-40 transition-colors duration-300">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-200 dark:border-emerald-900/60 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <motion.p key={messageIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-6 text-slate-600 dark:text-slate-300 text-lg font-medium">
          {loadingMessages[messageIndex].text}
        </motion.p>
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingTimeoutError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center transition-colors duration-300">
      <div className="text-center px-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 dark:text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Taking too long</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tap retry to load faster</p>
        <Button onClick={onRetry} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD
// ============================================
function StudentDashboardContent() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [isActiveAccount, setIsActiveAccount] = useState(true)

  const [currentTerm, setCurrentTerm] = useState('')
  const [currentSession, setCurrentSession] = useState('')
  const [isLoadingTerm, setIsLoadingTerm] = useState(true)

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('student_dashboard_cache')
      if (cached) {
        try { return JSON.parse(cached) } catch (e) { return null }
      }
    }
    return null
  })

  const [loading, setLoading] = useState(!dashboardData)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dataFetchedRef = useRef(false)
  const redirectCheckedRef = useRef(false)

  const headerUser: HeaderUser | undefined = useMemo(() => {
    if (contextUser) {
      return {
        id: contextUser.id,
        name: contextUser.full_name || contextUser.first_name || 'Student',
        firstName: contextUser.first_name || contextUser.full_name?.split(' ')[0] || 'Student',
        email: contextUser.email || '',
        role: 'student' as const,
        avatar: contextUser.avatar_url || contextUser.photo_url || undefined,
        isAuthenticated: true
      }
    }
    if (cachedHeaderUser) return cachedHeaderUser
    return undefined
  }, [contextUser])

  useEffect(() => {
    const loadTerm = async () => {
      const { term, session } = await fetchCurrentTermAndSession()
      setCurrentTerm(term)
      setCurrentSession(session)
      setIsLoadingTerm(false)
    }
    loadTerm()
  }, [])

  useEffect(() => {
    if (redirectCheckedRef.current) return
    if (!authLoading) {
      redirectCheckedRef.current = true
      if (!isAuthenticated || !contextUser) {
        if (!cachedHeaderUser) router.replace('/portal')
        return
      }
      const userRole = contextUser.role?.toLowerCase()
      if (!userRole || !['student'].includes(userRole)) {
        router.replace('/portal')
        return
      }
    }
  }, [authLoading, isAuthenticated, contextUser, router])

  useEffect(() => {
    if (authLoading || isLoadingTerm) return
    if (!isAuthenticated || !contextUser?.id) return
    if (!currentTerm || !currentSession) return
    if (contextUser.role?.toLowerCase() !== 'student') return
    if (dataFetchedRef.current) return

    const fetchData = async () => {
      dataFetchedRef.current = true
      setRefreshing(true)

      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) setLoadingTimeout(true)
      }, LOADING_TIMEOUT_MS)

      try {
        const oldCache = localStorage.getItem('student_dashboard_cache')
        if (oldCache) {
          try {
            const parsed = JSON.parse(oldCache)
            if (parsed.termProgress?.term !== currentTerm || parsed.termProgress?.session_year !== currentSession) {
              localStorage.removeItem('student_dashboard_cache')
            }
          } catch (e) { localStorage.removeItem('student_dashboard_cache') }
        }

        const { data, isActive } = await buildDashboardData({
          userId: contextUser.id,
          userClass: contextUser.class || '',
          department: (contextUser as any).department,
          term: currentTerm,
          session: currentSession,
        })

        setIsActiveAccount(isActive)
        if (!data) { setLoading(false); return }

        setDashboardData(data)
        setLoading(false)
        localStorage.setItem('student_dashboard_cache', JSON.stringify(data))
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setRefreshing(false)
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
      }
    }

    fetchData()

    return () => { if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current) }
  }, [contextUser?.id, contextUser?.class, authLoading, isAuthenticated, contextUser?.role, loading, currentTerm, currentSession, isLoadingTerm])

  useEffect(() => {
    dataFetchedRef.current = false
    setDashboardData(null)
    setLoading(true)
    setLoadingTimeout(false)
  }, [contextUser?.id])

  const stats = dashboardData?.stats || DEFAULT_STATS
  const termProgress = dashboardData?.termProgress

  const handleLogout = () => instantLogout()
  const handleRetry = () => {
    dataFetchedRef.current = false
    localStorage.removeItem('student_dashboard_cache')
    window.location.reload()
  }

  const handleBackgroundRefresh = useCallback(async () => {
    if (!isAuthenticated || !contextUser?.id || refreshing || isLoadingTerm) return
    if (!currentTerm || !currentSession) return

    setRefreshing(true)
    // 🛠️ Clear cache on background refresh so it always gets fresh DB data
    localStorage.removeItem('student_dashboard_cache')

    try {
      const { data, isActive } = await buildDashboardData({
        userId: contextUser.id,
        userClass: contextUser.class || '',
        department: (contextUser as any).department,
        term: currentTerm,
        session: currentSession,
      })

      setIsActiveAccount(isActive)
      if (!data) return

      setDashboardData(data)
      localStorage.setItem('student_dashboard_cache', JSON.stringify(data))
    } catch (error) {
      console.error('Background refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }, [contextUser, isAuthenticated, refreshing, currentTerm, currentSession, isLoadingTerm])

  useEffect(() => {
    if (!isAuthenticated || !contextUser || isLoadingTerm) return
    if (!currentTerm || !currentSession) return
    const interval = setInterval(() => handleBackgroundRefresh(), 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, contextUser, handleBackgroundRefresh, isLoadingTerm, currentTerm, currentSession])

  const dashboardMetrics = useMemo(() => {
    const completedExams = stats.completedExams || 0
    const totalExams = termProgress?.total_subjects || (stats.availableExams?.length + completedExams) || 0
    const availableExams = stats.availableExams?.length || 0
    const avgScore = stats.averageScore ?? 0
    const gradeInfo = calculateGrade(avgScore)

    return { completedExams, totalExams, availableExams, avgScore, gradeInfo }
  }, [stats.completedExams, stats.availableExams, stats.averageScore, termProgress?.total_subjects])

  const showLoadingSpinner = (loading && !dashboardData && !loadingTimeout) || (authLoading && !cachedHeaderUser) || isLoadingTerm

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden w-full transition-colors duration-300">
      <Header user={headerUser} onLogout={handleLogout} />

      {showLoadingSpinner ? (
        <LoadingSpinner />
      ) : loading && loadingTimeout ? (
        <LoadingTimeoutError onRetry={handleRetry} />
      ) : (
        <>
          {refreshing && (
            <div className="fixed bottom-4 right-4 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full shadow-lg px-3.5 py-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" /> Updating...
            </div>
          )}

          <div className="flex w-full overflow-x-hidden">
            <StudentSidebar
              profile={contextUser}
              onLogout={handleLogout}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              activeTab={activeSection}
              setActiveTab={setActiveSection}
            />

            <div className={cn("flex-1 transition-all duration-300 w-full overflow-x-hidden", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
              <main className="min-h-[calc(100vh-64px)] pt-[72px] lg:pt-24 pb-12 px-3 sm:px-4 lg:px-8 w-full overflow-x-hidden">
                <div className="w-full max-w-7xl mx-auto">
                  {!isActiveAccount && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                        <div>
                          <p className="font-semibold text-sm">Archived Account (Read-Only Mode)</p>
                          <p className="text-xs opacity-80 mt-0.5">You have left the school. This portal is read-only for accessing past performance records, CBT results, and transcripts.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">Archived</span>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                      {activeSection === 'overview' && (
                        <OverviewTab
                          profile={contextUser}
                          stats={stats}
                          bannerStats={{
                            availableExams: dashboardMetrics.availableExams,
                            totalExams: dashboardMetrics.totalExams,
                            completedExams: dashboardMetrics.completedExams,
                            averageScore: dashboardMetrics.avgScore, 
                            currentGrade: dashboardMetrics.gradeInfo.grade,
                            gradeColor: dashboardMetrics.gradeInfo.color,
                            passedExams: stats.passedExams || 0,
                            failedExams: stats.failedExams || 0,
                            pendingTheoryCount: stats.pendingTheoryCount || 0,
                            caScoresCount: stats.caScoresCount || 0,
                            subjectsWithCA: stats.subjectsWithCA || [],
                          }}
                          reportCardStatus={dashboardData?.reportCardStatus}
                          welcomeBannerProfile={contextUser}
                          handleTabChange={setActiveSection}
                          router={router}
                        />
                      )}

                      {activeSection === 'exams' && (
                        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mt-2">
                          <CardContent className="py-12 sm:py-20 text-center">
                            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">My Exams</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">Your exams will appear here</p>
                          </CardContent>
                        </Card>
                      )}

                      {activeSection === 'results' && (
                        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mt-2">
                          <CardContent className="py-12 sm:py-20 text-center">
                            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center mb-4">
                              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">My Results</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">Your results will appear here</p>
                          </CardContent>
                        </Card>
                      )}

                      {activeSection === 'classmates' && isActiveAccount && (
                        <ClassmatesTab profile={contextUser} stats={stats} handleTabChange={setActiveSection} router={router} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentDashboardContent