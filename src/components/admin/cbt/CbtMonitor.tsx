/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  MonitorPlay,
  Eye,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  Loader2,
  RefreshCw,
  Search,
  Activity,
  Wifi,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ActiveSession {
  id: string
  student_name: string
  student_id: string
  student_photo: string | null
  exam_title: string
  exam_id: string
  started_at: string
  time_elapsed: number
  remaining_time: number
  question_number: number
  total_questions: number
  tab_switches: number
  status: 'active' | 'warning' | 'violation'
}

export function CbtMonitor() {
  const [loading, setLoading] = useState(true)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadActiveSessions()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadActiveSessions, 10000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  async function loadActiveSessions() {
    setLoading(true)
    try {
      // Fetch active exam attempts using your actual column names
      const { data: attempts, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('status', 'in-progress')
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error fetching attempts:', error)
        setActiveSessions([])
        setLoading(false)
        return
      }

      if (!attempts || attempts.length === 0) {
        setActiveSessions([])
        setLoading(false)
        return
      }

      // Get student details from profiles table
      const studentIds = [...new Set(attempts.map(a => a.student_id).filter(Boolean))]
      let students: any[] = []
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url')
          .in('id', studentIds)
        students = studentsData || []
      }

      // Get exam details
      const examIds = [...new Set(attempts.map(a => a.exam_id).filter(Boolean))]
      let exams: any[] = []
      if (examIds.length > 0) {
        const { data: examsData } = await supabase
          .from('exams')
          .select('id, title, duration, total_questions')
          .in('id', examIds)
        exams = examsData || []
      }

      // Create maps for quick lookup
      const studentMap = new Map(students.map(s => [s.id, s]))
      const examMap = new Map(exams.map(e => [e.id, e]))

      const now = new Date()
      const sessions: ActiveSession[] = attempts.map((attempt) => {
        const student = studentMap.get(attempt.student_id)
        const exam = examMap.get(attempt.exam_id)
        
        const startedAt = new Date(attempt.started_at)
        const timeElapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
        const durationSeconds = (exam?.duration || 60) * 60
        const remainingTime = Math.max(0, durationSeconds - timeElapsed)
        
        // Calculate status based on tab_switches (you may need to add this column)
        // For now, default to active
        const status: 'active' | 'warning' | 'violation' = 'active'
        
        return {
          id: attempt.id,
          student_name: student?.full_name || 'Unknown Student',
          student_id: attempt.student_id,
          student_photo: student?.photo_url || null,
          exam_title: exam?.title || 'Unknown Exam',
          exam_id: attempt.exam_id,
          started_at: attempt.started_at,
          time_elapsed: timeElapsed,
          remaining_time: remainingTime,
          question_number: 0,
          total_questions: exam?.total_questions || 0,
          tab_switches: 0, // You may need to add this column to your table
          status
        }
      })

      setActiveSessions(sessions)
    } catch (error) {
      console.error('Error loading active sessions:', error)
      setActiveSessions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = activeSessions.filter(session => {
    if (searchQuery && !session.student_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    return true
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
      case 'violation':
        return <Badge className="bg-red-100 text-red-700">Violation</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'violation':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const stats = {
    totalActive: activeSessions.length,
    warningCount: activeSessions.filter(s => s.status === 'warning').length,
    violationCount: activeSessions.filter(s => s.status === 'violation').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MonitorPlay className="h-6 w-6 text-purple-500" />
            CBT Live Monitor
          </h1>
          <p className="text-muted-foreground text-sm">Real-time monitoring of active CBT sessions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="mr-2 h-4 w-4" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadActiveSessions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{stats.totalActive}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Violations</p>
                <p className="text-2xl font-bold text-red-600">{stats.violationCount}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
            className="text-green-600"
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'warning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('warning')}
            className="text-yellow-600"
          >
            Warning
          </Button>
          <Button
            variant={statusFilter === 'violation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('violation')}
            className="text-red-600"
          >
            Violation
          </Button>
        </div>
      </div>

      {/* Active Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active CBT Sessions</CardTitle>
          <CardDescription>Students currently taking exams</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <MonitorPlay className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active CBT sessions</p>
              <p className="text-sm text-muted-foreground mt-1">When students start taking exams, they will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.student_photo || undefined} />
                          <AvatarFallback>{session.student_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{session.student_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{session.exam_title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(session.status)}
                        {getStatusBadge(session.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${session.remaining_time < 300 ? 'text-red-600 font-bold' : ''}`}>
                        {formatTime(session.remaining_time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress 
                          value={session.total_questions > 0 ? (session.question_number / session.total_questions * 100) : 0} 
                          className="h-2" 
                        />
                        <span className="text-xs text-muted-foreground mt-1">
                          {session.question_number}/{session.total_questions}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(session.started_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Warning Note */}
      {activeSessions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Proctoring Information</p>
              <p className="text-sm text-yellow-700 mt-1">
                Students receive a warning on their first tab switch. The exam is auto-submitted on the second violation.
                You can manually override or terminate any session from the action menu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}