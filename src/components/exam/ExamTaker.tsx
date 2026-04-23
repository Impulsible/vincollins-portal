// components/exam/ExamTaker.tsx - COMPLETELY FIXED
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock, Flag, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ExamTakerProps {
  examId: string
  studentId: string
  submissionId: string
}

interface OptionPair {
  option: string
  letter: string
}

// Fisher-Yates shuffle with proper typing
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function ExamTaker({ examId, studentId, submissionId }: ExamTakerProps) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [allQuestions, setAllQuestions] = useState<any[]>([])
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [examStarted, setExamStarted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [optionMappings, setOptionMappings] = useState<Record<string, Record<string, string>>>({})
  const [mappedCorrectAnswers, setMappedCorrectAnswers] = useState<Record<string, string>>({})

  useEffect(() => { loadExamAndQuestions() }, [examId])

  const loadExamAndQuestions = async () => {
    setLoading(true)
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams').select('*').eq('id', examId).single()
      if (examError) throw examError
      setExam(examData)
      setTimeRemaining((examData.duration || 60) * 60)

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions').select('*').eq('exam_id', examId).order('order_number', { ascending: true })
      if (questionsError) throw questionsError

      if (questionsData) {
        let objective = questionsData.filter((q: any) => 
          !q.question_type || q.question_type === 'objective' || q.question_type === 'mcq'
        )
        const theory = questionsData.filter((q: any) => 
          q.question_type === 'theory' || q.question_type === 'essay'
        )

        let parsedObj = objective.map((q: any, idx: number) => {
          let options = q.options
          if (typeof options === 'string') {
            try { options = JSON.parse(options) } catch { options = ['', '', '', ''] }
          }
          return { ...q, options: options || ['', '', '', ''], type: 'objective' as const, original_order: idx }
        })

        if (examData.shuffle_questions) parsedObj = shuffleArray(parsedObj)

        const mappings: Record<string, Record<string, string>> = {}
        const correctMappings: Record<string, string> = {}

        if (examData.shuffle_options) {
          parsedObj = parsedObj.map(q => {
            if (q.options?.length > 0) {
              // FIXED: Properly typed OptionPair array
              const pairs: OptionPair[] = q.options.map((opt: string, i: number) => ({
                option: opt,
                letter: String.fromCharCode(65 + i)
              }))
              
              const shuffled: OptionPair[] = shuffleArray(pairs)
              const mapping: Record<string, string> = {}
              
              // FIXED: p is now properly typed as OptionPair
              shuffled.forEach((p: OptionPair, i: number) => {
                mapping[p.letter] = String.fromCharCode(65 + i)
              })
              
              mappings[q.id] = mapping
              correctMappings[q.id] = mapping[q.correct_answer] || q.correct_answer
              
              // FIXED: p is now properly typed as OptionPair
              return { ...q, options: shuffled.map((p: OptionPair) => p.option) }
            }
            return q
          })
        }

        setOptionMappings(mappings)
        setMappedCorrectAnswers(correctMappings)

        let processedTheory = theory.map((q: any, idx: number) => ({ 
          ...q, type: 'theory' as const, original_order: idx 
        }))
        if (examData.shuffle_questions) processedTheory = shuffleArray(processedTheory)

        let combined = [...parsedObj, ...processedTheory]
        if (examData.shuffle_questions) combined = shuffleArray(combined)
        
        setAllQuestions(combined)
      }
    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  // Timer
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { clearInterval(timer); handleAutoSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [examStarted, timeRemaining])

  const handleStartExam = () => { setExamStarted(true); setStartTime(new Date()) }
  
  const handleAutoSubmit = async () => {
    toast.warning('Time is up! Submitting...')
    await handleSubmit()
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleTheoryAnswerChange = (questionId: string, answer: string) => {
    setTheoryAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      newSet.has(questionId) ? newSet.delete(questionId) : newSet.add(questionId)
      return newSet
    })
  }

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < allQuestions.length) setCurrentIndex(index)
  }

  const getAnswerStatus = (questionId: string): 'answered' | 'flagged' | 'unanswered' => {
    if (flaggedQuestions.has(questionId)) return 'flagged'
    if (answers[questionId] || theoryAnswers[questionId]) return 'answered'
    return 'unanswered'
  }

  const answeredCount = Object.keys(answers).length + Object.keys(theoryAnswers).length

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const timeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0

      const { error } = await supabase
        .from('exam_submissions')
        .update({
          answers: {
            objective: answers,
            theory: theoryAnswers,
            option_mappings: optionMappings,
            mapped_correct_answers: mappedCorrectAnswers,
            question_order: allQuestions.map(q => q.id),
            shuffled: exam?.shuffle_questions || false
          },
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          time_spent: timeSpent,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) throw error

      toast.success('Exam submitted successfully!')
      router.push('/portal')
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Failed to submit exam')
    } finally {
      setSubmitting(false)
      setShowSubmitDialog(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60), s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const totalSeconds = (exam?.duration || 60) * 60
    const percentLeft = (timeRemaining / totalSeconds) * 100
    if (percentLeft <= 10) return 'text-red-600 bg-red-100'
    if (percentLeft <= 25) return 'text-orange-600 bg-orange-100'
    return 'text-blue-600 bg-blue-100'
  }

  const currentQuestion = allQuestions[currentIndex]
  const isObjective = currentQuestion?.type === 'objective'

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  if (!examStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{exam?.title}</h2>
          <p><strong>Duration:</strong> {exam?.duration} min | <strong>Questions:</strong> {allQuestions.length}</p>
          <Button onClick={handleStartExam} className="w-full" size="lg">Start Exam</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      <Card>
        <CardContent className="p-4 flex justify-between items-center">
          <span>Q {currentIndex + 1}/{allQuestions.length}</span>
          <span className={cn("px-3 py-1 rounded-full font-mono font-bold", getTimerColor())}>
            <Clock className="inline h-4 w-4 mr-1" />{formatTime(timeRemaining)}
          </span>
          <Button size="sm" onClick={() => setShowSubmitDialog(true)}>Submit</Button>
        </CardContent>
      </Card>

      {currentQuestion && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-4">
              <Badge>{isObjective ? 'MCQ' : 'Theory'}</Badge>
              <Badge variant="outline">{currentQuestion.points} pts</Badge>
              <Button variant="ghost" size="icon" onClick={() => toggleFlag(currentQuestion.id)}
                className={cn(flaggedQuestions.has(currentQuestion.id) && "text-yellow-600")}>
                <Flag className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="text-lg font-medium mb-4">{currentIndex + 1}. {currentQuestion.question_text}</h3>

            {isObjective && currentQuestion.options && (
              <RadioGroup value={answers[currentQuestion.id] || ''} onValueChange={(v) => handleAnswerSelect(currentQuestion.id, v)} className="space-y-2">
                {currentQuestion.options.map((opt: string, idx: number) => opt && (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <RadioGroupItem value={String.fromCharCode(65 + idx)} id={`opt-${idx}`} />
                    <Label htmlFor={`opt-${idx}`}>{String.fromCharCode(65 + idx)}. {opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {!isObjective && (
              <Textarea value={theoryAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleTheoryAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[200px]" placeholder="Type your answer..." />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigateToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="flex gap-1">
          {allQuestions.map((q, idx) => (
            <Button key={q.id} variant="outline" size="sm" onClick={() => navigateToQuestion(idx)}
              className={cn("h-8 w-8 p-0 text-xs", currentIndex === idx && "ring-2 ring-blue-500",
                getAnswerStatus(q.id) === 'answered' && "bg-green-100",
                getAnswerStatus(q.id) === 'flagged' && "bg-yellow-100")}>
              {idx + 1}
            </Button>
          ))}
        </div>
        <Button variant="outline" onClick={() => navigateToQuestion(currentIndex + 1)} disabled={currentIndex === allQuestions.length - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Exam?</DialogTitle></DialogHeader>
          <p>Answered: {answeredCount} of {allQuestions.length}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}