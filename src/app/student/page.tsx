/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/student/page.tsx - FULLY RESPONSIVE WITH ASSIGNMENTS & NOTES
'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  BookOpen, Award, Clock, TrendingUp, CheckCircle,
  XCircle, ChevronRight, FileText, MonitorPlay, BarChart3, Activity,
  Search, User, ArrowRight, Trophy, Eye, LayoutDashboard, Menu,
  GraduationCap, CheckCircle2, FileCheck, Download, Calendar, File
} from 'lucide-react'

// ============================================
// NAME FORMATTING
// ============================================
function formatFullName(firstName: string | null | undefined, lastName: string | null | undefined, fallback: string): string {
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  if (lastName) return lastName
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  return fallback || 'Student'
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined, fallback: string): string {
  const first = firstName || ''
  const last = lastName || ''
  
  if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase()
  if (first) return first.slice(0, 2).toUpperCase()
  if (last) return last.slice(0, 2).toUpperCase()
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return 'ST'
}

// FIXED: Helper function - JSS = 17, SSS = 10 (handles spaces in class names)
const getSubjectCountForClass = (className: string): number => {
  if (!className) return 17
  // Remove all spaces before checking (handles "SS 1", "SS 2", "JSS 1", etc.)
  const normalizedClass = className.toString().toUpperCase().replace(/\s+/g, '')
  console.log('📊 getSubjectCountForClass - Original:', className, '→ Normalized:', normalizedClass)
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

interface Assignment {
  id: string
  title: string
  subject: string
  description: string
  due_date: string
  total_marks: number
  file_url?: string
  created_at: string
  teacher_name?: string
}

interface StudyNote {
  id: string
  title: string
  subject: string
  description: string
  file_url?: string
  created_at: string
  teacher_name?: string
}

interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: ExamAttempt[]
  availableExams: Exam[]
  recentAssignments: Assignment[]
  recentNotes: StudyNote[]
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

interface ReportCardStatus {
  status: 'pending' | 'approved' | 'published' | 'rejected' | null
  term: string
  academic_year: string
  average_score?: number
  grade?: string
  id?: string
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
    availableExams: [],
    recentAssignments: [],
    recentNotes: []
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

  const [reportCardStatus, setReportCardStatus] = useState<ReportCardStatus | null>(null)

  // FIXED: Calculate totalSubjects from profile class for immediate display
  const displayTotalSubjects = useMemo(() => {
    if (!profile?.class) return 17
    return getSubjectCountForClass(profile.class)
  }, [profile?.class])

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

  const checkReportCardStatus = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('id, status, term, academic_year, average_score')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (!error && data) {
        const grade = data.average_score >= 75 ? 'A1' : 
                     data.average_score >= 70 ? 'B2' :
                     data.average_score >= 65 ? 'B3' :
                     data.average_score >= 60 ? 'C4' :
                     data.average_score >= 55 ? 'C5' :
                     data.average_score >= 50 ? 'C6' :
                     data.average_score >= 45 ? 'D7' :
                     data.average_score >= 40 ? 'E8' : 'F9'
                     
        setReportCardStatus({
          id: data.id,
          status: data.status,
          term: data.term,
          academic_year: data.academic_year,
          average_score: data.average_score,
          grade
        })
      } else {
        setReportCardStatus(null)
      }
    } catch (error) {
      console.error('Error checking report card status:', error)
    }
  }, [profile?.id])

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          if (isMounted) window.location.replace('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (isMounted) {
          const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
          
          const fullName = formatFullName(
            profileData?.first_name || null,
            profileData?.last_name || null,
            profileData?.full_name || fallbackName
          )
          
          const studentClass = profileData?.class || 'Not Assigned'
          // FIXED: Use database subject_count if available, otherwise calculate
          const calculatedSubjects = profileData?.subject_count || getSubjectCountForClass(studentClass)
          
          console.log('📊 DASHBOARD AUTH - Class:', studentClass, '| DB subject_count:', profileData?.subject_count, '| Calculated:', calculatedSubjects)
          
          setProfile({
            id: user.id,
            first_name: profileData?.first_name || null,
            last_name: profileData?.last_name || null,
            full_name: fullName,
            email: profileData?.email || user.email || '',
            class: studentClass,
            department: profileData?.department || 'General',
            vin_id: profileData?.vin_id,
            photo_url: profileData?.photo_url || null,
            admission_year: profileData?.admission_year || new Date().getFullYear(),
            role: profileData?.role || 'student',
            subject_count: calculatedSubjects
          })
          
          setBannerStats(prev => ({
            ...prev,
            totalSubjects: calculatedSubjects
          }))
          
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
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const studentClass = profile.class
      // FIXED: Use database subject_count first, then calculate
      const totalSubjects = profile.subject_count || getSubjectCountForClass(studentClass)

      console.log('📊 DASHBOARD LOAD - Class:', studentClass, '| Total Subjects:', totalSubjects)

      await checkReportCardStatus()

      // Load exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      const allExams: Exam[] = (examsData || []).filter(exam => {
        if (!exam.class || exam.class === 'all') return true
        const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
        const normalizedStudentClass = studentClass.replace(/\s+/g, '').toUpperCase()
        return normalizedExamClass === normalizedStudentClass
      })

      // Load attempts
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

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('class', studentClass)
        .order('created_at', { ascending: false })
        .limit(3)

      // Load study notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('class', studentClass)
        .order('created_at', { ascending: false })
        .limit(3)

      setStats({
        totalExams: allExams.length,
        completedExams: completedAttempts.length,
        averageScore: avgScore,
        passedExams: passedAttempts.length,
        failedExams: completedAttempts.length - passedAttempts.length,
        pendingResults: pendingAttempts.length,
        recentAttempts: attempts.slice(0, 4),
        availableExams: availableExams.slice(0, 6),
        recentAssignments: (assignmentsData || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          subject: a.subject,
          description: a.description,
          due_date: a.due_date,
          total_marks: a.total_marks,
          file_url: a.file_url,
          created_at: a.created_at,
          teacher_name: a.teacher_name
        })),
        recentNotes: (notesData || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          subject: n.subject,
          description: n.description,
          file_url: n.file_url,
          created_at: n.created_at,
          teacher_name: n.teacher_name
        }))
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

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class, profile?.subject_count, checkReportCardStatus])

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('student-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `student_id=eq.${profile.id}` },
        () => loadDashboardData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'report_cards', filter: `student_id=eq.${profile.id}` },
        () => checkReportCardStatus())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          if (payload.new.photo_url) {
            setProfile(prev => prev ? { ...prev, photo_url: payload.new.photo_url } : null)
          }
        })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [profile?.id, loadDashboardData, checkReportCardStatus])

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

  const handleTakeExam = (examId: string) => router.push(`/student/exam/${examId}`)
  const handleViewResult = (attemptId: string) => router.push(`/student/results/${attemptId}`)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          <Badge className={cn("text-xs shrink-0", isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {isPassed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs shrink-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-700 text-xs shrink-0"><Activity className="h-3 w-3 mr-1" />In Progress</Badge>
      default:
        return <Badge variant="outline" className="text-xs shrink-0">{status}</Badge>
    }
  }

  const getReportCardStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-700 shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 shrink-0"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 shrink-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 shrink-0"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default: return null
    }
  }

  const getWelcomeBannerProfile = (): WelcomeBannerProfile | null => {
    if (!profile) return null
    return {
      full_name: profile.full_name,
      class: profile.class,
      department: profile.department || undefined,
      photo_url: profile.photo_url || undefined,
      subject_count: displayTotalSubjects
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

  // FIXED: Use displayTotalSubjects for banner stats
  const finalBannerStats = {
    ...bannerStats,
    totalSubjects: displayTotalSubjects || bannerStats.totalSubjects
  }

  // Loading state
  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg w-full overflow-hidden">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-full">
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
                activeTab === tab.id ? "text-emerald-600 bg-emerald-50" : "text-slate-500"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 truncate">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center py-2 rounded-lg text-slate-500"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1 truncate">More</span>
          </button>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 bg-white border-t shadow-lg p-4 rounded-t-xl max-h-[60vh] overflow-y-auto"
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'assignments', icon: FileText, label: 'Assignments' },
                  { id: 'courses', icon: BookOpen, label: 'Courses' },
                  { id: 'performance', icon: TrendingUp, label: 'Performance' },
                  { id: 'report-card', icon: FileCheck, label: 'Report Card' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100"
                  >
                    <tab.icon className="h-5 w-5 text-slate-600" />
                    <span className="text-xs mt-1 truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 w-full overflow-hidden"
                >
                  {/* Welcome Banner */}
                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <StudentWelcomeBanner 
                      profile={getWelcomeBannerProfile()} 
                      stats={finalBannerStats}
                    />
                  </motion.div>

                  {/* Report Card Status Card */}
                  {reportCardStatus && (
                    <motion.div variants={itemVariants} className="w-full overflow-hidden">
                      <Card 
                        className={cn(
                          "border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden",
                          reportCardStatus.status === 'published' 
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500"
                            : reportCardStatus.status === 'approved'
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500"
                            : reportCardStatus.status === 'pending'
                            ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-l-yellow-500"
                            : "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-500"
                        )}
                        onClick={() => router.push('/student/report-card')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                              <div className={cn(
                                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0",
                                reportCardStatus.status === 'published' ? "bg-green-100" :
                                reportCardStatus.status === 'approved' ? "bg-blue-100" :
                                reportCardStatus.status === 'pending' ? "bg-yellow-100" : "bg-red-100"
                              )}>
                                <FileCheck className={cn(
                                  "h-5 w-5 sm:h-6 sm:w-6",
                                  reportCardStatus.status === 'published' ? "text-green-600" :
                                  reportCardStatus.status === 'approved' ? "text-blue-600" :
                                  reportCardStatus.status === 'pending' ? "text-yellow-600" : "text-red-600"
                                )} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {reportCardStatus.term} {reportCardStatus.academic_year} Report Card
                                  </h3>
                                  {getReportCardStatusBadge(reportCardStatus.status)}
                                </div>
                                {reportCardStatus.average_score && (
                                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                    Average Score: <span className="font-bold">{reportCardStatus.average_score}%</span>
                                    {reportCardStatus.grade && (
                                      <Badge className="ml-2 text-xs" variant="outline">{reportCardStatus.grade}</Badge>
                                    )}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {reportCardStatus.status === 'published' 
                                    ? '✓ Your report card is ready! Click to view and download.'
                                    : reportCardStatus.status === 'approved'
                                    ? '✓ Your report card has been approved and will be published soon.'
                                    : reportCardStatus.status === 'pending'
                                    ? '⏳ Your report card is being reviewed by the admin.'
                                    : '❌ Your report card was rejected. Please contact your teacher.'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                      {/* Left Column */}
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full overflow-hidden">
                        {/* Performance Overview */}
                        {stats.completedExams > 0 && (
                          <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600 shrink-0" />
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
                        <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <MonitorPlay className="h-5 w-5 text-emerald-600 shrink-0" />
                                Available Exams
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('exams')}>
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.availableExams.length === 0 ? (
                              <p className="text-center py-6 text-slate-500 text-sm">No exams available</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.availableExams.slice(0, 3).map((exam) => (
                                  <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm break-words">{exam.title}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{exam.subject}</Badge>
                                        <span className="text-xs text-slate-500">{exam.duration} mins</span>
                                      </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleTakeExam(exam.id)} className="bg-emerald-600 shrink-0 w-full sm:w-auto">
                                      Start
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Class Roster */}
                        <StudentClassRoster 
                          studentClass={profile?.class as string}
                          studentId={profile?.id}
                          compact={false}
                        />
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                        {/* Recent Activity */}
                        <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-600 shrink-0" />
                                Recent Activity
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('results')}>
                                View All
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.recentAttempts.length === 0 ? (
                              <p className="text-center py-6 text-slate-500 text-sm">No recent activity</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.recentAttempts.slice(0, 4).map((attempt) => (
                                  <div key={attempt.id} className="p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <p className="font-medium text-sm break-words flex-1">{attempt.exam_title}</p>
                                      {getStatusBadge(attempt.status, attempt.is_passed)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-slate-500">{attempt.exam_subject}</span>
                                      <span className={cn("font-medium text-sm", getScoreColor(attempt.percentage))}>
                                        {attempt.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Assignments Section */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden w-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800">
                                <FileText className="h-5 w-5 shrink-0" />
                                Recent Assignments
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('assignments')} className="text-blue-700">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.recentAssignments.length === 0 ? (
                              <p className="text-center py-4 text-blue-700/70 text-sm">No assignments yet</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.recentAssignments.slice(0, 2).map((assignment) => (
                                  <div key={assignment.id} className="p-3 bg-white/60 rounded-xl">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <p className="font-medium text-sm break-words">{assignment.title}</p>
                                      <Badge variant="outline" className="text-xs shrink-0">{assignment.subject}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">{assignment.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        Due: {formatDate(assignment.due_date)}
                                      </span>
                                      {assignment.file_url && (
                                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                                          <Download className="h-3 w-3 mr-1" />
                                          Download
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Study Notes Section */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden w-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-purple-800">
                                <BookOpen className="h-5 w-5 shrink-0" />
                                Study Notes
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('courses')} className="text-purple-700">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.recentNotes.length === 0 ? (
                              <p className="text-center py-4 text-purple-700/70 text-sm">No notes available</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.recentNotes.slice(0, 2).map((note) => (
                                  <div key={note.id} className="p-3 bg-white/60 rounded-xl">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <p className="font-medium text-sm break-words">{note.title}</p>
                                      <Badge variant="outline" className="text-xs shrink-0">{note.subject}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">{note.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <File className="h-3 w-3 shrink-0" />
                                        {note.teacher_name || 'Teacher'}
                                      </span>
                                      {note.file_url && (
                                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                                          <Download className="h-3 w-3 mr-1" />
                                          Download
                                        </Button>
                                      )}
                                    </div>
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
                <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold">Available Exams</h1>
                    <Badge className="bg-emerald-100 text-emerald-700 w-fit">
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
                        className="pl-9 bg-white w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAvailableExams.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="p-8 text-center">
                          <MonitorPlay className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500">No exams available.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAvailableExams.map((exam) => (
                        <Card key={exam.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base sm:text-lg break-words">{exam.title}</CardTitle>
                            <CardDescription className="text-sm break-words">{exam.subject}</CardDescription>
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
                              <Button onClick={() => handleTakeExam(exam.id)} className="w-full mt-3 bg-emerald-600 text-sm">
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
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold">My Results</h1>
                    <Badge className="bg-emerald-100 text-emerald-700 w-fit">
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
                        className="pl-9 bg-white w-full"
                      />
                    </div>
                  </div>
                  
                  <Card className="overflow-hidden">
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
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium break-words">{attempt.exam_title}</h4>
                                  <p className="text-sm text-slate-500">{attempt.exam_subject}</p>
                                  <p className="text-sm">Score: {attempt.total_score || 0} ({attempt.percentage}%)</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
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
                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <h1 className="text-xl sm:text-2xl font-bold mb-4">My Profile</h1>
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      {profile && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                            <Avatar className="h-24 w-24 shrink-0">
                              <AvatarImage src={profile.photo_url || undefined} />
                              <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                                {getInitials(profile.first_name, profile.last_name, profile.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 max-w-full">
                              <h2 className="text-xl sm:text-2xl font-bold break-words">{profile.full_name}</h2>
                              <p className="text-slate-500 text-sm break-all">{profile.email}</p>
                              <Badge className="mt-2 bg-emerald-100 text-emerald-700">{profile.class}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">First Name</p>
                              <p className="font-medium break-words">{profile.first_name || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Last Name</p>
                              <p className="font-medium break-words">{profile.last_name || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">VIN ID</p>
                              <p className="font-medium break-words">{profile.vin_id || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Department</p>
                              <p className="font-medium break-words">{profile.department}</p>
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
                              <p className="font-medium">{displayTotalSubjects} Subjects</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* REPORT CARD TAB */}
              {activeTab === 'report-card' && (
                <motion.div key="report-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold">Report Card</h1>
                  </div>
                  
                  {reportCardStatus ? (
                    <Card className={cn(
                      "border-0 shadow-lg overflow-hidden",
                      reportCardStatus.status === 'published' 
                        ? "bg-gradient-to-br from-green-50 to-emerald-50"
                        : reportCardStatus.status === 'approved'
                        ? "bg-gradient-to-br from-blue-50 to-indigo-50"
                        : reportCardStatus.status === 'pending'
                        ? "bg-gradient-to-br from-yellow-50 to-amber-50"
                        : "bg-gradient-to-br from-red-50 to-rose-50"
                    )}>
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className={cn(
                            "h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-4",
                            reportCardStatus.status === 'published' ? "bg-green-100" :
                            reportCardStatus.status === 'approved' ? "bg-blue-100" :
                            reportCardStatus.status === 'pending' ? "bg-yellow-100" : "bg-red-100"
                          )}>
                            <FileCheck className={cn(
                              "h-10 w-10",
                              reportCardStatus.status === 'published' ? "text-green-600" :
                              reportCardStatus.status === 'approved' ? "text-blue-600" :
                              reportCardStatus.status === 'pending' ? "text-yellow-600" : "text-red-600"
                            )} />
                          </div>
                          
                          <h2 className="text-xl font-bold mb-2 break-words">
                            {reportCardStatus.term} {reportCardStatus.academic_year}
                          </h2>
                          
                          <div className="mb-4">
                            {getReportCardStatusBadge(reportCardStatus.status)}
                          </div>
                          
                          {reportCardStatus.average_score && (
                            <div className="mb-4">
                              <p className="text-3xl font-bold">{reportCardStatus.average_score}%</p>
                              <p className="text-sm text-slate-500">Average Score</p>
                              {reportCardStatus.grade && (
                                <Badge className="mt-2 text-lg px-4 py-1" variant="outline">
                                  Grade: {reportCardStatus.grade}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <p className="text-slate-600 mb-6 text-sm sm:text-base break-words">
                            {reportCardStatus.status === 'published' 
                              ? 'Your report card is ready! Click below to view and download.'
                              : reportCardStatus.status === 'approved'
                              ? 'Your report card has been approved and will be published soon. Check back later!'
                              : reportCardStatus.status === 'pending'
                              ? 'Your report card is currently being reviewed by the admin. Please check back later.'
                              : 'Your report card was rejected. Please contact your class teacher for more information.'}
                          </p>
                          
                          {reportCardStatus.status === 'published' && (
                            <Button 
                              size="lg" 
                              className="bg-emerald-600"
                              onClick={() => router.push('/student/report-card')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              View & Download Report Card
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-0 shadow-lg bg-white overflow-hidden">
                      <CardContent className="text-center py-16">
                        <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Report Card Available
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Your report card for the current term has not been submitted yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
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
          <p className="mt-2 text-slate-500 text-sm">Preparing your learning space ✨</p>
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