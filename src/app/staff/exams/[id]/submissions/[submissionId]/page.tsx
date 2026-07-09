// app/staff/exams/[id]/submissions/[submissionId]/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Save, CheckCircle, Clock, AlertCircle,
  Loader2, Award, Target, PenTool, ChevronDown, ChevronUp,
  FileText, Brain, TrendingUp, BarChart3, GraduationCap,
  User, BookOpen, Layers,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ── Table / content helpers ───────────────────────────────────────────────────
const convertTableToHtml = (tableLines: string[]): string => {
  let html = '<div class="overflow-x-auto my-4 rounded-lg border border-slate-200"><table class="min-w-full bg-white">'
  let isHeader = true, hasSeparator = false
  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) { isHeader = false; hasSeparator = true; continue }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '')
      if (!cells.length) continue
      html += `<tr class="${isHeader && !hasSeparator ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'} border-b border-slate-100">`
      cells.forEach(cell => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        const cls = isHeader && !hasSeparator
          ? 'px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-100 last:border-r-0'
          : 'px-4 py-2.5 text-sm text-slate-600 border-r border-slate-100 last:border-r-0'
        html += `<${tag} class="${cls}">${cell.trim()}</${tag}>`
      })
      html += '</tr>'
      if (isHeader && hasSeparator) isHeader = false
    }
  }
  return html + '</table></div>'
}

const renderContent = (text: string) => {
  if (!text) return null
  const tableRegex = /(\n?\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const match = tableRegex.exec(text)
  if (match) {
    const tableHtml = convertTableToHtml(match[0].split('\n').filter(l => l.trim()))
    const rest = text.replace(match[0], '')
    return (
      <div className="space-y-3">
        {rest && <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{rest}</div>}
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    )
  }
  return <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{text}</div>
}

const getAnswerHtml = (answer: any): string => {
  if (!answer) return '<p class="text-slate-400 italic text-sm">No answer provided.</p>'
  if (typeof answer === 'string') return answer
  if (typeof answer === 'object') {
    if (answer.text) return String(answer.text)
    if (answer.answer) return String(answer.answer)
    if (answer.html) return String(answer.html)
    if (answer.content) return String(answer.content)
    return `<pre class="text-xs">${JSON.stringify(answer, null, 2)}</pre>`
  }
  return String(answer)
}

// ── Constants ─────────────────────────────────────────────────────────────────
const EXAM_TOTAL = 60
const CA_TOTAL = 40

// ── Grade helpers ─────────────────────────────────────────────────────────────
const getWAECGrade = (pct: number) =>
  pct >= 75 ? 'A1' : pct >= 70 ? 'B2' : pct >= 65 ? 'B3' : pct >= 60 ? 'C4' :
  pct >= 55 ? 'C5' : pct >= 50 ? 'C6' : pct >= 45 ? 'D7' : pct >= 40 ? 'E8' : 'F9'

const gradeAccent = (pct: number) =>
  pct >= 70 ? 'text-emerald-600' : pct >= 55 ? 'text-blue-600' :
  pct >= 40 ? 'text-amber-600' : 'text-red-500'

const gradeBg = (pct: number) =>
  pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 55 ? 'bg-blue-100 text-blue-700' :
  pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

const barColor = (pct: number) =>
  pct >= 70 ? 'bg-emerald-500' : pct >= 55 ? 'bg-blue-500' :
  pct >= 40 ? 'bg-amber-500' : 'bg-red-500'

// ── Mini score row ────────────────────────────────────────────────────────────
function ScoreRow({ label, score, max, accent }: { label: string; score: number; max: number; accent: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-medium text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', accent)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-16 text-right flex-shrink-0">
        {score} <span className="font-normal text-slate-400">/ {max}</span>
      </span>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    pending_theory: { label: 'Pending Theory', cls: 'bg-amber-100 text-amber-700', icon: Clock },
    graded:         { label: 'Graded',         cls: 'bg-violet-100 text-violet-700', icon: Award },
    completed:      { label: 'Completed',       cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    in_progress:    { label: 'In Progress',     cls: 'bg-blue-100 text-blue-700', icon: Clock },
  }
  const cfg = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600', icon: AlertCircle }
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.cls)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GradeSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const submissionId = params.submissionId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [examTitle, setExamTitle] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [theoryScore, setTheoryScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [theoryQuestions, setTheoryQuestions] = useState<any[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({})
  const [objectiveMax, setObjectiveMax] = useState(20)
  const [theoryMax, setTheoryMax] = useState(40)
  const [hasTheory, setHasTheory] = useState(false)
  const [caScores, setCaScores] = useState({ ca1: 0, ca2: 0, total: 0 })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { 
        toast.error('Please sign in to continue')
        router.push('/portal')
        return 
      }

      const { data: att, error: attErr } = await supabase.from('exam_attempts').select('*').eq('id', submissionId).single()
      if (attErr || !att) { 
        toast.error('Submission not found')
        setLoading(false)
        return 
      }

      const { data: examData } = await supabase.from('exams').select('*').eq('id', att.exam_id).single()
      setExam(examData)
      setExamTitle(examData?.title || 'Untitled Exam')
      setSubjectName(examData?.subject || '')

      // ✅ Get objective_max from exam configuration
      const objectiveMaxFromExam = Number(examData?.objective_max) || Number(examData?.total_questions) || 20
      setObjectiveMax(objectiveMaxFromExam)
      setTheoryMax(EXAM_TOTAL - objectiveMaxFromExam)

      const examHasTheory = examData?.has_theory || (Array.isArray(examData?.theory_questions) && examData.theory_questions.length > 0)
      setHasTheory(examHasTheory)

      if (examData?.theory_questions) {
        const tq = typeof examData.theory_questions === 'string' ? JSON.parse(examData.theory_questions) : examData.theory_questions
        setTheoryQuestions(Array.isArray(tq) ? tq.map((q: any, i: number) => ({ ...q, id: q.id || `q-${i}`, question: q.question || 'No question text', points: Number(q.marks || q.points || 10), order_number: i + 1, sub_questions: q.sub_questions || [], image_url: q.image_url, image_caption: q.image_caption })) : [])
      }

      if (att.theory_answers) {
        const answers = typeof att.theory_answers === 'string' ? JSON.parse(att.theory_answers) : att.theory_answers
        setStudentAnswers(answers || {})
      }

      const { data: student } = await supabase.from('profiles').select('photo_url, class, full_name, email').eq('id', att.student_id).single()
      const { data: caData } = await supabase.from('ca_scores').select('ca1_score, ca2_score').eq('student_id', att.student_id).eq('exam_id', att.exam_id).maybeSingle()
      if (caData) { const ca1 = Number(caData.ca1_score) || 0, ca2 = Number(caData.ca2_score) || 0; setCaScores({ ca1, ca2, total: ca1 + ca2 }) }

      let existingTheoryScore = ''
      if (att.theory_score !== undefined && att.theory_score > 0) existingTheoryScore = String(att.theory_score)
      else if (att.theory_feedback?.total?.score !== undefined) existingTheoryScore = String(att.theory_feedback.total.score)

      setAttempt({ ...att, student_name: student?.full_name || att.student_name || 'Unknown', student_email: student?.email || att.student_email || '', photo_url: student?.photo_url || null, student_class: student?.class || att.student_class || '—' })
      setTheoryScore(existingTheoryScore)
      setFeedback(att.theory_feedback?.total?.feedback || att.feedback || '')
    } catch (error) {
      console.error(error); toast.error('Failed to load submission')
    } finally { setLoading(false) }
  }, [submissionId, router])

  useEffect(() => { loadData() }, [loadData])

  const toggleQuestion = (qId: string) =>
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }))

  const updateTermProgress = async (studentId: string, studentClass: string) => {
    try {
      const term = exam?.term || attempt?.term || 'third'
      const sessionYear = exam?.session_year || attempt?.session_year || '2025/2026'
      const { data: completedAttempts } = await supabase.from('exam_attempts').select('exam_id, percentage').eq('student_id', studentId).eq('term', term).eq('session_year', sessionYear).eq('status', 'graded')
      const attempts = completedAttempts || []
      if (attempts.length > 0) {
        const avgScore = Math.round(attempts.reduce((s: number, a: any) => s + (a.percentage || 0), 0) / attempts.length)
        const isJSS = studentClass?.toUpperCase()?.startsWith('JSS')
        const totalSubjects = isJSS ? 17 : 10, minRequired = isJSS ? 16 : 9
        let termGrade = avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'C' : avgScore >= 50 ? 'P' : 'F'
        await supabase.from('student_term_progress').upsert({ student_id: studentId, class: studentClass, term, session_year: sessionYear, completed_exams: attempts.length, total_subjects: totalSubjects, required_subjects: totalSubjects, min_required_subjects: minRequired, average_score: avgScore, grade: termGrade, term_completed: attempts.length >= minRequired, completed_at: attempts.length >= minRequired ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: 'student_id,term,session_year' })
      }
    } catch (error) { console.error('Term progress error:', error) }
  }

  const handleSave = async () => {
    if (!attempt) { toast.error('No submission data'); return }
    let tScore = 0
    if (hasTheory) {
      tScore = parseFloat(theoryScore)
      if (isNaN(tScore) || tScore < 0) { toast.error('Please enter a valid theory score'); return }
      tScore = Math.min(Math.round(tScore), theoryMax)
    }
    setSaving(true)
    
    const objScore = Math.min(Math.round(Number(attempt.objective_score) || 0), objectiveMax)
    const examScore = objScore + tScore
    const grandScore = examScore + caScores.total
    const grandPct = Math.round((grandScore / (EXAM_TOTAL + CA_TOTAL)) * 100)
    const grade = getWAECGrade(grandPct)
    
    try {
      const updateData: any = { 
        status: 'graded', 
        objective_score: objScore, 
        objective_total: objectiveMax, 
        theory_score: tScore, 
        theory_total: theoryMax, 
        total_score: examScore, 
        total_marks: EXAM_TOTAL, 
        percentage: grandPct, 
        is_passed: grandPct >= 40, 
        updated_at: new Date().toISOString(), 
        grade, 
        feedback: feedback || `Theory: ${tScore}/${theoryMax} | CA: ${caScores.total}/${CA_TOTAL}` 
      }
      if (hasTheory) updateData.theory_feedback = { total: { score: tScore, max: theoryMax, feedback: feedback || `Theory: ${tScore}/${theoryMax}` } }
      
      const { error } = await supabase.from('exam_attempts').update(updateData).eq('id', submissionId)
      if (error) { toast.error(`Failed to save: ${error.message}`); setSaving(false); return }
      
      toast.success(`Grade saved — ${grade} (${grandPct}%)`)
      await updateTermProgress(attempt.student_id, attempt.student_class)
      setTimeout(() => { router.push(`/staff/exams/${examId}/submissions`); router.refresh() }, 1800)
    } catch (error: any) {
      toast.error(`Failed: ${error.message || 'Unknown error'}`)
    } finally { setSaving(false) }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    const p = name.split(' ')
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
  }

  // ── Live calculations ─────────────────────────────────────────────────────
  const objScore = Math.min(Math.round(Number(attempt?.objective_score) || 0), objectiveMax)
  const tScore = hasTheory ? Math.min(Math.round(parseFloat(theoryScore) || 0), theoryMax) : 0
  const examScore = objScore + tScore
  const grandScore = examScore + caScores.total
  const grandTotal = EXAM_TOTAL + CA_TOTAL
  const grandPct = Math.round((grandScore / grandTotal) * 100)
  const grade = getWAECGrade(grandPct)

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <GraduationCap className="h-10 w-10 text-emerald-600" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading submission…</p>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-red-100">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <p className="text-base font-semibold text-slate-700">Submission not found</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>← Go back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {hasTheory ? 'Grade Submission' : 'View Submission'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{examTitle} · {subjectName}</p>
          </div>
        </div>
        <StatusBadge status={attempt.status} />
      </div>

      {/* ── Student card ─────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-11 w-11 flex-shrink-0">
            <AvatarImage src={attempt.photo_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
              {getInitials(attempt.student_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{attempt.student_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{attempt.student_email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <BookOpen className="h-3 w-3" /> {attempt.student_class}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" /> {formatDate(attempt.submitted_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Theory questions ──────────────────────────────────────────────── */}
      {hasTheory && theoryQuestions.length > 0 && (
        <div className="space-y-3">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/30">
              <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Theory Questions</h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
              {theoryQuestions.length}
            </span>
          </div>

          {theoryQuestions.map((q, idx) => {
            const rawAnswer = studentAnswers[q.id] || attempt.theory_answers?.[q.id] || null
            const answerHtml = getAnswerHtml(rawAnswer)
            const isExpanded = expandedQuestions[q.id] !== false

            return (
              <Card key={q.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                {/* Question header */}
                <button
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800"
                  onClick={() => toggleQuestion(q.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full">
                        Q{idx + 1}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {q.points} mark{q.points !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {renderContent(q.question)}
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-slate-400" />
                      : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {/* Student answer */}
                {isExpanded && (
                  <div className="px-5 py-4 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Student's Answer</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                      <div
                        className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed prose prose-sm max-w-none
                          [&_table]:w-full [&_table]:border-collapse [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:border [&_table]:border-slate-200
                          [&_th]:border [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-700 [&_th]:text-xs
                          [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-slate-600
                          [&_tr:hover]:bg-slate-50 [&_p]:mb-2 [&_p:last-child]:mb-0
                          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1
                          [&_strong]:font-semibold [&_em]:italic [&_u]:underline
                          [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500
                          [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                          [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:font-mono"
                        dangerouslySetInnerHTML={{ __html: answerHtml }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Grading panel ─────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top accent bar */}
        <div className={cn('h-1', barColor(grandPct))} />

        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {hasTheory ? 'Grade Submission' : 'Score Summary'}
              </CardTitle>
            </div>
            {/* Live grade pill */}
            <div className="flex items-center gap-2">
              <span className={cn('text-2xl font-black tabular-nums', gradeAccent(grandPct))}>
                {grandPct}%
              </span>
              <span className={cn('text-sm font-bold px-2.5 py-1 rounded-full', gradeBg(grandPct))}>
                {grade}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">

          {/* ── Score breakdown bars ─────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Score Breakdown</p>
            <ScoreRow label="Objective" score={objScore} max={objectiveMax} accent="bg-blue-500" />
            {hasTheory && <ScoreRow label="Theory" score={tScore} max={theoryMax} accent="bg-violet-500" />}
            <ScoreRow label="CA (CA1 + CA2)" score={caScores.total} max={CA_TOTAL} accent="bg-indigo-500" />
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <ScoreRow label="Exam Score" score={examScore} max={EXAM_TOTAL} accent="bg-emerald-500" />
            </div>
          </div>

          {/* ── CA detail ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
            <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Continuous Assessment</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">CA1: {caScores.ca1}/20 · CA2: {caScores.ca2}/20</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 tabular-nums">{caScores.total}</span>
              <span className="text-xs text-indigo-400 dark:text-indigo-500"> / {CA_TOTAL}</span>
            </div>
          </div>

          {/* ── Theory score input ────────────────────────────────────────── */}
          {hasTheory && (
            <div className="space-y-2 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-100 dark:border-violet-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                    Theory Score
                  </Label>
                </div>
                <span className="text-xs text-violet-500 dark:text-violet-400">max {theoryMax} marks</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min="0" max={theoryMax} step="0.5"
                  value={theoryScore} onChange={e => setTheoryScore(e.target.value)}
                  placeholder="0"
                  className="h-10 w-28 text-center text-lg font-bold bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
                <span className="text-sm text-violet-500 dark:text-violet-400 font-medium">/ {theoryMax}</span>
                {theoryScore && !isNaN(parseFloat(theoryScore)) && (
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full ml-auto', gradeBg(Math.round((parseFloat(theoryScore) / theoryMax) * 100)))}>
                    {Math.round((parseFloat(theoryScore) / theoryMax) * 100)}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Feedback ──────────────────────────────────────────────────── */}
          {hasTheory && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Feedback <span className="font-normal normal-case text-slate-400">(optional)</span>
              </Label>
              <Textarea
                value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Write feedback for the student…"
                className="resize-none text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-400"
                rows={3}
              />
            </div>
          )}

          {/* ── Grand total ───────────────────────────────────────────────── */}
          <div className={cn('rounded-xl p-4 border-2', grandPct >= 40 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50')}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wide', grandPct >= 40 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>
                  Grand Total
                </p>
                <p className={cn('text-xs mt-0.5', grandPct >= 40 ? 'text-emerald-600/70 dark:text-emerald-500/70' : 'text-red-600/70 dark:text-red-500/70')}>
                  Exam {examScore} + CA {caScores.total}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className={cn('text-3xl font-black tabular-nums', grandPct >= 40 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300')}>
                    {grandScore}
                  </span>
                  <span className={cn('text-sm', grandPct >= 40 ? 'text-emerald-400' : 'text-red-400')}>
                    / {grandTotal}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span className={cn('text-sm font-bold', gradeAccent(grandPct))}>{grandPct}%</span>
                  <span className={cn('text-sm font-bold px-2.5 py-0.5 rounded-full', gradeBg(grandPct))}>{grade}</span>
                </div>
              </div>
            </div>
            {/* Grand total progress bar */}
            <div className="h-2 w-full bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', barColor(grandPct))}
                style={{ width: `${Math.min(grandPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1 font-medium"
              style={{ color: grandPct >= 40 ? '#059669' : '#dc2626', opacity: 0.7 }}>
              <span>0</span>
              <span>{grandPct >= 40 ? '✓ Passed' : '✗ Failed'}</span>
              <span>{grandTotal}</span>
            </div>
          </div>

          {/* ── Objective score note ──────────────────────────────────────── */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Objective (Auto-graded)</p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">System scored from student's selections</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-black text-blue-700 dark:text-blue-300 tabular-nums">{objScore}</span>
              <span className="text-xs text-blue-400 dark:text-blue-500"> / {objectiveMax}</span>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ── Save button ───────────────────────────────────────────────────── */}
      <Button
        onClick={handleSave}
        disabled={saving || (hasTheory && !theoryScore)}
        className={cn(
          'w-full h-12 font-semibold text-sm rounded-xl shadow-sm transition-all gap-2',
          grandPct >= 40
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-red-500 hover:bg-red-600 text-white',
          (saving || (hasTheory && !theoryScore)) && 'opacity-60 cursor-not-allowed',
        )}
      >
        {saving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          : <><Save className="h-4 w-4" /> Save Grade — {grade} ({grandPct}%)</>}
      </Button>

    </div>
  )
}