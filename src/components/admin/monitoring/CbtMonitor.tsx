/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/monitoring/CbtMonitor.tsx - FULL REAL-TIME MONITORING
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MonitorPlay,
  Eye,
  AlertTriangle,
  Users,
  Loader2,
  RefreshCw,
  Search,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle,
  Clock,
  Timer,
  StopCircle,
  Bell,
  ShieldAlert,
  Upload,
  CheckCheck,
  X,
  BookOpen,
  FileText,
  Camera,
  Maximize2,
  Minimize2,
  UserX,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns'

// Types
interface ActiveSession {
  id: string
  exam_id: string
  student_id: string
  student_name: string
  student_photo: string | null
  student_class: string
  exam_title: string
  exam_subject: string
  exam_duration: number
  started_at: string
  time_elapsed: number
  remaining_time: number
  current_question: number
  total_questions: number
  questions_answered: number
  tab_switches: number
  warnings: number
  status: 'active' | 'warning' | 'violation' | 'paused' | 'completed'
  proctoring_data: {
    face_detected: boolean
    multiple_faces: boolean
    suspicious_movement: boolean
    noise_level: number
    browser_focus: boolean
    fullscreen_active: boolean
    prohibited_apps: string[]
  }
  violations: Violation[]
  ip_address: string
  device_info: string
  network_quality: 'good' | 'fair' | 'poor'
}

interface Violation {
  type: string
  message?: string
  details?: string
  timestamp: string
}

interface PublishedExam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  status: string
  created_by: string
  teacher_name: string
  created_at: string
  published_at: string | null
  starts_at: string | null
  ends_at: string | null
  active_sessions: number
  total_attempts: number
  average_score: number
  proctoring_enabled: boolean
}

interface PendingExam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  created_by: string
  teacher_name: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  review_notes: string | null
}

interface MonitoringStats {
  activeSessions: number
  warnings: number
  violations: number
  completedToday: number
  averageScore: number
  proctoringAlerts: number
  pendingApprovals: number
  faceNotDetected: number
  multipleFaces: number
  fullscreenViolations: number
  tabSwitchViolations: number
}

export function CbtMonitor() {
  const [loading, setLoading] = useState(true)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [examFilter, setExamFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('live-sessions')
  const [warningMessage, setWarningMessage] = useState('')
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const proctoringIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [stats, setStats] = useState<MonitoringStats>({
    activeSessions: 0,
    warnings: 0,
    violations: 0,
    completedToday: 0,
    averageScore: 0,
    proctoringAlerts: 0,
    pendingApprovals: 0,
    faceNotDetected: 0,
    multipleFaces: 0,
    fullscreenViolations: 0,
    tabSwitchViolations: 0
  })

  const [publishData, setPublishData] = useState({
    starts_at: '',
    ends_at: '',
    proctoring_enabled: true,
    face_detection_required: true,
    fullscreen_required: true,
    tab_switch_limit: 2
  })
  const [reviewNotes, setReviewNotes] = useState('')

  // Format session data
  const formatSession = (session: any): ActiveSession => {
    const startedAt = new Date(session.started_at)
    const now = new Date()
    const timeElapsed = differenceInSeconds(now, startedAt)
    const durationSeconds = (session.exam?.duration || 60) * 60
    const remainingTime = Math.max(0, durationSeconds - timeElapsed)

    // Determine status based on violations
    let sessionStatus = session.status || 'active'
    const violations = session.violations || []
    const tabSwitches = session.tab_switches || 0
    const proctoringData = session.proctoring_data || {}
    
    // Auto-mark as violation if serious issues detected
    if (!proctoringData.face_detected && violations.length > 2) {
      sessionStatus = 'violation'
    }
    if (proctoringData.multiple_faces) {
      sessionStatus = 'violation'
    }
    if (!proctoringData.fullscreen_active && violations.length > 1) {
      sessionStatus = 'violation'
    }

    return {
      id: session.id,
      exam_id: session.exam_id,
      student_id: session.student_id,
      student_name: session.student?.full_name || 'Unknown Student',
      student_photo: session.student?.photo_url || null,
      student_class: session.student?.class || 'N/A',
      exam_title: session.exam?.title || 'Unknown Exam',
      exam_subject: session.exam?.subject || 'N/A',
      exam_duration: session.exam?.duration || 60,
      started_at: session.started_at,
      time_elapsed: timeElapsed,
      remaining_time: remainingTime,
      current_question: session.current_question || 1,
      total_questions: session.exam?.total_questions || 0,
      questions_answered: session.questions_answered || 0,
      tab_switches: tabSwitches,
      warnings: session.warnings || 0,
      status: sessionStatus,
      proctoring_data: proctoringData,
      violations: violations,
      ip_address: session.ip_address || 'N/A',
      device_info: session.device_info || 'N/A',
      network_quality: session.network_quality || 'good'
    }
  }

  // Load ALL active sessions - Complete monitoring
  const loadActiveSessions = async () => {
    try {
      // Get ALL active sessions regardless of status
      const { data: sessions, error } = await supabase
        .from('exam_sessions')
        .select(`
          id,
          exam_id,
          student_id,
          started_at,
          status,
          current_question,
          questions_answered,
          tab_switches,
          warnings,
          violations,
          proctoring_data,
          ip_address,
          device_info,
          network_quality,
          time_elapsed,
          remaining_time
        `)
        .in('status', ['active', 'warning', 'violation', 'paused'])
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error loading active sessions:', error.message)
        return
      }

      if (sessions && sessions.length > 0) {
        // Fetch related data for each session
        const sessionsWithData = await Promise.all(
          sessions.map(async (session: any) => {
            // Get student data
            const { data: studentData } = await supabase
              .from('profiles')
              .select('full_name, photo_url, class')
              .eq('id', session.student_id)
              .single()

            // Get exam data
            const { data: examData } = await supabase
              .from('exams')
              .select('title, subject, duration, total_questions')
              .eq('id', session.exam_id)
              .single()

            return {
              ...session,
              student: studentData || { full_name: 'Unknown', photo_url: null, class: 'N/A' },
              exam: examData || { title: 'Unknown', subject: 'N/A', duration: 60, total_questions: 0 }
            }
          })
        )

        const formattedSessions = sessionsWithData.map((session: any) => formatSession(session))
        setActiveSessions(formattedSessions)
        
        // Update proctoring stats
        updateProctoringStats(formattedSessions)
      } else {
        setActiveSessions([])
      }
    } catch (error: any) {
      console.error('Error loading active sessions:', error?.message || error)
    }
  }

  // Update proctoring statistics
  const updateProctoringStats = (sessions: ActiveSession[]) => {
    const faceNotDetected = sessions.filter(s => 
      s.proctoring_data && !s.proctoring_data.face_detected
    ).length
    
    const multipleFaces = sessions.filter(s => 
      s.proctoring_data && s.proctoring_data.multiple_faces
    ).length
    
    const fullscreenViolations = sessions.filter(s => 
      s.proctoring_data && !s.proctoring_data.fullscreen_active
    ).length
    
    const tabSwitchViolations = sessions.filter(s => 
      s.tab_switches > 2
    ).length

    setStats(prev => ({
      ...prev,
      faceNotDetected,
      multipleFaces,
      fullscreenViolations,
      tabSwitchViolations,
      proctoringAlerts: faceNotDetected + multipleFaces + fullscreenViolations
    }))
  }

  // Load published exams
  const loadPublishedExams = async () => {
    try {
      const { data: exams, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          subject,
          class,
          duration,
          total_questions,
          total_marks,
          status,
          created_by,
          created_at,
          published_at,
          starts_at,
          ends_at,
          proctoring_enabled,
          total_attempts,
          average_score
        `)
        .in('status', ['published', 'ongoing'])
        .order('published_at', { ascending: false })

      if (error) {
        console.error('Error loading published exams:', error.message)
        return
      }

      if (exams && exams.length > 0) {
        const examsWithTeachers = await Promise.all(
          exams.map(async (exam: any) => {
            const { data: teacherData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', exam.created_by)
              .single()

            return {
              ...exam,
              teacher_name: teacherData?.full_name || 'Unknown',
              active_sessions: activeSessions.filter(s => s.exam_id === exam.id).length,
              total_attempts: exam.total_attempts || 0,
              average_score: exam.average_score || 0
            }
          })
        )
        setPublishedExams(examsWithTeachers)
      } else {
        setPublishedExams([])
      }
    } catch (error: any) {
      console.error('Error loading published exams:', error?.message || error)
    }
  }

  // Load pending exams
  const loadPendingExams = async () => {
    try {
      const { data: exams, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          subject,
          class,
          duration,
          total_questions,
          total_marks,
          created_by,
          created_at,
          status,
          reviewed_at,
          review_notes
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading pending exams:', error.message)
        return
      }

      if (exams && exams.length > 0) {
        const examsWithTeachers = await Promise.all(
          exams.map(async (exam: any) => {
            const { data: teacherData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', exam.created_by)
              .single()

            return {
              ...exam,
              teacher_name: teacherData?.full_name || 'Unknown',
              status: exam.status || 'pending'
            }
          })
        )
        setPendingExams(examsWithTeachers)
        setStats(prev => ({ ...prev, pendingApprovals: examsWithTeachers.length }))
      } else {
        setPendingExams([])
        setStats(prev => ({ ...prev, pendingApprovals: 0 }))
      }
    } catch (error: any) {
      console.error('Error loading pending exams:', error?.message || error)
    }
  }

  // Load overall statistics
  const loadStats = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('exam_sessions')
        .select('status, warnings, score, percentage_score, created_at, proctoring_data, tab_switches')

      if (error) {
        console.error('Error loading stats:', error.message)
        return
      }

      if (sessionsData) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const active = sessionsData.filter((s: any) => 
          ['active', 'warning', 'violation', 'paused'].includes(s.status)
        ).length
        
        const warnings = sessionsData.reduce((sum: number, s: any) => sum + (s.warnings || 0), 0)
        const violations = sessionsData.filter((s: any) => s.status === 'violation').length
        
        const completedToday = sessionsData.filter((s: any) => 
          s.status === 'completed' && new Date(s.created_at) >= today
        ).length
        
        const completedSessions = sessionsData.filter((s: any) => 
          s.status === 'completed' && (s.percentage_score != null || s.score != null)
        )
        
        const avgScore = completedSessions.length > 0
          ? Math.round(completedSessions.reduce((sum: number, s: any) => 
              sum + (s.percentage_score || s.score || 0), 0) / completedSessions.length)
          : 0

        setStats(prev => ({
          ...prev,
          activeSessions: active,
          warnings,
          violations,
          completedToday,
          averageScore: avgScore
        }))
      }
    } catch (error: any) {
      console.error('Error loading stats:', error?.message || error)
    }
  }

  // Load all data
  const loadAllData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    
    try {
      await Promise.allSettled([
        loadActiveSessions(),
        loadPublishedExams(),
        loadPendingExams(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading CBT data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Auto-refresh for real-time monitoring
  useEffect(() => {
    loadAllData()

    if (autoRefresh) {
      // Refresh active sessions every 3 seconds for real-time monitoring
      refreshIntervalRef.current = setInterval(() => {
        loadActiveSessions()
      }, 3000)
      
      // Refresh stats every 10 seconds
      proctoringIntervalRef.current = setInterval(() => {
        loadStats()
      }, 10000)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      if (proctoringIntervalRef.current) {
        clearInterval(proctoringIntervalRef.current)
      }
    }
  }, [autoRefresh])

  // Send warning to student
  const handleSendWarning = async (session: ActiveSession, message: string) => {
    try {
      const newViolation = {
        type: 'admin_warning',
        message,
        timestamp: new Date().toISOString()
      }
      
      const newViolations = [...session.violations, newViolation]

      const { error } = await supabase
        .from('exam_sessions')
        .update({
          warnings: session.warnings + 1,
          violations: newViolations,
          status: session.warnings + 1 >= 3 ? 'violation' : 'warning'
        })
        .eq('id', session.id)

      if (error) throw error

      toast.success(`Warning sent to ${session.student_name}`)
      setShowWarningDialog(false)
      setWarningMessage('')
      setSelectedSession(null)
      loadActiveSessions()
    } catch (error: any) {
      console.error('Error sending warning:', error?.message || error)
      toast.error('Failed to send warning')
    }
  }

  // Terminate session
  const handleTerminateSession = async (session: ActiveSession) => {
    if (!confirm(`Are you sure you want to terminate the exam for ${session.student_name}?`)) return

    try {
      const { error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'terminated',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id)

      if (error) throw error

      toast.success(`Session terminated for ${session.student_name}`)
      loadActiveSessions()
    } catch (error: any) {
      console.error('Error terminating session:', error?.message || error)
      toast.error('Failed to terminate session')
    }
  }

  // Pause session
  const handlePauseSession = async (session: ActiveSession) => {
    try {
      const { error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'paused'
        })
        .eq('id', session.id)

      if (error) throw error

      toast.success(`Session paused for ${session.student_name}`)
      loadActiveSessions()
    } catch (error: any) {
      console.error('Error pausing session:', error?.message || error)
      toast.error('Failed to pause session')
    }
  }

  // Resume session
  const handleResumeSession = async (session: ActiveSession) => {
    try {
      const { error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'active'
        })
        .eq('id', session.id)

      if (error) throw error

      toast.success(`Session resumed for ${session.student_name}`)
      loadActiveSessions()
    } catch (error: any) {
      console.error('Error resuming session:', error?.message || error)
      toast.error('Failed to resume session')
    }
  }

  // Approve and publish exam
  const handleApproveExam = async () => {
    if (!selectedExam || !publishData.starts_at || !publishData.ends_at) {
      toast.error('Please set start and end times')
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          starts_at: publishData.starts_at,
          ends_at: publishData.ends_at,
          proctoring_enabled: publishData.proctoring_enabled,
          face_detection_required: publishData.face_detection_required,
          fullscreen_required: publishData.fullscreen_required,
          tab_switch_limit: publishData.tab_switch_limit,
          review_notes: reviewNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedExam.id)

      if (error) throw error

      toast.success('Exam approved and published successfully!')
      setShowPublishDialog(false)
      setSelectedExam(null)
      setReviewNotes('')
      loadAllData()
    } catch (error: any) {
      console.error('Error approving exam:', error?.message || error)
      toast.error('Failed to approve exam')
    }
  }

  // Filter sessions
  const filteredSessions = activeSessions.filter(session => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!session.student_name.toLowerCase().includes(query) &&
          !session.exam_title.toLowerCase().includes(query) &&
          !session.student_class.toLowerCase().includes(query)) {
        return false
      }
    }
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    if (examFilter !== 'all' && session.exam_id !== examFilter) return false
    return true
  })

  // Get sessions with violations
  const sessionsWithViolations = activeSessions.filter(s => 
    s.status === 'violation' || s.violations.length > 0 || s.tab_switches > 2 ||
    (s.proctoring_data && (!s.proctoring_data.face_detected || s.proctoring_data.multiple_faces))
  )

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Active</Badge>
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Warning</Badge>
      case 'violation':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Violation</Badge>
      case 'paused':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">Paused</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getProctoringStatus = (session: ActiveSession) => {
    if (!session.proctoring_data) return null
    
    const issues = []
    if (!session.proctoring_data.face_detected) issues.push('face')
    if (session.proctoring_data.multiple_faces) issues.push('multi-face')
    if (session.proctoring_data.suspicious_movement) issues.push('movement')
    if (!session.proctoring_data.fullscreen_active) issues.push('fullscreen')
    
    if (issues.length === 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">Clear</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs">{issues.length} issue{issues.length > 1 ? 's' : ''}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MonitorPlay className="h-8 w-8 text-primary" />
            CBT Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time exam monitoring and proctoring - {activeSessions.length} active sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="mr-2 h-4 w-4" />
            Live {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadAllData(true)} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeSessions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">{stats.warnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Violations</p>
                <p className="text-2xl font-bold text-red-600">{stats.violations}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Proctoring Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.proctoringAlerts}</p>
              </div>
              <Camera className="h-8 w-8 text-orange-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pendingApprovals}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proctoring Alert Summary */}
      {(stats.faceNotDetected > 0 || stats.multipleFaces > 0 || stats.fullscreenViolations > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Proctoring Alerts:</span>
              </div>
              {stats.faceNotDetected > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <UserX className="h-3 w-3" />
                  {stats.faceNotDetected} Face Not Detected
                </Badge>
              )}
              {stats.multipleFaces > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Users className="h-3 w-3" />
                  {stats.multipleFaces} Multiple Faces
                </Badge>
              )}
              {stats.fullscreenViolations > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Minimize2 className="h-3 w-3" />
                  {stats.fullscreenViolations} Fullscreen Violations
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="live-sessions" className="gap-2">
            <Activity className="h-4 w-4" />
            Live Sessions ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="pending-approvals" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingExams.length})
          </TabsTrigger>
          <TabsTrigger value="published-exams" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Published ({publishedExams.length})
          </TabsTrigger>
        </TabsList>

        {/* Live Sessions Tab */}
        <TabsContent value="live-sessions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, exam, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="violation">Violation</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Select value={examFilter} onValueChange={setExamFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {publishedExams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Sessions Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proctoring</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Violations</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <MonitorPlay className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">No active exam sessions</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sessions will appear here when students start their exams
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((session) => (
                      <TableRow key={session.id} className={cn(
                        "group",
                        session.status === 'violation' && "bg-red-50",
                        session.status === 'warning' && "bg-amber-50"
                      )}>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.student_photo || undefined} />
                              <AvatarFallback>{session.student_name?.charAt(0) || 'S'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{session.student_name}</p>
                              <p className="text-xs text-muted-foreground">{session.student_class}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{session.exam_title}</p>
                            <p className="text-xs text-muted-foreground">{session.exam_subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getProctoringStatus(session)}
                            {session.network_quality === 'good' ? (
                              <Wifi className="h-4 w-4 text-emerald-500" />
                            ) : session.network_quality === 'fair' ? (
                              <Wifi className="h-4 w-4 text-amber-500" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Q{session.current_question}/{session.total_questions}</span>
                              <span>{session.questions_answered} ✓</span>
                            </div>
                            <Progress 
                              value={session.total_questions > 0 ? (session.current_question / session.total_questions) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            <Timer className="inline h-3 w-3 mr-1" />
                            {formatTime(session.remaining_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {session.tab_switches > 0 && (
                              <Badge variant="outline" className="text-amber-600 text-xs">
                                {session.tab_switches} tab
                              </Badge>
                            )}
                            {session.warnings > 0 && (
                              <Badge variant="outline" className="text-red-600 text-xs">
                                {session.warnings} warn
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowSessionDetails(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowWarningDialog(true)
                              }}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                            {session.status === 'paused' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600"
                                onClick={() => handleResumeSession(session)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600"
                                onClick={() => handlePauseSession(session)}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleTerminateSession(session)}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Violations Section */}
          {sessionsWithViolations.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Students Requiring Attention ({sessionsWithViolations.length})
                </CardTitle>
                <CardDescription className="text-red-600">
                  These students have triggered proctoring alerts or violated exam rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessionsWithViolations.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.student_photo || undefined} />
                          <AvatarFallback>{session.student_name?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{session.student_name}</p>
                          <p className="text-sm text-muted-foreground">{session.exam_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1">
                          {session.tab_switches > 2 && (
                            <Badge variant="destructive" className="text-xs">
                              {session.tab_switches} tab switches
                            </Badge>
                          )}
                          {session.proctoring_data && !session.proctoring_data.face_detected && (
                            <Badge variant="destructive" className="text-xs">
                              Face not detected
                            </Badge>
                          )}
                          {session.proctoring_data && session.proctoring_data.multiple_faces && (
                            <Badge variant="destructive" className="text-xs">
                              Multiple faces
                            </Badge>
                          )}
                          {session.proctoring_data && !session.proctoring_data.fullscreen_active && (
                            <Badge variant="destructive" className="text-xs">
                              Fullscreen violation
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSession(session)
                            setShowSessionDetails(true)
                          }}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleTerminateSession(session)}
                        >
                          Terminate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending-approvals" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Exams Pending Approval
              </CardTitle>
              <CardDescription>
                Exams submitted by teachers waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingExams.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No pending exams</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>{exam.class}</TableCell>
                        <TableCell>{exam.teacher_name}</TableCell>
                        <TableCell>{exam.total_questions} Qs</TableCell>
                        <TableCell>{exam.duration} mins</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedExam(exam)
                                setShowPublishDialog(true)
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Published Exams Tab */}
        <TabsContent value="published-exams" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Published Exams
              </CardTitle>
              <CardDescription>
                Currently active and published examinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publishedExams.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No published exams</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{exam.title}</p>
                            <p className="text-xs text-muted-foreground">{exam.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>{exam.class}</TableCell>
                        <TableCell>
                          <Badge className={
                            exam.status === 'ongoing' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-blue-100 text-blue-700'
                          }>
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            exam.active_sessions > 0 ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {exam.active_sessions}
                          </span>
                        </TableCell>
                        <TableCell>{exam.total_attempts}</TableCell>
                        <TableCell>
                          {exam.average_score > 0 ? `${exam.average_score}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{exam.teacher_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Send Warning to Student</DialogTitle>
            <DialogDescription>
              {selectedSession?.student_name} - {selectedSession?.exam_title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Warning Message</Label>
              <textarea
                className="w-full mt-2 p-3 border rounded-md resize-none bg-background"
                rows={4}
                placeholder="Enter warning message to display to the student..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Current warnings: {selectedSession?.warnings || 0}</p>
              <p className="text-amber-600">After 3 warnings, the session will be marked as violation.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowWarningDialog(false)
              setWarningMessage('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedSession && warningMessage.trim()) {
                  handleSendWarning(selectedSession, warningMessage)
                } else {
                  toast.error('Please enter a warning message')
                }
              }}
              disabled={!warningMessage.trim()}
            >
              <Bell className="mr-2 h-4 w-4" />
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review and Publish Exam</DialogTitle>
            <DialogDescription>
              {selectedExam?.title} by {selectedExam?.teacher_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={publishData.starts_at}
                  onChange={(e) => setPublishData({ ...publishData, starts_at: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={publishData.ends_at}
                  onChange={(e) => setPublishData({ ...publishData, ends_at: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Proctoring Settings</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publishData.proctoring_enabled}
                    onChange={(e) => setPublishData({ ...publishData, proctoring_enabled: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Proctoring</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publishData.face_detection_required}
                    onChange={(e) => setPublishData({ ...publishData, face_detection_required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Require Face Detection</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publishData.fullscreen_required}
                    onChange={(e) => setPublishData({ ...publishData, fullscreen_required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Require Fullscreen Mode</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Tab Switch Limit</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={publishData.tab_switch_limit}
                onChange={(e) => setPublishData({ ...publishData, tab_switch_limit: parseInt(e.target.value) })}
                className="mt-1 w-24"
              />
            </div>

            <div>
              <Label>Review Notes</Label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md resize-none bg-background"
                rows={3}
                placeholder="Add any notes about this exam..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={async () => {
              if (!selectedExam) return
              if (!reviewNotes) {
                toast.error('Please provide review notes for rejection')
                return
              }
              try {
                await supabase
                  .from('exams')
                  .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    review_notes: reviewNotes
                  })
                  .eq('id', selectedExam.id)
                
                toast.success('Exam rejected')
                setShowPublishDialog(false)
                setSelectedExam(null)
                setReviewNotes('')
                loadAllData()
              } catch (error) {
                toast.error('Failed to reject exam')
              }
            }}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleApproveExam}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={showSessionDetails} onOpenChange={setShowSessionDetails}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              {selectedSession?.student_name} - {selectedSession?.exam_title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedSession.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedSession.student_class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{format(new Date(selectedSession.started_at), 'PPp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                  <p className="font-medium">{formatTime(selectedSession.remaining_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedSession.ip_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Network</p>
                  <Badge className={
                    selectedSession.network_quality === 'good' ? 'bg-emerald-100' :
                    selectedSession.network_quality === 'fair' ? 'bg-amber-100' : 'bg-red-100'
                  }>
                    {selectedSession.network_quality}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Proctoring Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <Badge className={selectedSession.proctoring_data?.face_detected ? 'bg-emerald-100' : 'bg-red-100'}>
                    Face Detected: {selectedSession.proctoring_data?.face_detected ? 'Yes' : 'No'}
                  </Badge>
                  <Badge className={selectedSession.proctoring_data?.fullscreen_active ? 'bg-emerald-100' : 'bg-red-100'}>
                    Fullscreen: {selectedSession.proctoring_data?.fullscreen_active ? 'Yes' : 'No'}
                  </Badge>
                  <Badge className={selectedSession.proctoring_data?.browser_focus ? 'bg-emerald-100' : 'bg-red-100'}>
                    Browser Focus: {selectedSession.proctoring_data?.browser_focus ? 'Yes' : 'No'}
                  </Badge>
                  <Badge className={!selectedSession.proctoring_data?.multiple_faces ? 'bg-emerald-100' : 'bg-red-100'}>
                    Multiple Faces: {selectedSession.proctoring_data?.multiple_faces ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Progress</p>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Question {selectedSession.current_question} of {selectedSession.total_questions}</span>
                    <span>{selectedSession.questions_answered} answered</span>
                  </div>
                  <Progress 
                    value={selectedSession.total_questions > 0 ? (selectedSession.current_question / selectedSession.total_questions) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </div>

              {selectedSession.violations.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Violations ({selectedSession.violations.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSession.violations.map((violation: Violation, idx: number) => (
                      <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm font-medium text-red-800 capitalize">{violation.type}</p>
                        <p className="text-sm text-red-600">{violation.message || violation.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(violation.timestamp), 'h:mm:ss a')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSession.tab_switches > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Tab Switches</p>
                  <p className="font-medium text-amber-600">{selectedSession.tab_switches} times</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSessionDetails(false)}>
              Close
            </Button>
            {selectedSession && (
              <>
                <Button 
                  variant="outline" 
                  className="text-amber-600"
                  onClick={() => {
                    setShowSessionDetails(false)
                    setShowWarningDialog(true)
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Warning
                </Button>
                <Button variant="destructive" onClick={() => {
                  handleTerminateSession(selectedSession)
                  setShowSessionDetails(false)
                }}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Terminate
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}