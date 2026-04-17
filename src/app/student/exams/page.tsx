/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exams/page.tsx - PROPER SPACING, NO FOOTER
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Loader2, MonitorPlay, FileText, Award, Clock,
  BookOpen, GraduationCap, Filter, Search, ChevronRight,
  CheckCircle2, Timer, Shield, PenTool, Hash, Target, Zap,
  TrendingUp, BarChart3, LayoutGrid, List, Lock, Unlock,
  ArrowRight, CheckCircle,
  Sparkles, Home,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface ExamAttempt {
  id: string
  exam_id: string
  status: 'completed' | 'in_progress' | 'abandoned'
  percentage?: number
  started_at: string
  completed_at?: string
}

// Subject configurations
const SUBJECT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: Sparkles, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Data Processing': { icon: MonitorPlay, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Agricultural Science': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Financial Accounting': { icon: FileText, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Science': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Social Studies': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Business Studies': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Christian Religious Studies': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-100 text-green-700 border-green-200' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  advanced: { label: 'Advanced', color: 'bg-red-100 text-red-700 border-red-200' },
}

type ViewMode = 'grid' | 'compact'

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
  
  const [stats, setStats] = useState({
    available: 0,
    completed: 0,
    averageScore: 0,
    currentGrade: '-',
    gradeColor: 'text-gray-400',
    totalSubjects: 17
  })

  const getFirstName = (fullName: string): string => {
    if (!fullName || fullName === 'Student') return 'Student'
    const parts = fullName.trim().split(/\s+/)
    return parts[0]
  }

  const getInitials = (name: string): string => {
    if (!name || name === 'Student') return 'S'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }

  const getSubjectCountForClass = (className: string): number => {
    if (className?.startsWith('JSS')) return 17
    if (className?.startsWith('SS')) return 10
    return 17
  }

  const calculateGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Please log in to continue')
        router.push('/portal')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData || profileData.role !== 'student') {
        toast.error('Access denied')
        router.push('/portal')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', profileData.id)
        .maybeSingle()

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: userData?.vin_id,
        photo_url: profileData.photo_url
      }

      setProfile(studentProfile)

      const totalSubjects = getSubjectCountForClass(studentProfile.class)

      // Load published exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      let filteredExamsData = (examsData || []).filter(exam => {
        if (!exam.class || exam.class === 'all') return true
        return exam.class === studentProfile.class
      })

      // Department filtering for SSS
      if (studentProfile.class?.startsWith('SS') && studentProfile.department && studentProfile.department !== 'General') {
        const deptLower = studentProfile.department.toLowerCase()
        let allowedSubjects: string[] = []
        
        if (deptLower.includes('science')) {
          allowedSubjects = ['English Language', 'Mathematics', 'Civic Education', 'Physics', 'Chemistry', 'Biology', 'Data Processing', 'Agricultural Science', 'Economics', 'Further Mathematics']
        } else if (deptLower.includes('art')) {
          allowedSubjects = ['English Language', 'Mathematics', 'Civic Education', 'Literature in English', 'Government', 'Biology', 'Christian Religious Studies', 'Economics', 'Data Processing', 'Agricultural Science']
        } else if (deptLower.includes('commercial')) {
          allowedSubjects = ['English Language', 'Mathematics', 'Civic Education', 'Economics', 'Commerce', 'Financial Accounting', 'Data Processing', 'Agricultural Science', 'Biology', 'Government']
        }
        
        if (allowedSubjects.length > 0) {
          filteredExamsData = filteredExamsData.filter(exam => allowedSubjects.includes(exam.subject))
        }
      }

      setExams(filteredExamsData)
      setFilteredExams(filteredExamsData)

      const subjects = [...new Set(filteredExamsData.map(e => e.subject))]
      setAvailableSubjects(subjects.sort())

      // Load attempts
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentProfile.id)
        .in('exam_id', filteredExamsData.map(e => e.id))

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

      const isExamAvailable = (exam: Exam) => {
        const now = new Date()
        if (attemptsMap[exam.id]?.status === 'completed') return false
        if (!exam.starts_at && !exam.ends_at) return true
        if (exam.starts_at && new Date(exam.starts_at) > now) return false
        if (exam.ends_at && new Date(exam.ends_at) < now) return false
        return true
      }

      const availableCount = filteredExamsData.filter(e => isExamAvailable(e)).length
      const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0
      const gradeInfo = calculateGrade(avgScore)

      setStats({
        available: availableCount,
        completed: completedCount,
        averageScore: avgScore,
        currentGrade: completedCount > 0 ? gradeInfo.grade : '-',
        gradeColor: gradeInfo.color,
        totalSubjects: totalSubjects
      })

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const getExamStatus = (exam: Exam): 'available' | 'upcoming' | 'completed' | 'expired' => {
    const attempt = examAttempts[exam.id]
    if (attempt?.status === 'completed') return 'completed'
    const now = new Date()
    if (exam.starts_at && new Date(exam.starts_at) > now) return 'upcoming'
    if (exam.ends_at && new Date(exam.ends_at) < now) return 'expired'
    return 'available'
  }

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

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20 lg:pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading your exams...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  const firstName = profile ? getFirstName(profile.full_name) : 'Student'

  return (
    <>
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20 lg:pt-24 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/student" className="hover:text-primary flex items-center gap-1 transition-colors">
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">My Exams</span>
            </div>
          </motion.div>

          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/20 shadow-lg">
                  <AvatarImage src={profile?.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xl font-bold">
                    {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Hi, {firstName}!
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-white">
                      <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                      {profile?.class}
                    </Badge>
                    {profile?.department && profile.department !== 'General' && (
                      <Badge variant="outline" className="bg-white">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        {profile.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="flex gap-2 sm:gap-3">
                <div className="bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border text-center">
                  <p className="text-xl sm:text-2xl font-bold text-primary">{stats.available}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Available</p>
                </div>
                <div className="bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border text-center">
                  <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.averageScore}%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div className="bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border text-center">
                  <p className={cn("text-xl sm:text-2xl font-bold", stats.gradeColor)}>
                    {stats.currentGrade}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Grade</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {availableSubjects.length > 0 && (
                <ScrollArea className="w-full sm:flex-1 whitespace-nowrap pb-2">
                  <div className="flex gap-2">
                    <Badge
                      variant={selectedSubject === 'all' ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm shadow-sm",
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
                      const hasCompleted = exams.filter(e => e.subject === subject)
                        .some(e => examAttempts[e.id]?.status === 'completed')
                      
                      return (
                        <Badge
                          key={subject}
                          variant={selectedSubject === subject ? 'default' : 'outline'}
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-all px-3 py-2 text-sm flex items-center gap-1.5 shadow-sm",
                            selectedSubject === subject && "bg-primary text-white hover:bg-primary/90",
                            hasCompleted && "border-green-300"
                          )}
                          onClick={() => setSelectedSubject(subject)}
                        >
                          <SubjectIcon className="h-3.5 w-3.5" />
                          {subject}
                          <span className={cn(
                            "ml-1 px-1.5 py-0.5 rounded-full text-xs",
                            selectedSubject === subject ? "bg-white/20" : "bg-gray-100"
                          )}>
                            {count}
                          </span>
                          {hasCompleted && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 w-40 sm:w-48 lg:w-56 bg-white shadow-sm"
                  />
                </div>
                
                <div className="flex items-center bg-white rounded-lg border p-1 shadow-sm">
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
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
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

          {/* Exams Grid */}
          <AnimatePresence mode="wait">
            {displayedExams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="text-center py-16">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'available' ? (
                        <MonitorPlay className="h-8 w-8 text-gray-400" />
                      ) : activeTab === 'completed' ? (
                        <Award className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Clock className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activeTab === 'available' 
                        ? 'No exams available'
                        : activeTab === 'completed'
                          ? 'No completed exams'
                          : 'No upcoming exams'}
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'available'
                        ? 'Check back later for new exams!'
                        : activeTab === 'completed'
                          ? 'Start taking exams to see your results here!'
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
                        "shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col",
                        status === 'completed' && "border-green-200 bg-green-50/30",
                        status === 'upcoming' && "border-amber-200 bg-amber-50/30",
                        status === 'available' && "bg-white"
                      )}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                              config.bgColor
                            )}>
                              <SubjectIcon className={cn("h-6 w-6", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg font-bold line-clamp-2">
                                {exam.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <span className={cn("font-medium", config.color)}>{exam.subject}</span>
                              </p>
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
                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 cursor-help">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Proctored
                                    </Badge>
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
                              <div className="flex justify-between text-sm mb-1">
                                <span>Score</span>
                                <span className="font-bold text-green-600">{attempt.percentage}%</span>
                              </div>
                              <Progress value={attempt.percentage || 0} className="h-2" />
                            </div>
                          )}

                          <div className="flex-1" />

                          <div className="pt-3 mt-auto">
                            {status === 'completed' ? (
                              <Button onClick={() => handleViewResult(exam.id)} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                                <Award className="mr-2 h-4 w-4" />
                                View Result
                                <ChevronRight className="ml-auto h-4 w-4" />
                              </Button>
                            ) : status === 'available' ? (
                              <Button onClick={() => handleTakeExam(exam.id)} className="w-full">
                                <MonitorPlay className="mr-2 h-4 w-4" />
                                {attempt?.status === 'in_progress' ? 'Resume Exam' : 'Start Exam'}
                                <ArrowRight className="ml-auto h-4 w-4" />
                              </Button>
                            ) : (
                              <Button disabled variant="outline" className="w-full">
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
        </div>
      </main>
    </>
  )
}