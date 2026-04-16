/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/student/page.tsx - PROFESSIONAL RESPONSIVE DASHBOARD
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Eye,
  LayoutDashboard,
  Menu,
  Bell
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

function StudentDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
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

  // Read stored tab from sessionStorage
  useEffect(() => {
    const storedTab = sessionStorage.getItem('studentActiveTab')
    if (storedTab && ['overview', 'exams', 'results', 'assignments', 'attendance', 'courses', 'performance', 'profile', 'settings', 'notifications', 'help'].includes(storedTab)) {
      setActiveTab(storedTab)
      sessionStorage.removeItem('studentActiveTab')
    }
  }, [])

  // ========== AUTH CHECK - FIXED - NO REDIRECT LOOP ==========
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log('No active session, redirecting to portal')
          
          const lastRedirect = sessionStorage.getItem('last_student_auth_redirect')
          const redirectTime = sessionStorage.getItem('last_student_auth_redirect_time')
          const now = Date.now()
          
          if (lastRedirect === '/portal' && redirectTime && (now - parseInt(redirectTime)) < 3000) {
            console.log('Possible redirect loop detected - stopping')
            if (isMounted) {
              setAuthChecking(false)
              setLoading(false)
            }
            return
          }
          
          sessionStorage.setItem('last_student_auth_redirect', '/portal')
          sessionStorage.setItem('last_student_auth_redirect_time', String(now))
          
          if (isMounted) {
            window.location.replace('/portal')
          }
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, full_name, email, class, department, vin_id, photo_url, admission_year')
          .eq('id', session.user.id)
          .maybeSingle()

        if (isMounted) {
          const studentProfile: StudentProfile = {
            id: session.user.id,
            full_name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
            email: profileData?.email || session.user.email || '',
            class: profileData?.class || 'Not Assigned',
            department: profileData?.department || 'General',
            vin_id: profileData?.vin_id || session.user.user_metadata?.vin_id,
            photo_url: profileData?.photo_url || undefined,
            admission_year: profileData?.admission_year || new Date().getFullYear(),
            role: profileData?.role || 'student'
          }
          
          setProfile(studentProfile)
          setAuthChecking(false)
        }
        
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMounted) {
          setAuthChecking(false)
        }
      }
    }

    checkAuth()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('No session in loadDashboardData')
        setLoading(false)
        return
      }

      const user = session.user

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', user.id)
        .maybeSingle()

      const studentProfile: StudentProfile = {
        id: user.id,
        full_name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: profileData?.email || user.email || '',
        class: profileData?.class || 'Not Assigned',
        department: profileData?.department || 'General',
        vin_id: userData?.vin_id || profileData?.vin_id || user.user_metadata?.vin_id,
        photo_url: profileData?.photo_url || undefined,
        admission_year: profileData?.admission_year || new Date().getFullYear(),
        role: profileData?.role || 'student'
      }

      setProfile(studentProfile)

      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      const allExams: Exam[] = (examsData || []).filter(exam => 
        !exam.class || exam.class === studentProfile.class
      )

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
  }, [])

  useEffect(() => {
    if (!authChecking) {
      loadDashboardData()
    }
  }, [loadDashboardData, authChecking])

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
          <Badge className={cn(
            "text-xs sm:text-sm",
            isPassed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
          )}>
            {isPassed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs sm:text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Pending Grading
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs sm:text-sm">
            <Activity className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs sm:text-sm">{status}</Badge>
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

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading student dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header onLogout={handleLogout} />
      
      {/* Mobile Tab Navigation - Visible only on small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
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
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all",
                activeTab === tab.id
                  ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
        
        {/* Mobile More Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg p-4 mb-2 rounded-t-xl"
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'assignments', icon: FileText, label: 'Assignments' },
                  { id: 'attendance', icon: Calendar, label: 'Attendance' },
                  { id: 'courses', icon: BookOpen, label: 'Courses' },
                  { id: 'performance', icon: TrendingUp, label: 'Performance' },
                  { id: 'notifications', icon: Bell, label: 'Notifications' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <tab.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
            
            {(activeTab === 'exams' || activeTab === 'results') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder={`Search ${activeTab}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto">
                          <TabsList className="bg-slate-100 dark:bg-slate-800">
                            <TabsTrigger value="all" className="text-xs sm:text-sm px-3">All</TabsTrigger>
                            <TabsTrigger value="recent" className="text-xs sm:text-sm px-3">Recent</TabsTrigger>
                            <TabsTrigger value="upcoming" className="text-xs sm:text-sm px-3">Upcoming</TabsTrigger>
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
                  <motion.div variants={itemVariants}>
                    <StudentWelcomeBanner 
                      profile={getWelcomeBannerProfile()} 
                      stats={getWelcomeBannerStats()}
                    />
                  </motion.div>

                  {/* Stats Cards - 2x2 on mobile, 4x1 on desktop */}
                  <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Exams</p>
                              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats.totalExams}</p>
                            </div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Completed</p>
                              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats.completedExams}</p>
                            </div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Average Score</p>
                              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats.averageScore}%</p>
                            </div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-md transition-all">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Pending</p>
                              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingResults}</p>
                            </div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {stats.completedExams > 0 && (
                          <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="pb-2 sm:pb-3">
                              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600" />
                                Performance Overview
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 sm:pt-4">
                              <div className="space-y-3 sm:space-y-4">
                                <div>
                                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                                    <span>Pass Rate</span>
                                    <span>{stats.completedExams > 0 ? Math.round((stats.passedExams / stats.completedExams) * 100) : 0}%</span>
                                  </div>
                                  <Progress value={stats.completedExams > 0 ? (stats.passedExams / stats.completedExams) * 100 : 0} className="h-2 sm:h-2.5" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4">
                                    <Trophy className="h-5 w-5 text-green-600 mx-auto mb-1 sm:mb-2" />
                                    <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.passedExams}</p>
                                    <p className="text-xs sm:text-sm text-green-600">Passed</p>
                                  </div>
                                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 sm:p-4">
                                    <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1 sm:mb-2" />
                                    <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.failedExams}</p>
                                    <p className="text-xs sm:text-sm text-red-600">Failed</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                          <CardHeader className="pb-2 sm:pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <MonitorPlay className="h-5 w-5 text-emerald-600" />
                                Available Exams
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('exams')} className="text-xs sm:text-sm">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.availableExams.length === 0 ? (
                              <p className="text-center py-6 sm:py-8 text-slate-500 text-sm">No exams available</p>
                            ) : (
                              <div className="space-y-2 sm:space-y-3">
                                {stats.availableExams.slice(0, 3).map((exam) => (
                                  <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm sm:text-base truncate">{exam.title}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{exam.subject}</Badge>
                                        <span className="text-xs text-slate-500">{exam.duration} mins</span>
                                      </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleTakeExam(exam.id)} className="bg-emerald-600 w-full sm:w-auto">
                                      Start <ChevronRight className="ml-1 h-4 w-4" />
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
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                          <CardHeader className="pb-2 sm:pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-600" />
                                Recent Activity
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('results')} className="text-xs sm:text-sm">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {stats.recentAttempts.length === 0 ? (
                              <p className="text-center py-6 sm:py-8 text-slate-500 text-sm">No recent activity</p>
                            ) : (
                              <div className="space-y-2 sm:space-y-3">
                                {stats.recentAttempts.slice(0, 4).map((attempt) => (
                                  <div key={attempt.id} className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                      <p className="font-medium text-sm sm:text-base truncate flex-1">{attempt.exam_title}</p>
                                      {getStatusBadge(attempt.status, attempt.is_passed)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs sm:text-sm text-slate-500">{attempt.exam_subject}</span>
                                      <span className={cn("font-medium text-sm sm:text-base", getScoreColor(attempt.percentage))}>
                                        {attempt.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          <CardHeader className="pb-2 sm:pb-3">
                            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                              <Calendar className="h-5 w-5" />
                              Upcoming Exams
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {stats.upcomingExams.length === 0 ? (
                              <p className="text-emerald-100 text-center py-4 sm:py-6 text-sm">No upcoming exams</p>
                            ) : (
                              <div className="space-y-2 sm:space-y-3">
                                {stats.upcomingExams.slice(0, 3).map((exam) => (
                                  <div key={exam.id} className="p-3 bg-white/10 rounded-xl">
                                    <p className="font-medium text-sm sm:text-base">{exam.title}</p>
                                    <p className="text-xs sm:text-sm text-emerald-100">{exam.subject}</p>
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

                  {/* Quick Actions - Stack on mobile */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button onClick={() => handleTabChange('exams')} className="bg-emerald-600 w-full sm:w-auto text-sm">
                            <MonitorPlay className="mr-2 h-4 w-4" />
                            Browse Exams
                          </Button>
                          <Button variant="outline" onClick={() => handleTabChange('results')} className="w-full sm:w-auto text-sm">
                            <Award className="mr-2 h-4 w-4" />
                            View Results
                          </Button>
                          <Button variant="outline" onClick={() => handleTabChange('profile')} className="w-full sm:w-auto text-sm">
                            <User className="mr-2 h-4 w-4" />
                            My Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {/* EXAMS TAB */}
              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-4">Available Exams</h1>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAvailableExams.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="p-6 sm:p-8 text-center">
                          <p className="text-slate-500 text-sm sm:text-base">No exams available at this time.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAvailableExams.map((exam) => (
                        <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base sm:text-lg">{exam.title}</CardTitle>
                            <CardDescription className="text-sm">{exam.subject}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Duration:</span>
                                <span className="font-medium">{exam.duration} mins</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Questions:</span>
                                <span className="font-medium">{exam.total_questions}</span>
                              </div>
                              <Button onClick={() => handleTakeExam(exam.id)} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-sm">
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
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-4">My Results</h1>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      {filteredRecentAttempts.length === 0 ? (
                        <p className="text-center py-6 sm:py-8 text-slate-500 text-sm">No exam results yet.</p>
                      ) : (
                        <div className="divide-y">
                          {filteredRecentAttempts.map((attempt) => (
                            <div key={attempt.id} className="py-3 sm:py-4 first:pt-0 last:pb-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm sm:text-base">{attempt.exam_title}</h4>
                                  <p className="text-xs sm:text-sm text-slate-500">
                                    Score: {attempt.total_score} / {attempt.objective_total + attempt.theory_total} ({attempt.percentage}%)
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {getStatusBadge(attempt.status, attempt.is_passed)}
                                  <Button variant="outline" size="sm" onClick={() => handleViewResult(attempt.id)} className="text-xs sm:text-sm">
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
                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-4">My Profile</h1>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      {profile && (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                              <AvatarImage src={profile.photo_url || undefined} />
                              <AvatarFallback className="bg-emerald-600 text-white text-xl sm:text-2xl">
                                {getInitials(profile.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="text-xl sm:text-2xl font-bold">{profile.full_name}</h2>
                              <p className="text-slate-500 text-sm break-all">{profile.email}</p>
                              <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs sm:text-sm">{profile.class}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <p className="text-xs text-slate-500">VIN ID</p>
                              <p className="font-medium text-sm sm:text-base break-all">{profile.vin_id || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <p className="text-xs text-slate-500">Department</p>
                              <p className="font-medium text-sm sm:text-base">{profile.department}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <p className="text-xs text-slate-500">Admission Year</p>
                              <p className="font-medium text-sm sm:text-base">{profile.admission_year || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <p className="text-xs text-slate-500">Role</p>
                              <p className="font-medium text-sm sm:text-base capitalize">{profile.role}</p>
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
}