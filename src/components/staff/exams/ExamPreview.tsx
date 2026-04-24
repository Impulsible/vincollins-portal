// components/staff/exams/ExamPreview.tsx - FULLY RESPONSIVE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, Clock, Award, BookOpen, 
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Flag, Shield, FileText, Brain, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Question {
  id: string
  type: string
  question: string
  options?: string[]
  correct_answer?: string
  marks: number
  order: number
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  pass_mark: number
  shuffle_questions: boolean
  shuffle_options: boolean
  has_theory: boolean
  status: string
  instructions?: string  // ✅ FIX: Add instructions property
  description?: string   // ✅ Also add description as fallback
  questions?: Question[]
}

interface ExamPreviewProps {
  examId: string
  onBack: () => void
}

export function ExamPreview({ examId, onBack }: ExamPreviewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  useEffect(() => {
    loadExamData()
  }, [examId])

  useEffect(() => {
    if (exam && exam.duration) {
      setTimeRemaining(exam.duration * 60)
    }
  }, [exam])

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isTimerRunning, timeRemaining])

  const loadExamData = async () => {
    setLoading(true)
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError

      let extractedQuestions: Question[] = []
      if (examData.questions && Array.isArray(examData.questions)) {
        extractedQuestions = examData.questions.map((q: any, idx: number) => ({
          id: q.id || crypto.randomUUID(),
          type: q.type || 'objective',
          question: q.question || q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks || q.points || 0.5,
          order: q.order || idx + 1
        }))
      }

      setExam(examData)
      setQuestions(extractedQuestions)
      setTimeRemaining(examData.duration * 60)
    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (!exam) return 'text-blue-600 bg-blue-100'
    const totalSeconds = exam.duration * 60
    const percentLeft = (timeRemaining / totalSeconds) * 100
    if (percentLeft <= 10) return 'text-red-600 bg-red-100'
    if (percentLeft <= 25) return 'text-orange-600 bg-orange-100'
    return 'text-blue-600 bg-blue-100'
  }

  const toggleFlag = (id: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleTheoryAnswerChange = (questionId: string, answer: string) => {
    setTheoryAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(theoryAnswers).length

  const objectiveQuestions = questions.filter(q => q.type === 'objective' || q.type === 'mcq')
  const theoryQuestions = questions.filter(q => q.type === 'theory')

  // ✅ FIX: Get instructions with fallback to description
  const examInstructions = exam?.instructions || exam?.description || ''

  if (loading) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32 mt-1" /></div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-muted-foreground">Exam not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
        
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold">Exam Preview</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Preview Mode</Badge>
            <Badge className={cn("text-xs", getTimerColor())}>
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Card>
            <CardContent className="p-2.5 sm:p-3 text-center">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold">{totalQuestions}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Total Questions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5 sm:p-3 text-center">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold">{exam.duration}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Minutes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5 sm:p-3 text-center">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold">{answeredCount}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Answered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5 sm:p-3 text-center">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold">{totalQuestions - answeredCount}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Question Navigator - Scrollable on mobile */}
        <div className="bg-white rounded-lg border p-2 sm:p-3 overflow-x-auto">
          <div className="flex gap-1 sm:gap-1.5 min-w-max pb-1">
            {questions.map((q, idx) => {
              const isAnswered = q.type === 'theory' 
                ? !!theoryAnswers[q.id] 
                : !!selectedAnswers[q.id]
              const isFlagged = flaggedQuestions.has(q.id)
              const isCurrent = idx === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => navigateToQuestion(idx)}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex-shrink-0",
                    isCurrent ? "ring-2 ring-blue-500 ring-offset-1" : "",
                    q.type === 'theory' 
                      ? (isAnswered ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700 border border-purple-300")
                      : (isAnswered ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 border border-gray-300"),
                    isFlagged && "ring-2 ring-amber-400"
                  )}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-green-500" /> Answered</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-gray-100 border border-gray-300" /> Not Answered</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-purple-500" /> Theory</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded ring-2 ring-amber-400" /> Flagged</span>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5 sm:h-2" />

        {/* Question Content - Scrollable */}
        <div className="bg-white rounded-lg border p-3 sm:p-4 lg:p-6 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Badge 
                    variant={currentQuestion.type === 'theory' ? 'secondary' : 'outline'} 
                    className="text-[10px] sm:text-xs"
                  >
                    {currentQuestion.type === 'theory' ? <Brain className="h-3 w-3 mr-1" /> : null}
                    {currentQuestion.type === 'theory' ? 'Theory' : 'Objective'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={cn(
                    "p-1 rounded-lg transition",
                    flaggedQuestions.has(currentQuestion.id) 
                      ? "bg-amber-100 text-amber-700" 
                      : "hover:bg-gray-100 text-gray-400"
                  )}
                >
                  <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
              
              <h4 className="text-sm sm:text-base lg:text-lg font-medium mb-4 sm:mb-6">
                {currentIndex + 1}. {currentQuestion.question}
              </h4>
              
              {currentQuestion.type === 'theory' ? (
                <div>
                  <Alert className="mb-3 sm:mb-4 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-[11px] sm:text-sm">
                      This question will be graded by your teacher. Provide a detailed answer.
                    </AlertDescription>
                  </Alert>
                  <Textarea
                    value={theoryAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleTheoryAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={5}
                    className="w-full text-sm"
                  />
                </div>
              ) : (
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id] || ''}
                  onValueChange={(v) => handleAnswerSelect(currentQuestion.id, v)}
                  className="space-y-2 sm:space-y-3"
                >
                  {currentQuestion.options?.map((option, idx) => (
                    <label
                      key={idx}
                      className={cn(
                        "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-all",
                        selectedAnswers[currentQuestion.id] === option 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <RadioGroupItem value={option} id={`preview-${currentQuestion.id}-${idx}`} className="mt-0.5" />
                      <Label 
                        htmlFor={`preview-${currentQuestion.id}-${idx}`} 
                        className="flex-1 cursor-pointer text-xs sm:text-sm"
                      >
                        <span className="font-medium mr-1 sm:mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {option}
                      </Label>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation - Responsive */}
        <div className="flex justify-between items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            Previous
          </Button>
          
          <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3 hidden sm:block" />
            Question {currentIndex + 1} of {totalQuestions}
          </div>
          
          {currentIndex === totalQuestions - 1 ? (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={() => toast.info('This is a preview. Submit would happen in live exam.')}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Submit
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToQuestion(currentIndex + 1)}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              Next
              <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>

        {/* ✅ FIXED: Instructions - Now uses examInstructions variable with fallback */}
        {examInstructions && (
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <p className="text-[11px] sm:text-sm text-blue-800 font-medium mb-1">Instructions:</p>
            <p className="text-[10px] sm:text-xs text-blue-700 whitespace-pre-line">{examInstructions}</p>
          </div>
        )}

        {/* Question Type Summary */}
        <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-2">Question Summary</h3>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Objective:</span>
              <span className="font-medium ml-1">{objectiveQuestions.length} questions</span>
              <span className="text-muted-foreground ml-1">
                ({objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)} marks)
              </span>
            </div>
            {theoryQuestions.length > 0 && (
              <div>
                <span className="text-muted-foreground">Theory:</span>
                <span className="font-medium ml-1">{theoryQuestions.length} questions</span>
                <span className="text-muted-foreground ml-1">
                  ({theoryQuestions.reduce((sum, q) => sum + q.marks, 0)} marks)
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="font-medium ml-1">
                {questions.reduce((sum, q) => sum + q.marks, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}