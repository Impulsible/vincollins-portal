/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/student/page.tsx - FULLY FIXED: Database values prioritized
'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
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
  GraduationCap, CheckCircle2, FileCheck, Download, Calendar, File,
  Grid3x3, List, Users, Mail, FolderOpen, UserPlus
} from 'lucide-react'

// ============================================
// NAME FORMATTING UTILITIES (unchanged)
// ============================================
function formatFullName(
  firstName: string | null | undefined, 
  lastName: string | null | undefined, 
  middleName?: string | null | undefined,
  fallback: string = 'Student'
): string {
  if (firstName && lastName) {
    const parts = [firstName.trim()]
    if (middleName?.trim()) parts.push(middleName.trim())
    parts.push(lastName.trim())
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  if (firstName) return firstName.trim()
  if (lastName) return lastName.trim()
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  return fallback || 'Student'
}

function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  middleName?: string | null | undefined,
  fallback: string = 'Student'
): string {
  if (firstName && lastName) {
    const parts = [lastName.trim(), firstName.trim()]
    if (middleName?.trim()) parts.push(middleName.trim())
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  return formatFullName(firstName, lastName, middleName, fallback)
}

function getBestDisplayName(
  profile: { display_name?: string | null; first_name?: string | null; last_name?: string | null; middle_name?: string | null; full_name?: string | null },
  fallback: string = 'Student'
): string {
  if (profile.display_name) return profile.display_name
  if (profile.first_name && profile.last_name) {
    return formatDisplayName(profile.first_name, profile.last_name, profile.middle_name)
  }
  return profile.full_name || formatFullName(profile.first_name, profile.last_name, profile.middle_name, fallback)
}

function getInitials(
  firstName: string | null | undefined, 
  lastName: string | null | undefined, 
  fallback: string
): string {
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

const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

// ============================================
// TYPES (unchanged)
// ============================================
interface StudentProfile {
  id: string
  first_name: string | null
  middle_name?: string | null
  last_name: string | null
  full_name: string
  display_name?: string | null
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
  display_name?: string | null
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
  term?: string
  session_year?: string
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
  term?: string
  session_year?: string
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
  class?: string
}

interface StudyNote {
  id: string
  title: string
  subject: string
  description: string
  file_url?: string
  created_at: string
  teacher_name?: string
  class?: string
}

interface Classmate {
  id: string
  first_name: string | null
  middle_name?: string | null
  last_name: string | null
  full_name: string
  display_name?: string | null
  email: string
  photo_url?: string | null
  vin_id?: string
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
  allAssignments: Assignment[]
  allNotes: StudyNote[]
  classmates: Classmate[]
}

interface BannerStats {
  completedExams: number
  averageScore: number
  availableExams: number
  totalExams: number
  totalSubjects: number
  currentGrade: string
  gradeColor: string
  currentTerm: string
  sessionYear: string
}

interface TermProgressData {
  id: string
  term: string
  session_year: string
  completed_exams: number
  total_subjects: number
  average_score: number
  grade: string
  term_completed: boolean
  class: string
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
// ANIMATION VARIANTS (unchanged)
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
  const [assignmentsSearch, setAssignmentsSearch] = useState('')
  const [notesSearch, setNotesSearch] = useState('')
  const [classmatesSearch, setClassmatesSearch] = useState('')
  const [classmatesView, setClassmatesView] = useState<'grid' | 'list'>('grid')
  
  const [termProgress, setTermProgress] = useState<TermProgressData | null>(null)
  const [currentTermSession, setCurrentTermSession] = useState<{ term: string; session_year: string } | null>(null)
  const [reportCardStatus, setReportCardStatus] = useState<ReportCardStatus | null>(null)
  
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
    recentNotes: [],
    allAssignments: [],
    allNotes: [],
    classmates: []
  })

  const [bannerStats, setBannerStats] = useState<BannerStats>({
    completedExams: 0,
    averageScore: 0,
    availableExams: 0,
    totalExams: 0,
    totalSubjects: 17,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    currentTerm: 'Third Term',
    sessionYear: '2025/2026'
  })

  const displayTotalSubjects = useMemo(() => {
    if (termProgress?.total_subjects) return termProgress.total_subjects
    if (!profile?.class) return 17
    return getSubjectCountForClass(profile.class)
  }, [profile?.class, termProgress])

  const profileDisplayName = useMemo(() => {
    if (!profile) return 'Student'
    return getBestDisplayName(profile, 'Student')
  }, [profile])

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.display_name || profile.full_name,
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
        const grade = data.average_score && data.average_score >= 75 ? 'A1' : 
                     data.average_score && data.average_score >= 70 ? 'B2' :
                     data.average_score && data.average_score >= 65 ? 'B3' :
                     data.average_score && data.average_score >= 60 ? 'C4' :
                     data.average_score && data.average_score >= 55 ? 'C5' :
                     data.average_score && data.average_score >= 50 ? 'C6' :
                     data.average_score && data.average_score >= 45 ? 'D7' :
                     data.average_score && data.average_score >= 40 ? 'E8' : 'F9'
                     
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
          .select('id, first_name, middle_name, last_name, full_name, display_name, email, class, department, vin_id, photo_url, admission_year, role, subject_count')
          .eq('id', user.id)
          .maybeSingle()

        if (isMounted) {
          const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
          
          const fullName = formatFullName(
            profileData?.first_name || null,
            profileData?.last_name || null,
            profileData?.middle_name || null,
            profileData?.full_name || fallbackName
          )
          
          const displayName = profileData?.display_name || 
            (profileData?.first_name && profileData?.last_name 
              ? `${profileData.last_name} ${profileData.first_name}${profileData.middle_name ? ` ${profileData.middle_name}` : ''}`
              : fullName)
          
          const studentClass = profileData?.class || 'Not Assigned'
          const calculatedSubjects = profileData?.subject_count || getSubjectCountForClass(studentClass)
          
          setProfile({
            id: user.id,
            first_name: profileData?.first_name || null,
            middle_name: profileData?.middle_name || null,
            last_name: profileData?.last_name || null,
            full_name: fullName,
            display_name: displayName,
            email: profileData?.email || user.email || '',
            class: studentClass,
            department: profileData?.department || 'General',
            vin_id: profileData?.vin_id,
            photo_url: profileData?.photo_url || null,
            admission_year: profileData?.admission_year || new Date().getFullYear(),
            role: profileData?.role || 'student',
            subject_count: calculatedSubjects
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

  // ============================================
  // ✅ FIXED: loadDashboardData - Uses DB values
  // ============================================
  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const studentClass = profile.class
      const totalSubjects = profile.subject_count || getSubjectCountForClass(studentClass)

      await checkReportCardStatus()

      // Fetch current term from database
      const { data: currentTermData } = await supabase
        .from('terms')
        .select('*')
        .eq('is_current', true)
        .single()

      let currentTerm = { term: 'third', session_year: '2025/2026' }
      
      if (currentTermData) {
        currentTerm = { 
          term: currentTermData.term_code, 
          session_year: currentTermData.session_year 
        }
        setCurrentTermSession(currentTerm)
      }

      // ✅ FETCH TERM PROGRESS - THIS HAS THE REAL SCORES!
      const { data: progressData } = await supabase
        .from('student_term_progress')
        .select('*')
        .eq('student_id', profile.id)
        .eq('term', currentTerm.term)
        .eq('session_year', currentTerm.session_year)
        .maybeSingle()

      console.log('📊 Progress Data from DB:', progressData)

      // ✅ USE DATABASE VALUES - These are the REAL scores!
      const completedExamsFromDB = progressData?.completed_exams || 0
      const averageScoreFromDB = progressData?.average_score || 0
      const gradeFromDB = progressData?.grade || 'N/A'
      const totalSubjectsFromDB = progressData?.total_subjects || totalSubjects

      if (progressData) {
        setTermProgress(progressData as TermProgressData)
      }

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
            total_score: att.total_score || 0,
            term: att.term,
            session_year: att.session_year
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
      const { data: allAssignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .or(`class.eq.${studentClass},class.is.null`)
        .order('created_at', { ascending: false })

      // Load notes
      const { data: allNotesData } = await supabase
        .from('notes')
        .select('*')
        .or(`class.eq.${studentClass},class.is.null`)
        .order('created_at', { ascending: false })

      // Load classmates
      const { data: classmatesData } = await supabase
        .from('profiles')
        .select('id, first_name, middle_name, last_name, full_name, display_name, email, photo_url, vin_id')
        .eq('class', studentClass)
        .neq('id', profile.id)
        .order('full_name', { ascending: true })

      const mappedAssignments = (allAssignmentsData || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        description: a.description,
        due_date: a.due_date,
        total_marks: a.total_marks,
        file_url: a.file_url,
        created_at: a.created_at,
        teacher_name: a.teacher_name,
        class: a.class
      }))

      const mappedNotes = (allNotesData || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        description: n.description,
        file_url: n.file_url,
        created_at: n.created_at,
        teacher_name: n.teacher_name,
        class: n.class
      }))

      const mappedClassmates = (classmatesData || []).map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        middle_name: c.middle_name,
        last_name: c.last_name,
        full_name: c.full_name || formatFullName(c.first_name, c.last_name, c.middle_name, 'Student'),
        display_name: c.display_name || formatDisplayName(c.first_name, c.last_name, c.middle_name),
        email: c.email,
        photo_url: c.photo_url,
        vin_id: c.vin_id
      }))

      // ✅ SET STATS USING DATABASE VALUES
      setStats({
        totalExams: allExams.length,
        completedExams: completedExamsFromDB,
        averageScore: averageScoreFromDB,
        passedExams: passedAttempts.length,
        failedExams: completedAttempts.length - passedAttempts.length,
        pendingResults: pendingAttempts.length,
        recentAttempts: attempts.slice(0, 4),
        availableExams: availableExams.slice(0, 6),
        recentAssignments: mappedAssignments.slice(0, 3),
        recentNotes: mappedNotes.slice(0, 3),
        allAssignments: mappedAssignments,
        allNotes: mappedNotes,
        classmates: mappedClassmates
      })

      // ✅ SET BANNER STATS USING DATABASE VALUES
      const gradeInfo = calculateGrade(averageScoreFromDB)
      setBannerStats({
        completedExams: completedExamsFromDB,
        averageScore: averageScoreFromDB,
        availableExams: availableExams.length,
        totalExams: allExams.length,
        totalSubjects: totalSubjectsFromDB,
        currentGrade: gradeFromDB,
        gradeColor: completedExamsFromDB > 0 ? gradeInfo.color : 'text-gray-400',
        currentTerm: TERM_NAMES[currentTerm.term] || currentTerm.term,
        sessionYear: currentTerm.session_year
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class, checkReportCardStatus])

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('student-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `student_id=eq.${profile.id}` },
        () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_term_progress', filter: `student_id=eq.${profile.id}` },
        () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' },
        () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' },
        () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `class=eq.${profile.class}` },
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
  }, [profile?.id, profile?.class, loadDashboardData, checkReportCardStatus])

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
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
      display_name: profile.display_name,
      class: profile.class,
      department: profile.department || undefined,
      photo_url: profile.photo_url || undefined,
      subject_count: displayTotalSubjects
    }
  }

  const handleDownloadFile = async (fileUrl: string, title: string) => {
    if (!fileUrl) {
      toast.error('No file attached')
      return
    }
    
    try {
      window.open(fileUrl, '_blank')
      toast.success(`Opening ${title}`)
    } catch (error) {
      console.error('Error opening file:', error)
      toast.error('Failed to open file')
    }
  }

  const getAvatarColor = (name: string): string => {
    const colors = [
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-500',
      'from-green-500 to-emerald-500',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const filteredAvailableExams = stats.availableExams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRecentAttempts = stats.recentAttempts.filter(attempt => 
    attempt.exam_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attempt.exam_subject?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAllAssignments = stats.allAssignments.filter(assignment =>
    assignment.title.toLowerCase().includes(assignmentsSearch.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(assignmentsSearch.toLowerCase()) ||
    (assignment.description && assignment.description.toLowerCase().includes(assignmentsSearch.toLowerCase()))
  )

  const filteredAllNotes = stats.allNotes.filter(note =>
    note.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
    note.subject.toLowerCase().includes(notesSearch.toLowerCase()) ||
    (note.description && note.description.toLowerCase().includes(notesSearch.toLowerCase()))
  )

  const filteredClassmates = stats.classmates.filter(classmate => {
    const displayName = classmate.display_name || classmate.full_name
    return displayName.toLowerCase().includes(classmatesSearch.toLowerCase()) ||
           classmate.email.toLowerCase().includes(classmatesSearch.toLowerCase()) ||
           (classmate.vin_id && classmate.vin_id.toLowerCase().includes(classmatesSearch.toLowerCase()))
  })

  const finalBannerStats = {
    ...bannerStats,
    totalSubjects: displayTotalSubjects || bannerStats.totalSubjects
  }

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

  // ============================================
  // REST OF THE RETURN JSX (unchanged)
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header 
        user={formatProfileForHeader(profile)} 
        onLogout={handleLogout}
      />
      
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
                  { id: 'notes', icon: BookOpen, label: 'Notes' },
                  { id: 'classmates', icon: Users, label: 'Classmates' },
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
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 w-full overflow-hidden"
                >
                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <StudentWelcomeBanner 
                      profile={getWelcomeBannerProfile()} 
                      stats={finalBannerStats}
                    />
                  </motion.div>

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
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full overflow-hidden">
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
                              <p className="text-center py-6 text-slate-500 text-sm">No exams available for {bannerStats.currentTerm}</p>
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
                      </div>

                      <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
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
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600 shrink-0" />
                            Classmates
                          </CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => handleTabChange('classmates')}>
                            View All <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <CardDescription>
                          {stats.classmates.length} student{stats.classmates.length !== 1 ? 's' : ''} in {profile?.class}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stats.classmates.length === 0 ? (
                          <div className="text-center py-6">
                            <UserPlus className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No classmates yet</p>
                            <p className="text-xs text-slate-400">Other students will appear here once enrolled</p>
                          </div>
                        ) : (
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {stats.classmates.slice(0, 4).map((classmate) => {
                              const displayName = classmate.display_name || classmate.full_name
                              return (
                                <div key={classmate.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                                  <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={classmate.photo_url || undefined} />
                                    <AvatarFallback className={cn("bg-gradient-to-br text-white text-sm", getAvatarColor(displayName))}>
                                      {getInitials(classmate.first_name, classmate.last_name, displayName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{displayName}</p>
                                    <p className="text-xs text-slate-500 truncate">{classmate.email}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {stats.classmates.length > 4 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-3 text-emerald-600"
                            onClick={() => handleTabChange('classmates')}
                          >
                            View all {stats.classmates.length} classmates
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
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
                        <CardDescription className="text-blue-700/70">
                          {stats.allAssignments.length} total assignment{stats.allAssignments.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stats.recentAssignments.length === 0 ? (
                          <div className="text-center py-8">
                            <FolderOpen className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                            <p className="text-blue-700/70 text-sm">No assignments yet</p>
                            <p className="text-xs text-blue-600/50">Assignments from teachers will appear here</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {stats.recentAssignments.map((assignment) => (
                              <div key={assignment.id} className="p-3 bg-white/70 rounded-xl hover:bg-white transition-all">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-medium text-sm break-words flex-1">{assignment.title}</p>
                                  <Badge variant="outline" className="text-xs shrink-0 bg-white">{assignment.subject}</Badge>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">{assignment.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    Due: {formatDate(assignment.due_date)}
                                  </span>
                                  {assignment.file_url && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-xs"
                                      onClick={() => handleDownloadFile(assignment.file_url!, assignment.title)}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {stats.allAssignments.length > 3 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-3 text-blue-700"
                            onClick={() => handleTabChange('assignments')}
                          >
                            View all {stats.allAssignments.length} assignments
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden w-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-purple-800">
                            <BookOpen className="h-5 w-5 shrink-0" />
                            Recent Notes
                          </CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => handleTabChange('notes')} className="text-purple-700">
                            View All <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <CardDescription className="text-purple-700/70">
                          {stats.allNotes.length} note{stats.allNotes.length !== 1 ? 's' : ''} available
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stats.recentNotes.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                            <p className="text-purple-700/70 text-sm">No notes available</p>
                            <p className="text-xs text-purple-600/50">Study notes from teachers will appear here</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {stats.recentNotes.map((note) => (
                              <div key={note.id} className="p-3 bg-white/70 rounded-xl hover:bg-white transition-all">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-medium text-sm break-words flex-1">{note.title}</p>
                                  <Badge variant="outline" className="text-xs shrink-0 bg-white">{note.subject}</Badge>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">{note.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <File className="h-3 w-3 shrink-0" />
                                    {note.teacher_name || 'Teacher'}
                                  </span>
                                  {note.file_url && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-xs"
                                      onClick={() => handleDownloadFile(note.file_url!, note.title)}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {stats.allNotes.length > 3 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-3 text-purple-700"
                            onClick={() => handleTabChange('notes')}
                          >
                            View all {stats.allNotes.length} notes
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

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
                          <p className="text-slate-500">No exams available for {bannerStats.currentTerm}.</p>
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

              {activeTab === 'assignments' && (
                <motion.div key="assignments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold">All Assignments</h1>
                    <Badge className="bg-blue-100 text-blue-700 w-fit">
                      {stats.allAssignments.length} total
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search assignments..."
                        value={assignmentsSearch}
                        onChange={(e) => setAssignmentsSearch(e.target.value)}
                        className="pl-9 bg-white w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredAllAssignments.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="p-12 text-center">
                          <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
                          <p className="text-muted-foreground">
                            {assignmentsSearch ? 'No assignments match your search.' : 'No assignments available for your class yet.'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAllAssignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg break-words flex-1">{assignment.title}</CardTitle>
                              <Badge variant="outline" className="shrink-0">{assignment.subject}</Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-xs flex-wrap">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(assignment.due_date)}
                              {assignment.total_marks && (
                                <span className="ml-2">Total Marks: {assignment.total_marks}</span>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                              {assignment.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs text-slate-500">
                                Posted: {formatDate(assignment.created_at)}
                                {assignment.teacher_name && ` by ${assignment.teacher_name}`}
                              </span>
                              {assignment.file_url && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadFile(assignment.file_url!, assignment.title)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold">Study Notes</h1>
                    <Badge className="bg-purple-100 text-purple-700 w-fit">
                      {stats.allNotes.length} notes available
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search notes..."
                        value={notesSearch}
                        onChange={(e) => setNotesSearch(e.target.value)}
                        className="pl-9 bg-white w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredAllNotes.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="p-12 text-center">
                          <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notes Found</h3>
                          <p className="text-muted-foreground">
                            {notesSearch ? 'No notes match your search.' : 'No study notes available for your class yet.'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAllNotes.map((note) => (
                        <Card key={note.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-purple-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg break-words flex-1">{note.title}</CardTitle>
                              <Badge variant="outline" className="shrink-0">{note.subject}</Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-xs">
                              <File className="h-3 w-3" />
                              {note.teacher_name || 'Teacher'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                              {note.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs text-slate-500">
                                Added: {formatDate(note.created_at)}
                              </span>
                              {note.file_url && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadFile(note.file_url!, note.title)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'classmates' && (
                <motion.div key="classmates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold">My Classmates</h1>
                      <p className="text-sm text-slate-500 mt-1">Students in {profile?.class}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {stats.classmates.length} classmates
                      </Badge>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 w-8 p-0", classmatesView === 'grid' && "bg-white shadow-sm")}
                          onClick={() => setClassmatesView('grid')}
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 w-8 p-0", classmatesView === 'list' && "bg-white shadow-sm")}
                          onClick={() => setClassmatesView('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search classmates by name, email, or VIN ID..."
                        value={classmatesSearch}
                        onChange={(e) => setClassmatesSearch(e.target.value)}
                        className="pl-9 bg-white w-full"
                      />
                    </div>
                  </div>
                  
                  {filteredClassmates.length === 0 ? (
                    <Card className="overflow-hidden">
                      <CardContent className="p-12 text-center">
                        <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classmates Found</h3>
                        <p className="text-muted-foreground">
                          {classmatesSearch ? 'No classmates match your search.' : 'No other students in your class yet.'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {classmatesView === 'grid' ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {filteredClassmates.map((classmate) => {
                            const displayName = classmate.display_name || classmate.full_name
                            return (
                              <Card key={classmate.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                <CardContent className="p-6 text-center">
                                  <div className="relative">
                                    <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all">
                                      <AvatarImage src={classmate.photo_url || undefined} />
                                      <AvatarFallback className={cn("bg-gradient-to-br text-white text-2xl", getAvatarColor(displayName))}>
                                        {getInitials(classmate.first_name, classmate.last_name, displayName)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <h3 className="font-semibold text-lg mb-1 break-words">{displayName}</h3>
                                  <p className="text-sm text-slate-500 mb-2 break-all">{classmate.email}</p>
                                  {classmate.vin_id && (
                                    <p className="text-xs text-slate-400 mb-3">ID: {classmate.vin_id}</p>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2 w-full"
                                    onClick={() => window.location.href = `mailto:${classmate.email}`}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Contact
                                  </Button>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="divide-y">
                              {filteredClassmates.map((classmate) => {
                                const displayName = classmate.display_name || classmate.full_name
                                return (
                                  <div key={classmate.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                      <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={classmate.photo_url || undefined} />
                                        <AvatarFallback className={cn("bg-gradient-to-br text-white", getAvatarColor(displayName))}>
                                          {getInitials(classmate.first_name, classmate.last_name, displayName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <h3 className="font-medium break-words">{displayName}</h3>
                                        <p className="text-sm text-slate-500 truncate">{classmate.email}</p>
                                        {classmate.vin_id && (
                                          <p className="text-xs text-slate-400">ID: {classmate.vin_id}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => window.location.href = `mailto:${classmate.email}`}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </motion.div>
              )}

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
                                {getInitials(profile.first_name, profile.last_name, profileDisplayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 max-w-full">
                              <h2 className="text-xl sm:text-2xl font-bold break-words">{profileDisplayName}</h2>
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
                              <p className="text-xs text-slate-500">Middle Name</p>
                              <p className="font-medium break-words">{profile.middle_name || '—'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Last Name</p>
                              <p className="font-medium break-words">{profile.last_name || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Display Name (Reports)</p>
                              <p className="font-medium break-words">{profile.display_name || profile.full_name}</p>
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

              {activeTab === 'performance' && (
                <motion.div key="performance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full overflow-hidden">
                  <h1 className="text-xl sm:text-2xl font-bold mb-4">Performance Analytics</h1>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Exam Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Overall Pass Rate</span>
                              <span>{stats.completedExams > 0 ? Math.round((stats.passedExams / stats.completedExams) * 100) : 0}%</span>
                            </div>
                            <Progress value={stats.completedExams > 0 ? (stats.passedExams / stats.completedExams) * 100 : 0} className="h-2" />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">{stats.passedExams}</p>
                              <p className="text-sm text-green-600">Exams Passed</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                              <p className="text-2xl font-bold text-red-600">{stats.failedExams}</p>
                              <p className="text-sm text-red-600">Exams Failed</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Average Score</span>
                              <span className="font-bold">{stats.averageScore}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Subject Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Total Subjects</span>
                            <span className="font-bold">{displayTotalSubjects}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exams Completed</span>
                            <span className="font-bold">{stats.completedExams}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Results</span>
                            <span className="font-bold">{stats.pendingResults}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Available Exams</span>
                            <span className="font-bold">{stats.availableExams.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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