// app/admin/exams/page.tsx - FULLY DARK MODE
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Users, ChevronDown, AlertCircle,
  Search, Clock, CheckCircle2,
  LayoutGrid, List, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Sparkles, Shield,
  RotateCcw, Edit3, Archive, Send, User, Trash2,
  X, PenTool, HelpCircle, Hash,
  Timer, Target, Layers, Hourglass, Plus
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
  is_published?: boolean
  is_active?: boolean
  is_archived?: boolean
  published_at?: string
  published_by?: string
  starts_at?: string
  term?: string
  session_year?: string
  created_at: string
  submitted_at: string
  created_by: string
  teacher_name?: string
  instructions?: string
  has_theory?: boolean
  randomize_questions?: boolean
  target_audience?: string
  questions?: any[]
  theory_questions?: TheoryQuestion[]
}

interface Student {
  id: string
  full_name: string
  class: string
  admission_number?: string
}

// ✅ ends_at REMOVED — not a real column on exam_attempts
interface ExamAttempt {
  id: string
  student_id: string
  exam_id: string
  status: string
  score?: number
  started_at?: string
  submitted_at?: string
  extra_time_minutes?: number
  extra_time_updated_at?: string | null
  is_auto_submitted?: boolean | null
  created_at?: string
  profiles?: {
    full_name: string
    class: string
    admission_number?: string
  }
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

/**
 * Statuses that can NEVER be extended. If an attempt reaches one of these,
 * granting extra time would corrupt the result (flip a submitted exam back
 * to in_progress). This guard runs in BOTH the handler and the dialog.
 */
const TERMINAL_ATTEMPT_STATUSES = [
  'completed',
  'pending_theory',
  'graded',
  'terminated',
  'submitted',
] as const

const isAttemptExtendable = (a: ExamAttempt): boolean =>
  a.status === 'in_progress' && a.is_auto_submitted !== true

const isAttemptTerminal = (a: ExamAttempt): boolean =>
  (TERMINAL_ATTEMPT_STATUSES as readonly string[]).includes(String(a.status))

const formatDateShort = (d: string) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (d: string) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleString('en-NG', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

/**
 * ✅ Derive effective end time from started_at + duration + extra_time_minutes.
 * Never read `ends_at` from DB — it doesn't exist.
 */
const computeEffectiveEndMs = (
  startedAt: string | undefined,
  durationMinutes: number,
  extraMinutes: number,
): number | null => {
  if (!startedAt) return null
  const startMs = new Date(startedAt).getTime()
  if (!Number.isFinite(startMs)) return null
  const dur = Math.max(0, Number(durationMinutes) || 0)
  const extra = Math.max(0, Number(extraMinutes) || 0)
  return startMs + (dur + extra) * 60_000
}

const fetchCurrentTerm = async (): Promise<{ term: string; session_year: string }> => {
  const { data, error } = await supabase
    .from('terms').select('term_code, session_year').eq('is_current', true).maybeSingle()
  if (error || !data?.term_code) throw new Error('No current term set.')
  return { term: data.term_code, session_year: data.session_year }
}

const normTerm = (t?: string | null) => {
  const s = (t || '').toLowerCase().replace(/term/g, '').trim()
  return ({ '1st': 'first', '2nd': 'second', '3rd': 'third' } as Record<string, string>)[s] || s
}

const isCurrentTerm = (exam: Exam, current: { term: string; session_year: string } | null): boolean => {
  if (!current) return true
  if (!exam.term || !exam.session_year) return true
  return normTerm(exam.term) === normTerm(current.term) && exam.session_year === current.session_year
}

const classColors: Record<string, { bg: string; text: string; ring: string; dot: string; gradient: string }> = {
  'JSS 1': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-500/30', dot: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
  'JSS 2': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', ring: 'ring-rose-200 dark:ring-rose-500/30', dot: 'bg-rose-500', gradient: 'from-rose-500 to-pink-500' },
  'JSS 3': { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-200 dark:ring-cyan-500/30', dot: 'bg-cyan-500', gradient: 'from-cyan-500 to-teal-500' },
  'SS 1':  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-500/30', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-green-500' },
  'SS 2':  { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-200 dark:ring-blue-500/30', dot: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
  'SS 3':  { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', ring: 'ring-violet-200 dark:ring-violet-500/30', dot: 'bg-violet-500', gradient: 'from-violet-500 to-purple-500' },
}

const ClassBadge = ({ cls }: { cls: string }) => {
  const year = extractYear(cls)
  const c = classColors[year] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-200 dark:ring-slate-700', dot: 'bg-slate-400', gradient: 'from-slate-400 to-slate-500' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1', c.bg, c.text, c.ring)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {cls}
    </span>
  )
}

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  published: { label: 'Published', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30' },
  pending:   { label: 'Pending',   icon: Clock,        cls: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' },
  draft:     { label: 'Draft',     icon: FileText,     cls: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  submitted: { label: 'Submitted', icon: Send,         cls: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
  rejected:  { label: 'Rejected',  icon: XCircle,      cls: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30' },
  archived:  { label: 'Archived',  icon: Archive,      cls: 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
}

const StatusPill = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] || { label: status, icon: FileText, cls: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cfg.cls)}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

const attemptStatusConfig: Record<string, { label: string; cls: string }> = {
  in_progress:    { label: 'In Progress',    cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
  timed_out:      { label: 'Timed Out',      cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30' },
  completed:      { label: 'Completed',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30' },
  submitted:      { label: 'Submitted',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30' },
  pending_theory: { label: 'Pending Theory', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' },
  graded:         { label: 'Graded',         cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30' },
  terminated:     { label: 'Terminated',     cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30' },
}

const AttemptStatusPill = ({ status }: { status: string }) => {
  const cfg = attemptStatusConfig[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

const DeptPill = ({ exam }: { exam: Exam }) => {
  const dept = getExamDept(exam)
  const map: Record<string, string> = {
    'All Students': 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
    'Science':      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
    'Arts':         'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
    'Commercial':   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', map[dept] || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700')}>
      {dept}
    </span>
  )
}

// ── Theory Question Renderer (recursive) ───────────────────────────────────────
const renderSubQuestions = (subs: TheorySubQuestion[], prefix: string = '', depth: number = 0) => {
  const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
  const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
  return (
    <ol className={cn('space-y-2', depth === 0 ? 'ml-4' : 'ml-6 mt-2')}>
      {subs.map((sub, idx) => {
        const label = depth === 0 ? `(${labels[idx] ?? idx + 1})` : `(${romans[idx] ?? idx + 1})`
        return (
          <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
            <div className="flex gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400 min-w-[24px]">{label}</span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="leading-relaxed">{sub.text}</p>
                  {sub.marks > 0 && (
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {sub.marks} mk{sub.marks !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {sub.sub_sub_questions && sub.sub_sub_questions.length > 0 && (
                  renderSubQuestions(sub.sub_sub_questions, '', depth + 1)
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminExamsPage() {
  const [loading, setLoading]       = useState(true)
  const [exams, setExams]           = useState<Exam[]>([])
  const [profile, setProfile]       = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTermInfo, setCurrentTermInfo] = useState<{ term: string; session_year: string } | null>(null)

  const [activeTab, setActiveTab]           = useState<'pending' | 'published' | 'archived'>('pending')
  const [searchQuery, setSearchQuery]       = useState('')
  const [selectedClass, setSelectedClass]   = useState('all')
  const [selectedDept, setSelectedDept]     = useState('all')
  const [viewMode, setViewMode]             = useState<'grouped' | 'list'>('grouped')
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set(CLASS_ORDER))

  // Modals
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showRetry, setShowRetry] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showExtraTime, setShowExtraTime] = useState(false)

  // Form states
  const [rejectionReason, setRejectionReason] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Retry states
  const [retryScope, setRetryScope] = useState<'class' | 'individual'>('class')
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>({})
  const [retrySelectedClass, setRetrySelectedClass] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({})
  const [expandedRetryClasses, setExpandedRetryClasses] = useState<Set<string>>(new Set())

  // Extra time states
  const [extraTimeAttempts, setExtraTimeAttempts] = useState<ExamAttempt[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)
  const [extraMinutes, setExtraMinutes] = useState<number>(10)
  const [customMinutes, setCustomMinutes] = useState<string>('')
  const [extraTimeSearch, setExtraTimeSearch] = useState('')

  // Preview states
  const [previewTab, setPreviewTab] = useState<'objective' | 'theory' | 'info'>('info')
  const [examQs, setExamQs] = useState<any[]>([])
  const [theoryQs, setTheoryQs] = useState<TheoryQuestion[]>([])
  const [loadingQs, setLoadingQs] = useState(false)
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [currentTheoryIdx, setCurrentTheoryIdx] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      }
      try { setCurrentTermInfo(await fetchCurrentTerm()) } catch (e: any) { console.error(e.message) }
    }
    init()
  }, [])

  const loadExams = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(500)
      if (error) throw error

      const creatorIds = Array.from(new Set((data || []).map((e: any) => e.created_by).filter(Boolean)))
      let teacherMap: Record<string, string> = {}
      if (creatorIds.length > 0) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds)
        teacherMap = (teachers || []).reduce((acc: any, t: any) => { acc[t.id] = t.full_name; return acc }, {})
      }

      setExams((data || []).map((e: any) => ({
        ...e,
        teacher_name: teacherMap[e.created_by] || e.teacher_name || 'Unknown Teacher',
      })))
    } catch { toast.error('Failed to load exams') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { loadExams() }, [loadExams])

  const loadQs = async (exam: Exam) => {
    setLoadingQs(true)
    setCurrentQIdx(0)
    setCurrentTheoryIdx(0)
    setExamQs([])
    setTheoryQs([])
    setPreviewTab('info')
    try {
      const { data } = await supabase.from('exams').select('questions, theory_questions, has_theory').eq('id', exam.id).single()

      const qs = typeof data?.questions === 'string' ? JSON.parse(data.questions) : (data?.questions || [])
      const tqs = typeof data?.theory_questions === 'string' ? JSON.parse(data.theory_questions) : (data?.theory_questions || [])

      setExamQs(Array.isArray(qs) ? qs : [])
      setTheoryQs(Array.isArray(tqs) ? tqs : [])

      if (Array.isArray(qs) && qs.length > 0) setPreviewTab('objective')
      else if (Array.isArray(tqs) && tqs.length > 0) setPreviewTab('theory')
      else setPreviewTab('info')
    } catch {
      toast.error('Failed to load questions')
      setExamQs([])
      setTheoryQs([])
    }
    finally { setLoadingQs(false) }
  }

  // 🛠️ ACTIONS
  const handleApprove = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const { term, session_year } = await fetchCurrentTerm()
      const now = new Date().toISOString()
      const { error } = await supabase.from('exams').update({
        status: 'published', is_published: true, is_active: true, is_archived: false,
        published_at: now, published_by: profile?.id, term, session_year,
      }).eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam published successfully')
      setShowApprove(false); setSelectedExam(null); loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({
        status: 'draft', is_published: false, review_notes: rejectionReason,
      }).eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam sent back for revision')
      setShowReject(false); setSelectedExam(null); setRejectionReason(''); loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  const handleReturn = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({
        status: 'draft', is_published: false, is_active: false, review_notes: returnReason || 'Returned for editing',
      }).eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam returned to teacher')
      setShowReturn(false); setSelectedExam(null); setReturnReason(''); loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  const handleArchive = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({
        is_archived: true, is_active: false, is_published: false, status: 'archived'
      }).eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam archived')
      setShowArchive(false); setSelectedExam(null); loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  const handleDelete = async () => {
    if (!selectedExam) return
    setProcessing(true)
    const examIdToDelete = selectedExam.id
    const examTitle = selectedExam.title

    try {
      await supabase.from('exam_attempts').delete().eq('exam_id', examIdToDelete)
      await supabase.from('ca_scores').delete().eq('exam_id', examIdToDelete)

      const { error } = await supabase.from('exams').delete().eq('id', examIdToDelete)
      if (error) throw error

      setExams(prev => prev.filter(e => e.id !== examIdToDelete))
      toast.success(`"${examTitle}" deleted successfully`)
      setShowDelete(false); setSelectedExam(null)
      await loadExams()
    } catch (err: any) {
      console.error('Delete Error:', err)
      try {
        const { error: archiveError } = await supabase.from('exams').update({
          is_archived: true, status: 'archived', is_published: false, is_active: false
        }).eq('id', examIdToDelete)
        if (archiveError) throw archiveError
        setExams(prev => prev.map(e => e.id === examIdToDelete ? { ...e, status: 'archived', is_archived: true } : e))
        toast.success('Exam had linked data. It was archived instead.')
        setShowDelete(false); setSelectedExam(null)
      } catch (archiveErr: any) {
        toast.error(archiveErr.message || 'Failed to delete or archive exam')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleUnarchive = async (exam: Exam) => {
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({
        is_archived: false, is_active: true, is_published: true, status: 'published'
      }).eq('id', exam.id)
      if (error) throw error
      toast.success('Exam restored')
      loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  // ── RETRY ─────────────────────────────────────────────────────────────────
  const openRetryDialog = async (exam: Exam) => {
    setSelectedExam(exam)
    setRetryScope('class')
    setSelectedStudentIds(new Set())
    setStudentSearch('')
    setAllStudents([])
    setStudentsByClass({})
    setAttemptCounts({})
    setExpandedRetryClasses(new Set())
    setShowRetry(true)
    setLoadingStudents(true)
    try {
      // ✅ Only ACTIVE students (is_active = true AND not soft-deleted).
      // Deactivated / deleted students never see retry actions and never
      // have their attempts touched by class-wide or individual resets.
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, class, admission_number')
        .eq('role', 'student')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('class')
        .order('full_name')

      if (studentsError) throw studentsError

      const allStu = (students || []) as Student[]
      setAllStudents(allStu)

      const grouped: Record<string, Student[]> = {}
      allStu.forEach(s => {
        const cls = extractYear(s.class) || 'Unassigned'
        if (!grouped[cls]) grouped[cls] = []
        grouped[cls].push(s)
      })
      setStudentsByClass(grouped)

      const examClass = extractYear(exam.class)
      setRetrySelectedClass(grouped[examClass] ? examClass : (Object.keys(grouped)[0] || ''))
      setExpandedRetryClasses(new Set([examClass]))

      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('student_id')
        .eq('exam_id', exam.id)
      if (attempts) {
        const counts: Record<string, number> = {}
        attempts.forEach((a: any) => { counts[a.student_id] = (counts[a.student_id] || 0) + 1 })
        setAttemptCounts(counts)
      }
    } catch (err: any) {
      console.error('Retry load error:', err)
      toast.error('Failed to load students')
    }
    finally { setLoadingStudents(false) }
  }

  const handleRetry = async () => {
    if (!selectedExam) return

    if (retryScope === 'class' && !retrySelectedClass) {
      toast.error('Select a class')
      return
    }
    if (retryScope === 'individual' && selectedStudentIds.size === 0) {
      toast.error('Select at least one student')
      return
    }

    setProcessing(true)

    try {
      let deletedCount = 0
      let targetLabel = ''

      if (retryScope === 'class') {
        const classStudentIds = (studentsByClass[retrySelectedClass] || []).map(s => s.id)
        if (classStudentIds.length === 0) {
          toast.error(`No students found in ${retrySelectedClass}`)
          setProcessing(false)
          return
        }
        targetLabel = `${retrySelectedClass} (${classStudentIds.length} students)`
        const { data: deletedData, error } = await supabase
          .from('exam_attempts')
          .delete()
          .eq('exam_id', selectedExam.id)
          .in('student_id', classStudentIds)
          .select('id')
        if (error) throw error
        deletedCount = deletedData?.length || 0
      } else {
        const ids = Array.from(selectedStudentIds)
        targetLabel = `${ids.length} selected student(s)`
        const { data: deletedData, error } = await supabase
          .from('exam_attempts')
          .delete()
          .eq('exam_id', selectedExam.id)
          .in('student_id', ids)
          .select('id')
        if (error) throw error
        deletedCount = deletedData?.length || 0
      }

      await supabase.from('exams').update({ is_active: true, is_published: true, status: 'published' }).eq('id', selectedExam.id)

      if (deletedCount === 0) {
        toast.info(`No active attempts found for ${targetLabel}.`)
      } else {
        toast.success(`Cleared ${deletedCount} attempt(s) for ${targetLabel}. Students can retake.`)
      }

      setShowRetry(false); setSelectedExam(null); setSelectedStudentIds(new Set())
      loadExams()
    } catch (err: any) {
      console.error('Retry Error:', err)
      toast.error(err.message || 'Failed to reset exam')
    } finally {
      setProcessing(false)
    }
  }

  // ── EXTRA TIME ────────────────────────────────────────────────────────────
  const openExtraTimeDialog = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowExtraTime(true)
    setLoadingAttempts(true)
    setSelectedAttemptId(null)
    setExtraMinutes(10)
    setCustomMinutes('')
    setExtraTimeSearch('')
    try {
      const { data: rawAttempts, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', exam.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const studentIds = Array.from(new Set((rawAttempts || []).map((a: any) => a.student_id)))
      let profileMap: Record<string, any> = {}
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, class, admission_number')
          .in('id', studentIds)
        profileMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
      }

      const enriched = (rawAttempts || []).map((a: any) => ({
        ...a,
        profiles: profileMap[a.student_id] || { full_name: 'Unknown Student', class: '' },
      }))
      setExtraTimeAttempts(enriched as ExamAttempt[])
    } catch (err: any) {
      console.error('Extra time load error:', err)
      toast.error('Failed to load exam attempts')
    } finally {
      setLoadingAttempts(false)
    }
  }

  /**
   * ✅ 2a — Grant extra time ONLY to genuine in-progress attempts.
   * Refuses terminal attempts (completed / pending_theory / graded /
   * terminated / submitted) and auto-submitted attempts. Granting to a
   * terminal attempt would flip its status back to `in_progress` and
   * corrupt its result — exactly the bug that caused the
   * "Resume → Terminated → Back → Resume" infinite loop.
   */
  const handleGrantExtraTime = async () => {
    if (!selectedAttemptId) {
      toast.error('Select a student attempt first')
      return
    }

    const minutes = customMinutes ? parseInt(customMinutes) : extraMinutes
    if (!minutes || minutes <= 0 || minutes > 180) {
      toast.error('Enter valid extra minutes (1–180)')
      return
    }

    setProcessing(true)
    try {
      const { data: attempt, error: fetchErr } = await supabase
        .from('exam_attempts')
        .select('id, status, is_auto_submitted, extra_time_minutes')
        .eq('id', selectedAttemptId)
        .single()

      if (fetchErr || !attempt) throw new Error('Attempt not found')

      const isTerminal = (TERMINAL_ATTEMPT_STATUSES as readonly string[]).includes(String(attempt.status))
      const wasAutoSubmitted = attempt.is_auto_submitted === true

      if (isTerminal || wasAutoSubmitted) {
        const why = isTerminal
          ? `this attempt is already "${attempt.status}"`
          : 'this attempt was already auto-submitted'
        toast.error(
          `Cannot grant extra time: ${why}. Only in-progress attempts can be extended.`,
        )
        setProcessing(false)
        return
      }

      const currentExtra = attempt.extra_time_minutes || 0
      const newExtra = currentExtra + minutes

      const { error } = await supabase
        .from('exam_attempts')
        .update({
          extra_time_minutes: newExtra,
          extra_time_updated_at: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('id', selectedAttemptId)

      if (error) throw error

      const attemptData = extraTimeAttempts.find(a => a.id === selectedAttemptId)
      const studentName = attemptData?.profiles?.full_name || 'Student'
      toast.success(`Granted ${minutes} extra min to ${studentName}. They can resume from where they stopped.`)
      setShowExtraTime(false)
      setSelectedExam(null)
    } catch (err: any) {
      console.error('Extra time error:', err)
      toast.error(err.message || 'Failed to grant extra time')
    } finally {
      setProcessing(false)
    }
  }

  // 🛠️ FILTERING
  const filtered = useMemo(() => exams.filter(exam => {
    const archived = exam.is_archived === true || exam.status === 'archived'
    if (activeTab === 'pending') {
      if (!['pending', 'draft', 'submitted'].includes(exam.status)) return false
      if (archived) return false
    } else if (activeTab === 'published') {
      if (exam.status !== 'published') return false
      if (archived) return false
      if (!isCurrentTerm(exam, currentTermInfo)) return false
    } else if (activeTab === 'archived') {
      const isOldTerm = exam.status === 'published' && !isCurrentTerm(exam, currentTermInfo)
      if (!archived && !isOldTerm) return false
    }
    if (selectedClass !== 'all' && extractYear(exam.class) !== selectedClass) return false
    if (selectedDept !== 'all' && getExamDept(exam) !== selectedDept) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return exam.title?.toLowerCase().includes(q) || exam.subject?.toLowerCase().includes(q) || exam.teacher_name?.toLowerCase().includes(q)
    }
    return true
  }), [exams, activeTab, selectedClass, selectedDept, searchQuery, currentTermInfo])

  const grouped = useMemo(() => filtered.reduce((acc, exam) => {
    const yr = extractYear(exam.class)
    if (!acc[yr]) acc[yr] = []
    acc[yr].push(exam)
    return acc
  }, {} as Record<string, Exam[]>), [filtered])

  const groupKeys = useMemo(
    () => [...CLASS_ORDER, ...Object.keys(grouped).filter(k => !CLASS_ORDER.includes(k))],
    [grouped]
  )

  const pendingCount = exams.filter(e => ['pending', 'draft', 'submitted'].includes(e.status) && !e.is_archived).length
  const publishedCount = exams.filter(e => e.status === 'published' && !e.is_archived && isCurrentTerm(e, currentTermInfo)).length
  const archivedCount = exams.filter(e => e.is_archived === true || e.status === 'archived' || (e.status === 'published' && !isCurrentTerm(e, currentTermInfo))).length

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return allStudents
    const q = studentSearch.toLowerCase()
    return allStudents.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q)
    )
  }, [allStudents, studentSearch])

  const filteredStudentsByClass = useMemo(() => {
    const g: Record<string, Student[]> = {}
    filteredStudents.forEach(s => {
      const cls = extractYear(s.class) || 'Unassigned'
      if (!g[cls]) g[cls] = []
      g[cls].push(s)
    })
    return g
  }, [filteredStudents])

  const retryClassKeys = useMemo(() => {
    const keys = Object.keys(studentsByClass)
    return [...CLASS_ORDER.filter(c => keys.includes(c)), ...keys.filter(k => !CLASS_ORDER.includes(k))]
  }, [studentsByClass])

  const filteredRetryClassKeys = useMemo(() => {
    const keys = Object.keys(filteredStudentsByClass)
    return [...CLASS_ORDER.filter(c => keys.includes(c)), ...keys.filter(k => !CLASS_ORDER.includes(k))]
  }, [filteredStudentsByClass])

  const filteredAttempts = useMemo(() => {
    if (!extraTimeSearch) return extraTimeAttempts
    const q = extraTimeSearch.toLowerCase()
    return extraTimeAttempts.filter(a =>
      a.profiles?.full_name?.toLowerCase().includes(q) ||
      a.profiles?.class?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q)
    )
  }, [extraTimeAttempts, extraTimeSearch])

  // ✅ 2b — split filtered attempts into extendable vs terminal for the dialog
  const extendableAttempts = useMemo(
    () => filteredAttempts.filter(isAttemptExtendable),
    [filteredAttempts],
  )
  const nonExtendableAttempts = useMemo(
    () => filteredAttempts.filter(a => !isAttemptExtendable(a)),
    [filteredAttempts],
  )

  const toggleClass = (yr: string) => {
    setExpandedClasses(prev => { const next = new Set(prev); next.has(yr) ? next.delete(yr) : next.add(yr); return next })
  }
  const toggleAllClasses = () => {
    const allOpen = groupKeys.every(c => expandedClasses.has(c))
    setExpandedClasses(allOpen ? new Set() : new Set(groupKeys))
  }
  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const toggleAllStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length) setSelectedStudentIds(new Set())
    else setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)))
  }
  const toggleRetryClass = (cls: string) => {
    setExpandedRetryClasses(prev => { const next = new Set(prev); next.has(cls) ? next.delete(cls) : next.add(cls); return next })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedClass('all')
    setSelectedDept('all')
  }
  const hasActiveFilters = searchQuery || selectedClass !== 'all' || selectedDept !== 'all'

  // 🛠️ ROW ACTIONS
  const renderRowActions = (exam: Exam) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => { setSelectedExam(exam); loadQs(exam); setShowPreview(true) }}
        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
        title="Preview"
      >
        <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
      </button>

      {activeTab === 'pending' && (
        <>
          <button onClick={() => { setSelectedExam(exam); setShowApprove(true) }} className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 flex items-center justify-center transition-colors" title="Approve & Publish">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
          <button onClick={() => { setSelectedExam(exam); setShowReject(true) }} className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Reject">
            <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
          </button>
          <button onClick={() => { setSelectedExam(exam); setShowDelete(true) }} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </>
      )}

      {activeTab === 'published' && (
        <>
          <button onClick={() => openRetryDialog(exam)} className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 flex items-center justify-center transition-colors" title="Allow Retry">
            <RotateCcw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </button>
          <button onClick={() => openExtraTimeDialog(exam)} className="h-8 w-8 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 flex items-center justify-center transition-colors" title="Grant Extra Time">
            <Hourglass className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
          </button>
          <button onClick={() => { setSelectedExam(exam); setShowReturn(true) }} className="h-8 w-8 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 flex items-center justify-center transition-colors" title="Return to Teacher">
            <Edit3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </button>
          <button onClick={() => { setSelectedExam(exam); setShowArchive(true) }} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors" title="Archive">
            <Archive className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={() => { setSelectedExam(exam); setShowDelete(true) }} className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
          </button>
        </>
      )}

      {activeTab === 'archived' && (
        <>
          <button onClick={() => handleUnarchive(exam)} disabled={processing} className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors" title="Restore">
            <RotateCcw className="h-3 w-3" /> Restore
          </button>
          <button onClick={() => { setSelectedExam(exam); setShowDelete(true) }} className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
          </button>
        </>
      )}
    </div>
  )

  const renderTableHead = () => (
    <TableHeader>
      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Exam</TableHead>
        <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden md:table-cell">Teacher</TableHead>
        <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden lg:table-cell">Details</TableHead>
        <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</TableHead>
        <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  )

  const renderExamRow = (exam: Exam) => (
    <TableRow key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors border-slate-200 dark:border-slate-800">
      <TableCell className="py-3">
        <div>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{exam.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{exam.subject}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <ClassBadge cls={exam.class} />
            <DeptPill exam={exam} />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{exam.teacher_name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDateShort(exam.created_at)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1" title="Duration">
            <Timer className="h-3 w-3" /> {exam.duration}m
          </span>
          <span className="flex items-center gap-1" title="Questions">
            <Hash className="h-3 w-3" /> {exam.total_questions}
          </span>
          <span className="flex items-center gap-1" title="Total marks">
            <Target className="h-3 w-3" /> {exam.total_marks}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <StatusPill status={exam.is_archived ? 'archived' : exam.status} />
      </TableCell>
      <TableCell className="text-right">{renderRowActions(exam)}</TableCell>
    </TableRow>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <Loader2 className="animate-spin h-10 w-10 text-violet-600 dark:text-violet-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading exam management...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Exam Management</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Sparkles className="h-3 w-3" />
                Review, publish, and manage all teacher submissions
                {currentTermInfo && (
                  <span className="ml-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded-full text-[10px] font-semibold">
                    {currentTermInfo.term.toUpperCase()} · {currentTermInfo.session_year}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grouped')}
                className={cn('h-7 w-7 rounded flex items-center justify-center transition-colors', viewMode === 'grouped' ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300')}
                title="Grouped view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('h-7 w-7 rounded flex items-center justify-center transition-colors', viewMode === 'list' ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300')}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); loadExams() }} disabled={refreshing} className="h-8 flex-1 sm:flex-initial dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-200">
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </header>

        {/* STATS */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              'relative bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border transition-all text-left group overflow-hidden',
              activeTab === 'pending'
                ? 'ring-2 ring-amber-400 dark:ring-amber-500 border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-100 dark:shadow-amber-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-500/30 hover:shadow-md'
            )}
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-amber-400 to-orange-400 opacity-10 dark:opacity-20 rounded-full -mr-4 -mt-4 group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{pendingCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">Awaiting approval</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('published')}
            className={cn(
              'relative bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border transition-all text-left group overflow-hidden',
              activeTab === 'published'
                ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md'
            )}
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-emerald-400 to-green-400 opacity-10 dark:opacity-20 rounded-full -mr-4 -mt-4 group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Published</p>
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{publishedCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">Live & active</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={cn(
              'relative bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border transition-all text-left group overflow-hidden',
              activeTab === 'archived'
                ? 'ring-2 ring-slate-400 dark:ring-slate-500 border-slate-300 dark:border-slate-600 shadow-lg shadow-slate-100 dark:shadow-slate-900/40'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
            )}
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-slate-400 to-slate-500 opacity-10 dark:opacity-20 rounded-full -mr-4 -mt-4 group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archived</p>
                <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-300 tracking-tight">{archivedCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">Past exams</p>
            </div>
          </button>
        </section>

        {/* SEARCH */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, subject, or teacher..."
                className="text-sm outline-none w-full bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 text-sm dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="all">All Classes</SelectItem>
                  {CLASS_ORDER.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 text-sm dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  {DEPT_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          {viewMode === 'grouped' && filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60 rounded-b-2xl">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> exam{filtered.length !== 1 ? 's' : ''} found
              </p>
              <button onClick={toggleAllClasses} className="text-[11px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold">
                {groupKeys.every(c => expandedClasses.has(c)) ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          )}
        </div>

        {/* LIST */}
        <section className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-16 px-6 text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No exams found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {hasActiveFilters ? 'Try adjusting your filters or search query.' : `No ${activeTab} exams at the moment.`}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'grouped' ? (
            groupKeys.map(yr => {
              const cls = grouped[yr]
              if (!cls?.length) return null
              const isOpen = expandedClasses.has(yr)
              const color = classColors[yr]
              return (
                <div key={yr} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleClass(yr)}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm', color?.gradient || 'from-slate-400 to-slate-500')}>
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{yr || 'Unassigned'}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{cls.length} exam{cls.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform', isOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                      >
                        <div className="overflow-x-auto">
                          <Table>
                            {renderTableHead()}
                            <TableBody>
                              {cls.map(exam => renderExamRow(exam))}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  {renderTableHead()}
                  <TableBody>
                    {filtered.map(exam => renderExamRow(exam))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </section>

        {/* PREVIEW DIALOG */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[92vh] p-0 overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-4 sm:px-6 py-5 text-white overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="relative">
                <DialogHeader className="space-y-0 text-left">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Exam Preview</p>
                        <DialogTitle className="text-base sm:text-xl font-bold leading-tight text-white">
                          {selectedExam?.title || 'Loading...'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Preview of exam</DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold">
                    <BookOpen className="h-3 w-3" /> {selectedExam?.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold">
                    <GraduationCap className="h-3 w-3" /> {selectedExam?.class}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold">
                    <Timer className="h-3 w-3" /> {selectedExam?.duration} mins
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold">
                    <Target className="h-3 w-3" /> {selectedExam?.total_marks} marks
                  </span>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 sm:px-4 flex-shrink-0 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                <button
                  onClick={() => setPreviewTab('info')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap',
                    previewTab === 'info'
                      ? 'border-violet-600 dark:border-violet-400 text-violet-700 dark:text-violet-300'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  <HelpCircle className="h-3.5 w-3.5" /> Overview
                </button>
                {examQs.length > 0 && (
                  <button
                    onClick={() => setPreviewTab('objective')}
                    className={cn(
                      'px-3 sm:px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap',
                      previewTab === 'objective'
                        ? 'border-violet-600 dark:border-violet-400 text-violet-700 dark:text-violet-300'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Objective
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{examQs.length}</span>
                  </button>
                )}
                {theoryQs.length > 0 && (
                  <button
                    onClick={() => setPreviewTab('theory')}
                    className={cn(
                      'px-3 sm:px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap',
                      previewTab === 'theory'
                        ? 'border-violet-600 dark:border-violet-400 text-violet-700 dark:text-violet-300'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    Theory
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{theoryQs.length}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
              {loadingQs ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500 dark:text-violet-400 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading questions...</p>
                </div>
              ) : (
                <>
                  {previewTab === 'info' && selectedExam && (
                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Objective</p>
                          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{examQs.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Theory</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{theoryQs.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pass Mark</p>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{selectedExam.pass_mark || selectedExam.passing_percentage || 40}%</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{selectedExam.duration}m</p>
                        </div>
                      </div>

                      {selectedExam.instructions && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Instructions
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedExam.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'objective' && examQs.length > 0 && (
                    <div className="p-3 sm:p-6">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            Question {currentQIdx + 1} of {examQs.length}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCurrentQIdx(i => Math.max(0, i - 1))}
                              disabled={currentQIdx === 0}
                              className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setCurrentQIdx(i => Math.min(examQs.length - 1, i + 1))}
                              disabled={currentQIdx === examQs.length - 1}
                              className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                            >
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentQIdx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                          <div className="p-4 sm:p-5">
                            <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-5">
                              {examQs[currentQIdx]?.question || 'Question text missing'}
                            </p>
                            <div className="space-y-2">
                              {(examQs[currentQIdx]?.options || []).map((opt: string, i: number) => {
                                const letter = String.fromCharCode(65 + i)
                                const correctAnswer = examQs[currentQIdx]?.correct_answer ?? examQs[currentQIdx]?.answer
                                const isCorrect = correctAnswer === letter || correctAnswer === opt || correctAnswer === i
                                return (
                                  <div
                                    key={i}
                                    className={cn(
                                      'p-3 rounded-lg border text-sm flex items-start gap-3',
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    )}
                                  >
                                    <div className={cn(
                                      'h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                                      isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    )}>
                                      {letter}
                                    </div>
                                    <p className={cn('flex-1', isCorrect ? 'text-emerald-800 dark:text-emerald-200 font-medium' : 'text-slate-700 dark:text-slate-300')}>
                                      {opt}
                                    </p>
                                    {isCorrect && <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  {previewTab === 'theory' && theoryQs.length > 0 && (
                    <div className="p-3 sm:p-6">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            Theory Question {currentTheoryIdx + 1} of {theoryQs.length}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCurrentTheoryIdx(i => Math.max(0, i - 1))}
                              disabled={currentTheoryIdx === 0}
                              className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setCurrentTheoryIdx(i => Math.min(theoryQs.length - 1, i + 1))}
                              disabled={currentTheoryIdx === theoryQs.length - 1}
                              className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                            >
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-4 sm:p-5">
                        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-4">
                          {theoryQs[currentTheoryIdx]?.question || 'Question text missing'}
                        </p>
                        {theoryQs[currentTheoryIdx]?.sub_questions && theoryQs[currentTheoryIdx].sub_questions!.length > 0 && (
                          <div className="pl-2 border-l-2 border-blue-200 dark:border-blue-500/40">
                            {renderSubQuestions(theoryQs[currentTheoryIdx].sub_questions!)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-end gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Close</Button>
              {selectedExam && ['pending', 'draft', 'submitted'].includes(selectedExam.status) && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setShowPreview(false); setShowApprove(true) }}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve & Publish
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* DELETE */}
        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-2">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="dark:text-white">Delete Exam Permanently</DialogTitle>
              <DialogDescription className="dark:text-slate-400">This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              <p>You are about to delete <strong>{selectedExam?.title}</strong>. All associated student attempts and CA scores will be permanently removed.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDelete(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...</> : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* APPROVE */}
        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <DialogTitle className="dark:text-white">Publish Exam</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Make this exam available to students immediately.</DialogDescription>
            </DialogHeader>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-200">
              <p>Publishing <strong>{selectedExam?.title}</strong> will make it live for all eligible students in <strong>{selectedExam?.class}</strong>.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprove(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Publishing...</> : <><Send className="h-4 w-4 mr-1.5" /> Publish Now</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* RETRY */}
        <Dialog open={showRetry} onOpenChange={setShowRetry}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-2">
                <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle className="dark:text-white">Allow Retake</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Reset attempts for <strong className="text-slate-700 dark:text-slate-200">{selectedExam?.title}</strong>. Only active students are shown.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRetryScope('class')}
                  className={cn(
                    'p-3 border-2 rounded-xl text-left transition-all',
                    retryScope === 'class'
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                  )}
                >
                  <Users className={cn('h-5 w-5 mb-1.5', retryScope === 'class' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">By Class</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Reset entire class</p>
                </button>
                <button
                  onClick={() => setRetryScope('individual')}
                  className={cn(
                    'p-3 border-2 rounded-xl text-left transition-all',
                    retryScope === 'individual'
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                  )}
                >
                  <User className={cn('h-5 w-5 mb-1.5', retryScope === 'individual' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Individual</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pick specific students</p>
                </button>
              </div>

              {loadingStudents ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading students...</p>
                </div>
              ) : (
                <>
                  {retryScope === 'class' && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Select which class to reset:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                        {retryClassKeys.map(cls => {
                          const students = studentsByClass[cls] || []
                          if (students.length === 0) return null
                          const color = classColors[cls]
                          const isSelected = retrySelectedClass === cls
                          const attemptedCount = students.filter(s => (attemptCounts[s.id] || 0) > 0).length
                          return (
                            <button
                              key={cls}
                              onClick={() => setRetrySelectedClass(cls)}
                              className={cn(
                                'p-3 rounded-xl border-2 text-left transition-all',
                                isSelected
                                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-100 dark:ring-blue-500/30'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={cn('h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', color?.gradient || 'from-slate-400 to-slate-500')}>
                                  <GraduationCap className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{cls}</p>
                                </div>
                                {isSelected && <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{students.length} student{students.length !== 1 ? 's' : ''}</span>
                                {attemptedCount > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">{attemptedCount} attempted</span>
                                  </>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {retryScope === 'individual' && (
                    <>
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                        <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <input
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          placeholder="Search students by name, admission or class..."
                          className="text-xs outline-none w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{selectedStudentIds.size}</span> selected
                        </p>
                        <button onClick={toggleAllStudents} className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
                          {selectedStudentIds.size === filteredStudents.length ? 'Deselect All' : 'Select All Visible'}
                        </button>
                      </div>

                      <div className="max-h-[380px] overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-950/50">
                        {filteredRetryClassKeys.map(cls => {
                          const students = filteredStudentsByClass[cls] || []
                          if (students.length === 0) return null
                          const isOpen = expandedRetryClasses.has(cls)
                          const color = classColors[cls]
                          const selectedInClass = students.filter(s => selectedStudentIds.has(s.id)).length
                          return (
                            <div key={cls} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                              <button
                                onClick={() => toggleRetryClass(cls)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={cn('h-6 w-6 rounded-md bg-gradient-to-br flex items-center justify-center text-white', color?.gradient || 'from-slate-400 to-slate-500')}>
                                    <GraduationCap className="h-3 w-3" />
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{cls}</p>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">({students.length})</span>
                                  {selectedInClass > 0 && (
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                                      {selectedInClass} selected
                                    </span>
                                  )}
                                </div>
                                <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                              </button>

                              {isOpen && (
                                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                  {students.map(s => {
                                    const attempts = attemptCounts[s.id] || 0
                                    return (
                                      <label key={s.id} className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selectedStudentIds.has(s.id)}
                                          onChange={() => toggleStudent(s.id)}
                                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                                        />
                                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                          <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{s.full_name}</p>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.admission_number || s.class}</p>
                                        </div>
                                        {attempts > 0 && (
                                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                                            {attempts} attempt{attempts !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {filteredRetryClassKeys.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No active students found</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowRetry(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleRetry} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Clearing...</> : <><RotateCcw className="h-4 w-4 mr-1.5" /> Clear Attempts</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* EXTRA TIME                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <Dialog open={showExtraTime} onOpenChange={setShowExtraTime}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mb-2">
                <Hourglass className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <DialogTitle className="dark:text-white">Grant Extra Time</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Extend the exam timer for a student. Updates are sent live and their timer extends instantly. Only in-progress attempts can be extended.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  value={extraTimeSearch}
                  onChange={e => setExtraTimeSearch(e.target.value)}
                  placeholder="Search by student name or class..."
                  className="text-xs outline-none w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {loadingAttempts ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading attempts...</p>
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div className="py-10 text-center">
                  <Hourglass className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No attempts yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No students have started this exam.</p>
                </div>
              ) : extendableAttempts.length === 0 ? (
                <div className="py-10 text-center">
                  <Hourglass className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No extendable attempts</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    All attempts for this exam are already submitted, graded, or terminated. Only in-progress attempts can be extended.
                  </p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                  {/* ── Extendable attempts (selectable) ───────────────────── */}
                  {extendableAttempts.map(a => {
                    const isSelected = selectedAttemptId === a.id
                    const nowMs = Date.now()
                    const effectiveEndMs = computeEffectiveEndMs(
                      a.started_at,
                      selectedExam?.duration ?? 0,
                      a.extra_time_minutes ?? 0,
                    )
                    const isExpired = effectiveEndMs !== null && effectiveEndMs < nowMs
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAttemptId(a.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 p-3 text-left transition-colors',
                          isSelected
                            ? 'bg-orange-50 dark:bg-orange-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                      >
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedAttemptId(a.id)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {a.profiles?.full_name || 'Unknown'}
                            </p>
                            <AttemptStatusPill status={a.status} />
                            {isExpired && (
                              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/20 px-1.5 py-0.5 rounded-full">
                                TIMER EXPIRED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                            {a.profiles?.class && <span>{a.profiles.class}</span>}
                            {effectiveEndMs !== null && (
                              <span>Ends: {formatDateTime(new Date(effectiveEndMs).toISOString())}</span>
                            )}
                            {(a.extra_time_minutes ?? 0) > 0 && (
                              <span className="text-orange-600 dark:text-orange-400 font-bold">
                                +{a.extra_time_minutes}m granted
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {/* ── Non-extendable attempts (greyed, informational) ────── */}
                  {nonExtendableAttempts.length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-slate-50/70 dark:bg-slate-800/40">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Submitted / Locked — cannot extend
                        </p>
                      </div>
                      {nonExtendableAttempts.map(a => (
                        <div
                          key={a.id}
                          className="w-full flex items-center gap-2.5 p-3 opacity-60 cursor-not-allowed"
                          title="This attempt is already submitted and cannot be extended."
                        >
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">
                                {a.profiles?.full_name || 'Unknown'}
                              </p>
                              <AttemptStatusPill status={a.status} />
                              {a.is_auto_submitted === true && (
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                  AUTO-SUBMITTED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500 flex-wrap">
                              {a.profiles?.class && <span>{a.profiles.class}</span>}
                              <span className="italic">Already submitted — cannot be extended</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {selectedAttemptId && (
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3 space-y-3">
                  <p className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                    Extra time to grant
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[5, 10, 15, 20, 30].map(m => (
                      <button
                        key={m}
                        onClick={() => { setExtraMinutes(m); setCustomMinutes('') }}
                        className={cn(
                          'py-2 rounded-lg text-xs font-bold border-2 transition-all',
                          !customMinutes && extraMinutes === m
                            ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500/40'
                        )}
                      >
                        +{m}m
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                      <Plus className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="number"
                        value={customMinutes}
                        onChange={e => setCustomMinutes(e.target.value)}
                        placeholder="Custom minutes (1-180)"
                        min={1}
                        max={180}
                        className="text-xs outline-none w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">min</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-orange-200 dark:border-orange-500/30">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Granting <strong className="text-orange-600 dark:text-orange-400">
                        +{customMinutes ? parseInt(customMinutes) || 0 : extraMinutes} minutes
                      </strong> — timer updates on the student's device within ~1 second. If their timer already expired, they'll be able to resume.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowExtraTime(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleGrantExtraTime} disabled={processing || !selectedAttemptId}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Granting...</> : <><Hourglass className="h-4 w-4 mr-1.5" /> Grant Extra Time</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* REJECT */}
        <Dialog open={showReject} onOpenChange={setShowReject}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="dark:text-white">Reject Exam</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Send this exam back to the teacher with feedback.</DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain what needs to be revised..."
              rows={4}
              className="text-sm resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReject(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending...</> : 'Send Back'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* RETURN */}
        <Dialog open={showReturn} onOpenChange={setShowReturn}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-2">
                <Edit3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="dark:text-white">Return for Editing</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Unpublish and return <strong>{selectedExam?.title}</strong> to the teacher.</DialogDescription>
            </DialogHeader>
            <Textarea
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="Reason for return (optional)..."
              rows={3}
              className="text-sm resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturn(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleReturn} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Returning...</> : 'Return to Teacher'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ARCHIVE */}
        <Dialog open={showArchive} onOpenChange={setShowArchive}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                <Archive className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <DialogTitle className="dark:text-white">Archive Exam</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Move this exam out of active circulation.</DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300">
              <p>Archive <strong>{selectedExam?.title}</strong>? Students will lose access, but all scores and data will be preserved for records.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowArchive(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
              <Button className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white" onClick={handleArchive} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Archiving...</> : <><Archive className="h-4 w-4 mr-1.5" /> Archive</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}