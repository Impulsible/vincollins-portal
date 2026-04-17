/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exam/[id]/page.tsx - COMPLETE PROFESSIONAL CBT INTERFACE
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Clock, ChevronLeft, ChevronRight, Send, Flag,
  CheckCircle, XCircle, AlertTriangle, Maximize2, Home,
  Lock, Loader2, Monitor, Award, User, Shield,
  BookOpen, FileText, HelpCircle, ArrowLeft,
  RotateCcw, Wifi, WifiOff, Grid3x3,
  AlertCircle, Volume2, VolumeX, Brain,
  CheckCheck, List, Target, GraduationCap, Hash
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// =============================================
// CONSTANTS
// =============================================
const TAB_SWITCH_LIMIT = 3
const FULLSCREEN_EXIT_LIMIT = 3
const AUTO_SAVE_INTERVAL = 30000

// =============================================
// TYPES
// =============================================
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
  original_options?: { text: string; letter: string }[]
  correct_letter?: string
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
  created_by?: string
  randomize_questions?: boolean
  randomize_options?: boolean
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

// =============================================
// QUESTION RANDOMIZATION FUNCTION
// =============================================
const randomizeQuestions = (questions: Question[], randomizeOptions: boolean = true): Question[] => {
  const shuffled = [...questions]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  if (randomizeOptions) {
    shuffled.forEach(q => {
      if (q.type !== 'theory' && q.options) {
        const correctAnswer = q.correct_answer || q.answer || ''
        const optionsWithLetters = q.options.map((opt, idx) => ({
          text: opt,
          letter: String.fromCharCode(65 + idx)
        }))
        for (let i = optionsWithLetters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[optionsWithLetters[i], optionsWithLetters[j]] = [optionsWithLetters[j], optionsWithLetters[i]]
        }
        q.options = optionsWithLetters.map(opt => opt.text)
        q.original_options = optionsWithLetters
        q.correct_answer = correctAnswer
      }
    })
  }
  
  return shuffled
}

export default function StudentExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  // Core states
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [objectiveQuestions, setObjectiveQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  
  // Exam state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [examStarted, setExamStarted] = useState(false)
  const [examEnded, setExamEnded] = useState(false)
  const [activeTab, setActiveTab] = useState('objective')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [examResult, setExamResult] = useState<any>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [startingExam, setStartingExam] = useState(false)
  
  // Attempt tracking
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
  const [canRetake, setCanRetake] = useState(false)
  const [existingAttempt, setExistingAttempt] = useState<any>(null)
  
  // Security states
  const [tabSwitches, setTabSwitches] = useState(0)
  const [fullscreenExits, setFullscreenExits] = useState(0)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [securityViolated, setSecurityViolated] = useState(false)
  const [showSecurityWarning, setShowSecurityWarning] = useState(false)
  
  const loadedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef(false)
  const examEndedRef = useRef(false)
  const soundRef = useRef<HTMLAudioElement | null>(null)

  // Computed values
  const currentQuestion = allQuestions[currentIndex]
  const isFlagged = currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false
  const answeredCount = Object.keys(answers).length
  const progressPercentage = allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0
  const unansweredCount = allQuestions.length - answeredCount
  const objectiveAnswered = objectiveQuestions.filter(q => answers[q.id]).length
  const theoryAnswered = theoryQuestions.filter(q => answers[q.id]).length

  // Helper functions
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getInitials = () => {
    if (!profile?.full_name) return 'ST'
    const parts = profile.full_name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : profile.full_name.slice(0, 2).toUpperCase()
  }

  const getQuestionStatus = (q: Question, idx: number) => {
    if (answers[q.id]) return 'answered'
    if (flaggedQuestions.has(q.id)) return 'flagged'
    if (idx === currentIndex) return 'current'
    return 'not-answered'
  }

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < allQuestions.length) {
      setCurrentIndex(index)
      const question = allQuestions[index]
      setActiveTab(question.type === 'theory' ? 'theory' : 'objective')
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-600 bg-green-100'
    if (grade?.startsWith('B')) return 'text-blue-600 bg-blue-100'
    if (grade?.startsWith('C')) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  // =============================================
  // playSound FUNCTION
  // =============================================
  const playSound = useCallback(() => {
    if (soundEnabled && soundRef.current) {
      soundRef.current.play().catch(() => {})
    }
  }, [soundEnabled])

  // =============================================
  // CALCULATE OBJECTIVE SCORE
  // =============================================
  const calculateObjectiveScore = useCallback(() => {
    if (!objectiveQuestions.length) return { score: 0, total: 0, percentage: 0, correct: 0, incorrect: 0, unanswered: 0 }
    
    let score = 0, totalPoints = 0, correct = 0, incorrect = 0, unanswered = 0
    
    objectiveQuestions.forEach(q => {
      const points = Number(q.points || q.marks || 1)
      totalPoints += points
      const studentAnswer = answers[q.id]
      const correctAnswer = String(q.correct_answer || q.answer || '').trim()
      
      if (studentAnswer?.trim()) {
        if (studentAnswer.trim() === correctAnswer) {
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
  }, [objectiveQuestions, answers])

  // =============================================
  // AUTO-SAVE FUNCTION
  // =============================================
  const autoSave = useCallback(async () => {
    if (!attemptId || !examStarted || examEndedRef.current) return
    
    setAutoSaveStatus('saving')
    
    try {
      await supabase
        .from('exam_attempts')
        .update({
          answers: answers,
          last_auto_save: new Date().toISOString()
        })
        .eq('id', attemptId)
      
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveStatus('idle')
    }
  }, [attemptId, examStarted, answers])

  // =============================================
  // HANDLE SUBMIT - WITH ALL FIXES
  // =============================================
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
      const objResult = calculateObjectiveScore()
      const passingScore = exam?.passing_percentage || 50
      const isPassed = objResult.percentage >= passingScore
      
      const objectiveAnswers: Record<string, string> = {}
      const theoryAnswers: Record<string, string> = {}
      
      objectiveQuestions.forEach(q => { objectiveAnswers[q.id] = answers[q.id] || '' })
      theoryQuestions.forEach(q => { theoryAnswers[q.id] = answers[q.id] || '' })
      
      const hasTheory = exam?.has_theory && theoryQuestions.length > 0
      const status = hasTheory ? 'pending_theory' : 'completed'
      const theoryTotal = theoryQuestions.reduce((sum, q) => sum + Number(q.points || q.marks || 5), 0)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        throw new Error('User session expired. Please log in again.')
      }
      
      // Update or create attempt
      if (attemptId) {
        const { error: updateError } = await supabase
          .from('exam_attempts')
          .update({
            answers: objectiveAnswers,
            theory_answers: theoryAnswers,
            objective_score: objResult.score,
            objective_total: objResult.total,
            theory_total: theoryTotal,
            total_score: objResult.score,
            total_marks: objResult.total + theoryTotal,
            percentage: objResult.percentage,
            is_passed: isPassed,
            status: status,
            submitted_at: new Date().toISOString(),
            correct_count: objResult.correct,
            incorrect_count: objResult.incorrect,
            unanswered_count: objResult.unanswered,
            tab_switches: tabSwitches,
            fullscreen_exits: fullscreenExits,
            is_auto_submitted: isAuto,
            auto_submit_reason: isAuto ? reason : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', attemptId)

        if (updateError) throw new Error(`Failed to update attempt: ${updateError.message}`)
      } else {
        const { data: newAttempt, error: insertError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId,
            student_id: session.user.id,
            student_name: profile?.full_name || 'Student',
            student_email: session.user.email,
            student_class: profile?.class || 'Not Assigned',
            attempt_number: attemptsUsed + 1,
            answers: objectiveAnswers,
            theory_answers: theoryAnswers,
            objective_score: objResult.score,
            objective_total: objResult.total,
            theory_total: theoryTotal,
            total_score: objResult.score,
            total_marks: objResult.total + theoryTotal,
            percentage: objResult.percentage,
            is_passed: isPassed,
            status: status,
            started_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
            correct_count: objResult.correct,
            incorrect_count: objResult.incorrect,
            unanswered_count: objResult.unanswered,
            tab_switches: tabSwitches,
            fullscreen_exits: fullscreenExits,
            is_auto_submitted: isAuto,
            auto_submit_reason: isAuto ? reason : null
          })
          .select('id')
          .single()
        
        if (insertError) throw new Error(`Failed to create attempt: ${insertError.message}`)
        if (newAttempt) setAttemptId(newAttempt.id)
      }

      // Create/update exam score
      const { data: existingScore } = await supabase
        .from('exam_scores')
        .select('id')
        .eq('student_id', profile?.id)
        .eq('exam_id', examId)
        .maybeSingle()

      const scoreData = {
        student_id: profile?.id,
        exam_id: examId,
        attempt_id: attemptId,
        subject: exam?.subject || 'Unknown',
        term: 'First Term',
        academic_year: '2024/2025',
        class: profile?.class || 'Not Assigned',
        teacher_name: exam?.teacher_name || 'Unknown',
        exam_score: objResult.score,
        total_score: objResult.score,
        percentage: objResult.percentage,
        grade: objResult.percentage >= 80 ? 'A' : objResult.percentage >= 70 ? 'B' : objResult.percentage >= 60 ? 'C' : objResult.percentage >= 50 ? 'P' : 'F',
        remark: objResult.percentage >= 80 ? 'Excellent' : objResult.percentage >= 70 ? 'Very Good' : objResult.percentage >= 60 ? 'Good' : objResult.percentage >= 50 ? 'Pass' : 'Fail',
        status: hasTheory ? 'pending_theory' : 'completed',
        updated_at: new Date().toISOString()
      }

      if (existingScore) {
        await supabase.from('exam_scores').update(scoreData).eq('id', existingScore.id)
      } else {
        await supabase.from('exam_scores').insert({ ...scoreData, created_at: new Date().toISOString() })
      }

      // Update student stats
      if (profile?.id) {
        try {
          const { data: allScores } = await supabase
            .from('exam_scores')
            .select('percentage, status')
            .eq('student_id', profile.id)
            .in('status', ['completed', 'graded'])

          if (allScores && allScores.length > 0) {
            const completedExams = allScores.length
            const passedExams = allScores.filter(s => (s.percentage || 0) >= 50).length
            const averageScore = allScores.reduce((sum, s) => sum + (s.percentage || 0), 0) / completedExams

            const { data: existingStats } = await supabase
              .from('student_stats')
              .select('student_id')
              .eq('student_id', profile.id)
              .maybeSingle()

            const statsData = {
              student_id: profile.id,
              completed_exams: completedExams,
              passed_exams: passedExams,
              failed_exams: completedExams - passedExams,
              average_score: Math.round(averageScore * 100) / 100,
              total_points: allScores.reduce((sum, s) => sum + (s.percentage || 0), 0),
              updated_at: new Date().toISOString()
            }

            if (existingStats) {
              await supabase.from('student_stats').update(statsData).eq('student_id', profile.id)
            } else {
              await supabase.from('student_stats').insert({ ...statsData, created_at: new Date().toISOString() })
            }
          }
        } catch (statsError) {
          console.error('Stats update error (non-critical):', statsError)
        }
      }

      // Send notification to teacher
      if (exam?.created_by) {
        try {
          await supabase.from('notifications').insert({
            user_id: exam.created_by,
            title: '📝 Exam Submission',
            message: `${profile?.full_name || 'A student'} has submitted ${exam.title}. ${hasTheory ? 'Theory questions pending grading.' : 'Ready for review.'}`,
            type: 'exam_submission',
            metadata: { exam_id: examId, student_id: profile?.id },
            created_at: new Date().toISOString()
          })
        } catch (notifError) {}
      }

      // Set completed state
      setHasCompletedAttempt(true)
      setExamResult({ 
        ...objResult, 
        theory_score: 0,
        theory_total: theoryTotal,
        is_passed: isPassed, 
        passing_percentage: passingScore, 
        status: status,
        attempts_used: attemptsUsed + 1, 
        max_attempts: exam?.max_attempts || 1 
      })
      setExamStarted(false)
      setShowResultDialog(true)
      
      playSound()
      toast.success(hasTheory ? 'Exam submitted! Objective graded. Theory pending.' : 'Exam submitted successfully!')
      
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      toast.error(error.message || 'Failed to submit exam')
      setIsSubmitting(false)
      isSubmittingRef.current = false
      examEndedRef.current = false
      
      if (!isAuto) {
        setExamEnded(false)
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setTimeLeft(p => { 
            if (p <= 1) { 
              handleSubmit(true, 'Time expired')
              return 0 
            }
            if (p === 300) {
              setShowTimeWarning(true)
              playSound()
              toast.warning('5 minutes remaining!')
            }
            return p - 1 
          })
        }, 1000)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [attemptId, exam, calculateObjectiveScore, answers, tabSwitches, fullscreenExits, attemptsUsed, objectiveQuestions, theoryQuestions, profile, examId, playSound])

  // =============================================
  // LOAD EXAM DATA WITH RANDOMIZATION
  // =============================================
  const loadExam = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Please log in to continue')
        router.replace('/portal')
        return
      }
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (userData) setProfile(userData)
      
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()
        
      if (examError || !examData) { 
        setLoadError('Exam not found')
        setLoading(false)
        return
      }
      
      setExam(examData)
      
      let objQ: Question[] = []
      let thQ: Question[] = []
      
      if (examData.questions) {
        if (typeof examData.questions === 'string') {
          try { objQ = JSON.parse(examData.questions) } catch (e) {}
        } else if (Array.isArray(examData.questions)) {
          objQ = examData.questions
        }
      }
      
      if (examData.has_theory && examData.theory_questions) {
        if (typeof examData.theory_questions === 'string') {
          try { thQ = JSON.parse(examData.theory_questions) } catch (e) {}
        } else if (Array.isArray(examData.theory_questions)) {
          thQ = examData.theory_questions
        }
      }
      
      const processQuestions = (qList: Question[], qType: 'objective' | 'theory') => {
        return qList.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `${qType}-${idx}`,
          question_text: q.question || q.question_text || 'No question text',
          type: qType,
          options: q.options || [],
          correct_answer: q.correct_answer || q.answer || '',
          points: Number(q.points || q.marks || (qType === 'objective' ? 1 : 5)),
          order_number: idx + 1
        }))
      }
      
      let processedObj = processQuestions(objQ, 'objective')
      let processedTheory = processQuestions(thQ, 'theory')
      
      const shouldRandomizeQuestions = examData.randomize_questions ?? true
      const shouldRandomizeOptions = examData.randomize_options ?? true
      
      if (shouldRandomizeQuestions) {
        processedObj = randomizeQuestions(processedObj, shouldRandomizeOptions)
        if (processedTheory.length > 0) {
          processedTheory = randomizeQuestions(processedTheory, false)
        }
      }
      
      setObjectiveQuestions(processedObj)
      setTheoryQuestions(processedTheory)
      setAllQuestions([...processedObj, ...processedTheory])
      
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
          
          const maxAttempts = examData.max_attempts || 1
          
          if (latest.status === 'completed' || latest.status === 'pending_theory' || latest.status === 'graded') {
            setHasCompletedAttempt(true)
            setExistingAttempt(latest)
            setCanRetake(latest.can_retake && attempts.length < maxAttempts)
            
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
              max_attempts: maxAttempts
            })
          }
        }
      }
    } catch (error) {
      setLoadError('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  // =============================================
  // START EXAM FUNCTION - WITH FIXES
  // =============================================
  const startExam = async () => {
    setStartingExam(true)
    
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: att, error } = await supabase
          .from('exam_attempts')
          .insert({ 
            exam_id: examId, 
            student_id: session.user.id,
            student_name: profile?.full_name || 'Student',
            student_email: session.user.email,
            student_class: profile?.class || 'Not Assigned',
            status: 'in_progress', 
            started_at: new Date().toISOString(),
            attempt_number: attemptsUsed + 1,
            answers: {},
            theory_answers: {},
            objective_score: 0,
            objective_total: 0,
            total_score: 0,
            percentage: 0
          })
          .select('id')
          .single()
          
        if (error) throw error
        if (att) setAttemptId(att.id)
      }
      
      setExamStarted(true)
      setShowInstructions(false)
      setTimeLeft((exam?.duration || 30) * 60)
      setFullscreenExits(0)
      setTabSwitches(0)
      examEndedRef.current = false
      setExamEnded(false)
      
      playSound()
      toast.success('Exam started! Good luck!', {
        description: `You have ${exam?.duration || 30} minutes to complete this exam.`
      })
    } catch (error: any) {
      console.error('Start exam error:', error)
      toast.error(error.message || 'Failed to start exam')
    } finally {
      setStartingExam(false)
    }
  }

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      setShowFullscreenPrompt(false)
    } catch (e) {}
  }

  // =============================================
  // ALL useEffect HOOKS
  // =============================================
  
  // Initialize sound
  useEffect(() => {
    soundRef.current = new Audio('/sounds/notification.mp3')
    return () => {
      if (soundRef.current) {
        soundRef.current.pause()
        soundRef.current = null
      }
    }
  }, [])

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline. Answers will be saved locally.')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load exam on mount
  useEffect(() => { loadExam() }, [loadExam])
  
  // Cleanup timers
  useEffect(() => { 
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    } 
  }, [])

  // Timer effect
  useEffect(() => {
    if (!examStarted || timeLeft <= 0 || examEndedRef.current) return
    
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { 
        if (p <= 1) { 
          handleSubmit(true, 'Time expired')
          return 0 
        }
        if (p === 300) {
          setShowTimeWarning(true)
          playSound()
          toast.warning('5 minutes remaining!', {
            description: 'Please review your answers and prepare to submit.'
          })
        }
        return p - 1 
      })
    }, 1000)
    
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examStarted, timeLeft, handleSubmit, playSound])

  // Auto-save effect
  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    
    autoSaveTimerRef.current = setInterval(() => {
      autoSave()
    }, AUTO_SAVE_INTERVAL)
    
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current) }
  }, [examStarted, autoSave])

  // Tab switch detection
  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    const h = () => {
      if (document.hidden && !examEndedRef.current && !securityViolated) {
        setTabSwitches(p => {
          const n = p + 1
          playSound()
          if (n === 1) toast.warning(`Tab switch detected! (${n}/${TAB_SWITCH_LIMIT})`)
          else if (n === 2) toast.error(`Final warning! (${n}/${TAB_SWITCH_LIMIT})`)
          else if (n >= TAB_SWITCH_LIMIT) { 
            setSecurityViolated(true)
            toast.error('Security violation! Auto-submitting...')
            setTimeout(() => handleSubmit(true, 'Tab switch limit exceeded'), 100)
          }
          return n
        })
        setShowSecurityWarning(true)
        setTimeout(() => setShowSecurityWarning(false), 3000)
      }
    }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [examStarted, securityViolated, handleSubmit, playSound])

  // Fullscreen detection
  useEffect(() => {
    if (!examStarted || examEndedRef.current) return
    const h = () => {
      const fs = !!document.fullscreenElement
      if (!fs && !examEndedRef.current && !securityViolated) {
        setFullscreenExits(p => {
          const n = p + 1
          playSound()
          if (n === 1) { 
            toast.warning(`Fullscreen exited! (${n}/${FULLSCREEN_EXIT_LIMIT})`)
            setShowFullscreenPrompt(true) 
          }
          else if (n === 2) { 
            toast.error(`Final warning! (${n}/${FULLSCREEN_EXIT_LIMIT})`)
            setShowFullscreenPrompt(true) 
          }
          else if (n >= FULLSCREEN_EXIT_LIMIT) { 
            setSecurityViolated(true)
            toast.error('Security violation! Auto-submitting...')
            setTimeout(() => handleSubmit(true, 'Fullscreen exit limit exceeded'), 100)
          }
          return n
        })
      }
    }
    document.addEventListener('fullscreenchange', h)
    document.addEventListener('webkitfullscreenchange', h)
    return () => { 
      document.removeEventListener('fullscreenchange', h)
      document.removeEventListener('webkitfullscreenchange', h) 
    }
  }, [examStarted, securityViolated, handleSubmit, playSound])

  // Prevent copy/paste/screenshot
  useEffect(() => {
    if (!examStarted) return
    const preventDefault = (e: Event) => e.preventDefault()
    const keydown = (e: KeyboardEvent) => { 
      if ((e.ctrlKey && ['c','v','x','p','a','s'].includes(e.key.toLowerCase())) || 
          e.key === 'F12' || (e.altKey && e.key === 'Tab')) {
        e.preventDefault()
        toast.warning('This action is disabled during the exam')
      }
    }
    
    document.addEventListener('copy', preventDefault)
    document.addEventListener('paste', preventDefault)
    document.addEventListener('cut', preventDefault)
    document.addEventListener('contextmenu', preventDefault)
    document.addEventListener('keydown', keydown)
    
    return () => {
      document.removeEventListener('copy', preventDefault)
      document.removeEventListener('paste', preventDefault)
      document.removeEventListener('cut', preventDefault)
      document.removeEventListener('contextmenu', preventDefault)
      document.removeEventListener('keydown', keydown)
    }
  }, [examStarted])

  // =============================================
  // LOADING STATE
  // =============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-30" />
            <div className="relative h-24 w-24 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mx-auto" />
            <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-blue-400" />
          </div>
          <p className="mt-8 text-xl font-medium text-white">Loading your exam...</p>
          <p className="text-slate-400 mt-2">Please wait while we prepare everything</p>
        </div>
      </div>
    )
  }

  // =============================================
  // ERROR STATE
  // =============================================
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-0 rounded-2xl overflow-hidden bg-slate-800 border-slate-700">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-center">
            <XCircle className="h-16 w-16 text-white/90 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-white">Error Loading Exam</h2>
          </div>
          <CardContent className="p-6 text-center">
            <p className="text-slate-300 mb-6">{loadError}</p>
            <Button onClick={() => router.push('/student/exams')} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =============================================
  // COMPLETED EXAM VIEW (CANNOT RETAKE)
  // =============================================
  if (hasCompletedAttempt && !examStarted && !showResultDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-slate-800 border-slate-700">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
                    <p className="text-white/80 mt-1">{exam?.subject} • {exam?.class}</p>
                  </div>
                  <Badge className={cn(
                    "px-4 py-2 text-sm font-medium text-white",
                    examResult?.status === 'graded' ? "bg-green-500" :
                    examResult?.status === 'pending_theory' ? "bg-yellow-500" :
                    "bg-blue-500"
                  )}>
                    {examResult?.status === 'graded' ? 'Graded' : 
                     examResult?.status === 'pending_theory' ? 'Theory Pending' : 'Completed'}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="flex items-center gap-5 p-5 bg-slate-900/50 rounded-2xl mb-8 border border-slate-700">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-40" />
                    <Avatar className="h-20 w-20 ring-2 ring-blue-500/50 shadow-xl">
                      <AvatarImage src={profile?.photo_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-2xl font-bold">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-bold text-white text-xl">{profile?.full_name}</p>
                    <p className="text-slate-400">{profile?.class} • {profile?.vin_id}</p>
                    <p className="text-slate-500 text-sm">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 text-center border border-blue-500/30">
                    <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Overall Score</p>
                    <p className="text-5xl font-bold text-white">{examResult?.score}/{examResult?.total}</p>
                    <p className="text-xl text-slate-300 mt-2">{examResult?.percentage}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 text-center border border-green-500/30">
                    <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Objective</p>
                    <p className="text-4xl font-bold text-green-400">{examResult?.objective_score || examResult?.score}/{examResult?.objective_total || examResult?.total}</p>
                    <div className="flex justify-center gap-5 mt-3">
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-1 border border-green-500/30">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <p className="text-lg font-bold text-green-400">{examResult?.correct || 0}</p>
                        <p className="text-xs text-slate-400">Correct</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-1 border border-red-500/30">
                          <XCircle className="h-4 w-4 text-red-400" />
                        </div>
                        <p className="text-lg font-bold text-red-400">{examResult?.incorrect || 0}</p>
                        <p className="text-xs text-slate-400">Wrong</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-1 border border-slate-600">
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-lg font-bold text-slate-300">{examResult?.unanswered || 0}</p>
                        <p className="text-xs text-slate-400">Skipped</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 text-center border border-purple-500/30">
                    <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Theory</p>
                    {examResult?.status === 'graded' ? (
                      <>
                        <p className="text-4xl font-bold text-purple-400">{examResult?.theory_score || 0}/{examResult?.theory_total || 0}</p>
                        <p className="text-sm text-slate-400 mt-2">Graded</p>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl font-bold text-slate-500">—/{examResult?.theory_total || 0}</p>
                        <p className="text-sm text-yellow-400 mt-2">Pending Grading</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className={cn(
                  "rounded-2xl p-6 mb-8 text-center border-2",
                  examResult?.is_passed ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50"
                )}>
                  <div className="flex items-center justify-center gap-3">
                    {examResult?.is_passed ? (
                      <><CheckCircle className="h-8 w-8 text-green-400" /><span className="text-2xl font-bold text-green-400">Congratulations! You Passed!</span></>
                    ) : (
                      <><XCircle className="h-8 w-8 text-red-400" /><span className="text-2xl font-bold text-red-400">Not Passed - Keep Practicing!</span></>
                    )}
                  </div>
                  <p className="text-slate-400 mt-2">Passing score: {examResult?.passing_percentage}%</p>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => router.push('/student/exams')} className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700">
                    <ArrowLeft className="mr-2 h-5 w-5" /> Back to Exams
                  </Button>
                  <Button onClick={() => router.push('/student')} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                    <Home className="mr-2 h-5 w-5" /> Dashboard
                  </Button>
                  {canRetake && (
                    <Button onClick={() => {
                      setHasCompletedAttempt(false)
                      setShowInstructions(true)
                      setExistingAttempt(null)
                    }} className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      <RotateCcw className="mr-2 h-5 w-5" /> Retake Exam
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // =============================================
  // INSTRUCTIONS PAGE
  // =============================================
  if (!examStarted && showInstructions && !hasCompletedAttempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-slate-800 border-slate-700">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
                <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
                <div className="flex items-center gap-6 mt-2 text-white/90 text-sm">
                  <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{exam?.subject}</span>
                  <span className="flex items-center gap-1"><User className="h-4 w-4" />{exam?.class}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{exam?.duration} min</span>
                  <span className="flex items-center gap-1"><HelpCircle className="h-4 w-4" />{allQuestions.length} questions</span>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl mb-6 border border-slate-700">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-40" />
                    <Avatar className="h-16 w-16 ring-2 ring-blue-500/50 shadow-xl">
                      <AvatarImage src={profile?.photo_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xl font-bold">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{profile?.full_name}</p>
                    <p className="text-slate-400">{profile?.class} • {profile?.vin_id}</p>
                  </div>
                </div>
                
                <Tabs defaultValue="instructions" className="mb-6">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-700 p-1 rounded-xl">
                    <TabsTrigger value="instructions" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg">Instructions</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white rounded-lg">Security Rules</TabsTrigger>
                    <TabsTrigger value="overview" className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg">Exam Overview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="instructions" className="mt-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                      <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" /> Exam Instructions
                      </h3>
                      <p className="text-slate-300 leading-relaxed">{exam?.instructions || 'Read all questions carefully. You can flag questions for review. Your progress is auto-saved.'}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="security" className="mt-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                      <h3 className="font-bold text-yellow-400 mb-4 flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5" /> Exam Security Rules
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                          <Monitor className="h-5 w-5 text-yellow-400 mt-0.5" />
                          <div><p className="font-medium text-yellow-300">Tab Switching</p><p className="text-sm text-slate-400">Limit: {TAB_SWITCH_LIMIT} switches</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Maximize2 className="h-5 w-5 text-yellow-400 mt-0.5" />
                          <div><p className="font-medium text-yellow-300">Fullscreen Required</p><p className="text-sm text-slate-400">Limit: {FULLSCREEN_EXIT_LIMIT} exits</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-yellow-400 mt-0.5" />
                          <div><p className="font-medium text-yellow-300">Time Limit</p><p className="text-sm text-slate-400">Auto-submit on timeout</p></div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="overview" className="mt-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                      <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5" /> Exam Overview
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                          <p className="text-sm text-slate-400">Objective Questions</p>
                          <p className="text-3xl font-bold text-blue-400">{objectiveQuestions.length}</p>
                          <p className="text-xs text-slate-400 mt-1">{objectiveQuestions.reduce((s, q) => s + (q.points || q.marks || 1), 0)} marks</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                          <p className="text-sm text-slate-400">Theory Questions</p>
                          <p className="text-3xl font-bold text-purple-400">{theoryQuestions.length}</p>
                          <p className="text-xs text-slate-400 mt-1">{theoryQuestions.reduce((s, q) => s + (q.points || q.marks || 5), 0)} marks</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => router.push('/student/exams')} className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
                  <Button onClick={startExam} disabled={startingExam} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold">
                    {startingExam ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}Start Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // =============================================
  // FULLSCREEN PROMPT
  // =============================================
  if (showFullscreenPrompt && examStarted && !examEnded) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl rounded-2xl overflow-hidden bg-slate-800 border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center">
            <Maximize2 className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Return to Fullscreen</h2>
          </div>
          <CardContent className="p-6 text-center">
            <div className="mb-6">
              <span className="text-6xl font-bold text-white">{fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}</span>
              <p className="text-slate-400 mt-2">Fullscreen Exits</p>
            </div>
            <p className="text-slate-300 mb-6 font-medium">
              {fullscreenExits >= FULLSCREEN_EXIT_LIMIT - 1 ? '⚠️ ONE MORE EXIT WILL AUTO-SUBMIT!' : 'This exam must be taken in fullscreen mode.'}
            </p>
            <Button onClick={enterFullscreen} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 text-lg">
              <Maximize2 className="mr-2 h-5 w-5" />Return to Fullscreen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =============================================
  // MAIN EXAM INTERFACE - PROFESSIONAL CBT STYLING
  // =============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Professional CBT Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Student Profile Section - LARGER AVATAR */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-40" />
                <Avatar className="h-12 w-12 lg:h-14 lg:w-14 ring-2 ring-blue-500/50 shadow-xl">
                  <AvatarImage src={profile?.photo_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  <div className="relative h-3 w-3 bg-green-500 rounded-full ring-2 ring-slate-800 animate-pulse" />
                </div>
              </div>
              <div className="hidden md:block">
                <h2 className="font-semibold text-white text-base lg:text-lg line-clamp-1">
                  {profile?.full_name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="bg-blue-500/20 text-blue-200 text-[10px] border-blue-500/30">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {profile?.class}
                  </Badge>
                  <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                    <Hash className="h-3 w-3 mr-1" />
                    {profile?.vin_id}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Exam Title & Subject */}
            <div className="hidden lg:block text-center">
              <h1 className="text-white font-bold text-lg">{exam?.title}</h1>
              <div className="flex items-center justify-center gap-3 mt-1">
                <Badge className="bg-blue-500/20 text-blue-200">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {exam?.subject}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-200">
                  <FileText className="h-3 w-3 mr-1" />
                  {allQuestions.length} Questions
                </Badge>
              </div>
            </div>
            
            {/* Timer & Status */}
            <div className="flex items-center gap-3">
              {/* Auto-save Status */}
              {autoSaveStatus !== 'idle' && (
                <Badge variant="outline" className={cn(
                  "gap-1 border-slate-600",
                  autoSaveStatus === 'saving' && "text-blue-400",
                  autoSaveStatus === 'saved' && "text-green-400"
                )}>
                  {autoSaveStatus === 'saving' ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Saving</>
                  ) : (
                    <><CheckCheck className="h-3 w-3" /> Saved</>
                  )}
                </Badge>
              )}
              
              {/* Online Status */}
              <Badge variant="outline" className={cn(
                "gap-1 border-slate-600",
                isOnline ? "text-green-400" : "text-red-400"
              )}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </Badge>
              
              {/* Timer */}
              <div className={cn(
                "px-4 lg:px-6 py-2 rounded-full font-mono text-xl lg:text-2xl font-bold shadow-lg transition-all duration-300",
                timeLeft < 300 
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white animate-pulse shadow-red-500/50" 
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/30"
              )}>
                <Clock className="inline h-5 w-5 mr-2" />
                {formatTime(timeLeft)}
              </div>
              
              {/* Tab Switch Counter */}
              <Badge className={cn(
                "px-3 py-1.5 text-xs font-medium hidden sm:flex items-center gap-1",
                tabSwitches === 0 ? "bg-green-500/20 text-green-200 border border-green-500/30" : 
                tabSwitches === 1 ? "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30" : 
                "bg-red-500/20 text-red-200 border border-red-500/30"
              )}>
                <Monitor className="h-3 w-3" />
                Tab: {tabSwitches}/{TAB_SWITCH_LIMIT}
              </Badge>
              
              {/* Submit Button */}
              <Button 
                size="sm" 
                onClick={() => setShowSubmitDialog(true)} 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-9 px-5 shadow-lg shadow-green-500/25 border-0"
              >
                <Send className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Submit Exam</span>
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>
                <strong className="text-white">{answeredCount}</strong> of {allQuestions.length} answered
              </span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  {objectiveAnswered} objective
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-purple-400" />
                  {theoryAnswered} theory
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="h-3 w-3 text-yellow-400" />
                  {flaggedQuestions.size} flagged
                </span>
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2.5 bg-slate-700 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500" 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-36 lg:pt-40 pb-8 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Question Area - Professional CBT Card */}
            <div className="flex-1">
              <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-slate-800/90 backdrop-blur-sm border-slate-700">
                <CardContent className="p-5 lg:p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-5 pb-4 border-b border-slate-700">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 px-3 py-1.5">
                        Question {currentIndex + 1} of {allQuestions.length}
                      </Badge>
                      <Badge className={cn(
                        "px-3 py-1.5 text-xs",
                        currentQuestion?.type === 'theory' 
                          ? "bg-purple-500/20 text-purple-200 border-purple-500/30" 
                          : "bg-cyan-500/20 text-cyan-200 border-cyan-500/30"
                      )}>
                        {currentQuestion?.type === 'theory' ? 'Theory Question' : 'Objective Question'}
                      </Badge>
                      <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 px-3 py-1.5">
                        <Award className="h-3 w-3 mr-1" />
                        {currentQuestion?.points || currentQuestion?.marks || 1} {currentQuestion?.points === 1 ? 'point' : 'points'}
                      </Badge>
                    </div>
                    <button 
                      onClick={() => setFlaggedQuestions(p => { 
                        const n = new Set(p)
                        n.has(currentQuestion.id) ? n.delete(currentQuestion.id) : n.add(currentQuestion.id)
                        toast.info(isFlagged ? 'Flag removed' : 'Question flagged for review')
                        return n 
                      })} 
                      className={cn(
                        "p-2.5 rounded-xl transition-all duration-200",
                        isFlagged 
                          ? "text-yellow-400 bg-yellow-500/20 border border-yellow-500/30" 
                          : "text-slate-400 hover:text-yellow-400 hover:bg-slate-700"
                      )}
                    >
                      <Flag className="h-5 w-5" fill={isFlagged ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  {/* Question Text */}
                  <div className="bg-slate-900/50 rounded-xl p-5 lg:p-6 mb-6 border border-slate-700">
                    <p className="text-white text-base lg:text-lg leading-relaxed">
                      {currentQuestion?.question_text || currentQuestion?.question}
                    </p>
                  </div>
                  
                  {/* Answer Area */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={currentQuestion?.id} 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: -20 }} 
                      transition={{ duration: 0.2 }}
                    >
                      {currentQuestion?.type !== 'theory' && currentQuestion?.options ? (
                        <RadioGroup 
                          value={answers[currentQuestion?.id] || ''} 
                          onValueChange={(v) => setAnswers(p => ({ ...p, [currentQuestion.id]: v }))} 
                          className="space-y-3"
                        >
                          {currentQuestion.options.map((opt, idx) => {
                            const letters = ['A', 'B', 'C', 'D', 'E', 'F']
                            const isSelected = answers[currentQuestion?.id] === opt
                            return (
                              <div 
                                key={idx} 
                                className={cn(
                                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                  isSelected 
                                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20" 
                                    : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
                                )} 
                                onClick={() => setAnswers(p => ({ ...p, [currentQuestion.id]: opt }))}
                              >
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-200",
                                  isSelected 
                                    ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg" 
                                    : "bg-slate-700 text-slate-300"
                                )}>
                                  {letters[idx]}
                                </div>
                                <RadioGroupItem value={opt} id={`opt-${idx}`} className="sr-only" />
                                <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer text-slate-200 text-base">
                                  {opt}
                                </Label>
                                {isSelected && <CheckCircle className="h-5 w-5 text-blue-400" />}
                              </div>
                            )
                          })}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-3">
                          {currentQuestion?.type === 'theory' && (
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                              <p className="text-purple-200 text-sm flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                This is a theory question. Your answer will be graded by your teacher.
                              </p>
                            </div>
                          )}
                          <Textarea 
                            value={answers[currentQuestion?.id] || ''} 
                            onChange={(e) => setAnswers(p => ({ ...p, [currentQuestion.id]: e.target.value }))} 
                            placeholder="Type your answer here..." 
                            rows={8} 
                            className="w-full bg-slate-900 border-slate-700 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none text-slate-200 text-base placeholder:text-slate-500" 
                          />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-6">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigateToQuestion(currentIndex - 1)} 
                  disabled={currentIndex === 0} 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-12 px-6 rounded-xl"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                </Button>
                
                <div className="text-sm text-slate-400">
                  {unansweredCount > 0 && (
                    <span className="text-amber-400">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      {unansweredCount} unanswered
                    </span>
                  )}
                </div>
                
                {currentIndex === allQuestions.length - 1 ? (
                  <Button 
                    size="lg" 
                    onClick={() => setShowSubmitDialog(true)} 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-green-500/25"
                  >
                    Submit Exam <Send className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={() => navigateToQuestion(currentIndex + 1)} 
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-blue-500/25"
                  >
                    Next <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right Sidebar - Question Palette */}
            <div className="lg:w-80 shrink-0">
              <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-slate-800/90 backdrop-blur-sm border-slate-700 sticky top-32">
                <CardHeader className="pb-3 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-white">Question Palette</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      >
                        {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                      >
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 pt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-700 p-1 rounded-xl">
                      <TabsTrigger value="objective" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg">
                        Objective ({objectiveQuestions.length})
                      </TabsTrigger>
                      <TabsTrigger value="theory" className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg" disabled={theoryQuestions.length === 0}>
                        Theory ({theoryQuestions.length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <ScrollArea className="h-[400px] pr-2">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-5 gap-2">
                        {(activeTab === 'objective' ? objectiveQuestions : theoryQuestions).map((q) => {
                          const originalIndex = allQuestions.findIndex(aq => aq.id === q.id)
                          const status = getQuestionStatus(q, originalIndex)
                          return (
                            <button 
                              key={q.id} 
                              onClick={() => navigateToQuestion(originalIndex)} 
                              className={cn(
                                "aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all relative",
                                originalIndex === currentIndex && "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800",
                                status === 'answered' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700",
                                status === 'flagged' && "bg-gradient-to-br from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700",
                                status === 'current' && "bg-gradient-to-br from-blue-500 to-cyan-600 text-white",
                                status === 'not-answered' && "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
                              )}
                            >
                              {originalIndex + 1}
                              {flaggedQuestions.has(q.id) && !status.includes('flagged') && (
                                <Flag className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(activeTab === 'objective' ? objectiveQuestions : theoryQuestions).map((q) => {
                          const originalIndex = allQuestions.findIndex(aq => aq.id === q.id)
                          const status = getQuestionStatus(q, originalIndex)
                          const isAnswered = !!answers[q.id]
                          const isFlagged = flaggedQuestions.has(q.id)
                          
                          return (
                            <button
                              key={q.id}
                              onClick={() => navigateToQuestion(originalIndex)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                                originalIndex === currentIndex && "ring-2 ring-blue-500 bg-blue-500/10",
                                isAnswered && "bg-green-500/10",
                                isFlagged && "bg-yellow-500/10",
                                !isAnswered && !isFlagged && originalIndex !== currentIndex && "hover:bg-slate-700"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                isAnswered ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" :
                                isFlagged ? "bg-gradient-to-br from-yellow-500 to-amber-600 text-white" :
                                "bg-slate-700 text-slate-300"
                              )}>
                                {originalIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">
                                  {q.question_text?.substring(0, 30)}...
                                </p>
                                <p className="text-xs text-slate-400">
                                  {q.points || q.marks || 1} {q.points === 1 ? 'point' : 'points'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {isAnswered && <CheckCircle className="h-4 w-4 text-green-400" />}
                                {isFlagged && <Flag className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                                {originalIndex === currentIndex && <ChevronRight className="h-4 w-4 text-blue-400" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <Separator className="my-4 bg-slate-700" />
                  
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600" />
                      <span className="text-slate-300">Answered ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-500 to-amber-600" />
                      <span className="text-slate-300">Flagged ({flaggedQuestions.size})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-cyan-600" />
                      <span className="text-slate-300">Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600" />
                      <span className="text-slate-300">Unanswered ({unansweredCount})</span>
                    </div>
                  </div>
                  
                  {/* Progress Summary */}
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Overall Progress</span>
                      <span className="font-medium text-white">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className="h-2 bg-slate-700 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md rounded-2xl bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-white">Submit Exam?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-slate-300">
              You have answered <strong className="text-white">{answeredCount}</strong> of <strong>{allQuestions.length}</strong> questions.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
                <p className="text-green-400 text-sm">Objective</p>
                <p className="text-2xl font-bold text-green-400">{objectiveAnswered}/{objectiveQuestions.length}</p>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/30">
                <p className="text-purple-400 text-sm">Theory</p>
                <p className="text-2xl font-bold text-purple-400">{theoryAnswered}/{theoryQuestions.length}</p>
              </div>
            </div>
            
            {unansweredCount > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
                <span className="text-yellow-400 text-sm flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered!
                </span>
              </div>
            )}
            
            {flaggedQuestions.size > 0 && (
              <p className="text-sm text-slate-400 mt-3">
                <Flag className="inline h-3 w-3 mr-1 text-yellow-400" />
                {flaggedQuestions.size} question{flaggedQuestions.size > 1 ? 's' : ''} flagged for review
              </p>
            )}
          </div>
          <DialogFooter className="gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="px-8 border-slate-600 text-slate-300">
              Continue
            </Button>
            <Button 
              onClick={() => handleSubmit(false)} 
              disabled={isSubmitting} 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={() => setShowResultDialog(false)}>
        <DialogContent className="max-w-md rounded-2xl bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl text-white">
              {examResult?.is_passed ? (
                <><CheckCircle className="h-6 w-6 text-green-400" />Passed!</>
              ) : (
                <><XCircle className="h-6 w-6 text-red-400" />Completed</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className={cn(
              "text-5xl font-bold mb-2",
              examResult?.is_passed ? "text-green-400" : "text-white"
            )}>
              {examResult?.score}/{examResult?.total}
            </div>
            <p className="text-slate-400 text-lg">{examResult?.percentage}%</p>
            
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                <p className="text-xl font-bold text-green-400">{examResult?.correct}</p>
                <p className="text-xs text-slate-400">Correct</p>
              </div>
              <div className="text-center">
                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                <p className="text-xl font-bold text-red-400">{examResult?.incorrect}</p>
                <p className="text-xs text-slate-400">Wrong</p>
              </div>
              <div className="text-center">
                <HelpCircle className="h-5 w-5 text-slate-400 mx-auto" />
                <p className="text-xl font-bold text-slate-300">{examResult?.unanswered}</p>
                <p className="text-xs text-slate-400">Skipped</p>
              </div>
            </div>
            
            {examResult?.status === 'pending_theory' && (
              <p className="text-yellow-400 text-sm mt-4 bg-yellow-500/10 py-2 px-4 rounded-lg border border-yellow-500/30">
                Theory answers pending grading by your teacher
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => { 
                setShowResultDialog(false)
                router.push('/student') 
              }} 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Warning Dialog */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-amber-400" />
              5 Minutes Remaining!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              You have only 5 minutes left to complete this exam. Please review your answers and prepare to submit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTimeWarning(false)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
              I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}