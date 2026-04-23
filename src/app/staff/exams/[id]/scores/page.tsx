/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/exams/[id]/scores/page.tsx - FIXED
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calculator,
  Download,
  CheckCheck,
  Clock,
  Calendar,
} from 'lucide-react'
import { useStaffContext } from '@/app/staff/layout'

// ============================================
// CURRENT TERM CONSTANTS
// ============================================
const CURRENT_TERM = 'third'
const CURRENT_SESSION = '2025/2026'
const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

// Available terms for dropdown
const AVAILABLE_TERMS = [
  { term: 'first', session: '2024/2025', label: 'First Term 2024/2025' },
  { term: 'second', session: '2024/2025', label: 'Second Term 2024/2025' },
  { term: 'third', session: '2024/2025', label: 'Third Term 2024/2025' },
  { term: 'first', session: '2025/2026', label: 'First Term 2025/2026' },
  { term: 'second', session: '2025/2026', label: 'Second Term 2025/2026' },
  { term: 'third', session: '2025/2026', label: 'Third Term 2025/2026 (Current)' },
]

interface StudentScore {
  id?: string
  student_id: string
  student_name: string
  student_email: string
  student_class: string
  photo_url?: string
  exam_id: string
  subject: string
  term: string
  session_year: string
  ca1_score: number
  ca2_score: number
  exam_score: number
  total_score: number
  percentage: number
  grade: string
  remark: string
  status: 'pending' | 'completed'
  attempt_id?: string
  objective_score?: number
  theory_score?: number
  is_saved?: boolean
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  total_marks: number
  has_theory: boolean
  passing_percentage: number
  term: string
  session_year: string
  created_by?: string
  Staff?: {
    full_name?: string
  }
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  photo_url?: string
}

export default function ExamScoresPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [scores, setScores] = useState<StudentScore[]>([])
  const [selectedTermSession, setSelectedTermSession] = useState(`${CURRENT_TERM}|${CURRENT_SESSION}`)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [currentTermInfo, setCurrentTermInfo] = useState({ term: CURRENT_TERM, session: CURRENT_SESSION })

  // Get sidebarCollapsed from context
  const { sidebarCollapsed } = useStaffContext()

  // Calculate grade based on total score (out of 100)
  const calculateGrade = (total: number): { grade: string; remark: string } => {
    if (total >= 80) return { grade: 'A', remark: 'Excellent' }
    if (total >= 70) return { grade: 'B', remark: 'Very Good' }
    if (total >= 60) return { grade: 'C', remark: 'Good' }
    if (total >= 50) return { grade: 'P', remark: 'Pass' }
    return { grade: 'F', remark: 'Fail' }
  }

  const fetchCurrentTerm = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('terms')
        .select('*')
        .eq('is_current', true)
        .single()
      
      if (data) {
        setCurrentTermInfo({ term: data.term_code, session: data.session_year })
        setSelectedTermSession(`${data.term_code}|${data.session_year}`)
      }
    } catch (error) {
      console.error('Error fetching current term:', error)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // Load staff profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load exam details with staff info
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          Staff:profiles!exams_created_by_fkey(full_name)
        `)
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      // Parse selected term/session
      const [selectedTerm, selectedSession] = selectedTermSession.split('|')

      // Get all students in the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, class, photo_url')
        .eq('class', examData.class)
        .eq('role', 'student')
        .order('full_name')

      if (studentsError) throw studentsError

      // Get existing CA scores from ca_scores table
      const { data: existingCAScores } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('exam_id', examId)
        .eq('term', selectedTerm)
        .eq('session_year', selectedSession)

      // Get exam attempts for objective/theory scores
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('term', selectedTerm)
        .eq('session_year', selectedSession)
        .in('status', ['completed', 'pending_theory', 'graded'])

      const attemptsMap = new Map()
      attempts?.forEach(a => attemptsMap.set(a.student_id, a))

      const caScoresMap = new Map()
      existingCAScores?.forEach(s => caScoresMap.set(s.student_id, s))

      // Build scores array
      const scoresData: StudentScore[] = (studentsData || []).map((student: any) => {
        const existing = caScoresMap.get(student.id)
        const attempt = attemptsMap.get(student.id)

        const ca1Score = existing?.ca1_score || 0
        const ca2Score = existing?.ca2_score || 0
        const examScore = existing?.exam_score || 0
        const totalScore = ca1Score + ca2Score + examScore

        const { grade, remark } = calculateGrade(totalScore)

        return {
          id: existing?.id,
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.email,
          student_class: student.class,
          photo_url: student.photo_url,
          exam_id: examId,
          subject: examData.subject,
          term: selectedTerm,
          session_year: selectedSession,
          ca1_score: ca1Score,
          ca2_score: ca2Score,
          exam_score: examScore,
          total_score: totalScore,
          percentage: totalScore,
          grade,
          remark,
          status: existing?.status || (totalScore > 0 ? 'completed' : 'pending'),
          attempt_id: attempt?.id,
          objective_score: attempt?.objective_score || 0,
          theory_score: attempt?.theory_score || 0,
          is_saved: !!existing
        }
      })

      setScores(scoresData)
      setHasChanges(false)

    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error(error.message || 'Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [examId, selectedTermSession, router])

  useEffect(() => {
    fetchCurrentTerm()
  }, [fetchCurrentTerm])

  useEffect(() => {
    if (currentTermInfo.term) {
      loadData()
    }
  }, [loadData, currentTermInfo])

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'bg-green-100 text-green-700 border-green-200'
    if (grade?.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (grade?.startsWith('C')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (grade === 'P') return 'bg-orange-100 text-orange-700 border-orange-200'
    if (grade === 'F') return 'bg-red-100 text-red-700 border-red-200'
    return ''
  }

  const updateScore = (studentId: string, field: 'ca1_score' | 'ca2_score' | 'exam_score', value: string) => {
    const numValue = parseFloat(value) || 0
    const clampedValue = field === 'exam_score' 
      ? Math.min(60, Math.max(0, numValue))
      : Math.min(20, Math.max(0, numValue))

    setScores(prev => prev.map(s => {
      if (s.student_id !== studentId) return s

      const updated = { ...s, [field]: clampedValue }
      const total = updated.ca1_score + updated.ca2_score + updated.exam_score
      const { grade, remark } = calculateGrade(total)

      return {
        ...updated,
        total_score: total,
        percentage: total,
        grade,
        remark,
        status: total > 0 ? 'completed' : 'pending'
      }
    }))
    setHasChanges(true)
  }

  const saveAllScores = async () => {
    setSaving(true)
    const scoresToSave = scores.filter(s => 
      s.ca1_score > 0 || s.ca2_score > 0 || s.exam_score > 0
    )

    const [selectedTerm, selectedSession] = selectedTermSession.split('|')

    try {
      for (const score of scoresToSave) {
        const scoreData = {
          student_id: score.student_id,
          exam_id: examId,
          subject: score.subject,
          term: selectedTerm,
          session_year: selectedSession,
          class: score.student_class,
          teacher_id: profile?.id,
          teacher_name: profile?.full_name || exam?.Staff?.full_name || 'Teacher',
          ca1_score: score.ca1_score,
          ca2_score: score.ca2_score,
          exam_score: score.exam_score,
          total_score: score.total_score,
          grade: score.grade,
          remark: score.remark,
          status: score.status,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('ca_scores')
          .upsert(scoreData, {
            onConflict: 'student_id,exam_id,term,session_year'
          })

        if (error) throw error

        // Update student_term_progress
        await updateStudentTermProgress(score.student_id, selectedTerm, selectedSession)
      }

      // Send notifications
      await supabase.from('notifications').insert(
        scoresToSave.map(score => ({
          user_id: score.student_id,
          title: '📊 Exam Scores Updated',
          message: `Your ${exam?.subject} scores for ${TERM_NAMES[selectedTerm]} ${selectedSession} have been updated. Total: ${score.total_score}/100 (${score.grade})`,
          type: 'exam_graded',
          exam_id: examId,
          read: false,
          action_url: `/student/results`,
          created_at: new Date().toISOString()
        }))
      )

      setScores(prev => prev.map(s => ({ ...s, is_saved: true })))
      setHasChanges(false)
      toast.success(`Saved ${scoresToSave.length} student scores!`)

    } catch (error: any) {
      console.error('Error saving scores:', error)
      toast.error(error.message || 'Failed to save scores')
    } finally {
      setSaving(false)
      setShowSaveDialog(false)
    }
  }

  const updateStudentTermProgress = async (studentId: string, term: string, sessionYear: string) => {
    try {
      // Get all CA scores for this student in this term
      const { data: allScores } = await supabase
        .from('ca_scores')
        .select('total_score')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('session_year', sessionYear)

      // Get exam attempts
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('exam_id, percentage')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('session_year', sessionYear)
        .eq('status', 'graded')

      const completedExams = attempts?.length || 0
      
      // Get student class for subject count
      const { data: student } = await supabase
        .from('profiles')
        .select('class')
        .eq('id', studentId)
        .single()

      const totalSubjects = student?.class?.startsWith('JSS') ? 17 : 10

      // Calculate average from attempts
      const avgScore = attempts && attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
        : 0

      const { grade } = calculateGrade(avgScore)

      // Upsert term progress
      await supabase
        .from('student_term_progress')
        .upsert({
          student_id: studentId,
          term: term,
          session_year: sessionYear,
          completed_exams: completedExams,
          total_subjects: totalSubjects,
          average_score: Math.round(avgScore * 100) / 100,
          grade: grade,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,term,session_year'
        })
    } catch (error) {
      console.error('Error updating term progress:', error)
    }
  }

  const handleExport = () => {
    const [selectedTerm, selectedSession] = selectedTermSession.split('|')
    
    const csvData = scores.map(s => ({
      Name: s.student_name,
      Email: s.student_email,
      Class: s.student_class,
      CA1: s.ca1_score,
      CA2: s.ca2_score,
      Exam: s.exam_score,
      Total: s.total_score,
      Grade: s.grade,
      Remark: s.remark,
      Term: TERM_NAMES[selectedTerm],
      Session: selectedSession
    }))

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exam?.title}_${selectedTerm}_${selectedSession}_scores.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Export complete!')
  }

  const completedCount = scores.filter(s => s.status === 'completed').length
  const progressPercentage = scores.length > 0 ? (completedCount / scores.length) * 100 : 0

  const [selectedTerm, selectedSession] = selectedTermSession.split('|')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/staff/exams')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Enter Exam Scores
                </h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {exam?.title} • {exam?.subject} • {exam?.class}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5 py-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">
                  {TERM_NAMES[selectedTerm]} {selectedSession}
                </span>
              </Badge>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button 
                onClick={() => setShowSaveDialog(true)} 
                disabled={!hasChanges || saving}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save All
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Term/Session Selector */}
        <div className="mb-6">
          <Select value={selectedTermSession} onValueChange={setSelectedTermSession}>
            <SelectTrigger className="w-full sm:w-[300px] bg-white dark:bg-slate-900">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_TERMS.map((t) => (
                <SelectItem key={`${t.term}|${t.session}`} value={`${t.term}|${t.session}`}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Scoring Progress</span>
              <span className="text-sm text-gray-500">{completedCount} of {scores.length} students</span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </CardContent>
        </Card>

        {/* Scoring Guide */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white dark:bg-slate-800">CA1</Badge>
                <span className="text-sm">Max 20 marks</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white dark:bg-slate-800">CA2</Badge>
                <span className="text-sm">Max 20 marks</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white dark:bg-slate-800">Exam</Badge>
                <span className="text-sm">Max 60 marks</span>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total = CA1 + CA2 + Exam (Max 100)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scores Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead className="w-[250px] text-xs sm:text-sm">Student</TableHead>
                  <TableHead className="text-center w-[80px] text-xs sm:text-sm">CA1 (20)</TableHead>
                  <TableHead className="text-center w-[80px] text-xs sm:text-sm">CA2 (20)</TableHead>
                  <TableHead className="text-center w-[80px] text-xs sm:text-sm">Exam (60)</TableHead>
                  <TableHead className="text-center w-[80px] text-xs sm:text-sm">Total/100</TableHead>
                  <TableHead className="text-center w-[80px] text-xs sm:text-sm">Grade</TableHead>
                  <TableHead className="w-[120px] text-xs sm:text-sm">Remark</TableHead>
                  <TableHead className="text-center w-[80px] text-xs sm:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((score) => (
                  <TableRow key={score.student_id} className={score.is_saved ? 'bg-green-50/30 dark:bg-green-950/20' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarImage src={score.photo_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {getInitials(score.student_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{score.student_name}</p>
                          <p className="text-xs text-gray-500">{score.student_class}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={score.ca1_score || ''}
                        onChange={(e) => updateScore(score.student_id, 'ca1_score', e.target.value)}
                        className="w-16 sm:w-20 mx-auto text-center text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={score.ca2_score || ''}
                        onChange={(e) => updateScore(score.student_id, 'ca2_score', e.target.value)}
                        className="w-16 sm:w-20 mx-auto text-center text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          step="0.5"
                          value={score.exam_score || ''}
                          onChange={(e) => updateScore(score.student_id, 'exam_score', e.target.value)}
                          className="w-16 sm:w-20 mx-auto text-center text-sm"
                        />
                        {score.objective_score !== undefined && score.objective_score > 0 && (
                          <span className="absolute -top-2 -right-2 text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded">
                            Obj: {score.objective_score}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm">
                      {score.total_score}
                    </TableCell>
                    <TableCell className="text-center">
                      {score.grade && (
                        <Badge className={cn("text-xs", getGradeColor(score.grade))}>
                          {score.grade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {score.remark}
                    </TableCell>
                    <TableCell className="text-center">
                      {score.is_saved ? (
                        <CheckCheck className="h-4 w-4 text-green-600 mx-auto" />
                      ) : score.total_score > 0 ? (
                        <Clock className="h-4 w-4 text-yellow-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
            <Button onClick={() => setShowSaveDialog(true)} size="sm">
              <Save className="mr-2 h-4 w-4" /> Save Now
            </Button>
          </motion.div>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save All Scores?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save all entered scores for {scores.filter(s => 
                s.ca1_score > 0 || s.ca2_score > 0 || s.exam_score > 0
              ).length} students for {TERM_NAMES[selectedTerm]} {selectedSession}.
              Students will be notified of their grades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveAllScores} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}