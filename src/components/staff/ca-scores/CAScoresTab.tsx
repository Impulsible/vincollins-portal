// src/components/staff/ca-scores/CAScoresTab.tsx

'use client'

import { useState, useEffect } from 'react'
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
  Award, GraduationCap, BarChart3
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
  'Creative Arts', 'Physical Education', 'History', 'Security Education'
]

interface ScoreEntry {
  ca1: string
  ca2: string
  exam: string
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

export function CAScoresTab({ staffProfile, termInfo }: any) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('entry')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState(termInfo?.termCode || 'third')
  const [selectedYear, setSelectedYear] = useState(termInfo?.sessionYear || '2025/2026')
  const [selectedExamId, setSelectedExamId] = useState('')

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

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    gradedStudents: 0,
    classAverage: 0,
    highestScore: 0,
    passCount: 0,
    failCount: 0,
    passRate: 0
  })

  useEffect(() => {
    setMounted(true)
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      const isJSS = selectedClass.toUpperCase().startsWith('JSS')
      const list = isJSS ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS
      setSubjects(list)
      if (!list.includes(selectedSubject)) {
        setSelectedSubject(list[0])
      }
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedSubject && selectedTerm && selectedYear) {
      loadExams()
    }
  }, [selectedSubject, selectedTerm, selectedYear])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedYear) {
      loadStudents()
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear])

  const loadClasses = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('class')
      .eq('role', 'student')
      .not('class', 'is', null)

    const uniqueClasses = [...new Set((data || []).map(d => d.class).filter(Boolean))] as string[]
    setClasses(uniqueClasses.sort())
    if (uniqueClasses.length > 0 && !selectedClass) {
      setSelectedClass(uniqueClasses[0])
    }
  }

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
    if (data && data.length > 0) {
      setSelectedExamId(data[0].id)
    } else {
      setSelectedExamId('')
    }
  }

  const loadStudents = async () => {
    if (!selectedClass) return

    setLoading(true)
    
    try {
      // Get all students in the selected class
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, class, admission_number, vin_id')
        .eq('role', 'student')
        .eq('class', selectedClass)
        .order('display_name')

      if (profileError) throw profileError

      if (!profileData || profileData.length === 0) {
        setStudents([])
        setStats({
          totalStudents: 0,
          gradedStudents: 0,
          classAverage: 0,
          highestScore: 0,
          passCount: 0,
          failCount: 0,
          passRate: 0
        })
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
      
      // Initialize entries
      const entries: Record<string, ScoreEntry> = {}
      formatted.forEach(s => {
        entries[s.id] = { ca1: '', ca2: '', exam: '' }
      })
      setScoreEntries(entries)
      
      // Load scores for these students
      if (selectedExamId && selectedSubject) {
        await loadScoresForStudents(formatted.map(s => s.id))
      } else {
        // No exam selected yet, just show students with empty stats
        setStats({
          totalStudents: formatted.length,
          gradedStudents: 0,
          classAverage: 0,
          highestScore: 0,
          passCount: 0,
          failCount: 0,
          passRate: 0
        })
        setLoading(false)
      }
      
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
      setLoading(false)
    }
  }

  const loadScoresForStudents = async (studentIds: string[]) => {
    if (!selectedExamId || !selectedSubject || studentIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('ca_scores')
        .select('*')
        .in('student_id', studentIds)
        .eq('exam_id', selectedExamId)
        .eq('subject', selectedSubject)

      if (error) throw error
      
      setCAScores(data || [])
      
      // Update entries with existing scores
      const entries: Record<string, ScoreEntry> = { ...scoreEntries }
      
      let totalScoreSum = 0
      let gradedCount = 0
      let highestScore = 0
      let passCount = 0
      let failCount = 0
      
      ;(data || []).forEach((score: any) => {
        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
        const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
        const grade = getGrade(percentage)
        
        entries[score.student_id] = {
          ca1: score.ca1_score?.toString() || '',
          ca2: score.ca2_score?.toString() || '',
          exam: examTotal > 0 ? examTotal.toString() : ''
        }
        
        if (total > 0) {
          totalScoreSum += total
          gradedCount++
          if (total > highestScore) highestScore = total
          if (grade !== 'F9') passCount++
          else failCount++
        }
      })
      
      setScoreEntries(entries)
      setStats({
        totalStudents: studentIds.length,
        gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? Math.round(totalScoreSum / gradedCount) : 0,
        highestScore: highestScore,
        passCount: passCount,
        failCount: failCount,
        passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0
      })
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSubjectScore = (ca1: number, ca2: number, exam: number) => {
    const total = ca1 + ca2 + exam
    const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
    const grade = getGrade(percentage)
    const remark = getGradeRemark(grade)
    return { total_score: total, percentage, grade, remark }
  }

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

    // Also include saved scores that might not be in entries
    caScores.forEach(score => {
      const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
      const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
      
      if (total > 0) {
        // Check if this student is already counted in entries
        const entryTotal = (parseInt(scoreEntries[score.student_id]?.ca1) || 0) +
                          (parseInt(scoreEntries[score.student_id]?.ca2) || 0) +
                          (parseInt(scoreEntries[score.student_id]?.exam) || 0)
        
        if (entryTotal === 0) {
          totalScoreSum += total
          gradedCount++
          if (total > highestScore) highestScore = total
          const percentage = Math.round((total / 100) * 100)
          const grade = getGrade(percentage)
          if (grade !== 'F9') passCount++
          else failCount++
        }
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
    const maxValues = { ca1: 20, ca2: 20, exam: 60 }
    const numValue = Math.min(maxValues[field], Math.max(0, parseFloat(value) || 0))
    setScoreEntries(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue.toString() }
    }))
    
    // Update stats after score change
    setTimeout(() => updateStatsFromEntries(), 50)
  }

  const handleSave = async () => {
    if (!staffProfile?.id || !selectedExamId) {
      toast.error('Missing required information')
      return
    }

    setSaving(true)

    try {
      let savedCount = 0

      for (const student of students) {
        const entry = scoreEntries[student.id]
        if (!entry) continue

        const ca1Score = parseInt(entry.ca1) || 0
        const ca2Score = parseInt(entry.ca2) || 0
        const examScore = parseInt(entry.exam) || 0

        if (ca1Score === 0 && ca2Score === 0 && examScore === 0) continue

        const { total_score, percentage, grade, remark } = calculateSubjectScore(ca1Score, ca2Score, examScore)

        const scoreData = {
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
          exam_id: selectedExamId,
          teacher_id: staffProfile.id,
          teacher_name: staffProfile.full_name || staffProfile.display_name,
          class: selectedClass,
          status: 'approved',
          updated_at: new Date().toISOString()
        }

        const { data: existing } = await supabase
          .from('ca_scores')
          .select('id')
          .eq('student_id', student.id)
          .eq('exam_id', selectedExamId)
          .eq('subject', selectedSubject)
          .maybeSingle()

        if (existing) {
          const { error } = await supabase
            .from('ca_scores')
            .update(scoreData)
            .eq('id', existing.id)
          if (!error) savedCount++
        } else {
          const { error } = await supabase
            .from('ca_scores')
            .insert([scoreData])
          if (!error) savedCount++
        }
      }

      if (savedCount > 0) {
        toast.success(`✅ ${savedCount} score(s) saved and published`)
        
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('ca-scores-updated', {
            detail: {
              class: selectedClass,
              subject: selectedSubject,
              term: selectedTerm,
              year: selectedYear,
              teacher: staffProfile.full_name
            }
          })
          window.dispatchEvent(event)
        }
        
        // Reload scores to refresh the list
        if (students.length > 0) {
          await loadScoresForStudents(students.map(s => s.id))
        }
      } else {
        toast.warning('No scores to save')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoFetchSingle = async (studentId: string) => {
    if (!selectedExamId) return

    const { data } = await supabase
      .from('exam_attempts')
      .select('objective_score, theory_feedback')
      .eq('exam_id', selectedExamId)
      .eq('student_id', studentId)
      .single()

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
          exam: examTotal > 0 ? String(Math.round(examTotal)) : ''
        }
      }))

      toast.success('Exam score loaded')
      setTimeout(() => updateStatsFromEntries(), 50)
    }
  }

  const handleAutoFetchAll = async () => {
    if (!selectedExamId) return
    setAutoFetching(true)
    let count = 0

    for (const student of students) {
      const { data } = await supabase
        .from('exam_attempts')
        .select('objective_score, theory_feedback')
        .eq('exam_id', selectedExamId)
        .eq('student_id', student.id)
        .single()

      if (data) {
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
            exam: examTotal > 0 ? String(Math.round(examTotal)) : ''
          }
        }))

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

  const groupedStudents = students.reduce((acc: Record<string, Student[]>, student) => {
    const cls = student.class || 'Unknown'
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(student)
    return acc
  }, {})

  const classOrder = Object.keys(groupedStudents).sort()
  const filteredScores = caScores.filter(score => {
    const name = getStudentName(score.student_id)
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!mounted) {
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
          Scores are automatically published when saved
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assessment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-600">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                  {availableExams.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-slate-500">No exams available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-slate-600">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
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
              onClick={handleSave} 
              disabled={saving || students.length === 0 || !selectedExamId} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save & Publish
            </Button>
            
            <Button 
              onClick={handleAutoFetchAll} 
              disabled={autoFetching || students.length === 0 || !selectedExamId}
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", autoFetching && "animate-spin")} />
              Auto-Fetch Exam Scores
            </Button>
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
                
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Exam Score (max 60)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={(editingScore.exam_objective_score || 0) + (editingScore.exam_theory_score || 0)}
                    onChange={e => {
                      const value = parseInt(e.target.value) || 0
                      setEditingScore({
                        ...editingScore,
                        exam_objective_score: Math.round(value * 0.6),
                        exam_theory_score: Math.round(value * 0.4)
                      })
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-600 mb-1">Total Score</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0) + 
                   (editingScore.exam_objective_score || 0) + (editingScore.exam_theory_score || 0)} / 100
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
                const examObj = editingScore.exam_objective_score || 0
                const examTheory = editingScore.exam_theory_score || 0
                const total = ca1 + ca2 + examObj + examTheory
                const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                const grade = getGrade(percentage)
                const remark = getGradeRemark(grade)

                const { error } = await supabase
                  .from('ca_scores')
                  .update({
                    ca1_score: ca1,
                    ca2_score: ca2,
                    exam_objective_score: examObj,
                    exam_theory_score: examTheory,
                    total_score: total,
                    percentage: percentage,
                    grade: grade,
                    remark: remark,
                    status: 'approved'
                  })
                  .eq('id', editingScore.id)

                if (error) {
                  toast.error('Failed to update score')
                  return
                }

                toast.success('Score updated successfully')
                setShowEditDialog(false)
                if (students.length > 0) {
                  await loadScoresForStudents(students.map(s => s.id))
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Score Entry
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Scores
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedStudents[cls].map(student => {
                        const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '' }
                        const total = (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0)
                        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = total > 0 ? getGrade(percentage) : ''
                        const hasExamScore = entry.exam && parseInt(entry.exam) > 0
                        
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAutoFetchSingle(student.id)}
                                  className="h-7 text-xs"
                                  disabled={!selectedExamId}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Load
                                </Button>
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
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search students..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-9" 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {caScores.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No scores have been published yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Enter scores in the Score Entry tab and click Save & Publish.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Admission No</TableHead>
                        <TableHead className="text-center">CA1</TableHead>
                        <TableHead className="text-center">CA2</TableHead>
                        <TableHead className="text-center">Exam</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScores.map(score => {
                        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
                        const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
                        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = getGrade(percentage)
                        return (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{getStudentName(score.student_id)}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{getStudentAdmission(score.student_id)}</TableCell>
                            <TableCell className="text-center">{score.ca1_score || '—'}</TableCell>
                            <TableCell className="text-center">{score.ca2_score || '—'}</TableCell>
                            <TableCell className="text-center">{examTotal || '—'}</TableCell>
                            <TableCell className="text-center font-bold">{total || '—'}</TableCell>
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
                                    await supabase.from('ca_scores').delete().eq('id', score.id)
                                    toast.success('Score deleted')
                                    if (students.length > 0) {
                                      await loadScoresForStudents(students.map(s => s.id))
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