// app/staff/exams/[id]/submissions/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Search, CheckCircle, Clock, AlertCircle,
  Loader2, RefreshCw, Users, Award, Eye, TrendingUp,
  BookOpen, Filter, ChevronDown, BarChart3, GraduationCap
} from 'lucide-react'

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

const getGradeColor = (pct: number) => {
  if (pct >= 70) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
  if (pct >= 50) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' }
  if (pct >= 40) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'in_progress':
      return {
        label: 'In Progress',
        icon: Clock,
        className: 'bg-blue-50 text-blue-700 border border-blue-200',
      }
    case 'completed':
      return {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      }
    case 'pending_theory':
      return {
        label: 'Pending Theory',
        icon: AlertCircle,
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      }
    case 'graded':
      return {
        label: 'Graded',
        icon: Award,
        className: 'bg-purple-50 text-purple-700 border border-purple-200',
      }
    default:
      return {
        label: status || 'Unknown',
        icon: Clock,
        className: 'bg-slate-50 text-slate-600 border border-slate-200',
      }
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status)
  const Icon = config.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
      config.className
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

const getInitials = (name: string) => {
  if (!name) return 'ST'
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
]

const getAvatarColor = (name: string) => {
  const idx = name.charCodeAt(0) % avatarColors.length
  return avatarColors[idx]
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconClass: string
  valueClass?: string
  trend?: string
}

const StatCard = ({ label, value, sub, icon: Icon, iconClass, valueClass, trend }: StatCardProps) => (
  <Card className="border border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={cn('text-2xl font-bold text-slate-900', valueClass)}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0 ml-3', iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
)

export default function ExamSubmissionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exam, setExam] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (showToast = false) => {
    if (!examId) {
      setError('No exam ID found')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to view submissions')
        setLoading(false)
        return
      }

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, title, subject, class, total_marks, total_questions, objective_max, theory_max')
        .eq('id', examId)
        .single()

      if (examError) {
        setError('Failed to load exam details')
        setLoading(false)
        return
      }

      setExam(examData)

      const { data: subs, error: subsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false })

      if (subsError) {
        setError('Failed to load submissions')
        setLoading(false)
        return
      }

      const studentIds = [...new Set((subs || []).map((s: any) => s.student_id))]

      const { data: caScores } = await supabase
        .from('ca_scores')
        .select('student_id, exam_id, ca1_score, ca2_score')
        .in('student_id', studentIds)
        .eq('exam_id', examId)

      const caScoreMap = new Map<string, { ca1: number; ca2: number; caTotal: number }>()
      ;(caScores || []).forEach((ca: any) => {
        caScoreMap.set(ca.student_id, {
          ca1: ca.ca1_score || 0,
          ca2: ca.ca2_score || 0,
          caTotal: (ca.ca1_score || 0) + (ca.ca2_score || 0),
        })
      })

      const enriched = await Promise.all((subs || []).map(async (sub: any) => {
        const { data: student } = await supabase
          .from('profiles')
          .select('full_name, email, photo_url, class')
          .eq('id', sub.student_id)
          .single()

        const objScore = sub.objective_score || 0

        let theoryScore = sub.theory_score || 0
        if (theoryScore === 0 && sub.theory_feedback) {
          try {
            const fb = typeof sub.theory_feedback === 'string'
              ? JSON.parse(sub.theory_feedback)
              : sub.theory_feedback
            if (fb?.total?.score !== undefined) theoryScore = Number(fb.total.score)
          } catch { /* ignore */ }
        }

        const caData = caScoreMap.get(sub.student_id)
        const caTotal = caData?.caTotal || 0
        const grandTotal = caTotal + objScore + theoryScore
        const percentage = Math.round(grandTotal)

        return {
          ...sub,
          student_name: student?.full_name || sub.student_name || 'Unknown',
          student_email: student?.email || sub.student_email || '',
          photo_url: student?.photo_url || null,
          student_class: student?.class || sub.student_class || '—',
          display_score: grandTotal,
          display_percentage: percentage,
          display_grade: getWAECGrade(percentage),
          ca_total: caTotal,
          exam_score: objScore + theoryScore,
        }
      }))

      setSubmissions(enriched)

      if (showToast) {
        toast.success(`Refreshed — ${enriched.length} submission${enriched.length !== 1 ? 's' : ''} loaded`)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load submissions')
      if (showToast) toast.error(e.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [examId])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData(true)
  }

  const handleBack = () => router.push(`/staff/exams/${examId}`)

  const filtered = submissions.filter(s => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = s.student_name?.toLowerCase().includes(q) || s.student_email?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  // ── Stats ──────────────────────────────────────────────────────────
  const completedCount = submissions.filter(s =>
    ['completed', 'graded', 'pending_theory'].includes(s.status)
  ).length
  const gradedCount = submissions.filter(s => s.status === 'graded').length
  const pendingCount = submissions.filter(s => s.status === 'pending_theory').length
  const averageScore = submissions.length > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.display_percentage || 0), 0) / submissions.length)
    : 0
  const passCount = submissions.filter(s => s.display_percentage >= 50).length
  const passRate = submissions.length > 0 ? Math.round((passCount / submissions.length) * 100) : 0

  // ── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-red-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Unable to Load Submissions</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Button onClick={handleBack} className="bg-slate-900 hover:bg-slate-800 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────
  if (loading && submissions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Loading submissions</p>
          <p className="text-xs text-slate-400 mt-0.5">Fetching student data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="mt-0.5 shrink-0 border-slate-200 hover:bg-slate-100 text-slate-700 h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {exam?.title || 'Exam Submissions'}
                </h1>
                <Badge className="bg-slate-100 text-slate-600 border-0 font-medium text-xs">
                  {submissions.length} student{submissions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {exam?.subject && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <BookOpen className="h-3 w-3" />
                    {exam.subject}
                  </span>
                )}
                {exam?.class && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <GraduationCap className="h-3 w-3" />
                      {exam.class}
                    </span>
                  </>
                )}
                {exam?.total_marks && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{exam.total_marks} marks</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 border-slate-200 hover:bg-white text-slate-700 h-8 self-start sm:self-auto"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* ── Stats Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total Students"
            value={submissions.length}
            icon={Users}
            iconClass="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            sub={`${submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0}% of total`}
            icon={CheckCircle}
            iconClass="bg-emerald-100 text-emerald-600"
            valueClass="text-emerald-700"
          />
          <StatCard
            label="Graded"
            value={gradedCount}
            icon={Award}
            iconClass="bg-purple-100 text-purple-600"
            valueClass="text-purple-700"
          />
          <StatCard
            label="Pending Theory"
            value={pendingCount}
            icon={AlertCircle}
            iconClass="bg-amber-100 text-amber-600"
            valueClass="text-amber-700"
          />
          <StatCard
            label="Average Score"
            value={`${averageScore}%`}
            sub={`Pass rate: ${passRate}%`}
            icon={BarChart3}
            iconClass="bg-blue-100 text-blue-600"
            valueClass="text-blue-700"
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'in_progress', 'completed', 'pending_theory', 'graded'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  statusFilter === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {s === 'all' ? 'All' : getStatusConfig(s).label}
                {s !== 'all' && (
                  <span className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
                    statusFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {submissions.filter(sub => sub.status === s).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No submissions found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No students have submitted this exam yet'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            {/* Table header info */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="text-slate-700">{filtered.length}</span> of{' '}
                <span className="text-slate-700">{submissions.length}</span> submissions
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">{passCount} passing</span>
                <span className="text-slate-300 mx-1">·</span>
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-slate-500">{submissions.length - passCount} failing</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-4 sm:pl-6 py-3">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center py-3">
                      CA Score
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center py-3">
                      Exam Score
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center py-3">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center py-3">
                      Grade
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center py-3">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center py-3">
                      Submitted
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-4 sm:pr-6 py-3">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((submission, index) => {
                    const pct = submission.display_percentage
                    const grade = submission.display_grade
                    const caTotal = submission.ca_total || 0
                    const examScore = submission.exam_score || 0
                    const colors = getGradeColor(pct)
                    const isGraded = submission.status === 'graded'

                    return (
                      <TableRow
                        key={submission.id}
                        className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-0"
                      >
                        {/* Student */}
                        <TableCell className="pl-4 sm:pl-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {submission.photo_url ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={submission.photo_url} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(submission.student_name)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className={cn(
                                  'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold',
                                  getAvatarColor(submission.student_name)
                                )}>
                                  {getInitials(submission.student_name)}
                                </div>
                              )}
                              <div className={cn(
                                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
                                colors.dot
                              )} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">
                                {submission.student_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                                {submission.student_class}
                                {submission.student_email && (
                                  <span className="hidden sm:inline"> · {submission.student_email}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* CA Score */}
                        <TableCell className="text-center py-3.5">
                          <span className="text-sm font-medium text-slate-600">
                            {caTotal > 0 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                                {caTotal}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </span>
                        </TableCell>

                        {/* Exam Score */}
                        <TableCell className="text-center py-3.5">
                          {examScore > 0 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                              {examScore}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Total + % */}
                        <TableCell className="text-center py-3.5">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn('text-sm font-bold', colors.text)}>
                              {submission.display_score}
                            </span>
                            <span className="text-[10px] text-slate-400">{pct}%</span>
                          </div>
                        </TableCell>

                        {/* Grade */}
                        <TableCell className="text-center py-3.5">
                          <span className={cn(
                            'inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold border',
                            colors.bg, colors.text, colors.border
                          )}>
                            {grade}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center py-3.5">
                          <StatusBadge status={submission.status} />
                        </TableCell>

                        {/* Submitted */}
                        <TableCell className="text-center py-3.5">
                          <span className="text-xs text-slate-500">
                            {formatDate(submission.submitted_at)}
                          </span>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right pr-4 sm:pr-6 py-3.5">
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/staff/exams/${examId}/submissions/${submission.id}`)
                            }
                            className={cn(
                              'h-7 text-xs px-3 font-medium transition-all',
                              isGraded
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            )}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {isGraded ? 'Review' : 'Grade'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {gradedCount} of {submissions.length} submissions graded
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 sm:w-40 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${submissions.length > 0 ? (gradedCount / submissions.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {submissions.length > 0 ? Math.round((gradedCount / submissions.length) * 100) : 0}% graded
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}