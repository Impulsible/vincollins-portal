/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exams/page.tsx - COMPLETE WITH TERM TRACKING (NO FOOTER)
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Loader2, MonitorPlay, FileText, Award, Clock,
  BookOpen, Calendar, Filter, Search, ChevronRight,
  CheckCircle2, Timer, Shield, PenTool, Hash, Target, Zap,
  TrendingUp, BarChart3, LayoutGrid, List, Sparkles, Lock, Unlock,
  ArrowRight, CheckCircle, History, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Types
interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  status: string
  description?: string
  passing_percentage?: number
  created_at: string
  starts_at?: string
  ends_at?: string
  has_theory?: boolean
  proctoring_enabled?: boolean
  exam_type?: 'objective' | 'theory' | 'both'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  term?: string
  session_year?: string
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
  subject_count?: number
  current_term?: string
  current_session?: string
}

interface ExamAttempt {
  id: string
  exam_id: string
  status: 'completed' | 'in_progress' | 'abandoned'
  score?: number
  percentage?: number
  started_at: string
  completed_at?: string
  term?: string
  session_year?: string
}

interface TermProgress {
  id: string
  class: string
  department: string
  term: string
  session_year: string
  total_subjects: number
  total_exams: number
  completed_exams: number
  average_score: number
  grade: string
  subject_scores?: Record<string, number>
}

// Subject configurations
const SUBJECT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: Sparkles, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Financial Accounting': { icon: FileText, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Computer Science': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Geography': { icon: Target, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Agricultural Science': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Technical Drawing': { icon: PenTool, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'Basic Science': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Social Studies': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Business Studies': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Home Economics': { icon: Award, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'French': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Yoruba': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Igbo': { icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Hausa': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Christian Religious Studies': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Islamic Religious Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Physical and Health Education': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Cultural and Creative Arts': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Security Education': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Data Processing': { icon: MonitorPlay, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Marketing': { icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Office Practice': { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'History': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Fine Arts': { icon: PenTool, color: 'text-rose-600', bgColor: 'bg-rose-50' },
}

// Department subject mappings for SSS
const DEPARTMENT_SUBJECTS: Record<string, string[]> = {
  science: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Further Mathematics', 'English Language', 'Computer Science', 'Agricultural Science', 'Technical Drawing', 'Geography'],
  arts: ['Literature in English', 'Government', 'Christian Religious Studies', 'Islamic Religious Studies', 'Economics', 'Geography', 'History', 'French', 'Yoruba', 'Igbo', 'Hausa', 'Civic Education'],
  commercial: ['Commerce', 'Financial Accounting', 'Economics', 'Business Studies', 'Mathematics', 'English Language', 'Marketing', 'Office Practice', 'Computer Science', 'Civic Education'],
  technology: ['Computer Science', 'Technical Drawing', 'Mathematics', 'Physics', 'Chemistry', 'English Language', 'Further Mathematics', 'Geography', 'Economics', 'Civic Education'],
  general: ['English Language', 'Mathematics', 'Civic Education', 'Economics', 'Computer Science', 'Agricultural Science', 'Geography', 'Commerce', 'Government', 'Biology']
}

// Difficulty badges
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-100 text-green-700 border-green-200' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  advanced: { label: 'Advanced', color: 'bg-red-100 text-red-700 border-red-200' },
}

// Term display names
const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

type ViewMode = 'grid' | 'compact'

// FIXED: Helper function - handles spaces in class names like "SS 1", "JSS 2"
const getSubjectCountForClass = (className: string): number => {
  if (!className) return 17
  const normalizedClass = className.toString().toUpperCase().replace(/\s+/g, '')
  console.log('📊 EXAMS PAGE - getSubjectCountForClass:', className, '→', normalizedClass)
  if (normalizedClass.startsWith('JSS')) return 17
  if (normalizedClass.startsWith('SS')) return 10
  return 17
}

export default function StudentExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [activeTab, setActiveTab] = useState('available')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt>>({})
  const [termProgress, setTermProgress] = useState<TermProgress | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<string>('current')
  const [pastTerms, setPastTerms] = useState<TermProgress[]>([])
  
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    completed: 0,
    upcoming: 0,
    averageScore: 0,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    totalSubjects: 17,
    termName: 'First Term',
    sessionYear: ''
  })

  // FIXED: Calculate totalSubjects directly from profile class
  const calculatedTotalSubjects = useMemo(() => {
    if (!profile?.class) return 17
    const count = getSubjectCountForClass(profile.class)
    console.log('📊 EXAMS PAGE - calculatedTotalSubjects:', profile.class, '→', count)
    return count
  }, [profile?.class])

  const getCurrentTermSession = useCallback(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    
    if (month >= 9 && month <= 12) {
      return { term: 'first', session: `${year}/${year + 1}` }
    } else if (month >= 1 && month <= 4) {
      return { term: 'second', session: `${year - 1}/${year}` }
    } else {
      return { term: 'third', session: `${year - 1}/${year}` }
    }
  }, [])

  const calculateGrade = (percentage: number): { grade: string; color: string; description: string } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600', description: 'Excellent' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', description: 'Very Good' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600', description: 'Good' }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600', description: 'Pass' }
    return { grade: 'F', color: 'text-red-600', description: 'Fail' }
  }

  const isExamAvailable = (exam: Exam, attemptsMap: Record<string, ExamAttempt> = examAttempts) => {
    const now = new Date()
    if (attemptsMap[exam.id]?.status === 'completed') return false
    if (!exam.starts_at && !exam.ends_at) return true
    if (exam.starts_at && new Date(exam.starts_at) > now) return false
    if (exam.ends_at && new Date(exam.ends_at) < now) return false
    return true
  }

  const getExamStatus = (exam: Exam): 'available' | 'upcoming' | 'completed' | 'expired' => {
    const attempt = examAttempts[exam.id]
    if (attempt?.status === 'completed') return 'completed'
    const now = new Date()
    if (exam.starts_at && new Date(exam.starts_at) > now) return 'upcoming'
    if (exam.ends_at && new Date(exam.ends_at) < now) return 'expired'
    return 'available'
  }

  // Load student data and exams
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please log in to continue')
        router.push('/portal')
        return
      }

      const { term: currentTerm, session: currentSession } = getCurrentTermSession()

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profileData) {
        toast.error('Student profile not found')
        return
      }

      if (profileData.role !== 'student') {
        toast.error('Access denied. Student accounts only.')
        router.push('/portal')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', profileData.id)
        .maybeSingle()

      // FIXED: Use database subject_count first, then calculate
      const totalSubjects = profileData.subject_count || getSubjectCountForClass(profileData.class || '')
      
      console.log('🔥 EXAMS PAGE - loadData - Class:', profileData.class, '| DB subject_count:', profileData.subject_count, '| Total Subjects:', totalSubjects)

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: userData?.vin_id,
        photo_url: profileData.photo_url,
        subject_count: totalSubjects,
        current_term: currentTerm,
        current_session: currentSession
      }

      setProfile(studentProfile)

      setStats(prev => ({
        ...prev,
        totalSubjects,
        termName: TERM_NAMES[currentTerm] || 'Current Term',
        sessionYear: currentSession
      }))

      // Load term progress
      const { data: termProgressData } = await supabase
        .from('student_term_progress')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('term', currentTerm)
        .eq('session_year', currentSession)
        .maybeSingle()

      if (termProgressData) {
        setTermProgress(termProgressData)
        const gradeInfo = calculateGrade(termProgressData.average_score)
        setStats(prev => ({
          ...prev,
          averageScore: termProgressData.average_score || 0,
          currentGrade: termProgressData.grade || gradeInfo.grade,
          gradeColor: gradeInfo.color,
          totalSubjects: termProgressData.total_subjects || totalSubjects,
        }))
      }

      // Load past terms
      const { data: pastTermsData } = await supabase
        .from('student_term_progress')
        .select('*')
        .eq('student_id', studentProfile.id)
        .order('created_at', { ascending: false })

      setPastTerms(pastTermsData || [])

      // Load exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('term', currentTerm)
        .eq('session_year', currentSession)
        .order('created_at', { ascending: false })

      // FIXED: Handle spaces in class comparison
      const normalizedStudentClass = studentProfile.class.replace(/\s+/g, '').toUpperCase()
      
      const classFilteredExams = (examsData || []).filter(exam => {
        if (!exam.class) return true
        const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
        return normalizedExamClass === normalizedStudentClass
      })

      let departmentFilteredExams = classFilteredExams

      if (studentProfile.class?.startsWith('SS') && studentProfile.department) {
        const deptLower = studentProfile.department.toLowerCase()
        let allowedSubjects: string[] = []
        
        if (deptLower.includes('science')) allowedSubjects = DEPARTMENT_SUBJECTS.science
        else if (deptLower.includes('art')) allowedSubjects = DEPARTMENT_SUBJECTS.arts
        else if (deptLower.includes('commercial')) allowedSubjects = DEPARTMENT_SUBJECTS.commercial
        else if (deptLower.includes('technology')) allowedSubjects = DEPARTMENT_SUBJECTS.technology
        else allowedSubjects = DEPARTMENT_SUBJECTS.general

        departmentFilteredExams = classFilteredExams.filter(exam => 
          allowedSubjects.includes(exam.subject)
        )
      }

      setExams(departmentFilteredExams)
      setFilteredExams(departmentFilteredExams)

      const subjects = [...new Set(departmentFilteredExams.map(e => e.subject))]
      setAvailableSubjects(subjects.sort())

      // Load attempts
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('term', currentTerm)
        .eq('session_year', currentSession)
        .in('exam_id', departmentFilteredExams.map(e => e.id))

      const attemptsMap: Record<string, ExamAttempt> = {}
      let completedCount = 0
      let totalScore = 0

      attemptsData?.forEach(attempt => {
        attemptsMap[attempt.exam_id] = attempt
        if (attempt.status === 'completed') {
          completedCount++
          totalScore += attempt.percentage || 0
        }
      })

      setExamAttempts(attemptsMap)

      const now = new Date()
      const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0
      const gradeInfo = calculateGrade(avgScore)

      setStats(prev => ({
        ...prev,
        total: departmentFilteredExams.length,
        available: departmentFilteredExams.filter(e => isExamAvailable(e, attemptsMap)).length,
        completed: completedCount,
        upcoming: departmentFilteredExams.filter(e => e.starts_at && new Date(e.starts_at) > now).length,
        averageScore: avgScore,
        currentGrade: completedCount > 0 ? gradeInfo.grade : prev.currentGrade,
        gradeColor: completedCount > 0 ? gradeInfo.color : prev.gradeColor
      }))

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [router, getCurrentTermSession])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load past term data
  const loadPastTermData = useCallback(async (termProgress: TermProgress) => {
    if (!profile) return
    
    setLoading(true)
    try {
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('term', termProgress.term)
        .eq('session_year', termProgress.session_year)
        .order('created_at', { ascending: false })

      const normalizedClass = termProgress.class.replace(/\s+/g, '').toUpperCase()
      
      const classFilteredExams = (examsData || []).filter(exam => {
        if (!exam.class) return true
        const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
        return normalizedExamClass === normalizedClass
      })

      setExams(classFilteredExams)
      setFilteredExams(classFilteredExams)

      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', profile.id)
        .eq('term', termProgress.term)
        .eq('session_year', termProgress.session_year)

      const attemptsMap: Record<string, ExamAttempt> = {}
      attemptsData?.forEach(attempt => {
        attemptsMap[attempt.exam_id] = attempt
      })

      setExamAttempts(attemptsMap)
      setTermProgress(termProgress)

      const gradeInfo = calculateGrade(termProgress.average_score)
      setStats(prev => ({
        ...prev,
        total: classFilteredExams.length,
        averageScore: termProgress.average_score,
        currentGrade: termProgress.grade || gradeInfo.grade,
        gradeColor: gradeInfo.color,
        totalSubjects: termProgress.total_subjects,
        termName: TERM_NAMES[termProgress.term] || termProgress.term,
        sessionYear: termProgress.session_year
      }))

    } catch (error) {
      console.error('Error loading past term:', error)
      toast.error('Failed to load term data')
    } finally {
      setLoading(false)
    }
  }, [profile])

  // Handle term change
  const handleTermChange = async (value: string) => {
    if (value === 'current') {
      setSelectedTerm('current')
      await loadData()
    } else {
      const pastTerm = pastTerms.find(t => t.id === value)
      if (pastTerm) {
        setSelectedTerm(value)
        await loadPastTermData(pastTerm)
      }
    }
  }

  // Filter exams
  useEffect(() => {
    let filtered = [...exams]

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.subject.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      )
    }

    setFilteredExams(filtered)
  }, [selectedSubject, searchQuery, exams])

  const getDisplayedExams = () => {
    switch (activeTab) {
      case 'available':
        return filteredExams.filter(e => getExamStatus(e) === 'available')
      case 'completed':
        return filteredExams.filter(e => getExamStatus(e) === 'completed')
      case 'upcoming':
        return filteredExams.filter(e => getExamStatus(e) === 'upcoming')
      default:
        return filteredExams
    }
  }

  const displayedExams = getDisplayedExams()

  const handleTakeExam = (examId: string) => {
    const attempt = examAttempts[examId]
    
    if (attempt?.status === 'in_progress') {
      router.push(`/student/exam/${examId}?resume=true`)
    } else {
      router.push(`/student/exam/${examId}`)
    }
  }

  const handleViewResult = (examId: string) => {
    router.push(`/student/results/${examId}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Always available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubjectConfig = (subject: string) => {
    return SUBJECT_CONFIG[subject] || { 
      icon: BookOpen, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50' 
    }
  }

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-16 w-16 text-primary mx-auto" />
            </motion.div>
            <p className="mt-4 text-muted-foreground text-lg">Loading your exams...</p>
          </div>
        </div>
      </>
    )
  }

  // FIXED: Banner stats with correct subject count
  const bannerStats = {
    completedExams: stats.completed,
    averageScore: stats.averageScore,
    availableExams: stats.available,
    totalExams: stats.total,
    totalSubjects: calculatedTotalSubjects,
    currentGrade: stats.currentGrade,
    gradeColor: stats.gradeColor
  }

  const displayTotalSubjects = calculatedTotalSubjects

  console.log('🎯 EXAMS PAGE RENDER - displayTotalSubjects:', displayTotalSubjects)

  return (
    <>
      <Header onLogout={handleLogout} />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          
          {/* Welcome Banner */}
          <StudentWelcomeBanner profile={profile} stats={bannerStats as any} />
          
          {/* Term Selector */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
                <History className="h-4 w-4 text-gray-500" />
                <Select value={selectedTerm} onValueChange={handleTermChange}>
                  <SelectTrigger className="border-0 h-auto p-0 shadow-none focus:ring-0 min-w-[180px]">
                    <SelectValue>
                      {selectedTerm === 'current' 
                        ? `${stats.termName} ${stats.sessionYear} (Current)`
                        : pastTerms.find(t => t.id === selectedTerm)?.term 
                          ? `${TERM_NAMES[pastTerms.find(t => t.id === selectedTerm)?.term || '']} ${pastTerms.find(t => t.id === selectedTerm)?.session_year}`
                          : 'Select Term'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">
                      {stats.termName} {stats.sessionYear} (Current)
                    </SelectItem>
                    {pastTerms.map(term => (
                      <SelectItem key={term.id} value={term.id}>
                        {TERM_NAMES[term.term] || term.term} {term.session_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Badge variant="outline" className="bg-white">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                {stats.completed} / {displayTotalSubjects} Subjects Completed
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadData}
              className="bg-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </motion.div>

          {/* Subject Progress Bar */}
          {displayTotalSubjects > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="mb-6"
            >
              <Card className="border-0 shadow-sm bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Term Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round((stats.completed / displayTotalSubjects) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(stats.completed / displayTotalSubjects) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Complete exams in all {displayTotalSubjects} subjects to finish this term
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Subject Filter */}
          {availableSubjects.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Subject
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white rounded-lg border p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('compact')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search exams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 h-9 w-48 sm:w-64 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex gap-2">
                  <Badge
                    variant={selectedSubject === 'all' ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm",
                      selectedSubject === 'all' && "bg-primary text-white hover:bg-primary/90"
                    )}
                    onClick={() => setSelectedSubject('all')}
                  >
                    All Subjects
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {exams.length}
                    </span>
                  </Badge>
                  
                  {availableSubjects.map(subject => {
                    const config = getSubjectConfig(subject)
                    const SubjectIcon = config.icon
                    const count = exams.filter(e => e.subject === subject).length
                    const hasAttempt = exams.filter(e => e.subject === subject).some(e => examAttempts[e.id]?.status === 'completed')
                    
                    return (
                      <Badge
                        key={subject}
                        variant={selectedSubject === subject ? 'default' : 'outline'}
                        className={cn(
                          "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm flex items-center gap-2",
                          selectedSubject === subject && "bg-primary text-white hover:bg-primary/90",
                          hasAttempt && "border-green-300"
                        )}
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <SubjectIcon className="h-3.5 w-3.5" />
                        {subject}
                        <span className={cn(
                          "ml-1 px-2 py-0.5 rounded-full text-xs",
                          selectedSubject === subject 
                            ? "bg-white/20" 
                            : "bg-gray-100"
                        )}>
                          {count}
                        </span>
                        {hasAttempt && (
                          <CheckCircle className="h-3 w-3 text-green-500 ml-0.5" />
                        )}
                      </Badge>
                    )
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {/* TABS */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
                <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Unlock className="h-4 w-4 mr-2" />
                  Available
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                    {filteredExams.filter(e => getExamStatus(e) === 'available').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Clock className="h-4 w-4 mr-2" />
                  Upcoming
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                    {filteredExams.filter(e => getExamStatus(e) === 'upcoming').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completed
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                    {filteredExams.filter(e => getExamStatus(e) === 'completed').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* EXAMS GRID */}
          <AnimatePresence mode="wait">
            {displayedExams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="text-center py-20">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'available' ? (
                        <MonitorPlay className="h-10 w-10 text-gray-400" />
                      ) : activeTab === 'completed' ? (
                        <Award className="h-10 w-10 text-gray-400" />
                      ) : (
                        <Clock className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {activeTab === 'available' 
                        ? 'No exams available'
                        : activeTab === 'completed'
                          ? 'No completed exams'
                          : 'No upcoming exams'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {activeTab === 'available'
                        ? `There are no exams currently available for ${stats.termName}. Check back later!`
                        : activeTab === 'completed'
                          ? 'You haven\'t completed any exams yet. Start taking exams to see your results!'
                          : 'No upcoming exams scheduled.'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  viewMode === 'grid' 
                    ? "grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "space-y-3"
                )}
              >
                {displayedExams.map((exam, index) => {
                  const status = getExamStatus(exam)
                  const attempt = examAttempts[exam.id]
                  const config = getSubjectConfig(exam.subject)
                  const SubjectIcon = config.icon
                  const difficulty = exam.difficulty || 'intermediate'
                  
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <Card className={cn(
                        "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col",
                        status === 'completed' && "bg-gradient-to-br from-green-50/50 to-emerald-50/50",
                        status === 'upcoming' && "bg-gradient-to-br from-amber-50/50 to-orange-50/50",
                        status === 'available' && "bg-white hover:bg-white"
                      )}>
                        {status === 'completed' && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-green-500 text-white border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        )}
                        
                        {status === 'upcoming' && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-amber-500 text-white border-0">
                              <Clock className="h-3 w-3 mr-1" />
                              Upcoming
                            </Badge>
                          </div>
                        )}
                        
                        {status === 'available' && !attempt && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-green-500 text-white border-0">
                              <Unlock className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          </div>
                        )}

                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110",
                              config.bgColor
                            )}>
                              <SubjectIcon className={cn("h-6 w-6", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base lg:text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                {exam.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">{exam.subject}</p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <Badge variant="outline" className={cn("text-xs", DIFFICULTY_CONFIG[difficulty]?.color)}>
                              {DIFFICULTY_CONFIG[difficulty]?.label || 'Intermediate'}
                            </Badge>
                            {exam.has_theory && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <PenTool className="h-3 w-3 mr-1" />
                                Theory
                              </Badge>
                            )}
                            {exam.proctoring_enabled && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Proctored
                                      </Badge>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Camera required for this exam</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{exam.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{exam.total_questions} Qs</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Award className="h-3.5 w-3.5" />
                              <span>{exam.total_marks} pts</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Target className="h-3.5 w-3.5" />
                              <span>{exam.passing_percentage || 50}% pass</span>
                            </div>
                          </div>

                          {exam.starts_at && status === 'upcoming' && (
                            <div className="mb-3 p-2 bg-amber-50 rounded-lg">
                              <p className="text-xs text-amber-700 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Starts {formatDate(exam.starts_at)}
                              </p>
                            </div>
                          )}

                          {exam.ends_at && status === 'available' && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-700 flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                Closes {formatDate(exam.ends_at)}
                              </p>
                            </div>
                          )}

                          {status === 'completed' && attempt && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Your Score</span>
                                <span className="font-bold text-green-600">
                                  {attempt.percentage?.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={attempt.percentage || 0} className="h-2" />
                            </div>
                          )}

                          <div className="flex-1" />

                          <div className="pt-3 mt-auto">
                            {status === 'completed' ? (
                              <Button 
                                onClick={() => handleViewResult(exam.id)}
                                variant="outline"
                                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Award className="mr-2 h-4 w-4" />
                                View Result
                                <ChevronRight className="ml-auto h-4 w-4" />
                              </Button>
                            ) : status === 'available' ? (
                              <Button 
                                onClick={() => handleTakeExam(exam.id)}
                                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                              >
                                <MonitorPlay className="mr-2 h-4 w-4" />
                                {attempt?.status === 'in_progress' ? 'Resume Exam' : 'Start Exam'}
                                <ArrowRight className="ml-auto h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                disabled
                                variant="outline"
                                className="w-full"
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Not Available
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Tips */}
          {displayedExams.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>
                  <strong>Term Progress:</strong> You've completed {stats.completed} out of {displayTotalSubjects} subjects. 
                  Current average: <strong>{stats.averageScore}%</strong> (Grade: <span className={stats.gradeColor}>{stats.currentGrade}</span>)
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  )
}