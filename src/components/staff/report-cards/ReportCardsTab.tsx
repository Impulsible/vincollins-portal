// components/staff/report-cards/ReportCardsTab.tsx - COMPLETE
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { 
  FileCheck, Search, Eye, Printer, CheckCircle2, Clock,
  Loader2, FileText, Send, RefreshCw, Sparkles,
  ChevronRight, Brain
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================
// TYPES
// ============================================
interface SubjectScore {
  subject: string
  ca1: number
  ca2: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface ReportCard {
  id: string
  student_id: string
  class: string
  term: string
  academic_year: string
  session_year: string
  subject_scores: SubjectScore[]
  total_score: number
  average_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  admin_comments: string
  status: 'draft' | 'pending' | 'approved' | 'published'
  published_at: string | null
  generated_by: string
  generated_at: string
  attendance_summary: { total_days: number; present: number; absent: number }
  affective_traits: Record<string, string>
  psychomotor_skills: Record<string, string>
  student?: { full_name: string; vin_id: string; gender?: string }
}

interface ReportCardsTabProps {
  staffProfile: any
  termInfo: any
}

// ============================================
// CONSTANTS
// ============================================
const TERM_OPTIONS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const calculateGrade = (total: number): string => {
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  if (total >= 50) return 'P'
  return 'F'
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
    case 'B': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    case 'C': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
    case 'P': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
    case 'F': return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

const getTermLabel = (term?: string): string => {
  if (!term) return 'Third Term'
  const terms: Record<string, string> = { first: 'First Term', second: 'Second Term', third: 'Third Term' }
  return terms[term] || term
}

// ============================================
// AI COMMENT GENERATION FUNCTION
// ============================================
const generateAIComments = async (
  studentName: string,
  averageScore: number,
  subjects: { name: string; score: number }[],
  className: string,
  gender?: string
) => {
  try {
    const response = await fetch('/api/generate-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        averageScore,
        subjects,
        className,
        gender
      })
    })
    
    if (!response.ok) throw new Error('Failed to generate comments')
    
    const data = await response.json()
    return {
      teacher_comment: data.teacher_comment,
      principal_comment: data.principal_comment
    }
  } catch (error) {
    console.error('Error generating AI comments:', error)
    throw error
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ReportCardsTab({ staffProfile, termInfo }: ReportCardsTabProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState(termInfo?.termCode || 'third')
  const [selectedYear, setSelectedYear] = useState(termInfo?.sessionYear || '2025/2026')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [students, setStudents] = useState<any[]>([])
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  
  const [teacherComments, setTeacherComments] = useState('')
  const [principalComments, setPrincipalComments] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null)

  const [stats, setStats] = useState({
    total: 0, draft: 0, pending: 0, approved: 0, published: 0
  })

  useEffect(() => {
    setMounted(true)
    loadReportCards()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
    } else {
      setStudents([])
    }
  }, [selectedClass])

  useEffect(() => {
    if (mounted) {
      loadReportCards()
    }
  }, [selectedTerm, selectedYear, selectedClass])

  // ============================================
  // LOAD STUDENTS FROM DATABASE
  // ============================================
  const loadStudents = async () => {
    if (!selectedClass) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, class, vin_id, gender')
        .eq('role', 'student')
        .eq('class', selectedClass)
        .order('full_name', { ascending: true })
      
      if (error) throw error
      
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    }
  }

  // ============================================
  // LOAD REPORT CARDS FROM DATABASE
  // ============================================
  const loadReportCards = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('report_cards')
        .select(`*`)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .order('generated_at', { ascending: false })
      
      if (selectedClass) {
        query = query.eq('class', selectedClass)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      const reportCardsWithStudents = await Promise.all(
        (data || []).map(async (card: any) => {
          const { data: studentData } = await supabase
            .from('profiles')
            .select('full_name, vin_id, gender')
            .eq('id', card.student_id)
            .single()
          
          return {
            ...card,
            student: studentData || { full_name: 'Unknown', vin_id: '' }
          }
        })
      )
      
      setReportCards(reportCardsWithStudents)
      setStats({
        total: reportCardsWithStudents.length,
        draft: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'draft').length,
        pending: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'pending').length,
        approved: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'approved').length,
        published: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'published').length
      })
    } catch (error) {
      console.error('Error loading report cards:', error)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // // ============================================
// HANDLE AI COMMENT GENERATION - FIXED
// ============================================
const handleGenerateAIComments = async () => {
    if (!selectedStudentData) {
      toast.error('Please select a student first')
      return
    }
    
    setGeneratingAI(true)
    
    // Define averageScore in the outer scope
    let averageScore = 0
    
    try {
      const { data: caScores, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', selectedStudent)
        .eq('term', selectedTerm)
        .eq('session_year', selectedYear)
      
      if (scoresError) throw scoresError
      
      let totalScore = 0
      const subjects: { name: string; score: number }[] = []
      
      if (caScores && caScores.length > 0) {
        caScores.forEach((score: any) => {
          const subjectTotal = (score.ca1_score || 0) + (score.ca2_score || 0) + (score.exam_score || 0)
          subjects.push({
            name: score.subject,
            score: subjectTotal
          })
          totalScore += subjectTotal
        })
      }
      
      averageScore = subjects.length > 0 
        ? Math.round((totalScore / subjects.length) * 10) / 10
        : 0
      
      const comments = await generateAIComments(
        selectedStudentData.full_name,
        averageScore,
        subjects,
        selectedClass,
        selectedStudentData.gender
      )
      
      setTeacherComments(comments.teacher_comment)
      setPrincipalComments(comments.principal_comment)
      toast.success('AI comments generated successfully!')
    } catch (error) {
      console.error('Error generating AI comments:', error)
      toast.error('Failed to generate AI comments. Using default template.')
      
      // FIXED: averageScore is now accessible here because it's in the outer scope
      const studentName = selectedStudentData?.full_name || 'Student'
      setTeacherComments(`${studentName} has shown satisfactory performance this term with an average of ${averageScore}%. Continue to work hard and strive for excellence.`)
      setPrincipalComments('Keep up the good work and maintain your focus on academic excellence.')
    } finally {
      setGeneratingAI(false)
    }
  }

  // ============================================
  // GENERATE REPORT CARD
  // ============================================
  const generateReportCard = async () => {
    if (!selectedStudent) { 
      toast.error('Please select a student')
      return 
    }
    
    setGenerating(true)
    try {
      const { data: caScores, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', selectedStudent)
        .eq('term', selectedTerm)
        .eq('session_year', selectedYear)
      
      if (scoresError) throw scoresError
      
      const subjectScores: SubjectScore[] = []
      let totalScore = 0
      
      if (caScores && caScores.length > 0) {
        caScores.forEach((score: any) => {
          const ca1 = score.ca1_score || 0
          const ca2 = score.ca2_score || 0
          const exam = score.exam_score || 0
          const subjectTotal = ca1 + ca2 + exam
          
          subjectScores.push({
            subject: score.subject,
            ca1, ca2, exam,
            total: subjectTotal,
            grade: calculateGrade(subjectTotal),
            remark: score.remark || ''
          })
          totalScore += subjectTotal
        })
      }
      
      const averageScore = subjectScores.length > 0 
        ? totalScore / subjectScores.length 
        : 0
      
      const { data: studentData } = await supabase
        .from('profiles')
        .select('full_name, class, vin_id, gender')
        .eq('id', selectedStudent)
        .single()
      
      const finalTeacherComments = teacherComments || 
        `${studentData?.full_name || 'Student'} has shown satisfactory performance this term.`
      const finalPrincipalComments = principalComments || 
        'Keep working hard and striving for excellence.'
      
      const reportCardData = {
        student_id: selectedStudent,
        class: studentData?.class || selectedClass,
        term: selectedTerm,
        academic_year: selectedYear,
        session_year: selectedYear,
        subject_scores: subjectScores,
        total_score: totalScore,
        average_score: averageScore,
        grade: calculateGrade(averageScore),
        teacher_comments: finalTeacherComments,
        principal_comments: finalPrincipalComments,
        admin_comments: '',
        status: 'draft',
        published_at: null,
        attendance_summary: { total_days: 90, present: 85, absent: 5 },
        affective_traits: { 
          punctuality: 'Excellent', 
          neatness: 'Very Good', 
          politeness: 'Excellent', 
          cooperation: 'Very Good', 
          leadership: 'Good' 
        },
        psychomotor_skills: { 
          handwriting: 'Good', 
          sports: 'Active', 
          crafts: 'Good', 
          fluency: 'Very Good' 
        },
        class_teacher: staffProfile?.full_name || 'Teacher',
        school_name: 'Vincollins College',
        generated_by: staffProfile?.id,
        generated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('report_cards')
        .insert([reportCardData])
        .select()
        .single()
      
      if (error) throw error
      
      toast.success('Report card generated successfully!')
      setSelectedReportCard({
        ...data,
        student: studentData || { full_name: 'Unknown', vin_id: '' }
      })
      setShowPreviewDialog(true)
      setShowGenerateDialog(false)
      setTeacherComments('')
      setPrincipalComments('')
      loadReportCards()
    } catch (error: any) {
      console.error('Error generating report card:', error)
      toast.error(error.message || 'Failed to generate report card')
    } finally {
      setGenerating(false)
    }
  }

  const updateReportCardStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status }
      if (status === 'published') updates.published_at = new Date().toISOString()
      
      const { error } = await supabase
        .from('report_cards')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      
      toast.success(`Report card ${status}`)
      loadReportCards()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadReportCards()
    toast.success('Report cards refreshed')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': 
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Draft</Badge>
      case 'pending': 
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved': 
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
      case 'published': 
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      default: 
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredReportCards = reportCards.filter((r: ReportCard) =>
    r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.student?.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePrint = () => window.print()

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId)
    const student = students.find(s => s.id === studentId)
    setSelectedStudentData(student)
    setTeacherComments('')
    setPrincipalComments('')
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Report Cards</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and manage student report cards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
            <FileCheck className="h-4 w-4 mr-2" />Generate
          </Button>
        </div>
      </div>

      {/* Grade Scale */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Grade Scale:</span>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-xs">A: 80-100</Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-xs">B: 70-79</Badge>
            <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 text-xs">C: 60-69</Badge>
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 text-xs">P: 50-59</Badge>
            <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs">F: 0-49</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-800"><CardContent className="p-3 text-center"><p className="text-xs text-gray-600 dark:text-gray-400">Draft</p><p className="text-xl font-bold">{stats.draft}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-yellow-50 dark:bg-yellow-950/20"><CardContent className="p-3 text-center"><p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p><p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/20"><CardContent className="p-3 text-center"><p className="text-xs text-blue-600 dark:text-blue-400">Approved</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.approved}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/20"><CardContent className="p-3 text-center"><p className="text-xs text-green-600 dark:text-green-400">Published</p><p className="text-xl font-bold text-green-700 dark:text-green-400">{stats.published}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Academic Year</Label>
              <Input 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                placeholder="e.g., 2025/2026" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0">
          <TabsTrigger value="generate" className="data-[state=active]:border-purple-600 rounded-none px-4 py-2">Generate</TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:border-purple-600 rounded-none px-4 py-2">View All</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Generate New Report Card</CardTitle>
              <CardDescription>Select a student to generate their report card</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <Select value={selectedStudent} onValueChange={handleStudentSelect} disabled={!selectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedClass ? "Select student" : "Select a class first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name} {s.vin_id ? `(${s.vin_id})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedClass && (
                    <p className="text-xs text-amber-600 mt-1">Please select a class first</p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => setShowGenerateDialog(true)} 
                    disabled={!selectedStudent} 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view">
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle>All Report Cards</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search student..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="pl-10 h-9" 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                  <p className="text-gray-500">Loading report cards...</p>
                </div>
              ) : filteredReportCards.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No report cards found</p>
                  <Button variant="link" onClick={() => setActiveTab('generate')} className="mt-2">
                    Generate a report card
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReportCards.map((r: ReportCard) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{r.student?.full_name}</p>
                              <p className="text-xs text-gray-500">{r.student?.vin_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{r.class}</TableCell>
                          <TableCell>
                            <span className="font-semibold">{r.average_score?.toFixed(1)}%</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(r.grade)}>{r.grade}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedReportCard(r); setShowPreviewDialog(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {r.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => updateReportCardStatus(r.id, 'pending')}>
                                    <Send className="h-4 w-4 mr-2" />Submit for Approval
                                  </DropdownMenuItem>
                                )}
                                {r.status === 'approved' && (
                                  <DropdownMenuItem onClick={() => updateReportCardStatus(r.id, 'published')}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />Publish
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handlePrint}>
                                  <Printer className="h-4 w-4 mr-2" />Print
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Generate Report Card
            </DialogTitle>
            <DialogDescription>
              Enter teacher comments or use AI to generate them automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI-Powered Comments</p>
                  <p className="text-xs text-muted-foreground">
                    Generate personalized comments based on student performance
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerateAIComments}
                disabled={generatingAI || !selectedStudentData}
                className="border-purple-300 hover:bg-purple-50"
              >
                {generatingAI ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" />Generate AI Comments</>
                )}
              </Button>
            </div>

            <div>
              <Label>Teacher Comments</Label>
              <Textarea 
                value={teacherComments} 
                onChange={(e) => setTeacherComments(e.target.value)} 
                placeholder="Enter your comments about the student's performance..." 
                rows={4} 
                className="mt-1"
              />
            </div>

            <div>
              <Label>Principal Comments</Label>
              <Textarea 
                value={principalComments} 
                onChange={(e) => setPrincipalComments(e.target.value)} 
                placeholder="Principal's remarks..." 
                rows={3} 
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={generateReportCard} disabled={generating} className="bg-purple-600 hover:bg-purple-700">
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                'Generate Report Card'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Card Preview</DialogTitle>
            <DialogDescription>
              {selectedReportCard?.student?.full_name} - {getTermLabel(selectedReportCard?.term)} {selectedReportCard?.academic_year}
            </DialogDescription>
          </DialogHeader>
          {selectedReportCard && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p><strong>Student:</strong> {selectedReportCard.student?.full_name}</p>
                <p><strong>Class:</strong> {selectedReportCard.class}</p>
                <p><strong>Average:</strong> {selectedReportCard.average_score?.toFixed(1)}%</p>
                <p><strong>Grade:</strong> <Badge className={getGradeColor(selectedReportCard.grade)}>{selectedReportCard.grade}</Badge></p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Subject Scores</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">CA1</TableHead>
                        <TableHead className="text-center">CA2</TableHead>
                        <TableHead className="text-center">Exam</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReportCard.subject_scores?.map((s: SubjectScore, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{s.subject}</TableCell>
                          <TableCell className="text-center">{s.ca1}</TableCell>
                          <TableCell className="text-center">{s.ca2}</TableCell>
                          <TableCell className="text-center">{s.exam}</TableCell>
                          <TableCell className="text-center font-semibold">{s.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(s.grade)}>{s.grade}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Teacher's Comments</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedReportCard.teacher_comments || 'No comments'}</p>
              </div>
              
              {selectedReportCard.principal_comments && (
                <div>
                  <h4 className="font-semibold mb-2">Principal's Comments</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedReportCard.principal_comments}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Close</Button>
            <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}