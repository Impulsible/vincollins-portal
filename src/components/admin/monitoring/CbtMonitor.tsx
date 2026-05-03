// components/admin/monitoring/CbtMonitor.tsx - UPDATED FOR YOUR DATABASE
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Loader2, AlertTriangle, MonitorPlay, User, Clock, BookOpen,
  Eye, RefreshCw, Search, Home, ChevronRight, Shield, XCircle,
  AlertCircle, Activity, Wifi, WifiOff, StopCircle, Maximize2,
  Users, Camera
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface ViolationRecord {
  id: string
  student_name: string
  student_email: string
  student_class: string
  exam_title: string
  exam_subject: string
  tab_switches: number
  fullscreen_exits: number
  warnings: number
  unload_count: number
  is_auto_submitted: boolean
  auto_submit_reason: string
  status: string
  started_at: string
  submitted_at: string
  time_spent: number
  objective_score: number
  percentage: number
}

export function CbtMonitor() {
  const [loading, setLoading] = useState(true)
  const [violations, setViolations] = useState<ViolationRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedViolation, setSelectedViolation] = useState<ViolationRecord | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [stats, setStats] = useState({
    total: 0,
    autoSubmitted: 0,
    warned: 0,
    tabViolations: 0,
    fullscreenViolations: 0,
    activeNow: 0
  })

  const loadViolations = useCallback(async () => {
    try {
      // Get all exam attempts with any violations
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('*')
        .or('tab_switches.gt.0,fullscreen_exits.gt.0,warnings.gt.0,unload_count.gt.0,is_auto_submitted.eq.true')
        .order('created_at', { ascending: false })
        .limit(100)

      // Get exam titles
      const examIds = [...new Set((attempts || []).map(a => a.exam_id))]
      const { data: exams } = await supabase.from('exams').select('id, title, subject').in('id', examIds)
      const examMap: Record<string, any> = {}
      exams?.forEach(e => { examMap[e.id] = e })

      const list = (attempts || []).map((a: any) => ({
        id: a.id,
        student_name: a.student_name || 'Unknown',
        student_email: a.student_email || '',
        student_class: a.student_class || '—',
        exam_title: examMap[a.exam_id]?.title || 'Unknown Exam',
        exam_subject: examMap[a.exam_id]?.subject || 'Unknown Subject',
        tab_switches: a.tab_switches || 0,
        fullscreen_exits: a.fullscreen_exits || 0,
        warnings: a.warnings || 0,
        unload_count: a.unload_count || 0,
        is_auto_submitted: a.is_auto_submitted || false,
        auto_submit_reason: a.auto_submit_reason || '',
        status: a.status || 'completed',
        started_at: a.started_at,
        submitted_at: a.submitted_at,
        time_spent: a.time_spent || 0,
        objective_score: a.objective_score || 0,
        percentage: a.percentage || 0
      }))

      setViolations(list)
      setStats({
        total: list.length,
        autoSubmitted: list.filter(v => v.is_auto_submitted).length,
        warned: list.filter(v => v.warnings > 0 && !v.is_auto_submitted).length,
        tabViolations: list.filter(v => v.tab_switches > 2).length,
        fullscreenViolations: list.filter(v => v.fullscreen_exits > 0).length,
        activeNow: list.filter(v => v.status === 'in_progress').length
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadViolations()
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadViolations, 5000)
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [autoRefresh, loadViolations])

  const getSeverityBadge = (v: ViolationRecord) => {
    if (v.is_auto_submitted) return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Auto-Submitted</Badge>
    if (v.tab_switches > 2 || v.fullscreen_exits > 1) return <Badge className="bg-orange-100 text-orange-700"><AlertTriangle className="h-3 w-3 mr-1" />Major Violation</Badge>
    if (v.warnings > 0) return <Badge className="bg-amber-100 text-amber-700"><AlertCircle className="h-3 w-3 mr-1" />Warned</Badge>
    return <Badge className="bg-emerald-100 text-emerald-700"><Shield className="h-3 w-3 mr-1" />Minor</Badge>
  }

  const filtered = violations.filter(v => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = v.student_name?.toLowerCase().includes(q) ||
      v.exam_subject?.toLowerCase().includes(q) ||
      v.exam_title?.toLowerCase().includes(q) ||
      v.student_email?.toLowerCase().includes(q)
    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'auto_submitted') return matchesSearch && v.is_auto_submitted
    if (statusFilter === 'warned') return matchesSearch && v.warnings > 0
    if (statusFilter === 'active') return matchesSearch && v.status === 'in_progress'
    return matchesSearch
  })

  const formatTime = (seconds: number) => {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const formatDate = (d: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-red-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading CBT Monitor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
        <Link href="/admin" className="hover:text-red-600 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 font-medium">CBT Monitor</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl"><MonitorPlay className="h-5 w-5 text-red-600" /></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">CBT Monitor</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {stats.total} violations • {stats.autoSubmitted} auto-submitted • {stats.activeNow} active now
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className="h-9 text-xs">
            <Activity className={cn("h-3.5 w-3.5 mr-1.5", autoRefresh && "animate-pulse")} />
            Live {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadViolations} className="h-9 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[11px] text-slate-400">Total</p><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-red-50"><CardContent className="p-3 text-center"><p className="text-[11px] text-red-600">Auto-Submitted</p><p className="text-xl font-bold text-red-700">{stats.autoSubmitted}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-amber-50"><CardContent className="p-3 text-center"><p className="text-[11px] text-amber-600">Warned</p><p className="text-xl font-bold text-amber-700">{stats.warned}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-orange-50"><CardContent className="p-3 text-center"><p className="text-[11px] text-orange-600">Tab Violations</p><p className="text-xl font-bold text-orange-700">{stats.tabViolations}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-purple-50"><CardContent className="p-3 text-center"><p className="text-[11px] text-purple-600">Fullscreen</p><p className="text-xl font-bold text-purple-700">{stats.fullscreenViolations}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-emerald-50"><CardContent className="p-3 text-center"><p className="text-[11px] text-emerald-600">Active Now</p><p className="text-xl font-bold text-emerald-700">{stats.activeNow}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by student, subject, or exam..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm bg-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-sm w-full sm:w-[160px] bg-white"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Violations</SelectItem>
            <SelectItem value="auto_submitted">Auto-Submitted</SelectItem>
            <SelectItem value="warned">Warned</SelectItem>
            <SelectItem value="active">Active Now</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Violations Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No violations detected</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left p-3 text-xs font-semibold text-slate-600">Student</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-600">Exam</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600">Tab</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600">Fullscreen</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600">Warnings</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600">Time</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600">Severity</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium">{v.student_name}</p>
                          <p className="text-[11px] text-slate-400">{v.student_class}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">{v.exam_subject}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{v.exam_title}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn("text-sm font-bold", v.tab_switches > 2 ? "text-red-600" : "text-slate-500")}>{v.tab_switches}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn("text-sm font-bold", v.fullscreen_exits > 0 ? "text-red-600" : "text-slate-500")}>{v.fullscreen_exits}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn("text-sm font-bold", v.warnings > 0 ? "text-amber-600" : "text-slate-500")}>{v.warnings}</span>
                      </td>
                      <td className="p-3 text-center text-sm text-slate-500">{formatTime(v.time_spent)}</td>
                      <td className="p-3 text-center">{getSeverityBadge(v)}</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedViolation(v); setShowDialog(true) }} className="h-8 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Violation Details
            </DialogTitle>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-3 py-2">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
                <p><strong>Student:</strong> {selectedViolation.student_name}</p>
                <p><strong>Email:</strong> {selectedViolation.student_email}</p>
                <p><strong>Class:</strong> {selectedViolation.student_class}</p>
                <p><strong>Exam:</strong> {selectedViolation.exam_title}</p>
                <p><strong>Subject:</strong> {selectedViolation.exam_subject}</p>
                <p><strong>Status:</strong> {selectedViolation.status}</p>
                <p><strong>Score:</strong> {selectedViolation.objective_score} ({selectedViolation.percentage}%)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-red-600">Tab Switches</p>
                  <p className="text-xl font-bold text-red-700">{selectedViolation.tab_switches}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-red-600">Fullscreen Exits</p>
                  <p className="text-xl font-bold text-red-700">{selectedViolation.fullscreen_exits}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-amber-600">Warnings</p>
                  <p className="text-xl font-bold text-amber-700">{selectedViolation.warnings}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-red-600">Unloads</p>
                  <p className="text-xl font-bold text-red-700">{selectedViolation.unload_count}</p>
                </div>
              </div>
              {selectedViolation.is_auto_submitted && (
                <div className="bg-red-100 rounded-lg p-3 text-sm text-red-700">
                  <strong>Auto-Submitted:</strong> {selectedViolation.auto_submit_reason || 'Violations exceeded limit'}
                </div>
              )}
              <div className="text-xs text-slate-400 space-y-1">
                <p><Clock className="h-3 w-3 inline mr-1" />Started: {formatDate(selectedViolation.started_at)}</p>
                <p><Clock className="h-3 w-3 inline mr-1" />Submitted: {formatDate(selectedViolation.submitted_at)}</p>
                <p><Clock className="h-3 w-3 inline mr-1" />Time Spent: {formatTime(selectedViolation.time_spent)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}