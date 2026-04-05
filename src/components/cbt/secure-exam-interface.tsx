/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { AlertTriangle, Clock, Save, ChevronLeft, ChevronRight, Flag, CheckCircle, HelpCircle, Shield, Maximize2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export interface Question {
  id: string
  exam_id?: string
  question_text: string
  type: 'objective' | 'theory' | 'true-false' | 'matching' | 'fill-blank'
  options?: string[]
  points: number
  correct_answer?: string
  image_url?: string
  explanation?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  order?: number
}

interface SecureExamInterfaceProps {
  examId: string
  userId: string
  examTitle: string
  duration: number
  questions: Question[]
  onSubmit: (answers: Record<string, any>, timeSpent: number) => Promise<void>
  isSubmitting?: boolean
}

export function SecureExamInterface({
  examId,
  userId,
  examTitle,
  duration,
  questions: originalQuestions,
  onSubmit,
  isSubmitting: externalIsSubmitting = false,
}: SecureExamInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set())
  const [startTime] = useState(Date.now())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const autoSubmitTriggered = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fullscreenAttempted = useRef(false)

  // Shuffle questions and options
  useEffect(() => {
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    let shuffled = shuffleArray(originalQuestions)
    shuffled = shuffled.map(q => ({
      ...q,
      options: q.options ? shuffleArray(q.options) : q.options,
    }))
    
    setQuestions(shuffled)
  }, [originalQuestions])

  // Fullscreen handling - only attempt on user interaction
  const enterFullscreen = useCallback(async () => {
    if (fullscreenAttempted.current) return
    fullscreenAttempted.current = true
    
    try {
      const element = document.documentElement
      await element.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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

  // Prevent copy-paste and keyboard shortcuts
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('Copying is disabled during exam', { duration: 2000 })
    }
    
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('Pasting is disabled during exam', { duration: 2000 })
    }

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('Cutting is disabled during exam', { duration: 2000 })
    }

    const preventShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault()
        toast.error('Developer tools are disabled during exam')
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault()
        toast.error('Refresh is disabled during exam')
      }
      if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v')) {
        e.preventDefault()
      }
    }
    
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('cut', handleCut)
    document.addEventListener('keydown', preventShortcuts)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('cut', handleCut)
      document.removeEventListener('keydown', preventShortcuts)
    }
  }, [])

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting || autoSubmitTriggered.current) return
    autoSubmitTriggered.current = true
    setIsSubmitting(true)
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    try {
      await onSubmit(answers, timeSpent)
    } catch (error) {
      console.error('Auto-submit failed:', error)
      toast.error('Failed to auto-submit exam')
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, startTime, onSubmit, answers])

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
    toast.success('Answer saved', { duration: 1000 })
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
    if (isSubmitting || externalIsSubmitting) return
    setIsSubmitting(true)
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    try {
      await onSubmit(answers, timeSpent)
      toast.success('Exam submitted successfully!')
      setShowSubmitDialog(false)
    } catch (error) {
      toast.error('Failed to submit exam')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentQ = questions[currentQuestion]

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md p-8 text-center">
          <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-4">This exam has no questions. Please contact your instructor.</p>
          <Button onClick={() => window.location.href = '/cbt'}>Back to Exams</Button>
        </Card>
      </div>
    )
  }

  if (!isFullscreen && !isSubmitting && timeLeft > 0 && !fullscreenAttempted.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md p-8 text-center">
          <Maximize2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Enter Fullscreen Mode</h2>
          <p className="text-gray-600 mb-4">Please enter fullscreen mode to begin your exam. This ensures exam integrity.</p>
          <Button onClick={enterFullscreen} className="w-full">
            <Maximize2 className="mr-2 h-4 w-4" />
            Enter Fullscreen
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-bold">{examTitle}</h1>
                <p className="text-xs text-gray-500">Secure Examination Mode</p>
              </div>
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
                variant="outline"
                onClick={() => setIsPaused(!isPaused)}
                className="hidden md:flex"
                disabled={timeLeft <= 0}
              >
                {isPaused ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={isSubmitting || externalIsSubmitting}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
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
                    
                    {/* Objective and True-False Questions */}
                    {(currentQ.type === 'objective' || currentQ.type === 'true-false') && currentQ.options && (
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
                    
                    {/* Matching Questions */}
                    {currentQ.type === 'matching' && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-2">Match the following pairs:</p>
                        <textarea
                          className="w-full p-4 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                          placeholder="Enter your matching pairs (e.g., '1-A, 2-B, 3-C')..."
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswer(e.target.value)}
                        />
                      </div>
                    )}
                    
                    {/* Fill in the Blank Questions */}
                    {currentQ.type === 'fill-blank' && (
                      <div className="space-y-4">
                        <input
                          type="text"
                          className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="Type your answer here..."
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswer(e.target.value)}
                        />
                      </div>
                    )}
                    
                    {/* Theory Questions */}
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
              </motion.div>
            </AnimatePresence>
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
              
              {unansweredCount > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}
                  </p>
                </div>
              )}
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
              disabled={isSubmitting || externalIsSubmitting}
            >
              {isSubmitting || externalIsSubmitting ? 'Submitting...' : 'Submit Exam'}
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