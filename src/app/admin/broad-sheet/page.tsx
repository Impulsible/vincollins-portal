// app/staff/admin/broad-sheet/page.tsx - ADMIN BROAD SHEET
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Loader2, CheckCircle, AlertCircle, FileCheck, Eye, Download, 
  ChevronRight, Home, Users, BookOpen, Search, RefreshCw, Printer,
  Sparkles, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────
interface StudentSubject {
  subject: string
  ca1: number
  ca2: number
  exam_obj: number
  exam_theory: number
  total: number
  grade: string
  status: string
}

interface StudentRecord {
  id: string
  name: string
  subjects: StudentSubject[]
  totalScore: number
  averageScore: number
  grade: string
  completedSubjects: number
  totalSubjects: number
  hasAllSubjects: boolean
}

// ─── Main ─────────────────────────────────────────────
export default function BroadSheetPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)
  const [showStudentDialog, setShowStudentDialog] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const TERMS = [
    { value: 'first', label: 'First Term' },
    { value: 'second', label: 'Second Term' },
    { value: 'third', label: 'Third Term' },
  ]

  const YEARS = ['2024/2025', '2025/2026', '2026/2027']

  const getWAECGrade = (pct: number): string => {
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
    const c: Record<string, string> = {
      'A1': 'bg-emerald-100 text-emerald-700', 'B2': 'bg-blue-100 text-blue-700',
      'B3': 'bg-sky-100 text-sky-700', 'C4': 'bg-teal-100 text-teal-700',
      'C5': 'bg-amber-100 text-amber-700', 'C6': 'bg-orange-100 text-orange-700',
      'D7': 'bg-yellow-100 text-yellow-700', 'E8': 'bg-red-100 text-red-400',
      'F9': 'bg-red-200 text-red-600'
    }
    return c[grade] || 'bg-slate-100 text-slate-700'
  }

  const getScoreColor = (pct: number): string => {
    if (pct >= 70) return 'text-emerald-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  // ─── Load Profile & Classes ─────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/portal'; return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        setProfile(data)
        setIsAdmin(data.role === 'admin')
      }

      // Get classes
      const { data: students } = await supabase.from('profiles').select('class').eq('role', 'student').not('class', 'is', null)
      const uniqueClasses = [...new Set((students || []).map(s => s.class).filter(Boolean))] as string[]
      setClasses(uniqueClasses.sort())
      if (uniqueClasses.length > 0) setSelectedClass(uniqueClasses[0])
    }
    init()
  }, [])

  // ─── Load Broad Sheet Data ──────────────────────────
  useEffect(() => {
    if (selectedClass && selectedTerm && selectedYear) {
      loadBroadSheet()
    }
  }, [selectedClass, selectedTerm, selectedYear])

  const loadBroadSheet = async () => {
    setLoading(true)
    try {
      // Get all students in the class
      const { data: classStudents } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'student')
        .eq('class', selectedClass)
        .order('full_name')

      if (!classStudents || classStudents.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      // Get all CA scores for this class/term/year
      const { data: allScores } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('class', selectedClass)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      // Get expected subject count
      const isJSS = selectedClass.toUpperCase().startsWith('JSS')
      const totalSubjects = isJSS ? 17 : 10

      // Build student records
      const studentRecords: StudentRecord[] = classStudents.map(student => {
        const studentScores = (allScores || []).filter(s => s.student_id === student.id)

        const subjects: StudentSubject[] = studentScores.map(s => ({
          subject: s.subject,
          ca1: s.ca1_score || 0,
          ca2: s.ca2_score || 0,
          exam_obj: s.exam_objective_score || 0,
          exam_theory: s.exam_theory_score || 0,
          total: s.total_score || 0,
          grade: s.grade || '—',
          status: s.status || 'draft'
        }))

        const totalScore = subjects.reduce((sum, s) => sum + s.total, 0)
        const completedSubjects = subjects.length
        const averageScore = completedSubjects > 0 ? Math.round(totalScore / completedSubjects) : 0
        const grade = completedSubjects > 0 ? getWAECGrade(averageScore) : '—'
        const hasAllSubjects = completedSubjects >= totalSubjects

        return {
          id: student.id,
          name: student.full_name,
          subjects,
          totalScore,
          averageScore,
          grade,
          completedSubjects,
          totalSubjects,
          hasAllSubjects
        }
      })

      setStudents(studentRecords)
    } catch (error) {
      console.error('Error loading broad sheet:', error)
      toast.error('Failed to load broad sheet')
    } finally {
      setLoading(false)
    }
  }

  // ─── Generate Report Cards ──────────────────────────
  const handleGenerateReportCards = async () => {
    if (!selectedClass) { toast.error('Select a class'); return }

    setGenerating(true)
    try {
      // Only generate for students with all subjects complete
      const completeStudents = students.filter(s => s.hasAllSubjects)

      if (completeStudents.length === 0) {
        toast.warning('No students have all subjects completed yet')
        setGenerating(false)
        return
      }

      let count = 0
      for (const student of completeStudents) {
        // Generate teacher comment via API
        let teacherComment = `${student.name} has completed ${student.completedSubjects} subjects with an average of ${student.averageScore}%.`
        let principalComment = 'Keep working hard and striving for excellence.'

        try {
          const res = await fetch('/api/generate-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: student.name,
              averageScore: student.averageScore,
              subjects: student.subjects.map(s => ({ name: s.subject, score: s.total })),
              className: selectedClass,
              gender: 'neutral'
            })
          })
          if (res.ok) {
            const comments = await res.json()
            teacherComment = comments.teacher_comment || teacherComment
            principalComment = comments.principal_comment || principalComment
          }
        } catch {}

        // Upsert report card
        await supabase.from('report_cards').upsert({
          student_id: student.id,
          student_name: student.name,
          student_display_name: student.name,
          class: selectedClass,
          term: selectedTerm,
          academic_year: selectedYear,
          subjects_data: student.subjects.map(s => ({
            subject: s.subject,
            ca1: s.ca1,
            ca2: s.ca2,
            exam_obj: s.exam_obj,
            exam_theory: s.exam_theory,
            total: s.total,
            grade: s.grade,
            remark: ''
          })),
          subject_scores: student.subjects.map(s => ({
            subject: s.subject,
            ca1: s.ca1,
            ca2: s.ca2,
            exam_obj: s.exam_obj,
            exam_theory: s.exam_theory,
            total: s.total,
            grade: s.grade,
            remark: ''
          })),
          total_subjects: student.completedSubjects,
          average_score: student.averageScore,
          total_score: student.totalScore,
          grade: student.grade,
          teacher_comments: teacherComment,
          principal_comments: principalComment,
          class_teacher: profile?.full_name || 'Admin',
          status: 'draft',
          generated_by: profile?.id,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,term,academic_year'
        })
        count++
      }

      toast.success(`Generated ${count} report cards for ${selectedClass}!`)
    } catch (error) {
      console.error('Error generating report cards:', error)
      toast.error('Failed to generate report cards')
    } finally {
      setGenerating(false)
    }
  }

  // ─── Export CSV ─────────────────────────────────────
  const handleExport = () => {
    const headers = ['Student', 'Subjects', 'Average', 'Grade', 'Status']
    const rows = students.map(s => [
      s.name,
      `${s.completedSubjects}/${s.totalSubjects}`,
      s.averageScore,
      s.grade,
      s.hasAllSubjects ? 'Complete' : 'Incomplete'
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `broad_sheet_${selectedClass}_${selectedTerm}_${selectedYear}.csv`
    a.click()
    toast.success('Exported!')
  }

  // ─── Filter ─────────────────────────────────────────
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── Loading ────────────────────────────────────────
  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
            <FileCheck className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Loading Broad Sheet</h2>
          <p className="text-sm text-slate-500">Please wait while we fetch student data...</p>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
        <Link href="/staff" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 font-medium">Broad Sheet</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Broad Sheet</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {selectedClass} • {students.length} students • {students.filter(s => s.hasAllSubjects).length} complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadBroadSheet} className="h-9">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && (
            <Button onClick={handleGenerateReportCards} disabled={generating} className="h-9 text-xs bg-purple-600 hover:bg-purple-700">
              {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              {generating ? 'Generating...' : 'Generate Report Cards'}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-slate-400">Total Students</p>
            <p className="text-xl font-bold text-slate-700">{students.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-emerald-600">Complete</p>
            <p className="text-xl font-bold text-emerald-700">{students.filter(s => s.hasAllSubjects).length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-amber-600">Incomplete</p>
            <p className="text-xl font-bold text-amber-700">{students.filter(s => !s.hasAllSubjects).length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-blue-600">Reports Generated</p>
            <p className="text-xl font-bold text-blue-700">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Broad Sheet Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-center text-xs">Subjects</TableHead>
                    <TableHead className="text-center text-xs">Avg Score</TableHead>
                    <TableHead className="text-center text-xs">Grade</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-sm font-medium">{student.name}</TableCell>
                      <TableCell className="text-center text-sm">
                        <span className={cn(student.hasAllSubjects ? 'text-emerald-600' : 'text-amber-600')}>
                          {student.completedSubjects}/{student.totalSubjects}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-semibold text-sm", getScoreColor(student.averageScore))}>
                          {student.averageScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.grade !== '—' && (
                          <Badge className={cn("text-xs font-semibold", getGradeColor(student.grade))}>
                            {student.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.hasAllSubjects ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />Complete
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />Incomplete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedStudent(student); setShowStudentDialog(true) }}
                          className="h-8 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />View Subjects
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 text-sm">
                <Badge className={selectedStudent.hasAllSubjects ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {selectedStudent.hasAllSubjects ? 'All Subjects Complete' : `${selectedStudent.completedSubjects}/${selectedStudent.totalSubjects} Subjects`}
                </Badge>
                <span>Average: <strong>{selectedStudent.averageScore}%</strong></span>
                <span>Grade: <Badge className={cn("text-xs font-semibold", getGradeColor(selectedStudent.grade))}>{selectedStudent.grade}</Badge></span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-center text-xs">CA1</TableHead>
                    <TableHead className="text-center text-xs">CA2</TableHead>
                    <TableHead className="text-center text-xs">Obj</TableHead>
                    <TableHead className="text-center text-xs">Theory</TableHead>
                    <TableHead className="text-center text-xs">Total</TableHead>
                    <TableHead className="text-center text-xs">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStudent.subjects.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{s.subject}</TableCell>
                      <TableCell className="text-center text-sm">{s.ca1}</TableCell>
                      <TableCell className="text-center text-sm">{s.ca2}</TableCell>
                      <TableCell className="text-center text-sm">{s.exam_obj}</TableCell>
                      <TableCell className="text-center text-sm">{s.exam_theory}</TableCell>
                      <TableCell className="text-center font-semibold text-sm">{s.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-xs", getGradeColor(s.grade))}>{s.grade}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStudentDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}