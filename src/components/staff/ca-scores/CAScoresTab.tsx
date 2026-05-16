// src/components/staff/ca-scores/index.tsx - COMPLETE WITH DEBUG LOGGING
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
  Save, Search, Edit, Trash2, Users, Loader2, RefreshCw, Send, 
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
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
  'CRS', 'Yoruba', 'Commerce', 'Financial Accounting',
  'Data Processing', 'Further Mathematics' 
]

const JUNIOR_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies',
  'Home Economics', 'CRS', 'Yoruba', 'French', 'Information Technology',
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
  const [submissionStatus, setSubmissionStatus] = useState<string>('draft')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

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
      checkSubmissionStatus()
    }
  }, [selectedExamId])

  // ─── CHECK SUBMISSION STATUS ────────────────────────
  const checkSubmissionStatus = async () => {
    if (!selectedExamId) {
      console.log('No exam selected')
      return
    }
    
    console.log('Checking status for exam:', selectedExamId)
    
    try {
      const { data, error } = await supabase
        .from('ca_scores')
        .select('status')
        .eq('exam_id', selectedExamId)
        .limit(1)
      
      if (error) {
        console.log('Status check error (may be missing column):', error.message)
        setSubmissionStatus('draft')
        return
      }
      
      console.log('Status response:', data)
      
      if (data && data.length > 0 && data[0].status) {
        console.log('Found status:', data[0].status)
        setSubmissionStatus(data[0].status)
      } else {
        console.log('No status found, setting draft')
        setSubmissionStatus('draft')
      }
    } catch (err: any) {
      console.log('Status check exception:', err.message)
      setSubmissionStatus('draft')
    }
  }

  // ─── DATA LOADING ───────────────────────────────────
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
    if (!selectedExamId) return

    setLoading(true)

    const { data, error } = await supabase
      .from('ca_scores')
      .select('*')
      .eq('exam_id', selectedExamId)

    if (error) {
      console.error('Error loading scores:', error)
      toast.error('Failed to load existing scores')
      setLoading(false)
      return
    }

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
      const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)

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
        } else if (score.grade === 'F9') {
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
            exam: examTotal > 0 ? String(Math.round(examTotal)) : ''
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
          exam: examTotal > 0 ? String(Math.round(examTotal)) : ''
        }
      }))

      toast.success('Exam score loaded')
    }
  }

  // ─── SUBMIT FOR ADMIN REVIEW ────────────────────────
  const handleSubmitForReview = async () => {
    console.log('========================================')
    console.log('handleSubmitForReview START')
    console.log('========================================')
    console.log('selectedExamId:', selectedExamId)
    console.log('staffProfile?.id:', staffProfile?.id)
    console.log('scoreEntries:', JSON.stringify(scoreEntries, null, 2))
    
    if (!selectedExamId) { 
      console.log('FAILED: No exam selected')
      toast.error('Select an exam first')
      setShowSubmitConfirm(false)
      setSubmitting(false)
      return 
    }
    
    if (!staffProfile?.id) {
      console.log('FAILED: No staff profile')
      toast.error('Teacher profile not found')
      setShowSubmitConfirm(false)
      setSubmitting(false)
      return
    }

    // Check if scores are saved
    const entriesArray = Object.values(scoreEntries)
    console.log('entriesArray length:', entriesArray.length)
    
    const hasScores = entriesArray.some(entry => {
      const ca1 = parseFloat(entry.ca1) || 0
      const ca2 = parseFloat(entry.ca2) || 0
      const exam = parseFloat(entry.exam) || 0
      console.log('Checking entry:', { ca1, ca2, exam, total: ca1 + ca2 + exam })
      return ca1 > 0 || ca2 > 0 || exam > 0
    })

    console.log('hasScores:', hasScores)

    if (!hasScores) {
      console.log('FAILED: No scores entered')
      toast.error('No scores entered. Please save scores first.')
      setShowSubmitConfirm(false)
      setSubmitting(false)
      return
    }

    console.log('Starting submission process...')
    setSubmitting(true)
    
    try {
      // Update all ca_scores for this exam to status 'submitted'
      console.log('Calling supabase update...')
      console.log('Update params:', {
        exam_id: selectedExamId,
        teacher_id: staffProfile.id
      })
      
      const { data: updatedData, error } = await supabase
        .from('ca_scores')
        .update({ 
          status: 'submitted', 
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('exam_id', selectedExamId)
        .eq('teacher_id', staffProfile.id)
        .select()
      
      console.log('Supabase response:', { 
        dataLength: updatedData?.length, 
        error: error ? { message: error.message, code: error.code, details: error.details } : null 
      })
      
      if (error) {
        console.error('Supabase update error:', error)
        toast.error(`Failed to submit: ${error.message}`)
        setSubmitting(false)
        return
      }

      console.log('Updated rows:', updatedData?.length || 0)

      // Try to create submission record
      try {
        console.log('Creating submission record...')
        const submissionData = {
          exam_id: selectedExamId,
          subject: selectedSubject,
          class: selectedClass,
          term: selectedTerm,
          academic_year: selectedYear,
          teacher_id: staffProfile.id,
          teacher_name: staffProfile.full_name || 'Unknown',
          total_students: students.length,
          graded_students: stats.gradedStudents,
          class_average: stats.classAverage,
          status: 'pending_review',
          submitted_at: new Date().toISOString()
        }
        console.log('Submission data:', submissionData)
        
        const { error: insertError } = await supabase.from('ca_submissions').insert(submissionData)

        if (insertError) {
          console.warn('Submission record warning:', insertError.message)
        } else {
          console.log('Submission record created successfully')
        }
      } catch (subErr: any) {
        console.warn('Submission record exception:', subErr.message)
      }

      // Update local state
      console.log('Setting submission status to "submitted"')
      setSubmissionStatus('submitted')
      setShowSubmitConfirm(false)
      
      toast.success('✅ Scores submitted for admin review!', {
        description: 'The admin can now review and publish the broadsheet.'
      })
      
      console.log('Reloading data...')
      await checkSubmissionStatus()
      await loadExistingScores()
      console.log('========================================')
      console.log('Submission process COMPLETE')
      console.log('========================================')
      
    } catch (error: any) {
      console.error('========================================')
      console.error('SUBMIT EXCEPTION:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('========================================')
      toast.error(`Failed to submit: ${error.message || 'Please try again'}`)
    } finally {
      console.log('Setting submitting to false')
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
    console.log('========================================')
    console.log('handleSave START')
    console.log('========================================')
    
    if (!staffProfile?.id) {
      toast.error('Profile not found')
      return
    }

    if (!selectedExamId) {
      toast.error('Select an exam first')
      return
    }

    if (submissionStatus === 'approved') {
      toast.error('Cannot modify approved scores')
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

        const totalScore = ca1Score + ca2Score + examScore
        const percentage = Math.round((totalScore / 100) * 100)
        const grade = getGrade(percentage)
        const remark = getRemark(grade)

        console.log('Saving score for student:', student.id, { ca1Score, ca2Score, examScore, totalScore, grade })

        scoresToSave.push({
          student_id: student.id,
          subject: selectedSubject,
          term: selectedTerm,
          academic_year: selectedYear,
          ca1_score: ca1Score,
          ca2_score: ca2Score,
          exam_objective_score: Math.round(examScore * 0.33),
          exam_theory_score: Math.round(examScore * 0.67),
          total_score: totalScore,
          grade: grade,
          remark: remark,
          exam_id: selectedExamId,
          teacher_id: staffProfile.id,
          class: selectedClass,
          status: 'draft'
        })
      }

      if (scoresToSave.length === 0) {
        console.log('No scores to save')
        toast.warning('No scores to save')
        setSaving(false)
        return
      }

      console.log('Saving', scoresToSave.length, 'scores')

      for (const score of scoresToSave) {
        const { error: upsertError } = await supabase
          .from('ca_scores')
          .upsert(score, { 
            onConflict: 'student_id,exam_id,subject'
          })

        if (upsertError) {
          console.error('Upsert error:', upsertError)
          toast.error(`Save failed: ${upsertError.message}`)
          setSaving(false)
          return
        }
      }

      console.log('All scores saved successfully')
      toast.success(`✅ Saved ${scoresToSave.length} student scores`)
      await loadExistingScores()
      await checkSubmissionStatus()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`)
    } finally {
      console.log('Setting saving to false')
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

  // ─── DEBUG LOG ──────────────────────────────────────
  console.log('Current submissionStatus:', submissionStatus)
  console.log('Show submit confirm:', showSubmitConfirm)
  console.log('Submitting:', submitting)
  console.log('Students count:', students.length)

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
    <div className="space-y-3 sm:space-y-5 w-full max-w-full overflow-hidden">
      {/* Scoring Formula */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
        <span className="font-medium text-slate-600">Scoring:</span>
        <span>CA1 (20) + CA2 (20) + Exam (60) = <span className="font-semibold text-slate-700">Total (100)</span></span>
        <span className="ml-auto text-[10px] text-slate-400">Status: {submissionStatus}</span>
      </div>

      {/* Filters - RESPONSIVE GRID */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <div>
              <Label className="text-[10px] sm:text-[11px] text-slate-500 mb-1 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls} className="text-xs sm:text-sm">{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] sm:text-[11px] text-slate-500 mb-1 block">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject} className="text-xs sm:text-sm">{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] sm:text-[11px] text-slate-500 mb-1 block">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={availableExams.length === 0 ? 'No exams' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-slate-400 text-center">No published exams</div>
                  ) : (
                    availableExams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id} className="text-xs">
                        {exam.title?.substring(0, 30)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] sm:text-[11px] text-slate-500 mb-1 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] sm:text-[11px] text-slate-500 mb-1 block">Session</Label>
              <Input
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
                placeholder="2025/2026"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-1.5 sm:gap-2 flex-wrap">
              <Button
                onClick={handleSave}
                disabled={saving || students.length === 0 || submissionStatus === 'approved'}
                className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-[11px] sm:text-sm px-2 sm:px-3"
              >
                {saving ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving</>
                ) : (
                  <><Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Save</>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleAutoFetchAll}
                disabled={autoFetching || students.length === 0}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                title="Auto-fetch exam scores"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", autoFetching && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Submit Button - FULL WIDTH */}
          <div className="mt-3 sm:mt-4 pt-3 border-t">
            <Button
              onClick={() => {
                console.log('Submit button clicked, opening confirm dialog')
                setShowSubmitConfirm(true)
              }}
              disabled={submitting || students.length === 0 || submissionStatus === 'submitted' || submissionStatus === 'approved'}
              className={cn(
                "w-full h-9 sm:h-10 text-sm font-semibold transition-all",
                submissionStatus === 'submitted' || submissionStatus === 'approved'
                  ? "bg-green-100 text-green-700 hover:bg-green-100 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              )}
              type="button"
            >
              {submissionStatus === 'submitted' || submissionStatus === 'approved' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {submissionStatus === 'approved' ? '✅ Approved by Admin' : '✓ Submitted for Review'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit to Admin for Review'}
                </>
              )}
            </Button>
            {submissionStatus === 'submitted' && (
              <p className="text-xs text-amber-600 mt-1 text-center">
                Scores submitted. Waiting for admin approval.
              </p>
            )}
            {submissionStatus === 'approved' && (
              <p className="text-xs text-green-600 mt-1 text-center">
                Scores approved. Broadsheet has been published.
              </p>
            )}
            <p className="text-[9px] text-slate-300 mt-1 text-center">
              Debug: status={submissionStatus}, students={students.length}, submitting={String(submitting)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={(open) => {
        console.log('Dialog open change:', open)
        setShowSubmitConfirm(open)
      }}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-blue-600" />
              Submit Scores for Review
            </DialogTitle>
            <DialogDescription>
              Submit {selectedSubject} scores for {selectedClass} to admin for review and approval.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-800 mb-2">You are about to submit:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• {students.length} students in {selectedClass}</li>
                <li>• Subject: {selectedSubject}</li>
                <li>• Term: {TERM_OPTIONS.find(t => t.value === selectedTerm)?.label}</li>
                <li>• Session: {selectedYear}</li>
                <li>• {stats.gradedStudents} students have scores</li>
                <li>• Class Average: {stats.classAverage}%</li>
                <li>• Passed: {stats.passCount} | Failed: {stats.failCount}</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>After submission, the admin will review and publish the broadsheet.</span>
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Cancel clicked')
                setShowSubmitConfirm(false)
              }}
              className="w-full sm:w-auto"
              size="sm"
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('Confirm submit clicked in dialog')
                handleSubmitForReview()
              }}
              disabled={submitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              size="sm"
              type="button"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Submission
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      {stats.gradedStudents > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-400">Students</p>
              <p className="text-base sm:text-lg font-bold text-slate-700">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-400">Graded</p>
              <p className="text-base sm:text-lg font-bold text-emerald-600">{stats.gradedStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-400">Average</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.classAverage}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-400">Highest</p>
              <p className="text-base sm:text-lg font-bold text-purple-600">{stats.highestScore}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-400">Passed</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.passCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-400">Failed</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.failCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs - Score Entry & View Scores */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start gap-0 overflow-x-auto">
          <TabsTrigger
            value="entry"
            className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap"
          >
            Score Entry
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap"
          >
            View Scores
          </TabsTrigger>
        </TabsList>

        {/* Score Entry Tab */}
        <TabsContent value="entry" className="mt-3 sm:mt-4">
          {students.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-8 sm:py-12">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm text-slate-500">
                  {!selectedExamId ? 'Select an exam to load students' : availableExams.length === 0 ? 'No published exams for this subject' : 'No students found for this exam'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {classOrder.map(cls => (
                <div key={cls}>
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Badge className="bg-slate-200 text-slate-700 font-semibold px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs">
                      {cls}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-slate-400">
                      {groupedStudents[cls].length} students
                    </span>
                  </div>

                  <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">Student</TableHead>
                              <TableHead className="text-center text-[10px] sm:text-xs w-[60px] sm:w-[80px]">CA1 /20</TableHead>
                              <TableHead className="text-center text-[10px] sm:text-xs w-[60px] sm:w-[80px]">CA2 /20</TableHead>
                              <TableHead className="text-center text-[10px] sm:text-xs w-[70px] sm:w-[90px]">Exam /60</TableHead>
                              <TableHead className="text-center text-[10px] sm:text-xs w-[60px] sm:w-[80px]">Total</TableHead>
                              <TableHead className="text-center text-[10px] sm:text-xs w-[50px] sm:w-[60px]">Grade</TableHead>
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
                                  <TableCell className="text-[11px] sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[160px]">
                                    {student.full_name}
                                  </TableCell>
                                  <TableCell className="p-1 sm:p-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="20"
                                      step="1"
                                      value={entry.ca1}
                                      onChange={v => handleScoreChange(student.id, 'ca1', v.target.value)}
                                      className="h-7 sm:h-8 w-12 sm:w-16 mx-auto text-center text-[11px] sm:text-sm"
                                      disabled={submissionStatus === 'approved'}
                                    />
                                  </TableCell>
                                  <TableCell className="p-1 sm:p-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="20"
                                      step="1"
                                      value={entry.ca2}
                                      onChange={v => handleScoreChange(student.id, 'ca2', v.target.value)}
                                      className="h-7 sm:h-8 w-12 sm:w-16 mx-auto text-center text-[11px] sm:text-sm"
                                      disabled={submissionStatus === 'approved'}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center p-1 sm:p-2">
                                    {hasExamScore ? (
                                      <span className="text-[11px] sm:text-sm font-medium text-slate-700">
                                        {examScore}/60
                                      </span>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAutoFetchSingle(student.id)}
                                        className="h-7 text-[10px] sm:text-[11px] text-blue-600 hover:text-blue-700"
                                        disabled={submissionStatus === 'approved'}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Load
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold text-[11px] sm:text-sm">
                                    {totalScore > 0 ? totalScore : '—'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {grade && (
                                      <Badge className={cn("text-[10px] sm:text-xs font-semibold", getGradeColor(grade))}>
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
              ))}
            </div>
          )}
        </TabsContent>

        {/* View Scores Tab */}
        <TabsContent value="view" className="mt-3 sm:mt-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b px-3 sm:px-5 pt-3 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-sm sm:text-base">Saved CA Scores</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-[10px] sm:text-xs font-semibold">Student</TableHead>
                      <TableHead className="text-center text-[10px] sm:text-xs">CA1</TableHead>
                      <TableHead className="text-center text-[10px] sm:text-xs">CA2</TableHead>
                      <TableHead className="text-center text-[10px] sm:text-xs">Exam</TableHead>
                      <TableHead className="text-center text-[10px] sm:text-xs">Total</TableHead>
                      <TableHead className="text-center text-[10px] sm:text-xs">Grade</TableHead>
                      <TableHead className="text-[10px] sm:text-xs">Remark</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-xs sm:text-sm">
                          No scores saved yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScores.map(score => {
                        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
                        return (
                          <TableRow key={score.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-[11px] sm:text-sm font-medium">
                              {getStudentName(score.student_id)}
                            </TableCell>
                            <TableCell className="text-center text-[11px] sm:text-sm">
                              {score.ca1_score || '—'}
                            </TableCell>
                            <TableCell className="text-center text-[11px] sm:text-sm">
                              {score.ca2_score || '—'}
                            </TableCell>
                            <TableCell className="text-center text-[11px] sm:text-sm">
                              {examTotal > 0 ? `${examTotal}/60` : '—'}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-[11px] sm:text-sm">
                              {score.total_score?.toFixed(1) || '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {score.grade && (
                                <Badge className={cn("text-[10px] sm:text-xs font-semibold", getGradeColor(score.grade))}>
                                  {score.grade}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs text-slate-500 max-w-[120px] truncate">
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
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  disabled={submissionStatus === 'approved'}
                                >
                                  <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700"
                                  disabled={submissionStatus === 'approved'}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit CA Score</DialogTitle>
            <DialogDescription>
              Update scores for {getStudentName(editingScore?.student_id)}
            </DialogDescription>
          </DialogHeader>

          {editingScore && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] sm:text-xs">CA1 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca1_score || 0}
                    onChange={e => setEditingScore({
                      ...editingScore,
                      ca1_score: parseInt(e.target.value) || 0
                    })}
                    className="h-8 sm:h-9 text-xs sm:text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] sm:text-xs">CA2 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editingScore.ca2_score || 0}
                    onChange={e => setEditingScore({
                      ...editingScore,
                      ca2_score: parseInt(e.target.value) || 0
                    })}
                    className="h-8 sm:h-9 text-xs sm:text-sm mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] sm:text-xs">Exam Score (max 60)</Label>
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
                    className="h-8 sm:h-9 text-xs sm:text-sm mt-1"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-xs sm:text-sm text-slate-500">Total Score: </span>
                <span className="text-base sm:text-lg font-bold text-emerald-700">
                  {(editingScore.ca1_score || 0) + (editingScore.ca2_score || 0) + (editingScore.exam_objective_score || 0) + (editingScore.exam_theory_score || 0)}/100
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowEditDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
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