// components/admin/report-cards/ReportCardApproval.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import {
  Loader2, CheckCircle, XCircle, Eye, FileText,
  Search, RefreshCw, Send, Clock, CheckCircle2,
  User, FileCheck, Printer, Download, Sparkles,
  ArrowLeft, Award, TrendingUp, TrendingDown,
  School, Mail, Phone, Edit2, Save, Calendar,
  Lock, EyeOff, Filter, ChevronDown, Users,
  BarChart3, Shield,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

// ── Subject name normalization ─────────────────────────────────────────────────
const SUBJECT_NAME_MAP: Record<string, string> = {
  'Physical Education': 'PHE',
  'P.H.E.': 'PHE',
  'P H E': 'PHE',
  'Physical and Health Education': 'PHE',
  'Security Edu': 'Security Education',
  'Computer Studies': 'Information Technology',
  'ICT': 'Information Technology',
  'C.R.S.': 'CRS',
  'C.R.K': 'CRS',
  'Christian Religious Studies': 'CRS',
  'Christian Religious Knowledge': 'CRS',
  'C.C.A.': 'CCA',
  'Cultural and Creative Arts': 'CCA',
  'Agric Science': 'Agricultural Science',
  'Basic Sci': 'Basic Science',
  'Basic Tech': 'Basic Technology',
  'Bus Studies': 'Business Studies',
  'Civic Edu': 'Civic Education',
  'Social Std': 'Social Studies',
  'Home Econ': 'Home Economics',
  'Further Maths': 'Further Mathematics',
  'Lit in English': 'Literature in English',
  'English': 'English Studies',
}

const normalizeSubjectName = (name: string): string => {
  return SUBJECT_NAME_MAP[name] || name
}

// ── Subject ordering ───────────────────────────────────────────────────────────
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
    (SUBJECT_ORDER[a.name || a.subject] || 999) - (SUBJECT_ORDER[b.name || b.subject] || 999)
  )

// ── Grading ────────────────────────────────────────────────────────────────────
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
  ({ A1: 'Excellent', B2: 'Very Good', B3: 'Good', C4: 'Credit', C5: 'Credit', C6: 'Credit', D7: 'Pass', E8: 'Pass', F9: 'Fail' }[grade] || '')

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

// ── Types ──────────────────────────────────────────────────────────────────────
type ReportCardStatus = 'generated' | 'pending' | 'approved' | 'published' | 'rejected'

interface ReportCard {
  id: string
  student_id: string
  student_name: string
  student_display_name?: string
  student_vin: string
  student_admission_number?: string
  student_photo_url?: string
  class: string
  term: string
  academic_year: string
  subjects_data: any[]
  teacher_comments: string
  principal_comments: string
  class_teacher: string
  average_score: number
  total_score?: number
  status: ReportCardStatus
  submitted_at: string
  school_name?: string
  student_email?: string
  student_phone?: string
  next_term_date?: string
  published_at?: string | null
}

interface ReportCardApprovalProps {
  onRefresh?: () => void
  hideBackButton?: boolean
}

const TERMS = ['First Term', 'Second Term', 'Third Term']
const ACADEMIC_YEARS = ['2024/2025', '2025/2026', '2026/2027']
const CLASSES = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const getTermValue = (label: string): string =>
  ({ 'First Term': 'first', 'Second Term': 'second', 'Third Term': 'third' }[label] || 'third')

const getTermLabel = (value: string): string =>
  ({ first: 'First Term', second: 'Second Term', third: 'Third Term' }[value] || 'Third Term')

const isPublishedToStudent = (status: ReportCardStatus) => status === 'published'

// ── Status config ──────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle2 },
  approved: { label: 'Approved', className: 'bg-blue-50 text-blue-700 border border-blue-200', icon: CheckCircle },
  generated: { label: 'Generated', className: 'bg-violet-50 text-violet-700 border border-violet-200', icon: FileText },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border border-red-200', icon: XCircle },
}

const StatusPill = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600 border border-slate-200', icon: FileText }
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, iconClass, icon: Icon, valueClass, onClick, active,
}: {
  label: string; value: number; iconClass: string; icon: any
  valueClass?: string; onClick?: () => void; active?: boolean
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full text-left p-4 rounded-2xl border bg-white hover:shadow-md transition-all duration-200',
      active ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10' : 'border-slate-200/80 shadow-sm',
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={cn('text-2xl font-bold', valueClass || 'text-slate-900')}>{value}</p>
      </div>
      <div className={cn('p-2.5 rounded-xl shrink-0', iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </button>
)

// ── Report card preview ────────────────────────────────────────────────────────
interface PreviewProps {
  card: ReportCard; schoolSettings: any; nextTermDate: string
  teacherComment: string; principalComment: string
  editingTeacher: boolean; editingPrincipal: boolean; processingAction: boolean
  onEditTeacher: () => void; onSaveTeacher: () => void
  onEditPrincipal: () => void; onSavePrincipal: () => void
  onTeacherChange: (v: string) => void; onPrincipalChange: (v: string) => void
}

function ReportCardPreview({
  card, schoolSettings, nextTermDate,
  teacherComment, principalComment,
  editingTeacher, editingPrincipal, processingAction,
  onEditTeacher, onSaveTeacher, onEditPrincipal, onSavePrincipal,
  onTeacherChange, onPrincipalChange,
}: PreviewProps) {
  // Normalize and deduplicate subjects
  const rawSubjects = card.subjects_data || []
  const normalizedMap = new Map<string, any>()
  
  rawSubjects.forEach((s: any) => {
    const name = normalizeSubjectName(s.name || s.subject || '')
    if (normalizedMap.has(name)) {
      const existing = normalizedMap.get(name)!
      // Keep the entry with higher total score
      if ((s.total || 0) > (existing.total || 0)) {
        normalizedMap.set(name, { ...s, name, subject: name })
      }
    } else {
      normalizedMap.set(name, { ...s, name, subject: name })
    }
  })
  
  const displaySubjects = sortSubjectsByOrder(Array.from(normalizedMap.values()))
  
  const overallGrade = getOverallGrade(card.average_score)
  const fmtAvg = card.average_score?.toFixed(2) || '0.00'
  const termDisplay = getTermLabel(card.term)
  const fmtNextTerm = nextTermDate
    ? new Date(nextTermDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be announced'

  const bestSubject = displaySubjects.length > 0
    ? displaySubjects.reduce((a: any, b: any) => (a.total || 0) > (b.total || 0) ? a : b)
    : null
  const worstSubject = displaySubjects.length > 0
    ? displaySubjects.reduce((a: any, b: any) => (a.total || 0) < (b.total || 0) ? a : b)
    : null
  const showImprove = worstSubject && (worstSubject.total || 0) < 50
  const canEdit = !isPublishedToStudent(card.status)

  return (
    <div className="bg-white w-full text-black border border-gray-200 md:border-2 md:border-blue-900 rounded-lg md:rounded-none p-3 sm:p-5 print:p-3 print:border-2 print:border-blue-900 print:rounded-none">

      {/* Published banner */}
      {isPublishedToStudent(card.status) && (
        <div className="no-print mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          This report card is <strong>published</strong> and visible to the student.
          Unpublish to make edits.
        </div>
      )}

      {/* Header */}
      <div className="border-b-2 border-blue-900 pb-3 mb-3">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 print:flex-row">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center border-2 border-blue-900 rounded bg-blue-50">
            {schoolSettings.logo
              ? <img src={schoolSettings.logo} alt="logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
              : <School className="h-8 w-8 sm:h-12 sm:w-12 text-blue-900" />}
          </div>
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-base sm:text-xl font-bold uppercase text-blue-900 tracking-wide leading-tight break-words">
              {schoolSettings.name || 'VINCOLLINS COLLEGE'}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-700 mt-0.5 leading-snug break-words">
              {schoolSettings.address || '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 mt-0.5">
              <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                <span className="break-all">{schoolSettings.email || 'vincollinscollege@gmail.com'}</span>
              </span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="text-[9px] sm:text-[11px] text-gray-600 flex items-center gap-0.5">
                <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                {schoolSettings.phone || '+234 912 1155 554'}
              </span>
            </div>
            <p className="text-[9px] sm:text-[11px] italic text-amber-700 mt-1 font-medium">
              &ldquo;{schoolSettings.motto || 'Geared Towards Excellence'}&rdquo;
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
          <div className="w-16 h-20 sm:w-24 sm:h-28 border-2 border-blue-900 rounded overflow-hidden shrink-0 bg-gray-50 hidden sm:block">
            {card.student_photo_url
              ? <img src={card.student_photo_url} alt="student" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>}
          </div>
        </div>
      </div>

      {/* Student info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 sm:gap-y-1.5 text-[10px] sm:text-[13px] mb-3 sm:mb-4 print:grid-cols-2 print:text-[10px]">
        {([
          ['Name', card.student_display_name || card.student_name || 'Unknown'],
          ['Admission No', card.student_admission_number || '—'],
          ['Class', card.class || '—'],
          ['Term', termDisplay],
          ['Session', card.academic_year],
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

      {/* Main content */}
      <div className="flex flex-col md:grid md:grid-cols-[2.2fr_1.2fr] gap-3 sm:gap-4 print:grid print:grid-cols-[2.2fr_1.2fr] print:gap-3">

        {/* Left */}
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
                  {displaySubjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">No scores available</td>
                    </tr>
                  ) : displaySubjects.map((s: any, i: number) => {
                    const grade = s.grade || getSubjectGrade(s.total || 0)
                    return (
                      <tr key={`${s.name || s.subject}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-medium break-words">{s.name || s.subject}</td>
                        <td className="border border-gray-400 text-center font-mono py-0.5">{s.ca || 0}</td>
                        <td className="border border-gray-400 text-center font-mono py-0.5">{s.exam || 0}</td>
                        <td className="border border-gray-400 text-center font-bold font-mono py-0.5">{s.total || 0}</td>
                        <td className="border border-gray-400 text-center py-0.5">
                          <span className={getSubjectGradeStyle(grade)}>{grade}</span>
                        </td>
                        <td className="border border-gray-400 px-1.5 py-0.5 text-[8px] sm:text-[10px] break-words">
                          {s.remark || getSubjectGradeRemark(grade)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-blue-50 font-bold">
                  <tr>
                    <td colSpan={3} className="border border-gray-400 px-1.5 py-1 text-right text-[9px] sm:text-[11px]">
                      TOTAL / AVERAGE:
                    </td>
                    <td className="border border-gray-400 text-center py-1">{card.total_score || 0}</td>
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
            <div className="bg-purple-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center justify-between gap-1">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 shrink-0" />
                CLASS TEACHER&apos;S REMARK
              </span>
              <span className="no-print">
                {canEdit && !editingTeacher && (
                  <Button variant="ghost" size="sm"
                    className="h-6 text-[8px] text-white hover:text-white hover:bg-purple-700 px-1.5"
                    onClick={onEditTeacher}>
                    <Edit2 className="h-3 w-3 mr-1" />Edit
                  </Button>
                )}
                {canEdit && editingTeacher && (
                  <Button variant="ghost" size="sm"
                    className="h-6 text-[8px] text-white hover:text-white hover:bg-purple-700 px-1.5"
                    onClick={onSaveTeacher} disabled={processingAction}>
                    {processingAction ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                )}
                {!canEdit && (
                  <span className="text-[8px] text-purple-200 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Published
                  </span>
                )}
              </span>
            </div>
            {canEdit && editingTeacher ? (
              <Textarea value={teacherComment} onChange={e => onTeacherChange(e.target.value)}
                className="rounded-none border-0 text-[9px] sm:text-[10px] p-2 min-h-[60px] resize-none"
                placeholder="Enter teacher's comment…" />
            ) : (
              <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed bg-purple-50 break-words">
                {teacherComment || 'No comment.'}
              </div>
            )}
            <div className="px-2 pb-1 text-[8px] sm:text-[9px] text-gray-500 border-t border-purple-200 pt-0.5">
              Signed: {card.class_teacher || 'Class Teacher'}
            </div>
          </div>

          {/* Principal remark */}
          <div className="border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-blue-600 text-white px-2 py-1 text-[9px] sm:text-[11px] font-bold flex items-center justify-between gap-1">
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3 shrink-0" />
                PRINCIPAL&apos;S REMARK
              </span>
              <span className="no-print">
                {canEdit && !editingPrincipal && (
                  <Button variant="ghost" size="sm"
                    className="h-6 text-[8px] text-white hover:text-white hover:bg-blue-700 px-1.5"
                    onClick={onEditPrincipal}>
                    <Edit2 className="h-3 w-3 mr-1" />Edit
                  </Button>
                )}
                {canEdit && editingPrincipal && (
                  <Button variant="ghost" size="sm"
                    className="h-6 text-[8px] text-white hover:text-white hover:bg-blue-700 px-1.5"
                    onClick={onSavePrincipal} disabled={processingAction}>
                    {processingAction ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                )}
                {!canEdit && (
                  <span className="text-[8px] text-blue-200 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Published
                  </span>
                )}
              </span>
            </div>
            {canEdit && editingPrincipal ? (
              <Textarea value={principalComment} onChange={e => onPrincipalChange(e.target.value)}
                className="rounded-none border-0 text-[9px] sm:text-[10px] p-2 min-h-[60px] resize-none"
                placeholder="Enter principal's comment…" />
            ) : (
              <div className="p-2 sm:p-2.5 text-[9px] sm:text-[11px] italic leading-relaxed break-words">
                {principalComment || 'No comment.'}
              </div>
            )}
          </div>

          {/* Grade scale — desktop/print */}
          <div className="hidden md:block print:block">
            <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] px-2 py-1 font-bold rounded-t-sm">Grade Scale</div>
            <div className="border-2 border-blue-900 p-2 rounded-b-sm">
              <div className="grid grid-cols-3 gap-1 text-[8px] sm:text-[9px]">
                {(['A1|75-100','B2|70-74','B3|65-69','C4|60-64','C5|55-59','C6|50-54','D7|45-49','E8|40-44','F9|0-39']).map(item => {
                  const [g, r] = item.split('|')
                  return (
                    <div key={g} className="flex items-center gap-1">
                      <span className={getSubjectGradeStyle(g)}>{g}</span>
                      <span className="text-gray-600">{r}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-1 text-[8px] sm:text-[9px]">
                {(['A|80-100','B|70-79','C|60-69','P|50-59','F|0-49']).map(item => {
                  const [g, r] = item.split('|')
                  return (
                    <div key={g} className="flex items-center gap-0.5">
                      <span className={cn('px-1 py-0.5 rounded font-bold text-[8px]', getOverallGradeColor(g))}>{g}</span>
                      <span className="text-gray-600">{r}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-3">
          <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
            <div className="bg-blue-700 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 uppercase">Performance Summary</div>
            <div className="p-2 sm:p-2.5 text-[10px] sm:text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Score</span>
                <span className="font-bold">{card.total_score || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Average</span>
                <span className="font-bold">{fmtAvg}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Grade</span>
                <span className={getOverallGradeTextColor(overallGrade)}>
                  {overallGrade} – {{ A: 'Excellent', B: 'Very Good', C: 'Good', P: 'Pass', F: 'Fail' }[overallGrade] || ''}
                </span>
              </div>
              {bestSubject && (
                <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-200">
                  <span className="flex items-center gap-1 font-medium"><TrendingUp className="h-3 w-3 shrink-0" /> Best</span>
                  <span className="font-bold text-right text-[9px] sm:text-[10px] break-words ml-1">
                    {bestSubject.name || bestSubject.subject} ({bestSubject.total})
                  </span>
                </div>
              )}
              {showImprove && worstSubject && (
                <div className="flex justify-between text-red-600">
                  <span className="flex items-center gap-1 font-medium"><TrendingDown className="h-3 w-3 shrink-0" /> Improve</span>
                  <span className="font-bold text-right text-[9px] sm:text-[10px] break-words ml-1">
                    {worstSubject.name || worstSubject.subject} ({worstSubject.total})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 print:grid-cols-1">
            <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
              <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">Affective Domain</div>
              <div className="p-1.5 sm:p-2">
                <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                  <tbody>
                    {[{name:'Honesty',rating:4},{name:'Neatness',rating:4},{name:'Obedience',rating:4},{name:'Orderliness',rating:3},{name:'Diligence',rating:4},{name:'Punctuality',rating:4},{name:'Leadership',rating:3},{name:'Politeness',rating:4}].map(item => (
                      <tr key={item.name}>
                        <td className="border px-1 py-0.5 font-medium">{item.name}</td>
                        <td className="border text-center w-7 sm:w-8 font-bold text-blue-700">{item.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
              <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">Psychomotor</div>
              <div className="p-1.5 sm:p-2">
                <table className="w-full border-collapse border border-gray-300 text-[8px] sm:text-[10px]">
                  <tbody>
                    {[{name:'Handwriting',rating:4},{name:'Verbal Fluency',rating:4},{name:'Sports',rating:3},{name:'Handling Tools',rating:3},{name:'Club Activities',rating:4}].map(item => (
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

          <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
            <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 uppercase">Key To Ratings</div>
            <div className="p-2 text-[8px] sm:text-[10px] grid grid-cols-5 md:grid-cols-1 gap-0.5 print:grid-cols-1">
              {['5 – Excellent','4 – Very Good','3 – Good','2 – Fair','1 – Poor'].map(r => (
                <div key={r} className="font-medium text-gray-800">{r}</div>
              ))}
            </div>
          </div>

          {/* Grade scale — mobile */}
          <div className="md:hidden print:hidden">
            <div className="bg-blue-700 text-white text-[9px] px-2 py-1 font-bold rounded-t-sm">Grade Scale</div>
            <div className="border-2 border-blue-900 p-2 rounded-b-sm">
              <div className="grid grid-cols-3 gap-1 text-[8px]">
                {(['A1|75-100','B2|70-74','B3|65-69','C4|60-64','C5|55-59','C6|50-54','D7|45-49','E8|40-44','F9|0-39']).map(item => {
                  const [g, r] = item.split('|')
                  return (
                    <div key={g} className="flex items-center gap-0.5">
                      <span className={getSubjectGradeStyle(g)}>{g}</span>
                      <span className="text-gray-600">{r}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-1 pt-1 border-t border-blue-300 grid grid-cols-5 gap-0.5 text-[7px]">
                {(['A|80-100','B|70-79','C|60-69','P|50-59','F|0-49']).map(item => {
                  const [g, r] = item.split('|')
                  return (
                    <div key={g} className="flex items-center gap-0.5">
                      <span className={cn('px-1 py-0.5 rounded font-bold text-[7px]', getOverallGradeColor(g))}>{g}</span>
                      <span className="text-gray-600">{r}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-blue-900 mt-3 sm:mt-4 pt-1.5 text-center text-[7px] sm:text-[9px] text-gray-500">
        Powered by Vincollins Portal | {schoolSettings.motto || 'Geared Towards Excellence'}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ReportCardApproval({ onRefresh, hideBackButton = false }: ReportCardApprovalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedClass, setSelectedClass] = useState(searchParams?.get('class') || 'all')
  const [selectedTerm, setSelectedTerm] = useState(() => {
    const p = searchParams?.get('term')
    return p === 'first' ? 'First Term' : p === 'second' ? 'Second Term' : 'Third Term'
  })
  const [selectedYear, setSelectedYear] = useState(searchParams?.get('year') || '2025/2026')
  const [selectedStatus, setSelectedStatus] = useState(searchParams?.get('status') || 'all')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [teacherComment, setTeacherComment] = useState('')
  const [editingPrincipal, setEditingPrincipal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>({})
  const [nextTermDate, setNextTermDate] = useState('')
  const [stats, setStats] = useState({
    total: 0, generated: 0, pending: 0,
    approved: 0, published: 0, rejected: 0,
  })

  const reportRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${selectedCard?.student_display_name || selectedCard?.student_name || 'Student'}_Report_Card`,
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

  const getDisplayName = (card: ReportCard) =>
    card.student_display_name || card.student_name || 'Unknown Student'

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
    }
    load()
  }, [])

  // ── Load school settings ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('school_settings').select('*').maybeSingle()
      if (data) {
        setSchoolSettings({
          name: data.school_name || 'VINCOLLINS COLLEGE',
          address: data.school_address || '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
          phone: data.school_phone || '+234 912 1155 554',
          email: data.school_email || 'vincollinscollege@gmail.com',
          logo: data.logo_path || '',
          motto: data.school_motto || 'Geared Towards Excellence',
        })
      }
    }
    load()
  }, [])

  // ── Load next term date ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'next_term_date').maybeSingle()
        if (data?.value) setNextTermDate(data.value)
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  // ── Load report cards ──────────────────────────────────────────────────────
  const loadReportCards = useCallback(async () => {
    setLoading(true)
    try {
      const termValue = getTermValue(selectedTerm)
      let query = supabase.from('report_cards').select('*')
        .eq('term', termValue).eq('academic_year', selectedYear)
        .order('submitted_at', { ascending: false })

      if (selectedClass !== 'all') query = query.eq('class', selectedClass)
      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus)

      const { data, error } = await query
      if (error) throw error

      const studentIds = data?.map((rc: any) => rc.student_id).filter(Boolean) || []
      let studentData: Record<string, any> = {}
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, email, photo_url, admission_number, display_name, full_name')
          .in('id', studentIds)
        studentData = (students || []).reduce((acc: any, s: any) => {
          acc[s.id] = {
            email: s.email || '',
            photo_url: s.photo_url || '',
            admission_number: s.admission_number || '',
            display_name: s.display_name || s.full_name || '',
          }
          return acc
        }, {})
      }

      const cards: ReportCard[] = (data || []).map((rc: any) => {
        // Normalize and deduplicate subjects in each card
        const rawSubjects = rc.subjects_data || []
        const normalizedSubjectsMap = new Map<string, any>()
        
        rawSubjects.forEach((s: any) => {
          const name = normalizeSubjectName(s.name || s.subject || '')
          if (normalizedSubjectsMap.has(name)) {
            const existing = normalizedSubjectsMap.get(name)!
            if ((s.total || 0) > (existing.total || 0)) {
              normalizedSubjectsMap.set(name, { ...s, name, subject: name })
            }
          } else {
            normalizedSubjectsMap.set(name, { ...s, name, subject: name })
          }
        })
        
        const dedupedSubjects = Array.from(normalizedSubjectsMap.values())

        return {
          id: rc.id,
          student_id: rc.student_id,
          student_name: rc.student_name || 'Unknown',
          student_display_name: studentData[rc.student_id]?.display_name || rc.student_display_name || rc.student_name,
          student_vin: rc.student_vin || 'N/A',
          student_admission_number: studentData[rc.student_id]?.admission_number || rc.student_admission_number || '',
          student_photo_url: studentData[rc.student_id]?.photo_url || rc.student_photo_url || '',
          class: rc.class,
          term: rc.term,
          academic_year: rc.academic_year,
          subjects_data: dedupedSubjects,
          teacher_comments: rc.teacher_comments || 'No comment available.',
          principal_comments: rc.principal_comments || 'No comment available.',
          class_teacher: rc.class_teacher || 'Unknown',
          average_score: rc.average_score || 0,
          total_score: rc.total_score || 0,
          status: rc.status || 'pending',
          submitted_at: rc.submitted_at || rc.generated_at || new Date().toISOString(),
          school_name: rc.school_name || '',
          student_email: studentData[rc.student_id]?.email || '',
          student_phone: rc.student_phone || '',
          next_term_date: rc.next_term_date || nextTermDate || '',
          published_at: rc.published_at || null,
        }
      })

      const filtered = searchQuery
        ? cards.filter(c => {
            const q = searchQuery.toLowerCase()
            return (
              c.student_display_name?.toLowerCase().includes(q) ||
              c.student_name?.toLowerCase().includes(q) ||
              c.student_vin?.toLowerCase().includes(q) ||
              c.student_admission_number?.toLowerCase().includes(q)
            )
          })
        : cards

      setReportCards(filtered)
      setStats({
        total: cards.length,
        generated: cards.filter(c => c.status === 'generated').length,
        pending: cards.filter(c => c.status === 'pending').length,
        approved: cards.filter(c => c.status === 'approved').length,
        published: cards.filter(c => c.status === 'published').length,
        rejected: cards.filter(c => c.status === 'rejected').length,
      })
    } catch (e) {
      console.error(e)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedYear, selectedClass, selectedStatus, searchQuery, nextTermDate])

  useEffect(() => { loadReportCards() }, [loadReportCards])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSaveTeacherComment = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      await supabase.from('report_cards').update({ teacher_comments: teacherComment }).eq('id', selectedCard.id)
      setEditingTeacher(false)
      setSelectedCard({ ...selectedCard, teacher_comments: teacherComment })
      toast.success('Teacher comment updated')
      loadReportCards(); onRefresh?.()
    } catch { toast.error('Failed to update') }
    finally { setProcessingAction(false) }
  }

  const handleSavePrincipalComment = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      await supabase.from('report_cards').update({ principal_comments: principalComment }).eq('id', selectedCard.id)
      setEditingPrincipal(false)
      setSelectedCard({ ...selectedCard, principal_comments: principalComment })
      toast.success('Principal comment updated')
      loadReportCards(); onRefresh?.()
    } catch { toast.error('Failed to update') }
    finally { setProcessingAction(false) }
  }

  const handleApproveCard = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      await supabase.from('report_cards').update({
        status: 'approved', principal_comments: principalComment,
        teacher_comments: teacherComment, approved_by: profile?.id,
        approved_at: new Date().toISOString(),
      }).eq('id', selectedCard.id)
      toast.success('Report card approved — ready to publish')
      setShowReviewDialog(false)
      loadReportCards(); onRefresh?.()
    } catch { toast.error('Failed to approve') }
    finally { setProcessingAction(false) }
  }

  const handlePublishCard = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      await supabase.from('report_cards').update({
        status: 'published', principal_comments: principalComment,
        teacher_comments: teacherComment, published_by: profile?.id,
        published_at: new Date().toISOString(),
      }).eq('id', selectedCard.id)

      if (selectedCard.student_id) {
        await supabase.from('notifications').insert({
          user_id: selectedCard.student_id,
          title: '📄 Report Card Published!',
          message: `Your ${getTermLabel(selectedCard.term)} report card for ${selectedCard.academic_year} is now available.`,
          type: 'report_card_published', link: '/student/report-card',
          metadata: { report_card_id: selectedCard.id, term: selectedCard.term, year: selectedCard.academic_year },
        })
      }
      toast.success('Report card published — student can now view it')
      setShowReviewDialog(false)
      loadReportCards(); onRefresh?.()
    } catch { toast.error('Failed to publish') }
    finally { setProcessingAction(false) }
  }

  const handleUnpublishCard = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      await supabase.from('report_cards').update({ status: 'generated', published_at: null }).eq('id', selectedCard.id)
      toast.success('Report card unpublished')
      setShowUnpublishDialog(false); setShowReviewDialog(false)
      loadReportCards(); onRefresh?.()
    } catch { toast.error('Failed to unpublish') }
    finally { setProcessingAction(false) }
  }

  const handleRejectCard = async () => {
    if (!selectedCard || !rejectReason) { toast.error('Please provide a reason'); return }
    setProcessingAction(true)
    try {
      await supabase.from('report_cards').update({
        status: 'rejected', rejected_reason: rejectReason,
        rejected_by: profile?.id, rejected_at: new Date().toISOString(),
      }).eq('id', selectedCard.id)

      if (selectedCard.student_id) {
        await supabase.from('notifications').insert({
          user_id: selectedCard.student_id,
          title: 'Report Card Needs Revision',
          message: `Your report card needs revision. Reason: ${rejectReason}`,
          type: 'report_card_rejected', link: '/student/report-card',
          metadata: { report_card_id: selectedCard.id, reason: rejectReason },
        })
      }
      toast.success('Report card rejected')
      setShowRejectDialog(false); setShowReviewDialog(false); setRejectReason('')
      loadReportCards(); onRefresh?.()
    } catch { toast.error('Failed to reject') }
    finally { setProcessingAction(false) }
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    const cards = reportCards.filter(c => c.status === 'generated')
    if (!cards.length) { toast.error('No generated cards to approve'); return }
    if (!confirm(`Approve ${cards.length} generated report cards?\nThey will NOT be visible to students until published.`)) return
    setProcessingAction(true)
    let ok = 0
    for (const card of cards) {
      try {
        await supabase.from('report_cards').update({
          status: 'approved', approved_by: profile?.id, approved_at: new Date().toISOString(),
        }).eq('id', card.id)
        ok++
      } catch { /* continue */ }
    }
    toast.success(`Approved ${ok} report cards`)
    loadReportCards(); onRefresh?.()
    setProcessingAction(false)
  }

  const handleBulkPublish = async () => {
    const cards = reportCards.filter(c => c.status === 'approved')
    if (!cards.length) { toast.error('No approved cards to publish'); return }
    if (!confirm(`Publish ${cards.length} report cards? Students will immediately see their results.`)) return
    setProcessingAction(true)
    let ok = 0
    for (const card of cards) {
      try {
        await supabase.from('report_cards').update({
          status: 'published', published_by: profile?.id, published_at: new Date().toISOString(),
        }).eq('id', card.id)
        if (card.student_id) {
          await supabase.from('notifications').insert({
            user_id: card.student_id,
            title: '📄 Report Card Published!',
            message: `Your ${card.term} report card for ${card.academic_year} is now available.`,
            type: 'report_card_published', link: '/student/report-card',
            metadata: { report_card_id: card.id, term: card.term, year: card.academic_year },
          })
        }
        ok++
      } catch { /* continue */ }
    }
    toast.success(`Published ${ok} report cards`)
    loadReportCards(); onRefresh?.()
    setProcessingAction(false)
  }

  const handleBulkPublishAll = async () => {
    const cards = reportCards.filter(c => c.status === 'generated' || c.status === 'approved')
    if (!cards.length) { toast.error('No cards to publish'); return }
    if (!confirm(`Publish ALL ${cards.length} ready report cards? Students will immediately see their results.`)) return
    setProcessingAction(true)
    let ok = 0
    for (const card of cards) {
      try {
        await supabase.from('report_cards').update({
          status: 'published', published_by: profile?.id, published_at: new Date().toISOString(),
        }).eq('id', card.id)
        if (card.student_id) {
          await supabase.from('notifications').insert({
            user_id: card.student_id,
            title: '📄 Report Card Published!',
            message: `Your ${card.term} report card for ${card.academic_year} is now available.`,
            type: 'report_card_published', link: '/student/report-card',
            metadata: { report_card_id: card.id, term: card.term, year: card.academic_year },
          })
        }
        ok++
      } catch { /* continue */ }
    }
    toast.success(`Published ${ok} report cards!`)
    loadReportCards(); onRefresh?.()
    setProcessingAction(false)
  }

  const handleViewCard = (card: ReportCard) => {
    setSelectedCard(card)
    setPrincipalComment(card.principal_comments || 'No comment available.')
    setTeacherComment(card.teacher_comments || 'No comment available.')
    setEditingPrincipal(false); setEditingTeacher(false)
    setShowReviewDialog(true)
  }

  const unpublishedCount = stats.generated + stats.approved

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading report cards…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Back */}
        {!hideBackButton && (
          <button
            onClick={() => router.push('/admin/broad-sheet')}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Broad Sheet
          </button>
        )}

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Report Card Approval</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review, approve, and publish student report cards</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                <Shield className="h-3 w-3" />
                Only <strong>Published</strong> cards are visible to students
              </div>
            </div>
          </div>

          {/* Bulk action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {stats.generated > 0 && (
              <Button onClick={handleBulkApprove} disabled={processingAction} size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm h-8 text-xs">
                {processingAction ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                Approve All ({stats.generated})
              </Button>
            )}
            {stats.approved > 0 && (
              <Button onClick={handleBulkPublish} disabled={processingAction} size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-xs">
                {processingAction ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Publish All ({stats.approved})
              </Button>
            )}
            {unpublishedCount > 0 && (
              <Button onClick={handleBulkPublishAll} disabled={processingAction} size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8 text-xs">
                {processingAction ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Publish All Now ({unpublishedCount})
              </Button>
            )}
            <Button variant="outline" onClick={loadReportCards} size="sm"
              className="border-slate-200 h-8 text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.total} icon={FileText}
            iconClass="bg-slate-100 text-slate-600"
            onClick={() => setSelectedStatus('all')} active={selectedStatus === 'all'} />
          <StatCard label="Generated" value={stats.generated} icon={FileText}
            iconClass="bg-violet-100 text-violet-600" valueClass="text-violet-700"
            onClick={() => setSelectedStatus('generated')} active={selectedStatus === 'generated'} />
          <StatCard label="Pending" value={stats.pending} icon={Clock}
            iconClass="bg-amber-100 text-amber-600" valueClass="text-amber-700"
            onClick={() => setSelectedStatus('pending')} active={selectedStatus === 'pending'} />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle}
            iconClass="bg-blue-100 text-blue-600" valueClass="text-blue-700"
            onClick={() => setSelectedStatus('approved')} active={selectedStatus === 'approved'} />
          <StatCard label="Published" value={stats.published} icon={CheckCircle2}
            iconClass="bg-emerald-100 text-emerald-600" valueClass="text-emerald-700"
            onClick={() => setSelectedStatus('published')} active={selectedStatus === 'published'} />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle}
            iconClass="bg-red-100 text-red-500" valueClass="text-red-600"
            onClick={() => setSelectedStatus('rejected')} active={selectedStatus === 'rejected'} />
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>{ACADEMIC_YEARS.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[110px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {CLASSES.map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{c === 'all' ? 'All Classes' : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {['all', 'generated', 'pending', 'approved', 'published', 'rejected'].map(s => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input placeholder="Search student…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-violet-500" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedClass === 'all' ? 'All Classes' : selectedClass}
                </p>
                <p className="text-xs text-slate-400">{reportCards.length} report card{reportCards.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {/* Progress bar */}
            {stats.total > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-1.5 w-28 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                    style={{ width: `${Math.round((stats.published / stats.total) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {Math.round((stats.published / stats.total) * 100)}% published
                </span>
              </div>
            )}
          </div>

          {reportCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FileCheck className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No report cards found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-5">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">VIN</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Avg</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center hidden sm:table-cell">Grade</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center hidden md:table-cell">Visible</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Teacher</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCards.map(card => {
                    const grade = getOverallGrade(card.average_score)
                    const visible = isPublishedToStudent(card.status)
                    return (
                      <TableRow key={card.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                        <TableCell className="pl-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center shrink-0 text-violet-600 font-bold text-xs">
                              {getDisplayName(card).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{getDisplayName(card)}</p>
                              {card.student_admission_number && (
                                <p className="text-[10px] text-slate-400">Adm: {card.student_admission_number}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 hidden sm:table-cell">{card.student_vin}</TableCell>
                        <TableCell>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {card.class}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn('text-sm font-bold', card.average_score >= 50 ? 'text-emerald-600' : 'text-red-600')}>
                            {card.average_score}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold border', getOverallGradeColor(grade))}>
                            {grade}
                          </span>
                        </TableCell>
                        <TableCell><StatusPill status={card.status} /></TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          {visible ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                              <Eye className="h-3 w-3" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                              <EyeOff className="h-3 w-3" /> Hidden
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 hidden lg:table-cell">{card.class_teacher}</TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewCard(card)}
                              className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline">Review</span>
                            </button>

                            {card.status === 'generated' && (
                              <button
                                className="h-7 px-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium hidden sm:flex items-center gap-1 transition-colors"
                                onClick={async () => {
                                  await supabase.from('report_cards').update({
                                    status: 'approved', approved_by: profile?.id,
                                    approved_at: new Date().toISOString(),
                                  }).eq('id', card.id)
                                  toast.success('Approved!')
                                  loadReportCards()
                                }}
                                disabled={processingAction}
                              >
                                <CheckCircle className="h-3 w-3" />Approve
                              </button>
                            )}

                            {card.status === 'approved' && (
                              <button
                                className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium hidden sm:flex items-center gap-1 transition-colors"
                                onClick={async () => {
                                  await supabase.from('report_cards').update({
                                    status: 'published', published_by: profile?.id,
                                    published_at: new Date().toISOString(),
                                  }).eq('id', card.id)
                                  if (card.student_id) {
                                    await supabase.from('notifications').insert({
                                      user_id: card.student_id,
                                      title: '📄 Report Card Published!',
                                      message: `Your ${card.term} report card for ${card.academic_year} is now available.`,
                                      type: 'report_card_published', link: '/student/report-card',
                                      metadata: { report_card_id: card.id },
                                    })
                                  }
                                  toast.success('Published!')
                                  loadReportCards()
                                }}
                                disabled={processingAction}
                              >
                                <Send className="h-3 w-3" />Publish
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table footer */}
          {reportCards.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-400">
                {stats.published} of {stats.total} cards published to students
              </p>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-500">{stats.published} published</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-slate-500">{stats.generated + stats.approved} pending</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Review dialog ────────────────────────────────────────────────── */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto p-0">
            {selectedCard && (
              <div className="p-4 sm:p-6 space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="truncate">{getDisplayName(selectedCard)} — {selectedCard.class}</span>
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span>{getTermLabel(selectedCard.term)} {selectedCard.academic_year}</span>
                    <span className="text-slate-300">·</span>
                    <span>VIN: {selectedCard.student_vin}</span>
                    <span className="text-slate-300 hidden sm:inline">·</span>
                    <span className="hidden sm:inline">Teacher: {selectedCard.class_teacher}</span>
                  </DialogDescription>
                </DialogHeader>

                {/* Status bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={selectedCard.status} />
                    {isPublishedToStudent(selectedCard.status) ? (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <Eye className="h-3 w-3" /> Visible to student
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> Hidden from student
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadPDF()}
                    className="h-8 text-xs border-slate-200">
                    <Download className="h-3.5 w-3.5 mr-1.5" />Download PDF
                  </Button>
                </div>

                {/* Preview */}
                <div ref={reportRef}>
                  <ReportCardPreview
                    card={selectedCard} schoolSettings={schoolSettings} nextTermDate={nextTermDate}
                    teacherComment={teacherComment} principalComment={principalComment}
                    editingTeacher={editingTeacher} editingPrincipal={editingPrincipal}
                    processingAction={processingAction}
                    onEditTeacher={() => setEditingTeacher(true)}
                    onSaveTeacher={handleSaveTeacherComment}
                    onEditPrincipal={() => setEditingPrincipal(true)}
                    onSavePrincipal={handleSavePrincipalComment}
                    onTeacherChange={setTeacherComment}
                    onPrincipalChange={setPrincipalComment}
                  />
                </div>

                {/* Footer actions */}
                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
                  <div className="flex gap-2 flex-1">
                    {(selectedCard.status === 'generated' || selectedCard.status === 'pending') && (
                      <Button variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-9"
                        onClick={() => { setShowReviewDialog(false); setShowRejectDialog(true) }}>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />Reject
                      </Button>
                    )}
                    {selectedCard.status === 'published' && (
                      <Button variant="outline"
                        className="border-amber-200 text-amber-600 hover:bg-amber-50 text-xs h-9"
                        onClick={() => setShowUnpublishDialog(true)} disabled={processingAction}>
                        <EyeOff className="h-3.5 w-3.5 mr-1.5" />Unpublish
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button variant="outline" onClick={() => setShowReviewDialog(false)} className="text-xs h-9 border-slate-200">
                      Close
                    </Button>
                    {(selectedCard.status === 'generated' || selectedCard.status === 'pending') && (
                      <Button onClick={handleApproveCard} disabled={processingAction}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 shadow-sm">
                        {processingAction ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                        Approve
                      </Button>
                    )}
                    {selectedCard.status !== 'published' && selectedCard.status !== 'rejected' && (
                      <Button onClick={handlePublishCard} disabled={processingAction}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm">
                        {processingAction ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                        Publish to Student
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Reject dialog ────────────────────────────────────────────────── */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                Reject Report Card?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Please provide a reason. The student will be notified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-3">
              <Label className="text-xs font-medium text-slate-600">Rejection Reason *</Label>
              <Textarea placeholder="e.g. Scores need review, Missing subjects…"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                rows={3} className="mt-2 text-sm border-slate-200 focus-visible:ring-red-500" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-sm border-slate-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRejectCard} disabled={processingAction || !rejectReason}
                className="bg-red-600 hover:bg-red-700 text-white text-sm">
                {processingAction && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Confirm Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Unpublish dialog ─────────────────────────────────────────────── */}
        <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <EyeOff className="h-4 w-4 text-amber-600" />
                </div>
                Unpublish Report Card?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will immediately hide the report card from the student.
                They won&apos;t be able to view it until you publish it again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-sm border-slate-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnpublishCard} disabled={processingAction}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm">
                {processingAction && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Unpublish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}