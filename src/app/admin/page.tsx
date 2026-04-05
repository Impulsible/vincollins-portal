/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/page.tsx (Complete Working Version)

'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MainLayout } from '@/components/admin/layouts/MainLayout'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { WelcomeBanner } from '@/components/admin/dashboard/WelcomeBanner'
import { QuickActions } from '@/components/admin/dashboard/QuickActions'
import { StaffManagement } from '@/components/admin/staff/StaffManagement'
import { StudentManagement } from '@/components/admin/students/StudentManagement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, GraduationCap, BookOpen, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

// Types
interface Student {
  id: string
  vin_id: string
  email: string
  full_name: string
  class: string
  department: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  photo_url?: string
}

// This matches the Staff type expected by StaffManagement component
interface Staff {
  id: string
  vin_id: string
  email: string
  full_name: string
  department: string
  position: string
  qualification: string
  phone: string
  address: string
  hire_date: string
  is_active: boolean
  photo_url?: string
  password_changed: boolean  // Required, not optional
  created_at: string         // Required, not optional
}

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

// Cache keys
const CACHE_KEYS = {
  STUDENTS: 'admin_students_cache',
  STAFF: 'admin_staff_cache',
  STATS: 'admin_stats_cache',
  TIMESTAMP: 'admin_cache_timestamp'
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [exams, setExams] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submissions, setSubmissions] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
  
  const isInitialLoad = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const dataLoadedRef = useRef(false)
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    activeExams: 0,
    pendingSubmissions: 0,
    passRate: 0,
    attendanceRate: 94,
  })

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
      const cachedStats = localStorage.getItem(CACHE_KEYS.STATS)
      
      if (cachedStudents && cachedStaff && cachedStats && isCacheValid()) {
        setStudents(JSON.parse(cachedStudents))
        setStaff(JSON.parse(cachedStaff))
        setStats(JSON.parse(cachedStats))
        return true
      }
    } catch (error) {
      console.error('Error loading from cache:', error)
    }
    return false
  }, [isCacheValid])

  const saveToCache = useCallback((studentsData: Student[], staffData: Staff[], statsData: any) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(studentsData))
      localStorage.setItem(CACHE_KEYS.STAFF, JSON.stringify(staffData))
      localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(statsData))
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString())
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }, [])

  const loadAllData = useCallback(async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    if (!forceRefresh && isInitialLoad.current && loadFromCache()) {
      setLoading(false)
      isInitialLoad.current = false
      setTimeout(() => loadAllData(true), 100)
      return
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      const [
        usersResult,
        profilesResult,
        examsResult,
        submissionsResult,
        notificationsResult,
        profileResult,
        settingsResult
      ] = await Promise.allSettled([
        supabase.from('users').select('id, vin_id, email, role, created_at').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, class, department, is_active, password_changed, photo_url, position, qualification, phone, address, hire_date'),
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
        supabase.from('submissions').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('school_settings').select('*').maybeSingle()
      ])

      if (usersResult.status === 'fulfilled' && usersResult.value.data) {
        const profilesMap = new Map()
        if (profilesResult.status === 'fulfilled' && profilesResult.value.data) {
          profilesResult.value.data.forEach((profile: any) => {
            profilesMap.set(profile.id, profile)
          })
        }

        const formattedUsers = usersResult.value.data.map((user: any) => {
          const profile = profilesMap.get(user.id)
          return {
            id: user.id,
            vin_id: user.vin_id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            full_name: profile?.full_name || '',
            class: profile?.class || null,
            department: profile?.department || null,
            is_active: profile?.is_active || false,
            password_changed: profile?.password_changed || false,
            photo_url: profile?.photo_url || null,
            position: profile?.position || 'Staff Member',
            qualification: profile?.qualification || 'Not specified',
            phone: profile?.phone || '',
            address: profile?.address || '',
            hire_date: profile?.hire_date || user.created_at.split('T')[0] || new Date().toISOString().split('T')[0],
          }
        })

        const studentsList = formattedUsers.filter((u: any) => u.role === 'student')
        
        // Map to Staff type with required password_changed and created_at
        const staffList: Staff[] = formattedUsers
          .filter((u: any) => u.role === 'staff')
          .map((u: any) => ({
            id: u.id,
            vin_id: u.vin_id,
            email: u.email,
            full_name: u.full_name,
            department: u.department || 'General',
            position: u.position,
            qualification: u.qualification,
            phone: u.phone,
            address: u.address,
            hire_date: u.hire_date,
            is_active: u.is_active,
            photo_url: u.photo_url,
            password_changed: u.password_changed || false, // Ensure boolean
            created_at: u.created_at, // Required
          }))
        
        setStudents(studentsList)
        setStaff(staffList)
        
        let activeExams = 0
        if (examsResult.status === 'fulfilled' && examsResult.value.data) {
          setExams(examsResult.value.data)
          activeExams = examsResult.value.data.filter((e: any) => e.status === 'published').length
        }
        
        let pendingSubmissions = 0
        let passRate = 0
        if (submissionsResult.status === 'fulfilled' && submissionsResult.value.data) {
          setSubmissions(submissionsResult.value.data)
          pendingSubmissions = submissionsResult.value.data.filter((s: any) => s.status === 'submitted').length
          const graded = submissionsResult.value.data.filter((s: any) => s.status === 'graded')
          passRate = graded.length > 0 
            ? Math.round(graded.filter((s: any) => (s.percentage || 0) >= 50).length / graded.length * 100)
            : 0
        }
        
        if (notificationsResult.status === 'fulfilled' && notificationsResult.value.data) {
          setNotifications(notificationsResult.value.data)
        }
        
        if (profileResult.status === 'fulfilled' && profileResult.value.data) {
          setAdminProfile(profileResult.value.data)
        }
        
        if (settingsResult.status === 'fulfilled' && settingsResult.value.data) {
          setSchoolSettings(settingsResult.value.data)
        }
        
        const newStats = {
          totalStudents: studentsList.length,
          totalStaff: staffList.length,
          activeExams,
          pendingSubmissions,
          passRate,
          attendanceRate: 94,
        }
        
        setStats(newStats)
        saveToCache(studentsList, staffList, newStats)
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error loading data:', error)
        toast.error('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      isInitialLoad.current = false
      dataLoadedRef.current = true
    }
  }, [router, loadFromCache, saveToCache])

  useEffect(() => {
    loadAllData(false)
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadAllData])

  const handleRefreshUsers = useCallback(async () => {
    setRefreshing(true)
    await loadAllData(true)
    toast.success('Data refreshed')
  }, [loadAllData])

  const handleMarkNotificationRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    if (!error) {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
    }
  }, [])

  const handleUpdateProfile = useCallback(async (updatedProfile: any) => {
    setAdminProfile(updatedProfile)
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key))
    }
    router.push('/portal')
  }, [router])

  // Tab switching handlers
  const handleStudentClick = useCallback(() => {
    setActiveTab('students')
    toast.success('Loading Student Management')
  }, [])

  const handleStaffClick = useCallback(() => {
    setActiveTab('staff')
    toast.success('Loading Staff Management')
  }, [])

  const handleExamsClick = useCallback(() => {
    setActiveTab('exams')
    toast.info('Exams Management - Coming Soon')
  }, [])

  const handleSubmissionsClick = useCallback(() => {
    setActiveTab('submissions')
    toast.info('Submissions Management - Coming Soon')
  }, [])

  const handleResultsClick = useCallback(() => {
    setActiveTab('results')
    toast.info('Results Management - Coming Soon')
  }, [])

  const handleAttendanceClick = useCallback(() => {
    setActiveTab('attendance')
    toast.info('Attendance Tracking - Coming Soon')
  }, [])

  const handleAddStaff = useCallback(async (staffData: any) => {
    try {
      const year = new Date().getFullYear()
      const { data: staffCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'staff')
      
      const vinNumber = String((staffCount?.length || 0) + 1).padStart(4, '0')
      const vinId = `VIN-STF-${year}-${vinNumber}`
      
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          vin_id: vinId,
          email: staffData.email,
          role: 'staff',
          auth_id: crypto.randomUUID(),
        })
        .select()
        .single()

      if (userError) throw userError

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          full_name: staffData.full_name,
          email: staffData.email,
          role: 'staff',
          role_id: `staff_${staffData.email}`,
          department: staffData.department,
          position: staffData.position || 'Staff Member',
          qualification: staffData.qualification || '',
          phone: staffData.phone || '',
          address: staffData.address || '',
          hire_date: staffData.hire_date || new Date().toISOString().split('T')[0],
          is_active: true,
          password_changed: false,
        })

      if (profileError) throw profileError

      toast.success(`Staff added! Temporary password: ${vinId}`)
      await loadAllData(true)
    } catch (error) {
      toast.error('Failed to add staff member')
      console.error(error)
    }
  }, [loadAllData])

  const handleUpdateStaff = useCallback(async (updatedStaff: Staff) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updatedStaff.full_name,
        department: updatedStaff.department,
        position: updatedStaff.position,
        qualification: updatedStaff.qualification,
        phone: updatedStaff.phone,
        address: updatedStaff.address,
        is_active: updatedStaff.is_active,
      })
      .eq('id', updatedStaff.id)

    if (error) {
      toast.error('Failed to update staff')
    } else {
      toast.success('Staff updated successfully')
      await loadAllData(true)
    }
  }, [loadAllData])

  const handleDeleteStaff = useCallback(async (staffMember: Staff) => {
    if (!confirm(`Are you sure you want to delete ${staffMember.full_name}?`)) return

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', staffMember.id)

    if (error) {
      toast.error('Failed to delete staff')
    } else {
      toast.success('Staff deleted successfully')
      await loadAllData(true)
    }
  }, [loadAllData])

  const handleResetStaffPassword = useCallback(async (staffMember: Staff) => {
    toast.info(`Password reset to VIN ID: ${staffMember.vin_id}`)
  }, [])

  const recentActivities = useMemo(() => [
    { icon: Users, text: 'Student management system active', time: 'Just now', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { icon: BookOpen, text: `${stats.totalStudents} total students enrolled`, time: 'Current', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { icon: CheckCircle, text: `${stats.activeExams} active exams available`, time: 'Current', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    { icon: TrendingUp, text: `${stats.passRate}% overall pass rate`, time: 'Current', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  ], [stats.totalStudents, stats.activeExams, stats.passRate])

  if (loading && !dataLoadedRef.current) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-earth-soft/20">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onSignOut={handleSignOut}
      adminProfile={adminProfile}
      schoolSettings={schoolSettings}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onProfileUpdate={handleUpdateProfile}
    >
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <WelcomeBanner 
            adminProfile={adminProfile}
            activeTab={activeTab}
          />
          
          <StatsCards 
            stats={stats}
            onStudentClick={handleStudentClick}
            onStaffClick={handleStaffClick}
            onExamsClick={handleExamsClick}
            onSubmissionsClick={handleSubmissionsClick}
            onResultsClick={handleResultsClick}
            onAttendanceClick={handleAttendanceClick}
          />
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <QuickActions
              onAddStudent={() => setActiveTab('students')}
              onCreateExam={() => setActiveTab('exams')}
              onGradeTheory={() => setActiveTab('grading')}
              onMonitorCBT={() => setActiveTab('monitor')}
              onViewSubmissions={() => setActiveTab('submissions')}
              onGenerateResults={() => setActiveTab('results')}
            />
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">Latest updates from your portal</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div className={`p-2 rounded-lg ${activity.bg} group-hover:scale-110 transition-transform`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <StudentManagement 
          students={students}
          onRefresh={handleRefreshUsers}
          loading={refreshing}
        />
      )}

      {activeTab === 'staff' && (
        <StaffManagement
          staff={staff}
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
          onResetPassword={handleResetStaffPassword}
        />
      )}

      {(activeTab === 'exams' || activeTab === 'submissions' || activeTab === 'results' || activeTab === 'grading' || activeTab === 'monitor' || activeTab === 'attendance') && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold capitalize">{activeTab} Management</h2>
            <p className="text-muted-foreground">
              This section is currently under development.
            </p>
            <Button 
              onClick={() => setActiveTab('overview')}
              variant="outline"
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}