// app/admin/broad-sheet/page.tsx - COMPLETE FIXED VERSION

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Loader2, RefreshCw, Printer, Search, X, FileSpreadsheet,
  Users, FileDown, Sparkles, FileText, CheckCircle2,
  AlertCircle, Eye, Shield, Bell, Zap,
  TrendingUp, Award, GraduationCap, ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// SUBJECT REQUIREMENTS CONSTANTS
// ============================================
const JSS_MIN_SUBJECTS = 16
const SS_MIN_SUBJECTS = 9

// ============================================
// WAEC/NECO STANDARD SUBJECT ORDERING
// ============================================
const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 'English Studies': 1, 'Mathematics': 2,
  'Physics': 3, 'Chemistry': 4, 'Further Mathematics': 5, 'Basic Science': 6,
  'Biology': 7, 'Agricultural Science': 8, 'Basic Technology': 9,
  'Economics': 10, 'Geography': 11, 'Social Studies': 12, 'Civic Education': 13,
  'Government': 14, 'History': 15, 'Commerce': 16, 'Financial Accounting': 17,
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21,
  'Creative Arts': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Physical Education': 27, 'Security Education': 28
}

// ============================================
// STANDARD SUBJECT LISTS BY DEPARTMENT
// ============================================
const JSS_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Business Studies', 'Information Technology',
  'Agricultural Science', 'Home Economics', 'PHE', 'CRS',
  'French', 'Yoruba', 'CCA', 'Music', 'Security Education'
]

const SS_SUBJECTS_SCIENCE = [
  'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics',
  'Further Mathematics', 'Agricultural Science', 'Data Processing', 'Civic Education', 'Economics'
]

const SS_SUBJECTS_ARTS = [
  'English Language', 'Mathematics', 'Literature in English', 'Government',
  'CRS', 'Economics', 'Data Processing', 'Agricultural Science', 'Civic Education', 'Biology'
]

const SS_SUBJECTS_COMMERCIAL = [
  'English Language', 'Mathematics', 'Economics', 'Commerce',
  'Financial Accounting', 'Government', 'Civic Education', 'Data Processing',
  'Geography', 'Literature in English'
]

// Sort subjects according to WAEC/NECO order
const sortSubjectsByOrder = (subjects: string[]): string[] => {
  return [...subjects].sort((a, b) => {
    const orderA = SUBJECT_ORDER[a] || 999
    const orderB = SUBJECT_ORDER[b] || 999
    return orderA - orderB
  })
}

const getSubjectsForStudent = (className: string, department?: string | null): string[] => {
  if (!className) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  const upperClass = className.toUpperCase()
  
  let subjects: string[] = []
  
  if (upperClass.startsWith('JSS')) {
    subjects = [...JSS_SUBJECTS]
  } else if (upperClass.startsWith('SS')) {
    const dept = department?.toUpperCase() || ''
    if (dept.includes('SCIENCE') || dept === 'SCIENCE') {
      subjects = [...SS_SUBJECTS_SCIENCE]
    } else if (dept.includes('ART') || dept === 'ARTS') {
      subjects = [...SS_SUBJECTS_ARTS]
    } else if (dept.includes('COMMERCIAL') || dept === 'COMMERCIAL' || dept === 'COMM') {
      subjects = [...SS_SUBJECTS_COMMERCIAL]
    } else {
      subjects = [...SS_SUBJECTS_SCIENCE]
    }
  } else {
    subjects = [...SS_SUBJECTS_SCIENCE]
  }
  
  return sortSubjectsByOrder(subjects)
}

const getAllSubjectsForClass = (className: string): string[] => {
  if (!className) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  const upperClass = className.toUpperCase()
  
  let allSubjects: string[] = []
  
  if (upperClass.startsWith('JSS')) {
    allSubjects = [...JSS_SUBJECTS]
  } else if (upperClass.startsWith('SS')) {
    const uniqueSubjects = new Set([
      ...SS_SUBJECTS_SCIENCE,
      ...SS_SUBJECTS_ARTS,
      ...SS_SUBJECTS_COMMERCIAL
    ])
    allSubjects = Array.from(uniqueSubjects)
  } else {
    allSubjects = [...SS_SUBJECTS_SCIENCE]
  }
  
  return sortSubjectsByOrder(allSubjects)
}

const meetsMinimumSubjects = (className: string, completedSubjects: number): boolean => {
  if (!className) return completedSubjects >= SS_MIN_SUBJECTS
  const upper = className.toUpperCase()
  if (upper.startsWith('JSS')) return completedSubjects >= JSS_MIN_SUBJECTS
  return completedSubjects >= SS_MIN_SUBJECTS
}

// ============================================
// WAEC GRADING SYSTEM
// ============================================
const getGrade = (score: number): string => {
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

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A1': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'B2': 'bg-blue-100 text-blue-700 border-blue-200',
    'B3': 'bg-blue-100 text-blue-700 border-blue-200',
    'C4': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'C5': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'C6': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'D7': 'bg-amber-100 text-amber-700 border-amber-200',
    'E8': 'bg-amber-100 text-amber-700 border-amber-200',
    'F9': 'bg-red-100 text-red-700 border-red-200'
  }
  return colors[grade] || 'bg-slate-100 text-slate-600'
}

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail'
  }
  return remarks[grade] || ''
}

// ============================================
// AI COMMENT GENERATION FUNCTIONS
// ============================================
const generateAIComments = async (firstName: string, averageScore: number, subjects: any[], className: string, gender: string) => {
  try {
    const response = await fetch('/api/generate-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: firstName,
        averageScore: averageScore,
        subjects: subjects.map(s => ({ name: s.name, score: s.total })),
        className: className,
        gender: gender
      })
    })
    if (response.ok) return await response.json()
  } catch (error) { console.error('API error:', error) }
  return null
}

const getFallbackTeacherComment = (firstName: string, avg: number, bestSubject: string, bestScore: number, worstSubject: string, worstScore: number, gender: string): string => {
  const pronoun = gender === 'female' ? 'She' : 'He'
  const possessive = gender === 'female' ? 'her' : 'his'
  
  if (avg >= 90) return `Outstanding performance, ${firstName}! Scoring ${bestScore}% in ${bestSubject} is remarkable.`
  if (avg >= 85) return `Excellent performance, ${firstName}! ${possessive} ${bestScore}% in ${bestSubject} is impressive.`
  if (avg >= 80) return `Excellent work, ${firstName}! ${possessive} performance in ${bestSubject} shows strong understanding.`
  if (avg >= 75) return `Very good work, ${firstName}! ${pronoun} excelled in ${bestSubject} (${bestScore}%).`
  if (avg >= 70) return `Good effort, ${firstName}! ${possessive} performance in ${bestSubject} (${bestScore}%) was solid.`
  if (avg >= 65) return `Fair performance, ${firstName}. ${pronoun} did well in ${bestSubject} (${bestScore}%).`
  if (avg >= 60) return `Credit level achieved, ${firstName}. ${bestSubject} (${bestScore}%) was strongest.`
  if (avg >= 55) return `${firstName}, ${pronoun} narrowly passed. More effort is needed.`
  if (avg >= 50) return `${firstName}, this was a close one. ${possessive} performance in ${bestSubject} helped.`
  return `${firstName}, unfortunately ${pronoun} struggled this term. Please see your teacher.`
}

const getFallbackPrincipalComment = (avg: number, firstName: string, gender: string): string => {
  const pronoun = gender === 'female' ? 'She' : 'He'
  if (avg >= 90) return `Outstanding performance. ${pronoun} is promoted with distinction.`
  if (avg >= 85) return `Excellent performance. ${pronoun} is promoted with high honors.`
  if (avg >= 80) return `Excellent performance. ${pronoun} is promoted with honors.`
  if (avg >= 75) return `Very good performance. ${pronoun} is promoted.`
  if (avg >= 70) return `Good performance. Promoted to next class.`
  if (avg >= 65) return `Satisfactory performance. Promoted.`
  if (avg >= 60) return `Fair performance. Promoted.`
  if (avg >= 55) return `Credit performance. Promoted.`
  if (avg >= 50) return `Passed. Work harder next term. Promoted conditionally.`
  if (avg >= 45) return `Pass. Significant improvement required.`
  if (avg >= 40) return `Poor performance. Must improve significantly.`
  return `Failed. Needs to repeat class.`
}

// ============================================
// TYPES
// ============================================
interface SubjectScore {
  subject: string
  ca1: number
  ca2: number
  exam_obj: number
  exam_theory: number
  total: number
  grade: string
  status: string
  teacher_name: string
}

interface StudentRecord {
  id: string
  name: string
  admission_number: string
  vin_id: string
  class: string
  department: string | null
  subjectMap: Record<string, SubjectScore>
  totalScore: number
  averageScore: number
  grade: string
  completedSubjects: number
  totalSubjects: number
  expectedSubjects: string[]
  hasAllSubjects: boolean
  meetsMinimum: boolean
  allSubmitted: boolean
}

// ============================================
// CONSTANTS
// ============================================
const LOAD_TIMEOUT = 10000
const AUTO_REFRESH_INTERVAL = 30000

const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const YEARS = ['2024/2025', '2025/2026', '2026/2027']

const DEPARTMENTS = [
  { value: 'all', label: 'All Departments', icon: '📊' },
  { value: 'Science', label: 'Science', icon: '🔬' },
  { value: 'Arts', label: 'Arts', icon: '🎭' },
  { value: 'Commercial', label: 'Commercial', icon: '💼' },
]

const getTermLabel = (term: string): string => {
  const found = TERMS.find(t => t.value === term)
  return found?.label || 'Third Term'
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function BroadSheetPage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [expectedSubjects, setExpectedSubjects] = useState<string[]>(sortSubjectsByOrder(SS_SUBJECTS_SCIENCE))
  const [classes, setClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 })
  const [newScoreAlert, setNewScoreAlert] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  
  const autoRefreshTimerRef = useRef<NodeJS.Timeout>()
  const isRefreshingRef = useRef(false)

  useEffect(() => { setIsMounted(true) }, [])

  // Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const timeout = setTimeout(() => {
          setLoading(false)
          setLoadError(true)
        }, LOAD_TIMEOUT)

        const { data: { session } } = await supabase.auth.getSession()
        clearTimeout(timeout)

        if (!session) return

        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        if (profileData) setProfile(profileData)

        const { data: studentsData } = await supabase
          .from('profiles').select('class').eq('role', 'student').not('class', 'is', null).limit(1000)

        if (studentsData) {
          const uniqueClasses = [...new Set(studentsData.map(s => s.class).filter(Boolean))] as string[]
          const sorted = uniqueClasses.sort()
          setClasses(sorted)
          if (sorted.length > 0) {
            setSelectedClass(sorted[0])
            setExpectedSubjects(getAllSubjectsForClass(sorted[0]))
          }
        }
        setLoading(false)
      } catch {
        setLoading(false)
        setLoadError(true)
      }
    }
    init()
  }, [])

  // Update subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      setExpectedSubjects(getAllSubjectsForClass(selectedClass))
    }
    if (isMounted && selectedClass && selectedTerm && selectedYear) {
      loadBroadSheet()
    }
  }, [selectedClass, selectedTerm, selectedYear, isMounted])

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefreshEnabled || loading || students.length === 0) return
    
    const startAutoRefresh = () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current)
      
      autoRefreshTimerRef.current = setInterval(async () => {
        if (isRefreshingRef.current) return
        
        isRefreshingRef.current = true
        try {
          await loadBroadSheet()
        } catch (error) {
          console.error('Auto-refresh error:', error)
        } finally {
          isRefreshingRef.current = false
        }
      }, AUTO_REFRESH_INTERVAL)
    }
    
    startAutoRefresh()
    
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current)
    }
  }, [autoRefreshEnabled, selectedClass, selectedTerm, selectedYear, loading, students.length])

  // Real-time subscription
  useEffect(() => {
    if (!selectedClass || !selectedTerm || !selectedYear) return

    const scoresChannel = supabase
      .channel('broadsheet-scores')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ca_scores',
          filter: `class=eq.${selectedClass}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const subject = payload.new?.subject
            setNewScoreAlert(`📝 ${subject} scores have been updated`)
            toast.info(`📝 ${subject} scores updated`, { duration: 3000 })
            await loadBroadSheet()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(scoresChannel)
    }
  }, [selectedClass, selectedTerm, selectedYear])

  // Clear alert after 5 seconds
  useEffect(() => {
    if (newScoreAlert) {
      const timer = setTimeout(() => setNewScoreAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [newScoreAlert])

  // Load broadsheet data
  const loadBroadSheet = useCallback(async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) return
    
    setLoading(true)
    setLoadError(false)
    try {
      const { data: classStudents, error: studentError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, admission_number, vin_id, class, department, gender')
        .eq('role', 'student')
        .eq('class', selectedClass)
        .order('display_name')
        .limit(500)

      if (studentError) throw studentError
      if (!classStudents || classStudents.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const studentIds = classStudents.map(s => s.id)

      const { data: allScores, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .in('student_id', studentIds)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('status', 'approved')
        .limit(5000)

      if (scoresError) throw scoresError

      const isJSS = selectedClass?.toUpperCase().startsWith('JSS')

      const studentRecords: StudentRecord[] = classStudents.map(student => {
        const subjectsForStudent = getSubjectsForStudent(selectedClass, student.department)
        const totalExpected = subjectsForStudent.length
        
        const studentScores = (allScores || []).filter(s => s.student_id === student.id)
        const subjectMap: Record<string, SubjectScore> = {}

        studentScores.forEach(s => {
          const totalScore = (s.ca1_score || 0) + (s.ca2_score || 0) + (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
          const percentage = totalScore > 0 ? Math.round((totalScore / 100) * 100) : 0
          
          subjectMap[s.subject] = {
            subject: s.subject,
            ca1: s.ca1_score || 0,
            ca2: s.ca2_score || 0,
            exam_obj: s.exam_objective_score || 0,
            exam_theory: s.exam_theory_score || 0,
            total: totalScore,
            grade: getGrade(percentage),
            status: s.status || 'approved',
            teacher_name: s.teacher_name || ''
          }
        })

        const scoredSubjects = Object.keys(subjectMap).length
        const totalScore = Object.values(subjectMap).reduce((sum, s) => sum + s.total, 0)
        const averageScore = scoredSubjects > 0 ? Math.round(totalScore / scoredSubjects) : 0
        const grade = scoredSubjects > 0 ? getGrade(averageScore) : '—'

        const meetsMinimum = meetsMinimumSubjects(selectedClass, scoredSubjects)
        const allSubmitted = meetsMinimum

        return {
          id: student.id,
          name: student.display_name || student.full_name || 'Student',
          admission_number: student.admission_number || '—',
          vin_id: student.vin_id || '—',
          class: student.class,
          department: student.department || (isJSS ? 'Junior' : 'Science'),
          subjectMap,
          totalScore,
          averageScore,
          grade,
          completedSubjects: scoredSubjects,
          totalSubjects: totalExpected,
          expectedSubjects: subjectsForStudent,
          hasAllSubjects: scoredSubjects >= totalExpected,
          meetsMinimum,
          allSubmitted
        }
      })

      let filteredStudents = studentRecords
      if (selectedDepartment !== 'all') {
        filteredStudents = studentRecords.filter(s => s.department === selectedDepartment)
      }

      setStudents(filteredStudents)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load broad sheet')
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedTerm, selectedYear, selectedDepartment])

  // Generate report cards with AI comments
  const handleGenerateReportCards = async () => {
    const completeStudents = students.filter(s => s.meetsMinimum && s.allSubmitted)
    
    if (completeStudents.length === 0) {
      const isJSS = selectedClass?.toUpperCase().startsWith('JSS')
      const requiredMin = isJSS ? JSS_MIN_SUBJECTS : SS_MIN_SUBJECTS
      toast.warning(`No students meet the minimum requirement of ${requiredMin} subjects.`)
      return
    }

    setGenerating(true)
    setGenProgress({ current: 0, total: completeStudents.length })
    let count = 0

    try {
      for (const student of completeStudents) {
        const formattedSubjects = student.expectedSubjects.map(subject => {
          const score = student.subjectMap[subject]
          if (!score) return null
          return {
            name: subject,
            ca: score.ca1 + score.ca2,
            exam: score.exam_obj + score.exam_theory,
            total: score.total,
            grade: score.grade,
            remark: getGradeRemark(score.grade)
          }
        }).filter(Boolean)

        const avgScore = student.averageScore

        const allScores = students.map(s => s.averageScore).filter(s => s > 0)
        const classHighest = allScores.length > 0 ? Math.max(...allScores) : 0
        const classLowest = allScores.length > 0 ? Math.min(...allScores) : 0
        const classAverage = allScores.length > 0 
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) 
          : 0
        
        const sortedScores = [...allScores].sort((a, b) => b - a)
        const position = sortedScores.findIndex(s => s === avgScore) + 1

        const sortedByScore = [...formattedSubjects].sort((a, b) => (b?.total || 0) - (a?.total || 0))
        const bestSubject = sortedByScore[0]?.name || 'N/A'
        const worstSubject = sortedByScore[sortedByScore.length - 1]?.name || 'N/A'
        const bestScore = sortedByScore[0]?.total || 0
        const worstScore = sortedByScore[sortedByScore.length - 1]?.total || 0

        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('gender')
          .eq('id', student.id)
          .single()
        
        const gender = studentProfile?.gender || 'male'
        const firstName = student.name.split(' ')[0] || student.name

        let teacherComment = ''
        let principalComment = ''

        try {
          const aiComments = await generateAIComments(
            firstName,
            avgScore,
            formattedSubjects,
            selectedClass,
            gender
          )
          
          if (aiComments) {
            teacherComment = aiComments.teacher_comment
            principalComment = aiComments.principal_comment
          } else {
            teacherComment = getFallbackTeacherComment(firstName, avgScore, bestSubject, bestScore, worstSubject, worstScore, gender)
            principalComment = getFallbackPrincipalComment(avgScore, firstName, gender)
          }
        } catch (error) {
          console.error('AI comment error:', error)
          teacherComment = getFallbackTeacherComment(firstName, avgScore, bestSubject, bestScore, worstSubject, worstScore, gender)
          principalComment = getFallbackPrincipalComment(avgScore, firstName, gender)
        }

        const reportCardData = {
          student_id: student.id,
          student_name: student.name,
          student_vin: student.vin_id,
          term: selectedTerm,
          academic_year: selectedYear,
          class: selectedClass,
          class_teacher: profile?.full_name || 'Class Teacher',
          principal_name: 'Principal',
          school_name: 'VINCOLLINS COLLEGE',
          total_score: student.totalScore,
          average_score: avgScore,
          class_highest: classHighest,
          class_lowest: classLowest,
          class_average: classAverage,
          position: position,
          total_students: students.length,
          subjects_data: formattedSubjects,
          teacher_comments: teacherComment,
          principal_comments: principalComment,
          status: 'generated',
          generated_by: profile?.id,
          generated_at: new Date().toISOString(),
          session_year: selectedYear
        }

        await supabase
          .from('report_cards')
          .delete()
          .eq('student_id', student.id)
          .eq('term', selectedTerm)
          .eq('academic_year', selectedYear)

        const { error } = await supabase
          .from('report_cards')
          .insert(reportCardData)

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        
        count++
        setGenProgress({ current: count, total: completeStudents.length })
      }

      toast.success(`✅ Generated ${count} report cards for ${selectedClass}!`)
      await loadBroadSheet()
      
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate report cards')
    } finally {
      setGenerating(false)
      setGenProgress({ current: 0, total: 0 })
    }
  }

  const handleViewReportCard = (student: StudentRecord) => {
    router.push(`/admin/report-cards/view?student=${student.id}&term=${selectedTerm}&year=${selectedYear}`)
  }

  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Student Name', 'Department', 'Admission No', ...expectedSubjects, 'Total', 'Average', 'Grade', 'Status']
    const rows = students.map(s => {
      const subjects = expectedSubjects.map(sub => {
        const sc = s.subjectMap[sub]
        return sc ? `${sc.total} (${sc.grade})` : '—'
      })
      const status = s.meetsMinimum ? (s.allSubmitted ? 'Ready' : 'Pending') : `${s.completedSubjects}/${s.totalSubjects} subjects`
      return [s.name, s.department || '—', s.admission_number, ...subjects, s.totalScore, `${s.averageScore}%`, s.grade, status]
    })

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BroadSheet_${selectedClass}_${selectedTerm}_${selectedYear.replace('/', '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Broad sheet exported!')
  }

  const handlePrint = () => {
    if (isMounted) window.print()
  }

  const handleRetry = () => {
    setLoadError(false)
    setLoading(true)
    loadBroadSheet()
  }

  // ✅ FIXED STATS CALCULATION
  const stats = useMemo(() => {
    const readyForReport = students.filter(s => s.meetsMinimum && s.allSubmitted)
    const complete = students.filter(s => s.hasAllSubjects)
    const classAvg = readyForReport.length > 0
      ? Math.round(readyForReport.reduce((sum, s) => sum + s.averageScore, 0) / readyForReport.length)
      : 0
    const topScore = readyForReport.length > 0
      ? Math.max(...readyForReport.map(s => s.totalScore))
      : 0

    const minRequired = selectedClass?.toUpperCase().startsWith('JSS') ? JSS_MIN_SUBJECTS : SS_MIN_SUBJECTS

    const departmentBreakdown = students.reduce((acc, s) => {
      const dept = s.department || 'Unknown'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: students.length,
      complete: complete.length,
      readyForReport: readyForReport.length,
      incomplete: students.length - complete.length,
      classAvg,
      topScore,
      minRequired,
      departmentBreakdown
    }
  }, [students, selectedClass])

  const displayedStudents = useMemo(() => {
    let filtered = students
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.admission_number.toLowerCase().includes(q) ||
        s.vin_id.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [students, searchQuery])

  const displayClass = isMounted ? selectedClass : ''
  const displayTermLabel = isMounted ? getTermLabel(selectedTerm) : 'Third Term'
  const displayYear = isMounted ? selectedYear : '2025/2026'
  const minRequired = selectedClass?.toUpperCase().startsWith('JSS') ? JSS_MIN_SUBJECTS : SS_MIN_SUBJECTS

  if (!isMounted || (loading && students.length === 0 && !loadError)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto mb-4">
            <FileSpreadsheet className="h-12 w-12 text-emerald-500" />
          </motion.div>
          <p className="text-slate-500">Loading broad sheet...</p>
        </div>
      </div>
    )
  }

  if (loadError && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">Failed to load broad sheet</p>
          <Button onClick={handleRetry} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 print:space-y-2 px-3 sm:px-4 md:px-6">
      {/* Back Button */}
      <div className="no-print">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2 -ml-2 text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {newScoreAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">{newScoreAlert}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewScoreAlert(null)
                loadBroadSheet()
              }}
              className="h-8 text-xs text-emerald-600 hover:text-emerald-700 w-full sm:w-auto"
            >
              View Updates
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="no-print">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">📊 Broad Sheet</h1>
            <p className="text-sm text-slate-500 mt-1">
              Class performance overview and report card generation
            </p>
            <p className="text-xs text-slate-400">
              {displayClass} • {displayTermLabel} • {displayYear} • Minimum {minRequired} subjects required
            </p>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant={autoRefreshEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={cn("h-9 text-sm", autoRefreshEnabled && "bg-emerald-600 hover:bg-emerald-700")}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {autoRefreshEnabled ? 'Auto ON' : 'Auto OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading} className="h-9 text-sm">
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-sm">
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 text-sm">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="no-print space-y-3">
        <Card className="border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Class</Label>
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
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Term</Label>
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
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Session</Label>
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
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d.value} value={d.value}>
                        <span className="flex items-center gap-2">
                          <span>{d.icon}</span> {d.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Name, Admission No..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleGenerateReportCards}
                disabled={generating || stats.readyForReport === 0}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 h-10"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating... {genProgress.current}/{genProgress.total}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Report Cards ({stats.readyForReport} ready)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Total Students</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Ready for Report</p>
              <p className="text-xl font-bold text-green-600">{stats.readyForReport}</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Complete Subjects</p>
              <p className="text-xl font-bold text-blue-600">{stats.complete}</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Class Average</p>
              <p className="text-xl font-bold text-purple-600">{stats.classAvg}%</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500 shadow-sm col-span-2 sm:col-span-1">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Top Score</p>
              <p className="text-xl font-bold text-amber-600">{stats.topScore}</p>
            </CardContent>
          </Card>
        </div>

        {/* Department Breakdown */}
        {Object.keys(stats.departmentBreakdown).length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {Object.entries(stats.departmentBreakdown).map(([dept, count]) => (
              <Badge key={dept} variant="secondary" className="px-3 py-1 text-sm">
                {dept}: {count} student{count !== 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {generating && (
        <div className="no-print bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-purple-700">Generating Report Cards...</span>
            <span className="text-xs text-purple-600">{genProgress.current}/{genProgress.total} completed</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Broadsheet Table - VIN ID COLUMN REMOVED */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border shadow-lg overflow-hidden print:shadow-none">
          {/* Print Header */}
          <div className="hidden print:block p-4 text-center border-b">
            <h1 className="text-xl font-bold">VINCOLLINS COLLEGE</h1>
            <p className="text-base font-semibold">Broad Sheet - {selectedClass}</p>
            <p className="text-xs">{getTermLabel(selectedTerm)} • {selectedYear}</p>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-700 text-xs min-w-[160px]">
                    Student
                  </th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 text-xs min-w-[100px]">
                    Admission No
                  </th>
                  {expectedSubjects.map(subject => (
                    <th
                      key={subject}
                      className="px-2 py-3 text-center font-semibold text-slate-700 text-xs whitespace-nowrap min-w-[70px]"
                    >
                      {subject.split(' ').slice(0, 2).join(' ')}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[60px]">Total</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[60px]">Avg</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[60px]">Grade</th>
                  <th className="no-print px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[70px]">Report</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={expectedSubjects.length + 6} className="text-center py-12">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No students found</p>
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, idx) => {
                    const isJSS = student.class?.toUpperCase().startsWith('JSS')
                    const departmentDisplay = student.department ? 
                      (student.department === 'Science' ? '🔬 Science' : 
                       student.department === 'Arts' ? '🎭 Arts' : 
                       student.department === 'Commercial' ? '💼 Commercial' : student.department) : 
                      (isJSS ? 'Junior' : 'General')
                    
                    return (
                      <tr
                        key={student.id}
                        className={cn(
                          "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
                          idx % 2 === 0 && "bg-white",
                          !student.meetsMinimum && "bg-amber-50/30"
                        )}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-3 py-2">
                          <div>
                            <p className="font-semibold text-sm">{student.name}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                {departmentDisplay}
                              </Badge>
                              {student.meetsMinimum && student.allSubmitted && (
                                <Badge className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0">
                                  <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5" />
                                  Ready
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{student.vin_id}</p>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-left font-mono text-xs">
                          {student.admission_number}
                        </td>
                        {expectedSubjects.map(subject => {
                          const score = student.subjectMap[subject]
                          const isExpected = student.expectedSubjects.includes(subject)
                          return (
                            <td key={subject} className="px-2 py-2 text-center">
                              {score && isExpected ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-semibold text-xs">{score.total}</span>
                                  <Badge className={cn("text-[8px] px-1 py-0", getGradeColor(score.grade))}>
                                    {score.grade}
                                  </Badge>
                                </div>
                              ) : isExpected ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <span className="text-slate-200 text-[8px]">—</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-2 py-2 text-center font-bold text-sm text-slate-800">
                          {student.totalScore}
                        </td>
                        <td className="px-2 py-2 text-center font-semibold text-sm text-slate-700">
                          {student.averageScore}%
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Badge className={cn("text-xs font-bold px-2 py-0.5", getGradeColor(student.grade))}>
                            {student.grade}
                          </Badge>
                        </td>
                        <td className="no-print px-2 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReportCard(student)}
                            className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: landscape; margin: 0.5cm; }
          table { font-size: 9pt !important; }
          th, td { padding: 4px !important; }
        }
      `}</style>
    </div>
  )
}