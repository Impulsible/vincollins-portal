/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Clock, CheckCircle, XCircle, BookOpen, GraduationCap,
  Calendar, ArrowLeft, Home, ChevronRight, AlertCircle,
  Trophy, Target, BarChart3, Award, CheckCheck,
  X, Loader2, Minus, Printer, Star, BookMarked,
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
  term?: string; academic_year?: string
  exam_combined?: boolean
}

interface StudentProfile {
  id: string; full_name: string; email: string; class: string
  department: string; photo_url?: string
}

// ─── Helpers ─────────────────────────────────────────
const getGradeConfig = (percentage: number) => {
  if (percentage >= 75) return { grade: 'A1', label: 'Excellent', color: 'emerald', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-500', icon: Trophy }
  if (percentage >= 70) return { grade: 'B2', label: 'Very Good', color: 'blue', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', bar: 'bg-blue-500', icon: Award }
  if (percentage >= 65) return { grade: 'B3', label: 'Good', color: 'sky', text: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800', bar: 'bg-sky-500', icon: Award }
  if (percentage >= 60) return { grade: 'C4', label: 'Credit', color: 'cyan', text: 'text-cyan-700 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800', bar: 'bg-cyan-500', icon: Target }
  if (percentage >= 55) return { grade: 'C5', label: 'Credit', color: 'teal', text: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800', bar: 'bg-teal-500', icon: Target }
  if (percentage >= 50) return { grade: 'C6', label: 'Credit', color: 'amber', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', bar: 'bg-amber-500', icon: CheckCheck }
  if (percentage >= 45) return { grade: 'D7', label: 'Pass', color: 'orange', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-500', icon: CheckCheck }
  if (percentage >= 40) return { grade: 'E8', label: 'Pass', color: 'yellow', text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', bar: 'bg-yellow-500', icon: Minus }
  return { grade: 'F9', label: 'Fail', color: 'red', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', bar: 'bg-red-500', icon: X }
}

const fmtTime = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '—'
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

const getTermLabel = (value: string) => {
  const terms = [
    { value: 'first', label: 'First Term' },
    { value: 'second', label: 'Second Term' },
    { value: 'third', label: 'Third Term' }
  ]
  const found = terms.find(t => t.value === value || value?.toLowerCase()?.includes(t.value))
  return found ? found.label : value
}

const isTermMatch = (a?: string, b?: string) => {
  if (!a || !b) return false
  const x = a.toLowerCase(), y = b.toLowerCase()
  if (x === y) return true
  if (x.includes('third') || x.includes('3rd')) return y.includes('third') || y.includes('3rd')
  if (x.includes('second') || x.includes('2nd')) return y.includes('second') || y.includes('2nd')
  if (x.includes('first') || x.includes('1st')) return y.includes('first') || y.includes('1st')
  return false
}

// ─── Animated Score Ring ──────────────────────────────
function ScoreRing({ percentage, size = 160, grade }: { percentage: number; size?: number; grade: ReturnType<typeof getGradeConfig> }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={cn('absolute inset-2 rounded-full opacity-20 blur-md', grade.bar)} />
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" className={grade.bar.replace('bg-', 'stroke-')}
          strokeWidth={10} strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}>
          <p className={cn('font-black leading-none', size > 120 ? 'text-4xl' : 'text-2xl', grade.text)}>{percentage}%</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">{grade.label}</p>
        </motion.div>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, total, color, delay = 0, pending = false, sublabel }: {
  label: string; score: number; total: number; color: string; delay?: number; pending?: boolean; sublabel?: string
}) {
  const pct = total > 0 ? (score / total) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          {sublabel && <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5">{sublabel}</span>}
        </div>
        {pending ? (
          <Badge className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px]">
            <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
          </Badge>
        ) : (
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {score}<span className="text-slate-400 dark:text-slate-500 font-normal">/{total}</span>
          </span>
        )}
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: pending ? '0%' : `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
        />
      </div>
      {!pending && <p className="text-[10px] text-slate-400 dark:text-slate-500">{Math.round(pct)}% of section</p>}
    </div>
  )
}

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', color.replace('text-', 'bg-').replace('-600', '-100').replace('-400', '-950/40'))}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center leading-tight">{label}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────
export default function StudentResultDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadResult = useCallback(async () => {
    if (!examId) return
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      const termParam = searchParams.get('term') || ''
      const sessionYearParam = searchParams.get('session') || ''

      const { data: pd } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!pd) { setError('Profile not found'); setLoading(false); return }

      setProfile({
        id: pd.id,
        full_name: pd.full_name || 'Student',
        email: pd.email || '',
        class: pd.class || '—',
        department: pd.department || '—',
        photo_url: pd.photo_url || undefined,
      })

      // ═══════════════════════════════════════════════
      // PATH A: Report-card synthetic IDs (rc-exam-...)
      // ═══════════════════════════════════════════════
      if (examId.startsWith('rc-')) {
        const subjectIndex = parseInt(examId.split('-').pop() || '0', 10)
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
        const match = examId.match(uuidRegex)
        const reportCardId = match ? match[0] : null

        if (!reportCardId) {
          setError('Invalid report card reference.')
          setLoading(false)
          return
        }

        const { data: rc, error: rcError } = await supabase
          .from('report_cards')
          .select('*')
          .eq('id', reportCardId)
          .maybeSingle()

        if (!rc || rcError) {
          setError('Result not found in database.')
          setLoading(false)
          return
        }

        const subjects = (rc.subject_scores?.length > 0 ? rc.subject_scores : rc.subjects_data) || []
        const subj = subjects[subjectIndex]
        if (!subj) {
          setError('Subject details not found.')
          setLoading(false)
          return
        }

        const subjectName = (subj.name || subj.subject || 'Subject') as string
        const total = Number(subj.total || subj.score || 0)
        const caFromRc = Number(subj.ca || subj.ca_score || 0)
        const examCombinedFromRc = Number(subj.exam || subj.exam_score || 0)
        const rcTerm = rc.term || termParam
        const rcSession = rc.academic_year || rc.session_year || sessionYearParam

        // ── Try to find matching CBT attempt for Obj + Theory breakdown ──
        let objectiveScore = 0
        let objectiveMax = 0
        let theoryScore = 0
        let theoryMax = 0
        let caTotal = caFromRc
        let hasSplit = false
        let timeSpent = 0
        let correct = 0, incorrect = 0, unanswered = 0
        let teacherFeedback: string | null = subj.remark || null
        let status = 'completed'
        let submittedAt = rc.created_at || new Date().toISOString()

        const { data: matchingExams } = await supabase
          .from('exams')
          .select('id, title, subject, objective_max, theory_max, passing_percentage, questions, term, session_year')
          .ilike('subject', subjectName)
          .eq('status', 'published')

        const examMatch = (matchingExams || []).find((e: any) =>
          isTermMatch(e.term, rcTerm) &&
          (e.session_year === rcSession || !rcSession)
        ) || (matchingExams || [])[0]

        if (examMatch) {
          const { data: att } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('exam_id', examMatch.id)
            .eq('student_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const { data: caRow } = await supabase
            .from('ca_scores')
            .select('*')
            .eq('student_id', session.user.id)
            .eq('exam_id', examMatch.id)
            .maybeSingle()

          objectiveMax = Number(examMatch.objective_max) || 0
          if (objectiveMax <= 0 && examMatch.questions) {
            try {
              const qs = typeof examMatch.questions === 'string' ? JSON.parse(examMatch.questions) : examMatch.questions
              if (Array.isArray(qs)) {
                qs.forEach((q: any) => {
                  if (q.type !== 'theory' && !q.is_theory) {
                    objectiveMax += Number(q.marks || q.points || 0.5)
                  }
                })
              }
            } catch { /* ignore */ }
          }
          if (objectiveMax <= 0 || objectiveMax > 60) objectiveMax = 30
          theoryMax = Math.max(0, 60 - objectiveMax)

          if (att) {
            objectiveScore = Number(att.objective_score) || 0
            theoryScore = Number(att.theory_score) || 0
            if (!theoryScore && att.theory_feedback) {
              try {
                const fb = typeof att.theory_feedback === 'string' ? JSON.parse(att.theory_feedback) : att.theory_feedback
                if (fb?.total?.score != null) theoryScore = Number(fb.total.score)
                if (fb?.total?.feedback) teacherFeedback = fb.total.feedback
              } catch { /* ignore */ }
            }
            hasSplit = true
            timeSpent = att.time_spent || 0
            correct = att.correct_count || 0
            incorrect = att.incorrect_count || 0
            unanswered = att.unanswered_count || 0
            status = att.status || 'completed'
            submittedAt = att.submitted_at || att.completed_at || submittedAt
          }

          if (caRow) {
            caTotal = Number(caRow.ca_total) || ((Number(caRow.ca1_score) || 0) + (Number(caRow.ca2_score) || 0)) || caFromRc
          }
        }

        if (!hasSplit) {
          objectiveScore = examCombinedFromRc
          objectiveMax = 60
          theoryScore = 0
          theoryMax = 0
        }

        const grandTotal = caTotal + objectiveScore + theoryScore
        const percentage = Math.min(100, Math.round(total || grandTotal))

        setResult({
          id: examId,
          exam_id: examMatch?.id || examId,
          exam_title: examMatch?.title || `${subjectName} Assessment`,
          exam_subject: subjectName,
          exam_class: rc.class || pd.class || '—',
          status,
          percentage,
          total_score: percentage,
          total_marks: 100,
          objective_score: objectiveScore,
          objective_total: objectiveMax,
          theory_score: theoryScore,
          theory_total: theoryMax,
          ca1_score: caTotal,
          ca2_score: 0,
          is_passed: percentage >= 40,
          submitted_at: submittedAt,
          passing_percentage: examMatch?.passing_percentage || 40,
          time_spent: timeSpent,
          correct_count: correct,
          incorrect_count: incorrect,
          unanswered_count: unanswered,
          teacher_feedback: teacherFeedback,
          term: rcTerm,
          academic_year: rcSession,
          exam_combined: !hasSplit,
        })
        setLoading(false)
        return
      }

      // ═══════════════════════════════════════════════
      // PATH B: Normal CBT exam ID
      // ═══════════════════════════════════════════════
      let attemptQuery = supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', session.user.id)

      if (termParam) attemptQuery = attemptQuery.eq('term', termParam)
      if (sessionYearParam) attemptQuery = attemptQuery.eq('academic_year', sessionYearParam)

      let { data: att } = await attemptQuery
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!att) {
        const { data: fallbackAtt } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', examId)
          .eq('student_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        att = fallbackAtt
      }

      if (!att) {
        setError('No submission found for this exam')
        setLoading(false)
        return
      }

      const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).maybeSingle()
      const { data: ca } = await supabase
        .from('ca_scores')
        .select('ca1_score, ca2_score, ca_total, total_score, percentage, grade')
        .eq('student_id', session.user.id)
        .eq('exam_id', examId)
        .maybeSingle()

      let objectiveMax = Number(exam?.objective_max) || 0
      if (objectiveMax === 0 && exam?.questions) {
        try {
          const questions = typeof exam.questions === 'string' ? JSON.parse(exam.questions) : exam.questions
          if (Array.isArray(questions)) {
            questions.forEach((q: any) => {
              if (q.type !== 'theory' && !q.is_theory) {
                objectiveMax += Number(q.marks || q.points || 0.5)
              }
            })
          }
        } catch (e) { console.error(e) }
      }
      if (objectiveMax <= 0 || objectiveMax > 60) objectiveMax = 30
      const theoryMax = Math.max(0, 60 - objectiveMax)

      let theoryScore: number | null = Number(att.theory_score) || null
      let teacherFeedback: string | null = null
      if (att.theory_feedback) {
        try {
          const fb = typeof att.theory_feedback === 'string' ? JSON.parse(att.theory_feedback) : att.theory_feedback
          if (fb?.total?.score != null) theoryScore = Number(fb.total.score)
          if (fb?.total?.feedback) teacherFeedback = fb.total.feedback
        } catch { /* ignore */ }
      }

      const ca1 = ca?.ca1_score != null ? Number(ca.ca1_score) : null
      const ca2 = ca?.ca2_score != null ? Number(ca.ca2_score) : null
      const caTotalValue = Number(ca?.ca_total) || ((ca1 || 0) + (ca2 || 0))
      const hasCA = ca1 != null || ca?.ca_total != null || caTotalValue > 0

      const objectiveScore = Number(att.objective_score) || 0
      const theoryValue = theoryScore || 0

      let percentage: number
      let totalScore: number
      let totalMarks: number

      if (hasCA) {
        totalScore = caTotalValue + objectiveScore + theoryValue
        totalMarks = 100
        percentage = Math.round((totalScore / totalMarks) * 100)
      } else if (theoryValue > 0 || theoryMax > 0) {
        totalScore = objectiveScore + theoryValue
        totalMarks = 60
        percentage = Math.round((totalScore / totalMarks) * 100)
      } else {
        totalScore = objectiveScore
        totalMarks = objectiveMax || 60
        percentage = Math.round((totalScore / totalMarks) * 100)
      }
      percentage = Math.min(percentage, 100)

      setResult({
        id: att.id || examId,
        exam_id: att.exam_id || examId,
        exam_title: exam?.title || 'Exam Result',
        exam_subject: exam?.subject || '—',
        exam_class: exam?.class || pd.class || '—',
        status: att.status || 'completed',
        percentage,
        total_score: totalScore,
        total_marks: totalMarks,
        objective_score: objectiveScore,
        objective_total: objectiveMax,
        theory_score: theoryValue,
        theory_total: theoryMax,
        ca1_score: hasCA ? caTotalValue : null,
        ca2_score: 0,
        is_passed: percentage >= 40,
        submitted_at: att.submitted_at || new Date().toISOString(),
        passing_percentage: exam?.passing_percentage || 40,
        time_spent: att.time_spent || 0,
        correct_count: att.correct_count || 0,
        incorrect_count: att.incorrect_count || 0,
        unanswered_count: att.unanswered_count || 0,
        teacher_feedback: teacherFeedback,
        term: exam?.term || termParam,
        academic_year: exam?.session_year || sessionYearParam,
        exam_combined: false,
      })
    } catch (err) {
      console.error(err)
      setError('Failed to load result. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [examId, router, searchParams])

  useEffect(() => { loadResult() }, [loadResult])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out')
    router.push('/portal')
  }

  // ── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          <div className={cn('flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-fit">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                  <BookMarked className="h-8 w-8 text-white" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 border border-slate-100 dark:border-slate-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Loading your result</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Fetching exam details...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          <div className={cn('flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] px-4', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
            <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 transition-colors">
              <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500" />
              <CardContent className="text-center py-12 px-8">
                <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/50">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Result Not Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">{error || 'No submission found for this exam.'}</p>
                <Button onClick={() => router.push('/student/results')} className="w-full h-11 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Results
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived ────────────────────────────────────────
  const gradeConfig = getGradeConfig(result.percentage)
  const GradeIcon = gradeConfig.icon
  const hasCA = result.ca1_score != null
  const caTotal = (result.ca1_score || 0) + (result.ca2_score || 0)
  const theoryScore = result.theory_score || 0
  const theoryPending =
    result.status === 'pending_theory' ||
    (result.theory_total > 0 && theoryScore === 0 && !result.exam_combined)
  const showTheoryRow = result.theory_total > 0 && !result.exam_combined
  const showCombinedExam = !!result.exam_combined || (result.theory_total === 0 && result.objective_total >= 60)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <Header
        user={{
          id: profile?.id || '',
          name: profile?.full_name || '',
          firstName: profile?.full_name?.split(' ')[0] || 'Student',
          email: profile?.email || '',
          role: 'student' as const,
          avatar: profile?.photo_url || undefined,
          isAuthenticated: true,
        }}
        onLogout={handleLogout}
      />

      <div className="flex">
        <StudentSidebar
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="results"
          setActiveTab={() => {}}
        />

        <main className={cn('flex-1 transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
          <div className="pt-20 lg:pt-24 pb-16 px-3 sm:px-5 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-4">

              {/* Breadcrumb */}
              <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
                  <Link href="/student" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"><Home className="h-3.5 w-3.5" /></Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <Link href="/student/results" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Results</Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[160px]">{result.exam_title}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/student/results')} className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <ArrowLeft className="h-3 w-3" /> Results
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <Printer className="h-3 w-3" /> Print
                  </Button>
                </div>
              </motion.nav>

              {result.term && result.academic_year && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                  <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <span className="font-medium">Term:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{getTermLabel(result.term)}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="font-medium">Session:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{result.academic_year}</span>
                </div>
              )}

              {/* Hero Banner */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="rounded-3xl overflow-hidden shadow-xl border border-transparent dark:border-slate-800">
                  <div className={cn('h-1.5 w-full', result.is_passed ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400' : 'bg-gradient-to-r from-red-400 via-rose-400 to-pink-400')} />
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-5 sm:px-8 pt-6 pb-0 relative overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 mb-4 relative">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10"><BookOpen className="h-3 w-3 text-blue-300" /> {result.exam_subject}</span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10"><GraduationCap className="h-3 w-3 text-purple-300" /> {result.exam_class}</span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10"><Calendar className="h-3 w-3 text-slate-300" /> {fmtDate(result.submitted_at)}</span>
                      <span className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border', theoryPending ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : result.is_passed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30')}>
                        {theoryPending ? <Clock className="h-3 w-3" /> : result.is_passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {theoryPending ? 'Pending Theory' : result.is_passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 relative leading-snug">{result.exam_title}</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative pb-6">
                      <ScoreRing percentage={result.percentage} size={140} grade={gradeConfig} />
                      <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                        <StatPill icon={Trophy} label="Total Score" value={`${result.total_score}/${result.total_marks}`} color="text-purple-600 dark:text-purple-400" />
                        <StatPill icon={Star} label="Grade" value={gradeConfig.grade} color={gradeConfig.text} />
                        <StatPill icon={Clock} label="Time Spent" value={fmtTime(result.time_spent)} color="text-blue-600 dark:text-blue-400" />
                        <StatPill icon={Target} label="Pass Mark" value={`${result.passing_percentage}%`} color="text-slate-500 dark:text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <div className={cn('px-5 sm:px-8 py-4 flex items-center gap-4 border-t', gradeConfig.bg, gradeConfig.border)}>
                    <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shadow-md shrink-0', gradeConfig.bar)}>
                      <GradeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-base font-bold', gradeConfig.text)}>Grade {gradeConfig.grade} — {gradeConfig.label}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                        {result.is_passed
                          ? `Congratulations! You passed with ${result.percentage}%. Keep up the great work!`
                          : `You scored ${result.percentage}%. The pass mark is ${result.passing_percentage}%. You can do better!`}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ═══ SCORE BREAKDOWN ═══ */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
                  <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Score Breakdown</h2>
                    <Badge className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 text-[10px]">
                      {result.total_score}/{result.total_marks} marks
                    </Badge>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Stacked bar legend */}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      {hasCA && (
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-blue-500" /> CA ({caTotal}/40)
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-violet-500" />
                        {showCombinedExam ? `Exam (${result.objective_score}/60)` : `Objective (${result.objective_score}/${result.objective_total})`}
                      </span>
                      {showTheoryRow && (
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          Theory ({theoryPending ? 'Pending' : `${theoryScore}/${result.theory_total}`})
                        </span>
                      )}
                    </div>

                    <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                      {hasCA && (
                        <motion.div className="bg-blue-500" initial={{ width: 0 }} animate={{ width: `${(caTotal / 100) * 100}%` }} transition={{ duration: 0.8 }} />
                      )}
                      <motion.div className="bg-violet-500" initial={{ width: 0 }} animate={{ width: `${(result.objective_score / 100) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                      {showTheoryRow && !theoryPending && theoryScore > 0 && (
                        <motion.div className="bg-amber-500" initial={{ width: 0 }} animate={{ width: `${(theoryScore / 100) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                      )}
                      <div className="bg-slate-100 dark:bg-slate-800 flex-1 rounded-r-full" />
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* CA — always out of 40 */}
                    <ScoreBar
                      label="Continuous Assessment"
                      sublabel="(40 marks)"
                      score={hasCA ? caTotal : 0}
                      total={40}
                      color="bg-blue-500"
                      delay={0.1}
                      pending={!hasCA}
                    />

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Objective OR combined Exam */}
                    <ScoreBar
                      label={showCombinedExam ? 'Exam Score' : 'Objective Exam'}
                      sublabel={showCombinedExam ? '(60 marks · Obj + Theory)' : `(${result.objective_total} marks)`}
                      score={result.objective_score}
                      total={showCombinedExam ? 60 : result.objective_total}
                      color="bg-violet-500"
                      delay={0.2}
                    />

                    {/* Theory — only when we have a real split */}
                    {showTheoryRow && (
                      <>
                        <Separator className="bg-slate-100 dark:bg-slate-800" />
                        <ScoreBar
                          label="Theory Exam"
                          sublabel={`(${result.theory_total} marks)`}
                          score={theoryScore}
                          total={result.theory_total}
                          color="bg-amber-500"
                          delay={0.3}
                          pending={theoryPending}
                        />
                      </>
                    )}

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Grand Total */}
                    <div className={cn('flex items-center justify-between p-4 rounded-2xl border-2', gradeConfig.bg, gradeConfig.border)}>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Grand Total</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {hasCA ? 'CA' : '—'} + {showCombinedExam ? 'Exam' : 'Obj'}{showTheoryRow ? ' + Theory' : ''} = 100
                        </p>
                        {!hasCA && <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">*CA scores pending</p>}
                        {theoryPending && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">*Theory grading pending</p>}
                      </div>
                      <div className="text-right">
                        <p className={cn('text-2xl font-black', gradeConfig.text)}>
                          {result.total_score}
                          <span className="text-base font-normal text-slate-400 dark:text-slate-500">/{result.total_marks}</span>
                        </p>
                        <p className={cn('text-xs font-semibold', gradeConfig.text)}>{result.percentage}%</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Teacher feedback */}
              {result.teacher_feedback && (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 transition-colors">
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Remark</h2>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">&ldquo;{result.teacher_feedback}&rdquo;</p>
                  </div>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" onClick={() => router.push('/student/results')} className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" /> Back to Results
                </Button>
                <Button onClick={() => router.push('/student/exams')} className="flex-1 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 gap-2 cursor-pointer">
                  <BookOpen className="h-4 w-4" /> View All Exams
                </Button>
              </div>

              <div className="h-4" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}