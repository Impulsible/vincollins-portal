// app/admin/broad-sheet/page.tsx
// KEY CHANGES: 
// 1. Generate sets status='generated' (already does this)
// 2. Added handlePublishReportCards function
// 3. Added Publish button in UI

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
  TrendingUp, Award, GraduationCap, ChevronLeft, Send
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
  'PHE': 27, 'Security Education': 28
}

const sortSubjectsByOrder = (subjects: string[]): string[] => {
  return [...subjects].sort((a, b) => {
    const orderA = SUBJECT_ORDER[a] || 999
    const orderB = SUBJECT_ORDER[b] || 999
    return orderA - orderB
  })
}

const extractYear = (className: string): string => {
  if (!className) return ''
  const normalized = className.trim()
  if (normalized === 'JSS 1' || normalized === 'JSS1') return 'JSS 1'
  if (normalized === 'JSS 2' || normalized === 'JSS2') return 'JSS 2'
  if (normalized === 'JSS 3' || normalized === 'JSS3') return 'JSS 3'
  if (normalized.includes('SS1')) return 'SS1'
  if (normalized.includes('SS2')) return 'SS2'
  if (normalized.includes('SS3')) return 'SS3'
  return className
}

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
  'CRS', 'Economics', 'Information Technology', 'Data Processing', 'Agricultural Science', 'Civic Education', 'Biology'
]

const SS_SUBJECTS_COMMERCIAL = [
  'English Language', 'Mathematics', 'Economics', 'Commerce',
  'Financial Accounting', 'Government', 'Civic Education', 'Data Processing',
  'Geography', 'Literature in English'
]

const getSubjectsForStudent = (studentClass: string, department?: string | null): string[] => {
  if (!studentClass) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  const year = extractYear(studentClass)
  if (year.startsWith('JSS')) return sortSubjectsByOrder(JSS_SUBJECTS)
  const dept = department?.toLowerCase() || ''
  if (dept.includes('science')) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  else if (dept.includes('art')) return sortSubjectsByOrder(SS_SUBJECTS_ARTS)
  else if (dept.includes('commercial') || dept.includes('comm')) return sortSubjectsByOrder(SS_SUBJECTS_COMMERCIAL)
  const classLower = studentClass.toLowerCase()
  if (classLower.includes('science')) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  else if (classLower.includes('arts')) return sortSubjectsByOrder(SS_SUBJECTS_ARTS)
  else if (classLower.includes('commercial')) return sortSubjectsByOrder(SS_SUBJECTS_COMMERCIAL)
  return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
}

const getAllSubjectsForClass = (className: string): string[] => {
  if (!className) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  const year = extractYear(className)
  if (year.startsWith('JSS')) return sortSubjectsByOrder(JSS_SUBJECTS)
  else if (year.startsWith('SS')) {
    const uniqueSubjects = new Set([...SS_SUBJECTS_SCIENCE, ...SS_SUBJECTS_ARTS, ...SS_SUBJECTS_COMMERCIAL])
    return sortSubjectsByOrder(Array.from(uniqueSubjects))
  }
  return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
}

const meetsMinimumSubjects = (className: string, completedSubjects: number): boolean => {
  if (!className) return completedSubjects >= SS_MIN_SUBJECTS
  const year = extractYear(className)
  if (year.startsWith('JSS')) return completedSubjects >= JSS_MIN_SUBJECTS
  return completedSubjects >= SS_MIN_SUBJECTS
}

// ============================================
// GRADING SYSTEMS
// ============================================
const getSubjectGrade = (score: number): string => {
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

const getSubjectGradeColor = (grade: string): string => {
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

const getOverallGrade = (percentage: number): string => {
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'P'
  return 'F'
}

const getOverallGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'B': 'bg-blue-100 text-blue-700 border-blue-200',
    'C': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'P': 'bg-amber-100 text-amber-700 border-amber-200',
    'F': 'bg-red-100 text-red-700 border-red-200'
  }
  return colors[grade] || 'bg-slate-100 text-slate-600'
}

const getSubjectGradeRemark = (grade: string): string => {
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
const generateAIComments = async (
  firstName: string, averageScore: number, subjects: any[], className: string, gender: string
) => {
  try {
    const response = await fetch('/api/generate-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: firstName, averageScore, subjects: subjects.map(s => ({ name: s.name, score: s.total })),
        className, gender
      })
    })
    if (response.ok) return await response.json()
  } catch (error) { console.error('API error:', error) }
  return null
}

const getFallbackTeacherComment = (
  firstName: string, avg: number, bestSubject: string, bestScore: number,
  worstSubject: string, worstScore: number, gender: string
): string => {
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
  reportCardStatus?: string | null  // NEW: track report card publish status
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

const ALL_CLASSES = [
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS1 Science', 'SS1 Arts', 'SS1 Commercial',
  'SS2 Science', 'SS2 Arts', 'SS2 Commercial',
  'SS3 Science', 'SS3 Arts', 'SS3 Commercial',
  'SS1', 'SS2', 'SS3'
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
  const [publishing, setPublishing] = useState(false)   // NEW
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [expectedSubjects, setExpectedSubjects] = useState<string[]>(sortSubjectsByOrder(SS_SUBJECTS_SCIENCE))
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

  useEffect(() => {
    const init = async () => {
      try {
        const timeout = setTimeout(() => { setLoading(false); setLoadError(true) }, LOAD_TIMEOUT)
        const { data: { session } } = await supabase.auth.getSession()
        clearTimeout(timeout)
        if (!session) return
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profileData) setProfile(profileData)
        if (ALL_CLASSES.length > 0 && !selectedClass) {
          setSelectedClass(ALL_CLASSES[0])
          setExpectedSubjects(getAllSubjectsForClass(ALL_CLASSES[0]))
        }
        setLoading(false)
      } catch { setLoading(false); setLoadError(true) }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedClass) setExpectedSubjects(getAllSubjectsForClass(selectedClass))
    if (isMounted && selectedClass && selectedTerm && selectedYear) loadBroadSheet()
  }, [selectedClass, selectedTerm, selectedYear, isMounted])

  useEffect(() => {
    if (!autoRefreshEnabled || loading || students.length === 0) return
    const startAutoRefresh = () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current)
      autoRefreshTimerRef.current = setInterval(async () => {
        if (isRefreshingRef.current) return
        isRefreshingRef.current = true
        try { await loadBroadSheet() } catch (error) { console.error('Auto-refresh error:', error) }
        finally { isRefreshingRef.current = false }
      }, AUTO_REFRESH_INTERVAL)
    }
    startAutoRefresh()
    return () => { if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current) }
  }, [autoRefreshEnabled, selectedClass, selectedTerm, selectedYear, loading, students.length])

  useEffect(() => {
    if (!selectedClass || !selectedTerm || !selectedYear) return
    const scoresChannel = supabase
      .channel('broadsheet-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ca_scores', filter: `term=eq.${selectedTerm},academic_year=eq.${selectedYear}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const subject = payload.new?.subject
            setNewScoreAlert(`📝 ${subject} scores have been updated`)
            toast.info(`📝 ${subject} scores updated`, { duration: 3000 })
            await loadBroadSheet()
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(scoresChannel) }
  }, [selectedClass, selectedTerm, selectedYear])

  useEffect(() => {
    if (newScoreAlert) {
      const timer = setTimeout(() => setNewScoreAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [newScoreAlert])

  const loadBroadSheet = useCallback(async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) return
    setLoading(true)
    setLoadError(false)
    try {
      const isJSS = selectedClass?.toUpperCase().includes('JSS')
      const isSS = selectedClass?.toUpperCase().includes('SS')

      let query = supabase
        .from('profiles')
        .select('id, full_name, display_name, admission_number, vin_id, class, department, gender')
        .eq('role', 'student').order('display_name').limit(500)

      if (isJSS) query = query.eq('class', selectedClass)
      else if (isSS) { const yearPattern = extractYear(selectedClass); query = query.ilike('class', `%${yearPattern}%`) }
      else query = query.eq('class', selectedClass)

      const { data: classStudents, error: studentError } = await query
      if (studentError) throw studentError
      if (!classStudents || classStudents.length === 0) { setStudents([]); setLoading(false); return }

      const studentIds = classStudents.map(s => s.id)

      // Load scores
      const { data: allScores, error: scoresError } = await supabase
        .from('ca_scores').select('*').in('student_id', studentIds)
        .eq('term', selectedTerm).eq('academic_year', selectedYear).eq('status', 'approved').limit(5000)
      if (scoresError) throw scoresError

      // ── NEW: Load existing report card statuses so we know who is published ──
      const { data: existingReportCards } = await supabase
        .from('report_cards')
        .select('student_id, status')
        .in('student_id', studentIds)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      const reportCardStatusMap: Record<string, string> = {}
      ;(existingReportCards || []).forEach(rc => {
        reportCardStatusMap[rc.student_id] = rc.status
      })

      const studentRecords: StudentRecord[] = classStudents.map(student => {
        const subjectsForStudent = getSubjectsForStudent(student.class, student.department)
        const totalExpected = subjectsForStudent.length
        const studentScores = (allScores || []).filter(s => s.student_id === student.id)
        const subjectMap: Record<string, SubjectScore> = {}

        studentScores.forEach(s => {
          const totalScore = (s.ca1_score || 0) + (s.ca2_score || 0) + (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
          const percentage = totalScore > 0 ? Math.round((totalScore / 100) * 100) : 0
          subjectMap[s.subject] = {
            subject: s.subject, ca1: s.ca1_score || 0, ca2: s.ca2_score || 0,
            exam_obj: s.exam_objective_score || 0, exam_theory: s.exam_theory_score || 0,
            total: totalScore, grade: getSubjectGrade(percentage), status: s.status || 'approved',
            teacher_name: s.teacher_name || ''
          }
        })

        const scoredSubjects = Object.keys(subjectMap).length
        const totalScore = Object.values(subjectMap).reduce((sum, s) => sum + s.total, 0)
        const averageScore = scoredSubjects > 0 ? Math.round(totalScore / scoredSubjects) : 0
        const grade = scoredSubjects > 0 ? getOverallGrade(averageScore) : '—'
        const meetsMinimum = meetsMinimumSubjects(student.class, scoredSubjects)

        return {
          id: student.id, name: student.display_name || student.full_name || 'Student',
          admission_number: student.admission_number || '—', vin_id: student.vin_id || '—',
          class: student.class, department: student.department || (isJSS ? 'Junior' : 'General'),
          subjectMap, totalScore, averageScore, grade,
          completedSubjects: scoredSubjects, totalSubjects: totalExpected,
          expectedSubjects: subjectsForStudent,
          hasAllSubjects: scoredSubjects >= totalExpected,
          meetsMinimum, allSubmitted: meetsMinimum,
          reportCardStatus: reportCardStatusMap[student.id] || null,  // NEW
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
    } finally { setLoading(false) }
  }, [selectedClass, selectedTerm, selectedYear, selectedDepartment])

  // ── GENERATE: saves with status='generated' (NOT visible to students yet) ──
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
            name: subject, ca: score.ca1 + score.ca2,
            exam: score.exam_obj + score.exam_theory, total: score.total,
            grade: score.grade, remark: getSubjectGradeRemark(score.grade)
          }
        }).filter(Boolean)

        const avgScore = student.averageScore
        const allScores = students.map(s => s.averageScore).filter(s => s > 0)
        const classHighest = allScores.length > 0 ? Math.max(...allScores) : 0
        const classLowest = allScores.length > 0 ? Math.min(...allScores) : 0
        const classAverage = allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
        const sortedScores = [...allScores].sort((a, b) => b - a)
        const position = sortedScores.findIndex(s => s === avgScore) + 1

        const sortedByScore = [...formattedSubjects].sort((a, b) => (b?.total || 0) - (a?.total || 0))
        const bestSubject = sortedByScore[0]?.name || 'N/A'
        const worstSubject = sortedByScore[sortedByScore.length - 1]?.name || 'N/A'
        const bestScore = sortedByScore[0]?.total || 0
        const worstScore = sortedByScore[sortedByScore.length - 1]?.total || 0

        const { data: studentProfile } = await supabase.from('profiles').select('gender').eq('id', student.id).single()
        const gender = studentProfile?.gender || 'male'
        const firstName = student.name.split(' ')[0] || student.name

        let teacherComment = ''
        let principalComment = ''

        try {
          const aiComments = await generateAIComments(firstName, avgScore, formattedSubjects, selectedClass, gender)
          if (aiComments) {
            teacherComment = aiComments.teacher_comment
            principalComment = aiComments.principal_comment
          } else {
            teacherComment = getFallbackTeacherComment(firstName, avgScore, bestSubject, bestScore, worstSubject, worstScore, gender)
            principalComment = getFallbackPrincipalComment(avgScore, firstName, gender)
          }
        } catch {
          teacherComment = getFallbackTeacherComment(firstName, avgScore, bestSubject, bestScore, worstSubject, worstScore, gender)
          principalComment = getFallbackPrincipalComment(avgScore, firstName, gender)
        }

        const reportCardData = {
          student_id: student.id, student_name: student.name,
          student_display_name: student.name, student_vin: student.vin_id,
          student_admission_number: student.admission_number,
          term: selectedTerm, academic_year: selectedYear,
          class: selectedClass, class_teacher: profile?.full_name || 'Class Teacher',
          principal_name: 'Principal', school_name: 'VINCOLLINS COLLEGE',
          total_score: student.totalScore, average_score: avgScore,
          class_highest: classHighest, class_lowest: classLowest, class_average: classAverage,
          position, total_students: students.length,
          subjects_data: formattedSubjects,
          teacher_comments: teacherComment, principal_comments: principalComment,
          // ── CRITICAL: generated but NOT published yet ──
          status: 'generated',
          generated_by: profile?.id,
          generated_at: new Date().toISOString(),
          session_year: selectedYear,
          submitted_at: new Date().toISOString(),
          // ── published_at is NULL until admin explicitly publishes ──
          published_at: null,
        }

        await supabase.from('report_cards').delete()
          .eq('student_id', student.id).eq('term', selectedTerm).eq('academic_year', selectedYear)

        const { error } = await supabase.from('report_cards').insert(reportCardData).select()
        if (error) throw error

        count++
        setGenProgress({ current: count, total: completeStudents.length })
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <div>✅ Generated {count} report cards for {selectedClass}!</div>
          <div className="text-xs text-amber-700 font-medium">
            ⚠️ Report cards are NOT yet visible to students. Click "Publish" to release them.
          </div>
          <Button
            variant="link"
            className="text-blue-600 p-0 h-auto font-semibold text-sm"
            onClick={() => {
              const params = new URLSearchParams({ class: selectedClass, term: selectedTerm, year: selectedYear, status: 'generated' })
              router.push(`/admin/report-cards?${params.toString()}`)
            }}
          >
            <FileText className="h-4 w-4 mr-1" />
            View Generated Report Cards →
          </Button>
        </div>,
        { duration: 10000 }
      )
      await loadBroadSheet()
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate report cards')
    } finally {
      setGenerating(false)
      setGenProgress({ current: 0, total: 0 })
    }
  }

  // ── NEW: PUBLISH — makes report cards visible to students ──
  const handlePublishReportCards = async () => {
    // Only publish for students who have generated (not yet published) report cards
    const generatedStudents = students.filter(
      s => s.meetsMinimum && s.reportCardStatus === 'generated'
    )

    if (generatedStudents.length === 0) {
      toast.warning('No generated report cards to publish. Generate report cards first.')
      return
    }

    setPublishing(true)
    try {
      const studentIds = generatedStudents.map(s => s.id)

      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .in('student_id', studentIds)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('status', 'generated')   // only promote generated → published

      if (error) throw error

      toast.success(
        <div className="flex flex-col gap-1">
          <div>🎉 Published {generatedStudents.length} report cards!</div>
          <div className="text-xs">Students can now view their report cards.</div>
        </div>,
        { duration: 6000 }
      )
      await loadBroadSheet()
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish report cards')
    } finally {
      setPublishing(false)
    }
  }

  // ── NEW: UNPUBLISH — hides report cards from students again ──
  const handleUnpublishReportCards = async () => {
    const publishedStudents = students.filter(s => s.reportCardStatus === 'published')
    if (publishedStudents.length === 0) {
      toast.warning('No published report cards to unpublish.')
      return
    }

    setPublishing(true)
    try {
      const studentIds = publishedStudents.map(s => s.id)
      const { error } = await supabase
        .from('report_cards')
        .update({ status: 'generated', published_at: null })
        .in('student_id', studentIds)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('status', 'published')

      if (error) throw error
      toast.success(`Unpublished ${publishedStudents.length} report cards. Students can no longer view them.`)
      await loadBroadSheet()
    } catch (error) {
      console.error('Unpublish error:', error)
      toast.error('Failed to unpublish report cards')
    } finally { setPublishing(false) }
  }

  const handleViewReportCard = (student: StudentRecord) => {
    router.push(`/admin/report-cards/view?student=${student.id}&term=${selectedTerm}&year=${selectedYear}`)
  }

  const handleExportCSV = () => {
    if (students.length === 0) { toast.error('No data to export'); return }
    const headers = ['Student Name', 'Department', 'Admission No', ...expectedSubjects, 'Total', 'Average', 'Grade', 'Status', 'Report Status']
    const rows = students.map(s => {
      const subjects = expectedSubjects.map(sub => {
        const sc = s.subjectMap[sub]
        return sc ? `${sc.total} (${sc.grade})` : '—'
      })
      const status = s.meetsMinimum ? (s.allSubmitted ? 'Ready' : 'Pending') : `${s.completedSubjects}/${s.totalSubjects} subjects`
      return [s.name, s.department || '—', s.admission_number, ...subjects, s.totalScore, `${s.averageScore}%`, s.grade, status, s.reportCardStatus || 'None']
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

  const handlePrint = () => { if (isMounted) window.print() }
  const handleRetry = () => { setLoadError(false); setLoading(true); loadBroadSheet() }

  const stats = useMemo(() => {
    const readyForReport = students.filter(s => s.meetsMinimum && s.allSubmitted)
    const complete = students.filter(s => s.hasAllSubjects)
    const generated = students.filter(s => s.reportCardStatus === 'generated')
    const published = students.filter(s => s.reportCardStatus === 'published')
    const classAvg = readyForReport.length > 0
      ? Math.round(readyForReport.reduce((sum, s) => sum + s.averageScore, 0) / readyForReport.length) : 0
    const topScore = readyForReport.length > 0 ? Math.max(...readyForReport.map(s => s.totalScore)) : 0
    const minRequired = selectedClass?.toUpperCase().startsWith('JSS') ? JSS_MIN_SUBJECTS : SS_MIN_SUBJECTS
    const departmentBreakdown = students.reduce((acc, s) => {
      const dept = s.department || 'Unknown'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { total: students.length, complete: complete.length, readyForReport: readyForReport.length, generated: generated.length, published: published.length, incomplete: students.length - complete.length, classAvg, topScore, minRequired, departmentBreakdown }
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
        <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2 text-slate-600 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {newScoreAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">{newScoreAlert}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setNewScoreAlert(null); loadBroadSheet() }}
              className="h-8 text-xs text-emerald-600 hover:text-emerald-700 w-full sm:w-auto">
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
            <p className="text-sm text-slate-500 mt-1">Class performance overview and report card generation</p>
            <p className="text-xs text-slate-400">
              {displayClass} • {displayTermLabel} • {displayYear} • Min {minRequired} subjects for report
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default" size="sm"
              onClick={() => {
                const params = new URLSearchParams({ class: selectedClass, term: selectedTerm, year: selectedYear })
                router.push(`/admin/report-cards?${params.toString()}`)
              }}
              className="bg-blue-600 hover:bg-blue-700 h-9 text-sm">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Report Cards
            </Button>
            <Button variant={autoRefreshEnabled ? "default" : "outline"} size="sm"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={cn("h-9 text-sm", autoRefreshEnabled && "bg-emerald-600 hover:bg-emerald-700")}>
              <Zap className="h-3.5 w-3.5 mr-1.5" /> {autoRefreshEnabled ? 'Auto ON' : 'Auto OFF'}
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
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{ALL_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Session</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d.value} value={d.value}>
                        <span className="flex items-center gap-2"><span>{d.icon}</span>{d.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Name, Admission No..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Generate + Publish buttons ── */}
            <div className="mt-4 flex flex-wrap gap-2">
              {/* GENERATE */}
              <Button
                onClick={handleGenerateReportCards}
                disabled={generating || publishing || stats.readyForReport === 0}
                className="bg-purple-600 hover:bg-purple-700 h-10"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating... {genProgress.current}/{genProgress.total}</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Generate Report Cards ({stats.readyForReport} ready)</>
                )}
              </Button>

              {/* PUBLISH — only show when there are generated (unpublished) cards */}
              {stats.generated > 0 && (
                <Button
                  onClick={handlePublishReportCards}
                  disabled={generating || publishing}
                  className="bg-green-600 hover:bg-green-700 h-10"
                >
                  {publishing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Publish to Students ({stats.generated})</>
                  )}
                </Button>
              )}

              {/* UNPUBLISH — only show when there are published cards */}
              {stats.published > 0 && (
                <Button
                  onClick={handleUnpublishReportCards}
                  disabled={generating || publishing}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 h-10"
                >
                  {publishing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Working...</>
                  ) : (
                    <><Shield className="h-4 w-4 mr-2" />Unpublish ({stats.published})</>
                  )}
                </Button>
              )}
            </div>

            {/* ── Status summary ── */}
            {(stats.generated > 0 || stats.published > 0) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {stats.generated > 0 && (
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    ⏳ {stats.generated} generated (not yet visible to students)
                  </span>
                )}
                {stats.published > 0 && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    ✅ {stats.published} published (visible to students)
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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
          {/* NEW stat cards */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Generated</p>
              <p className="text-xl font-bold text-amber-600">{stats.generated}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-500 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Published</p>
              <p className="text-xl font-bold text-teal-600">{stats.published}</p>
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
            <div className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Broadsheet Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border shadow-lg overflow-hidden print:shadow-none">
          <div className="hidden print:block p-4 text-center border-b">
            <h1 className="text-xl font-bold">VINCOLLINS COLLEGE</h1>
            <p className="text-base font-semibold">Broad Sheet - {selectedClass}</p>
            <p className="text-xs">{getTermLabel(selectedTerm)} • {selectedYear}</p>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-700 text-xs min-w-[160px]">Student</th>
                  <th className="px-2 py-3 text-left font-semibold text-slate-700 text-xs min-w-[100px]">Admission No</th>
                  {expectedSubjects.map(subject => (
                    <th key={subject} className="px-2 py-3 text-center font-semibold text-slate-700 text-xs whitespace-nowrap min-w-[70px]">
                      {subject.split(' ').slice(0, 2).join(' ')}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[60px]">Total</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[60px]">Avg</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[60px]">Grade</th>
                  <th className="no-print px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[90px]">Status</th>
                  <th className="no-print px-2 py-3 text-center font-semibold text-slate-700 text-xs min-w-[70px]">Report</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={expectedSubjects.length + 7} className="text-center py-12">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No students found</p>
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, idx) => {
                    const isJSS = student.class?.toUpperCase().startsWith('JSS')
                    let departmentDisplay = 'General'
                    if (student.department === 'Science') departmentDisplay = '🔬 Science'
                    else if (student.department === 'Arts') departmentDisplay = '🎭 Arts'
                    else if (student.department === 'Commercial') departmentDisplay = '💼 Commercial'
                    else if (isJSS) departmentDisplay = 'Junior'
                    else if (student.class?.includes('Science')) departmentDisplay = '🔬 Science'
                    else if (student.class?.includes('Arts')) departmentDisplay = '🎭 Arts'
                    else if (student.class?.includes('Commercial')) departmentDisplay = '💼 Commercial'

                    return (
                      <tr key={student.id}
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
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{departmentDisplay}</Badge>
                              {student.meetsMinimum && student.allSubmitted && (
                                <Badge className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0">
                                  <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5" />Ready
                                </Badge>
                              )}
                              {!student.meetsMinimum && (
                                <Badge className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0">
                                  {student.completedSubjects}/{minRequired} min
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{student.vin_id}</p>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-left font-mono text-xs">{student.admission_number}</td>
                        {expectedSubjects.map(subject => {
                          const score = student.subjectMap[subject]
                          const isExpected = student.expectedSubjects.includes(subject)
                          return (
                            <td key={subject} className="px-2 py-2 text-center">
                              {score && isExpected ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-semibold text-xs">{score.total}</span>
                                  <Badge className={cn("text-[8px] px-1 py-0", getSubjectGradeColor(score.grade))}>
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
                        <td className="px-2 py-2 text-center font-bold text-sm text-slate-800">{student.totalScore}</td>
                        <td className="px-2 py-2 text-center font-semibold text-sm text-slate-700">{student.averageScore}%</td>
                        <td className="px-2 py-2 text-center">
                          <Badge className={cn("text-xs font-bold px-2 py-0.5", getOverallGradeColor(student.grade))}>{student.grade}</Badge>
                        </td>
                        {/* ── NEW: Report card status column ── */}
                        <td className="no-print px-2 py-2 text-center">
                          {student.reportCardStatus === 'published' ? (
                            <Badge className="text-[9px] bg-green-100 text-green-700 border border-green-200">
                              ✅ Published
                            </Badge>
                          ) : student.reportCardStatus === 'generated' ? (
                            <Badge className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200">
                              ⏳ Generated
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200">
                              — None
                            </Badge>
                          )}
                        </td>
                        <td className="no-print px-2 py-2 text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleViewReportCard(student)}
                            className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
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