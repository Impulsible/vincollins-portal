'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Save, CheckCircle, Clock, AlertCircle,
  Loader2, Award, Target, PenTool, ChevronDown, ChevronUp,
  FileText, Brain, TrendingUp, BarChart3
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ============ TABLE CONVERSION ============
const convertTableToHtml = (tableLines: string[]): string => {
  let html = '<div class="overflow-x-auto my-4 shadow-md rounded-lg border border-gray-200"><table class="min-w-full bg-white rounded-lg">'
  let isHeader = true
  let hasSeparator = false

  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false
      hasSeparator = true
      continue
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((cell: string) => cell.trim() !== '')
      if (cells.length === 0) continue
      html += '<tr class="' + (isHeader && !hasSeparator ? 'bg-gray-100' : 'bg-white hover:bg-gray-50') + ' border-b border-gray-200">'
      cells.forEach((cell: string) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        const classes = (isHeader && !hasSeparator)
          ? 'px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0'
          : 'px-4 py-3 text-sm text-gray-600 border-r border-gray-200 last:border-r-0'
        html += `<${tag} class="${classes}">${cell.trim()}</${tag}>`
      })
      html += '</tr>'
      if (isHeader && hasSeparator) isHeader = false
    }
  }
  html += '</table></div>'
  return html
}

const renderContent = (text: string) => {
  if (!text) return null

  const tableRegex = /(\n?\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const match = tableRegex.exec(text)

  if (match) {
    const tableLines = match[0].split('\n').filter(line => line.trim())
    const tableHtml = convertTableToHtml(tableLines)
    const remainingText = text.replace(match[0], '')

    return (
      <div className="space-y-4">
        {remainingText && (
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {remainingText}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    )
  }

  return (
    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
      {text}
    </div>
  )
}

const getAnswerHtml = (answer: any): string => {
  if (!answer) return '<p class="text-slate-400 italic">No answer provided.</p>'
  if (typeof answer === 'string') return answer
  if (typeof answer === 'object') {
    if (answer.text) return String(answer.text)
    if (answer.answer) return String(answer.answer)
    if (answer.html) return String(answer.html)
    if (answer.content) return String(answer.content)
    return `<pre>${JSON.stringify(answer, null, 2)}</pre>`
  }
  return String(answer)
}

// Constants
const EXAM_TOTAL = 60
const CA_TOTAL = 40

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
  const [theoryScore, setTheoryScore] = useState<string>('')
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
      if (!session) { router.push('/portal'); return }

      const { data: att, error: attError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (attError || !att) {
        toast.error('Submission not found')
        setLoading(false)
        return
      }

      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', att.exam_id)
        .single()

      setExam(examData)
      setExamTitle(examData?.title || 'Untitled Exam')
      setSubjectName(examData?.subject || '')

      const rawObjMax = Number(att.objective_max) || Number(examData?.objective_max) || 20
      setObjectiveMax(rawObjMax)
      setTheoryMax(EXAM_TOTAL - rawObjMax)

      const examHasTheory = examData?.has_theory ||
        (examData?.theory_questions &&
          Array.isArray(examData.theory_questions) &&
          examData.theory_questions.length > 0)
      setHasTheory(examHasTheory)

      if (examData?.theory_questions) {
        const tq = typeof examData.theory_questions === 'string'
          ? JSON.parse(examData.theory_questions)
          : examData.theory_questions
        setTheoryQuestions(Array.isArray(tq) ? tq.map((q: any, i: number) => ({
          ...q,
          id: q.id || `q-${i}`,
          question: q.question || 'No question text',
          points: Number(q.marks || q.points || 10),
          order_number: i + 1,
          sub_questions: q.sub_questions || [],
          image_url: q.image_url,
          image_caption: q.image_caption
        })) : [])
      }

      if (att.theory_answers) {
        const answers = typeof att.theory_answers === 'string'
          ? JSON.parse(att.theory_answers)
          : att.theory_answers
        setStudentAnswers(answers || {})
      }

      const { data: student } = await supabase
        .from('profiles')
        .select('photo_url, class, full_name, email')
        .eq('id', att.student_id)
        .single()

      const { data: caData } = await supabase
        .from('ca_scores')
        .select('ca1_score, ca2_score')
        .eq('student_id', att.student_id)
        .eq('exam_id', att.exam_id)
        .maybeSingle()

      if (caData) {
        const ca1 = Number(caData.ca1_score) || 0
        const ca2 = Number(caData.ca2_score) || 0
        setCaScores({ ca1, ca2, total: ca1 + ca2 })
      }

      let existingTheoryScore = ''
      if (att.theory_score !== undefined && att.theory_score > 0) {
        existingTheoryScore = String(att.theory_score)
      } else if (att.theory_feedback?.total?.score !== undefined) {
        existingTheoryScore = String(att.theory_feedback.total.score)
      }

      let existingFeedback = ''
      if (att.theory_feedback?.total?.feedback) {
        existingFeedback = att.theory_feedback.total.feedback
      } else if (att.feedback) {
        existingFeedback = att.feedback
      }

      setAttempt({
        ...att,
        student_name: student?.full_name || att.student_name || 'Unknown',
        student_email: student?.email || att.student_email || '',
        photo_url: student?.photo_url || null,
        student_class: student?.class || att.student_class || '—'
      })
      setTheoryScore(existingTheoryScore)
      setFeedback(existingFeedback)

    } catch (error) {
      console.error('Error loading submission:', error)
      toast.error('Failed to load submission')
    } finally {
      setLoading(false)
    }
  }, [submissionId, router])

  useEffect(() => { loadData() }, [loadData])

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }))
  }

  const updateTermProgress = async (studentId: string, studentClass: string) => {
    try {
      const term = exam?.term || attempt?.term || 'third'
      const sessionYear = exam?.session_year || attempt?.session_year || '2025/2026'

      const { data: completedAttempts } = await supabase
        .from('exam_attempts')
        .select('exam_id, percentage')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('session_year', sessionYear)
        .eq('status', 'graded')

      const attempts = completedAttempts || []
      const completedCount = attempts.length

      if (completedCount > 0) {
        const avgScore = Math.round(
          attempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / completedCount
        )

        const isJSS = studentClass?.toUpperCase()?.startsWith('JSS')
        const totalSubjects = isJSS ? 17 : 10
        const minRequired = isJSS ? 16 : 9

        let termGrade = 'F'
        if (avgScore >= 80) termGrade = 'A'
        else if (avgScore >= 70) termGrade = 'B'
        else if (avgScore >= 60) termGrade = 'C'
        else if (avgScore >= 50) termGrade = 'P'

        await supabase
          .from('student_term_progress')
          .upsert({
            student_id: studentId,
            class: studentClass,
            term,
            session_year: sessionYear,
            completed_exams: completedCount,
            total_subjects: totalSubjects,
            required_subjects: totalSubjects,
            min_required_subjects: minRequired,
            average_score: avgScore,
            grade: termGrade,
            term_completed: completedCount >= minRequired,
            completed_at: completedCount >= minRequired ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id,term,session_year' })
      }
    } catch (error) {
      console.error('Error updating term progress:', error)
    }
  }

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

  const getGradeColor = (pct: number): string => {
    if (pct >= 75) return 'text-emerald-600'
    if (pct >= 70) return 'text-emerald-500'
    if (pct >= 65) return 'text-blue-600'
    if (pct >= 60) return 'text-blue-500'
    if (pct >= 55) return 'text-amber-600'
    if (pct >= 50) return 'text-amber-500'
    if (pct >= 45) return 'text-orange-500'
    if (pct >= 40) return 'text-orange-400'
    return 'text-red-500'
  }

  // ============================================
  // ✅ FIXED: Only updates columns that exist
  // ============================================
  const handleSave = async () => {
    if (!attempt) {
      toast.error('No submission data')
      return
    }

    let tScore = 0
    if (hasTheory) {
      tScore = parseFloat(theoryScore)
      if (isNaN(tScore) || tScore < 0) {
        toast.error('Please enter a valid theory score')
        return
      }
      tScore = Math.min(Math.round(tScore), theoryMax)
    }

    setSaving(true)

    const objScore = Math.min(
      Math.round(Number(attempt.objective_score) || 0),
      objectiveMax
    )

    // Exam Score = Objective + Theory (always out of 60)
    const examScore = objScore + tScore

    // Grand Total = Exam + CA (always out of 100)
    const grandScore = examScore + caScores.total
    const grandTotal = EXAM_TOTAL + CA_TOTAL
    const grandPercentage = Math.round((grandScore / grandTotal) * 100)
    const grade = getWAECGrade(grandPercentage)
    const isPassed = grandPercentage >= 40

    try {
      // ✅ ONLY update columns that EXIST in the table
      const updateData: any = {
        status: 'graded',
        objective_score: objScore,
        objective_total: objectiveMax,
        theory_score: tScore,
        theory_total: theoryMax,
        total_score: examScore,
        total_marks: EXAM_TOTAL,
        percentage: grandPercentage,
        is_passed: isPassed,
        updated_at: new Date().toISOString(),
        grade: grade,
        feedback: feedback || `Theory: ${tScore}/${theoryMax} | CA: ${caScores.total}/${CA_TOTAL}`
      }

      // ✅ Add theory_feedback if theory exists
      if (hasTheory) {
        updateData.theory_feedback = {
          total: {
            score: tScore,
            max: theoryMax,
            feedback: feedback || `Theory: ${tScore}/${theoryMax}`
          }
        }
      }

      console.log('📤 Update data:', updateData)

      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update(updateData)
        .eq('id', submissionId)

      if (updateError) {
        console.error('❌ Update error:', updateError)
        toast.error(`Failed to save: ${updateError.message}`)
        setSaving(false)
        return
      }

      toast.success(
        `✅ Grade saved! Exam: ${examScore}/${EXAM_TOTAL} | CA: ${caScores.total}/${CA_TOTAL} | Total: ${grandScore}/${grandTotal} (${grandPercentage}%) | Grade: ${grade}`
      )

      await updateTermProgress(attempt.student_id, attempt.student_class)

      setTimeout(() => {
        router.push(`/staff/exams/${examId}/submissions`)
        router.refresh()
      }, 2000)

    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_theory':
        return <Badge className="bg-amber-100 text-amber-700 text-xs"><Clock className="mr-1 h-3 w-3" />Pending Theory</Badge>
      case 'graded':
        return <Badge className="bg-purple-100 text-purple-700 text-xs"><Award className="mr-1 h-3 w-3" />Graded</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 text-xs"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    } catch { return '—' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-600">Submission not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  // ── Live calculations ──
  const objScore = Math.min(
    Math.round(Number(attempt.objective_score) || 0),
    objectiveMax
  )
  const tScore = hasTheory
    ? Math.min(Math.round(parseFloat(theoryScore) || 0), theoryMax)
    : 0

  const examScore = objScore + tScore
  const examPct = Math.round((examScore / EXAM_TOTAL) * 100)

  const grandScore = examScore + caScores.total
  const grandTotal = EXAM_TOTAL + CA_TOTAL
  const grandPct = Math.round((grandScore / grandTotal) * 100)
  const grade = getWAECGrade(grandPct)
  const gradeColor = getGradeColor(grandPct)

  const getProgressColor = (pct: number) => {
    if (pct >= 75) return 'bg-emerald-500'
    if (pct >= 60) return 'bg-blue-500'
    if (pct >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {hasTheory ? 'Grade Submission' : 'View Submission'}
            </h1>
            <p className="text-sm text-slate-500">{examTitle} • {subjectName}</p>
          </div>
        </div>
        {getStatusBadge(attempt.status)}
      </div>

      {/* Student Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={attempt.photo_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {getInitials(attempt.student_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{attempt.student_name}</p>
            <p className="text-xs text-slate-500 truncate">
              {attempt.student_email} • {attempt.student_class}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatDate(attempt.submitted_at)}
          </Badge>
        </CardContent>
      </Card>

      {/* CA Scores Display */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 text-sm">CA Scores</p>
              <p className="text-xs text-indigo-600">
                CA1: {caScores.ca1}/20 • CA2: {caScores.ca2}/20
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-700">{caScores.total}</span>
            <span className="text-sm text-indigo-500">/{CA_TOTAL}</span>
          </div>
        </CardContent>
      </Card>

      {/* Theory Questions */}
      {hasTheory && theoryQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800">Theory Questions</h2>
            <Badge className="bg-purple-100 text-purple-700 ml-2">
              {theoryQuestions.length} Questions
            </Badge>
          </div>

          {theoryQuestions.map((q, idx) => {
            const rawAnswer = studentAnswers[q.id] || attempt.theory_answers?.[q.id] || null
            const answerHtml = getAnswerHtml(rawAnswer)
            const isExpanded = expandedQuestions[q.id] !== false

            return (
              <Card
                key={q.id}
                className="border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleQuestion(q.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          Question {idx + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {q.points} marks
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-slate-800 leading-relaxed">
                        {renderContent(q.question)}
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
                      : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
                    }
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 py-4 bg-slate-50/30">
                    <div className="flex items-start gap-2 mb-3">
                      <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                      <p className="text-sm font-medium text-slate-700">Student's Answer:</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div
                        className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none
                          [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-200 [&_table]:rounded-lg [&_table]:overflow-hidden
                          [&_th]:border [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-700
                          [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-gray-600
                          [&_tr:hover]:bg-gray-50
                          [&_p]:mb-2 [&_p:last-child]:mb-0
                          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
                          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
                          [&_li]:mb-1
                          [&_strong]:font-semibold [&_b]:font-semibold
                          [&_em]:italic [&_i]:italic
                          [&_u]:underline
                          [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2
                          [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2
                          [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1
                          [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mb-1
                          [&_br]:block
                          [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500
                          [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                          [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:font-mono
                          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2
                          [&_a]:text-blue-600 [&_a]:underline
                          [&_hr]:border-gray-200 [&_hr]:my-3
                          [&_sub]:text-xs [&_sup]:text-xs"
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

      {/* Grading Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800">Grade Submission</h2>
          <Badge className="bg-emerald-100 text-emerald-700 ml-2">
            {EXAM_TOTAL} Marks
          </Badge>
        </div>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-5 sm:p-6 space-y-6">

            {/* Objective Score */}
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Objective Score</p>
                    <p className="text-xs text-blue-600">Auto-graded from student's answers</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-700">{objScore}</span>
                  <span className="text-sm text-blue-500">/{objectiveMax}</span>
                </div>
              </div>
            </div>

            {/* Theory Score Input */}
            {hasTheory && (
              <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm">
                      <PenTool className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900 text-sm">Theory Score</p>
                      <p className="text-xs text-purple-600">
                        Enter total theory score (max {theoryMax})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={theoryMax}
                      step="0.5"
                      value={theoryScore}
                      onChange={(e) => setTheoryScore(e.target.value)}
                      placeholder="Score"
                      className="h-10 w-24 text-center text-lg font-bold bg-white border-purple-200 focus:border-purple-400"
                    />
                    <span className="text-sm text-purple-500 font-medium">/ {theoryMax}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback */}
            {hasTheory && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Feedback (optional)</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide overall feedback to the student..."
                  className="mt-2 rounded-xl border-slate-200 focus:border-purple-300"
                  rows={3}
                />
              </div>
            )}

            {/* Exam Score - Shows out of 60 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Exam Score</p>
                  <p className="text-xs text-slate-400">
                    {objScore} (obj) + {tScore} (theory) = {examScore}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-600">{examScore}</span>
                  <span className="text-sm text-emerald-400">/{EXAM_TOTAL}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{examPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getProgressColor(examPct)
                    )}
                    style={{ width: `${Math.min(examPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0</span>
                  <span>{EXAM_TOTAL} marks</span>
                </div>
              </div>
            </div>

            {/* CA Scores Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-sm">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">CA Score</p>
                    <p className="text-xs text-indigo-600">
                      CA1: {caScores.ca1}/20 • CA2: {caScores.ca2}/20
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-700">{caScores.total}</span>
                  <span className="text-sm text-indigo-400">/{CA_TOTAL}</span>
                </div>
              </div>
            </div>

            {/* Grand Total - Featured */}
            <div className="bg-gradient-to-r from-emerald-50 to-white rounded-xl p-5 border-2 border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Grand Total</p>
                  <p className="text-xs text-emerald-600">
                    Exam ({examScore}) + CA ({caScores.total}) = {grandScore}
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-1">
                    {EXAM_TOTAL} + {CA_TOTAL} = {grandTotal}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-emerald-700">{grandScore}</span>
                    <span className="text-sm text-emerald-400">/{grandTotal}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end mt-1">
                    <span className={cn("text-sm font-bold", getGradeColor(grandPct))}>
                      {grandPct}%
                    </span>
                    <Badge className={cn(
                      "text-sm font-bold px-3 py-1",
                      grandPct >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {grade}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || (hasTheory && !theoryScore)}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        {saving
          ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          : <Save className="mr-2 h-5 w-5" />
        }
        {saving
          ? 'Saving...'
          : `Save Grade — ${grade} (${grandPct}%)`
        }
      </Button>
    </div>
  )
}