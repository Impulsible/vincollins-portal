// components/staff/ca-scores/CAScoresTab.tsx - UPDATED WITH ACTIVE STATUS SAFELY ENFORCED + COMPLETE DARK MODE
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { 
  Save, Search, Edit, Trash2, Users, Loader2, RefreshCw, 
  CheckCircle2, FileText, TrendingUp, Award, GraduationCap, 
  BarChart3, Trash, AlertTriangle, Database, Layers, Lock, 
  Circle, ChevronRight, BookOpen, Settings2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────
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
  const g = GRADING_SCALE.find(g => percentage >= g.min && percentage <= g.max)
  return g?.grade || 'F9'
}

const getGradeColor = (grade: string): string => {
  return GRADING_SCALE.find(g => g.grade === grade)?.color || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}

const getGradeRemark = (grade: string): string => {
  return GRADING_SCALE.find(g => g.grade === grade)?.label || ''
}

const SENIOR_SUBJECTS = [
  'English Language', 'Mathematics', 'Civic Education', 'Physics', 'Chemistry', 'Biology',
  'Agricultural Science', 'Economics', 'Geography', 'Government', 'Literature in English',
  'Christian Religious Studies', 'Yoruba', 'Commerce', 'Financial Accounting', 'Data Processing', 'Further Mathematics'
]

const JUNIOR_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology', 'Social Studies',
  'Civic Education', 'Agricultural Science', 'Business Studies', 'Home Economics',
  'Christian Religious Studies', 'Yoruba', 'French', 'Information Technology', 'Cultural and Creative Arts',
  'Music', 'Physical and Health Education', 'History', 'Security Education'
]

const SUBJECT_NAME_MAPPING: Record<string, string> = {
  'CCA': 'Cultural and Creative Arts',
  'PHE': 'Physical and Health Education',
  'CRS': 'Christian Religious Studies',
  'CRK': 'Christian Religious Studies',
  'C.R.S.': 'Christian Religious Studies',
  'C.R.K.': 'Christian Religious Studies',
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

// ── Sanitize Helpers ──────────────────────────────────────────────────────────
const sanitizeNum = (val: any): number => {
  if (val === '' || val === null || val === undefined) return 0
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

const sanitizeUUID = (id: any): string | null => {
  if (!id || typeof id !== 'string' || id.trim() === '') return null
  return id.trim()
}

const sanitizeText = (val: any): string | null => {
  if (val === '' || val === null || val === undefined) return null
  return String(val).trim()
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

interface TermOption {
  value: string
  label: string
  is_current: boolean
}

const STORAGE_KEYS = {
  SELECTED_CLASS: 'ca_scores_selected_class',
  SELECTED_SUBJECT: 'ca_scores_selected_subject',
  SELECTED_EXAM: 'ca_scores_selected_exam',
  ACTIVE_TAB: 'ca_scores_active_tab',
  SKIP_EXAM: 'ca_scores_skip_exam'
}

function deduplicateByKey<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>()
  return arr.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Main Component ───────────────────────────────────────────────────────────
export function CAScoresTab({ staffProfile }: any) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('entry')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [skipExam, setSkipExam] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)
  const [isLoadingTerm, setIsLoadingTerm] = useState(true)
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
    totalStudents: 0,
    gradedStudents: 0,
    classAverage: 0,
    highestScore: 0,
    passCount: 0,
    failCount: 0,
    passRate: 0
  })
  const [subjectsStatus, setSubjectsStatus] = useState<Record<string, SubjectStatus>>({})
  const [isLocked, setIsLocked] = useState(false)
  const [checkingSubjects, setCheckingSubjects] = useState(false)
  const [termOptions, setTermOptions] = useState<TermOption[]>([])
  const [availableSessions, setAvailableSessions] = useState<string[]>([])

  const isInitialMount = useRef(true)

  const fetchTerms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('terms')
        .select('term_code, term_name')
        .order('term_code', { ascending: true })

      if (error) return
      if (data) {
        const deduplicated = deduplicateByKey(data, (t: any) => t.term_code)
        setTermOptions(deduplicated.map((t: any) => ({
          value: t.term_code,
          label: t.term_name,
          is_current: false
        })))
      }
    } catch (error) {
      console.error('Error fetching terms:', error)
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('terms')
        .select('session_year')
        .not('session_year', 'is', null)
        .order('session_year', { ascending: false })

      if (error || !data) return
      const sessions = [...new Set(data.map((t: any) => t.session_year as string).filter(Boolean))]
      setAvailableSessions(sessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }, [])

  const fetchCurrentTerm = useCallback(async () => {
    try {
      const { data: settings, error } = await supabase
        .from('school_settings')
        .select('current_term, current_session')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        setIsLoadingTerm(false)
        return
      }

      if (settings) {
        setSelectedTerm(settings.current_term || '')
        setSelectedYear(settings.current_session || '')
        setTermOptions(prev => prev.map(t => ({
          ...t,
          is_current: t.value === settings.current_term
        })))
      }
    } catch (error) {
      console.error('Error fetching current term:', error)
    } finally {
      setIsLoadingTerm(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchTerms(), fetchSessions(), fetchCurrentTerm()])
  }, [fetchTerms, fetchSessions, fetchCurrentTerm])

  useEffect(() => {
    if (isLoadingTerm) return
    if (typeof window !== 'undefined') {
      const get = (k: string) => localStorage.getItem(k)
      if (get(STORAGE_KEYS.SELECTED_CLASS)) setSelectedClass(get(STORAGE_KEYS.SELECTED_CLASS)!)
      if (get(STORAGE_KEYS.SELECTED_SUBJECT)) setSelectedSubject(get(STORAGE_KEYS.SELECTED_SUBJECT)!)
      if (get(STORAGE_KEYS.SELECTED_EXAM)) setSelectedExamId(get(STORAGE_KEYS.SELECTED_EXAM)!)
      if (get(STORAGE_KEYS.ACTIVE_TAB)) setActiveTab(get(STORAGE_KEYS.ACTIVE_TAB)!)
      if (get(STORAGE_KEYS.SKIP_EXAM) === 'true') setSkipExam(true)
    }
    setIsRestoring(false)
    setMounted(true)
  }, [isLoadingTerm])

  useEffect(() => { if (isInitialMount.current) isInitialMount.current = false }, [])
  useEffect(() => { if (!isInitialMount.current && !isRestoring && selectedClass) localStorage.setItem(STORAGE_KEYS.SELECTED_CLASS, selectedClass) }, [selectedClass, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring && selectedSubject) localStorage.setItem(STORAGE_KEYS.SELECTED_SUBJECT, selectedSubject) }, [selectedSubject, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring && selectedExamId) localStorage.setItem(STORAGE_KEYS.SELECTED_EXAM, selectedExamId) }, [selectedExamId, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring) localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab) }, [activeTab, isRestoring])
  useEffect(() => { if (!isInitialMount.current && !isRestoring) localStorage.setItem(STORAGE_KEYS.SKIP_EXAM, String(skipExam)) }, [skipExam, isRestoring])

  const checkSubjectsStatus = useCallback(async () => {
    if (!selectedClass || !selectedTerm || !selectedYear || !staffProfile?.id) return
    setCheckingSubjects(true)
    try {
      const allSubjects = selectedClass.toUpperCase().startsWith('JSS') ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
      const classVariations = getClassVariations(selectedClass)
      let query = supabase.from('ca_scores').select('subject,teacher_id,teacher_name,student_id,class')
      query = classVariations.length > 1 ? query.in('class', classVariations) : query.eq('class', selectedClass)
      const { data: allScores } = await query.eq('term', selectedTerm).eq('academic_year', selectedYear)
      const statusMap: Record<string, SubjectStatus> = {}
      for (const subject of allSubjects) {
        const scores = (allScores || []).filter((s: any) => s.subject === subject)
        if (scores.length === 0) {
          statusMap[subject] = { hasScores: false, enteredByMe: false, enteredByOther: false, studentCount: 0 }
          continue
        }
        const uniqueStudents = new Set(scores.map((s: any) => s.student_id))
        const enteredByMe = scores.some((s: any) => s.teacher_id === staffProfile.id)
        const enteredByOther = scores.some((s: any) => s.teacher_id !== staffProfile.id)
        const otherTeacher = scores.find((s: any) => s.teacher_id !== staffProfile.id)
        statusMap[subject] = {
          hasScores: true,
          enteredByMe: enteredByMe && !enteredByOther,
          enteredByOther,
          otherTeacherName: otherTeacher?.teacher_name,
          studentCount: uniqueStudents.size
        }
      }
      setSubjectsStatus(statusMap)
    } catch (error) {
      console.error('Error checking subjects:', error)
    } finally {
      setCheckingSubjects(false)
    }
  }, [selectedClass, selectedTerm, selectedYear, staffProfile?.id])

  useEffect(() => {
    if (mounted && !isRestoring && selectedClass && selectedTerm && selectedYear && staffProfile?.id) {
      checkSubjectsStatus()
    }
  }, [mounted, isRestoring, selectedClass, selectedTerm, selectedYear, staffProfile?.id, checkSubjectsStatus])

  useEffect(() => {
    setIsLocked(selectedSubject ? !!subjectsStatus[selectedSubject]?.enteredByOther : false)
  }, [selectedSubject, subjectsStatus])

  const loadClasses = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('class').eq('role', 'student').eq('is_active', true).not('class', 'is', null)
    const unique = [...new Set((data || []).map((d: any) => d.class).filter(Boolean))] as string[]
    const general = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3']
    const all = [...new Set([...general, ...unique])].sort()
    setClasses(all)
    if (all.length > 0 && !selectedClass && !isRestoring) setSelectedClass(all[0])
  }, [selectedClass, isRestoring])

  useEffect(() => { if (mounted && !isRestoring && !isLoadingTerm) loadClasses() }, [mounted, isRestoring, isLoadingTerm, loadClasses])

  useEffect(() => {
    if (!selectedClass || isRestoring || isLoadingTerm) return
    const list = selectedClass.toUpperCase().startsWith('JSS') ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
    setSubjects(list)
    if (!selectedSubject && list.length > 0) setSelectedSubject(list[0])
  }, [selectedClass, selectedSubject, isRestoring, isLoadingTerm])

  useEffect(() => {
    if (!selectedSubject || !selectedTerm || !selectedYear || isRestoring || skipExam || isLoadingTerm) return
    const loadExams = async () => {
      const { data } = await supabase
        .from('exams')
        .select('id,title,class,objective_max,theory_max,total_marks')
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('session_year', selectedYear)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      setAvailableExams(data || [])
      if (data && data.length > 0 && !selectedExamId && !skipExam) {
        const matchingExam = data.find((e: any) => e.class === selectedClass)
        setSelectedExamId(matchingExam ? matchingExam.id : data[0].id)
      }
    }
    loadExams()
  }, [selectedSubject, selectedTerm, selectedYear, selectedExamId, isRestoring, skipExam, selectedClass, isLoadingTerm])

  const getMappedSubject = useCallback((subject: string) => {
    return SUBJECT_NAME_MAPPING[subject] || subject
  }, [])

  const loadAllData = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear || isLoadingTerm) return
    setLoading(true)
    try {
      const classVariations = getClassVariations(selectedClass)
      let q = supabase
        .from('profiles')
        .select('id,full_name,display_name,class,admission_number,vin_id')
        .eq('role', 'student')
        .eq('is_active', true)
      
      q = classVariations.length > 1 ? q.in('class', classVariations) : q.eq('class', selectedClass)
      const { data: profileData, error: profileError } = await q.order('display_name')
      if (profileError) throw profileError
      if (!profileData || profileData.length === 0) {
        setStudents([])
        setCAScores([])
        setLoading(false)
        return
      }
      const formatted: Student[] = profileData.map((p: any) => ({
        id: p.id,
        full_name: p.display_name || p.full_name || 'Unknown',
        class: p.class,
        admission_number: p.admission_number || '—',
        vin_id: p.vin_id || '—'
      }))
      setStudents(formatted)

      const mappedSubject = getMappedSubject(selectedSubject)
      let sq = supabase.from('ca_scores').select('*').in('student_id', formatted.map(s => s.id)).eq('subject', mappedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
      sq = classVariations.length > 1 ? sq.in('class', classVariations) : sq.eq('class', selectedClass)
      const { data: scoresData, error: scoresError } = await sq
      if (scoresError) throw scoresError

      const entries: Record<string, ScoreEntry> = {}
      const savedMap: Record<string, boolean> = {}
      formatted.forEach(s => { entries[s.id] = { ca1: '', ca2: '', exam: '', is_saved: false } })
      let totalSum = 0, gradedCount = 0, highest = 0, passCount = 0, failCount = 0
      ;(scoresData || []).forEach((score: any) => {
        const examTotal = score.exam_objective_score || 0
        const caTotal = (score.ca1_score || 0) + (score.ca2_score || 0)
        const total = caTotal + examTotal

        entries[score.student_id] = {
          ca1: score.ca1_score?.toString() || '',
          ca2: score.ca2_score?.toString() || '',
          exam: examTotal > 0 ? examTotal.toString() : '',
          is_saved: true
        }
        savedMap[score.student_id] = true
        if (total > 0) {
          totalSum += total
          gradedCount++
          if (total > highest) highest = total
          if (getGrade(total) !== 'F9') passCount++
          else failCount++
        }
      })
      setScoreEntries(entries)
      setSavedStatus(savedMap)
      setStats({
        totalStudents: formatted.length,
        gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? Math.round(totalSum / gradedCount) : 0,
        highestScore: highest,
        passCount,
        failCount,
        passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0
      })
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error(`Failed to load data: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, isLoadingTerm, getMappedSubject])

  const loadScoresForViewTab = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear || isLoadingTerm) return
    setLoading(true)
    try {
      const classVariations = getClassVariations(selectedClass)
      const mappedSubject = getMappedSubject(selectedSubject)
      let q = supabase.from('ca_scores').select('*').eq('subject', mappedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
      q = classVariations.length > 1 ? q.in('class', classVariations) : q.eq('class', selectedClass)
      const { data: scoresData, error } = await q
      if (error) throw error

      if (scoresData && scoresData.length > 0) {
        const studentMap = new Map()
        scoresData.forEach((s: any) => {
          const existing = studentMap.get(s.student_id)
          if (!existing) {
            const examTotal = s.exam_objective_score || 0
            const caTotal = (s.ca1_score || 0) + (s.ca2_score || 0)
            const total = caTotal + examTotal
            studentMap.set(s.student_id, {
              ...s,
              exam_score: examTotal,
              total_score: total,
              percentage: total,
              grade: getGrade(total),
              remark: getGradeRemark(getGrade(total))
            })
          } else {
            if (s.ca1_score > 0 && existing.ca1_score === 0) existing.ca1_score = s.ca1_score
            if (s.ca2_score > 0 && existing.ca2_score === 0) existing.ca2_score = s.ca2_score
            if (s.exam_objective_score > 0 && existing.exam_objective_score === 0) {
              existing.exam_objective_score = s.exam_objective_score
              existing.exam_score = s.exam_objective_score
            }
            const ca1 = existing.ca1_score || 0
            const ca2 = existing.ca2_score || 0
            const exam = existing.exam_objective_score || 0
            const total = ca1 + ca2 + exam
            existing.total_score = total
            existing.percentage = total > 0 ? total : 0
            existing.grade = getGrade(total)
            existing.remark = getGradeRemark(existing.grade)
            studentMap.set(s.student_id, existing)
          }
        })

        const studentIds = Array.from(studentMap.keys())
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id,full_name,display_name,admission_number,is_active')
          .in('id', studentIds)

        const profileMap = new Map()
        profiles?.forEach((p: any) => {
          if (p.is_active !== false) {
            profileMap.set(p.id, {
              full_name: p.display_name || p.full_name || 'Unknown',
              admission_number: p.admission_number || '—'
            })
          }
        })

        const mergedScores = Array.from(studentMap.values())
        const result = mergedScores
          .filter((s: any) => profileMap.has(s.student_id))
          .map((s: any) => ({
            ...s,
            student: profileMap.get(s.student_id)
          }))
          .sort((a: any, b: any) => (a.student?.full_name || '').localeCompare(b.student?.full_name || ''))

        setCAScores(result)
      } else {
        setCAScores([])
      }
    } catch (error: any) {
      console.error('Error loading scores:', error)
      toast.error(`Failed to load scores: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, isLoadingTerm, getMappedSubject])

  useEffect(() => {
    if (!isRestoring && !isLoadingTerm && selectedClass && selectedSubject && selectedTerm && selectedYear) {
      loadAllData()
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, loadAllData, isRestoring, isLoadingTerm])

  useEffect(() => {
    if (activeTab === 'view' && selectedClass && selectedSubject && !isLoadingTerm) loadScoresForViewTab()
  }, [activeTab, selectedClass, selectedSubject, loadScoresForViewTab, isLoadingTerm])

  const updateStatsFromEntries = () => {
    let totalSum = 0, gradedCount = 0, highest = 0, passCount = 0, failCount = 0
    students.forEach(student => {
      const e = scoreEntries[student.id]
      if (!e) return
      const caTotal = (parseInt(e.ca1) || 0) + (parseInt(e.ca2) || 0)
      const examScore = parseInt(e.exam) || 0
      const total = caTotal + examScore
      if (total > 0) {
        totalSum += total
        gradedCount++
        if (total > highest) highest = total
        if (getGrade(total) !== 'F9') passCount++
        else failCount++
      }
    })
    setStats({
      totalStudents: students.length,
      gradedStudents: gradedCount,
      classAverage: gradedCount > 0 ? Math.round(totalSum / gradedCount) : 0,
      highestScore: highest,
      passCount,
      failCount,
      passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0
    })
  }

  const handleClassChange = (v: string) => {
    setSelectedClass(v)
    setSelectedSubject('')
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
    setScoreEntries({})
    setSavedStatus({})
  }

  const handleSubjectChange = (v: string) => {
    setSelectedSubject(v)
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
  }

  const handleTermChange = (v: string) => {
    setSelectedTerm(v)
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
    setScoreEntries({})
    setSavedStatus({})
  }

  const handleYearChange = (v: string) => {
    setSelectedYear(v)
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
    setScoreEntries({})
    setSavedStatus({})
  }

  const handleExamChange = (v: string) => {
    setSelectedExamId(v)
    setSkipExam(false)
  }

  const handleSkipExam = () => {
    setSkipExam(true)
    setSelectedExamId('')
  }

  const handleScoreChange = (studentId: string, field: keyof ScoreEntry, value: string) => {
    if (isLocked || field === 'is_saved') return
    const maxValues: Record<string, number> = { ca1: 20, ca2: 20, exam: 60 }
    const num = Math.min(maxValues[field], Math.max(0, parseFloat(value) || 0))
    setScoreEntries(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: num.toString(), is_saved: false } }))
    setSavedStatus(prev => ({ ...prev, [studentId]: false }))
    setTimeout(updateStatsFromEntries, 50)
  }

  const handleAutoFetchSingle = async (studentId: string) => {
    if (!selectedSubject || !selectedTerm || !selectedYear) {
      toast.info('Please select subject, term, and year first')
      return
    }

    try {
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, objective_max, theory_max, total_marks')
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('session_year', selectedYear)
        .eq('status', 'published')

      if (!examsData || examsData.length === 0) {
        toast.info('No published exams found')
        return
      }

      const examIds = examsData.map(e => e.id)
      const { data: attempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .in('exam_id', examIds)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!attempt) {
        toast.info('No attempt found')
        return
      }

      const objScore = Number(attempt.objective_score) || 0
      const theoryScore = Number(attempt.theory_score) || 0
      const examScore = objScore + theoryScore

      if (examScore === 0) {
        toast.info('No score found')
        return
      }

      setScoreEntries(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          ca1: prev[studentId]?.ca1 || '',
          ca2: prev[studentId]?.ca2 || '',
          exam: String(examScore),
          is_saved: false
        }
      }))
      setSavedStatus(prev => ({ ...prev, [studentId]: false }))
      toast.success(`Loaded: ${examScore}/60 (Obj: ${objScore}, Theory: ${theoryScore})`)
      setTimeout(updateStatsFromEntries, 50)
    } catch (error: any) {
      console.error('Auto-fetch error:', error)
      toast.error(`Failed to fetch exam score: ${error.message}`)
    }
  }

  const handleAutoFetchAll = async () => {
    if (!selectedSubject || !selectedTerm || !selectedYear || !selectedClass) {
      toast.info('Please complete class, subject, term, and session selection first')
      return
    }

    setAutoFetching(true)
    let count = 0
    let totalFound = 0

    try {
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, objective_max, theory_max, total_marks, title')
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('session_year', selectedYear)
        .eq('status', 'published')

      if (!examsData || examsData.length === 0) {
        toast.info('No published exams found for this subject, term, and year')
        setAutoFetching(false)
        return
      }

      const examIds = examsData.map(e => e.id)
      const studentIds = students.map(s => s.id)

      if (studentIds.length === 0) {
        toast.warning('No students found for this class.')
        setAutoFetching(false)
        return
      }

      const { data: allAttempts } = await supabase
        .from('exam_attempts')
        .select('*')
        .in('exam_id', examIds)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      const resultsMap = new Map()
      if (allAttempts) {
        allAttempts.forEach((a: any) => {
          const existing = resultsMap.get(a.student_id)
          if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
            resultsMap.set(a.student_id, a)
          }
        })
      }

      const newEntries = { ...scoreEntries }
      const newSaved = { ...savedStatus }

      for (const student of students) {
        const attempt = resultsMap.get(student.id)
        if (attempt) {
          const objScore = Number(attempt.objective_score) || 0
          const theoryScore = Number(attempt.theory_score) || 0
          const examScore = objScore + theoryScore

          if (examScore > 0) {
            newEntries[student.id] = {
              ca1: newEntries[student.id]?.ca1 || '',
              ca2: newEntries[student.id]?.ca2 || '',
              exam: String(examScore),
              is_saved: false
            }
            newSaved[student.id] = false
            count++
            totalFound += examScore
          }
        }
      }

      setScoreEntries(newEntries)
      setSavedStatus(newSaved)
      setTimeout(updateStatsFromEntries, 50)

      if (count > 0) {
        const avgExamScore = Math.round(totalFound / count)
        toast.success(`Loaded ${count} exam score(s) (avg: ${avgExamScore}/60)`)
      } else {
        toast.info(`No exam scores found for ${selectedClass} in this subject`)
      }
    } catch (error: any) {
      console.error('Auto-fetch error:', error)
      toast.error(`Failed to fetch exam scores: ${error.message}`)
    } finally {
      setAutoFetching(false)
    }
  }

  const buildSavePayload = (studentId: string, ca1: number, ca2: number, exam: number, studentClass: string): any => {
    const safeCA1 = sanitizeNum(ca1)
    const safeCA2 = sanitizeNum(ca2)
    const safeExam = sanitizeNum(exam)
    const caTotal = safeCA1 + safeCA2
    const total = caTotal + safeExam
    const grade = getGrade(total)
    const now = new Date().toISOString()

    const payload: any = {
      student_id: sanitizeUUID(studentId),
      subject: sanitizeText(getMappedSubject(selectedSubject)),
      term: sanitizeText(selectedTerm),
      academic_year: sanitizeText(selectedYear),
      ca1_score: safeCA1,
      ca2_score: safeCA2,
      ca_total: caTotal,
      exam_objective_score: safeExam,
      exam_theory_score: 0,
      exam_score: safeExam,
      total_score: total,
      percentage: total,
      grade: sanitizeText(grade),
      remark: sanitizeText(getGradeRemark(grade)),
      teacher_id: sanitizeUUID(staffProfile?.id),
      teacher_name: sanitizeText(staffProfile?.full_name || staffProfile?.display_name || 'Teacher'),
      class: sanitizeText(studentClass),
      status: 'approved',
      submitted_at: now,
      updated_at: now
    }

    const safeExamId = sanitizeUUID(selectedExamId)
    if (safeExamId && !skipExam) {
      payload.exam_id = safeExamId
    }

    return payload
  }

  const handleSaveSingle = async (studentId: string) => {
    if (!staffProfile?.id) { toast.error('Missing teacher information'); return }
    if (isLocked) { toast.error(`Locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}`); return }

    const entry = scoreEntries[studentId]
    if (!entry) return
    const ca1 = sanitizeNum(entry.ca1)
    const ca2 = sanitizeNum(entry.ca2)
    const exam = sanitizeNum(entry.exam)

    if (ca1 + ca2 + exam === 0) { toast.info('No scores to save'); return }

    setSaving(true)
    try {
      const mappedSubject = getMappedSubject(selectedSubject)
      const { data: existing, error: fetchError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject', mappedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existing) {
        const f1 = ca1 > 0 ? ca1 : sanitizeNum(existing.ca1_score)
        const f2 = ca2 > 0 ? ca2 : sanitizeNum(existing.ca2_score)
        const fe = exam > 0 ? exam : sanitizeNum(existing.exam_objective_score)
        const payload = buildSavePayload(studentId, f1, f2, fe, existing.class || selectedClass)
        const { error } = await supabase.from('ca_scores').update(payload).eq('id', existing.id)
        if (error) throw error
      } else {
        const student = students.find(s => s.id === studentId)
        const payload = buildSavePayload(studentId, ca1, ca2, exam, student?.class || selectedClass)
        const { error } = await supabase.from('ca_scores').insert([payload])
        if (error) throw error
      }

      setSavedStatus(prev => ({ ...prev, [studentId]: true }))
      setScoreEntries(prev => ({ ...prev, [studentId]: { ...prev[studentId], is_saved: true } }))
      toast.success(`Saved for ${getStudentName(studentId)}`)
      await checkSubjectsStatus()
      await loadAllData()
      if (activeTab === 'view') await loadScoresForViewTab()
    } catch (e: any) {
      console.error('Save single failed:', e)
      toast.error(`Failed to save: ${e.message || 'Unknown database error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    if (!staffProfile?.id) { toast.error('Missing teacher information'); return }
    if (isLocked) { toast.error(`Locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}`); return }

    setSaving(true)
    let saved = 0
    let errors = 0
    let lastError: any = null

    try {
      const mappedSubject = getMappedSubject(selectedSubject)
      const { data: existingScores, error: fetchError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('subject', mappedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .in('student_id', students.map(s => s.id))

      if (fetchError) throw fetchError

      const existingMap = new Map()
      if (existingScores) existingScores.forEach((s: any) => existingMap.set(s.student_id, s))

      for (const student of students) {
        const entry = scoreEntries[student.id]
        if (!entry) continue

        const ca1 = sanitizeNum(entry.ca1)
        const ca2 = sanitizeNum(entry.ca2)
        const exam = sanitizeNum(entry.exam)

        if (ca1 + ca2 + exam === 0) continue
        const existing = existingMap.get(student.id)

        try {
          if (existing) {
            const f1 = ca1 > 0 ? ca1 : sanitizeNum(existing.ca1_score)
            const f2 = ca2 > 0 ? ca2 : sanitizeNum(existing.ca2_score)
            const fe = exam > 0 ? exam : sanitizeNum(existing.exam_objective_score)
            if (f1 + f2 + fe === 0) continue

            const payload = buildSavePayload(student.id, f1, f2, fe, existing.class || student.class)
            const { error } = await supabase.from('ca_scores').update(payload).eq('id', existing.id)
            error ? (errors++, lastError = error) : saved++
          } else {
            const payload = buildSavePayload(student.id, ca1, ca2, exam, student.class)
            const { error } = await supabase.from('ca_scores').insert([payload])
            error ? (errors++, lastError = error) : saved++
          }
        } catch (rowError: any) {
          errors++
          lastError = rowError
        }
      }

      if (saved > 0) {
        toast.success(`${saved} score(s) saved${errors > 0 ? `, ${errors} failed` : ''}`)
        const ns = { ...savedStatus }
        students.forEach(s => {
          const e = scoreEntries[s.id]
          if (e && (sanitizeNum(e.ca1) + sanitizeNum(e.ca2) + sanitizeNum(e.exam)) > 0) ns[s.id] = true
        })
        setSavedStatus(ns)
        await checkSubjectsStatus()
        await loadAllData()
        if (activeTab === 'view') await loadScoresForViewTab()
      } else if (errors > 0) {
        toast.error(`Failed to save ${errors} student(s): ${lastError?.message || 'Check database constraints'}`)
      } else {
        toast.info('No new scores to save')
      }
    } catch (e: any) {
      console.error('Save all failed:', e)
      toast.error(`Failed: ${e.message || 'Unknown database error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAllScores = async () => {
    if (isLocked) { toast.error(`Locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}`); return }
    setIsDeletingAll(true)
    setDeleteProgress(0)
    setShowDeleteAllDialog(false)
    try {
      const classVariations = getClassVariations(selectedClass)
      const mappedSubject = getMappedSubject(selectedSubject)
      let cq = supabase.from('ca_scores').select('id', { count: 'exact', head: true }).eq('subject', mappedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
      cq = classVariations.length > 1 ? cq.in('class', classVariations) : cq.eq('class', selectedClass)
      const { count: total } = await cq
      if (!total || total === 0) { toast.info('No scores to delete'); setIsDeletingAll(false); return }
      
      let deleted = 0
      while (deleted < total) {
        let dq = supabase.from('ca_scores').delete().eq('subject', mappedSubject).eq('term', selectedTerm).eq('academic_year', selectedYear)
        dq = classVariations.length > 1 ? dq.in('class', classVariations) : dq.eq('class', selectedClass)
        const { error } = await dq.limit(100)
        if (error) { toast.error(`Delete failed: ${error.message}`); break }
        deleted += 100
        setDeleteProgress(Math.min(Math.round((deleted / total) * 100), 100))
      }
      toast.success(`Deleted ${total} score(s)`)
      await checkSubjectsStatus()
      await loadAllData()
      if (activeTab === 'view') await loadScoresForViewTab()
    } catch (e: any) { toast.error(`Failed: ${e.message}`) }
    finally { setIsDeletingAll(false); setDeleteProgress(0) }
  }

  const handleRefresh = async () => {
    await fetchCurrentTerm()
    await checkSubjectsStatus()
    await loadAllData()
    if (activeTab === 'view') await loadScoresForViewTab()
    toast.success('Refreshed')
  }

  const getStudentName = (id: string) => students.find(s => s.id === id)?.full_name || 'Unknown'
  const getStudentAdmission = (id: string) => students.find(s => s.id === id)?.admission_number || '—'

  const groupedStudents = students.reduce((acc: Record<string, Student[]>, s) => {
    const cls = s.class || 'Unknown'
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(s)
    return acc
  }, {})
  const classOrder = Object.keys(groupedStudents).sort()
  const filteredScores = caScores.filter(s => (s.student?.full_name || getStudentName(s.student_id)).toLowerCase().includes(searchQuery.toLowerCase()))

  const getTermLabel = (termValue: string): string => {
    return termOptions.find(t => t.value === termValue)?.label || termValue
  }

  const isCurrentTerm = (termValue: string): boolean => {
    return termOptions.find(t => t.value === termValue)?.is_current || false
  }

  if (!mounted || isRestoring || isLoadingTerm) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{isLoadingTerm ? 'Loading term settings…' : 'Loading assessment data…'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 transition-colors duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-slate-900">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-emerald-500" />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalStudents}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-slate-800">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-slate-900">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-blue-500" />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Graded</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.gradedStudents}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">of {stats.totalStudents}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-slate-800">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-slate-900">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-violet-500" />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class Average</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.classAverage}%</p>
              </div>
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-slate-800">
                <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-slate-900">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-amber-500" />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pass Rate</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.passRate}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stats.passCount} passed · {stats.failCount} failed</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-slate-800">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Subject status:</span>
        <span className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5 text-slate-400" />Available</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />Entered by you</span>
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />Locked by another teacher</span>
      </div>

      {/* Configuration Card */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <Settings2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Assessment Configuration</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={loading || checkingSubjects} 
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 h-8 px-3"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', (loading || checkingSubjects) && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {/* Class Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {classes.map(cls => (
                    <SelectItem key={`class-${cls}`} value={cls}>
                      {isGeneralClass(cls) ?
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{cls} <span className="text-xs opacity-70">(All Streams)</span></span> :
                        cls
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isGeneralClass(selectedClass) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Layers className="h-3 w-3" />All {selectedClass} streams
                </p>
              )}
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subject</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select subject">
                    {selectedSubject && (
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{getMappedSubject(selectedSubject)}</span>
                        {subjectsStatus[selectedSubject]?.enteredByOther ? (
                          <span className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-medium"><Lock className="h-3.5 w-3.5" />Locked</span>
                        ) : subjectsStatus[selectedSubject]?.enteredByMe ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><CheckCircle2 className="h-3.5 w-3.5" />You</span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs"><Circle className="h-3.5 w-3.5" />Open</span>
                        )}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {checkingSubjects ? (
                    <div className="flex items-center gap-2 py-4 px-3 text-sm text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />Checking…
                    </div>
                  ) : (
                    subjects.map(sub => (
                      <SelectItem key={`subject-${sub}`} value={sub}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span>{getMappedSubject(sub)}</span>
                          {subjectsStatus[sub]?.enteredByOther ? (
                            <Lock className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                          ) : subjectsStatus[sub]?.enteredByMe ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {isLocked && selectedSubject && (
                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800/50 text-xs">
                  <Lock className="h-3.5 w-3.5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">Locked</p>
                    <p className="text-red-600 dark:text-red-500">{subjectsStatus[selectedSubject]?.otherTeacherName || 'Another teacher'} has entered scores.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Examination Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Examination</Label>
              <Select value={selectedExamId} onValueChange={handleExamChange} disabled={skipExam || isLocked}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder={skipExam ? 'Skipped (CA only)' : 'Select exam'} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {availableExams.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400">No exams available</div>
                  ) : (
                    availableExams.map(e => (
                      <SelectItem key={`exam-${e.id}`} value={e.id}>{e.title} {e.class ? `(${e.class})` : ''}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!isLocked && (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSkipExam}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded border transition-colors',
                      skipExam ?
                        'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700' :
                        'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {skipExam ? '✓ CA Only' : 'Skip exam'}
                  </button>
                  {skipExam && (
                    <button
                      onClick={() => { setSkipExam(false); if (availableExams.length > 0) setSelectedExamId(availableExams[0].id) }}
                      className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Term Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Term</Label>
              <Select value={selectedTerm} onValueChange={handleTermChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select term">
                    {selectedTerm && (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {getTermLabel(selectedTerm)}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {termOptions.length > 0 ? (
                    termOptions.map((o, index) => (
                      <SelectItem key={`term-opt-${o.value}-${index}`} value={o.value}>
                        <span className={selectedTerm === o.value ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
                          {o.label}
                          {o.is_current && ' (current)'}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-400">Loading terms...</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Session Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Session</Label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {availableSessions.length > 0 ? (
                    availableSessions.map((session, index) => (
                      <SelectItem key={`session-opt-${session}-${index}`} value={session}>
                        <span className={selectedYear === session ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
                          {session}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-400">No sessions available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={handleSaveAll}
              disabled={saving || students.length === 0 || isLocked}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-sm h-9"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isLocked ? 'Locked' : 'Save All Scores'}
            </Button>
            {!skipExam && selectedExamId && !isLocked && (
              <Button
                onClick={handleAutoFetchAll}
                disabled={autoFetching || students.length === 0}
                variant="outline"
                size="sm"
                className="h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', autoFetching && 'animate-spin')} />
                Auto-Fetch Exam Scores
              </Button>
            )}
            <Button
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={caScores.length === 0 || loading || isLocked}
              variant="outline"
              size="sm"
              className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 ml-auto"
            >
              <Trash className="h-4 w-4 mr-2" />Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-auto inline-flex">
          <TabsTrigger 
            value="entry" 
            className="flex items-center gap-2 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-800 dark:data-[state=active]:text-slate-100 px-4"
          >
            <FileText className="h-4 w-4" />Score Entry
          </TabsTrigger>
          <TabsTrigger 
            value="view" 
            className="flex items-center gap-2 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-800 dark:data-[state=active]:text-slate-100 px-4"
          >
            <BarChart3 className="h-4 w-4" />View Scores
            {caScores.length > 0 && (
              <span className="ml-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {caScores.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-4 space-y-4">
          {isLocked ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="py-16 text-center">
                <div className="inline-flex p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 mb-4">
                  <Lock className="h-10 w-10 text-red-400 dark:text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Score Entry Locked</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  <strong>{getMappedSubject(selectedSubject)}</strong> scores for <strong>{selectedClass}</strong> were entered by <strong>{subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}</strong>.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    const avail = subjects.find(s => !subjectsStatus[s]?.enteredByOther && s !== selectedSubject)
                    avail ? setSelectedSubject(avail) : toast.info('All subjects have scores entered.')
                  }}
                >
                  Switch to Available Subject <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading students…</p>
              </CardContent>
            </Card>
          ) : students.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="text-center py-16">
                <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No active students found in <strong>{selectedClass}</strong></p>
              </CardContent>
            </Card>
          ) : (
            classOrder.map(cls => (
              <Card key={`entry-class-${cls}`} className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{cls}</span>
                    <Badge variant="secondary" className="text-xs font-medium ml-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {groupedStudents[cls].length} students
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">CA1 /20 · CA2 /20 · Exam /60</div>
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
                        const caTotal = (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0)
                        const examScore = parseInt(entry.exam) || 0
                        const total = caTotal + examScore
                        const grade = total > 0 ? getGrade(total) : ''
                        const hasExam = entry.exam && parseInt(entry.exam) > 0
                        const isSaved = savedStatus[student.id]
                        return (
                          <TableRow key={`student-entry-${student.id}`} className={cn(
                            'border-slate-100 dark:border-slate-800 transition-colors',
                            idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20',
                            isSaved && 'bg-emerald-50/30 dark:bg-emerald-950/10'
                          )}>
                            <TableCell className="pl-5 py-2.5">
                              <div>
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{student.full_name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{student.admission_number}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={entry.ca1}
                                onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                                className="w-20 h-8 text-center mx-auto text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus-visible:ring-emerald-500"
                                placeholder="0"
                                disabled={isLocked}
                              />
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={entry.ca2}
                                onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                                className="w-20 h-8 text-center mx-auto text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus-visible:ring-emerald-500"
                                placeholder="0"
                                disabled={isLocked}
                              />
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              {hasExam ? (
                                <span className="inline-flex items-center justify-center w-20 h-8 mx-auto font-semibold text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  {parseInt(entry.exam)}
                                </span>
                              ) : !skipExam && selectedExamId && !isLocked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAutoFetchSingle(student.id)}
                                  className="h-8 w-20 mx-auto text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />Load
                                </Button>
                              ) : (
                                <Input
                                  type="number"
                                  min="0"
                                  max="60"
                                  value={entry.exam}
                                  onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                                  className="w-20 h-8 text-center mx-auto text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus-visible:ring-emerald-500"
                                  placeholder="0"
                                  disabled={isLocked}
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <span className={cn('font-bold text-sm', total > 0 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600')}>
                                {total > 0 ? total : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              {grade ? (
                                <Badge className={cn(getGradeColor(grade), 'font-semibold text-xs')}>{grade}</Badge>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center pr-5 py-2.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveSingle(student.id)}
                                disabled={saving || isLocked}
                                className={cn(
                                  'h-8 px-3 text-xs gap-1.5 rounded-md transition-colors',
                                  isSaved ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                )}
                              >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
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

        <TabsContent value="view" className="mt-4">
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Published Scores</CardTitle>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center flex-wrap gap-1">
                    <span>{selectedClass} · {getMappedSubject(selectedSubject)} · {getTermLabel(selectedTerm)}</span>
                    {isLocked && (
                      <Badge className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                        <Lock className="h-3 w-3 mr-1" />Locked
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search students…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadScoresForViewTab} 
                    disabled={loading} 
                    className="h-9 w-9 p-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading scores…</p>
                </div>
              ) : caScores.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                    <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No scores published yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">Enter scores and save them to see them here.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('entry')} 
                    disabled={isLocked}
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Go to Score Entry <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-transparent">
                        {['Student', 'Adm. No', 'CA1', 'CA2', 'Exam', 'Total', '%', 'Grade', 'By', 'Actions'].map(h => (
                          <TableHead key={`view-head-${h}`} className={cn(
                            'font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3',
                            h === 'Student' ? 'pl-5 min-w-[180px]' : 'text-center',
                            h === 'Actions' ? 'pr-5' : ''
                          )}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScores.map((score, idx) => {
                        const ca1 = score.ca1_score || 0
                        const ca2 = score.ca2_score || 0
                        const examTotal = score.exam_objective_score || 0
                        const caTotal = ca1 + ca2
                        const total = caTotal + examTotal
                        const pct = total > 0 ? total : 0
                        const grade = getGrade(pct)
                        const name = score.student?.full_name || getStudentName(score.student_id)
                        const adm = score.student?.admission_number || getStudentAdmission(score.student_id)
                        const isOwn = score.teacher_id === staffProfile?.id
                        return (
                          <TableRow key={`view-score-${score.id}`} className={cn(
                            'border-slate-100 dark:border-slate-800',
                            idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'
                          )}>
                            <TableCell className="pl-5 py-3 font-medium text-sm text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                {name}
                                {!isOwn && <Lock className="h-3 w-3 text-red-400 dark:text-red-500 flex-shrink-0" />}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono text-slate-500 dark:text-slate-400">{adm}</TableCell>
                            <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{ca1 || '—'}</TableCell>
                            <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{ca2 || '—'}</TableCell>
                            <TableCell className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{examTotal || '—'}</TableCell>
                            <TableCell className="text-center font-bold text-sm text-slate-800 dark:text-slate-100">{total || '—'}</TableCell>
                            <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">{pct > 0 ? `${pct}%` : '—'}</TableCell>
                            <TableCell className="text-center">
                              {grade && <Badge className={cn(getGradeColor(grade), 'font-semibold text-xs')}>{grade}</Badge>}
                            </TableCell>
                            <TableCell className="text-center">
                              {isOwn ? (
                                <Badge variant="secondary" className="text-xs gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />You
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1">
                                  <AlertTriangle className="h-3 w-3" />{score.teacher_name || 'Other'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center pr-5">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!isOwn}
                                  onClick={() => { setEditingScore(score); setShowEditDialog(true) }}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-30"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!isOwn}
                                  onClick={async () => {
                                    if (!confirm('Delete this score?')) return
                                    const { error } = await supabase.from('ca_scores').delete().eq('id', score.id)
                                    if (error) toast.error('Failed to delete')
                                    else {
                                      toast.success('Deleted')
                                      await checkSubjectsStatus()
                                      await loadAllData()
                                      await loadScoresForViewTab()
                                    }
                                  }}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30"
                                >
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

      {/* Delete All Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Delete All Score Records?</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="space-y-3 pl-11">
                <div className="flex flex-wrap gap-1.5">
                  {[selectedClass, getMappedSubject(selectedSubject), getTermLabel(selectedTerm), selectedYear].map((v, i) => v && (
                    <Badge key={`delete-badge-${i}`} variant="secondary" className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{v}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/50">
                  <Database className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">{caScores.length} record{caScores.length !== 1 ? 's' : ''} will be permanently deleted</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteAllDialog(false)} 
              disabled={isDeletingAll} 
              className="h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteAllScores} 
              disabled={isDeletingAll} 
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white h-9 gap-1.5"
            >
              {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Progress Dialog */}
      <Dialog open={isDeletingAll && deleteProgress > 0 && deleteProgress < 100} onOpenChange={() => { }}>
        <DialogContent className="max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Loader2 className="h-4 w-4 animate-spin text-red-500 dark:text-red-400" />Deleting scores…
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${deleteProgress}%` }}
              />
            </div>
            <p className="text-right text-xs text-slate-500 dark:text-slate-400">{deleteProgress}%</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Score Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Edit Score</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">{getStudentName(editingScore?.student_id)}</DialogDescription>
          </DialogHeader>
          {editingScore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">CA1 /20</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca1_score || 0}
                    onChange={e => setEditingScore({ ...editingScore, ca1_score: parseInt(e.target.value) || 0 })}
                    className="h-9 text-center text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">CA2 /20</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca2_score || 0}
                    onChange={e => setEditingScore({ ...editingScore, ca2_score: parseInt(e.target.value) || 0 })}
                    className="h-9 text-center text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">CA Total</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0)}/40
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowEditDialog(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
              onClick={async () => {
                if (!editingScore) return
                const ca1 = sanitizeNum(editingScore.ca1_score)
                const ca2 = sanitizeNum(editingScore.ca2_score)
                const exam = sanitizeNum(editingScore.exam_objective_score)
                const total = ca1 + ca2 + exam
                const grade = getGrade(total)
                const { error } = await supabase
                  .from('ca_scores')
                  .update({
                    ca1_score: ca1,
                    ca2_score: ca2,
                    ca_total: ca1 + ca2,
                    exam_objective_score: exam,
                    exam_score: exam,
                    total_score: total,
                    percentage: total,
                    grade,
                    remark: getGradeRemark(grade),
                    status: 'approved',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', editingScore.id)
                if (error) {
                  toast.error(`Failed to update: ${error.message}`)
                  return
                }
                toast.success('Score updated')
                setShowEditDialog(false)
                await checkSubjectsStatus()
                await loadAllData()
                await loadScoresForViewTab()
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CAScoresTab