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
  School, Mail, Phone, User, Sparkles, LayoutDashboard, FileX,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 'English Studies': 1, 'Mathematics': 2,
  'Physics': 3, 'Chemistry': 4, 'Further Mathematics': 5, 'Basic Science': 6,
  'Biology': 7, 'Agricultural Science': 8, 'Basic Technology': 9,
  'Economics': 10, 'Geography': 11, 'Social Studies': 12, 'Civic Education': 13,
  'Government': 14, 'History': 15, 'Commerce': 16, 'Financial Accounting': 17,
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21,
  'Creative Arts': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Physical Education': 27, 'Security Education': 28,
}

const sortSubjectsByOrder = (subjects: any[]) =>
  [...subjects].sort((a, b) => (SUBJECT_ORDER[a.subject] || 999) - (SUBJECT_ORDER[b.subject] || 999))

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

interface SubjectScore {
  subject: string; ca: number; exam_obj: number; exam_theory: number
  total: number; grade: string; remark: string
}

interface SchoolSettings {
  name: string; address: string; phone: string; email: string
  logo_url?: string; motto?: string
}

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

const getTermLabel = (term: string) => TERMS.find(t => t.value === term)?.label || 'Third Term'

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
  const [totalScore, setTotalScore] = useState(0)
  const [averageScore, setAverageScore] = useState(0)
  const [overallGrade, setOverallGrade] = useState('')
  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [classTeacher, setClassTeacher] = useState('')

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_${student?.display_name || 'Student'}_${selectedTerm}_${selectedYear}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0.2cm; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { height: auto !important; overflow: visible !important; }
        body { background: white !important; margin: 0 !important; padding: 0 !important; font-size: 10px !important; }
        .no-print { display: none !important; }
        .print-card { page-break-inside: avoid !important; break-inside: avoid !important; margin-bottom: 0 !important; }
        table { table-layout: fixed !important; width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
        th, td { padding: 2px 4px !important; border-color: #000 !important; border-width: 1px !important; }
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
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'next_term_date').maybeSingle()
      if (data?.value) setNextTermDate(data.value)
    } catch (e) { console.error(e) }
  }

  // ── Save comments to DB ──
  const saveComments = useCallback(async (
    studentId: string, term: string, year: string,
    tComment: string, pComment: string
  ) => {
    try {
      const { data: existing } = await supabase
        .from('report_comments')
        .select('id')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('report_comments')
          .update({
            teacher_comment: tComment,
            principal_comment: pComment,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('report_comments')
          .insert({
            student_id: studentId,
            term,
            academic_year: year,
            teacher_comment: tComment,
            principal_comment: pComment,
          })
      }
    } catch (e) {
      console.error('Failed to save comments:', e)
    }
  }, [])

  // ── Load saved comments from DB ──
  const loadSavedComments = useCallback(async (
    studentId: string, term: string, year: string
  ): Promise<{ teacher_comment: string; principal_comment: string } | null> => {
    try {
      const { data } = await supabase
        .from('report_comments')
        .select('teacher_comment, principal_comment')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .maybeSingle()

      if (data && (data.teacher_comment || data.principal_comment)) {
        return {
          teacher_comment: data.teacher_comment || '',
          principal_comment: data.principal_comment || '',
        }
      }
      return null
    } catch (e) {
      console.error('Failed to load saved comments:', e)
      return null
    }
  }, [])

  // ── Generate comments via AI and save ──
  const generateAndSaveComments = useCallback(async (
    studentId: string, firstName: string, avgScore: number,
    subjectsList: any[], className: string, gender: string,
    term: string, year: string
  ) => {
    try {
      const res = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: firstName, averageScore: avgScore,
          subjects: subjectsList.map(s => ({ name: s.subject, score: s.total })),
          className, gender,
        })
      })
      if (res.ok) {
        const d = await res.json()
        const tComment = d.teacher_comment || ''
        const pComment = d.principal_comment || ''
        setTeacherComment(tComment)
        setPrincipalComment(pComment)

        // Save to DB so they persist
        await saveComments(studentId, term, year, tComment, pComment)
      }
    } catch (e) { console.error(e) }
  }, [saveComments])

  const loadScores = useCallback(async () => {
    setLoading(true)
    setHasReport(false)
    setSubjects([])
    setTeacherComment('')
    setPrincipalComment('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/portal'); return }

      const { data: sd } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!sd) throw new Error('Profile not found')
      setStudent(sd)

      const { data: td } = await supabase.from('profiles').select('display_name, full_name').eq('role', 'teacher').limit(1)
      setClassTeacher(td?.[0]?.display_name || td?.[0]?.full_name || 'Class Teacher')

      const { data: scores } = await supabase
        .from('ca_scores').select('*')
        .eq('student_id', user.id).eq('term', selectedTerm)
        .eq('academic_year', selectedYear).eq('status', 'approved')

      if (!scores || scores.length === 0) { setHasReport(false); return }

      let processed: SubjectScore[] = scores.map((s: any) => {
        const ca = (s.ca1_score || 0) + (s.ca2_score || 0)
        const exam = (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
        const total = ca + exam
        const grade = getSubjectGrade(total)
        return { subject: s.subject, ca, exam_obj: s.exam_objective_score || 0, exam_theory: s.exam_theory_score || 0, total, grade, remark: getSubjectGradeRemark(grade) }
      })

      const map = new Map<string, SubjectScore>()
      processed.forEach(s => { const e = map.get(s.subject); if (!e || s.total > e.total) map.set(s.subject, s) })
      processed = sortSubjectsByOrder(Array.from(map.values()))

      setSubjects(processed)
      setHasReport(true)

      const total = processed.reduce((sum, s) => sum + s.total, 0)
      const avg = processed.length > 0 ? total / processed.length : 0
      setTotalScore(total)
      setAverageScore(avg)
      setOverallGrade(getOverallGrade(avg))

      // ── Try loading saved comments first ──
      const saved = await loadSavedComments(user.id, selectedTerm, selectedYear)

      if (saved) {
        // Comments already exist in DB — use them
        setTeacherComment(saved.teacher_comment)
        setPrincipalComment(saved.principal_comment)
      } else {
        // No saved comments — generate via AI and save
        let fn = sd?.first_name || ''
        if (!fn) fn = (sd?.display_name || sd?.full_name || 'Student').split(' ')[0]
        fn = fn ? fn.charAt(0).toUpperCase() + fn.slice(1).toLowerCase() : 'Student'

        await generateAndSaveComments(
          user.id, fn, Math.round(avg), processed,
          sd?.class || '—', sd?.gender || 'male',
          selectedTerm, selectedYear
        )
      }
    } catch (e) { console.error(e); toast.error('Failed to load scores') }
    finally { setLoading(false) }
  }, [selectedTerm, selectedYear, generateAndSaveComments, loadSavedComments, router])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading report card…</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[60vh]">
        <p className="text-red-600 font-medium">Student profile not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const fullName = student.display_name || student.full_name || 'Student'
  const ratings = generateRatings()
  const fmtNextTerm = nextTermDate
    ? new Date(nextTermDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be announced'
  const bestSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total > b.total ? a : b) : null
  const worstSubject = subjects.length > 0 ? subjects.reduce((a, b) => a.total < b.total ? a : b) : null
  const showImprove = worstSubject && worstSubject.total < 50
  const fmtAvg = averageScore.toFixed(2)
  const termLabel = getTermLabel(selectedTerm)

  return (
    <div className="space-y-2.5 sm:space-y-4 p-2 sm:p-4 md:p-6 pb-24 sm:pb-4 md:pb-6 print:p-0 print:pb-0 max-w-5xl mx-auto">

      {/* ── CONTROLS ── */}
      <div className="no-print bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-1.5">
              📄 <span>My Report Card</span>
            </h1>
            <p className="text-[10px] sm:text-sm text-gray-500 leading-tight">
              View & print your performance report
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline" size="sm"
              onClick={() => router.push('/student/dashboard')}
              className="h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-2.5 gap-1"
            >
              <LayoutDashboard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => router.back()}
              className="h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-2.5 gap-1"
            >
              <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </div>

        <div className="flex items-end gap-2 sm:gap-3 flex-wrap">
          <div className="space-y-0.5">
            <label className="text-[10px] sm:text-xs font-medium text-gray-500">Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-[120px] sm:w-[140px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] sm:text-xs font-medium text-gray-500">Session</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-[110px] sm:w-[130px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {hasReport && (
            <Button
              onClick={handlePrint}
              className="h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 gap-1.5 ml-auto"
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Print /</span> Download
            </Button>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {!hasReport ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <FileX className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">No Report Card Available</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
            No approved report card found for{' '}
            <span className="font-semibold text-gray-700">{fullName}</span>{' '}
            for <span className="font-semibold text-blue-700">{termLabel}</span>,{' '}
            <span className="font-semibold text-blue-700">{selectedYear}</span>.
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Try a different term / session above, or contact your school.
          </p>
        </div>
      ) : (

        <div ref={printRef} className="print-card mb-2 sm:mb-0">
          <div className="
            bg-white w-full
            border border-gray-200 md:border-2 md:border-blue-900
            rounded-lg md:rounded-none
            p-2 sm:p-5 md:p-6
            print:p-2.5 print:border-2 print:border-blue-900 print:rounded-none
          ">

            {/* ── HEADER ── */}
            <div className="border-b-2 border-blue-900 pb-2 mb-2 sm:mb-4 print:pb-2 print:mb-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 print:flex-row print:gap-3">
                <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center border-2 border-blue-900 rounded bg-blue-50">
                  {school.logo_url ? (
                    <img src={school.logo_url} alt="logo" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
                  ) : (
                    <School className="h-7 w-7 sm:h-12 sm:w-12 text-blue-900" />
                  )}
                </div>
                <div className="flex-1 text-center min-w-0">
                  <h1 className="text-sm sm:text-xl font-bold uppercase text-blue-900 tracking-wide leading-tight break-words">
                    {school.name}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-gray-700 mt-0.5 leading-snug break-words">{school.address}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 mt-0.5">
                    <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                      <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      <span className="break-all">{school.email}</span>
                    </span>
                    <span className="text-gray-400 hidden sm:inline">|</span>
                    <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                      <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />{school.phone}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[11px] italic text-amber-700 mt-0.5 font-medium">"{school.motto}"</p>
                  <div className="mt-1 pt-1 sm:mt-2 sm:pt-2 border-t border-blue-200 print:mt-1 print:pt-1">
                    <h2 className="font-bold text-[11px] sm:text-base text-blue-900 leading-tight">
                      {termLabel} Student's Performance Report
                    </h2>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mt-0.5">
                      Academic Session: {selectedYear}
                    </p>
                  </div>
                </div>
                <div className="w-16 h-20 sm:w-24 sm:h-28 border-2 border-blue-900 rounded overflow-hidden shrink-0 bg-gray-50 hidden sm:block">
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

            {/* ── STUDENT INFO ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0 sm:gap-y-1.5 text-[10px] sm:text-[13px] mb-2 sm:mb-4 print:grid-cols-2 print:mb-2 print:gap-y-0.5">
              {([
                ['Name', fullName],
                ['Admission No', student.admission_number || student.vin_id || '—'],
                ['Class', student.class || '—'],
                ['Term', termLabel],
                ['Session', selectedYear],
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

            {/* ── MAIN CONTENT ── */}
            <div className="flex flex-col md:grid md:grid-cols-[2.2fr_1.2fr] gap-2 sm:gap-4 print:grid print:grid-cols-[2.2fr_1.2fr] print:gap-2.5">

              {/* LEFT */}
              <div className="min-w-0 space-y-2 sm:space-y-3 print:space-y-2">

                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[9px] sm:text-[11px] table-fixed min-w-[380px] print:min-w-0">
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
                        {subjects.map((s, i) => (
                          <tr key={s.subject} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-400 px-1.5 py-0.5 font-medium break-words">{s.subject}</td>
                            <td className="border border-gray-400 text-center font-mono py-0.5">{s.ca}</td>
                            <td className="border border-gray-400 text-center font-mono py-0.5">{s.exam_obj + s.exam_theory}</td>
                            <td className="border border-gray-400 text-center font-bold font-mono py-0.5">{s.total}</td>
                            <td className="border border-gray-400 text-center py-0.5">
                              <span className={getSubjectGradeStyle(s.grade)}>{s.grade}</span>
                            </td>
                            <td className="border border-gray-400 px-1.5 py-0.5 text-[8px] sm:text-[10px] break-words">{s.remark}</td>
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

                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="bg-purple-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 shrink-0" /> CLASS TEACHER'S REMARK
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed bg-purple-50 break-words print:p-1.5 print:leading-snug">
                    {teacherComment || 'Generating…'}
                  </div>
                  <div className="px-2 pb-1 text-[8px] sm:text-[9px] text-gray-500 border-t border-purple-200 pt-0.5">
                    Signed: {classTeacher}
                  </div>
                </div>

                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="bg-blue-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center gap-1">
                    <Award className="h-3 w-3 shrink-0" /> PRINCIPAL'S REMARK
                  </div>
                  <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed break-words print:p-1.5 print:leading-snug">
                    {principalComment || 'Generating…'}
                  </div>
                </div>

                <div className="hidden md:block print:block">
                  <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] px-2 py-1 font-bold rounded-t-sm">Grade Scale</div>
                  <div className="border-2 border-blue-900 p-2 rounded-b-sm print:p-1.5">
                    <div className="grid grid-cols-3 gap-1 text-[8px] sm:text-[9px]">
                      {([['A1','75-100'],['B2','70-74'],['B3','65-69'],['C4','60-64'],['C5','55-59'],['C6','50-54'],['D7','45-49'],['E8','40-44'],['F9','0-39']] as [string,string][]).map(([g,r]) => (
                        <div key={g} className="flex items-center gap-1">
                          <span className={getSubjectGradeStyle(g)}>{g}</span>
                          <span className="text-gray-600">{r}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-1 text-[8px] sm:text-[9px] print:mt-1 print:pt-1">
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

              {/* RIGHT */}
              <div className="space-y-2 sm:space-y-3 print:space-y-2">

                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 uppercase">Performance Summary</div>
                  <div className="p-2 sm:p-2.5 text-[10px] sm:text-[11px] space-y-1 print:p-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Score</span><span className="font-bold">{totalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Average</span><span className="font-bold">{fmtAvg}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Grade</span>
                      <span className={getOverallGradeTextColor(overallGrade)}>{overallGrade} – {getOverallGradeRemark(overallGrade)}</span>
                    </div>
                    {bestSubject && (
                      <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-200">
                        <span className="flex items-center gap-1 font-medium"><TrendingUp className="h-3 w-3 shrink-0" /> Best</span>
                        <span className="font-bold text-right text-[9px] sm:text-[10px] break-words ml-2">{bestSubject.subject} ({bestSubject.total})</span>
                      </div>
                    )}
                    {showImprove && worstSubject && (
                      <div className="flex justify-between text-red-600">
                        <span className="flex items-center gap-1 font-medium"><TrendingDown className="h-3 w-3 shrink-0" /> Improve</span>
                        <span className="font-bold text-right text-[9px] sm:text-[10px] break-words ml-2">{worstSubject.subject} ({worstSubject.total})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 sm:gap-3 print:grid-cols-1 print:gap-2">
                  <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                    <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">Affective Domain</div>
                    <div className="p-1.5 sm:p-2 print:p-1">
                      <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                        <tbody>
                          {ratings.behavior.map(item => (
                            <tr key={item.name}>
                              <td className="border px-1 py-0.5 font-medium print:py-px">{item.name}</td>
                              <td className="border text-center w-7 sm:w-8 font-bold text-blue-700 print:py-px">{item.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                    <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">Psychomotor</div>
                    <div className="p-1.5 sm:p-2 print:p-1">
                      <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                        <tbody>
                          {ratings.skills.map(item => (
                            <tr key={item.name}>
                              <td className="border px-1 py-0.5 font-medium print:py-px">{item.name}</td>
                              <td className="border text-center w-7 sm:w-8 font-bold text-green-700 print:py-px">{item.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                  <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">Key To Ratings</div>
                  <div className="p-2 text-[8px] sm:text-[10px] grid grid-cols-5 md:grid-cols-1 gap-0.5 print:grid-cols-1 print:p-1">
                    {['5 – Excellent','4 – Very Good','3 – Good','2 – Fair','1 – Poor'].map(r => (
                      <div key={r} className="font-medium text-gray-800">{r}</div>
                    ))}
                  </div>
                </div>

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

            {/* ── FOOTER ── */}
            <div className="border-t-2 border-blue-900 mt-2 sm:mt-4 pt-1 sm:pt-1.5 text-center text-[7px] sm:text-[9px] text-gray-500 print:mt-2 print:pt-1">
              Powered by Vincollins Portal | {school.motto}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}