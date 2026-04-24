// ============================================
// CA SCORES TAB - FULLY WORKING WITH DATABASE
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
  Loader2, Filter, Download, RefreshCw, XCircle
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
import { Progress } from '@/components/ui/progress'

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
    case 'A': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200'
    case 'B': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200'
    case 'C': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200'
    case 'P': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200'
    case 'F': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200'
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
    lowestScore: 100,
    passCount: 0,
    failCount: 0
  })

  useEffect(() => {
    setMounted(true)
    loadClassesAndSubjects()
  }, [])

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadStudents()
      loadExistingScores()
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear])

  const loadClassesAndSubjects = async () => {
    try {
      // Load unique classes from profiles table (students)
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('class')
        .eq('role', 'student')
        .not('class', 'is', null)
      
      if (studentsError) throw studentsError
      
      const uniqueClasses = [...new Set(studentsData?.map(d => d.class).filter(Boolean))] as string[]
      setClasses(uniqueClasses.sort())
      
      if (uniqueClasses.length > 0 && !selectedClass) {
        setSelectedClass(uniqueClasses[0])
      }

      // Load subjects from the subjects table or use common subjects based on class
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('name')
        .order('name')
      
      if (!subjectsError && subjectsData && subjectsData.length > 0) {
        const subjectList = subjectsData.map(s => s.name)
        setSubjects(subjectList)
        if (subjectList.length > 0 && !selectedSubject) {
          setSelectedSubject(subjectList[0])
        }
      } else {
        // Fallback subjects based on class level
        const isJSS = selectedClass?.startsWith('JSS')
        const defaultSubjects = isJSS 
          ? ['Mathematics', 'English Studies', 'Basic Science', 'Basic Technology', 'Social Studies', 'Civic Education']
          : ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics']
        setSubjects(defaultSubjects)
        if (!selectedSubject) setSelectedSubject(defaultSubjects[0])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, class, vin_id')
        .eq('role', 'student')
        .eq('class', selectedClass)
        .order('full_name', { ascending: true })
      
      if (error) throw error
      
      const formatted = data?.map((s: any) => ({
        id: s.id,
        full_name: s.full_name || 'Unknown',
        class: s.class,
        vin_id: s.vin_id || 'N/A'
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
    if (!staffProfile?.id) return
    
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
      let passCount = 0
      let failCount = 0
      
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
          
          const grade = score.grade
          if (grade === 'A' || grade === 'B' || grade === 'C' || grade === 'P') {
            passCount++
          } else if (grade === 'F') {
            failCount++
          }
        }
      })
      
      setScoreEntries(entries)
      setStats({
        totalStudents: students.length,
        gradedStudents: gradedCount,
        classAverage: gradedCount > 0 ? totalScore / gradedCount : 0,
        highestScore: highest,
        lowestScore: lowest === 100 ? 0 : lowest,
        passCount,
        failCount
      })
      
    } catch (error) {
      console.error('Error loading existing scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (studentId: string, field: string, value: string) => {
    let numValue = parseFloat(value) || 0
    const maxValue = field === 'exam' ? MAX_SCORES.exam : 
                     field === 'ca1' ? MAX_SCORES.ca1 : MAX_SCORES.ca2
    
    numValue = Math.min(maxValue, Math.max(0, numValue))
    
    setScoreEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numValue.toString()
      }
    }))
  }

  const handleSaveScores = async () => {
    if (!staffProfile?.id) {
      toast.error('Staff profile not found')
      return
    }
    
    setSaving(true)
    
    try {
      const scoresToUpsert = []
      
      for (const student of students) {
        const entry = scoreEntries[student.id]
        if (!entry) continue
        
        const ca1 = parseFloat(entry.ca1) || 0
        const ca2 = parseFloat(entry.ca2) || 0
        const exam = parseFloat(entry.exam) || 0
        
        // Skip if all scores are zero (no data entered)
        if (ca1 === 0 && ca2 === 0 && exam === 0) continue
        
        const total = calculateTotal(ca1, ca2, exam)
        const grade = calculateGrade(total)
        
        scoresToUpsert.push({
          student_id: student.id,
          subject: selectedSubject,
          term: selectedTerm,
          academic_year: selectedYear,
          ca1_score: ca1,
          ca2_score: ca2,
          exam_score: exam,
          total_score: total,
          grade: grade,
          remark: entry.remark || getRemark(grade),
          teacher_id: staffProfile.id,
          updated_at: new Date().toISOString()
        })
      }
      
      if (scoresToUpsert.length === 0) {
        toast.warning('No scores to save. Please enter some scores first.')
        setSaving(false)
        return
      }

      // Use upsert for each score individually to avoid conflicts
      for (const score of scoresToUpsert) {
        const { error } = await supabase
          .from('ca_scores')
          .upsert(score, {
            onConflict: 'student_id,subject,term,academic_year'
          })
        
        if (error) throw error
      }
      
      toast.success(`Saved ${scoresToUpsert.length} student score(s)!`)
      await loadExistingScores()
      
    } catch (error) {
      console.error('Error saving scores:', error)
      toast.error('Failed to save scores. Please try again.')
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
      await loadExistingScores()
      
    } catch (error) {
      console.error('Error deleting score:', error)
      toast.error('Failed to delete score')
    }
  }

  const handleExport = () => {
    const csvData = students.map(student => {
      const entry = scoreEntries[student.id]
      const ca1 = parseFloat(entry?.ca1) || 0
      const ca2 = parseFloat(entry?.ca2) || 0
      const exam = parseFloat(entry?.exam) || 0
      const total = ca1 + ca2 + exam
      
      return {
        'Student Name': student.full_name,
        'VIN ID': student.vin_id,
        'Class': student.class,
        'CA1 (20)': ca1,
        'CA2 (20)': ca2,
        'Exam (60)': exam,
        'Total (100)': total,
        'Grade': calculateGrade(total),
        'Remark': entry?.remark || getRemark(calculateGrade(total))
      }
    })
    
    const headers = Object.keys(csvData[0])
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => JSON.stringify(row[h as keyof typeof row] || '')).join(','))
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

  const getStudentVIN = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.vin_id || 'N/A'
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6 w-full"
    >
      {/* Grade Scale Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
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
              <Calculator className="h-4 w-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-medium">Total = CA1 + CA2 + Exam (Max 100)</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-3">
            <span className="text-xs sm:text-sm text-gray-600">Grades:</span>
            <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs">A: 80-100</Badge>
            <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs">B: 70-79</Badge>
            <Badge className="bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs">C: 60-69</Badge>
            <Badge className="bg-orange-100 text-orange-700 text-[10px] sm:text-xs">P: 50-59</Badge>
            <Badge className="bg-red-100 text-red-700 text-[10px] sm:text-xs">F: 0-49</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Class</Label>
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
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Subject</Label>
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
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Term</Label>
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
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Academic Year</Label>
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
                className="bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-10 flex-1 text-xs sm:text-sm"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />}
                {saving ? 'Saving...' : 'Save All'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleExport} className="h-9 sm:h-10 w-9 sm:w-10">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {stats.gradedStudents > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-xs text-muted-foreground">Total Students</p>
              <p className="text-base sm:text-lg font-bold">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-xs text-emerald-600">Graded</p>
              <p className="text-base sm:text-lg font-bold text-emerald-700">{stats.gradedStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-xs text-blue-600">Class Avg</p>
              <p className="text-base sm:text-lg font-bold text-blue-700">{stats.classAverage.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-purple-50 dark:bg-purple-950/30">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-xs text-purple-600">Highest</p>
              <p className="text-base sm:text-lg font-bold text-purple-700">{stats.highestScore}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-xs text-green-600">Passed</p>
              <p className="text-base sm:text-lg font-bold text-green-700">{stats.passCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-xs text-red-600">Failed</p>
              <p className="text-base sm:text-lg font-bold text-red-700">{stats.failCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger 
            value="entry"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Score Entry
          </TabsTrigger>
          <TabsTrigger 
            value="view"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            View Scores
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Score Entry Tab */}
        <TabsContent value="entry">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b px-3 sm:px-5 pt-3 sm:pt-4">
              <div>
                <CardTitle className="text-sm sm:text-base">
                  Enter CA Scores - {selectedClass} ({selectedSubject})
                </CardTitle>
                <CardDescription className="text-xs">
                  {students.length} students found
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableHead className="text-xs whitespace-nowrap">Student</TableHead>
                      <TableHead className="text-center text-xs whitespace-nowrap">VIN</TableHead>
                      <TableHead className="text-center text-xs whitespace-nowrap">CA1 (20)</TableHead>
                      <TableHead className="text-center text-xs whitespace-nowrap">CA2 (20)</TableHead>
                      <TableHead className="text-center text-xs whitespace-nowrap">Exam (60)</TableHead>
                      <TableHead className="text-center text-xs whitespace-nowrap">Total</TableHead>
                      <TableHead className="text-center text-xs whitespace-nowrap">Grade</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No students found in this class</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => {
                        const entry = scoreEntries[student.id] || { ca1: '', ca2: '', exam: '', remark: '' }
                        const ca1 = parseFloat(entry.ca1) || 0
                        const ca2 = parseFloat(entry.ca2) || 0
                        const exam = parseFloat(entry.exam) || 0
                        const total = ca1 + ca2 + exam
                        const grade = calculateGrade(total)
                        
                        return (
                          <TableRow key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell className="font-medium text-xs whitespace-nowrap">
                              <div className="max-w-[120px] truncate">{student.full_name}</div>
                            </TableCell>
                            <TableCell className="text-center text-[10px] text-muted-foreground">
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
                                className="h-8 w-16 mx-auto text-center text-xs"
                                placeholder="0"
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
                                className="h-8 w-16 mx-auto text-center text-xs"
                                placeholder="0"
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
                                className="h-8 w-16 mx-auto text-center text-xs"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs">
                              {total > 0 ? total.toFixed(1) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {total > 0 && (
                                <Badge className={cn("text-[10px]", getGradeColor(grade))}>
                                  {grade}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={entry.remark}
                                onChange={(e) => setScoreEntries(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], remark: e.target.value }
                                }))}
                                className="h-8 w-24 text-xs"
                                placeholder="Remark"
                              />
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

        {/* View Scores Tab */}
        <TabsContent value="view">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b px-3 sm:px-5 pt-3 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-sm sm:text-base">
                  Saved CA Scores - {selectedClass} ({selectedSubject})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-center text-xs">VIN</TableHead>
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
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Loading scores...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredScores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Calculator className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No scores found for this selection</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setActiveTab('entry')}
                            className="text-emerald-600 text-xs mt-1"
                          >
                            Go to Score Entry
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScores.map((score) => (
                        <TableRow key={score.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium text-xs whitespace-nowrap">
                            {getStudentName(score.student_id)}
                          </TableCell>
                          <TableCell className="text-center text-[10px] text-muted-foreground">
                            {getStudentVIN(score.student_id)}
                          </TableCell>
                          <TableCell className="text-center text-xs">{score.ca1_score || '-'}</TableCell>
                          <TableCell className="text-center text-xs">{score.ca2_score || '-'}</TableCell>
                          <TableCell className="text-center text-xs">{score.exam_score || '-'}</TableCell>
                          <TableCell className="text-center font-semibold text-xs">
                            {score.total_score?.toFixed(1) || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-[10px]", getGradeColor(score.grade || ''))}>
                              {score.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">
                            {score.remark || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingScore(score)
                                setShowEditDialog(true)
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteScore(score.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-sm">Performance Analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                Detailed analytics will be available once more data is collected
              </p>
              {stats.gradedStudents > 0 && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Pass Rate</span>
                    <span>{((stats.passCount / stats.gradedStudents) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(stats.passCount / stats.gradedStudents) * 100} className="h-2" />
                  <div className="flex justify-between text-xs mt-3">
                    <span>Class Average</span>
                    <span className="font-medium">{stats.classAverage.toFixed(1)}%</span>
                  </div>
                </div>
              )}
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
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">CA1 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={editingScore.ca1_score || 0}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      ca1_score: parseFloat(e.target.value) || 0
                    })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">CA2 Score (max 20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={editingScore.ca2_score || 0}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      ca2_score: parseFloat(e.target.value) || 0
                    })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Exam Score (max 60)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={editingScore.exam_score || 0}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      exam_score: parseFloat(e.target.value) || 0
                    })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Remark</Label>
                  <Textarea
                    value={editingScore.remark || ''}
                    onChange={(e) => setEditingScore({
                      ...editingScore,
                      remark: e.target.value
                    })}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Total:</span> {calculateTotal(
                    editingScore.ca1_score || 0,
                    editingScore.ca2_score || 0,
                    editingScore.exam_score || 0
                  )} / 100
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Grade:</span>{' '}
                  <Badge className={getGradeColor(calculateGrade(calculateTotal(
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
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-9 text-sm">
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
                  await loadExistingScores()
                } catch (error) {
                  console.error('Error updating score:', error)
                  toast.error('Failed to update score')
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}