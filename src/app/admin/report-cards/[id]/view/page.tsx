// app/admin/report-cards/[id]/view/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Printer, Download, RefreshCw,
  Loader2, GraduationCap, MapPin, Phone, Mail,
  User, Hash, Calendar, BookOpen, CheckCircle2,
  Clock, Award, Star, Heart, MessageSquare, PenTool
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────
interface SubjectScore {
  name: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface BehaviourRating {
  trait: string
  rating: number
}

interface SkillRating {
  skill: string
  rating: number
}

interface ReportCardData {
  id: string
  student_id: string
  student_name: string
  student_vin: string
  student_admission_number?: string
  class: string
  term: string
  academic_year: string
  subjects_data: SubjectScore[]
  average_score: number
  total_score: number
  grade: string
  remarks: string
  teacher_comments: string
  principal_comments: string
  behaviour_ratings?: BehaviourRating[]
  skill_ratings?: SkillRating[]
  assessment_data?: {
    totalDays?: number
    daysPresent?: number
    daysAbsent?: number
  }
  status: string
  next_term_begins?: string
  generated_at?: string
  class_teacher?: string
  principal_name?: string
}

// ─── Helpers ──────────────────────────────────────────
const getGradeColor = (grade: string) => {
  if (!grade || grade === '—') return 'border-gray-200 text-gray-400'
  if (grade.startsWith('A')) return 'border-emerald-400 text-emerald-700 bg-emerald-50'
  if (grade.startsWith('B')) return 'border-blue-400 text-blue-700 bg-blue-50'
  if (grade.startsWith('C')) return 'border-yellow-400 text-yellow-700 bg-yellow-50'
  if (grade.startsWith('D')) return 'border-orange-400 text-orange-700 bg-orange-50'
  if (grade.startsWith('E')) return 'border-red-400 text-red-700 bg-red-50'
  if (grade.startsWith('F')) return 'border-red-500 text-red-700 bg-red-50'
  return 'border-gray-200 text-gray-600'
}

const getRatingStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        'w-3 h-3',
        i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-100'
      )}
    />
  ))
}

const TERM_LABELS: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term',
}

// ─── Main A4 Report Card Component ────────────────────
export default function A4ReportCardView() {
  const params = useParams()
  const router = useRouter()
  const reportCardId = params.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportCardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReportCard()
  }, [reportCardId])

  const loadReportCard = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: reportCard, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('id', reportCardId)
        .single()

      if (error) throw error
      if (!reportCard) {
        setError('Report card not found')
        return
      }

      setData(reportCard)
    } catch (err: any) {
      console.error('Error loading report card:', err)
      setError(err.message || 'Failed to load report card')
      toast.error('Failed to load report card')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Report Card...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-600 font-medium mb-2">
            {error || 'Report card not found'}
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    )
  }

  const totalDays = data.assessment_data?.totalDays || 
    (data.assessment_data?.daysPresent || 0) + (data.assessment_data?.daysAbsent || 0) || 100
  const daysPresent = data.assessment_data?.daysPresent || totalDays

  return (
    <div className="min-h-screen bg-gray-200 py-4 sm:py-8 px-2 sm:px-4 print:bg-white print:p-0">
      {/* Top Action Bar - Hidden when printing */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between">
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
            variant="outline"
            size="sm"
            onClick={loadReportCard}
            className="bg-white shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* A4 Report Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none"
        style={{ minHeight: '297mm' }}
      >
        <div className="p-6 sm:p-8 md:p-10 print:p-4">
          
          {/* School Header */}
          <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <GraduationCap className="h-10 w-10 text-blue-900" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">
                  Demo International School Abuja
                </h1>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" /> 
                  1234 Unity Avenue, Wuse, Abuja, FCT, Nigeria
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> 08033174228
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> info@demo.inlaps.cloud
              </span>
            </div>
          </div>

          {/* Student Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-xs">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="font-semibold ml-1">{data.student_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Admission No:</span>
              <span className="font-semibold ml-1">{data.student_admission_number || data.student_vin}</span>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <span className="font-semibold ml-1">{data.class}</span>
            </div>
            <div>
              <span className="text-gray-500">Term:</span>
              <span className="font-semibold ml-1">
                {TERM_LABELS[data.term] || data.term} {data.academic_year}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Days:</span>
              <span className="font-semibold ml-1">{totalDays}</span>
            </div>
            <div>
              <span className="text-gray-500">Days Present:</span>
              <span className="font-semibold ml-1">{daysPresent}</span>
            </div>
            <div className="col-span-2 md:col-span-2">
              <span className="text-gray-500">Next Term Begins:</span>
              <span className="font-semibold ml-1">{data.next_term_begins || 'TBD'}</span>
            </div>
          </div>

          {/* Academic Performance Table */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wider">
              Academics
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-blue-800 px-3 py-2 text-left font-semibold">Subject</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">CA (40)</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">Exam (60)</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">Total</th>
                  <th className="border border-blue-800 px-3 py-2 text-center font-semibold w-16">Grade</th>
                  <th className="border border-blue-800 px-3 py-2 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects_data?.length > 0 ? (
                  data.subjects_data.map((subject, idx) => (
                    <tr 
                      key={idx} 
                      className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
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
                        {subject.grade && subject.grade !== '—' ? (
                          <Badge className={cn('text-[10px] font-bold border', getGradeColor(subject.grade))}>
                            {subject.grade}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5">
                        {subject.remark || (subject.grade && subject.grade !== '—' ? 
                          (subject.grade.startsWith('A') ? 'Excellent' :
                           subject.grade.startsWith('B') ? 'Very Good' :
                           subject.grade.startsWith('C') ? 'Good' :
                           subject.grade.startsWith('D') ? 'Fair' :
                           subject.grade.startsWith('E') ? 'Pass' : 'Fail')
                        : '—')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-400">
                      No subject scores available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary & Ratings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Left Column: Scores Summary + Behaviours */}
            <div>
              {/* Average & Grade */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">AVERAGE SCORE:</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {data.average_score?.toFixed(1) || '0.0'}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 font-medium">TOTAL SCORE:</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {data.total_score || '0'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 font-medium">GRADE:</p>
                    <p className="text-3xl font-bold text-emerald-600">{data.grade || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Behaviour Ratings */}
              <div>
                <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase">
                  Behaviour & Skills
                </h4>
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left">Behaviour</th>
                      <th className="border border-gray-300 px-2 py-1 text-center w-16">Rating</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Skills</th>
                      <th className="border border-gray-300 px-2 py-1 text-center w-16">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(
                      data.behaviour_ratings?.length || 0,
                      data.skill_ratings?.length || 0,
                      9
                    ) }).map((_, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 px-2 py-1">
                          {data.behaviour_ratings?.[idx]?.trait || '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {data.behaviour_ratings?.[idx]?.rating ? (
                            <span className="font-semibold">
                              {data.behaviour_ratings[idx].rating}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {data.skill_ratings?.[idx]?.skill || '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {data.skill_ratings?.[idx]?.rating ? (
                            <span className="font-semibold">
                              {data.skill_ratings[idx].rating}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Grade Scale + Rating Key */}
            <div className="text-[10px]">
              <div className="mb-4">
                <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Grade Scale</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <div className="grid grid-cols-2 gap-1">
                    <p>A1: 75-100 (Excellent)</p>
                    <p>B2: 70-74 (Very Good)</p>
                    <p>B3: 65-69 (Good)</p>
                    <p>C4: 60-64 (Credit)</p>
                    <p>C5: 55-59 (Credit)</p>
                    <p>C6: 50-54 (Credit)</p>
                    <p>D7: 45-49 (Pass)</p>
                    <p>E8: 40-44 (Pass)</p>
                    <p>F9: 0-39 (Fail)</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Rating Key</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <p>5 - Very Good</p>
                  <p>4 - Good</p>
                  <p>3 - Average</p>
                  <p>2 - Below Average</p>
                  <p>1 - Poor</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Remarks</h4>
                <p className="text-sm font-semibold text-emerald-700">
                  {data.remarks || data.grade ? 
                    (data.grade?.startsWith('A') ? 'Excellent' :
                     data.grade?.startsWith('B') ? 'Very Good' :
                     data.grade?.startsWith('C') ? 'Good' :
                     data.grade?.startsWith('D') ? 'Fair' :
                     data.grade?.startsWith('E') ? 'Pass' : 'Fail')
                  : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Teacher & Principal Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Teacher's Comment</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 min-h-[60px]">
                <p className="text-xs text-gray-700">
                  {data.teacher_comments || 'No comments yet.'}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 mb-1 uppercase">Principal's Comment</h4>
              <div className="bg-green-50 border border-green-200 rounded p-3 min-h-[60px]">
                <p className="text-xs text-gray-700">
                  {data.principal_comments || 'No comments yet.'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-3 text-center text-[10px] text-gray-400">
            <p>This is a computer-generated report and does not require a signature.</p>
            {data.generated_at && (
              <p>Generated: {new Date(data.generated_at).toLocaleDateString()}</p>
            )}
          </div>

        </div>
      </motion.div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important;
            margin: 0;
            padding: 0;
          }
          @page { 
            size: A4;
            margin: 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}