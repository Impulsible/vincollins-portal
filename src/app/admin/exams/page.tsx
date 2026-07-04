// app/admin/exams/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Search, Clock, CheckCircle2, MonitorPlay,
  LayoutGrid, List, GraduationCap, BookOpen, Award,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Filter, Sparkles, TrendingUp, Shield,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
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

// ── Content rendering ──────────────────────────────────────────────────────────
const convertTableToHtml = (tableLines: string[]): string => {
  let html = `<div class="overflow-x-auto my-3 rounded-xl border border-gray-200 shadow-sm"><table class="min-w-full bg-white">`
  let isHeader = true
  let hasSeparator = false
  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) { isHeader = false; hasSeparator = true; continue }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((c: string) => c.trim() !== '')
      if (!cells.length) continue
      const rowClass = isHeader && !hasSeparator
        ? 'bg-slate-100 border-b-2 border-slate-300'
        : 'bg-white hover:bg-slate-50 border-b border-slate-200'
      html += `<tr class="${rowClass}">`
      cells.forEach((cell: string) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        const cls = isHeader && !hasSeparator
          ? 'px-4 py-2.5 text-left text-xs font-semibold text-slate-700 border-r border-slate-300 last:border-r-0'
          : 'px-4 py-2 text-xs text-slate-600 border-r border-slate-200 last:border-r-0'
        html += `<${tag} class="${cls}">${cell.trim()}</${tag}>`
      })
      html += '</tr>'
      if (isHeader && hasSeparator) isHeader = false
    }
  }
  html += '</table></div>'
  return html
}

const renderContent = (text: string): JSX.Element | null => {
  if (!text) return null
  const lines = text.split('\n')
  let tableLines: string[] = []
  let inTable = false
  let tableStartIndex = -1
  const result: JSX.Element[] = []
  let currentIndex = 0

  const renderTextLines = (textBlock: string, key: string) => (
    <div key={key} className="whitespace-pre-wrap mb-2">
      {textBlock.split('\n').map((line, idx) => {
        if (line.match(/^\d+\./)) return <p key={idx} className="mb-1.5 font-semibold text-blue-700 text-sm">{line}</p>
        if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) return <p key={idx} className="mb-1 ml-4 text-slate-700 text-sm">{line}</p>
        if (line.match(/^\(?[ivx]+\)?\./i)) return <p key={idx} className="mb-1 ml-8 text-violet-600 text-sm">{line}</p>
        if (line === '') return <br key={idx} />
        return <p key={idx} className="mb-1 text-sm text-slate-700">{line}</p>
      })}
    </div>
  )

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const isTableRow = line.startsWith('|') && line.split('|').length >= 3
    if (isTableRow) {
      if (!inTable) { inTable = true; tableStartIndex = i }
      tableLines.push(line)
    } else if (inTable) {
      if (tableLines.length >= 2) {
        if (tableStartIndex > currentIndex) {
          const before = lines.slice(currentIndex, tableStartIndex).join('\n')
          if (before.trim()) result.push(renderTextLines(before, `t-${currentIndex}`))
        }
        result.push(<div key={`tbl-${currentIndex}`} dangerouslySetInnerHTML={{ __html: convertTableToHtml(tableLines) }} />)
        currentIndex = i
      }
      inTable = false; tableLines = []
    }
  }

  if (inTable && tableLines.length >= 2) {
    if (tableStartIndex > currentIndex) {
      const before = lines.slice(currentIndex, tableStartIndex).join('\n')
      if (before.trim()) result.push(renderTextLines(before, `t-final-before`))
    }
    result.push(<div key="tbl-final" dangerouslySetInnerHTML={{ __html: convertTableToHtml(tableLines) }} />)
    return <>{result}</>
  }

  if (result.length > 0) return <>{result}</>

  return (
    <div className="text-sm leading-relaxed">
      {text.split('\n').map((line, idx) => {
        if (line.match(/^\d+\./)) return <p key={idx} className="mb-1.5 font-semibold text-blue-700">{line}</p>
        if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) return <p key={idx} className="mb-1 ml-4 text-slate-700">{line}</p>
        if (line.match(/^\(?[ivx]+\)?\./i)) return <p key={idx} className="mb-1 ml-8 text-violet-600">{line}</p>
        if (line === '') return <br key={idx} />
        return <p key={idx} className="mb-1 text-slate-700">{line}</p>
      })}
    </div>
  )
}

const renderSubQuestions = (subs: TheorySubQuestion[], level = 0): JSX.Element | null => {
  if (!subs?.length) return null
  const startChar = level === 0 ? 97 : 105
  return (
    <div className={cn('space-y-2', level > 0 ? 'ml-6 mt-1.5' : 'ml-3 mt-2')}>
      <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">
        {level === 0 ? 'Sub-questions' : 'Parts'}
      </p>
      {subs.map((sq, idx) => (
        <div key={idx} className="pl-3 border-l-2 border-violet-200">
          <div className="flex items-start gap-1.5">
            <span className="text-sm font-semibold text-slate-600 shrink-0">
              {String.fromCharCode(startChar + idx)}.
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm">{renderContent(sq.text)}</div>
              {sq.marks > 0 && (
                <span className="inline-block mt-0.5 text-[10px] text-slate-400 font-medium">
                  ({sq.marks} mark{sq.marks !== 1 ? 's' : ''})
                </span>
              )}
              {sq.sub_sub_questions?.length ? renderSubQuestions(sq.sub_sub_questions, level + 1) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const isTheoryQ = (q: any) =>
  q.type === 'theory' || !!q.sub_questions ||
  q.question?.includes('Sub-questions') ||
  (q.question?.includes('|') && q.question?.includes('---'))

// ── Theory question card ───────────────────────────────────────────────────────
function TheoryQuestionCard({ question, index }: { question: TheoryQuestion; index: number }) {
  return (
    <div className="space-y-3">
      {question.image_url && (
        <div className="my-2 text-center">
          <img src={question.image_url} alt={question.image_caption || 'diagram'}
            className="max-w-full max-h-52 rounded-xl border object-contain mx-auto shadow-sm" />
          {question.image_caption && (
            <p className="text-[11px] text-center text-slate-400 mt-1 italic">{question.image_caption}</p>
          )}
        </div>
      )}
      <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
        {renderContent(question.question)}
      </div>
      {question.sub_questions?.length ? (
        <div className="pt-1">{renderSubQuestions(question.sub_questions)}</div>
      ) : null}
      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-[11px] text-slate-400 text-center font-medium">Answer area — hidden in preview</p>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const extractYear = (cls: string): string => {
  if (!cls) return ''
  const n = cls.trim().toUpperCase().replace(/\s/g, '')
  if (n.includes('JSS1')) return 'JSS 1'
  if (n.includes('JSS2')) return 'JSS 2'
  if (n.includes('JSS3')) return 'JSS 3'
  if (n.includes('SS1')) return 'SS 1'
  if (n.includes('SS2')) return 'SS 2'
  if (n.includes('SS3')) return 'SS 3'
  return cls
}

const getExamDept = (exam: Exam): string => {
  if (exam.target_audience && exam.target_audience !== 'all') return exam.target_audience
  if (exam.class?.includes('Science')) return 'Science'
  if (exam.class?.includes('Arts')) return 'Arts'
  if (exam.class?.includes('Commercial')) return 'Commercial'
  return 'All Students'
}

const CLASS_ORDER = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const DEPT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'All Students', label: 'All Students' },
  { value: 'Science', label: 'Science' },
  { value: 'Arts', label: 'Arts' },
  { value: 'Commercial', label: 'Commercial' },
]

const formatDate = (d: string) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatDateShort = (d: string) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const classColors: Record<string, { bg: string; text: string; ring: string }> = {
  'JSS 1': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
  'JSS 2': { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
  'JSS 3': { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200' },
  'SS 1':  { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  'SS 2':  { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
  'SS 3':  { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
}

const ClassBadge = ({ cls }: { cls: string }) => {
  const year = extractYear(cls)
  const c = classColors[year] || { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1', c.bg, c.text, c.ring)}>
      {cls}
    </span>
  )
}

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  published: { label: 'Published', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  pending:   { label: 'Pending',   icon: Clock,        cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  draft:     { label: 'Draft',     icon: FileText,     cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  submitted: { label: 'Submitted', icon: Clock,        cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  rejected:  { label: 'Rejected',  icon: XCircle,      cls: 'bg-red-50 text-red-600 border border-red-200' },
}

const StatusPill = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] || { label: status, icon: FileText, cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cfg.cls)}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

const DeptPill = ({ exam }: { exam: Exam }) => {
  const dept = getExamDept(exam)
  const map: Record<string, string> = {
    'All Students': 'bg-teal-50 text-teal-700 border-teal-200',
    'Science':      'bg-blue-50 text-blue-700 border-blue-200',
    'Arts':         'bg-violet-50 text-violet-700 border-violet-200',
    'Commercial':   'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', map[dept] || 'bg-slate-100 text-slate-600 border-slate-200')}>
      {dept}
    </span>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, icon: Icon, iconCls, valueCls, onClick, active,
}: {
  label: string; value: number; icon: any; iconCls: string
  valueCls?: string; onClick?: () => void; active?: boolean
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full text-left p-4 rounded-2xl border bg-white hover:shadow-md transition-all duration-200',
      active ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10' : 'border-slate-200/80 shadow-sm',
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={cn('text-2xl font-bold', valueCls || 'text-slate-900')}>{value}</p>
      </div>
      <div className={cn('p-2.5 rounded-xl shrink-0', iconCls)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </button>
)

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminExamsPage() {
  const [loading, setLoading]       = useState(true)
  const [exams, setExams]           = useState<Exam[]>([])
  const [profile, setProfile]       = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [activeTab, setActiveTab]             = useState<'pending' | 'published'>('pending')
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedClass, setSelectedClass]     = useState('all')
  const [selectedDept, setSelectedDept]       = useState('all')
  const [viewMode, setViewMode]               = useState<'grouped' | 'list'>('grouped')
  const [expandedClass, setExpandedClass]     = useState<string | null>(null)

  // Dialogs
  const [selectedExam, setSelectedExam]         = useState<Exam | null>(null)
  const [showPreview, setShowPreview]           = useState(false)
  const [showApprove, setShowApprove]           = useState(false)
  const [showReject, setShowReject]             = useState(false)
  const [rejectionReason, setRejectionReason]   = useState('')
  const [processing, setProcessing]             = useState(false)

  // Questions
  const [examQs, setExamQs]           = useState<any[]>([])
  const [theoryQs, setTheoryQs]       = useState<TheoryQuestion[]>([])
  const [loadingQs, setLoadingQs]     = useState(false)
  const [currentQIdx, setCurrentQIdx] = useState(0)

  // ── Init ────────────────────────────────────────────────────────────────────
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

  // ── Load exams ───────────────────────────────────────────────────────────────
  const loadExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams').select('*')
        .order('created_at', { ascending: false }).limit(200)
      if (error) throw error
      setExams((data || []).map((e: any) => ({
        ...e,
        teacher_name: e.teacher_name || 'Unknown Teacher',
        department: e.department || 'General',
      })))
    } catch (err: any) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadExams() }, [loadExams])

  useEffect(() => {
    const ch = supabase.channel('exams-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, loadExams)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadExams])

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filtered = exams.filter(exam => {
    if (activeTab === 'pending' && !['pending', 'draft', 'submitted'].includes(exam.status)) return false
    if (activeTab === 'published' && exam.status !== 'published') return false
    if (selectedClass !== 'all' && extractYear(exam.class) !== selectedClass) return false
    if (selectedDept !== 'all' && getExamDept(exam) !== selectedDept) return false
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

  const grouped = filtered.reduce((acc, exam) => {
    const yr = extractYear(exam.class)
    if (!acc[yr]) acc[yr] = []
    acc[yr].push(exam)
    return acc
  }, {} as Record<string, Exam[]>)

  const pendingCount   = exams.filter(e => ['pending', 'draft', 'submitted'].includes(e.status)).length
  const publishedCount = exams.filter(e => e.status === 'published').length

  // ── Load questions ───────────────────────────────────────────────────────────
  const loadQs = async (exam: Exam) => {
    setLoadingQs(true)
    try {
      const { data, error } = await supabase
        .from('exams').select('questions, theory_questions, has_theory').eq('id', exam.id).single()
      if (error) throw error
      const obj = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || [])
      const thy = data.has_theory
        ? (typeof data.theory_questions === 'string' ? JSON.parse(data.theory_questions) : (data.theory_questions || []))
        : []
      setExamQs(obj)
      setTheoryQs(thy)
      setCurrentQIdx(0)
    } catch { toast.error('Failed to load questions') }
    finally { setLoadingQs(false) }
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  const openPreview = (exam: Exam) => { setSelectedExam(exam); loadQs(exam); setShowPreview(true) }

  const handleApprove = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams')
        .update({ status: 'published', approved_at: new Date().toISOString(), approved_by: profile?.id })
        .eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam published successfully')
      setShowApprove(false); setShowPreview(false); setSelectedExam(null)
      loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams')
        .update({ status: 'draft', review_notes: rejectionReason, reviewed_at: new Date().toISOString(), approved_by: profile?.id })
        .eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam sent back for revision')
      setShowReject(false); setShowPreview(false); setRejectionReason(''); setSelectedExam(null)
      loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  const allQs = [
    ...examQs.map((q: any) => ({ ...q, type: q.type || 'objective' })),
    ...theoryQs.map((q: any) => ({ ...q, type: 'theory' })),
  ]
  const currentQ = allQs[currentQIdx]

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading exams…</p>
      </div>
    )
  }

  // ── Shared row actions ───────────────────────────────────────────────────────
  const RowActions = ({ exam }: { exam: Exam }) => (
    <div className="flex items-center justify-end gap-1.5">
      <button onClick={() => openPreview(exam)}
        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        title="Preview">
        <Eye className="h-3.5 w-3.5 text-slate-600" />
      </button>
      {activeTab === 'pending' && (
        <>
          <button
            onClick={() => { setSelectedExam(exam); setShowApprove(true) }}
            className="h-7 w-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
            title="Approve">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          </button>
          <button
            onClick={() => { setSelectedExam(exam); setShowReject(true) }}
            className="h-7 w-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
            title="Reject">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Exam Approvals</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {pendingCount} pending review · {publishedCount} published
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={async () => { setRefreshing(true); await loadExams(); toast.success('Refreshed') }}
            disabled={refreshing} className="border-slate-200 h-8 text-xs shrink-0">
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Exams" value={exams.length}
            icon={FileText} iconCls="bg-slate-100 text-slate-600" />
          <StatCard label="Pending Review" value={pendingCount}
            icon={Clock} iconCls="bg-amber-100 text-amber-600" valueCls="text-amber-700"
            onClick={() => setActiveTab('pending')} active={activeTab === 'pending'} />
          <StatCard label="Published" value={publishedCount}
            icon={CheckCircle2} iconCls="bg-emerald-100 text-emerald-600" valueCls="text-emerald-700"
            onClick={() => setActiveTab('published')} active={activeTab === 'published'} />
          <StatCard label="Class Groups" value={Object.keys(grouped).length}
            icon={GraduationCap} iconCls="bg-blue-100 text-blue-600" valueCls="text-blue-700" />
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Tab pills */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {(['pending', 'published'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'pending' && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                  {tab === 'published' && publishedCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      {publishedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 mx-1">
              <Filter className="h-3.5 w-3.5" />
            </div>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[110px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Classes</SelectItem>
                {CLASS_ORDER.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[140px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                {DEPT_OPTIONS.map(d => <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* View mode */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              <button onClick={() => setViewMode('grouped')}
                className={cn('p-1.5 rounded-lg transition-all', viewMode === 'grouped' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600')}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exams…"
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* ── Exam list ──────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No exams found</p>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'pending' ? 'All exams are reviewed 🎉' : 'No published exams yet'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-3">
            {CLASS_ORDER.map(yr => {
              const cls = grouped[yr]
              if (!cls?.length) return null
              const isOpen = expandedClass === yr
              const c = classColors[yr] || { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' }
              const pendingInClass = cls.filter(e => e.status === 'pending').length
              return (
                <div key={yr} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedClass(isOpen ? null : yr)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', c.bg)}>
                        <GraduationCap className={cn('h-4 w-4', c.text)} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">{yr}</p>
                        <p className="text-xs text-slate-400">
                          {cls.length} exam{cls.length !== 1 ? 's' : ''}
                          {pendingInClass > 0 && ` · ${pendingInClass} pending`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingInClass > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold border border-amber-200">
                          {pendingInClass} pending
                        </span>
                      )}
                      <div className={cn('p-1 rounded-lg transition-all', isOpen ? 'bg-slate-100' : '')}>
                        {isOpen
                          ? <ChevronDown className="h-4 w-4 text-slate-500" />
                          : <ChevronRightIcon className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                                {['Title','Subject','Class','Audience','Teacher','Qs','Marks','Time','Status','Date',''].map((h, i) => (
                                  <TableHead key={i} className={cn('text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5', i >= 5 && i <= 7 ? 'text-center' : i === 10 ? 'text-right pr-4' : '')}>
                                    {h}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cls.map(exam => (
                                <TableRow key={exam.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                  <TableCell className="font-semibold text-xs text-slate-800 max-w-[160px] truncate py-3">{exam.title}</TableCell>
                                  <TableCell className="text-xs text-slate-600">{exam.subject}</TableCell>
                                  <TableCell><ClassBadge cls={exam.class} /></TableCell>
                                  <TableCell><DeptPill exam={exam} /></TableCell>
                                  <TableCell className="text-xs text-slate-600">{exam.teacher_name}</TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-700">{exam.total_questions}</TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-700">{exam.total_marks}</TableCell>
                                  <TableCell className="text-center text-xs text-slate-600">{exam.duration}m</TableCell>
                                  <TableCell><StatusPill status={exam.status} /></TableCell>
                                  <TableCell className="text-xs text-slate-400">{formatDateShort(exam.submitted_at || exam.created_at)}</TableCell>
                                  <TableCell className="text-right pr-4"><RowActions exam={exam} /></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{filtered.length} exams</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    {['Title','Subject','Class','Audience','Teacher','Qs','Marks','Status','Date',''].map((h, i) => (
                      <TableHead key={i} className={cn('text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5', i === 9 ? 'text-right pr-4' : '')}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(exam => (
                    <TableRow key={exam.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                      <TableCell className="font-semibold text-xs text-slate-800 max-w-[180px] truncate py-3">{exam.title}</TableCell>
                      <TableCell className="text-xs text-slate-600">{exam.subject}</TableCell>
                      <TableCell><ClassBadge cls={exam.class} /></TableCell>
                      <TableCell><DeptPill exam={exam} /></TableCell>
                      <TableCell className="text-xs text-slate-600">{exam.teacher_name}</TableCell>
                      <TableCell className="text-center text-xs font-medium">{exam.total_questions}</TableCell>
                      <TableCell className="text-center text-xs font-medium">{exam.total_marks}</TableCell>
                      <TableCell><StatusPill status={exam.status} /></TableCell>
                      <TableCell className="text-xs text-slate-400">{formatDateShort(exam.submitted_at || exam.created_at)}</TableCell>
                      <TableCell className="text-right pr-4"><RowActions exam={exam} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── Preview dialog ──────────────────────────────────────────────── */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
            {selectedExam && (
              <>
                {/* Dialog header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{selectedExam.title}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <ClassBadge cls={selectedExam.class} />
                        <DeptPill exam={selectedExam} />
                        <StatusPill status={selectedExam.status} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Exam meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Subject', value: selectedExam.subject, icon: BookOpen },
                      { label: 'Teacher', value: selectedExam.teacher_name, icon: Users },
                      { label: 'Duration', value: `${selectedExam.duration} min`, icon: Clock },
                      { label: 'Questions', value: selectedExam.total_questions, icon: FileText },
                      { label: 'Total Marks', value: selectedExam.total_marks, icon: Award },
                      { label: 'Pass Mark', value: selectedExam.passing_percentage ? `${selectedExam.passing_percentage}%` : (selectedExam.pass_mark || '—'), icon: Shield },
                      { label: 'Has Theory', value: selectedExam.has_theory ? 'Yes' : 'No', icon: Brain },
                      { label: 'Randomise', value: selectedExam.randomize_questions ? 'Yes' : 'No', icon: Sparkles },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Icon className="h-3 w-3" />{label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>

                  {selectedExam.instructions && (
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{selectedExam.instructions}</p>
                    </div>
                  )}

                  {/* Question navigator */}
                  {loadingQs ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                      <p className="text-sm text-slate-400">Loading questions…</p>
                    </div>
                  ) : allQs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No questions found</div>
                  ) : (
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                      {/* Question grid */}
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                        {allQs.map((q, i) => {
                          const isT = isTheoryQ(q)
                          return (
                            <button key={i} onClick={() => setCurrentQIdx(i)}
                              className={cn(
                                'w-7 h-7 rounded-lg text-[11px] font-semibold transition-all',
                                i === currentQIdx
                                  ? isT ? 'bg-violet-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md'
                                  : isT ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300',
                              )}>
                              {i + 1}
                            </button>
                          )
                        })}
                      </div>

                      {/* Legend */}
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span className="w-3 h-3 rounded bg-slate-300 inline-block" />Objective
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span className="w-3 h-3 rounded bg-violet-200 inline-block" />Theory
                        </span>
                      </div>

                      {/* Question display */}
                      <div className="p-5 min-h-[280px] max-h-[420px] overflow-y-auto">
                        {currentQ && (() => {
                          const isT = isTheoryQ(currentQ)
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                                  isT ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200',
                                )}>
                                  {isT ? <Brain className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                                  {isT ? 'Theory' : 'Objective'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {currentQ.marks || (isT ? 10 : 1)} mark{(currentQ.marks || 1) !== 1 ? 's' : ''}
                                </span>
                                <span className="text-[11px] text-slate-400 ml-auto">
                                  Q{currentQIdx + 1} of {allQs.length}
                                </span>
                              </div>

                              {isT ? (
                                <TheoryQuestionCard question={currentQ as TheoryQuestion} index={currentQIdx} />
                              ) : (
                                <div className="space-y-3">
                                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-sm font-medium text-slate-800">
                                      {currentQIdx + 1}. {currentQ.question || currentQ.question_text}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    {(currentQ.options || []).filter(Boolean).map((opt: string, i: number) => (
                                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="text-sm text-slate-700">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Navigation footer */}
                      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() => setCurrentQIdx(i => Math.max(0, i - 1))}
                          disabled={currentQIdx === 0}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </button>
                        <span className="text-xs text-slate-400 font-medium">
                          {currentQIdx + 1} / {allQs.length}
                        </span>
                        <button
                          onClick={() => setCurrentQIdx(i => Math.min(allQs.length - 1, i + 1))}
                          disabled={currentQIdx === allQs.length - 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Next <ChevronRightIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="border-slate-200 h-8 text-xs">
                    Close
                  </Button>
                  {activeTab === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                        onClick={() => { setShowPreview(false); setShowReject(true) }}>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />Reject
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-xs"
                        onClick={() => { setShowPreview(false); setShowApprove(true) }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Approve & Publish
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Approve dialog ──────────────────────────────────────────────── */}
        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                Approve Exam
              </DialogTitle>
              <DialogDescription className="text-sm">
                Publish <strong>&ldquo;{selectedExam?.title}&rdquo;</strong> to{' '}
                <strong>{selectedExam?.class}</strong> students? Students will immediately be able to take it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowApprove(false)} className="border-slate-200 text-xs h-8">
                Cancel
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-8">
                {processing && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Approve & Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reject dialog ───────────────────────────────────────────────── */}
        <Dialog open={showReject} onOpenChange={setShowReject}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                Send Back for Revision
              </DialogTitle>
              <DialogDescription className="text-sm">
                Provide a reason — the teacher will see this.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain what needs to be fixed…"
              rows={3}
              className="text-sm border-slate-200 focus-visible:ring-red-500"
            />
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowReject(false); setRejectionReason('') }}
                className="border-slate-200 text-xs h-8">
                Cancel
              </Button>
              <Button size="sm" onClick={handleReject} disabled={processing || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs h-8">
                {processing && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Send Back
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}