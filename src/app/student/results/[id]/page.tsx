/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  const resultId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'objective' | 'theory'>('summary')

  // FIXED: Properly handle string for initials
  const getInitials = (name?: string): string => {
    if (!name) return 'S'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    // Fixed: parts[0] is a string, take first 2 characters and uppercase
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
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
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
    if (!resultId) return
    
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

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

      // Load exam attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', resultId)
        .eq('student_id', session.user.id)
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

      // Load questions if available
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

      // Load theory questions if available
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
  }, [resultId, router])

  useEffect(() => {
    loadResult()
  }, [loadResult])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    toast.info('PDF download coming soon')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-slate-600 text-sm sm:text-base">Loading result details...</p>
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
            <CardContent className="text-center py-10 sm:py-12">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Result Not Found</h3>
              <p className="text-slate-500 text-sm mb-4">The requested result could not be found.</p>
              <Button onClick={() => router.push('/student/results')} size="sm">
                Back to Results
              </Button>
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

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-12 px-3 sm:px-4 lg:px-6 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto max-w-5xl px-0 sm:px-2">
            
            {/* Breadcrumb */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <Link href="/student" className="hover:text-primary flex items-center gap-1">
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Home</span>
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <Link href="/student/results" className="hover:text-primary">
                  Results
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-[300px]">{result.exam_title}</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/student/results')} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </div>
            </motion.div>

            {/* Result Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 w-full overflow-hidden"
            >
              <Card className={cn(
                "border-0 shadow-lg overflow-hidden",
                result.is_passed 
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500"
                  : "bg-gradient-to-br from-red-50 to-rose-50 border-l-4 border-l-red-500"
              )}>
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
                        {result.exam_title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <Badge className="bg-primary/10 text-primary text-xs">
                          <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          {result.exam_subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          {result.exam_class}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{formatDate(result.completed_at || result.submitted_at)}</span>
                        </Badge>
                        {result.attempt_number > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Attempt #{result.attempt_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center lg:text-right shrink-0">
                      <div className="flex items-center gap-3 justify-center lg:justify-end">
                        <span className={cn(
                          "text-4xl sm:text-5xl lg:text-6xl font-bold",
                          gradeInfo.color
                        )}>
                          {result.percentage}%
                        </span>
                        <div className={cn(
                          "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full",
                          result.is_passed 
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}>
                          <span className="text-xl sm:text-2xl font-bold">{gradeInfo.grade}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
                        Score: {result.total_score}/{result.total_marks} • 
                        Pass Mark: {result.passing_percentage}%
                      </p>
                      <Badge className={cn(
                        "mt-1.5 sm:mt-2 text-xs",
                        result.is_passed 
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      )}>
                        {result.is_passed ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Passed</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6"
            >
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Time Spent</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold">{formatTime(result.time_spent)}</p>
                    </div>
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Objective Score</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">
                        {result.objective_score || 0}/{result.objective_total || 0}
                      </p>
                    </div>
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Theory Score</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-600">
                        {result.theory_score || 0}/{result.theory_total || 0}
                      </p>
                    </div>
                    <PenTool className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Ranking</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold truncate">
                        {result.percentage >= 80 ? 'Excellent' : 
                         result.percentage >= 70 ? 'Very Good' :
                         result.percentage >= 60 ? 'Good' :
                         result.percentage >= 50 ? 'Pass' : 'Needs Work'}
                      </p>
                    </div>
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Question Breakdown */}
            {objectiveQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-4 sm:mb-6 w-full overflow-hidden"
              >
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="px-4 sm:px-5 lg:px-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                      Objective Questions
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Correct: {result.correct_count || 0} • 
                      Incorrect: {result.incorrect_count || 0} • 
                      Unanswered: {result.unanswered_count || 0}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-5 lg:px-6 pb-4 sm:pb-6">
                    <div className="space-y-3">
                      {objectiveQuestions.map((question, index) => (
                        <div key={question.id} className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={cn(
                              "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm font-medium",
                              question.is_correct 
                                ? "bg-green-100 text-green-700"
                                : question.student_answer
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-500"
                            )}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base mb-2 break-words">{question.question_text}</p>
                              
                              {question.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 mb-3">
                                  {question.options.map((opt, i) => {
                                    const letter = String.fromCharCode(65 + i)
                                    const isSelected = question.student_answer === opt
                                    const isCorrect = question.correct_answer === opt
                                    
                                    return (
                                      <div key={i} className={cn(
                                        "p-2 rounded-lg text-xs sm:text-sm flex items-center gap-2",
                                        isCorrect && "bg-green-100 border border-green-300",
                                        isSelected && !isCorrect && "bg-red-100 border border-red-300",
                                        !isSelected && !isCorrect && "bg-white border border-slate-200"
                                      )}>
                                        <span className="font-medium w-5 sm:w-6 shrink-0">{letter}.</span>
                                        <span className="flex-1 break-words">{opt}</span>
                                        {isCorrect && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />}
                                        {isSelected && !isCorrect && <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                                <span className="text-slate-500">
                                  Your answer: <span className={cn(
                                    "font-medium",
                                    question.is_correct ? "text-green-600" : "text-red-600"
                                  )}>
                                    {question.student_answer || 'Not answered'}
                                  </span>
                                </span>
                                {!question.is_correct && question.correct_answer && (
                                  <span className="text-slate-500">
                                    Correct: <span className="font-medium text-green-600">
                                      {question.correct_answer}
                                    </span>
                                  </span>
                                )}
                                <span className="text-slate-500 ml-auto">
                                  {question.points} {question.points === 1 ? 'pt' : 'pts'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Theory Questions */}
            {theoryQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4 sm:mb-6 w-full overflow-hidden"
              >
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="px-4 sm:px-5 lg:px-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <PenTool className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                      Theory Questions
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {result.status === 'pending_theory' 
                        ? 'Your answers are pending grading by your teacher.'
                        : 'Graded answers with feedback'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-5 lg:px-6 pb-4 sm:pb-6">
                    <div className="space-y-4">
                      {theoryQuestions.map((question, index) => (
                        <div key={question.id} className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 text-xs sm:text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base mb-3 break-words">{question.question_text}</p>
                              
                              <div className="bg-white p-3 rounded-lg border mb-3">
                                <p className="text-[10px] sm:text-xs text-slate-500 mb-1">Your Answer:</p>
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                                  {question.student_answer || 'No answer provided.'}
                                </p>
                              </div>
                              
                              {question.feedback && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <p className="text-[10px] sm:text-xs text-blue-600 mb-1">Teacher Feedback:</p>
                                  <p className="text-xs sm:text-sm text-blue-800 break-words">{question.feedback}</p>
                                </div>
                              )}
                              
                              <div className="flex justify-end mt-2">
                                <span className="text-xs sm:text-sm text-slate-500">
                                  {question.points} {question.points === 1 ? 'point' : 'points'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Teacher Feedback */}
            {result.teacher_feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full overflow-hidden"
              >
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
                  <CardHeader className="px-4 sm:px-5 lg:px-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800">
                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      Teacher's Overall Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-6">
                    <p className="text-sm sm:text-base text-blue-700 break-words">{result.teacher_feedback}</p>
                    {result.graded_at && (
                      <p className="text-[10px] sm:text-xs text-blue-500 mt-3">
                        Graded on {formatDate(result.graded_at)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}