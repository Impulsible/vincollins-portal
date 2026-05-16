// src/app/staff/exams/[id]/submissions/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Search, CheckCircle, Clock, AlertCircle,
  Loader2, RefreshCw, Users, BookOpen, Award, Download, Eye
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// HELPERS
// ============================================
const getWAECGrade = (pct: number): string => {
  if (pct >= 75) return 'A1'
  if (pct >= 70) return 'B2'
  if (pct >= 65) return 'B3'
  if (pct >= 60) return 'C4'
  if (pct >= 55) return 'C5'
  if (pct >= 50) return 'C6'
  if (pct >= 45) return 'D7'
  if (pct >= 40) return 'E8'
  return 'F9'
}

const getGradeBadge = (pct: number) => {
  const g = getWAECGrade(pct)
  const colors: Record<string, string> = {
    'A1': 'bg-emerald-100 text-emerald-700',
    'B2': 'bg-blue-100 text-blue-700',
    'B3': 'bg-sky-100 text-sky-700',
    'C4': 'bg-teal-100 text-teal-700',
    'C5': 'bg-amber-100 text-amber-700',
    'C6': 'bg-orange-100 text-orange-700',
    'D7': 'bg-yellow-100 text-yellow-700',
    'E8': 'bg-red-100 text-red-400',
    'F9': 'bg-red-200 text-red-600',
  }
  return <Badge className={cn("text-xs", colors[g] || 'bg-slate-100')}>{g}</Badge>
}

const getInitials = (name: string) => {
  if (!name) return 'ST'
  const parts = name.split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 text-xs"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
    case 'completed': return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
    case 'pending_theory': return <Badge className="bg-amber-100 text-amber-700 text-xs"><AlertCircle className="mr-1 h-3 w-3" />Pending Theory</Badge>
    case 'graded': return <Badge className="bg-purple-100 text-purple-700 text-xs"><Award className="mr-1 h-3 w-3" />Graded</Badge>
    default: return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ExamSubmissionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const loadData = useCallback(async () => {
    if (!examId) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      // Get exam details
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()
      setExam(examData)

      // Get ALL submissions
      const { data: subs } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false })

      // Enrich with student photos
      const enriched = await Promise.all((subs || []).map(async (sub: any) => {
        const { data: student } = await supabase
          .from('profiles')
          .select('photo_url, class')
          .eq('id', sub.student_id)
          .single()

        return {
          ...sub,
          photo_url: student?.photo_url || null,
          student_class: student?.class || sub.student_class || '—'
        }
      }))

      setSubmissions(enriched)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => { loadData() }, [loadData])

  // Filter submissions
  const filtered = submissions.filter(s => {
    const q = searchQuery.toLowerCase()
    const match = s.student_name?.toLowerCase().includes(q) || s.student_email?.toLowerCase().includes(q)
    if (activeTab === 'all') return match
    return match && s.status === activeTab
  })

  // Group by class
  const groupedByClass = filtered.reduce((acc: Record<string, any[]>, s) => {
    const cls = s.student_class || 'Unknown'
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(s)
    return acc
  }, {})

  const classOrder = Object.keys(groupedByClass).sort()

  // Stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending_theory').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    avgScore: submissions.filter(s => s.status === 'graded').length > 0
      ? Math.round(submissions.filter(s => s.status === 'graded').reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.filter(s => s.status === 'graded').length)
      : 0
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
  }

  const handleExport = () => {
    const csv = [['Name', 'Class', 'Status', 'Score', '%', 'Grade', 'Passed', 'Submitted'].join(',')]
    filtered.forEach(s => {
      csv.push([
        s.student_name, s.student_class, s.status,
        `${s.total_score || 0}`, `${s.percentage || 0}%`,
        getWAECGrade(s.percentage || 0), s.is_passed ? 'Yes' : 'No',
        formatDate(s.submitted_at)
      ].join(','))
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exam?.title || 'submissions'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="sm" onClick={() => router.push('/staff/exams')} className="shrink-0">
            <ArrowLeft className="mr-1.5 h-4 w-4" />Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{exam?.title || 'Submissions'}</h1>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{exam?.subject} • {exam?.class} • {submissions.length} students</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-1.5 h-4 w-4" />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" />Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { l: 'Total', v: stats.total, i: Users, c: 'text-blue-600 bg-blue-50' },
          { l: 'Pending', v: stats.pending, i: AlertCircle, c: 'text-amber-600 bg-amber-50' },
          { l: 'Graded', v: stats.graded, i: Award, c: 'text-purple-600 bg-purple-50' },
          { l: 'Avg Score', v: `${stats.avgScore}%`, i: BookOpen, c: 'text-emerald-600 bg-emerald-50' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", s.c.split(' ')[1])}>
                <s.i className={cn("h-4 w-4", s.c.split(' ')[0])} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">{s.l}</p>
                <p className="text-lg font-bold">{s.v}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm bg-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          {[
            { value: 'all', label: 'All', count: stats.total },
            { value: 'pending_theory', label: 'Pending Theory', count: stats.pending },
            { value: 'graded', label: 'Graded', count: stats.graded },
            { value: 'completed', label: 'Completed', count: stats.completed },
            { value: 'in_progress', label: 'In Progress', count: submissions.filter(s => s.status === 'in_progress').length },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-slate-200">
              {tab.label}
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grouped by Class */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No submissions found</p>
          </CardContent>
        </Card>
      ) : (
        classOrder.map(cls => (
          <div key={cls} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1">{cls}</Badge>
              <span className="text-xs text-slate-400">{groupedByClass[cls].length} student{groupedByClass[cls].length !== 1 ? 's' : ''}</span>
            </div>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs sm:text-sm">Student</TableHead>
                        <TableHead className="text-xs sm:text-sm text-center">Score</TableHead>
                        <TableHead className="text-xs sm:text-sm text-center">%</TableHead>
                        <TableHead className="text-xs sm:text-sm text-center">Grade</TableHead>
                        <TableHead className="text-xs sm:text-sm text-center">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm text-center">Submitted</TableHead>
                        <TableHead className="text-xs sm:text-sm text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedByClass[cls].map(s => (
                        <TableRow key={s.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="h-7 w-7 shrink-0 hidden sm:flex">
                                <AvatarImage src={s.photo_url || undefined} />
                                <AvatarFallback className="text-[10px]">{getInitials(s.student_name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-xs sm:text-sm truncate">{s.student_name}</p>
                                <p className="text-[10px] text-slate-500 truncate sm:hidden">{s.student_class}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("font-semibold text-xs sm:text-sm", (s.percentage || 0) >= 50 ? 'text-emerald-600' : 'text-red-600')}>
                              {s.total_score || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">{s.percentage || 0}%</TableCell>
                          <TableCell className="text-center">{getGradeBadge(s.percentage || 0)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(s.status)}</TableCell>
                          <TableCell className="text-center text-[10px] sm:text-xs text-slate-500">{formatDate(s.submitted_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => router.push(`/staff/exams/${examId}/submissions/${s.id}`)}
                              className="h-7 text-xs"
                            >
                              <Eye className="mr-1 h-3 w-3" />View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}

      {/* Progress Summary */}
      {submissions.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Grading Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Graded</span>
                <span>{stats.graded} of {stats.pending + stats.graded + stats.completed}</span>
              </div>
              <Progress 
                value={stats.pending + stats.graded + stats.completed > 0 
                  ? (stats.graded / (stats.pending + stats.graded + stats.completed)) * 100 
                  : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}