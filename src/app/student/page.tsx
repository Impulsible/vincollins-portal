/* eslint-disable @typescript-eslint/no-explicit-any */
// app/student/page.tsx - STUDENT DASHBOARD - COMPLETE FIXED VERSION WITH URL SYNC
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  FileText,
  MonitorPlay,
  BarChart3,
  Activity,
  Search,
  Filter,
  User,
  Settings,
  Sparkles,
  ArrowRight,
  Target,
  Trophy,
  Eye
} from 'lucide-react'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string | null
  admission_year?: number
  role?: string
}

interface WelcomeBannerProfile {
  full_name: string
  class: string
  photo_url?: string
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
  teacher_name?: string
  passing_percentage?: number
}

interface ExamAttempt {
  id: string
  exam_id: string
  exam_title?: string
  exam_subject?: string
  status: 'in-progress' | 'completed' | 'pending_theory' | 'graded' | 'submitted'
  started_at: string
  submitted_at: string | null
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  total_score: number
  percentage: number
  is_passed: boolean
  attempt_number: number
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

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
}

// Valid tabs for URL sync
const VALID_TABS = ['overview', 'exams', 'results', 'profile', 'assignments', 'attendance', 'courses', 'performance', 'notifications', 'settings', 'help']

function StudentDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  
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

  // Sync activeTab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Handle tab change - updates both state and URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/student?tab=${tab}`)
  }

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error('Please log in to continue')
        router.push('/portal')
        return
      }

      const user = session.user

      // Load student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profileData) {
        toast.error('Failed to load profile')
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

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: userData?.vin_id || profileData.vin_id,
        photo_url: profileData.photo_url || undefined,
        admission_year: profileData.admission_year,
        role: profileData.role
      }

      setProfile(studentProfile)

      // Load published exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      const allExams: Exam[] = (examsData || []).filter(exam => 
        !exam.class || exam.class === studentProfile.class
      )

      // Load exam attempts
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams:exam_id (
            title,
            subject
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      const attempts: ExamAttempt[] = (attemptsData || []).map((att: any) => ({
        ...att,
        exam_title: att.exams?.title || 'Unknown Exam',
        exam_subject: att.exams?.subject || 'Unknown Subject'
      }))

      const completedAttempts = attempts.filter(a => 
        a.status === 'completed' || a.status === 'graded' || 
        a.status === 'pending_theory' || a.status === 'submitted'
      )
      
      const pendingAttempts = attempts.filter(a => 
        a.status === 'pending_theory' || a.status === 'submitted'
      )
      
      const passedAttempts = completedAttempts.filter(a => a.is_passed)

      const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedAttempts.length
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
        averageScore: Math.round(avgScore),
        passedExams: passedAttempts.length,
        failedExams: completedAttempts.length - passedAttempts.length,
        pendingResults: pendingAttempts.length,
        recentAttempts: attempts.slice(0, 5),
        upcomingExams,
        availableExams: availableExams.slice(0, 6)
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const handleTakeExam = (examId: string) => {
    router.push(`/student/exam/${examId}`)
  }

  const handleViewResult = (attemptId: string) => {
    router.push(`/student/results/${attemptId}`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
    if (percentage >= 70) return 'text-green-600 dark:text-green-400'
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusBadge = (status: string, isPassed?: boolean) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return (
          <Badge className={isPassed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
            {isPassed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Grading
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWelcomeBannerProfile = (): WelcomeBannerProfile | null => {
    if (!profile) return null
    return {
      full_name: profile.full_name,
      class: profile.class,
      photo_url: profile.photo_url || undefined
    }
  }

  const getWelcomeBannerStats = () => {
    return {
      completedExams: stats.completedExams,
      averageScore: stats.averageScore,
      attendance: 95
    }
  }

  const getInitials = (name?: string): string => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const filteredAvailableExams = stats.availableExams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRecentAttempts = stats.recentAttempts.filter(attempt => 
    attempt.exam_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attempt.exam_subject?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUpcomingExams = stats.upcomingExams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className={cn(
            "hidden lg:block transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-72"
          )} />
          <main className={cn(
            "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
          )}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div variants={itemVariants}>
                  <Skeleton className="h-40 w-full rounded-2xl" />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                    <div>
                      <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header onLogout={handleLogout} />
      
      <div className="flex">
        {/* Sidebar */}
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />

        {/* Main Content */}
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            
            {/* Search and Filter Bar */}
            {(activeTab === 'exams' || activeTab === 'results') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder={`Search ${activeTab}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto">
                          <TabsList className="bg-slate-100 dark:bg-slate-800">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="recent">Recent</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <Button variant="outline" size="icon" className="shrink-0">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* ========== OVERVIEW TAB ========== */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Welcome Banner */}
                  <motion.div variants={itemVariants}>
                    <StudentWelcomeBanner 
                      profile={getWelcomeBannerProfile()} 
                      stats={getWelcomeBannerStats()}
                    />
                  </motion.div>

                  {/* Stats Cards */}
                  <motion.div variants={itemVariants}>
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all hover:scale-[1.02]">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Total Exams</p>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalExams}</p>
                              <p className="text-xs text-slate-400 mt-1">Available to take</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all hover:scale-[1.02]">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completedExams}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {stats.passedExams} passed
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all hover:scale-[1.02]">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Average Score</p>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.averageScore}%</p>
                              <p className="text-xs text-slate-400 mt-1">
                                <TrendingUp className="inline h-3 w-3 mr-1" />
                                Keep it up!
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all hover:scale-[1.02]">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Results</p>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingResults}</p>
                              <p className="text-xs text-slate-400 mt-1">Awaiting grading</p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>

                  {/* Main Content Grid */}
                  <motion.div variants={itemVariants}>
                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Left Column */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Performance Overview */}
                        {stats.completedExams > 0 && (
                          <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                                    Performance Overview
                                  </CardTitle>
                                  <CardDescription>Your exam performance summary</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Pass Rate</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                      {stats.completedExams > 0 
                                        ? Math.round((stats.passedExams / stats.completedExams) * 100)
                                        : 0}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={stats.completedExams > 0 
                                      ? (stats.passedExams / stats.completedExams) * 100 
                                      : 0
                                    } 
                                    className="h-2.5" 
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Passed Exams</p>
                                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.passedExams}</p>
                                  </div>
                                  <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                                    <div className="h-10 w-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">Failed Exams</p>
                                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.failedExams}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Available Exams */}
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                  <MonitorPlay className="h-5 w-5 text-emerald-600" />
                                  Available Exams
                                </CardTitle>
                                <CardDescription>Exams you can take right now</CardDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleTabChange('exams')}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.availableExams.length === 0 ? (
                              <div className="text-center py-8">
                                <MonitorPlay className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No exams available at the moment.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {stats.availableExams.slice(0, 3).map((exam) => (
                                  <div 
                                    key={exam.id} 
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900 dark:text-white">{exam.title}</p>
                                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                          {exam.subject}
                                        </Badge>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                          <Clock className="h-3 w-3" /> {exam.duration} mins
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                          <FileText className="h-3 w-3" /> {exam.total_questions} Qs
                                        </span>
                                      </div>
                                      {exam.has_theory && (
                                        <Badge className="mt-2 bg-purple-100 text-purple-700 text-xs">
                                          Includes Theory
                                        </Badge>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleTakeExam(exam.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 ml-3"
                                    >
                                      Start
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* My Classmates Card */}
                        <StudentClassRoster 
                          studentClass={profile?.class}
                          studentId={profile?.id}
                          compact={false}
                        />
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {/* Recent Activity */}
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                  <Activity className="h-5 w-5 text-emerald-600" />
                                  Recent Activity
                                </CardTitle>
                                <CardDescription>Your latest exam attempts</CardDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleTabChange('results')}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.recentAttempts.length === 0 ? (
                              <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No recent activity.</p>
                                <Button 
                                  variant="link" 
                                  onClick={() => handleTabChange('exams')}
                                  className="mt-2"
                                >
                                  Browse available exams
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {stats.recentAttempts.slice(0, 4).map((attempt) => (
                                  <div 
                                    key={attempt.id} 
                                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="font-medium text-slate-900 dark:text-white truncate flex-1">
                                        {attempt.exam_title}
                                      </p>
                                      {getStatusBadge(attempt.status, attempt.is_passed)}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-500">{attempt.exam_subject}</span>
                                      <span className={cn(
                                        "font-medium",
                                        getScoreColor(attempt.percentage)
                                      )}>
                                        {attempt.percentage}%
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-slate-400">
                                        {formatDate(attempt.submitted_at || undefined)}
                                      </span>
                                      {(attempt.status === 'completed' || attempt.status === 'graded' || 
                                        attempt.status === 'pending_theory' || attempt.status === 'submitted') && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleViewResult(attempt.id)}
                                          className="text-xs h-7"
                                        >
                                          <Eye className="mr-1 h-3 w-3" /> View
                                        </Button>
                                      )}
                                      {attempt.status === 'in-progress' && (
                                        <Button 
                                          size="sm"
                                          onClick={() => handleTakeExam(attempt.exam_id)}
                                          className="text-xs h-7"
                                        >
                                          Resume
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Upcoming Exams Card */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
                          <div className="absolute top-0 right-0 opacity-10">
                            <Calendar className="h-32 w-32 -mr-8 -mt-8" />
                          </div>
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Upcoming Exams
                            </CardTitle>
                            <CardDescription className="text-emerald-100">
                              Scheduled exams coming up
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {stats.upcomingExams.length === 0 ? (
                              <p className="text-emerald-100 text-center py-4">No upcoming exams scheduled.</p>
                            ) : (
                              <div className="space-y-3">
                                {stats.upcomingExams.slice(0, 3).map((exam) => (
                                  <div key={exam.id} className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <p className="font-medium">{exam.title}</p>
                                    <p className="text-sm text-emerald-100">{exam.subject}</p>
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

                        {/* Quick Tip */}
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">Study Tip</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Take practice exams regularly to improve your speed and accuracy.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => handleTabChange('exams')} className="bg-emerald-600 hover:bg-emerald-700">
                            <MonitorPlay className="mr-2 h-4 w-4" />
                            Browse All Exams
                          </Button>
                          <Button variant="outline" onClick={() => handleTabChange('results')}>
                            <Award className="mr-2 h-4 w-4" />
                            View All Results
                          </Button>
                          <Button variant="outline" onClick={() => handleTabChange('profile')}>
                            <User className="mr-2 h-4 w-4" />
                            My Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {/* ========== EXAMS TAB ========== */}
              {activeTab === 'exams' && (
                <motion.div 
                  key="exams"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Available Exams
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Take exams and test your knowledge
                    </p>
                  </div>

                  <Tabs defaultValue="available" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="available">
                        <MonitorPlay className="h-4 w-4 mr-2" />
                        Available ({stats.availableExams.length})
                      </TabsTrigger>
                      <TabsTrigger value="upcoming">
                        <Calendar className="h-4 w-4 mr-2" />
                        Upcoming ({stats.upcomingExams.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="available">
                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          {filteredAvailableExams.length === 0 ? (
                            <div className="text-center py-12">
                              <MonitorPlay className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500">No exams available at the moment.</p>
                            </div>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {filteredAvailableExams.map((exam) => (
                                <Card key={exam.id} className="border shadow-sm hover:shadow-md transition-shadow">
                                  <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <CardTitle className="text-base">{exam.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                          <BookOpen className="h-3 w-3" />
                                          {exam.subject}
                                        </CardDescription>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Duration:</span>
                                        <span className="font-medium">{exam.duration} mins</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Questions:</span>
                                        <span className="font-medium">{exam.total_questions}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Total Marks:</span>
                                        <span className="font-medium">{exam.total_marks}</span>
                                      </div>
                                      {exam.has_theory && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                          <FileText className="h-3 w-3 mr-1" />
                                          Includes Theory
                                        </Badge>
                                      )}
                                      <Button 
                                        onClick={() => handleTakeExam(exam.id)}
                                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        Take Exam
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="upcoming">
                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          {filteredUpcomingExams.length === 0 ? (
                            <div className="text-center py-12">
                              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500">No upcoming exams scheduled.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {filteredUpcomingExams.map((exam) => (
                                <Card key={exam.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">{exam.title}</h4>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                          <span className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {exam.subject}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {exam.duration} mins
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Starts:
                                        </p>
                                        <p className="text-sm text-slate-500">
                                          {formatDateTime(exam.starts_at)}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}

              {/* ========== RESULTS TAB ========== */}
              {activeTab === 'results' && (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      My Results
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      View your exam performance and grades
                    </p>
                  </div>

                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {filteredRecentAttempts.length === 0 ? (
                        <div className="text-center py-12">
                          <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No exam results yet.</p>
                          <Button 
                            variant="link" 
                            onClick={() => handleTabChange('exams')}
                            className="mt-2"
                          >
                            Take your first exam
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredRecentAttempts.map((attempt) => (
                            <div key={attempt.id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-medium text-slate-900 dark:text-white">{attempt.exam_title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {attempt.exam_subject}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span>Submitted: {formatDate(attempt.submitted_at || undefined)}</span>
                                    {attempt.status !== 'in-progress' && (
                                      <span className={cn(
                                        "font-medium",
                                        getScoreColor(attempt.percentage)
                                      )}>
                                        Score: {attempt.total_score}/{attempt.objective_total + attempt.theory_total} ({attempt.percentage}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(attempt.status, attempt.is_passed)}
                                  {(attempt.status === 'completed' || attempt.status === 'graded' || 
                                    attempt.status === 'pending_theory' || attempt.status === 'submitted') && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewResult(attempt.id)}
                                    >
                                      View Details
                                    </Button>
                                  )}
                                  {attempt.status === 'in-progress' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => handleTakeExam(attempt.exam_id)}
                                    >
                                      Resume
                                    </Button>
                                  )}
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

              {/* ========== PROFILE TAB ========== */}
              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      My Profile
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      View and manage your account information
                    </p>
                  </div>

                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {profile && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              {profile.photo_url ? (
                                <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-slate-900 shadow-xl">
                                  <AvatarImage src={profile.photo_url} alt={profile.full_name} />
                                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-2xl font-bold">
                                    {getInitials(profile.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                  {getInitials(profile.full_name)}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1">
                                <div className="relative h-4 w-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                              </div>
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h2>
                              <p className="text-slate-500">{profile.email}</p>
                              <Badge className="mt-2 bg-emerald-100 text-emerald-700">{profile.class}</Badge>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-sm text-slate-500">VIN ID</p>
                              <p className="font-medium text-slate-900 dark:text-white">{profile.vin_id || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-slate-500">Department</p>
                              <p className="font-medium text-slate-900 dark:text-white">{profile.department}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-slate-500">Admission Year</p>
                              <p className="font-medium text-slate-900 dark:text-white">{profile.admission_year || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-slate-500">Role</p>
                              <p className="font-medium text-slate-900 dark:text-white capitalize">{profile.role}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Button variant="outline" onClick={() => router.push('/student/settings')}>
                              <Settings className="mr-2 h-4 w-4" />
                              Edit Profile
                            </Button>
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

// Export with Suspense wrapper
export default function StudentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
}