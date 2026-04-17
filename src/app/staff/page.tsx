/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/staff/page.tsx - UPDATED WITH BEAUTIFUL LOADING ANIMATION
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Plus, Sparkles, TrendingUp, Calendar, Clock, Search, Filter, ArrowRight,
  BookOpen, Users, FileText, Award, Download, Loader2, LayoutDashboard,
  MonitorPlay, User, Menu, Settings, Flame, Zap, Trophy, Target,
  GraduationCap, Briefcase
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

interface TermInfo {
  termName: string
  sessionYear: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  startDate: string
  endDate: string
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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  const [showCreateExam, setShowCreateExam] = useState(false)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [showUploadNote, setShowUploadNote] = useState(false)
  
  const [stats, setStats] = useState({
    totalExams: 0, publishedExams: 0, totalAssignments: 0, totalNotes: 0,
    totalStudents: 0, pendingSubmissions: 0, activeStudents: 0, averageScore: 0
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

  const [pendingGrading, setPendingGrading] = useState(0)

  // Load term settings
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

  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          const lastRedirect = sessionStorage.getItem('last_auth_redirect')
          const redirectTime = sessionStorage.getItem('last_auth_redirect_time')
          const now = Date.now()
          if (lastRedirect === '/portal' && redirectTime && (now - parseInt(redirectTime)) < 3000) {
            if (isMounted) { setAuthChecking(false); setLoading(false) }
            return
          }
          sessionStorage.setItem('last_auth_redirect', '/portal')
          sessionStorage.setItem('last_auth_redirect_time', String(now))
          if (isMounted) window.location.replace('/portal')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email, department, position, photo_url, class')
          .eq('id', session.user.id)
          .maybeSingle()

        if (isMounted) {
          const rawFullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Staff User'
          setProfile({
            id: session.user.id, full_name: formatFullName(rawFullName),
            email: profile?.email || session.user.email || '',
            department: profile?.department || 'General',
            position: profile?.position || 'Teacher',
            photo_url: profile?.photo_url || null, class: profile?.class || null
          })
          setAuthChecking(false)
        }
      } catch (err) { if (isMounted) setAuthChecking(false) }
    }
    checkAuth()
    return () => { isMounted = false }
  }, [])

  const handleTabChange = (tab: string) => { setActiveTab(tab); setMobileMenuOpen(false) }
  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab)
    switch (tab) {
      case 'overview': router.push('/staff'); break
      case 'exams': router.push('/staff/exams'); break
      case 'assignments': router.push('/staff/assignments'); break
      case 'notes': router.push('/staff/notes'); break
      case 'students': router.push('/staff/students'); break
      default: router.push('/staff')
    }
  }

  const loadDashboardData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      await loadTermSettings()

      let userData = null, rawFullName = ''
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (profileData) { userData = profileData; rawFullName = profileData.full_name || '' }
      if (!rawFullName) rawFullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Staff User'

      setProfile(prev => ({
        ...prev, id: session.user.id, full_name: formatFullName(rawFullName),
        email: userData?.email || session.user.email || '',
        department: userData?.department || 'General',
        position: userData?.position || 'Teacher',
        photo_url: userData?.photo_url || null, class: userData?.class || null
      }))

      const [{ data: examsData }, { data: assignmentsData }, { data: notesData }, { data: studentsData }, { data: pendingGradingData }] = await Promise.all([
        supabase.from('exams').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false }),
        supabase.from('assignments').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'student').order('class'),
        supabase.from('exam_attempts').select('*', { count: 'exact' }).eq('status', 'submitted')
      ])

      if (examsData) setExams(examsData as Exam[])
      if (assignmentsData) setAssignments(assignmentsData as Assignment[])
      if (notesData) setNotes(notesData as Note[])
      if (studentsData?.length) setStudents(studentsData as Student[])
      else {
        const { data: usersData } = await supabase.from('users').select('*').eq('role', 'student').order('class')
        if (usersData) setStudents(usersData as Student[])
      }

      setPendingGrading(pendingGradingData?.length || 0)

      setStats({
        totalExams: examsData?.length || 0,
        publishedExams: examsData?.filter((e: any) => e.status === 'published').length || 0,
        totalAssignments: assignmentsData?.length || 0,
        totalNotes: notesData?.length || 0,
        totalStudents: studentsData?.length || 0,
        pendingSubmissions: pendingGradingData?.length || 0,
        activeStudents: studentsData?.filter((s: any) => s.is_active).length || 0,
        averageScore: 75
      })
    } catch (error) { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }, [loadTermSettings])

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('staff-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_attempts',
          filter: `status=eq.submitted`
        },
        () => {
          console.log('🔄 New submission, refreshing...')
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [profile?.id, loadDashboardData])

  useEffect(() => { if (!authChecking) loadDashboardData() }, [loadDashboardData, authChecking])

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.replace('/portal') }
  const handleExamCreated = () => { loadDashboardData(); setShowCreateExam(false); toast.success('Exam created!') }
  const handleAssignmentCreated = () => { loadDashboardData(); setShowCreateAssignment(false); toast.success('Assignment created!') }
  const handleNoteUploaded = () => { loadDashboardData(); setShowUploadNote(false); toast.success('Note uploaded!') }
  const handleViewAllStudents = () => setActiveTab('students')

  const filteredExams = exams.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredAssignments = assignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.subject.toLowerCase().includes(searchQuery.toLowerCase()))

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Briefcase className="h-16 w-16 text-blue-600 mx-auto" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-slate-600 text-lg font-medium"
            >
              Loading Staff Dashboard...
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-2 text-slate-500 text-sm"
            >
              Preparing your teaching space ✨
            </motion.p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-blue-400"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      {/* Mobile Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe w-full overflow-x-hidden">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[{ id: 'overview', icon: LayoutDashboard, label: 'Home' }, { id: 'exams', icon: MonitorPlay, label: 'Exams' }, { id: 'students', icon: Users, label: 'Students' }, { id: 'profile', icon: User, label: 'Profile' }].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={cn("flex flex-col items-center justify-center py-2 px-1 rounded-lg", activeTab === tab.id ? "text-blue-600 bg-blue-50" : "text-slate-500")}>
              <tab.icon className="h-5 w-5" /><span className="text-[10px] mt-1 truncate">{tab.label}</span>
            </button>
          ))}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex flex-col items-center justify-center py-2 px-1 rounded-lg text-slate-500">
            <Menu className="h-5 w-5" /><span className="text-[10px] mt-1 truncate">More</span>
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t p-4 mb-2 rounded-t-xl max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'assignments', icon: FileText, label: 'Assignments' }, { id: 'notes', icon: BookOpen, label: 'Notes' }, { id: 'calendar', icon: Calendar, label: 'Calendar' }, { id: 'analytics', icon: TrendingUp, label: 'Analytics' }, { id: 'settings', icon: Settings, label: 'Settings' }].map(tab => (
                  <button key={tab.id} onClick={() => handleTabChange(tab.id)} className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-100">
                    <tab.icon className="h-5 w-5 text-slate-600" /><span className="text-xs mt-1 truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex overflow-x-hidden">
        <StaffSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab={activeTab} setActiveTab={handleSidebarTabChange} />
        <main className={cn("flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 overflow-x-hidden", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            {(activeTab === 'exams' || activeTab === 'assignments' || activeTab === 'notes') && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6 overflow-hidden">
                <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white dark:bg-slate-800 text-sm sm:text-base" /></div>
                      <div className="flex gap-2">
                        <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto"><TabsList className="bg-slate-100 dark:bg-slate-800"><TabsTrigger value="all" className="text-xs sm:text-sm px-3">All</TabsTrigger><TabsTrigger value="recent" className="text-xs sm:text-sm px-3">Recent</TabsTrigger><TabsTrigger value="published" className="text-xs sm:text-sm px-3">Published</TabsTrigger></TabsList></Tabs>
                        <Button variant="outline" size="icon" className="shrink-0"><Filter className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 overflow-hidden">
                  <motion.div variants={itemVariants}>
                    <StaffWelcomeBanner profile={profile} stats={stats} termInfo={termInfo} />
                  </motion.div>
                  
                  {/* Staff Stats Cards */}
                  <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => router.push('/staff/calendar')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-blue-600 font-medium truncate">{termInfo.termName}</p>
                              <p className="text-xl sm:text-2xl font-bold text-blue-800 truncate">
                                Week {termInfo.currentWeek}/{termInfo.totalWeeks}
                              </p>
                              <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5 truncate">{termInfo.sessionYear}</p>
                            </div>
                            <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 shrink-0 ml-2" />
                          </div>
                          <Progress value={termInfo.weekProgress} className="h-1.5 mt-3" />
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => handleTabChange('exams')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-emerald-600 font-medium">Published Exams</p>
                              <p className="text-xl sm:text-2xl font-bold text-emerald-800">{stats.publishedExams}</p>
                              <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5">of {stats.totalExams} total</p>
                            </div>
                            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500 shrink-0 ml-2" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => handleTabChange('students')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-amber-600 font-medium">Active Students</p>
                              <p className="text-xl sm:text-2xl font-bold text-amber-800">{stats.activeStudents}</p>
                              <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5">of {stats.totalStudents} total</p>
                            </div>
                            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 shrink-0 ml-2" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => handleTabChange('exams')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-purple-600 font-medium">Pending Grading</p>
                              <p className="text-xl sm:text-2xl font-bold text-purple-800">{pendingGrading}</p>
                              <p className="text-[10px] sm:text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {pendingGrading > 0 ? 'Needs attention' : 'All caught up!'}
                              </p>
                            </div>
                            <Award className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 shrink-0 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}><QuickActions onCreateExam={() => setShowCreateExam(true)} onCreateAssignment={() => setShowCreateAssignment(true)} onUploadNote={() => setShowUploadNote(true)} /></motion.div>
                  <motion.div variants={itemVariants}>
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6 overflow-hidden">
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardHeader className="pb-2 sm:pb-3 border-b"><div className="flex items-center justify-between"><div><CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" />Recent Exams</CardTitle><CardDescription className="text-xs sm:text-sm">Your recently created exams</CardDescription></div><Button variant="ghost" size="sm" onClick={() => handleTabChange('exams')} className="text-blue-600 text-xs sm:text-sm">View All <ArrowRight className="ml-1 h-3 w-3" /></Button></div></CardHeader><CardContent className="pt-3 sm:pt-4"><ExamsList exams={exams.slice(0, 5)} onRefresh={loadDashboardData} compact /></CardContent></Card>
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardHeader className="pb-2 sm:pb-3 border-b"><div className="flex items-center justify-between"><div><CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" />Recent Assignments</CardTitle><CardDescription className="text-xs sm:text-sm">Your recently created assignments</CardDescription></div><Button variant="ghost" size="sm" onClick={() => handleTabChange('assignments')} className="text-emerald-600 text-xs sm:text-sm">View All <ArrowRight className="ml-1 h-3 w-3" /></Button></div></CardHeader><CardContent className="pt-3 sm:pt-4"><AssignmentsList assignments={assignments.slice(0, 3)} onRefresh={loadDashboardData} compact /></CardContent></Card>
                      </div>
                      <div className="space-y-4 sm:space-y-6 overflow-hidden">
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative"><div className="absolute top-0 right-0 opacity-10"><TrendingUp className="h-32 w-32 -mr-8 -mt-8" /></div><CardHeader className="pb-2"><CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg"><Sparkles className="h-5 w-5" />Quick Insights</CardTitle><CardDescription className="text-blue-100 text-xs sm:text-sm">Your teaching impact at a glance</CardDescription></CardHeader><CardContent className="space-y-3 sm:space-y-4"><div className="flex items-center justify-between p-3 bg-white/10 rounded-xl"><div className="flex items-center gap-3"><Users className="h-5 w-5" /><span className="text-sm sm:text-base">Active Students</span></div><span className="text-xl sm:text-2xl font-bold">{stats.activeStudents}</span></div><div className="flex items-center justify-between p-3 bg-white/10 rounded-xl"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5" /><span className="text-sm sm:text-base">Published Exams</span></div><span className="text-xl sm:text-2xl font-bold">{stats.publishedExams}</span></div><div className="flex items-center justify-between p-3 bg-white/10 rounded-xl"><div className="flex items-center gap-3"><Award className="h-5 w-5" /><span className="text-sm sm:text-base">Avg. Score</span></div><span className="text-xl sm:text-2xl font-bold">{stats.averageScore}%</span></div></CardContent></Card>
                        <StudentRoster students={students.slice(0, 6)} onViewAll={handleViewAllStudents} />
                        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardHeader className="pb-2 sm:pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-base sm:text-lg font-semibold">Recent Notes</CardTitle><CardDescription className="text-xs sm:text-sm">Study materials</CardDescription></div><Button variant="ghost" size="sm" onClick={() => handleTabChange('notes')} className="text-xs sm:text-sm">View All</Button></div></CardHeader><CardContent><NotesList notes={notes.slice(0, 3)} onRefresh={loadDashboardData} compact /></CardContent></Card>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">My Exams</h1><p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Create and manage CBT and theory exams</p></div><Button onClick={() => setShowCreateExam(true)} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full sm:w-auto"><Plus className="mr-2 h-5 w-5" />Create New Exam</Button></div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardContent className="p-4 sm:p-6"><ExamsList exams={filteredExams} onRefresh={loadDashboardData} /></CardContent></Card>
                </motion.div>
              )}

              {activeTab === 'assignments' && (
                <motion.div key="assignments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Assignments</h1><p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Create and manage student assignments</p></div><Button onClick={() => setShowCreateAssignment(true)} size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white w-full sm:w-auto"><Plus className="mr-2 h-5 w-5" />Create Assignment</Button></div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardContent className="p-4 sm:p-6"><AssignmentsList assignments={filteredAssignments} onRefresh={loadDashboardData} /></CardContent></Card>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Study Notes</h1><p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Upload and manage study materials</p></div><Button onClick={() => setShowUploadNote(true)} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-full sm:w-auto"><Plus className="mr-2 h-5 w-5" />Upload Note</Button></div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardContent className="p-4 sm:p-6"><NotesList notes={filteredNotes} onRefresh={loadDashboardData} /></CardContent></Card>
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Student Roster</h1><p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">View and manage all students</p></div><Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto"><Download className="h-5 w-5" />Export Roster</Button></div>
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"><CardContent className="p-4 sm:p-6"><StudentRoster students={students} fullView /></CardContent></Card>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Briefcase className="h-12 w-12 text-blue-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Staff Dashboard...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-blue-400"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    }>
      <StaffDashboardContent />
    </Suspense>
  )
}