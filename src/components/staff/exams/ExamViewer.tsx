// components/staff/exams/ExamViewer.tsx - COMPLETE UPDATED WITH ALL BUTTONS LINKED

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, Edit, Send, Calendar, Clock, 
  BookOpen, Award, CheckCircle, AlertCircle, 
  Eye, Loader2, Calculator, Shuffle, RotateCcw,
  Users, FileText, Brain, HelpCircle, Flag, Layers, Image as ImageIcon,
  Database, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

interface TheoryQuestionData {
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

interface Question {
  id: string
  type: string
  question: string
  options?: string[]
  correct_answer?: string
  marks: number
  order: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
  is_draft?: boolean
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
  created_at: string
  description?: string
  instructions?: string
  questions?: Question[]
  total_questions?: number
  total_marks?: number
}

interface ExamViewerProps {
  examId: string
  onBack: () => void
  onEdit: () => void
  onSubmitForApproval: (id: string) => Promise<void>
}

// ============ HELPER FUNCTIONS FOR RENDERING ============

// Convert markdown table to HTML with Tailwind CSS classes
const convertTableToHtml = (tableLines: string[]): string => {
  let html = `
    <div class="overflow-x-auto my-4 shadow-lg rounded-xl border border-gray-200">
      <table class="min-w-full bg-white rounded-xl">
  `
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
      
      let rowClass = ''
      if (isHeader && !hasSeparator) {
        rowClass = 'bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300'
      } else {
        rowClass = 'bg-white hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200'
      }
      
      html += `<tr class="${rowClass}">`
      
      cells.forEach((cell: string, idx: number) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        
        if (isHeader && !hasSeparator) {
          html += `<${tag} class="px-5 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300 last:border-r-0">${cell.trim()}</${tag}>`
        } else {
          html += `<${tag} class="px-5 py-3 text-sm text-gray-600 border-r border-gray-200 last:border-r-0">${cell.trim()}</${tag}>`
        }
      })
      
      html += '</tr>'
      
      if (isHeader && hasSeparator) {
        isHeader = false
      }
    }
  }
  
  html += `
      </table>
    </div>
  `
  
  return html
}

// Enhanced content renderer with proper table detection and Tailwind styling
const renderContent = (text: string) => {
  if (!text) return null
  
  const lines = text.split('\n')
  let tableLines: string[] = []
  let inTable = false
  let tableStartIndex = -1
  let result: JSX.Element[] = []
  let currentIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const isTableRow = line.startsWith('|') && line.includes('|') && line.split('|').length >= 3
    
    if (isTableRow) {
      if (!inTable) {
        inTable = true
        tableStartIndex = i
      }
      tableLines.push(line)
    } else if (inTable && !isTableRow) {
      if (tableLines.length >= 2) {
        const tableHtml = convertTableToHtml(tableLines)
        
        if (tableStartIndex > currentIndex) {
          const beforeText = lines.slice(currentIndex, tableStartIndex).join('\n')
          if (beforeText.trim()) {
            result.push(
              <div key={`text-before-${currentIndex}`} className="whitespace-pre-wrap mb-3">
                {beforeText.split('\n').map((line, idx) => {
                  if (line.match(/^\d+\./)) {
                    return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
                  }
                  if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                    return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
                  }
                  if (line.match(/^\(?[ivx]+\)?\./i)) {
                    return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
                  }
                  if (line === '') return <br key={idx} />
                  return <p key={idx} className="mb-1">{line}</p>
                })}
              </div>
            )
          }
        }
        
        result.push(
          <div key={`table-${currentIndex}`} dangerouslySetInnerHTML={{ __html: tableHtml }} />
        )
        
        currentIndex = i
      }
      inTable = false
      tableLines = []
    }
  }
  
  if (inTable && tableLines.length >= 2) {
    const tableHtml = convertTableToHtml(tableLines)
    
    if (tableStartIndex > currentIndex) {
      const beforeText = lines.slice(currentIndex, tableStartIndex).join('\n')
      if (beforeText.trim()) {
        result.push(
          <div key={`text-before-final`} className="whitespace-pre-wrap mb-3">
            {beforeText.split('\n').map((line, idx) => {
              if (line.match(/^\d+\./)) {
                return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
              }
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
              }
              if (line === '') return <br key={idx} />
              return <p key={idx} className="mb-1">{line}</p>
            })}
          </div>
        )
      }
    }
    
    result.push(
      <div key={`table-final`} dangerouslySetInnerHTML={{ __html: tableHtml }} />
    )
    
    if (currentIndex + tableLines.length < lines.length) {
      const afterText = lines.slice(currentIndex + tableLines.length).join('\n')
      if (afterText.trim()) {
        result.push(
          <div key={`text-after-final`} className="whitespace-pre-wrap mt-3">
            {afterText.split('\n').map((line, idx) => {
              if (line.match(/^\d+\./)) {
                return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
              }
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
              }
              if (line === '') return <br key={idx} />
              return <p key={idx} className="mb-1">{line}</p>
            })}
          </div>
        )
      }
    }
    
    return <>{result}</>
  }
  
  if (result.length > 0) {
    return <>{result}</>
  }
  
  const imageMatch = text.match(/!\[(.*?)\]\((.*?)\)/)
  if (imageMatch) {
    return (
      <div className="my-3">
        <img src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full rounded-lg border mx-auto max-h-[200px] object-contain" />
        {imageMatch[1] && <p className="text-xs text-center text-muted-foreground mt-1">{imageMatch[1]}</p>}
      </div>
    )
  }
  
  if (text.includes('█') || text.includes('▓') || text.includes('▒') || text.includes('░')) {
    return <pre className="font-mono text-xs bg-gray-100 p-2 rounded my-2 whitespace-pre-wrap overflow-x-auto">{text}</pre>
  }
  
  const hasEquation = /[\d\+\-\*\/\(\)=]|x\^2|y\^2|√|∑|∫|π|θ|α|β|γ/.test(text)
  if (hasEquation && !text.includes('<table')) {
    return (
      <span className="font-mono text-sm" dangerouslySetInnerHTML={{ 
        __html: text
          .replace(/x\^2/g, 'x²')
          .replace(/y\^2/g, 'y²')
          .replace(/\n/g, '<br/>')
      }} />
    )
  }
  
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {text.split('\n').map((line, idx) => {
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

// Render sub-questions recursively
const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null
  
  const startCharCode = level === 0 ? 97 : 105
  
  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : 'ml-4 mt-2'}`}>
      <p className="text-xs font-semibold text-purple-700">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="pl-3 border-l-2 border-purple-200">
          <div className="font-medium">
            <span className="text-sm">{String.fromCharCode(startCharCode + idx)}.</span>
            <div className="inline ml-1 text-sm">{renderContent(sq.text)}</div>
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

// Theory Question Card Component
function TheoryQuestionCard({ question, index, marks }: { question: TheoryQuestionData; index: number; marks: number }) {
  return (
    <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0">
            <Brain className="h-3.5 w-3.5 mr-1" /> Theory
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">{marks} marks</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Q{index + 1}
        </Badge>
      </div>
      
      {question.image_url && (
        <div className="mb-4">
          <img 
            src={question.image_url} 
            alt={question.image_caption || 'Question diagram'} 
            className="max-w-full max-h-[250px] rounded-lg border object-contain mx-auto shadow-sm" 
          />
          {question.image_caption && (
            <p className="text-xs text-center text-muted-foreground mt-2 italic">{question.image_caption}</p>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <div className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
          <span className="bg-blue-100 w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
          Question {index + 1}:
        </div>
        <div className="pl-2">
          {renderContent(question.question)}
        </div>
      </div>
      
      {question.sub_questions && question.sub_questions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {renderSubQuestions(question.sub_questions, 0)}
        </div>
      )}
    </div>
  )
}

export function ExamViewer({ examId, onBack, onEdit, onSubmitForApproval }: ExamViewerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [submitting, setSubmitting] = useState(false)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [loadSource, setLoadSource] = useState<'table' | 'jsonb' | 'none'>('none')

  // ============ LOAD EXAM DETAILS - LOADS FROM BOTH SOURCES ============
  const loadExamDetails = useCallback(async () => {
    if (!examId) return
    
    setLoading(true)
    try {
      // Load exam data
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      
      setExam(examData)

      // ✅ FIRST: Try to load questions from the questions table
      let loadedQuestions: Question[] = []
      let source: 'table' | 'jsonb' | 'none' = 'none'
      
      try {
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .is('deleted_at', null)
          .order('order_number', { ascending: true })

        if (!questionsError && questionsData && questionsData.length > 0) {
          // ✅ Loaded from questions table
          loadedQuestions = questionsData.map((q: any) => ({
            id: q.id,
            type: q.type || 'objective',
            question: q.question_text,
            options: q.options || [],
            correct_answer: q.correct_answer || '',
            marks: q.points || 1,
            order: q.order_number || 0,
            sub_questions: q.sub_questions || [],
            image_url: q.image_url,
            image_caption: q.image_caption,
            is_draft: q.is_draft || false
          }))
          source = 'table'
          console.log(`✅ Loaded ${loadedQuestions.length} questions from questions table`)
        }
      } catch (tableError) {
        console.warn('⚠️ Could not load from questions table:', tableError)
      }

      // ✅ SECOND: If no questions from table, try loading from exam.questions JSONB
      if (loadedQuestions.length === 0 && examData.questions && Array.isArray(examData.questions) && examData.questions.length > 0) {
        loadedQuestions = examData.questions.map((q: any, idx: number) => ({
          id: q.id || crypto.randomUUID(),
          type: q.type || 'objective',
          question: q.question || q.question_text || '',
          options: q.options || [],
          correct_answer: q.correct_answer || '',
          marks: q.marks || q.points || 1,
          order: q.order || idx + 1,
          sub_questions: q.sub_questions || [],
          image_url: q.image_url,
          image_caption: q.image_caption,
          is_draft: q.is_draft || false
        }))
        source = 'jsonb'
        console.log(`✅ Loaded ${loadedQuestions.length} questions from exam.questions JSONB`)
      }

      setQuestions(loadedQuestions)
      setLoadSource(source)

      // Get submission count
      const { count } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId)
      
      setSubmissionCount(count || 0)
      
    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam details')
    } finally {
      setLoading(false)
    }
  }, [examId])

  // ============ REFRESH ============
  const handleRefresh = () => {
    loadExamDetails()
    toast.success('Refreshed exam data')
  }

  useEffect(() => {
    loadExamDetails()
  }, [loadExamDetails])

  const handleSubmit = async () => {
    if (!exam) return
    
    if (questions.length === 0) {
      toast.error('Cannot submit an exam with no questions')
      return
    }

    setSubmitting(true)
    try {
      await onSubmitForApproval(examId)
      setExam({ ...exam, status: 'pending' })
      toast.success('Exam submitted for approval')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
          <CheckCircle className="h-3 w-3 mr-1" /> Published
        </Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0">
          <FileText className="h-3 w-3 mr-1" /> Draft
        </Badge>
      default:
        return <Badge variant="outline">{status || 'Draft'}</Badge>
    }
  }

  const formatDate = (date: string) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate totals
  const objectiveQuestions = questions.filter(q => q.type === 'objective' || q.type === 'mcq')
  const theoryQuestionsData = questions.filter(q => q.type === 'theory')
  const objectiveCount = objectiveQuestions.length
  const theoryCount = theoryQuestionsData.length
  const totalQuestions = questions.length
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0)
  const passPercentage = exam?.pass_mark || 50
  const pointsNeeded = Math.ceil((passPercentage / 100) * totalMarks)

  // ============ NAVIGATION HANDLERS ============
  
  // Navigate to submissions page
  const handleViewSubmissions = () => {
    if (!examId) {
      toast.error('Exam ID not found')
      return
    }
    router.push(`/staff/exams/${examId}/submissions`)
  }

  // Navigate to scores page
  const handleEnterScores = () => {
    if (!examId) {
      toast.error('Exam ID not found')
      return
    }
    router.push(`/staff/exams/${examId}/scores`)
  }

  // Navigate to preview page
  const handlePreview = () => {
    if (!examId) {
      toast.error('Exam ID not found')
      return
    }
    router.push(`/staff/exams/${examId}/preview`)
  }

  // Navigate to edit page
  const handleEdit = () => {
    onEdit()
  }

  if (loading) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32 mt-1" /></div>
          </div>
          <div className="flex gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-muted-foreground">Exam not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-bold">{exam.title}</h1>
              {getStatusBadge(exam.status)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {exam.subject} • {exam.class}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Load Source Indicator */}
          {loadSource !== 'none' && (
            <Badge variant="outline" className="text-[10px] bg-blue-50 border-blue-200 text-blue-700 hidden sm:flex items-center gap-1">
              <Database className="h-3 w-3" />
              {loadSource === 'table' ? 'From Table' : 'From JSONB'}
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 sm:h-9 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          
          {/* ✅ SUBMISSIONS BUTTON - Links to submissions page */}
          {(exam.status === 'published' || exam.status === 'pending') && (
            <Button 
              size="sm" 
              onClick={handleViewSubmissions}
              className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 text-xs"
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              Submissions
              {submissionCount > 0 && (
                <Badge className="ml-1.5 bg-white/20 text-white text-[10px]">{submissionCount}</Badge>
              )}
            </Button>
          )}
          
          {exam.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={handleEdit} className="h-8 sm:h-9 text-xs">
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Submit
              </Button>
            </>
          )}
          
          {/* ✅ ENTER SCORES BUTTON - Links to scores page */}
          {exam.status === 'published' && (
            <Button 
              size="sm" 
              onClick={handleEnterScores}
              className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs"
            >
              <Calculator className="h-3.5 w-3.5 mr-1" /> Enter Scores
            </Button>
          )}
          
          {/* ✅ PREVIEW BUTTON - Links to preview page */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreview}
            className="h-8 sm:h-9 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
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
            <p className="text-base sm:text-lg font-bold">{totalMarks}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Total Marks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-3 text-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold">{exam.duration}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-3 text-center">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold">{exam.pass_mark}%</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Pass Mark</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-2.5 sm:p-3">
            <p className="text-[9px] sm:text-xs text-muted-foreground mb-0.5">Points Needed</p>
            <Progress value={passPercentage} className="h-1.5 sm:h-2 mb-1" />
            <p className="text-xs font-medium">Need {pointsNeeded}/{totalMarks} points</p>
          </CardContent>
        </Card>
      </div>

      {/* Question Breakdown */}
      <div className="flex flex-wrap gap-2">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] sm:text-xs">
            📝 Objective: {objectiveCount} questions • {objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)} marks
            {objectiveCount > 0 && ` (${(objectiveQuestions.reduce((sum, q) => sum + q.marks, 0) / objectiveCount).toFixed(1)} pts avg)`}
          </span>
        </div>
        {theoryCount > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] sm:text-xs">
              ✍️ Theory: {theoryCount} questions • {theoryQuestionsData.reduce((sum, q) => sum + q.marks, 0)} marks
              {theoryCount > 0 && ` (${(theoryQuestionsData.reduce((sum, q) => sum + q.marks, 0) / theoryCount).toFixed(1)} pts avg)`}
            </span>
          </div>
        )}
        {submissionCount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400">
              👥 {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {loadSource !== 'none' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2.5 py-1.5 sm:hidden">
            <span className="text-[10px] text-blue-700 dark:text-blue-400">
              📊 {loadSource === 'table' ? 'From Table' : 'From JSONB'}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[280px] sm:max-w-md grid-cols-2 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="questions" className="text-xs sm:text-sm py-1.5">
            Questions ({totalQuestions})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-5 pt-3">
              <CardTitle className="text-base sm:text-lg">Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 sm:px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Created</p><p className="text-xs">{formatDate(exam.created_at)}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Subject</p><p className="text-xs">{exam.subject}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Class</p><p className="text-xs">{exam.class}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Shuffle Questions</p><p className="text-xs">{exam.shuffle_questions ? 'Yes' : 'No'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Shuffle Options</p><p className="text-xs">{exam.shuffle_options ? 'Yes' : 'No'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Submissions</p>
                    <p className="text-xs font-medium text-blue-700">{submissionCount}</p>
                  </div>
                </div>
              </div>
              
              {exam.instructions && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">Instructions</p>
                  <p className="text-xs whitespace-pre-wrap">{exam.instructions}</p>
                </div>
              )}

              {/* ✅ SUBMISSIONS CARD - Links to submissions page */}
              {submissionCount > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      {submissionCount} student{submissionCount !== 1 ? 's' : ''} submitted
                    </p>
                    <p className="text-[10px] text-blue-600">View all scores and grades</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white h-7 text-xs"
                    onClick={handleViewSubmissions}
                  >
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-4 space-y-4">
          {/* Objective Questions Section */}
          {objectiveQuestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-5 pt-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-sm sm:text-base">Objective Questions</CardTitle>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 pb-4 space-y-3">
                {objectiveQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs sm:text-sm font-medium flex-1">
                        {idx + 1}. {q.question}
                      </p>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {q.marks} pt{q.marks !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1 pl-2">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-[11px] sm:text-xs">
                            {String.fromCharCode(65 + optIdx)}. {opt}
                            {opt === q.correct_answer && <CheckCircle className="h-3 w-3 text-green-600 inline ml-1" />}
                          </p>
                        ))}
                      </div>
                    )}
                    {q.is_draft && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 mt-1">
                        📝 Draft
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Theory Questions Section */}
          {theoryQuestionsData.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-5 pt-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Theory Questions
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {theoryQuestionsData.reduce((sum, q) => sum + q.marks, 0)} total marks
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {theoryQuestionsData.length} question{theoryQuestionsData.length !== 1 ? 's' : ''} • Essay type with sub-questions
                </p>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 pb-4 space-y-4">
                {theoryQuestionsData.map((q, idx) => (
                  <TheoryQuestionCard
                    key={q.id}
                    question={q as TheoryQuestionData}
                    index={idx}
                    marks={q.marks}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {totalQuestions === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No questions added to this exam yet</p>
              <p className="text-xs text-muted-foreground mt-1">Questions can be stored in the questions table or as JSONB</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}