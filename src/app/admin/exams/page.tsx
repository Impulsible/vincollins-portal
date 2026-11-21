// src/app/admin/exams/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { QuestionContent } from '@/components/shared/QuestionContent'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, RefreshCw, Eye, CheckCircle, XCircle, FileText,
  Users, ChevronDown, AlertCircle, Search, Clock, CheckCircle2,
  LayoutGrid, List, GraduationCap, BookOpen, ChevronLeft,
  ChevronRight as ChevronRightIcon, Sparkles, Shield, RotateCcw,
  Edit3, Archive, Send, User, Trash2, X, PenTool, HelpCircle,
  Hash, Timer, Target, Layers, Hourglass, Image as ImageIcon,
  UserCheck, UserPlus, Ban, AlertTriangle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TheorySubQuestion {
  text: string
  marks: number
  image_url?: string
  imageUrl?: string
  image_caption?: string
  imageCaption?: string
  sub_sub_questions?: TheorySubQuestion[]
}

interface TheoryQuestion {
  question_text: string
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  imageUrl?: string
  image_caption?: string
  imageCaption?: string
  type?: string
}

interface Exam {
  id: string
  title: string
  subject: string
  subject_id?: string
  class: string
  class_id?: string
  duration: number
  duration_minutes?: number
  total_questions: number
  total_marks: number
  pass_mark?: number
  passing_percentage?: number
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'published' | 'archived'
  is_published?: boolean
  is_active?: boolean
  is_archived?: boolean
  published_at?: string
  published_by?: string
  approved_at?: string
  approved_by?: string
  review_notes?: string
  rejection_reason?: string
  excluded_student_ids?: string[]
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
  email?: string
  selected?: boolean
}

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
  time_remaining_seconds?: number
  is_auto_submitted?: boolean | null
  created_at?: string
  profiles?: {
    full_name: string
    class: string
    admission_number?: string
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Normalize a class string to a canonical year:
 *   "JSS1", "JSS 1", "JSS 1A", "JSS 1 Science"  → "JSS 1"
 *   "SS1",  "SS 1",  "SS1 Science", "SS 1 Arts"  → "SS 1"
 */
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

/**
 * Extract department from a class string:
 *   "SS1 Science"  → "science"
 *   "SS1 Arts"     → "arts"
 *   "SS1 Commercial" → "commercial"
 *   "SS1" / "JSS 1" → null
 */
const extractDept = (cls: string): 'science' | 'arts' | 'commercial' | null => {
  if (!cls) return null
  const lower = cls.toLowerCase()
  if (lower.includes('science')) return 'science'
  if (lower.includes('arts')) return 'arts'
  if (lower.includes('commercial')) return 'commercial'
  return null
}

/**
 * THE UNIVERSAL MATCHER.
 *
 * Given an exam's class and the full student list, return the students
 * who belong in that exam's attendance checklist.
 *
 *   exam.class = "JSS 1"           → all JSS 1 students
 *   exam.class = "SS1"             → all SS1 students (Arts + Science + Commercial)
 *   exam.class = "SS1 Science"     → only SS1 Science students
 *   exam.class = "SS1 Arts"        → only SS1 Arts students
 *   exam.class = "SS1 Commercial"  → only SS1 Commercial students
 *   exam.class = "SS3"             → all SS3 students
 *
 * Case-insensitive, whitespace-insensitive, robust to "SS1", "SS 1", "ss1".
 */
const matchStudentsByExamClass = (examClass: string, students: Student[]): Student[] => {
  const examYear = extractYear(examClass)
  const examDept = extractDept(examClass)

  if (!examYear) return []

  return students.filter(s => {
    // Must match the year first
    if (extractYear(s.class) !== examYear) return false
    // If exam specifies a department, student must be in that department
    if (examDept) {
      return extractDept(s.class) === examDept
    }
    // No department specified → include everyone in that year
    return true
  })
}

const getExamDept = (exam: Exam): string => {
  if (exam.target_audience && exam.target_audience !== 'all') return exam.target_audience
  const d = extractDept(exam.class)
  if (d === 'science') return 'Science'
  if (d === 'arts') return 'Arts'
  if (d === 'commercial') return 'Commercial'
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

const TERMINAL_ATTEMPT_STATUSES = [
  'completed',
  'pending_theory',
  'graded',
  'terminated',
  'submitted',
] as const

const isAttemptExtendable = (a: ExamAttempt): boolean =>
  (a.status === 'in_progress' || a.status === 'started') && a.is_auto_submitted !== true

const formatDateShort = (d: string) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const fetchCurrentTerm = async (): Promise<{ term: string; session_year: string }> => {
  try {
    const { data, error } = await supabase
      .from('terms').select('term_code, session_year').eq('is_current', true).maybeSingle()
    if (error || !data?.term_code) return { term: 'first', session_year: '2024/2025' }
    return { term: data.term_code, session_year: data.session_year }
  } catch {
    return { term: 'first', session_year: '2024/2025' }
  }
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
  approved:  { label: 'Approved',  icon: CheckCircle,  cls: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
  pending:   { label: 'Pending',   icon: Clock,        cls: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' },
  draft:     { label: 'Draft',     icon: FileText,     cls: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  submitted: { label: 'Submitted', icon: Send,         cls: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' },
  rejected:  { label: 'Rejected',  icon: XCircle,      cls: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30' },
  archived:  { label: 'Archived',  icon: Archive,      cls: 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  terminated:{ label: 'Terminated',icon: Ban,          cls: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30' },
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
  started:        { label: 'Started',        cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
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

// ── Theory Sub-question Renderer ───────────────────────────────────────────
const renderSubQuestions = (subs: TheorySubQuestion[], depth: number = 0) => {
  const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
  const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
  return (
    <ol className={cn('space-y-3', depth === 0 ? 'ml-1 sm:ml-3' : 'ml-3 sm:ml-5 mt-2')}>
      {subs.map((sub, idx) => {
        const label = depth === 0 ? `(${labels[idx] ?? idx + 1})` : `(${romans[idx] ?? idx + 1})`
        const subImage = sub.imageUrl || sub.image_url
        const subCaption = sub.imageCaption || sub.image_caption
        return (
          <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-violet-600 dark:text-violet-400 min-w-[24px] pt-0.5 text-xs">
                {label}
              </span>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <QuestionContent text={sub.text} imageUrl={subImage} imageCaption={subCaption} />
                  </div>
                  {sub.marks > 0 && (
                    <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/30 px-2 py-0.5 rounded-full whitespace-nowrap self-start">
                      {sub.marks} mk{sub.marks !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {sub.sub_sub_questions && sub.sub_sub_questions.length > 0 && (
                  renderSubQuestions(sub.sub_sub_questions, depth + 1)
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function AdminExamsPage() {
  const [loading, setLoading]       = useState(true)
  const [exams, setExams]           = useState<Exam[]>([])
  const [profile, setProfile]       = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTermInfo, setCurrentTermInfo] = useState<{ term: string; session_year: string } | null>(null)

  const [activeTab, setActiveTab]           = useState<'pending' | 'approved' | 'published' | 'archived'>('pending')
  const [searchQuery, setSearchQuery]       = useState('')
  const [selectedClass, setSelectedClass]   = useState('all')
  const [selectedDept, setSelectedDept]     = useState('all')
  const [viewMode, setViewMode]             = useState<'grouped' | 'list'>('grouped')
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set(CLASS_ORDER))

  // Modals
  const [selectedExam, setSelectedExam]       = useState<Exam | null>(null)
  const [showPreview, setShowPreview]         = useState(false)
  const [showApprove, setShowApprove]         = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showAdmitLateModal, setShowAdmitLateModal] = useState(false)
  const [showBlockModal, setShowBlockModal]   = useState(false)
  const [showReject, setShowReject]           = useState(false)
  const [showRetry, setShowRetry]             = useState(false)
  const [showReturn, setShowReturn]           = useState(false)
  const [showArchive, setShowArchive]         = useState(false)
  const [showDelete, setShowDelete]           = useState(false)
  const [showExtraTime, setShowExtraTime]     = useState(false)

  // Form states
  const [rejectionReason, setRejectionReason] = useState('')
  const [returnReason, setReturnReason]       = useState('')
  const [processing, setProcessing]           = useState(false)

  // Attendance Checklist
  const [classStudents, setClassStudents]     = useState<Student[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [attendanceSearch, setAttendanceSearch]   = useState('')
  const [attendanceTouched, setAttendanceTouched] = useState(false)

  // Late / Absent
  const [absentStudentsList, setAbsentStudentsList] = useState<Student[]>([])
  const [loadingAbsentStudents, setLoadingAbsentStudents] = useState(false)

  // Block
  const [blockCandidates, setBlockCandidates] = useState<ExamAttempt[]>([])
  const [loadingBlockCandidates, setLoadingBlockCandidates] = useState(false)
  const [blockSelectedIds, setBlockSelectedIds] = useState<Set<string>>(new Set())
  const [blockSearch, setBlockSearch] = useState('')

  // Retry
  const [retryScope, setRetryScope]                 = useState<'class' | 'individual'>('class')
  const [allStudents, setAllStudents]               = useState<Student[]>([])
  const [studentsByClass, setStudentsByClass]       = useState<Record<string, Student[]>>({})
  const [retrySelectedClass, setRetrySelectedClass] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch]           = useState('')
  const [loadingStudents, setLoadingStudents]       = useState(false)
  const [attemptCounts, setAttemptCounts]           = useState<Record<string, number>>({})
  const [expandedRetryClasses, setExpandedRetryClasses] = useState<Set<string>>(new Set())

  // Extra time
  const [extraTimeAttempts, setExtraTimeAttempts]   = useState<ExamAttempt[]>([])
  const [loadingAttempts, setLoadingAttempts]       = useState(false)
  const [selectedAttemptId, setSelectedAttemptId]   = useState<string | null>(null)
  const [extraMinutes, setExtraMinutes]             = useState<number>(10)
  const [customMinutes, setCustomMinutes]           = useState<string>('')
  const [extraTimeSearch, setExtraTimeSearch]       = useState('')

  // Preview
  const [previewTab, setPreviewTab]                 = useState<'objective' | 'theory' | 'info'>('info')
  const [examQs, setExamQs]                         = useState<any[]>([])
  const [theoryQs, setTheoryQs]                     = useState<TheoryQuestion[]>([])
  const [loadingQs, setLoadingQs]                   = useState(false)
  const [currentQIdx, setCurrentQIdx]               = useState(0)
  const [currentTheoryIdx, setCurrentTheoryIdx]     = useState(0)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data && mountedRef.current) setProfile(data)
      }
      try {
        const term = await fetchCurrentTerm()
        if (mountedRef.current) setCurrentTermInfo(term)
      } catch (e: any) {
        console.error(e.message)
      }
    }
    init()
  }, [])

  const loadExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams').select('*').order('created_at', { ascending: false }).limit(500)
      if (error) throw error

      const creatorIds = Array.from(new Set((data || []).map((e: any) => e.created_by).filter(Boolean)))
      let teacherMap: Record<string, string> = {}
      if (creatorIds.length > 0) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds)
        teacherMap = (teachers || []).reduce((acc: any, t: any) => { acc[t.id] = t.full_name; return acc }, {})
      }

      if (!mountedRef.current) return
      setExams((data || []).map((e: any) => ({
        ...e,
        teacher_name: teacherMap[e.created_by] || e.teacher_name || 'Staff Member',
        duration: e.duration || e.duration_minutes || 60,
        excluded_student_ids: Array.isArray(e.excluded_student_ids) ? e.excluded_student_ids : [],
      })))
    } catch {
      toast.error('Failed to load exams')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
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
      let qs: any[] = typeof data?.questions === 'string' ? JSON.parse(data.questions) : (data?.questions || [])
      let tqs: any[] = typeof data?.theory_questions === 'string' ? JSON.parse(data.theory_questions) : (data?.theory_questions || [])

      if (!Array.isArray(qs) || qs.length === 0) {
        const { data: objRes } = await supabase.from('questions').select('*').eq('exam_id', exam.id).order('order_index', { ascending: true })
        if (objRes && objRes.length > 0) qs = objRes
      }
      if (!Array.isArray(tqs) || tqs.length === 0) {
        const { data: thRes } = await supabase.from('theory_questions').select('*').eq('exam_id', exam.id).order('order_index', { ascending: true })
        if (thRes && thRes.length > 0) tqs = thRes
      }

      if (!mountedRef.current) return
      setExamQs(Array.isArray(qs) ? qs : [])
      setTheoryQs(Array.isArray(tqs) ? tqs : [])
      if (Array.isArray(qs) && qs.length > 0) setPreviewTab('objective')
      else if (Array.isArray(tqs) && tqs.length > 0) setPreviewTab('theory')
      else setPreviewTab('info')
    } catch {
      toast.error('Failed to load questions')
      if (mountedRef.current) { setExamQs([]); setTheoryQs([]) }
    } finally {
      if (mountedRef.current) setLoadingQs(false)
    }
  }

  // ── APPROVE ────────────────────────────────────────────────────────────
  const handleApproveOnly = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('exams').update({
        status: 'approved', approved_at: now, approved_by: profile?.id || null, review_notes: null,
      }).eq('id', selectedExam.id)

      if (error) {
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('approved_at') || msg.includes('column') || error.code === 'PGRST204') {
          const { error: fbErr } = await supabase.from('exams').update({ status: 'approved' }).eq('id', selectedExam.id)
          if (fbErr) throw fbErr
        } else {
          throw error
        }
      }

      toast.success(`Exam "${selectedExam.title}" approved! It is ready to be published.`)
      setShowApprove(false); setSelectedExam(null)
      await loadExams(); setActiveTab('approved')
    } catch (err: any) {
      toast.error(err.message || 'Approval failed')
    } finally { setProcessing(false) }
  }

  // ── PUBLISH WITH ATTENDANCE ────────────────────────────────────────────
  const openPublishModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setAttendanceSearch('')
    setAttendanceTouched(false)
    setShowPublishModal(true)
    setLoadingAttendance(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, class, email, admission_number')
        .eq('role', 'student')
        .eq('is_active', true)
        .order('full_name', { ascending: true })

      if (error) throw error

      const allActive = (data || []) as Student[]

      // Use the universal matcher — handles "SS1" (all), "SS1 Science" (dept),
      // "SS1 Arts" (dept), "SS1 Commercial" (dept), "JSS 1" (all), etc.
      const matched = matchStudentsByExamClass(exam.class || '', allActive)

      if (matched.length === 0) {
        console.warn('[publish] No students matched', {
          examClass: exam.class,
          examYear: extractYear(exam.class || ''),
          examDept: extractDept(exam.class || ''),
          availableClasses: Array.from(new Set(allActive.map(s => s.class))),
        })
        toast.error(
          `No active students found for "${exam.class}". ` +
          `Available classes: ${Array.from(new Set(allActive.map(s => s.class))).join(', ') || '(none)'}`
        )
        if (mountedRef.current) setClassStudents([])
        return
      }

      // Everyone in the matched set starts as PRESENT. Admin unchecks the absent ones.
      const withSelection = matched.map(s => ({ ...s, selected: true }))

      if (!mountedRef.current) return
      setClassStudents(withSelection)
    } catch (err: any) {
      toast.error('Could not load student list for attendance: ' + (err.message || 'unknown'))
    } finally {
      if (mountedRef.current) setLoadingAttendance(false)
    }
  }

  const handlePublishWithAttendance = async () => {
    if (!selectedExam) return
    const presentCount = classStudents.filter(s => s.selected).length
    if (classStudents.length === 0) {
      toast.error('No students found for this exam class. Cannot publish.')
      return
    }
    if (presentCount === 0) {
      toast.error('No students marked present. Tick at least one student, or reject the exam.')
      return
    }

    const excludedIds = classStudents
      .filter(s => !s.selected)
      .map(s => s.id)
      .filter(id => UUID_RE.test(id))

    setProcessing(true)
    try {
      const { term, session_year } = await fetchCurrentTerm()
      const now = new Date().toISOString()
      const payload: Record<string, any> = {
        status: 'published',
        is_published: true,
        is_active: true,
        is_archived: false,
        published_at: now,
        published_by: profile?.id,
        term,
        session_year,
        excluded_student_ids: excludedIds,
      }
      const { error } = await supabase.from('exams').update(payload).eq('id', selectedExam.id)
      if (error) throw error

      toast.success(
        `Published! Live for ${presentCount} present student${presentCount !== 1 ? 's' : ''}` +
        (excludedIds.length > 0
          ? ` (${excludedIds.length} absent excluded).`
          : ' (all present).')
      )
      setShowPublishModal(false); setSelectedExam(null)
      await loadExams(); setActiveTab('published')
    } catch (err: any) {
      toast.error(`Publishing failed: ${err.message || 'unknown error'}. Exam was NOT published.`)
    } finally { setProcessing(false) }
  }

  // ── ADMIT LATE ─────────────────────────────────────────────────────────
  const openAdmitLateModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowAdmitLateModal(true)
    setLoadingAbsentStudents(true)
    try {
      const excludedIds = (exam.excluded_student_ids || []).filter(id => UUID_RE.test(id))
      if (excludedIds.length === 0) {
        setAbsentStudentsList([]); setLoadingAbsentStudents(false); return
      }
      const { data, error } = await supabase.from('profiles').select('id, full_name, class, email').in('id', excludedIds)
      if (error) throw error
      if (!mountedRef.current) return
      setAbsentStudentsList((data || []).map(s => ({ ...s, selected: true })))
    } catch {
      toast.error('Failed to load absent students')
    } finally {
      if (mountedRef.current) setLoadingAbsentStudents(false)
    }
  }

  const handleConfirmAdmitLate = async () => {
    if (!selectedExam) return
    const admittedIds = absentStudentsList.filter(s => s.selected).map(s => s.id)
    if (admittedIds.length === 0) { toast.error('Select at least one arriving student to admit.'); return }
    const currentExcluded = (selectedExam.excluded_student_ids || []).filter(id => UUID_RE.test(id))
    const updatedExcluded = currentExcluded.filter(id => !admittedIds.includes(id))
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({ excluded_student_ids: updatedExcluded }).eq('id', selectedExam.id)
      if (error) throw error
      toast.success(`Admitted ${admittedIds.length} student(s) to CBT hall. Existing attempts remain unaffected!`)
      setShowAdmitLateModal(false); setSelectedExam(null)
      await loadExams()
    } catch (err: any) {
      toast.error(err.message || 'Failed to admit students')
    } finally { setProcessing(false) }
  }

  // ── BLOCK / TERMINATE ──────────────────────────────────────────────────
  const openBlockModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowBlockModal(true)
    setLoadingBlockCandidates(true)
    setBlockSelectedIds(new Set())
    setBlockSearch('')
    try {
      const { data: rawAttempts, error } = await supabase.from('exam_attempts').select('*')
        .eq('exam_id', exam.id).order('created_at', { ascending: false })
      if (error) throw error

      const studentIds = Array.from(new Set((rawAttempts || []).map((a: any) => a.student_id).filter((id: any) => UUID_RE.test(String(id)))))
      let profileMap: Record<string, any> = {}
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, class, admission_number').in('id', studentIds)
        profileMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
      }
      const enriched = (rawAttempts || []).map((a: any) => ({
        ...a,
        profiles: profileMap[a.student_id] || { full_name: 'Unknown Student', class: '' },
      }))
      if (!mountedRef.current) return
      setBlockCandidates(enriched as ExamAttempt[])
    } catch {
      toast.error('Failed to load attempts for blocking')
    } finally {
      if (mountedRef.current) setLoadingBlockCandidates(false)
    }
  }

  const handleConfirmBlock = async () => {
    if (!selectedExam || blockSelectedIds.size === 0) {
      toast.error('Select at least one student to block/terminate.'); return
    }
    setProcessing(true)
    try {
      const ids = Array.from(blockSelectedIds).filter(id => UUID_RE.test(id))
      const attemptsToTerminate = blockCandidates.filter(a => ids.includes(a.student_id)).map(a => a.id)

      if (attemptsToTerminate.length > 0) {
        const { error: termErr } = await supabase.from('exam_attempts')
          .update({ status: 'terminated', submitted_at: new Date().toISOString() })
          .in('id', attemptsToTerminate)
        if (termErr) throw termErr
      }

      const currentExcluded = (selectedExam.excluded_student_ids || []).filter(id => UUID_RE.test(id))
      const updatedExcluded = Array.from(new Set([...currentExcluded, ...ids]))
      const { error: examErr } = await supabase.from('exams')
        .update({ excluded_student_ids: updatedExcluded }).eq('id', selectedExam.id)
      if (examErr) throw examErr

      toast.success(`Blocked & terminated ${ids.length} student(s). They can no longer continue or re-enter.`)
      setShowBlockModal(false); setSelectedExam(null)
      await loadExams()
    } catch (err: any) {
      toast.error(err.message || 'Failed to block students')
    } finally { setProcessing(false) }
  }

  // ── REJECT / RETURN / ARCHIVE / DELETE ─────────────────────────────────
  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({
        status: 'draft', is_published: false, is_active: false, review_notes: rejectionReason,
      }).eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam sent back to teacher for revision')
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
      toast.success('Exam returned to teacher draft mode')
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
      // student_answers has no attempt_id — link via (exam_id, student_id).
      await supabase.from('student_answers').delete().eq('exam_id', examIdToDelete)
      await supabase.from('exam_attempts').delete().eq('exam_id', examIdToDelete)
      await supabase.from('ca_scores').delete().eq('exam_id', examIdToDelete)

      const { error } = await supabase.from('exams').delete().eq('id', examIdToDelete)
      if (error) throw error

      if (!mountedRef.current) return
      setExams(prev => prev.filter(e => e.id !== examIdToDelete))
      toast.success(`"${examTitle}" deleted permanently`)
      setShowDelete(false); setSelectedExam(null)
      await loadExams()
    } catch (err: any) {
      console.error('Delete Error:', err)
      try {
        await supabase.from('exams').update({
          is_archived: true, status: 'archived', is_published: false, is_active: false
        }).eq('id', examIdToDelete)
        toast.success('Exam had linked references and was safely archived.')
        setShowDelete(false); setSelectedExam(null); await loadExams()
      } catch (archiveErr: any) {
        toast.error(archiveErr.message || 'Failed to delete exam')
      }
    } finally { setProcessing(false) }
  }

  const handleUnarchive = async (exam: Exam) => {
    setProcessing(true)
    try {
      const { error } = await supabase.from('exams').update({
        is_archived: false, is_active: true, is_published: true, status: 'published'
      }).eq('id', exam.id)
      if (error) throw error
      toast.success('Exam restored to published')
      loadExams()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessing(false) }
  }

  // ── RETRY ──────────────────────────────────────────────────────────────
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
      const { data: students, error: studentsError } = await supabase
        .from('profiles').select('id, full_name, class, admission_number')
        .eq('role', 'student').eq('is_active', true).order('class').order('full_name')
      if (studentsError) throw studentsError

      const allStu = (students || []) as Student[]
      if (!mountedRef.current) return
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

      const { data: attempts } = await supabase.from('exam_attempts').select('student_id').eq('exam_id', exam.id)
      if (attempts) {
        const counts: Record<string, number> = {}
        attempts.forEach((a: any) => { counts[a.student_id] = (counts[a.student_id] || 0) + 1 })
        if (mountedRef.current) setAttemptCounts(counts)
      }
    } catch {
      toast.error('Failed to load students for retake reset')
    } finally {
      if (mountedRef.current) setLoadingStudents(false)
    }
  }

  const handleRetry = async () => {
    if (!selectedExam) return
    if (retryScope === 'class' && !retrySelectedClass) { toast.error('Select a class to reset'); return }
    if (retryScope === 'individual' && selectedStudentIds.size === 0) { toast.error('Select at least one student'); return }
    setProcessing(true)
    try {
      let deletedCount = 0
      let targetLabel = ''

      const classStudentIds = retryScope === 'class'
        ? (studentsByClass[retrySelectedClass] || []).map(s => s.id)
        : Array.from(selectedStudentIds)

      if (classStudentIds.length === 0) {
        toast.error(retryScope === 'class' ? `No students found in ${retrySelectedClass}` : 'No students selected')
        setProcessing(false); return
      }

      targetLabel = retryScope === 'class'
        ? `${retrySelectedClass} (${classStudentIds.length} students)`
        : `${classStudentIds.length} selected student(s)`

      // student_answers has no attempt_id — delete by (exam_id, student_id).
      await supabase.from('student_answers').delete().eq('exam_id', selectedExam.id).in('student_id', classStudentIds)

      const { data: deletedData, error } = await supabase
        .from('exam_attempts').delete().eq('exam_id', selectedExam.id).in('student_id', classStudentIds).select('id')
      if (error) throw error
      deletedCount = deletedData?.length || 0

      // Clear excluded status so retried students can re-enter.
      const currentExcluded = (selectedExam.excluded_student_ids || []).filter(id => UUID_RE.test(id))
      const updatedExcluded = currentExcluded.filter(id => !classStudentIds.includes(id))
      await supabase.from('exams').update({
        is_active: true, is_published: true, status: 'published', excluded_student_ids: updatedExcluded,
      }).eq('id', selectedExam.id)

      if (deletedCount === 0) toast.info(`No active attempts found for ${targetLabel}.`)
      else toast.success(`Cleared ${deletedCount} attempt(s) for ${targetLabel}. Students can retake now.`)

      setShowRetry(false); setSelectedExam(null); setSelectedStudentIds(new Set())
      loadExams()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset exam attempts')
    } finally { setProcessing(false) }
  }

  // ── EXTRA TIME ─────────────────────────────────────────────────────────
  const openExtraTimeDialog = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowExtraTime(true)
    setLoadingAttempts(true)
    setSelectedAttemptId(null)
    setExtraMinutes(10)
    setCustomMinutes('')
    setExtraTimeSearch('')
    try {
      const { data: rawAttempts, error } = await supabase.from('exam_attempts').select('*')
        .eq('exam_id', exam.id).order('created_at', { ascending: false })
      if (error) throw error

      const studentIds = Array.from(new Set((rawAttempts || []).map((a: any) => a.student_id).filter((id: any) => UUID_RE.test(String(id)))))
      let profileMap: Record<string, any> = {}
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, class, admission_number').in('id', studentIds)
        profileMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
      }
      const enriched = (rawAttempts || []).map((a: any) => ({
        ...a,
        profiles: profileMap[a.student_id] || { full_name: 'Unknown Student', class: '' },
      }))
      if (!mountedRef.current) return
      setExtraTimeAttempts(enriched as ExamAttempt[])
    } catch {
      toast.error('Failed to load active attempts')
    } finally {
      if (mountedRef.current) setLoadingAttempts(false)
    }
  }

  const handleGrantExtraTime = async () => {
    if (!selectedAttemptId) { toast.error('Select a student attempt first'); return }
    const minutes = customMinutes ? parseInt(customMinutes, 10) : extraMinutes
    if (!minutes || minutes <= 0 || minutes > 180) { toast.error('Enter valid extra minutes (1–180)'); return }
    setProcessing(true)
    try {
      const { data: attempt, error: fetchErr } = await supabase.from('exam_attempts')
        .select('id, status, is_auto_submitted, extra_time_minutes, time_remaining_seconds')
        .eq('id', selectedAttemptId).single()
      if (fetchErr || !attempt) throw new Error('Attempt not found')

      const isTerminal = (TERMINAL_ATTEMPT_STATUSES as readonly string[]).includes(String(attempt.status))
      const wasAutoSubmitted = attempt.is_auto_submitted === true
      if (isTerminal || wasAutoSubmitted) {
        toast.error(`Cannot grant extra time: session is already ${attempt.status}. Only live in-progress tests can be extended.`)
        setProcessing(false); return
      }

      const currentExtra = attempt.extra_time_minutes || 0
      const currentSeconds = attempt.time_remaining_seconds || 0
      const newExtra = currentExtra + minutes
      const addedSeconds = minutes * 60

      const { error } = await supabase.from('exam_attempts').update({
        extra_time_minutes: newExtra,
        time_remaining_seconds: currentSeconds + addedSeconds,
        extra_time_updated_at: new Date().toISOString(),
        status: 'in_progress',
      }).eq('id', selectedAttemptId)
      if (error) throw error

      const attemptData = extraTimeAttempts.find(a => a.id === selectedAttemptId)
      const studentName = attemptData?.profiles?.full_name || 'Student'
      toast.success(`Granted +${minutes} extra minutes to ${studentName}! Timer is extended live.`)
      if (selectedExam) await openExtraTimeDialog(selectedExam)
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant extra time')
    } finally { setProcessing(false) }
  }

  // ── FILTERING ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => exams.filter(exam => {
    const archived = exam.is_archived === true || exam.status === 'archived'
    if (activeTab === 'pending') {
      if (!['pending', 'draft', 'submitted'].includes(exam.status)) return false
      if (archived) return false
    } else if (activeTab === 'approved') {
      if (exam.status !== 'approved') return false
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
  const approvedCount = exams.filter(e => e.status === 'approved' && !e.is_archived).length
  const publishedCount = exams.filter(e => e.status === 'published' && !e.is_archived && isCurrentTerm(e, currentTermInfo)).length
  const archivedCount = exams.filter(e => e.is_archived === true || e.status === 'archived' || (e.status === 'published' && !isCurrentTerm(e, currentTermInfo))).length

  const filteredAttendanceStudents = useMemo(() => {
    if (!attendanceSearch) return classStudents
    const q = attendanceSearch.toLowerCase()
    return classStudents.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q)
    )
  }, [classStudents, attendanceSearch])

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

  const extendableAttempts = useMemo(() => filteredAttempts.filter(isAttemptExtendable), [filteredAttempts])
  const nonExtendableAttempts = useMemo(() => filteredAttempts.filter(a => !isAttemptExtendable(a)), [filteredAttempts])

  const filteredBlockCandidates = useMemo(() => {
    if (!blockSearch) return blockCandidates
    const q = blockSearch.toLowerCase()
    return blockCandidates.filter(a =>
      a.profiles?.full_name?.toLowerCase().includes(q) ||
      a.profiles?.class?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q)
    )
  }, [blockCandidates, blockSearch])

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

  const toggleBlockStudent = (studentId: string) => {
    setBlockSelectedIds(prev => { const next = new Set(prev); next.has(studentId) ? next.delete(studentId) : next.add(studentId); return next })
  }

  const clearFilters = () => { setSearchQuery(''); setSelectedClass('all'); setSelectedDept('all') }
  const hasActiveFilters = searchQuery || selectedClass !== 'all' || selectedDept !== 'all'

  // ── ROW ACTIONS ────────────────────────────────────────────────────────
  const renderRowActions = (exam: Exam) => {
    const excludedCount = (exam.excluded_student_ids || []).filter(id => UUID_RE.test(id)).length
    return (
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        <button
          onClick={() => { setSelectedExam(exam); loadQs(exam); setShowPreview(true) }}
          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          title="Preview Exam"
        >
          <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
        </button>

        {activeTab === 'pending' && (
          <>
            <button
              onClick={() => { setSelectedExam(exam); setShowApprove(true) }}
              className="h-8 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Approve Exam"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => { setSelectedExam(exam); setShowReject(true) }}
              className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors"
              title="Reject Exam"
            >
              <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            </button>
            <button
              onClick={() => { setSelectedExam(exam); setShowDelete(true) }}
              className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              title="Delete Exam"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </button>
          </>
        )}

        {activeTab === 'approved' && (
          <>
            <button
              onClick={() => openPublishModal(exam)}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Publish with Hall Attendance Checklist"
            >
              <UserCheck className="h-3.5 w-3.5" /> Publish with Attendance
            </button>
            <button
              onClick={() => { setSelectedExam(exam); setShowReturn(true) }}
              className="h-8 w-8 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 flex items-center justify-center transition-colors"
              title="Return to Teacher"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </button>
          </>
        )}

        {activeTab === 'published' && (
          <>
            {excludedCount > 0 && (
              <button
                onClick={() => openAdmitLateModal(exam)}
                className="h-8 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Admit arriving students"
              >
                <UserPlus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Admit Late ({excludedCount})
              </button>
            )}
            <button
              onClick={() => openBlockModal(exam)}
              className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 flex items-center justify-center transition-colors"
              title="Block / Terminate a student"
            >
              <Ban className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            </button>
            <button
              onClick={() => openExtraTimeDialog(exam)}
              className="h-8 w-8 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 flex items-center justify-center transition-colors"
              title="Grant Extra Time"
            >
              <Hourglass className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            </button>
            <button
              onClick={() => openRetryDialog(exam)}
              className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 flex items-center justify-center transition-colors"
              title="Allow Retry"
            >
              <RotateCcw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={() => { setSelectedExam(exam); setShowArchive(true) }}
              className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </button>
          </>
        )}

        {activeTab === 'archived' && (
          <>
            <button
              onClick={() => handleUnarchive(exam)}
              disabled={processing}
              className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
              title="Restore"
            >
              <RotateCcw className="h-3 w-3" /> Restore
            </button>
            <button
              onClick={() => { setSelectedExam(exam); setShowDelete(true) }}
              className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            </button>
          </>
        )}
      </div>
    )
  }

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

  const renderExamRow = (exam: Exam) => {
    const excludedCount = (exam.excluded_student_ids || []).filter(id => UUID_RE.test(id)).length
    return (
      <TableRow key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors border-slate-200 dark:border-slate-800">
        <TableCell className="py-3">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{exam.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{exam.subject}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <ClassBadge cls={exam.class} />
              <DeptPill exam={exam} />
              {exam.status === 'published' && excludedCount > 0 && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                  {excludedCount} absent excluded
                </span>
              )}
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
            <span className="flex items-center gap-1" title="Duration"><Timer className="h-3 w-3" /> {exam.duration}m</span>
            <span className="flex items-center gap-1" title="Questions"><Hash className="h-3 w-3" /> {exam.total_questions}</span>
            <span className="flex items-center gap-1" title="Total marks"><Target className="h-3 w-3" /> {exam.total_marks}</span>
          </div>
        </TableCell>
        <TableCell><StatusPill status={exam.is_archived ? 'archived' : exam.status} /></TableCell>
        <TableCell className="text-right">{renderRowActions(exam)}</TableCell>
      </TableRow>
    )
  }

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
                Approve, publish with attendance, admit late students, and monitor CBT tests
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

        {/* 4 STAGE STATS */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
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
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Review</p>
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{pendingCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">Awaiting approval</p>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={cn(
              'relative bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border transition-all text-left group overflow-hidden',
              activeTab === 'approved'
                ? 'ring-2 ring-blue-400 dark:ring-blue-500 border-blue-200 dark:border-blue-500/30 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md'
            )}
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 dark:opacity-20 rounded-full -mr-4 -mt-4 group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved</p>
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{approvedCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">Ready to publish</p>
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
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live & Active</p>
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{publishedCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">CBT ongoing</p>
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
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">Past records</p>
            </div>
          </button>
        </section>

        {/* SEARCH & FILTERS */}
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
                <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> exam{filtered.length !== 1 ? 's' : ''} in {activeTab}
              </p>
              <button onClick={toggleAllClasses} className="text-[11px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold">
                {groupKeys.every(c => expandedClasses.has(c)) ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          )}
        </div>

        {/* LIST / GROUPED CARDS */}
        <section className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-16 px-6 text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No exams found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {hasActiveFilters ? 'Try adjusting your filters or search query.' : `No exams in ${activeTab} stage.`}
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
                            <TableBody>{cls.map(exam => renderExamRow(exam))}</TableBody>
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
                  <TableBody>{filtered.map(exam => renderExamRow(exam))}</TableBody>
                </Table>
              </div>
            </div>
          )}
        </section>

        {/* PREVIEW DIALOG */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[92vh] p-0 overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-4 sm:px-6 py-5 text-white overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
              <div className="relative">
                <DialogHeader className="space-y-0 text-left">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Admin Review & Preview</p>
                        <DialogTitle className="text-base sm:text-xl font-bold leading-tight text-white">
                          {selectedExam?.title || 'Loading exam...'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Detailed exam preview with formatted tables and diagrams</DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                    <BookOpen className="h-3 w-3" /> {selectedExam?.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                    <GraduationCap className="h-3 w-3" /> {selectedExam?.class}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                    <Timer className="h-3 w-3" /> {selectedExam?.duration} mins
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
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
                    <Layers className="h-3.5 w-3.5" /> Objective Questions
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{examQs.length}</span>
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
                    <PenTool className="h-3.5 w-3.5" /> Theory Questions
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{theoryQs.length}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
              {loadingQs ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500 dark:text-violet-400 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading questions & tables...</p>
                </div>
              ) : (
                <>
                  {previewTab === 'info' && selectedExam && (
                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Objective</p>
                          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{examQs.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Theory</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{theoryQs.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pass Mark</p>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{selectedExam.pass_mark || selectedExam.passing_percentage || 40}%</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{selectedExam.duration}m</p>
                        </div>
                      </div>
                      {selectedExam.instructions && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Instructions for Candidates
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedExam.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'objective' && examQs.length > 0 && (
                    <div className="p-3 sm:p-6 space-y-4">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Question {currentQIdx + 1} of {examQs.length}
                          </span>
                          {(examQs[currentQIdx]?.imageUrl || examQs[currentQIdx]?.image_url) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">
                              <ImageIcon className="h-3 w-3" /> Diagram
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentQIdx(i => Math.max(0, i - 1))}
                            disabled={currentQIdx === 0}
                            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCurrentQIdx(i => Math.min(examQs.length - 1, i + 1))}
                            disabled={currentQIdx === examQs.length - 1}
                            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm">
                        <QuestionContent
                          text={examQs[currentQIdx]?.question || examQs[currentQIdx]?.question_text || 'Question text missing'}
                          imageUrl={examQs[currentQIdx]?.imageUrl || examQs[currentQIdx]?.image_url}
                          imageCaption={examQs[currentQIdx]?.imageCaption || examQs[currentQIdx]?.image_caption}
                        />
                        <div className="space-y-2 pt-2">
                          {(examQs[currentQIdx]?.options || []).map((opt: any, i: number) => {
                            const optText = typeof opt === 'string' ? opt : opt.text || ''
                            const letter = String.fromCharCode(65 + i)
                            const correctAnswer = examQs[currentQIdx]?.correct_answer ?? examQs[currentQIdx]?.correct_option
                            const isCorrect = String(correctAnswer) === letter || String(correctAnswer) === optText || String(correctAnswer) === String(i)
                            return (
                              <div
                                key={i}
                                className={cn(
                                  'p-3.5 rounded-xl border text-sm flex items-start gap-3 transition-colors',
                                  isCorrect
                                    ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                                )}
                              >
                                <div className={cn(
                                  'h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                )}>
                                  {letter}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <QuestionContent text={optText} />
                                </div>
                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="h-3.5 w-3.5" /> Correct
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'theory' && theoryQs.length > 0 && (
                    <div className="p-3 sm:p-6 space-y-4">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Theory Question {currentTheoryIdx + 1} of {theoryQs.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentTheoryIdx(i => Math.max(0, i - 1))}
                            disabled={currentTheoryIdx === 0}
                            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCurrentTheoryIdx(i => Math.min(theoryQs.length - 1, i + 1))}
                            disabled={currentTheoryIdx === theoryQs.length - 1}
                            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <QuestionContent
                              text={theoryQs[currentTheoryIdx]?.question || theoryQs[currentTheoryIdx]?.question_text || 'Question text missing'}
                              imageUrl={theoryQs[currentTheoryIdx]?.image_url || theoryQs[currentTheoryIdx]?.imageUrl}
                              imageCaption={theoryQs[currentTheoryIdx]?.image_caption || theoryQs[currentTheoryIdx]?.imageCaption}
                            />
                          </div>
                          {theoryQs[currentTheoryIdx]?.marks > 0 && (
                            <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/30 px-2.5 py-1 rounded-full whitespace-nowrap self-start">
                              {theoryQs[currentTheoryIdx].marks} Marks
                            </span>
                          )}
                        </div>
                        {theoryQs[currentTheoryIdx]?.sub_questions && theoryQs[currentTheoryIdx].sub_questions!.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="pl-2 sm:pl-3 border-l-2 border-violet-400 dark:border-violet-500/60">
                              {renderSubQuestions(theoryQs[currentTheoryIdx].sub_questions!)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-end gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Close</Button>
              {selectedExam && ['pending', 'draft', 'submitted'].includes(selectedExam.status) && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setShowPreview(false); setShowApprove(true) }}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve Exam
                </Button>
              )}
              {selectedExam && selectedExam.status === 'approved' && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setShowPreview(false); openPublishModal(selectedExam) }}>
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Publish with Attendance
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* APPROVE DIALOG */}
        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle className="dark:text-white">Approve Exam</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Mark <strong>{selectedExam?.title}</strong> as approved.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
              <p>Approved exams will move to the <strong>Approved</strong> queue, where you can conduct hall attendance verification before going live.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprove(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApproveOnly} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Approving...</> : 'Confirm Approval'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PUBLISH WITH ATTENDANCE MODAL */}
        <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
          <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg dark:text-white">
                      Publish Exam & Hall Attendance
                    </DialogTitle>
                    <DialogDescription className="text-xs dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-200">{selectedExam?.class}</strong> students are listed below.
                      Everyone is marked <strong className="text-emerald-700 dark:text-emerald-300">present</strong> by default —
                      uncheck the absent ones and they will be blocked.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <input
                type="text"
                placeholder="Filter student list..."
                value={attendanceSearch}
                onChange={e => setAttendanceSearch(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-60"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {classStudents.filter(s => s.selected).length}
                  </span>
                  {' '}Present /{' '}
                  <span className="text-rose-600 dark:text-rose-400">
                    {classStudents.filter(s => !s.selected).length}
                  </span>
                  {' '}Absent / {classStudents.length} Total
                </span>
                <button
                  onClick={() => { setClassStudents(prev => prev.map(s => ({ ...s, selected: true }))); setAttendanceTouched(true) }}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold border border-slate-200 dark:border-slate-600"
                >
                  All Present
                </button>
                <button
                  onClick={() => { setClassStudents(prev => prev.map(s => ({ ...s, selected: false }))); setAttendanceTouched(true) }}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold border border-slate-200 dark:border-slate-600"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-96 space-y-2 flex-1">
              {loadingAttendance ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-500 mb-2" />
                  <p className="text-xs text-slate-500">Loading student attendance list...</p>
                </div>
              ) : filteredAttendanceStudents.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No students match this filter.
                </div>
              ) : (
                filteredAttendanceStudents.map(student => (
                  <label
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs sm:text-sm cursor-pointer transition ${
                      student.selected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-900 dark:text-white'
                        : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300/40 text-slate-500 dark:text-slate-400 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!student.selected}
                        onChange={() => {
                          setAttendanceTouched(true)
                          setClassStudents(prev => prev.map(s => s.id === student.id ? { ...s, selected: !s.selected } : s))
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-semibold">{student.full_name}</p>
                        <p className="text-xs text-slate-400">
                          {student.admission_number ? `${student.admission_number} · ` : ''}
                          {student.email || student.class}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      student.selected
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                    }`}>
                      {student.selected ? 'Present' : 'Absent (Blocked)'}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPublishModal(false)} className="dark:bg-slate-800 dark:border-slate-700">Cancel</Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={handlePublishWithAttendance}
                disabled={processing || classStudents.length === 0 || classStudents.filter(s => s.selected).length === 0}
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Publishing...</>
                ) : (
                  <><Send className="h-4 w-4 mr-1.5" /> Publish ({classStudents.filter(s => s.selected).length} Present)</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ADMIT LATE MODAL */}
        <Dialog open={showAdmitLateModal} onOpenChange={setShowAdmitLateModal}>
          <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg dark:text-white">Admit Arriving Students</DialogTitle>
                    <DialogDescription className="text-xs dark:text-slate-400">
                      Grant immediate CBT access to late-arrived students without interrupting ongoing sessions.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>
            <div className="p-5 overflow-y-auto space-y-2 flex-1 max-h-80">
              {loadingAbsentStudents ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
                </div>
              ) : absentStudentsList.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">All students for this exam have already been admitted!</p>
              ) : (
                absentStudentsList.map(st => (
                  <label
                    key={st.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs sm:text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!st.selected}
                        onChange={() => {
                          setAbsentStudentsList(prev => prev.map(s => s.id === st.id ? { ...s, selected: !s.selected } : s))
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{st.full_name}</p>
                        <p className="text-xs text-slate-400">{st.email || st.class}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {st.selected ? 'Admit to CBT' : 'Keep Blocked'}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdmitLateModal(false)} className="dark:bg-slate-800 dark:border-slate-700">Cancel</Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleConfirmAdmitLate} disabled={processing || absentStudentsList.filter(s => s.selected).length === 0}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Admitting...</> : `Admit (${absentStudentsList.filter(s => s.selected).length}) Student(s)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* BLOCK / TERMINATE MODAL */}
        <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-2">
                <Ban className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <DialogTitle className="dark:text-white">Block / Terminate Student(s)</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Instantly block a student's attempt and prevent re-entry into <strong className="text-slate-700 dark:text-slate-200">{selectedExam?.title}</strong>. Use for cheating or unauthorized remote access.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                value={blockSearch}
                onChange={e => setBlockSearch(e.target.value)}
                placeholder="Search by student, class, or status..."
                className="text-xs outline-none w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5">
              {loadingBlockCandidates ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading attempts...</p>
                </div>
              ) : filteredBlockCandidates.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
                  No attempts found for this exam.
                </div>
              ) : (
                filteredBlockCandidates.map(a => {
                  const isSelected = blockSelectedIds.has(a.student_id)
                  const alreadyTerminated = a.status === 'terminated'
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition',
                        alreadyTerminated
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : isSelected
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={alreadyTerminated}
                          onChange={() => toggleBlockStudent(a.student_id)}
                          className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{a.profiles?.full_name || 'Unknown'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <AttemptStatusPill status={a.status} />
                            {alreadyTerminated && <span className="text-[9px] font-bold text-slate-500">already blocked</span>}
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setShowBlockModal(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirmBlock} disabled={processing || blockSelectedIds.size === 0}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Blocking...</> : <><Ban className="h-3.5 w-3.5 mr-1.5" /> Block {blockSelectedIds.size} Student(s)</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE MODAL */}
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
              <p>You are about to delete <strong>{selectedExam?.title}</strong>. All associated student attempts, answers and CA scores will be removed.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDelete(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...</> : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* RETRY MODAL */}
        <Dialog open={showRetry} onOpenChange={setShowRetry}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-2">
                <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle className="dark:text-white">Allow Retake</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Reset attempts for <strong className="text-slate-700 dark:text-slate-200">{selectedExam?.title}</strong>.
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
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                      {selectedInClass} selected
                                    </span>
                                  )}
                                </div>
                                <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                              </button>
                              {isOpen && (
                                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                  {students.map(st => {
                                    const isChecked = selectedStudentIds.has(st.id)
                                    const attempted = (attemptCounts[st.id] || 0) > 0
                                    return (
                                      <label
                                        key={st.id}
                                        className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleStudent(st.id)}
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                                          />
                                          <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{st.full_name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                              {st.admission_number ? `${st.admission_number} · ` : ''}{st.class}
                                            </p>
                                          </div>
                                        </div>
                                        {attempted && (
                                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            Attempted
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
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setShowRetry(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleRetry} disabled={processing || loadingStudents}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Resetting...</> : <><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Attempts</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EXTRA TIME MODAL */}
        <Dialog open={showExtraTime} onOpenChange={setShowExtraTime}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mb-2">
                <Hourglass className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <DialogTitle className="dark:text-white">Grant Extra Time</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Extend live in-progress attempts for <strong className="text-slate-700 dark:text-slate-200">{selectedExam?.title}</strong>. Completed or graded attempts are protected.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  value={extraTimeSearch}
                  onChange={e => setExtraTimeSearch(e.target.value)}
                  placeholder="Search by student, class, or status..."
                  className="text-xs outline-none w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {loadingAttempts ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading attempts...</p>
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
                  No attempts found for this exam.
                </div>
              ) : (
                <div className="space-y-2">
                  {extendableAttempts.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Live Attempts ({extendableAttempts.length})
                      </p>
                      <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                        {extendableAttempts.map(a => (
                          <button
                            key={a.id}
                            onClick={() => setSelectedAttemptId(a.id)}
                            className={cn(
                              'w-full p-2.5 rounded-lg border-2 text-left transition-all flex items-center justify-between gap-2',
                              selectedAttemptId === a.id
                                ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-500/10 ring-2 ring-orange-100 dark:ring-orange-500/30'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{a.profiles?.full_name || 'Unknown'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <AttemptStatusPill status={a.status} />
                                {(a.extra_time_minutes || 0) > 0 && (
                                  <span className="text-[9px] font-bold text-orange-700 dark:text-orange-300">
                                    +{a.extra_time_minutes}m granted
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedAttemptId === a.id && <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {nonExtendableAttempts.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Protected / Concluded ({nonExtendableAttempts.length})
                      </p>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto opacity-70">
                        {nonExtendableAttempts.map(a => (
                          <div
                            key={a.id}
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{a.profiles?.full_name || 'Unknown'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <AttemptStatusPill status={a.status} />
                                {a.is_auto_submitted && (
                                  <span className="text-[9px] font-bold text-red-700 dark:text-red-300">auto-submitted</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Protected</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAttemptId && (
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-[11px] font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wider">Grant Minutes</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 15, 20, 30].map(m => (
                      <button
                        key={m}
                        onClick={() => { setExtraMinutes(m); setCustomMinutes('') }}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                          extraMinutes === m && !customMinutes
                            ? 'bg-orange-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30'
                        )}
                      >
                        +{m}m
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customMinutes}
                      onChange={e => setCustomMinutes(e.target.value)}
                      placeholder="Custom"
                      className="w-20 px-2 py-1 rounded-lg text-xs border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setShowExtraTime(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleGrantExtraTime} disabled={processing || !selectedAttemptId}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Granting...</> : <><Hourglass className="h-3.5 w-3.5 mr-1.5" /> Grant Extra Time</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ARCHIVE MODAL */}
        <Dialog open={showArchive} onOpenChange={setShowArchive}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                <Archive className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <DialogTitle className="dark:text-white">Archive Exam</DialogTitle>
              <DialogDescription className="dark:text-slate-400">This will move the exam to archived status.</DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>{selectedExam?.title}</strong> will be hidden from the live view but preserved for records. You can restore it later from the Archived tab.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowArchive(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-slate-600 hover:bg-slate-700 text-white" onClick={handleArchive} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Archiving...</> : 'Archive Exam'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* REJECT MODAL */}
        <Dialog open={showReject} onOpenChange={setShowReject}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="dark:text-white">Reject Exam</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Send <strong>{selectedExam?.title}</strong> back to the teacher for revision.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what needs to be fixed..."
                rows={4}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReject(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Rejecting...</> : 'Reject & Return'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* RETURN MODAL */}
        <Dialog open={showReturn} onOpenChange={setShowReturn}>
          <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-2">
                <Edit3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="dark:text-white">Return to Teacher</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Return <strong>{selectedExam?.title}</strong> to teacher draft mode for editing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Note to Teacher (optional)</label>
              <Textarea
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder="Add a note about what needs editing..."
                rows={3}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturn(false)} disabled={processing} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleReturn} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Returning...</> : 'Return to Teacher'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}