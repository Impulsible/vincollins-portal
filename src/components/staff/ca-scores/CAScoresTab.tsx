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
  CheckCircle2, Bell, FileText, TrendingUp,
  Award, GraduationCap, BarChart3, SaveAll, Trash,
  AlertTriangle, Database, Layers, Lock, Circle
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

// Grading System
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
  'CRS', 'Yoruba', 'Commerce', 'Financial Accounting', 'Information Technology',
  'Data Processing', 'Further Mathematics'
]

const JUNIOR_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies',
  'Home Economics', 'CRS', 'Yoruba', 'French', 'Information Technology',
  'CCA', 'Music', 'Physical Education', 'History', 'Security Education'
]

// Get available sessions
const getAvailableSessions = (currentSession: string): string[] => {
  const year = parseInt(currentSession.split('/')[0])
  return [
    `${year-1}/${year}`,
    `${year}/${year+1}`,
    `${year+1}/${year+2}`,
  ]
}

// Helper to get all class variations
const getClassVariations = (classType: string): string[] => {
  if (classType === 'JSS 1') return ['JSS 1']
  if (classType === 'JSS 2') return ['JSS 2']
  if (classType === 'JSS 3') return ['JSS 3']
  if (classType === 'SS1') return ['SS1 Science', 'SS1 Arts', 'SS1 Commercial']
  if (classType === 'SS2') return ['SS2 Science', 'SS2 Arts', 'SS2 Commercial']
  if (classType === 'SS3') return ['SS3 Science', 'SS3 Arts', 'SS3 Commercial']
  return [classType]
}

// Check if a class is a general class
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
      <span
        className="flex items-center gap-1 text-red-500 dark:text-red-400"
        title={`Locked - ${status.otherTeacherName || 'Another teacher'} entered scores for ${status.studentCount} student(s)`}
      >
        <Lock className="h-4 w-4" />
        <span className="text-xs font-medium">Locked</span>
      </span>
    )
  }

  if (status.enteredByMe) {
    return (
      <span
        className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
        title={`You entered scores for ${status.studentCount} student(s)`}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs font-medium">You</span>
      </span>
    )
  }

  return (
    <span
      className="flex items-center gap-1 text-slate-400 dark:text-slate-500"
      title="Available - No scores entered yet"
    >
      <Circle className="h-4 w-4" />
      <span className="text-xs">Available</span>
    </span>
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

  const isInitialMount = useRef(true)
  const sessionOptions = getAvailableSessions(termInfo?.sessionYear || '2025/2026')

  // ===== CHECK SUBJECTS STATUS - FIXED FOR SS STREAMS =====
  const checkSubjectsStatus = useCallback(async () => {
    if (!selectedClass || !selectedTerm || !selectedYear || !staffProfile?.id) return

    setCheckingSubjects(true)
    const allSubjects = selectedClass.toUpperCase().startsWith('JSS') ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
    const classVariations = getClassVariations(selectedClass)

    let query = supabase
      .from('ca_scores')
      .select('subject, teacher_id, teacher_name, student_id, class')

    if (classVariations.length > 1) {
      query = query.in('class', classVariations)
    } else {
      query = query.eq('class', selectedClass)
    }

    const { data: allScores } = await query
      .eq('term', selectedTerm)
      .eq('academic_year', selectedYear)

    const statusMap: Record<string, SubjectStatus> = {}

    for (const subject of allSubjects) {
      const scores = (allScores || []).filter(s => s.subject === subject)

      if (scores.length === 0) {
        statusMap[subject] = {
          hasScores: false,
          enteredByMe: false,
          enteredByOther: false,
          studentCount: 0,
        }
      } else {
        const uniqueStudents = new Set(scores.map(s => s.student_id))
        const enteredByMe = scores.some(s => s.teacher_id === staffProfile.id)
        const enteredByOther = scores.some(s => s.teacher_id !== staffProfile.id)
        const otherTeacher = scores.find(s => s.teacher_id !== staffProfile.id)

        statusMap[subject] = {
          hasScores: true,
          enteredByMe: enteredByMe && !enteredByOther,
          enteredByOther: enteredByOther,
          otherTeacherName: otherTeacher?.teacher_name,
          studentCount: uniqueStudents.size,
        }
      }
    }

    setSubjectsStatus(statusMap)
    setCheckingSubjects(false)
  }, [selectedClass, selectedTerm, selectedYear, staffProfile?.id])

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedClass = localStorage.getItem(STORAGE_KEYS.SELECTED_CLASS)
      const savedSubject = localStorage.getItem(STORAGE_KEYS.SELECTED_SUBJECT)
      const savedTerm = localStorage.getItem(STORAGE_KEYS.SELECTED_TERM)
      const savedYear = localStorage.getItem(STORAGE_KEYS.SELECTED_YEAR)
      const savedExam = localStorage.getItem(STORAGE_KEYS.SELECTED_EXAM)
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB)
      const savedSkipExam = localStorage.getItem(STORAGE_KEYS.SKIP_EXAM)

      if (savedClass) setSelectedClass(savedClass)
      if (savedSubject) setSelectedSubject(savedSubject)
      if (savedTerm) setSelectedTerm(savedTerm)
      if (savedYear) setSelectedYear(savedYear)
      if (savedExam) setSelectedExamId(savedExam)
      if (savedTab) setActiveTab(savedTab)
      if (savedSkipExam === 'true') setSkipExam(true)
    }
    setIsRestoring(false)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  }, [])

  // Save to localStorage when values change
  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined' && selectedClass) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CLASS, selectedClass)
    }
  }, [selectedClass, isRestoring])

  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined' && selectedSubject) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_SUBJECT, selectedSubject)
    }
  }, [selectedSubject, isRestoring])

  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SELECTED_TERM, selectedTerm)
    }
  }, [selectedTerm, isRestoring])

  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SELECTED_YEAR, selectedYear)
    }
  }, [selectedYear, isRestoring])

  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined' && selectedExamId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_EXAM, selectedExamId)
    }
  }, [selectedExamId, isRestoring])

  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab)
    }
  }, [activeTab, isRestoring])

  useEffect(() => {
    if (isInitialMount.current || isRestoring) return
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SKIP_EXAM, String(skipExam))
    }
  }, [skipExam, isRestoring])

  // Check subject status when config changes
  useEffect(() => {
    if (mounted && !isRestoring && selectedClass && staffProfile?.id) {
      checkSubjectsStatus()
    }
  }, [mounted, isRestoring, selectedClass, selectedTerm, selectedYear, staffProfile?.id, checkSubjectsStatus])

  // Update isLocked when subject changes
  useEffect(() => {
    if (selectedSubject && subjectsStatus[selectedSubject]) {
      setIsLocked(subjectsStatus[selectedSubject].enteredByOther)
    } else {
      setIsLocked(false)
    }
  }, [selectedSubject, subjectsStatus])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedSubject('')
    setCAScores([])
  }

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value)
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
  }

  const handleTermChange = (value: string) => {
    setSelectedTerm(value)
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    setSelectedExamId('')
    setSkipExam(false)
    setCAScores([])
  }

  const handleExamChange = (value: string) => {
    setSelectedExamId(value)
    setSkipExam(false)
  }

  const handleSkipExam = () => {
    setSkipExam(true)
    setSelectedExamId('')
  }

  // Load classes with general classes included
  const loadClasses = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('class')
      .eq('role', 'student')
      .not('class', 'is', null)

    const uniqueClasses = [...new Set((data || []).map(d => d.class).filter(Boolean))] as string[]
    
    const generalClasses = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3']
    const allClasses = [...new Set([...generalClasses, ...uniqueClasses])].sort()
    
    setClasses(allClasses)
    
    if (allClasses.length > 0 && !selectedClass && !isRestoring) {
      setSelectedClass(allClasses[0])
    }
  }, [selectedClass, isRestoring])

  useEffect(() => {
    if (mounted && !isRestoring) {
      loadClasses()
    }
  }, [mounted, isRestoring, loadClasses])

  useEffect(() => {
    if (!selectedClass || isRestoring) return
    
    const isJSS = selectedClass.toUpperCase().startsWith('JSS')
    const list = isJSS ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
    setSubjects(list)
    
    if (!selectedSubject && list.length > 0) {
      setSelectedSubject(list[0])
    }
  }, [selectedClass, selectedSubject, isRestoring])

  useEffect(() => {
    if (!selectedSubject || !selectedTerm || !selectedYear || isRestoring || skipExam) return
    
    const loadExams = async () => {
      const { data } = await supabase
        .from('exams')
        .select('id, title')
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('session_year', selectedYear)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      setAvailableExams(data || [])
      
      if (data && data.length > 0 && !selectedExamId && !skipExam) {
        setSelectedExamId(data[0].id)
      }
    }
    
    loadExams()
  }, [selectedSubject, selectedTerm, selectedYear, selectedExamId, isRestoring, skipExam])

  // Load students with proper class filtering (handles general classes)
  const loadAllData = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) return
    
    setLoading(true)
    
    try {
      const classVariations = getClassVariations(selectedClass)
      
      let query = supabase
        .from('profiles')
        .select('id, full_name, display_name, class, admission_number, vin_id')
        .eq('role', 'student')

      if (classVariations.length > 1) {
        query = query.in('class', classVariations)
      } else {
        query = query.eq('class', selectedClass)
      }

      const { data: profileData, error: profileError } = await query.order('display_name')

      if (profileError) throw profileError

      if (!profileData || profileData.length === 0) {
        setStudents([])
        setCAScores([])
        setLoading(false)
        return
      }

      const formatted: Student[] = profileData.map(profile => ({
        id: profile.id,
        full_name: profile.display_name || profile.full_name || 'Unknown',
        class: profile.class,
        admission_number: profile.admission_number || '—',
        vin_id: profile.vin_id || '—'
      }))

      setStudents(formatted)
      
      let scoresQuery = supabase
        .from('ca_scores')
        .select('*')
        .in('student_id', formatted.map(s => s.id))
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      if (classVariations.length > 1) {
        scoresQuery = scoresQuery.in('class', classVariations)
      } else {
        scoresQuery = scoresQuery.eq('class', selectedClass)
      }

      if (skipExam || !selectedExamId) {
        scoresQuery = scoresQuery.is('exam_id', null)
      } else {
        scoresQuery = scoresQuery.eq('exam_id', selectedExamId)
      }

      const { data: scoresData, error: scoresError } = await scoresQuery

      if (scoresError) throw scoresError
      
      const entries: Record<string, ScoreEntry> = {}
      const savedMap: Record<string, boolean> = {}
      
      formatted.forEach(s => {
        entries[s.id] = { ca1: '', ca2: '', exam: '', is_saved: false }
      })
      
      let totalScoreSum = 0
      let gradedCount = 0
      let highestScore = 0
      let passCount = 0
      let failCount = 0
      
      ;(scoresData || []).forEach((score: any) => {
        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
        const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
        const grade = getGrade(percentage)
        
        entries[score.student_id] = {
          ca1: score.ca1_score?.toString() || '',
          ca2: score.ca2_score?.toString() || '',
          exam: examTotal > 0 ? examTotal.toString() : '',
          is_saved: true
        }
        
        savedMap[score.student_id] = true
        
        if (total > 0) {
          totalScoreSum += total
          gradedCount++
          if (total > highestScore) highestScore = total
          if (grade !== 'F9') passCount++
          else failCount++
        }
      })
      
      setScoreEntries(entries)
      setSavedStatus(savedMap)
      setStats({
        totalStudents: formatted.length,
        gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? Math.round(totalScoreSum / gradedCount) : 0,
        highestScore: highestScore,
        passCount: passCount,
        failCount: failCount,
        passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0
      })
      
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, selectedExamId, skipExam])

  // Load scores for View Tab
  const loadScoresForViewTab = useCallback(async () => {
    if (!selectedClass || !selectedSubject) return
    
    setLoading(true)
    try {
      const classVariations = getClassVariations(selectedClass)
      
      let query = supabase
        .from('ca_scores')
        .select('*')
        .eq('subject', selectedSubject)

      if (classVariations.length > 1) {
        query = query.in('class', classVariations)
      } else {
        query = query.eq('class', selectedClass)
      }

      const { data: scoresData, error: scoresError } = await query

      if (scoresError) throw scoresError
      
      if (scoresData && scoresData.length > 0) {
        const studentIds = [...new Set(scoresData.map(s => s.student_id))]
        
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('id, full_name, display_name, admission_number')
          .in('id', studentIds)
        
        if (studentsError) {
          toast.error('Failed to load student data')
        }
        
        const studentMap = new Map()
        studentsData?.forEach(s => {
          studentMap.set(s.id, {
            full_name: s.display_name || s.full_name || 'Unknown',
            admission_number: s.admission_number || '—'
          })
        })
        
        const enrichedScores = scoresData.map(score => ({
          ...score,
          student: studentMap.get(score.student_id) || {
            full_name: 'Unknown Student',
            admission_number: '—'
          }
        }))
        
        setCAScores(enrichedScores)
      } else {
        setCAScores([])
      }
    } catch (error) {
      toast.error('Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject])

  useEffect(() => {
    if (isRestoring) return
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) return
    
    loadAllData()
  }, [loadAllData, isRestoring])

  useEffect(() => {
    if (activeTab === 'view' && selectedClass && selectedSubject) {
      loadScoresForViewTab()
    }
  }, [activeTab, selectedClass, selectedSubject, loadScoresForViewTab])

  const updateStatsFromEntries = () => {
    let totalScoreSum = 0
    let gradedCount = 0
    let highestScore = 0
    let passCount = 0
    let failCount = 0

    students.forEach(student => {
      const entry = scoreEntries[student.id]
      if (!entry) return
      
      const ca1 = parseInt(entry.ca1) || 0
      const ca2 = parseInt(entry.ca2) || 0
      const exam = parseInt(entry.exam) || 0
      const total = ca1 + ca2 + exam
      
      if (total > 0) {
        totalScoreSum += total
        gradedCount++
        if (total > highestScore) highestScore = total
        const percentage = Math.round((total / 100) * 100)
        const grade = getGrade(percentage)
        if (grade !== 'F9') passCount++
        else failCount++
      }
    })

    setStats({
      totalStudents: students.length,
      gradedStudents: gradedCount,
      classAverage: gradedCount > 0 ? Math.round(totalScoreSum / gradedCount) : 0,
      highestScore: highestScore,
      passCount: passCount,
      failCount: failCount,
      passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0
    })
  }

  const handleScoreChange = (studentId: string, field: keyof ScoreEntry, value: string) => {
    if (isLocked || field === 'is_saved') return
    
    const maxValues = { ca1: 20, ca2: 20, exam: 60 }
    let numValue = parseFloat(value) || 0
    numValue = Math.min(maxValues[field], Math.max(0, numValue))
    
    setScoreEntries(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue.toString(), is_saved: false }
    }))
    
    setSavedStatus(prev => ({ ...prev, [studentId]: false }))
    setTimeout(() => updateStatsFromEntries(), 50)
  }

  const calculateSubjectScore = (ca1: number, ca2: number, exam: number) => {
    const total = ca1 + ca2 + exam
    const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
    const grade = getGrade(percentage)
    const remark = getGradeRemark(grade)
    return { total_score: total, percentage, grade, remark }
  }

  const handleSaveSingle = async (studentId: string) => {
    if (!staffProfile?.id) {
      toast.error('Missing teacher information')
      return
    }

    if (isLocked) {
      toast.error(`Cannot save. Scores locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}.`)
      return
    }

    const entry = scoreEntries[studentId]
    if (!entry) return

    const ca1Score = parseInt(entry.ca1) || 0
    const ca2Score = parseInt(entry.ca2) || 0
    const examScore = parseInt(entry.exam) || 0

    if (ca1Score === 0 && ca2Score === 0 && examScore === 0) {
      toast.info('No scores to save for this student')
      return
    }

    setSaving(true)

    try {
      const { total_score, percentage, grade, remark } = calculateSubjectScore(ca1Score, ca2Score, examScore)
      const now = new Date().toISOString()

      const dataToSave: any = {
        student_id: studentId,
        subject: selectedSubject,
        term: selectedTerm,
        academic_year: selectedYear,
        ca1_score: ca1Score,
        ca2_score: ca2Score,
        exam_objective_score: Math.round(examScore * 0.6),
        exam_theory_score: Math.round(examScore * 0.4),
        total_score: total_score,
        percentage: percentage,
        grade: grade,
        remark: remark,
        teacher_id: staffProfile.id,
        teacher_name: staffProfile.full_name || staffProfile.display_name || 'Teacher',
        class: students.find(s => s.id === studentId)?.class || selectedClass,
        status: 'approved',
        submitted_at: now,
        updated_at: now
      }

      if (selectedExamId && !skipExam) {
        dataToSave.exam_id = selectedExamId
      }

      let query = supabase
        .from('ca_scores')
        .select('id')
        .eq('student_id', studentId)
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      if (selectedExamId && !skipExam) {
        query = query.eq('exam_id', selectedExamId)
      } else {
        query = query.is('exam_id', null)
      }

      const { data: existing } = await query.maybeSingle()

      let result
      if (existing) {
        const updateData = { ...dataToSave }
        if (!selectedExamId || skipExam) {
          delete updateData.exam_id
        }
        result = await supabase
          .from('ca_scores')
          .update(updateData)
          .eq('id', existing.id)
      } else {
        result = await supabase
          .from('ca_scores')
          .insert([dataToSave])
      }

      if (result.error) {
        console.error('❌ Save error:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint
        })
        throw result.error
      }

      setSavedStatus(prev => ({ ...prev, [studentId]: true }))
      setScoreEntries(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], is_saved: true }
      }))
      
      toast.success(`Scores saved for ${getStudentName(studentId)}`)
      
      await checkSubjectsStatus()
      await loadAllData()
      if (activeTab === 'view') {
        await loadScoresForViewTab()
      }
      
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    if (!staffProfile?.id) {
      toast.error('Missing teacher information')
      return
    }

    if (isLocked) {
      toast.error(`Cannot save. Scores locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}.`)
      return
    }

    setSaving(true)
    let savedCount = 0
    let errorCount = 0

    try {
      const now = new Date().toISOString()
      
      for (const student of students) {
        const entry = scoreEntries[student.id]
        if (!entry) continue

        const ca1Score = parseInt(entry.ca1) || 0
        const ca2Score = parseInt(entry.ca2) || 0
        const examScore = parseInt(entry.exam) || 0

        if (ca1Score === 0 && ca2Score === 0 && examScore === 0) continue

        const { total_score, percentage, grade, remark } = calculateSubjectScore(ca1Score, ca2Score, examScore)

        const dataToSave: any = {
          student_id: student.id,
          subject: selectedSubject,
          term: selectedTerm,
          academic_year: selectedYear,
          ca1_score: ca1Score,
          ca2_score: ca2Score,
          exam_objective_score: Math.round(examScore * 0.6),
          exam_theory_score: Math.round(examScore * 0.4),
          total_score: total_score,
          percentage: percentage,
          grade: grade,
          remark: remark,
          teacher_id: staffProfile.id,
          teacher_name: staffProfile.full_name || staffProfile.display_name || 'Teacher',
          class: student.class,
          status: 'approved',
          submitted_at: now,
          updated_at: now
        }

        if (selectedExamId && !skipExam) {
          dataToSave.exam_id = selectedExamId
        }

        let query = supabase
          .from('ca_scores')
          .select('id')
          .eq('student_id', student.id)
          .eq('subject', selectedSubject)
          .eq('term', selectedTerm)
          .eq('academic_year', selectedYear)

        if (selectedExamId && !skipExam) {
          query = query.eq('exam_id', selectedExamId)
        } else {
          query = query.is('exam_id', null)
        }

        const { data: existing } = await query.maybeSingle()

        let result
        if (existing) {
          const updateData = { ...dataToSave }
          if (!selectedExamId || skipExam) {
            delete updateData.exam_id
          }
          result = await supabase
            .from('ca_scores')
            .update(updateData)
            .eq('id', existing.id)
        } else {
          result = await supabase
            .from('ca_scores')
            .insert([dataToSave])
        }

        if (result.error) {
          console.error('❌ Save error:', {
            student: getStudentName(student.id),
            message: result.error.message,
            code: result.error.code,
            details: result.error.details,
            hint: result.error.hint
          })
          errorCount++
        } else {
          savedCount++
        }
      }

      if (savedCount > 0) {
        toast.success(`✅ ${savedCount} score(s) saved successfully`)
        if (errorCount > 0) {
          toast.warning(`⚠️ ${errorCount} student(s) had errors`)
        }
        
        const newSavedStatus: Record<string, boolean> = { ...savedStatus }
        students.forEach(student => {
          const entry = scoreEntries[student.id]
          if (entry && (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0) > 0) {
            newSavedStatus[student.id] = true
          }
        })
        setSavedStatus(newSavedStatus)
        
        await checkSubjectsStatus()
        await loadAllData()
        if (activeTab === 'view') {
          await loadScoresForViewTab()
        }
      } else if (errorCount > 0) {
        toast.error(`Failed to save ${errorCount} student(s)`)
      } else {
        toast.info('No new scores to save')
      }
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Delete All Scores - with progress AND lock protection
  const handleDeleteAllScores = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) {
      toast.error('Please select class, subject, term, and year')
      return
    }

    if (isLocked) {
      toast.error(`Cannot delete. Scores are locked by ${subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}.`)
      return
    }

    setIsDeletingAll(true)
    setDeleteProgress(0)
    setShowDeleteAllDialog(false)

    try {
      const classVariations = getClassVariations(selectedClass)
      
      let countQuery = supabase
        .from('ca_scores')
        .select('id', { count: 'exact', head: true })
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      if (classVariations.length > 1) {
        countQuery = countQuery.in('class', classVariations)
      } else {
        countQuery = countQuery.eq('class', selectedClass)
      }

      if (selectedExamId && !skipExam) {
        countQuery = countQuery.eq('exam_id', selectedExamId)
      } else {
        countQuery = countQuery.is('exam_id', null)
      }

      const { count: totalCount } = await countQuery

      if (!totalCount || totalCount === 0) {
        toast.info('No scores to delete')
        setIsDeletingAll(false)
        return
      }

      let deletedCount = 0
      const batchSize = 100

      while (deletedCount < totalCount) {
        let deleteQuery = supabase
          .from('ca_scores')
          .delete()
          .eq('subject', selectedSubject)
          .eq('term', selectedTerm)
          .eq('academic_year', selectedYear)

        if (classVariations.length > 1) {
          deleteQuery = deleteQuery.in('class', classVariations)
        } else {
          deleteQuery = deleteQuery.eq('class', selectedClass)
        }

        if (selectedExamId && !skipExam) {
          deleteQuery = deleteQuery.eq('exam_id', selectedExamId)
        } else {
          deleteQuery = deleteQuery.is('exam_id', null)
        }

        deleteQuery = deleteQuery.limit(batchSize)

        const { error: deleteError } = await deleteQuery

        if (deleteError) {
          toast.error(`Failed to delete scores: ${deleteError.message}`)
          break
        }

        deletedCount += batchSize
        const progress = Math.min(Math.round((deletedCount / totalCount) * 100), 100)
        setDeleteProgress(progress)
      }

      toast.success(`✅ All ${totalCount} scores for ${selectedSubject} (${selectedClass}) have been deleted!`)
      
      await checkSubjectsStatus()
      await loadAllData()
      if (activeTab === 'view') {
        await loadScoresForViewTab()
      }
      
    } catch (error: any) {
      toast.error(`Failed to delete scores: ${error.message}`)
    } finally {
      setIsDeletingAll(false)
      setDeleteProgress(0)
    }
  }

  // ✅ FIXED: .single() → .maybeSingle() to avoid 406 errors
  const handleAutoFetchSingle = async (studentId: string) => {
    if (!selectedExamId || skipExam) {
      toast.info('No exam selected. Please select an exam or create one first.')
      return
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .select('objective_score, theory_feedback')
      .eq('exam_id', selectedExamId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('❌ Auto-fetch error:', error)
      toast.info('No exam attempt found for this student')
      return
    }

    if (data) {
      const objectiveScore = Number(data.objective_score) || 0
      let theoryScore = 0

      if (data.theory_feedback?.total?.score !== undefined) {
        theoryScore = Number(data.theory_feedback.total.score)
      }

      const examTotal = objectiveScore + theoryScore

      setScoreEntries(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          exam: examTotal > 0 ? String(Math.round(examTotal)) : '',
          is_saved: false
        }
      }))

      setSavedStatus(prev => ({ ...prev, [studentId]: false }))
      toast.success('Exam score loaded')
      setTimeout(() => updateStatsFromEntries(), 50)
    }
  }

  // ✅ FIXED: .single() → .maybeSingle() to avoid 406 errors
  const handleAutoFetchAll = async () => {
    if (!selectedExamId || skipExam) {
      toast.info('No exam selected. Please select an exam or create one first.')
      return
    }
    
    setAutoFetching(true)
    let count = 0

    for (const student of students) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('objective_score, theory_feedback')
        .eq('exam_id', selectedExamId)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        const objectiveScore = Number(data.objective_score) || 0
        let theoryScore = 0

        if (data.theory_feedback?.total?.score !== undefined) {
          theoryScore = Number(data.theory_feedback.total.score)
        }

        const examTotal = objectiveScore + theoryScore

        setScoreEntries(prev => ({
          ...prev,
          [student.id]: {
            ...prev[student.id],
            exam: examTotal > 0 ? String(Math.round(examTotal)) : '',
            is_saved: false
          }
        }))

        setSavedStatus(prev => ({ ...prev, [student.id]: false }))
        count++
      }
    }

    setAutoFetching(false)
    toast.success(`Loaded ${count} exam score(s)`)
    setTimeout(() => updateStatsFromEntries(), 50)
  }

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.full_name || 'Unknown'
  }

  const getStudentAdmission = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.admission_number || '—'
  }

  const handleRefresh = async () => {
    await checkSubjectsStatus()
    await loadAllData()
    if (activeTab === 'view') {
      await loadScoresForViewTab()
    }
    toast.success('Data refreshed')
  }

  const groupedStudents = students.reduce((acc: Record<string, Student[]>, student) => {
    const cls = student.class || 'Unknown'
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(student)
    return acc
  }, {})

  const classOrder = Object.keys(groupedStudents).sort()
  
  const filteredScores = caScores.filter(score => {
    const studentName = score.student?.full_name || getStudentName(score.student_id)
    return studentName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!mounted || isRestoring) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Graded Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.gradedStudents}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Class Average</p>
                <p className="text-2xl font-bold text-purple-600">{stats.classAverage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pass Rate</p>
                <p className="text-2xl font-bold text-amber-600">{stats.passRate}%</p>
              </div>
              <Award className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Status Legend */}
      <div className="bg-white dark:bg-slate-950 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Subject Status:</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Circle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400">Available - No scores entered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">You - Scores entered by you</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-red-500" />
            <span className="text-slate-600 dark:text-slate-400">Locked - Entered by another teacher</span>
          </div>
        </div>
      </div>

      {/* Grading Scale Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Grading Scale:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GRADING_SCALE.map((scale) => (
              <Badge key={scale.grade} className={cn(scale.color, "font-medium")}>
                {scale.grade}: {scale.min}-{scale.max === 100 ? '100' : scale.max}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-2 flex items-center gap-1">
          <Bell className="h-3 w-3" />
          Scores are automatically saved and persist across sessions
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Assessment Configuration</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || checkingSubjects}>
              <RefreshCw className={cn("h-4 w-4 mr-2", (loading || checkingSubjects) && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>
                      {isGeneralClass(cls) ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">📚 {cls} (All Streams)</span>
                      ) : (
                        cls
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isGeneralClass(selectedClass) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Includes all {selectedClass} streams
                </p>
              )}
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select subject">
                    {selectedSubject && (
                      <div className="flex items-center gap-2">
                        <span>{selectedSubject}</span>
                        {subjectsStatus[selectedSubject] && (
                          <SubjectStatusIcon status={subjectsStatus[selectedSubject]} />
                        )}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {checkingSubjects ? (
                    <div className="flex items-center justify-center py-4 px-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600 mr-2" />
                      <span className="text-sm text-slate-500">Checking subjects...</span>
                    </div>
                  ) : (
                    subjects.map(sub => {
                      const status = subjectsStatus[sub]
                      return (
                        <SelectItem key={sub} value={sub}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{sub}</span>
                            <SubjectStatusIcon status={status} />
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
              
              {/* Lock warning banner */}
              {isLocked && selectedSubject && (
                <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800/50">
                  <Lock className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-red-700 dark:text-red-400">Score Entry Locked</p>
                    <p className="text-red-600 dark:text-red-500">
                      {subjectsStatus[selectedSubject]?.otherTeacherName || 'Another teacher'} has already entered scores for {selectedSubject}.
                      You cannot modify these scores.
                    </p>
                  </div>
                </div>
              )}
              
              {/* My scores indicator */}
              {!isLocked && selectedSubject && subjectsStatus[selectedSubject]?.enteredByMe && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>You have entered scores for {subjectsStatus[selectedSubject]?.studentCount} student(s)</span>
                </div>
              )}
              
              {/* Available indicator */}
              {!isLocked && selectedSubject && !subjectsStatus[selectedSubject]?.hasScores && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Circle className="h-3.5 w-3.5" />
                  <span>Available for score entry</span>
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Examination</Label>
              <Select value={selectedExamId} onValueChange={handleExamChange} disabled={skipExam || isLocked}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={skipExam ? "Exam skipped" : "Select exam"} />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-slate-500">No exams available</div>
                  ) : (
                    availableExams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!isLocked && (
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    type="button"
                    variant={skipExam ? "default" : "outline"}
                    size="sm"
                    onClick={handleSkipExam}
                    className="h-6 text-xs"
                  >
                    {skipExam ? "✓ Skip Exam (CA Only)" : "Skip Exam (CA Only)"}
                  </Button>
                  {skipExam && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSkipExam(false)
                        if (availableExams.length > 0) {
                          setSelectedExamId(availableExams[0].id)
                        }
                      }}
                      className="h-6 text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Term</Label>
              <Select value={selectedTerm} onValueChange={handleTermChange}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Session</Label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessionOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={handleSaveAll} 
              disabled={saving || students.length === 0 || isLocked} 
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SaveAll className="h-4 w-4 mr-2" />}
              {isLocked ? 'Locked by Another Teacher' : 'Save All Scores'}
            </Button>
            
            {!skipExam && selectedExamId && !isLocked && (
              <Button 
                onClick={handleAutoFetchAll} 
                disabled={autoFetching || students.length === 0}
                variant="outline"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", autoFetching && "animate-spin")} />
                Auto-Fetch All Exam Scores
              </Button>
            )}
            
            <Button 
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={caScores.length === 0 || loading || isLocked}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Trash className="h-4 w-4 mr-2" />
              {isLocked ? 'Locked by Another Teacher' : 'Delete All Scores'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FIXED: Delete Confirmation Dialog with better contrast */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-red-300 dark:border-red-700 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-red-700 dark:text-red-300">
                Delete Score Records
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="py-3 space-y-4">
            {/* Summary Chips with better contrast */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1">
                {selectedClass}
              </Badge>
              <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
              <Badge variant="secondary" className="font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1">
                {selectedSubject}
              </Badge>
              <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
              <Badge variant="secondary" className="font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1">
                {TERM_OPTIONS.find(t => t.value === selectedTerm)?.label || selectedTerm}
              </Badge>
              <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
              <Badge variant="secondary" className="font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1">
                {selectedYear}
              </Badge>
              {selectedExamId && !skipExam && (
                <>
                  <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
                  <Badge variant="secondary" className="font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1">
                    {availableExams.find(e => e.id === selectedExamId)?.title || selectedExamId}
                  </Badge>
                </>
              )}
              {skipExam && (
                <>
                  <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
                  <Badge variant="outline" className="font-semibold border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-1">
                    CA Only
                  </Badge>
                </>
              )}
            </div>

            {/* Danger Summary with better contrast */}
            <div className="flex items-center gap-3 bg-red-100 dark:bg-red-950/50 rounded-lg px-4 py-3 border-2 border-red-300 dark:border-red-700">
              <Database className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <span className="text-base font-bold text-red-800 dark:text-red-200">
                  {caScores.length} record{caScores.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-semibold text-red-700 dark:text-red-300"> will be permanently deleted</span>
              </div>
            </div>

            {/* Warning with better contrast */}
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 border border-amber-300 dark:border-amber-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>This action cannot be undone. All score data will be lost permanently.</span>
            </div>
          </div>

          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel 
              disabled={isDeletingAll} 
              className="px-5 py-2.5 text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllScores}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white px-6 py-2.5 gap-2 font-bold shadow-lg border-2 border-red-700 dark:border-red-500 rounded-lg"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Progress Dialog */}
      <Dialog open={isDeletingAll && deleteProgress > 0 && deleteProgress < 100} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <Loader2 className="h-5 w-5 animate-spin text-red-600 dark:text-red-400" />
                </div>
                Deleting Scores...
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Please wait while scores are being deleted
            </p>
            <div className="space-y-2">
              <Progress value={deleteProgress} className="h-3 bg-slate-200 dark:bg-slate-700" />
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteProgress}%</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Score Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">Edit Assessment Score</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update scores for {getStudentName(editingScore?.student_id)}
            </DialogDescription>
          </DialogHeader>

          {editingScore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">CA1 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca1_score || 0}
                    onChange={e => setEditingScore({
                      ...editingScore,
                      ca1_score: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">CA2 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca2_score || 0}
                    onChange={e => setEditingScore({
                      ...editingScore,
                      ca2_score: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Total CA Score</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0)} / 40
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              onClick={async () => {
                if (!editingScore) return

                const ca1 = editingScore.ca1_score || 0
                const ca2 = editingScore.ca2_score || 0
                const total = ca1 + ca2
                const percentage = total > 0 ? Math.round((total / 40) * 100) : 0
                const grade = getGrade(percentage)
                const remark = getGradeRemark(grade)
                const now = new Date().toISOString()

                const { error } = await supabase
                  .from('ca_scores')
                  .update({
                    ca1_score: ca1,
                    ca2_score: ca2,
                    total_score: total,
                    percentage: percentage,
                    grade: grade,
                    remark: remark,
                    status: 'approved',
                    updated_at: now
                  })
                  .eq('id', editingScore.id)

                if (error) {
                  toast.error('Failed to update score')
                  return
                }

                toast.success('Score updated successfully')
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="entry" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <FileText className="h-4 w-4" />
            Score Entry
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <BarChart3 className="h-4 w-4" />
            View Scores ({caScores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-6">
          {isLocked ? (
            <Card className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10">
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                    <Lock className="h-12 w-12 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                      Score Entry Locked
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-2 max-w-md">
                      Scores for <strong>{selectedSubject}</strong> in <strong>{selectedClass}</strong> have been 
                      entered by <strong>{subjectsStatus[selectedSubject]?.otherTeacherName || 'another teacher'}</strong>.
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      To prevent overwriting, score entry is disabled. Please select another subject.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const availableSubject = subjects.find(
                        s => !subjectsStatus[s]?.enteredByOther && s !== selectedSubject
                      )
                      if (availableSubject) {
                        setSelectedSubject(availableSubject)
                      } else {
                        toast.info('All subjects have scores entered. Check the View tab.')
                      }
                    }}
                    className="mt-2"
                  >
                    Switch to Available Subject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p className="text-slate-500">Loading students...</p>
              </CardContent>
            </Card>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No students found in {selectedClass}</p>
              </CardContent>
            </Card>
          ) : (
            classOrder.map(cls => (
              <div key={cls} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                    {cls}
                    <Badge variant="secondary" className="ml-2">
                      {groupedStudents[cls].length} students
                    </Badge>
                  </h3>
                </div>
                
                <div className="border rounded-lg overflow-x-auto dark:border-slate-700">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="font-semibold min-w-[180px] text-slate-700 dark:text-slate-300">Student</TableHead>
                        <TableHead className="text-center w-24 font-semibold text-slate-700 dark:text-slate-300">CA1</TableHead>
                        <TableHead className="text-center w-24 font-semibold text-slate-700 dark:text-slate-300">CA2</TableHead>
                        <TableHead className="text-center w-28 font-semibold text-slate-700 dark:text-slate-300">Exam</TableHead>
                        <TableHead className="text-center w-20 font-semibold text-slate-700 dark:text-slate-300">Total</TableHead>
                        <TableHead className="text-center w-24 font-semibold text-slate-700 dark:text-slate-300">Grade</TableHead>
                        <TableHead className="text-center w-24 font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedStudents[cls].map(student => {
                        const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '' }
                        const total = (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0)
                        const grade = total > 0 ? getGrade(Math.round((total / 100) * 100)) : ''
                        const hasExamScore = entry.exam && parseInt(entry.exam) > 0
                        const isSaved = savedStatus[student.id]
                        
                        return (
                          <TableRow key={student.id} className="dark:border-slate-700">
                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                              {student.full_name}
                              <p className="text-xs text-slate-400 font-mono">{student.admission_number}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={entry.ca1}
                                onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                                className="w-20 text-center mx-auto dark:bg-slate-900 dark:border-slate-700" 
                                placeholder="0"
                                disabled={isLocked}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={entry.ca2}
                                onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                                className="w-20 text-center mx-auto dark:bg-slate-900 dark:border-slate-700" 
                                placeholder="0"
                                disabled={isLocked}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {hasExamScore ? (
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">{parseInt(entry.exam)}</span>
                              ) : (
                                !skipExam && selectedExamId && !isLocked ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAutoFetchSingle(student.id)}
                                    className="h-7 text-xs dark:hover:bg-slate-800"
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Load
                                  </Button>
                                ) : (
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="60" 
                                    value={entry.exam}
                                    onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                                    className="w-20 text-center mx-auto dark:bg-slate-900 dark:border-slate-700" 
                                    placeholder="0"
                                    disabled={isLocked}
                                  />
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200">
                              {total > 0 ? total : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {grade && (
                                <Badge className={getGradeColor(grade)}>
                                  {grade}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveSingle(student.id)}
                                disabled={saving || isLocked}
                                className="h-8 px-3 dark:hover:bg-slate-800"
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isSaved ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Save className="h-4 w-4 text-slate-500" />
                                )}
                                <span className="ml-1 text-xs">
                                  {isLocked ? 'Locked' : isSaved ? 'Saved' : 'Save'}
                                </span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="view" className="mt-6">
          <Card className="dark:bg-slate-950 dark:border-slate-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-slate-800 dark:text-slate-200">Published Scores</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search students..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="pl-9 dark:bg-slate-900 dark:border-slate-700" 
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={loadScoresForViewTab} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Showing {caScores.length} score(s) for {selectedClass} - {selectedSubject}
                {isLocked && (
                  <Badge className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                  <p className="text-slate-500 mt-2">Loading scores...</p>
                </div>
              ) : caScores.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No scores have been published yet for {selectedSubject} in {selectedClass}.</p>
                  <p className="text-sm text-slate-400 mt-1">Enter scores in the Score Entry tab and click Save.</p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('entry')}
                      disabled={isLocked}
                    >
                      Go to Score Entry
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={loadScoresForViewTab}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="min-w-[180px] text-slate-700 dark:text-slate-300">Student</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Admission No</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">CA1</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">CA2</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Exam</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Total</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Percentage</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Grade</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Entered By</TableHead>
                        <TableHead className="text-center text-slate-700 dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScores.map(score => {
                        const ca1 = score.ca1_score || 0
                        const ca2 = score.ca2_score || 0
                        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
                        const total = ca1 + ca2 + examTotal
                        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = getGrade(percentage)
                        const studentName = score.student?.full_name || getStudentName(score.student_id)
                        const admissionNumber = score.student?.admission_number || getStudentAdmission(score.student_id)
                        const isOwnScore = score.teacher_id === staffProfile?.id
                        
                        return (
                          <TableRow key={score.id} className="dark:border-slate-700">
                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                              {studentName}
                              {!isOwnScore && (
                                <Lock className="h-3 w-3 inline ml-1 text-red-500" />
                              )}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">{admissionNumber}</TableCell>
                            <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">{ca1 || '—'}</TableCell>
                            <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">{ca2 || '—'}</TableCell>
                            <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">{examTotal || '—'}</TableCell>
                            <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200">{total || '—'}</TableCell>
                            <TableCell className="text-center text-slate-700 dark:text-slate-300">{percentage > 0 ? `${percentage}%` : '—'}</TableCell>
                            <TableCell className="text-center">
                              {grade && <Badge className={getGradeColor(grade)}>{grade}</Badge>}
                            </TableCell>
                            <TableCell className="text-center">
                              {score.teacher_id && !isOwnScore ? (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {score.teacher_name || 'Other Teacher'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  You
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingScore(score)
                                    setShowEditDialog(true)
                                  }}
                                  className="dark:hover:bg-slate-800"
                                  disabled={!isOwnScore}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm('Delete this score?')) return
                                    const { error } = await supabase.from('ca_scores').delete().eq('id', score.id)
                                    if (error) {
                                      toast.error('Failed to delete score')
                                    } else {
                                      toast.success('Score deleted')
                                      await checkSubjectsStatus()
                                      await loadAllData()
                                      await loadScoresForViewTab()
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-600 dark:hover:bg-slate-800"
                                  disabled={!isOwnScore}
                                >
                                  <Trash2 className="h-4 w-4" />
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
    </div>
  )
}

export default CAScoresTab