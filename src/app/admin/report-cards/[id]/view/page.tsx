'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Printer, Download, Loader2,
  GraduationCap, MapPin, Phone, Mail,
  User, Calendar, Award, TrendingUp, TrendingDown
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

// ─── Types ────────────────────────────────────────────
interface SubjectScore {
  name: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface ReportCardData {
  id: string
  student_id: string
  student_name: string
  student_display_name?: string
  student_vin: string
  student_admission_number?: string
  class: string
  term: string
  academic_year: string
  subjects_data: SubjectScore[]
  average_score: number
  total_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  status: string
  class_teacher?: string
  principal_name?: string
  school_name?: string
  generated_at?: string
  published_at?: string
}

// ─── Helpers ──────────────────────────────────────────
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

const TERM_LABELS: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term',
}

const DEFAULT_SCHOOL = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

// ─── Main Component ────────────────────────────────────
export default function ViewReportCardPage() {
  const params = useParams()
  const router = useRouter()
  const reportCardId = params.id as string

  const [loading, setLoading] = useState(true)
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null)
  const [schoolSettings, setSchoolSettings] = useState(DEFAULT_SCHOOL)
  const [error, setError] = useState<string | null>(null)

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_Card_${reportCard?.student_name || 'Student'}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 8mm; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { background: white !important; margin: 0 !important; padding: 0 !important; }
        .no-print { display: none !important; }
        .bg-blue-700 { background-color: #1d4ed8 !important; }
        .bg-emerald-600 { background-color: #059669 !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-cyan-600 { background-color: #0891b2 !important; }
        .bg-amber-600 { background-color: #d97706 !important; }
        .bg-red-600 { background-color: #dc2626 !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        table { border-collapse: collapse !important; width: 100% !important; }
        th, td { border-color: #000 !important; border-width: 1px !important; }
      }
    `,
  })

  useEffect(() => {
    const loadReportCard = async () => {
      if (!reportCardId) {
        setError('No report card ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Load school settings
        const { data: settings } = await supabase
          .from('school_settings')
          .select('*')
          .maybeSingle()
        
        if (settings) {
          setSchoolSettings({
            name: settings.school_name || DEFAULT_SCHOOL.name,
            address: settings.school_address || DEFAULT_SCHOOL.address,
            phone: settings.school_phone || DEFAULT_SCHOOL.phone,
            email: settings.school_email || DEFAULT_SCHOOL.email,
            motto: settings.school_motto || DEFAULT_SCHOOL.motto,
          })
        }

        // Load report card
        const { data: card, error: cardError } = await supabase
          .from('report_cards')
          .select('*')
          .eq('id', reportCardId)
          .single()

        if (cardError) throw cardError

        if (!card) {
          setError('Report card not found')
          setLoading(false)
          return
        }

        // Load student profile for additional info
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, full_name, admission_number, photo_url')
          .eq('id', card.student_id)
          .single()

        setReportCard({
          ...card,
          student_display_name: profile?.display_name || profile?.full_name || card.student_name,
          student_admission_number: profile?.admission_number || card.student_admission_number,
        })

      } catch (error: any) {
        console.error('Error loading report card:', error)
        setError(error.message || 'Failed to load report card')
        toast.error('Failed to load report card')
      } finally {
        setLoading(false)
      }
    }

    loadReportCard()
  }, [reportCardId])

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Report Card...</p>
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error || !reportCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-600 font-medium mb-2">
            {error || 'Report card not found'}
          </p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    )
  }

  const overallGrade = getOverallGrade(reportCard.average_score)
  const termDisplay = TERM_LABELS[reportCard.term] || reportCard.term
  const bestSubject = reportCard.subjects_data?.length > 0
    ? reportCard.subjects_data.reduce((a, b) => a.total > b.total ? a : b)
    : null
  const worstSubject = reportCard.subjects_data?.length > 0
    ? reportCard.subjects_data.reduce((a, b) => a.total < b.total ? a : b)
    : null

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4 print:bg-white print:p-0">
      
      {/* Top Action Bar - Hidden when printing */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="bg-white shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* A4 Report Card */}
      <div 
        ref={printRef}
        className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none"
        style={{ minHeight: '297mm' }}
      >
        <div className="p-6 sm:p-8 md:p-10 print:p-4">
          
          {/* ── School Header ── */}
          <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <GraduationCap className="h-10 w-10 text-blue-900" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">
                  {schoolSettings.name}
                </h1>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" /> {schoolSettings.address}
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {schoolSettings.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {schoolSettings.email}
              </span>
            </div>
            <p className="text-xs italic text-amber-700 mt-1">
              "{schoolSettings.motto}"
            </p>
          </div>

          {/* ── Student Info ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-xs">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="font-semibold ml-1">{reportCard.student_display_name || reportCard.student_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Admission No:</span>
              <span className="font-semibold ml-1">{reportCard.student_admission_number || reportCard.student_vin}</span>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <span className="font-semibold ml-1">{reportCard.class}</span>
            </div>
            <div>
              <span className="text-gray-500">Term:</span>
              <span className="font-semibold ml-1">
                {termDisplay} {reportCard.academic_year}
              </span>
            </div>
          </div>

          {/* ── Academics Table ── */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wider">
              Academic Performance
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-blue-800 px-3 py-2 text-left font-semibold">Subject</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">CA</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">Exam</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">Total</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">Grade</th>
                  <th className="border border-blue-800 px-3 py-2 text-left font-semibold">Remark</th>
                </tr>
              </thead>
              <tbody>
                {reportCard.subjects_data?.length > 0 ? (
                  reportCard.subjects_data.map((subject, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-3 py-1.5 font-medium">
                        {subject.name}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        {subject.ca || '—'}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        {subject.exam || '—'}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-bold">
                        {subject.total || '—'}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <span className={getSubjectGradeStyle(subject.grade)}>
                          {subject.grade || '—'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5">
                        {subject.remark || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-400">
                      No subject scores available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Summary ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600 font-medium">AVERAGE SCORE:</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {reportCard.average_score?.toFixed(1) || '0.0'}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">TOTAL SCORE:</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {reportCard.total_score || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-medium">GRADE:</p>
                  <p className={cn('text-3xl font-bold px-3 py-1 rounded', getOverallGradeColor(overallGrade))}>
                    {overallGrade}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {bestSubject && (
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded border border-emerald-200">
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                    <TrendingUp className="h-4 w-4" /> Best
                  </span>
                  <span className="font-bold text-emerald-700">
                    {bestSubject.name}: {bestSubject.total}
                  </span>
                </div>
              )}
              {worstSubject && worstSubject.total < 50 && (
                <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                  <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                    <TrendingDown className="h-4 w-4" /> Needs Improvement
                  </span>
                  <span className="font-bold text-red-700">
                    {worstSubject.name}: {worstSubject.total}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Comments ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Teacher's Comment</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 min-h-[60px]">
                <p className="text-xs text-gray-700">
                  {reportCard.teacher_comments || 'No comments yet.'}
                </p>
                {reportCard.class_teacher && (
                  <p className="text-xs text-gray-500 mt-1">- {reportCard.class_teacher}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Principal's Comment</h4>
              <div className="bg-green-50 border border-green-200 rounded p-3 min-h-[60px]">
                <p className="text-xs text-gray-700">
                  {reportCard.principal_comments || 'No comments yet.'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-gray-300 pt-3 text-center text-[10px] text-gray-400">
            <p>This is a computer-generated report.</p>
            {reportCard.generated_at && (
              <p>Generated: {new Date(reportCard.generated_at).toLocaleDateString()}</p>
            )}
            {reportCard.status === 'published' && reportCard.published_at && (
              <p className="text-emerald-600">Published: {new Date(reportCard.published_at).toLocaleDateString()}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}