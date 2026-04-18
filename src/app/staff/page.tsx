/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/staff/page.tsx - PROFESSIONAL RESTRUCTURED LAYOUT (WITHOUT SET D STATS CARDS)
'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { StaffWelcomeBanner } from '@/components/staff/StaffWelcomeBanner'
import { ExamsList } from '@/components/staff/ExamsList'
import { AssignmentsList } from '@/components/staff/AssignmentsList'
import { NotesList } from '@/components/staff/NotesList'
import { StudentRoster } from '@/components/staff/StudentRoster'
import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { UploadAssignmentDialog } from '@/components/staff/UploadAssignmentDialog'
import { UploadNoteDialog } from '@/components/staff/UploadNoteDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Plus, Calendar, Clock, Search, BookOpen, Users, FileText, 
  Download, Loader2, LayoutDashboard, MonitorPlay, Menu,
  GraduationCap, Briefcase, FileCheck, ChevronRight, Upload,
  Home, Bell, Award, TrendingUp, AlertCircle, ArrowRight,
  PenTool, Sparkles, FilePlus, Eye, CheckCircle2, XCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ============================================
// INTERFACES
// ============================================
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
  submissions_count?: number
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

interface ReportCardStats {
  pending: number
  approved: number
  published: number
  rejected: number
  total: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================
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

function getInitials(name: string): string {
  if (!name) return 'ST'
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

// ============================================
// MAIN COMPONENT
// ============================================
function StaffDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  const [showCreateExam, setShowCreateExam] = useState(false)
  const [showUploadAssignment, setShowUploadAssignment] = useState(false)
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
  
  const [reportCardStats, setReportCardStats] = useState<ReportCardStats>({
    pending: 0, approved: 0, published: 0, rejected: 0, total: 0
  })

  // ============================================
  // LOAD FUNCTIONS
  // ============================================
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

  const loadReportCardStats = useCallback(async () => {
    if (!profile?.id) return
    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('status')
        .eq('teacher_id', profile.id)
      if (!error && data) {
        setReportCardStats({
          pending: data.filter(r => r.status === 'pending').length,
          approved: data.filter(r => r.status === 'approved').length,
          published: data.filter(r => r.status === 'published').length,
          rejected: data.filter(r => r.status === 'rejected').length,
          total: data.length
        })
      }
    } catch (error) {
      console.error('Error loading report card stats:', error)
    }
  }, [profile?.id])

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

      const [
        { data: examsData }, 
        { data: assignmentsData }, 
        { data: notesData }, 
        { data: studentsData }, 
        { data: pendingGradingData }
      ] = await Promise.all([
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
      
      await loadReportCardStats()
    } catch (error) { 
      toast.error('Failed to load dashboard') 
    } finally { 
      setLoading(false) 
    }
  }, [loadTermSettings, loadReportCardStats])

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
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
      } catch (err) { 
        if (isMounted) setAuthChecking(false) 
      }
    }
    checkAuth()
    return () => { isMounted = false }
  }, [])

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('staff-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `status=eq.submitted` },
        () => loadDashboardData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'report_cards', filter: `teacher_id=eq.${profile.id}` },
        () => loadReportCardStats())
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [profile?.id, loadDashboardData, loadReportCardStats])

  useEffect(() => { 
    if (!authChecking) loadDashboardData() 
  }, [loadDashboardData, authChecking])

  // ============================================
  // HANDLERS
  // ============================================
  const handleTabChange = (tab: string) => { 
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }
  
  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab)
    switch (tab) {
      case 'overview': router.push('/staff'); break
      case 'exams': router.push('/staff/exams'); break
      case 'assignments': router.push('/staff/assignments'); break
      case 'notes': router.push('/staff/notes'); break
      case 'students': router.push('/staff/students'); break
      case 'report-cards': router.push('/staff/report-cards'); break
      default: router.push('/staff')
    }
  }

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
    setShowUploadAssignment(false)
    toast.success('Assignment published successfully!') 
  }
  
  const handleNoteUploaded = () => { 
    loadDashboardData()
    setShowUploadNote(false)
    toast.success('Study note published successfully!') 
  }
  
  const handleViewAllStudents = () => setActiveTab('students')

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ============================================
  // LOADING STATE
  // ============================================
  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-slate-600 text-base sm:text-lg font-medium"
            >
              Loading Staff Dashboard...
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg w-full">
        <div className="grid grid-cols-5 gap-1 p-2">
          <button onClick={() => handleTabChange('overview')} className={cn("flex flex-col items-center py-1.5 rounded-lg", activeTab === 'overview' && "text-blue-600 bg-blue-50")}>
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>
          <button onClick={() => handleTabChange('exams')} className={cn("flex flex-col items-center py-1.5 rounded-lg", activeTab === 'exams' && "text-blue-600 bg-blue-50")}>
            <MonitorPlay className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Exams</span>
          </button>
          <button onClick={() => handleTabChange('assignments')} className={cn("flex flex-col items-center py-1.5 rounded-lg", activeTab === 'assignments' && "text-blue-600 bg-blue-50")}>
            <FileText className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Assign</span>
          </button>
          <button onClick={() => handleTabChange('notes')} className={cn("flex flex-col items-center py-1.5 rounded-lg", activeTab === 'notes' && "text-blue-600 bg-blue-50")}>
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Notes</span>
          </button>
          <button onClick={() => handleTabChange('students')} className={cn("flex flex-col items-center py-1.5 rounded-lg", activeTab === 'students' && "text-blue-600 bg-blue-50")}>
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Students</span>
          </button>
        </div>
      </div>
      
      <div className="flex w-full overflow-x-hidden">
        <StaffSidebar 
          profile={profile} 
          onLogout={handleLogout} 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          activeTab={activeTab} 
          setActiveTab={handleSidebarTabChange} 
        />
        
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            
            <AnimatePresence mode="wait">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div key="overview" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                  
                  {/* Welcome Banner */}
                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <StaffWelcomeBanner profile={profile} stats={stats} termInfo={termInfo} />
                  </motion.div>
                  
                  {/* Stats Cards - Responsive Grid */}
                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => router.push('/staff/calendar')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-blue-600 font-medium truncate">{termInfo.termName}</p>
                              <p className="text-base sm:text-lg lg:text-xl font-bold text-blue-800">Week {termInfo.currentWeek}/{termInfo.totalWeeks}</p>
                              <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5">{termInfo.sessionYear}</p>
                            </div>
                            <Calendar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-500 opacity-70 shrink-0" />
                          </div>
                          <Progress value={termInfo.weekProgress} className="h-1.5 mt-2 sm:mt-3" />
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => handleTabChange('exams')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-emerald-600 font-medium truncate">Published Exams</p>
                              <p className="text-base sm:text-lg lg:text-xl font-bold text-emerald-800">{stats.publishedExams}</p>
                              <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5">of {stats.totalExams} total</p>
                            </div>
                            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-emerald-500 opacity-70 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => handleTabChange('students')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-amber-600 font-medium truncate">Active Students</p>
                              <p className="text-base sm:text-lg lg:text-xl font-bold text-amber-800">{stats.activeStudents}</p>
                              <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5">of {stats.totalStudents} total</p>
                            </div>
                            <Users className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-amber-500 opacity-70 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => handleTabChange('report-cards')}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-purple-600 font-medium truncate">Report Cards</p>
                              <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-800">{reportCardStats.total}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {reportCardStats.pending > 0 && <Badge className="bg-yellow-100 text-yellow-700 text-[9px] sm:text-[10px] px-1.5">{reportCardStats.pending} Pending</Badge>}
                                {reportCardStats.published > 0 && <Badge className="bg-green-100 text-green-700 text-[9px] sm:text-[10px] px-1.5">{reportCardStats.published} Published</Badge>}
                              </div>
                            </div>
                            <FileCheck className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-purple-500 opacity-70 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>

                  {/* Quick Actions - Better Structured */}
                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          Quick Actions
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Create and publish content for your students</CardDescription>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          <Button 
                            onClick={() => setShowCreateExam(true)} 
                            variant="outline"
                            className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 group"
                          >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <MonitorPlay className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-xs sm:text-sm">Create Exam</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-500">CBT or Theory</p>
                            </div>
                          </Button>
                          
                          <Button 
                            onClick={() => setShowUploadAssignment(true)} 
                            variant="outline"
                            className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 group"
                          >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-xs sm:text-sm">Assignment</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-500">Upload work</p>
                            </div>
                          </Button>
                          
                          <Button 
                            onClick={() => setShowUploadNote(true)} 
                            variant="outline"
                            className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 group"
                          >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-xs sm:text-sm">Study Note</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-500">Upload material</p>
                            </div>
                          </Button>
                          
                          <Button 
                            onClick={() => handleTabChange('students')}
                            variant="outline"
                            className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-300 group"
                          >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-xs sm:text-sm">Students</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-500">View roster</p>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Pending Tasks Alert */}
                  {pendingGrading > 0 && (
                    <motion.div variants={itemVariants} className="w-full overflow-hidden">
                      <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500 overflow-hidden">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm sm:text-base font-medium text-amber-800">Pending Grading Tasks</p>
                                <p className="text-xs sm:text-sm text-amber-600">You have {pendingGrading} exam submissions waiting.</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => router.push('/staff/grading')} className="bg-amber-600 hover:bg-amber-700 text-white h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
                              Grade Now <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Main Content Grid */}
                  <motion.div variants={itemVariants} className="w-full overflow-hidden">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                      
                      {/* Left Column - Exams & Assignments */}
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full overflow-hidden">
                        {/* Recent Exams */}
                        <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                          <CardHeader className="pb-2 sm:pb-3 border-b px-4 sm:px-5">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                                Recent Exams
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('exams')} className="text-xs sm:text-sm">
                                View All <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-5">
                            <ExamsList exams={exams.slice(0, 5)} onRefresh={loadDashboardData} compact />
                          </CardContent>
                        </Card>
                        
                        {/* Recent Assignments */}
                        <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                          <CardHeader className="pb-2 sm:pb-3 border-b px-4 sm:px-5">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                                Recent Assignments
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('assignments')} className="text-xs sm:text-sm">
                                View All <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-5">
                            <AssignmentsList assignments={assignments.slice(0, 3)} onRefresh={loadDashboardData} compact />
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Right Column - Notes & Student Roster */}
                      <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                        {/* Recent Notes */}
                        <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                          <CardHeader className="pb-2 sm:pb-3 border-b px-4 sm:px-5">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                                Recent Notes
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => handleTabChange('notes')} className="text-xs sm:text-sm">
                                View All <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-5">
                            <NotesList notes={notes.slice(0, 3)} onRefresh={loadDashboardData} compact />
                          </CardContent>
                        </Card>
                        
                        {/* Student Roster Preview - Better Structured */}
                        <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                          <CardHeader className="pb-2 sm:pb-3 border-b px-4 sm:px-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
                                  Student Roster
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-0.5">
                                  {students.length} students enrolled
                                </CardDescription>
                              </div>
                              <Button variant="ghost" size="sm" onClick={handleViewAllStudents} className="text-xs sm:text-sm">
                                View All <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3 sm:pt-4 px-0">
                            <StudentRoster students={students.slice(0, 5)} onViewAll={handleViewAllStudents} />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* EXAMS TAB */}
              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Exams</h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Create and manage CBT and theory exams</p>
                    </div>
                    <Button onClick={() => setShowCreateExam(true)} size="sm" className="bg-blue-600 text-white h-9 sm:h-10 w-full sm:w-auto">
                      <Plus className="mr-1.5 h-4 w-4" />Create New Exam
                    </Button>
                  </div>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search exams..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <ExamsList exams={filteredExams} onRefresh={loadDashboardData} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ASSIGNMENTS TAB */}
              {activeTab === 'assignments' && (
                <motion.div key="assignments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Assignments</h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Create and manage student assignments</p>
                    </div>
                    <Button onClick={() => setShowUploadAssignment(true)} size="sm" className="bg-emerald-600 text-white h-9 sm:h-10 w-full sm:w-auto">
                      <Upload className="mr-1.5 h-4 w-4" />Upload Assignment
                    </Button>
                  </div>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search assignments..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <AssignmentsList assignments={filteredAssignments} onRefresh={loadDashboardData} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Study Notes</h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Upload and manage study materials</p>
                    </div>
                    <Button onClick={() => setShowUploadNote(true)} size="sm" className="bg-purple-600 text-white h-9 sm:h-10 w-full sm:w-auto">
                      <BookOpen className="mr-1.5 h-4 w-4" />Upload Note
                    </Button>
                  </div>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search notes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <NotesList notes={filteredNotes} onRefresh={loadDashboardData} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* STUDENTS TAB */}
              {activeTab === 'students' && (
                <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Student Roster</h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">View and manage all students</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-9 sm:h-10 w-full sm:w-auto">
                      <Download className="mr-1.5 h-4 w-4" />Export Roster
                    </Button>
                  </div>
                  
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <StudentRoster students={students} fullView />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* REPORT CARDS TAB */}
              {activeTab === 'report-cards' && (
                <motion.div key="report-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Report Cards</h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Track the status of submitted report cards</p>
                    </div>
                    <Button onClick={() => router.push('/staff/students')} size="sm" className="h-9 sm:h-10 w-full sm:w-auto">
                      <Users className="mr-1.5 h-4 w-4" />View All Students
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    <Card className="border-0 shadow-sm bg-yellow-50 overflow-hidden">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-700">{reportCardStats.pending}</p>
                        <p className="text-[10px] sm:text-xs text-yellow-600">Pending Approval</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-blue-50 overflow-hidden">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">{reportCardStats.approved}</p>
                        <p className="text-[10px] sm:text-xs text-blue-600">Approved</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-green-50 overflow-hidden">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700">{reportCardStats.published}</p>
                        <p className="text-[10px] sm:text-xs text-green-600">Published</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-red-50 overflow-hidden">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700">{reportCardStats.rejected}</p>
                        <p className="text-[10px] sm:text-xs text-red-600">Rejected</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardContent className="text-center py-12 sm:py-16">
                      <FileCheck className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Report Card Management</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
                        Go to a student's profile to enter CA scores and submit report cards for approval.
                      </p>
                      <Button className="mt-4 bg-purple-600 h-9 sm:h-10 text-sm" onClick={() => router.push('/staff/students')}>
                        <Users className="mr-1.5 h-4 w-4" />Go to Student Roster
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* DIALOGS */}
      <CreateExamDialog 
        open={showCreateExam} 
        onOpenChange={setShowCreateExam} 
        onSuccess={handleExamCreated} 
        teacherProfile={profile} 
      />
      
      <UploadAssignmentDialog 
        open={showUploadAssignment} 
        onOpenChange={setShowUploadAssignment} 
        onSuccess={handleAssignmentCreated} 
        teacherProfile={profile} 
      />
      
      <UploadNoteDialog 
        open={showUploadNote} 
        onOpenChange={setShowUploadNote} 
        onSuccess={handleNoteUploaded} 
        teacherProfile={profile} 
      />
    </div>
  )
}

export default function StaffDashboard() {
  return (
   <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Briefcase className="h-12 w-12 text-blue-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Staff Dashboard...</p>
          <p className="mt-2 text-slate-500 text-sm">Preparing your teaching space ✨</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="h-2 w-2 rounded-full bg-blue-400" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <StaffDashboardContent />
    </Suspense>
  )
}