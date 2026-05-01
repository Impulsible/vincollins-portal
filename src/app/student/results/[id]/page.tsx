// app/student/results/[id]/page.tsx - COMPLETE BEAUTIFUL RESULT PAGE
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
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Award, Clock, CheckCircle, XCircle, BookOpen,
  GraduationCap, Calendar, Target, ArrowLeft,
  Home, ChevronRight, PenTool, Calculator, AlertCircle,
  Trophy, Star, TrendingUp, FileText, Sparkles
} from 'lucide-react'
import Link from 'next/link'

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
  objective_score: number
  objective_total: number
  theory_score: number | null
  theory_total: number
  ca1_score: number | null
  ca2_score: number | null
  grand_total: number
  grand_total_marks: number
  is_passed: boolean
  started_at: string
  submitted_at: string
  attempt_number: number
  passing_percentage: number
  time_spent: number
  correct_count: number
  incorrect_count: number
  unanswered_count: number
  teacher_feedback: string | null
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  photo_url?: string
}

export default function StudentResultDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)

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

  const calculateGrade = (percentage: number): { grade: string; color: string; bgColor: string; icon: any } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: Trophy }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Star }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: TrendingUp }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Award }
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle }
  }

  const formatTime = (seconds?: number): string => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return 'N/A' }
  }

  const loadResult = useCallback(async () => {
    if (!examId) return
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

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
        photo_url: profileData.photo_url
      })

      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (attemptError || !attemptData) {
        toast.error('Result not found')
        router.push('/student/results')
        return
      }

      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', attemptData.exam_id)
        .single()

      let theoryScore: number | null = null
      let teacherFeedback: string | null = null
      
      if (attemptData.theory_feedback) {
        const feedback = typeof attemptData.theory_feedback === 'string' 
          ? JSON.parse(attemptData.theory_feedback) 
          : attemptData.theory_feedback
        
        if (feedback?.total?.score !== undefined) {
          theoryScore = Number(feedback.total.score)
        }
        if (feedback?.total?.feedback) {
          teacherFeedback = feedback.total.feedback
        }
      }

      let ca1Score: number | null = null
      let ca2Score: number | null = null
      let caObjectiveScore: number | null = null
      let caTheoryScore: number | null = null
      
      const { data: caData } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', session.user.id)
        .eq('exam_id', examId)
        .maybeSingle()
      
      if (caData) {
        ca1Score = caData.ca1_score !== null ? Number(caData.ca1_score) : null
        ca2Score = caData.ca2_score !== null ? Number(caData.ca2_score) : null
        caObjectiveScore = caData.exam_objective_score !== null ? Number(caData.exam_objective_score) : null
        caTheoryScore = caData.exam_theory_score !== null ? Number(caData.exam_theory_score) : null
      }

      const objectiveScore = caObjectiveScore !== null ? caObjectiveScore : (Number(attemptData.objective_score) || 0)
      const finalTheoryScore = caTheoryScore !== null ? caTheoryScore : theoryScore
      const objectiveTotal = Number(attemptData.objective_total) || 20
      const theoryTotal = Number(attemptData.theory_total) || 40
      const examTotalMarks = objectiveTotal + theoryTotal
      const examScore = objectiveScore + (finalTheoryScore || 0)
      
      const ca1 = ca1Score || 0
      const ca2 = ca2Score || 0
      const grandTotalMarks = 20 + 20 + 20 + 40
      const grandTotalScore = ca1 + ca2 + objectiveScore + (finalTheoryScore || 0)
      
      const displayPercentage = (ca1Score !== null && ca2Score !== null) 
        ? Math.round((grandTotalScore / grandTotalMarks) * 100)
        : attemptData.percentage || 0

      setResult({
        id: attemptData.id,
        exam_id: attemptData.exam_id,
        exam_title: examData?.title || 'Unknown Exam',
        exam_subject: examData?.subject || 'Unknown Subject',
        exam_class: examData?.class || 'N/A',
        status: attemptData.status,
        percentage: displayPercentage,
        total_score: examScore,
        total_marks: examTotalMarks,
        objective_score: objectiveScore,
        objective_total: objectiveTotal,
        theory_score: finalTheoryScore,
        theory_total: theoryTotal,
        ca1_score: ca1Score,
        ca2_score: ca2Score,
        grand_total: grandTotalScore,
        grand_total_marks: grandTotalMarks,
        is_passed: attemptData.is_passed || false,
        started_at: attemptData.started_at,
        submitted_at: attemptData.submitted_at,
        attempt_number: attemptData.attempt_number || 1,
        passing_percentage: examData?.passing_percentage || 50,
        time_spent: attemptData.time_spent,
        correct_count: attemptData.correct_count,
        incorrect_count: attemptData.incorrect_count,
        unanswered_count: attemptData.unanswered_count,
        teacher_feedback: teacherFeedback
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <Card className="max-w-md w-full border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Result Not Found</h3>
              <p className="text-slate-500 text-sm mb-6">No submission found for this exam.</p>
              <Button onClick={() => router.push('/student/results')} size="sm" className="rounded-full">
                Back to Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const gradeInfo = calculateGrade(result.percentage)
  const GradeIcon = gradeInfo.icon
  const isTheoryPending = result.status === 'pending_theory'
  const hasCA = result.ca1_score !== null && result.ca2_score !== null
  const theoryDisplay = result.theory_score !== null ? `${result.theory_score}/${result.theory_total}` : 'Pending'
  const caTotal = (result.ca1_score || 0) + (result.ca2_score || 0)

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
          "flex-1 pt-[72px] lg:pt-24 pb-24 lg:pb-12 px-3 sm:px-4 lg:px-6 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto max-w-5xl">
            
            {/* Breadcrumb */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 mt-2 sm:mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Link href="/student" className="hover:text-primary flex items-center gap-1 transition-colors">
                  <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/student/exams" className="hover:text-primary transition-colors">Exams</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium truncate max-w-[200px]">{result.exam_title}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/student/exams')} 
                className="h-9 text-xs rounded-full hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4 mr-1.5" />Back to Exams
              </Button>
            </motion.div>

            {/* Hero Result Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card className={cn(
                "border-0 shadow-xl overflow-hidden relative",
                result.is_passed 
                  ? "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50" 
                  : "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50"
              )}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <CardContent className="p-5 sm:p-6 lg:p-8 relative">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      {/* Status Pills */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={cn(
                          "text-xs font-medium px-3 py-1 rounded-full",
                          result.is_passed 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-red-100 text-red-700"
                        )}>
                          {result.is_passed ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                          {result.is_passed ? 'Passed' : 'Failed'}
                        </Badge>
                        
                        {hasCA ? (
                          <Badge className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                            <Sparkles className="h-3.5 w-3.5 mr-1" />CA Scores Included
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs px-3 py-1 rounded-full">
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />CA Scores Pending
                          </Badge>
                        )}
                        
                        {isTheoryPending && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                            <Clock className="h-3.5 w-3.5 mr-1" />Theory Pending
                          </Badge>
                        )}
                      </div>
                      
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{result.exam_title}</h1>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                        <span className="flex items-center gap-1.5 bg-white/60 rounded-full px-3 py-1">
                          <BookOpen className="h-3.5 w-3.5" />{result.exam_subject}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/60 rounded-full px-3 py-1">
                          <GraduationCap className="h-3.5 w-3.5" />{result.exam_class}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/60 rounded-full px-3 py-1">
                          <Calendar className="h-3.5 w-3.5" />{formatDate(result.submitted_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Big Score Display */}
                    <div className="text-center shrink-0">
                      <div className={cn(
                        "inline-flex items-center gap-4 p-6 rounded-3xl",
                        result.is_passed ? "bg-white/70" : "bg-white/70"
                      )}>
                        <div className="text-center">
                          <div className={cn("text-5xl sm:text-6xl lg:text-7xl font-black", gradeInfo.color)}>
                            {result.percentage}%
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            {hasCA ? 'Final Grade' : 'Exam Score'}
                          </p>
                        </div>
                        <div className={cn(
                          "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center",
                          gradeInfo.bgColor
                        )}>
                          <div className="text-center">
                            <GradeIcon className={cn("h-8 w-8 sm:h-10 sm:w-10 mx-auto", gradeInfo.color)} />
                            <span className={cn("text-2xl sm:text-3xl font-black", gradeInfo.color)}>{gradeInfo.grade}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 mt-3">
                        {hasCA 
                          ? `${result.grand_total}/${result.grand_total_marks} marks • Pass at ${result.passing_percentage}%`
                          : `${result.total_score}/${result.total_marks} marks (exam only) • Pass at ${result.passing_percentage}%`
                        }
                      </p>
                      
                      {hasCA && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          CA1: {result.ca1_score} + CA2: {result.ca2_score} + Exam: {result.total_score} = {result.grand_total}/100
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Score Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }} className="mb-6">
              <Card className="border-0 shadow-lg bg-white overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-slate-50 to-white px-5 sm:px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-500" />
                      Score Breakdown
                    </h3>
                    {hasCA ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs rounded-full px-3 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" />Complete with CA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs rounded-full px-3 py-1">
                        <AlertCircle className="h-3 w-3 mr-1" />Awaiting CA Scores
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-5 sm:p-6">
                  {/* CA Notice when not available */}
                  {!hasCA && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-800">Continuous Assessment Not Yet Added</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Your final grade will include CA1 (20 marks) + CA2 (20 marks) = 40 marks 
                            combined with your exam score (60 marks) for a total of 100 marks. 
                            Current score shown is exam only.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* CA Scores Section */}
                    {hasCA && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Calculator className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-900">Continuous Assessment</p>
                            <p className="text-xs text-blue-600">40 marks total</p>
                          </div>
                          <Badge className="ml-auto bg-blue-200 text-blue-700 text-xs rounded-full">
                            {caTotal}/40
                          </Badge>
                        </div>
                        
                        <ScoreRow 
                          label="CA 1" score={result.ca1_score!} total={20} 
                          color="from-blue-400 to-blue-500" icon={Star} 
                        />
                        <div className="mt-3">
                          <ScoreRow 
                            label="CA 2" score={result.ca2_score!} total={20} 
                            color="from-indigo-400 to-indigo-500" icon={Star} 
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Exam Scores Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 sm:p-5 border border-purple-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                          <PenTool className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-900">Examination</p>
                          <p className="text-xs text-purple-600">60 marks total</p>
                        </div>
                        <Badge className="ml-auto bg-purple-200 text-purple-700 text-xs rounded-full">
                          {result.total_score}/{result.total_marks}
                        </Badge>
                      </div>
                      
                      <ScoreRow 
                        label="MCQ (Objective)" score={result.objective_score} 
                        total={result.objective_total} 
                        color="from-purple-400 to-purple-500" icon={Target} 
                      />
                      <div className="mt-3">
                        <ScoreRow 
                          label="Theory" score={result.theory_score} 
                          total={result.theory_total} 
                          color="from-violet-400 to-violet-500" icon={FileText}
                          pending={isTheoryPending}
                        />
                      </div>
                    </div>
                    
                    {/* Final Total */}
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-4 sm:p-5 border-2 border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center",
                            hasCA ? "bg-emerald-500" : "bg-amber-500"
                          )}>
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {hasCA ? 'Final Grade' : 'Current Score (Exam Only)'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {hasCA 
                                ? `CA1 + CA2 + MCQ + Theory = ${result.grand_total}/${result.grand_total_marks}`
                                : `Awaiting CA scores for final /100 grade`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-3xl font-black",
                            hasCA ? gradeInfo.color : "text-amber-600"
                          )}>
                            {hasCA ? result.grand_total : result.total_score}
                          </span>
                          <span className="text-lg text-slate-400 font-semibold">
                            /{hasCA ? result.grand_total_marks : result.total_marks}
                          </span>
                        </div>
                      </div>
                      
                      {!hasCA && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-amber-600 text-center">
                            ⚠️ Final grade will be out of 100 marks once CA scores are added
                          </p>
                        </div>
                      )}
                      
                      {hasCA && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                            <span className="bg-white rounded-full px-2 py-0.5">CA1: {result.ca1_score}</span>
                            <span>+</span>
                            <span className="bg-white rounded-full px-2 py-0.5">CA2: {result.ca2_score}</span>
                            <span>+</span>
                            <span className="bg-white rounded-full px-2 py-0.5">MCQ: {result.objective_score}</span>
                            <span>+</span>
                            <span className="bg-white rounded-full px-2 py-0.5">Theory: {result.theory_score || 0}</span>
                            <span>=</span>
                            <span className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-0.5 font-bold">{result.grand_total}/100</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats Row */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.15 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Time Spent', value: formatTime(result.time_spent), icon: Clock, color: 'bg-blue-50 text-blue-600' },
                { label: 'Correct', value: result.correct_count, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Wrong', value: result.incorrect_count, icon: XCircle, color: 'bg-red-50 text-red-600' },
                { label: 'Skipped', value: result.unanswered_count, icon: AlertCircle, color: 'bg-slate-50 text-slate-500' },
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.color.split(' ')[0])}>
                      <stat.icon className={cn("h-5 w-5", stat.color.split(' ')[1])} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* MCQ Performance Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }} className="mb-6">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    MCQ Performance Distribution
                  </h3>
                  
                  <div className="flex h-4 rounded-full overflow-hidden mb-3">
                    {(result.correct_count || 0) > 0 && (
                      <div className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${((result.correct_count || 0) / ((result.correct_count || 0) + (result.incorrect_count || 0) + (result.unanswered_count || 0) || 1)) * 100}%` }} />
                    )}
                    {(result.incorrect_count || 0) > 0 && (
                      <div className="bg-red-500 h-full transition-all duration-500" 
                        style={{ width: `${((result.incorrect_count || 0) / ((result.correct_count || 0) + (result.incorrect_count || 0) + (result.unanswered_count || 0) || 1)) * 100}%` }} />
                    )}
                    {(result.unanswered_count || 0) > 0 && (
                      <div className="bg-slate-300 h-full transition-all duration-500" 
                        style={{ width: `${((result.unanswered_count || 0) / ((result.correct_count || 0) + (result.incorrect_count || 0) + (result.unanswered_count || 0) || 1)) * 100}%` }} />
                    )}
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Correct ({result.correct_count || 0})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-slate-600">Wrong ({result.incorrect_count || 0})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-300" />
                      <span className="text-slate-600">Skipped ({result.unanswered_count || 0})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Theory Pending Notice */}
            {isTheoryPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-800">Theory Answers Pending Grading</p>
                      <p className="text-sm text-purple-700 mt-1">Your theory answers are being reviewed by your instructor. Scores will update once grading is complete.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Teacher Feedback */}
            {result.teacher_feedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      Teacher Feedback
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 mt-3">
                      <p className="text-sm text-slate-700 italic">"{result.teacher_feedback}"</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Back Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.25 }}>
              <Button 
                onClick={() => router.push('/student/exams')} 
                className="w-full rounded-xl h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
              </Button>
            </motion.div>
            
            {/* Bottom spacing */}
            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  )
}

// Beautiful Score Row Component
function ScoreRow({ 
  label, score, total, color, icon: Icon, bold = false, pending = false 
}: { 
  label: string
  score: number | null
  total: number
  color: string
  icon: any
  bold?: boolean
  pending?: boolean
}) {
  const displayScore = score !== null && score !== undefined ? score : 0
  const percentage = total > 0 ? (displayScore / total) * 100 : 0

  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
      bold && "bg-white/50"
    )}>
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
        color
      )}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-sm", bold ? "font-bold" : "font-medium")}>
            {label}
          </span>
          <span className={cn("text-sm ml-2", bold ? "font-bold" : "font-medium")}>
            {pending ? (
              <span className="text-purple-500 animate-pulse">Pending</span>
            ) : (
              <span>{displayScore}<span className="text-slate-400">/{total}</span></span>
            )}
          </span>
        </div>
        {!pending && (
          <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r", color)}
              style={{ width: `${Math.min(percentage, 100)}%` }} 
            />
          </div>
        )}
      </div>
    </div>
  )
}