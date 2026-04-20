/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exams/page.tsx - FIXED: Term selector with fallback to current term
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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
  BookOpen, Filter, Search, ChevronRight,
  CheckCircle2, Shield, PenTool, Hash, Target, Zap,
  TrendingUp, BarChart3, LayoutGrid, List, Lock, Unlock,
  ArrowRight, CheckCircle, RefreshCw, ArrowLeft, Home,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
  term?: string
  session_year?: string
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  photo_url?: string
  subject_count?: number
}

interface ExamAttempt {
  id: string
  exam_id: string
  status: 'completed' | 'in_progress' | 'abandoned'
  percentage?: number
  total_score?: number
  term?: string
  session_year?: string
}

interface TermProgress {
  id: string
  term: string
  session_year: string
  total_subjects: number
  completed_exams: number
  average_score: number
  grade: string
}

// Subject configurations
const SUBJECT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Computer Science': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Christian Religious Studies': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Basic Science': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Social Studies': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Business Studies': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Agricultural Science': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Physical and Health Education': { icon: Target, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'History': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Geography': { icon: Target, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Technical Drawing': { icon: PenTool, color: 'text-gray-600', bgColor: 'bg-gray-50' },
}

const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

type ViewMode = 'grid' | 'list'

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

export default function StudentExamsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
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
  const [availableTerms, setAvailableTerms] = useState<Array<{ term: string; session_year: string; label: string }>>([])
  const [selectedTermSession, setSelectedTermSession] = useState<{ term: string; session_year: string } | null>(null)
  
  const [stats, setStats] = useState({
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

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const loadAvailableTerms = useCallback(async (studentId: string) => {
    try {
      const { data: progressData } = await supabase
        .from('student_term_progress')
        .select('term, session_year')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      const terms: Array<{ term: string; session_year: string; label: string }> = []
      
      if (progressData && progressData.length > 0) {
        progressData.forEach(p => {
          const label = `${TERM_NAMES[p.term] || p.term} ${p.session_year}`
          if (!terms.find(t => t.term === p.term && t.session_year === p.session_year)) {
            terms.push({ term: p.term, session_year: p.session_year, label })
          }
        })
      }

      // If no terms found, add the current term as default
      if (terms.length === 0) {
        const current = getCurrentTermSession()
        const defaultTerm = {
          term: current.term,
          session_year: current.session,
          label: `${TERM_NAMES[current.term] || current.term} ${current.session}`
        }
        terms.push(defaultTerm)
      }

      terms.sort((a, b) => {
        const sessionA = a.session_year.split('/')[0]
        const sessionB = b.session_year.split('/')[0]
        if (sessionA !== sessionB) return parseInt(sessionB) - parseInt(sessionA)
        const termOrder: Record<string, number> = { first: 1, second: 2, third: 3 }
        return (termOrder[b.term] || 0) - (termOrder[a.term] || 0)
      })

      setAvailableTerms(terms)
      
      if (terms.length > 0 && !selectedTermSession) {
        setSelectedTermSession({ term: terms[0].term, session_year: terms[0].session_year })
      }
    } catch (error) {
      console.error('Error loading available terms:', error)
      // Fallback to current term on error
      const current = getCurrentTermSession()
      const defaultTerm = {
        term: current.term,
        session_year: current.session,
        label: `${TERM_NAMES[current.term] || current.term} ${current.session}`
      }
      setAvailableTerms([defaultTerm])
      if (!selectedTermSession) {
        setSelectedTermSession({ term: current.term, session_year: current.session })
      }
    }
  }, [selectedTermSession, getCurrentTermSession])

  const loadData = useCallback(async (term?: string, session?: string) => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please log in to continue')
        router.push('/portal')
        return
      }

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
        toast.error('Access denied')
        router.push('/portal')
        return
      }

      const totalSubjects = profileData.subject_count || getSubjectCountForClass(profileData.class || '')

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.email?.split('@')[0] || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        photo_url: profileData.photo_url,
        subject_count: totalSubjects
      }

      setProfile(studentProfile)
      await loadAvailableTerms(studentProfile.id)

      const targetTerm = term || selectedTermSession?.term || getCurrentTermSession().term
      const targetSession = session || selectedTermSession?.session_year || getCurrentTermSession().session

      const { data: progressData } = await supabase
        .from('student_term_progress')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('term', targetTerm)
        .eq('session_year', targetSession)
        .maybeSingle()

      if (progressData) {
        setTermProgress(progressData)
        const gradeInfo = calculateGrade(progressData.average_score || 0)
        setStats(prev => ({
          ...prev,
          totalSubjects: progressData.total_subjects || totalSubjects,
          completed: progressData.completed_exams || 0,
          averageScore: progressData.average_score || 0,
          currentGrade: progressData.grade || gradeInfo.grade,
          gradeColor: gradeInfo.color,
          termName: TERM_NAMES[targetTerm] || targetTerm,
          sessionYear: targetSession
        }))
      } else {
        setTermProgress(null)
        setStats(prev => ({
          ...prev,
          totalSubjects,
          completed: 0,
          averageScore: 0,
          currentGrade: 'N/A',
          gradeColor: 'text-gray-400',
          termName: TERM_NAMES[targetTerm] || targetTerm,
          sessionYear: targetSession
        }))
      }

      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('term', targetTerm)
        .eq('session_year', targetSession)
        .order('created_at', { ascending: false })

      const normalizedStudentClass = studentProfile.class.replace(/\s+/g, '').toUpperCase()
      
      const classFilteredExams = (examsData || []).filter(exam => {
        if (!exam.class) return true
        const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
        return normalizedExamClass === normalizedStudentClass
      })

      setExams(classFilteredExams)
      setFilteredExams(classFilteredExams)

      const subjects = [...new Set(classFilteredExams.map(e => e.subject))]
      setAvailableSubjects(subjects.sort())

      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('term', targetTerm)
        .eq('session_year', targetSession)

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
        available: classFilteredExams.filter(e => isExamAvailable(e, attemptsMap)).length,
        completed: completedCount,
        upcoming: classFilteredExams.filter(e => e.starts_at && new Date(e.starts_at) > now).length,
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
  }, [router, loadAvailableTerms, selectedTermSession, getCurrentTermSession])

  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [mounted])

  const handleTermSessionChange = async (value: string) => {
    const [term, session] = value.split('|')
    setSelectedTermSession({ term, session_year: session })
    await loadData(term, session)
  }

  useEffect(() => {
    let filtered = [...exams]
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.subject.toLowerCase().includes(query)
      )
    }
    setFilteredExams(filtered)
  }, [selectedSubject, searchQuery, exams])

  const getDisplayedExams = () => {
    switch (activeTab) {
      case 'available': return filteredExams.filter(e => getExamStatus(e) === 'available')
      case 'completed': return filteredExams.filter(e => getExamStatus(e) === 'completed')
      case 'upcoming': return filteredExams.filter(e => getExamStatus(e) === 'upcoming')
      default: return filteredExams
    }
  }

  const displayedExams = getDisplayedExams()

  const handleTakeExam = (examId: string) => {
    const attempt = examAttempts[examId]
    router.push(attempt?.status === 'in_progress' ? `/student/exam/${examId}?resume=true` : `/student/exam/${examId}`)
  }

  const handleViewResult = (examId: string) => router.push(`/student/results/${examId}`)

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const getSubjectConfig = (subject: string) => {
    return SUBJECT_CONFIG[subject] || { 
      icon: BookOpen, color: 'text-gray-600', bgColor: 'bg-gray-50'
    }
  }

  if (!mounted || loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen pt-16 sm:pt-20 lg:pt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-muted rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const displayTotalSubjects = stats.totalSubjects
  const completionPercentage = displayTotalSubjects > 0 ? Math.round((stats.completed / displayTotalSubjects) * 100) : 0

  return (
    <>
      <Header onLogout={handleLogout} />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1600px]">
          
          {/* Breadcrumb */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/student" className="hover:text-primary flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="hidden xs:inline">Dashboard</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 hidden xs:block" />
              <span className="text-foreground font-medium">Exams</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/student')} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Page Title */}
          <div className="mb-5 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Available Exams</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile?.class} • {profile?.department} • {stats.termName} {stats.sessionYear}
            </p>
          </div>
          
          {/* Term Selector & Progress Card - FIXED with fallback */}
          <div className="mb-5 sm:mb-8">
            <Card className="border-0 shadow-sm bg-card">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-full sm:w-auto">
                    <History className="h-4 w-4 text-muted-foreground shrink-0" />
                    {mounted && availableTerms.length > 0 ? (
                      <Select 
                        value={selectedTermSession ? `${selectedTermSession.term}|${selectedTermSession.session_year}` : ''} 
                        onValueChange={handleTermSessionChange}
                      >
                        <SelectTrigger className="border-0 h-auto p-0 shadow-none focus:ring-0 text-sm font-medium min-w-[180px] bg-transparent">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTerms.map((t) => (
                            <SelectItem key={`${t.term}|${t.session_year}`} value={`${t.term}|${t.session_year}`}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm font-medium min-w-[180px] py-1.5 text-muted-foreground">
                        Loading...
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <Badge variant="outline" className="bg-background text-xs sm:text-sm">
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      {stats.completed}/{displayTotalSubjects} Completed
                    </Badge>
                    {stats.completed > 0 && (
                      <Badge className={cn("bg-opacity-20 text-xs sm:text-sm", stats.gradeColor.replace('text', 'bg'))}>
                        <Award className="h-3.5 w-3.5 mr-1" />
                        <span className={stats.gradeColor}>Grade {stats.currentGrade}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => selectedTermSession ? loadData(selectedTermSession.term, selectedTermSession.session_year) : loadData()} 
                    className="h-8 w-8 shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Term Progress</span>
                    <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.completed} of {displayTotalSubjects} subjects completed • Average Score: {stats.averageScore}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Filter */}
          {availableSubjects.length > 0 && (
            <div className="mb-5 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Subject
                </h2>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:ml-auto">
                  <div className="flex items-center bg-background rounded-lg border p-0.5 self-start">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 w-8 p-0">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 w-8 p-0">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative w-full xs:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search exams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 h-9 w-full bg-background"
                    />
                  </div>
                </div>
              </div>
              
              <ScrollArea className="w-full whitespace-nowrap pb-3">
                <div className="flex gap-2">
                  <Badge
                    variant={selectedSubject === 'all' ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm shrink-0",
                      selectedSubject === 'all' && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => setSelectedSubject('all')}
                  >
                    All Subjects
                    <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-xs">
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
                          "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm flex items-center gap-2 shrink-0",
                          selectedSubject === subject && "bg-primary text-primary-foreground hover:bg-primary/90",
                          hasAttempt && "border-green-300"
                        )}
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <SubjectIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{subject}</span>
                        <span className="sm:hidden">
                          {subject.length > 10 ? subject.substring(0, 10) + '...' : subject}
                        </span>
                        <span className={cn(
                          "ml-1 px-2 py-0.5 rounded-full text-xs",
                          selectedSubject === subject ? "bg-background/20" : "bg-muted"
                        )}>
                          {count}
                        </span>
                        {hasAttempt && <CheckCircle className="h-3 w-3 text-green-500 ml-0.5" />}
                      </Badge>
                    )
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* TABS */}
          <div className="mb-6 sm:mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-background p-1 rounded-xl shadow-sm border w-full sm:w-auto flex">
                <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial">
                  <Unlock className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Available</span>
                  <span className="xs:hidden">Avail</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background/20 text-inherit text-xs">
                    {filteredExams.filter(e => getExamStatus(e) === 'available').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial">
                  <Clock className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Upcoming</span>
                  <span className="xs:hidden">Soon</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background/20 text-inherit text-xs">
                    {filteredExams.filter(e => getExamStatus(e) === 'upcoming').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial">
                  <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Completed</span>
                  <span className="xs:hidden">Done</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background/20 text-inherit text-xs">
                    {filteredExams.filter(e => getExamStatus(e) === 'completed').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* EXAMS GRID/LIST */}
          {displayedExams.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="text-center py-12 sm:py-16">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'available' ? (
                    <MonitorPlay className="h-8 w-8 text-muted-foreground/60" />
                  ) : activeTab === 'completed' ? (
                    <Award className="h-8 w-8 text-muted-foreground/60" />
                  ) : (
                    <Clock className="h-8 w-8 text-muted-foreground/60" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'available' ? 'No exams available' : activeTab === 'completed' ? 'No completed exams' : 'No upcoming exams'}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {activeTab === 'available'
                    ? `No exams available for ${stats.termName} ${stats.sessionYear}.`
                    : activeTab === 'completed'
                      ? 'Complete available exams to see your results!'
                      : 'No upcoming exams scheduled.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-3 sm:space-y-4"
            )}>
              {displayedExams.map((exam) => {
                const status = getExamStatus(exam)
                const attempt = examAttempts[exam.id]
                const config = getSubjectConfig(exam.subject)
                const SubjectIcon = config.icon
                
                return (
                  <div key={exam.id} className="h-full">
                    <Card className={cn(
                      "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col",
                      status === 'completed' && "bg-gradient-to-br from-green-50/50 to-emerald-50/50",
                      status === 'upcoming' && "bg-gradient-to-br from-amber-50/50 to-orange-50/50",
                      status === 'available' && "bg-card"
                    )}>
                      {status === 'completed' && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-green-500 text-white border-0 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      )}
                      
                      {status === 'upcoming' && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-amber-500 text-white border-0 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Upcoming
                          </Badge>
                        </div>
                      )}
                      
                      {status === 'available' && !attempt && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-emerald-500 text-white border-0 text-xs">
                            <Unlock className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        </div>
                      )}

                      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            "h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0",
                            config.bgColor
                          )}>
                            <SubjectIcon className={cn("h-5 w-5", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base line-clamp-2">{exam.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{exam.subject}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
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
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Proctored
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Camera required</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{exam.duration} min</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>{exam.total_questions} Qs</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Award className="h-3.5 w-3.5 shrink-0" />
                            <span>{exam.total_marks} pts</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Target className="h-3.5 w-3.5 shrink-0" />
                            <span>{exam.passing_percentage || 50}% pass</span>
                          </div>
                        </div>

                        {status === 'completed' && attempt && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                              <span className="text-muted-foreground">Your Score</span>
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
                              className="w-full border-green-200 text-green-700 hover:bg-green-50 text-sm"
                            >
                              <Award className="mr-2 h-4 w-4" />
                              View Result
                              <ChevronRight className="ml-auto h-4 w-4" />
                            </Button>
                          ) : status === 'available' ? (
                            <Button 
                              onClick={() => handleTakeExam(exam.id)}
                              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-sm"
                            >
                              <MonitorPlay className="mr-2 h-4 w-4" />
                              {attempt?.status === 'in_progress' ? 'Resume Exam' : 'Start Exam'}
                              <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                          ) : (
                            <Button disabled variant="outline" className="w-full text-sm">
                              <Lock className="mr-2 h-4 w-4" />
                              Not Available
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}