// app/student/results/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle, XCircle, BookOpen, GraduationCap,
  Calendar, ArrowLeft, Home, ChevronRight, AlertCircle,
  FileText, Trophy, Target, BarChart3, Award, CheckCheck,
  X, Loader2, Minus, Printer, TrendingUp, Star, Zap,
  MessageSquare, Activity, PieChart, BookMarked,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────
interface ExamResult {
  id: string; exam_id: string; exam_title: string; exam_subject: string
  exam_class: string; status: string; percentage: number; total_score: number
  total_marks: number; objective_score: number; objective_total: number
  theory_score: number | null; theory_total: number
  ca1_score: number | null; ca2_score: number | null
  is_passed: boolean; submitted_at: string; passing_percentage: number
  time_spent: number; correct_count: number; incorrect_count: number
  unanswered_count: number; teacher_feedback: string | null
}

interface StudentProfile {
  id: string; full_name: string; email: string; class: string
  department: string; photo_url?: string
}

// ─── Helpers ─────────────────────────────────────────
const getGradeConfig = (percentage: number) => {
  if (percentage >= 75) return { grade: 'A1', label: 'Excellent',  color: 'emerald', text: 'text-emerald-600', bg: 'bg-emerald-50',   border: 'border-emerald-200', bar: 'bg-emerald-500',   glow: 'shadow-emerald-200', ring: 'ring-emerald-200', icon: Trophy,      dark: 'bg-emerald-600' }
  if (percentage >= 70) return { grade: 'B2', label: 'Very Good',  color: 'blue',    text: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    bar: 'bg-blue-500',     glow: 'shadow-blue-200',    ring: 'ring-blue-200',    icon: Award,       dark: 'bg-blue-600' }
  if (percentage >= 65) return { grade: 'B3', label: 'Good',       color: 'sky',     text: 'text-sky-600',     bg: 'bg-sky-50',      border: 'border-sky-200',     bar: 'bg-sky-500',      glow: 'shadow-sky-200',     ring: 'ring-sky-200',     icon: Award,       dark: 'bg-sky-600' }
  if (percentage >= 60) return { grade: 'C4', label: 'Credit',     color: 'cyan',    text: 'text-cyan-600',    bg: 'bg-cyan-50',     border: 'border-cyan-200',    bar: 'bg-cyan-500',     glow: 'shadow-cyan-200',    ring: 'ring-cyan-200',    icon: Target,      dark: 'bg-cyan-600' }
  if (percentage >= 55) return { grade: 'C5', label: 'Credit',     color: 'teal',    text: 'text-teal-600',    bg: 'bg-teal-50',     border: 'border-teal-200',    bar: 'bg-teal-500',     glow: 'shadow-teal-200',    ring: 'ring-teal-200',    icon: Target,      dark: 'bg-teal-600' }
  if (percentage >= 50) return { grade: 'C6', label: 'Credit',     color: 'amber',   text: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   bar: 'bg-amber-500',    glow: 'shadow-amber-200',   ring: 'ring-amber-200',   icon: CheckCheck,  dark: 'bg-amber-600' }
  if (percentage >= 45) return { grade: 'D7', label: 'Pass',       color: 'orange',  text: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200',  bar: 'bg-orange-500',   glow: 'shadow-orange-200',  ring: 'ring-orange-200',  icon: CheckCheck,  dark: 'bg-orange-600' }
  if (percentage >= 40) return { grade: 'E8', label: 'Pass',       color: 'yellow',  text: 'text-yellow-600',  bg: 'bg-yellow-50',   border: 'border-yellow-200',  bar: 'bg-yellow-500',   glow: 'shadow-yellow-200',  ring: 'ring-yellow-200',  icon: Minus,       dark: 'bg-yellow-600' }
  return               { grade: 'F9', label: 'Fail',       color: 'red',     text: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     bar: 'bg-red-500',      glow: 'shadow-red-200',     ring: 'ring-red-200',     icon: X,           dark: 'bg-red-600' }
}

const fmtTime = (seconds?: number) => {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const fmtDate = (date?: string) => {
  if (!date) return '—'
  try { return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
  catch { return '—' }
}

// ─── Animated Score Ring ──────────────────────────────
function ScoreRing({ percentage, size = 160, grade }: { percentage: number; size?: number; grade: ReturnType<typeof getGradeConfig> }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={cn(
        'absolute inset-2 rounded-full opacity-20 blur-md',
        grade.bar
      )} />
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          className={grade.bar.replace('bg-', 'stroke-')}
          strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          <p className={cn('font-black leading-none', size > 120 ? 'text-4xl' : 'text-2xl', grade.text)}>
            {percentage}%
          </p>
          <p className="text-slate-500 text-xs mt-1 font-medium">{grade.label}</p>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Section Score Bar ────────────────────────────────
function ScoreBar({
  label, score, total, color, delay = 0, pending = false, sublabel,
}: {
  label: string; score: number; total: number; color: string
  delay?: number; pending?: boolean; sublabel?: string
}) {
  const pct = total > 0 ? (score / total) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {sublabel && <span className="text-[10px] text-slate-400 ml-1.5">{sublabel}</span>}
        </div>
        {pending ? (
          <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px]">
            <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
          </Badge>
        ) : (
          <span className="text-sm font-bold text-slate-800">{score}<span className="text-slate-400 font-normal">/{total}</span></span>
        )}
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: pending ? '0%' : `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
        />
      </div>
      {!pending && (
        <p className="text-[10px] text-slate-400">{Math.round(pct)}% of section</p>
      )}
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', color.replace('text-', 'bg-').replace('-600', '-100'))}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <p className="text-base font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 font-medium text-center leading-tight">{label}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────
export default function StudentResultDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ─── FIXED: Load result with grade progression ──
  const loadResult = useCallback(async () => {
    if (!examId) return
    setLoading(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      const { data: pd } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!pd) { setError('Profile not found'); setLoading(false); return }

      setProfile({
        id: pd.id,
        full_name: pd.full_name || 'Student',
        email: pd.email || '',
        class: pd.class || '—',
        department: pd.department || '—',
        photo_url: pd.photo_url || undefined
      })

      const { data: att } = await supabase.from('exam_attempts').select('*')
        .eq('exam_id', examId).eq('student_id', session.user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (!att) { setError('No submission found for this exam'); setLoading(false); return }

      const { data: exam } = await supabase.from('exams').select('*').eq('id', att.exam_id).maybeSingle()

      let theoryScore: number | null = null
      let teacherFeedback: string | null = null
      if (att.theory_feedback) {
        try {
          const fb = typeof att.theory_feedback === 'string' ? JSON.parse(att.theory_feedback) : att.theory_feedback
          if (fb?.total?.score !== undefined) theoryScore = Number(fb.total.score)
          if (fb?.total?.feedback) teacherFeedback = fb.total.feedback
        } catch { /* ignore */ }
      }

      const { data: ca } = await supabase.from('ca_scores')
        .select('ca1_score, ca2_score, total_score, percentage, grade')
        .eq('student_id', session.user.id).eq('exam_id', examId).maybeSingle()

      const ca1 = ca?.ca1_score != null ? Number(ca.ca1_score) : null
      const ca2 = ca?.ca2_score != null ? Number(ca.ca2_score) : null
      const hasCA = ca1 !== null && ca2 !== null
      const hasTheory = theoryScore !== null && theoryScore > 0

      // ✅ Get exam configuration
      const objectiveMax = exam?.objective_max ?? 20
      const theoryMax = 60 - objectiveMax
      const totalExamMax = 60

      // Get scores
      const objectiveScore = Number(att.objective_score) || 0
      const theoryValue = theoryScore || 0

      // Calculate CA total (out of 40)
      const ca1Value = ca1 || 0
      const ca2Value = ca2 || 0
      const caTotal = ca1Value + ca2Value

      // ✅ Grade Progression - Calculate based on what's available
      let percentage: number
      let totalScore: number
      let totalMarks: number

      if (hasCA) {
        // ✅ When CA is available, total is ALWAYS out of 100
        // Even if theory is pending, it's counted as 0
        totalScore = caTotal + objectiveScore + theoryValue  // theoryValue is 0 if pending
        totalMarks = 100
        percentage = Math.round((totalScore / totalMarks) * 100)
      } else if (hasTheory) {
        // ✅ No CA, but theory available: out of 60
        totalScore = objectiveScore + theoryValue
        totalMarks = 60
        percentage = Math.round((totalScore / totalMarks) * 100)
      } else {
        // ✅ Only Objective: out of objectiveMax
        totalScore = objectiveScore
        totalMarks = objectiveMax
        percentage = Math.round((totalScore / totalMarks) * 100)
      }

      // ✅ Safety: Cap at 100
      if (percentage > 100) percentage = 100

      const finalGrade = getGradeConfig(percentage).grade
      const isPassed = finalGrade !== 'F9'

      setResult({
        id: att.id,
        exam_id: att.exam_id,
        exam_title: exam?.title || 'Untitled Exam',
        exam_subject: exam?.subject || '—',
        exam_class: exam?.class || '—',
        status: att.status,
        percentage,
        total_score: totalScore,
        total_marks: totalMarks,
        objective_score: objectiveScore,
        objective_total: objectiveMax,
        theory_score: theoryValue,
        theory_total: theoryMax,
        ca1_score: ca1,
        ca2_score: ca2,
        is_passed: isPassed,
        submitted_at: att.submitted_at,
        passing_percentage: exam?.passing_percentage || 40,
        time_spent: att.time_spent,
        correct_count: att.correct_count || 0,
        incorrect_count: att.incorrect_count || 0,
        unanswered_count: att.unanswered_count || 0,
        teacher_feedback: teacherFeedback,
      })
    } catch (err) {
      console.error(err); setError('Failed to load result. Please try again.')
    } finally { setLoading(false) }
  }, [examId, router])

  useEffect(() => { loadResult() }, [loadResult])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' }); toast.success('Logged out'); router.push('/portal')
  }

  // ── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          <div className={cn('flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-fit">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <BookMarked className="h-8 w-8 text-white" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Loading your result</p>
                <p className="text-sm text-slate-400 mt-1">Fetching exam details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────
  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          <div className={cn('flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] px-4', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="max-w-md w-full border-0 shadow-xl rounded-3xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500" />
                <CardContent className="text-center py-12 px-8">
                  <div className="h-20 w-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6 border border-red-100">
                    <AlertCircle className="h-10 w-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Result Not Found</h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">{error || 'No submission found for this exam.'}</p>
                  <Button onClick={() => router.push('/student/results')} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Results
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // ── Data ───────────────────────────────────────────
  const gradeConfig = getGradeConfig(result.percentage)
  const GradeIcon = gradeConfig.icon
  const theoryPending = result.status === 'pending_theory' || (result.theory_score === 0 && result.theory_total > 0)
  const hasCA = result.ca1_score !== null && result.ca2_score !== null
  const caTotal = (result.ca1_score || 0) + (result.ca2_score || 0)
  const theoryScore = result.theory_score || 0
  const totalQuestions = result.correct_count + result.incorrect_count + result.unanswered_count
  const correctPct = totalQuestions > 0 ? (result.correct_count / totalQuestions) * 100 : 0
  const incorrectPct = totalQuestions > 0 ? (result.incorrect_count / totalQuestions) * 100 : 0
  const skippedPct = totalQuestions > 0 ? (result.unanswered_count / totalQuestions) * 100 : 0
  const objectivePercentage = result.objective_total > 0 ? Math.round((result.objective_score / result.objective_total) * 100) : 0
  const theoryPercentage = result.theory_total > 0 ? Math.round((theoryScore / result.theory_total) * 100) : 0
  const caPercentage = 40 > 0 ? Math.round((caTotal / 40) * 100) : 0

  // Calculate percentage of total for each section
  const totalWeight = result.total_marks

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <Header user={{
        id: profile?.id || '', name: profile?.full_name || '',
        firstName: profile?.full_name?.split(' ')[0] || 'Student',
        email: profile?.email || '', role: 'student' as const,
        avatar: profile?.photo_url || undefined, isAuthenticated: true,
      }} onLogout={handleLogout} />

      <div className="flex">
        <StudentSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />

        <main className={cn('flex-1 transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
          <div className="pt-20 lg:pt-24 pb-16 px-3 sm:px-5 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-4">

              {/* ── Breadcrumb ─────────────────────── */}
              <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Link href="/student" className="hover:text-slate-600 transition-colors flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <Link href="/student/results" className="hover:text-slate-600 transition-colors">Results</Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-slate-700 font-medium truncate max-w-[160px]">{result.exam_title}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/student/results')}
                    className="h-8 text-xs gap-1.5 rounded-xl border-slate-200">
                    <ArrowLeft className="h-3 w-3" /> Results
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}
                    className="h-8 text-xs gap-1.5 rounded-xl border-slate-200">
                    <Printer className="h-3 w-3" /> Print
                  </Button>
                </div>
              </motion.nav>

              {/* ══════════════════════════════════════
                  HERO BANNER
              ══════════════════════════════════════ */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="rounded-3xl overflow-hidden shadow-xl">
                  <div className={cn(
                    'h-1.5 w-full',
                    result.is_passed
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
                      : 'bg-gradient-to-r from-red-400 via-rose-400 to-pink-400'
                  )} />

                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 sm:px-8 pt-6 pb-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full -translate-y-32 translate-x-16" />
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/5 rounded-full translate-y-24" />

                    <div className="flex flex-wrap items-center gap-2 mb-4 relative">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                        <BookOpen className="h-3 w-3 text-blue-300" /> {result.exam_subject}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                        <GraduationCap className="h-3 w-3 text-purple-300" /> {result.exam_class}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                        <Calendar className="h-3 w-3 text-slate-300" /> {fmtDate(result.submitted_at)}
                      </span>
                      <span className={cn(
                        'ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full',
                        theoryPending ? 'bg-amber-500/20 text-amber-300' : result.is_passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      )}>
                        {theoryPending ? <Clock className="h-3 w-3" /> : result.is_passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {theoryPending ? 'Pending Theory' : result.is_passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 relative leading-snug">
                      {result.exam_title}
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center gap-6 relative pb-6">
                      <ScoreRing percentage={result.percentage} size={140} grade={gradeConfig} />

                      <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                        <StatPill icon={Trophy}    label="Total Score"   value={`${result.total_score}/${result.total_marks}`}  color="text-purple-600" />
                        <StatPill icon={Star}      label="Grade"         value={gradeConfig.grade}             color={gradeConfig.text} />
                        <StatPill icon={Clock}     label="Time Spent"    value={fmtTime(result.time_spent)}    color="text-blue-600" />
                        <StatPill icon={Target}    label="Pass Mark"     value={`${result.passing_percentage}%`} color="text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className={cn('px-5 sm:px-8 py-4 flex items-center gap-4 border-t', gradeConfig.bg, gradeConfig.border)}>
                    <div className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center shadow-md shrink-0',
                      gradeConfig.bar
                    )}>
                      <GradeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-base font-bold', gradeConfig.text)}>
                        Grade {gradeConfig.grade} — {gradeConfig.label}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5 leading-snug">
                        {result.is_passed
                          ? `Congratulations! You passed with ${result.percentage}%. Keep up the great work!`
                          : `You scored ${result.percentage}%. The pass mark is ${result.passing_percentage}%. You can do better!`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Theory Pending Notice ───────────────── */}
              {theoryPending && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="h-4.5 w-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Theory Grading In Progress</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Your theory answers are being reviewed by your teacher. The current score of{' '}
                        <strong>{result.percentage}%</strong> reflects{' '}
                        {hasCA ? 'Objective + CA scores' : 'Objective section only'}.
                        Your final score will update once theory grading is complete.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── CA Pending Notice ───────────────── */}
              {!hasCA && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">CA Scores Pending</p>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Your Continuous Assessment scores are being added by your teacher.
                        Current score reflects {theoryPending ? 'Objective only' : 'Objective + Theory'}.
                        Final grade will update once CA is added.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════
                  SCORE BREAKDOWN - DYNAMIC
              ══════════════════════════════════════ */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">Score Breakdown</h2>
                    <Badge className="ml-auto bg-slate-100 text-slate-600 border-0 text-[10px]">
                      {result.total_score}/{result.total_marks} marks
                    </Badge>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">

                    {/* Stacked visual bar - Dynamic */}
                    <div className="space-y-1.5">
                      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                        {hasCA && (
                          <motion.div 
                            className="bg-blue-500"
                            style={{ width: `${(caTotal / totalWeight) * 100}%` }}
                            initial={{ width: 0 }} 
                            animate={{ width: `${(caTotal / totalWeight) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }} 
                          />
                        )}
                        <motion.div 
                          className="bg-violet-500"
                          style={{ width: `${(result.objective_score / totalWeight) * 100}%` }}
                          initial={{ width: 0 }} 
                          animate={{ width: `${(result.objective_score / totalWeight) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }} 
                        />
                        {!theoryPending && theoryScore > 0 && (
                          <motion.div 
                            className="bg-amber-500"
                            style={{ width: `${(theoryScore / totalWeight) * 100}%` }}
                            initial={{ width: 0 }} 
                            animate={{ width: `${(theoryScore / totalWeight) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} 
                          />
                        )}
                        <div className="bg-slate-100 flex-1 rounded-r-full" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
                        {hasCA && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />CA ({caTotal}/40)</span>}
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" />Objective ({result.objective_score}/{result.objective_total})</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Theory ({theoryPending ? 'Pending' : `${theoryScore}/${result.theory_total}`})</span>
                      </div>
                    </div>

                    <Separator />

                    {/* CA Section - Always out of 40 */}
                    <ScoreBar
                      label="Continuous Assessment"
                      sublabel="(40 marks)"
                      score={hasCA ? caTotal : 0}
                      total={40}
                      color="bg-blue-500"
                      delay={0.1}
                      pending={!hasCA}
                    />
                    {hasCA && (
                      <div className="grid grid-cols-2 gap-3 -mt-2">
                        {[
                          { label: 'CA 1', score: result.ca1_score || 0, total: 20 },
                          { label: 'CA 2', score: result.ca2_score || 0, total: 20 },
                        ].map(ca => (
                          <div key={ca.label} className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2 text-xs">
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <CheckCircle className="h-3 w-3 text-blue-500" /> {ca.label}
                            </span>
                            <span className="font-bold text-blue-700">{ca.score}<span className="font-normal text-slate-400">/{ca.total}</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!hasCA && (
                      <p className="text-xs text-slate-400 italic -mt-2 pl-1">
                        CA scores will be added by your teacher soon.
                      </p>
                    )}

                    <Separator />

                    {/* Objective Section - Dynamic */}
                    <ScoreBar
                      label="Objective Exam"
                      sublabel={`(${result.objective_total} marks)`}
                      score={result.objective_score}
                      total={result.objective_total}
                      color="bg-violet-500"
                      delay={0.2}
                    />

                    <Separator />

                    {/* Theory Section - Dynamic */}
                    <ScoreBar
                      label="Theory Exam"
                      sublabel={`(${result.theory_total} marks)`}
                      score={theoryScore}
                      total={result.theory_total}
                      color="bg-amber-500"
                      delay={0.3}
                      pending={theoryPending}
                    />

                    <Separator />

                    {/* Grand Total - Dynamic */}
                    <div className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border-2',
                      gradeConfig.bg, gradeConfig.border
                    )}>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Grand Total</p>
                        {theoryPending && <p className="text-[10px] text-amber-600 mt-0.5">*May increase after theory grading</p>}
                        {!hasCA && <p className="text-[10px] text-blue-600 mt-0.5">*CA scores pending</p>}
                      </div>
                      <div className="text-right">
                        <p className={cn('text-2xl font-black', gradeConfig.text)}>
                          {result.total_score}<span className="text-base font-normal text-slate-400">/{result.total_marks}</span>
                        </p>
                        <p className={cn('text-xs font-semibold', gradeConfig.text)}>{result.percentage}%</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* ══════════════════════════════════════
                  QUESTION PERFORMANCE
              ══════════════════════════════════════ */}
              {totalQuestions > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                  <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
                        <PieChart className="h-4 w-4 text-purple-600" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">Question Performance</h2>
                      <Badge className="ml-auto bg-slate-100 text-slate-600 border-0 text-[10px]">
                        {totalQuestions} questions
                      </Badge>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
                        <motion.div className="bg-emerald-500 rounded-l-full"
                          initial={{ width: 0 }} animate={{ width: `${correctPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }} />
                        <motion.div className="bg-red-400"
                          initial={{ width: 0 }} animate={{ width: `${incorrectPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }} />
                        <motion.div className="bg-slate-200 rounded-r-full flex-1"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }} />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: CheckCircle, label: 'Correct',  value: result.correct_count,    pct: correctPct,   color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
                          { icon: XCircle,     label: 'Wrong',    value: result.incorrect_count,  pct: incorrectPct, color: 'text-red-500',     bg: 'bg-red-50',     bar: 'bg-red-500' },
                          { icon: Minus,       label: 'Skipped',  value: result.unanswered_count, pct: skippedPct,   color: 'text-slate-500',   bg: 'bg-slate-50',   bar: 'bg-slate-400' },
                        ].map(item => (
                          <div key={item.label} className={cn('rounded-2xl p-3 text-center space-y-1', item.bg)}>
                            <item.icon className={cn('h-4 w-4 mx-auto', item.color)} />
                            <p className={cn('text-xl font-black', item.color)}>{item.value}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                            <p className={cn('text-[10px] font-semibold', item.color)}>{Math.round(item.pct)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ══════════════════════════════════════
                  TEACHER FEEDBACK
              ══════════════════════════════════════ */}
              {result.teacher_feedback && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="h-8 w-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">Teacher's Feedback</h2>
                    </div>
                    <div className="p-5 sm:p-6">
                      <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
                        <div className="absolute top-3 left-4 text-4xl text-indigo-200 font-serif leading-none select-none">"</div>
                        <p className="text-slate-700 italic leading-relaxed text-sm pl-4 pt-3">
                          {result.teacher_feedback}
                        </p>
                        <div className="absolute bottom-3 right-4 text-4xl text-indigo-200 font-serif leading-none rotate-180 select-none">"</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ══════════════════════════════════════
                  ACTION BUTTONS
              ══════════════════════════════════════ */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" onClick={() => router.push('/student/results')}
                  className="flex-1 h-11 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Results
                </Button>
                <Button onClick={() => router.push('/student/exams')}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 gap-2 text-white shadow-lg shadow-slate-200">
                  <BookOpen className="h-4 w-4" /> View All Exams
                </Button>
              </motion.div>

              <div className="h-4" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}