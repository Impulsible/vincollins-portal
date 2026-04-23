/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/staff/exams/[id]/grade/page.tsx - FULLY UPDATED: Current term support
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, CheckCircle, User, Award, FileText,
  Clock, Search, Eye, AlertCircle, CheckCheck, Loader2,
  RefreshCw, History, Calendar, ChevronRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ============================================
// CURRENT TERM CONSTANTS
// ============================================
const CURRENT_TERM = 'third'
const CURRENT_SESSION = '2025/2026'
const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

// ============================================
// INTERFACES
// ============================================
interface TheoryQuestion {
  id: string
  question: string
  question_text?: string
  points: number
  marks?: number
  order_number?: number
}

interface StudentAttempt {
  id: string
  student_id: string
  student_name: string
  student_email: string
  student_class: string
  photo_url?: string
  started_at: string
  submitted_at: string
  objective_score: number
  objective_total: number
  theory_answers: Record<string, string>
  theory_score: number | null
  theory_total: number
  theory_feedback: Record<string, { score: number; feedback: string }> | null
  status: 'pending_theory' | 'graded'
  is_passed: boolean
  total_score: number
  percentage: number
  graded_by: string | null
  graded_at: string | null
  can_retake: boolean
  term?: string
  session_year?: string
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  passing_percentage: number
  term?: string
  session_year?: string
}

export default function StaffGradingPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [pendingAttempts, setPendingAttempts] = useState<StudentAttempt[]>([])
  const [gradedAttempts, setGradedAttempts] = useState<StudentAttempt[]>([])
  const [selectedAttempt, setSelectedAttempt] = useState<StudentAttempt | null>(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [theoryScores, setTheoryScores] = useState<Record<string, { score: string; feedback: string }>>({})
  const [saving, setSaving] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [currentTermInfo, setCurrentTermInfo] = useState({ term: CURRENT_TERM, session: CURRENT_SESSION })
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStaffName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
      if (data) setStaffName(data.full_name)
    }
  }, [])
  
  const fetchCurrentTerm = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('terms')
        .select('*')
        .eq('is_current', true)
        .single()
      
      if (data) {
        setCurrentTermInfo({ term: data.term_code, session: data.session_year })
      }
    } catch (error) {
      console.error('Error fetching current term:', error)
    }
  }, [])
  
  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()
        
      if (examError) throw examError
      
      if (examData) {
        setExam(examData as Exam)
        
        // Load theory questions from questions table
        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .eq('type', 'theory')
          .order('order_number', { ascending: true })
        
        if (questionsData && questionsData.length > 0) {
          const parsedQuestions = questionsData.map((q: any, idx: number) => ({
            id: q.id,
            question: q.question_text || 'No question text',
            question_text: q.question_text,
            points: Number(q.points || 5),
            order_number: q.order_number || idx + 1
          }))
          setTheoryQuestions(parsedQuestions)
        }
        
        // Load attempts for current term
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', examId)
          .eq('term', currentTermInfo.term)
          .eq('session_year', currentTermInfo.session)
          .in('status', ['pending_theory', 'graded', 'submitted'])
          .order('submitted_at', { ascending: false })
          
        if (attemptsError) throw attemptsError
        
        if (attemptsData) {
          const pending: StudentAttempt[] = []
          const graded: StudentAttempt[] = []
          
          for (const att of attemptsData) {
            // Get student profile
            const { data: studentData } = await supabase
              .from('profiles')
              .select('id, full_name, email, class, photo_url')
              .eq('id', att.student_id)
              .single()
              
            const theoryTotal = theoryQuestions.reduce((sum, q) => sum + q.points, 0) || 
                               (examData.theory_total || 0)
            const totalScore = (att.objective_score || 0) + (att.theory_score || 0)
            const totalPossible = (att.objective_total || 0) + theoryTotal
            const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
            
            const attempt: StudentAttempt = {
              ...att,
              student_name: studentData?.full_name || att.student_name || 'Unknown',
              student_email: studentData?.email || att.student_email || '',
              student_class: studentData?.class || att.student_class || '',
              photo_url: studentData?.photo_url,
              theory_total: theoryTotal,
              total_score: totalScore,
              percentage: percentage,
              term: att.term,
              session_year: att.session_year
            }
            
            // Also include 'submitted' status as pending
            if (att.status === 'pending_theory' || att.status === 'submitted') {
              pending.push(attempt)
            } else if (att.status === 'graded') {
              graded.push(attempt)
            }
          }
          
          setPendingAttempts(pending)
          setGradedAttempts(graded)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load exam data')
    } finally {
      setLoading(false)
    }
  }, [examId, currentTermInfo, theoryQuestions])
  
  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchCurrentTerm()
    getStaffName()
  }, [fetchCurrentTerm, getStaffName])
  
  useEffect(() => {
    if (currentTermInfo.term) {
      loadData()
    }
  }, [loadData, currentTermInfo])
  
  // ============================================
  // SCORE INITIALIZATION
  // ============================================
  const initializeScores = (attempt: StudentAttempt) => {
    const initial: Record<string, { score: string; feedback: string }> = {}
    
    theoryQuestions.forEach(q => {
      if (attempt.theory_feedback && attempt.theory_feedback[q.id]) {
        initial[q.id] = {
          score: String(attempt.theory_feedback[q.id].score),
          feedback: attempt.theory_feedback[q.id].feedback || ''
        }
      } else {
        initial[q.id] = { score: '', feedback: '' }
      }
    })
    
    setTheoryScores(initial)
  }
  
  // ============================================
  // HANDLERS
  // ============================================
  const handleOpenGradeDialog = (attempt: StudentAttempt) => {
    setSelectedAttempt(attempt)
    initializeScores(attempt)
    setShowGradeDialog(true)
  }
  
  const handleOpenViewDialog = (attempt: StudentAttempt) => {
    setSelectedAttempt(attempt)
    setShowViewDialog(true)
  }
  
  const handleSaveGrades = async () => {
    if (!selectedAttempt) return
    
    let hasError = false
    let totalTheoryScore = 0
    
    theoryQuestions.forEach(q => {
      const score = parseFloat(theoryScores[q.id]?.score || '0')
      if (isNaN(score) || score < 0 || score > q.points) {
        toast.error(`Invalid score for Question ${(q.order_number || 0) + 1}. Max: ${q.points}`)
        hasError = true
        return
      }
      totalTheoryScore += score
    })
    
    if (hasError) return
    
    setSaving(true)
    
    try {
      const theoryTotal = theoryQuestions.reduce((sum, q) => sum + q.points, 0)
      const totalScore = (selectedAttempt.objective_score || 0) + totalTheoryScore
      const totalPossible = (selectedAttempt.objective_total || 0) + theoryTotal
      const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
      const isPassed = percentage >= (exam?.passing_percentage || 50)
      
      const feedback: Record<string, { score: number; feedback: string }> = {}
      Object.entries(theoryScores).forEach(([qId, data]) => {
        feedback[qId] = {
          score: parseFloat(data.score) || 0,
          feedback: data.feedback || ''
        }
      })
      
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          theory_score: totalTheoryScore,
          theory_total: theoryTotal,
          total_score: totalScore,
          total_marks: totalPossible,
          percentage: percentage,
          is_passed: isPassed,
          status: 'graded',
          theory_feedback: feedback,
          graded_by: staffName,
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedAttempt.id)
        
      if (error) throw error
      
      // Update student term progress
      await updateStudentTermProgress(selectedAttempt.student_id)
      
      toast.success('Grades saved successfully!')
      setShowGradeDialog(false)
      loadData()
      
    } catch (error) {
      console.error('Failed to save grades:', error)
      toast.error('Failed to save grades')
    } finally {
      setSaving(false)
    }
  }
  
  const updateStudentTermProgress = async (studentId: string) => {
    try {
      // Count completed exams for this student in current term
      const { data: completedAttempts } = await supabase
        .from('exam_attempts')
        .select('exam_id, percentage')
        .eq('student_id', studentId)
        .eq('term', currentTermInfo.term)
        .eq('session_year', currentTermInfo.session)
        .eq('status', 'graded')
      
      if (completedAttempts) {
        const completedCount = completedAttempts.length
        const avgScore = completedAttempts.length > 0
          ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
          : 0
        
        // Get student class for subject count
        const { data: student } = await supabase
          .from('profiles')
          .select('class')
          .eq('id', studentId)
          .single()
        
        const totalSubjects = student?.class?.startsWith('JSS') ? 17 : 10
        
        // Calculate grade
        let grade = 'F'
        if (avgScore >= 80) grade = 'A'
        else if (avgScore >= 70) grade = 'B'
        else if (avgScore >= 60) grade = 'C'
        else if (avgScore >= 50) grade = 'P'
        
        // Upsert term progress
        await supabase
          .from('student_term_progress')
          .upsert({
            student_id: studentId,
            term: currentTermInfo.term,
            session_year: currentTermInfo.session,
            completed_exams: completedCount,
            total_subjects: totalSubjects,
            average_score: Math.round(avgScore * 100) / 100,
            grade: grade,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'student_id,term,session_year'
          })
      }
    } catch (error) {
      console.error('Error updating term progress:', error)
    }
  }
  
  const handleAllowRetake = async (attemptId: string, canRetake: boolean) => {
    try {
      const { error } = await supabase
        .from('exam_attempts')
        .update({ can_retake: canRetake })
        .eq('id', attemptId)
        
      if (error) throw error
      
      toast.success(canRetake ? 'Retake allowed!' : 'Retake revoked!')
      loadData()
    } catch (error) {
      toast.error('Failed to update retake status')
    }
  }
  
  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredPending = pendingAttempts.filter(a =>
    a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredGraded = gradedAttempts.filter(a =>
    a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
  }
  
  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading grading interface...</p>
        </div>
      </div>
    )
  }
  
  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/staff/exams')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {exam?.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {exam?.subject} • {exam?.class}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5 py-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">
                {TERM_NAMES[currentTermInfo.term]} {currentTermInfo.session}
              </span>
            </Badge>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500">Pending Grading</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{pendingAttempts.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500">Graded</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{gradedAttempts.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500">Total Submissions</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                {pendingAttempts.length + gradedAttempts.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500">Theory Questions</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">{theoryQuestions.length}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 sm:h-11 bg-white"
          />
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5 bg-white p-1 rounded-xl shadow-sm border w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex items-center gap-2 rounded-lg text-xs sm:text-sm py-2 flex-1 sm:flex-initial">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden xs:inline">Pending Grading</span>
              <span className="xs:hidden">Pending</span>
              <Badge variant="secondary" className="ml-1.5 bg-yellow-100 text-yellow-700">
                {filteredPending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="graded" className="flex items-center gap-2 rounded-lg text-xs sm:text-sm py-2 flex-1 sm:flex-initial">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden xs:inline">Graded</span>
              <span className="xs:hidden">Graded</span>
              <Badge variant="secondary" className="ml-1.5 bg-green-100 text-green-700">
                {filteredGraded.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs sm:text-sm">Student</TableHead>
                        <TableHead className="text-xs sm:text-sm">Class</TableHead>
                        <TableHead className="text-xs sm:text-sm">Objective Score</TableHead>
                        <TableHead className="text-xs sm:text-sm">Submitted</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                            <p>No pending submissions for {TERM_NAMES[currentTermInfo.term]}</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPending.map((attempt) => (
                          <TableRow key={attempt.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                  <AvatarImage src={attempt.photo_url} />
                                  <AvatarFallback className="bg-blue-100 text-blue-700">
                                    {getInitials(attempt.student_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{attempt.student_name}</p>
                                  <p className="text-xs text-gray-500 truncate">{attempt.student_email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{attempt.student_class}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-sm">
                                {attempt.objective_score}/{attempt.objective_total}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({Math.round((attempt.objective_score / attempt.objective_total) * 100)}%)
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs sm:text-sm">
                                {new Date(attempt.submitted_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleOpenGradeDialog(attempt)}
                                className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 text-xs sm:text-sm"
                              >
                                <Award className="mr-1.5 h-3.5 w-3.5" /> Grade
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Graded Tab */}
          <TabsContent value="graded">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs sm:text-sm">Student</TableHead>
                        <TableHead className="text-xs sm:text-sm">Class</TableHead>
                        <TableHead className="text-xs sm:text-sm">Objective</TableHead>
                        <TableHead className="text-xs sm:text-sm">Theory</TableHead>
                        <TableHead className="text-xs sm:text-sm">Total</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGraded.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            <CheckCheck className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                            <p>No graded submissions yet</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredGraded.map((attempt) => (
                          <TableRow key={attempt.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                  <AvatarImage src={attempt.photo_url} />
                                  <AvatarFallback className="bg-green-100 text-green-700">
                                    {getInitials(attempt.student_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{attempt.student_name}</p>
                                  <p className="text-xs text-gray-500 truncate">{attempt.student_email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{attempt.student_class}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs sm:text-sm">
                                {attempt.objective_score}/{attempt.objective_total}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs sm:text-sm">
                                {attempt.theory_score}/{attempt.theory_total}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-sm">
                                {attempt.total_score}/{(attempt.objective_total || 0) + (attempt.theory_total || 0)}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">({attempt.percentage}%)</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "text-xs",
                                attempt.is_passed 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-red-100 text-red-700"
                              )}>
                                {attempt.is_passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenViewDialog(attempt)}
                                  className="h-8 sm:h-9"
                                >
                                  <Eye className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attempt.can_retake ? "destructive" : "outline"}
                                  onClick={() => handleAllowRetake(attempt.id, !attempt.can_retake)}
                                  className="h-8 sm:h-9"
                                >
                                  <History className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">
                                    {attempt.can_retake ? 'Revoke' : 'Retake'}
                                  </span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <User className="h-5 w-5 text-blue-600" />
              Grade Theory Answers - {selectedAttempt?.student_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Objective Score Summary */}
            <div className="bg-blue-50 rounded-xl p-4 sm:p-5">
              <p className="text-sm text-blue-800 font-medium">Objective Score</p>
              <p className="text-3xl font-bold text-blue-900">
                {selectedAttempt?.objective_score} / {selectedAttempt?.objective_total}
              </p>
            </div>
            
            {/* Theory Questions */}
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Theory Questions</h3>
              
              {theoryQuestions.map((question, idx) => {
                const answer = selectedAttempt?.theory_answers?.[question.id] || 'No answer provided.'
                const scoreData = theoryScores[question.id] || { score: '', feedback: '' }
                
                return (
                  <div key={question.id} className="border rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Question {idx + 1} ({question.points} {question.points === 1 ? 'point' : 'points'})
                        </p>
                        <p className="text-gray-700 mt-1 text-sm sm:text-base">{question.question}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Student's Answer:</p>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">{answer}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`score-${question.id}`} className="text-xs sm:text-sm">
                          Score (max: {question.points})
                        </Label>
                        <Input
                          id={`score-${question.id}`}
                          type="number"
                          min="0"
                          max={question.points}
                          step="0.5"
                          value={scoreData.score}
                          onChange={(e) => setTheoryScores(prev => ({
                            ...prev,
                            [question.id]: { ...prev[question.id], score: e.target.value }
                          }))}
                          placeholder={`0 - ${question.points}`}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`feedback-${question.id}`} className="text-xs sm:text-sm">
                          Feedback (optional)
                        </Label>
                        <Textarea
                          id={`feedback-${question.id}`}
                          value={scoreData.feedback}
                          onChange={(e) => setTheoryScores(prev => ({
                            ...prev,
                            [question.id]: { ...prev[question.id], feedback: e.target.value }
                          }))}
                          placeholder="Great work! or Needs improvement..."
                          className="mt-1.5"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowGradeDialog(false)} className="sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveGrades} disabled={saving} className="bg-green-600 hover:bg-green-700 sm:w-auto">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Grades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Graded Submission - {selectedAttempt?.student_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs sm:text-sm text-blue-600">Objective</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {selectedAttempt?.objective_score}/{selectedAttempt?.objective_total}
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs sm:text-sm text-purple-600">Theory</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">
                  {selectedAttempt?.theory_score}/{selectedAttempt?.theory_total}
                </p>
              </div>
              <div className={cn(
                "rounded-xl p-4 text-center",
                selectedAttempt?.is_passed ? "bg-green-50" : "bg-red-50"
              )}>
                <p className={cn(
                  "text-xs sm:text-sm", 
                  selectedAttempt?.is_passed ? "text-green-600" : "text-red-600"
                )}>
                  Total
                </p>
                <p className={cn(
                  "text-xl sm:text-2xl font-bold", 
                  selectedAttempt?.is_passed ? "text-green-700" : "text-red-700"
                )}>
                  {selectedAttempt?.total_score}/{(selectedAttempt?.objective_total || 0) + (selectedAttempt?.theory_total || 0)}
                </p>
                <p className="text-xs sm:text-sm mt-1">
                  {selectedAttempt?.percentage}%
                </p>
              </div>
            </div>
            
            {/* Theory Answers with Grades */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Theory Answers & Grades</h3>
              
              {theoryQuestions.map((question, idx) => {
                const answer = selectedAttempt?.theory_answers?.[question.id] || 'No answer provided.'
                const feedback = selectedAttempt?.theory_feedback?.[question.id]
                
                return (
                  <div key={question.id} className="border rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Question {idx + 1} ({question.points} {question.points === 1 ? 'point' : 'points'})
                        </p>
                        <p className="text-gray-700 mt-1 text-sm sm:text-base">{question.question}</p>
                      </div>
                      <Badge className="text-base px-3 py-1.5">
                        Score: {feedback?.score || 0}/{question.points}
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Student's Answer:</p>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">{answer}</p>
                    </div>
                    
                    {feedback?.feedback && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-green-700 mb-1">Feedback:</p>
                        <p className="text-green-800 text-sm sm:text-base">{feedback.feedback}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Grading Info */}
            <div className="text-xs sm:text-sm text-gray-500 border-t pt-4">
              <p>Graded by: {selectedAttempt?.graded_by || 'N/A'}</p>
              <p>Graded at: {selectedAttempt?.graded_at ? new Date(selectedAttempt.graded_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}