// app/admin/monitor/page.tsx - LIVE CBT MONITOR + CLEAR TERM RECORDS + DARK MODE
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, AlertTriangle, MonitorPlay, Activity, Shield, XCircle, CheckCircle2,
  Users, RefreshCw, Search, Zap, ZapOff, MousePointer, Minimize2, StopCircle, Eye,
  Archive, Trash2, Database
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────
interface LiveStudent {
  id: string
  student_id: string
  student_name: string
  student_email: string
  student_class: string
  vin_id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  exam_duration: number
  status: 'in_progress' | 'completed' | 'auto_submitted' | 'submitted'
  tab_switches: number
  fullscreen_exits: number
  warnings: number
  unload_count: number
  current_question: number
  total_questions: number
  objective_score: number
  percentage: number
  time_spent: number
  time_remaining: number
  started_at: string
  last_activity: string
  submitted_at: string | null
  is_auto_submitted: boolean
  auto_submit_reason: string | null
  ip_address: string | null
  device_info: string | null
  browser_info: string | null
}

interface ExamSession {
  exam_id: string
  exam_title: string
  exam_subject: string
  student_count: number
  active_count: number
  completed_count: number
  auto_submitted_count: number
  avg_score: number
}

interface ViolationEvent {
  id: string
  attempt_id: string
  student_name: string
  exam_title: string
  violation_type: string
  details: string
  created_at: string
}

// ─── Helpers ────────────────────────────────────────────
const getCurrentSession = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`
}

const terms = ['First Term', 'Second Term', 'Third Term']

// ─── Main Component ───────────────────────────────────
export default function LiveCbtMonitorPage() {
  const [loading, setLoading] = useState(true)
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([])
  const [examSessions, setExamSessions] = useState<ExamSession[]>([])
  const [violationEvents, setViolationEvents] = useState<ViolationEvent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<LiveStudent | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const refreshRef = useRef<NodeJS.Timeout | null>(null)

  // Clear Term Records Dialog State
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearTerm, setClearTerm] = useState('First Term')
  const [clearSession, setClearSession] = useState(getCurrentSession())
  const [clearBeforeDate, setClearBeforeDate] = useState('')
  const [clearAction, setClearAction] = useState<'archive' | 'delete' | 'archive_and_delete'>('archive_and_delete')
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  // ─── Load Live Data ──────────────────────────────────
  const loadLiveData = useCallback(async () => {
    try {
      const { data: attempts, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      if (!attempts || attempts.length === 0) {
        setLiveStudents([])
        setExamSessions([])
        setViolationEvents([])
        setLoading(false)
        return
      }

      const examIds = [...new Set(attempts.map(a => a.exam_id))]
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, subject, duration')
        .in('id', examIds)

      const examMap: Record<string, any> = {}
      exams?.forEach(e => { examMap[e.id] = e })

      const students: LiveStudent[] = attempts.map((a: any) => {
        const exam = examMap[a.exam_id] || {}
        const startedAt = new Date(a.started_at || a.created_at)
        const now = new Date()
        const timeSpent = a.time_spent || Math.floor((now.getTime() - startedAt.getTime()) / 1000)
        const duration = (exam.duration || 60) * 60
        const timeRemaining = Math.max(0, duration - timeSpent)

        return {
          id: a.id,
          student_id: a.student_id,
          student_name: a.student_name || 'Unknown',
          student_email: a.student_email || '',
          student_class: a.student_class || '—',
          vin_id: a.student_vin || a.vin_id || '—',
          exam_id: a.exam_id,
          exam_title: exam.title || 'Unknown Exam',
          exam_subject: exam.subject || '—',
          exam_duration: exam.duration || 60,
          status: a.status || 'in_progress',
          tab_switches: a.tab_switches || 0,
          fullscreen_exits: a.fullscreen_exits || 0,
          warnings: a.warnings || 0,
          unload_count: a.unload_count || 0,
          current_question: a.current_question || 0,
          total_questions: a.total_questions || exam.total_questions || 0,
          objective_score: a.objective_score || 0,
          percentage: a.percentage || 0,
          time_spent: timeSpent,
          time_remaining: timeRemaining,
          started_at: a.started_at || a.created_at,
          last_activity: a.last_activity || a.updated_at || a.created_at,
          submitted_at: a.submitted_at || null,
          is_auto_submitted: a.is_auto_submitted || false,
          auto_submit_reason: a.auto_submit_reason || null,
          ip_address: a.ip_address || null,
          device_info: a.device_info || null,
          browser_info: a.browser_info || null
        }
      })

      setLiveStudents(students)

      const sessionMap: Record<string, ExamSession> = {}
      students.forEach(s => {
        const key = s.exam_id
        if (!sessionMap[key]) {
          sessionMap[key] = {
            exam_id: s.exam_id,
            exam_title: s.exam_title,
            exam_subject: s.exam_subject,
            student_count: 0,
            active_count: 0,
            completed_count: 0,
            auto_submitted_count: 0,
            avg_score: 0
          }
        }
        sessionMap[key].student_count++
        if (s.status === 'in_progress') sessionMap[key].active_count++
        if (s.status === 'completed' || s.status === 'submitted') sessionMap[key].completed_count++
        if (s.is_auto_submitted) sessionMap[key].auto_submitted_count++
      })

      Object.values(sessionMap).forEach(session => {
        const sessionStudents = students.filter(s => s.exam_id === session.exam_id && (s.status === 'completed' || s.status === 'submitted'))
        if (sessionStudents.length > 0) {
          session.avg_score = Math.round(sessionStudents.reduce((sum, s) => sum + s.percentage, 0) / sessionStudents.length)
        }
      })

      setExamSessions(Object.values(sessionMap))

      const violations: ViolationEvent[] = []
      students.forEach(s => {
        if (s.tab_switches > 0) {
          violations.push({
            id: `${s.id}-tab-${s.tab_switches}`,
            attempt_id: s.id,
            student_name: s.student_name,
            exam_title: s.exam_title,
            violation_type: 'tab_switch',
            details: `${s.tab_switches} tab switch(es) detected`,
            created_at: s.last_activity
          })
        }
        if (s.fullscreen_exits > 0) {
          violations.push({
            id: `${s.id}-fs-${s.fullscreen_exits}`,
            attempt_id: s.id,
            student_name: s.student_name,
            exam_title: s.exam_title,
            violation_type: 'fullscreen_exit',
            details: `${s.fullscreen_exits} fullscreen exit(s)`,
            created_at: s.last_activity
          })
        }
        if (s.is_auto_submitted) {
          violations.push({
            id: `${s.id}-auto`,
            attempt_id: s.id,
            student_name: s.student_name,
            exam_title: s.exam_title,
            violation_type: 'auto_submitted',
            details: s.auto_submit_reason || 'Auto-submitted due to violations',
            created_at: s.submitted_at || s.last_activity
          })
        }
      })

      violations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setViolationEvents(violations.slice(0, 50))

    } catch (error) {
      console.error('Error loading monitor data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Auto Refresh ────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return
    loadLiveData()
    if (autoRefresh) {
      refreshRef.current = setInterval(loadLiveData, 3000)
    }
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
    }
  }, [autoRefresh, isMounted, loadLiveData])

  // ─── Real-time subscription ──────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('cbt-live-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, () => {
        loadLiveData()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLiveData])

  // ─── Derived Data ────────────────────────────────────
  const allClasses = [...new Set(liveStudents.map(s => s.student_class).filter(Boolean))].sort()

  const filteredStudents = liveStudents.filter(s => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || s.student_name?.toLowerCase().includes(q) ||
      s.student_email?.toLowerCase().includes(q) ||
      s.vin_id?.toLowerCase().includes(q) ||
      s.exam_subject?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    const matchesClass = classFilter === 'all' || s.student_class === classFilter
    return matchesSearch && matchesStatus && matchesClass
  })

  const stats = {
    total: liveStudents.length,
    active: liveStudents.filter(s => s.status === 'in_progress').length,
    completed: liveStudents.filter(s => s.status === 'completed' || s.status === 'submitted').length,
    autoSubmitted: liveStudents.filter(s => s.is_auto_submitted).length,
    violations: liveStudents.filter(s => s.tab_switches > 2 || s.fullscreen_exits > 1 || s.is_auto_submitted).length,
    avgScore: liveStudents.filter(s => s.status === 'completed' || s.status === 'submitted').length > 0
      ? Math.round(liveStudents.filter(s => s.status === 'completed' || s.status === 'submitted').reduce((sum, s) => sum + s.percentage, 0) /
          liveStudents.filter(s => s.status === 'completed' || s.status === 'submitted').length)
      : 0
  }

  // ─── Helpers ─────────────────────────────────────────
  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const formatDate = (d: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-0"><Activity className="h-3 w-3 mr-1" />Active</Badge>
      case 'completed': return <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
      case 'submitted': return <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Submitted</Badge>
      case 'auto_submitted': return <Badge className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-0"><XCircle className="h-3 w-3 mr-1" />Auto-Submitted</Badge>
      default: return <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">{status}</Badge>
    }
  }

  const getViolationLevel = (s: LiveStudent) => {
    if (s.is_auto_submitted) return { level: 'critical', color: 'bg-red-500', text: 'Critical' }
    if (s.tab_switches > 3 || s.fullscreen_exits > 2) return { level: 'high', color: 'bg-orange-500', text: 'High' }
    if (s.tab_switches > 1 || s.fullscreen_exits > 0 || s.warnings > 0) return { level: 'medium', color: 'bg-amber-500', text: 'Medium' }
    return { level: 'low', color: 'bg-emerald-500', text: 'Clean' }
  }

  // ─── Handle End Exam ─────────────────────────────────
  const handleEndExam = async (studentId: string, attemptId: string) => {
    if (!confirm('Force end this exam? The student will be auto-submitted.')) return
    try {
      await supabase.from('exam_attempts').update({
        status: 'auto_submitted',
        is_auto_submitted: true,
        auto_submit_reason: 'Admin terminated exam',
        submitted_at: new Date().toISOString()
      }).eq('id', attemptId)
      toast.success('Exam terminated')
      loadLiveData()
    } catch (err) {
      toast.error('Failed to end exam')
    }
  }

  // ─── Handle Clear Term Records ───────────────────────
  const handleClearTermRecords = async () => {
    if (clearConfirmText !== 'CLEAR') {
      toast.error('Please type CLEAR to confirm')
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch('/api/admin/monitor/clear-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: clearAction,
          term: clearTerm,
          session: clearSession,
          before_date: clearBeforeDate || null,
          confirmation: 'CLEAR_TERM_RECORDS'
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Clearance failed')

      toast.success(
        `✅ ${data.message} • Archived: ${data.archived} • Deleted: ${data.deleted}`,
        { duration: 6000 }
      )

      setShowClearDialog(false)
      setClearConfirmText('')
      setClearBeforeDate('')
      await loadLiveData()
    } catch (error: any) {
      console.error('Clear error:', error)
      toast.error(error.message || 'Failed to clear term records')
    } finally {
      setIsClearing(false)
    }
  }

  // ─── Loading ─────────────────────────────────────────
  if (!isMounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <MonitorPlay className="h-12 w-12 text-red-500 dark:text-red-400" />
        </motion.div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading live monitor...</p>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="space-y-3 sm:space-y-4 bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-red-500 dark:text-red-400" />
            Live CBT Monitor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.active} active • {stats.total} total • {stats.violations} with violations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn("h-8 text-xs", autoRefresh ? "bg-red-600 hover:bg-red-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300")}
          >
            {autoRefresh ? <Zap className="h-3.5 w-3.5 mr-1 animate-pulse" /> : <ZapOff className="h-3.5 w-3.5 mr-1" />}
            Live {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadLiveData} className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            className="h-8 text-xs border-red-300 dark:border-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Archive className="h-3.5 w-3.5 mr-1" />Clear Term Records
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
          { label: 'Active', value: stats.active, icon: Activity, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' },
          { label: 'Auto-Sub', value: stats.autoSubmitted, icon: XCircle, color: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' },
          { label: 'Violations', value: stats.violations, icon: AlertTriangle, color: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-900/50' },
          { label: 'Avg Score', value: `${stats.avgScore}%`, icon: MonitorPlay, color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/50' },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-lg p-2.5 text-center border", s.color)}>
            <p className="text-[9px] uppercase opacity-70">{s.label}</p>
            <p className="text-base font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <Input placeholder="Search student, VIN, or subject..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-full sm:w-[130px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_progress">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="auto_submitted">Auto-Submitted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="h-8 text-xs w-full sm:w-[120px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectItem value="all">All Classes</SelectItem>
            {allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Two Column Layout: Students Table + Violation Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left p-2 font-semibold text-slate-600 dark:text-slate-400">Student</th>
                      <th className="text-left p-2 font-semibold text-slate-600 dark:text-slate-400">Exam</th>
                      <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Progress</th>
                      <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Time Left</th>
                      <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Violations</th>
                      <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => {
                      const violation = getViolationLevel(s)
                      const progressPct = s.total_questions > 0 ? Math.round((s.current_question / s.total_questions) * 100) : 0
                      return (
                        <tr key={s.id} className={cn("border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors",
                          s.status === 'in_progress' && "bg-emerald-50/20 dark:bg-emerald-950/10",
                          s.is_auto_submitted && "bg-red-50/30 dark:bg-red-950/10"
                        )}>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={cn("h-2 w-2 rounded-full shrink-0", violation.color)} />
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-100">{s.student_name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.student_class} • {s.vin_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <p className="font-medium text-slate-700 dark:text-slate-200">{s.exam_subject}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{s.exam_title}</p>
                          </td>
                          <td className="p-2 text-center">
                            <div>
                              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{s.current_question}/{s.total_questions}</span>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-1">
                                <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <span className={cn("font-mono font-bold", s.time_remaining < 300 ? "text-red-600 dark:text-red-400 animate-pulse" : "text-slate-600 dark:text-slate-300")}>
                              {s.status === 'in_progress' ? formatTime(s.time_remaining) : '—'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {s.tab_switches > 0 && (
                                <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400" title="Tab switches">
                                  <MousePointer className="h-3 w-3" />{s.tab_switches}
                                </span>
                              )}
                              {s.fullscreen_exits > 0 && (
                                <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400" title="Fullscreen exits">
                                  <Minimize2 className="h-3 w-3" />{s.fullscreen_exits}
                                </span>
                              )}
                              {s.tab_switches === 0 && s.fullscreen_exits === 0 && (
                                <Shield className="h-3 w-3 text-emerald-400 dark:text-emerald-500" />
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-center">{getStatusBadge(s.status)}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 dark:text-slate-400" onClick={() => { setSelectedStudent(s); setShowDetailDialog(true) }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {s.status === 'in_progress' && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 dark:text-red-400" onClick={() => handleEndExam(s.student_id, s.id)}>
                                  <StopCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Violation Feed */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-800 dark:text-white">
              <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
              Live Violation Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {violationEvents.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-8 w-8 text-emerald-300 dark:text-emerald-500/50 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500">No violations detected</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {violationEvents.map(v => (
                  <div key={v.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start gap-2">
                      {v.violation_type === 'auto_submitted' ? (
                        <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                      ) : v.violation_type === 'tab_switch' ? (
                        <MousePointer className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                      ) : (
                        <Minimize2 className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{v.student_name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{v.exam_title}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">{v.details}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(v.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Sessions Summary */}
      {examSessions.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-800 dark:text-white">Active Exam Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left p-2 font-semibold text-slate-600 dark:text-slate-400">Exam</th>
                    <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Students</th>
                    <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Active</th>
                    <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Completed</th>
                    <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Auto-Sub</th>
                    <th className="text-center p-2 font-semibold text-slate-600 dark:text-slate-400">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {examSessions.map(session => (
                    <tr key={session.exam_id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{session.exam_subject}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{session.exam_title}</p>
                      </td>
                      <td className="p-2 text-center font-bold text-slate-700 dark:text-slate-300">{session.student_count}</td>
                      <td className="p-2 text-center">
                        <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] border-0">{session.active_count} active</Badge>
                      </td>
                      <td className="p-2 text-center text-slate-700 dark:text-slate-300">{session.completed_count}</td>
                      <td className="p-2 text-center">
                        {session.auto_submitted_count > 0 ? (
                          <Badge className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] border-0">{session.auto_submitted_count}</Badge>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-700 dark:text-slate-200">{session.avg_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── CLEAR TERM RECORDS DIALOG ─── */}
      <Dialog open={showClearDialog} onOpenChange={(open) => {
        setShowClearDialog(open)
        if (!open) setClearConfirmText('')
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Archive className="h-5 w-5" />
                Clear Term Records
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                Archive and/or delete previous term's exam records when a new term begins.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <Label className="text-xs text-slate-600 dark:text-slate-400">Term Being Cleared</Label>
              <Select value={clearTerm} onValueChange={setClearTerm}>
                <SelectTrigger className="h-9 mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600 dark:text-slate-400">Academic Session</Label>
              <Input value={clearSession} onChange={e => setClearSession(e.target.value)} placeholder="e.g. 2024/2025" className="h-9 mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>

            <div>
              <Label className="text-xs text-slate-600 dark:text-slate-400">Clear Records Before (Optional)</Label>
              <Input type="date" value={clearBeforeDate} onChange={e => setClearBeforeDate(e.target.value)} className="h-9 mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                Leave empty to clear ALL exam attempt records
              </p>
            </div>

            <div>
              <Label className="text-xs text-slate-600 dark:text-slate-400">Action</Label>
              <Select value={clearAction} onValueChange={(v: any) => setClearAction(v)}>
                <SelectTrigger className="h-9 mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="archive">
                    <div className="flex items-center gap-2">
                      <Archive className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                      Archive Only (keep original)
                    </div>
                  </SelectItem>
                  <SelectItem value="archive_and_delete">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                      Archive & Delete (recommended)
                    </div>
                  </SelectItem>
                  <SelectItem value="delete">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      Delete Only (permanent!)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 dark:text-red-300">
                  <p className="font-semibold">This action cannot be undone!</p>
                  <p className="mt-1">
                    All exam attempt records {clearBeforeDate ? `before ${clearBeforeDate}` : '(ALL time)'} will be processed.
                    {clearAction !== 'archive' && ' Deleted records cannot be recovered.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600 dark:text-slate-400">
                Type <span className="font-mono font-bold text-red-600 dark:text-red-400">CLEAR</span> to confirm
              </Label>
              <Input value={clearConfirmText} onChange={e => setClearConfirmText(e.target.value)} placeholder="CLEAR" className="h-9 mt-1 font-mono bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowClearDialog(false); setClearConfirmText('') }} className="h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" disabled={isClearing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearTermRecords} disabled={isClearing || clearConfirmText !== 'CLEAR'} className="h-9">
              {isClearing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
              ) : (
                <><Archive className="h-4 w-4 mr-2" />Clear Records</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              {selectedStudent?.status === 'in_progress' ? (
                <Activity className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              ) : selectedStudent?.is_auto_submitted ? (
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              )}
              Student Details
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 py-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Name:</span><span className="font-medium text-slate-900 dark:text-white">{selectedStudent.student_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">VIN:</span><span className="font-mono text-slate-700 dark:text-slate-300">{selectedStudent.vin_id}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Email:</span><span className="text-xs text-slate-700 dark:text-slate-300">{selectedStudent.student_email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Class:</span><span className="text-slate-700 dark:text-slate-300">{selectedStudent.student_class}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Exam:</span><span className="text-slate-700 dark:text-slate-300">{selectedStudent.exam_title}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subject:</span><span className="text-slate-700 dark:text-slate-300">{selectedStudent.exam_subject}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Status:</span>{getStatusBadge(selectedStudent.status)}</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">Progress</p>
                  <p className="font-bold text-blue-700 dark:text-blue-300">{selectedStudent.current_question}/{selectedStudent.total_questions}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">Score</p>
                  <p className="font-bold text-purple-700 dark:text-purple-300">{selectedStudent.percentage}%</p>
                </div>
                <div className={cn("rounded-lg p-2 text-center", selectedStudent.time_remaining < 300 ? "bg-red-50 dark:bg-red-950/30" : "bg-emerald-50 dark:bg-emerald-950/30")}>
                  <p className={cn("text-[10px]", selectedStudent.time_remaining < 300 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>Time Left</p>
                  <p className={cn("font-bold", selectedStudent.time_remaining < 300 ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300")}>
                    {selectedStudent.status === 'in_progress' ? formatTime(selectedStudent.time_remaining) : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Tab Switches', value: selectedStudent.tab_switches, color: 'red' },
                  { label: 'FS Exits', value: selectedStudent.fullscreen_exits, color: 'orange' },
                  { label: 'Warnings', value: selectedStudent.warnings, color: 'amber' },
                  { label: 'Unloads', value: selectedStudent.unload_count, color: 'purple' },
                ].map((v, i) => (
                  <div key={i} className={cn("rounded-lg p-2 text-center",
                    v.color === 'red' ? "bg-red-50 dark:bg-red-950/30" : v.color === 'orange' ? "bg-orange-50 dark:bg-orange-950/30" : v.color === 'amber' ? "bg-amber-50 dark:bg-amber-950/30" : "bg-purple-50 dark:bg-purple-950/30")}>
                    <p className={cn("text-[9px]",
                      v.color === 'red' ? "text-red-600 dark:text-red-400" : v.color === 'orange' ? "text-orange-600 dark:text-orange-400" : v.color === 'amber' ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400")}>{v.label}</p>
                    <p className={cn("text-lg font-bold",
                      v.color === 'red' ? "text-red-700 dark:text-red-300" : v.color === 'orange' ? "text-orange-700 dark:text-orange-300" : v.color === 'amber' ? "text-amber-700 dark:text-amber-300" : "text-purple-700 dark:text-purple-300")}>{v.value}</p>
                  </div>
                ))}
              </div>

              {selectedStudent.is_auto_submitted && (
                <div className="bg-red-100 dark:bg-red-950/40 rounded-lg p-2 text-xs text-red-700 dark:text-red-300">
                  <strong>Auto-Submitted:</strong> {selectedStudent.auto_submit_reason}
                </div>
              )}

              <div className="text-[10px] text-slate-400 dark:text-slate-500 space-y-0.5">
                <p>Started: {formatDate(selectedStudent.started_at)}</p>
                <p>Last Activity: {formatDate(selectedStudent.last_activity)}</p>
                <p>Time Spent: {formatTime(selectedStudent.time_spent)}</p>
                {selectedStudent.ip_address && <p>IP: {selectedStudent.ip_address}</p>}
                {selectedStudent.device_info && <p>Device: {selectedStudent.device_info}</p>}
              </div>

              {selectedStudent.status === 'in_progress' && (
                <Button variant="destructive" size="sm" className="w-full" onClick={() => { handleEndExam(selectedStudent.student_id, selectedStudent.id); setShowDetailDialog(false) }}>
                  <StopCircle className="h-4 w-4 mr-2" />Force End Exam
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}