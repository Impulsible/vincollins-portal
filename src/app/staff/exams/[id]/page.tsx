/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
// app/student/exam/[id]/page.tsx - CANVAS-STYLE CBT EXAM SYSTEM
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock, ChevronLeft, ChevronRight, Send, Flag, Brain,
  CheckCircle, XCircle, AlertTriangle, Maximize2, Home,
  Grid, Lock, Loader2, Monitor, Award, Hash, User, Shield,
  BookOpen, CheckCheck, Eye, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const TAB_SWITCH_LIMIT = 3
const FULLSCREEN_EXIT_LIMIT = 3

interface Question {
  id: string
  question_text?: string
  question?: string
  type: 'objective' | 'theory' | 'mcq'
  options?: string[]
  correct_answer?: string
  answer?: string
  points?: number
  marks?: number
  order_number?: number
}

interface Exam {
  id: string
  title: string
  subject: string
  class?: string
  duration: number
  instructions?: string
  total_questions: number
  total_marks?: number
  passing_percentage?: number
  has_theory?: boolean
  questions?: Question[]
  theory_questions?: Question[]
  teacher_name?: string
  max_attempts?: number
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class?: string
  department?: string
  photo_url?: string | null
  vin_id?: string
}

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [examStarted, setExamStarted] = useState(false)
  const [examEnded, setExamEnded] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [examResult, setExamResult] = useState<any>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [startingExam, setStartingExam] = useState(false)
  const [showQuestionPalette, setShowQuestionPalette] = useState(true)
  
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [existingAttempt, setExistingAttempt] = useState<any>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
  
  const [tabSwitches, setTabSwitches] = useState(0)
  const [fullscreenExits, setFullscreenExits] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [securityViolated, setSecurityViolated] = useState(false)
  
  const loadedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef(false)
  const examEndedRef = useRef(false)

  const answeredCount = Object.keys(answers).length
  const currentQuestion = allQuestions[currentIndex]
  const isFlagged = currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false
  const progressPercentage = allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0
  const unansweredCount = allQuestions.length - answeredCount

  const loadExam = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    
    try {
      const session = await getUserSession()
      if (!session) { router.push('/portal'); return }
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.id)
        .single()
        
      if (userData) setProfile(userData)
      
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()
        
      if (examError || !examData) { setLoadError('Exam not found'); setLoading(false); return }
      
      setExam(examData)
      
      let qList: Question[] = []
      if (examData.questions) {
        if (typeof examData.questions === 'string') {
          try { qList = JSON.parse(examData.questions) } catch (e) {}
        } else if (Array.isArray(examData.questions)) {
          qList = examData.questions
        }
      }
      
      if (examData.has_theory && examData.theory_questions) {
        let tq: Question[] = []
        if (typeof examData.theory_questions === 'string') {
          try { tq = JSON.parse(examData.theory_questions) } catch (e) {}
        } else if (Array.isArray(examData.theory_questions)) {
          tq = examData.theory_questions
        }
        qList = [...qList, ...tq.map(q => ({ ...q, type: 'theory' as const }))]
      }
      
      if (qList.length === 0) {
        qList = [
          { id: 'q1', type: 'mcq', question_text: 'Sample Question 1?', options: ['A', 'B', 'C', 'D'], correct_answer: 'A', points: 1 },
          { id: 'q2', type: 'mcq', question_text: 'Sample Question 2?', options: ['A', 'B', 'C', 'D'], correct_answer: 'B', points: 1 },
        ]
      }
      
      qList = qList.map((q: any, idx: number) => ({
        ...q,
        id: q.id || `q${idx}`,
        question_text: q.question || q.question_text || 'No question text',
        type: q.type || 'mcq',
        options: q.options || [],
        correct_answer: q.correct_answer || q.answer || '',
        points: Number(q.points || q.marks || 1),
        order_number: idx + 1
      }))
      
      setAllQuestions(qList)
      
      // Check for existing attempts - SINGLE ATTEMPT ENFORCEMENT
      if (userData) {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', examId)
          .eq('student_id', userData.id)
          .order('created_at', { ascending: false })
          
        if (attempts && attempts.length > 0) {
          const latest = attempts[0]
          setAttemptsUsed(attempts.length)
          setExistingAttempt(latest)
          
          // Any attempt means exam is completed (single attempt policy)
          if (latest.status === 'completed' || latest.status === 'pending_theory' || latest.status === 'graded' || latest.status === 'in-progress') {
            setHasCompletedAttempt(true)
            
            const totalScore = (latest.objective_score || 0) + (latest.theory_score || 0)
            const totalPossible = (latest.objective_total || 0) + (latest.theory_total || 0)
            const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
            
            setExamResult({
              score: totalScore,
              total: totalPossible,
              objective_score: latest.objective_score,
              objective_total: latest.objective_total,
              theory_score: latest.theory_score,
              theory_total: latest.theory_total,
              percentage: overallPercentage,
              correct: latest.correct_count || 0,
              incorrect: latest.incorrect_count || 0,
              unanswered: latest.unanswered_count || 0,
              is_passed: latest.is_passed || false,
              passing_percentage: examData.passing_percentage || 50,
              status: latest.status,
              attempts_used: attempts.length,
              max_attempts: 1,
              graded_by: latest.graded_by,
              graded_at: latest.graded_at,
              submitted_at: latest.submitted_at
            })
          }
        } else {
          setAttemptsUsed(0)
          setHasCompletedAttempt(false)
        }
      }
    } catch (error) {
      setLoadError('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => { loadExam() }, [loadExam])
  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  const calculateScore = useCallback(() => {
    if (!allQuestions.length) return { score: 0, total: 0, percentage: 0, correct: 0, incorrect: 0, unanswered: 0 }
    
    const objectiveQuestions = allQuestions.filter(q => q.type !== 'theory')
    let score = 0, totalPoints = 0, correct = 0, incorrect = 0, unanswered = 0
    
    objectiveQuestions.forEach(q => {
      const points = Number(q.points || 1)
      totalPoints += points
      const studentAnswer = answers[q.id]
      const correctAnswer = String(q.correct_answer || '').trim()
      
      if (studentAnswer?.trim()) {
        if (studentAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
          score += points
          correct++
        } else {
          incorrect++
        }
      } else {
        unanswered++
      }
    })
    
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
    return { score, total: totalPoints, percentage, correct, incorrect, unanswered }
  }, [allQuestions, answers])

  const handleSubmit = useCallback(async (isAuto = false, reason = 'manual') => {
    if (isSubmittingRef.current || examEndedRef.current) return
    
    isSubmittingRef.current = true
    examEndedRef.current = true
    setExamEnded(true)
    setIsSubmitting(true)
    setShowSubmitDialog(false)
    
    if (timerRef.current) clearInterval(timerRef.current)
    if (document.fullscreenElement) {
      try { await document.exitFullscreen() } catch (e) {}
    }
    
    try {
      const result = calculateScore()
      const passingScore = exam?.passing_percentage || 50
      const isPassed = result.percentage >= passingScore
      
      const objectiveAnswers: Record<string, string> = {}
      const theoryAnswers: Record<string, string> = {}
      
      allQuestions.forEach(q => {
        if (q.type === 'theory') {
          theoryAnswers[q.id] = answers[q.id] || ''
        } else {
          objectiveAnswers[q.id] = answers[q.id] || ''
        }
      })
      
      const hasTheory = exam?.has_theory && Object.keys(theoryAnswers).length > 0
      const status = hasTheory ? 'pending_theory' : 'completed'
      
      const theoryTotal = allQuestions.filter(q => q.type === 'theory').reduce((sum, q) => sum + Number(q.points || 1), 0)
      
      if (attemptId) {
        await supabase.from('exam_attempts').update({
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          objective_score: result.score,
          objective_total: result.total,
          theory_total: theoryTotal,
          total_score: result.score,
          total_marks: result.total + theoryTotal,
          percentage: result.percentage,
          is_passed: isPassed,
          status: status,
          tab_switches: tabSwitches,
          fullscreen_exits: fullscreenExits,
          submitted_at: new Date().toISOString(),
          is_auto_submitted: isAuto,
          auto_submit_reason: isAuto ? reason : null,
          correct_count: result.correct,
          incorrect_count: result.incorrect,
          unanswered_count: result.unanswered
        }).eq('id', attemptId)
      }
      
      setHasCompletedAttempt(true)
      setExamResult({ 
        ...result, 
        theory_score: 0,
        theory_total: theoryTotal,
        is_passed: isPassed, 
        passing_percentage: passingScore, 
        status: status,
        attempts_used: attemptsUsed + 1, 
        max_attempts: 1,
        submitted_at: new Date().toISOString()
      })
      setExamStarted(false)
      setShowResultDialog(true)
      
      const message = hasTheory 
        ? 'Exam submitted! Theory answers will be graded by your instructor.' 
        : 'Exam submitted successfully!'
      toast.success(message)
    } catch (error) {
      toast.error('Failed to submit exam')
      setIsSubmitting(false)
      isSubmittingRef.current = false
      examEndedRef.current = false
    }
  }, [attemptId, exam, calculateScore, answers, tabSwitches, fullscreenExits, attemptsUsed, allQuestions])

  const startExam = async () => {
    setStartingExam(true)
    
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen()
      setFullscreen(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: att } = await supabase
          .from('exam_attempts')
          .insert({ 
            exam_id: examId, 
            student_id: session.user.id,
            student_name: profile?.full_name || session.user.email?.split('@')[0] || 'Student',
            student_email: session.user.email,
            student_class: profile?.class,
            status: 'in-progress', 
            started_at: new Date().toISOString(),
            tab_switches: 0,
            fullscreen_exits: 0,
            attempt_number: 1
          })
          .select('id')
          .single()
          
        if (att) setAttemptId(att.id)
      }
      
      setExamStarted(true)
      setShowInstructions(false)
      setTimeLeft((exam?.duration || 30) * 60)
      setFullscreenExits(0)
      setTabSwitches(0)
      setSecurityViolated(false)
      examEndedRef.current = false
      setExamEnded(false)
      
      toast.success('Exam started! Good luck!')
    } catch (error) {
      toast.error('Failed to start exam')
    } finally {
      setStartingExam(false)
    }
  }

  useEffect(() => {
    if (!examStarted || timeLeft <= 0 || examEndedRef.current) return
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { handleSubmit(true, 'Time expired'); return 0 } return p - 1 })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examStarted, timeLeft, handleSubmit])

  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    const h = () => {
      if (document.hidden && !examEndedRef.current && !securityViolated) {
        setTabSwitches(p => {
          const n = p + 1
          if (n === 1) toast.warning(`Tab switch detected! (${n}/${TAB_SWITCH_LIMIT})`)
          else if (n === 2) toast.error(`Final warning! (${n}/${TAB_SWITCH_LIMIT})`)
          else if (n >= TAB_SWITCH_LIMIT) { 
            setSecurityViolated(true)
            setTimeout(() => handleSubmit(true, 'Tab switch limit exceeded'), 100)
          }
          return n
        })
      }
    }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [examStarted, securityViolated, handleSubmit])

  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    const h = () => {
      const fs = !!document.fullscreenElement
      setFullscreen(fs)
      if (!fs && !examEndedRef.current && !securityViolated) {
        setFullscreenExits(p => {
          const n = p + 1
          if (n === 1) { toast.warning(`Fullscreen exited! (${n}/${FULLSCREEN_EXIT_LIMIT})`); setShowFullscreenPrompt(true) }
          else if (n === 2) { toast.error(`Final warning! (${n}/${FULLSCREEN_EXIT_LIMIT})`); setShowFullscreenPrompt(true) }
          else if (n >= FULLSCREEN_EXIT_LIMIT) { 
            setSecurityViolated(true)
            setTimeout(() => handleSubmit(true, 'Fullscreen exit limit exceeded'), 100)
          }
          return n
        })
      }
    }
    document.addEventListener('fullscreenchange', h)
    document.addEventListener('webkitfullscreenchange', h)
    return () => { document.removeEventListener('fullscreenchange', h); document.removeEventListener('webkitfullscreenchange', h) }
  }, [examStarted, securityViolated, handleSubmit])

  useEffect(() => {
    if (!examStarted) return
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    const preventDefault = (e: Event) => e.preventDefault()
    const keydown = (e: KeyboardEvent) => { 
      if ((e.ctrlKey && ['c','v','x','p','a','s'].includes(e.key.toLowerCase())) || 
          e.key === 'F12' || (e.altKey && e.key === 'Tab')) e.preventDefault() 
    }
    
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('copy', preventDefault); document.addEventListener('paste', preventDefault)
    document.addEventListener('cut', preventDefault); document.addEventListener('contextmenu', preventDefault)
    document.addEventListener('keydown', keydown)
    
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('copy', preventDefault); document.removeEventListener('paste', preventDefault)
      document.removeEventListener('cut', preventDefault); document.removeEventListener('contextmenu', preventDefault)
      document.removeEventListener('keydown', keydown)
    }
  }, [examStarted])

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen()
      setFullscreen(true)
      setShowFullscreenPrompt(false)
    } catch (e) {}
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getInitials = () => {
    if (!profile?.full_name) return 'ST'
    const parts = profile.full_name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : profile.full_name.slice(0, 2).toUpperCase()
  }

  const formatPoints = (p: number) => p === 0.5 ? '½ Point' : `${p} Point${p !== 1 ? 's' : ''}`

  const getQuestionStatus = (q: Question, idx: number) => {
    if (answers[q.id]) return 'answered'
    if (flaggedQuestions.has(q.id)) return 'flagged'
    if (idx === currentIndex) return 'current'
    return 'not-answered'
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#8B0000]" /></div>
  
  if (loadError) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md shadow-lg border-0">
        <div className="bg-[#8B0000] p-4 rounded-t-lg"><h2 className="text-white font-bold">Error</h2></div>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{loadError}</p>
          <Button onClick={() => router.push('/student')} className="bg-[#8B0000] hover:bg-[#6b0000]"><Home className="mr-2 h-4 w-4" />Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )

  // ============================================
  // COMPLETED EXAM VIEW - SHOWS SCORE & STATUS
  // ============================================
  if (hasCompletedAttempt && !examStarted && !showResultDialog) {
    const theoryQuestions = allQuestions.filter(q => q.type === 'theory')
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <BookOpen className="h-6 w-6 text-[#8B0000]" />
            <h1 className="text-2xl font-bold text-gray-900">{exam?.title}</h1>
            <Badge className={cn(
              "ml-auto px-4 py-1.5 text-sm font-medium",
              examResult?.status === 'graded' ? "bg-green-100 text-green-700" :
              examResult?.status === 'pending_theory' ? "bg-yellow-100 text-yellow-700" :
              "bg-blue-100 text-blue-700"
            )}>
              {examResult?.status === 'graded' ? 'Graded' : 
               examResult?.status === 'pending_theory' ? 'Pending Grading' : 'Completed'}
            </Badge>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Student Info & Score */}
            <div className="lg:col-span-1 space-y-6">
              {/* Student Profile Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#8B0000] to-red-400 rounded-full blur opacity-30"></div>
                      <Avatar className="h-28 w-28 ring-4 ring-white shadow-xl relative">
                        <AvatarImage src={profile?.photo_url || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-[#8B0000] to-red-700 text-white text-3xl font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                    <p className="text-gray-600">{profile?.class} • {profile?.vin_id}</p>
                    <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Score Summary */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#8B0000]" />
                    Score Summary
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="text-center py-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Overall Score</p>
                      <p className="text-4xl font-bold text-[#8B0000]">{examResult?.score}/{examResult?.total}</p>
                      <p className="text-lg text-gray-600">{examResult?.percentage}%</p>
                    </div>
                    
                    <div className={cn(
                      "rounded-lg p-4 text-center border-2",
                      examResult?.is_passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    )}>
                      {examResult?.is_passed ? (
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <CheckCircle className="h-6 w-6" />
                          <span className="text-xl font-bold">Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-red-700">
                          <XCircle className="h-6 w-6" />
                          <span className="text-xl font-bold">Not Passed</span>
                        </div>
                      )}
                      <p className="text-sm mt-1">Passing score: {examResult?.passing_percentage}%</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-600">Objective</p>
                        <p className="text-xl font-bold text-blue-700">{examResult?.objective_score || examResult?.score}/{examResult?.objective_total || examResult?.total}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-sm text-purple-600">Theory</p>
                        {examResult?.status === 'graded' ? (
                          <p className="text-xl font-bold text-purple-700">{examResult?.theory_score || 0}/{examResult?.theory_total || 0}</p>
                        ) : (
                          <p className="text-xl font-bold text-gray-400">—/{examResult?.theory_total || 0}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exam Info */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Exam Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Subject:</span> <span className="font-medium">{exam?.subject}</span></div>
                    <div><span className="text-gray-500">Class:</span> <span className="font-medium">{exam?.class}</span></div>
                    <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{exam?.duration} minutes</span></div>
                    <div><span className="text-gray-500">Questions:</span> <span className="font-medium">{allQuestions.length}</span></div>
                    <div><span className="text-gray-500">Submitted:</span> <span className="font-medium">{examResult?.submitted_at ? new Date(examResult.submitted_at).toLocaleString() : 'N/A'}</span></div>
                    <div><span className="text-gray-500">Status:</span> <Badge className={examResult?.status === 'graded' ? "bg-green-100" : "bg-yellow-100"}>{examResult?.status}</Badge></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Objective Breakdown */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Objective Questions Breakdown</h3>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-3xl font-bold text-green-600">{examResult?.correct || 0}</p>
                      <p className="text-sm text-gray-500">Correct</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-500">{examResult?.incorrect || 0}</p>
                      <p className="text-sm text-gray-500">Incorrect</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-400">{examResult?.unanswered || 0}</p>
                      <p className="text-sm text-gray-500">Unanswered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Theory Status */}
              {theoryQuestions.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#8B0000]" />
                      Theory Questions Status
                    </h3>
                    {examResult?.status === 'pending_theory' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-700 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Your theory answers are pending grading by your instructor.
                        </p>
                      </div>
                    ) : examResult?.status === 'graded' ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 flex items-center gap-2">
                          <CheckCheck className="h-5 w-5" />
                          Your theory answers have been graded!
                        </p>
                        {examResult?.graded_by && (
                          <p className="text-green-600 text-sm mt-2">Graded by: {examResult.graded_by}</p>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
              
              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={() => router.push('/student')} className="flex-1 bg-[#8B0000] hover:bg-[#6b0000] text-white">
                  <Home className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => setShowResultDialog(true)} className="flex-1">
                  <Eye className="mr-2 h-4 w-4" /> View Full Results
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-500">
                This exam has been completed. Each exam can only be taken once.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // INSTRUCTIONS PAGE
  // ============================================
  if (!examStarted && showInstructions && !hasCompletedAttempt) {
    const objectiveQuestions = allQuestions.filter(q => q.type !== 'theory')
    const theoryQuestions = allQuestions.filter(q => q.type === 'theory')
    const totalPoints = allQuestions.reduce((sum, q) => sum + Number(q.points || 1), 0)
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">{exam?.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{exam?.subject}</span>
              <span className="flex items-center gap-1"><User className="h-4 w-4" />{exam?.class}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{exam?.duration} minutes</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="space-y-6">
            {/* Student Profile Card - LARGE AVATAR */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#8B0000] to-red-400 rounded-full blur opacity-30"></div>
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl relative">
                      <AvatarImage src={profile?.photo_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-[#8B0000] to-red-700 text-white text-2xl font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                    <p className="text-gray-600">{profile?.class} • {profile?.vin_id}</p>
                    <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Exam Details */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Questions</p>
                    <p className="text-2xl font-bold text-gray-800">{allQuestions.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Points</p>
                    <p className="text-2xl font-bold text-gray-800">{totalPoints}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Pass Mark</p>
                    <p className="text-2xl font-bold text-gray-800">{exam?.passing_percentage || 50}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Attempt</p>
                    <p className="text-2xl font-bold text-gray-800">1 of 1</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Question Breakdown</h3>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>{objectiveQuestions.length} Objective Questions</span>
                    </div>
                    {theoryQuestions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>{theoryQuestions.length} Theory Questions</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {exam?.instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Instructions
                    </h3>
                    <p className="text-blue-700 text-sm">{exam.instructions}</p>
                  </div>
                )}
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Exam Security
                  </h3>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li>• Tab switching limit: {TAB_SWITCH_LIMIT} (exceed = auto-submit)</li>
                    <li>• Fullscreen exit limit: {FULLSCREEN_EXIT_LIMIT} (exceed = auto-submit)</li>
                    <li>• Time limit: Auto-submits when timer reaches zero</li>
                  </ul>
                </div>
                
                {theoryQuestions.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-purple-700 text-sm">
                      This exam contains theory questions. Objective answers are graded immediately. 
                      Theory answers will be reviewed by your instructor.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => router.push('/student')} className="flex-1">Cancel</Button>
                  <Button onClick={startExam} disabled={startingExam} className="flex-1 bg-[#8B0000] hover:bg-[#6b0000] text-white">
                    {startingExam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    Start Exam
                  </Button>
                </div>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  Note: This exam can only be taken once. Make sure you're ready before starting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Fullscreen Prompt
  if (showFullscreenPrompt && examStarted && !examEnded) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <div className="bg-[#8B0000] p-6 text-center text-white">
            <Maximize2 className="h-14 w-14 mx-auto mb-3" />
            <h2 className="text-xl font-bold">Return to Fullscreen</h2>
          </div>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-[#8B0000] mb-2">{fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}</p>
            <p className="text-gray-600 mb-6">{fullscreenExits >= FULLSCREEN_EXIT_LIMIT - 1 ? '⚠️ ONE MORE EXIT WILL AUTO-SUBMIT!' : 'This exam must be taken in fullscreen mode.'}</p>
            <Button onClick={enterFullscreen} className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white"><Maximize2 className="mr-2 h-4 w-4" />Return to Fullscreen</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================
  // MAIN EXAM INTERFACE
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - WITH PROPER SPACING */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-[#8B0000]/20">
                <AvatarImage src={profile?.photo_url || ''} />
                <AvatarFallback className="bg-[#8B0000] text-white text-sm font-bold">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">{exam?.title}</h2>
                <p className="text-xs text-gray-500">{profile?.full_name}</p>
              </div>
            </div>
            
            <div className={cn("px-4 py-1.5 rounded-md font-mono text-lg font-bold", timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-800")}>
              <Clock className="inline h-4 w-4 mr-1.5" />{formatTime(timeLeft)}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={cn("px-2 py-0.5 text-xs", tabSwitches === 0 ? "bg-green-100 text-green-700" : tabSwitches === 1 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>Tab: {tabSwitches}/{TAB_SWITCH_LIMIT}</Badge>
              <Badge className={cn("px-2 py-0.5 text-xs", fullscreenExits === 0 ? "bg-green-100 text-green-700" : fullscreenExits === 1 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>FS: {fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}</Badge>
              <Button size="sm" onClick={() => setShowSubmitDialog(true)} className="bg-[#8B0000] hover:bg-[#6b0000] text-white h-8 px-4"><Send className="mr-1.5 h-3.5 w-3.5" />Submit</Button>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
              <span><strong className="text-gray-800">{answeredCount}</strong>/{allQuestions.length} answered</span>
              <span>{flaggedQuestions.size} flagged</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 bg-gray-200 [&>div]:bg-[#8B0000]" />
          </div>
        </div>
      </div>

      {/* Main Content - WITH PROPER TOP PADDING */}
      <div className="pt-20 pb-6 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Question Panel */}
            <div className="flex-1">
              <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">Question {currentIndex + 1}</span>
                      <Badge variant="outline" className="text-xs">{currentQuestion?.type === 'theory' ? 'Theory' : 'Objective'}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Award className="h-4 w-4 text-[#8B0000]" />
                        <span>{formatPoints(currentQuestion?.points || 1)}</span>
                      </div>
                      <button onClick={() => setFlaggedQuestions(p => { const n = new Set(p); n.has(currentQuestion.id) ? n.delete(currentQuestion.id) : n.add(currentQuestion.id); return n })} className={cn("p-1.5 rounded hover:bg-gray-100", isFlagged ? "text-yellow-600" : "text-gray-400")}><Flag className="h-4 w-4" fill={isFlagged ? "currentColor" : "none"} /></button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-5 mb-5">
                    <p className="text-gray-800 leading-relaxed">{currentQuestion?.question_text || currentQuestion?.question}</p>
                  </div>
                  
                  {currentQuestion?.type !== 'theory' && currentQuestion?.options ? (
                    <RadioGroup value={answers[currentQuestion?.id] || ''} onValueChange={(v) => setAnswers(p => ({ ...p, [currentQuestion.id]: v }))} className="space-y-2">
                      {currentQuestion.options.map((opt, idx) => {
                        const letters = ['A', 'B', 'C', 'D', 'E', 'F']
                        const isSelected = answers[currentQuestion?.id] === opt
                        return (
                          <div key={idx} className={cn("flex items-center gap-3 p-3 rounded-md border cursor-pointer", isSelected ? "border-[#8B0000] bg-red-50/30" : "border-gray-200 hover:border-gray-300")} onClick={() => setAnswers(p => ({ ...p, [currentQuestion.id]: opt }))}>
                            <div className={cn("w-6 h-6 rounded flex items-center justify-center text-sm font-medium", isSelected ? "bg-[#8B0000] text-white" : "bg-gray-100 text-gray-600")}>{letters[idx]}</div>
                            <RadioGroupItem value={opt} id={`opt-${idx}`} className="sr-only" />
                            <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer text-gray-700">{opt}</Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  ) : (
                    <Textarea value={answers[currentQuestion?.id] || ''} onChange={(e) => setAnswers(p => ({ ...p, [currentQuestion.id]: e.target.value }))} placeholder="Type your answer here..." rows={6} className="w-full border-gray-200 rounded-md focus:border-[#8B0000] focus:ring-[#8B0000] resize-none" />
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setShowQuestionPalette(!showQuestionPalette)}><Grid className="mr-1 h-4 w-4" />Palette</Button>
                {currentIndex === allQuestions.length - 1 ? (
                  <Button size="sm" onClick={() => setShowSubmitDialog(true)} className="bg-[#8B0000] hover:bg-[#6b0000] text-white"><Send className="mr-1 h-4 w-4" />Submit</Button>
                ) : (
                  <Button size="sm" onClick={() => setCurrentIndex(p => p + 1)} className="bg-[#8B0000] hover:bg-[#6b0000] text-white">Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
                )}
              </div>

              {showQuestionPalette && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-medium text-gray-700 text-sm mb-3">Question Palette</h4>
                  <div className="grid grid-cols-10 gap-1.5 max-h-48 overflow-y-auto">
                    {allQuestions.map((q, idx) => {
                      const status = getQuestionStatus(q, idx)
                      return (
                        <button key={q.id} onClick={() => setCurrentIndex(idx)} className={cn("w-7 h-7 rounded text-xs font-medium flex items-center justify-center", idx === currentIndex && "ring-2 ring-[#8B0000] ring-offset-1", status === 'answered' && "bg-green-500 text-white", status === 'flagged' && "bg-yellow-500 text-white", status === 'current' && "bg-[#8B0000] text-white", status === 'not-answered' && "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200")}>{idx + 1}</button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-64 shrink-0 space-y-4">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-800 text-sm mb-3">Progress</h4>
                  <div className="space-y-3">
                    <div><div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Completion</span><span className="font-medium text-[#8B0000]">{Math.round(progressPercentage)}%</span></div><Progress value={progressPercentage} className="h-1.5 bg-gray-200 [&>div]:bg-[#8B0000]" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 rounded p-2 text-center"><p className="text-green-700 text-xs">Answered</p><p className="text-lg font-bold text-green-700">{answeredCount}</p></div>
                      <div className="bg-yellow-50 rounded p-2 text-center"><p className="text-yellow-700 text-xs">Flagged</p><p className="text-lg font-bold text-yellow-700">{flaggedQuestions.size}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Exam?</DialogTitle></DialogHeader>
          <div className="py-2"><p className="text-gray-600">You have answered <strong>{answeredCount}</strong> of <strong>{allQuestions.length}</strong> questions.</p>
            {unansweredCount > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3"><span className="text-yellow-700 text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{unansweredCount} unanswered questions!</span></div>}
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Continue</Button><Button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-[#8B0000] hover:bg-[#6b0000] text-white">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={() => setShowResultDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{examResult?.is_passed ? <><CheckCircle className="h-5 w-5 text-green-500" />Passed</> : <><XCircle className="h-5 w-5 text-red-500" />Completed</>}</DialogTitle></DialogHeader>
          <div className="py-3 text-center">
            <div className={cn("text-4xl font-bold", examResult?.is_passed ? "text-green-600" : "text-gray-700")}>{examResult?.score}/{examResult?.total}</div>
            <p className="text-gray-500 mt-1">{examResult?.percentage}%</p>
            <div className="flex justify-center gap-4 mt-3 text-sm"><span className="text-green-600">✓{examResult?.correct}</span><span className="text-red-500">✗{examResult?.incorrect}</span><span className="text-gray-500">?{examResult?.unanswered}</span></div>
          </div>
          <DialogFooter><Button onClick={() => setShowResultDialog(false)} className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}