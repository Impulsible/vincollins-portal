// app/student/page.tsx - FAST LOADING (No Skeleton, No Multi-Loading)

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
import { instantLogout } from '@/lib/auth-utils'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { OverviewTab } from '@/components/student/OverviewTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import StudentLoading from '@/components/student/StudentLoading'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Award, RefreshCw, AlertTriangle } from 'lucide-react'
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

const CACHE_DURATION = 30000
const LOADING_TIMEOUT_MS = 10000 // 10 seconds max

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

// ============================================
// FAST TIMEOUT ERROR
// ============================================
function LoadingTimeoutError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
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
// MAIN COMPONENT
// ============================================
function StudentDashboardContent() {
  const router = useRouter()
  const { user: contextUser } = useUser()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch data directly - NO CACHE, NO EXTRA HOOKS
  useEffect(() => {
    if (!contextUser?.id || !contextUser?.class) return

    const fetchData = async () => {
      setLoading(true)
      setLoadingTimeout(false)
      
      try {
        const userId = contextUser.id
        const userClass = contextUser.class

        // Fast parallel queries - minimal data
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

        const progress = progressResult.data
        const classmates = classmatesResult.error ? [] : classmatesResult.data || []
        const exams = examsResult.error ? [] : examsResult.data || []
        const attempts = attemptsResult.error ? [] : attemptsResult.data || []
        const caScores = caScoresResult.error ? [] : caScoresResult.data || []
        const assignments = assignmentsResult.error ? [] : assignmentsResult.data || []
        const notes = notesResult.error ? [] : notesResult.data || []

        // Fast CA mapping
        const caScoresMap: Record<string, any> = {}
        caScores.forEach((ca: any) => { if (ca.exam_id) caScoresMap[ca.exam_id] = ca })

        // Fast exam details
        const examIds = [...new Set(attempts.map((a: any) => a.exam_id))]
        let examMap: Record<string, any> = {}
        
        if (examIds.length > 0) {
          const { data: examDetails } = await supabase
            .from('exams')
            .select('id, title, subject')
            .in('id', examIds.slice(0, 50))
          examDetails?.forEach((e: any) => { examMap[e.id] = e })
        }

        // Fast enrich attempts
        const enrichedAttempts = attempts.map((a: any) => {
          const caScore = caScoresMap[a.exam_id]
          return {
            ...a,
            exam_title: examMap[a.exam_id]?.title || 'Exam',
            exam_subject: examMap[a.exam_id]?.subject || 'Unknown Subject',
            ca_score: caScore || null,
            has_ca: !!caScore
          }
        })

        // Fast calculations
        const allSubmitted = enrichedAttempts.filter((a: any) => 
          ['completed', 'pending_theory', 'graded'].includes(a.status)
        )
        
        const pendingTheoryCount = enrichedAttempts.filter((a: any) => a.status === 'pending_theory').length
        
        const passedExams = allSubmitted.filter((a: any) => {
          if (a.has_ca && a.ca_score?.grade) return !['F9'].includes(a.ca_score.grade)
          return a.is_passed === true || (a.percentage && a.percentage >= 50)
        }).length
        
        const failedExams = allSubmitted.filter((a: any) => {
          if (a.has_ca && a.ca_score?.grade) return a.ca_score.grade === 'F9'
          return a.is_passed === false && a.percentage !== null && a.percentage < 50
        }).length

        const avgScore = allSubmitted.length > 0
          ? Math.round((allSubmitted.reduce((sum: number, a: any) => {
              if (a.has_ca && a.ca_score?.total_score) return sum + Number(a.ca_score.total_score)
              return sum + (a.percentage || 0)
            }, 0) / allSubmitted.length) * 100) / 100
          : 0

        const completedAndGradedIds = allSubmitted.map((a: any) => a.exam_id)
        const availableExams = exams.filter((e: any) => !completedAndGradedIds.includes(e.id))

        setDashboardData({
          stats: {
            availableExams,
            classmates,
            recentAttempts: enrichedAttempts.slice(0, 10),
            allAttempts: enrichedAttempts,
            allAssignments: assignments,
            recentAssignments: assignments.slice(0, 5),
            allNotes: notes,
            recentNotes: notes.slice(0, 5),
            passedExams,
            failedExams,
            completedExams: allSubmitted.length,
            trulyCompletedCount: allSubmitted.length,
            averageScore: avgScore,
            trueAverageScore: avgScore,
            pendingTheoryCount,
            caScoresCount: caScores.length,
            subjectsWithCA: [...new Set(caScores.map((ca: any) => ca.subject))],
          },
          termProgress: progress,
          reportCardStatus: null,
        })
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setLoading(false)
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
      }
    }

    // Set timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (loading) setLoadingTimeout(true)
    }, LOADING_TIMEOUT_MS)

    fetchData()

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
    }
  }, [contextUser?.id, contextUser?.class])

  const stats = dashboardData?.stats || DEFAULT_STATS
  const termProgress = dashboardData?.termProgress

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

  const handleLogout = () => instantLogout()
  const handleRetry = () => window.location.reload()

  const dashboardMetrics = useMemo(() => {
    const completedExams = stats.completedExams || 0
    const totalExams = termProgress?.total_subjects || (stats.availableExams?.length + completedExams) || 0
    const availableExams = stats.availableExams?.length || 0
    const avgScore = stats.averageScore ?? 0
    const gradeInfo = calculateGrade(avgScore)

    return { completedExams, totalExams, availableExams, avgScore, gradeInfo }
  }, [stats.completedExams, stats.availableExams, stats.averageScore, termProgress?.total_subjects])

  // ✅ FAST LOADING - Just the beautiful component, no skeleton, no multi-loading
  if (loading && !loadingTimeout) {
    return <StudentLoading profile={contextUser} onLogout={handleLogout} />
  }

  if (loading && loadingTimeout) {
    return <LoadingTimeoutError onRetry={handleRetry} />
  }

  // ✅ IMMEDIATE RENDER - No loading states anywhere
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar 
          profile={contextUser} 
          onLogout={handleLogout}
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeSection} 
          setActiveTab={setActiveSection}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="min-h-[calc(100vh-64px)] pt-[72px] lg:pt-24 pb-12 px-3 sm:px-4 lg:px-8 w-full overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
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
                    <Card className="border-0 shadow-sm mt-2">
                      <CardContent className="py-12 sm:py-20 text-center">
                        <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">My Exams</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                          Your exams will appear here
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {activeSection === 'results' && (
                    <Card className="border-0 shadow-sm mt-2">
                      <CardContent className="py-12 sm:py-20 text-center">
                        <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                          <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">My Results</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                          Your results will appear here
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {activeSection === 'classmates' && (
                    <ClassmatesTab 
                      profile={contextUser} 
                      stats={stats} 
                      handleTabChange={setActiveSection} 
                      router={router} 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <div className="lg:hidden h-16" />
    </div>
  )
}

// ============================================
// EXPORT
// ============================================
export default function StudentDashboardPage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <StudentDashboardContent />
    </AuthGuard>
  )
}