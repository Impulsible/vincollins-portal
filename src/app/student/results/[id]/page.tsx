// app/student/results/[id]/page.tsx
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
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Award, Clock, CheckCircle, XCircle, BookOpen,
  GraduationCap, Calendar, Target, ArrowLeft,
  Home, ChevronRight, PenTool, Calculator, AlertCircle
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
        photo_url: profileData.photo_url
      })

      // Load attempt
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

      // Load exam details
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', attemptData.exam_id)
        .single()

      // Parse theory feedback for theory score
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

      // Try to load CA scores (will be null if not entered yet)
      let ca1Score: number | null = null
      let ca2Score: number | null = null
      
      const { data: caData } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', session.user.id)
        .eq('exam_id', examId)
        .maybeSingle()
      
      if (caData) {
        ca1Score = Number(caData.ca1_score) || null
        ca2Score = Number(caData.ca2_score) || null
      }

      // Calculate scores
      const objectiveScore = Number(attemptData.objective_score) || 0
      const objectiveTotal = Number(attemptData.objective_total) || 20
      const theoryTotal = Number(attemptData.theory_total) || 40
      const examTotalMarks = objectiveTotal + theoryTotal // 60
      const examScore = objectiveScore + (theoryScore || 0)
      
      // Grand total including CAs (when available)
      const ca1 = ca1Score || 0
      const ca2 = ca2Score || 0
      const grandTotalMarks = examTotalMarks + 40 // 60 + 40 = 100
      const grandTotalScore = examScore + ca1 + ca2
      
      // Percentage based on grand total if CAs exist, otherwise exam only
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
        theory_score: theoryScore,
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
  const isTheoryPending = result.status === 'pending_theory'
  const hasCA = result.ca1_score !== null && result.ca2_score !== null
  const theoryDisplay = result.theory_score !== null ? `${result.theory_score}/${result.theory_total}` : 'Pending'

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
                <Link href="/student" className="hover:text-primary flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium truncate max-w-[200px]">{result.exam_title}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/student/exams')} className="h-9 text-xs">
                <ArrowLeft className="h-4 w-4 mr-1.5" />Back
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
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{result.exam_title}</h1>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <Badge className="bg-primary/10 text-primary"><BookOpen className="h-3.5 w-3.5 mr-1" />{result.exam_subject}</Badge>
                        <Badge variant="outline"><GraduationCap className="h-3.5 w-3.5 mr-1" />{result.exam_class}</Badge>
                        {result.ca1_score !== null && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Calculator className="h-3.5 w-3.5 mr-1" />CA Scores Available
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-center lg:text-right shrink-0">
                      <div className="flex items-center gap-3 justify-center lg:justify-end">
                        <span className={cn("text-4xl sm:text-5xl lg:text-6xl font-bold", gradeInfo.color)}>
                          {result.percentage}%
                        </span>
                        <div className={cn("px-4 py-2 rounded-full", result.is_passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          <span className="text-2xl font-bold">{gradeInfo.grade}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        {hasCA 
                          ? `Total: ${result.grand_total}/${result.grand_total_marks}` 
                          : `Score: ${result.total_score}/${result.total_marks}`
                        } • Pass: {result.passing_percentage}%
                      </p>
                      <Badge className={cn("mt-2", result.is_passed ? "bg-green-500" : "bg-red-500")}>
                        {result.is_passed ? <><CheckCircle className="h-3 w-3 mr-1" /> Passed</> : <><XCircle className="h-3 w-3 mr-1" /> Failed</>}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Score Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-5 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
                  
                  <div className="space-y-3">
                    {/* CA Scores (if available) */}
                    {hasCA && (
                      <>
                        <ScoreRow label="CA 1" score={result.ca1_score!} total={20} color="bg-blue-500" icon={Calculator} />
                        <ScoreRow label="CA 2" score={result.ca2_score!} total={20} color="bg-indigo-500" icon={Calculator} />
                        <div className="border-t border-slate-100 pt-2">
                          <ScoreRow label="CA Total" score={result.ca1_score! + result.ca2_score!} total={40} color="bg-purple-500" icon={Award} bold />
                        </div>
                      </>
                    )}

                    {/* Exam Scores */}
                    <ScoreRow label="MCQ" score={result.objective_score} total={result.objective_total} color="bg-blue-500" icon={Target} />
                    <ScoreRow 
                      label="Theory" 
                      score={result.theory_score} 
                      total={result.theory_total} 
                      color="bg-purple-500" 
                      icon={PenTool}
                      pending={isTheoryPending}
                    />
                    
                    {/* Total */}
                    <div className="border-t-2 border-slate-200 pt-3 mt-3">
                      <ScoreRow 
                        label={hasCA ? "Final Total" : "Total"} 
                        score={hasCA ? result.grand_total : result.total_score} 
                        total={hasCA ? result.grand_total_marks : result.total_marks} 
                        color="bg-emerald-500" 
                        icon={Award} 
                        bold 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* MCQ Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">MCQ Performance</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{result.correct_count}</p>
                      <p className="text-xs text-slate-500">Correct</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-500">{result.incorrect_count}</p>
                      <p className="text-xs text-slate-500">Wrong</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-400">{result.unanswered_count}</p>
                      <p className="text-xs text-slate-500">Skipped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Theory Pending Notice */}
            {isTheoryPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-700 text-sm font-medium">Theory Pending Grading</p>
                    <p className="text-amber-600 text-xs mt-1">Your theory answers are awaiting grading. Final score will update once graded.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Teacher Feedback */}
            {result.teacher_feedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-2">Teacher Feedback</h3>
                    <p className="text-sm text-slate-600">{result.teacher_feedback}</p>
                  </CardContent>
                </Card>
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

// Score Row Component
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
    <div className="flex items-center gap-3">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", color.replace('bg-', 'bg-') + '/10')}>
        <Icon className={cn("h-4 w-4", color.replace('bg-', 'text-'))} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-sm", bold && "font-semibold")}>{label}</span>
          <span className={cn("text-sm", bold && "font-semibold")}>
            {pending ? 'Pending' : `${displayScore}/${total}`}
          </span>
        </div>
        {!pending && (
          <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percentage}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}