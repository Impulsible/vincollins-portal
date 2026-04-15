/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/CreateExamDialog.tsx - WITH RANDOMIZATION SETTINGS
'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Plus, Trash2, Save, Send, Clock, Loader2, FileText, Brain,
  Upload, FileUp, Download, AlertCircle, CheckCheck, Sparkles, Wand2,
  ChevronLeft, ChevronRight, Eye, MonitorPlay, Shield, Flag, Award,
  Shuffle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Document parser
const parseDocument = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  
  if (fileExt === 'txt' || fileExt === 'md') {
    return await file.text()
  }
  
  if (fileExt === 'docx' || fileExt === 'doc') {
    try {
      const mammoth = (await import('mammoth')).default
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error('Error parsing Word document:', error)
      throw new Error('Failed to parse Word document')
    }
  }
  
  if (fileExt === 'pdf') {
    try {
      const pdfModule = await import('pdf-parse')
      const pdfParse = (pdfModule as any).default || pdfModule
      const arrayBuffer = await file.arrayBuffer()
      const data = await pdfParse(Buffer.from(arrayBuffer))
      return data.text
    } catch (error) {
      console.error('Error parsing PDF:', error)
      throw new Error('Failed to parse PDF document')
    }
  }
  
  throw new Error('Unsupported file format')
}

interface Question {
  id: string
  type: string
  question: string
  options?: string[]
  correct_answer: string
  marks: number
}

interface TheoryQuestion {
  id: string
  question: string
  marks: number
}

interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teacherProfile: any
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const jssSubjects = [
  'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Christian Religious Studies',
  'Islamic Religious Studies', 'Business Studies', 'Home Economics',
  'Agricultural Science', 'Physical and Health Education',
  'Computer Studies', 'Cultural and Creative Arts', 'French',
  'Hausa', 'Igbo', 'Yoruba'
]

const ssSubjects = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science'
]

// CBT Preview Component
function CBTPreview({ examDetails, questions, theoryQuestions, hasTheory, defaultMark }: {
  examDetails: any
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
  defaultMark: number
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState((examDetails.duration || 60) * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const allQuestions = useMemo(() => {
    const objQuestions = questions.map(q => ({ ...q, type: 'objective' as const }))
    const thQuestions = hasTheory ? theoryQuestions.map(q => ({ ...q, type: 'theory' as const })) : []
    return [...objQuestions, ...thQuestions]
  }, [questions, theoryQuestions, hasTheory])
  
  const currentQuestion = allQuestions[currentIndex]
  const totalQuestions = allQuestions.length
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0
  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).length + Object.keys(theoryAnswers).length
  }, [selectedAnswers, theoryAnswers])

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const totalSeconds = (examDetails.duration || 60) * 60
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
    if (index >= 0 && index < totalQuestions) setCurrentIndex(index)
  }

  useEffect(() => {
    setTimeRemaining((examDetails.duration || 60) * 60)
    setIsTimerRunning(true)
  }, [examDetails.duration])

  return (
    <div className="min-h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{examDetails.title || 'Untitled Exam'}</h3>
            <p className="text-sm text-blue-100">{examDetails.subject} • {examDetails.class}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg font-bold", getTimerColor())}>
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
              {!isTimerRunning && timeRemaining === 0 && <Badge className="ml-2 bg-red-500 text-white">Time's Up!</Badge>}
            </div>
            <Badge className="bg-white/20 text-white"><Award className="h-3 w-3 mr-1" /> Pass: {examDetails.pass_mark || 50}%</Badge>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-blue-100 mb-1">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-800" />
        </div>
      </div>
      <div className="bg-white border-b p-3">
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {allQuestions.map((q, idx) => {
            const questionId = q.id
            const isAnswered = q.type === 'theory' ? !!theoryAnswers[questionId] : !!selectedAnswers[questionId]
            const isFlagged = flaggedQuestions.has(questionId)
            const isCurrent = idx === currentIndex
            return (
              <button key={questionId} onClick={() => navigateToQuestion(idx)} className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-all flex-shrink-0 hover:scale-105",
                isCurrent ? "ring-2 ring-blue-500 ring-offset-2" : "",
                q.type === 'theory' ? (isAnswered ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700 border border-purple-300")
                  : (isAnswered ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 border border-gray-300"),
                isFlagged && "ring-2 ring-amber-400"
              )}>{idx + 1}</button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> Answered</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Not Answered</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-500" /> Theory</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded ring-2 ring-amber-400" /> Flagged</span>
        </div>
      </div>
      <div className="p-6 min-h-[350px]">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant={currentQuestion.type === 'theory' ? 'secondary' : 'outline'}>
                  {currentQuestion.type === 'theory' ? <><Brain className="h-3 w-3 mr-1" /> Theory</> : <>Objective</>}
                </Badge>
                <Badge variant="outline">{currentQuestion.marks || defaultMark} mark(s)</Badge>
                {currentQuestion.type === 'theory' && <Badge className="bg-amber-100 text-amber-700 border-amber-300">Teacher Graded</Badge>}
              </div>
              <button onClick={() => toggleFlag(currentQuestion.id)} className={cn("p-2 rounded-lg transition", flaggedQuestions.has(currentQuestion.id) ? "bg-amber-100 text-amber-700" : "hover:bg-gray-100 text-gray-400")}>
                <Flag className="h-4 w-4" />
              </button>
            </div>
            <h4 className="text-lg font-medium mb-6">{currentIndex + 1}. {currentQuestion.type === 'theory' ? (currentQuestion as TheoryQuestion).question : (currentQuestion as Question).question}</h4>
            {currentQuestion.type === 'theory' ? (
              <div>
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">This question will be graded by your teacher. Be detailed in your answer.</AlertDescription>
                </Alert>
                <Textarea value={theoryAnswers[currentQuestion.id] || ''} onChange={(e) => handleTheoryAnswerChange(currentQuestion.id, e.target.value)} placeholder="Type your answer here..." rows={6} className="w-full" />
              </div>
            ) : (
              <RadioGroup value={selectedAnswers[currentQuestion.id] || ''} onValueChange={(v) => handleAnswerSelect(currentQuestion.id, v)} className="space-y-3">
                {(currentQuestion as Question).options?.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <RadioGroupItem value={option} id={`preview-${currentQuestion.id}-${idx}`} />
                    <Label htmlFor={`preview-${currentQuestion.id}-${idx}`} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span> {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}
      </div>
      <div className="bg-white border-t p-4 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigateToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Secure Exam Mode Preview</div>
        {currentIndex === totalQuestions - 1 ? (
          <Button className="bg-green-600 hover:bg-green-700 text-white"><CheckCheck className="mr-2 h-4 w-4" /> Submit Exam</Button>
        ) : (
          <Button variant="outline" onClick={() => navigateToQuestion(currentIndex + 1)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
        )}
      </div>
      {examDetails.instructions && (
        <div className="bg-blue-50 p-4 border-t border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-1">Instructions:</p>
          <p className="text-sm text-blue-700 whitespace-pre-line">{examDetails.instructions}</p>
        </div>
      )}
    </div>
  )
}

export function CreateExamDialog({ open, onOpenChange, onSuccess, teacherProfile }: CreateExamDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [hasTheory, setHasTheory] = useState(false)
  const [uploadMode, setUploadMode] = useState<'manual' | 'bulk'>('bulk')
  const [theoryUploadMode, setTheoryUploadMode] = useState<'manual' | 'bulk'>('bulk')
  const [bulkQuestionsText, setBulkQuestionsText] = useState('')
  const [bulkTheoryText, setBulkTheoryText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [theoryParseError, setTheoryParseError] = useState<string | null>(null)
  const [defaultMark, setDefaultMark] = useState<number>(0.5)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [isParsingTheoryFile, setIsParsingTheoryFile] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const theoryFileInputRef = useRef<HTMLInputElement>(null)
  
  const [examDetails, setExamDetails] = useState({
    title: '',
    subject: '',
    class: '',
    duration: 60,
    instructions: '',
    pass_mark: 50,
    randomize_questions: true,
    randomize_options: true
  })
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 0.5
  })

  const [currentTheoryQuestion, setCurrentTheoryQuestion] = useState<Partial<TheoryQuestion>>({
    question: '',
    marks: 5
  })

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return []
    return examDetails.class.startsWith('JSS') ? jssSubjects : ssSubjects
  }, [examDetails.class])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setExamDetails({ 
          title: '', subject: '', class: '', duration: 60, instructions: '', pass_mark: 50,
          randomize_questions: true, randomize_options: true
        })
        setQuestions([])
        setTheoryQuestions([])
        setHasTheory(false)
        setActiveTab('details')
        setBulkQuestionsText('')
        setBulkTheoryText('')
        setParseError(null)
        setTheoryParseError(null)
        setDefaultMark(0.5)
      }, 300)
    }
    onOpenChange(open)
  }

  const parseObjectiveQuestions = (text: string): Question[] => {
    const parsedQuestions: Question[] = []
    const blocks = text.split(/(?=\d+\.\s+)/g).filter(b => b.trim())
    for (const block of blocks) {
      const qMatch = block.match(/^(\d+)\.\s*([\s\S]*?)(?=\n\s*[A-D][).\s])/i)
      if (!qMatch) continue
      const questionText = qMatch[2].trim()
      const options: string[] = []
      const optMatches = block.matchAll(/^([A-D])[).\s]+([^\n]+)/gm)
      for (const m of optMatches) {
        const idx = m[1].charCodeAt(0) - 65
        options[idx] = m[2].trim()
      }
      const validOptions = options.filter(o => o)
      if (validOptions.length === 0) continue
      const correctMatch = block.match(/(?:Correct Answer|Ans(?:wer)?)[:\s]*([A-D])\b/i)
      if (!correctMatch) continue
      const correctLetter = correctMatch[1].toUpperCase()
      const correctIdx = correctLetter.charCodeAt(0) - 65
      const correctAnswer = validOptions[correctIdx] || correctLetter
      const marksMatch = block.match(/Marks?[:\s]*([\d.]+)/i)
      const marks = marksMatch ? parseFloat(marksMatch[1]) : defaultMark
      parsedQuestions.push({ id: crypto.randomUUID(), type: 'mcq', question: questionText, options: validOptions, correct_answer: correctAnswer, marks })
    }
    return parsedQuestions
  }

  const parseTheoryQuestions = (text: string): TheoryQuestion[] => {
    const parsed: TheoryQuestion[] = []
    const blocks = text.split(/(?=\d+\.\s+)/g).filter(b => b.trim())
    for (const block of blocks) {
      let questionText = block.replace(/^\d+\.\s*/, '').trim()
      const marksMatch = questionText.match(/\n*Marks?[:\s]*(\d+)\s*$/i)
      let marks = 5
      if (marksMatch) {
        marks = parseInt(marksMatch[1])
        questionText = questionText.replace(/\n*Marks?[:\s]*\d+\s*$/i, '').trim()
      }
      if (questionText) parsed.push({ id: crypto.randomUUID(), question: questionText, marks })
    }
    return parsed
  }

  const parseBulkQuestions = () => {
    if (!bulkQuestionsText.trim()) { toast.error('Please paste some questions'); return }
    setParseError(null)
    const parsed = parseObjectiveQuestions(bulkQuestionsText)
    if (parsed.length === 0) { setParseError('No valid questions found.'); return }
    setQuestions([...questions, ...parsed])
    setBulkQuestionsText('')
    toast.success(`Added ${parsed.length} questions!`)
  }

  const parseBulkTheory = () => {
    if (!bulkTheoryText.trim()) { toast.error('Please paste some theory questions'); return }
    setTheoryParseError(null)
    const parsed = parseTheoryQuestions(bulkTheoryText)
    if (parsed.length === 0) { setTheoryParseError('No valid theory questions found.'); return }
    setTheoryQuestions([...theoryQuestions, ...parsed])
    setBulkTheoryText('')
    toast.success(`Added ${parsed.length} theory questions!`)
  }

  const insertObjectiveExample = () => {
    setBulkQuestionsText(`1. What is the capital of Nigeria?\n\nA. Lagos\nB. Abuja\nC. Kano\nD. Ibadan\n\nAnswer: B\nMarks: 0.5\n\n2. Who is the current President of Nigeria?\n\nA. Muhammadu Buhari\nB. Bola Ahmed Tinubu\nC. Goodluck Jonathan\nD. Olusegun Obasanjo\n\nAnswer: B\nMarks: 0.5`)
  }

  const insertTheoryExample = () => {
    setBulkTheoryText(`1. Explain the importance of education in national development.\nMarks: 10\n\n2. Discuss the causes and effects of climate change.\nMarks: 15`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsingFile(true)
    setParseError(null)
    try {
      const text = await parseDocument(file)
      setBulkQuestionsText(text)
      setTimeout(() => {
        const parsed = parseObjectiveQuestions(text)
        if (parsed.length > 0) {
          setQuestions([...questions, ...parsed])
          setBulkQuestionsText('')
          toast.success(`Added ${parsed.length} questions from ${file.name}!`)
        } else {
          toast.warning('No questions found in file. You can edit and parse manually.')
        }
      }, 100)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      setParseError(error.message || 'Failed to parse file')
      toast.error(error.message || 'Failed to parse file')
    } finally {
      setIsParsingFile(false)
    }
  }

  const handleTheoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsingTheoryFile(true)
    setTheoryParseError(null)
    try {
      const text = await parseDocument(file)
      setBulkTheoryText(text)
      setTimeout(() => {
        const parsed = parseTheoryQuestions(text)
        if (parsed.length > 0) {
          setTheoryQuestions([...theoryQuestions, ...parsed])
          setBulkTheoryText('')
          toast.success(`Added ${parsed.length} theory questions from ${file.name}!`)
        } else {
          toast.warning('No theory questions found. You can edit and parse manually.')
        }
      }, 100)
      if (theoryFileInputRef.current) theoryFileInputRef.current.value = ''
    } catch (error: any) {
      setTheoryParseError(error.message || 'Failed to parse file')
      toast.error(error.message || 'Failed to parse file')
    } finally {
      setIsParsingTheoryFile(false)
    }
  }

  const downloadTemplate = (type: 'objective' | 'theory') => {
    const template = type === 'objective' 
      ? `1. What is the capital of Nigeria?\n\nA. Lagos\nB. Abuja\nC. Kano\nD. Ibadan\n\nAnswer: B\nMarks: 0.5\n\n2. Who is the current President of Nigeria?\n\nA. Muhammadu Buhari\nB. Bola Ahmed Tinubu\nC. Goodluck Jonathan\nD. Olusegun Obasanjo\n\nAnswer: B\nMarks: 0.5`
      : `1. Explain the importance of education in national development.\nMarks: 10\n\n2. Discuss the causes and effects of climate change.\nMarks: 15`
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = type === 'objective' ? 'objective_questions.txt' : 'theory_questions.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correct_answer) {
      toast.error('Please fill in all required fields')
      return
    }
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: currentQuestion.type || 'mcq',
      question: currentQuestion.question,
      options: currentQuestion.type === 'mcq' ? currentQuestion.options : undefined,
      correct_answer: currentQuestion.correct_answer,
      marks: currentQuestion.marks || defaultMark
    }
    setQuestions([...questions, newQuestion])
    setCurrentQuestion({ type: 'mcq', question: '', options: ['', '', '', ''], correct_answer: '', marks: defaultMark })
    toast.success('Question added')
  }

  const addTheoryQuestion = () => {
    if (!currentTheoryQuestion.question) { toast.error('Please enter a question'); return }
    const newQuestion: TheoryQuestion = { id: crypto.randomUUID(), question: currentTheoryQuestion.question, marks: currentTheoryQuestion.marks || 5 }
    setTheoryQuestions([...theoryQuestions, newQuestion])
    setCurrentTheoryQuestion({ question: '', marks: 5 })
    toast.success('Theory question added')
  }

  const removeQuestion = (id: string) => setQuestions(questions.filter(q => q.id !== id))
  const removeTheoryQuestion = (id: string) => setTheoryQuestions(theoryQuestions.filter(q => q.id !== id))

  const handleSubmit = async (submitForApproval = false) => {
    if (!examDetails.title || !examDetails.subject || !examDetails.class) {
      toast.error('Please fill in all exam details')
      setActiveTab('details')
      return
    }

    if (questions.length === 0 && !hasTheory) {
      toast.error('Please add at least one question')
      setActiveTab('questions')
      return
    }

    if (hasTheory && theoryQuestions.length === 0) {
      toast.error('Please add at least one theory question')
      setActiveTab('theory')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.email) {
        toast.error('User not authenticated')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, department')
        .eq('email', session.user.email)
        .single()

      const createdBy = profileData?.id || teacherProfile?.id || session.user.id
      const teacherName = profileData?.full_name || teacherProfile?.full_name || session.user.email?.split('@')[0] || 'Teacher'
      const department = profileData?.department || teacherProfile?.department || 'General'

      const examData = {
        title: examDetails.title,
        duration: examDetails.duration || 60,
        subject: examDetails.subject || 'General',
        class: examDetails.class || 'Not Assigned',
        total_questions: questions.length + (hasTheory ? theoryQuestions.length : 0),
        total_marks: 60,
        passing_percentage: examDetails.pass_mark || 50,
        instructions: examDetails.instructions || '',
        has_theory: hasTheory,
        questions: questions,
        theory_questions: hasTheory ? theoryQuestions : null,
        randomize_questions: examDetails.randomize_questions,
        randomize_options: examDetails.randomize_options,
        status: submitForApproval ? 'pending' : 'draft',
        submitted_at: submitForApproval ? new Date().toISOString() : null,
        created_by: createdBy,
        teacher_name: teacherName,
        department: department,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: examResult, error: examError } = await supabase
        .from('exams')
        .insert([examData])
        .select()
        .single()

      if (examError) {
        console.error('Supabase error:', examError)
        toast.error(examError.message || 'Database error')
        return
      }

      const examId = examResult.id
      console.log('✅ Exam created with ID:', examId)
      
      if (submitForApproval) {
        try {
          const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')

          if (admins && admins.length > 0) {
            const notifications = admins.map((admin: any) => ({
              title: '📝 New Exam Pending Approval',
              message: `${examDetails.title} (${examDetails.subject} - ${examDetails.class}) by ${teacherName} is pending approval.`,
              type: 'exam_approval',
              user_id: admin.id,
              exam_id: examId,
              class: examDetails.class,
              subject: examDetails.subject,
              read: false,
              action_url: `/admin?tab=exams`,
              created_at: new Date().toISOString()
            }))

            await supabase.from('notifications').insert(notifications)
            console.log('✅ Admin notifications sent')
          }
        } catch (e) {
          console.log('Notification error (non-critical):', e)
        }
        
        toast.success('Exam submitted for approval!', {
          description: 'Admin will review and publish your exam.'
        })
      } else {
        toast.success('Exam saved as draft!')
      }
      
      onSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      console.error('Error creating exam:', error)
      toast.error(error.message || 'Failed to create exam')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Create New Exam</DialogTitle>
          <DialogDescription>Create a CBT exam with multiple choice questions and optional theory section. Upload DOC, DOCX, PDF, or TXT files.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">1. Details</TabsTrigger>
            <TabsTrigger value="questions" disabled={!examDetails.title}>2. Objective ({questions.length})</TabsTrigger>
            <TabsTrigger value="theory" disabled={!examDetails.title}>3. Theory ({theoryQuestions.length})</TabsTrigger>
            <TabsTrigger value="preview" disabled={questions.length === 0 && theoryQuestions.length === 0}>4. CBT Preview</TabsTrigger>
            <TabsTrigger value="summary" disabled={questions.length === 0 && theoryQuestions.length === 0}>5. Summary</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Exam Title *</Label><Input value={examDetails.title} onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })} placeholder="e.g., First Term Examination" /></div>
              <div><Label>Class *</Label><Select value={examDetails.class} onValueChange={(v) => setExamDetails({ ...examDetails, class: v, subject: '' })}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Subject *</Label><Select value={examDetails.subject} onValueChange={(v) => setExamDetails({ ...examDetails, subject: v })} disabled={!examDetails.class}><SelectTrigger><SelectValue placeholder={examDetails.class ? "Select subject" : "Select class first"} /></SelectTrigger><SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Duration (minutes) *</Label><Input type="number" min="1" max="240" value={examDetails.duration} onChange={(e) => setExamDetails({ ...examDetails, duration: parseInt(e.target.value) || 60 })} /></div>
              <div><Label>Pass Mark (%)</Label><Input type="number" min="0" max="100" value={examDetails.pass_mark} onChange={(e) => setExamDetails({ ...examDetails, pass_mark: parseInt(e.target.value) || 50 })} /></div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <Label className="mb-2 block">Default Mark per Question (Objective = 20 marks total)</Label>
              <RadioGroup value={defaultMark.toString()} onValueChange={(v) => { setDefaultMark(parseFloat(v)); setCurrentQuestion({ ...currentQuestion, marks: parseFloat(v) }) }} className="flex gap-6">
                <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="mark1" /><Label htmlFor="mark1">1 Mark (20 questions)</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="0.5" id="mark05" /><Label htmlFor="mark05">0.5 Mark (40 questions)</Label></div>
              </RadioGroup>
            </div>

            {/* ANTI-CHEATING SETTINGS */}
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-blue-600" />
                Anti-Cheating Settings
              </Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Randomize Question Order</Label>
                  <p className="text-xs text-muted-foreground">
                    Each student gets questions in a different random order
                  </p>
                </div>
                <Switch
                  checked={examDetails.randomize_questions}
                  onCheckedChange={(v) => setExamDetails({ ...examDetails, randomize_questions: v })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Randomize Options (A,B,C,D)</Label>
                  <p className="text-xs text-muted-foreground">
                    Shuffles multiple choice options for each student
                  </p>
                </div>
                <Switch
                  checked={examDetails.randomize_options}
                  onCheckedChange={(v) => setExamDetails({ ...examDetails, randomize_options: v })}
                />
              </div>
              
              <Alert className="mt-2 bg-blue-100 border-blue-300">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-xs">
                  These settings prevent cheating by ensuring no two students see the exact same exam layout.
                </AlertDescription>
              </Alert>
            </div>

            <div><Label>Instructions (Optional)</Label><Textarea value={examDetails.instructions} onChange={(e) => setExamDetails({ ...examDetails, instructions: e.target.value })} placeholder="Enter exam instructions..." rows={3} /></div>
            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('questions')} disabled={!examDetails.title || !examDetails.class || !examDetails.subject}>Next: Add Questions <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </TabsContent>

          {/* OBJECTIVE TAB */}
          <TabsContent value="questions" className="space-y-4 py-4">
            <div className="flex gap-2 border-b pb-3">
              <Button variant={uploadMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('bulk')}><Sparkles className="mr-2 h-4 w-4" />Bulk Paste</Button>
              <Button variant={uploadMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('manual')}><Plus className="mr-2 h-4 w-4" />Manual Entry</Button>
            </div>

            {uploadMode === 'bulk' ? (
              <div className="space-y-4">
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="flex items-center justify-between">
                  <span>Upload DOC, DOCX, PDF, TXT or paste questions.</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={insertObjectiveExample}><Wand2 className="mr-1 h-3 w-3" /> Example</Button>
                    <Button variant="outline" size="sm" onClick={() => downloadTemplate('objective')}><Download className="mr-1 h-3 w-3" /> Template</Button>
                  </div>
                </AlertDescription></Alert>

                <div>
                  <Label>Upload File</Label>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50">
                    {isParsingFile ? <Loader2 className="h-6 w-6 mx-auto animate-spin" /> : <><FileUp className="h-6 w-6 mx-auto mb-1" /><p className="text-sm">Click to upload</p><p className="text-xs">.doc, .docx, .pdf, .txt</p></>}
                  </div>
                </div>

                <div>
                  <Label>Or Paste Questions</Label>
                  <Textarea value={bulkQuestionsText} onChange={(e) => setBulkQuestionsText(e.target.value)} placeholder="1. Question text\nA. Option A\nB. Option B\nC. Option C\nD. Option D\nAnswer: B\nMarks: 0.5" rows={10} className="font-mono text-sm" />
                  <Button onClick={parseBulkQuestions} className="mt-2 w-full"><CheckCheck className="mr-2 h-4 w-4" />Parse & Add</Button>
                </div>
                {parseError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{parseError}</AlertDescription></Alert>}
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Badge className={cn("cursor-pointer", currentQuestion.type === 'mcq' ? "bg-primary" : "bg-muted")} onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'mcq', options: ['', '', '', ''], marks: defaultMark })}>MCQ</Badge>
                  <Badge className={cn("cursor-pointer", currentQuestion.type === 'true_false' ? "bg-primary" : "bg-muted")} onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'true_false', options: ['True', 'False'], marks: defaultMark })}>True/False</Badge>
                </div>
                <div><Label>Question</Label><Textarea value={currentQuestion.question} onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })} rows={3} /></div>
                {currentQuestion.type === 'mcq' && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6">{String.fromCharCode(65 + index)}.</span>
                        <Input value={option} onChange={(e) => { const newOpts = [...(currentQuestion.options || [])]; newOpts[index] = e.target.value; setCurrentQuestion({ ...currentQuestion, options: newOpts }) }} />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <Label>Correct Answer</Label>
                  {currentQuestion.type === 'mcq' ? (
                    <Select value={currentQuestion.correct_answer || undefined} onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, correct_answer: v })}>
                      <SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger>
                      <SelectContent>{currentQuestion.options?.map((opt, i) => opt ? <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</SelectItem> : null)}</SelectContent>
                    </Select>
                  ) : currentQuestion.type === 'true_false' ? (
                    <Select value={currentQuestion.correct_answer || undefined} onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, correct_answer: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="True">True</SelectItem><SelectItem value="False">False</SelectItem></SelectContent>
                    </Select>
                  ) : (
                    <Input value={currentQuestion.correct_answer} onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })} />
                  )}
                </div>
                <div><Label>Marks</Label><Input type="number" step="0.5" min="0.5" value={currentQuestion.marks} onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseFloat(e.target.value) || defaultMark })} /></div>
                <Button onClick={addQuestion} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Question</Button>
              </>
            )}

            {questions.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Added Questions ({questions.length})</Label>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex justify-between p-3 bg-muted rounded-lg">
                      <div><p className="text-sm font-medium">{i + 1}. {q.question}</p><p className="text-xs">{q.type} • {q.marks} mark(s)</p></div>
                      <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab('details')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={() => setActiveTab('theory')}>Next: Theory <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </TabsContent>

          {/* THEORY TAB */}
          <TabsContent value="theory" className="space-y-4 py-4">
            {!hasTheory ? (
              <div className="text-center py-8 space-y-4">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                <div><h3 className="text-lg font-semibold">Theory Questions Disabled</h3><p className="text-muted-foreground">Enable theory questions to add essay-type questions</p></div>
                <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg"><span>Include Theory Questions</span><Switch checked={hasTheory} onCheckedChange={setHasTheory} /></div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('questions')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button onClick={() => setActiveTab('preview')} disabled={questions.length === 0}>Skip to Preview <ChevronRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 border-b pb-3">
                  <Button variant={theoryUploadMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setTheoryUploadMode('bulk')}><Sparkles className="mr-2 h-4 w-4" />Bulk Paste</Button>
                  <Button variant={theoryUploadMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setTheoryUploadMode('manual')}><Plus className="mr-2 h-4 w-4" />Manual Entry</Button>
                </div>

                {theoryUploadMode === 'bulk' ? (
                  <div className="space-y-4">
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="flex items-center justify-between">
                      <span>Upload DOC, DOCX, PDF, TXT or paste theory questions.</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={insertTheoryExample}>Example</Button>
                        <Button variant="outline" size="sm" onClick={() => downloadTemplate('theory')}>Template</Button>
                      </div>
                    </AlertDescription></Alert>

                    <div>
                      <Label>Upload File</Label>
                      <input ref={theoryFileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleTheoryFileUpload} className="hidden" />
                      <div onClick={() => theoryFileInputRef.current?.click()} className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50">
                        {isParsingTheoryFile ? <Loader2 className="h-6 w-6 mx-auto animate-spin" /> : <><FileUp className="h-6 w-6 mx-auto mb-1" /><p className="text-sm">Click to upload</p><p className="text-xs">.doc, .docx, .pdf, .txt</p></>}
                      </div>
                    </div>

                    <div>
                      <Label>Paste Theory Questions</Label>
                      <Textarea value={bulkTheoryText} onChange={(e) => setBulkTheoryText(e.target.value)} placeholder="1. Explain the factors of production.\nMarks: 10" rows={10} className="font-mono text-sm" />
                      <Button onClick={parseBulkTheory} className="mt-2 w-full"><CheckCheck className="mr-2 h-4 w-4" />Parse & Add</Button>
                    </div>
                    {theoryParseError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{theoryParseError}</AlertDescription></Alert>}
                  </div>
                ) : (
                  <>
                    <div><Label>Theory Question</Label><Textarea value={currentTheoryQuestion.question} onChange={(e) => setCurrentTheoryQuestion({ ...currentTheoryQuestion, question: e.target.value })} rows={4} /></div>
                    <div><Label>Marks</Label><Input type="number" min="1" max="100" value={currentTheoryQuestion.marks} onChange={(e) => setCurrentTheoryQuestion({ ...currentTheoryQuestion, marks: parseInt(e.target.value) || 5 })} /></div>
                    <Button onClick={addTheoryQuestion} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Theory Question</Button>
                  </>
                )}

                {theoryQuestions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label>Added Theory Questions ({theoryQuestions.length})</Label>
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {theoryQuestions.map((q, i) => (
                        <div key={q.id} className="flex justify-between p-3 bg-muted rounded-lg">
                          <div><p className="text-sm font-medium">{i + 1}. {q.question}</p><p className="text-xs">{q.marks} marks</p></div>
                          <Button variant="ghost" size="icon" onClick={() => removeTheoryQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('questions')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button onClick={() => setActiveTab('preview')}>Next: CBT Preview <ChevronRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* CBT PREVIEW TAB */}
          <TabsContent value="preview" className="py-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2"><MonitorPlay className="h-5 w-5 text-primary" />Student CBT Preview</h3>
                <p className="text-sm text-muted-foreground">This is exactly how students will see and take this exam</p>
              </div>
              <Button variant="outline" onClick={() => setActiveTab('summary')}>Next: Summary <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <CBTPreview examDetails={examDetails} questions={questions} theoryQuestions={theoryQuestions} hasTheory={hasTheory} defaultMark={defaultMark} />
          </TabsContent>

          {/* SUMMARY TAB */}
          <TabsContent value="summary" className="space-y-4 py-4">
            <Card>
              <CardHeader><CardTitle>Exam Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{examDetails.title || 'Untitled'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Class</p><p className="font-medium">{examDetails.class}</p></div>
                  <div><p className="text-sm text-muted-foreground">Subject</p><p className="font-medium">{examDetails.subject}</p></div>
                  <div><p className="text-sm text-muted-foreground">Duration</p><p className="font-medium">{examDetails.duration} minutes</p></div>
                  <div><p className="text-sm text-muted-foreground">Pass Mark</p><p className="font-medium">{examDetails.pass_mark}%</p></div>
                  <div><p className="text-sm text-muted-foreground">Total Marks</p><p className="font-medium">60</p></div>
                  <div><p className="text-sm text-muted-foreground">Randomize Questions</p><Badge variant={examDetails.randomize_questions ? 'default' : 'outline'}>{examDetails.randomize_questions ? 'Yes' : 'No'}</Badge></div>
                  <div><p className="text-sm text-muted-foreground">Randomize Options</p><Badge variant={examDetails.randomize_options ? 'default' : 'outline'}>{examDetails.randomize_options ? 'Yes' : 'No'}</Badge></div>
                </div>
                <div className="border-t pt-4"><p className="text-sm text-muted-foreground">Objective Questions</p><p className="font-medium">{questions.length} questions</p></div>
                {hasTheory && <div><p className="text-sm text-muted-foreground">Theory Questions</p><p className="font-medium">{theoryQuestions.length} questions</p></div>}
              </CardContent>
            </Card>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab('preview')}><ChevronLeft className="mr-2 h-4 w-4" />Back to Preview</Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}