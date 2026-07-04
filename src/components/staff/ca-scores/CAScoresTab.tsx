'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  Save, Search, Edit, Trash2, Users, Loader2, RefreshCw,
  CheckCircle2, FileText, TrendingUp,
  Award, GraduationCap, BarChart3, SaveAll, Trash,
  AlertTriangle, Database, Layers, Lock, Circle,
  ChevronRight, BookOpen, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'

const GRADING_SCALE = [
  { grade: 'A1', min: 75, max: 100, label: 'Excellent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { grade: 'B2', min: 70, max: 74, label: 'Very Good', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { grade: 'B3', min: 65, max: 69, label: 'Good', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { grade: 'C4', min: 60, max: 64, label: 'Credit', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { grade: 'C5', min: 55, max: 59, label: 'Credit', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { grade: 'C6', min: 50, max: 54, label: 'Credit', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { grade: 'D7', min: 45, max: 49, label: 'Pass', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { grade: 'E8', min: 40, max: 44, label: 'Pass', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { grade: 'F9', min: 0, max: 39, label: 'Fail', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
]

const getGrade = (percentage: number): string => {
  const grade = GRADING_SCALE.find(g => percentage >= g.min && percentage <= g.max)
  return grade?.grade || 'F9'
}

const getGradeColor = (grade: string): string => {
  return GRADING_SCALE.find(g => g.grade === grade)?.color || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}

const getGradeRemark = (grade: string): string => {
  return GRADING_SCALE.find(g => g.grade === grade)?.label || ''
}

const TERM_OPTIONS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const SENIOR_SUBJECTS = [
  'English Language', 'Mathematics', 'Civic Education',
  'Physics', 'Chemistry', 'Biology', 'Agricultural Science',
  'Economics', 'Geography', 'Government', 'Literature in English',
  'CRS', 'Yoruba', 'Commerce', 'Financial Accounting',
  'Data Processing', 'Further Mathematics'
]

const JUNIOR_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies',
  'Home Economics', 'CRS', 'Yoruba', 'French', 'Information Technology',
  'CCA', 'Music', 'PHE', 'History', 'Security Education'
]

const getAvailableSessions = (currentSession: string): string[] => {
  const year = parseInt(currentSession.split('/')[0])
  return [
    `${year - 1}/${year}`,
    `${year}/${year + 1}`,
    `${year + 1}/${year + 2}`,
  ]
}

const getClassVariations = (classType: string): string[] => {
  if (classType === 'JSS 1') return ['JSS 1']
  if (classType === 'JSS 2') return ['JSS 2']
  if (classType === 'JSS 3') return ['JSS 3']
  if (classType === 'SS1') return ['SS1 Science', 'SS1 Arts', 'SS1 Commercial']
  if (classType === 'SS2') return ['SS2 Science', 'SS2 Arts', 'SS2 Commercial']
  if (classType === 'SS3') return ['SS3 Science', 'SS3 Arts', 'SS3 Commercial']
  return [classType]
}

const isGeneralClass = (className: string): boolean => {
  return ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3'].includes(className)
}

interface ScoreEntry {
  ca1: string
  ca2: string
  exam: string
  is_saved?: boolean
}

interface Stats {
  totalStudents: number
  gradedStudents: number
  classAverage: number
  highestScore: number
  passCount: number
  failCount: number
  passRate: number
}

interface Student {
  id: string
  full_name: string
  class: string
  admission_number: string
  vin_id: string
}

interface SubjectStatus {
  hasScores: boolean
  enteredByMe: boolean
  enteredByOther: boolean
  otherTeacherName?: string
  studentCount: number
}

const STORAGE_KEYS = {
  SELECTED_CLASS: 'ca_scores_selected_class',
  SELECTED_SUBJECT: 'ca_scores_selected_subject',
  SELECTED_TERM: 'ca_scores_selected_term',
  SELECTED_YEAR: 'ca_scores_selected_year',
  SELECTED_EXAM: 'ca_scores_selected_exam',
  ACTIVE_TAB: 'ca_scores_active_tab',
  SKIP_EXAM: 'ca_scores_skip_exam',
}

const SubjectStatusIcon = ({ status }: { status?: SubjectStatus }) => {
  if (!status) return null
  if (status.enteredByOther) {
    return (
      <span className="flex items-center gap-1 text-red-500 dark:text-red-400"
        title={`Locked — ${status.otherTeacherName || 'Another teacher'} entered scores for ${status.studentCount} student(s)`}>
        <Lock className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Locked</span>
      </span>
    )
  }
  if (status.enteredByMe) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
        title={`You entered scores for ${status.studentCount} student(s)`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">You</span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500" title="Available">
      <Circle className="h-3.5 w-3.5" />
      <span className="text-xs">Open</span>
    </span>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-slate-900">
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-lg', accent)} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <div className={cn('p-2 rounded-lg', accent.replace('bg-', 'bg-').replace('-500', '-100'), 'dark:bg-slate-800')}>
            <Icon className={cn('h-5 w-5', accent.replace('bg-', 'text-'))} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CAScoresTab({ staffProfile, termInfo }: any) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('entry')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState(termInfo?.termCode || 'third')
  const [selectedYear, setSelectedYear] = useState(termInfo?.sessionYear || '2025/2026')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [skipExam, setSkipExam] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [availableExams, setAvailableExams] = useState<any[]>([])
  const [caScores, setCAScores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [autoFetching, setAutoFetching] = useState(false)

  const [scoreEntries, setScoreEntries] = useState<Record<string, ScoreEntry>>({})
  const [editingScore, setEditingScore] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({})

  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, gradedStudents: 0, classAverage: 0,
    highestScore: 0, passCount: 0, failCount: 0, passRate: 0,
  })

  const [subjectsStatus, setSubjectsStatus] = useState<Record<string, SubjectStatus>>({})
  const [isLocked, setIsLocked] = useState(false)
  const [checkingSubjects, setCheckingSubjects] = useState(false)

  const isInitialMount = useRef(true)
  const sessionOptions = getAvailableSessions(termInfo?.sessionYear || '2025/2026')

  // ── Check subject status ───────────────────────────────────────────────────
  const checkSubjectsStatus = useCallback(async () => {
    if (!selectedClass || !selectedTerm || !selectedYear || !staffProfile?.id) return
    setCheckingSubjects(true)
    const allSubjects = selectedClass.toUpperCase().startsWith('JSS') ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
    const classVariations = getClassVariations(selectedClass)

    let query = supabase.from('ca_scores').select('subject, teacher_id, teacher_name, student_id, class')
    query = classVariations.length > 1 ? query.in('class', classVariations) : query.eq('class', selectedClass)

    const { data: allScores } = await query.eq('term', selectedTerm).eq('academic_year', selectedYear)
    const statusMap: Record<string, SubjectStatus> = {}

    for (const subject of allSubjects) {
      const scores = (allScores || []).filter(s => s.subject === subject)
      if (scores.length === 0) {
        statusMap[subject] = { hasScores: false, enteredByMe: false, enteredByOther: false, studentCount: 0 }
      } else {
        const uniqueStudents = new Set(scores.map(s => s.student_id))
        const enteredByMe = scores.some(s => s.teacher_id === staffProfile.id)
        const enteredByOther = scores.some(s => s.teacher_id !== staffProfile.id)
        const otherTeacher = scores.find(s => s.teacher_id !== staffProfile.id)
        statusMap[subject] = {
          hasScores: true,
          enteredByMe: enteredByMe && !enteredByOther,
          enteredByOther,
          otherTeacherName: otherTeacher?.teacher_name,
          studentCount: uniqueStudents.size,
        }
      }
    }
    setSubjectsStatus(statusMap)
    setCheckingSubjects(false)
  }, [selectedClass, selectedTerm, selectedYear, staffProfile?.id])

  // ── Restore from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const get = (k: string) => localStorage.getItem(k)
      if (get(STORAGE_KEYS.SELECTED_CLASS)) setSelectedClass(get(STORAGE_KEYS.SELECTED_CLASS)!)
      if (get(STORAGE_KEYS.SELECTED_SUBJECT)) setSelectedSubject(get(STORAGE_KEYS.SELECTED_SUBJECT)!)
      if (get(STORAGE_KEYS.SELECTED_TERM)) setSelectedTerm(get(STORAGE_KEYS.SELECTED_TERM)!)
      if (get(STORAGE_KEYS.SELECTED_YEAR)) setSelectedYear(get(STORAGE_KEYS.SELECTED_YEAR)!)
      if (get(STORAGE_KEYS.SELECTED_EXAM)) setSelectedExamId(get(STORAGE_KEYS.SELECTED_EXAM)!)
      if (get(STORAGE_KEYS.ACTIVE_TAB)) setActiveTab(get(STORAGE_KEYS.ACTIVE_TAB)!)
      if (get(STORAGE_KEYS.SKIP_EXAM) === 'true') setSkipExam(true)
    }
    setIsRestoring(false)
    setMounted(true)
  }, [])

  useEffect(() => { if (isInitialMount.current) isInitialMount.current = false }, [])

  // ── Persist to localStorage ────────────────────────────────────────────────
  useEffect(() => { if (!isInitialMount.current && !isRestoring && selectedClass) localStorage.setItem(STORAGE_KEYS.SELECTED_CLASS, selectedClass) }, [selectedClass, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring && selectedSubject) localStorage.setItem(STORAGE_KEYS.SELECTED_SUBJECT, selectedSubject) }, [selectedSubject, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring) localStorage.setItem(STORAGE_KEYS.SELECTED_TERM, selectedTerm) }, [selectedTerm, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring) localStorage.setItem(STORAGE_KEYS.SELECTED_YEAR, selectedYear) }, [selectedYear, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring && selectedExamId) localStorage.setItem(STORAGE_KEYS.SELECTED_EXAM, selectedExamId) }, [selectedExamId, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring) localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab) }, [activeTab, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring) localStorage.setItem(STORAGE_KEYS.SKIP_EXAM, String(skipExam)) }, [skipExam, isRestoring])

  useEffect(() => {
    if (mounted && !isRestoring && selectedClass && staffProfile?.id) checkSubjectsStatus()
  }, [mounted, isRestoring, selectedClass, selectedTerm, selectedYear, staffProfile?.id, checkSubjectsStatus])

  useEffect(() => {
    setIsLocked(selectedSubject ? !!subjectsStatus[selectedSubject]?.enteredByOther : false)
  }, [selectedSubject, subjectsStatus])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClassChange = (v: string) => { setSelectedClass(v); setSelectedSubject(''); setCAScores([]) }
  const handleSubjectChange = (v: string) => { setSelectedSubject(v); setSelectedExamId(''); setSkipExam(false); setCAScores([]) }
  const handleTermChange = (v: string) => { setSelectedTerm(v); setSelectedExamId(''); setSkipExam(false); setCAScores([]) }
  const handleYearChange = (v: string) => { setSelectedYear(v); setSelectedExamId(''); setSkipExam(false); setCAScores([]) }
  const handleExamChange = (v: string) => { setSelectedExamId(v); setSkipExam(false) }
  const handleSkipExam = () => { setSkipExam(true); setSelectedExamId('') }

  // ── Load classes ───────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('class').eq('role', 'student').not('class', 'is', null)
    const unique = [...new Set((data || []).map((d: any) => d.class).filter(Boolean))] as string[]
    const general = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3']
    const all = [...new Set([...general, ...unique])].sort()
    setClasses(all)
    if (all.length > 0 && !selectedClass && !isRestoring) setSelectedClass(all[0])
  }, [selectedClass, isRestoring])

  useEffect(() => { if (mounted && !isRestoring) loadClasses() }, [mounted, isRestoring, loadClasses])

  useEffect(() => {
    if (!selectedClass || isRestoring) return
    const list = selectedClass.toUpperCase().startsWith('JSS') ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
    setSubjects(list)
    if (!selectedSubject && list.length > 0) setSelectedSubject(list[0])
  }, [selectedClass, selectedSubject, isRestoring])

  useEffect(() => {
    if (!selectedSubject || !selectedTerm || !selectedYear || isRestoring || skipExam) return
    const loadExams = async () => {
      const { data } = await supabase.from('exams').select('id, title')
        .eq('subject', selectedSubject).eq('term', selectedTerm)
        .eq('session_year', selectedYear).eq('status', 'published')
        .order('created_at', { ascending: false })
      setAvailableExams(data || [])
      if (data && data.length > 0 && !selectedExamId && !skipExam) setSelectedExamId(data[0].id)
    }
    loadExams()
  }, [selectedSubject, selectedTerm, selectedYear, selectedExamId, isRestoring, skipExam])

  // ── Load all entry data ────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) return
    setLoading(true)
    try {
      const classVariations = getClassVariations(selectedClass)
      let q = supabase.from('profiles').select('id, full_name, display_name, class, admission_number, vin_id').eq('role', 'student')
      q = classVariations.length > 1 ? q.in('class', classVariations) : q.eq('class', selectedClass)
      const { data: profileData, error: profileError } = await q.order('display_name')
      if (profileError) throw profileError
      if (!profileData || profileData.length === 0) { setStudents([]); setCAScores([]); setLoading(false); return }

      const formatted: Student[] = profileData.map((p: any) => ({
        id: p.id, full_name: p.display_name || p.full_name || 'Unknown',
        class: p.class, admission_number: p.admission_number || '—', vin_id: p.vin_id || '—',
      }))
      setStudents(formatted)

      let sq = supabase.from('ca_scores').select('*').in('student_id', formatted.map(s => s.id))
        .eq('subject', selectedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
      sq = classVariations.length > 1 ? sq.in('class', classVariations) : sq.eq('class', selectedClass)
      sq = (skipExam || !selectedExamId) ? sq.is('exam_id', null) : sq.eq('exam_id', selectedExamId)
      const { data: scoresData, error: scoresError } = await sq
      if (scoresError) throw scoresError

      const entries: Record<string, ScoreEntry> = {}
      const savedMap: Record<string, boolean> = {}
      formatted.forEach(s => { entries[s.id] = { ca1: '', ca2: '', exam: '', is_saved: false } })

      let totalSum = 0, gradedCount = 0, highest = 0, passCount = 0, failCount = 0
      ;(scoresData || []).forEach((score: any) => {
        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
        const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
        entries[score.student_id] = {
          ca1: score.ca1_score?.toString() || '', ca2: score.ca2_score?.toString() || '',
          exam: examTotal > 0 ? examTotal.toString() : '', is_saved: true,
        }
        savedMap[score.student_id] = true
        if (total > 0) {
          totalSum += total; gradedCount++
          if (total > highest) highest = total
          if (getGrade(Math.round((total / 100) * 100)) !== 'F9') passCount++
          else failCount++
        }
      })
      setScoreEntries(entries); setSavedStatus(savedMap)
      setStats({
        totalStudents: formatted.length, gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? Math.round(totalSum / gradedCount) : 0,
        highestScore: highest, passCount, failCount,
        passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0,
      })
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, selectedExamId, skipExam])

  // ── Load view-tab scores ───────────────────────────────────────────────────
  const loadScoresForViewTab = useCallback(async () => {
    if (!selectedClass || !selectedSubject) return
    setLoading(true)
    try {
      const classVariations = getClassVariations(selectedClass)
      let q = supabase.from('ca_scores').select('*').eq('subject', selectedSubject)
      q = classVariations.length > 1 ? q.in('class', classVariations) : q.eq('class', selectedClass)
      const { data: scoresData, error } = await q
      if (error) throw error
      if (scoresData && scoresData.length > 0) {
        const ids = [...new Set(scoresData.map((s: any) => s.student_id))]
        const { data: sd } = await supabase.from('profiles').select('id, full_name, display_name, admission_number').in('id', ids)
        const map = new Map(); sd?.forEach((s: any) => map.set(s.id, { full_name: s.display_name || s.full_name || 'Unknown', admission_number: s.admission_number || '—' }))
        setCAScores(scoresData.map((s: any) => ({ ...s, student: map.get(s.student_id) || { full_name: 'Unknown', admission_number: '—' } })))
      } else setCAScores([])
    } catch { toast.error('Failed to load scores') }
    finally { setLoading(false) }
  }, [selectedClass, selectedSubject])

  useEffect(() => { if (!isRestoring && selectedClass && selectedSubject && selectedTerm && selectedYear) loadAllData() }, [loadAllData, isRestoring])
  useEffect(() => { if (activeTab === 'view' && selectedClass && selectedSubject) loadScoresForViewTab() }, [activeTab, selectedClass, selectedSubject, loadScoresForViewTab])

  const updateStatsFromEntries = () => {
    let totalSum = 0, gradedCount = 0, highest = 0, passCount = 0, failCount = 0
    students.forEach(student => {
      const e = scoreEntries[student.id]; if (!e) return
      const total = (parseInt(e.ca1) || 0) + (parseInt(e.ca2) || 0) + (parseInt(e.exam) || 0)
      if (total > 0) {
        totalSum += total; gradedCount++
        if (total > highest) highest = total
        if (getGrade(Math.round((total / 100) * 100)) !== 'F9') passCount++
        else failCount++
      }
    })
    setStats({ totalStudents: students.length, gradedStudents: gradedCount, classAverage: gradedCount > 0 ? Math.round(totalSum / gradedCount) : 0, highestScore: highest, passCount, failCount, passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0 })
  }

  const handleScoreChange = (studentId: string, field: keyof ScoreEntry, value: string) => {
    if (isLocked || field === 'is_saved') return
    const maxValues = { ca1: 20, ca2: 20, exam: 60 }
    let num = Math.min(maxValues[field], Math.max(0, parseFloat(value) || 0))
    setScoreEntries(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: num.toString(), is_saved: false } }))
    setSavedStatus(prev => ({ ...prev, [studentId]: false }))
    setTimeout(updateStatsFromEntries, 50)
  }

  const calculateSubjectScore = (ca1: number, ca2: number, exam: number) => {
    const total = ca1 + ca2 + exam
    const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
    const grade = getGrade(percentage)
    return { total_score: total, percentage, grade, remark: getGradeRemark(grade) }
  }

  const buildSavePayload = (studentId: string, ca1: number, ca2: number, exam: number, studentClass: string): any => {
    const { total_score, percentage, grade, remark } = calculateSubjectScore(ca1, ca2, exam)
    const now = new Date().toISOString()
    const d: any = {
      student_id: studentId, subject: selectedSubject, term: selectedTerm, academic_year: selectedYear,
      ca1_score: ca1, ca2_score: ca2,
      exam_objective_score: Math.round(exam * 0.6), exam_theory_score: Math.round(exam * 0.4),
      total_score, percentage, grade, remark,
      teacher_id: staffProfile.id, teacher_name: staffProfile.full_name || staffProfile.display_name || 'Teacher',
      class: studentClass, status: 'approved', submitted_at: now, updated_at: now,
    }
    if (selectedExamId && !skipExam) d.exam_id = selectedExamId
    return d
  }

  const handleSaveSingle = async (studentId: string) => {
    if (!staffProfile?.id) { toast.error('Missing teacher information'); return }
    if (isLocked) { toast.error(`Locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}`); return }
    const entry = scoreEntries[studentId]; if (!entry) return
    const ca1 = parseInt(entry.ca1) || 0, ca2 = parseInt(entry.ca2) || 0, exam = parseInt(entry.exam) || 0
    if (ca1 + ca2 + exam === 0) { toast.info('No scores to save'); return }
    setSaving(true)
    try {
      const payload = buildSavePayload(studentId, ca1, ca2, exam, students.find(s => s.id === studentId)?.class || selectedClass)
      let q = supabase.from('ca_scores').select('id').eq('student_id', studentId).eq('subject', selectedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
      q = (skipExam || !selectedExamId) ? q.is('exam_id', null) : q.eq('exam_id', selectedExamId)
      const { data: existing } = await q.maybeSingle()
      const result = existing
        ? await supabase.from('ca_scores').update(payload).eq('id', existing.id)
        : await supabase.from('ca_scores').insert([payload])
      if (result.error) throw result.error
      setSavedStatus(prev => ({ ...prev, [studentId]: true }))
      setScoreEntries(prev => ({ ...prev, [studentId]: { ...prev[studentId], is_saved: true } }))
      toast.success(`Saved for ${getStudentName(studentId)}`)
      await checkSubjectsStatus(); await loadAllData()
      if (activeTab === 'view') await loadScoresForViewTab()
    } catch (e: any) { toast.error(`Failed: ${e.message}`) }
    finally { setSaving(false) }
  }

  const handleSaveAll = async () => {
    if (!staffProfile?.id) { toast.error('Missing teacher information'); return }
    if (isLocked) { toast.error(`Locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}`); return }
    setSaving(true); let saved = 0, errors = 0
    try {
      for (const student of students) {
        const entry = scoreEntries[student.id]; if (!entry) continue
        const ca1 = parseInt(entry.ca1) || 0, ca2 = parseInt(entry.ca2) || 0, exam = parseInt(entry.exam) || 0
        if (ca1 + ca2 + exam === 0) continue
        const payload = buildSavePayload(student.id, ca1, ca2, exam, student.class)
        let q = supabase.from('ca_scores').select('id').eq('student_id', student.id).eq('subject', selectedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
        q = (skipExam || !selectedExamId) ? q.is('exam_id', null) : q.eq('exam_id', selectedExamId)
        const { data: existing } = await q.maybeSingle()
        const result = existing
          ? await supabase.from('ca_scores').update(payload).eq('id', existing.id)
          : await supabase.from('ca_scores').insert([payload])
        result.error ? errors++ : saved++
      }
      if (saved > 0) {
        toast.success(`${saved} score(s) saved${errors > 0 ? `, ${errors} failed` : ''}`)
        const ns = { ...savedStatus }
        students.forEach(s => { const e = scoreEntries[s.id]; if (e && (parseInt(e.ca1) || 0) + (parseInt(e.ca2) || 0) + (parseInt(e.exam) || 0) > 0) ns[s.id] = true })
        setSavedStatus(ns)
        await checkSubjectsStatus(); await loadAllData()
        if (activeTab === 'view') await loadScoresForViewTab()
      } else if (errors > 0) toast.error(`Failed to save ${errors} student(s)`)
      else toast.info('No new scores to save')
    } catch (e: any) { toast.error(`Failed: ${e.message}`) }
    finally { setSaving(false) }
  }

  const handleDeleteAllScores = async () => {
    if (isLocked) { toast.error(`Locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}`); return }
    setIsDeletingAll(true); setDeleteProgress(0); setShowDeleteAllDialog(false)
    try {
      const classVariations = getClassVariations(selectedClass)
      let cq = supabase.from('ca_scores').select('id', { count: 'exact', head: true }).eq('subject', selectedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
      cq = classVariations.length > 1 ? cq.in('class', classVariations) : cq.eq('class', selectedClass)
      cq = (skipExam || !selectedExamId) ? cq.is('exam_id', null) : cq.eq('exam_id', selectedExamId)
      const { count: total } = await cq
      if (!total || total === 0) { toast.info('No scores to delete'); setIsDeletingAll(false); return }
      let deleted = 0
      while (deleted < total) {
        let dq = supabase.from('ca_scores').delete().eq('subject', selectedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
        dq = classVariations.length > 1 ? dq.in('class', classVariations) : dq.eq('class', selectedClass)
        dq = (skipExam || !selectedExamId) ? dq.is('exam_id', null) : dq.eq('exam_id', selectedExamId)
        const { error } = await dq.limit(100)
        if (error) { toast.error(`Delete failed: ${error.message}`); break }
        deleted += 100; setDeleteProgress(Math.min(Math.round((deleted / total) * 100), 100))
      }
      toast.success(`Deleted ${total} score(s)`)
      await checkSubjectsStatus(); await loadAllData()
      if (activeTab === 'view') await loadScoresForViewTab()
    } catch (e: any) { toast.error(`Failed: ${e.message}`) }
    finally { setIsDeletingAll(false); setDeleteProgress(0) }
  }

  const handleAutoFetchSingle = async (studentId: string) => {
    if (!selectedExamId || skipExam) { toast.info('No exam selected'); return }
    const { data, error } = await supabase.from('exam_attempts').select('objective_score, theory_feedback').eq('exam_id', selectedExamId).eq('student_id', studentId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error || !data) { toast.info('No attempt found'); return }
    const obj = Number(data.objective_score) || 0
    const thy = data.theory_feedback?.total?.score !== undefined ? Number(data.theory_feedback.total.score) : 0
    const total = obj + thy
    setScoreEntries(prev => ({ ...prev, [studentId]: { ...prev[studentId], exam: total > 0 ? String(Math.round(total)) : '', is_saved: false } }))
    setSavedStatus(prev => ({ ...prev, [studentId]: false })); toast.success('Exam score loaded')
    setTimeout(updateStatsFromEntries, 50)
  }

  const handleAutoFetchAll = async () => {
    if (!selectedExamId || skipExam) { toast.info('No exam selected'); return }
    setAutoFetching(true); let count = 0
    for (const student of students) {
      const { data, error } = await supabase.from('exam_attempts').select('objective_score, theory_feedback').eq('exam_id', selectedExamId).eq('student_id', student.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!error && data) {
        const obj = Number(data.objective_score) || 0
        const thy = data.theory_feedback?.total?.score !== undefined ? Number(data.theory_feedback.total.score) : 0
        const total = obj + thy
        setScoreEntries(prev => ({ ...prev, [student.id]: { ...prev[student.id], exam: total > 0 ? String(Math.round(total)) : '', is_saved: false } }))
        setSavedStatus(prev => ({ ...prev, [student.id]: false })); count++
      }
    }
    setAutoFetching(false); toast.success(`Loaded ${count} exam score(s)`); setTimeout(updateStatsFromEntries, 50)
  }

  const handleRefresh = async () => {
    await checkSubjectsStatus(); await loadAllData()
    if (activeTab === 'view') await loadScoresForViewTab()
    toast.success('Refreshed')
  }

  const getStudentName = (id: string) => students.find(s => s.id === id)?.full_name || 'Unknown'
  const getStudentAdmission = (id: string) => students.find(s => s.id === id)?.admission_number || '—'

  const groupedStudents = students.reduce((acc: Record<string, Student[]>, s) => {
    const cls = s.class || 'Unknown'; if (!acc[cls]) acc[cls] = []; acc[cls].push(s); return acc
  }, {})
  const classOrder = Object.keys(groupedStudents).sort()
  const filteredScores = caScores.filter(s => (s.student?.full_name || getStudentName(s.student_id)).toLowerCase().includes(searchQuery.toLowerCase()))

  if (!mounted || isRestoring) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading assessment data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} accent="bg-emerald-500" />
        <StatCard label="Graded" value={stats.gradedStudents} sub={`of ${stats.totalStudents}`} icon={GraduationCap} accent="bg-blue-500" />
        <StatCard label="Class Average" value={`${stats.classAverage}%`} icon={TrendingUp} accent="bg-violet-500" />
        <StatCard label="Pass Rate" value={`${stats.passRate}%`} sub={`${stats.passCount} passed · ${stats.failCount} failed`} icon={Award} accent="bg-amber-500" />
      </div>

      {/* ── Status Legend ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Subject status:</span>
        <span className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5 text-slate-400" /> Available</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Entered by you</span>
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-red-500" /> Locked by another teacher</span>
      </div>

      {/* ── Configuration Card ────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <Settings2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Assessment Configuration
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading || checkingSubjects}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 h-8 px-3">
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', (loading || checkingSubjects) && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {/* Class */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>
                      {isGeneralClass(cls)
                        ? <span className="font-medium text-emerald-600 dark:text-emerald-400">{cls} <span className="text-xs opacity-70">(All Streams)</span></span>
                        : cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isGeneralClass(selectedClass) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Layers className="h-3 w-3" /> All {selectedClass} streams
                </p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subject</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm">
                  <SelectValue placeholder="Select subject">
                    {selectedSubject && (
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{selectedSubject}</span>
                        <SubjectStatusIcon status={subjectsStatus[selectedSubject]} />
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {checkingSubjects
                    ? <div className="flex items-center gap-2 py-4 px-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</div>
                    : subjects.map(sub => (
                      <SelectItem key={sub} value={sub}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span>{sub}</span>
                          <SubjectStatusIcon status={subjectsStatus[sub]} />
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Lock / status indicators */}
              {isLocked && selectedSubject && (
                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800/50 text-xs">
                  <Lock className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">Locked</p>
                    <p className="text-red-600 dark:text-red-500">{subjectsStatus[selectedSubject]?.otherTeacherName || 'Another teacher'} has entered scores.</p>
                  </div>
                </div>
              )}
              {!isLocked && selectedSubject && subjectsStatus[selectedSubject]?.enteredByMe && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {subjectsStatus[selectedSubject]?.studentCount} student(s) recorded
                </p>
              )}
            </div>

            {/* Exam */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Examination</Label>
              <Select value={selectedExamId} onValueChange={handleExamChange} disabled={skipExam || isLocked}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm">
                  <SelectValue placeholder={skipExam ? 'Skipped (CA only)' : 'Select exam'} />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.length === 0
                    ? <div className="px-3 py-2 text-sm text-slate-400">No exams available</div>
                    : availableExams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {!isLocked && (
                <div className="flex gap-1.5">
                  <button onClick={handleSkipExam}
                    className={cn('text-xs px-2 py-0.5 rounded border transition-colors',
                      skipExam
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                        : 'text-slate-500 border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600')}>
                    {skipExam ? '✓ CA Only' : 'Skip exam'}
                  </button>
                  {skipExam && (
                    <button onClick={() => { setSkipExam(false); if (availableExams.length > 0) setSelectedExamId(availableExams[0].id) }}
                      className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-700 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Term */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Term</Label>
              <Select value={selectedTerm} onValueChange={handleTermChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Session */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Session</Label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessionOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSaveAll} disabled={saving || students.length === 0 || isLocked} size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-sm h-9">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SaveAll className="h-4 w-4 mr-2" />}
              {isLocked ? 'Locked' : 'Save All Scores'}
            </Button>

            {!skipExam && selectedExamId && !isLocked && (
              <Button onClick={handleAutoFetchAll} disabled={autoFetching || students.length === 0} variant="outline" size="sm" className="h-9">
                <RefreshCw className={cn('h-4 w-4 mr-2', autoFetching && 'animate-spin')} />
                Auto-Fetch Exam Scores
              </Button>
            )}

            <Button onClick={() => setShowDeleteAllDialog(true)} disabled={caScores.length === 0 || loading || isLocked}
              variant="outline" size="sm"
              className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 ml-auto">
              <Trash className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-auto inline-flex">
          <TabsTrigger value="entry" className="flex items-center gap-2 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 px-4">
            <FileText className="h-4 w-4" /> Score Entry
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 px-4">
            <BarChart3 className="h-4 w-4" /> View Scores
            {caScores.length > 0 && (
              <span className="ml-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {caScores.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Entry Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="entry" className="mt-4 space-y-4">
          {isLocked ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="py-16 text-center">
                <div className="inline-flex p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 mb-4">
                  <Lock className="h-10 w-10 text-red-400 dark:text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Score Entry Locked</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  <strong>{selectedSubject}</strong> scores for <strong>{selectedClass}</strong> were entered by{' '}
                  <strong>{subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}</strong>.
                </p>
                <Button variant="outline" size="sm" className="mt-5" onClick={() => {
                  const avail = subjects.find(s => !subjectsStatus[s]?.enteredByOther && s !== selectedSubject)
                  avail ? setSelectedSubject(avail) : toast.info('All subjects have scores entered.')
                }}>
                  Switch to Available Subject <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading students…</p>
              </CardContent>
            </Card>
          ) : students.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="text-center py-16">
                <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No students found in <strong>{selectedClass}</strong></p>
              </CardContent>
            </Card>
          ) : (
            classOrder.map(cls => (
              <Card key={cls} className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                {/* Class header */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{cls}</span>
                    <Badge variant="secondary" className="text-xs font-medium ml-1">
                      {groupedStudents[cls].length} students
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    CA1 /20 · CA2 /20 · Exam /60
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                        <TableHead className="pl-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide min-w-[200px]">Student</TableHead>
                        <TableHead className="text-center w-28 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">CA1</TableHead>
                        <TableHead className="text-center w-28 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">CA2</TableHead>
                        <TableHead className="text-center w-32 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Exam</TableHead>
                        <TableHead className="text-center w-20 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</TableHead>
                        <TableHead className="text-center w-24 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Grade</TableHead>
                        <TableHead className="text-center w-24 pr-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Save</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedStudents[cls].map((student, idx) => {
                        const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '' }
                        const total = (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0)
                        const grade = total > 0 ? getGrade(Math.round((total / 100) * 100)) : ''
                        const hasExam = entry.exam && parseInt(entry.exam) > 0
                        const isSaved = savedStatus[student.id]

                        return (
                          <TableRow key={student.id}
                            className={cn(
                              'border-slate-100 dark:border-slate-800 transition-colors',
                              idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20',
                              isSaved && 'bg-emerald-50/30 dark:bg-emerald-950/10',
                            )}>
                            <TableCell className="pl-5 py-2.5">
                              <div>
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{student.full_name}</p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{student.admission_number}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <Input type="number" min="0" max="20" value={entry.ca1}
                                onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                                className="w-20 h-8 text-center mx-auto text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                                placeholder="0" disabled={isLocked} />
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <Input type="number" min="0" max="20" value={entry.ca2}
                                onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                                className="w-20 h-8 text-center mx-auto text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                                placeholder="0" disabled={isLocked} />
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              {hasExam ? (
                                <span className="inline-flex items-center justify-center w-20 h-8 mx-auto font-semibold text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  {parseInt(entry.exam)}
                                </span>
                              ) : !skipExam && selectedExamId && !isLocked ? (
                                <Button variant="ghost" size="sm" onClick={() => handleAutoFetchSingle(student.id)}
                                  className="h-8 w-20 mx-auto text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                  <RefreshCw className="h-3 w-3 mr-1" /> Load
                                </Button>
                              ) : (
                                <Input type="number" min="0" max="60" value={entry.exam}
                                  onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                                  className="w-20 h-8 text-center mx-auto text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                                  placeholder="0" disabled={isLocked} />
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <span className={cn('font-bold text-sm', total > 0 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600')}>
                                {total > 0 ? total : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              {grade
                                ? <Badge className={cn(getGradeColor(grade), 'font-semibold text-xs')}>{grade}</Badge>
                                : <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>}
                            </TableCell>
                            <TableCell className="text-center pr-5 py-2.5">
                              <Button variant="ghost" size="sm" onClick={() => handleSaveSingle(student.id)}
                                disabled={saving || isLocked}
                                className={cn('h-8 px-3 text-xs gap-1.5 rounded-md transition-colors',
                                  isSaved
                                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : isSaved ? <CheckCircle2 className="h-3.5 w-3.5" />
                                    : <Save className="h-3.5 w-3.5" />}
                                {isSaved ? 'Saved' : 'Save'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── View Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="view" className="mt-4">
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Published Scores</CardTitle>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedClass} · {selectedSubject} · {TERM_OPTIONS.find(t => t.value === selectedTerm)?.label}
                    {isLocked && (
                      <Badge className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                        <Lock className="h-3 w-3 mr-1" /> Locked
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input placeholder="Search students…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                  </div>
                  <Button variant="outline" size="sm" onClick={loadScoresForViewTab} disabled={loading} className="h-9 w-9 p-0">
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading scores…</p>
                </div>
              ) : caScores.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No scores published yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">Enter scores and save them to see them here.</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('entry')} disabled={isLocked}>
                    Go to Score Entry <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        {['Student', 'Adm. No', 'CA1', 'CA2', 'Exam', 'Total', '%', 'Grade', 'By', 'Actions'].map(h => (
                          <TableHead key={h} className={cn('font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3', h === 'Student' ? 'pl-5 min-w-[180px]' : 'text-center', h === 'Actions' ? 'pr-5' : '')}>
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScores.map((score, idx) => {
                        const ca1 = score.ca1_score || 0
                        const ca2 = score.ca2_score || 0
                        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
                        const total = ca1 + ca2 + examTotal
                        const pct = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = getGrade(pct)
                        const name = score.student?.full_name || getStudentName(score.student_id)
                        const adm = score.student?.admission_number || getStudentAdmission(score.student_id)
                        const isOwn = score.teacher_id === staffProfile?.id

                        return (
                          <TableRow key={score.id}
                            className={cn(
                              'border-slate-100 dark:border-slate-800',
                              idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20',
                            )}>
                            <TableCell className="pl-5 py-3 font-medium text-sm text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                {name}
                                {!isOwn && <Lock className="h-3 w-3 text-red-400 flex-shrink-0" />}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono text-slate-500 dark:text-slate-400">{adm}</TableCell>
                            <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{ca1 || '—'}</TableCell>
                            <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{ca2 || '—'}</TableCell>
                            <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{examTotal || '—'}</TableCell>
                            <TableCell className="text-center font-bold text-sm text-slate-800 dark:text-slate-100">{total || '—'}</TableCell>
                            <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">{pct > 0 ? `${pct}%` : '—'}</TableCell>
                            <TableCell className="text-center">
                              {grade && <Badge className={cn(getGradeColor(grade), 'font-semibold text-xs')}>{grade}</Badge>}
                            </TableCell>
                            <TableCell className="text-center">
                              {isOwn
                                ? <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> You</Badge>
                                : <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1"><AlertTriangle className="h-3 w-3" />{score.teacher_name || 'Other'}</Badge>}
                            </TableCell>
                            <TableCell className="text-center pr-5">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" disabled={!isOwn}
                                  onClick={() => { setEditingScore(score); setShowEditDialog(true) }}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-30">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" disabled={!isOwn}
                                  onClick={async () => {
                                    if (!confirm('Delete this score?')) return
                                    const { error } = await supabase.from('ca_scores').delete().eq('id', score.id)
                                    if (error) toast.error('Failed to delete')
                                    else { toast.success('Deleted'); await checkSubjectsStatus(); await loadAllData(); await loadScoresForViewTab() }
                                  }}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                Delete All Score Records?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pl-11">
                <div className="flex flex-wrap gap-1.5">
                  {[selectedClass, selectedSubject, TERM_OPTIONS.find(t => t.value === selectedTerm)?.label, selectedYear].map((v, i) => v && (
                    <Badge key={i} variant="secondary" className="text-xs font-medium">{v}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/50">
                  <Database className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {caScores.length} record{caScores.length !== 1 ? 's' : ''} will be permanently deleted
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel disabled={isDeletingAll} className="h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllScores} disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 text-white h-9 gap-1.5">
              {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Progress ────────────────────────────────────────────────── */}
      <Dialog open={isDeletingAll && deleteProgress > 0 && deleteProgress < 100} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Loader2 className="h-4 w-4 animate-spin text-red-500" /> Deleting scores…
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            <Progress value={deleteProgress} className="h-2" />
            <p className="text-right text-xs text-slate-500">{deleteProgress}%</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Edit Score</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              {getStudentName(editingScore?.student_id)}
            </DialogDescription>
          </DialogHeader>
          {editingScore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CA1 /20</Label>
                  <Input type="number" min="0" max="20" value={editingScore.ca1_score || 0}
                    onChange={e => setEditingScore({ ...editingScore, ca1_score: parseInt(e.target.value) || 0 })}
                    className="h-9 text-center text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CA2 /20</Label>
                  <Input type="number" min="0" max="20" value={editingScore.ca2_score || 0}
                    onChange={e => setEditingScore({ ...editingScore, ca2_score: parseInt(e.target.value) || 0 })}
                    className="h-9 text-center text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">CA Total</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0)} / 40
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
              if (!editingScore) return
              const ca1 = editingScore.ca1_score || 0, ca2 = editingScore.ca2_score || 0
              const total = ca1 + ca2, pct = total > 0 ? Math.round((total / 40) * 100) : 0
              const grade = getGrade(pct)
              const { error } = await supabase.from('ca_scores').update({
                ca1_score: ca1, ca2_score: ca2, total_score: total,
                percentage: pct, grade, remark: getGradeRemark(grade),
                status: 'approved', updated_at: new Date().toISOString(),
              }).eq('id', editingScore.id)
              if (error) { toast.error('Failed to update'); return }
              toast.success('Score updated')
              setShowEditDialog(false)
              await checkSubjectsStatus(); await loadAllData(); await loadScoresForViewTab()
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CAScoresTab