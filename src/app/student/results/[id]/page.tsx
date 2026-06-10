// app/student/results/[id]/page.tsx - PROFESSIONALLY STYLED
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Clock, CheckCircle, XCircle, BookOpen,
  GraduationCap, Calendar, ArrowLeft,
  Home, ChevronRight, AlertCircle, FileText,
  Trophy, Target, BarChart3, Award, Brain,
  CheckCheck, X, HelpCircle, User, Mail, MapPin
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────
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

// ─── Grade Configuration ────────────────────────────────
const getGradeConfig = (percentage: number) => {
  if (percentage >= 80) return { grade: 'A', label: 'Excellent', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Trophy }
  if (percentage >= 70) return { grade: 'B', label: 'Very Good', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Award }
  if (percentage >= 60) return { grade: 'C', label: 'Good', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Target }
  if (percentage >= 50) return { grade: 'P', label: 'Pass', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: CheckCheck }
  return { grade: 'F', label: 'Fail', color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: X }
}

const fmtTime = (seconds?: number) => {
  if (!seconds) return '—'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

const fmtDate = (date?: string) => {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch { 
    return '—' 
  }
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

      let theoryScore: number | null = null
      let teacherFeedback: string | null = null

      if (att.theory_feedback) {
        try {
          const fb = typeof att.theory_feedback === 'string' ? JSON.parse(att.theory_feedback) : att.theory_feedback
          if (fb?.total?.score !== undefined) theoryScore = Number(fb.total.score)
          if (fb?.total?.feedback) teacherFeedback = fb.total.feedback
        } catch { /* ignore */ }
      }

      const { data: ca } = await supabase
        .from('ca_scores')
        .select('ca1_score, ca2_score')
        .eq('student_id', session.user.id)
        .eq('exam_id', examId)
        .maybeSingle()

      const ca1 = ca?.ca1_score != null ? Number(ca.ca1_score) : null
      const ca2 = ca?.ca2_score != null ? Number(ca.ca2_score) : null
      const ca1Value = ca1 || 0
      const ca2Value = ca2 || 0
      const caTotal = ca1Value + ca2Value

      const objectiveTotal = att.objective_total || 20
      const theoryTotal = att.theory_total || 40
      const objectiveScore = Number(att.objective_score) || 0
      const theoryScoreValue = theoryScore || 0
      const examScore = objectiveScore + theoryScoreValue
      const grandTotal = caTotal + examScore
      const percentage = Math.round((grandTotal / 100) * 100)
      const isPassed = percentage >= 40

      setResult({
        id: att.id,
        exam_id: att.exam_id,
        exam_title: exam?.title || 'Untitled Exam',
        exam_subject: exam?.subject || '—',
        exam_class: exam?.class || '—',
        status: att.status,
        percentage: percentage,
        total_score: grandTotal,
        total_marks: 100,
        objective_score: Math.round(objectiveScore),
        objective_total: objectiveTotal,
        theory_score: theoryScore,
        theory_total: theoryTotal,
        ca1_score: ca1,
        ca2_score: ca2,
        is_passed: isPassed,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex w-full">
          <div className="hidden lg:block">
            <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          </div>
          <div className={cn("flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
            <div className="text-center">
              <div className="relative mx-auto mb-6 h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                <FileText className="absolute inset-0 m-auto h-8 w-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading Your Result</h2>
              <p className="text-sm text-slate-400">Please wait while we fetch your exam details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex w-full">
          <div className="hidden lg:block">
            <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />
          </div>
          <div className={cn("flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] px-4", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
            <Card className="max-w-md w-full border-0 shadow-xl rounded-2xl">
              <CardContent className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Result Not Found</h3>
                <p className="text-sm text-slate-500 mb-8">{error || 'No submission found for this exam.'}</p>
                <Button onClick={() => router.push('/student/exams')} className="w-full bg-slate-800 hover:bg-slate-900 rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const gradeConfig = getGradeConfig(result.percentage)
  const GradeIcon = gradeConfig.icon
  const theoryPending = result.status === 'pending_theory'
  const hasCA = result.ca1_score !== null && result.ca2_score !== null
  const totalQuestions = result.correct_count + result.incorrect_count + result.unanswered_count
  const passMark = result.passing_percentage || 50

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header user={{ 
        id: profile?.id || '', 
        name: profile?.full_name || '', 
        firstName: profile?.full_name?.split(' ')[0] || 'Student',
        email: profile?.email || '', 
        role: 'student' as const, 
        avatar: profile?.photo_url || undefined, 
        isAuthenticated: true 
      }} onLogout={handleLogout} />
      
      <div className="flex w-full">
        <StudentSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="results" setActiveTab={() => {}} />

        <main className={cn(
          "flex-1 transition-all duration-300 w-full",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="pt-20 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link href="/student" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                  <Home className="h-4 w-4" />
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/student/exams" className="hover:text-slate-700 transition-colors">Exams</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-slate-800 font-medium truncate">{result.exam_title}</span>
              </nav>

              {/* Hero Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <Badge className={cn("mb-2", gradeConfig.bg, gradeConfig.text, "border-0")}>
                        <GradeIcon className="h-3 w-3 mr-1" />
                        {gradeConfig.label}
                      </Badge>
                      <h1 className="text-xl font-bold text-white">{result.exam_title}</h1>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-300">
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{result.exam_subject}</span>
                        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{result.exam_class}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(result.submitted_at)}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-5xl font-bold text-white", result.is_passed ? "text-emerald-400" : "text-red-400")}>
                        {result.percentage}%
                      </div>
                      <div className={cn("text-sm mt-1", result.is_passed ? "text-emerald-300" : "text-red-300")}>
                        {result.is_passed ? 'Passed' : 'Failed'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{result.total_score}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Score</p>
                    <p className="text-[10px] text-slate-400">out of 100 marks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{result.correct_count}</p>
                    <p className="text-xs text-slate-500 mt-1">Correct Answers</p>
                    <p className="text-[10px] text-slate-400">out of {totalQuestions} questions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{fmtTime(result.time_spent)}</p>
                    <p className="text-xs text-slate-500 mt-1">Time Spent</p>
                    <p className="text-[10px] text-slate-400">total duration</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{result.percentage}%</p>
                    <p className="text-xs text-slate-500 mt-1">Score</p>
                    <p className="text-[10px] text-slate-400">pass mark {passMark}%</p>
                  </div>
                </div>
              </div>

              {/* Grade Card */}
              <div className={cn("rounded-2xl border p-6 mb-6", gradeConfig.border, gradeConfig.bg)}>
                <div className="flex items-center gap-4">
                  <div className={cn("h-16 w-16 rounded-full flex items-center justify-center bg-white", gradeConfig.text)}>
                    <span className="text-2xl font-bold">{gradeConfig.grade}</span>
                  </div>
                  <div>
                    <h3 className={cn("text-lg font-semibold", gradeConfig.text)}>Grade {gradeConfig.grade} - {gradeConfig.label}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {result.is_passed 
                        ? `Congratulations! You've passed the ${result.exam_subject} examination.`
                        : `You did not meet the passing requirement of ${passMark}%. Keep working hard!`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <Card className="border-0 shadow-sm rounded-2xl mb-6 overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-400" />
                    Score Breakdown
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {hasCA && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Continuous Assessment (40%)</span>
                        <span className="font-medium text-slate-800">{result.ca1_score! + result.ca2_score!}/40</span>
                      </div>
                      <Progress value={((result.ca1_score! + result.ca2_score!) / 40) * 100} className="h-2" />
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                        <div>CA 1: {result.ca1_score}/20</div>
                        <div>CA 2: {result.ca2_score}/20</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Examination (60%)</span>
                      <span className="font-medium text-slate-800">{result.objective_score + (result.theory_score || 0)}/60</span>
                    </div>
                    <Progress value={((result.objective_score + (result.theory_score || 0)) / 60) * 100} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                      <div>Objective: {result.objective_score}/{result.objective_total}</div>
                      <div>Theory: {result.theory_score !== null ? `${result.theory_score}/${result.theory_total}` : 'Pending'}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-slate-800">Grand Total</span>
                      <span className="text-slate-800">{result.total_score}/100</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Question Performance */}
              {totalQuestions > 0 && (
                <Card className="border-0 shadow-sm rounded-2xl mb-6 overflow-hidden">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Target className="h-5 w-5 text-slate-400" />
                      Question Performance
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex h-3 rounded-full overflow-hidden mb-4">
                      <div className="bg-emerald-500" style={{ width: `${(result.correct_count / totalQuestions) * 100}%` }} />
                      <div className="bg-red-400" style={{ width: `${(result.incorrect_count / totalQuestions) * 100}%` }} />
                      <div className="bg-slate-300" style={{ width: `${(result.unanswered_count / totalQuestions) * 100}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-semibold">{result.correct_count}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Correct</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span className="font-semibold">{result.incorrect_count}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Wrong</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-400">
                          <HelpCircle className="h-4 w-4" />
                          <span className="font-semibold">{result.unanswered_count}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Skipped</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Theory Pending Notice */}
              {theoryPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-800">Theory Grading Pending</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Your theory answers are currently being reviewed by your teacher. 
                        The final score will be updated once grading is complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Feedback */}
              {result.teacher_feedback && (
                <Card className="border-0 shadow-sm rounded-2xl mb-6 overflow-hidden">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-400" />
                      Teacher's Feedback
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-600 italic leading-relaxed">"{result.teacher_feedback}"</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => router.push('/student/exams')} 
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams
                </Button>
                <Button 
                  onClick={() => window.print()} 
                  className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-900"
                >
                  <FileText className="h-4 w-4 mr-2" /> Download Result
                </Button>
              </div>

              <div className="h-8" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}