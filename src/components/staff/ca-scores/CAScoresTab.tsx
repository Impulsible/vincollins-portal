// src/components/staff/ca-scores/CAScoresTab.tsx - NO SUBMIT BUTTON, DIRECT SAVE

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
  CheckCircle2, AlertCircle, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// WAEC Grading
const getWAECGrade = (percentage: number): string => {
  if (percentage >= 75) return 'A1'
  if (percentage >= 70) return 'B2'
  if (percentage >= 65) return 'B3'
  if (percentage >= 60) return 'C4'
  if (percentage >= 55) return 'C5'
  if (percentage >= 50) return 'C6'
  if (percentage >= 45) return 'D7'
  if (percentage >= 40) return 'E8'
  return 'F9'
}

const getWAECGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-100 text-emerald-700'
    case 'B2': case 'B3': return 'bg-blue-100 text-blue-700'
    case 'C4': case 'C5': case 'C6': return 'bg-cyan-100 text-cyan-700'
    case 'D7': case 'E8': return 'bg-amber-100 text-amber-700'
    case 'F9': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail'
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

  const [scoreEntries, setScoreEntries] = useState<Record<string, ScoreEntry>>({})
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
      setStudents([])
    }
  }

  const loadStudents = async () => {
    if (!selectedExamId) return

    const { data: attemptData } = await supabase
      .from('exam_attempts')
      .select('student_id, student_name, student_email, student_class')
      .eq('exam_id', selectedExamId)

    if (!attemptData || attemptData.length === 0) {
      setStudents([])
      return
    }

    const studentIds = [...new Set(attemptData.map(a => a.student_id))]
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, class, admission_number')
      .in('id', studentIds)

    const profileMap = new Map()
    profileData?.forEach(p => profileMap.set(p.id, p))

    const formatted = attemptData.map(attempt => {
      const profile = profileMap.get(attempt.student_id)
      return {
        id: attempt.student_id,
        full_name: profile?.display_name || profile?.full_name || attempt.student_name || 'Unknown',
        class: profile?.class || attempt.student_class || '—',
        admission_number: profile?.admission_number || '—',
        email: attempt.student_email
      }
    })

    setStudents(formatted)
    const entries: Record<string, ScoreEntry> = {}
    formatted.forEach(s => {
      entries[s.id] = { ca1: '', ca2: '', exam: '' }
    })
    setScoreEntries(entries)
  }

  const calculateSubjectScore = (ca1: number, ca2: number, exam: number) => {
    const total = ca1 + ca2 + exam
    const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
    const grade = getWAECGrade(percentage)
    const remark = getGradeRemark(grade)
    return { total_score: total, percentage, grade, remark }
  }

  const loadExistingScores = async () => {
    if (!selectedExamId) return
    setLoading(true)

    try {
      const { data } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('exam_id', selectedExamId)
        .eq('subject', selectedSubject)

      setCAScores(data || [])

      const entries: Record<string, ScoreEntry> = {}
      students.forEach(s => {
        entries[s.id] = { ca1: '', ca2: '', exam: '' }
      })

      let totalScore = 0, gradedCount = 0, highestScore = 0, passCount = 0, failCount = 0

      ;(data || []).forEach((score: any) => {
        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
        const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
        const grade = getWAECGrade(percentage)

        entries[score.student_id] = {
          ca1: score.ca1_score?.toString() || '',
          ca2: score.ca2_score?.toString() || '',
          exam: examTotal > 0 ? examTotal.toString() : ''
        }

        if (total > 0) {
          totalScore += total
          gradedCount++
          if (total > highestScore) highestScore = total
          if (grade !== 'F9') passCount++
          else failCount++
        }
      })

      setScoreEntries(prev => ({ ...prev, ...entries }))
      setStats({
        totalStudents: students.length,
        gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
        highestScore: highestScore,
        passCount: passCount,
        failCount: failCount
      })
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (studentId: string, field: keyof ScoreEntry, value: string) => {
    const maxValues = { ca1: 20, ca2: 20, exam: 60 }
    const numValue = Math.min(maxValues[field], Math.max(0, parseFloat(value) || 0))
    setScoreEntries(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue.toString() }
    }))
  }

  // ✅ SAVE SCORES - Directly saves as 'approved' so they appear in broadsheet immediately
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
          status: 'approved', // ✅ Directly approved - appears in broadsheet
          updated_at: new Date().toISOString()
        }

        // Check if exists
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
        toast.success(`✅ ${savedCount} scores saved and published to broadsheet!`)
        
        // Dispatch event to notify broadsheet
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
        
        await loadExistingScores()
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
    toast.success(`Loaded ${count} exam scores`)
  }

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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-green-50 rounded-lg p-3 text-sm border border-green-200">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="font-medium text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Scores are published directly to broadsheet when saved
          </span>
          <span>Students: {students.length} | Graded: {stats.gradedStudents} | Class Avg: {stats.classAverage}%</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Grading:</span> A1:75-100 | B2:70-74 | B3:65-69 | C4:60-64 | C5:55-59 | C6:50-54 | D7:45-49 | E8:40-44 | F9:0-39
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {availableExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Session</Label>
              <Input value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button onClick={handleSave} disabled={saving || students.length === 0} className="bg-emerald-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save & Publish to Broadsheet
            </Button>
            <Button 
              onClick={handleAutoFetchAll} 
              disabled={autoFetching || students.length === 0}
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", autoFetching && "animate-spin")} />
              Auto-Fetch All
            </Button>
          </div>
          
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <Bell className="h-3 w-3" />
            Scores are automatically published to the broadsheet when saved.
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit CA Score</DialogTitle>
            <DialogDescription>
              Update scores for {getStudentName(editingScore?.student_id)}
            </DialogDescription>
          </DialogHeader>

          {editingScore && (
            <div className="space-y-3">
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
                    className="h-9"
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
                    className="h-9"
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
                        exam_objective_score: Math.round(value * 0.6),
                        exam_theory_score: Math.round(value * 0.4)
                      })
                    }}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-sm text-slate-500">Total Score: </span>
                <span className="text-lg font-bold text-emerald-700">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0) + 
                   (editingScore.exam_objective_score || 0) + (editingScore.exam_theory_score || 0)}/100
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600"
              onClick={async () => {
                if (!editingScore) return

                const ca1 = editingScore.ca1_score || 0
                const ca2 = editingScore.ca2_score || 0
                const examObj = editingScore.exam_objective_score || 0
                const examTheory = editingScore.exam_theory_score || 0
                const total = ca1 + ca2 + examObj + examTheory
                const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                const grade = getWAECGrade(percentage)
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
                await loadExistingScores()
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Score Entry</TabsTrigger>
          <TabsTrigger value="view">View Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-4">
          {students.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p>No students found. Select an exam first.</p>
              </CardContent>
            </Card>
          ) : (
            classOrder.map(cls => (
              <div key={cls} className="mb-6">
                <h3 className="font-semibold mb-2">{cls} ({groupedStudents[cls].length} students)</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Student</th>
                        <th className="border p-2 text-center w-20">CA1 /20</th>
                        <th className="border p-2 text-center w-20">CA2 /20</th>
                        <th className="border p-2 text-center w-20">Exam /60</th>
                        <th className="border p-2 text-center w-20">Total</th>
                        <th className="border p-2 text-center w-24">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedStudents[cls].map(student => {
                        const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '' }
                        const total = (parseInt(entry.ca1) || 0) + (parseInt(entry.ca2) || 0) + (parseInt(entry.exam) || 0)
                        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = total > 0 ? getWAECGrade(percentage) : ''
                        const hasExamScore = entry.exam && parseInt(entry.exam) > 0
                        
                        return (
                          <tr key={student.id}>
                            <td className="border p-2">{student.full_name}</td>
                            <td className="border p-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={entry.ca1}
                                onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                                className="w-16 text-center h-8 mx-auto" 
                              />
                            </td>
                            <td className="border p-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={entry.ca2}
                                onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                                className="w-16 text-center h-8 mx-auto" 
                              />
                            </td>
                            <td className="border p-2 text-center">
                              {hasExamScore ? (
                                <span className="font-medium">{parseInt(entry.exam)}/60</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAutoFetchSingle(student.id)}
                                  className="h-7 text-xs"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Load
                                </Button>
                              )}
                            </td>
                            <td className="border p-2 text-center font-bold">{total || '—'}</td>
                            <td className="border p-2 text-center">
                              {grade && <Badge className={getWAECGradeColor(grade)}>{grade}</Badge>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="view" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle>Published Scores (Visible in Broadsheet)</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search students..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-8" 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredScores.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No scores saved yet. Enter and save scores to publish to broadsheet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2">Student</th>
                        <th className="border p-2 text-center">CA1</th>
                        <th className="border p-2 text-center">CA2</th>
                        <th className="border p-2 text-center">Exam</th>
                        <th className="border p-2 text-center">Total</th>
                        <th className="border p-2 text-center">Grade</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScores.map(score => {
                        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
                        const total = (score.ca1_score || 0) + (score.ca2_score || 0) + examTotal
                        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
                        const grade = getWAECGrade(percentage)
                        return (
                          <tr key={score.id}>
                            <td className="border p-2">{getStudentName(score.student_id)}</td>
                            <td className="border p-2 text-center">{score.ca1_score || '—'}</td>
                            <td className="border p-2 text-center">{score.ca2_score || '—'}</td>
                            <td className="border p-2 text-center">{examTotal || '—'}</td>
                            <td className="border p-2 text-center font-bold">{total || '—'}</td>
                            <td className="border p-2 text-center">
                              {grade && <Badge className={getWAECGradeColor(grade)}>{grade}</Badge>}
                            </td>
                            <td className="border p-2 text-center">
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
                                  await loadExistingScores()
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                           </tr>
                        )
                      })}
                    </tbody>
                  </table>
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