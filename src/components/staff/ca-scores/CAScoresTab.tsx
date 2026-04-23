// ============================================
// CA SCORES TAB - Complete with Responsive Layout
// ============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Calculator, Save, Search, Eye, Edit, Trash2, TrendingUp,
  Users, BookOpen, CheckCircle2, AlertCircle, ChevronDown,
  Loader2, Filter, Download, RefreshCw
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================
// TYPES
// ============================================
interface CAScore {
  id: string
  student_id: string
  subject: string
  term: string
  academic_year: string
  ca1_score: number | null
  ca2_score: number | null
  exam_score: number | null
  total_score: number | null
  grade: string | null
  remark: string | null
  teacher_id: string
  created_at: string
  updated_at: string
}

interface Student {
  id: string
  full_name: string
  class: string
  vin_id: string
}

interface CAScoresTabProps {
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

const MAX_SCORES = {
  ca1: 20,
  ca2: 20,
  exam: 60
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const calculateTotal = (ca1: number, ca2: number, exam: number): number => {
  return (ca1 || 0) + (ca2 || 0) + (exam || 0)
}

const calculateGrade = (total: number): string => {
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  if (total >= 50) return 'P'
  return 'F'
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700 border-green-200'
    case 'B': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'C': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'P': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'F': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getRemark = (grade: string): string => {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'Very Good'
    case 'C': return 'Good'
    case 'P': return 'Pass'
    case 'F': return 'Fail'
    default: return ''
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export function CAScoresTab({ staffProfile, termInfo }: CAScoresTabProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('entry')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState(termInfo?.termCode || 'third')
  const [selectedYear, setSelectedYear] = useState(termInfo?.sessionYear || '2025/2026')
  
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [caScores, setCAScores] = useState<CAScore[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [scoreEntries, setScoreEntries] = useState<Record<string, {
    ca1: string
    ca2: string
    exam: string
    remark: string
  }>>({})
  
  const [editingScore, setEditingScore] = useState<CAScore | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [stats, setStats] = useState({
    totalStudents: 0,
    gradedStudents: 0,
    classAverage: 0,
    highestScore: 0,
    lowestScore: 100
  })

  useEffect(() => {
    setMounted(true)
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadSubjects(selectedClass)
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadStudents()
      loadExistingScores()
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear])

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('class')
        .order('class')
      
      if (error) throw error
      
      const uniqueClasses = [...new Set(data.map(d => d.class))]
      setClasses(uniqueClasses)
      if (uniqueClasses.length > 0 && !selectedClass) {
        setSelectedClass(uniqueClasses[0])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const loadSubjects = async (className: string) => {
    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .select('subject')
        .eq('class', className)
        .order('subject')
      
      if (error) throw error
      
      const subjectList = data.map(d => d.subject)
      setSubjects(subjectList)
      if (subjectList.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectList[0])
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.error('Failed to load subjects')
    }
  }

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          class,
          vin_id,
          profiles!students_id_fkey(full_name)
        `)
        .eq('class', selectedClass)
        .order('profiles(full_name)')
      
      if (error) throw error
      
      const formatted = data?.map((s: any) => ({
        id: s.id,
        full_name: s.profiles?.full_name || 'Unknown',
        class: s.class,
        vin_id: s.vin_id
      })) || []
      
      setStudents(formatted)
      
      const entries: Record<string, any> = {}
      formatted.forEach(student => {
        entries[student.id] = { ca1: '', ca2: '', exam: '', remark: '' }
      })
      setScoreEntries(prev => ({ ...prev, ...entries }))
      
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    }
  }

  const loadExistingScores = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('subject', selectedSubject)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('teacher_id', staffProfile.id)
      
      if (error) throw error
      
      setCAScores(data as CAScore[])
      
      const entries = { ...scoreEntries }
      let totalScore = 0
      let gradedCount = 0
      let highest = 0
      let lowest = 100
      
      data.forEach((score: CAScore) => {
        if (entries[score.student_id]) {
          entries[score.student_id] = {
            ca1: score.ca1_score?.toString() || '',
            ca2: score.ca2_score?.toString() || '',
            exam: score.exam_score?.toString() || '',
            remark: score.remark || ''
          }
        }
        
        if (score.total_score) {
          totalScore += score.total_score
          gradedCount++
          if (score.total_score > highest) highest = score.total_score
          if (score.total_score < lowest) lowest = score.total_score
        }
      })
      
      setScoreEntries(entries)
      setStats({
        totalStudents: students.length,
        gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? totalScore / gradedCount : 0,
        highestScore: highest,
        lowestScore: lowest === 100 ? 0 : lowest
      })
      
    } catch (error) {
      console.error('Error loading existing scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (studentId: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0
    const maxValue = field === 'exam' ? MAX_SCORES.exam : 
                     field === 'ca1' ? MAX_SCORES.ca1 : MAX_SCORES.ca2
    
    const clampedValue = Math.min(maxValue, Math.max(0, numValue))
    
    setScoreEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: clampedValue.toString()
      }
    }))
  }

  const handleSaveScores = async () => {
    setSaving(true)
    
    try {
      const scoresToUpsert = students.map(student => {
        const entry = scoreEntries[student.id]
        if (!entry) return null
        
        const ca1 = parseFloat(entry.ca1) || 0
        const ca2 = parseFloat(entry.ca2) || 0
        const exam = parseFloat(entry.exam) || 0
        
        if (ca1 === 0 && ca2 === 0 && exam === 0) return null
        
        const total = calculateTotal(ca1, ca2, exam)
        const grade = calculateGrade(total)
        
        return {
          student_id: student.id,
          subject: selectedSubject,
          term: selectedTerm,
          academic_year: selectedYear,
          ca1_score: ca1 || null,
          ca2_score: ca2 || null,
          exam_score: exam || null,
          total_score: total,
          grade,
          remark: entry.remark || getRemark(grade),
          teacher_id: staffProfile.id,
          updated_at: new Date().toISOString()
        }
      }).filter(Boolean)
      
      if (scoresToUpsert.length === 0) {
        toast.warning('No scores to save')
        return
      }

      const { error } = await supabase
        .from('ca_scores')
        .upsert(scoresToUpsert, {
          onConflict: 'student_id,subject,term,academic_year'
        })
      
      if (error) throw error
      
      toast.success(`Saved ${scoresToUpsert.length} student scores!`)
      loadExistingScores()
      
    } catch (error) {
      console.error('Error saving scores:', error)
      toast.error('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteScore = async (scoreId: string) => {
    if (!confirm('Are you sure you want to delete this score?')) return
    
    try {
      const { error } = await supabase
        .from('ca_scores')
        .delete()
        .eq('id', scoreId)
      
      if (error) throw error
      
      toast.success('Score deleted successfully')
      loadExistingScores()
      
    } catch (error) {
      console.error('Error deleting score:', error)
      toast.error('Failed to delete score')
    }
  }

  const handleBulkUpdate = () => {
    toast.info('Bulk update feature coming soon')
  }

  const handleExport = () => {
    const csvData = students.map(student => {
      const entry = scoreEntries[student.id]
      const ca1 = parseFloat(entry?.ca1) || 0
      const ca2 = parseFloat(entry?.ca2) || 0
      const exam = parseFloat(entry?.exam) || 0
      const total = ca1 + ca2 + exam
      
      return {
        Name: student.full_name,
        VIN: student.vin_id,
        Class: student.class,
        CA1: ca1,
        CA2: ca2,
        Exam: exam,
        Total: total,
        Grade: calculateGrade(total)
      }
    })
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedClass}_${selectedSubject}_${selectedTerm}_${selectedYear}_ca_scores.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Export complete!')
  }

  const filteredScores = caScores.filter(score => {
    const student = students.find(s => s.id === score.student_id)
    return student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student?.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.full_name || 'Unknown'
  }

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
            CA Scores Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Enter CA1 (20), CA2 (20), and Exam (60) scores • Total: 100 marks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadExistingScores()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Grade Scale Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">CA1</Badge>
              <span className="text-xs sm:text-sm">Max 20</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">CA2</Badge>
              <span className="text-xs sm:text-sm">Max 20</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">Exam</Badge>
              <span className="text-xs sm:text-sm">Max 60</span>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium">Total = CA1 + CA2 + Exam (Max 100)</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-3">
            <span className="text-xs sm:text-sm text-gray-600">Grades:</span>
            <Badge className="bg-green-100 text-green-700 text-xs">A: 80-100</Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">B: 70-79</Badge>
            <Badge className="bg-yellow-100 text-yellow-700 text-xs">C: 60-69</Badge>
            <Badge className="bg-orange-100 text-orange-700 text-xs">P: 50-59</Badge>
            <Badge className="bg-red-100 text-red-700 text-xs">F: 0-49</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats.gradedStudents > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-500">Total Students</p>
              <p className="text-lg sm:text-xl font-bold">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-green-600">Graded</p>
              <p className="text-lg sm:text-xl font-bold text-green-700">{stats.gradedStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-blue-600">Class Average</p>
              <p className="text-lg sm:text-xl font-bold text-blue-700">{stats.classAverage.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-purple-50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-purple-600">Highest</p>
              <p className="text-lg sm:text-xl font-bold text-purple-700">{stats.highestScore}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-amber-600">Lowest</p>
              <p className="text-lg sm:text-xl font-bold text-amber-700">{stats.lowestScore}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
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
              <Label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Academic Year</Label>
              <Input 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 sm:h-10 text-sm"
                placeholder="2025/2026"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSaveScores} 
                disabled={saving || students.length === 0}
                className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 flex-1"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving...' : 'Save All'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 sm:h-10 w-9 sm:w-10">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkUpdate}>
                    <Edit className="h-4 w-4 mr-2" /> Bulk Update
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="entry"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Score Entry
          </TabsTrigger>
          <TabsTrigger 
            value="view"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            View Scores
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Score Entry Tab */}
        <TabsContent value="entry">
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Enter CA Scores - {selectedClass} ({selectedSubject})
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {students.length} students found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">Student</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">VIN</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">CA1 (20)</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">CA2 (20)</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">Exam (60)</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">Total (100)</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">Grade</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '', remark: '' }
                      const ca1 = parseFloat(entry.ca1) || 0
                      const ca2 = parseFloat(entry.ca2) || 0
                      const exam = parseFloat(entry.exam) || 0
                      const total = ca1 + ca2 + exam
                      const grade = calculateGrade(total)
                      
                      return (
                        <TableRow key={student.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <div className="max-w-[120px] sm:max-w-none truncate">{student.full_name}</div>
                          </TableCell>
                          <TableCell className="text-center text-xs text-gray-500">
                            {student.vin_id}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={entry.ca1}
                              onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
                              className="h-8 sm:h-9 w-16 sm:w-20 mx-auto text-center text-xs sm:text-sm"
                              placeholder="0-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={entry.ca2}
                              onChange={(e) => handleScoreChange(student.id, 'ca2', e.target.value)}
                              className="h-8 sm:h-9 w-16 sm:w-20 mx-auto text-center text-xs sm:text-sm"
                              placeholder="0-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="60"
                              step="0.5"
                              value={entry.exam}
                              onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                              className="h-8 sm:h-9 w-16 sm:w-20 mx-auto text-center text-xs sm:text-sm"
                              placeholder="0-60"
                            />
                          </TableCell>
                          <TableCell className="text-center font-semibold text-xs sm:text-sm">
                            {total.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-xs", getGradeColor(grade))}>
                              {grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={entry.remark}
                              onChange={(e) => handleScoreChange(student.id, 'remark', e.target.value)}
                              className="h-8 sm:h-9 w-24 sm:w-32 text-xs sm:text-sm"
                              placeholder="Optional"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Scores Tab */}
        <TabsContent value="view">
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">
                  Saved CA Scores - {selectedClass} ({selectedSubject})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs sm:text-sm">Student</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">CA1</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">CA2</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Exam</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Total</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Grade</TableHead>
                      <TableHead className="text-xs sm:text-sm">Remark</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                          <p className="text-gray-500">Loading scores...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredScores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Calculator className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No scores found for this selection</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {getStudentName(score.student_id)}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">{score.ca1_score || '-'}</TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">{score.ca2_score || '-'}</TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">{score.exam_score || '-'}</TableCell>
                          <TableCell className="text-center font-semibold text-xs sm:text-sm">
                            {score.total_score?.toFixed(1) || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-xs", getGradeColor(score.grade || ''))}>
                              {score.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-gray-600 max-w-[150px] truncate">
                            {score.remark || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingScore(score)
                              setShowEditDialog(true)
                            }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteScore(score.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 sm:p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Analytics Dashboard</p>
              <p className="text-sm text-gray-500 mt-1">
                Detailed performance analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit CA Score</DialogTitle>
            <DialogDescription>
              {getStudentName(editingScore?.student_id || '')} - {editingScore?.subject}
            </DialogDescription>
          </DialogHeader>
          
          {editingScore && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CA1 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    defaultValue={editingScore.ca1_score || 0}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      ca1_score: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label>CA2 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    defaultValue={editingScore.ca2_score || 0}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      ca2_score: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Exam Score (max 60)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    defaultValue={editingScore.exam_score || 0}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      exam_score: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Remark</Label>
                  <Textarea
                    defaultValue={editingScore.remark || ''}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      remark: e.target.value
                    })}
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  Total: {calculateTotal(
                    editingScore.ca1_score || 0,
                    editingScore.ca2_score || 0,
                    editingScore.exam_score || 0
                  )} / 100
                </p>
                <p className="text-sm">
                  Grade: <Badge className={getGradeColor(calculateGrade(calculateTotal(
                    editingScore.ca1_score || 0,
                    editingScore.ca2_score || 0,
                    editingScore.exam_score || 0
                  )))}>
                    {calculateGrade(calculateTotal(
                      editingScore.ca1_score || 0,
                      editingScore.ca2_score || 0,
                      editingScore.exam_score || 0
                    ))}
                  </Badge>
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!editingScore) return
                try {
                  const total = calculateTotal(
                    editingScore.ca1_score || 0,
                    editingScore.ca2_score || 0,
                    editingScore.exam_score || 0
                  )
                  const grade = calculateGrade(total)
                  
                  const { error } = await supabase
                    .from('ca_scores')
                    .update({
                      ca1_score: editingScore.ca1_score,
                      ca2_score: editingScore.ca2_score,
                      exam_score: editingScore.exam_score,
                      total_score: total,
                      grade,
                      remark: editingScore.remark,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', editingScore.id)
                  
                  if (error) throw error
                  
                  toast.success('Score updated successfully')
                  setShowEditDialog(false)
                  loadExistingScores()
                } catch (error) {
                  console.error('Error updating score:', error)
                  toast.error('Failed to update score')
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}