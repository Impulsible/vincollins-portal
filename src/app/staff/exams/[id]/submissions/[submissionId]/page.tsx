// app/staff/exams/[id]/submissions/[submissionId]/page.tsx - FULLY FIXED
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
  FileText, Eye
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
  const [theoryMax, setTheoryMax] = useState(40)
  const [objTotal, setObjTotal] = useState(20)
  const [hasTheory, setHasTheory] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      // Load attempt
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

      // Load exam
      const { data: examData } = await supabase
        .from('exams')
        .select('id, title, subject, theory_questions, theory_total, has_theory, total_marks, questions, term, session_year')
        .eq('id', att.exam_id)
        .single()

      setExam(examData)
      setExamTitle(examData?.title || 'Untitled Exam')
      setSubjectName(examData?.subject || '')
      setHasTheory(examData?.has_theory || false)

      // Dynamic theory max
      const examTheoryMax = examData?.theory_total || Number(att.theory_total) || 40
      setTheoryMax(examTheoryMax)

      // Dynamic objective total
      setObjTotal(Number(att.objective_total) || 30)

      // Process theory questions
      if (examData?.theory_questions) {
        const tq = typeof examData.theory_questions === 'string'
          ? JSON.parse(examData.theory_questions)
          : examData.theory_questions
        setTheoryQuestions(Array.isArray(tq) ? tq.map((q: any, i: number) => ({
          ...q,
          id: q.id || `q-${i}`,
          question: q.question || 'No question text',
          points: Number(q.marks || q.points || 10),
          order_number: i + 1
        })) : [])
      }

      // Process student answers
      if (att.theory_answers) {
        const answers = typeof att.theory_answers === 'string'
          ? JSON.parse(att.theory_answers)
          : att.theory_answers
        setStudentAnswers(answers || {})
      }

      // Load student profile
      const { data: student } = await supabase
        .from('profiles')
        .select('photo_url, class')
        .eq('id', att.student_id)
        .single()

      // Get existing theory score
      let existingScore = ''
      if (att.theory_feedback?.total?.score !== undefined) {
        existingScore = String(att.theory_feedback.total.score)
      }

      // Get existing feedback
      let existingFeedback = ''
      if (att.theory_feedback?.total?.feedback) {
        existingFeedback = att.theory_feedback.total.feedback
      }

      setAttempt({
        ...att,
        photo_url: student?.photo_url || null,
        student_class: student?.class || att.student_class || '—'
      })
      setTheoryScore(existingScore)
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

  // Update term progress
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
        const avgScore = Math.round(attempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / completedCount)

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

  // WAEC Grade
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

  const handleSave = async () => {
    if (!attempt) return

    // Only validate theory score if exam has theory
    let tScore = 0
    if (hasTheory) {
      tScore = parseFloat(theoryScore)
      if (isNaN(tScore) || tScore < 0 || tScore > theoryMax) {
        toast.error(`Theory score must be between 0 and ${theoryMax}`)
        return
      }
      tScore = Math.round(tScore)
    }

    setSaving(true)

    const objScore = Number(attempt.objective_score) || 0
    // ✅ FIX: When no theory, totalMarks = objTotal only
    const theoryTotal = hasTheory ? theoryMax : 0
    const totalScore = objScore + tScore
    const totalMarks = hasTheory ? (objTotal + theoryTotal) : objTotal
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
    const isPassed = percentage >= 50
    const grade = getWAECGrade(percentage)

    const term = exam?.term || attempt.term || 'third'
    const sessionYear = exam?.session_year || attempt.session_year || '2025/2026'

    try {
      // Build update object
      const updateData: any = {
        total_score: totalScore,
        total_marks: totalMarks,
        percentage,
        is_passed: isPassed,
        status: hasTheory ? 'graded' : 'completed',
        term,
        session_year: sessionYear,
        updated_at: new Date().toISOString()
      }

      // Only add theory_feedback if exam has theory
      if (hasTheory) {
        updateData.theory_feedback = {
          total: {
            score: tScore,
            max: theoryTotal,
            feedback: feedback || `Theory: ${tScore}/${theoryTotal}`
          }
        }
      }

      const { error } = await supabase
        .from('exam_attempts')
        .update(updateData)
        .eq('id', submissionId)

      if (error) throw error

      // Update CA scores if they exist
      const { data: existingCA } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', attempt.student_id)
        .eq('exam_id', attempt.exam_id)
        .maybeSingle()

      if (existingCA) {
        await supabase
          .from('ca_scores')
          .update({
            exam_score: totalScore,
            total_score: (existingCA.ca1_score || 0) + (existingCA.ca2_score || 0) + totalScore,
            grade: grade,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCA.id)
      }

      // Update term progress
      await updateTermProgress(attempt.student_id, attempt.student_class)

      toast.success(`✅ Saved! ${objScore}${hasTheory ? `(Obj) + ${tScore}(Theory)` : '(Obj)'} = ${totalScore}/${totalMarks} (${percentage}%) - Grade: ${grade}`)

      // Navigate back
      setTimeout(() => {
        router.push(`/staff/exams/${examId}/submissions`)
      }, 500)

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
      case 'pending_theory': return <Badge className="bg-amber-100 text-amber-700 text-xs"><Clock className="mr-1 h-3 w-3" />Pending Theory</Badge>
      case 'graded': return <Badge className="bg-purple-100 text-purple-700 text-xs"><Award className="mr-1 h-3 w-3" />Graded</Badge>
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 text-xs"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>
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

  // ✅ FIX: Calculate scores correctly based on hasTheory
  const objScore = Math.round(Number(attempt.objective_score) || 0)
  const tScore = hasTheory ? Math.round(parseFloat(theoryScore) || 0) : 0
  const total = objScore + tScore
  const totalMax = hasTheory ? (objTotal + theoryMax) : objTotal
  const pct = totalMax > 0 ? Math.round((total / totalMax) * 100) : 0
  const grade = getWAECGrade(pct)

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
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
            <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(attempt.student_name)}</AvatarFallback>
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

      {/* Theory Questions & Answers - Only if has theory */}
      {hasTheory && theoryQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <PenTool className="h-4 w-4 text-purple-500" /> Theory Questions & Answers
          </h3>
          {theoryQuestions.map((q, idx) => {
            const answer = studentAnswers[q.id] || attempt.theory_answers?.[q.id] || 'No answer provided.'
            const isExpanded = expandedQuestions[q.id] || false
            return (
              <Card key={q.id} className="border-0 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] mb-1">
                      Q{idx + 1} • {q.points} marks
                    </Badge>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{q.question}</p>
                    {!isExpanded && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        Answer: {typeof answer === 'string' ? answer.substring(0, 80) : 'See answer...'}
                        {typeof answer === 'string' && answer.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-slate-50/50">
                    <div className="pt-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Student Answer:</p>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">
                          {typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* No theory message */}
      {!hasTheory && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">This exam has no theory questions</p>
            <p className="text-xs text-slate-400 mt-1">Only objective score is shown</p>
          </CardContent>
        </Card>
      )}

      {/* Scoring Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Objective Score */}
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Objective Score (MCQ)</p>
                <p className="text-xs text-blue-600">Auto-graded</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-700">{objScore}/{objTotal}</span>
          </div>

          {/* Theory Score - Only if has theory */}
          {hasTheory && (
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <PenTool className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">Theory Score</p>
                  <p className="text-xs text-purple-600">
                    Enter score out of {theoryMax} (rounded to whole number)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max={theoryMax}
                  step="0.5"
                  value={theoryScore}
                  onChange={(e) => setTheoryScore(e.target.value)}
                  placeholder={`0-${theoryMax}`}
                  className="h-12 text-lg font-bold text-center w-32 bg-white"
                />
                <span className="text-lg text-purple-600 font-semibold">/ {theoryMax}</span>
                {theoryScore && (
                  <Badge className="bg-purple-100 text-purple-700">
                    Rounded: {Math.round(parseFloat(theoryScore) || 0)}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div>
            <Label className="text-sm font-medium">Feedback (optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Overall feedback for the student..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          {/* ✅ FIXED: Final Score - Correctly shows obj only when no theory */}
          <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Final Score</p>
                <p className="text-xs text-emerald-600">
                  {hasTheory ? 'Objective + Theory' : 'Objective Score'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-700">{total}</span>
              <span className="text-lg text-emerald-500">/{totalMax}</span>
              <p className="text-sm font-medium text-emerald-600">{pct}%</p>
              <Badge className={cn(
                "mt-1 text-xs",
                pct >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              )}>
                {grade}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || (hasTheory && !theoryScore)}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base"
      >
        {saving ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Save className="mr-2 h-5 w-5" />
        )}
        {saving
          ? 'Saving...'
          : `Save — ${total}/${totalMax} (${pct}%) — Grade: ${grade}`
        }
      </Button>
    </div>
  )
}