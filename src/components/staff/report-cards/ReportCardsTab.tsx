// components/staff/report-cards/ReportCardsTab.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
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
import { useReactToPrint } from 'react-to-print'
import {
  FileCheck, Search, Eye, Printer, CheckCircle2, Clock,
  Loader2, FileText, Send, RefreshCw, Sparkles,
  ChevronRight, Brain, Download, School, Mail, Phone, User,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================
// GRADING
// ============================================
const getWAECGrade = (score: number): string => {
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

const getOverallGrade = (score: number): string => {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'P'
  return 'F'
}

const getGradeRemark = (grade: string): string =>
  ({ 'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good', 'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit', 'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail' }[grade] || '')

const getGradeStyle = (grade: string): string => {
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

// ============================================
// TYPES
// ============================================
interface SubjectScore {
  subject: string
  ca1: number
  ca2: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface ReportCard {
  id: string
  student_id: string
  class: string
  term: string
  academic_year: string
  session_year: string
  subject_scores: SubjectScore[]
  total_score: number
  average_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  admin_comments: string
  status: 'draft' | 'pending' | 'approved' | 'published'
  published_at: string | null
  generated_by: string
  generated_at: string
  attendance_summary: { total_days: number; present: number; absent: number }
  affective_traits: Record<string, string>
  psychomotor_skills: Record<string, string>
  student?: {
    full_name: string; vin_id: string; gender?: string
    admission_number?: string; photo_url?: string; class?: string
  }
}

interface ReportCardsTabProps {
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
const YEARS = ['2025/2026', '2026/2027', '2027/2028', '2028/2029']
const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3']

const getTermLabel = (term?: string): string =>
  ({ first: 'First Term', second: 'Second Term', third: 'Third Term' }[term || ''] || 'Third Term')

// ============================================
// AI COMMENT GENERATION
// ============================================
const generateAIComments = async (
  studentName: string, averageScore: number,
  subjects: { name: string; score: number }[], className: string, gender?: string
) => {
  const res = await fetch('/api/generate-comments', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentName, averageScore, subjects, className, gender })
  })
  if (!res.ok) throw new Error('Failed to generate comments')
  const data = await res.json()
  return { teacher_comment: data.teacher_comment, principal_comment: data.principal_comment }
}

// ============================================
// REPORT CARD PREVIEW — reusable, responsive
// ============================================
interface PreviewProps {
  card: ReportCard
  schoolName?: string
}

function ReportCardPreview({ card, schoolName = 'Vincollins College' }: PreviewProps) {
  const overallGrade = getOverallGrade(card.average_score)
  const termDisplay = getTermLabel(card.term)

  return (
    <div className="bg-white w-full text-black border border-gray-200 md:border-2 md:border-blue-900 rounded-lg md:rounded-none p-3 sm:p-5 print:p-3 print:border-2 print:border-blue-900 print:rounded-none">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="border-b-2 border-blue-900 pb-3 mb-3">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 print:flex-row">

          {/* Logo placeholder */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center border-2 border-blue-900 rounded bg-blue-50">
            <School className="h-8 w-8 sm:h-12 sm:w-12 text-blue-900" />
          </div>

          {/* School info */}
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-base sm:text-xl font-bold uppercase text-blue-900 tracking-wide leading-tight">
              {schoolName}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-700 mt-0.5">
              7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 mt-0.5">
              <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" /> vincollinscollege@gmail.com
              </span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" /> +234 912 1155 554
              </span>
            </div>
            <p className="text-[9px] sm:text-[11px] italic text-amber-700 mt-1 font-medium">
              "Geared Towards Excellence"
            </p>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <h2 className="font-bold text-xs sm:text-base text-blue-900 leading-tight">
                {termDisplay} Student&apos;s Performance Report
              </h2>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mt-0.5">
                Academic Session: {card.academic_year}
              </p>
            </div>
          </div>

          {/* Photo — hidden on mobile */}
          <div className="w-16 h-20 sm:w-24 sm:h-28 border-2 border-blue-900 rounded overflow-hidden shrink-0 bg-gray-50 hidden sm:block">
            {card.student?.photo_url ? (
              <img src={card.student.photo_url} alt="student" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STUDENT INFO ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 sm:gap-y-1.5 text-[10px] sm:text-[13px] mb-3 sm:mb-4 print:grid-cols-2 print:text-[10px]">
        {([
          ['Name', card.student?.full_name || '—'],
          ['Admission No', card.student?.admission_number || '—'],
          ['Class', card.class || '—'],
          ['Term', termDisplay],
          ['Session', card.academic_year],
          ['Next Term', 'To be announced'],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1 py-0.5">
            <span className="font-bold text-gray-700 shrink-0 w-24 sm:w-36">{label}:</span>
            <span className="font-medium break-words">{value}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      {/*
        Mobile:  flex-col — everything stacks
        md+:     70 / 30 side-by-side
        Print:   always 70 / 30
      */}
      <div className="flex flex-col md:grid md:grid-cols-[2.2fr_1.2fr] gap-3 sm:gap-4 print:grid print:grid-cols-[2.2fr_1.2fr] print:gap-3">

        {/* LEFT */}
        <div className="min-w-0 space-y-3">

          {/* Results table */}
          <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[9px] sm:text-[11px] table-fixed min-w-[380px] print:min-w-0 print:text-[9px]">
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
                  {(card.subject_scores || []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-gray-500">No scores available</td></tr>
                  ) : (card.subject_scores || []).map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-medium break-words">{s.subject}</td>
                      <td className="border border-gray-400 text-center font-mono py-0.5">{s.ca1 + s.ca2}</td>
                      <td className="border border-gray-400 text-center font-mono py-0.5">{s.exam}</td>
                      <td className="border border-gray-400 text-center font-bold font-mono py-0.5">{s.total}</td>
                      <td className="border border-gray-400 text-center py-0.5">
                        <span className={getGradeStyle(s.grade)}>{s.grade}</span>
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
                    <td className="border border-gray-400 text-center py-1">{card.total_score}</td>
                    <td className="border border-gray-400 text-center py-1">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', getOverallGradeColor(overallGrade))}>
                        {overallGrade}
                      </span>
                    </td>
                    <td className="border border-gray-400 text-center py-1">{card.average_score?.toFixed(2)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Teacher remark */}
          <div className="border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-purple-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3 shrink-0" /> CLASS TEACHER&apos;S REMARK
            </div>
            <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed bg-purple-50 break-words">
              {card.teacher_comments || 'No comment available.'}
            </div>
          </div>

          {/* Principal remark */}
          <div className="border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-blue-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center gap-1">
              PRINCIPAL&apos;S REMARK
            </div>
            <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed break-words">
              {card.principal_comments || 'No comment available.'}
            </div>
          </div>

          {/* Grade scale — desktop/print only */}
          <div className="hidden md:block print:block">
            <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] px-2 py-1 font-bold rounded-t-sm">
              Grade Scale
            </div>
            <div className="border-2 border-blue-900 p-2 rounded-b-sm">
              <div className="grid grid-cols-3 gap-1 text-[8px] sm:text-[9px]">
                {([['A1','75-100'],['B2','70-74'],['B3','65-69'],['C4','60-64'],['C5','55-59'],['C6','50-54'],['D7','45-49'],['E8','40-44'],['F9','0-39']] as [string,string][]).map(([g,r]) => (
                  <div key={g} className="flex items-center gap-1">
                    <span className={getGradeStyle(g)}>{g}</span>
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

        {/* RIGHT */}
        <div className="space-y-3">

          {/* Performance summary */}
          <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
            <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 uppercase">
              Performance Summary
            </div>
            <div className="p-2 sm:p-2.5 text-[10px] sm:text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Score</span>
                <span className="font-bold">{card.total_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Average</span>
                <span className="font-bold">{card.average_score?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Grade</span>
                <span className={getOverallGradeTextColor(overallGrade)}>
                  {overallGrade} – {{ A: 'Excellent', B: 'Very Good', C: 'Good', P: 'Pass', F: 'Fail' }[overallGrade] || ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Subjects</span>
                <span className="font-bold">{(card.subject_scores || []).length}</span>
              </div>
            </div>
          </div>

          {/* Affective + Psychomotor — 2-col on mobile, 1-col on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 print:grid-cols-1">

            {/* Affective */}
            <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
              <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">
                Affective Domain
              </div>
              <div className="p-1.5 sm:p-2">
                <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                  <tbody>
                    {Object.entries(card.affective_traits || {}).map(([key, value]) => (
                      <tr key={key}>
                        <td className="border px-1 py-0.5 font-medium capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className="border text-center w-auto px-1 font-bold text-blue-700 text-[8px]">{value}</td>
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
                    {Object.entries(card.psychomotor_skills || {}).map(([key, value]) => (
                      <tr key={key}>
                        <td className="border px-1 py-0.5 font-medium capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className="border text-center w-auto px-1 font-bold text-green-700 text-[8px]">{value}</td>
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
              Rating Key
            </div>
            <div className="p-2 text-[8px] sm:text-[10px] grid grid-cols-5 md:grid-cols-1 gap-0.5 print:grid-cols-1">
              {['5 – Excellent','4 – Very Good','3 – Good','2 – Fair','1 – Poor'].map(r => (
                <div key={r} className="font-medium text-gray-800">{r}</div>
              ))}
            </div>
          </div>

          {/* Grade scale — mobile only */}
          <div className="md:hidden print:hidden">
            <div className="bg-blue-700 text-white text-[9px] px-2 py-1 font-bold rounded-t-sm">Grade Scale</div>
            <div className="border-2 border-blue-900 p-2 rounded-b-sm">
              <div className="grid grid-cols-3 gap-1 text-[8px]">
                {([['A1','75-100'],['B2','70-74'],['B3','65-69'],['C4','60-64'],['C5','55-59'],['C6','50-54'],['D7','45-49'],['E8','40-44'],['F9','0-39']] as [string,string][]).map(([g,r]) => (
                  <div key={g} className="flex items-center gap-0.5">
                    <span className={getGradeStyle(g)}>{g}</span>
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

      {/* Footer */}
      <div className="border-t-2 border-blue-900 mt-3 sm:mt-4 pt-1.5 text-center text-[7px] sm:text-[9px] text-gray-500">
        Powered by Vincollins Portal | Geared Towards Excellence
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ReportCardsTab({ staffProfile, termInfo }: ReportCardsTabProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedTerm, setSelectedTerm] = useState(termInfo?.termCode || 'third')
  const [selectedYear, setSelectedYear] = useState(termInfo?.sessionYear || '2025/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

  const [students, setStudents] = useState<any[]>([])
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  const [teacherComments, setTeacherComments] = useState('')
  const [principalComments, setPrincipalComments] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null)

  const [stats, setStats] = useState({ total: 0, draft: 0, pending: 0, approved: 0, published: 0 })

  const handleDownloadPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${selectedReportCard?.student?.full_name || 'Student'}_Report_Card_${selectedTerm}_${selectedYear}`,
    pageStyle: `
      @page { size: A4; margin: 8mm; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { background: white !important; margin: 0 !important; }
        .no-print { display: none !important; }
        .bg-blue-700 { background-color: #1d4ed8 !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-emerald-600 { background-color: #059669 !important; }
        .bg-cyan-600 { background-color: #0891b2 !important; }
        .bg-amber-600 { background-color: #d97706 !important; }
        .bg-red-600 { background-color: #dc2626 !important; }
        table { border-collapse: collapse !important; width: 100% !important; }
        th, td { border-color: #000 !important; }
      }
    `,
  })

  useEffect(() => { setMounted(true); loadReportCards() }, [])
  useEffect(() => { if (selectedClass) loadStudents(); else setStudents([]) }, [selectedClass])
  useEffect(() => { if (mounted) loadReportCards() }, [selectedTerm, selectedYear, selectedClass])

  const loadStudents = async () => {
    if (!selectedClass) return
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, class, vin_id, gender, admission_number, photo_url')
        .eq('role', 'student').eq('class', selectedClass).order('full_name', { ascending: true })
      setStudents(data || [])
    } catch (e) { console.error(e) }
  }

  const loadReportCards = async () => {
    setLoading(true)
    try {
      let query = supabase.from('report_cards').select('*').eq('term', selectedTerm).eq('academic_year', selectedYear).order('generated_at', { ascending: false })
      if (selectedClass) query = query.eq('class', selectedClass)
      const { data } = await query
      const withStudents = await Promise.all((data || []).map(async (card: any) => {
        const { data: sd } = await supabase.from('profiles').select('full_name, vin_id, gender, admission_number, photo_url, class').eq('id', card.student_id).single()
        return { ...card, student: sd || { full_name: 'Unknown', vin_id: '' } }
      }))
      setReportCards(withStudents)
      setStats({
        total: withStudents.length,
        draft: withStudents.filter((r: ReportCard) => r.status === 'draft').length,
        pending: withStudents.filter((r: ReportCard) => r.status === 'pending').length,
        approved: withStudents.filter((r: ReportCard) => r.status === 'approved').length,
        published: withStudents.filter((r: ReportCard) => r.status === 'published').length,
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const handleGenerateAIComments = async () => {
    if (!selectedStudentData) { toast.error('Please select a student first'); return }
    setGeneratingAI(true)
    try {
      const { data: caScores } = await supabase.from('ca_scores').select('*').eq('student_id', selectedStudent).eq('term', selectedTerm).eq('academic_year', selectedYear)
      let totalScore = 0
      const subjects: { name: string; score: number }[] = []
      ;(caScores || []).forEach((s: any) => {
        const t = (s.ca1_score || 0) + (s.ca2_score || 0) + (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
        subjects.push({ name: s.subject, score: t }); totalScore += t
      })
      const avg = subjects.length > 0 ? Math.round(totalScore / subjects.length) : 0
      const comments = await generateAIComments(selectedStudentData.full_name, avg, subjects, selectedClass, selectedStudentData.gender)
      setTeacherComments(comments.teacher_comment)
      setPrincipalComments(comments.principal_comment)
      toast.success('AI comments generated!')
    } catch (e) {
      setTeacherComments(`${selectedStudentData?.full_name || 'Student'} has shown satisfactory performance this term.`)
      setPrincipalComments('Keep up the good work and maintain your focus on academic excellence.')
    } finally { setGeneratingAI(false) }
  }

  const generateReportCard = async () => {
    if (!selectedStudent) { toast.error('Please select a student'); return }
    setGenerating(true)
    try {
      const { data: caScores } = await supabase.from('ca_scores').select('*').eq('student_id', selectedStudent).eq('term', selectedTerm).eq('academic_year', selectedYear)
      const subjectScores: SubjectScore[] = []
      let totalScore = 0
      ;(caScores || []).forEach((s: any) => {
        const ca1 = s.ca1_score || 0, ca2 = s.ca2_score || 0
        const exam = (s.exam_objective_score || 0) + (s.exam_theory_score || 0)
        const total = ca1 + ca2 + exam
        subjectScores.push({ subject: s.subject, ca1, ca2, exam, total, grade: getWAECGrade(total), remark: getGradeRemark(getWAECGrade(total)) })
        totalScore += total
      })
      const avg = subjectScores.length > 0 ? totalScore / subjectScores.length : 0
      const { data: studentData } = await supabase.from('profiles').select('full_name, class, vin_id, gender, admission_number, photo_url').eq('id', selectedStudent).single()

      const { data, error } = await supabase.from('report_cards').insert([{
        student_id: selectedStudent, class: studentData?.class || selectedClass,
        term: selectedTerm, academic_year: selectedYear, session_year: selectedYear,
        subject_scores: subjectScores, total_score: totalScore, average_score: avg,
        grade: getOverallGrade(avg),
        teacher_comments: teacherComments || `${studentData?.full_name || 'Student'} has shown satisfactory performance.`,
        principal_comments: principalComments || 'Keep working hard.',
        admin_comments: '', status: 'draft', published_at: null,
        attendance_summary: { total_days: 90, present: 85, absent: 5 },
        affective_traits: { punctuality: 'Excellent', neatness: 'Very Good', politeness: 'Excellent', cooperation: 'Very Good', leadership: 'Good' },
        psychomotor_skills: { handwriting: 'Good', sports: 'Active', crafts: 'Good', fluency: 'Very Good' },
        class_teacher: staffProfile?.full_name || 'Teacher',
        school_name: 'Vincollins College',
        generated_by: staffProfile?.id,
        generated_at: new Date().toISOString(),
      }]).select().single()

      if (error) throw error
      toast.success('Report card generated!')
      setSelectedReportCard({ ...data, student: studentData || { full_name: 'Unknown', vin_id: '' } })
      setShowPreviewDialog(true); setShowGenerateDialog(false)
      setTeacherComments(''); setPrincipalComments('')
      loadReportCards()
    } catch (e: any) { toast.error(e.message || 'Failed to generate') }
    finally { setGenerating(false) }
  }

  const updateReportCardStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status }
      if (status === 'published') updates.published_at = new Date().toISOString()
      await supabase.from('report_cards').update(updates).eq('id', id)
      toast.success(`Report card ${status}`)
      loadReportCards()
    } catch (e) { toast.error('Failed to update status') }
  }

  const handleRefresh = () => { setRefreshing(true); loadReportCards(); toast.success('Refreshed') }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />Draft</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
      case 'published': return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const filteredReportCards = reportCards.filter((r: ReportCard) =>
    r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.student?.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStudentSelect = (id: string) => {
    setSelectedStudent(id)
    setSelectedStudentData(students.find(s => s.id === id))
    setTeacherComments(''); setPrincipalComments('')
  }

  if (!mounted) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Report Cards</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and manage student report cards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 sm:mr-2', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)} className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
            <FileCheck className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Generate</span>
          </Button>
        </div>
      </div>

      {/* Grade scale pill row */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Grade Scale:</span>
            {[['A: 80-100','green'],['B: 70-79','blue'],['C: 60-69','yellow'],['P: 50-59','orange'],['F: 0-49','red']].map(([label, color]) => (
              <Badge key={label} className={`bg-${color}-100 text-${color}-700 text-xs`}>{label}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: stats.total, cls: '' },
          { label: 'Draft', value: stats.draft, cls: 'bg-gray-50' },
          { label: 'Pending', value: stats.pending, cls: 'bg-yellow-50', textCls: 'text-yellow-600', valCls: 'text-yellow-700' },
          { label: 'Approved', value: stats.approved, cls: 'bg-blue-50', textCls: 'text-blue-600', valCls: 'text-blue-700' },
          { label: 'Published', value: stats.published, cls: 'bg-green-50', textCls: 'text-green-600', valCls: 'text-green-700' },
        ].map(({ label, value, cls, textCls, valCls }) => (
          <Card key={label} className={cn('border-0 shadow-sm', cls)}>
            <CardContent className="p-2 sm:p-3 text-center">
              <p className={cn('text-xs', textCls || 'text-gray-500')}>{label}</p>
              <p className={cn('text-lg sm:text-xl font-bold', valCls || 'text-gray-800')}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{TERM_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
          <TabsTrigger value="generate" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-3 sm:px-4 py-2 text-sm">
            Generate
          </TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-3 sm:px-4 py-2 text-sm">
            View All
          </TabsTrigger>
        </TabsList>

        {/* Generate tab */}
        <TabsContent value="generate">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Generate New Report Card</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Select a student to generate their report card</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Student</Label>
                  <Select value={selectedStudent} onValueChange={handleStudentSelect} disabled={!selectedClass}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue placeholder={selectedClass ? 'Select student' : 'Select a class first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}{s.vin_id ? ` (${s.vin_id})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setShowGenerateDialog(true)}
                    disabled={!selectedStudent}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View all tab */}
        <TabsContent value="view">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-base sm:text-lg">All Report Cards</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search student…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Loading…</p>
                </div>
              ) : filteredReportCards.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No report cards found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Class</TableHead>
                        <TableHead className="text-xs text-center">Avg</TableHead>
                        <TableHead className="text-xs text-center hidden sm:table-cell">Grade</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Generated</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReportCards.map((r: ReportCard) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-xs sm:text-sm">{r.student?.full_name}</p>
                              <p className="text-[10px] text-gray-500">{r.student?.vin_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs hidden sm:table-cell">{r.class}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-xs sm:text-sm">{r.average_score?.toFixed(1)}%</span>
                          </TableCell>
                          <TableCell className="text-center hidden sm:table-cell">
                            <Badge className={cn('text-xs font-bold', getOverallGradeColor(r.grade))}>{r.grade}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-xs text-gray-500 hidden md:table-cell">
                            {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => { setSelectedReportCard(r); setShowPreviewDialog(true) }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {r.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => updateReportCardStatus(r.id, 'pending')}>
                                      <Send className="h-4 w-4 mr-2" /> Submit for Approval
                                    </DropdownMenuItem>
                                  )}
                                  {r.status === 'approved' && (
                                    <DropdownMenuItem onClick={() => updateReportCardStatus(r.id, 'published')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Publish
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { setSelectedReportCard(r); setShowPreviewDialog(true) }}>
                                    <Printer className="h-4 w-4 mr-2" /> View & Print
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════
          GENERATE DIALOG
          ═══════════════════════════════════════════ */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Brain className="h-5 w-5 text-purple-600 shrink-0" /> Generate Report Card
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter teacher comments or use AI to generate them automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* AI banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI-Powered Comments</p>
                  <p className="text-xs text-muted-foreground">Generate personalised comments based on student performance</p>
                </div>
              </div>
              <Button
                variant="outline" size="sm"
                onClick={handleGenerateAIComments}
                disabled={generatingAI || !selectedStudentData}
                className="border-purple-300 hover:bg-purple-50 shrink-0 w-full sm:w-auto"
              >
                {generatingAI
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                  : <><Brain className="h-4 w-4 mr-2" />Generate AI Comments</>
                }
              </Button>
            </div>

            <div>
              <Label className="text-sm">Teacher Comments</Label>
              <Textarea
                value={teacherComments}
                onChange={(e) => setTeacherComments(e.target.value)}
                placeholder="Enter your comments about the student's performance…"
                rows={4} className="mt-1 text-sm resize-none"
              />
            </div>
            <div>
              <Label className="text-sm">Principal Comments</Label>
              <Textarea
                value={principalComments}
                onChange={(e) => setPrincipalComments(e.target.value)}
                placeholder="Principal's remarks…"
                rows={3} className="mt-1 text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)} className="text-sm">Cancel</Button>
            <Button onClick={generateReportCard} disabled={generating} className="bg-purple-600 hover:bg-purple-700 text-white text-sm">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : 'Generate Report Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════
          PREVIEW DIALOG
          ═══════════════════════════════════════════ */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        {/*
          KEY RESPONSIVE FIXES:
          - w-[95vw] fills nearly the whole screen on mobile
          - max-w-4xl caps it on desktop
          - max-h-[92vh] + overflow-y-auto prevents taller-than-viewport overflow
          - p-0 so inner padding is controlled per-section
        */}
        <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          {selectedReportCard && (
            <div className="p-3 sm:p-5 space-y-4">

              {/* Dialog header */}
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base truncate">
                  Report Card — {selectedReportCard.student?.full_name}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {getTermLabel(selectedReportCard.term)} · {selectedReportCard.academic_year} · {selectedReportCard.class}
                </DialogDescription>
              </DialogHeader>

              {/* Download button row */}
              <div className="flex justify-end gap-2 no-print">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleDownloadPDF()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>

              {/* The report card itself — ref for printing */}
              <div ref={reportRef}>
                <ReportCardPreview card={selectedReportCard} />
              </div>

              {/* Footer actions */}
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)} className="text-xs sm:text-sm">
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadPDF()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}