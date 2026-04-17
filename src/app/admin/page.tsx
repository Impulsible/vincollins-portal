/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/page.tsx - RESTRUCTURED WITH PROFESSIONAL STYLE
'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { WelcomeBanner } from '@/components/admin/dashboard/WelcomeBanner'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { QuickActions } from '@/components/admin/dashboard/QuickActions'
import { RecentActivityFeed } from '@/components/admin/dashboard/RecentActivityFeed'
import { TopPerformersCard } from '@/components/admin/dashboard/TopPerformersCard'
import { UpcomingScheduleCard } from '@/components/admin/dashboard/UpcomingScheduleCard'
import { AttendanceLeaderboard } from '@/components/admin/attendance/AttendanceLeaderboard'
import { CBTStatus } from '@/components/admin/dashboard/CBTStatus'
import { StudentManagement } from '@/components/admin/students/StudentManagement'
import { StaffManagement } from '@/components/admin/staff/StaffManagement'
import { CbtMonitor } from '@/components/admin/monitoring/CbtMonitor'
import { ReportCardApproval } from '@/components/admin/report-cards/ReportCardApproval'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, GraduationCap, AlertCircle, Shield, Sparkles,
  Plus, Search, Filter, ArrowRight, BookOpen, Users, 
  FileText, Award, Download, LayoutDashboard, MonitorPlay,
  User, Menu, Settings, TrendingUp, Calendar, Clock, Briefcase,
  FileCheck, CheckCircle2, ChevronRight, BarChart3, School
} from 'lucide-react'

// ========== TYPES ==========
interface Student {
  id: string
  vin_id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  class: string
  department: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  photo_url?: string
  admission_year?: number
  phone?: string
  address?: string
}

interface Staff {
  id: string
  vin_id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  department: string
  phone: string
  address: string
  is_active: boolean
  photo_url?: string
  password_changed: boolean
  created_at: string
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions: number
  total_points: number
  created_at: string
  published_at: string | null
}

interface AdminProfile {
  id: string
  full_name: string
  email: string
  role: string
  photo_url?: string
}

// ========== CACHE CONFIGURATION ==========
const CACHE_KEYS = {
  STUDENTS: 'admin_students_cache',
  STAFF: 'admin_staff_cache',
  EXAMS: 'admin_exams_cache',
  STATS: 'admin_stats_cache',
  TIMESTAMP: 'admin_cache_timestamp'
}

const CACHE_DURATION = 5 * 60 * 1000

const formatProfileForHeader = (profile: AdminProfile | null) => {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Administrator',
    email: profile.email,
    role: profile.role === 'staff' ? 'teacher' as const : 'admin' as const,
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

// ========== MAIN COMPONENT ==========
function AdminDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const isInitialLoad = useRef(true)
  const dataLoadedRef = useRef(false)
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    activeExams: 0,
    pendingSubmissions: 0,
    passRate: 78,
    attendanceRate: 94,
  })

  // ========== AUTH CHECK ==========
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          toast.error('Please log in to continue')
          router.push('/portal')
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, email, photo_url')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profileData) {
          toast.error('Account not found')
          router.push('/portal')
          return
        }

        const role = profileData.role?.toLowerCase()
        if (role !== 'admin' && role !== 'staff') {
          toast.error('Access denied. Admin only.')
          router.push('/portal')
          return
        }

        const rawFullName = profileData.full_name || session.user.email?.split('@')[0] || 'Administrator'
        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: formatFullName(rawFullName),
          role: role,
          photo_url: profileData.photo_url
        })

        setAuthChecking(false)
      } catch (err) {
        console.error('Auth check error:', err)
        toast.error('Authentication error')
        router.push('/portal')
      }
    }

    checkAuth()
  }, [router])

  // ========== HELPER FUNCTIONS ==========
  const isCacheValid = useCallback(() => {
    if (typeof window === 'undefined') return false
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP)
    if (!timestamp) return false
    return Date.now() - parseInt(timestamp) < CACHE_DURATION
  }, [])

  const loadFromCache = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    try {
      const cachedStudents = localStorage.getItem(CACHE_KEYS.STUDENTS)
      const cachedStaff = localStorage.getItem(CACHE_KEYS.STAFF)
      const cachedExams = localStorage.getItem(CACHE_KEYS.EXAMS)
      const cachedStats = localStorage.getItem(CACHE_KEYS.STATS)
      
      if (cachedStudents && cachedStaff && cachedStats && isCacheValid()) {
        setStudents(JSON.parse(cachedStudents))
        setStaff(JSON.parse(cachedStaff))
        if (cachedExams) setExams(JSON.parse(cachedExams))
        setStats(JSON.parse(cachedStats))
        return true
      }
    } catch (error) {
      console.error('Error loading from cache:', error)
    }
    return false
  }, [isCacheValid])

  const saveToCache = useCallback((studentsData: Student[], staffData: Staff[], examsData: Exam[], statsData: any) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(studentsData))
      localStorage.setItem(CACHE_KEYS.STAFF, JSON.stringify(staffData))
      localStorage.setItem(CACHE_KEYS.EXAMS, JSON.stringify(examsData))
      localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(statsData))
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString())
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }, [])

  const getNameFromEmail = (email: string): string => {
    if (!email) return 'Unknown'
    const namePart = email.split('@')[0]
    return namePart
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // ========== LOAD ALL DATA ==========
  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh && isInitialLoad.current && loadFromCache()) {
        setLoading(false)
        isInitialLoad.current = false
        setTimeout(() => loadAllData(true), 100)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      let studentsList: Student[] = []
      let staffList: Staff[] = []
      
      const { data: profiles } = await supabase.from('profiles').select('*')

      if (profiles) {
        const profileStudents = profiles.filter(p => p.role === 'student')
        const profileStaff = profiles.filter(p => p.role === 'staff')
        
        studentsList = profileStudents.map((profile: any) => ({
          id: profile.id,
          vin_id: profile.vin_id || 'VIN-MISSING',
          email: profile.email,
          full_name: profile.full_name || getNameFromEmail(profile.email),
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          class: profile.class || 'Not Assigned',
          department: profile.department || 'General',
          is_active: profile.is_active ?? true,
          password_changed: profile.password_changed || false,
          created_at: profile.created_at || new Date().toISOString(),
          photo_url: profile.photo_url || null,
          admission_year: profile.admission_year || null,
          phone: profile.phone || '',
          address: profile.address || ''
        }))
        
        staffList = profileStaff.map((profile: any) => ({
          id: profile.id,
          vin_id: profile.vin_id || 'VIN-MISSING',
          email: profile.email,
          full_name: profile.full_name || getNameFromEmail(profile.email),
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          department: profile.department || 'General',
          phone: profile.phone || '',
          address: profile.address || '',
          is_active: profile.is_active ?? true,
          photo_url: profile.photo_url || null,
          password_changed: profile.password_changed || false,
          created_at: profile.created_at || new Date().toISOString()
        }))
      }
      
      setStudents(studentsList)
      setStaff(staffList)

      let examsList: Exam[] = []
      let activeExamsCount = 0
      
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      if (examsData) {
        examsList = examsData.map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          class: exam.class,
          duration: exam.duration,
          status: exam.status,
          total_questions: exam.total_questions || 0,
          total_points: exam.total_points || 0,
          created_at: exam.created_at,
          published_at: exam.published_at
        }))
        activeExamsCount = examsData.filter((e: any) => e.status === 'published').length
        setExams(examsList)
      }

      const newStats = {
        totalStudents: studentsList.length,
        totalStaff: staffList.length,
        activeExams: activeExamsCount,
        pendingSubmissions: 0,
        passRate: 78,
        attendanceRate: 94,
      }
      
      setStats(newStats)
      saveToCache(studentsList, staffList, examsList, newStats)

    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
      isInitialLoad.current = false
      dataLoadedRef.current = true
    }
  }, [loadFromCache, saveToCache, router])

  useEffect(() => {
    if (!authChecking) {
      loadAllData(false)
    }
    
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadAllData(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
    }
  }, [loadAllData, authChecking])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadAllData(true)
    toast.success('Data refreshed')
  }, [loadAllData])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key))
    }
    router.push('/portal')
  }, [router])

  // ========== API CALL HANDLERS ==========
  const handleAddStudentAPI = async (studentData: any): Promise<{ email: string; password: string; vin_id: string } | void> => {
    const response = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...studentData,
        role: 'student'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create student')
    }
    
    const result = await response.json()
    await loadAllData(true)
    return result
  }

  const handleUpdateStudentAPI = async (updatedStudent: Student): Promise<void> => {
    await supabase.from('profiles').update({
      full_name: updatedStudent.full_name,
      class: updatedStudent.class,
      department: updatedStudent.department,
      is_active: updatedStudent.is_active,
      admission_year: updatedStudent.admission_year,
      phone: updatedStudent.phone,
      address: updatedStudent.address,
      updated_at: new Date().toISOString()
    }).eq('id', updatedStudent.id)
    
    await loadAllData(true)
  }

  const handleDeleteStudentAPI = async (student: Student): Promise<void> => {
    await supabase.from('profiles').delete().eq('id', student.id)
    await loadAllData(true)
  }

  const handleResetStudentPasswordAPI = async (student: Student): Promise<void> => {
    // Password reset is handled in the component
    await loadAllData(true)
  }

  const handleAddStaffAPI = async (staffData: any): Promise<{ email: string; password: string; vin_id: string } | void> => {
    const response = await fetch('/api/admin/staff/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...staffData,
        role: 'staff'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create staff')
    }
    
    const result = await response.json()
    await loadAllData(true)
    return result
  }

  const handleUpdateStaffAPI = async (updatedStaff: Staff): Promise<void> => {
    await supabase.from('profiles').update({
      full_name: updatedStaff.full_name,
      department: updatedStaff.department,
      phone: updatedStaff.phone,
      address: updatedStaff.address,
      is_active: updatedStaff.is_active,
      updated_at: new Date().toISOString()
    }).eq('id', updatedStaff.id)
    
    await loadAllData(true)
  }

  const handleDeleteStaffAPI = async (staffMember: Staff): Promise<void> => {
    await supabase.from('profiles').delete().eq('id', staffMember.id)
    await loadAllData(true)
  }

  const handleResetStaffPasswordAPI = async (staffMember: Staff): Promise<void> => {
    // Password reset is handled in the component
    await loadAllData(true)
  }

  const handlePublishExam = useCallback(async (examId: string) => {
    try {
      await supabase.from('exams').update({ 
        status: 'published', published_at: new Date().toISOString() 
      }).eq('id', examId)
      
      toast.success('Exam published successfully')
      await loadAllData(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish exam')
    }
  }, [loadAllData])

  const handleStudentClick = useCallback(() => setActiveTab('students'), [])
  const handleStaffClick = useCallback(() => setActiveTab('staff'), [])
  const handleExamsClick = useCallback(() => setActiveTab('exams'), [])
  const handleSubmissionsClick = useCallback(() => setActiveTab('submissions'), [])
  const handleResultsClick = useCallback(() => setActiveTab('results'), [])
  const handleAttendanceClick = useCallback(() => setActiveTab('attendance'), [])

  // ========== LOADING STATE ==========
  if (authChecking || (loading && !dataLoadedRef.current)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Shield className="h-16 w-16 text-purple-600 mx-auto" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-slate-600 dark:text-slate-300 text-lg font-medium"
            >
              Loading Admin Dashboard...
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-2 text-slate-500 dark:text-slate-400 text-sm"
            >
              Preparing your administrative space <Sparkles className="h-4 w-4 inline text-amber-500" />
            </motion.p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-purple-400"
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

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      {/* Mobile Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe w-full overflow-x-hidden">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Home' },
            { id: 'students', icon: Users, label: 'Students' },
            { id: 'staff', icon: Briefcase, label: 'Staff' },
            { id: 'exams', icon: MonitorPlay, label: 'Exams' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg",
                activeTab === tab.id ? "text-purple-600 bg-purple-50" : "text-slate-500"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 truncate">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg text-slate-500"
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
              className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t p-4 mb-2 rounded-t-xl max-h-[60vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'report-cards', icon: FileCheck, label: 'Report Cards' },
                  { id: 'cbt-monitor', icon: BarChart3, label: 'CBT Monitor' },
                  { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-100"
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
      
      <div className="flex overflow-x-hidden">
        <AdminSidebar
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
        
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            
            {/* Search Bar for list views */}
            {(activeTab === 'students' || activeTab === 'staff' || activeTab === 'exams') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 overflow-hidden"
              >
                <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder={`Search ${activeTab}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-white dark:bg-slate-800 text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto">
                          <TabsList className="bg-slate-100 dark:bg-slate-800">
                            <TabsTrigger value="all" className="text-xs sm:text-sm px-3">All</TabsTrigger>
                            <TabsTrigger value="recent" className="text-xs sm:text-sm px-3">Recent</TabsTrigger>
                            <TabsTrigger value="active" className="text-xs sm:text-sm px-3">Active</TabsTrigger>
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
                  className="space-y-4 sm:space-y-6 overflow-hidden"
                >
                  <motion.div variants={itemVariants}>
                    <WelcomeBanner adminProfile={profile} activeTab={activeTab} />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <StatsCards
                      stats={stats}
                      onStudentClick={handleStudentClick}
                      onStaffClick={handleStaffClick}
                      onExamsClick={handleExamsClick}
                      onSubmissionsClick={handleSubmissionsClick}
                      onResultsClick={handleResultsClick}
                      onAttendanceClick={handleAttendanceClick}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <QuickActions
                      onStudentClick={handleStudentClick}
                      onStaffClick={handleStaffClick}
                      onExamsClick={handleExamsClick}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6 overflow-hidden">
                        <AttendanceLeaderboard students={students} />
                        <RecentActivityFeed />
                      </div>
                      <div className="space-y-4 sm:space-y-6 overflow-hidden">
                        <CBTStatus />
                        <TopPerformersCard students={students} />
                        <UpcomingScheduleCard />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* STUDENTS TAB - WITH CORRECT PROPS */}
              {activeTab === 'students' && (
                <motion.div
                  key="students"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 overflow-hidden"
                >
                  <StudentManagement
                    students={students}
                    onRefresh={handleRefresh}
                    loading={refreshing}
                  />
                </motion.div>
              )}

              {/* STAFF TAB - WITH CORRECT PROPS */}
              {activeTab === 'staff' && (
                <motion.div
                  key="staff"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 overflow-hidden"
                >
                  <StaffManagement
                    staff={staff}
                    onAddStaff={handleAddStaffAPI}
                    onUpdateStaff={handleUpdateStaffAPI}
                    onDeleteStaff={handleDeleteStaffAPI}
                    onResetPassword={handleResetStaffPasswordAPI}
                    onRefresh={handleRefresh}
                  />
                </motion.div>
              )}

              {/* EXAMS TAB */}
              {activeTab === 'exams' && (
                <motion.div
                  key="exams"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Exam Management
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
                        Review and publish exams created by teachers
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab('overview')} variant="outline" className="gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Back to Dashboard
                    </Button>
                  </div>
                  
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid gap-4">
                        {exams.map((exam) => (
                          <div
                            key={exam.id}
                            className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800"
                          >
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate">{exam.title}</h3>
                              <p className="text-sm text-muted-foreground">{exam.subject} - {exam.class}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {exam.status}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {exam.total_questions} questions
                                </span>
                              </div>
                            </div>
                            {exam.status !== 'published' && (
                              <Button onClick={() => handlePublishExam(exam.id)} size="sm" className="shrink-0">
                                Publish Exam
                              </Button>
                            )}
                          </div>
                        ))}
                        {exams.length === 0 && (
                          <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-muted-foreground">No exams found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* REPORT CARDS TAB */}
              {activeTab === 'report-cards' && (
                <motion.div
                  key="report-cards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Report Card Approval
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
                        Review, approve, and publish student report cards
                      </p>
                    </div>
                  </div>
                  
                  <ReportCardApproval onRefresh={() => loadAllData(true)} />
                </motion.div>
              )}

              {/* CBT MONITOR TAB */}
              {activeTab === 'cbt-monitor' && (
                <motion.div
                  key="cbt-monitor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6 overflow-hidden"
                >
                  <CbtMonitor />
                </motion.div>
              )}

              {/* FALLBACK FOR OTHER TABS */}
              {!['overview', 'students', 'staff', 'exams', 'report-cards', 'cbt-monitor'].includes(activeTab) && (
                <motion.div
                  className="flex flex-col items-center justify-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center space-y-4">
                    <School className="h-16 w-16 text-purple-400 mx-auto" />
                    <h2 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
                    <p className="text-muted-foreground">This section is under development.</p>
                    <Button onClick={() => setActiveTab('overview')} variant="outline">
                      Return to Dashboard
                    </Button>
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

// ========== EXPORT WITH SUSPENSE ==========
export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="h-12 w-12 text-purple-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Admin Dashboard...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-purple-400"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}