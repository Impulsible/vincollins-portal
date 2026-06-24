// app/admin/report-cards/view/page.tsx
'use client'

import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft, Printer, Loader2, Sparkles, Calendar, Award,
  TrendingUp, TrendingDown, School, Mail, Phone, User, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'

// ============================================
// SUBJECT ORDERING
// ============================================
const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 'English Studies': 1, 'Mathematics': 2,
  'Physics': 3, 'Chemistry': 4, 'Further Mathematics': 5, 'Basic Science': 6,
  'Biology': 7, 'Agricultural Science': 8, 'Basic Technology': 9,
  'Economics': 10, 'Geography': 11, 'Social Studies': 12, 'Civic Education': 13,
  'Government': 14, 'History': 15, 'Commerce': 16, 'Financial Accounting': 17,
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Security Education': 28,
}

const sortSubjectsByOrder = (subjects: any[]) =>
  [...subjects].sort((a, b) => (SUBJECT_ORDER[a.name] || 999) - (SUBJECT_ORDER[b.name] || 999))

// ============================================
// GRADING
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
  const base = 'text-white font-bold px-1.5 py-0.5 rounded text-[9px] inline-block'
  switch (grade) {
    case 'A1': return `bg-emerald-600 ${base}`
    case 'B2': case 'B3': return `bg-blue-600 ${base}`
    case 'C4': case 'C5': case 'C6': return `bg-cyan-600 ${base}`
    case 'D7': case 'E8': return `bg-amber-600 ${base}`
    case 'F9': return `bg-red-600 ${base}`
    default: return `bg-gray-500 ${base}`
  }
}

const getSubjectGradeRemark = (grade: string): string =>
  ({ 'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good', 'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit', 'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail' }[grade] || '')

const getOverallGrade = (score: number): string => {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'P'
  return 'F'
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-emerald-100 text-emerald-700'
    case 'B': return 'bg-blue-100 text-blue-700'
    case 'C': return 'bg-cyan-100 text-cyan-700'
    case 'P': return 'bg-amber-100 text-amber-700'
    case 'F': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
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

const getOverallGradeRemark = (grade: string): string =>
  ({ 'A': 'Excellent', 'B': 'Very Good', 'C': 'Good', 'P': 'Pass', 'F': 'Fail' }[grade] || '')

// ============================================
// FALLBACK COMMENTS
// ============================================
const getFallbackTeacherComment = (
  firstName: string, avg: number,
  bestSubject: string, bestScore: number,
  worstSubject: string, worstScore: number,
  gender: string
): string => {
  const pronoun = gender === 'female' ? 'She' : 'He'
  const possessive = gender === 'female' ? 'her' : 'his'
  if (avg >= 90) return `Outstanding performance, ${firstName}! Scoring ${bestScore}% in ${bestSubject} is remarkable.`
  if (avg >= 80) return `Excellent work, ${firstName}! ${possessive} performance in ${bestSubject} shows strong understanding.`
  if (avg >= 70) return `Good effort, ${firstName}! ${possessive} performance in ${bestSubject} (${bestScore}%) was solid.`
  if (avg >= 60) return `Credit level achieved, ${firstName}. ${bestSubject} (${bestScore}%) was strongest.`
  if (avg >= 50) return `${firstName}, this was a close one. ${possessive} performance in ${bestSubject} helped.`
  return `${firstName}, unfortunately ${pronoun} struggled this term. Please see your teacher.`
}

const getFallbackPrincipalComment = (avg: number, firstName: string, gender: string): string => {
  const pronoun = gender === 'female' ? 'She' : 'He'
  if (avg >= 80) return `Excellent performance. ${pronoun} is promoted with honors.`
  if (avg >= 70) return `Good performance. Promoted to next class.`
  if (avg >= 60) return `Satisfactory performance. Promoted.`
  if (avg >= 50) return `Passed. Work harder next term. Promoted conditionally.`
  return `Failed. Needs to repeat class.`
}

// ============================================
// TYPES
// ============================================
interface SubjectScore {
  name: string; ca: number; exam: number; total: number; grade: string; remark: string
}
interface SchoolSettings {
  name: string; address: string; phone: string; email: string; logo_url?: string; motto?: string
}
interface AssessmentData {
  behaviorRatings?: Array<{ name: string; rating: number }>
  skillRatings?: Array<{ name: string; rating: number }>
}

const DEFAULT_SCHOOL: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

const TERM_LABELS: Record<string, string> = {
  first: 'First Term', second: 'Second Term', third: 'Third Term',
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
  const [school, setSchool] = useState<SchoolSettings>(DEFAULT_SCHOOL)
  const [student, setStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<SubjectScore[]>([])
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({})
  const [totalScore, setTotalScore] = useState(0)
  const [averageScore, setAverageScore] = useState(0)
  const [overallGrade, setOverallGrade] = useState('')
  const [nextTermDate, setNextTermDate] = useState('')
  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [classTeacher, setClassTeacher] = useState('')
  const [reportCardId, setReportCardId] = useState<string | null>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_${student?.display_name || 'Student'}_${term}_${year}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0.5cm; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { background: white !important; margin: 0 !important; padding: 0 !important; font-size: 10px !important; }
        .no-print { display: none !important; }
        .print-grid-2col { display: grid !important; grid-template-columns: 2.2fr 1.2fr !important; gap: 10px !important; }
        .print-2col-info { display: grid !important; grid-template-columns: 1fr 1fr !important; }
        .print-1col { display: block !important; }
        .print-flex-row { display: flex !important; flex-direction: row !important; align-items: flex-start !important; }
        .print-photo-show { display: block !important; }
        table { table-layout: fixed !important; width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
        th, td { padding: 3px 4px !important; border-color: #000 !important; border-width: 1px !important; word-break: break-word !important; }
        th { font-weight: 700 !important; background-color: #1e40af !important; color: white !important; }
        .bg-blue-700 { background-color: #1d4ed8 !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-emerald-600 { background-color: #059669 !important; }
        .bg-cyan-600 { background-color: #0891b2 !important; }
        .bg-amber-600 { background-color: #d97706 !important; }
        .bg-red-600 { background-color: #dc2626 !important; }
        .bg-purple-50 { background-color: #faf5ff !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
      }
    `,
  })

  const loadNextTermDate = useCallback(async () => {
    try {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'next_term_date').maybeSingle()
      if (data?.value) setNextTermDate(data.value)
    } catch (e) { console.error(e) }
  }, [])

  const handleRegenerateComments = async () => {
    if (!studentId || !student || !reportCardId) return
    setRegenerating(true)
    try {
      const firstName = (student.display_name || student.full_name || 'Student').split(' ')[0]
      const gender = student.gender || 'male'
      const className = student.class || '—'
      const subjectsForAPI = subjects.map(s => ({ name: s.name, score: s.total }))

      let newTeacher = ''
      let newPrincipal = ''

      try {
        const res = await fetch('/api/generate-comments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentName: firstName, averageScore, subjects: subjectsForAPI, className, gender })
        })
        if (res.ok) {
          const d = await res.json()
          newTeacher = d.teacher_comment
          newPrincipal = d.principal_comment
        } else throw new Error('API failed')
      } catch {
        const best = subjects.reduce((a, b) => a.total > b.total ? a : b, subjects[0])
        const worst = subjects.reduce((a, b) => a.total < b.total ? a : b, subjects[0])
        newTeacher = getFallbackTeacherComment(firstName, averageScore, best?.name || '', best?.total || 0, worst?.name || '', worst?.total || 0, gender)
        newPrincipal = getFallbackPrincipalComment(averageScore, firstName, gender)
      }

      await supabase.from('report_cards').update({ teacher_comments: newTeacher, principal_comments: newPrincipal }).eq('id', reportCardId)
      setTeacherComment(newTeacher)
      setPrincipalComment(newPrincipal)
      toast.success('Comments regenerated!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to regenerate comments')
    } finally { setRegenerating(false) }
  }

  const loadScores = useCallback(async () => {
    if (!studentId) { toast.error('No student selected'); router.back(); return }
    setLoading(true)
    try {
      const { data: sd } = await supabase.from('profiles').select('*').eq('id', studentId).single()
      if (!sd) throw new Error('Student not found')
      setStudent(sd)

      const { data: rc } = await supabase.from('report_cards').select('*')
        .eq('student_id', studentId).eq('term', term).eq('academic_year', year).maybeSingle()

      if (rc) {
        setReportCardId(rc.id)
        setSubjects(rc.subjects_data || [])
        setAssessmentData(rc.assessment_data || {})
        setTeacherComment(rc.teacher_comments || '')
        setPrincipalComment(rc.principal_comments || '')
        setClassTeacher(rc.class_teacher || '')
        setTotalScore(rc.total_score || 0)
        setAverageScore(rc.average_score || 0)
        setOverallGrade(getOverallGrade(rc.average_score || 0))
      } else {
        const { data: scores } = await supabase.from('ca_scores').select('*')
          .eq('student_id', studentId).eq('term', term).eq('academic_year', year).eq('status', 'approved')

        let processed: SubjectScore[] = (scores || []).map((s: any) => {
          const ca = (s.ca1_score || 0) + (s.ca2_score || 0)
          const exam = (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
          const total = ca + exam
          const grade = getSubjectGrade(total)
          return { name: s.subject, ca, exam, total, grade, remark: getSubjectGradeRemark(grade) }
        })
        processed = sortSubjectsByOrder(processed)
        setSubjects(processed)

        const tot = processed.reduce((s, x) => s + x.total, 0)
        const avg = processed.length > 0 ? tot / processed.length : 0
        setTotalScore(tot); setAverageScore(avg); setOverallGrade(getOverallGrade(avg))

        const r = (base: number) => {
          if (avg >= 90) return Math.min(5, base + 1)
          if (avg >= 80) return base
          if (avg >= 70) return Math.max(3, base)
          if (avg >= 60) return Math.max(2, base - 1)
          return Math.max(1, base - 2)
        }
        setAssessmentData({
          behaviorRatings: [
            { name: 'Honesty', rating: r(4) }, { name: 'Neatness', rating: r(4) },
            { name: 'Obedience', rating: r(4) }, { name: 'Orderliness', rating: r(3) },
            { name: 'Diligence', rating: r(4) }, { name: 'Punctuality', rating: r(4) },
            { name: 'Leadership', rating: r(3) }, { name: 'Politeness', rating: r(4) },
          ],
          skillRatings: [
            { name: 'Handwriting', rating: r(4) }, { name: 'Verbal Fluency', rating: r(4) },
            { name: 'Sports', rating: r(3) }, { name: 'Handling Tools', rating: r(3) },
            { name: 'Club Activities', rating: r(4) },
          ]
        })

        const { data: td } = await supabase.from('profiles').select('display_name, full_name').eq('role', 'teacher').limit(1)
        setClassTeacher(td?.[0]?.display_name || td?.[0]?.full_name || 'Class Teacher')

        let firstName = sd?.first_name || (sd?.display_name || sd?.full_name || 'Student').split(' ')[0]
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        const gender = sd?.gender || 'male'

        try {
          const res = await fetch('/api/generate-comments', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName: firstName, averageScore: avg, subjects: processed.map(s => ({ name: s.name, score: s.total })), className: sd?.class || '—', gender })
          })
          if (res.ok) {
            const d = await res.json()
            setTeacherComment(d.teacher_comment); setPrincipalComment(d.principal_comment)
          } else throw new Error()
        } catch {
          const best = processed.reduce((a, b) => a.total > b.total ? a : b, processed[0])
          const worst = processed.reduce((a, b) => a.total < b.total ? a : b, processed[0])
          setTeacherComment(getFallbackTeacherComment(firstName, avg, best?.name || '', best?.total || 0, worst?.name || '', worst?.total || 0, gender))
          setPrincipalComment(getFallbackPrincipalComment(avg, firstName, gender))
        }
      }
    } catch (e) { console.error(e); toast.error('Failed to load scores') }
    finally { setLoading(false) }
  }, [studentId, term, year, router])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/portal'); return }

      const { data: sd } = await supabase.from('school_settings').select('*').maybeSingle()
      if (sd) {
        setSchool({
          name: sd.school_name || DEFAULT_SCHOOL.name,
          address: sd.school_address || DEFAULT_SCHOOL.address,
          phone: sd.school_phone || DEFAULT_SCHOOL.phone,
          email: sd.school_email || DEFAULT_SCHOOL.email,
          logo_url: sd.logo_path,
          motto: sd.school_motto || DEFAULT_SCHOOL.motto,
        })
      }
      await loadNextTermDate()
      await loadScores()
    }
    init()
  }, [studentId, term, year, router, loadNextTermDate, loadScores])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading report card…</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-600 font-medium">Student not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const termDisplay = TERM_LABELS[term] || term
  const fullName = student.display_name || student.full_name || 'Student'
  const fmtNextTerm = nextTermDate
    ? new Date(nextTermDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be announced'
  const bestSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total > b.total ? a : b) : null
  const worstSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total < b.total ? a : b) : null
  const showImprove = worstSubject && worstSubject.total < 50
  const fmtAvg = averageScore.toFixed(2)
  const behaviorRatings = assessmentData.behaviorRatings || []
  const skillRatings = assessmentData.skillRatings || []

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">

      {/* ═══════════════════════════════════════════════
          PAGE CONTROLS — in-page, not a fixed header
          ═══════════════════════════════════════════════ */}
      <div className="no-print bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 space-y-3">

          {/* Row 1: back + action buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button
              variant="outline" size="sm"
              onClick={() => router.back()}
              className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to Broadsheet</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline" size="sm"
                onClick={handleRegenerateComments}
                disabled={regenerating}
                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 gap-1.5 border-purple-400 text-purple-600 hover:bg-purple-50"
              >
                {regenerating
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RotateCcw className="h-3.5 w-3.5" />
                }
                <span className="hidden sm:inline">Regenerate Comments</span>
                <span className="sm:hidden">Regen</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2.5 sm:px-3 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print / PDF</span>
                <span className="sm:hidden">Print</span>
              </Button>
            </div>
          </div>

          {/* Row 2: context info */}
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500">
            <span>Viewing:</span>
            <span className="font-semibold text-gray-800">{fullName}</span>
            <span>—</span>
            <span className="font-medium text-blue-700">{termDisplay}</span>
            <span>—</span>
            <span className="font-medium text-blue-700">{year}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          REPORT CARD
          ═══════════════════════════════════════════════ */}
      <div className="px-2 sm:px-4 md:px-6 py-4 sm:py-6 print:p-0">
        <div ref={printRef} className="print-container">
          <div className="
            bg-white mx-auto
            w-full max-w-[210mm]
            border border-gray-200 md:border-2 md:border-blue-900
            rounded-lg md:rounded-none
            p-3 sm:p-5 md:p-6
            print:p-3 print:border-none print:rounded-none print:max-w-none
          ">

            {/* ── HEADER ──────────────────────────────────────── */}
            <div className="border-b-2 border-blue-900 pb-3 mb-3 sm:mb-4">
              {/* Mobile: logo + school centred, no photo */}
              {/* sm+: logo | school | photo side-by-side */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 print:flex-row print-flex-row">

                {/* Logo */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center border-2 border-blue-900 rounded bg-blue-50">
                  {school.logo_url ? (
                    <img src={school.logo_url} alt="logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
                  ) : (
                    <School className="h-8 w-8 sm:h-12 sm:w-12 text-blue-900" />
                  )}
                </div>

                {/* School info */}
                <div className="flex-1 text-center min-w-0">
                  <h1 className="text-base sm:text-xl font-bold uppercase text-blue-900 tracking-wide leading-tight break-words">
                    {school.name}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-gray-700 mt-0.5 leading-snug break-words">
                    {school.address}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 mt-0.5">
                    <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                      <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      <span className="break-all">{school.email}</span>
                    </span>
                    <span className="text-gray-400 hidden sm:inline">|</span>
                    <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                      <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      {school.phone}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[11px] italic text-amber-700 mt-1 font-medium">
                    "{school.motto}"
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <h2 className="font-bold text-xs sm:text-base text-blue-900 leading-tight">
                      {termDisplay} Student&apos;s Performance Report
                    </h2>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mt-0.5">
                      Academic Session: {year}
                    </p>
                  </div>
                </div>

                {/* Photo — hidden on mobile, shown sm+ */}
                <div className="w-16 h-20 sm:w-24 sm:h-28 border-2 border-blue-900 rounded overflow-hidden shrink-0 bg-gray-50 hidden sm:block print-photo-show">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt="student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── STUDENT INFO ─────────────────────────────────── */}
            <div className="
              grid grid-cols-1 sm:grid-cols-2
              gap-x-4 gap-y-0.5 sm:gap-y-1.5
              text-[10px] sm:text-[13px]
              mb-3 sm:mb-4
              print:grid-cols-2 print-2col-info
            ">
              {([
                ['Name', fullName],
                ['Admission No', student.admission_number || student.vin_id || '—'],
                ['Class', student.class || '—'],
                ['Term', termDisplay],
                ['Session', year],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-1 py-0.5">
                  <span className="font-bold text-gray-700 shrink-0 w-24 sm:w-36">{label}:</span>
                  <span className="font-medium break-words">{value}</span>
                </div>
              ))}
              <div className="flex items-baseline gap-1 py-0.5">
                <span className="font-bold text-gray-700 shrink-0 w-24 sm:w-36">Next Term:</span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3 text-blue-600 shrink-0" />
                  <span className="break-words">{fmtNextTerm}</span>
                </span>
              </div>
            </div>

            {/* ── MAIN CONTENT ─────────────────────────────────── */}
            {/*
              Mobile:  single column — everything stacks
              md+:     70 / 30 side-by-side
              Print:   always 70 / 30
            */}
            <div className="
              flex flex-col md:grid md:grid-cols-[2.2fr_1.2fr] gap-3 sm:gap-4
              print:grid print-grid-2col
            ">

              {/* LEFT — table + comments + grade scale */}
              <div className="min-w-0 space-y-3">

                {/* Results table */}
                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[9px] sm:text-[11px] table-fixed min-w-[380px]">
                      <thead className="bg-blue-700 text-white">
                        <tr>
                          <th className="border border-blue-500 px-1.5 py-1 text-left w-[32%]">Subject</th>
                          <th className="border border-blue-500 px-1 py-1 text-center w-[10%]">CA</th>
                          <th className="border border-blue-500 px-1 py-1 text-center w-[11%]">Exam</th>
                          <th className="border border-blue-500 px-1 py-1 text-center w-[11%]">Total</th>
                          <th className="border border-blue-500 px-1 py-1 text-center w-[12%]">Grade</th>
                          <th className="border border-blue-500 px-1.5 py-1 text-left w-[24%]">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-gray-500">
                              No scores available for this term.
                            </td>
                          </tr>
                        ) : subjects.map((s, i) => (
                          <tr key={s.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-400 px-1.5 py-0.5 font-medium break-words">{s.name}</td>
                            <td className="border border-gray-400 text-center font-mono py-0.5">{s.ca}</td>
                            <td className="border border-gray-400 text-center font-mono py-0.5">{s.exam}</td>
                            <td className="border border-gray-400 text-center font-bold font-mono py-0.5">{s.total}</td>
                            <td className="border border-gray-400 text-center py-0.5">
                              <span className={getSubjectGradeStyle(s.grade)}>{s.grade}</span>
                            </td>
                            <td className="border border-gray-400 px-1.5 py-0.5 text-[8px] sm:text-[10px] break-words">
                              {s.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-50 font-bold">
                        <tr>
                          <td colSpan={3} className="border border-gray-400 px-1.5 py-1 text-right text-[9px] sm:text-[11px]">
                            TOTAL / AVERAGE:
                          </td>
                          <td className="border border-gray-400 text-center py-1">{totalScore}</td>
                          <td className="border border-gray-400 text-center py-1">
                            <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', getOverallGradeColor(overallGrade))}>
                              {overallGrade}
                            </span>
                          </td>
                          <td className="border border-gray-400 text-center py-1">{fmtAvg}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Teacher remark */}
                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="bg-purple-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    CLASS TEACHER'S REMARK
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed bg-purple-50 break-words">
                    {teacherComment || 'No comment available.'}
                  </div>
                  <div className="px-2 pb-1 text-[8px] sm:text-[9px] text-gray-500 border-t border-purple-200 pt-0.5">
                    Signed: {classTeacher || 'Class Teacher'}
                  </div>
                </div>

                {/* Principal remark */}
                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="bg-blue-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center gap-1">
                    <Award className="h-3 w-3 shrink-0" />
                    PRINCIPAL'S REMARK
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed break-words">
                    {principalComment || 'No comment available.'}
                  </div>
                </div>

                {/* Grade scale — desktop / print only */}
                <div className="hidden md:block print:block">
                  <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] px-2 py-1 font-bold rounded-t-sm">
                    Grade Scale
                  </div>
                  <div className="border-2 border-blue-900 p-2 rounded-b-sm">
                    <div className="grid grid-cols-3 gap-1 text-[8px] sm:text-[9px]">
                      {([['A1','75-100'],['B2','70-74'],['B3','65-69'],['C4','60-64'],['C5','55-59'],['C6','50-54'],['D7','45-49'],['E8','40-44'],['F9','0-39']] as [string,string][]).map(([g,r]) => (
                        <div key={g} className="flex items-center gap-1">
                          <span className={getSubjectGradeStyle(g)}>{g}</span>
                          <span className="text-gray-600">{r}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-1 text-[8px] sm:text-[9px]">
                      {([['A','80-100'],['B','70-79'],['C','60-69'],['P','50-59'],['F','0-49']] as [string,string][]).map(([g,r]) => (
                        <div key={g} className="flex items-center gap-0.5">
                          <span className={cn('px-1 py-0.5 rounded font-bold text-[8px]', getOverallGradeColor(g))}>{g}</span>
                          <span className="text-gray-600">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — summary panels */}
              <div className="space-y-3">

                {/* Performance summary */}
                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 uppercase">
                    Performance Summary
                  </div>
                  <div className="p-2 sm:p-2.5 text-[10px] sm:text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Score</span>
                      <span className="font-bold">{totalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Average</span>
                      <span className="font-bold">{fmtAvg}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Grade</span>
                      <span className={getOverallGradeTextColor(overallGrade)}>
                        {overallGrade} – {getOverallGradeRemark(overallGrade)}
                      </span>
                    </div>
                    {bestSubject && (
                      <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-200">
                        <span className="flex items-center gap-1 font-medium">
                          <TrendingUp className="h-3 w-3 shrink-0" /> Best
                        </span>
                        <span className="font-bold text-right text-[9px] sm:text-[10px] break-words ml-1">
                          {bestSubject.name} ({bestSubject.total})
                        </span>
                      </div>
                    )}
                    {showImprove && worstSubject && (
                      <div className="flex justify-between text-red-600">
                        <span className="flex items-center gap-1 font-medium">
                          <TrendingDown className="h-3 w-3 shrink-0" /> Improve
                        </span>
                        <span className="font-bold text-right text-[9px] sm:text-[10px] break-words ml-1">
                          {worstSubject.name} ({worstSubject.total})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Affective + Psychomotor — 2-col on mobile, 1-col on md+ */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 print:grid-cols-1 print-1col">

                  {/* Affective domain */}
                  <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                    <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">
                      Affective Domain
                    </div>
                    <div className="p-1.5 sm:p-2">
                      <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                        <tbody>
                          {(behaviorRatings.length > 0 ? behaviorRatings : [
                            { name: 'Honesty', rating: 4 }, { name: 'Neatness', rating: 4 },
                            { name: 'Obedience', rating: 4 }, { name: 'Orderliness', rating: 3 },
                            { name: 'Diligence', rating: 4 }, { name: 'Punctuality', rating: 4 },
                            { name: 'Leadership', rating: 3 }, { name: 'Politeness', rating: 4 },
                          ]).map(item => (
                            <tr key={item.name}>
                              <td className="border px-1 py-0.5 font-medium">{item.name}</td>
                              <td className="border text-center w-7 sm:w-8 font-bold text-blue-700">{item.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Psychomotor */}
                  <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                    <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">
                      Psychomotor
                    </div>
                    <div className="p-1.5 sm:p-2">
                      <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                        <tbody>
                          {(skillRatings.length > 0 ? skillRatings : [
                            { name: 'Handwriting', rating: 4 }, { name: 'Verbal Fluency', rating: 4 },
                            { name: 'Sports', rating: 3 }, { name: 'Handling Tools', rating: 3 },
                            { name: 'Club Activities', rating: 4 },
                          ]).map(item => (
                            <tr key={item.name}>
                              <td className="border px-1 py-0.5 font-medium">{item.name}</td>
                              <td className="border text-center w-7 sm:w-8 font-bold text-green-700">{item.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Rating key */}
                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">
                    Key To Ratings
                  </div>
                  <div className="p-2 text-[8px] sm:text-[10px] grid grid-cols-5 md:grid-cols-1 gap-0.5 print:grid-cols-1 print-1col">
                    {['5 – Excellent', '4 – Very Good', '3 – Good', '2 – Fair', '1 – Poor'].map(r => (
                      <div key={r} className="font-medium text-gray-800">{r}</div>
                    ))}
                  </div>
                </div>

                {/* Grade scale — mobile only (appears under right panels) */}
                <div className="md:hidden print:hidden">
                  <div className="bg-blue-700 text-white text-[9px] px-2 py-1 font-bold rounded-t-sm">Grade Scale</div>
                  <div className="border-2 border-blue-900 p-2 rounded-b-sm">
                    <div className="grid grid-cols-3 gap-1 text-[8px]">
                      {([['A1','75-100'],['B2','70-74'],['B3','65-69'],['C4','60-64'],['C5','55-59'],['C6','50-54'],['D7','45-49'],['E8','40-44'],['F9','0-39']] as [string,string][]).map(([g,r]) => (
                        <div key={g} className="flex items-center gap-0.5">
                          <span className={getSubjectGradeStyle(g)}>{g}</span>
                          <span className="text-gray-600">{r}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 pt-1 border-t border-blue-300 grid grid-cols-5 gap-0.5 text-[7px]">
                      {([['A','80-100'],['B','70-79'],['C','60-69'],['P','50-59'],['F','0-49']] as [string,string][]).map(([g,r]) => (
                        <div key={g} className="flex items-center gap-0.5">
                          <span className={cn('px-1 py-0.5 rounded font-bold text-[7px]', getOverallGradeColor(g))}>{g}</span>
                          <span className="text-gray-600">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── FOOTER ──────────────────────────────────────── */}
            <div className="border-t-2 border-blue-900 mt-3 sm:mt-4 pt-1.5 text-center text-[7px] sm:text-[9px] text-gray-500">
              Powered by Vincollins Portal | {school.motto}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}