// app/student/results/[id]/page.tsx - FIXED: USES ACTUAL EXAM SCORES
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Clock, CheckCircle, XCircle, BookOpen,
  GraduationCap, Calendar, ArrowLeft,
  Home, ChevronRight, AlertCircle, FileText
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────
interface ExamResult {
  id: string; exam_id: string; exam_title: string; exam_subject: string
  exam_class: string; status: string; percentage: number; total_score: number
  total_marks: number; objective_score: number; objective_total: number
  theory_score: number | null; theory_total: number
  ca1_score: number | null; ca2_score: number | null
  grand_total: number; grand_total_marks: number
  is_passed: boolean; submitted_at: string; passing_percentage: number
  time_spent: number; correct_count: number; incorrect_count: number
  unanswered_count: number; teacher_feedback: string | null
}

interface StudentProfile {
  id: string; full_name: string; email: string; class: string
  department: string; photo_url?: string
}

// ─── Constants ────────────────────────────────────────
const getGrade = (pct: number) => {
  if (pct >= 75) return { g: 'A1', c: 'text-emerald-600', bg: 'bg-emerald-50', bc: 'border-emerald-300' }
  if (pct >= 70) return { g: 'B2', c: 'text-blue-600', bg: 'bg-blue-50', bc: 'border-blue-300' }
  if (pct >= 65) return { g: 'B3', c: 'text-sky-600', bg: 'bg-sky-50', bc: 'border-sky-300' }
  if (pct >= 60) return { g: 'C4', c: 'text-teal-600', bg: 'bg-teal-50', bc: 'border-teal-300' }
  if (pct >= 55) return { g: 'C5', c: 'text-amber-600', bg: 'bg-amber-50', bc: 'border-amber-300' }
  if (pct >= 50) return { g: 'C6', c: 'text-orange-500', bg: 'bg-orange-50', bc: 'border-orange-300' }
  if (pct >= 45) return { g: 'D7', c: 'text-yellow-600', bg: 'bg-yellow-50', bc: 'border-yellow-300' }
  if (pct >= 40) return { g: 'E8', c: 'text-red-400', bg: 'bg-red-50', bc: 'border-red-300' }
  return { g: 'F9', c: 'text-red-600', bg: 'bg-red-100', bc: 'border-red-400' }
}

const fmtTime = (s?: number) => {
  if (!s) return '—'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

const fmtDate = (d?: string) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '—' }
}

// ─── Component ────────────────────────────────────────
export default function StudentResultDetailPage() {
  const router = useRouter()
  const params = useParams()
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

      const { data: pd } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!pd) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      setProfile({
        id: pd.id,
        full_name: pd.full_name || 'Student',
        email: pd.email || '',
        class: pd.class || '—',
        department: pd.department || '—',
        photo_url: pd.photo_url || undefined
      })

      // Get exam attempt - this has the REAL scores
      const { data: att } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!att) {
        setError('No submission found for this exam')
        setLoading(false)
        return
      }

      const { data: exam } = await supabase
        .from('exams')
        .select('*')
        .eq('id', att.exam_id)
        .maybeSingle()

      // Get REAL theory score from theory_feedback (teacher graded)
      let theoryScore: number | null = null
      let teacherFeedback: string | null = null

      if (att.theory_feedback) {
        try {
          const fb = typeof att.theory_feedback === 'string' ? JSON.parse(att.theory_feedback) : att.theory_feedback
          if (fb?.total?.score !== undefined) theoryScore = Number(fb.total.score)
          if (fb?.total?.feedback) teacherFeedback = fb.total.feedback
        } catch { /* ignore */ }
      }

      // Get CA scores - ONLY ca1 and ca2, not exam scores
      const { data: ca } = await supabase
        .from('ca_scores')
        .select('ca1_score, ca2_score, total_score')
        .eq('student_id', session.user.id)
        .eq('exam_id', examId)
        .maybeSingle()

      // REAL scores from exam_attempts
      const objScore = Number(att.objective_score) || 0
      const objTotal = Number(att.objective_total) || 20
      const thTotal = Number(att.theory_total) || 40
      const examScore = objScore + (theoryScore || 0)
      
      // CA scores (only CA1 and CA2)
      const ca1 = ca?.ca1_score != null ? Number(ca.ca1_score) : null
      const ca2 = ca?.ca2_score != null ? Number(ca.ca2_score) : null
      const c1 = ca1 || 0
      const c2 = ca2 || 0
      const grandScore = c1 + c2 + objScore + (theoryScore || 0)
      const hasCA = ca1 !== null && ca2 !== null

      // Calculate percentage
      const totalScore = hasCA ? grandScore : examScore
      const totalMarks = hasCA ? 100 : (objTotal + thTotal)
      const percentage = hasCA
        ? Math.round((grandScore / 100) * 100)
        : (att.percentage || Math.round((examScore / (objTotal + thTotal)) * 100))

      setResult({
        id: att.id,
        exam_id: att.exam_id,
        exam_title: exam?.title || 'Untitled Exam',
        exam_subject: exam?.subject || '—',
        exam_class: exam?.class || '—',
        status: att.status,
        percentage: percentage,
        total_score: totalScore,
        total_marks: totalMarks,
        objective_score: Math.round(objScore), // Round 0.5 → 1
        objective_total: objTotal,
        theory_score: theoryScore,
        theory_total: thTotal,
        ca1_score: ca1,
        ca2_score: ca2,
        grand_total: grandScore,
        grand_total_marks: 100,
        is_passed: percentage >= 40,
        submitted_at: att.submitted_at,
        passing_percentage: exam?.passing_percentage || 50,
        time_spent: att.time_spent,
        correct_count: att.correct_count || 0,
        incorrect_count: att.incorrect_count || 0,
        unanswered_count: att.unanswered_count || 0,
        teacher_feedback: teacherFeedback
      })
    } catch (err) {
      console.error('Failed to load result:', err)
      setError('Failed to load result. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => { loadResult() }, [loadResult])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out')
    router.push('/portal')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={handleLogout} />
        <div className="flex w-full">
          <div className="hidden lg:block">
            <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          </div>
          <div className={cn("flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
            <div className="text-center px-4">
              <div className="relative mx-auto mb-6 h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                <FileText className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-700 mb-1">Loading Your Result</h2>
              <p className="text-sm text-slate-500">Please wait while we fetch your exam details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={handleLogout} />
        <div className="flex w-full">
          <div className="hidden lg:block">
            <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          </div>
          <div className={cn("flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] px-4", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
            <Card className="max-w-sm w-full border-0 shadow-sm">
              <CardContent className="text-center py-10">
                <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-7 w-7 text-red-400" /></div>
                <h3 className="font-semibold text-slate-800 mb-1">Result Not Found</h3>
                <p className="text-sm text-slate-500 mb-6">{error || 'No submission found for this exam.'}</p>
                <Button onClick={() => router.push('/student/exams')} size="sm" className="w-full"><ArrowLeft className="h-4 w-4 mr-2" />Back to Exams</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const grade = getGrade(result.percentage)
  const theoryPending = result.status === 'pending_theory'
  const hasCA = result.ca1_score !== null && result.ca2_score !== null
  const isPassed = result.percentage >= 40
  const totalQ = result.correct_count + result.incorrect_count + result.unanswered_count

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <Header user={{ id: profile?.id || '', name: profile?.full_name || '', email: profile?.email || '', role: 'student' as const, avatar: profile?.photo_url || undefined, isAuthenticated: true }} onLogout={handleLogout} />

      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />

        <main className={cn("flex-1 pt-[72px] lg:pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-all duration-300 w-full max-w-full", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
          <div className="w-full max-w-3xl mx-auto">

            <nav className="flex items-center justify-between gap-2 mb-6 mt-2">
              <ol className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                <li><Link href="/student" className="hover:text-slate-700 transition-colors"><Home className="h-3.5 w-3.5" /></Link></li>
                <li><ChevronRight className="h-3 w-3 shrink-0" /></li>
                <li><Link href="/student/exams" className="hover:text-slate-700 transition-colors truncate">Exams</Link></li>
                <li><ChevronRight className="h-3 w-3 shrink-0" /></li>
                <li className="text-slate-800 font-medium truncate">{result.exam_title}</li>
              </ol>
              <Button variant="ghost" size="sm" onClick={() => router.push('/student/exams')} className="h-8 text-xs shrink-0"><ArrowLeft className="h-3.5 w-3.5 mr-1" />Back</Button>
            </nav>

            <Card className="border-0 shadow-sm mb-5 overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={cn("text-xs font-medium", isPassed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                        {isPassed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {isPassed ? 'Passed' : 'Failed'}
                      </Badge>
                      {theoryPending && <Badge variant="outline" className="text-xs text-purple-600 border-purple-200"><Clock className="h-3 w-3 mr-1" />Theory Pending</Badge>}
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-words">{result.exam_title}</h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{result.exam_subject}</span>
                      <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{result.exam_class}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(result.submitted_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-center sm:justify-end shrink-0">
                    <span className={cn("text-4xl sm:text-5xl font-bold tracking-tight", grade.c)}>{result.percentage}<span className="text-xl">%</span></span>
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border-2", grade.bg, grade.bc)}>
                      <span className={cn("text-2xl font-bold", grade.c)}>{grade.g}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {hasCA && (
                    <>
                      <ScoreLine label="CA 1" value={result.ca1_score!} max={20} />
                      <ScoreLine label="CA 2" value={result.ca2_score!} max={20} />
                      <div className="py-1" />
                    </>
                  )}
                  <ScoreLine label="Objective" value={result.objective_score} max={result.objective_total} />
                  <ScoreLine label="Theory" value={result.theory_score} max={result.theory_total} pending={theoryPending} />
                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <ScoreLine label="Total" value={result.total_score} max={result.total_marks} bold />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { l: 'Time Spent', v: fmtTime(result.time_spent), i: Clock },
                { l: 'Correct', v: result.correct_count, i: CheckCircle, c: 'text-emerald-600' },
                { l: 'Wrong', v: result.incorrect_count, i: XCircle, c: 'text-red-500' },
                { l: 'Skipped', v: result.unanswered_count, i: AlertCircle, c: 'text-slate-400' },
              ].map((s, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <s.i className={cn("h-5 w-5 shrink-0", s.c || 'text-slate-400')} />
                    <div className="min-w-0"><p className="text-[11px] text-slate-400 uppercase tracking-wide">{s.l}</p><p className="text-base sm:text-lg font-semibold text-slate-800">{s.v}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalQ > 0 && (
              <Card className="border-0 shadow-sm mb-5">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">MCQ Performance</h3>
                  <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(result.correct_count / totalQ) * 100}%` }} />
                    <div className="bg-red-400 h-full" style={{ width: `${(result.incorrect_count / totalQ) * 100}%` }} />
                    <div className="bg-slate-200 h-full" style={{ width: `${(result.unanswered_count / totalQ) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Correct ({result.correct_count})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Wrong ({result.incorrect_count})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" />Skipped ({result.unanswered_count})</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {theoryPending && (
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">
                <Clock className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div><p className="text-sm font-medium text-purple-800">Theory Answers Pending</p><p className="text-xs text-purple-600 mt-0.5">Your theory answers are being reviewed. The final score will update once grading is complete.</p></div>
              </div>
            )}

            {result.teacher_feedback && (
              <Card className="border-0 shadow-sm mb-5">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" />Teacher Feedback</h3>
                  <div className="bg-slate-50 rounded-lg p-4"><p className="text-sm text-slate-600 italic leading-relaxed">&ldquo;{result.teacher_feedback}&rdquo;</p></div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => router.push('/student/exams')} className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Exams
            </Button>
            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  )
}

function ScoreLine({ label, value, max, bold, pending }: { label: string; value: number | null; max: number; bold?: boolean; pending?: boolean }) {
  const v = value ?? 0
  return (
    <div className={cn("flex items-center justify-between py-1", bold && "font-semibold")}>
      <span className={cn("text-slate-600", bold && "text-slate-900")}>{label}</span>
      <span className={cn("tabular-nums", bold ? "text-slate-900 text-base" : "text-slate-700 text-sm")}>
        {pending ? <span className="text-purple-500 text-xs font-medium">Pending</span> : <>{v}<span className="text-slate-400">/{max}</span></>}
      </span>
    </div>
  )
}