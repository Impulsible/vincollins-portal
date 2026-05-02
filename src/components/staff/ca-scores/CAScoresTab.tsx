// src/components/staff/ca-scores/index.tsx - FINAL WORKING VERSION
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
import { Save, Search, Edit, Trash2, Users, Loader2, RefreshCw, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// ─── GRADING SYSTEM ───────────────────────────────────
const getGrade = (pct: number): string => {
  if (pct >= 75) return 'A1'
  if (pct >= 70) return 'B2'
  if (pct >= 65) return 'B3'
  if (pct >= 60) return 'C4'
  if (pct >= 55) return 'C5'
  if (pct >= 50) return 'C6'
  if (pct >= 45) return 'D7'
  if (pct >= 40) return 'E8'
  return 'F9'
}

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A1': 'bg-emerald-100 text-emerald-700',
    'B2': 'bg-blue-100 text-blue-700',
    'B3': 'bg-sky-100 text-sky-700',
    'C4': 'bg-teal-100 text-teal-700',
    'C5': 'bg-amber-100 text-amber-700',
    'C6': 'bg-orange-100 text-orange-700',
    'D7': 'bg-yellow-100 text-yellow-700',
    'E8': 'bg-red-100 text-red-400',
    'F9': 'bg-red-200 text-red-600',
  }
  return colors[grade] || 'bg-slate-100 text-slate-700'
}

const getRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent',
    'B2': 'Very Good',
    'B3': 'Good',
    'C4': 'Credit',
    'C5': 'Credit',
    'C6': 'Credit',
    'D7': 'Pass',
    'E8': 'Pass',
    'F9': 'Fail'
  }
  return remarks[grade] || ''
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
  'CRS', 'Yoruba', 'French', 'Computer Science', 'Commerce', 'Financial Accounting'
]

const JUNIOR_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies',
  'Home Economics', 'CRS', 'Yoruba', 'French', 'Computer Science',
  'Creative Arts', 'Physical Education', 'History', 'Security Education'
]

// ─── MAIN COMPONENT ───────────────────────────────────
export function CAScoresTab({ staffProfile, termInfo }: any) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('entry')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState(termInfo?.termCode || 'third')
  const [selectedYear, setSelectedYear] = useState(termInfo?.sessionYear || '2025/2026')
  const [selectedExamId, setSelectedExamId] = useState('')

  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [availableExams, setAvailableExams] = useState<any[]>([])
  const [caScores, setCAScores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [autoFetching, setAutoFetching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [scoreEntries, setScoreEntries] = useState<Record<string, any>>({})
  const [editingScore, setEditingScore] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [stats, setStats] = useState({
    totalStudents: 0,
    gradedStudents: 0,
    classAverage: 0,
    highestScore: 0,
    passCount: 0,
    failCount: 0
  })

  // ─── INITIALIZATION ─────────────────────────────────
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
    if (selectedExamId) {
      loadStudents()
      loadExistingScores()
    }
  }, [selectedExamId])

  // ─── DATA LOADING ───────────────────────────────────
  const loadClasses = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('class')
      .eq('role', 'student')
      .not('class', 'is', null)

    const uniqueClasses = [...new Set((data || []).map(d => d.class).filter(Boolean))] as string[]
    setClasses(uniqueClasses.sort())

    if (uniqueClasses.length > 0) {
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
      setStudents([])
    }
  }

  const loadStudents = async () => {
    if (!selectedExamId) return

    const { data: attemptData } = await supabase
      .from('exam_attempts')
      .select('student_id')
      .eq('exam_id', selectedExamId)

    const studentIds = [...new Set((attemptData || []).map(a => a.student_id))]

    if (studentIds.length === 0) {
      setStudents([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, class')
      .in('id', studentIds)
      .order('full_name')

    const formatted = (data || []).map((s: any) => ({
      id: s.id,
      full_name: s.full_name || 'Unknown',
      class: s.class || '—'
    }))

    setStudents(formatted)

    const entries: Record<string, any> = {}
    formatted.forEach(s => {
      entries[s.id] = { ca1: '', ca2: '', exam: '', remark: '' }
    })
    setScoreEntries({ ...entries })
  }

  const loadExistingScores = async () => {
    if (!staffProfile?.id || !selectedExamId) return

    setLoading(true)

    const { data } = await supabase
      .from('ca_scores')
      .select('*')
      .eq('exam_id', selectedExamId)

    setCAScores(data || [])

    const entries: Record<string, any> = {}
    students.forEach(s => {
      entries[s.id] = { ca1: '', ca2: '', exam: '', remark: '' }
    })

    let totalScore = 0
    let gradedCount = 0
    let highestScore = 0
    let passCount = 0
    let failCount = 0

    ;(data || []).forEach((score: any) => {
      const objectiveScore = score.exam_objective_score || 0
      const theoryScore = score.exam_theory_score || 0
      const examTotal = objectiveScore + theoryScore

      entries[score.student_id] = {
        ca1: score.ca1_score?.toString() || '',
        ca2: score.ca2_score?.toString() || '',
        exam: examTotal > 0 ? examTotal.toString() : '',
        remark: score.remark || ''
      }

      if (score.total_score) {
        totalScore += score.total_score
        gradedCount++
        if (score.total_score > highestScore) highestScore = score.total_score
        if (score.grade && score.grade !== 'F9') {
          passCount++
        } else {
          failCount++
        }
      }
    })

    setScoreEntries(prev => ({ ...entries }))

    setStats({
      totalStudents: students.length,
      gradedStudents: gradedCount,
      classAverage: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
      highestScore: highestScore,
      passCount: passCount,
      failCount: failCount
    })

    setLoading(false)
  }

  // ─── AUTO-FETCH EXAM SCORES ─────────────────────────
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
            exam: examTotal > 0 ? String(examTotal) : ''
          }
        }))

        count++
      }
    }

    setAutoFetching(false)
    toast.success(`Loaded ${count} exam scores`)
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
          exam: examTotal > 0 ? String(examTotal) : ''
        }
      }))

      toast.success('Exam score loaded')
    }
  }

  // ─── SUBMIT FOR REVIEW ──────────────────────────────
  const handleSubmitForReview = async () => {
    if (!selectedExamId) { toast.error('Select an exam first'); return }
    
    setSubmitting(true)
    try {
      // Update all ca_scores for this exam to status 'submitted'
      const { error } = await supabase
        .from('ca_scores')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('exam_id', selectedExamId)
        .eq('teacher_id', staffProfile.id)
      
      if (error) throw error
      
      toast.success('Scores submitted for admin review!')
      await loadExistingScores()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit scores')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── SCORE HANDLING ─────────────────────────────────
  const handleScoreChange = (studentId: string, field: string, value: string) => {
    const maxValues: Record<string, number> = {
      ca1: 20,
      ca2: 20,
      exam: 60
    }

    const numValue = Math.min(maxValues[field] || 100, Math.max(0, parseFloat(value) || 0))

    setScoreEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numValue.toString()
      }
    }))
  }

  const handleSave = async () => {
    if (!staffProfile?.id) {
      toast.error('Profile not found')
      return
    }

    if (!selectedExamId) {
      toast.error('Select an exam first')
      return
    }

    setSaving(true)

    try {
      const scoresToSave = []

      for (const student of students) {
        const entry = scoreEntries[student.id]
        if (!entry) continue

        const ca1Score = Math.round(parseFloat(entry.ca1) || 0)
        const ca2Score = Math.round(parseFloat(entry.ca2) || 0)
        const examScore = Math.round(parseFloat(entry.exam) || 0)

        if (ca1Score === 0 && ca2Score === 0 && examScore === 0) continue

        // Only send raw scores - triggers handle grade, remark, total_score
        scoresToSave.push({
          student_id: student.id,
          subject: selectedSubject,
          term: selectedTerm,
          academic_year: selectedYear,
          ca1_score: ca1Score,
          ca2_score: ca2Score,
          exam_objective_score: Math.round(examScore * 0.33),
          exam_theory_score: Math.round(examScore * 0.67),
          exam_id: selectedExamId,
          teacher_id: staffProfile.id
        })
      }

      if (scoresToSave.length === 0) {
        toast.warning('No scores to save')
        setSaving(false)
        return
      }

      for (const score of scoresToSave) {
        const { error: upsertError } = await supabase
          .from('ca_scores')
          .upsert(score)

        if (upsertError) {
          console.error('Upsert error:', upsertError)
          toast.error(`Save failed: ${upsertError.message}`)
          throw upsertError
        }
      }

      toast.success(`Saved ${scoresToSave.length} student scores`)
      await loadExistingScores()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  // ─── HELPERS ─────────────────────────────────────────
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.full_name || 'Unknown'
  }

  const groupedStudents = students.reduce((acc: Record<string, any[]>, student) => {
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

  // ─── LOADING ─────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // ─── RENDER ─────────────────────────────────────────
  return (
    <div className="space-y-5 w-full">

      {/* Scoring Formula */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5">
        <span className="font-medium text-slate-600">Scoring:</span>
        <span>CA1 (20) + CA2 (20) + Exam (60) = <span className="font-semibold text-slate-700">Total (100)</span></span>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={availableExams.length === 0 ? 'No exams found' : 'Select exam'} />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-slate-400 text-center">No published exams for this subject</div>
                  ) : (
                    availableExams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title?.substring(0, 40)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Session</Label>
              <Input
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="h-9 text-sm"
                placeholder="2025/2026"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save All
              </Button>
              <Button
                onClick={handleSubmitForReview}
                disabled={submitting || students.length === 0}
                className="bg-blue-600 hover:bg-blue-700 h-9 text-sm"
              >
                <Send className="h-4 w-4 mr-1.5" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleAutoFetchAll}
                disabled={autoFetching || students.length === 0}
                className="h-9 w-9 shrink-0"
                title="Load exam scores for all students"
              >
                <RefreshCw className={cn("h-4 w-4", autoFetching && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats.gradedStudents > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-slate-400">Students</p>
              <p className="text-lg font-bold text-slate-700">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-slate-400">Graded</p>
              <p className="text-lg font-bold text-emerald-600">{stats.gradedStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-slate-400">Average</p>
              <p className="text-lg font-bold text-blue-600">{stats.classAverage}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-slate-400">Highest</p>
              <p className="text-lg font-bold text-purple-600">{stats.highestScore}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-slate-400">Passed</p>
              <p className="text-lg font-bold text-green-600">{stats.passCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-slate-400">Failed</p>
              <p className="text-lg font-bold text-red-600">{stats.failCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start gap-0">
          <TabsTrigger
            value="entry"
            className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-4 py-2.5 text-sm"
          >
            Score Entry
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-4 py-2.5 text-sm"
          >
            View Scores
          </TabsTrigger>
        </TabsList>

        {/* Score Entry Tab */}
        <TabsContent value="entry" className="mt-4">
          {students.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {!selectedExamId ? 'Select an exam to load students' : availableExams.length === 0 ? 'No published exams for this subject' : 'No students found for this exam'}
                </p>
              </CardContent>
            </Card>
          ) : (
            classOrder.map(cls => (
              <div key={cls} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-slate-200 text-slate-700 font-semibold px-3 py-1 text-xs">
                    {cls}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {groupedStudents[cls].length} students
                  </span>
                </div>

                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold">Student</TableHead>
                            <TableHead className="text-center text-xs w-[80px]">CA1 /20</TableHead>
                            <TableHead className="text-center text-xs w-[80px]">CA2 /20</TableHead>
                            <TableHead className="text-center text-xs w-[90px]">Exam /60</TableHead>
                            <TableHead className="text-center text-xs w-[80px]">Total /100</TableHead>
                            <TableHead className="text-center text-xs w-[60px]">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedStudents[cls].map(student => {
                            const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '' }
                            const ca1Score = parseFloat(entry.ca1) || 0
                            const ca2Score = parseFloat(entry.ca2) || 0
                            const examScore = parseFloat(entry.exam) || 0
                            const totalScore = ca1Score + ca2Score + examScore
                            const percentage = totalScore > 0 ? Math.round((totalScore / 100) * 100) : 0
                            const grade = totalScore > 0 ? getGrade(percentage) : ''
                            const hasExamScore = entry.exam && parseFloat(entry.exam) > 0

                            return (
                              <TableRow key={student.id} className="hover:bg-slate-50/50">
                                <TableCell className="text-sm font-medium truncate max-w-[160px]">
                                  {student.full_name}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={entry.ca1}
                                    onChange={v => handleScoreChange(student.id, 'ca1', v.target.value)}
                                    className="h-8 w-16 mx-auto text-center text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={entry.ca2}
                                    onChange={v => handleScoreChange(student.id, 'ca2', v.target.value)}
                                    className="h-8 w-16 mx-auto text-center text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  {hasExamScore ? (
                                    <span className="text-sm font-medium text-slate-700">
                                      {examScore}/60
                                    </span>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAutoFetchSingle(student.id)}
                                      className="h-7 text-[11px] text-blue-600 hover:text-blue-700"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Load Score
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-sm">
                                  {totalScore > 0 ? totalScore : '—'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {grade && (
                                    <Badge className={cn("text-xs font-semibold", getGradeColor(grade))}>
                                      {grade}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </TabsContent>

        {/* View Scores Tab */}
        <TabsContent value="view" className="mt-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b px-5 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">Saved CA Scores</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold">Student</TableHead>
                      <TableHead className="text-center text-xs">CA1</TableHead>
                      <TableHead className="text-center text-xs">CA2</TableHead>
                      <TableHead className="text-center text-xs">Exam</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                      <TableHead className="text-center text-xs">Grade</TableHead>
                      <TableHead className="text-xs">Remark</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                          No scores saved yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScores.map(score => {
                        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
                        return (
                          <TableRow key={score.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-sm font-medium">
                              {getStudentName(score.student_id)}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {score.ca1_score || '—'}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {score.ca2_score || '—'}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {examTotal > 0 ? `${examTotal}/60` : '—'}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-sm">
                              {score.total_score?.toFixed(1) || '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {score.grade && (
                                <Badge className={cn("text-xs font-semibold", getGradeColor(score.grade))}>
                                  {score.grade}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-[120px] truncate">
                              {score.remark || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingScore(score)
                                    setShowEditDialog(true)
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm('Delete this score?')) return
                                    await supabase.from('ca_scores').delete().eq('id', score.id)
                                    toast.success('Score deleted')
                                    await loadExistingScores()
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit CA Score</DialogTitle>
          </DialogHeader>

          {editingScore && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">CA1 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca1_score || 0}
                    onChange={e => setEditingScore({
                      ...editingScore,
                      ca1_score: parseInt(e.target.value) || 0
                    })}
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">CA2 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca2_score || 0}
                    onChange={e => setEditingScore({
                      ...editingScore,
                      ca2_score: parseInt(e.target.value) || 0
                    })}
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Exam Score (max 60)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={(editingScore.exam_objective_score || 0) + (editingScore.exam_theory_score || 0)}
                    onChange={e => {
                      const value = parseInt(e.target.value) || 0
                      setEditingScore({
                        ...editingScore,
                        exam_objective_score: Math.round(value * 0.33),
                        exam_theory_score: Math.round(value * 0.67)
                      })
                    }}
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-sm text-slate-500">Total Score: </span>
                <span className="text-lg font-bold text-emerald-700">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0) + (editingScore.exam_objective_score || 0) + (editingScore.exam_theory_score || 0)}/100
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={async () => {
                if (!editingScore) return

                const { error } = await supabase
                  .from('ca_scores')
                  .update({
                    ca1_score: editingScore.ca1_score,
                    ca2_score: editingScore.ca2_score,
                    exam_objective_score: editingScore.exam_objective_score,
                    exam_theory_score: editingScore.exam_theory_score
                  })
                  .eq('id', editingScore.id)

                if (error) {
                  toast.error('Failed to update score')
                  return
                }

                toast.success('Score updated successfully')
                setShowEditDialog(false)
                await loadExistingScores()
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