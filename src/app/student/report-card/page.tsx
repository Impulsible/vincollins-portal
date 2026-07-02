// app/student/report-card/page.tsx
'use client'

import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import {
  Loader2, Printer, ArrowLeft, Calendar, Award, TrendingUp, TrendingDown,
  School, Mail, Phone, User, Sparkles, LayoutDashboard, FileX, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Subject name mapping ──────────────────────────────────────────────────────
const SUBJECT_NAME_MAP: Record<string, string> = {
  'Physical Education': 'PHE',
  'PHE': 'PHE',
  'English': 'English Language',
  'Eng': 'English Language',
  'Math': 'Mathematics',
  'Maths': 'Mathematics',
  'Agric': 'Agricultural Science',
  'Agriculture': 'Agricultural Science',
  'Bio': 'Biology',
  'Chem': 'Chemistry',
  'Phy': 'Physics',
  'Further Maths': 'Further Mathematics',
  'F. Maths': 'Further Mathematics',
  'ICT': 'Information Technology',
  'Comp Sci': 'Information Technology',
  'Computer Science': 'Information Technology',
  'CRK': 'CRS',
  'Christian Religious Knowledge': 'CRS',
  'Civic': 'Civic Education',
  'Govt': 'Government',
  'Lit': 'Literature in English',
  'Literature': 'Literature in English',
  'Acc': 'Financial Accounting',
  'Accounting': 'Financial Accounting',
  'Bus Stud': 'Business Studies',
  'Business': 'Business Studies',
  'H. Econ': 'Home Economics',
  'Home Econ': 'Home Economics',
  'Data Proc': 'Data Processing',
  'Data': 'Data Processing',
  'Social': 'Social Studies',
  'Soc Stud': 'Social Studies',
  'Basic Tech': 'Basic Technology',
  'Tech': 'Basic Technology',
  'CCA': 'Creative Arts',
  'Creative Art': 'Creative Arts',
  'Art': 'Creative Arts',
  'Music': 'Music',
  'Yor': 'Yoruba',
  'French': 'French',
  'Security': 'Security Education',
  'Sec Ed': 'Security Education',
}

const normalizeSubjectName = (name: string): string => {
  return SUBJECT_NAME_MAP[name] || name
}

// ── Subject ordering ──────────────────────────────────────────────────────────
const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 'English Studies': 1, 'Mathematics': 2,
  'Physics': 3, 'Chemistry': 4, 'Further Mathematics': 5, 'Basic Science': 6,
  'Biology': 7, 'Agricultural Science': 8, 'Basic Technology': 9,
  'Economics': 10, 'Geography': 11, 'Social Studies': 12, 'Civic Education': 13,
  'Government': 14, 'History': 15, 'Commerce': 16, 'Financial Accounting': 17,
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21,
  'Creative Arts': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Security Education': 28,
}

const sortSubjectsByOrder = (subjects: any[]) =>
  [...subjects].sort((a, b) =>
    (SUBJECT_ORDER[a.subject] || 999) - (SUBJECT_ORDER[b.subject] || 999)
  )

// ── Grading ───────────────────────────────────────────────────────────────────
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
  ({
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail',
  }[grade] || '')

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

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubjectScore {
  subject: string
  ca: number
  exam_obj: number
  exam_theory: number
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

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_SCHOOL: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const YEARS = ['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029']

const getTermLabel = (term: string) =>
  TERMS.find(t => t.value === term)?.label || 'Third Term'

// ── Grade scale data ──────────────────────────────────────────────────────────
const WAEC_GRADES = [
  ['A1', '75-100'], ['B2', '70-74'], ['B3', '65-69'],
  ['C4', '60-64'], ['C5', '55-59'], ['C6', '50-54'],
  ['D7', '45-49'], ['E8', '40-44'], ['F9', '0-39'],
] as [string, string][]

const OVERALL_GRADES = [
  ['A', '80-100'], ['B', '70-79'], ['C', '60-69'], ['P', '50-59'], ['F', '0-49'],
] as [string, string][]

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function StudentReportCardPage() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<SchoolSettings>(DEFAULT_SCHOOL)
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [nextTermDate, setNextTermDate] = useState('')
  const [student, setStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<SubjectScore[]>([])
  const [hasReport, setHasReport] = useState(false)
  const [reportNotPublished, setReportNotPublished] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [averageScore, setAverageScore] = useState(0)
  const [overallGrade, setOverallGrade] = useState('')
  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [classTeacher, setClassTeacher] = useState('')

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_${student?.display_name || 'Student'}_${selectedTerm}_${selectedYear}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0.3cm; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { height: auto !important; overflow: visible !important; }
        body { background: white !important; margin: 0 !important; padding: 0 !important; font-size: 10px !important; }
        .no-print { display: none !important; }
        .print-card { page-break-inside: avoid !important; break-inside: avoid !important; }
        table { table-layout: fixed !important; width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
        th, td { padding: 2px 3px !important; border-color: #000 !important; border-width: 1px !important; }
        th { font-weight: 700 !important; background-color: #1e40af !important; color: white !important; }
        .bg-blue-700 { background-color: #1d4ed8 !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-emerald-600 { background-color: #059669 !important; }
        .bg-cyan-600 { background-color: #0891b2 !important; }
        .bg-amber-600 { background-color: #d97706 !important; }
        .bg-red-600 { background-color: #dc2626 !important; }
      }
    `,
  })

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadSchoolSettings()
    loadNextTermDate()
  }, [])

  useEffect(() => {
    if (selectedTerm && selectedYear) loadScores()
  }, [selectedTerm, selectedYear])

  const loadSchoolSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').maybeSingle()
    if (data) {
      setSchool({
        name: data.school_name || DEFAULT_SCHOOL.name,
        address: data.school_address || DEFAULT_SCHOOL.address,
        phone: data.school_phone || DEFAULT_SCHOOL.phone,
        email: data.school_email || DEFAULT_SCHOOL.email,
        logo_url: data.logo_path,
        motto: data.school_motto || DEFAULT_SCHOOL.motto,
      })
    }
  }

  const loadNextTermDate = async () => {
    try {
      const { data } = await supabase
        .from('system_settings').select('value').eq('key', 'next_term_date').maybeSingle()
      if (data?.value) setNextTermDate(data.value)
    } catch (e) { console.error(e) }
  }

  const loadScores = useCallback(async () => {
    setLoading(true)
    setHasReport(false)
    setReportNotPublished(false)
    setSubjects([])
    setTeacherComment('')
    setPrincipalComment('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/portal'); return }

      const { data: sd } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!sd) throw new Error('Profile not found')
      setStudent(sd)

      const { data: td } = await supabase
        .from('profiles').select('display_name, full_name').eq('role', 'teacher').limit(1)
      setClassTeacher(td?.[0]?.display_name || td?.[0]?.full_name || 'Class Teacher')

      // Gate 1: check if report card exists
      const { data: reportCard } = await supabase
        .from('report_cards')
        .select('status, subjects_data, teacher_comments, principal_comments, average_score, total_score')
        .eq('student_id', user.id)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .maybeSingle()

      if (!reportCard) { setHasReport(false); setReportNotPublished(false); return }

      // Gate 2: only show if published
      if (reportCard.status !== 'published') {
        setHasReport(false); setReportNotPublished(true); return
      }

      // Load scores
      const { data: scores } = await supabase
        .from('ca_scores').select('*')
        .eq('student_id', user.id).eq('term', selectedTerm)
        .eq('academic_year', selectedYear).eq('status', 'approved')

      if (!scores || scores.length === 0) { setHasReport(false); return }

      // Process scores with subject name normalization and deduplication
      let processed: SubjectScore[] = scores.map((s: any) => {
        const ca = (s.ca1_score || 0) + (s.ca2_score || 0)
        const exam = (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
        const total = ca + exam
        const grade = getSubjectGrade(total)
        // Normalize subject name
        const normalizedSubject = normalizeSubjectName(s.subject)
        return {
          subject: normalizedSubject,
          ca,
          exam_obj: s.exam_objective_score || 0,
          exam_theory: s.exam_theory_score || 0,
          total,
          grade,
          remark: getSubjectGradeRemark(grade),
        }
      })

      // Deduplicate subjects - keep the one with highest total score
      const subjectMap = new Map<string, SubjectScore>()
      processed.forEach(s => {
        const existing = subjectMap.get(s.subject)
        if (!existing || s.total > existing.total) {
          subjectMap.set(s.subject, s)
        }
      })
      processed = sortSubjectsByOrder(Array.from(subjectMap.values()))

      setSubjects(processed)
      setHasReport(true)

      const total = processed.reduce((sum, s) => sum + s.total, 0)
      const avg = processed.length > 0 ? total / processed.length : 0
      setTotalScore(total)
      setAverageScore(avg)
      setOverallGrade(getOverallGrade(avg))

      if (reportCard.teacher_comments || reportCard.principal_comments) {
        setTeacherComment(reportCard.teacher_comments || '')
        setPrincipalComment(reportCard.principal_comments || '')
      } else {
        const { data: saved } = await supabase
          .from('report_comments')
          .select('teacher_comment, principal_comment')
          .eq('student_id', user.id).eq('term', selectedTerm)
          .eq('academic_year', selectedYear).maybeSingle()
        if (saved) {
          setTeacherComment(saved.teacher_comment || '')
          setPrincipalComment(saved.principal_comment || '')
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load report card')
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedYear, router])

  // ── Generate ratings from average score ───────────────────────────────────
  const generateRatings = () => {
    const r = (base: number) => {
      if (averageScore >= 90) return Math.min(5, base + 1)
      if (averageScore >= 80) return base
      if (averageScore >= 70) return Math.max(3, base)
      if (averageScore >= 60) return Math.max(2, base - 1)
      return Math.max(1, base - 2)
    }
    return {
      behavior: [
        { name: 'Honesty', rating: r(4) }, { name: 'Neatness', rating: r(4) },
        { name: 'Obedience', rating: r(4) }, { name: 'Orderliness', rating: r(3) },
        { name: 'Diligence', rating: r(4) }, { name: 'Punctuality', rating: r(4) },
        { name: 'Leadership', rating: r(3) }, { name: 'Politeness', rating: r(4) },
      ],
      skills: [
        { name: 'Handwriting', rating: r(4) }, { name: 'Verbal Fluency', rating: r(4) },
        { name: 'Sports', rating: r(3) }, { name: 'Handling Tools', rating: r(3) },
        { name: 'Club Activities', rating: r(4) },
      ],
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading report card…</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh] p-4">
        <p className="text-red-600 font-medium text-sm text-center">Student profile not found.</p>
        <Button onClick={() => router.back()} size="sm">Go Back</Button>
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const fullName = student.display_name || student.full_name || 'Student'
  const ratings = generateRatings()
  const fmtNextTerm = nextTermDate
    ? new Date(nextTermDate).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'To be announced'
  const bestSubject = subjects.length > 0
    ? subjects.reduce((a, b) => a.total > b.total ? a : b)
    : null
  const worstSubject = subjects.length > 0
    ? subjects.reduce((a, b) => a.total < b.total ? a : b)
    : null
  const showImprove = worstSubject && worstSubject.total < 50
  const fmtAvg = averageScore.toFixed(2)
  const termLabel = getTermLabel(selectedTerm)

  // ── Reusable grade scale component ───────────────────────────────────────
  const GradeScale = () => (
    <div>
      <div className="bg-blue-700 text-white text-[9px] px-2 py-1 font-bold rounded-t-sm">
        Grade Scale
      </div>
      <div className="border-2 border-blue-900 p-2 rounded-b-sm">
        <div className="grid grid-cols-3 gap-1 text-[8px]">
          {WAEC_GRADES.map(([g, r]) => (
            <div key={g} className="flex items-center gap-1">
              <span className={getSubjectGradeStyle(g)}>{g}</span>
              <span className="text-gray-600">{r}</span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-0.5 text-[7px]">
          {OVERALL_GRADES.map(([g, r]) => (
            <div key={g} className="flex items-center gap-0.5">
              <span className={cn('px-1 py-0.5 rounded font-bold text-[7px]', getOverallGradeColor(g))}>{g}</span>
              <span className="text-gray-600">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="
      w-full max-w-5xl mx-auto
      px-2 sm:px-4 md:px-6
      py-3 sm:py-4 md:py-6
      pb-24 sm:pb-6
      space-y-3 sm:space-y-4
      print:p-0 print:max-w-none print:space-y-0
    ">

      {/* ══ CONTROLS BAR ══════════════════════════════════════════════════════ */}
      <div className="
        no-print
        bg-white rounded-xl border border-gray-200 shadow-sm
        p-3 sm:p-4
        space-y-3
      ">
        {/* Row 1: Title + nav buttons */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-1.5">
              📄 <span>My Report Card</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              View &amp; print your performance report
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline" size="sm"
              onClick={() => router.push('/student/dashboard')}
              className="h-8 text-xs px-2 sm:px-3 gap-1"
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => router.back()}
              className="h-8 text-xs px-2 sm:px-3 gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Filters + Print button */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Term selector */}
          <div className="space-y-0.5 flex-1 min-w-[100px] max-w-[160px]">
            <label className="text-[10px] sm:text-xs font-medium text-gray-500 block">Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-xs sm:text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session selector */}
          <div className="space-y-0.5 flex-1 min-w-[90px] max-w-[140px]">
            <label className="text-[10px] sm:text-xs font-medium text-gray-500 block">Session</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={y} className="text-xs sm:text-sm">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Print button — only when report is available */}
          {hasReport && (
            <Button
              onClick={handlePrint}
              className="h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 gap-1.5 ml-auto shrink-0"
            >
              <Printer className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xs:inline">Print / </span>Download
            </Button>
          )}
        </div>
      </div>

      {/* ══ EMPTY STATES ══════════════════════════════════════════════════════ */}

      {/* Not yet published */}
      {!hasReport && reportNotPublished && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm py-12 sm:py-16 px-4 sm:px-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
            Report Card Not Yet Released
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
            Your report card for{' '}
            <span className="font-semibold text-gray-700">{termLabel}</span>,{' '}
            <span className="font-semibold text-blue-700">{selectedYear}</span>{' '}
            has been prepared but not yet released by the school.
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-3">
            Please check back later or contact your school.
          </p>
        </div>
      )}

      {/* No report card */}
      {!hasReport && !reportNotPublished && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-12 sm:py-16 px-4 sm:px-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileX className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
            No Report Card Available
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
            No approved report card found for{' '}
            <span className="font-semibold text-gray-700">{fullName}</span>{' '}
            for{' '}
            <span className="font-semibold text-blue-700">{termLabel}</span>,{' '}
            <span className="font-semibold text-blue-700">{selectedYear}</span>.
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-3">
            Try a different term / session, or contact your school.
          </p>
        </div>
      )}

      {/* ══ REPORT CARD ═══════════════════════════════════════════════════════ */}
      {hasReport && (
        <div ref={printRef} className="print-card">
          <div className="
            bg-white w-full
            border border-gray-200
            sm:border-2 sm:border-blue-900
            rounded-lg sm:rounded-none
            p-2.5 sm:p-4 md:p-5
            print:p-2.5 print:border-2 print:border-blue-900 print:rounded-none
          ">

            {/* ── SCHOOL HEADER ── */}
            <div className="border-b-2 border-blue-900 pb-2 mb-3 print:pb-1.5 print:mb-2">
              {/* Mobile: stacked | sm+: row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 print:flex-row print:gap-3">

                {/* Logo */}
                <div className="
                  w-14 h-14 sm:w-18 sm:h-18 shrink-0
                  flex items-center justify-center
                  border-2 border-blue-900 rounded bg-blue-50
                ">
                  {school.logo_url ? (
                    <img
                      src={school.logo_url} alt="School logo"
                      className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                    />
                  ) : (
                    <School className="h-6 w-6 sm:h-10 sm:w-10 text-blue-900" />
                  )}
                </div>

                {/* School info — center on mobile, flex-1 on sm+ */}
                <div className="flex-1 text-center w-full min-w-0">
                  <h1 className="
                    text-xs sm:text-base md:text-lg lg:text-xl
                    font-bold uppercase text-blue-900 tracking-wide leading-tight
                  ">
                    {school.name}
                  </h1>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-700 mt-0.5 leading-snug px-1">
                    {school.address}
                  </p>

                  {/* Contact — stacked on mobile, inline on sm */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] text-gray-600 flex items-center gap-0.5">
                      <Mail className="h-2.5 w-2.5 shrink-0" />
                      <span className="break-all">{school.email}</span>
                    </span>
                    <span className="hidden sm:inline text-gray-400 text-[9px]">|</span>
                    <span className="text-[9px] sm:text-[10px] text-gray-600 flex items-center gap-0.5">
                      <Phone className="h-2.5 w-2.5 shrink-0" />
                      {school.phone}
                    </span>
                  </div>

                  <p className="text-[9px] sm:text-[10px] italic text-amber-700 mt-0.5 font-medium">
                    "{school.motto}"
                  </p>

                  <div className="mt-1 pt-1 border-t border-blue-200">
                    <h2 className="font-bold text-[10px] sm:text-xs md:text-sm text-blue-900 leading-tight">
                      {termLabel} Student's Performance Report
                    </h2>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-gray-700 mt-0.5">
                      Academic Session: {selectedYear}
                    </p>
                  </div>
                </div>

                {/* Student photo — hidden on mobile, visible sm+ */}
                <div className="
                  hidden sm:block
                  w-20 h-24 sm:w-20 sm:h-24 md:w-24 md:h-28
                  border-2 border-blue-900 rounded overflow-hidden
                  shrink-0 bg-gray-50
                ">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── STUDENT INFO GRID ── */}
            {/* 1-col on mobile, 2-col on sm+ */}
            <div className="
              grid grid-cols-1 sm:grid-cols-2
              gap-x-4 gap-y-0
              text-[9px] sm:text-[11px] md:text-xs
              mb-3 print:mb-2
              print:grid-cols-2
            ">
              {([
                ['Name', fullName],
                ['Admission No', student.admission_number || student.vin_id || '—'],
                ['Class', student.class || '—'],
                ['Term', termLabel],
                ['Session', selectedYear],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-1 py-0.5 border-b border-gray-100 sm:border-0">
                  <span className="font-bold text-gray-600 shrink-0 w-20 sm:w-28 md:w-32">{label}:</span>
                  <span className="font-medium text-gray-900 break-words">{value}</span>
                </div>
              ))}
              <div className="flex items-baseline gap-1 py-0.5 border-b border-gray-100 sm:border-0">
                <span className="font-bold text-gray-600 shrink-0 w-20 sm:w-28 md:w-32">Next Term:</span>
                <span className="flex items-center gap-1 font-medium text-gray-900">
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 shrink-0" />
                  <span className="break-words text-[9px] sm:text-[11px]">{fmtNextTerm}</span>
                </span>
              </div>
            </div>

            {/* ── MAIN BODY ── */}
            {/* Single col mobile → two-col md+ */}
            <div className="
              flex flex-col
              md:grid md:grid-cols-[2.2fr_1.2fr]
              gap-2 sm:gap-3
              print:grid print:grid-cols-[2.2fr_1.2fr] print:gap-2
            ">

              {/* ── LEFT COLUMN ── */}
              <div className="min-w-0 space-y-2 sm:space-y-3 print:space-y-2">

                {/* Scores table — horizontally scrollable on mobile */}
                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                    <table className="
                      w-full border-collapse
                      text-[8px] sm:text-[10px] md:text-[11px]
                      table-fixed
                      min-w-[320px] sm:min-w-[420px]
                      print:min-w-0 print:text-[9px]
                    ">
                      <thead className="bg-blue-700 text-white">
                        <tr>
                          <th className="border border-blue-500 px-1 sm:px-1.5 py-1 text-left w-[32%]">
                            Subject
                          </th>
                          <th className="border border-blue-500 px-0.5 sm:px-1 py-1 text-center w-[10%]">
                            CA
                          </th>
                          <th className="border border-blue-500 px-0.5 sm:px-1 py-1 text-center w-[11%]">
                            Exam
                          </th>
                          <th className="border border-blue-500 px-0.5 sm:px-1 py-1 text-center w-[11%]">
                            Total
                          </th>
                          <th className="border border-blue-500 px-0.5 sm:px-1 py-1 text-center w-[12%]">
                            Grade
                          </th>
                          <th className="border border-blue-500 px-1 sm:px-1.5 py-1 text-left w-[24%]">
                            Remark
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((s, i) => (
                          <tr key={s.subject} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-1 sm:px-1.5 py-0.5 font-medium break-words leading-tight">
                              {s.subject}
                            </td>
                            <td className="border border-gray-300 text-center font-mono py-0.5">{s.ca}</td>
                            <td className="border border-gray-300 text-center font-mono py-0.5">
                              {s.exam_obj + s.exam_theory}
                            </td>
                            <td className="border border-gray-300 text-center font-bold font-mono py-0.5">
                              {s.total}
                            </td>
                            <td className="border border-gray-300 text-center py-0.5">
                              <span className={getSubjectGradeStyle(s.grade)}>{s.grade}</span>
                            </td>
                            <td className="border border-gray-300 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[9px] leading-tight">
                              {s.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-50 font-bold">
                        <tr>
                          <td
                            colSpan={3}
                            className="border border-gray-300 px-1 sm:px-1.5 py-1 text-right text-[8px] sm:text-[10px]"
                          >
                            TOTAL / AVERAGE:
                          </td>
                          <td className="border border-gray-300 text-center py-1 text-[8px] sm:text-[10px]">
                            {totalScore}
                          </td>
                          <td className="border border-gray-300 text-center py-1">
                            <span className={cn(
                              'px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold',
                              getOverallGradeColor(overallGrade)
                            )}>
                              {overallGrade}
                            </span>
                          </td>
                          <td className="border border-gray-300 text-center py-1 text-[8px] sm:text-[10px]">
                            {fmtAvg}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Teacher remark */}
                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="bg-purple-600 text-white px-2 py-1 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    CLASS TEACHER'S REMARK
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[10px] italic leading-relaxed bg-purple-50 break-words">
                    {teacherComment || '—'}
                  </div>
                  <div className="px-2 pb-1 pt-0.5 text-[8px] sm:text-[9px] text-gray-500 border-t border-purple-200">
                    Signed: {classTeacher}
                  </div>
                </div>

                {/* Principal remark */}
                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="bg-blue-600 text-white px-2 py-1 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                    <Award className="h-3 w-3 shrink-0" />
                    PRINCIPAL'S REMARK
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[10px] italic leading-relaxed break-words">
                    {principalComment || '—'}
                  </div>
                </div>

                {/* Grade scale — shown on md+ in left col, and always in print */}
                <div className="hidden md:block print:block">
                  <GradeScale />
                </div>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="space-y-2 sm:space-y-3 print:space-y-2">

                {/* Performance summary */}
                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 uppercase">
                    Performance Summary
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[10px] space-y-1 print:p-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Score</span>
                      <span className="font-bold">{totalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average</span>
                      <span className="font-bold">{fmtAvg}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade</span>
                      <span className={getOverallGradeTextColor(overallGrade)}>
                        {overallGrade} – {getOverallGradeRemark(overallGrade)}
                      </span>
                    </div>
                    {bestSubject && (
                      <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-200">
                        <span className="flex items-center gap-1 font-medium">
                          <TrendingUp className="h-3 w-3 shrink-0" /> Best
                        </span>
                        <span className="font-bold text-right text-[8px] sm:text-[9px] break-words ml-1 max-w-[120px]">
                          {bestSubject.subject} ({bestSubject.total})
                        </span>
                      </div>
                    )}
                    {showImprove && worstSubject && (
                      <div className="flex justify-between text-red-600">
                        <span className="flex items-center gap-1 font-medium">
                          <TrendingDown className="h-3 w-3 shrink-0" /> Improve
                        </span>
                        <span className="font-bold text-right text-[8px] sm:text-[9px] break-words ml-1 max-w-[120px]">
                          {worstSubject.subject} ({worstSubject.total})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Affective + Psychomotor */}
                {/* 2-col side by side on mobile (they're small) → 1-col on md+ */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 print:grid-cols-1 print:gap-1.5">

                  {/* Affective domain */}
                  <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                    <div className="bg-blue-700 text-white text-[8px] sm:text-[9px] font-bold px-2 py-1 uppercase">
                      Affective Domain
                    </div>
                    <div className="p-1 sm:p-1.5 print:p-1">
                      <table className="w-full border-collapse text-[7px] sm:text-[9px]">
                        <tbody>
                          {ratings.behavior.map(item => (
                            <tr key={item.name} className="border-b border-gray-100 last:border-0">
                              <td className="py-0.5 pr-1 font-medium text-gray-700">{item.name}</td>
                              <td className="py-0.5 text-right font-bold text-blue-700 w-5">{item.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Psychomotor */}
                  <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                    <div className="bg-blue-700 text-white text-[8px] sm:text-[9px] font-bold px-2 py-1 uppercase">
                      Psychomotor
                    </div>
                    <div className="p-1 sm:p-1.5 print:p-1">
                      <table className="w-full border-collapse text-[7px] sm:text-[9px]">
                        <tbody>
                          {ratings.skills.map(item => (
                            <tr key={item.name} className="border-b border-gray-100 last:border-0">
                              <td className="py-0.5 pr-1 font-medium text-gray-700">{item.name}</td>
                              <td className="py-0.5 text-right font-bold text-green-700 w-5">{item.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Rating key */}
                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="bg-blue-700 text-white text-[8px] sm:text-[9px] font-bold px-2 py-1 uppercase">
                    Key To Ratings
                  </div>
                  {/* 
                    Mobile: 2-col grid to save vertical space
                    md+: single column  
                  */}
                  <div className="p-2 text-[8px] sm:text-[9px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-0.5 print:grid-cols-1 print:p-1.5">
                    {['5 – Excellent', '4 – Very Good', '3 – Good', '2 – Fair', '1 – Poor'].map(r => (
                      <div key={r} className="font-medium text-gray-700">{r}</div>
                    ))}
                  </div>
                </div>

                {/* Grade scale — only shown on mobile (md hides it, shows in left col instead) */}
                <div className="block md:hidden print:hidden">
                  <GradeScale />
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="
              border-t-2 border-blue-900
              mt-3 sm:mt-4 pt-1 sm:pt-1.5
              text-center
              text-[7px] sm:text-[9px] text-gray-500
              print:mt-2 print:pt-1
            ">
              Powered by Vincollins Portal | {school.motto}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}