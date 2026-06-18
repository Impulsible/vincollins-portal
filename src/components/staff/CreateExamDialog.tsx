// src/components/staff/exams/CreateExamDialog.tsx - COMPLETE WITH BOTH SOURCES SAVING

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
import { Progress } from '@/components/ui/progress'
import {
  Plus, Trash2, Save, Send, Clock, Loader2, FileText, Brain,
  Upload, FileUp, Download, AlertCircle, CheckCheck, Sparkles,
  ChevronLeft, ChevronRight, Eye, MonitorPlay, Shield, Flag, Award,
  Shuffle, Calculator, GraduationCap, BookOpen, Layers, Image as ImageIcon,
  X, Database
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// PDF parser using PDF.js
const parsePDFWithPDFJS = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`
    }
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
    const pdf = await loadingTask.promise
    let fullText = ''
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }
    return fullText.trim()
  } catch (error) {
    throw new Error('Failed to parse PDF document.')
  }
}

// Document parser
const parseDocument = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  if (fileExt === 'txt' || fileExt === 'md') return await file.text()
  if (fileExt === 'docx' || fileExt === 'doc') {
    const mammoth = (await import('mammoth')).default
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  }
  if (fileExt === 'pdf') {
    const arrayBuffer = await file.arrayBuffer()
    return await parsePDFWithPDFJS(arrayBuffer)
  }
  throw new Error('Unsupported file format.')
}

interface Question {
  id: string
  type: string
  question: string
  options?: string[]
  correct_answer: string
  marks: number
}

interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

interface TheoryQuestion {
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teacherProfile: any
}

// Class options
const CLASS_OPTIONS = {
  jss: [
    { value: 'JSS 1', label: 'JSS 1' },
    { value: 'JSS 2', label: 'JSS 2' },
    { value: 'JSS 3', label: 'JSS 3' }
  ],
  general: [
    { value: 'SS1', label: 'SS1 (All Departments)' },
    { value: 'SS2', label: 'SS2 (All Departments)' },
    { value: 'SS3', label: 'SS3 (All Departments)' }
  ],
  science: [
    { value: 'SS1 Science', label: 'SS1 Science' },
    { value: 'SS2 Science', label: 'SS2 Science' },
    { value: 'SS3 Science', label: 'SS3 Science' }
  ],
  arts: [
    { value: 'SS1 Arts', label: 'SS1 Arts' },
    { value: 'SS2 Arts', label: 'SS2 Arts' },
    { value: 'SS3 Arts', label: 'SS3 Arts' }
  ],
  commercial: [
    { value: 'SS1 Commercial', label: 'SS1 Commercial' },
    { value: 'SS2 Commercial', label: 'SS2 Commercial' },
    { value: 'SS3 Commercial', label: 'SS3 Commercial' }
  ]
}

const jssSubjects = [
  'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Christian Religious Studies',
  'Islamic Religious Studies', 'Business Studies', 'Home Economics',
  'Agricultural Science', 'Physical and Health Education', 'Music',
  'Information Technology', 'Cultural and Creative Arts', 'French'
]

const ssSubjects = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science', 'Information Technology', 'Data Processing'
]

// Convert markdown table to HTML with proper styling
const convertTableToHtml = (tableLines: string[]): string => {
  let html = '<div class="overflow-x-auto my-4 shadow-md rounded-lg"><table class="min-w-full bg-white border border-gray-300 rounded-lg">'
  let isHeader = true
  let hasSeparator = false
  
  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false
      hasSeparator = true
      continue
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((cell: string) => cell.trim() !== '')
      if (cells.length === 0) continue
      html += '<tr class="' + (isHeader && !hasSeparator ? 'bg-gray-100' : 'bg-white hover:bg-gray-50') + ' border-b border-gray-300">'
      cells.forEach((cell: string, idx: number) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        const classes = (isHeader && !hasSeparator)
          ? 'px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300 last:border-r-0'
          : 'px-4 py-2 text-sm text-gray-600 border-r border-gray-300 last:border-r-0'
        html += `<${tag} class="${classes}">${cell.trim()}</${tag}>`
      })
      html += '</tr>'
      if (isHeader && hasSeparator) isHeader = false
    }
  }
  html += '</table></div>'
  return html
}

// Enhanced content renderer with proper table and text preservation
const renderContent = (text: string) => {
  if (!text) return null
  
  let processedText = text
  
  // Handle markdown tables
  if (processedText.includes('|') && processedText.includes('---')) {
    const lines = processedText.split('\n')
    const tableLines: string[] = []
    let inTable = false
    
    for (const line of lines) {
      if (line.includes('|') && (line.includes('---') || line.match(/\|.+\|/))) {
        inTable = true
        tableLines.push(line)
      } else if (inTable && line.trim() === '') {
        break
      } else if (inTable && !line.includes('|')) {
        break
      }
    }
    
    if (tableLines.length > 0) {
      const tableHtml = convertTableToHtml(tableLines)
      const nonTableText = processedText.replace(tableLines.join('\n'), '').trim()
      return (
        <div className="space-y-4">
          {nonTableText && (
            <div className="whitespace-pre-wrap font-medium">
              {nonTableText.split('\n').map((line, i) => (
                <p key={i} className="mb-1">{line}</p>
              ))}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
        </div>
      )
    }
  }
  
  return (
    <div className="whitespace-pre-wrap font-medium leading-relaxed">
      {processedText.split('\n').map((line, idx) => {
        if (line.match(/^\d+\./)) {
          return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
        }
        if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
          return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
        }
        if (line.match(/^\(?[ivx]+\)?\./i)) {
          return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
        }
        if (line === '') {
          return <br key={idx} />
        }
        return <p key={idx} className="mb-1">{line}</p>
      })}
    </div>
  )
}

// Enhanced theory parser that preserves ALL text
const smartParseTheoryQuestions = (text: string): TheoryQuestion[] => {
  const questionsList: TheoryQuestion[] = []
  const seenQuestions = new Set<string>()
  
  let normalizedText = text.replace(/\r\n/g, '\n')
  
  // Extract and preserve ALL tables
  const tableMap = new Map<string, string>()
  let tableCounter = 0
  const tableRegex = /(\n\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  normalizedText = normalizedText.replace(tableRegex, (match) => {
    const placeholder = `__TABLE_${tableCounter}__`
    tableMap.set(placeholder, match)
    tableCounter++
    return `\n${placeholder}\n`
  })
  
  const lines = normalizedText.split('\n')
  let currentQuestion: TheoryQuestion | null = null
  let currentContent: string[] = []
  let currentSubQuestions: string[] = []
  let inSubQuestion = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line && !currentQuestion) continue
    
    const questionMatch = line.match(/^(\d+)\.\s+(.*)/)
    
    if (questionMatch) {
      if (currentQuestion && currentContent.length > 0) {
        let questionText = currentContent.join('\n').trim()
        for (const [placeholder, tableHtml] of tableMap.entries()) {
          if (questionText.includes(placeholder)) {
            questionText = questionText.replace(new RegExp(placeholder, 'g'), tableHtml)
          }
        }
        currentQuestion.question = questionText
        if (currentSubQuestions.length > 0) {
          currentQuestion.sub_questions = currentSubQuestions.map(sq => ({
            text: sq,
            marks: Math.floor(10 / currentSubQuestions.length)
          }))
        }
        const questionKey = currentQuestion.question.substring(0, 100)
        if (!seenQuestions.has(questionKey)) {
          seenQuestions.add(questionKey)
          questionsList.push(currentQuestion)
        }
      }
      
      currentQuestion = {
        id: crypto.randomUUID(),
        question: '',
        marks: 10,
        sub_questions: undefined
      }
      currentContent = [questionMatch[2]]
      currentSubQuestions = []
      inSubQuestion = false
    } 
    else if (currentQuestion) {
      const subMatch = line.match(/^([a-z])\.\s+(.*)/i)
      if (subMatch) {
        inSubQuestion = true
        currentSubQuestions.push(subMatch[2])
      } 
      else if (inSubQuestion && line.match(/^[ivx]+\./i)) {
        if (currentSubQuestions.length > 0) {
          const lastIndex = currentSubQuestions.length - 1
          currentSubQuestions[lastIndex] = currentSubQuestions[lastIndex] + '\n  ' + line
        }
      }
      else {
        currentContent.push(line)
      }
    }
  }
  
  if (currentQuestion && currentContent.length > 0) {
    let questionText = currentContent.join('\n').trim()
    for (const [placeholder, tableHtml] of tableMap.entries()) {
      if (questionText.includes(placeholder)) {
        questionText = questionText.replace(new RegExp(placeholder, 'g'), tableHtml)
      }
    }
    currentQuestion.question = questionText
    if (currentSubQuestions.length > 0) {
      currentQuestion.sub_questions = currentSubQuestions.map(sq => ({
        text: sq,
        marks: Math.floor(10 / currentSubQuestions.length)
      }))
    }
    const questionKey = currentQuestion.question.substring(0, 100)
    if (!seenQuestions.has(questionKey)) {
      seenQuestions.add(questionKey)
      questionsList.push(currentQuestion)
    }
  }
  
  return questionsList
}

// Image upload function
const uploadImage = async (file: File, path: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${path}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('exam-assets')
      .upload(filePath, file)
    
    if (uploadError) throw uploadError
    
    const { data: { publicUrl } } = supabase.storage
      .from('exam-assets')
      .getPublicUrl(filePath)
    
    return publicUrl
  } catch (error) {
    console.error('Image upload error:', error)
    return null
  }
}

// CBT Preview Component
function CBTPreview({ examDetails, questions, theoryQuestions, hasTheory }: any) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState((examDetails.duration || 60) * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const allQuestions = useMemo(() => {
    const objQuestions = questions.map((q: Question) => ({ ...q, type: 'objective' as const }))
    const thQuestions = hasTheory ? theoryQuestions.map((q: TheoryQuestion) => ({ ...q, type: 'theory' as const })) : []
    return [...objQuestions, ...thQuestions]
  }, [questions, theoryQuestions, hasTheory])
  
  const currentQuestion = allQuestions[currentIndex]
  const totalQuestions = allQuestions.length
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(theoryAnswers).length

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev: number) => {
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
  }, [isTimerRunning, timeRemaining])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleFlag = (id: string) => {
    setFlaggedQuestions((prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) setCurrentIndex(index)
  }

  const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
    if (!subQuestions || subQuestions.length === 0) return null
    
    const startCharCode = level === 0 ? 97 : 105
    
    return (
      <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : 'ml-4 mt-2'}`}>
        <p className="text-sm font-semibold text-purple-700">
          {level === 0 ? 'Sub-questions:' : 'Parts:'}
        </p>
        {subQuestions.map((sq, idx) => (
          <div key={idx} className="pl-3 border-l-2 border-purple-200">
            <div className="font-medium">
              {String.fromCharCode(startCharCode + idx)}. {renderContent(sq.text)}
              {sq.marks > 0 && <span className="ml-2 text-xs text-muted-foreground">({sq.marks} marks)</span>}
            </div>
            {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
              renderSubQuestions(sq.sub_sub_questions, level + 1)
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-[400px] bg-gray-50 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold truncate">{examDetails.title || 'Untitled Exam'}</h3>
            <p className="text-xs text-blue-100">{examDetails.subject} • {examDetails.class}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 font-mono text-sm font-bold">
              <Clock className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1 mt-2 bg-blue-800" />
        <div className="flex justify-between text-xs text-blue-100 mt-1">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{answeredCount} answered</span>
        </div>
      </div>

      <div className="bg-white border-b p-3 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {allQuestions.map((q: any, idx: number) => {
            const isAnswered = q.type === 'theory' ? !!theoryAnswers[q.id] : !!selectedAnswers[q.id]
            const isCurrent = idx === currentIndex
            return (
              <button
                key={q.id}
                onClick={() => navigateToQuestion(idx)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                  isCurrent ? "ring-2 ring-blue-500 ring-offset-1" : "",
                  q.type === 'theory' 
                    ? (isAnswered ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700 border border-purple-300")
                    : (isAnswered ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 border border-gray-300")
                )}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {currentQuestion && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <Badge variant={currentQuestion.type === 'theory' ? 'secondary' : 'outline'}>
                {currentQuestion.type === 'theory' ? 'Theory' : 'Objective'}
              </Badge>
              <button onClick={() => toggleFlag(currentQuestion.id)} className="p-1">
                <Flag className={cn("h-4 w-4", flaggedQuestions.has(currentQuestion.id) ? "text-amber-500 fill-amber-500" : "text-gray-400")} />
              </button>
            </div>
            
            {currentQuestion.image_url && (
              <div className="mb-4">
                <img src={currentQuestion.image_url} alt="Question diagram" className="max-w-full rounded-lg border mx-auto" />
                {currentQuestion.image_caption && (
                  <p className="text-sm text-center text-muted-foreground mt-1">{currentQuestion.image_caption}</p>
                )}
              </div>
            )}
            
            <div className="font-medium mb-4 bg-white p-6 rounded-lg border shadow-sm">
              <div className="text-lg font-semibold mb-3 text-blue-600">Question {currentIndex + 1}:</div>
              {renderContent(currentQuestion.question)}
            </div>
            
            {currentQuestion.type === 'theory' ? (
              <>
                {currentQuestion.sub_questions && currentQuestion.sub_questions.length > 0 && (
                  renderSubQuestions(currentQuestion.sub_questions, 0)
                )}
                <Alert className="mt-4 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">This question will be graded by your teacher. Be detailed in your answer.</AlertDescription>
                </Alert>
                <Textarea 
                  placeholder="Type your answer here..." 
                  rows={6} 
                  className="w-full mt-4"
                  value={theoryAnswers[currentQuestion.id] || ''}
                  onChange={(e) => setTheoryAnswers({...theoryAnswers, [currentQuestion.id]: e.target.value})}
                />
              </>
            ) : (
              <div className="space-y-3 mt-4">
                {currentQuestion.options?.map((option: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input 
                      type="radio" 
                      name={`q-${currentQuestion.id}`} 
                      className="h-4 w-4"
                      checked={selectedAnswers[currentQuestion.id] === option}
                      onChange={() => setSelectedAnswers({...selectedAnswers, [currentQuestion.id]: option})}
                    />
                    <span className="text-sm">{String.fromCharCode(65 + idx)}. {option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border-t p-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {currentIndex === totalQuestions - 1 ? (
          <Button className="bg-green-600 hover:bg-green-700">
            Submit <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigateToQuestion(currentIndex + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function CreateExamDialog({ open, onOpenChange, onSuccess, teacherProfile }: CreateExamDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [hasTheory, setHasTheory] = useState(false)
  
  // Objective tab states
  const [objectiveUploadMode, setObjectiveUploadMode] = useState<'manual' | 'bulk'>('bulk')
  const [bulkQuestionsText, setBulkQuestionsText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Theory tab states
  const [theoryUploadMode, setTheoryUploadMode] = useState<'manual' | 'smart'>('smart')
  const [bulkTheoryText, setBulkTheoryText] = useState('')
  const [theoryParseError, setTheoryParseError] = useState<string | null>(null)
  const [isParsingTheoryFile, setIsParsingTheoryFile] = useState(false)
  const [parsedTheoryQuestions, setParsedTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [showTheoryPreview, setShowTheoryPreview] = useState(false)
  const theoryFileInputRef = useRef<HTMLInputElement>(null)
  
  // Image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [currentImageCaption, setCurrentImageCaption] = useState('')
  
  const [defaultMark, setDefaultMark] = useState<number>(0.5)
  
  // Flexible scoring states
  const [objectiveMax, setObjectiveMax] = useState(20)
  const [theoryMax, setTheoryMax] = useState(40)
  const [theoryQuestionsTotal, setTheoryQuestionsTotal] = useState(0)
  const [theoryQuestionsToAnswer, setTheoryQuestionsToAnswer] = useState<number | null>(null)
  const [theoryMarksPerQuestion, setTheoryMarksPerQuestion] = useState(10)
  const [scoringRule, setScoringRule] = useState<'standard' | 'best_of' | 'choose_any'>('standard')
  
  const [examDetails, setExamDetails] = useState({
    title: '',
    subject: '',
    class: '',
    duration: 60,
    instructions: '',
    pass_mark: 50,
    randomize_questions: true,
    randomize_options: true,
    term: 'third',
    session_year: '2025/2026'
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
    marks: 10,
    image_url: '',
    image_caption: ''
  })

  const totalObjectiveMarks = questions.reduce((sum: number, q: Question) => sum + (q.marks || 0), 0)
  const totalTheoryMarks = hasTheory ? theoryQuestions.reduce((sum: number, q: TheoryQuestion) => sum + (q.marks || 0), 0) : 0
  const totalMarks = totalObjectiveMarks + totalTheoryMarks

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return []
    return examDetails.class.startsWith('JSS') ? jssSubjects : ssSubjects
  }, [examDetails.class])

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const publicUrl = await uploadImage(file, `exam-images/temp`)
      if (publicUrl) {
        setCurrentImageUrl(publicUrl)
        setCurrentTheoryQuestion(prev => ({ ...prev, image_url: publicUrl }))
        toast.success('Image uploaded successfully')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const removeImage = () => {
    setCurrentImageUrl('')
    setCurrentTheoryQuestion(prev => ({ ...prev, image_url: '', image_caption: '' }))
    setCurrentImageCaption('')
    toast.success('Image removed')
  }

  // Objective Parser
  const parseObjectiveQuestions = (text: string): Question[] => {
    const parsedQuestions: Question[] = []
    const lines = text.split(/\r?\n/)
    let currentQ: Partial<Question> | null = null
    let currentOptions: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const qMatch = line.match(/^(\d+)[\.\)]\s+(.*)/i)
      if (qMatch && !line.match(/^[A-D][\.\)]/i)) {
        if (currentQ && currentOptions.length > 0 && currentQ.correct_answer) {
          parsedQuestions.push({
            id: crypto.randomUUID(),
            type: 'mcq',
            question: currentQ.question || '',
            options: currentOptions,
            correct_answer: currentQ.correct_answer,
            marks: currentQ.marks || defaultMark
          })
        }
        currentQ = { question: qMatch[2], marks: defaultMark }
        currentOptions = []
        continue
      }
      
      const optMatch = line.match(/^([A-D])[\.\)]\s+(.*)/i)
      if (optMatch && currentQ) {
        const idx = optMatch[1].charCodeAt(0) - 65
        currentOptions[idx] = optMatch[2]
        continue
      }
      
      const ansMatch = line.match(/answer:\s*([A-D])/i)
      if (ansMatch && currentQ) {
        const correctLetter = ansMatch[1].toUpperCase()
        const correctIdx = correctLetter.charCodeAt(0) - 65
        currentQ.correct_answer = currentOptions[correctIdx] || correctLetter
        continue
      }
      
      const marksMatch = line.match(/marks?:\s*([\d.]+)/i)
      if (marksMatch && currentQ) {
        currentQ.marks = parseFloat(marksMatch[1])
      }
      
      if (currentQ && !optMatch && !ansMatch && !qMatch) {
        currentQ.question += ' ' + line
      }
    }
    
    if (currentQ && currentOptions.length > 0 && currentQ.correct_answer) {
      parsedQuestions.push({
        id: crypto.randomUUID(),
        type: 'mcq',
        question: currentQ.question || '',
        options: currentOptions,
        correct_answer: currentQ.correct_answer,
        marks: currentQ.marks || defaultMark
      })
    }
    
    return parsedQuestions
  }

  const handleBulkObjectiveParse = () => {
    if (!bulkQuestionsText.trim()) {
      toast.error('Please paste some questions')
      return
    }
    setParseError(null)
    const parsed = parseObjectiveQuestions(bulkQuestionsText)
    if (parsed.length === 0) {
      setParseError('No valid questions found.')
      return
    }
    setQuestions([...questions, ...parsed])
    setBulkQuestionsText('')
    toast.success(`Added ${parsed.length} questions!`)
  }

  const insertObjectiveExample = () => {
    setBulkQuestionsText(`1. What is the capital of Nigeria?\nA. Lagos\nB. Abuja\nC. Kano\nD. Ibadan\nAnswer: B\nMarks: 0.5\n\n2. What is 2 + 2?\nA. 3\nB. 4\nC. 5\nD. 6\nAnswer: B\nMarks: 0.5`)
  }

  const downloadObjectiveTemplate = () => {
    const template = `1. What is the capital of Nigeria?\nA. Lagos\nB. Abuja\nC. Kano\nD. Ibadan\nAnswer: B\nMarks: 0.5`
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'objective_questions.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const handleObjectiveFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          toast.warning('No questions found in file.')
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

  const addManualQuestion = () => {
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

  const removeQuestion = (id: string) => setQuestions(questions.filter((q: Question) => q.id !== id))

  // Smart Theory Parser Handlers
  const handleSmartPaste = () => {
    if (!bulkTheoryText.trim()) {
      toast.error('Please paste your theory questions')
      return
    }
    setTheoryParseError(null)
    const parsed = smartParseTheoryQuestions(bulkTheoryText)
    if (parsed.length === 0) {
      setTheoryParseError('No valid questions found. Please check the format.')
      return
    }
    setParsedTheoryQuestions(parsed)
    setShowTheoryPreview(true)
    toast.success(`Detected ${parsed.length} question(s)`)
  }

  const handleImportTheory = () => {
    if (parsedTheoryQuestions.length === 0) return
    setTheoryQuestions([...theoryQuestions, ...parsedTheoryQuestions])
    setBulkTheoryText('')
    setParsedTheoryQuestions([])
    setShowTheoryPreview(false)
    toast.success(`Added ${parsedTheoryQuestions.length} theory questions`)
  }

  const insertTheoryExample = () => {
    setBulkTheoryText(`1. A trader bought 200 textbooks at ₦750 each. He sold 120 of them at ₦950 each and the remaining ones at ₦850 each.

Sub-questions:
a. Calculate the total cost price of all the textbooks.
b. Calculate the total selling price of all the textbooks.
c. Express the profit as a percentage of the cost price, correct to 1 decimal place.

10 marks

2. Complete the frequency distribution table below for the following scores of 30 students in a Mathematics test:
8, 5, 7, 6, 9, 4, 7, 8, 6, 5, 10, 7, 6, 8, 9, 5, 7, 6, 10, 8, 7, 5, 9, 6, 7, 4, 8, 6, 9, 7

| Score | Tally | Frequency |
|-------|-------|-----------|
| 4     |       |           |
| 5     |       |           |
| 6     |       |           |
| 7     |       |           |
| 8     |       |           |
| 9     |       |           |
| 10    |       |           |

Sub-questions:
a. From your table, state the modal score.
b. Calculate the mean score, correct to 2 decimal places.
c. What is the median score?

10 marks

3. Solve the following equations:
(i) 3x + 7 = 22
(ii) 5y - 8 = 17
(iii) 2a + 3b = 19 when a = 5
(iv) 4(2x - 3) = 20

10 marks

4. In a class of 50 students, 30 study Mathematics, 25 study English, and 8 study neither subject. Using this information:

Sub-questions:
a. Represent the information on a well-labelled Venn diagram.
b. Find the number of students who study both Mathematics and English.
c. Find the number of students who study Mathematics only.
d. Find the number of students who study English only.

10 marks

5. Define and explain the following terms with one example each:

Sub-questions:
a. Rational numbers
b. Irrational numbers
c. Prime numbers
d. Composite numbers
e. Integers

10 marks

6. Using the equation y = 2x + 1:

Sub-questions:
a. Copy and complete the table below:

| x | -2 | -1 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| y |   |   |   |   |   |   |

b. Using a scale of 2 cm to 1 unit on both axes, draw the graph of y = 2x + 1 for -2 ≤ x ≤ 3.
c. From your graph, find the value of y when x = 1.5.
d. From your graph, find the value of x when y = 0.

10 marks`)
  }

  const downloadTheoryTemplate = () => {
    const template = `1. Your question here...

Sub-questions:
a. First sub-question
   i. Sub-sub-question
   ii. Another sub-sub-question
b. Second sub-question

10 marks`
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theory_questions_template.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const handleTheoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsingTheoryFile(true)
    setTheoryParseError(null)
    try {
      const text = await parseDocument(file)
      setBulkTheoryText(text)
      const parsed = smartParseTheoryQuestions(text)
      if (parsed.length > 0) {
        setParsedTheoryQuestions(parsed)
        setShowTheoryPreview(true)
        toast.success(`Detected ${parsed.length} questions from file`)
      } else {
        toast.warning('No questions found in file. Please check the format.')
      }
      if (theoryFileInputRef.current) theoryFileInputRef.current.value = ''
    } catch (error: any) {
      setTheoryParseError(error.message || 'Failed to parse file')
      toast.error(error.message || 'Failed to parse file')
    } finally {
      setIsParsingTheoryFile(false)
    }
  }

  const addManualTheoryQuestion = () => {
    if (!currentTheoryQuestion.question) {
      toast.error('Please enter a question')
      return
    }
    const newQuestion: TheoryQuestion = {
      id: crypto.randomUUID(),
      question: currentTheoryQuestion.question,
      marks: currentTheoryQuestion.marks || 10,
      image_url: currentTheoryQuestion.image_url,
      image_caption: currentTheoryQuestion.image_caption
    }
    setTheoryQuestions([...theoryQuestions, newQuestion])
    setCurrentTheoryQuestion({ question: '', marks: 10, image_url: '', image_caption: '' })
    setCurrentImageUrl('')
    setCurrentImageCaption('')
    toast.success('Theory question added')
  }

  const removeTheoryQuestion = (id: string) => setTheoryQuestions(theoryQuestions.filter((q: TheoryQuestion) => q.id !== id))

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setExamDetails({ 
          title: '', subject: '', class: '', duration: 60, instructions: '', pass_mark: 50,
          randomize_questions: true, randomize_options: true,
          term: 'third',
          session_year: '2025/2026'
        })
        setQuestions([])
        setTheoryQuestions([])
        setHasTheory(false)
        setActiveTab('details')
        setBulkQuestionsText('')
        setBulkTheoryText('')
        setParseError(null)
        setTheoryParseError(null)
        setParsedTheoryQuestions([])
        setShowTheoryPreview(false)
        setDefaultMark(0.5)
        setCurrentImageUrl('')
        setCurrentImageCaption('')
        setObjectiveMax(20)
        setTheoryMax(40)
        setTheoryQuestionsTotal(0)
        setTheoryQuestionsToAnswer(null)
        setTheoryMarksPerQuestion(10)
        setScoringRule('standard')
      }, 300)
    }
    onOpenChange(open)
  }

  // ✅ UPDATED: handleSubmit - Saves to BOTH questions table AND exam.questions JSONB
  const handleSubmit = async (submitForApproval: boolean = false) => {
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

      // ✅ Step 1: Create the exam
      const examData = {
        title: examDetails.title,
        duration: examDetails.duration,
        subject: examDetails.subject,
        class: examDetails.class,
        pass_mark: examDetails.pass_mark,
        instructions: examDetails.instructions,
        randomize_questions: examDetails.randomize_questions,
        randomize_options: examDetails.randomize_options,
        has_theory: hasTheory,
        status: submitForApproval ? 'pending' : 'draft',
        created_by: createdBy,
        teacher_name: teacherName,
        department: department,
        term: examDetails.term || 'third',
        session_year: examDetails.session_year || '2025/2026',
        objective_max: objectiveMax,
        theory_max: hasTheory ? (scoringRule !== 'standard' && theoryQuestionsToAnswer ? theoryQuestionsToAnswer * theoryMarksPerQuestion : theoryQuestionsTotal * theoryMarksPerQuestion) : 0,
        theory_questions_total: theoryQuestionsTotal,
        theory_questions_to_answer: theoryQuestionsToAnswer,
        theory_marks_per_question: theoryMarksPerQuestion,
        scoring_rule: scoringRule,
        total_questions: 0,
        total_marks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: examResult, error: examError } = await supabase
        .from('exams')
        .insert([examData])
        .select()
        .single()

      if (examError) throw examError

      const examId = examResult.id
      console.log('✅ Exam created:', examId)

      // ✅ Step 2: Prepare questions for BOTH storage methods
      let questionsForJsonb: any[] = []

      // Format objective questions for JSONB
      if (questions.length > 0) {
        questionsForJsonb = questions.map((q, idx) => ({
          id: q.id || crypto.randomUUID(),
          type: 'objective',
          question: q.question,
          options: q.options || [],
          correct_answer: q.correct_answer || '',
          marks: q.marks || 1,
          order: idx + 1,
          is_draft: true
        }))
      }

      // Format theory questions for JSONB
      if (hasTheory && theoryQuestions.length > 0) {
        const theoryForJsonb = theoryQuestions.map((q, idx) => ({
          id: q.id || crypto.randomUUID(),
          type: 'theory',
          question: q.question,
          marks: q.marks || 10,
          order: questions.length + idx + 1,
          sub_questions: q.sub_questions || [],
          image_url: q.image_url || null,
          image_caption: q.image_caption || null,
          is_draft: true
        }))
        questionsForJsonb = [...questionsForJsonb, ...theoryForJsonb]
      }

      // ✅ Step 3: Save to questions TABLE
      let tableSavedQuestions: any[] = []
      if (questions.length > 0) {
        console.log(`📝 Saving ${questions.length} objective questions to table...`)
        
        const questionsToInsert = questions.map((q, idx) => ({
          exam_id: examId,
          question_text: q.question,
          question_type: 'mcq',
          type: 'objective',
          options: q.options || [],
          correct_answer: q.correct_answer || '',
          points: q.marks || 1,
          order_number: idx + 1,
          is_draft: true,
          sub_questions: [],
          keywords: [],
          model_answer: '',
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { data: inserted, error: qError } = await supabase
          .from('questions')
          .insert(questionsToInsert)
          .select()

        if (qError) {
          console.error('❌ Error saving questions to table:', qError)
          toast.error('Exam created but questions failed to save to table.')
        } else {
          tableSavedQuestions = inserted || []
          console.log(`✅ Saved ${tableSavedQuestions.length} objective questions to table`)
        }
      }

      // Save theory questions to table
      let tableSavedTheoryQuestions: any[] = []
      if (hasTheory && theoryQuestions.length > 0) {
        console.log(`📝 Saving ${theoryQuestions.length} theory questions to table...`)
        
        const theoryToInsert = theoryQuestions.map((q, idx) => ({
          exam_id: examId,
          question_text: q.question,
          question_type: 'theory',
          type: 'theory',
          points: q.marks || 10,
          order_number: questions.length + idx + 1,
          is_draft: true,
          sub_questions: q.sub_questions || [],
          keywords: [],
          model_answer: '',
          image_url: q.image_url || null,
          image_caption: q.image_caption || null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { data: inserted, error: tError } = await supabase
          .from('questions')
          .insert(theoryToInsert)
          .select()

        if (tError) {
          console.error('❌ Error saving theory questions to table:', tError)
        } else {
          tableSavedTheoryQuestions = inserted || []
          console.log(`✅ Saved ${tableSavedTheoryQuestions.length} theory questions to table`)
        }
      }

      // ✅ Step 4: Save to exam.questions JSONB array
      const allSavedQuestions = [...tableSavedQuestions, ...tableSavedTheoryQuestions]
      const totalQCount = allSavedQuestions.length
      const totalMarksSum = allSavedQuestions.reduce((sum, q) => sum + (q.points || 0), 0)

      // Update the exam with JSONB questions
      const { error: jsonbError } = await supabase
        .from('exams')
        .update({
          questions: questionsForJsonb,
          total_questions: totalQCount,
          total_marks: totalMarksSum,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (jsonbError) {
        console.error('❌ Error saving questions to JSONB:', jsonbError)
        toast.warning('Questions saved to table but JSONB update failed. View might not show all questions.')
      } else {
        console.log(`✅ Saved ${questionsForJsonb.length} questions to exam.questions JSONB`)
      }

      // ✅ Step 5: Also update the table totals (as fallback)
      await supabase
        .from('exams')
        .update({
          total_questions: totalQCount,
          total_marks: totalMarksSum,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)

      // ✅ Success!
      const saveMessage = submitForApproval 
        ? `✅ Exam submitted for approval! ${totalQCount} questions saved (Table + JSONB).`
        : `✅ Exam saved as draft! ${totalQCount} questions saved (Table + JSONB).`
      
      toast.success(saveMessage)
      
      onSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      console.error('❌ Error creating exam:', error)
      toast.error(error.message || 'Failed to create exam')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Create New Exam
          </DialogTitle>
          <DialogDescription>
            Create a CBT exam with objective and optional theory questions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="questions" disabled={!examDetails.title}>Objective ({questions.length})</TabsTrigger>
              <TabsTrigger value="theory" disabled={!examDetails.title}>Theory ({theoryQuestions.length})</TabsTrigger>
              <TabsTrigger value="preview" disabled={questions.length === 0 && theoryQuestions.length === 0}>Preview</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Exam Title *</Label>
                  <Input 
                    value={examDetails.title} 
                    onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })} 
                    placeholder="e.g., Third Term Examination" 
                  />
                </div>
                <div>
                  <Label>Class *</Label>
                  <Select value={examDetails.class} onValueChange={(v) => setExamDetails({ ...examDetails, class: v, subject: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="px-2 py-1 text-xs font-semibold bg-slate-50">📖 Junior Secondary</div>
                      {CLASS_OPTIONS.jss.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      <div className="px-2 py-1 text-xs font-semibold bg-emerald-50 mt-1">📚 All Students</div>
                      {CLASS_OPTIONS.general.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      <div className="px-2 py-1 text-xs font-semibold bg-blue-50 mt-1">🔬 Science</div>
                      {CLASS_OPTIONS.science.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      <div className="px-2 py-1 text-xs font-semibold bg-purple-50 mt-1">🎨 Arts</div>
                      {CLASS_OPTIONS.arts.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      <div className="px-2 py-1 text-xs font-semibold bg-amber-50 mt-1">💼 Commercial</div>
                      {CLASS_OPTIONS.commercial.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Select value={examDetails.subject} onValueChange={(v) => setExamDetails({ ...examDetails, subject: v })} disabled={!examDetails.class}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input 
                    type="number" 
                    value={examDetails.duration} 
                    onChange={(e) => setExamDetails({ ...examDetails, duration: parseInt(e.target.value) || 0 })} 
                    onFocus={(e) => e.target.select()}
                    placeholder="e.g., 60"
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter the exam duration in minutes</p>
                </div>
                <div>
                  <Label>Pass Mark (%)</Label>
                  <Input 
                    type="number" 
                    value={examDetails.pass_mark} 
                    onChange={(e) => setExamDetails({ ...examDetails, pass_mark: parseInt(e.target.value) || 0 })} 
                    onFocus={(e) => e.target.select()}
                    placeholder="e.g., 50"
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Students need this percentage to pass</p>
                </div>
              </div>

              {/* Term and Session */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <Label>Term *</Label>
                  <Select 
                    value={examDetails.term} 
                    onValueChange={(v) => setExamDetails({ ...examDetails, term: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Term</SelectItem>
                      <SelectItem value="second">Second Term</SelectItem>
                      <SelectItem value="third">Third Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Session Year *</Label>
                  <Select 
                    value={examDetails.session_year} 
                    onValueChange={(v) => setExamDetails({ ...examDetails, session_year: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2026/2027">2026/2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Flexible Scoring */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Objective Questions Total Marks</Label>
                  <Input 
                    type="number" 
                    min="0"
                    max="60"
                    value={objectiveMax} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 20
                      setObjectiveMax(Math.min(60, Math.max(0, val)))
                    }} 
                    placeholder="e.g., 20 or 30"
                  />
                </div>
                <div>
                  <Label>Theory Questions Total Marks</Label>
                  <Input 
                    type="number" 
                    min="0"
                    max="60"
                    value={theoryMax} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 40
                      setTheoryMax(Math.min(60, Math.max(0, val)))
                    }} 
                    placeholder="e.g., 40 or 30"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700">
                  📊 Exam Total: {objectiveMax + theoryMax} marks
                  {objectiveMax + theoryMax !== 60 && (
                    <span className="text-amber-600 ml-2">(Recommended: 60 marks)</span>
                  )}
                </p>
              </div>

              {hasTheory && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border">
                  <h4 className="font-semibold text-sm text-purple-800">📝 Theory Scoring Configuration</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Theory Questions</Label>
                      <Input 
                        type="number" 
                        value={theoryQuestionsTotal} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          setTheoryQuestionsTotal(val)
                          if (scoringRule === 'standard') {
                            setTheoryMax(val * theoryMarksPerQuestion)
                          } else if (theoryQuestionsToAnswer) {
                            setTheoryMax(theoryQuestionsToAnswer * theoryMarksPerQuestion)
                          }
                        }} 
                        min={0}
                        max={20}
                      />
                    </div>
                    
                    <div>
                      <Label>Marks per Question</Label>
                      <Input 
                        type="number" 
                        value={theoryMarksPerQuestion} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 10
                          setTheoryMarksPerQuestion(val)
                          if (scoringRule === 'standard') {
                            setTheoryMax(theoryQuestionsTotal * val)
                          } else if (theoryQuestionsToAnswer) {
                            setTheoryMax(theoryQuestionsToAnswer * val)
                          }
                        }} 
                        min={1}
                        max={20}
                        step={1}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Scoring Rule</Label>
                    <RadioGroup 
                      value={scoringRule} 
                      onValueChange={(v) => {
                        setScoringRule(v as any)
                        if (v === 'standard') {
                          setTheoryQuestionsToAnswer(null)
                          setTheoryMax(theoryQuestionsTotal * theoryMarksPerQuestion)
                        }
                      }}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label htmlFor="standard">Answer All Questions</Label>
                        <span className="text-xs text-muted-foreground">(Student answers every question)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="best_of" id="best_of" />
                        <Label htmlFor="best_of">Best N Questions Count</Label>
                        <span className="text-xs text-muted-foreground">(Student answers all, highest N count)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="choose_any" id="choose_any" />
                        <Label htmlFor="choose_any">Choose Any N Questions</Label>
                        <span className="text-xs text-muted-foreground">(Student selects which to answer)</span>
                      </div>
                    </RadioGroup>
                  </div>

                  {(scoringRule === 'best_of' || scoringRule === 'choose_any') && (
                    <div>
                      <Label>Questions to Answer/Count</Label>
                      <Input 
                        type="number" 
                        value={theoryQuestionsToAnswer || ''} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || null
                          setTheoryQuestionsToAnswer(val)
                          if (val && theoryMarksPerQuestion) {
                            setTheoryMax(val * theoryMarksPerQuestion)
                          }
                        }} 
                        min={1}
                        max={theoryQuestionsTotal || 20}
                        placeholder="e.g., 4"
                      />
                    </div>
                  )}

                  <div className="bg-purple-100 rounded-lg p-3 mt-2">
                    <p className="text-sm font-medium text-purple-800">Theory Scoring Summary:</p>
                    <ul className="text-xs text-purple-700 mt-1 space-y-1">
                      <li>• Theory Questions: {theoryQuestionsTotal}</li>
                      <li>• Marks per Question: {theoryMarksPerQuestion}</li>
                      {scoringRule === 'standard' && (
                        <li>• Student must answer all {theoryQuestionsTotal} questions</li>
                      )}
                      {scoringRule === 'best_of' && theoryQuestionsToAnswer && (
                        <li>• Student answers all {theoryQuestionsTotal}, best {theoryQuestionsToAnswer} count</li>
                      )}
                      {scoringRule === 'choose_any' && theoryQuestionsToAnswer && (
                        <li>• Student chooses any {theoryQuestionsToAnswer} out of {theoryQuestionsTotal}</li>
                      )}
                      <li className="font-semibold text-purple-900 mt-1">
                        📊 Theory Max: {scoringRule !== 'standard' && theoryQuestionsToAnswer 
                          ? theoryQuestionsToAnswer * theoryMarksPerQuestion 
                          : theoryQuestionsTotal * theoryMarksPerQuestion} marks
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted/30 rounded-lg">
                <Label className="mb-2 block">Default Mark per Objective Question</Label>
                <RadioGroup value={defaultMark.toString()} onValueChange={(v) => setDefaultMark(parseFloat(v))} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="mark1" /><Label htmlFor="mark1">1 Mark</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="0.5" id="mark05" /><Label htmlFor="mark05">0.5 Mark</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="mark2" /><Label htmlFor="mark2">2 Marks</Label></div>
                </RadioGroup>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <Label className="flex items-center gap-2"><Shuffle className="h-4 w-4" /> Anti-Cheating</Label>
                <div className="flex justify-between items-center">
                  <div><Label>Randomize Questions</Label><p className="text-xs text-muted-foreground">Each student gets random order</p></div>
                  <Switch checked={examDetails.randomize_questions} onCheckedChange={(v) => setExamDetails({ ...examDetails, randomize_questions: v })} />
                </div>
                <div className="flex justify-between items-center">
                  <div><Label>Randomize Options</Label><p className="text-xs text-muted-foreground">Shuffle A,B,C,D options</p></div>
                  <Switch checked={examDetails.randomize_options} onCheckedChange={(v) => setExamDetails({ ...examDetails, randomize_options: v })} />
                </div>
              </div>

              <div>
                <Label>Instructions</Label>
                <Textarea 
                  value={examDetails.instructions} 
                  onChange={(e) => setExamDetails({ ...examDetails, instructions: e.target.value })} 
                  rows={3} 
                  placeholder="Enter exam instructions for students..."
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('questions')}>Next: Add Questions</Button>
              </div>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4 mt-0">
              <div className="flex gap-2 border-b pb-3">
                <Button variant={objectiveUploadMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setObjectiveUploadMode('bulk')}>
                  <Sparkles className="mr-1 h-3 w-3" /> Bulk Import
                </Button>
                <Button variant={objectiveUploadMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setObjectiveUploadMode('manual')}>
                  <Plus className="mr-1 h-3 w-3" /> Manual Add
                </Button>
              </div>

              {objectiveUploadMode === 'bulk' ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>Paste objective questions with options and answers</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={insertObjectiveExample}>Example</Button>
                        <Button variant="outline" size="sm" onClick={downloadObjectiveTemplate}>Template</Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                    {isParsingFile ? <Loader2 className="h-8 w-8 mx-auto animate-spin" /> : <><FileUp className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Upload .doc, .docx, .pdf, or .txt file</p></>}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleObjectiveFileUpload} className="hidden" />
                  
                  <Textarea 
                    value={bulkQuestionsText} 
                    onChange={(e) => setBulkQuestionsText(e.target.value)} 
                    placeholder="1. Question text here...\nA. Option 1\nB. Option 2\nC. Option 3\nD. Option 4\nAnswer: B\nMarks: 0.5" 
                    rows={8} 
                    className="font-mono text-sm"
                  />
                  
                  <Button onClick={handleBulkObjectiveParse} className="w-full">
                    <CheckCheck className="mr-2 h-4 w-4" /> Parse & Add Questions
                  </Button>
                  
                  {parseError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{parseError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Question</Label>
                    <Textarea value={currentQuestion.question} onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {currentQuestion.options?.map((opt: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-8 font-medium">{String.fromCharCode(65 + idx)}.</span>
                        <Input value={opt} onChange={(e) => {
                          const newOpts = [...(currentQuestion.options || [])]
                          newOpts[idx] = e.target.value
                          setCurrentQuestion({ ...currentQuestion, options: newOpts })
                        }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <Select value={currentQuestion.correct_answer} onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, correct_answer: v })}>
                      <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                      <SelectContent>
                        {currentQuestion.options?.map((opt: string, idx: number) => opt && <SelectItem key={idx} value={opt}>{String.fromCharCode(65 + idx)}. {opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Marks</Label>
                    <Input type="number" step="0.5" value={currentQuestion.marks} onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseFloat(e.target.value) || defaultMark })} />
                  </div>
                  <Button onClick={addManualQuestion} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Question</Button>
                </div>
              )}

              {questions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>Added Questions ({questions.length})</Label>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {questions.map((q: Question, i: number) => (
                      <div key={q.id} className="flex justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{i + 1}. {q.question}</p>
                          <p className="text-xs text-muted-foreground">{q.marks} marks</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Theory Tab */}
            <TabsContent value="theory" className="space-y-4 mt-0">
              {!hasTheory ? (
                <div className="text-center py-8 space-y-4">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Theory Questions Disabled</h3>
                    <p className="text-sm text-muted-foreground">Enable theory questions to add essay-type questions</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
                    <span>Include Theory Questions</span>
                    <Switch checked={hasTheory} onCheckedChange={setHasTheory} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 border-b pb-3">
                    <Button variant={theoryUploadMode === 'smart' ? 'default' : 'outline'} size="sm" onClick={() => setTheoryUploadMode('smart')}>
                      <Sparkles className="mr-1 h-3 w-3" /> Smart Paste
                    </Button>
                    <Button variant={theoryUploadMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setTheoryUploadMode('manual')}>
                      <Plus className="mr-1 h-3 w-3" /> Manual Add
                    </Button>
                  </div>

                  {theoryUploadMode === 'smart' ? (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span>Paste your questions with sub-questions (a, b, c). Tables, charts, and formatting are preserved.</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={insertTheoryExample}>Example</Button>
                            <Button variant="outline" size="sm" onClick={downloadTheoryTemplate}>Template</Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                      
                      <div onClick={() => theoryFileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                        {isParsingTheoryFile ? <Loader2 className="h-8 w-8 mx-auto animate-spin" /> : <><FileUp className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Upload .doc, .docx, .pdf, or .txt file</p></>}
                      </div>
                      <input ref={theoryFileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleTheoryFileUpload} className="hidden" />
                      
                      <Textarea 
                        value={bulkTheoryText} 
                        onChange={(e) => setBulkTheoryText(e.target.value)} 
                        placeholder="1. Your question here...\n\nSub-questions:\na. Sub-question 1\n   i. Sub-sub-question\n   ii. Another sub-sub\nb. Sub-question 2\n\n10 marks" 
                        rows={12} 
                        className="font-mono text-sm"
                      />
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSmartPaste} className="flex-1">
                          <Sparkles className="mr-2 h-4 w-4" /> Smart Parse
                        </Button>
                      </div>
                      
                      {theoryParseError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{theoryParseError}</AlertDescription>
                        </Alert>
                      )}

                      {showTheoryPreview && parsedTheoryQuestions.length > 0 && (
                        <div className="border rounded-lg p-4 bg-slate-50 max-h-[500px] overflow-y-auto">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 sticky top-0 bg-slate-50 py-2">
                            <Layers className="h-4 w-4 text-purple-600" />
                            Preview ({parsedTheoryQuestions.length} questions detected)
                          </h4>
                          <div className="space-y-4">
                            {parsedTheoryQuestions.map((q: TheoryQuestion, idx: number) => (
                              <div key={idx} className="p-4 bg-white rounded-lg border shadow-sm">
                                <div className="font-medium">
                                  <span className="text-purple-600 font-bold">{idx + 1}.</span>
                                  <div className="inline ml-1">{renderContent(q.question)}</div>
                                </div>
                                {q.sub_questions && q.sub_questions.length > 0 && (
                                  <div className="ml-6 mt-3 space-y-2">
                                    <p className="text-xs text-purple-600 font-semibold">Sub-questions:</p>
                                    {q.sub_questions.map((sq: TheorySubQuestion, sIdx: number) => (
                                      <div key={sIdx} className="pl-3 border-l-2 border-purple-200">
                                        <div className="text-sm">
                                          <span className="font-medium text-purple-600">{String.fromCharCode(97 + sIdx)}.</span>
                                          <div className="inline ml-1 whitespace-pre-wrap">{renderContent(sq.text)}</div>
                                        </div>
                                        {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
                                          <div className="ml-6 mt-2 space-y-1">
                                            {sq.sub_sub_questions.map((ssq: TheorySubQuestion, ssIdx: number) => (
                                              <div key={ssIdx} className="text-sm text-purple-600">
                                                {String.fromCharCode(105 + ssIdx)}. {renderContent(ssq.text)}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-2 mt-3">
                                  <Badge variant="outline">{q.marks} marks</Badge>
                                  {q.sub_questions && q.sub_questions.length > 0 && (
                                    <Badge variant="outline">{q.sub_questions.length} part(s)</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-4 sticky bottom-0 bg-slate-50 pt-3">
                            <Button variant="outline" onClick={() => setShowTheoryPreview(false)}>Cancel</Button>
                            <Button onClick={handleImportTheory} className="bg-emerald-600 hover:bg-emerald-700">
                              Import {parsedTheoryQuestions.length} Question{parsedTheoryQuestions.length !== 1 ? 's' : ''}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Theory Question</Label>
                        <Textarea 
                          value={currentTheoryQuestion.question} 
                          onChange={(e) => setCurrentTheoryQuestion({ ...currentTheoryQuestion, question: e.target.value })} 
                          rows={4} 
                        />
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <Label className="mb-2 block">Upload Diagram/Chart (Optional)</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="theory-image-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file)
                            }}
                          />
                          <label htmlFor="theory-image-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                              {isUploadingImage ? (
                                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                              ) : (
                                <>
                                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm">Click to upload chart, graph, or diagram</p>
                                  <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, SVG, GIF (max 5MB)</p>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                        
                        {currentTheoryQuestion.image_url && (
                          <div className="mt-4">
                            <div className="relative inline-block">
                              <img 
                                src={currentTheoryQuestion.image_url} 
                                alt="Uploaded diagram" 
                                className="max-w-full max-h-[200px] rounded-lg border object-contain" 
                              />
                              <button
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <Input
                              type="text"
                              placeholder="Image caption (optional)"
                              value={currentTheoryQuestion.image_caption || ''}
                              onChange={(e) => setCurrentTheoryQuestion(prev => ({ ...prev, image_caption: e.target.value }))}
                              className="mt-2 text-sm"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label>Marks</Label>
                        <Input 
                          type="number" 
                          value={currentTheoryQuestion.marks} 
                          onChange={(e) => setCurrentTheoryQuestion({ ...currentTheoryQuestion, marks: parseInt(e.target.value) || 10 })} 
                        />
                      </div>
                      <Button onClick={addManualTheoryQuestion} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Theory Question
                      </Button>
                    </div>
                  )}

                  {theoryQuestions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label>Theory Questions ({theoryQuestions.length})</Label>
                      <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {theoryQuestions.map((q: TheoryQuestion, i: number) => (
                          <div key={q.id} className="flex justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{i + 1}. {q.question.substring(0, 100)}...</p>
                              {q.sub_questions && q.sub_questions.length > 0 && (
                                <p className="text-xs text-purple-600">{q.sub_questions.length} sub-question(s)</p>
                              )}
                              {q.image_url && (
                                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                  <ImageIcon className="h-3 w-3" /> Has image
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">{q.marks} marks</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeTheoryQuestion(q.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0">
              <CBTPreview 
                examDetails={examDetails} 
                questions={questions} 
                theoryQuestions={theoryQuestions} 
                hasTheory={hasTheory} 
              />
            </TabsContent>
          </div>

          <DialogFooter className="flex-shrink-0 p-6 border-t flex gap-2">
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