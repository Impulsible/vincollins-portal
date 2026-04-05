/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { AlertTriangle, Clock, Save, ChevronLeft, ChevronRight, Flag, CheckCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Question {
  id: string
  question_text: string
  type: 'objective' | 'theory'
  options?: string[]
  points: number
  correct_answer?: string
}

interface ExamData {
  id: string
  title: string
  duration: number
  shuffle_questions: boolean
  shuffle_options: boolean
}

// Helper function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const examId = params?.id as string
  
  const [exam, setExam] = useState<ExamData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set())
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSubmitTriggered = useRef(false)

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) return
      
      try {
        setLoading(true)
        
        // Fetch exam details
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .single()
        
        if (examError) throw examError
        if (!examData) {
          setError('Exam not found')
          return
        }
        
        // Fetch questions
        const questionsQuery = supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
        
        const { data: questionsData, error: questionsError } = await questionsQuery
        
        if (questionsError) throw questionsError
        
        let processedQuestions = [...(questionsData || [])]
        
        // Shuffle questions if enabled
        if (examData.shuffle_questions) {
          processedQuestions = shuffleArray(processedQuestions)
        }
        
        // Shuffle options for objective questions if enabled
        if (examData.shuffle_options) {
          processedQuestions = processedQuestions.map(q => ({
            ...q,
            options: q.options ? shuffleArray(q.options) : q.options
          }))
        }
        
        setExam(examData)
        setQuestions(processedQuestions)
        setTimeLeft(examData.duration * 60)
        startTimeRef.current = Date.now()
        
      } catch (err) {
        console.error('Error fetching exam:', err)
        setError('Failed to load exam')
        toast.error('Failed to load exam')
      } finally {
        setLoading(false)
      }
    }
    
    fetchExamData()
  }, [examId])

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 && !autoSubmitTriggered.current) {
      autoSubmitTriggered.current = true
      handleAutoSubmit()
      return
    }
    
    if (isPaused) return
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeLeft, isPaused])

  // Warn when time is running low
  useEffect(() => {
    if (timeLeft === 300) {
      toast.warning('5 minutes remaining!', { duration: 5000 })
    } else if (timeLeft === 60) {
      toast.warning('1 minute remaining!', { duration: 5000 })
    }
  }, [timeLeft])

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isPaused && timeLeft > 0 && !isSubmitting && !autoSubmitTriggered.current) {
        setTabSwitches(prev => {
          const newCount = prev + 1
          
          if (newCount === 2) {
            toast.warning('Warning: Please do not switch tabs during exam!', { duration: 5000 })
          } else if (newCount >= 3) {
            toast.error('Exam auto-submitted due to tab switching!', { duration: 5000 })
            autoSubmitTriggered.current = true
            handleAutoSubmit()
          }
          
          return newCount
        })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isPaused, timeLeft, isSubmitting])

  const handleAutoSubmit = async () => {
    if (isSubmitting || autoSubmitTriggered.current) return
    autoSubmitTriggered.current = true
    setIsSubmitting(true)
    
    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      
      let correctCount = 0
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
      let earnedPoints = 0
      
      for (const question of questions) {
        const answer = answers[question.id]
        if (question.correct_answer === answer) {
          correctCount++
          earnedPoints += question.points
        }
      }
      
      const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
      let grade = 'F'
      if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B'
      else if (percentage >= 60) grade = 'C'
      else if (percentage >= 50) grade = 'D'
      
      const result = {
        exam_title: exam?.title,
        score: earnedPoints,
        total: totalPoints,
        percentage,
        grade,
        time_spent: timeSpent,
        correct_answers: correctCount,
        wrong_answers: questions.length - correctCount,
        submitted_at: new Date().toISOString(),
      }
      
      // Save submission to database
      const { error: submitError } = await supabase
        .from('submissions')
        .insert({
          exam_id: examId,
          student_id: session?.user?.id,
          answers,
          score: earnedPoints,
          percentage,
          grade,
          time_spent: timeSpent,
          submitted_at: new Date().toISOString()
        })
      
      if (submitError) throw submitError
      
      toast.success('Exam auto-submitted!')
      router.push(`/result/${examId}`)
    } catch (err) {
      console.error('Auto-submit failed:', err)
      toast.error('Failed to auto-submit exam')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft < 60) return 'text-red-600 animate-pulse'
    if (timeLeft < 300) return 'text-orange-600'
    return 'text-green-600'
  }

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }))
  }

  const toggleMark = () => {
    const newMarked = new Set(markedQuestions)
    if (newMarked.has(currentQuestion)) {
      newMarked.delete(currentQuestion)
      toast.success(`Question ${currentQuestion + 1} unmarked for review`)
    } else {
      newMarked.add(currentQuestion)
      toast.success(`Question ${currentQuestion + 1} marked for review`)
    }
    setMarkedQuestions(newMarked)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      
      let correctCount = 0
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
      let earnedPoints = 0
      
      for (const question of questions) {
        const answer = answers[question.id]
        if (question.correct_answer === answer) {
          correctCount++
          earnedPoints += question.points
        }
      }
      
      const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
      let grade = 'F'
      if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B'
      else if (percentage >= 60) grade = 'C'
      else if (percentage >= 50) grade = 'D'
      
      // Save submission to database
      const { error: submitError } = await supabase
        .from('submissions')
        .insert({
          exam_id: examId,
          student_id: session?.user?.id,
          answers,
          score: earnedPoints,
          percentage,
          grade,
          time_spent: timeSpent,
          submitted_at: new Date().toISOString()
        })
      
      if (submitError) throw submitError
      
      toast.success('Exam submitted successfully!')
      router.push(`/result/${examId}`)
    } catch (err) {
      console.error('Submit failed:', err)
      toast.error('Failed to submit exam')
    } finally {
      setIsSubmitting(false)
      setShowSubmitDialog(false)
    }
  }

  const currentQ = questions[currentQuestion]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading exam...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The exam you are looking for does not exist.'}</p>
            <Button onClick={() => router.push('/cbt')}>Back to Exams</Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">No Questions Available</h1>
            <p className="text-gray-600 mb-6">This exam has no questions yet.</p>
            <Button onClick={() => router.push('/cbt')}>Back to Exams</Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="font-bold">{exam.title}</h1>
              <p className="text-xs text-gray-500">Secure Examination Mode</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Questions</p>
                <p className="font-bold text-lg">{answeredCount}/{questions.length}</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">Time Left</p>
                <div className={`font-mono font-bold text-xl ${getTimeColor()}`}>
                  <Clock className="inline-block h-4 w-4 mr-1" />
                  {formatTime(timeLeft)}
                </div>
              </div>
              
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-2 h-1" />
          
          {tabSwitches > 0 && tabSwitches < 3 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-800">
                Warning: Tab switching detected. {3 - tabSwitches} warnings remaining.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card className="p-6 shadow-lg border-0">
              <div className="mb-6">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary/10 text-primary border-0 px-3 py-1">
                      Question {currentQuestion + 1} of {questions.length}
                    </Badge>
                    <Badge className="bg-secondary/10 text-secondary border-0 px-3 py-1">
                      {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMark}
                    className={markedQuestions.has(currentQuestion) ? 'bg-yellow-100 border-yellow-400' : ''}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    {markedQuestions.has(currentQuestion) ? 'Marked' : 'Mark for Review'}
                  </Button>
                </div>
                
                <h3 className="text-lg md:text-xl font-semibold mb-6 leading-relaxed">
                  {currentQ.question_text}
                </h3>
                
                {currentQ.type === 'objective' && currentQ.options && (
                  <RadioGroup
                    value={answers[currentQ.id] || ''}
                    onValueChange={handleAnswer}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                          answers[currentQ.id] === option ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleAnswer(option)}
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {currentQ.type === 'theory' && (
                  <textarea
                    className="w-full p-4 border rounded-lg min-h-[200px] focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                    placeholder="Type your answer here..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                  />
                )}
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={() => setShowSubmitDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finish Exam
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
          
          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24 shadow-lg border-0">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  const q = questions[idx]
                  const isAnswered = !!answers[q.id]
                  const isMarked = markedQuestions.has(idx)
                  const isCurrent = currentQuestion === idx
                  
                  let bgColor = 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  
                  if (isCurrent) {
                    bgColor = 'bg-primary text-white hover:bg-primary/90'
                  } else if (isAnswered && !isMarked) {
                    bgColor = 'bg-green-500 text-white hover:bg-green-600'
                  } else if (isMarked) {
                    bgColor = 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`p-2 text-center rounded-lg transition-all font-medium ${bgColor}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <span>Not Visited</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-semibold text-green-600">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-semibold text-orange-600">{unansweredCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Marked:</span>
                    <span className="font-semibold text-yellow-600">{markedQuestions.size}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Submit Examination?
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Answered:</span>
                <span className="font-semibold text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Unanswered:</span>
                <span className="font-semibold text-orange-600">{unansweredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Questions:</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
            </div>
            
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}
                </span>
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              Once submitted, you cannot change your answers.
            </p>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit} 
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md mx-4">
            <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Exam Paused</h3>
            <p className="text-gray-600 mb-4">Your exam has been paused. Click resume to continue.</p>
            <Button onClick={() => setIsPaused(false)} className="w-full">
              Resume Exam
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}