/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/exams/[id]/scores/page.tsx - EXAM SCORES ENTRY
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calculator,
  Download,
  CheckCheck,
  Clock,
} from 'lucide-react'

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
  academic_year: string
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
  teacher_name: string
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  photo_url?: string
}

const terms = ['First Term', 'Second Term', 'Third Term']
const academicYears = ['2024/2025', '2025/2026']

export default function ExamScoresPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [scores, setScores] = useState<StudentScore[]>([])
  const [selectedTerm, setSelectedTerm] = useState(terms[0])
  const [selectedYear, setSelectedYear] = useState(academicYears[0])
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  // Calculate grade based on total score (out of 100)
  const calculateGrade = (total: number): { grade: string; remark: string } => {
    if (total >= 75) return { grade: 'A1', remark: 'Excellent' }
    if (total >= 70) return { grade: 'B2', remark: 'Very Good' }
    if (total >= 65) return { grade: 'B3', remark: 'Very Good' }
    if (total >= 60) return { grade: 'C4', remark: 'Good' }
    if (total >= 55) return { grade: 'C5', remark: 'Good' }
    if (total >= 50) return { grade: 'C6', remark: 'Good' }
    if (total >= 45) return { grade: 'D7', remark: 'Pass' }
    if (total >= 40) return { grade: 'E8', remark: 'Pass' }
    return { grade: 'F9', remark: 'Fail' }
  }

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

      // Load exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      // Get all students in the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, class, photo_url')
        .eq('class', examData.class)
        .eq('role', 'student')
        .order('full_name')

      if (studentsError) throw studentsError

      // Get existing scores
      const { data: existingScores } = await supabase
        .from('exam_scores')
        .select('*')
        .eq('exam_id', examId)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      // Get exam attempts for objective scores
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .in('status', ['completed', 'pending_theory', 'graded'])

      const attemptsMap = new Map()
      attempts?.forEach(a => attemptsMap.set(a.student_id, a))

      // Build scores array
      const scoresData: StudentScore[] = studentsData.map((student: any) => {
        const existing = existingScores?.find(s => s.student_id === student.id)
        const attempt = attemptsMap.get(student.id)

        if (existing) {
          return {
            ...existing,
            student_name: student.full_name,
            student_email: student.email,
            student_class: student.class,
            photo_url: student.photo_url,
            objective_score: attempt?.objective_score || 0,
            theory_score: attempt?.theory_score || 0,
            is_saved: true
          }
        }

        // Calculate total from attempt if exists
        const totalScore = (existing?.ca1_score || 0) + 
                          (existing?.ca2_score || 0) + 
                          (existing?.exam_score || 0)

        const { grade, remark } = calculateGrade(totalScore)

        return {
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.email,
          student_class: student.class,
          photo_url: student.photo_url,
          exam_id: examId,
          subject: examData.subject,
          term: selectedTerm,
          academic_year: selectedYear,
          ca1_score: existing?.ca1_score || 0,
          ca2_score: existing?.ca2_score || 0,
          exam_score: existing?.exam_score || 0,
          total_score: totalScore,
          percentage: totalScore,
          grade,
          remark,
          status: existing?.status || 'pending',
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
  }, [examId, selectedTerm, selectedYear, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

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
    if (grade?.startsWith('D') || grade?.startsWith('E')) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (grade === 'F9') return 'bg-red-100 text-red-700 border-red-200'
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

    try {
      for (const score of scoresToSave) {
        const scoreData = {
          student_id: score.student_id,
          exam_id: examId,
          attempt_id: score.attempt_id,
          subject: score.subject,
          term: selectedTerm,
          academic_year: selectedYear,
          class: score.student_class,
          teacher_name: profile?.full_name || exam?.teacher_name,
          ca1_score: score.ca1_score,
          ca2_score: score.ca2_score,
          exam_score: score.exam_score,
          grade: score.grade,
          remark: score.remark,
          status: score.status,
          graded_by: profile?.id,
          graded_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('exam_scores')
          .upsert(scoreData, {
            onConflict: 'student_id,subject,term,academic_year'
          })

        if (error) throw error

        // Update exam attempt if exists
        if (score.attempt_id) {
          // ✅ FIX: Provide default values for objective_score
          const objectiveScore = score.objective_score || 0
          const theoryScore = score.exam_score - objectiveScore
          const totalAttemptScore = objectiveScore + theoryScore
          
          await supabase
            .from('exam_attempts')
            .update({
              theory_score: theoryScore,
              total_score: totalAttemptScore,
              status: 'graded',
              graded_by: profile?.id,
              graded_at: new Date().toISOString()
            })
            .eq('id', score.attempt_id)
        }

        // Send notification to student
        await supabase.from('notifications').insert({
          user_id: score.student_id,
          title: '📊 Exam Graded',
          message: `Your ${exam?.subject} exam has been graded. Final score: ${score.total_score}/100 (${score.grade})`,
          type: 'exam_graded',
          exam_id: examId,
          read: false,
          action_url: `/student/results`,
          created_at: new Date().toISOString()
        })
      }

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

  const handleExport = () => {
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
      Status: s.status
    }))

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exam?.title}_${selectedTerm}_${selectedYear}_scores.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Export complete!')
  }

  const completedCount = scores.filter(s => s.status === 'completed').length
  const progressPercentage = scores.length > 0 ? (completedCount / scores.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className={cn("hidden lg:block transition-all duration-300", sidebarCollapsed ? "w-20" : "w-72")} />
          <main className={cn("flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        
        <div className="flex">
          <StaffSidebar 
            profile={profile}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab="exams"
            setActiveTab={() => {}}
          />

          <main className={cn(
            "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
          )}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
              
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push(`/staff/exams/${examId}/submissions`)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
                    </Button>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        Enter Exam Scores
                      </h1>
                      <p className="text-gray-500 dark:text-gray-400">
                        {exam?.title} • {exam?.subject} • {exam?.class}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadData}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button 
                      onClick={() => setShowSaveDialog(true)} 
                      disabled={!hasChanges || saving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save All Scores
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Term/Year Selector */}
              <div className="flex items-center gap-4 mb-6">
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {terms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Progress Bar */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Scoring Progress</span>
                    <span className="text-sm text-gray-500">{completedCount} of {scores.length} students</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </CardContent>
              </Card>

              {/* Scoring Guide */}
              <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">CA1</Badge>
                      <span className="text-sm">Max 20 marks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">CA2</Badge>
                      <span className="text-sm">Max 20 marks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">Exam</Badge>
                      <span className="text-sm">Max 60 marks (Objective + Theory)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total = CA1 + CA2 + Exam (Max 100)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scores Table */}
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Student</TableHead>
                        <TableHead className="text-center w-[80px]">CA1 (20)</TableHead>
                        <TableHead className="text-center w-[80px]">CA2 (20)</TableHead>
                        <TableHead className="text-center w-[80px]">Exam (60)</TableHead>
                        <TableHead className="text-center w-[80px]">Total/100</TableHead>
                        <TableHead className="text-center w-[80px]">Grade</TableHead>
                        <TableHead className="w-[120px]">Remark</TableHead>
                        <TableHead className="text-center w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.map((score) => (
                        <TableRow key={score.student_id} className={score.is_saved ? 'bg-green-50/30' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={score.photo_url} />
                                <AvatarFallback>{getInitials(score.student_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{score.student_name}</p>
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
                              className="w-20 mx-auto text-center"
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
                              className="w-20 mx-auto text-center"
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
                                className="w-20 mx-auto text-center"
                              />
                              {score.objective_score !== undefined && score.objective_score > 0 && (
                                <span className="absolute -top-2 -right-2 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                                  Obj: {score.objective_score}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {score.total_score}
                          </TableCell>
                          <TableCell className="text-center">
                            {score.grade && (
                              <Badge className={getGradeColor(score.grade)}>
                                {score.grade}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
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
                  className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>You have unsaved changes</span>
                  </div>
                  <Button onClick={() => setShowSaveDialog(true)} size="sm">
                    <Save className="mr-2 h-4 w-4" /> Save Now
                  </Button>
                </motion.div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save All Scores?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save all entered scores for {scores.filter(s => 
                s.ca1_score > 0 || s.ca2_score > 0 || s.exam_score > 0
              ).length} students.
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