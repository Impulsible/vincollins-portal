// app/student/results/[id]/page.tsx - INDIVIDUAL EXAM RESULT DETAIL PAGE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Award, Clock, CheckCircle, XCircle, BookOpen,
  GraduationCap, Calendar, Target, Trophy, ArrowLeft,
  Home, ChevronRight, FileText, PenTool, Brain,
  AlertCircle, Download, Printer, Share2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ExamResult {
  id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  exam_class: string
  status: string
  percentage: number
  total_score: number
  total_marks: number
  objective_score?: number
  objective_total?: number
  theory_score?: number
  theory_total?: number
  is_passed: boolean
  started_at: string
  completed_at?: string
  submitted_at?: string
  attempt_number: number
  passing_percentage?: number
  time_spent?: number
  correct_count?: number
  incorrect_count?: number
  unanswered_count?: number
  answers?: Record<string, any>
  theory_answers?: Record<string, any>
  teacher_feedback?: string
  graded_by?: string
  graded_at?: string
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface Question {
  id: string
  question_text: string
  type: 'objective' | 'theory'
  options?: string[]
  correct_answer?: string
  points?: number
  student_answer?: string
  is_correct?: boolean
  feedback?: string
}

export default function StudentResultDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  const getInitials = (name?: string): string => {
    if (!name) return 'S'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const calculateGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const formatTime = (seconds?: number): string => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy • hh:mm a')
    } catch {
      return new Date(dateString).toLocaleString()
    }
  }

  const loadResult = useCallback(async () => {
    if (!examId) return
    
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData || profileData.role !== 'student') {
        toast.error('Access denied')
        router.push('/portal')
        return
      }

      setProfile({
        id: profileData.id,
        full_name: profileData.full_name || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: profileData.vin_id,
        photo_url: profileData.photo_url
      })

      // ✅ FIXED: Look up by exam_id + student_id, not by attempt id
      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (attemptError || !attemptData) {
        console.error('Error loading attempt:', attemptError)
        toast.error('Result not found')
        router.push('/student/results')
        return
      }

      // Load exam details
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', attemptData.exam_id)
        .single()

      // Load questions
      let questionList: Question[] = []
      
      if (examData?.questions) {
        const questionsData = typeof examData.questions === 'string' 
          ? JSON.parse(examData.questions) 
          : examData.questions
        
        const answers = attemptData.answers || {}
        const answerResults = attemptData.answer_results || {}
        
        questionList = questionsData.map((q: any, index: number) => ({
          id: q.id || `q-${index}`,
          question_text: q.question || q.question_text || 'No question text',
          type: q.type || 'objective',
          options: q.options || [],
          correct_answer: q.correct_answer || q.answer,
          points: q.points || q.marks || 1,
          student_answer: answers[q.id] || '',
          is_correct: answerResults[q.id]?.is_correct || false
        }))
      }

      if (examData?.theory_questions) {
        const theoryData = typeof examData.theory_questions === 'string'
          ? JSON.parse(examData.theory_questions)
          : examData.theory_questions
        
        const theoryAnswers = attemptData.theory_answers || {}
        
        const theoryQuestions = theoryData.map((q: any, index: number) => ({
          id: q.id || `theory-${index}`,
          question_text: q.question || q.question_text || 'No question text',
          type: 'theory' as const,
          points: q.points || q.marks || 5,
          student_answer: theoryAnswers[q.id] || '',
          feedback: attemptData.theory_feedback?.[q.id] || ''
        }))
        
        questionList = [...questionList, ...theoryQuestions]
      }

      setQuestions(questionList)

      setResult({
        id: attemptData.id,
        exam_id: attemptData.exam_id,
        exam_title: examData?.title || 'Unknown Exam',
        exam_subject: examData?.subject || 'Unknown Subject',
        exam_class: examData?.class || 'N/A',
        status: attemptData.status,
        percentage: attemptData.percentage || 0,
        total_score: attemptData.total_score || 0,
        total_marks: examData?.total_marks || attemptData.total_marks || 100,
        objective_score: attemptData.objective_score,
        objective_total: attemptData.objective_total,
        theory_score: attemptData.theory_score,
        theory_total: attemptData.theory_total,
        is_passed: attemptData.is_passed || false,
        started_at: attemptData.started_at,
        completed_at: attemptData.completed_at,
        submitted_at: attemptData.submitted_at,
        attempt_number: attemptData.attempt_number || 1,
        passing_percentage: examData?.passing_percentage || 50,
        time_spent: attemptData.time_spent,
        correct_count: attemptData.correct_count,
        incorrect_count: attemptData.incorrect_count,
        unanswered_count: attemptData.unanswered_count,
        answers: attemptData.answers,
        theory_answers: attemptData.theory_answers,
        teacher_feedback: attemptData.teacher_feedback,
        graded_by: attemptData.graded_by,
        graded_at: attemptData.graded_at
      })

    } catch (error) {
      console.error('Error loading result:', error)
      toast.error('Failed to load result')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => { loadResult() }, [loadResult])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-slate-600">Loading result details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Result Not Found</h3>
              <p className="text-slate-500 text-sm mb-4">No submission found for this exam.</p>
              <Button onClick={() => router.push('/student/results')} size="sm">Back to Results</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const gradeInfo = calculateGrade(result.percentage)
  const objectiveQuestions = questions.filter(q => q.type === 'objective')
  const theoryQuestions = questions.filter(q => q.type === 'theory')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="results"
          setActiveTab={() => {}}
        />

        {/* UPDATED: Increased top padding to match header height */}
        <main className={cn(
          "flex-1 pt-[72px] lg:pt-24 pb-24 lg:pb-12 px-3 sm:px-4 lg:px-6 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto max-w-5xl">
            
            {/* Breadcrumb - UPDATED: Added top margin for extra spacing */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 mt-2 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <Link href="/student" className="hover:text-primary flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <Link href="/student/exams" className="hover:text-primary">Exams</Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground font-medium truncate max-w-[200px]">{result.exam_title}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/student/exams')} className="h-9 text-xs px-3">
                <ArrowLeft className="h-4 w-4 mr-1.5" />Back to Exams
              </Button>
            </motion.div>

            {/* Result Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card className={cn(
                "border-0 shadow-lg overflow-hidden",
                result.is_passed ? "bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500"
                : "bg-gradient-to-br from-red-50 to-rose-50 border-l-4 border-l-red-500"
              )}>
                <CardContent className="p-5 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">{result.exam_title}</h1>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <Badge className="bg-primary/10 text-primary text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" />{result.exam_subject}</Badge>
                        <Badge variant="outline" className="text-xs"><GraduationCap className="h-3.5 w-3.5 mr-1" />{result.exam_class}</Badge>
                        <Badge variant="outline" className="text-xs"><Calendar className="h-3.5 w-3.5 mr-1" />{formatDate(result.submitted_at)}</Badge>
                      </div>
                    </div>
                    <div className="text-center lg:text-right shrink-0">
                      <div className="flex items-center gap-3 justify-center lg:justify-end">
                        <span className={cn("text-4xl sm:text-5xl lg:text-6xl font-bold", gradeInfo.color)}>{result.percentage}%</span>
                        <div className={cn("px-4 py-2 rounded-full", result.is_passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          <span className="text-2xl font-bold">{gradeInfo.grade}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">Score: {result.total_score}/{result.total_marks} • Pass: {result.passing_percentage}%</p>
                      <Badge className={cn("mt-2 text-xs", result.is_passed ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                        {result.is_passed ? <><CheckCircle className="h-3 w-3 mr-1" /> Passed</> : <><XCircle className="h-3 w-3 mr-1" /> Failed</>}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {[
                { label: 'Time Spent', value: formatTime(result.time_spent), icon: Clock, color: 'text-blue-500' },
                { label: 'Objective', value: `${result.objective_score || 0}/${result.objective_total || 0}`, icon: Target, color: 'text-blue-600' },
                { label: 'Theory', value: `${result.theory_score || 0}/${result.theory_total || 0}`, icon: PenTool, color: 'text-purple-600' },
                { label: 'Status', value: result.status === 'graded' ? 'Graded' : result.status === 'pending_theory' ? 'Pending' : 'Completed', icon: Award, color: 'text-amber-500' },
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-sm bg-white"><CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-slate-500">{stat.label}</p><p className="text-lg font-bold">{stat.value}</p></div>
                  <stat.icon className={cn("h-8 w-8 opacity-50", stat.color)} />
                </CardContent></Card>
              ))}
            </motion.div>

            {/* Correct/Incorrect/Unanswered Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
              <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {result.correct_count! > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${((result.correct_count || 0) / (questions.length || 1)) * 100}%` }} />}
                  {result.incorrect_count! > 0 && <div className="bg-red-500 h-full" style={{ width: `${((result.incorrect_count || 0) / (questions.length || 1)) * 100}%` }} />}
                  {result.unanswered_count! > 0 && <div className="bg-slate-300 h-full" style={{ width: `${((result.unanswered_count || 0) / (questions.length || 1)) * 100}%` }} />}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span className="text-emerald-600">✓ {result.correct_count || 0} Correct</span>
                  <span className="text-red-500">✗ {result.incorrect_count || 0} Wrong</span>
                  <span className="text-slate-400">— {result.unanswered_count || 0} Skipped</span>
                </div>
              </CardContent></Card>
            </motion.div>

            {/* Theory pending notice */}
            {result.status === 'pending_theory' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-amber-700 text-sm">Your theory answers are pending grading by your instructor. Final score will be updated once grading is complete.</p>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Button onClick={() => router.push('/student/exams')} className="w-full rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}