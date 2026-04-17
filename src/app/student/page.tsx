/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/student/page.tsx - UPDATED WITH SET D COMPONENT & LOADING MESSAGE
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'
import { SetDStatsCards } from '@/components/student/SetDStatsCards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, BookOpen, Award, Clock, TrendingUp, Calendar, CheckCircle,
  XCircle, ChevronRight, FileText, MonitorPlay, BarChart3, Activity,
  Search, User, ArrowRight, Target, Trophy, Eye, LayoutDashboard, Menu,
  Flame, Zap, Sparkles, GraduationCap
} from 'lucide-react'

// ============================================
// NAME FORMATTING
// ============================================
function formatFullName(firstName: string | null, lastName: string | null, fallback: string): string {
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  if (lastName) return lastName
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  return fallback || 'Student'
}

function getFirstName(firstName: string | null, lastName: string | null, fallback: string): string {
  if (firstName && firstName.trim()) return firstName.trim()
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length > 0) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()
  }
  return 'Student'
}

function getInitials(firstName: string | null, lastName: string | null, fallback: string): string {
  if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  if (lastName) return lastName.slice(0, 2).toUpperCase()
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return 'ST'
}

const getSubjectCountForClass = (className: string): number => {
  if (!className) return 17
  const normalizedClass = className.toString().toUpperCase().replace(/\s+/g, '')
  if (normalizedClass.startsWith('JSS')) return 17
  if (normalizedClass.startsWith('SS')) return 10
  return 17
}

const calculateGrade = (percentage: number): { grade: string; color: string } => {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

// ============================================
// TYPES
// ============================================
interface StudentProfile {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string | null
  admission_year?: number
  role?: string
  subject_count?: number
}

interface WelcomeBannerProfile {
  full_name: string
  class: string
  department?: string
  photo_url?: string
  subject_count?: number
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  status: string
  created_at: string
  starts_at?: string
  ends_at?: string
  has_theory?: boolean
  passing_percentage?: number
}

interface ExamAttempt {
  id: string
  exam_id: string
  exam_title?: string
  exam_subject?: string
  status: string
  percentage: number
  is_passed: boolean
  total_score?: number
}

interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: ExamAttempt[]
  upcomingExams: Exam[]
  availableExams: Exam[]
}

interface BannerStats {
  completedExams: number
  averageScore: number
  availableExams: number
  totalExams: number
  totalSubjects: number
  currentGrade: string
  gradeColor: string
}

interface TermInfo {
  termName: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  startDate: string
  endDate: string
}

interface BestSubject {
  name: string
  score: number
}

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

// ============================================
// MAIN COMPONENT
// ============================================
function StudentDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [stats, setStats] = useState<PerformanceStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passedExams: 0,
    failedExams: 0,
    pendingResults: 0,
    recentAttempts: [],
    upcomingExams: [],
    availableExams: []
  })

  const [bannerStats, setBannerStats] = useState<BannerStats>({
    completedExams: 0,
    averageScore: 0,
    availableExams: 0,
    totalExams: 0,
    totalSubjects: 17,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400'
  })

  const [termInfo, setTermInfo] = useState<TermInfo>({
    termName: 'First Term',
    sessionYear: '2024/2025',
    currentWeek: 1,
    totalWeeks: 13,
    weekProgress: 8,
    startDate: '',
    endDate: ''
  })
  
  const [studyStreak, setStudyStreak] = useState(0)
  const [bestSubject, setBestSubject] = useState<BestSubject | null>(null)

  // Format profile for header
  const formatProfileForHeader = (profile: StudentProfile | null) => {
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

  // Load term settings from database
  const loadTermSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_term_settings')
      
      if (!error && data && data.length > 0) {
        const term = data[0]
        const { data: currentWeek } = await supabase.rpc('calculate_current_week')
        
        setTermInfo({
          termName: term.term_name,
          sessionYear: term.session_year,
          currentWeek: currentWeek || 1,
          totalWeeks: term.total_weeks || 13,
          weekProgress: Math.round(((currentWeek || 1) / (term.total_weeks || 13)) * 100),
          startDate: term.start_date,
          endDate: term.end_date
        })
      }
    } catch (error) {
      console.error('Error loading term settings:', error)
    }
  }, [])

  // Calculate study streak
  const calculateStudyStreak = useCallback(async (studentId: string) => {
    try {
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      
      if (!attempts || attempts.length === 0) {
        setStudyStreak(0)
        return
      }
      
      let streak = 0
      let currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)
      
      const attemptDates = new Set(
        attempts.map(a => new Date(a.created_at).toISOString().split('T')[0])
      )
      
      while (attemptDates.has(currentDate.toISOString().split('T')[0])) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      }
      
      setStudyStreak(streak)
    } catch (error) {
      console.error('Error calculating streak:', error)
      setStudyStreak(0)
    }
  }, [])

  // Calculate best subject
  const calculateBestSubject = useCallback((attempts: ExamAttempt[]) => {
    const subjectScores: Record<string, number[]> = {}
    
    attempts.forEach(attempt => {
      if (attempt.exam_subject && attempt.percentage) {
        if (!subjectScores[attempt.exam_subject]) {
          subjectScores[attempt.exam_subject] = []
        }
        subjectScores[attempt.exam_subject].push(attempt.percentage)
      }
    })
    
    let bestName = ''
    let bestAvg = 0
    
    Object.entries(subjectScores).forEach(([subject, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestName = subject
      }
    })
    
    if (bestName && bestAvg > 0) {
      setBestSubject({ name: bestName, score: Math.round(bestAvg) })
    } else {
      setBestSubject(null)
    }
  }, [])

  // Auth check
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log('No active session, redirecting to portal')
          if (isMounted) window.location.replace('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, full_name, email, class, department, vin_id, photo_url, admission_year, role, subject_count')
          .eq('id', session.user.id)
          .maybeSingle()

        if (isMounted) {
          const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student'
          
          const fullName = formatFullName(
            profileData?.first_name || null,
            profileData?.last_name || null,
            profileData?.full_name || fallbackName
          )
          
          setProfile({
            id: session.user.id,
            first_name: profileData?.first_name || null,
            last_name: profileData?.last_name || null,
            full_name: fullName,
            email: profileData?.email || session.user.email || '',
            class: profileData?.class || 'Not Assigned',
            department: profileData?.department || 'General',
            vin_id: profileData?.vin_id,
            photo_url: profileData?.photo_url || null,
            admission_year: profileData?.admission_year || new Date().getFullYear(),
            role: profileData?.role || 'student',
            subject_count: profileData?.subject_count || getSubjectCountForClass(profileData?.class || '')
          })
          setAuthChecking(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMounted) setAuthChecking(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) {
      console.log('No profile ID, skipping load')
      return
    }
    
    setLoading(true)
    try {
      const studentClass = profile.class
      const totalSubjects = profile.subject_count || getSubjectCountForClass(studentClass)

      // Load term settings
      await loadTermSettings()

      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (examsError) {
        console.error('Error loading exams:', examsError)
        toast.error('Failed to load exams')
        setLoading(false)
        return
      }

      const allExams: Exam[] = (examsData || []).filter(exam => {
        if (!exam.class || exam.class === 'all') return true
        
        const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
        const normalizedStudentClass = studentClass.replace(/\s+/g, '').toUpperCase()
        
        return normalizedExamClass === normalizedStudentClass
      })

      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      const attempts: ExamAttempt[] = []
      
      if (attemptsData) {
        for (const att of attemptsData) {
          const exam = allExams.find(e => e.id === att.exam_id)
          
          attempts.push({
            id: att.id,
            exam_id: att.exam_id,
            exam_title: exam?.title || 'Unknown Exam',
            exam_subject: exam?.subject || 'Unknown Subject',
            status: att.status || 'pending',
            percentage: att.percentage || att.percentage_score || 0,
            is_passed: att.is_passed || false,
            total_score: att.total_score || 0
          })
        }
      }

      const completedAttempts = attempts.filter(a => 
        a.status === 'completed' || a.status === 'graded' || 
        a.status === 'pending_theory' || a.status === 'submitted'
      )
      
      const pendingAttempts = attempts.filter(a => 
        a.status === 'pending_theory' || a.status === 'submitted'
      )
      
      const passedAttempts = completedAttempts.filter(a => a.is_passed)

      const avgScore = completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
        : 0

      const takenExamIds = new Set(completedAttempts.map(a => a.exam_id))
      
      const now = new Date()
      const availableExams = allExams.filter(exam => {
        if (takenExamIds.has(exam.id)) return false
        if (!exam.starts_at && !exam.ends_at) return true
        if (exam.starts_at && new Date(exam.starts_at) > now) return false
        if (exam.ends_at && new Date(exam.ends_at) < now) return false
        return true
      })

      const upcomingExams = allExams.filter(exam => {
        if (takenExamIds.has(exam.id)) return false
        if (!exam.starts_at) return false
        return new Date(exam.starts_at) > now
      }).slice(0, 5)

      setStats({
        totalExams: allExams.length,
        completedExams: completedAttempts.length,
        averageScore: avgScore,
        passedExams: passedAttempts.length,
        failedExams: completedAttempts.length - passedAttempts.length,
        pendingResults: pendingAttempts.length,
        recentAttempts: attempts.slice(0, 5),
        upcomingExams,
        availableExams: availableExams.slice(0, 6)
      })

      const gradeInfo = calculateGrade(avgScore)
      setBannerStats({
        completedExams: completedAttempts.length,
        averageScore: avgScore,
        availableExams: availableExams.length,
        totalExams: allExams.length,
        totalSubjects: totalSubjects,
        currentGrade: completedAttempts.length > 0 ? gradeInfo.grade : 'N/A',
        gradeColor: gradeInfo.color
      })

      // Calculate study streak and best subject
      await calculateStudyStreak(profile.id)
      calculateBestSubject(completedAttempts)

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class, profile?.subject_count, loadTermSettings, calculateStudyStreak, calculateBestSubject])

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('student-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_attempts',
          filter: `student_id=eq.${profile.id}`
        },
        () => {
          console.log('🔄 Exam attempt changed, refreshing...')
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [profile?.id, loadDashboardData])

  useEffect(() => {
    if (!authChecking && profile) {
      loadDashboardData()
    }
  }, [authChecking, profile, loadDashboardData])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const handleTakeExam = (examId: string) => {
    router.push(`/student/exam/${examId}`)
  }

  const handleViewResult = (attemptId: string) => {
    router.push(`/student/results/${attemptId}`)
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string, isPassed?: boolean) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return (
          <Badge className={cn(
            "text-xs",
            isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {isPassed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            <Activity className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const getWelcomeBannerProfile = (): WelcomeBannerProfile | null => {
    if (!profile) return null
    return {
      full_name: profile.full_name,
      class: profile.class,
      department: profile.department || undefined,
      photo_url: profile.photo_url || undefined,
      subject_count: profile.subject_count || getSubjectCountForClass(profile.class)
    }
  }

  const filteredAvailableExams = stats.availableExams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRecentAttempts = stats.recentAttempts.filter(attempt => 
    attempt.exam_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attempt.exam_subject?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <GraduationCap className="h-16 w-16 text-emerald-600 mx-auto" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-slate-600 text-lg font-medium"
            >
              Loading Student Dashboard...
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-2 text-slate-500 text-sm"
            >
              Preparing your learning space ✨
            </motion.p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-emerald-400"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      {/* Mobile Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg w-full">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Home' },
            { id: 'exams', icon: MonitorPlay, label: 'Exams' },
            { id: 'results', icon: Award, label: 'Results' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center py-2 rounded-lg transition-all",
                activeTab === tab.id
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-slate-500"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center py-2 rounded-lg text-slate-500"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1">More</span>
          </button>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 bg-white border-t shadow-lg p-4 rounded-t-xl"
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'assignments', icon: FileText, label: 'Assignments' },
                  { id: 'attendance', icon: Calendar, label: 'Attendance' },
                  { id: 'performance', icon: TrendingUp, label: 'Performance' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100"
                  >
                    <tab.icon className="h-5 w-5 text-slate-600" />
                    <span className="text-xs mt-1">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 lg:px-6 py-4 sm:py-6 max-w-full">
            
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Welcome Banner */}
                  <motion.div variants={itemVariants}>
                    <StudentWelcomeBanner 
                      profile={getWelcomeBannerProfile()} 
                      stats={bannerStats}
                    />
                  </motion.div>

                  {/* SET D STATS CARDS - Using the reusable component */}
                  <motion.div variants={itemVariants}>
                    <SetDStatsCards
                      termInfo={termInfo}
                      totalSubjects={bannerStats.totalSubjects}
                      completedExams={bannerStats.completedExams}
                      studyStreak={studyStreak}
                      bestSubject={bestSubject}
                      studentClass={profile?.class}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Performance Overview */}
                        {stats.completedExams > 0 && (
                          <Card className="border-0 shadow-sm bg-white">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600" />
                                Performance Overview
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span>Pass Rate</span>
                                    <span>{stats.completedExams > 0 ? Math.round((stats.passedExams / stats.completedExams) * 100) : 0}%</span>
                                  </div>
                                  <Progress value={stats.completedExams > 0 ? (stats.passedExams / stats.completedExams) * 100 : 0} className="h-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                    <Trophy className="h-5 w-5 text-green-600 mx-auto mb-2" />
                                    <p className="text-3xl font-bold text-green-700">{stats.passedExams}</p>
                                    <p className="text-sm text-green-600">Passed</p>
                                  </div>
                                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4">
                                    <XCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                                    <p className="text-3xl font-bold text-red-700">{stats.failedExams}</p>
                                    <p className="text-sm text-red-600">Failed</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Available Exams */}
                        <Card className="border-0 shadow-sm bg-white">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <MonitorPlay className="h-5 w-5 text-emerald-600" />
                                Available Exams
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('exams')}>
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.availableExams.length === 0 ? (
                              <p className="text-center py-6 text-slate-500">No exams available</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.availableExams.slice(0, 3).map((exam) => (
                                  <div key={exam.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{exam.title}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{exam.subject}</Badge>
                                        <span className="text-xs text-slate-500">{exam.duration} mins</span>
                                      </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleTakeExam(exam.id)} className="bg-emerald-600 shrink-0">
                                      Start
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <StudentClassRoster 
                          studentClass={profile?.class}
                          studentId={profile?.id}
                          compact={false}
                        />
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        {/* Recent Activity */}
                        <Card className="border-0 shadow-sm bg-white">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-600" />
                                Recent Activity
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('results')}>
                                View All
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.recentAttempts.length === 0 ? (
                              <p className="text-center py-6 text-slate-500">No recent activity</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.recentAttempts.slice(0, 4).map((attempt) => (
                                  <div key={attempt.id} className="p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <p className="font-medium text-sm truncate flex-1">{attempt.exam_title}</p>
                                      {getStatusBadge(attempt.status, attempt.is_passed)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-slate-500">{attempt.exam_subject}</span>
                                      <span className={cn("font-medium", getScoreColor(attempt.percentage))}>
                                        {attempt.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Upcoming Exams */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-white flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Upcoming Exams
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {stats.upcomingExams.length === 0 ? (
                              <p className="text-emerald-100 text-center py-4">No upcoming exams</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.upcomingExams.slice(0, 3).map((exam) => (
                                  <div key={exam.id} className="p-3 bg-white/10 rounded-xl">
                                    <p className="font-medium text-sm">{exam.title}</p>
                                    <p className="text-xs text-emerald-100">{exam.subject}</p>
                                    <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDateTime(exam.starts_at)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* EXAMS TAB */}
              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Available Exams</h1>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {stats.availableExams.length} available
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search exams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAvailableExams.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="p-8 text-center">
                          <MonitorPlay className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500">No exams available.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAvailableExams.map((exam) => (
                        <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg truncate">{exam.title}</CardTitle>
                            <CardDescription>{exam.subject}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Duration:</span>
                                <span>{exam.duration} mins</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Questions:</span>
                                <span>{exam.total_questions}</span>
                              </div>
                              <Button onClick={() => handleTakeExam(exam.id)} className="w-full mt-3 bg-emerald-600">
                                Take Exam <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* RESULTS TAB */}
              {activeTab === 'results' && (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">My Results</h1>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {stats.completedExams} completed
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search results..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white"
                      />
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      {filteredRecentAttempts.length === 0 ? (
                        <div className="text-center py-8">
                          <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500">No exam results yet.</p>
                          <Button variant="link" onClick={() => handleTabChange('exams')}>
                            Browse available exams
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredRecentAttempts.map((attempt) => (
                            <div key={attempt.id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-medium">{attempt.exam_title}</h4>
                                  <p className="text-sm text-slate-500">{attempt.exam_subject}</p>
                                  <p className="text-sm">Score: {attempt.total_score || 0} ({attempt.percentage}%)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(attempt.status, attempt.is_passed)}
                                  <Button variant="outline" size="sm" onClick={() => handleViewResult(attempt.id)}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h1 className="text-2xl font-bold mb-4">My Profile</h1>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      {profile && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                            <Avatar className="h-24 w-24">
                              <AvatarImage src={profile.photo_url || undefined} />
                              <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                                {getInitials(profile.first_name, profile.last_name, profile.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                              <p className="text-slate-500">{profile.email}</p>
                              <Badge className="mt-2 bg-emerald-100 text-emerald-700">{profile.class}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">First Name</p>
                              <p className="font-medium">{profile.first_name || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Last Name</p>
                              <p className="font-medium">{profile.last_name || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">VIN ID</p>
                              <p className="font-medium">{profile.vin_id || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Department</p>
                              <p className="font-medium">{profile.department}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Admission Year</p>
                              <p className="font-medium">{profile.admission_year || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Role</p>
                              <p className="font-medium capitalize">{profile.role}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2">
                              <p className="text-xs text-slate-500">Total Subjects</p>
                              <p className="font-medium">{profile.subject_count || getSubjectCountForClass(profile.class)} Subjects</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <GraduationCap className="h-12 w-12 text-emerald-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Student Dashboard...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
}