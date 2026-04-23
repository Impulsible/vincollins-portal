/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
// app/student/exam/[id]/page.tsx - PROFESSIONAL CBT INTERFACE
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
  Clock, ChevronLeft, ChevronRight, Send, Flag,
  CheckCircle, XCircle, AlertTriangle, Maximize2, Home,
  Grid, Lock, Loader2, Award, User, Shield,
  BookOpen, CheckCheck, Eye, FileText, Calendar,
  Wifi, WifiOff, Save, RotateCcw, Camera, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'
// FIXED: Changed to named import
import { RichTextEditor } from '@/components/ui/rich-text-editor'

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

const TAB_SWITCH_LIMIT = 3
const FULLSCREEN_EXIT_LIMIT = 3
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

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
  term?: string
  session_year?: string
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
  const [showQuestionPalette, setShowQuestionPalette] = useState(false)
  
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [existingAttempt, setExistingAttempt] = useState<any>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
  
  const [tabSwitches, setTabSwitches] = useState(0)
  const [fullscreenExits, setFullscreenExits] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [securityViolated, setSecurityViolated] = useState(false)
  
  const [isOnline, setIsOnline] = useState(true)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [resumeData, setResumeData] = useState<any>(null)
  
  const [currentTermInfo] = useState({ term: CURRENT_TERM, session: CURRENT_SESSION })
  
  const loadedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef(false)
  const examEndedRef = useRef(false)

  const answeredCount = Object.keys(answers).length
  const currentQuestion = allQuestions[currentIndex]
  const isFlagged = currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false
  const progressPercentage = allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0
  const unansweredCount = allQuestions.length - answeredCount

  // ============================================
  // ONLINE/OFFLINE DETECTION
  // ============================================
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Network restored! Your progress is safe.', { duration: 2000 })
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Network disconnected! Your answers are saved locally.', { duration: 5000 })
    }
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ============================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================
  const autoSave = useCallback(async () => {
    if (!attemptId || !examStarted || examEndedRef.current) return
    if (Object.keys(answers).length === 0) return
    
    setAutoSaving(true)
    try {
      await supabase
        .from('exam_attempts')
        .update({ 
          answers: answers,
          theory_answers: allQuestions.filter(q => q.type === 'theory').reduce((acc, q) => {
            acc[q.id] = answers[q.id] || ''
            return acc
          }, {} as Record<string, string>),
          last_saved_at: new Date().toISOString()
        })
        .eq('id', attemptId)
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setAutoSaving(false)
    }
  }, [attemptId, examStarted, answers, allQuestions])

  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    
    autoSaveTimerRef.current = setInterval(autoSave, AUTO_SAVE_INTERVAL)
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current) }
  }, [examStarted, autoSave])

  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    const timer = setTimeout(() => autoSave(), 2000)
    return () => clearTimeout(timer)
  }, [answers, examStarted, autoSave])

  // ============================================
  // LOAD EXAM
  // ============================================
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
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_number', { ascending: true })
      
      if (questionsData && questionsData.length > 0) {
        qList = questionsData.map((q: any) => ({
          ...q,
          question_text: q.question_text || q.question,
          type: q.type || 'objective',
          options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
          points: q.points || 1
        }))
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
          
          if (latest.status === 'in-progress') {
            const startedAt = new Date(latest.started_at)
            const now = new Date()
            const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
            const remainingSeconds = Math.max(0, (examData.duration * 60) - elapsedSeconds)
            
            setResumeData({
              attemptId: latest.id,
              answers: latest.answers || {},
              timeLeft: remainingSeconds,
              tabSwitches: latest.tab_switches || 0,
              fullscreenExits: latest.fullscreen_exits || 0
            })
            setShowResumeDialog(true)
          } else if (latest.status === 'completed' || latest.status === 'pending_theory' || latest.status === 'graded') {
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

  // ============================================
  // RESUME EXAM
  // ============================================
  const handleResumeExam = async () => {
    if (!resumeData) return
    
    setAttemptId(resumeData.attemptId)
    setAnswers(resumeData.answers || {})
    setTimeLeft(resumeData.timeLeft)
    setTabSwitches(resumeData.tabSwitches || 0)
    setFullscreenExits(resumeData.fullscreenExits || 0)
    
    setExamStarted(true)
    setShowInstructions(false)
    setShowResumeDialog(false)
    examEndedRef.current = false
    setExamEnded(false)
    
    toast.success('Exam resumed! Continue where you left off.')
    
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen()
      setFullscreen(true)
    } catch (e) {}
  }

  const handleStartNewAttempt = async () => {
    setShowResumeDialog(false)
    startExam()
  }

  const handleDiscardAndStart = () => {
    setShowResumeDialog(false)
    setShowInstructions(true)
  }

  // ============================================
  // CALCULATIONS & HELPERS
  // ============================================
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
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
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
          unanswered_count: result.unanswered,
          term: exam?.term || CURRENT_TERM,
          session_year: exam?.session_year || CURRENT_SESSION
        }).eq('id', attemptId)
        
        if (tabSwitches > 0 || fullscreenExits > 0) {
          await supabase.from('exam_security_logs').insert({
            attempt_id: attemptId,
            student_id: profile?.id,
            exam_id: examId,
            tab_switches: tabSwitches,
            fullscreen_exits: fullscreenExits,
            auto_submitted: isAuto,
            submit_reason: reason,
            term: exam?.term || CURRENT_TERM,
            session_year: exam?.session_year || CURRENT_SESSION,
            created_at: new Date().toISOString()
          })
        }
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
  }, [attemptId, exam, calculateScore, answers, tabSwitches, fullscreenExits, attemptsUsed, allQuestions, profile, examId])

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
            attempt_number: 1,
            term: exam?.term || CURRENT_TERM,
            session_year: exam?.session_year || CURRENT_SESSION
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

  // ============================================
  // TIMER EFFECT
  // ============================================
  useEffect(() => {
    if (!examStarted || timeLeft <= 0 || examEndedRef.current) return
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { 
        if (p <= 1) { 
          handleSubmit(true, 'Time expired')
          return 0 
        }
        return p - 1 
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examStarted, timeLeft, handleSubmit])

  // ============================================
  // SECURITY EFFECTS (Tab Switch & Fullscreen)
  // ============================================
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

  // ============================================
  // FORMATTING HELPERS
  // ============================================
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`
  }

  const formatPoints = (p: number) => p === 0.5 ? '½ Point' : `${p} Point${p !== 1 ? 's' : ''}`

  const getQuestionStatus = (q: Question, idx: number) => {
    if (answers[q.id]) return 'answered'
    if (flaggedQuestions.has(q.id)) return 'flagged'
    if (idx === currentIndex) return 'current'
    return 'not-answered'
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#c41e3a] mx-auto mb-4" />
        <p className="text-gray-400">Loading exam environment...</p>
      </div>
    </div>
  )
  
  if (loadError) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <Card className="max-w-md shadow-lg border-0 bg-[#1a1f2e] text-white">
        <div className="bg-[#c41e3a] p-4 rounded-t-lg"><h2 className="text-white font-bold">Error</h2></div>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-300 mb-4">{loadError}</p>
          <Button onClick={() => router.push('/student')} className="bg-[#c41e3a] hover:bg-[#a01830] text-white"><Home className="mr-2 h-4 w-4" />Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )

  // ============================================
  // RESUME DIALOG
  // ============================================
  if (showResumeDialog) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 bg-[#1a1f2e] text-white shadow-xl">
          <div className="bg-gradient-to-r from-[#c41e3a] to-[#e8354a] p-6 text-center">
            <RotateCcw className="h-14 w-14 mx-auto mb-3 text-white" />
            <h2 className="text-xl font-bold">Resume Exam?</h2>
          </div>
          <CardContent className="p-6">
            <p className="text-gray-300 mb-4 text-center">
              You have an exam in progress. Would you like to resume where you left off?
            </p>
            
            <div className="bg-[#0a0f1a] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Time Remaining:</span>
                <span className="text-[#c41e3a] font-bold text-xl">{formatTime(resumeData?.timeLeft || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Questions Answered:</span>
                <span className="text-white font-medium">{Object.keys(resumeData?.answers || {}).length} / {allQuestions.length}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleResumeExam} className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white h-12">
                <RotateCcw className="mr-2 h-4 w-4" /> Resume Exam
              </Button>
              <Button variant="outline" onClick={handleStartNewAttempt} className="w-full border-gray-600 text-gray-300 hover:bg-[#0a0f1a] h-12">
                Start New Attempt
              </Button>
              <Button variant="ghost" onClick={handleDiscardAndStart} className="w-full text-gray-400 hover:text-white h-12">
                Discard & Start Fresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================
  // COMPLETED EXAM VIEW
  // ============================================
  if (hasCompletedAttempt && !examStarted && !showResultDialog) {
    const theoryQuestions = allQuestions.filter(q => q.type === 'theory')
    
    return (
      <div className="min-h-screen bg-[#0a0f1a]">
        <div className="bg-[#1a1f2e] border-b border-gray-700 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <BookOpen className="h-6 w-6 text-[#c41e3a]" />
            <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
            <Badge className={cn(
              "ml-auto px-4 py-1.5 text-sm font-medium",
              examResult?.status === 'graded' ? "bg-green-500/20 text-green-400" :
              examResult?.status === 'pending_theory' ? "bg-yellow-500/20 text-yellow-400" :
              "bg-blue-500/20 text-blue-400"
            )}>
              {examResult?.status === 'graded' ? 'Graded' : 
               examResult?.status === 'pending_theory' ? 'Pending Grading' : 'Completed'}
            </Badge>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-lg bg-[#1a1f2e] overflow-hidden">
                <div className="bg-gradient-to-r from-[#c41e3a] to-[#e8354a] p-3">
                  <h3 className="text-white font-medium text-center flex items-center justify-center gap-2">
                    <Camera className="h-4 w-4" /> Student Identification
                  </h3>
                </div>
                <CardContent className="p-6 flex justify-center">
                  <div className="relative">
                    {profile?.photo_url ? (
                      <div className="w-48 h-56 border-4 border-[#c41e3a] rounded-md overflow-hidden shadow-xl">
                        <Image 
                          src={profile.photo_url} 
                          alt={profile.full_name}
                          width={192}
                          height={224}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-56 border-4 border-gray-600 rounded-md overflow-hidden bg-[#0a0f1a] flex items-center justify-center">
                        <User className="h-20 w-20 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-3 left-0 right-0">
                      <Badge className="w-full justify-center bg-[#c41e3a] text-white py-1">
                        {profile?.vin_id || 'Student'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 pb-4 text-center">
                  <h3 className="text-white font-bold text-lg">{profile?.full_name}</h3>
                  <p className="text-gray-400 text-sm">{profile?.class} • {profile?.email}</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#c41e3a]" />
                    Score Summary
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="text-center py-3 bg-[#0a0f1a] rounded-lg">
                      <p className="text-sm text-gray-400">Overall Score</p>
                      <p className="text-4xl font-bold text-[#c41e3a]">{examResult?.score}/{examResult?.total}</p>
                      <p className="text-lg text-gray-300">{examResult?.percentage}%</p>
                    </div>
                    
                    <div className={cn(
                      "rounded-lg p-4 text-center border-2",
                      examResult?.is_passed ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"
                    )}>
                      {examResult?.is_passed ? (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle className="h-6 w-6" />
                          <span className="text-xl font-bold">Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-red-400">
                          <XCircle className="h-6 w-6" />
                          <span className="text-xl font-bold">Not Passed</span>
                        </div>
                      )}
                      <p className="text-sm mt-1 text-gray-400">Passing: {examResult?.passing_percentage}%</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                        <p className="text-sm text-blue-400">Objective</p>
                        <p className="text-xl font-bold text-blue-300">{examResult?.objective_score || examResult?.score}/{examResult?.objective_total || examResult?.total}</p>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                        <p className="text-sm text-purple-400">Theory</p>
                        {examResult?.status === 'graded' ? (
                          <p className="text-xl font-bold text-purple-300">{examResult?.theory_score || 0}/{examResult?.theory_total || 0}</p>
                        ) : (
                          <p className="text-xl font-bold text-gray-500">—/{examResult?.theory_total || 0}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{TERM_NAMES[exam?.term || CURRENT_TERM]} {exam?.session_year || CURRENT_SESSION}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4">Exam Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Subject:</span> <span className="text-white font-medium">{exam?.subject}</span></div>
                    <div><span className="text-gray-400">Class:</span> <span className="text-white font-medium">{exam?.class}</span></div>
                    <div><span className="text-gray-400">Duration:</span> <span className="text-white font-medium">{exam?.duration} minutes</span></div>
                    <div><span className="text-gray-400">Questions:</span> <span className="text-white font-medium">{allQuestions.length}</span></div>
                    <div><span className="text-gray-400">Submitted:</span> <span className="text-white font-medium">{examResult?.submitted_at ? new Date(examResult.submitted_at).toLocaleString() : 'N/A'}</span></div>
                    <div><span className="text-gray-400">Status:</span> <Badge className={examResult?.status === 'graded' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>{examResult?.status}</Badge></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4">Objective Breakdown</h3>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-3xl font-bold text-green-400">{examResult?.correct || 0}</p>
                      <p className="text-sm text-gray-400">Correct</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-400">{examResult?.incorrect || 0}</p>
                      <p className="text-sm text-gray-400">Incorrect</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-500">{examResult?.unanswered || 0}</p>
                      <p className="text-sm text-gray-400">Unanswered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {theoryQuestions.length > 0 && (
                <Card className="border-0 shadow-lg bg-[#1a1f2e]">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#c41e3a]" />
                      Theory Status
                    </h3>
                    {examResult?.status === 'pending_theory' ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-yellow-400 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Your theory answers are pending grading by your instructor.
                        </p>
                      </div>
                    ) : examResult?.status === 'graded' ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-green-400 flex items-center gap-2">
                          <CheckCheck className="h-5 w-5" />
                          Your theory answers have been graded!
                        </p>
                        {examResult?.graded_by && (
                          <p className="text-green-500 text-sm mt-2">Graded by: {examResult.graded_by}</p>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-4">
                <Button onClick={() => router.push('/student')} className="flex-1 bg-[#c41e3a] hover:bg-[#a01830] text-white h-12">
                  <Home className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => setShowResultDialog(true)} className="flex-1 border-gray-600 text-gray-300 hover:bg-[#0a0f1a] h-12">
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
      <div className="min-h-screen bg-[#0a0f1a]">
        <div className="bg-[#1a1f2e] border-b border-gray-700 px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{exam?.subject}</span>
              <span className="flex items-center gap-1"><User className="h-4 w-4" />{exam?.class}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{exam?.duration} minutes</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{TERM_NAMES[exam?.term || CURRENT_TERM]} {exam?.session_year || CURRENT_SESSION}</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg bg-[#1a1f2e] overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-[#c41e3a] to-[#e8354a] p-3">
                  <h3 className="text-white font-medium text-center flex items-center justify-center gap-2">
                    <Camera className="h-4 w-4" /> Candidate Verification
                  </h3>
                </div>
                <CardContent className="p-6 flex justify-center">
                  <div className="relative">
                    {profile?.photo_url ? (
                      <div className="w-56 h-64 border-4 border-[#c41e3a] rounded-md overflow-hidden shadow-xl">
                        <Image 
                          src={profile.photo_url} 
                          alt={profile.full_name}
                          width={224}
                          height={256}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-56 h-64 border-4 border-gray-600 rounded-md overflow-hidden bg-[#0a0f1a] flex items-center justify-center">
                        <User className="h-24 w-24 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-3 left-0 right-0">
                      <Badge className="w-full justify-center bg-[#c41e3a] text-white py-1.5 text-base">
                        {profile?.vin_id || 'Student ID'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 pb-5 text-center">
                  <h3 className="text-white font-bold text-xl">{profile?.full_name}</h3>
                  <p className="text-gray-400">{profile?.class}</p>
                  <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#0a0f1a] rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 uppercase font-semibold">Questions</p>
                      <p className="text-2xl font-bold text-white">{allQuestions.length}</p>
                    </div>
                    <div className="bg-[#0a0f1a] rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 uppercase font-semibold">Total Points</p>
                      <p className="text-2xl font-bold text-white">{totalPoints}</p>
                    </div>
                    <div className="bg-[#0a0f1a] rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 uppercase font-semibold">Pass Mark</p>
                      <p className="text-2xl font-bold text-white">{exam?.passing_percentage || 50}%</p>
                    </div>
                    <div className="bg-[#0a0f1a] rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 uppercase font-semibold">Attempt</p>
                      <p className="text-2xl font-bold text-white">1 of 1</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0f1a] rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-white mb-2">Question Breakdown</h3>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-300">{objectiveQuestions.length} Objective Questions</span>
                      </div>
                      {theoryQuestions.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="text-gray-300">{theoryQuestions.length} Theory Questions</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {exam?.instructions && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <h3 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Instructions
                      </h3>
                      <p className="text-blue-300 text-sm">{exam.instructions}</p>
                    </div>
                  )}
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Exam Security
                    </h3>
                    <ul className="space-y-1 text-sm text-yellow-300">
                      <li>• Tab switching limit: {TAB_SWITCH_LIMIT} (exceed = auto-submit)</li>
                      <li>• Fullscreen exit limit: {FULLSCREEN_EXIT_LIMIT} (exceed = auto-submit)</li>
                      <li>• Time limit: Auto-submits when timer reaches zero</li>
                      <li>• Auto-save: Progress saved every 30 seconds</li>
                    </ul>
                  </div>
                  
                  {theoryQuestions.length > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                      <p className="text-purple-300 text-sm">
                        This exam contains theory questions. Objective answers are graded immediately. 
                        Theory answers will be reviewed by your instructor.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push('/student')} className="flex-1 border-gray-600 text-gray-300 hover:bg-[#0a0f1a]">Cancel</Button>
                    <Button onClick={startExam} disabled={startingExam} className="flex-1 bg-[#c41e3a] hover:bg-[#a01830] text-white">
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
      </div>
    )
  }

  // ============================================
  // FULLSCREEN PROMPT
  // ============================================
  if (showFullscreenPrompt && examStarted && !examEnded) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-[#1a1f2e]">
          <div className="bg-[#c41e3a] p-6 text-center text-white">
            <Maximize2 className="h-14 w-14 mx-auto mb-3" />
            <h2 className="text-xl font-bold">Return to Fullscreen</h2>
          </div>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-[#c41e3a] mb-2">{fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}</p>
            <p className="text-gray-400 mb-6">{fullscreenExits >= FULLSCREEN_EXIT_LIMIT - 1 ? '⚠️ ONE MORE EXIT WILL AUTO-SUBMIT!' : 'This exam must be taken in fullscreen mode.'}</p>
            <Button onClick={enterFullscreen} className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white h-12"><Maximize2 className="mr-2 h-4 w-4" />Return to Fullscreen</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================
  // MAIN EXAM INTERFACE - PROFESSIONAL CBT
  // ============================================
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#1a1f2e] border-b border-gray-700 shadow-lg">
        <div className="px-4 sm:px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.photo_url ? (
                  <div className="h-10 w-10 rounded-md overflow-hidden border-2 border-[#c41e3a]">
                    <Image 
                      src={profile.photo_url} 
                      alt={profile.full_name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-md bg-[#c41e3a] flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <h2 className="font-semibold text-white text-sm">{exam?.title}</h2>
                <p className="text-xs text-gray-400">{profile?.full_name} • {TERM_NAMES[exam?.term || CURRENT_TERM]}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className={cn(
                "px-2 py-0.5 text-xs",
                isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              
              {autoSaving && (
                <Badge className="bg-blue-500/20 text-blue-400 px-2 py-0.5 text-xs">
                  <Save className="h-3 w-3 mr-1 animate-pulse" /> Saving...
                </Badge>
              )}
              {lastSaved && !autoSaving && (
                <Badge className="bg-green-500/20 text-green-400 px-2 py-0.5 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" /> Saved
                </Badge>
              )}
              
              <div className={cn(
                "px-4 py-1.5 rounded-md font-mono text-xl font-bold",
                timeLeft < 300 ? "bg-red-500/20 text-red-400" : "bg-[#0a0f1a] text-white border border-gray-700"
              )}>
                <Clock className="inline h-4 w-4 mr-1.5" />{formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "px-2 py-0.5 text-xs",
                tabSwitches === 0 ? "bg-green-500/20 text-green-400" : 
                tabSwitches === 1 ? "bg-yellow-500/20 text-yellow-400" : 
                "bg-red-500/20 text-red-400"
              )}>
                Tab: {tabSwitches}/{TAB_SWITCH_LIMIT}
              </Badge>
              <Badge className={cn(
                "px-2 py-0.5 text-xs",
                fullscreenExits === 0 ? "bg-green-500/20 text-green-400" : 
                fullscreenExits === 1 ? "bg-yellow-500/20 text-yellow-400" : 
                "bg-red-500/20 text-red-400"
              )}>
                FS: {fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}
              </Badge>
              <Button size="sm" onClick={() => setShowSubmitDialog(true)} className="bg-[#c41e3a] hover:bg-[#a01830] text-white h-8 px-4">
                <Send className="mr-1.5 h-3.5 w-3.5" />Submit
              </Button>
            </div>
          </div>
          
          <div className="mt-2 pb-1">
            <div className="flex justify-between text-xs text-gray-400 mb-0.5">
              <span><strong className="text-white">{answeredCount}</strong> of {allQuestions.length} answered</span>
              <span>{flaggedQuestions.size} flagged</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 bg-gray-700 [&>div]:bg-[#c41e3a]" />
          </div>
        </div>
      </div>

      <div className="pt-24 pb-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="flex-1">
              <Card className="border border-gray-700 shadow-lg rounded-lg overflow-hidden bg-[#1a1f2e]">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-400">Question {currentIndex + 1}</span>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {currentQuestion?.type === 'theory' ? 'Theory' : 'Objective'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-300">
                        <Award className="h-4 w-4 text-[#c41e3a]" />
                        <span>{formatPoints(currentQuestion?.points || 1)}</span>
                      </div>
                      <button 
                        onClick={() => setFlaggedQuestions(p => { 
                          const n = new Set(p)
                          n.has(currentQuestion.id) ? n.delete(currentQuestion.id) : n.add(currentQuestion.id)
                          return n 
                        })} 
                        className={cn(
                          "p-1.5 rounded hover:bg-gray-700 transition-colors",
                          isFlagged ? "text-yellow-500" : "text-gray-500"
                        )}
                      >
                        <Flag className="h-4 w-4" fill={isFlagged ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0f1a] rounded-md p-5 mb-5 border border-gray-700">
                    <p className="text-gray-200 leading-relaxed text-base">{currentQuestion?.question_text || currentQuestion?.question}</p>
                  </div>
                  
                  {currentQuestion?.type === 'theory' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300 text-sm font-medium">Your Answer</Label>
                        <Badge variant="outline" className="text-xs text-gray-400">
                          You can format your answer, insert images, and create tables
                        </Badge>
                      </div>
                      
                      <RichTextEditor
                        content={answers[currentQuestion?.id] || ''}
                        onChange={(content: string) => setAnswers(p => ({ ...p, [currentQuestion.id]: content }))}
                        placeholder="Type your answer here... Use the toolbar for formatting, images, and tables."
                        minHeight="250px"
                        maxHeight="500px"
                        bucketName="exam-answers"
                        folderPath={`${examId}/${profile?.id}`}
                        // FIXED: Properly typed file parameter
                        onImageUpload={async (file: File) => {
                          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
                          const filePath = `${examId}/${profile?.id}/${fileName}`
                          const { data, error } = await supabase.storage
                            .from('exam-answers')
                            .upload(filePath, file)
                          if (error) throw error
                          const { data: { publicUrl } } = supabase.storage
                            .from('exam-answers')
                            .getPublicUrl(filePath)
                          return publicUrl
                        }}
                      />
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Auto-saved every 30 seconds
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          Your answer will be graded by your teacher
                        </span>
                      </div>
                    </div>
                  ) : (
                    currentQuestion?.options ? (
                      <RadioGroup value={answers[currentQuestion?.id] || ''} onValueChange={(v) => setAnswers(p => ({ ...p, [currentQuestion.id]: v }))} className="space-y-2">
                        {currentQuestion.options.map((opt, idx) => {
                          const letters = ['A', 'B', 'C', 'D', 'E', 'F']
                          const isSelected = answers[currentQuestion?.id] === opt
                          return (
                            <div 
                              key={idx} 
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-md border cursor-pointer transition-all",
                                isSelected 
                                  ? "border-[#c41e3a] bg-[#c41e3a]/10" 
                                  : "border-gray-700 hover:border-gray-500 bg-[#0a0f1a]"
                              )} 
                              onClick={() => setAnswers(p => ({ ...p, [currentQuestion.id]: opt }))}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded flex items-center justify-center text-sm font-medium",
                                isSelected ? "bg-[#c41e3a] text-white" : "bg-gray-700 text-gray-300"
                              )}>{letters[idx]}</div>
                              <RadioGroupItem value={opt} id={`opt-${idx}`} className="sr-only" />
                              <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer text-gray-200 text-base">{opt}</Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    ) : (
                      <Textarea 
                        value={answers[currentQuestion?.id] || ''} 
                        onChange={(e) => setAnswers(p => ({ ...p, [currentQuestion.id]: e.target.value }))} 
                        placeholder="Type your answer here..." 
                        rows={8} 
                        className="w-full bg-[#0a0f1a] border-gray-700 text-gray-200 rounded-md focus:border-[#c41e3a] focus:ring-[#c41e3a] resize-none text-base" 
                      />
                    )
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentIndex(p => p - 1)} 
                  disabled={currentIndex === 0}
                  className="border-gray-700 text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />Previous
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowQuestionPalette(!showQuestionPalette)}
                  className="border-gray-700 text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
                >
                  <Grid className="mr-1 h-4 w-4" />Palette
                </Button>
                
                {currentIndex === allQuestions.length - 1 ? (
                  <Button 
                    size="sm" 
                    onClick={() => setShowSubmitDialog(true)} 
                    className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
                  >
                    <Send className="mr-1 h-4 w-4" />Submit
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setCurrentIndex(p => p + 1)} 
                    className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
                  >
                    Next<ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>

              {showQuestionPalette && (
                <div className="mt-4 p-4 bg-[#1a1f2e] rounded-lg border border-gray-700 shadow-lg">
                  <h4 className="font-medium text-gray-300 text-sm mb-3">Question Palette</h4>
                  <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5 max-h-48 overflow-y-auto">
                    {allQuestions.map((q, idx) => {
                      const status = getQuestionStatus(q, idx)
                      return (
                        <button 
                          key={q.id} 
                          onClick={() => {
                            setCurrentIndex(idx)
                            setShowQuestionPalette(false)
                          }} 
                          className={cn(
                            "w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-all",
                            idx === currentIndex && "ring-2 ring-[#c41e3a] ring-offset-1 ring-offset-[#1a1f2e]",
                            status === 'answered' && "bg-green-500 text-white",
                            status === 'flagged' && "bg-yellow-500 text-white",
                            status === 'current' && "bg-[#c41e3a] text-white",
                            status === 'not-answered' && "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                          )}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:w-72 shrink-0 space-y-4">
              <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-4">
                  <h4 className="font-medium text-white text-sm mb-3">Exam Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Completion</span>
                        <span className="font-medium text-[#c41e3a]">{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-1.5 bg-gray-700 [&>div]:bg-[#c41e3a]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-500/10 rounded p-2 text-center border border-green-500/30">
                        <p className="text-green-400 text-xs">Answered</p>
                        <p className="text-lg font-bold text-green-300">{answeredCount}</p>
                      </div>
                      <div className="bg-yellow-500/10 rounded p-2 text-center border border-yellow-500/30">
                        <p className="text-yellow-400 text-xs">Flagged</p>
                        <p className="text-lg font-bold text-yellow-300">{flaggedQuestions.size}</p>
                      </div>
                      <div className="bg-gray-500/10 rounded p-2 text-center border border-gray-500/30">
                        <p className="text-gray-400 text-xs">Remaining</p>
                        <p className="text-lg font-bold text-gray-300">{unansweredCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e] overflow-hidden">
                <div className="bg-gradient-to-r from-[#c41e3a] to-[#e8354a] p-2">
                  <h4 className="text-white text-xs font-medium text-center flex items-center justify-center gap-1">
                    <Camera className="h-3 w-3" /> Candidate
                  </h4>
                </div>
                <CardContent className="p-4 flex justify-center">
                  <div className="relative">
                    {profile?.photo_url ? (
                      <div className="w-36 h-44 border-3 border-[#c41e3a] rounded-md overflow-hidden shadow-lg">
                        <Image 
                          src={profile.photo_url} 
                          alt={profile.full_name}
                          width={144}
                          height={176}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-44 border-3 border-gray-600 rounded-md overflow-hidden bg-[#0a0f1a] flex items-center justify-center">
                        <User className="h-14 w-14 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-0 right-0">
                      <Badge className="w-full justify-center bg-[#c41e3a] text-white py-0.5 text-xs">
                        {profile?.vin_id || profile?.class || 'Student'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 pb-3 text-center">
                  <p className="text-white font-medium text-sm truncate px-2">{profile?.full_name}</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4 text-[#c41e3a]" />
                    <span>{TERM_NAMES[exam?.term || CURRENT_TERM]} {exam?.session_year || CURRENT_SESSION}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e]">
                <CardContent className="p-4">
                  <h4 className="font-medium text-white text-xs mb-2 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-[#c41e3a]" /> Security Status
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tab Switches:</span>
                      <span className={cn(tabSwitches > 0 ? "text-yellow-400" : "text-green-400")}>{tabSwitches}/{TAB_SWITCH_LIMIT}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fullscreen Exits:</span>
                      <span className={cn(fullscreenExits > 0 ? "text-yellow-400" : "text-green-400")}>{fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <span className={cn(isOnline ? "text-green-400" : "text-red-400")}>{isOnline ? 'Connected' : 'Offline'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md bg-[#1a1f2e] border-gray-700 text-white">
          <DialogHeader><DialogTitle className="text-white">Submit Exam?</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-gray-300">You have answered <strong className="text-white">{answeredCount}</strong> of <strong>{allQuestions.length}</strong> questions.</p>
            {unansweredCount > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-3">
                <span className="text-yellow-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />{unansweredCount} unanswered questions!
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="border-gray-600 text-gray-300">Continue</Button>
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-[#c41e3a] hover:bg-[#a01830] text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResultDialog} onOpenChange={() => setShowResultDialog(false)}>
        <DialogContent className="max-w-md bg-[#1a1f2e] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {examResult?.is_passed ? (
                <><CheckCircle className="h-5 w-5 text-green-500" />Passed</>
              ) : (
                <><XCircle className="h-5 w-5 text-red-500" />Completed</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-center">
            <div className={cn("text-4xl font-bold", examResult?.is_passed ? "text-green-400" : "text-white")}>
              {examResult?.score}/{examResult?.total}
            </div>
            <p className="text-gray-400 mt-1">{examResult?.percentage}%</p>
            <div className="flex justify-center gap-4 mt-3 text-sm">
              <span className="text-green-400">✓{examResult?.correct}</span>
              <span className="text-red-400">✗{examResult?.incorrect}</span>
              <span className="text-gray-500">?{examResult?.unanswered}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)} className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}