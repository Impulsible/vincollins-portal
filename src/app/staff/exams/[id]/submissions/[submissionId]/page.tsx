// app/staff/exams/[id]/submissions/[submissionId]/page.tsx - FINAL
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
  Loader2, Award, Target, PenTool, ChevronDown, ChevronUp
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function GradeTheoryPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const submissionId = params.submissionId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState<any>(null)
  const [examTitle, setExamTitle] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [theoryScore, setTheoryScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [theoryQuestions, setTheoryQuestions] = useState<any[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      const { data: att } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (!att) { toast.error('Submission not found'); return }

      const { data: exam } = await supabase
        .from('exams')
        .select('id, title, subject, theory_questions')
        .eq('id', att.exam_id)
        .single()

      setExamTitle(exam?.title || 'Untitled Exam')
      setSubjectName(exam?.subject || '')

      if (exam?.theory_questions) {
        const tq = typeof exam.theory_questions === 'string'
          ? JSON.parse(exam.theory_questions)
          : exam.theory_questions
        setTheoryQuestions(tq.map((q: any, i: number) => ({
          ...q,
          id: q.id || `q-${i}`,
          question: q.question || 'No question text',
          points: Number(q.marks || q.points || 10),
          order_number: i + 1
        })))
      }

      const { data: student } = await supabase
        .from('profiles')
        .select('photo_url')
        .eq('id', att.student_id)
        .single()

      // Get theory score from theory_feedback
      let existingScore = ''
      if (att.theory_feedback?.total?.score !== undefined) {
        existingScore = String(att.theory_feedback.total.score)
      }

      setAttempt({
        ...att,
        photo_url: student?.photo_url || null
      })

      setTheoryScore(existingScore)
      if (att.theory_feedback?.total?.feedback) {
        setFeedback(att.theory_feedback.total.feedback)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load submission')
    } finally {
      setLoading(false)
    }
  }, [submissionId, router])

  useEffect(() => { loadData() }, [loadData])

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }))
  }

  const updateTermProgress = async (studentId: string, term: string, sessionYear: string, studentClass: string) => {
    try {
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
        const totalSubjects = studentClass?.startsWith('JSS') ? 17 : 10

        let termGrade = 'F'
        if (avgScore >= 80) termGrade = 'A'
        else if (avgScore >= 70) termGrade = 'B'
        else if (avgScore >= 60) termGrade = 'C'
        else if (avgScore >= 50) termGrade = 'P'

        await supabase
          .from('student_term_progress')
          .upsert({
            student_id: studentId,
            term,
            session_year: sessionYear,
            completed_exams: completedCount,
            total_subjects: totalSubjects,
            average_score: avgScore,
            grade: termGrade,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id,term,session_year' })
      }
    } catch (error) {
      console.error('Error updating term progress:', error)
    }
  }

  const handleSave = async () => {
    if (!attempt) return

    let tScore = parseFloat(theoryScore)
    if (isNaN(tScore) || tScore < 0 || tScore > 40) {
      toast.error('Theory score must be between 0 and 40')
      return
    }

    tScore = Math.round(tScore)
    setSaving(true)

    const objScore = Number(attempt.objective_score) || 0
    const objTotal = Number(attempt.objective_total) || 20
    const theoryTotal = 40
    const totalScore = objScore + tScore
    const totalMarks = objTotal + theoryTotal
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
    const isPassed = percentage >= 50

    const { data: exam } = await supabase
      .from('exams')
      .select('term, session_year')
      .eq('id', attempt.exam_id)
      .single()

    const term = exam?.term || attempt.term || 'third'
    const sessionYear = exam?.session_year || attempt.session_year || '2025/2026'

    try {
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          total_score: totalScore,
          total_marks: totalMarks,
          percentage,
          is_passed: isPassed,
          status: 'graded',
          theory_feedback: {
            total: { score: tScore, feedback: feedback || `Theory: ${tScore}/${theoryTotal}` }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) throw error

      await updateTermProgress(attempt.student_id, term, sessionYear, attempt.student_class)

      toast.success(`Saved! ${objScore}(Obj) + ${tScore}(Theory) = ${totalScore}/${totalMarks} (${percentage}%)`)
      router.push(`/staff/exams/${examId}/submissions?tab=graded`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

  const objScore = Math.round(Number(attempt.objective_score) || 0)
  const objTotal = Number(attempt.objective_total) || 20
  const tScore = Math.round(parseFloat(theoryScore) || 0)
  const total = objScore + tScore
  const totalMax = objTotal + 40
  const pct = totalMax > 0 ? Math.round((total / totalMax) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Grade Theory</h1>
            <p className="text-sm text-slate-500">{examTitle} • {subjectName}</p>
          </div>
        </div>
        <Badge className={cn("text-xs", attempt.status === 'pending_theory' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
          {attempt.status === 'pending_theory' ? <Clock className="mr-1 h-3 w-3 inline" /> : <CheckCircle className="mr-1 h-3 w-3 inline" />}
          {attempt.status === 'pending_theory' ? 'Pending' : 'Graded'}
        </Badge>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={attempt.photo_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(attempt.student_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{attempt.student_name}</p>
            <p className="text-xs text-slate-500 truncate">{attempt.student_email} • {attempt.student_class}</p>
          </div>
        </CardContent>
      </Card>

      {theoryQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <PenTool className="h-4 w-4 text-purple-500" /> Theory Questions & Answers
          </h3>
          {theoryQuestions.map((q, idx) => {
            const answer = attempt.theory_answers?.[q.id] || 'No answer provided.'
            const isExpanded = expandedQuestions[q.id] || false
            return (
              <Card key={q.id} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => toggleQuestion(q.id)} className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] mb-1">Q{idx + 1} • {q.points} marks</Badge>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{q.question}</p>
                    {!isExpanded && <p className="text-xs text-slate-400 mt-1 truncate">Answer: {answer.substring(0, 80)}{answer.length > 80 ? '...' : ''}</p>}
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-slate-50/50">
                    <div className="pt-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Student Answer:</p>
                      <div className="bg-white rounded-lg p-3 border"><p className="text-sm text-slate-800 whitespace-pre-wrap">{answer}</p></div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center"><Target className="h-5 w-5 text-white" /></div>
              <div><p className="font-semibold text-blue-900">Objective Score (MCQ)</p><p className="text-xs text-blue-600">Auto-graded</p></div>
            </div>
            <span className="text-2xl font-bold text-blue-700">{objScore}/{objTotal}</span>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center"><PenTool className="h-5 w-5 text-white" /></div>
              <div><p className="font-semibold text-purple-900">Theory Score</p><p className="text-xs text-purple-600">Enter score out of 40 (rounded to whole number)</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Input type="number" min="0" max="40" step="0.5" value={theoryScore} onChange={(e) => setTheoryScore(e.target.value)} placeholder="0-40" className="h-12 text-lg font-bold text-center w-32 bg-white" />
              <span className="text-lg text-purple-600 font-semibold">/ 40</span>
              {theoryScore && <Badge className="bg-purple-100 text-purple-700">Rounded: {Math.round(parseFloat(theoryScore) || 0)}</Badge>}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Feedback (optional)</Label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Overall feedback for theory answers..." className="mt-1.5" rows={3} />
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center"><Award className="h-5 w-5 text-white" /></div>
              <div><p className="font-semibold text-emerald-900">Final Score</p><p className="text-xs text-emerald-600">Objective + Theory (rounded)</p></div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-700">{total}</span>
              <span className="text-lg text-emerald-500">/{totalMax}</span>
              <p className="text-sm font-medium text-emerald-600">{pct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || !theoryScore} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base">
        {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
        {saving ? 'Saving...' : `Save Grade — ${total}/${totalMax} (${pct}%)`}
      </Button>
    </div>
  )
}