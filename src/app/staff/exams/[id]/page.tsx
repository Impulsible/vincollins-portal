// app/staff/exams/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft, Eye, Users, Clock, CheckCircle, AlertCircle,
  Calendar, BookOpen, Award, BarChart3, FileText, Settings,
  Download, Share2, Loader2, RefreshCw, Pencil, Trash2,
  TrendingUp, TrendingDown, GraduationCap, Target, Hash,
  Timer, Shield, Shuffle, RotateCcw, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import React from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Exam {
  id: string
  title: string
  subject: string
  class: string
  total_marks: number
  total_questions: number
  objective_max: number
  theory_max: number
  duration: number
  start_date: string
  end_date: string
  status: 'draft' | 'pending' | 'published' | 'active' | 'completed' | 'archived' | 'rejected'
  instructions?: string
  passing_percentage?: number
  pass_mark?: number
  has_theory?: boolean
  department?: string
  teacher_name?: string
  created_at: string
  updated_at: string
}

interface SubmissionStats {
  total: number
  completed: number
  inProgress: number
  pendingTheory: number
  graded: number
  averageScore: number
  passRate: number
  highestScore: number
  lowestScore: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (date?: string) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return 'Invalid date' }
}

const formatDateShort = (date?: string) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch { return 'Invalid date' }
}

const getStatusConfig = (status?: string) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft', className: 'bg-slate-100 text-slate-600 border border-slate-200' }
    case 'pending':
      return { label: 'Pending Approval', className: 'bg-amber-100 text-amber-700 border border-amber-200' }
    case 'published':
      return { label: 'Published', className: 'bg-blue-100 text-blue-700 border border-blue-200' }
    case 'active':
      return { label: 'Active', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
    case 'completed':
      return { label: 'Completed', className: 'bg-purple-100 text-purple-700 border border-purple-200' }
    case 'archived':
      return { label: 'Archived', className: 'bg-gray-100 text-gray-500 border border-gray-200' }
    case 'rejected':
      return { label: 'Rejected', className: 'bg-red-100 text-red-600 border border-red-200' }
    default:
      return { label: status || 'Unknown', className: 'bg-slate-100 text-slate-600 border border-slate-200' }
  }
}

const StatusBadge = ({ status }: { status?: string }) => {
  const cfg = getStatusConfig(status)
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', cfg.className)}>
      {cfg.label}
    </span>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  iconClass: string
  icon: React.ElementType
  valueClass?: string
}

const StatCard = ({ label, value, sub, iconClass, icon: Icon, valueClass }: StatCardProps) => (
  <Card className="border border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={cn('text-2xl font-bold text-slate-900', valueClass)}>{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0 ml-3', iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// ── Info row ───────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500 shrink-0 w-36">{label}</span>
    <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
  </div>
)

// ── Submission row ─────────────────────────────────────────────────────────────
const getSubStatusConfig = (status: string) => {
  switch (status) {
    case 'in_progress': return { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border border-blue-200' }
    case 'completed': return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    case 'pending_theory': return { label: 'Pending Theory', cls: 'bg-amber-50 text-amber-700 border border-amber-200' }
    case 'graded': return { label: 'Graded', cls: 'bg-purple-50 text-purple-700 border border-purple-200' }
    default: return { label: status || '—', cls: 'bg-slate-50 text-slate-600 border border-slate-200' }
  }
}

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
]
const avatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0, completed: 0, inProgress: 0, pendingTheory: 0,
    graded: 0, averageScore: 0, passRate: 0, highestScore: 0, lowestScore: 0,
  })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (showToast = false) => {
    if (!examId) { setLoading(false); return }
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Please log in again'); setLoading(false); return }

      // Exam
      const { data: examData, error: examErr } = await supabase
        .from('exams').select('*').eq('id', examId).single()
      if (examErr) throw examErr
      setExam(examData)

      // Submissions
      const { data: submissions, error: subErr } = await supabase
        .from('exam_attempts').select('*').eq('exam_id', examId)
      if (subErr) throw subErr

      const total = submissions?.length || 0
      const completed = submissions?.filter(s => ['completed', 'graded'].includes(s.status)).length || 0
      const inProgress = submissions?.filter(s => s.status === 'in_progress').length || 0
      const pendingTheory = submissions?.filter(s => s.status === 'pending_theory').length || 0
      const graded = submissions?.filter(s => s.status === 'graded').length || 0

      let totalScore = 0, highest = 0, lowest = Infinity, passed = 0
      const passMark = examData?.passing_percentage ?? examData?.pass_mark ?? 50

      submissions?.forEach(sub => {
        const obj = sub.objective_score || 0
        const thy = sub.theory_score || 0
        const score = obj + thy
        totalScore += score
        if (score > highest) highest = score
        if (score > 0 && score < lowest) lowest = score
        if (examData?.total_marks && (score / examData.total_marks) * 100 >= passMark) passed++
      })

      const average = total > 0 ? Math.round(totalScore / total) : 0
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

      setStats({
        total, completed, inProgress, pendingTheory, graded,
        averageScore: average, passRate,
        highestScore: highest,
        lowestScore: lowest === Infinity ? 0 : lowest,
      })

      // Recent submissions enriched with student profile
      const recent = [...(submissions || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)

      const enriched = await Promise.all(recent.map(async sub => {
        const { data: student } = await supabase
          .from('profiles').select('full_name, email, photo_url, class')
          .eq('id', sub.student_id).single()
        return {
          ...sub,
          student_name: student?.full_name || 'Unknown Student',
          student_email: student?.email || '',
          student_class: student?.class || '—',
          photo_url: student?.photo_url || null,
        }
      }))
      setRecentSubmissions(enriched)

      if (showToast) toast.success('Data refreshed')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to load exam data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [examId])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => { setRefreshing(true); loadData(true) }

  const handleViewSubmissions = () => {
    const path = `/staff/exams/${examId}/submissions`
    try { router.push(path) } catch { window.location.href = path }
  }

  const handleDeleteExam = async () => {
    if (!confirm('Delete this exam? This action cannot be undone.')) return
    try {
      const { error } = await supabase.from('exams').delete().eq('id', examId)
      if (error) throw error
      toast.success('Exam deleted')
      router.push('/staff/exams')
    } catch (err: any) { toast.error(err.message || 'Failed to delete exam') }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Loading exam details</p>
          <p className="text-xs text-slate-400 mt-0.5">Fetching data from database…</p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-slate-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-800">Exam Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">This exam doesn't exist or has been removed.</p>
        </div>
        <Button onClick={() => router.push('/staff/exams')} className="bg-slate-900 hover:bg-slate-800 text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Button>
      </div>
    )
  }

  const passingScore = exam.passing_percentage ?? exam.pass_mark ?? 50

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            {/* Left: back + title */}
            <div className="flex items-start gap-3 min-w-0">
              <Button
                variant="outline" size="sm"
                onClick={() => router.push('/staff/exams')}
                className="mt-0.5 shrink-0 border-slate-200 hover:bg-slate-50 h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{exam.title}</h1>
                  <StatusBadge status={exam.status} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {[
                    exam.subject,
                    exam.class,
                    `${exam.total_questions} Qs`,
                    `${exam.total_marks} marks`,
                    `${exam.duration} min`,
                  ].map((item, i, arr) => (
                    <React.Fragment key={item}>
                      <span className="text-xs text-slate-500">{item}</span>
                      {i < arr.length - 1 && <span className="text-slate-300 text-xs">·</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                variant="outline" size="sm"
                onClick={handleRefresh} disabled={refreshing}
                className="border-slate-200 h-8 text-xs"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => router.push(`/staff/exams/${examId}/edit`)}
                className="border-slate-200 h-8 text-xs"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={handleDeleteExam}
                className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Submissions" value={stats.total}
            icon={Users} iconClass="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Completed" value={stats.completed}
            sub={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total`}
            icon={CheckCircle} iconClass="bg-emerald-100 text-emerald-600"
            valueClass="text-emerald-700"
          />
          <StatCard
            label="In Progress" value={stats.inProgress}
            icon={Clock} iconClass="bg-blue-100 text-blue-600"
            valueClass="text-blue-700"
          />
          <StatCard
            label="Pending Theory" value={stats.pendingTheory}
            icon={AlertCircle} iconClass="bg-amber-100 text-amber-600"
            valueClass="text-amber-700"
          />
          <StatCard
            label="Graded" value={stats.graded}
            icon={Award} iconClass="bg-purple-100 text-purple-600"
            valueClass="text-purple-700"
          />
          <StatCard
            label="Pass Rate" value={`${stats.passRate}%`}
            sub={`Avg: ${stats.averageScore} pts`}
            icon={TrendingUp} iconClass="bg-teal-100 text-teal-600"
            valueClass="text-teal-700"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm">
            <TabsList className="w-full grid grid-cols-3 bg-transparent gap-1 h-auto">
              {[
                { value: 'overview', label: 'Overview', icon: BarChart3 },
                { value: 'submissions', label: 'Submissions', icon: Users },
                { value: 'settings', label: 'Settings', icon: Settings },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all h-auto',
                      'data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm',
                      'data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-50',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {tab.label}
                    {tab.value === 'submissions' && stats.total > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold leading-none">
                        {stats.total}
                      </span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* ── Overview ──────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Exam info card */}
              <Card className="lg:col-span-2 border border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                    </div>
                    Exam Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <div>
                      <InfoRow label="Subject" value={exam.subject} />
                      <InfoRow label="Class" value={exam.class} />
                      <InfoRow label="Department" value={exam.department || '—'} />
                      <InfoRow label="Teacher" value={exam.teacher_name || '—'} />
                      <InfoRow label="Duration" value={`${exam.duration} minutes`} />
                      <InfoRow label="Status" value={<StatusBadge status={exam.status} />} />
                    </div>
                    <div>
                      <InfoRow label="Total Marks" value={<span className="font-bold text-slate-900">{exam.total_marks}</span>} />
                      <InfoRow label="Total Questions" value={exam.total_questions} />
                      <InfoRow label="Objective Max" value={exam.objective_max ?? '—'} />
                      <InfoRow label="Theory Max" value={exam.theory_max ?? '—'} />
                      <InfoRow
                        label="Has Theory"
                        value={
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                            exam.has_theory
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          )}>
                            {exam.has_theory ? 'Yes' : 'No'}
                          </span>
                        }
                      />
                      <InfoRow label="Passing Score" value={`${passingScore}%`} />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Start Date</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatDate(exam.start_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">End Date</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatDate(exam.end_date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {exam.instructions && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Instructions
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                        {exam.instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right column */}
              <div className="space-y-4">
                {/* Quick actions */}
                <Card className="border border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold text-slate-700">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <button
                      onClick={handleViewSubmissions}
                      disabled={stats.total === 0}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        stats.total > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                      )}
                    >
                      <Eye className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">View Submissions</span>
                      {stats.total > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                          {stats.total}
                        </span>
                      )}
                    </button>

                    {[
                      { label: 'View Results', icon: Award, path: `/staff/exams/${examId}/results` },
                      { label: 'Analytics', icon: BarChart3, path: `/staff/exams/${examId}/analytics` },
                    ].map(({ label, icon: Icon, path }) => (
                      <button
                        key={label}
                        onClick={() => router.push(path)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                      >
                        <Icon className="h-4 w-4 text-slate-500 shrink-0" />
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    ))}

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all">
                      <Download className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="flex-1 text-left">Export Data</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all">
                      <Share2 className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="flex-1 text-left">Share Exam</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </CardContent>
                </Card>

                {/* Score summary */}
                {stats.total > 0 && (
                  <Card className="border border-slate-200/80 shadow-sm bg-white">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-semibold text-slate-700">Score Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {[
                        { label: 'Average', value: `${stats.averageScore} pts`, icon: TrendingUp, color: 'text-blue-600' },
                        { label: 'Highest', value: `${stats.highestScore} pts`, icon: TrendingUp, color: 'text-emerald-600' },
                        { label: 'Lowest', value: `${stats.lowestScore} pts`, icon: TrendingDown, color: 'text-red-500' },
                        { label: 'Pass Rate', value: `${stats.passRate}%`, icon: Target, color: 'text-violet-600' },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Icon className={cn('h-3.5 w-3.5', color)} />
                            {label}
                          </span>
                          <span className={cn('text-sm font-bold', color)}>{value}</span>
                        </div>
                      ))}
                      {/* Progress bar */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                          <span>Grading progress</span>
                          <span>{stats.graded}/{stats.total}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${stats.total > 0 ? (stats.graded / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Submissions ───────────────────────────────────────────────── */}
          <TabsContent value="submissions">
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    Student Submissions
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={handleViewSubmissions}
                    disabled={stats.total === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {/* Mini stat pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total', value: stats.total, cls: 'bg-slate-50 border-slate-200', vCls: 'text-slate-800' },
                    { label: 'Completed', value: stats.completed, cls: 'bg-emerald-50 border-emerald-200', vCls: 'text-emerald-700' },
                    { label: 'In Progress', value: stats.inProgress, cls: 'bg-blue-50 border-blue-200', vCls: 'text-blue-700' },
                    { label: 'Graded', value: stats.graded, cls: 'bg-purple-50 border-purple-200', vCls: 'text-purple-700' },
                  ].map(({ label, value, cls, vCls }) => (
                    <div key={label} className={cn('rounded-xl border p-3', cls)}>
                      <p className="text-[11px] font-medium text-slate-500">{label}</p>
                      <p className={cn('text-xl font-bold mt-0.5', vCls)}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent list */}
                {recentSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Users className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No submissions yet</p>
                    <p className="text-xs text-slate-400 mt-1">Students haven&apos;t started this exam</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Submissions</p>
                    {recentSubmissions.map(sub => {
                      const statusCfg = getSubStatusConfig(sub.status)
                      const score = (sub.objective_score || 0) + (sub.theory_score || 0)
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {sub.photo_url ? (
                              <img
                                src={sub.photo_url}
                                alt={sub.student_name}
                                className="h-8 w-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className={cn(
                                'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0',
                                avatarColor(sub.student_name),
                              )}>
                                {sub.student_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{sub.student_name}</p>
                              <p className="text-xs text-slate-400 truncate">{sub.student_class}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn('hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', statusCfg.cls)}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {score} pts
                            </span>
                            <button
                              onClick={() => router.push(`/staff/exams/${examId}/submissions/${sub.id}`)}
                              className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {stats.total > 6 && (
                      <button
                        onClick={handleViewSubmissions}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all mt-2"
                      >
                        View all {stats.total} submissions
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Settings ──────────────────────────────────────────────────── */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Exam options */}
              <Card className="border border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-slate-600" />
                    </div>
                    Exam Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="divide-y divide-slate-100">
                    {[
                      { label: 'Allow Retakes', value: 'Disabled', enabled: false, icon: RotateCcw },
                      { label: 'Show Results Instantly', value: 'Enabled', enabled: true, icon: Eye },
                      { label: 'Randomise Questions', value: 'Enabled', enabled: true, icon: Shuffle },
                      { label: 'Has Theory Section', value: exam.has_theory ? 'Yes' : 'No', enabled: !!exam.has_theory, icon: FileText },
                    ].map(({ label, value, enabled, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between py-3">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          {label}
                        </span>
                        <span className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                          enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200',
                        )}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grading settings — populated from DB */}
              <Card className="border border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-violet-600" />
                    </div>
                    Grading Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="divide-y divide-slate-100">
                    {[
                      { label: 'Passing Score', value: `${passingScore}%`, icon: Target },
                      { label: 'Grading System', value: 'WAEC', icon: Award },
                      { label: 'Auto-grade Objective', value: 'Enabled', icon: CheckCircle },
                      { label: 'Objective Max', value: `${exam.objective_max ?? '—'} marks`, icon: Hash },
                      { label: 'Theory Max', value: `${exam.theory_max ?? '—'} marks`, icon: FileText },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between py-3">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="border border-slate-200/80 shadow-sm bg-white md:col-span-2">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Created', value: formatDate(exam.created_at) },
                      { label: 'Last Updated', value: formatDate(exam.updated_at) },
                      { label: 'Exam ID', value: exam.id },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-xs font-medium text-slate-700 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="border-slate-200 text-xs h-8">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Export Settings
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-200 text-xs h-8">
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Reset to Default
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}