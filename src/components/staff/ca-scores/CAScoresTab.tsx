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
  Award, GraduationCap, BarChart3, SaveAll
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// Grading System
const GRADING_SCALE = [
  { grade: 'A1', min: 75, max: 100, label: 'Excellent', color: 'bg-emerald-100 text-emerald-700' },
  { grade: 'B2', min: 70, max: 74, label: 'Very Good', color: 'bg-blue-100 text-blue-700' },
  { grade: 'B3', min: 65, max: 69, label: 'Good', color: 'bg-blue-100 text-blue-700' },
  { grade: 'C4', min: 60, max: 64, label: 'Credit', color: 'bg-cyan-100 text-cyan-700' },
  { grade: 'C5', min: 55, max: 59, label: 'Credit', color: 'bg-cyan-100 text-cyan-700' },
  { grade: 'C6', min: 50, max: 54, label: 'Credit', color: 'bg-cyan-100 text-cyan-700' },
  { grade: 'D7', min: 45, max: 49, label: 'Pass', color: 'bg-amber-100 text-amber-700' },
  { grade: 'E8', min: 40, max: 44, label: 'Pass', color: 'bg-amber-100 text-amber-700' },
  { grade: 'F9', min: 0, max: 39, label: 'Fail', color: 'bg-red-100 text-red-700' },
]

const getGrade = (percentage: number): string => {
  const grade = GRADING_SCALE.find(g => percentage >= g.min && percentage <= g.max)
  return grade?.grade || 'F9'
}

const getGradeColor = (grade: string): string => {
  return GRADING_SCALE.find(g => g.grade === grade)?.color || 'bg-slate-100 text-slate-700'
}

const getGradeRemark = (grade: string): string => {
  return GRADING_SCALE.find(g => g.grade === grade)?.label || ''
}

const TERM_OPTIONS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const SESSION_OPTIONS = ['2023/2024', '2024/2025', '2025/2026', '2026/2027']

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
  'CCA', 'Music', 'Physical Education', 'History', 'Security Education'
]

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

// Storage keys for persistence
const STORAGE_KEYS = {
  SELECTED_CLASS: 'ca_scores_selected_class',
  SELECTED_SUBJECT: 'ca_scores_selected_subject',
  SELECTED_TERM: 'ca_scores_selected_term',
  SELECTED_YEAR: 'ca_scores_selected_year',
  SELECTED_EXAM: 'ca_scores_selected_exam',
  ACTIVE_TAB: 'ca_scores_active_tab',
  SKIP_EXAM: 'ca_scores_skip_exam',
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

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    gradedStudents: 0,
    classAverage: 0,
    highestScore: 0,
    passCount: 0,
    failCount: 0,
    passRate: 0
  })

  const isInitialMount = useRef(true)

  // Load saved selections from localStorage on mount
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

  // Mark initial mount as complete
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  }, [])

  // Save selections to localStorage
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

  const loadClasses = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('class')
      .eq('role', 'student')
      .not('class', 'is', null)

    const uniqueClasses = [...new Set((data || []).map(d => d.class).filter(Boolean))] as string[]
    setClasses(uniqueClasses.sort())
    
    if (uniqueClasses.length > 0 && !selectedClass && !isRestoring) {
      setSelectedClass(uniqueClasses[0])
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

  // Load exams (optional)
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

  // Load students and their scores
  const loadAllData = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) return
    
    setLoading(true)
    
    try {
      // Load students
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, class, admission_number, vin_id')
        .eq('role', 'student')
        .eq('class', selectedClass)
        .order('display_name')

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
      
      // Load scores based on exam mode
      let scoresQuery = supabase
        .from('ca_scores')
        .select('*')
        .in('student_id', formatted.map(s => s.id))
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('class', selectedClass)

      if (skipExam || !selectedExamId) {
        scoresQuery = scoresQuery.is('exam_id', null)
      } else {
        scoresQuery = scoresQuery.eq('exam_id', selectedExamId)
      }

      const { data: scoresData, error: scoresError } = await scoresQuery

      if (scoresError) throw scoresError
      
      setCAScores(scoresData || [])
      
      // Initialize entries
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
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, selectedExamId, skipExam])

  // Load scores for View Tab
  const loadScoresForViewTab = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) return;
    
    setLoading(true);
    try {
      const { data: scoresData, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('class', selectedClass)
        .order('created_at', { ascending: false });

      if (scoresError) throw scoresError;
      
      if (scoresData && scoresData.length > 0) {
        const studentIds = [...new Set(scoresData.map(s => s.student_id))];
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, display_name, admission_number')
          .in('id', studentIds);
        
        const studentMap = new Map();
        studentsData?.forEach(s => {
          studentMap.set(s.id, {
            full_name: s.display_name || s.full_name,
            admission_number: s.admission_number
          });
        });
        
        const enrichedScores = scoresData.map(score => ({
          ...score,
          student: studentMap.get(score.student_id)
        }));
        
        setCAScores(enrichedScores);
      } else {
        setCAScores([]);
      }
    } catch (error) {
      console.error('Error loading scores for view:', error);
      toast.error('Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear]);

  // Main data loading effect
  useEffect(() => {
    if (isRestoring) return
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedYear) return
    
    loadAllData()
  }, [loadAllData, isRestoring])

  // Load scores when View Tab is active
  useEffect(() => {
    if (activeTab === 'view') {
      loadScoresForViewTab()
    }
  }, [activeTab, loadScoresForViewTab])

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
    if (field === 'is_saved') return;
    
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

  // ✅ FIXED: Save single score
  const handleSaveSingle = async (studentId: string) => {
    if (!staffProfile?.id) {
      toast.error('Missing teacher information')
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

      // Prepare the data object - only include exam_id if we're in exam mode
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
        class: selectedClass,
        status: 'approved',
        submitted_at: now,
        updated_at: now
      }

      // Only add exam_id if we have one and not skipping exam
      if (selectedExamId && !skipExam) {
        dataToSave.exam_id = selectedExamId
      }

      // Check if record exists
      let query = supabase
        .from('ca_scores')
        .select('id')
        .eq('student_id', studentId)
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('class', selectedClass)

      if (selectedExamId && !skipExam) {
        query = query.eq('exam_id', selectedExamId)
      } else {
        query = query.is('exam_id', null)
      }

      const { data: existing } = await query.maybeSingle()

      let result
      if (existing) {
        // Update existing
        const updateData = { ...dataToSave }
        if (!selectedExamId || skipExam) {
          delete updateData.exam_id
        }
        result = await supabase
          .from('ca_scores')
          .update(updateData)
          .eq('id', existing.id)
      } else {
        // Insert new
        result = await supabase
          .from('ca_scores')
          .insert([dataToSave])
      }

      if (result.error) throw result.error

      setSavedStatus(prev => ({ ...prev, [studentId]: true }))
      setScoreEntries(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], is_saved: true }
      }))
      
      toast.success(`Scores saved for ${getStudentName(studentId)}`)
      
      // Refresh data
      await loadAllData()
      if (activeTab === 'view') {
        await loadScoresForViewTab()
      }
      
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ✅ FIXED: Save all scores
  const handleSaveAll = async () => {
    if (!staffProfile?.id) {
      toast.error('Missing teacher information')
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

        // Prepare the data object
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
          class: selectedClass,
          status: 'approved',
          submitted_at: now,
          updated_at: now
        }

        if (selectedExamId && !skipExam) {
          dataToSave.exam_id = selectedExamId
        }

        // Check if exists
        let query = supabase
          .from('ca_scores')
          .select('id')
          .eq('student_id', student.id)
          .eq('subject', selectedSubject)
          .eq('term', selectedTerm)
          .eq('academic_year', selectedYear)
          .eq('class', selectedClass)

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
          errorCount++
          console.error(`Error saving ${student.full_name}:`, result.error)
        } else {
          savedCount++
        }
      }

      if (savedCount > 0) {
        toast.success(`✅ ${savedCount} score(s) saved successfully`)
        if (errorCount > 0) {
          toast.warning(`⚠️ ${errorCount} student(s) had errors`)
        }
        
        // Update saved status
        const newSavedStatus: Record<string, boolean> = { ...savedStatus }
        students.forEach(student => {
          const entry = scoreEntries[student.id]
          if (entry && (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0) > 0) {
            newSavedStatus[student.id] = true
          }
        })
        setSavedStatus(newSavedStatus)
        
        // Refresh data
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
      console.error('Save error:', error)
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

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
      .single()

    if (error) {
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
        .single()

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

      {/* Grading Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800">Grading Scale:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GRADING_SCALE.map((scale) => (
              <Badge key={scale.grade} className={cn(scale.color, "font-medium")}>
                {scale.grade}: {scale.min}-{scale.max === 100 ? '100' : scale.max}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1">
          <Bell className="h-3 w-3" />
          Scores are automatically saved and persist across sessions • You can edit or delete anytime
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Assessment Configuration</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-600">Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600">Subject</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600">Examination</Label>
              <Select value={selectedExamId} onValueChange={handleExamChange} disabled={skipExam}>
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
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600">Term</Label>
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
              <Label className="text-xs font-medium text-slate-600">Session</Label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={handleSaveAll} 
              disabled={saving || students.length === 0} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SaveAll className="h-4 w-4 mr-2" />}
              Save All Scores
            </Button>
            
            {!skipExam && selectedExamId && (
              <Button 
                onClick={handleAutoFetchAll} 
                disabled={autoFetching || students.length === 0}
                variant="outline"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", autoFetching && "animate-spin")} />
                Auto-Fetch All Exam Scores
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assessment Score</DialogTitle>
            <DialogDescription>
              Update scores for {getStudentName(editingScore?.student_id)}
            </DialogDescription>
          </DialogHeader>

          {editingScore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">CA1 Score (max 20)</Label>
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
                  <Label className="text-sm font-medium">CA2 Score (max 20)</Label>
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

              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-600 mb-1">Total CA Score</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0)} / 40
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Score Entry
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Scores ({caScores.length})
          </TabsTrigger>
        </TabsList>

        {/* Score Entry Tab */}
        <TabsContent value="entry" className="mt-6">
          {loading ? (
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
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                    {cls}
                    <Badge variant="secondary" className="ml-2">
                      {groupedStudents[cls].length} students
                    </Badge>
                  </h3>
                </div>
                
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold min-w-[180px]">Student</TableHead>
                        <TableHead className="text-center w-24 font-semibold">CA1 /20</TableHead>
                        <TableHead className="text-center w-24 font-semibold">CA2 /20</TableHead>
                        <TableHead className="text-center w-28 font-semibold">Exam /60</TableHead>
                        <TableHead className="text-center w-20 font-semibold">Total</TableHead>
                        <TableHead className="text-center w-24 font-semibold">Grade</TableHead>
                        <TableHead className="text-center w-24 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedStudents[cls].map(student => {
                        const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '' }
                        const total = (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0)
                        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = total > 0 ? getGrade(percentage) : ''
                        const hasExamScore = entry.exam && parseInt(entry.exam) > 0
                        const isSaved = savedStatus[student.id]
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
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
                                className="w-20 text-center mx-auto" 
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={entry.ca2}
                                onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                                className="w-20 text-center mx-auto" 
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {hasExamScore ? (
                                <span className="font-medium text-emerald-600">{parseInt(entry.exam)}/60</span>
                              ) : (
                                !skipExam && selectedExamId ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAutoFetchSingle(student.id)}
                                    className="h-7 text-xs"
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Load
                                  </Button>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {total > 0 ? `${total}/100` : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {grade && (
                                <Badge className={getGradeColor(grade)}>
                                  {grade} - {getGradeRemark(grade)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveSingle(student.id)}
                                disabled={saving}
                                className="h-8 px-3"
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isSaved ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Save className="h-4 w-4 text-slate-500" />
                                )}
                                <span className="ml-1 text-xs">
                                  {isSaved ? 'Saved' : 'Save'}
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

        {/* View Scores Tab */}
        <TabsContent value="view" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle>Published Scores</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search students..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="pl-9" 
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={loadScoresForViewTab} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Showing {caScores.length} score(s) for {selectedClass} - {selectedSubject} - {selectedTerm} {selectedYear}
              </p>
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
                  <p className="text-slate-500">No scores have been published yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Enter scores in the Score Entry tab and click Save.</p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('entry')}
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
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Admission No</TableHead>
                        <TableHead className="text-center">CA1 /20</TableHead>
                        <TableHead className="text-center">CA2 /20</TableHead>
                        <TableHead className="text-center">Total /40</TableHead>
                        <TableHead className="text-center">Percentage</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScores.map(score => {
                        const total = (score.ca1_score || 0) + (score.ca2_score || 0)
                        const percentage = total > 0 ? Math.round((total / 40) * 100) : 0
                        const grade = getGrade(percentage)
                        const studentName = score.student?.full_name || getStudentName(score.student_id)
                        const admissionNumber = score.student?.admission_number || getStudentAdmission(score.student_id)
                        
                        return (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{studentName}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{admissionNumber}</TableCell>
                            <TableCell className="text-center font-medium">{score.ca1_score || '—'}</TableCell>
                            <TableCell className="text-center font-medium">{score.ca2_score || '—'}</TableCell>
                            <TableCell className="text-center font-bold">{total}/40</TableCell>
                            <TableCell className="text-center">{percentage}%</TableCell>
                            <TableCell className="text-center">
                              {grade && <Badge className={getGradeColor(grade)}>{grade}</Badge>}
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
                                      await loadAllData()
                                      await loadScoresForViewTab()
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-600"
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