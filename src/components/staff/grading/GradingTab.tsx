// ============================================
// GRADING TAB - Complete with Responsive Layout
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { 
  FileText, MonitorPlay, CheckCircle2, Clock, Search, ChevronRight,
  User, BookOpen, Star, MessageSquare, AlertCircle, Loader2,
  Filter, Eye, Download, RefreshCw, XCircle, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ============================================
// TYPES
// ============================================
interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  submission_text: string | null
  grade: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  graded_by: string | null
  assignment?: {
    title: string
    subject: string
    class: string
    total_marks: number
  }
  student?: {
    full_name: string
    vin_id: string
    class: string
  }
}

interface TheoryAnswer {
  id: string
  attempt_id: string
  question_id: string
  answer_text: string
  points_awarded: number | null
  graded_by: string | null
  graded_at: string | null
  feedback: string | null
  question?: {
    question_text: string
    points: number
  }
  attempt?: {
    student_id: string
    exam_id: string
    student?: { full_name: string }
    exam?: { title: string; subject: string }
  }
}

interface GradingTabProps {
  staffProfile: any
}

// ============================================
// CONSTANTS
// ============================================
const calculateGrade = (percentage: number): string => {
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'P'
  return 'F'
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700'
    case 'B': return 'bg-blue-100 text-blue-700'
    case 'C': return 'bg-yellow-100 text-yellow-700'
    case 'P': return 'bg-orange-100 text-orange-700'
    case 'F': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export function GradingTab({ staffProfile }: GradingTabProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('assignments')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState<string>('all')
  
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([])
  const [theoryAnswers, setTheoryAnswers] = useState<TheoryAnswer[]>([])
  const [gradedSubmissions, setGradedSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<string[]>([])
  
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const [selectedTheory, setSelectedTheory] = useState<TheoryAnswer | null>(null)
  const [showGradingDialog, setShowGradingDialog] = useState(false)
  const [showTheoryDialog, setShowTheoryDialog] = useState(false)
  
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [stats, setStats] = useState({
    pendingAssignments: 0,
    pendingTheory: 0,
    gradedToday: 0,
    averageScore: 0
  })

  useEffect(() => {
    setMounted(true)
    loadClasses()
    loadPendingSubmissions()
    loadPendingTheory()
    loadGradedSubmissions()
    calculateStats()
  }, [])

  const loadClasses = async () => {
    try {
      const { data } = await supabase.from('class_students').select('class').order('class')
      const uniqueClasses = [...new Set(data?.map(d => d.class) || [])]
      setClasses(uniqueClasses)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadPendingSubmissions = async () => {
    try {
      let query = supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(title, subject, class, total_marks),
          student:students!assignment_submissions_student_id_fkey(
            id, class, vin_id,
            profiles!students_id_fkey(full_name)
          )
        `)
        .is('grade', null)
        .order('submitted_at', { ascending: false })
      
      if (filterClass !== 'all') {
        query = query.eq('student.class', filterClass)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      const formatted = data?.map((sub: any) => ({
        ...sub,
        student: {
          ...sub.student,
          full_name: sub.student?.profiles?.full_name || 'Unknown'
        }
      })) || []
      
      setAssignmentSubmissions(formatted)
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const loadPendingTheory = async () => {
    try {
      const { data, error } = await supabase
        .from('theory_answers')
        .select(`
          *,
          question:questions(question_text, points),
          attempt:exam_attempts(
            student_id, exam_id,
            student:students!exam_attempts_student_id_fkey(
              class,
              profiles!students_id_fkey(full_name)
            ),
            exam:exams(title, subject)
          )
        `)
        .is('points_awarded', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      let formatted = data?.map((ans: any) => ({
        ...ans,
        attempt: {
          ...ans.attempt,
          student: {
            ...ans.attempt?.student,
            full_name: ans.attempt?.student?.profiles?.full_name
          }
        }
      })) || []
      
      if (filterClass !== 'all') {
        formatted = formatted.filter(a => a.attempt?.student?.class === filterClass)
      }
      
      setTheoryAnswers(formatted)
    } catch (error) {
      console.error('Error loading theory answers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGradedSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(title, subject, class, total_marks),
          student:students!assignment_submissions_student_id_fkey(
            profiles!students_id_fkey(full_name), vin_id
          )
        `)
        .not('grade', 'is', null)
        .order('graded_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      const formatted = data?.map((sub: any) => ({
        ...sub,
        student: {
          full_name: sub.student?.profiles?.full_name || 'Unknown',
          vin_id: sub.student?.vin_id
        }
      })) || []
      
      setGradedSubmissions(formatted)
    } catch (error) {
      console.error('Error loading graded submissions:', error)
    }
  }

  const calculateStats = async () => {
    try {
      const { count: pendingAssignments } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .is('grade', null)
      
      const { count: pendingTheory } = await supabase
        .from('theory_answers')
        .select('*', { count: 'exact', head: true })
        .is('points_awarded', null)
      
      const today = new Date().toISOString().split('T')[0]
      const { count: gradedToday } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('graded_at', today)
      
      setStats({
        pendingAssignments: pendingAssignments || 0,
        pendingTheory: pendingTheory || 0,
        gradedToday: gradedToday || 0,
        averageScore: 75
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const handleGradeSubmission = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission)
    setGrade(submission.grade || 0)
    setFeedback(submission.feedback || '')
    setShowGradingDialog(true)
  }

  const handleGradeTheory = (answer: TheoryAnswer) => {
    setSelectedTheory(answer)
    setGrade(answer.points_awarded || 0)
    setFeedback(answer.feedback || '')
    setShowTheoryDialog(true)
  }

  const saveAssignmentGrade = async () => {
    if (!selectedSubmission) return
    setSaving(true)
    
    try {
      const maxMarks = selectedSubmission.assignment?.total_marks || 100
      const percentage = (grade / maxMarks) * 100
      const letterGrade = calculateGrade(percentage)
      
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          feedback,
          graded_by: staffProfile.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id)
      
      if (error) throw error
      
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.student_id,
        title: '📝 Assignment Graded',
        message: `Your assignment "${selectedSubmission.assignment?.title}" scored ${grade}/${maxMarks} (${letterGrade})`,
        type: 'assignment_graded',
        read: false,
        created_at: new Date().toISOString()
      })
      
      toast.success('Assignment graded successfully!')
      setShowGradingDialog(false)
      loadPendingSubmissions()
      loadGradedSubmissions()
      calculateStats()
    } catch (error) {
      console.error('Error saving grade:', error)
      toast.error('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const saveTheoryGrade = async () => {
    if (!selectedTheory) return
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('theory_answers')
        .update({
          points_awarded: grade,
          feedback,
          graded_by: staffProfile.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedTheory.id)
      
      if (error) throw error
      
      toast.success('Theory answer graded successfully!')
      setShowTheoryDialog(false)
      loadPendingTheory()
      calculateStats()
    } catch (error) {
      console.error('Error saving grade:', error)
      toast.error('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    loadPendingSubmissions()
    loadPendingTheory()
    loadGradedSubmissions()
    calculateStats()
  }

  const filteredAssignments = assignmentSubmissions.filter(sub =>
    sub.assignment?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTheory = theoryAnswers.filter(ans =>
    ans.attempt?.exam?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ans.attempt?.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingCount = stats.pendingAssignments + stats.pendingTheory

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Grading Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Grade student submissions and provide feedback
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {pendingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 px-3 py-1.5">
              <AlertCircle className="h-4 w-4 mr-1" />
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-amber-600">Pending Assignments</p>
            <p className="text-lg sm:text-xl font-bold text-amber-700">{stats.pendingAssignments}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-purple-600">Pending Theory</p>
            <p className="text-lg sm:text-xl font-bold text-purple-700">{stats.pendingTheory}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-green-600">Graded Today</p>
            <p className="text-lg sm:text-xl font-bold text-green-700">{stats.gradedToday}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-blue-600">Avg Score</p>
            <p className="text-lg sm:text-xl font-bold text-blue-700">{stats.averageScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Scale Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Grade Scale:</span>
            <Badge className="bg-green-100 text-green-700 text-xs">A: 80-100%</Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">B: 70-79%</Badge>
            <Badge className="bg-yellow-100 text-yellow-700 text-xs">C: 60-69%</Badge>
            <Badge className="bg-orange-100 text-orange-700 text-xs">P: 50-59%</Badge>
            <Badge className="bg-red-100 text-red-700 text-xs">F: 0-49%</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 sm:h-10 text-sm"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="assignments" className="data-[state=active]:border-blue-600 rounded-none px-4 py-2 text-sm whitespace-nowrap">
            <FileText className="h-4 w-4 mr-2" />
            Assignments
            {stats.pendingAssignments > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700 text-xs">{stats.pendingAssignments}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="theory" className="data-[state=active]:border-blue-600 rounded-none px-4 py-2 text-sm whitespace-nowrap">
            <MonitorPlay className="h-4 w-4 mr-2" />
            Theory Answers
            {stats.pendingTheory > 0 && (
              <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs">{stats.pendingTheory}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="graded" className="data-[state=active]:border-blue-600 rounded-none px-4 py-2 text-sm whitespace-nowrap">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Recently Graded
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading submissions...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending assignment submissions</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAssignments.map((submission) => (
                  <div key={submission.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-800">{submission.assignment?.title}</p>
                            <Badge variant="outline" className="text-xs">{submission.assignment?.subject}</Badge>
                            <Badge className="text-xs">{submission.student?.class}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <User className="inline h-3.5 w-3.5 mr-1" />
                            {submission.student?.full_name} • VIN: {submission.student?.vin_id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="inline h-3 w-3 mr-1" />
                            Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleGradeSubmission(submission)} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                        Grade Now <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Theory Tab */}
        <TabsContent value="theory">
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading theory answers...</p>
              </div>
            ) : filteredTheory.length === 0 ? (
              <div className="text-center py-12">
                <MonitorPlay className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending theory answers</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTheory.map((answer) => (
                  <div key={answer.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-800">{answer.attempt?.exam?.title}</p>
                            <Badge variant="outline" className="text-xs">{answer.attempt?.exam?.subject}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <User className="inline h-3.5 w-3.5 mr-1" />
                            {answer.attempt?.student?.full_name}
                          </p>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                            <span className="font-medium">Q:</span> {answer.question?.question_text}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            <span className="font-medium">A:</span> {answer.answer_text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <Star className="inline h-3 w-3 mr-1" />
                            Max Points: {answer.question?.points}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleGradeTheory(answer)} className="bg-purple-600 hover:bg-purple-700 shrink-0">
                        Grade Answer <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Graded Tab */}
        <TabsContent value="graded">
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              {gradedSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recently graded submissions</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs sm:text-sm">Student</TableHead>
                      <TableHead className="text-xs sm:text-sm">Assignment</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Score</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Grade</TableHead>
                      <TableHead className="text-xs sm:text-sm">Graded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradedSubmissions.map((sub) => {
                      const maxMarks = sub.assignment?.total_marks || 100
                      const percentage = ((sub.grade || 0) / maxMarks) * 100
                      const letterGrade = calculateGrade(percentage)
                      
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="text-xs sm:text-sm">{sub.student?.full_name}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{sub.assignment?.title}</TableCell>
                          <TableCell className="text-center text-xs sm:text-sm font-semibold">
                            {sub.grade}/{maxMarks}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-xs", getGradeColor(letterGrade))}>{letterGrade}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {sub.graded_at ? new Date(sub.graded_at).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Grading Dialog */}
      <Dialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Assignment</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.student?.full_name} - {selectedSubmission?.assignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedSubmission?.submission_text && (
              <div>
                <Label className="text-sm font-semibold">Student's Answer:</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm max-h-48 overflow-y-auto">
                  {selectedSubmission.submission_text}
                </div>
              </div>
            )}
            
            {selectedSubmission?.file_url && (
              <div>
                <Label className="text-sm font-semibold">Attached File:</Label>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" /> View Attachment
                  </a>
                </Button>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-semibold">Grade</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  type="number"
                  min="0"
                  max={selectedSubmission?.assignment?.total_marks || 100}
                  step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  / {selectedSubmission?.assignment?.total_marks || 100} marks
                </span>
                {grade > 0 && (
                  <Badge className={getGradeColor(calculateGrade((grade / (selectedSubmission?.assignment?.total_marks || 100)) * 100))}>
                    {calculateGrade((grade / (selectedSubmission?.assignment?.total_marks || 100)) * 100)}
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-semibold">Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradingDialog(false)}>Cancel</Button>
            <Button onClick={saveAssignmentGrade} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theory Grading Dialog */}
      <Dialog open={showTheoryDialog} onOpenChange={setShowTheoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Theory Answer</DialogTitle>
            <DialogDescription>
              {selectedTheory?.attempt?.student?.full_name} - {selectedTheory?.attempt?.exam?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-semibold">Question:</Label>
              <div className="mt-2 p-4 bg-blue-50 rounded-lg text-sm">
                {selectedTheory?.question?.question_text}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-semibold">Student's Answer:</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm max-h-64 overflow-y-auto">
                {selectedTheory?.answer_text}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-semibold">Points to Award</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  type="number"
                  min="0"
                  max={selectedTheory?.question?.points || 10}
                  step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  / {selectedTheory?.question?.points || 10} points
                </span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-semibold">Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback on this answer..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTheoryDialog(false)}>Cancel</Button>
            <Button onClick={saveTheoryGrade} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}