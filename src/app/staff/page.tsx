/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/staff/page.tsx - FIXED AUTH CHECK - NO REDIRECT LOOP
'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { StaffWelcomeBanner } from '@/components/staff/StaffWelcomeBanner'
import { StaffStatsCards } from '@/components/staff/StaffStatsCards'
import { QuickActions } from '@/components/staff/QuickActions'
import { ExamsList } from '@/components/staff/ExamsList'
import { AssignmentsList } from '@/components/staff/AssignmentsList'
import { NotesList } from '@/components/staff/NotesList'
import { StudentRoster } from '@/components/staff/StudentRoster'
import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { CreateAssignmentDialog } from '@/components/staff/CreateAssignmentDialog'
import { UploadNoteDialog } from '@/components/staff/UploadNoteDialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Clock,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Users,
  FileText,
  Award,
  Download,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  position: string
  photo_url?: string
  class?: string
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  has_theory: boolean
  status: string
  created_at: string
}

interface Assignment {
  id: string
  title: string
  subject: string
  class: string
  description: string
  due_date: string
  total_marks: number
  status: string
  created_at: string
}

interface Note {
  id: string
  title: string
  subject: string
  class: string
  description: string
  file_url?: string
  status: string
  created_at: string
}

interface Student {
  id: string
  full_name: string
  email: string
  class: string
  vin_id: string
  is_active: boolean
  photo_url?: string
}

const formatProfileForHeader = (profile: StaffProfile | null) => {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Staff User',
    email: profile.email,
    role: 'teacher' as const,
    avatar: profile.photo_url,
    isAuthenticated: true
  }
}

function formatFullName(name: string): string {
  if (!name) return ''
  const words = name.split(/[\s._-]+/)
  const formattedWords = words.map(word => {
    if (word.length === 0) return ''
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
  return formattedWords.join(' ')
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
}

function StaffDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  const [showCreateExam, setShowCreateExam] = useState(false)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [showUploadNote, setShowUploadNote] = useState(false)
  
  const [stats, setStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    totalAssignments: 0,
    totalNotes: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    activeStudents: 0,
    averageScore: 0
  })

  // ========== AUTH CHECK - FIXED - NO REDIRECT LOOP ==========
  useEffect(() => {
    let isMounted = true
    const redirectAttempts = 0
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // ONLY redirect if DEFINITELY no session
        if (!session) {
          console.log('No session, redirecting to portal')
          
          // Add loop prevention
          const lastRedirect = sessionStorage.getItem('last_auth_redirect')
          const redirectTime = sessionStorage.getItem('last_auth_redirect_time')
          const now = Date.now()
          
          if (lastRedirect === '/portal' && redirectTime && (now - parseInt(redirectTime)) < 3000) {
            console.log('Possible redirect loop detected - stopping')
            if (isMounted) {
              setAuthChecking(false)
              setLoading(false)
            }
            return
          }
          
          sessionStorage.setItem('last_auth_redirect', '/portal')
          sessionStorage.setItem('last_auth_redirect_time', String(now))
          
          if (isMounted) {
            window.location.replace('/portal')
          }
          return
        }

        // Try to load profile - but DON'T redirect if it fails
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email, department, position, photo_url, class')
          .eq('id', session.user.id)
          .maybeSingle()

        if (isMounted) {
          // Set profile with defaults even if not found
          const rawFullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Staff User'
          const formattedFullName = formatFullName(rawFullName)

          setProfile({
            id: session.user.id,
            full_name: formattedFullName,
            email: profile?.email || session.user.email || '',
            department: profile?.department || 'General',
            position: profile?.position || 'Teacher',
            photo_url: profile?.photo_url || null,
            class: profile?.class || null
          })

          // User is authenticated - stay on page
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
  }

  // Handle sidebar navigation
  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab)
    switch (tab) {
      case 'overview':
        router.push('/staff')
        break
      case 'exams':
        router.push('/staff/exams')
        break
      case 'assignments':
        router.push('/staff/assignments')
        break
      case 'notes':
        router.push('/staff/notes')
        break
      case 'students':
        router.push('/staff/students')
        break
      default:
        router.push('/staff')
    }
  }

  // FIXED: loadDashboardData - NO REDIRECTS
  const loadDashboardData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Don't redirect here - just return if no session
      if (!session) {
        console.log('No session in loadDashboardData, but auth check passed?')
        setLoading(false)
        return
      }

      let userData = null
      let rawFullName = ''
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileData) {
        userData = profileData
        rawFullName = profileData.full_name || ''
      }

      if (!rawFullName) {
        rawFullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Staff User'
      }

      const formattedFullName = formatFullName(rawFullName)

      setProfile(prev => ({
        ...prev,
        id: session.user.id,
        full_name: formattedFullName,
        email: userData?.email || session.user.email || '',
        department: userData?.department || 'General',
        position: userData?.position || 'Teacher',
        photo_url: userData?.photo_url || null,
        class: userData?.class || null
      }))

      const [
        { data: examsData },
        { data: assignmentsData },
        { data: notesData },
        { data: studentsData }
      ] = await Promise.all([
        supabase.from('exams').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false }),
        supabase.from('assignments').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'student').order('class')
      ])

      if (examsData) setExams(examsData as Exam[])
      if (assignmentsData) setAssignments(assignmentsData as Assignment[])
      if (notesData) setNotes(notesData as Note[])
      
      if (studentsData && studentsData.length > 0) {
        setStudents(studentsData as Student[])
      } else {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student')
          .order('class')
        if (usersData) setStudents(usersData as Student[])
      }

      const activeStudentsCount = studentsData?.filter((s: any) => s.is_active).length || 0
      const publishedExamsCount = examsData?.filter((e: any) => e.status === 'published').length || 0
      
      setStats({
        totalExams: examsData?.length || 0,
        publishedExams: publishedExamsCount,
        totalAssignments: assignmentsData?.length || 0,
        totalNotes: notesData?.length || 0,
        totalStudents: studentsData?.length || 0,
        pendingSubmissions: 0,
        activeStudents: activeStudentsCount,
        averageScore: 75
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, []) // Removed router dependency

  useEffect(() => {
    if (!authChecking) {
      loadDashboardData()
    }
  }, [loadDashboardData, authChecking])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.replace('/portal')
  }

  const handleExamCreated = () => {
    loadDashboardData()
    setShowCreateExam(false)
    toast.success('Exam created successfully!')
  }

  const handleAssignmentCreated = () => {
    loadDashboardData()
    setShowCreateAssignment(false)
    toast.success('Assignment created!')
  }

  const handleNoteUploaded = () => {
    loadDashboardData()
    setShowUploadNote(false)
    toast.success('Study note uploaded!')
  }

  const handleViewAllStudents = () => {
    setActiveTab('students')
  }

  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAssignments = assignments.filter(assignment => 
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading staff dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            
            {(activeTab === 'exams' || activeTab === 'assignments' || activeTab === 'notes') && (
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
                            <TabsTrigger value="published">Published</TabsTrigger>
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
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants}>
                    <StaffWelcomeBanner profile={profile} stats={stats} />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <StaffStatsCards stats={stats} />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <QuickActions 
                      onCreateExam={() => setShowCreateExam(true)}
                      onCreateAssignment={() => setShowCreateAssignment(true)}
                      onUploadNote={() => setShowUploadNote(true)}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-6">
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                  <BookOpen className="h-5 w-5 text-blue-600" />
                                  Recent Exams
                                </CardTitle>
                                <CardDescription>Your recently created exams</CardDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleTabChange('exams')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <ExamsList exams={exams.slice(0, 5)} onRefresh={loadDashboardData} compact />
                          </CardContent>
                        </Card>
                        
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-emerald-600" />
                                  Recent Assignments
                                </CardTitle>
                                <CardDescription>Your recently created assignments</CardDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleTabChange('assignments')}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <AssignmentsList assignments={assignments.slice(0, 3)} onRefresh={loadDashboardData} compact />
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-6">
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
                          <div className="absolute top-0 right-0 opacity-10">
                            <TrendingUp className="h-32 w-32 -mr-8 -mt-8" />
                          </div>
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                              <Sparkles className="h-5 w-5" />
                              Quick Insights
                            </CardTitle>
                            <CardDescription className="text-blue-100">
                              Your teaching impact at a glance
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5" />
                                <span>Active Students</span>
                              </div>
                              <span className="text-2xl font-bold">{stats.activeStudents}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5" />
                                <span>Published Exams</span>
                              </div>
                              <span className="text-2xl font-bold">{stats.publishedExams}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <Award className="h-5 w-5" />
                                <span>Avg. Score</span>
                              </div>
                              <span className="text-2xl font-bold">{stats.averageScore}%</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <StudentRoster students={students.slice(0, 6)} onViewAll={handleViewAllStudents} />
                        
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-semibold">Recent Notes</CardTitle>
                                <CardDescription>Study materials</CardDescription>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('notes')}>
                                View All
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <NotesList notes={notes.slice(0, 3)} onRefresh={loadDashboardData} compact />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Exams Tab */}
              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        My Exams
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage CBT and theory exams</p>
                    </div>
                    <Button onClick={() => setShowCreateExam(true)} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <Plus className="mr-2 h-5 w-5" /> Create New Exam
                    </Button>
                  </div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <ExamsList exams={filteredExams} onRefresh={loadDashboardData} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <motion.div key="assignments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Assignments
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage student assignments</p>
                    </div>
                    <Button onClick={() => setShowCreateAssignment(true)} size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <Plus className="mr-2 h-5 w-5" /> Create Assignment
                    </Button>
                  </div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <AssignmentsList assignments={filteredAssignments} onRefresh={loadDashboardData} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Study Notes
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Upload and manage study materials</p>
                    </div>
                    <Button onClick={() => setShowUploadNote(true)} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <Plus className="mr-2 h-5 w-5" /> Upload Note
                    </Button>
                  </div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <NotesList notes={filteredNotes} onRefresh={loadDashboardData} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Student Roster
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage all students in your classes</p>
                    </div>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Download className="h-5 w-5" />
                      Export Roster
                    </Button>
                  </div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <StudentRoster students={students} fullView />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <CreateExamDialog open={showCreateExam} onOpenChange={setShowCreateExam} onSuccess={handleExamCreated} teacherProfile={profile} />
      <CreateAssignmentDialog open={showCreateAssignment} onOpenChange={setShowCreateAssignment} onSuccess={handleAssignmentCreated} teacherProfile={profile} />
      <UploadNoteDialog open={showUploadNote} onOpenChange={setShowUploadNote} onSuccess={handleNoteUploaded} teacherProfile={profile} />
    </div>
  )
}

export default function StaffDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading staff dashboard...</p>
          </div>
        </div>
      </div>
    }>
      <StaffDashboardContent />
    </Suspense>
  )
}