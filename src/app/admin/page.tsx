/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MainLayout } from '@/components/admin/layouts/MainLayout'
import { StudentManagement } from '@/components/admin/students/StudentManagement'
import { StaffManagement } from '@/components/admin/staff/StaffManagement'
import { CbtMonitor } from '@/components/admin/monitoring/CbtMonitor'
import { WelcomeBanner } from '@/components/admin/dashboard/WelcomeBanner'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { QuickActions } from '@/components/admin/dashboard/QuickActions'
import { RecentActivityFeed } from '@/components/admin/dashboard/RecentActivityFeed'
import { TopPerformersCard } from '@/components/admin/dashboard/TopPerformersCard'
import { UpcomingScheduleCard } from '@/components/admin/dashboard/UpcomingScheduleCard'
import { AttendanceLeaderboard } from '@/components/admin/attendance/AttendanceLeaderboard'
import { CBTStatus } from '@/components/admin/dashboard/CBTStatus'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, GraduationCap, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ========== TYPES ==========
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
  admission_year?: number
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

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
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

// ========== CACHE CONFIGURATION ==========
const CACHE_KEYS = {
  STUDENTS: 'admin_students_cache',
  STAFF: 'admin_staff_cache',
  EXAMS: 'admin_exams_cache',
  STATS: 'admin_stats_cache',
  TIMESTAMP: 'admin_cache_timestamp'
}

const CACHE_DURATION = 5 * 60 * 1000

// ========== MAIN COMPONENT ==========
export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
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

  // ========== AUTH CHECK - REDIRECT IF NOT AUTHENTICATED OR NOT ADMIN ==========
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log('No active session, redirecting to portal')
          toast.error('Please log in to continue')
          router.push('/portal')
          return
        }

        // Check if user is admin or staff (staff can also access admin features)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profile) {
          console.log('Profile not found, redirecting to portal')
          toast.error('Account not found')
          router.push('/portal')
          return
        }

        const role = profile.role?.toLowerCase()
        if (role !== 'admin' && role !== 'staff') {
          console.log('Not an admin/staff, redirecting to portal')
          toast.error('Access denied. Admin only.')
          router.push('/portal')
          return
        }

        // Set admin profile
        setAdminProfile({
          id: session.user.id,
          email: session.user.email,
          full_name: profile.full_name || session.user.email?.split('@')[0] || 'Administrator',
          role: role === 'staff' ? 'admin' : role
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

  const generateRandomVinNumber = () => {
    return String(Math.floor(Math.random() * 9000) + 1000)
  }

  // ========== LOAD ALL DATA ==========
  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.log('No active session during data load')
        router.push('/portal')
        return
      }

      if (!forceRefresh && isInitialLoad.current && loadFromCache()) {
        setLoading(false)
        isInitialLoad.current = false
        setTimeout(() => loadAllData(true), 100)
        return
      }

      try {
        const { data: settingsData } = await supabase
          .from('school_settings')
          .select('*')
          .maybeSingle()
        if (settingsData) setSchoolSettings(settingsData)
      } catch (err) {
        console.log('School settings not found')
      }

      console.log('🔄 Fetching all profiles...')
      
      let studentsList: Student[] = []
      let staffList: Staff[] = []
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (profilesError) {
        console.error('❌ Profiles fetch error:', profilesError)
      } else {
        console.log(`✅ Fetched ${profiles?.length || 0} profiles`)
        
        const profileStudents = profiles?.filter(p => p.role === 'student') || []
        const profileStaff = profiles?.filter(p => p.role === 'staff') || []
        
        console.log(`📚 Students in profiles: ${profileStudents.length}`)
        console.log(`👥 Staff in profiles: ${profileStaff.length}`)
        
        // Process students
        studentsList = profileStudents.map((profile: any) => ({
          id: profile.id,
          vin_id: profile.vin_id || 'VIN-MISSING',
          email: profile.email,
          full_name: profile.full_name || getNameFromEmail(profile.email),
          class: profile.class || 'Not Assigned',
          department: profile.department || 'General',
          is_active: profile.is_active ?? true,
          password_changed: profile.password_changed || false,
          created_at: profile.created_at || new Date().toISOString(),
          photo_url: profile.photo_url || null,
          admission_year: profile.admission_year || null
        }))
        
        // Process staff
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
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (usersError) {
        console.error('❌ Users fetch error:', usersError)
      } else if (users && users.length > 0) {
        console.log(`✅ Fetched ${users.length} users from users table`)
        
        const existingStudentIds = new Set(studentsList.map(s => s.id))
        const usersStudents = users.filter(u => u.role === 'student' && !existingStudentIds.has(u.id))
        
        usersStudents.forEach((user: any) => {
          studentsList.push({
            id: user.id,
            vin_id: user.vin_id || 'VIN-MISSING',
            email: user.email,
            full_name: user.full_name || getNameFromEmail(user.email),
            class: user.class || 'Not Assigned',
            department: user.department || 'General',
            is_active: user.is_active ?? true,
            password_changed: user.password_changed || false,
            created_at: user.created_at || new Date().toISOString(),
            photo_url: user.photo_url || null,
            admission_year: user.admission_year || null
          })
        })
        
        const existingStaffIds = new Set(staffList.map(s => s.id))
        const usersStaff = users.filter(u => u.role === 'staff' && !existingStaffIds.has(u.id))
        
        usersStaff.forEach((user: any) => {
          staffList.push({
            id: user.id,
            vin_id: user.vin_id || 'VIN-MISSING',
            email: user.email,
            full_name: user.full_name || getNameFromEmail(user.email),
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            department: user.department || 'General',
            phone: user.phone || '',
            address: user.address || '',
            is_active: user.is_active ?? true,
            photo_url: user.photo_url || null,
            password_changed: user.password_changed || false,
            created_at: user.created_at || new Date().toISOString()
          })
        })
      }
      
      console.log(`📚 FINAL - Students: ${studentsList.length}, Staff: ${staffList.length}`)
      
      setStudents(studentsList)
      setStaff(staffList)

      let examsList: Exam[] = []
      let activeExamsCount = 0
      
      try {
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false })

        if (examsError) {
          console.error('❌ Exams fetch error:', examsError)
        } else if (examsData) {
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
      } catch (err) {
        console.log('Exams table not available yet')
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
      
      try {
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        setNotifications(notificationsData || [])
      } catch (err) {
        setNotifications([])
      }

    } catch (error: any) {
      console.error('❌ Error loading data:', error)
      setError(error?.message || 'Failed to load dashboard data')
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

    const usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadAllData(true)
      })
      .subscribe()

    const examsChannel = supabase
      .channel('exams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        loadAllData(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(examsChannel)
    }
  }, [loadAllData, authChecking])

  const handleRefreshUsers = useCallback(async () => {
    setRefreshing(true)
    await loadAllData(true)
    toast.success('Data refreshed')
  }, [loadAllData])

  const handleMarkNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    } catch (err) {}
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
  }, [])

  const handleUpdateProfile = useCallback((updatedProfile: any) => {
    setAdminProfile(updatedProfile)
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key))
    }
    router.push('/portal')
  }, [router])

  // ========== STUDENT CRUD ==========
  const handleAddStudent = useCallback(async (studentData: any): Promise<void> => {
    try {
      console.log('➕ Adding student:', studentData)
      
      const year = studentData.admission_year || new Date().getFullYear()
      const vinNumber = generateRandomVinNumber()
      const vinId = `VIN-STD-${year}-${vinNumber}`
      const email = `${studentData.first_name.toLowerCase()}.${studentData.last_name.toLowerCase()}@vincollins.edu.ng`
      const fullName = `${studentData.first_name} ${studentData.last_name}`
      
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: vinId,
          full_name: fullName,
          first_name: studentData.first_name.trim(),
          last_name: studentData.last_name.trim(),
          role: 'student',
          class: studentData.class,
          department: studentData.department || 'General',
          admission_year: year,
          phone: studentData.phone || '',
          address: studentData.address || '',
          vin_id: vinId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create student')
      }
      
      toast.success(`${fullName} added successfully!`)
      toast.info(`📧 Email: ${email}\n🔑 Password: ${vinId}`, { 
        duration: 15000,
        action: {
          label: 'Copy',
          onClick: () => navigator.clipboard?.writeText(`Email: ${email}\nPassword: ${vinId}`)
        }
      })
      
      navigator.clipboard?.writeText(`Email: ${email}\nPassword: ${vinId}`)
      
      await loadAllData(true)
      
    } catch (error: any) {
      console.error('❌ Error adding student:', error)
      toast.error(error.message || 'Failed to add student')
      throw error
    }
  }, [loadAllData])

  const handleUpdateStudent = useCallback(async (updatedStudent: Student) => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedStudent.full_name,
          class: updatedStudent.class,
          department: updatedStudent.department,
          is_active: updatedStudent.is_active,
          admission_year: updatedStudent.admission_year,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedStudent.id)

      if (profileError) throw profileError

      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: updatedStudent.full_name,
          class: updatedStudent.class,
          department: updatedStudent.department,
          is_active: updatedStudent.is_active,
          admission_year: updatedStudent.admission_year,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedStudent.id)

      if (userError) console.error('User update error:', userError)
      
      toast.success('Student updated')
      await loadAllData(true)
    } catch (err: any) {
      console.error('Update error:', err)
      toast.error(err.message || 'Failed to update student')
    }
  }, [loadAllData])

  const handleDeleteStudent = useCallback(async (student: Student) => {
    if (!confirm(`Delete ${student.full_name}? This will also delete the user account.`)) return
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', student.id)
        
      if (profileError) throw profileError
      
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', student.id)
        
      if (userError) console.error('User delete error:', userError)
      
      toast.success('Student deleted')
      await loadAllData(true)
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete student')
    }
  }, [loadAllData])

  const handleResetStudentPassword = useCallback(async (student: Student) => {
    try {
      const newVinId = `VIN-STD-${student.admission_year || new Date().getFullYear()}-${generateRandomVinNumber()}`
      
      await supabase.from('users').update({ 
        vin_id: newVinId,
        password_changed: false,
        updated_at: new Date().toISOString()
      }).eq('id', student.id)
      
      await supabase.from('profiles').update({ 
        vin_id: newVinId,
        password_changed: false
      }).eq('id', student.id)
      
      toast.success(`Password reset to: ${newVinId}`)
      navigator.clipboard?.writeText(newVinId)
      await loadAllData(true)
    } catch (err: any) {
      console.error('Reset error:', err)
      toast.info(`Current password is: ${student.vin_id}`)
      navigator.clipboard?.writeText(student.vin_id)
    }
  }, [loadAllData])

  // ========== STAFF CRUD ==========
  const handleAddStaff = useCallback(async (staffData: any): Promise<{ email: string; password: string; vin_id: string }> => {
    try {
      console.log('➕ Adding staff:', staffData)
      
      const year = staffData.join_year || new Date().getFullYear()
      const vinNumber = generateRandomVinNumber()
      const vinId = `VIN-STF-${year}-${vinNumber}`
      const fullName = staffData.first_name && staffData.last_name 
        ? `${staffData.first_name} ${staffData.last_name}`.trim()
        : staffData.full_name || 'Staff Member'
      const email = staffData.email || `${fullName.toLowerCase().replace(/\s/g, '.')}@vincollins.edu.ng`
      
      const response = await fetch('/api/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: vinId,
          full_name: fullName,
          first_name: staffData.first_name || '',
          last_name: staffData.last_name || '',
          role: 'staff',
          department: staffData.department || 'General',
          join_year: year,
          phone: staffData.phone || '',
          address: staffData.address || '',
          vin_id: vinId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create staff')
      }
      
      toast.success(`${fullName} added successfully!`)
      toast.info(`📧 Email: ${email}\n🔑 Password: ${vinId}`, { 
        duration: 15000,
        action: {
          label: 'Copy',
          onClick: () => navigator.clipboard?.writeText(`Email: ${email}\nPassword: ${vinId}`)
        }
      })
      
      navigator.clipboard?.writeText(`Email: ${email}\nPassword: ${vinId}`)
      
      await loadAllData(true)
      
      return { email, password: vinId, vin_id: vinId }
      
    } catch (error: any) {
      console.error('❌ Error adding staff:', error)
      toast.error(error.message || 'Failed to add staff')
      throw error
    }
  }, [loadAllData])

  const handleUpdateStaff = useCallback(async (updatedStaff: Staff): Promise<void> => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedStaff.full_name,
          department: updatedStaff.department,
          phone: updatedStaff.phone,
          address: updatedStaff.address,
          is_active: updatedStaff.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedStaff.id)

      if (profileError) throw profileError

      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: updatedStaff.full_name,
          department: updatedStaff.department,
          phone: updatedStaff.phone,
          address: updatedStaff.address,
          is_active: updatedStaff.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedStaff.id)

      if (userError) console.error('User update error:', userError)
      
      toast.success('Staff updated')
      await loadAllData(true)
    } catch (err: any) {
      console.error('Update error:', err)
      toast.error(err.message || 'Failed to update staff')
      throw err
    }
  }, [loadAllData])

  const handleDeleteStaff = useCallback(async (staffMember: Staff): Promise<void> => {
    if (!confirm(`Delete ${staffMember.full_name}? This will also delete the user account.`)) return
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffMember.id)
        
      if (profileError) throw profileError
      
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', staffMember.id)
        
      if (userError) console.error('User delete error:', userError)
      
      toast.success('Staff deleted')
      await loadAllData(true)
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete staff')
      throw err
    }
  }, [loadAllData])

  const handleResetStaffPassword = useCallback(async (staffMember: Staff): Promise<void> => {
    try {
      const newVinId = `VIN-STF-${new Date().getFullYear()}-${generateRandomVinNumber()}`
      
      await supabase.from('users').update({ 
        vin_id: newVinId,
        password_changed: false,
        updated_at: new Date().toISOString()
      }).eq('id', staffMember.id)
      
      await supabase.from('profiles').update({ 
        vin_id: newVinId,
        password_changed: false
      }).eq('id', staffMember.id)
      
      toast.success(`Password reset to: ${newVinId}`)
      navigator.clipboard?.writeText(newVinId)
      await loadAllData(true)
    } catch (err: any) {
      console.error('Reset error:', err)
      toast.info(`Current password is: ${staffMember.vin_id}`)
      navigator.clipboard?.writeText(staffMember.vin_id)
      throw err
    }
  }, [loadAllData])

  const handlePublishExam = useCallback(async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error
      
      toast.success('Exam published successfully')
      await loadAllData(true)
    } catch (err: any) {
      console.error('Publish error:', err)
      toast.error(err.message || 'Failed to publish exam')
    }
  }, [loadAllData])

  const handleStudentClick = useCallback(() => setActiveTab('students'), [])
  const handleStaffClick = useCallback(() => setActiveTab('staff'), [])
  const handleExamsClick = useCallback(() => setActiveTab('exams'), [])
  const handleSubmissionsClick = useCallback(() => setActiveTab('submissions'), [])
  const handleResultsClick = useCallback(() => setActiveTab('results'), [])
  const handleAttendanceClick = useCallback(() => setActiveTab('attendance'), [])

  if (authChecking || (loading && !dataLoadedRef.current)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div className="text-center space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              <p className="font-bold mb-2">Failed to load dashboard</p>
              <p className="text-sm">{error}</p>
            </AlertDescription>
          </Alert>
          <Button onClick={() => loadAllData(true)} className="mt-4 w-full">
            Retry
          </Button>
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
      pendingSubmissions={pendingSubmissionsCount} 
      sidebarOpen={sidebarOpen} 
      setSidebarOpen={setSidebarOpen}
    >
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            className="space-y-6" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            <WelcomeBanner adminProfile={adminProfile} activeTab={activeTab} />
            <StatsCards 
              stats={stats} 
              onStudentClick={handleStudentClick} 
              onStaffClick={handleStaffClick} 
              onExamsClick={handleExamsClick} 
              onSubmissionsClick={handleSubmissionsClick} 
              onResultsClick={handleResultsClick} 
              onAttendanceClick={handleAttendanceClick} 
            />
            <QuickActions 
              onStudentClick={handleStudentClick} 
              onStaffClick={handleStaffClick} 
              onExamsClick={handleExamsClick} 
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <AttendanceLeaderboard students={students} />
                <RecentActivityFeed />
              </div>
              <div className="space-y-6">
                <CBTStatus />
                <TopPerformersCard students={students} />
                <UpcomingScheduleCard />
              </div>
            </div>
          </motion.div>
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
            onRefresh={handleRefreshUsers}
          />
        )}
        
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Exam Management</h2>
              <Button onClick={() => setActiveTab('overview')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
            <div className="grid gap-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{exam.title}</h3>
                    <p className="text-sm text-muted-foreground">{exam.subject} - {exam.class}</p>
                    <p className="text-xs text-muted-foreground">Status: {exam.status}</p>
                  </div>
                  {exam.status !== 'published' && (
                    <Button onClick={() => handlePublishExam(exam.id)} size="sm">
                      Publish Exam
                    </Button>
                  )}
                </div>
              ))}
              {exams.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No exams found</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'cbt-monitor' && <CbtMonitor />}

        {!['overview', 'students', 'staff', 'exams', 'cbt-monitor'].includes(activeTab) && (
          <motion.div 
            className="flex flex-col items-center justify-center py-20" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
          >
            <div className="text-center space-y-4">
              <GraduationCap className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
              <p className="text-muted-foreground">This section is under development.</p>
              <Button onClick={() => setActiveTab('overview')} variant="outline">
                Return to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}