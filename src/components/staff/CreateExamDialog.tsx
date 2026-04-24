// components/staff/CreateExamDialog.tsx - COMPLETE WITH AUTO-CALCULATION
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
  Shuffle, Calculator, GraduationCap, BookOpen, Users
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ✅ FIX: PDF parser using PDF.js instead of pdf-parse (permanent fix)
const parsePDFWithPDFJS = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker path (required for pdf.js v3+)
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`
    }
    
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
    const pdf = await loadingTask.promise
    
    let fullText = ''
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText.trim()
  } catch (error) {
    console.error('PDF.js parse error:', error)
    throw new Error('Failed to parse PDF document. Please ensure the file is not corrupted or password protected.')
  }
}

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
      throw new Error('Failed to parse Word document. Please ensure the file is not corrupted.')
    }
  }
  
  if (fileExt === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      // ✅ Use PDF.js instead of pdf-parse
      return await parsePDFWithPDFJS(arrayBuffer)
    } catch (error: any) {
      console.error('PDF parse error:', error)
      throw new Error(error.message || 'Failed to parse PDF document')
    }
  }
  
  throw new Error('Unsupported file format. Please upload .txt, .md, .doc, .docx, or .pdf files.')
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
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(theoryAnswers).length

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
    <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] bg-gray-50 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold truncate">{examDetails.title || 'Untitled Exam'}</h3>
            <p className="text-xs sm:text-sm text-blue-100 truncate">{examDetails.subject} • {examDetails.class}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className={cn("flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-mono text-xs sm:text-sm lg:text-lg font-bold", getTimerColor())}>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              {formatTime(timeRemaining)}
            </div>
            <Badge className="bg-white/20 text-white text-[10px] sm:text-xs"><Award className="h-3 w-3 mr-1" /> Pass: {examDetails.pass_mark || 50}%</Badge>
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="flex justify-between text-[10px] sm:text-xs text-blue-100 mb-1">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2 bg-blue-800" />
        </div>
      </div>

      <div className="bg-white border-b p-2 sm:p-3 overflow-x-auto">
        <div className="flex gap-1 sm:gap-1.5 min-w-max pb-1">
          {allQuestions.map((q, idx) => {
            const questionId = q.id
            const isAnswered = q.type === 'theory' ? !!theoryAnswers[questionId] : !!selectedAnswers[questionId]
            const isFlagged = flaggedQuestions.has(questionId)
            const isCurrent = idx === currentIndex
            return (
              <button key={questionId} onClick={() => navigateToQuestion(idx)} className={cn(
                "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg text-[10px] sm:text-xs font-medium transition-all flex-shrink-0",
                isCurrent ? "ring-2 ring-blue-500 ring-offset-1" : "",
                q.type === 'theory' ? (isAnswered ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700 border border-purple-300")
                  : (isAnswered ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 border border-gray-300"),
                isFlagged && "ring-2 ring-amber-400"
              )}>{idx + 1}</button>
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

      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Badge variant={currentQuestion.type === 'theory' ? 'secondary' : 'outline'} className="text-[10px] sm:text-xs">
                  {currentQuestion.type === 'theory' ? <><Brain className="h-3 w-3 mr-1" /> Theory</> : <>Objective</>}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">{currentQuestion.marks || defaultMark} mark(s)</Badge>
              </div>
              <button onClick={() => toggleFlag(currentQuestion.id)} className={cn("p-1 rounded-lg transition", flaggedQuestions.has(currentQuestion.id) ? "bg-amber-100 text-amber-700" : "hover:bg-gray-100 text-gray-400")}>
                <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
            <h4 className="text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4 lg:mb-6">{currentIndex + 1}. {currentQuestion.type === 'theory' ? (currentQuestion as TheoryQuestion).question : (currentQuestion as Question).question}</h4>
            {currentQuestion.type === 'theory' ? (
              <div>
                <Alert className="mb-3 sm:mb-4 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-[11px] sm:text-sm">This question will be graded by your teacher. Be detailed in your answer.</AlertDescription>
                </Alert>
                <Textarea value={theoryAnswers[currentQuestion.id] || ''} onChange={(e) => handleTheoryAnswerChange(currentQuestion.id, e.target.value)} placeholder="Type your answer here..." rows={4} className="w-full text-sm" />
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {(currentQuestion as Question).options?.map((option, idx) => (
                  <label key={idx} className={cn(
                    "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-all",
                    selectedAnswers[currentQuestion.id] === option ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  )}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={selectedAnswers[currentQuestion.id] === option}
                      onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                      className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    />
                    <span className="text-xs sm:text-sm flex-1">
                      <span className="font-medium mr-1 sm:mr-2">{String.fromCharCode(65 + idx)}.</span> {option}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border-t p-3 sm:p-4 flex justify-between items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigateToQuestion(currentIndex - 1)} disabled={currentIndex === 0} className="h-8 sm:h-9 text-xs sm:text-sm">
          <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Prev
        </Button>
        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3 hidden sm:block" /> Secure Mode</div>
        {currentIndex === totalQuestions - 1 ? (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9 text-xs sm:text-sm"><CheckCheck className="mr-1 h-3 w-3" /> Submit</Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigateToQuestion(currentIndex + 1)} className="h-8 sm:h-9 text-xs sm:text-sm">Next <ChevronRight className="ml-1 h-3 w-3" /></Button>
        )}
      </div>
      {examDetails.instructions && (
        <div className="bg-blue-50 p-3 sm:p-4 border-t border-blue-200">
          <p className="text-[11px] sm:text-sm text-blue-800 font-medium mb-1">Instructions:</p>
          <p className="text-[10px] sm:text-xs text-blue-700 whitespace-pre-line">{examDetails.instructions}</p>
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

  // ✅ AUTO-CALCULATION - Calculate totals dynamically
  const totalObjectiveMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0)
  const totalTheoryMarks = hasTheory ? theoryQuestions.reduce((sum, q) => sum + (q.marks || 0), 0) : 0
  const totalMarks = totalObjectiveMarks + totalTheoryMarks
  const totalQuestionsCount = questions.length + (hasTheory ? theoryQuestions.length : 0)

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

      // ✅ AUTO-CALCULATE totals from questions
      let objectiveCount = 0
      let objectiveMarks = 0
      questions.forEach(q => {
        objectiveCount++
        objectiveMarks += q.marks || 0
      })

      let theoryCount = 0
      let theoryMarks = 0
      if (hasTheory) {
        theoryQuestions.forEach(q => {
          theoryCount++
          theoryMarks += q.marks || 0
        })
      }

      const totalQuestionsCount = objectiveCount + theoryCount
      const totalMarksSum = objectiveMarks + theoryMarks

      // Build questions array for JSONB storage
      const questionsArray: any[] = []
      
      questions.forEach((q, idx) => {
        questionsArray.push({
          id: crypto.randomUUID(),
          type: 'mcq',
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks,
          order: idx + 1
        })
      })
      
      if (hasTheory) {
        theoryQuestions.forEach((q, idx) => {
          questionsArray.push({
            id: crypto.randomUUID(),
            type: 'theory',
            question: q.question,
            marks: q.marks,
            order: objectiveCount + idx + 1
          })
        })
      }

      const examData = {
        title: examDetails.title,
        duration: examDetails.duration,
        subject: examDetails.subject,
        class: examDetails.class,
        total_questions: totalQuestionsCount,
        total_marks: totalMarksSum,
        pass_mark: examDetails.pass_mark,
        instructions: examDetails.instructions,
        randomize_questions: examDetails.randomize_questions,
        randomize_options: examDetails.randomize_options,
        has_theory: hasTheory,
        status: submitForApproval ? 'pending' : 'draft',
        questions: questionsArray,
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

      if (examError) throw examError

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
              exam_id: examResult.id,
              class: examDetails.class,
              subject: examDetails.subject,
              read: false,
              action_url: `/admin?tab=exams`,
              created_at: new Date().toISOString()
            }))
            await supabase.from('notifications').insert(notifications)
          }
        } catch (e) {
          console.log('Notification error (non-critical):', e)
        }
        
        toast.success(`Exam submitted for approval! Total: ${totalMarksSum} marks from ${totalQuestionsCount} questions.`)
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
      <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Create New Exam
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create a CBT exam with objective and optional theory questions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-6 flex-shrink-0 overflow-x-auto">
            <TabsList className="grid w-full min-w-[500px] sm:min-w-0 grid-cols-5">
              <TabsTrigger value="details" className="text-xs sm:text-sm px-2">Details</TabsTrigger>
              <TabsTrigger value="questions" disabled={!examDetails.title} className="text-xs sm:text-sm px-2">
                Objective ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="theory" disabled={!examDetails.title} className="text-xs sm:text-sm px-2">
                Theory ({theoryQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={questions.length === 0 && theoryQuestions.length === 0} className="text-xs sm:text-sm px-2">
                Preview
              </TabsTrigger>
              <TabsTrigger value="summary" disabled={questions.length === 0 && theoryQuestions.length === 0} className="text-xs sm:text-sm px-2">
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium">Exam Title *</Label>
                  <Input value={examDetails.title} onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })} placeholder="e.g., First Term Examination" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Class *</Label>
                  <Select value={examDetails.class} onValueChange={(v) => setExamDetails({ ...examDetails, class: v, subject: '' })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject *</Label>
                  <Select value={examDetails.subject} onValueChange={(v) => setExamDetails({ ...examDetails, subject: v })} disabled={!examDetails.class}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder={examDetails.class ? "Select subject" : "Select class first"} /></SelectTrigger>
                    <SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration (minutes) *</Label>
                  <Input type="number" min="1" max="240" value={examDetails.duration} onChange={(e) => setExamDetails({ ...examDetails, duration: parseInt(e.target.value) || 60 })} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Pass Mark (%)</Label>
                  <Input type="number" min="0" max="100" value={examDetails.pass_mark} onChange={(e) => setExamDetails({ ...examDetails, pass_mark: parseInt(e.target.value) || 50 })} className="mt-1.5" />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Default Mark per Objective Question</Label>
                <RadioGroup value={defaultMark.toString()} onValueChange={(v) => { setDefaultMark(parseFloat(v)); setCurrentQuestion({ ...currentQuestion, marks: parseFloat(v) }) }} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="mark1" /><Label htmlFor="mark1">1 Mark each</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="0.5" id="mark05" /><Label htmlFor="mark05">0.5 Mark each</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="mark2" /><Label htmlFor="mark2">2 Marks each</Label></div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-2">
                  {questions.length} objective questions × {defaultMark} = {questions.length * defaultMark} marks
                </p>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2"><Shuffle className="h-4 w-4 text-blue-600" /> Anti-Cheating Settings</Label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div><Label className="text-sm">Randomize Question Order</Label><p className="text-xs text-muted-foreground">Each student gets questions in random order</p></div>
                  <Switch checked={examDetails.randomize_questions} onCheckedChange={(v) => setExamDetails({ ...examDetails, randomize_questions: v })} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div><Label className="text-sm">Randomize Options</Label><p className="text-xs text-muted-foreground">Shuffles A,B,C,D options for each student</p></div>
                  <Switch checked={examDetails.randomize_options} onCheckedChange={(v) => setExamDetails({ ...examDetails, randomize_options: v })} />
                </div>
              </div>

              <div><Label className="text-sm font-medium">Instructions</Label><Textarea value={examDetails.instructions} onChange={(e) => setExamDetails({ ...examDetails, instructions: e.target.value })} placeholder="Enter exam instructions..." rows={3} className="mt-1.5" /></div>
              
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('questions')} disabled={!examDetails.title || !examDetails.class || !examDetails.subject}>Next: Add Questions <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </TabsContent>

            {/* Objective Questions Tab */}
            <TabsContent value="questions" className="space-y-4 mt-0">
              <div className="flex gap-2 border-b pb-3">
                <Button variant={uploadMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('bulk')}><Sparkles className="mr-1 h-3 w-3" />Bulk</Button>
                <Button variant={uploadMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('manual')}><Plus className="mr-1 h-3 w-3" />Manual</Button>
              </div>

              {uploadMode === 'bulk' ? (
                <div className="space-y-4">
                  <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                    <span>Upload or paste objective questions</span>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={insertObjectiveExample}>Example</Button><Button variant="outline" size="sm" onClick={() => downloadTemplate('objective')}>Template</Button></div>
                  </AlertDescription></Alert>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                    {isParsingFile ? <Loader2 className="h-8 w-8 mx-auto animate-spin" /> : <><FileUp className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Click to upload (.doc, .docx, .pdf, .txt)</p></>}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
                  <Textarea value={bulkQuestionsText} onChange={(e) => setBulkQuestionsText(e.target.value)} placeholder="1. Question\nA. Option A\nB. Option B\nC. Option C\nD. Option D\nAnswer: B\nMarks: 0.5" rows={8} className="font-mono text-sm" />
                  <Button onClick={parseBulkQuestions} className="w-full"><CheckCheck className="mr-2 h-4 w-4" />Parse & Add</Button>
                  {parseError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{parseError}</AlertDescription></Alert>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge className={cn("cursor-pointer", currentQuestion.type === 'mcq' ? "bg-primary" : "bg-muted")} onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'mcq', options: ['', '', '', ''], marks: defaultMark })}>MCQ</Badge>
                    <Badge className={cn("cursor-pointer", currentQuestion.type === 'true_false' ? "bg-primary" : "bg-muted")} onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'true_false', options: ['True', 'False'], marks: defaultMark })}>True/False</Badge>
                  </div>
                  <div><Label>Question</Label><Textarea value={currentQuestion.question} onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })} rows={3} /></div>
                  {currentQuestion.type === 'mcq' && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2"><span className="w-6">{String.fromCharCode(65 + index)}.</span><Input value={option} onChange={(e) => { const newOpts = [...(currentQuestion.options || [])]; newOpts[index] = e.target.value; setCurrentQuestion({ ...currentQuestion, options: newOpts }) }} /></div>
                      ))}
                    </div>
                  )}
                  <div><Label>Correct Answer</Label>
                    {currentQuestion.type === 'mcq' ? (
                      <Select value={currentQuestion.correct_answer || undefined} onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, correct_answer: v })}>
                        <SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger>
                        <SelectContent>{currentQuestion.options?.map((opt, i) => opt ? <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</SelectItem> : null)}</SelectContent>
                      </Select>
                    ) : (
                      <Select value={currentQuestion.correct_answer || undefined} onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, correct_answer: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="True">True</SelectItem><SelectItem value="False">False</SelectItem></SelectContent>
                      </Select>
                    )}
                  </div>
                  <div><Label>Marks</Label><Input type="number" step="0.5" min="0.5" value={currentQuestion.marks} onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseFloat(e.target.value) || defaultMark })} /></div>
                  <Button onClick={addQuestion} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Question</Button>
                </div>
              )}

              {questions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>Added Questions ({questions.length})</Label>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{i + 1}. {q.question}</p><p className="text-xs text-muted-foreground">{q.marks} mark(s)</p></div>
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => setActiveTab('details')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button onClick={() => setActiveTab('theory')}>Next: Theory <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </TabsContent>

            {/* Theory Tab */}
            <TabsContent value="theory" className="space-y-4 mt-0">
              {!hasTheory ? (
                <div className="text-center py-8 space-y-4">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div><h3 className="text-lg font-semibold">Theory Questions Disabled</h3><p className="text-sm text-muted-foreground">Enable theory questions to add essay-type questions</p></div>
                  <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg"><span>Include Theory Questions</span><Switch checked={hasTheory} onCheckedChange={setHasTheory} /></div>
                  <div className="flex justify-between pt-4"><Button variant="outline" onClick={() => setActiveTab('questions')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button><Button onClick={() => setActiveTab('preview')} disabled={questions.length === 0}>Skip to Preview <ChevronRight className="ml-2 h-4 w-4" /></Button></div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 border-b pb-3">
                    <Button variant={theoryUploadMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setTheoryUploadMode('bulk')}><Sparkles className="mr-1 h-3 w-3" />Bulk</Button>
                    <Button variant={theoryUploadMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setTheoryUploadMode('manual')}><Plus className="mr-1 h-3 w-3" />Manual</Button>
                  </div>

                  {theoryUploadMode === 'bulk' ? (
                    <div className="space-y-4">
                      <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                        <span>Upload or paste theory questions</span>
                        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={insertTheoryExample}>Example</Button><Button variant="outline" size="sm" onClick={() => downloadTemplate('theory')}>Template</Button></div>
                      </AlertDescription></Alert>
                      <div onClick={() => theoryFileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                        {isParsingTheoryFile ? <Loader2 className="h-8 w-8 mx-auto animate-spin" /> : <><FileUp className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Click to upload (.doc, .docx, .pdf, .txt)</p></>}
                      </div>
                      <input ref={theoryFileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleTheoryFileUpload} className="hidden" />
                      <Textarea value={bulkTheoryText} onChange={(e) => setBulkTheoryText(e.target.value)} placeholder="1. Explain the importance of education.\nMarks: 10" rows={8} className="font-mono text-sm" />
                      <Button onClick={parseBulkTheory} className="w-full"><CheckCheck className="mr-2 h-4 w-4" />Parse & Add</Button>
                      {theoryParseError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{theoryParseError}</AlertDescription></Alert>}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div><Label>Theory Question</Label><Textarea value={currentTheoryQuestion.question} onChange={(e) => setCurrentTheoryQuestion({ ...currentTheoryQuestion, question: e.target.value })} rows={4} /></div>
                      <div><Label>Marks</Label><Input type="number" min="1" max="100" value={currentTheoryQuestion.marks} onChange={(e) => setCurrentTheoryQuestion({ ...currentTheoryQuestion, marks: parseInt(e.target.value) || 5 })} /></div>
                      <Button onClick={addTheoryQuestion} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Theory Question</Button>
                    </div>
                  )}

                  {theoryQuestions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label>Theory Questions ({theoryQuestions.length})</Label>
                      <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {theoryQuestions.map((q, i) => (
                          <div key={q.id} className="flex justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{i + 1}. {q.question}</p><p className="text-xs text-muted-foreground">{q.marks} marks</p></div>
                            <Button variant="ghost" size="icon" onClick={() => removeTheoryQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setActiveTab('questions')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                    <Button onClick={() => setActiveTab('preview')}>Next: Preview <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0">
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div><h3 className="text-lg font-semibold flex items-center gap-2"><MonitorPlay className="h-5 w-5 text-primary" />Student CBT Preview</h3><p className="text-sm text-muted-foreground">How students will see this exam</p></div>
                <Button variant="outline" onClick={() => setActiveTab('summary')}>Next: Summary <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <CBTPreview examDetails={examDetails} questions={questions} theoryQuestions={theoryQuestions} hasTheory={hasTheory} defaultMark={defaultMark} />
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 mt-0">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-emerald-600" />Exam Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{examDetails.title || 'Untitled'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Class</p><p className="font-medium">{examDetails.class}</p></div>
                    <div><p className="text-sm text-muted-foreground">Subject</p><p className="font-medium">{examDetails.subject}</p></div>
                    <div><p className="text-sm text-muted-foreground">Duration</p><p className="font-medium">{examDetails.duration} minutes</p></div>
                    <div><p className="text-sm text-muted-foreground">Pass Mark</p><p className="font-medium">{examDetails.pass_mark}%</p></div>
                    <div className="bg-emerald-50 p-3 rounded-lg"><p className="text-sm text-emerald-700 font-semibold">Total Marks</p><p className="text-2xl font-bold text-emerald-700">{totalMarks}</p></div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Objective Questions</span>
                      <span className="text-sm font-bold">{questions.length} questions • {totalObjectiveMarks} marks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: totalMarks > 0 ? (totalObjectiveMarks / totalMarks) * 100 : 0 }} />
                    </div>
                  </div>
                  
                  {hasTheory && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Theory Questions</span>
                        <span className="text-sm font-bold">{theoryQuestions.length} questions • {totalTheoryMarks} marks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: totalMarks > 0 ? (totalTheoryMarks / totalMarks) * 100 : 0 }} />
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-slate-50 p-4 rounded-lg mt-2">
                    <h4 className="font-semibold text-sm mb-2">Settings</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Randomize Questions:</span><Badge variant={examDetails.randomize_questions ? 'default' : 'outline'}>{examDetails.randomize_questions ? 'Yes' : 'No'}</Badge>
                      <span>Randomize Options:</span><Badge variant={examDetails.randomize_options ? 'default' : 'outline'}>{examDetails.randomize_options ? 'Yes' : 'No'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab('preview')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              </div>
            </TabsContent>
          </div>

          <DialogFooter className="flex-shrink-0 p-4 sm:p-6 border-t flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Draft
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit for Approval
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}