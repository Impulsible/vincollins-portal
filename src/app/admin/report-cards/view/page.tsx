// app/admin/report-cards/view/page.tsx - FIXED PRINT LAYOUT
'use client'

import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Loader2,
  Sparkles,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  School,
  Mail,
  Phone,
  User,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'

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

const sortSubjectsByOrder = (subjects: any[]) => {
  return [...subjects].sort((a, b) => {
    const orderA = SUBJECT_ORDER[a.name] || 999
    const orderB = SUBJECT_ORDER[b.name] || 999
    return orderA - orderB
  })
}

// ============================================
// WAEC GRADING SYSTEM FOR SUBJECTS
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

const getSubjectGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'B2': case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'C4': case 'C5': case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'D7': case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
  }
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
// OVERALL GRADE SYSTEM (A, B, C, P, F)
// ============================================
const getOverallGrade = (score: number): string => {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'P'
  return 'F'
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'B': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'C': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'P': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'F': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

const getOverallGradeTextColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

const getOverallGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'P': 'Pass',
    'F': 'Fail'
  }
  return remarks[grade] || ''
}

// ============================================
// AI COMMENT GENERATION
// ============================================
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
  name: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface SchoolSettings {
  name: string
  address: string
  phone: string
  email: string
  logo_url?: string
  motto?: string
}

interface AssessmentData {
  behaviorRatings?: Array<{ name: string; rating: number }>
  skillRatings?: Array<{ name: string; rating: number }>
}

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ViewReportCardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const printRef = useRef<HTMLDivElement>(null)

  const studentId = searchParams.get('student')
  const term = searchParams.get('term') || 'third'
  const year = searchParams.get('year') || '2025/2026'

  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS)
  const [student, setStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<SubjectScore[]>([])
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({})
  const [totalScore, setTotalScore] = useState(0)
  const [averageScore, setAverageScore] = useState(0)
  const [overallGrade, setOverallGrade] = useState('')
  const [nextTermDate, setNextTermDate] = useState<string>('')
  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [classTeacher, setClassTeacher] = useState('')
  const [reportCardId, setReportCardId] = useState<string | null>(null)

  // Print handler with optimized layout
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_Card_${student?.display_name || student?.full_name || 'Student'}_${term}_${year}`,
    pageStyle: `
      @page { 
        size: A4 portrait; 
        margin: 0.4cm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body { 
          background: white !important; 
          margin: 0 !important; 
          padding: 0 !important; 
          font-size: 10px !important;
          line-height: 1.4 !important;
          color: #000 !important;
        }
        .no-print { 
          display: none !important; 
        }
        .print-container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0.2cm !important;
          margin: 0 !important;
        }
        .print-report {
          border: none !important;
          padding: 0.2cm !important;
          min-height: auto !important;
          width: 100% !important;
          font-size: 10px !important;
        }
        .bg-blue-700, .bg-blue-600, .bg-purple-600 {
          background-color: #1e40af !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .bg-emerald-600 { background-color: #059669 !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-cyan-600 { background-color: #0891b2 !important; }
        .bg-amber-600 { background-color: #d97706 !important; }
        .bg-red-600 { background-color: #dc2626 !important; }
        .border {
          border-color: #000 !important;
          border-width: 1px !important;
        }
        .border-2 {
          border-color: #000 !important;
          border-width: 2px !important;
        }
        table {
          table-layout: fixed !important;
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 9px !important;
        }
        th, td {
          word-break: break-word !important;
          padding: 3px 4px !important;
          border-color: #000 !important;
          border-width: 1px !important;
        }
        th {
          font-weight: 700 !important;
          background-color: #1e40af !important;
          color: white !important;
          font-size: 9px !important;
        }
        .text-gray-800 { color: #1f2937 !important; }
        .text-black { color: #000 !important; }
        .font-bold { font-weight: 700 !important; }
        .font-semibold { font-weight: 600 !important; }
        .font-medium { font-weight: 500 !important; }
        .text-emerald-700 { color: #047857 !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-blue-700 { color: #1d4ed8 !important; }
        .text-cyan-700 { color: #0e7490 !important; }
        .text-amber-700 { color: #b45309 !important; }
        .text-purple-800 { color: #6b21a8 !important; }
        .text-blue-800 { color: #1e40af !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .bg-purple-50 { background-color: #faf5ff !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-white { background-color: #ffffff !important; }
        .grid-cols-\\[2.2fr_1.2fr\\] {
          grid-template-columns: 65% 35% !important;
        }
        .gap-3 { gap: 8px !important; }
        .gap-4 { gap: 10px !important; }
        .space-y-3 > * + * { margin-top: 8px !important; }
        .space-y-1\\.5 > * + * { margin-top: 4px !important; }
        .mt-3 { margin-top: 8px !important; }
        .mt-2 { margin-top: 6px !important; }
        .mt-4 { margin-top: 10px !important; }
        .mb-3 { margin-bottom: 8px !important; }
        .mb-2 { margin-bottom: 6px !important; }
        .mb-4 { margin-bottom: 10px !important; }
        .p-2 { padding: 6px !important; }
        .p-3 { padding: 8px !important; }
        .p-4 { padding: 10px !important; }
        .px-2 { padding-left: 6px !important; padding-right: 6px !important; }
        .px-3 { padding-left: 8px !important; padding-right: 8px !important; }
        .py-1 { padding-top: 3px !important; padding-bottom: 3px !important; }
        .py-1\\.5 { padding-top: 4px !important; padding-bottom: 4px !important; }
        .py-2 { padding-top: 5px !important; padding-bottom: 5px !important; }
        h1 { font-size: 14px !important; font-weight: 700 !important; }
        h2 { font-size: 12px !important; font-weight: 700 !important; }
        .text-\\[20px\\] { font-size: 14px !important; }
        .text-\\[18px\\] { font-size: 14px !important; }
        .text-\\[16px\\] { font-size: 12px !important; }
        .text-\\[14px\\] { font-size: 12px !important; }
        .text-\\[13px\\] { font-size: 11px !important; }
        .text-\\[12px\\] { font-size: 11px !important; }
        .text-\\[11px\\] { font-size: 10px !important; }
        .text-\\[10px\\] { font-size: 9px !important; }
        .text-\\[9px\\] { font-size: 8px !important; }
        .text-\\[8px\\] { font-size: 8px !important; }
        .italic { font-style: italic !important; }
        .tracking-wide { letter-spacing: 0.025em !important; }
        .uppercase { text-transform: uppercase !important; }
        .break-words { word-break: break-word !important; }
        .w-\\[210mm\\] { width: 100% !important; }
        .min-h-\\[297mm\\] { min-height: auto !important; }
        .border-blue-900 { border-color: #1e3a5f !important; }
        .border-gray-300 { border-color: #d1d5db !important; }
        .border-gray-400 { border-color: #9ca3af !important; }
        .border-purple-200 { border-color: #e9d5ff !important; }
        .border-blue-300 { border-color: #93c5fd !important; }
        .border-t { border-top-width: 1px !important; }
        .border-t-2 { border-top-width: 2px !important; }
        .border-b-2 { border-bottom-width: 2px !important; }
        .rounded-sm { border-radius: 2px !important; }
        .rounded-t-sm { border-radius: 2px 2px 0 0 !important; }
        .rounded-b-sm { border-radius: 0 0 2px 2px !important; }
        .overflow-hidden { overflow: hidden !important; }
        .overflow-x-auto { overflow: visible !important; }
        .w-full { width: 100% !important; }
        .w-\\[35\\%\\] { width: 35% !important; }
        .w-\\[10\\%\\] { width: 10% !important; }
        .w-\\[12\\%\\] { width: 12% !important; }
        .w-\\[23\\%\\] { width: 23% !important; }
        .text-center { text-align: center !important; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .font-mono { font-family: monospace !important; }
        .inline-block { display: inline-block !important; }
        .break-words { word-wrap: break-word !important; }
        .shrink-0 { flex-shrink: 0 !important; }
        .w-16 { width: 40px !important; }
        .w-14 { width: 36px !important; }
        .w-20 { width: 50px !important; }
        .h-14 { height: 36px !important; }
        .h-20 { height: 50px !important; }
        .h-24 { height: 60px !important; }
        .object-contain { object-fit: contain !important; }
        .object-cover { object-fit: cover !important; }
      }
    `,
  })

  const loadNextTermDate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'next_term_date')
        .maybeSingle()

      if (data?.value) {
        setNextTermDate(data.value)
      }
    } catch (error) {
      console.error('Error loading next term date:', error)
    }
  }, [])

  const handleRegenerateComments = async () => {
    if (!studentId || !student) return
    
    setRegenerating(true)
    try {
      const firstName = student.display_name?.split(' ')[0] || student.full_name?.split(' ')[0] || 'Student'
      const gender = student.gender || 'male'
      const className = student.class || '—'
      
      const subjectsForAPI = subjects.map(s => ({ name: s.name, score: s.total }))
      
      let newTeacherComment = ''
      let newPrincipalComment = ''
      
      try {
        const response = await fetch('/api/generate-comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: firstName,
            averageScore: averageScore,
            subjects: subjectsForAPI,
            className: className,
            gender: gender
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          newTeacherComment = data.teacher_comment
          newPrincipalComment = data.principal_comment
        } else {
          const bestSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total > b.total ? a : b) : null
          const worstSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total < b.total ? a : b) : null
          newTeacherComment = getFallbackTeacherComment(
            firstName, 
            averageScore, 
            bestSubject?.name || 'N/A', 
            bestSubject?.total || 0,
            worstSubject?.name || 'N/A',
            worstSubject?.total || 0,
            gender
          )
          newPrincipalComment = getFallbackPrincipalComment(averageScore, firstName, gender)
        }
      } catch (error) {
        console.error('API error:', error)
        const bestSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total > b.total ? a : b) : null
        const worstSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total < b.total ? a : b) : null
        newTeacherComment = getFallbackTeacherComment(
          firstName, 
          averageScore, 
          bestSubject?.name || 'N/A', 
          bestSubject?.total || 0,
          worstSubject?.name || 'N/A',
          worstSubject?.total || 0,
          gender
        )
        newPrincipalComment = getFallbackPrincipalComment(averageScore, firstName, gender)
      }
      
      const { error: updateError } = await supabase
        .from('report_cards')
        .update({
          teacher_comments: newTeacherComment,
          principal_comments: newPrincipalComment,
        })
        .eq('id', reportCardId)
      
      if (updateError) throw updateError
      
      setTeacherComment(newTeacherComment)
      setPrincipalComment(newPrincipalComment)
      toast.success('Comments regenerated successfully!')
      
    } catch (error) {
      console.error('Error regenerating comments:', error)
      toast.error('Failed to regenerate comments')
    } finally {
      setRegenerating(false)
    }
  }

  const loadScores = useCallback(async () => {
    if (!studentId) {
      toast.error('No student selected')
      router.back()
      return
    }

    setLoading(true)

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      const { data: existingReportCard, error: reportCardError } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .maybeSingle()

      if (existingReportCard && !reportCardError) {
        setReportCardId(existingReportCard.id)
        setSubjects(existingReportCard.subjects_data || [])
        setAssessmentData(existingReportCard.assessment_data || {})
        setTeacherComment(existingReportCard.teacher_comments || 'No comment available.')
        setPrincipalComment(existingReportCard.principal_comments || 'No comment available.')
        setClassTeacher(existingReportCard.class_teacher || '')
        setTotalScore(existingReportCard.total_score || 0)
        setAverageScore(existingReportCard.average_score || 0)
        setOverallGrade(getOverallGrade(existingReportCard.average_score || 0))
      } else {
        const { data: scoresData, error: scoresError } = await supabase
          .from('ca_scores')
          .select('*')
          .eq('student_id', studentId)
          .eq('term', term)
          .eq('academic_year', year)
          .eq('status', 'approved')

        if (scoresError) throw scoresError

        let processedSubjects: SubjectScore[] = (scoresData || []).map((score: any) => {
          const combinedCA = (score.ca1_score || 0) + (score.ca2_score || 0)
          const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
          const total = combinedCA + examTotal
          const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
          const grade = getSubjectGrade(percentage)
          const remark = getSubjectGradeRemark(grade)

          return {
            name: score.subject,
            ca: combinedCA,
            exam: examTotal,
            total: total,
            grade: grade,
            remark: remark,
          }
        })

        processedSubjects = sortSubjectsByOrder(processedSubjects)
        setSubjects(processedSubjects)

        const total = processedSubjects.reduce((sum, s) => sum + s.total, 0)
        const avg = processedSubjects.length > 0 ? total / processedSubjects.length : 0
        
        setTotalScore(total)
        setAverageScore(avg)
        setOverallGrade(getOverallGrade(avg))

        const getRating = (base: number): number => {
          if (avg >= 90) return Math.min(5, base + 1)
          if (avg >= 80) return base
          if (avg >= 70) return Math.max(3, base)
          if (avg >= 60) return Math.max(2, base - 1)
          return Math.max(1, base - 2)
        }

        const assessment = {
          behaviorRatings: [
            { name: 'Honesty', rating: getRating(4) },
            { name: 'Neatness', rating: getRating(4) },
            { name: 'Obedience', rating: getRating(4) },
            { name: 'Orderliness', rating: getRating(3) },
            { name: 'Diligence', rating: getRating(4) },
            { name: 'Punctuality', rating: getRating(4) },
            { name: 'Leadership', rating: getRating(3) },
            { name: 'Politeness', rating: getRating(4) },
          ],
          skillRatings: [
            { name: 'Handwriting', rating: getRating(4) },
            { name: 'Verbal Fluency', rating: getRating(4) },
            { name: 'Sports', rating: getRating(3) },
            { name: 'Handling Tools', rating: getRating(3) },
            { name: 'Club Activities', rating: getRating(4) },
          ]
        }
        setAssessmentData(assessment)

        const { data: teacherData } = await supabase
          .from('profiles')
          .select('display_name, full_name')
          .eq('role', 'teacher')
          .limit(1)
        
        const teacherName = teacherData?.[0]?.display_name || teacherData?.[0]?.full_name || 'Class Teacher'
        setClassTeacher(teacherName)

        let firstName = studentData?.first_name || ''
        if (!firstName) {
          const nameToSplit = studentData?.display_name || studentData?.full_name || 'Student'
          firstName = nameToSplit.split(' ')[0]
        }
        if (firstName) {
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        } else {
          firstName = 'Student'
        }
        
        const gender = studentData?.gender || 'male'
        const className = studentData?.class || '—'
        
        const subjectsForAPI = processedSubjects.map(s => ({ name: s.name, score: s.total }))
        
        try {
          const response = await fetch('/api/generate-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: firstName,
              averageScore: avg,
              subjects: subjectsForAPI,
              className: className,
              gender: gender
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            setTeacherComment(data.teacher_comment)
            setPrincipalComment(data.principal_comment)
          } else {
            const bestSubject = processedSubjects.length > 0 ? processedSubjects.reduce((a, b) => a.total > b.total ? a : b) : null
            const worstSubject = processedSubjects.length > 0 ? processedSubjects.reduce((a, b) => a.total < b.total ? a : b) : null
            setTeacherComment(getFallbackTeacherComment(firstName, avg, bestSubject?.name || 'N/A', bestSubject?.total || 0, worstSubject?.name || 'N/A', worstSubject?.total || 0, gender))
            setPrincipalComment(getFallbackPrincipalComment(avg, firstName, gender))
          }
        } catch (error) {
          console.error('API error:', error)
          const bestSubject = processedSubjects.length > 0 ? processedSubjects.reduce((a, b) => a.total > b.total ? a : b) : null
          const worstSubject = processedSubjects.length > 0 ? processedSubjects.reduce((a, b) => a.total < b.total ? a : b) : null
          setTeacherComment(getFallbackTeacherComment(firstName, avg, bestSubject?.name || 'N/A', bestSubject?.total || 0, worstSubject?.name || 'N/A', worstSubject?.total || 0, gender))
          setPrincipalComment(getFallbackPrincipalComment(avg, firstName, gender))
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [studentId, term, year, router])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      const { data: schoolData } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle()

      if (schoolData) {
        setSchoolSettings({
          name: schoolData.school_name || DEFAULT_SCHOOL_SETTINGS.name,
          address: schoolData.school_address || DEFAULT_SCHOOL_SETTINGS.address,
          phone: schoolData.school_phone || DEFAULT_SCHOOL_SETTINGS.phone,
          email: schoolData.school_email || DEFAULT_SCHOOL_SETTINGS.email,
          logo_url: schoolData.logo_path,
          motto: schoolData.school_motto || DEFAULT_SCHOOL_SETTINGS.motto,
        })
      }

      await loadNextTermDate()
      
      if (studentId) {
        await loadScores()
      } else {
        toast.error('No student selected')
        router.back()
      }
    }

    init()
  }, [studentId, term, year, router, loadNextTermDate, loadScores])

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">Student not found</p>
        <Button onClick={handleBack}>Go Back to Broadsheet</Button>
      </div>
    )
  }

  const termLabels: Record<string, string> = {
    first: 'First Term',
    second: 'Second Term',
    third: 'Third Term',
  }
  const termDisplay = termLabels[term] || term
  const fullName = student.display_name || student.full_name || 'Student'
  const formattedNextTermDate = nextTermDate 
    ? new Date(nextTermDate).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

  const bestSubject = subjects.length > 0 
    ? subjects.reduce((a, b) => a.total > b.total ? a : b) 
    : null
  
  const worstSubject = subjects.length > 0 
    ? subjects.reduce((a, b) => a.total < b.total ? a : b) 
    : null
  
  const showAreaForImprovement = worstSubject && worstSubject.total < 50
  const formattedAvg = averageScore.toFixed(2)

  const behaviorRatings = assessmentData.behaviorRatings || []
  const skillRatings = assessmentData.skillRatings || []

  return (
    <div className="bg-gray-100 min-h-screen py-4">
      {/* TOPBAR */}
      <div className="no-print max-w-[210mm] mx-auto mb-3 flex items-center justify-between flex-wrap gap-2">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Broadsheet
        </Button>

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleRegenerateComments} 
            disabled={regenerating}
            variant="outline"
            className="border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Regenerate Comments
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="h-4 w-4 mr-2" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* REPORT CARD - Print Container */}
      <div ref={printRef} className="print-container">
        <div className="print-report bg-white w-[210mm] min-h-[297mm] mx-auto text-[12px] text-black border-2 border-blue-900 p-3 print:p-0 print:border-none print:w-full print:min-h-auto">
          
          {/* HEADER */}
          <div className="border-b-2 border-blue-900 pb-2 print:pb-1.5 mb-3 print:mb-2">
            <div className="flex items-start justify-between gap-3 print:gap-2">
              {/* LOGO */}
              <div className="w-16 print:w-12 shrink-0">
                {schoolSettings.logo_url ? (
                  <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10" />
                ) : (
                  <div className="w-14 h-14 border-2 border-blue-900 rounded flex items-center justify-center text-[10px] bg-blue-50 print:w-10 print:h-10">
                    <School className="h-8 w-8 text-blue-900 print:h-6 print:w-6" />
                  </div>
                )}
              </div>

              {/* SCHOOL INFO */}
              <div className="flex-1 text-center">
                <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[14px] tracking-wide">
                  {schoolSettings.name}
                </h1>
                <p className="text-[11px] print:text-[9px] text-gray-700">{schoolSettings.address}</p>
                <p className="text-[11px] print:text-[9px] text-gray-700">
                  {schoolSettings.email} | {schoolSettings.phone}
                </p>
                <p className="text-[10px] italic text-amber-700 mt-0.5 print:text-[8px]">"{schoolSettings.motto}"</p>
                <h2 className="font-bold mt-1.5 text-[14px] print:text-[12px] text-blue-900">
                  {termDisplay} Student&apos;s Performance Report
                </h2>
                <p className="text-[10px] text-gray-600 mt-0.5 print:text-[8px]">Academic Session: {year}</p>
              </div>

              {/* PHOTO */}
              <div className="w-20 h-24 border-2 border-blue-900 rounded overflow-hidden print:w-14 print:h-16 shrink-0">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    <User className="h-8 w-8 print:h-6 print:w-6" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STUDENT INFO */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] mt-2 mb-3 print:mt-1 print:mb-2 print:text-[10px]">
            <div className="flex"><span className="font-bold w-32 text-gray-700 print:w-24">Name:</span><span className="font-medium">{fullName}</span></div>
            <div className="flex"><span className="font-bold w-32 text-gray-700 print:w-24">Admission No:</span><span className="font-medium">{student.admission_number || student.vin_id || '—'}</span></div>
            <div className="flex"><span className="font-bold w-32 text-gray-700 print:w-24">Class:</span><span className="font-medium">{student.class || '—'}</span></div>
            <div className="flex"><span className="font-bold w-32 text-gray-700 print:w-24">Term:</span><span className="font-medium">{termDisplay}</span></div>
            <div className="flex"><span className="font-bold w-32 text-gray-700 print:w-24">Session:</span><span className="font-medium">{year}</span></div>
            <div className="flex items-center">
              <span className="font-bold w-32 text-gray-700 print:w-24">Next Term Begins:</span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3 text-blue-600 print:h-2 print:w-2" />
                {formattedNextTermDate}
              </span>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-[2.2fr_1.2fr] gap-3 print:gap-2">
            {/* LEFT COLUMN - RESULTS TABLE */}
            <div className="min-w-0 overflow-hidden">
              <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                <table className="w-full border-collapse text-[11px] print:text-[9px] table-fixed">
                  <thead className="bg-blue-700 text-white">
                    <tr>
                      <th className="border border-blue-500 px-2 py-1.5 text-left w-[35%] font-bold print:px-1.5 print:py-1">Subjects</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-[10%] font-bold print:px-1.5 print:py-1">CA</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-[10%] font-bold print:px-1.5 print:py-1">Exam</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-[10%] font-bold print:px-1.5 print:py-1">Total</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-[12%] font-bold print:px-1.5 print:py-1">Grade</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-left w-[23%] font-bold print:px-1.5 print:py-1">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-gray-500 print:py-2">
                          No scores available
                        </td>
                      </tr>
                    ) : (
                      subjects.map((subject, index) => (
                        <tr key={subject.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-400 px-2 py-1 font-medium print:px-1.5 print:py-0.5" title={subject.name}>
                            {subject.name}
                          </td>
                          <td className="border border-gray-400 text-center font-mono print:px-1.5 print:py-0.5">{subject.ca}</td>
                          <td className="border border-gray-400 text-center font-mono print:px-1.5 print:py-0.5">{subject.exam}</td>
                          <td className="border border-gray-400 text-center font-bold font-mono print:px-1.5 print:py-0.5">{subject.total}</td>
                          <td className="border border-gray-400 text-center print:px-1.5 print:py-0.5">
                            <span className={getSubjectGradeStyle(subject.grade)}>{subject.grade}</span>
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-[10px] break-words print:px-1.5 print:py-0.5 print:text-[8px]" title={subject.remark}>
                            {subject.remark}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td colSpan={3} className="border border-gray-400 px-2 py-1.5 text-right print:px-1.5 print:py-1">TOTAL / AVERAGE:</td>
                      <td className="border border-gray-400 text-center print:px-1.5 print:py-1">{totalScore}</td>
                      <td className="border border-gray-400 text-center print:px-1.5 print:py-1">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold print:text-[8px]", getOverallGradeColor(overallGrade))}>
                          {overallGrade}
                        </span>
                      </td>
                      <td className="border border-gray-400 text-center print:px-1.5 print:py-1">{formattedAvg}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* CLASS TEACHER'S REMARK */}
              <div className="mt-3 border border-gray-300 rounded-sm overflow-hidden print:mt-2">
                <div className="bg-purple-600 text-white px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 print:px-2 print:py-0.5 print:text-[9px]">
                  <Sparkles className="h-3 w-3 print:h-2 print:w-2" />
                  CLASS TEACHER'S REMARK
                </div>
                <div className="p-2.5 text-[11px] italic leading-relaxed bg-purple-50 break-words print:p-2 print:text-[9px]">
                  {teacherComment}
                </div>
                <div className="px-2.5 pb-1.5 text-[9px] text-gray-500 border-t border-purple-200 pt-1 print:px-2 print:pb-1 print:text-[8px]">
                  Signed: {classTeacher || 'Class Teacher'}
                </div>
              </div>

              {/* PRINCIPAL'S REMARK */}
              <div className="mt-2 border border-gray-300 rounded-sm overflow-hidden print:mt-1.5">
                <div className="bg-blue-600 text-white px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 print:px-2 print:py-0.5 print:text-[9px]">
                  <Award className="h-3 w-3 print:h-2 print:w-2" />
                  PRINCIPAL'S REMARK
                </div>
                <div className="p-2.5 text-[11px] italic leading-relaxed break-words print:p-2 print:text-[9px]">
                  {principalComment}
                </div>
              </div>

              {/* GRADE SCALE */}
              <div className="mt-3 print:mt-2">
                <div className="bg-blue-700 text-white text-[10px] px-2.5 py-1 font-bold rounded-t-sm print:px-2 print:py-0.5 print:text-[8px]">Grade Scale</div>
                <div className="border-2 border-blue-900 p-2 rounded-b-sm print:p-1.5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[9px] print:text-[7px] print:gap-0.5">
                    <div><span className={getSubjectGradeStyle('A1')}>A1</span> <span className="text-gray-600">75-100</span></div>
                    <div><span className={getSubjectGradeStyle('B2')}>B2</span> <span className="text-gray-600">70-74</span></div>
                    <div><span className={getSubjectGradeStyle('B3')}>B3</span> <span className="text-gray-600">65-69</span></div>
                    <div><span className={getSubjectGradeStyle('C4')}>C4</span> <span className="text-gray-600">60-64</span></div>
                    <div><span className={getSubjectGradeStyle('C5')}>C5</span> <span className="text-gray-600">55-59</span></div>
                    <div><span className={getSubjectGradeStyle('C6')}>C6</span> <span className="text-gray-600">50-54</span></div>
                    <div><span className={getSubjectGradeStyle('D7')}>D7</span> <span className="text-gray-600">45-49</span></div>
                    <div><span className={getSubjectGradeStyle('E8')}>E8</span> <span className="text-gray-600">40-44</span></div>
                    <div><span className={getSubjectGradeStyle('F9')}>F9</span> <span className="text-gray-600">0-39</span></div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-1 text-[9px] print:mt-1 print:pt-1 print:text-[7px] print:gap-0.5">
                    <div>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('A'))}>A</span>
                      <span className="text-gray-600 ml-0.5">80-100</span>
                    </div>
                    <div>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('B'))}>B</span>
                      <span className="text-gray-600 ml-0.5">70-79</span>
                    </div>
                    <div>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('C'))}>C</span>
                      <span className="text-gray-600 ml-0.5">60-69</span>
                    </div>
                    <div>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('P'))}>P</span>
                      <span className="text-gray-600 ml-0.5">50-59</span>
                    </div>
                    <div>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('F'))}>F</span>
                      <span className="text-gray-600 ml-0.5">0-49</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - SUMMARY PANEL */}
            <div className="space-y-3 print:space-y-2">
              {/* PERFORMANCE SUMMARY */}
              <div className="border-2 border-blue-900 w-full box-border">
                <div className="bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Performance Summary</div>
                <div className="p-2.5 text-[11px] space-y-1 print:p-2 print:text-[9px] print:space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Total Score</span>
                    <span className="font-bold text-black">{totalScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Average</span>
                    <span className="font-bold text-black">{formattedAvg}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Grade</span>
                    <span className={getOverallGradeTextColor(overallGrade)}>
                      {overallGrade} - {getOverallGradeRemark(overallGrade)}
                    </span>
                  </div>
                  {bestSubject && (
                    <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-300 print:pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <TrendingUp className="h-3 w-3 print:h-2 print:w-2" /> Best
                      </span>
                      <span className="font-bold">{bestSubject.name} ({bestSubject.total})</span>
                    </div>
                  )}
                  {showAreaForImprovement && (
                    <div className="flex justify-between text-red-600">
                      <span className="flex items-center gap-1 font-medium">
                        <TrendingDown className="h-3 w-3 print:h-2 print:w-2" /> Improve
                      </span>
                      <span className="font-bold">{worstSubject.name} ({worstSubject.total})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AFFECTIVE DOMAIN */}
              <div className="border-2 border-blue-900 w-full box-border">
                <div className="bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Affective Domain</div>
                <div className="p-2.5 text-[11px] print:p-2 print:text-[9px]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-[10px] print:text-[8px]">
                      <tbody>
                        {behaviorRatings.length > 0 ? (
                          behaviorRatings.map((item) => (
                            <tr key={item.name}>
                              <td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">{item.name}</td>
                              <td className="border text-center w-10 font-bold text-blue-700 print:w-8">{item.rating}</td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Honesty</td><td className="border text-center font-bold text-blue-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Neatness</td><td className="border text-center font-bold text-blue-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Obedience</td><td className="border text-center font-bold text-blue-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Orderliness</td><td className="border text-center font-bold text-blue-700">3</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Diligence</td><td className="border text-center font-bold text-blue-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Punctuality</td><td className="border text-center font-bold text-blue-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Leadership</td><td className="border text-center font-bold text-blue-700">3</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Politeness</td><td className="border text-center font-bold text-blue-700">4</td></tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* PSYCHOMOTOR SKILLS */}
              <div className="border-2 border-blue-900 w-full box-border">
                <div className="bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Psychomotor Skills</div>
                <div className="p-2.5 text-[11px] print:p-2 print:text-[9px]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-[10px] print:text-[8px]">
                      <tbody>
                        {skillRatings.length > 0 ? (
                          skillRatings.map((item) => (
                            <tr key={item.name}>
                              <td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">{item.name}</td>
                              <td className="border text-center w-10 font-bold text-green-700 print:w-8">{item.rating}</td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Handwriting</td><td className="border text-center font-bold text-green-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Verbal Fluency</td><td className="border text-center font-bold text-green-700">4</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Sports</td><td className="border text-center font-bold text-green-700">3</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Handling Tools</td><td className="border text-center font-bold text-green-700">3</td></tr>
                            <tr><td className="border px-1.5 py-0.5 font-medium print:px-1 print:py-0.5">Club Activities</td><td className="border text-center font-bold text-green-700">4</td></tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RATING KEY */}
              <div className="border-2 border-blue-900 w-full box-border">
                <div className="bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Key To Ratings</div>
                <div className="p-2.5 text-[10px] space-y-0.5 print:p-2 print:text-[8px] print:space-y-0">
                  <div className="font-medium text-gray-800">5 - Excellent</div>
                  <div className="font-medium text-gray-800">4 - Very Good</div>
                  <div className="font-medium text-gray-800">3 - Good</div>
                  <div className="font-medium text-gray-800">2 - Fair</div>
                  <div className="font-medium text-gray-800">1 - Poor</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t-2 border-blue-900 mt-3 pt-1.5 text-center text-[9px] text-gray-500 print:mt-2 print:pt-1 print:text-[7px]">
            Powered by Vincollins Portal | {schoolSettings.motto}
          </div>
        </div>
      </div>
    </div>
  )
}