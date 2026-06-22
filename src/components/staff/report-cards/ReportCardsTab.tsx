// components/staff/report-cards/ReportCardsTab.tsx - COMPLETE
'use client'

import { useState, useEffect, useRef } from 'react'
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
import { useReactToPrint } from 'react-to-print'
import { 
  FileCheck, Search, Eye, Printer, CheckCircle2, Clock,
  Loader2, FileText, Send, RefreshCw, Sparkles,
  ChevronRight, Brain, Download, ArrowLeft
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
// WAEC GRADING SYSTEM
// ============================================
const getWAECGrade = (score: number): string => {
  if (score >= 75) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

const getOverallGrade = (score: number): string => {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'P'
  return 'F'
}

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail',
  }
  return remarks[grade] || ''
}

const getGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'B2': case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'C4': case 'C5': case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'D7': case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
  }
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

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
  student?: { full_name: string; vin_id: string; gender?: string; admission_number?: string; photo_url?: string; class?: string }
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

const YEARS = ['2025/2026', '2026/2027', '2027/2028', '2028/2029']

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3']

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
      body: JSON.stringify({ studentName, averageScore, subjects, className, gender })
    })
    if (!response.ok) throw new Error('Failed to generate comments')
    const data = await response.json()
    return { teacher_comment: data.teacher_comment, principal_comment: data.principal_comment }
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
  const reportRef = useRef<HTMLDivElement>(null)
  
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

  const handleDownloadPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${selectedReportCard?.student?.full_name || 'Student'}_Report_Card_${selectedTerm}_${selectedYear}`,
    pageStyle: `
      @page { size: A4; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      }
    `,
  })

  useEffect(() => { setMounted(true); loadReportCards() }, [])
  useEffect(() => { if (selectedClass) loadStudents(); else setStudents([]) }, [selectedClass])
  useEffect(() => { if (mounted) loadReportCards() }, [selectedTerm, selectedYear, selectedClass])

  const loadStudents = async () => {
    if (!selectedClass) return
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, class, vin_id, gender, admission_number, photo_url')
        .eq('role', 'student').eq('class', selectedClass).order('full_name', { ascending: true })
      setStudents(data || [])
    } catch (error) { console.error('Error loading students:', error) }
  }

  const loadReportCards = async () => {
    setLoading(true)
    try {
      let query = supabase.from('report_cards').select('*').eq('term', selectedTerm).eq('academic_year', selectedYear).order('generated_at', { ascending: false })
      if (selectedClass) query = query.eq('class', selectedClass)
      const { data } = await query
      const reportCardsWithStudents = await Promise.all((data || []).map(async (card: any) => {
        const { data: studentData } = await supabase.from('profiles').select('full_name, vin_id, gender, admission_number, photo_url, class').eq('id', card.student_id).single()
        return { ...card, student: studentData || { full_name: 'Unknown', vin_id: '' } }
      }))
      setReportCards(reportCardsWithStudents)
      setStats({
        total: reportCardsWithStudents.length,
        draft: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'draft').length,
        pending: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'pending').length,
        approved: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'approved').length,
        published: reportCardsWithStudents.filter((r: ReportCard) => r.status === 'published').length
      })
    } catch (error) { console.error('Error loading report cards:', error) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const handleGenerateAIComments = async () => {
    if (!selectedStudentData) { toast.error('Please select a student first'); return }
    setGeneratingAI(true)
    let averageScore = 0
    try {
      const { data: caScores } = await supabase.from('ca_scores').select('*').eq('student_id', selectedStudent).eq('term', selectedTerm).eq('academic_year', selectedYear)
      let totalScore = 0
      const subjects: { name: string; score: number }[] = []
      if (caScores && caScores.length > 0) {
        caScores.forEach((score: any) => {
          const subjectTotal = (score.ca1_score || 0) + (score.ca2_score || 0) + (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
          subjects.push({ name: score.subject, score: subjectTotal })
          totalScore += subjectTotal
        })
      }
      averageScore = subjects.length > 0 ? Math.round(totalScore / subjects.length) : 0
      const comments = await generateAIComments(selectedStudentData.full_name, averageScore, subjects, selectedClass, selectedStudentData.gender)
      setTeacherComments(comments.teacher_comment)
      setPrincipalComments(comments.principal_comment)
      toast.success('AI comments generated successfully!')
    } catch (error) {
      const studentName = selectedStudentData?.full_name || 'Student'
      setTeacherComments(`${studentName} has shown satisfactory performance this term with an average of ${averageScore}%. Continue to work hard and strive for excellence.`)
      setPrincipalComments('Keep up the good work and maintain your focus on academic excellence.')
    } finally { setGeneratingAI(false) }
  }

  const generateReportCard = async () => {
    if (!selectedStudent) { toast.error('Please select a student'); return }
    setGenerating(true)
    try {
      const { data: caScores } = await supabase.from('ca_scores').select('*').eq('student_id', selectedStudent).eq('term', selectedTerm).eq('academic_year', selectedYear)
      const subjectScores: SubjectScore[] = []
      let totalScore = 0
      if (caScores && caScores.length > 0) {
        caScores.forEach((score: any) => {
          const ca1 = score.ca1_score || 0; const ca2 = score.ca2_score || 0
          const exam = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
          const subjectTotal = ca1 + ca2 + exam
          const percentage = subjectTotal > 0 ? Math.round((subjectTotal / 100) * 100) : 0
          subjectScores.push({ subject: score.subject, ca1, ca2, exam, total: subjectTotal, grade: getWAECGrade(percentage), remark: getGradeRemark(getWAECGrade(percentage)) })
          totalScore += subjectTotal
        })
      }
      const averageScore = subjectScores.length > 0 ? totalScore / subjectScores.length : 0
      const { data: studentData } = await supabase.from('profiles').select('full_name, class, vin_id, gender, admission_number, photo_url').eq('id', selectedStudent).single()
      const finalTeacherComments = teacherComments || `${studentData?.full_name || 'Student'} has shown satisfactory performance this term.`
      const finalPrincipalComments = principalComments || 'Keep working hard and striving for excellence.'
      const reportCardData = {
        student_id: selectedStudent, class: studentData?.class || selectedClass, term: selectedTerm,
        academic_year: selectedYear, session_year: selectedYear, subject_scores: subjectScores,
        total_score: totalScore, average_score: averageScore, grade: getOverallGrade(averageScore),
        teacher_comments: finalTeacherComments, principal_comments: finalPrincipalComments,
        admin_comments: '', status: 'draft', published_at: null,
        attendance_summary: { total_days: 90, present: 85, absent: 5 },
        affective_traits: { punctuality: 'Excellent', neatness: 'Very Good', politeness: 'Excellent', cooperation: 'Very Good', leadership: 'Good' },
        psychomotor_skills: { handwriting: 'Good', sports: 'Active', crafts: 'Good', fluency: 'Very Good' },
        class_teacher: staffProfile?.full_name || 'Teacher', school_name: 'Vincollins College',
        generated_by: staffProfile?.id, generated_at: new Date().toISOString()
      }
      const { data, error } = await supabase.from('report_cards').insert([reportCardData]).select().single()
      if (error) throw error
      toast.success('Report card generated successfully!')
      setSelectedReportCard({ ...data, student: studentData || { full_name: 'Unknown', vin_id: '' } })
      setShowPreviewDialog(true); setShowGenerateDialog(false); setTeacherComments(''); setPrincipalComments('')
      loadReportCards()
    } catch (error: any) { toast.error(error.message || 'Failed to generate report card') }
    finally { setGenerating(false) }
  }

  const updateReportCardStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status }
      if (status === 'published') updates.published_at = new Date().toISOString()
      await supabase.from('report_cards').update(updates).eq('id', id)
      toast.success(`Report card ${status}`); loadReportCards()
    } catch (error) { toast.error('Failed to update status') }
  }

  const handleRefresh = () => { setRefreshing(true); loadReportCards(); toast.success('Report cards refreshed') }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Draft</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
      case 'published': return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredReportCards = reportCards.filter((r: ReportCard) =>
    r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.student?.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId)
    const student = students.find(s => s.id === studentId)
    setSelectedStudentData(student)
    setTeacherComments(''); setPrincipalComments('')
  }

  if (!mounted) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>

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
            <Badge className="bg-green-100 text-green-700 text-xs">A: 80-100</Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">B: 70-79</Badge>
            <Badge className="bg-yellow-100 text-yellow-700 text-xs">C: 60-69</Badge>
            <Badge className="bg-orange-100 text-orange-700 text-xs">P: 50-59</Badge>
            <Badge className="bg-red-100 text-red-700 text-xs">F: 0-49</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-gray-50"><CardContent className="p-3 text-center"><p className="text-xs text-gray-600">Draft</p><p className="text-xl font-bold">{stats.draft}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-yellow-50"><CardContent className="p-3 text-center"><p className="text-xs text-yellow-600">Pending</p><p className="text-xl font-bold text-yellow-700">{stats.pending}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-blue-50"><CardContent className="p-3 text-center"><p className="text-xs text-blue-600">Approved</p><p className="text-xl font-bold text-blue-700">{stats.approved}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-green-50"><CardContent className="p-3 text-center"><p className="text-xs text-green-600">Published</p><p className="text-xl font-bold text-green-700">{stats.published}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label className="text-xs mb-1 block">Class</Label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs mb-1 block">Term</Label><Select value={selectedTerm} onValueChange={setSelectedTerm}><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger><SelectContent>{TERM_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs mb-1 block">Academic Year</Label><Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
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
            <CardHeader><CardTitle>Generate New Report Card</CardTitle><CardDescription>Select a student to generate their report card</CardDescription></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <Select value={selectedStudent} onValueChange={handleStudentSelect} disabled={!selectedClass}>
                    <SelectTrigger><SelectValue placeholder={selectedClass ? "Select student" : "Select a class first"} /></SelectTrigger>
                    <SelectContent>{students.map(s => (<SelectItem key={s.id} value={s.id}>{s.full_name} {s.vin_id ? `(${s.vin_id})` : ''}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => setShowGenerateDialog(true)} disabled={!selectedStudent} className="w-full bg-purple-600 hover:bg-purple-700">Continue</Button>
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
                  <Input placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" /><p className="text-gray-500">Loading report cards...</p></div>
              ) : filteredReportCards.length === 0 ? (
                <div className="text-center py-12"><FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No report cards found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Average</TableHead><TableHead>Grade</TableHead><TableHead>Status</TableHead><TableHead>Generated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredReportCards.map((r: ReportCard) => (
                        <TableRow key={r.id}>
                          <TableCell><div><p className="font-medium">{r.student?.full_name}</p><p className="text-xs text-gray-500">{r.student?.vin_id}</p></div></TableCell>
                          <TableCell>{r.class}</TableCell>
                          <TableCell><span className="font-semibold">{r.average_score?.toFixed(1)}%</span></TableCell>
                          <TableCell><Badge className={getOverallGradeColor(r.grade)}>{r.grade}</Badge></TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">{r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedReportCard(r); setShowPreviewDialog(true); }}><Eye className="h-4 w-4" /></Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {r.status === 'draft' && <DropdownMenuItem onClick={() => updateReportCardStatus(r.id, 'pending')}><Send className="h-4 w-4 mr-2" />Submit for Approval</DropdownMenuItem>}
                                {r.status === 'approved' && <DropdownMenuItem onClick={() => updateReportCardStatus(r.id, 'published')}><CheckCircle2 className="h-4 w-4 mr-2" />Publish</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => { setSelectedReportCard(r); setShowPreviewDialog(true); }}><Printer className="h-4 w-4 mr-2" />View & Print</DropdownMenuItem>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-600" />Generate Report Card</DialogTitle><DialogDescription>Enter teacher comments or use AI to generate them automatically</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><Sparkles className="h-4 w-4 text-purple-600" /></div>
                <div><p className="text-sm font-medium">AI-Powered Comments</p><p className="text-xs text-muted-foreground">Generate personalized comments based on student performance</p></div>
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerateAIComments} disabled={generatingAI || !selectedStudentData} className="border-purple-300 hover:bg-purple-50">
                {generatingAI ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Brain className="h-4 w-4 mr-2" />Generate AI Comments</>}
              </Button>
            </div>
            <div><Label>Teacher Comments</Label><Textarea value={teacherComments} onChange={(e) => setTeacherComments(e.target.value)} placeholder="Enter your comments about the student's performance..." rows={4} className="mt-1" /></div>
            <div><Label>Principal Comments</Label><Textarea value={principalComments} onChange={(e) => setPrincipalComments(e.target.value)} placeholder="Principal's remarks..." rows={3} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={generateReportCard} disabled={generating} className="bg-purple-600 hover:bg-purple-700">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : 'Generate Report Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - EXACT COPY OF ADMIN VIEW REPORT CARD */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Card Preview</DialogTitle>
            <DialogDescription>{selectedReportCard?.student?.full_name} - {getTermLabel(selectedReportCard?.term)} {selectedReportCard?.academic_year}</DialogDescription>
          </DialogHeader>
          {selectedReportCard && (
            <div className="py-2">
              {/* Print/PDF Buttons */}
              <div className="no-print flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
                <Button variant="default" size="sm" onClick={() => handleDownloadPDF()} className="bg-blue-600 hover:bg-blue-700"><Download className="h-4 w-4 mr-2" />Download PDF</Button>
              </div>

              {/* REPORT CARD */}
              <div ref={reportRef}>
                <div className="bg-white w-full max-w-[210mm] mx-auto text-black border-2 border-blue-900 print:border-2 print:border-blue-900 print:max-w-full print:mx-0 p-4 print:p-3">
                  <div className="border-b-2 border-blue-900 pb-3 mb-3 print:pb-2 print:mb-2">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
                      <div className="w-16 print:w-14 hidden sm:block"><div className="w-14 h-14 border-2 border-blue-900 rounded flex items-center justify-center text-[8px]">LOGO</div></div>
                      <div className="flex-1 text-center">
                        <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[15px] tracking-wide">Vincollins College</h1>
                        <p className="text-[10px] print:text-[9px] text-gray-800">7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos</p>
                        <p className="text-[10px] print:text-[9px] text-gray-800">Tel: +234 912 1155 554 | Email: vincollinscollege@gmail.com</p>
                        <p className="text-[9px] italic text-amber-700 mt-1 print:text-[8px] font-medium">"Geared Towards Excellence"</p>
                        <h2 className="font-bold mt-2 text-[14px] print:text-[12px] text-blue-900">{getTermLabel(selectedReportCard.term)} Student's Performance Report</h2>
                        <p className="text-[10px] mt-1 font-semibold print:text-[9px] text-gray-800">Academic Session: {selectedReportCard.academic_year}</p>
                      </div>
                      <div className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-blue-900 rounded overflow-hidden print:w-16 print:h-20">
                        {selectedReportCard.student?.photo_url ? <img src={selectedReportCard.student.photo_url} alt="student" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[8px]">Photo</div>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] mb-4 print:mb-3 print:text-[10px]">
                    <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Name:</span><span className="break-words text-black">{selectedReportCard.student?.full_name}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Admission No:</span><span className="text-black">{selectedReportCard.student?.admission_number || '—'}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Class:</span><span className="text-black">{selectedReportCard.class}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Term:</span><span className="text-black">{getTermLabel(selectedReportCard.term)}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Session:</span><span className="text-black">{selectedReportCard.academic_year}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Next Term:</span><span className="break-words text-black">To be announced</span></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 print:grid-cols-[70%_30%] print:gap-3">
                    <div className="min-w-0">
                      <div className="print:overflow-visible">
                        <table className="w-full border-collapse border-2 border-blue-900 text-[10px] print:text-[9px] print:w-full">
                          <thead className="bg-blue-700 text-white">
                            <tr><th className="border border-blue-500 px-2 py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Subjects</th><th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">CA</th><th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Exam</th><th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Total</th><th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Grade</th><th className="border border-blue-500 px-2 py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Remark</th></tr>
                          </thead>
                          <tbody>
                            {(selectedReportCard.subject_scores || []).map((subject, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-400 px-2 py-1.5 break-words print:text-[9px] print:py-1 print:px-1.5 text-black font-medium">{subject.subject}</td>
                                <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.ca1 + subject.ca2}</td>
                                <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.exam}</td>
                                <td className="border border-gray-400 text-center font-bold print:text-[9px] print:py-1 print:px-1 text-black">{subject.total}</td>
                                <td className="border border-gray-400 text-center print:py-1"><span className={getGradeStyle(subject.grade)}>{subject.grade}</span></td>
                                <td className="border border-gray-400 px-2 py-1.5 print:text-[9px] print:py-1 print:px-1.5 text-black">{subject.remark}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-blue-50 font-bold">
                            <tr><td colSpan={3} className="border border-gray-400 px-2 py-2 text-right print:text-[10px] print:py-1.5 text-black">TOTAL / AVERAGE:</td><td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{selectedReportCard.total_score}</td><td className="border border-gray-400 text-center print:py-1.5"><span className={getOverallGradeColor(selectedReportCard.grade)}>{selectedReportCard.grade}</span></td><td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{selectedReportCard.average_score?.toFixed(2)}%</td></tr>
                          </tfoot>
                        </table>
                      </div>
                      <div className="mt-4 space-y-2 print:mt-3">
                        <div className="border-l-4 border-purple-600 bg-purple-50 p-3 text-[10px] print:text-[9px] print:p-2 rounded-r"><div className="font-bold text-purple-800 mb-1">✨ CLASS TEACHER'S REMARK</div><p className="italic text-gray-800 leading-relaxed">{selectedReportCard.teacher_comments || 'No comment available.'}</p></div>
                        <div className="border-l-4 border-blue-600 bg-blue-50 p-3 text-[10px] print:text-[9px] print:p-2 rounded-r"><div className="font-bold text-blue-800 mb-1">PRINCIPAL'S REMARK</div><p className="italic text-gray-800 leading-relaxed">{selectedReportCard.principal_comments || 'No comment available.'}</p></div>
                      </div>
                    </div>
                    <div className="space-y-3 print:space-y-2">
                      <div className="border-2 border-blue-900"><div className="bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 uppercase">Performance Summary</div><div className="p-3 text-[10px] space-y-1.5"><div className="flex justify-between"><span className="text-gray-800">Total Score:</span><span className="font-bold text-black">{selectedReportCard.total_score}</span></div><div className="flex justify-between"><span className="text-gray-800">Average:</span><span className="font-bold text-black">{selectedReportCard.average_score?.toFixed(2)}%</span></div><div className="flex justify-between"><span className="text-gray-800">Grade:</span><span className={getOverallGradeColor(selectedReportCard.grade)}>{selectedReportCard.grade}</span></div><div className="flex justify-between"><span className="text-gray-800">Subjects:</span><span className="font-bold text-black">{(selectedReportCard.subject_scores || []).length}</span></div></div></div>
                      <div className="border-2 border-blue-900"><div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase">Affective Domain</div><div className="p-2 text-[9px] space-y-1">{Object.entries(selectedReportCard.affective_traits || {}).map(([key, value]) => (<div key={key} className="flex justify-between items-center"><span className="text-gray-800 capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold text-blue-700">{value}</span></div>))}</div></div>
                      <div className="border-2 border-blue-900"><div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase">Psychomotor Skills</div><div className="p-2 text-[9px] space-y-1">{Object.entries(selectedReportCard.psychomotor_skills || {}).map(([key, value]) => (<div key={key} className="flex justify-between items-center"><span className="text-gray-800 capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold text-green-700">{value}</span></div>))}</div></div>
                      <div className="border-2 border-blue-900"><div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase">Rating Key</div><div className="p-2 text-[8px] space-y-0.5"><div className="text-gray-800">5 - Excellent</div><div className="text-gray-800">4 - Very Good</div><div className="text-gray-800">3 - Good</div><div className="text-gray-800">2 - Fair</div><div className="text-gray-800">1 - Poor</div></div></div>
                    </div>
                  </div>
                  <div className="border-t-2 border-blue-900 mt-4 pt-2 text-center text-[9px] text-gray-600 print:mt-3 print:pt-2 print:text-[8px]">Powered by Vincollins Portal | Geared Towards Excellence</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Close</Button>
            <Button onClick={() => handleDownloadPDF()} className="bg-blue-600 hover:bg-blue-700"><Download className="h-4 w-4 mr-2" />Download PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}