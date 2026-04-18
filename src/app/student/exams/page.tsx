/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exams/page.tsx - FULLY RESPONSIVE, NO DIFFICULTY BADGES
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
  Calendar, Menu
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16 lg:pt-20">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">Loading your exams...</p>
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
      
      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around p-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/student')} className="flex-col h-auto py-2">
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-1">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 text-emerald-600">
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] mt-1">Exams</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/student/results')} className="flex-col h-auto py-2">
            <Award className="h-5 w-5" />
            <span className="text-[10px] mt-1">Results</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex-col h-auto py-2">
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1">More</span>
          </Button>
        </div>
      </div>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16 lg:pt-20 pb-24 lg:pb-8">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
          
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 sm:mb-4"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Link href="/student" className="hover:text-primary flex items-center gap-1 transition-colors">
                <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-foreground font-medium">My Exams</span>
            </div>
          </motion.div>

          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-14 lg:h-16 sm:w-14 lg:w-16 ring-2 ring-primary/20 shadow-lg">
                  <AvatarImage src={profile?.photo_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-lg sm:text-xl font-bold">
                    {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
                    Hi, {firstName}!
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                    <Badge variant="outline" className="bg-white text-[10px] sm:text-xs">
                      <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {profile?.class}
                    </Badge>
                    {profile?.department && profile.department !== 'General' && (
                      <Badge variant="outline" className="bg-white text-[10px] sm:text-xs">
                        <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {profile.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats Cards - Scrollable on mobile */}
              <div className="flex gap-1.5 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
                <div className="bg-white rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-sm border text-center min-w-[60px] sm:min-w-[70px]">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{stats.available}</p>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">Available</p>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-sm border text-center min-w-[60px] sm:min-w-[70px]">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-sm border text-center min-w-[60px] sm:min-w-[70px]">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">{stats.averageScore}%</p>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">Avg</p>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-sm border text-center min-w-[60px] sm:min-w-[70px]">
                  <p className={cn("text-lg sm:text-xl lg:text-2xl font-bold", stats.gradeColor)}>
                    {stats.currentGrade}
                  </p>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">Grade</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4 sm:mb-6"
          >
            <div className="flex flex-col gap-3">
              {availableSubjects.length > 0 && (
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                  <div className="flex gap-1.5 sm:gap-2">
                    <Badge
                      variant={selectedSubject === 'all' ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm",
                        selectedSubject === 'all' && "bg-primary text-white hover:bg-primary/90"
                      )}
                      onClick={() => setSelectedSubject('all')}
                    >
                      All
                      <span className="ml-1.5 sm:ml-2 bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">
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
                            "cursor-pointer hover:bg-primary/10 transition-all px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 shadow-sm whitespace-nowrap",
                            selectedSubject === subject && "bg-primary text-white hover:bg-primary/90",
                            hasCompleted && "border-green-300"
                          )}
                          onClick={() => setSelectedSubject(subject)}
                        >
                          <SubjectIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">{subject}</span>
                          <span className="sm:hidden">{subject.split(' ')[0]}</span>
                          <span className={cn(
                            "ml-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs",
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

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 text-sm bg-white shadow-sm w-full"
                  />
                </div>
                
                <div className="flex items-center bg-white rounded-lg border p-1 shadow-sm shrink-0">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
            className="mb-4 sm:mb-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white p-1 rounded-xl shadow-sm border w-full justify-start overflow-x-auto">
                <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                  <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Available
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-white/20 text-inherit text-[10px] sm:text-xs">
                    {filteredExams.filter(e => getExamStatus(e) === 'available').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Upcoming
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-white/20 text-inherit text-[10px] sm:text-xs">
                    {filteredExams.filter(e => getExamStatus(e) === 'upcoming').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Completed
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-white/20 text-inherit text-[10px] sm:text-xs">
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
                  <CardContent className="text-center py-12 sm:py-16">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      {activeTab === 'available' ? (
                        <MonitorPlay className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                      ) : activeTab === 'completed' ? (
                        <Award className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                      ) : (
                        <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {activeTab === 'available' 
                        ? 'No exams available'
                        : activeTab === 'completed'
                          ? 'No completed exams'
                          : 'No upcoming exams'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
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
                    ? "grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "space-y-2 sm:space-y-3"
                )}
              >
                {displayedExams.map((exam, index) => {
                  const status = getExamStatus(exam)
                  const attempt = examAttempts[exam.id]
                  const config = getSubjectConfig(exam.subject)
                  const SubjectIcon = config.icon
                  
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="h-full"
                    >
                      <Card className={cn(
                        "shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col",
                        status === 'completed' && "border-green-200 bg-green-50/30",
                        status === 'upcoming' && "border-amber-200 bg-amber-50/30",
                        status === 'available' && "bg-white"
                      )}>
                        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={cn(
                              "h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                              config.bgColor
                            )}>
                              <SubjectIcon className={cn("h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm sm:text-base lg:text-lg font-bold line-clamp-2">
                                {exam.title}
                              </CardTitle>
                              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                <span className={cn("font-medium truncate", config.color)}>{exam.subject}</span>
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 flex flex-col px-3 sm:px-4 pb-3 sm:pb-4">
                          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                            {exam.has_theory && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <PenTool className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                Theory
                              </Badge>
                            )}
                            {exam.proctoring_enabled && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-[10px] sm:text-xs bg-red-50 text-red-700 border-red-200 cursor-help">
                                      <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                      Proctored
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Camera required</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>{exam.duration}m</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>{exam.total_questions} Qs</span>
                            </div>
                          </div>

                          {exam.starts_at && status === 'upcoming' && (
                            <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-amber-50 rounded-lg">
                              <p className="text-[10px] sm:text-xs text-amber-700 flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Starts {formatDate(exam.starts_at)}
                              </p>
                            </div>
                          )}

                          {exam.ends_at && status === 'available' && (
                            <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                              <p className="text-[10px] sm:text-xs text-blue-700 flex items-center gap-1">
                                <Timer className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Closes {formatDate(exam.ends_at)}
                              </p>
                            </div>
                          )}

                          {status === 'completed' && attempt && (
                            <div className="mb-2 sm:mb-3">
                              <div className="flex justify-between text-xs sm:text-sm mb-1">
                                <span>Score</span>
                                <span className="font-bold text-green-600">{attempt.percentage}%</span>
                              </div>
                              <Progress value={attempt.percentage || 0} className="h-1.5 sm:h-2" />
                            </div>
                          )}

                          <div className="flex-1" />

                          <div className="pt-2 sm:pt-3 mt-auto">
                            {status === 'completed' ? (
                              <Button 
                                onClick={() => handleViewResult(exam.id)} 
                                variant="outline" 
                                size="sm"
                                className="w-full border-green-200 text-green-700 hover:bg-green-50 h-8 sm:h-9 text-xs sm:text-sm"
                              >
                                <Award className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                View Result
                                <ChevronRight className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            ) : status === 'available' ? (
                              <Button 
                                onClick={() => handleTakeExam(exam.id)} 
                                size="sm"
                                className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                              >
                                <MonitorPlay className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {attempt?.status === 'in_progress' ? 'Resume' : 'Start'}
                                <ArrowRight className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            ) : (
                              <Button disabled variant="outline" size="sm" className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                                <Lock className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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