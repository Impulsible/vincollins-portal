// app/admin/exams/page.tsx - COMPLETE WITH ENHANCED THEORY RENDERING
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, RefreshCw, Eye, CheckCircle, XCircle, FileText,
  Users, ChevronDown, ChevronRight, Brain, AlertCircle,
  Search, Filter, Clock, Award, BookOpen, MonitorPlay,
  ArrowUpDown, LayoutGrid, List, CheckCircle2, GraduationCap,
  Image as ImageIcon, Flag, Layers
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────
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
  type?: string
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  pass_mark?: number
  passing_percentage?: number
  status: string
  created_at: string
  submitted_at: string
  approved_at?: string
  created_by: string
  teacher_name?: string
  department?: string
  instructions?: string
  has_theory?: boolean
  randomize_questions?: boolean
  randomize_options?: boolean
  questions?: any[]
  theory_questions?: TheoryQuestion[]
  target_audience?: string
}

// ─── Helper Functions for Theory Rendering ─────────────────────────────────

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

// Enhanced content renderer with proper table detection
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
        if (line === '') return <br key={idx} />
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

// Detect if a question is a theory question
const isTheoryQuestion = (question: any): boolean => {
  return question.type === 'theory' || 
    question.sub_questions || 
    (question.sub_questions && question.sub_questions.length > 0) ||
    (question.question && (question.question.includes('Sub-questions') || question.question.includes('Sub-questions:'))) ||
    (question.question && question.question.includes('|') && question.question.includes('---'))
}

// Theory Question Card Component
function TheoryQuestionCard({ question, index, marks }: { question: TheoryQuestion; index: number; marks: number }) {
  return (
    <div className="p-5 bg-white rounded-xl border shadow-sm">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-0">
            <Brain className="h-3.5 w-3.5 mr-1" /> Theory
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">{marks} marks</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono">Q{index + 1}</Badge>
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
      
      {/* Student answer area */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-slate-500 mb-2">Student's Answer:</p>
        <div className="h-24 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center">
          <span className="text-xs text-slate-400">Answer area (hidden in preview)</span>
        </div>
      </div>
    </div>
  )
}

// ─── Helper Functions ─────────────────────────────────
const extractYear = (className: string): string => {
  if (!className) return ''
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  if (normalized.includes('JSS1')) return 'JSS 1'
  if (normalized.includes('JSS2')) return 'JSS 2'
  if (normalized.includes('JSS3')) return 'JSS 3'
  if (normalized.includes('SS1')) return 'SS 1'
  if (normalized.includes('SS2')) return 'SS 2'
  if (normalized.includes('SS3')) return 'SS 3'
  return className
}

const getExamDepartment = (exam: Exam): string => {
  if (exam.target_audience && exam.target_audience !== 'all') {
    return exam.target_audience
  }
  if (exam.class?.includes('Science')) return 'Science'
  if (exam.class?.includes('Arts')) return 'Arts'
  if (exam.class?.includes('Commercial')) return 'Commercial'
  return 'All Students'
}

// ─── Constants ────────────────────────────────────────
const CLASS_ORDER = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'All Students', label: '📚 All Students' },
  { value: 'Science', label: '🔬 Science' },
  { value: 'Arts', label: '🎨 Arts' },
  { value: 'Commercial', label: '💼 Commercial' },
]

const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    case 'draft':
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Draft</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getClassColor = (className: string): string => {
  const colors: Record<string, string> = {
    'JSS 1': 'bg-amber-100 text-amber-700',
    'JSS 2': 'bg-rose-100 text-rose-700',
    'JSS 3': 'bg-cyan-100 text-cyan-700',
    'SS 1': 'bg-emerald-100 text-emerald-700',
    'SS 2': 'bg-blue-100 text-blue-700',
    'SS 3': 'bg-purple-100 text-purple-700',
  }
  return colors[className] || 'bg-slate-100 text-slate-600'
}

const getDepartmentBadge = (exam: Exam) => {
  const dept = getExamDepartment(exam)
  const styles: Record<string, string> = {
    'All Students': 'bg-emerald-100 text-emerald-700',
    'Science': 'bg-blue-100 text-blue-700',
    'Arts': 'bg-purple-100 text-purple-700',
    'Commercial': 'bg-amber-100 text-amber-700',
  }
  const icons: Record<string, string> = {
    'All Students': '📚',
    'Science': '🔬',
    'Arts': '🎨',
    'Commercial': '💼',
  }
  return (
    <Badge className={cn("text-[9px] px-1.5 py-0", styles[dept] || 'bg-slate-100')}>
      {icons[dept] || '📖'} {dept}
    </Badge>
  )
}

// ─── Main Component ───────────────────────────────────
export default function AdminExamsPage() {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  
  // Dialogs
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // Question preview
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [examTheoryQuestions, setExamTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      }
    }
    init()
  }, [])

  // ─── Load Exams ─────────────────────────────────────
  const loadExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      const formatted = (data || []).map((exam: any) => ({
        ...exam,
        teacher_name: exam.teacher_name || 'Unknown Teacher',
        department: exam.department || 'General'
      }))

      setExams(formatted)
    } catch (error: any) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadExams() }, [loadExams])

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('exams-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => loadExams())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadExams])

  // ─── Filtered Exams ─────────────────────────────────
  const filteredExams = exams.filter(exam => {
    if (activeTab === 'pending' && !['pending', 'draft', 'submitted'].includes(exam.status)) return false
    if (activeTab === 'published' && exam.status !== 'published') return false
    
    if (selectedClass !== 'all') {
      const examYear = extractYear(exam.class)
      if (examYear !== selectedClass) return false
    }
    
    if (selectedDepartment !== 'all') {
      const examDept = getExamDepartment(exam)
      if (examDept !== selectedDepartment) return false
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        exam.title?.toLowerCase().includes(q) ||
        exam.subject?.toLowerCase().includes(q) ||
        exam.teacher_name?.toLowerCase().includes(q) ||
        exam.class?.toLowerCase().includes(q)
      )
    }
    
    return true
  })

  const groupedExams = filteredExams.reduce((acc, exam) => {
    const yearGroup = extractYear(exam.class)
    if (!acc[yearGroup]) acc[yearGroup] = []
    acc[yearGroup].push(exam)
    return acc
  }, {} as Record<string, Exam[]>)

  const pendingCount = exams.filter(e => ['pending', 'draft', 'submitted'].includes(e.status)).length
  const publishedCount = exams.filter(e => e.status === 'published').length

  // ─── Load Questions ─────────────────────────────────
  const loadExamQuestions = async (exam: Exam) => {
    setLoadingQuestions(true)
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('questions, theory_questions, has_theory')
        .eq('id', exam.id)
        .single()

      if (error) throw error

      const obj = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || [])
      const theory = data.has_theory
        ? (typeof data.theory_questions === 'string' ? JSON.parse(data.theory_questions) : (data.theory_questions || []))
        : []

      setExamQuestions(obj)
      setExamTheoryQuestions(theory)
      setCurrentQuestionIndex(0)
    } catch (err) {
      console.error('Error loading questions:', err)
      toast.error('Failed to load questions')
    } finally {
      setLoadingQuestions(false)
    }
  }

  // ─── Actions ────────────────────────────────────────
  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam)
    loadExamQuestions(exam)
    setShowPreviewDialog(true)
  }

  const handleApprove = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'published', approved_at: new Date().toISOString(), approved_by: profile?.id })
        .eq('id', selectedExam.id)
      if (error) throw error
      toast.success('✅ Exam published successfully!')
      setShowApproveDialog(false)
      setShowPreviewDialog(false)
      setSelectedExam(null)
      loadExams()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setProcessing(false) }
  }

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'draft', rejection_reason: rejectionReason, rejected_at: new Date().toISOString(), rejected_by: profile?.id })
        .eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam sent back for revision')
      setShowRejectDialog(false)
      setShowPreviewDialog(false)
      setRejectionReason('')
      setSelectedExam(null)
      loadExams()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setProcessing(false) }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadExams()
    toast.success('Refreshed')
  }

  // ─── All Questions for Preview ──────────────────────
  const allPreviewQuestions = [
    ...examQuestions.map((q: any) => ({ ...q, type: q.type || 'objective' })),
    ...examTheoryQuestions.map((q: any) => ({ ...q, type: 'theory' }))
  ]
  const currentQuestion = allPreviewQuestions[currentQuestionIndex]

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <MonitorPlay className="h-14 w-14 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 print:space-y-1">
      {/* Header */}
      <div className="no-print">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Exam Approvals</h2>
            <p className="text-sm text-slate-500">{pendingCount} pending • {publishedCount} published</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8 text-xs">
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 no-print">
        {[
          { label: 'Total', value: exams.length, icon: FileText, color: 'text-slate-600 bg-slate-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Published', value: publishedCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Classes', value: Object.keys(groupedExams).length, icon: Users, color: 'text-blue-600 bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-lg p-2.5 text-center border", s.color)}>
            <p className="text-[9px] uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="no-print flex flex-col sm:flex-row gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="h-8">
            <TabsTrigger value="pending" className="text-xs h-7">
              Pending {pendingCount > 0 && <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-amber-500">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs h-7">
              Published {publishedCount > 0 && <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-emerald-500">{publishedCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {CLASS_ORDER.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              {DEPARTMENT_OPTIONS.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={viewMode === 'grouped' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('grouped')} className="h-8 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('list')} className="h-8 text-xs">
            <List className="h-3.5 w-3.5" />
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs w-[150px]" />
          </div>
        </div>
      </div>

      {/* Exam List - Grouped View */}
      {filteredExams.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No exams found</p>
            <p className="text-xs text-slate-400 mt-1">All caught up!</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-3">
          {CLASS_ORDER.map(yearGroup => {
            const classExams = groupedExams[yearGroup]
            if (!classExams?.length) return null
            const isOpen = expandedClass === yearGroup
            return (
              <Card key={yearGroup} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedClass(isOpen ? null : yearGroup)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <Badge className={cn("text-xs", getClassColor(yearGroup))}>{yearGroup}</Badge>
                    <span className="text-sm text-slate-500">{classExams.length} exam{classExams.length > 1 ? 's' : ''}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {classExams.filter(e => e.status === 'pending').length} pending
                  </Badge>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Title</TableHead>
                              <TableHead className="text-xs">Subject</TableHead>
                              <TableHead className="text-xs">Class</TableHead>
                              <TableHead className="text-xs">Audience</TableHead>
                              <TableHead className="text-xs">Teacher</TableHead>
                              <TableHead className="text-xs text-center">Q's</TableHead>
                              <TableHead className="text-xs text-center">Marks</TableHead>
                              <TableHead className="text-xs text-center">Duration</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-xs">Submitted</TableHead>
                              <TableHead className="text-right text-xs">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classExams.map(exam => (
                              <TableRow key={exam.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-medium text-xs">{exam.title}</TableCell>
                                <TableCell className="text-xs">{exam.subject}</TableCell>
                                <TableCell className="text-xs">
                                  <Badge variant="outline" className="text-[9px]">{exam.class}</Badge>
                                </TableCell>
                                <TableCell>{getDepartmentBadge(exam)}</TableCell>
                                <TableCell className="text-xs">{exam.teacher_name}</TableCell>
                                <TableCell className="text-center text-xs">{exam.total_questions}</TableCell>
                                <TableCell className="text-center text-xs">{exam.total_marks}</TableCell>
                                <TableCell className="text-center text-xs">{exam.duration}m</TableCell>
                                <TableCell>{getStatusBadge(exam.status)}</TableCell>
                                <TableCell className="text-xs text-slate-400">{formatDate(exam.submitted_at || exam.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewExam(exam)}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    {activeTab === 'pending' && (
                                      <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"
                                          onClick={() => { setSelectedExam(exam); setShowApproveDialog(true) }}>
                                          <CheckCircle className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                                          onClick={() => { setSelectedExam(exam); setShowRejectDialog(true) }}>
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Audience</TableHead>
                  <TableHead className="text-xs">Teacher</TableHead>
                  <TableHead className="text-xs text-center">Questions</TableHead>
                  <TableHead className="text-xs text-center">Marks</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Submitted</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map(exam => (
                  <TableRow key={exam.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-xs">{exam.title}</TableCell>
                    <TableCell className="text-xs">{exam.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px]">{exam.class}</Badge></TableCell>
                    <TableCell>{getDepartmentBadge(exam)}</TableCell>
                    <TableCell className="text-xs">{exam.teacher_name}</TableCell>
                    <TableCell className="text-center text-xs">{exam.total_questions}</TableCell>
                    <TableCell className="text-center text-xs">{exam.total_marks}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-xs text-slate-400">{formatDate(exam.submitted_at || exam.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewExam(exam)}><Eye className="h-3.5 w-3.5" /></Button>
                        {activeTab === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => { setSelectedExam(exam); setShowApproveDialog(true) }}><CheckCircle className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setSelectedExam(exam); setShowRejectDialog(true) }}><XCircle className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog - WITH ENHANCED THEORY RENDERING */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Exam Preview</DialogTitle>
            <DialogDescription className="text-xs">Student view — answers hidden</DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-slate-400">Title:</span><p className="font-medium">{selectedExam.title}</p></div>
                <div><span className="text-slate-400">Subject:</span><p className="font-medium">{selectedExam.subject}</p></div>
                <div><span className="text-slate-400">Class:</span><p className="font-medium">{selectedExam.class}</p></div>
                <div><span className="text-slate-400">Audience:</span><p className="font-medium">{getExamDepartment(selectedExam)}</p></div>
                <div><span className="text-slate-400">Teacher:</span><p className="font-medium">{selectedExam.teacher_name}</p></div>
                <div><span className="text-slate-400">Questions:</span><p className="font-medium">{selectedExam.total_questions}</p></div>
                <div><span className="text-slate-400">Duration:</span><p className="font-medium">{selectedExam.duration} min</p></div>
              </div>
              {selectedExam.instructions && (
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{selectedExam.instructions}</AlertDescription></Alert>
              )}
              {loadingQuestions ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : allPreviewQuestions.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No questions found</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 p-3 flex flex-wrap gap-1.5 border-b max-h-[200px] overflow-y-auto">
                    {allPreviewQuestions.map((q: any, i: number) => {
                      const isTheory = isTheoryQuestion(q)
                      return (
                        <button key={i} onClick={() => setCurrentQuestionIndex(i)}
                          className={cn("w-7 h-7 rounded text-[10px] font-medium transition-all",
                            isTheory 
                              ? (i === currentQuestionIndex ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200')
                              : (i === currentQuestionIndex ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300')
                          )}>{i + 1}</button>
                      )
                    })}
                  </div>
                  <div className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                    {currentQuestion && (() => {
                      const isTheory = isTheoryQuestion(currentQuestion)
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={cn("text-[10px]", isTheory ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                              {isTheory ? <><Brain className="h-3 w-3 mr-1" />Theory</> : 'Objective'}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{currentQuestion.marks || 1} mark(s)</span>
                          </div>
                          
                          {isTheory ? (
                            <TheoryQuestionCard 
                              question={currentQuestion as TheoryQuestion}
                              index={currentQuestionIndex}
                              marks={currentQuestion.marks || 10}
                            />
                          ) : (
                            <>
                              <p className="text-sm font-medium mb-4">{currentQuestionIndex + 1}. {currentQuestion.question || currentQuestion.question_text}</p>
                              <div className="space-y-2">
                                {(currentQuestion.options || []).filter(Boolean).map((opt: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2 p-2 rounded border text-xs">
                                    <span className="font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="bg-slate-50 p-3 flex justify-between border-t">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0}>← Prev</Button>
                    <span className="text-xs text-slate-400">{currentQuestionIndex + 1}/{allPreviewQuestions.length}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentQuestionIndex(i => Math.min(allPreviewQuestions.length - 1, i + 1))} disabled={currentQuestionIndex === allPreviewQuestions.length - 1}>Next →</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(false)}>Close</Button>
            {selectedExam && activeTab === 'pending' && (
              <>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setShowPreviewDialog(false); setShowRejectDialog(true) }}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                <Button size="sm" className="bg-emerald-600" onClick={() => { setShowPreviewDialog(false); setShowApproveDialog(true) }}><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Exam</DialogTitle>
            <DialogDescription>Publish "{selectedExam?.title}" to {selectedExam?.class} students?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleApprove} disabled={processing} className="bg-emerald-600">
              {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Back for Revision</DialogTitle>
            <DialogDescription>Provide a reason for the teacher</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain what needs to be fixed..." rows={3} className="text-sm" />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowRejectDialog(false); setRejectionReason('') }}>Cancel</Button>
            <Button size="sm" onClick={handleReject} disabled={processing || !rejectionReason.trim()} className="bg-red-600">
              {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Send Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}