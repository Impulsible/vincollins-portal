// components/admin/report-cards/ReportCardApproval.tsx - UPDATED WITH ADMIN REPORT CARD VIEW
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'
import { 
  Loader2, CheckCircle, XCircle, Eye, FileText,
  Search, RefreshCw,
  Send, Clock,
  CheckCircle2, User, FileCheck,
  Printer, Download, Sparkles
} from 'lucide-react'

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
    const orderA = SUBJECT_ORDER[a.name || a.subject] || 999
    const orderB = SUBJECT_ORDER[b.name || b.subject] || 999
    return orderA - orderB
  })
}

// ============================================
// WAEC GRADING SYSTEM
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

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail',
  }
  return remarks[grade] || ''
}

const getGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'B2': case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'C4': case 'C5': case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'D7': case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
  }
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

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
  status: 'pending' | 'approved' | 'published' | 'rejected'
  submitted_at: string
  school_name?: string
}

interface ReportCardApprovalProps {
  onRefresh?: () => void
}

const terms = ['First Term', 'Second Term', 'Third Term']
const academicYears = ['2024/2025', '2025/2026', '2026/2027']
const classes = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const getTermValue = (termLabel: string): string => {
  const map: Record<string, string> = { 'First Term': 'first', 'Second Term': 'second', 'Third Term': 'third' }
  return map[termLabel] || 'third'
}

export function ReportCardApproval({ onRefresh }: ReportCardApprovalProps) {
  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedTerm, setSelectedTerm] = useState<string>('Third Term')
  const [selectedYear, setSelectedYear] = useState<string>('2025/2026')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, published: 0, rejected: 0
  })

  const handleDownloadPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${selectedCard?.student_display_name || selectedCard?.student_name || 'Student'}_Report_Card`,
    pageStyle: `
      @page { size: A4; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      }
    `,
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDisplayName = (card: ReportCard): string => {
    return card.student_display_name || card.student_name || 'Unknown Student'
  }

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
    }
    loadProfile()
  }, [])

  const loadReportCards = useCallback(async () => {
    setLoading(true)
    try {
      const termValue = getTermValue(selectedTerm)
      
      let query = supabase
        .from('report_cards')
        .select('*')
        .eq('term', termValue)
        .eq('academic_year', selectedYear)
        .order('created_at', { ascending: false })

      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query
      if (error) throw error

      const cards: ReportCard[] = (data || []).map((rc: any) => ({
        id: rc.id,
        student_id: rc.student_id,
        student_name: rc.student_name || 'Unknown',
        student_display_name: rc.student_display_name || rc.display_name || rc.student_name,
        student_vin: rc.student_vin || 'N/A',
        student_admission_number: rc.student_admission_number,
        student_photo_url: rc.student_photo_url,
        class: rc.class,
        term: rc.term,
        academic_year: rc.academic_year,
        subjects_data: rc.subjects_data || [],
        teacher_comments: rc.teacher_comments || '',
        principal_comments: rc.principal_comments || '',
        class_teacher: rc.class_teacher || 'Unknown',
        average_score: rc.average_score || 0,
        total_score: rc.total_score || 0,
        status: rc.status || 'pending',
        submitted_at: rc.submitted_at || rc.created_at,
        school_name: rc.school_name || 'Vincollins College'
      }))

      let filtered = cards
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = cards.filter(c => 
          c.student_display_name?.toLowerCase().includes(q) ||
          c.student_name?.toLowerCase().includes(q) ||
          c.student_vin?.toLowerCase().includes(q)
        )
      }
      setReportCards(filtered)
      
      setStats({
        total: cards.length,
        pending: cards.filter(c => c.status === 'pending').length,
        approved: cards.filter(c => c.status === 'approved').length,
        published: cards.filter(c => c.status === 'published').length,
        rejected: cards.filter(c => c.status === 'rejected').length
      })

    } catch (error) {
      console.error('Error loading report cards:', error)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedYear, selectedClass, selectedStatus, searchQuery])

  useEffect(() => { loadReportCards() }, [loadReportCards])

  const handleApproveCard = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'approved',
          principal_comments: principalComment,
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedCard.id)
      if (error) throw error
      toast.success(`Report card for ${getDisplayName(selectedCard)} approved!`)
      setShowReviewDialog(false)
      loadReportCards()
      onRefresh?.()
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to approve report card')
    } finally { setProcessingAction(false) }
  }

  const handlePublishCard = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'published',
          principal_comments: principalComment,
          published_by: profile?.id,
          published_at: new Date().toISOString()
        })
        .eq('id', selectedCard.id)
      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: selectedCard.student_id,
        title: 'Report Card Published!',
        message: `Your ${selectedCard.term} report card is now available.`,
        type: 'report_card_published',
        link: '/student/report-card'
      })

      toast.success(`Report card published for ${getDisplayName(selectedCard)}!`)
      setShowReviewDialog(false)
      loadReportCards()
      onRefresh?.()
    } catch (error) {
      console.error('Error publishing:', error)
      toast.error('Failed to publish report card')
    } finally { setProcessingAction(false) }
  }

  const handleRejectCard = async () => {
    if (!selectedCard || !rejectReason) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'rejected',
          rejected_reason: rejectReason,
          rejected_by: profile?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', selectedCard.id)
      if (error) throw error
      toast.success('Report card rejected')
      setShowRejectDialog(false)
      setShowReviewDialog(false)
      setRejectReason('')
      loadReportCards()
      onRefresh?.()
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('Failed to reject report card')
    } finally { setProcessingAction(false) }
  }

  const handleViewCard = (card: ReportCard) => {
    setSelectedCard(card)
    setPrincipalComment(card.principal_comments || '')
    setShowReviewDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const displaySubjects = selectedCard ? sortSubjectsByOrder(selectedCard.subjects_data || []) : []
  const overallGrade = selectedCard ? getOverallGrade(selectedCard.average_score) : '—'
  const formattedAvg = selectedCard?.average_score?.toFixed(2) || '0.00'
  const bestSubject = displaySubjects.length > 0 ? displaySubjects.reduce((a, b) => (a.total || 0) > (b.total || 0) ? a : b) : null
  const worstSubject = displaySubjects.length > 0 ? displaySubjects.reduce((a, b) => (a.total || 0) < (b.total || 0) ? a : b) : null
  const showAreaForImprovement = worstSubject && (worstSubject.total || 0) < 50

  const behaviorRatings = [
    { name: 'Honesty', rating: 4 }, { name: 'Neatness', rating: 4 },
    { name: 'Obedience', rating: 4 }, { name: 'Orderliness', rating: 3 },
    { name: 'Diligence', rating: 4 }, { name: 'Punctuality', rating: 4 },
    { name: 'Leadership', rating: 3 }, { name: 'Politeness', rating: 4 },
  ]

  const skillRatings = [
    { name: 'Handwriting', rating: 4 }, { name: 'Verbal Fluency', rating: 4 },
    { name: 'Sports', rating: 3 }, { name: 'Handling Tools', rating: 3 },
    { name: 'Club Activities', rating: 4 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Report Card Approval</h1>
          <p className="text-muted-foreground mt-1">Review, approve, and publish student report cards</p>
        </div>
        <Button variant="outline" onClick={loadReportCards}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></div><FileText className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-yellow-600">Pending</p><p className="text-2xl font-bold text-yellow-700">{stats.pending}</p></div><Clock className="h-8 w-8 text-yellow-500" /></div></CardContent></Card>
        <Card className="bg-blue-50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-blue-600">Approved</p><p className="text-2xl font-bold text-blue-700">{stats.approved}</p></div><CheckCircle className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-green-600">Published</p><p className="text-2xl font-bold text-green-700">{stats.published}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-red-600">Rejected</p><p className="text-2xl font-bold text-red-700">{stats.rejected}</p></div><XCircle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{terms.map(term => <SelectItem key={term} value={term}>{term}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>{academicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map(cls => <SelectItem key={cls} value={cls}>{cls === 'all' ? 'All Classes' : cls}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search student name or VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards Table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">{selectedClass === 'all' ? 'All Classes' : selectedClass} - Report Cards</CardTitle></CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <div className="text-center py-12"><FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No report cards found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Average</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><User className="h-4 w-4 text-slate-500" /></div>
                          <span className="font-medium">{getDisplayName(card)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{card.student_vin}</TableCell>
                      <TableCell>{card.class}</TableCell>
                      <TableCell className="text-center font-bold">{card.average_score}%</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{getWAECGrade(card.average_score)}</Badge></TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{card.class_teacher}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleViewCard(card)}><Eye className="h-4 w-4 mr-1" />Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog - FULL REPORT CARD VIEW */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-4">
          {selectedCard && (
            <div className="space-y-4 p-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3"><User className="h-5 w-5" />{getDisplayName(selectedCard)} - {selectedCard.class}</DialogTitle>
                <DialogDescription>{selectedCard.term} {selectedCard.academic_year} | VIN: {selectedCard.student_vin} | Teacher: {selectedCard.class_teacher}</DialogDescription>
              </DialogHeader>

              {/* Status + Action Buttons */}
              <div className="no-print flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(selectedCard.status)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Print</Button>
                  <Button variant="default" size="sm" onClick={() => handleDownloadPDF()} className="bg-blue-600"><Download className="h-4 w-4 mr-1" />Download PDF</Button>
                </div>
              </div>

              {/* FULL REPORT CARD */}
              <div ref={reportRef}>
                <div className="bg-white w-full max-w-[210mm] mx-auto text-black border-2 border-blue-900 print:border-2 print:border-blue-900 print:max-w-full print:mx-0 p-3 sm:p-4 print:p-3">
                  
                  {/* HEADER */}
                  <div className="border-b-2 border-blue-900 pb-2 sm:pb-3 mb-2 sm:mb-3 print:pb-2 print:mb-2">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="w-12 sm:w-16 print:w-14 hidden sm:block">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-blue-900 rounded flex items-center justify-center text-[8px]">LOGO</div>
                      </div>
                      <div className="flex-1 text-center">
                        <h1 className="text-[14px] sm:text-[18px] font-bold uppercase text-blue-900 print:text-[15px] tracking-wide">{selectedCard.school_name || 'Vincollins College'}</h1>
                        <p className="text-[8px] sm:text-[10px] print:text-[9px] text-gray-800">7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos</p>
                        <p className="text-[8px] sm:text-[10px] print:text-[9px] text-gray-800">Tel: +234 912 1155 554 | Email: vincollinscollege@gmail.com</p>
                        <p className="text-[7px] sm:text-[9px] italic text-amber-700 mt-0.5 sm:mt-1 print:text-[8px] font-medium">"Geared Towards Excellence"</p>
                        <h2 className="font-bold mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] print:text-[12px] text-blue-900">Student's Performance Report</h2>
                        <p className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 font-semibold print:text-[9px] text-gray-800">Academic Session: {selectedCard.academic_year}</p>
                      </div>
                      <div className="w-12 h-16 sm:w-20 sm:h-24 border-2 border-blue-900 rounded overflow-hidden print:w-16 print:h-20 shrink-0">
                        {selectedCard.student_photo_url ? (
                          <img src={selectedCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[7px] sm:text-xs">Photo</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STUDENT INFO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-1.5 text-[9px] sm:text-[11px] mb-3 sm:mb-4 print:mb-3 print:text-[10px]">
                    <div className="flex flex-wrap"><span className="font-bold w-24 sm:w-32 text-gray-800">Name:</span><span className="break-words text-black">{getDisplayName(selectedCard)}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-24 sm:w-32 text-gray-800">Admission No:</span><span className="text-black">{selectedCard.student_admission_number || '—'}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-24 sm:w-32 text-gray-800">Class:</span><span className="text-black">{selectedCard.class}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-24 sm:w-32 text-gray-800">Term:</span><span className="text-black">{selectedCard.term}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-24 sm:w-32 text-gray-800">Session:</span><span className="text-black">{selectedCard.academic_year}</span></div>
                    <div className="flex flex-wrap"><span className="font-bold w-24 sm:w-32 text-gray-800">Next Term:</span><span className="break-words text-black">To be announced</span></div>
                  </div>

                  {/* MAIN CONTENT */}
                  <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-3 sm:gap-4 print:grid-cols-[70%_30%] print:gap-3">
                    {/* LEFT COLUMN */}
                    <div className="min-w-0">
                      <div className="print:overflow-visible overflow-x-auto">
                        <table className="w-full border-collapse border-2 border-blue-900 text-[8px] sm:text-[10px] print:text-[9px] print:w-full">
                          <thead className="bg-blue-700 text-white">
                            <tr>
                              <th className="border border-blue-500 px-1 sm:px-2 py-1.5 sm:py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Subjects</th>
                              <th className="border border-blue-500 px-1 sm:px-2 py-1.5 sm:py-2 text-center w-8 sm:w-10 print:text-[9px] print:py-1.5 print:px-1">CA</th>
                              <th className="border border-blue-500 px-1 sm:px-2 py-1.5 sm:py-2 text-center w-8 sm:w-10 print:text-[9px] print:py-1.5 print:px-1">Exam</th>
                              <th className="border border-blue-500 px-1 sm:px-2 py-1.5 sm:py-2 text-center w-8 sm:w-10 print:text-[9px] print:py-1.5 print:px-1">Total</th>
                              <th className="border border-blue-500 px-1 sm:px-2 py-1.5 sm:py-2 text-center w-8 sm:w-10 print:text-[9px] print:py-1.5 print:px-1">Grade</th>
                              <th className="border border-blue-500 px-1 sm:px-2 py-1.5 sm:py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displaySubjects.length === 0 ? (
                              <tr><td colSpan={6} className="text-center py-4 text-gray-500">No scores available</td></tr>
                            ) : (
                              displaySubjects.map((subject, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border border-gray-400 px-1 sm:px-2 py-1 sm:py-1.5 break-words print:text-[9px] print:py-1 print:px-1.5 text-black font-medium">{subject.name || subject.subject}</td>
                                  <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.ca || 0}</td>
                                  <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.exam || 0}</td>
                                  <td className="border border-gray-400 text-center font-bold print:text-[9px] print:py-1 print:px-1 text-black">{subject.total || 0}</td>
                                  <td className="border border-gray-400 text-center print:py-1"><span className={getGradeStyle(subject.grade || getWAECGrade(subject.total || 0))}>{subject.grade || getWAECGrade(subject.total || 0)}</span></td>
                                  <td className="border border-gray-400 px-1 sm:px-2 py-1 sm:py-1.5 print:text-[9px] print:py-1 print:px-1.5 text-black">{subject.remark || getGradeRemark(subject.grade || getWAECGrade(subject.total || 0))}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot className="bg-blue-50 font-bold">
                            <tr>
                              <td colSpan={3} className="border border-gray-400 px-1 sm:px-2 py-1.5 sm:py-2 text-right print:text-[10px] print:py-1.5 text-black">TOTAL / AVERAGE:</td>
                              <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{selectedCard.total_score || 0}</td>
                              <td className="border border-gray-400 text-center print:py-1.5"><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></td>
                              <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{formattedAvg}%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* REMARKS */}
                      <div className="mt-3 sm:mt-4 space-y-2 print:mt-3">
                        <div className="border-l-4 border-purple-600 bg-purple-50 p-2 sm:p-3 text-[8px] sm:text-[10px] print:text-[9px] print:p-2 rounded-r">
                          <div className="font-bold text-purple-800 mb-0.5 sm:mb-1">✨ CLASS TEACHER'S REMARK</div>
                          <p className="italic text-gray-800 leading-relaxed">{selectedCard.teacher_comments || 'No comment available.'}</p>
                        </div>
                        <div className="border-l-4 border-blue-600 bg-blue-50 p-2 sm:p-3 text-[8px] sm:text-[10px] print:text-[9px] print:p-2 rounded-r">
                          <div className="font-bold text-blue-800 mb-0.5 sm:mb-1">PRINCIPAL'S REMARK</div>
                          <p className="italic text-gray-800 leading-relaxed">{selectedCard.principal_comments || 'No comment available.'}</p>
                        </div>
                      </div>

                      {/* GRADE SCALE */}
                      <div className="mt-3 print:mt-2">
                        <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] px-2 sm:px-3 py-1 sm:py-1.5 font-bold rounded-t print:text-[9px]">Grade Scale</div>
                        <div className="border-2 border-t-0 border-blue-900 p-1.5 sm:p-2 rounded-b">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5 text-[7px] sm:text-[9px] print:text-[8px]">
                            <div className="flex items-center gap-1"><span className={getGradeStyle('A1')}>A1</span> <span className="text-gray-800">75-100</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('B2')}>B2</span> <span className="text-gray-800">70-74</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('B3')}>B3</span> <span className="text-gray-800">65-69</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('C4')}>C4</span> <span className="text-gray-800">60-64</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('C5')}>C5</span> <span className="text-gray-800">55-59</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('C6')}>C6</span> <span className="text-gray-800">50-54</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('D7')}>D7</span> <span className="text-gray-800">45-49</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('E8')}>E8</span> <span className="text-gray-800">40-44</span></div>
                            <div className="flex items-center gap-1"><span className={getGradeStyle('F9')}>F9</span> <span className="text-gray-800">0-39</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-2 sm:space-y-3 print:space-y-2">
                      <div className="border-2 border-blue-900">
                        <div className="bg-blue-700 text-white text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 uppercase print:text-[9px] print:py-1">Performance Summary</div>
                        <div className="p-2 sm:p-3 text-[8px] sm:text-[10px] space-y-1 sm:space-y-1.5 print:text-[9px] print:p-2 print:space-y-1">
                          <div className="flex justify-between flex-wrap"><span className="text-gray-800">Total Score:</span><span className="font-bold text-black">{selectedCard.total_score || 0}</span></div>
                          <div className="flex justify-between flex-wrap"><span className="text-gray-800">Average:</span><span className="font-bold text-black">{formattedAvg}%</span></div>
                          <div className="flex justify-between flex-wrap"><span className="text-gray-800">Grade:</span><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></div>
                          <div className="flex justify-between flex-wrap"><span className="text-gray-800">Subjects:</span><span className="font-bold text-black">{displaySubjects.length}</span></div>
                          {bestSubject && (
                            <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-300 flex-wrap">
                              <span>Best:</span><span className="font-bold text-right break-words max-w-[120px] sm:max-w-[140px]">{bestSubject.name || bestSubject.subject} ({(bestSubject.total || 0)})</span>
                            </div>
                          )}
                          {showAreaForImprovement && (
                            <div className="flex justify-between text-red-600 flex-wrap">
                              <span>Improve:</span><span className="font-bold text-right break-words max-w-[120px] sm:max-w-[140px]">{worstSubject?.name || worstSubject?.subject}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-2 border-blue-900">
                        <div className="bg-blue-700 text-white text-[7px] sm:text-[9px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 uppercase print:text-[8px] print:py-1">Affective Domain</div>
                        <div className="p-1.5 sm:p-2 text-[7px] sm:text-[9px] space-y-0.5 sm:space-y-1 print:text-[8px] print:space-y-0.5">
                          {behaviorRatings.map((item) => (
                            <div key={item.name} className="flex justify-between items-center"><span className="text-gray-800">{item.name}</span><span className="font-bold text-blue-700">{item.rating}</span></div>
                          ))}
                        </div>
                      </div>

                      <div className="border-2 border-blue-900">
                        <div className="bg-blue-700 text-white text-[7px] sm:text-[9px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 uppercase print:text-[8px] print:py-1">Psychomotor Skills</div>
                        <div className="p-1.5 sm:p-2 text-[7px] sm:text-[9px] space-y-0.5 sm:space-y-1 print:text-[8px] print:space-y-0.5">
                          {skillRatings.map((item) => (
                            <div key={item.name} className="flex justify-between items-center"><span className="text-gray-800">{item.name}</span><span className="font-bold text-green-700">{item.rating}</span></div>
                          ))}
                        </div>
                      </div>

                      <div className="border-2 border-blue-900">
                        <div className="bg-blue-700 text-white text-[7px] sm:text-[9px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 uppercase print:text-[8px] print:py-1">Rating Key</div>
                        <div className="p-1.5 sm:p-2 text-[6px] sm:text-[8px] space-y-0.5 print:text-[7px] print:space-y-0">
                          <div className="text-gray-800">5 - Excellent</div>
                          <div className="text-gray-800">4 - Very Good</div>
                          <div className="text-gray-800">3 - Good</div>
                          <div className="text-gray-800">2 - Fair</div>
                          <div className="text-gray-800">1 - Poor</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t-2 border-blue-900 mt-3 sm:mt-4 pt-1.5 sm:pt-2 text-center text-[7px] sm:text-[9px] text-gray-600 print:mt-3 print:pt-2 print:text-[8px]">
                    Powered by Vincollins Portal | Geared Towards Excellence
                  </div>
                </div>
              </div>

              {/* Principal Comments Editor */}
              <div className="no-print">
                <Label className="text-sm font-semibold">Principal's Comments (Editable)</Label>
                <Textarea
                  placeholder="Enter principal's comments..."
                  value={principalComment}
                  onChange={(e) => setPrincipalComment(e.target.value)}
                  rows={3}
                  className="mt-2"
                  disabled={selectedCard.status === 'published'}
                />
              </div>

              {/* Action Buttons */}
              <DialogFooter className="no-print flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  {selectedCard.status === 'pending' && (
                    <Button variant="outline" className="text-red-600 w-full sm:w-auto" onClick={() => { setShowReviewDialog(false); setShowRejectDialog(true) }}>
                      <XCircle className="h-4 w-4 mr-2" />Reject
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Close</Button>
                  {selectedCard.status === 'pending' && (
                    <Button onClick={handleApproveCard} disabled={processingAction} className="bg-blue-600">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}Approve
                    </Button>
                  )}
                  {selectedCard.status === 'approved' && (
                    <Button onClick={handlePublishCard} disabled={processingAction} className="bg-green-600">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Publish to Student
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><XCircle className="h-5 w-5" />Reject Report Card?</AlertDialogTitle>
            <AlertDialogDescription>Please provide a reason for rejecting this report card.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Rejection Reason *</Label>
            <Textarea placeholder="e.g., Scores need review, Missing subjects, etc." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="mt-2" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectCard} disabled={processingAction || !rejectReason} className="bg-red-600 hover:bg-red-700">
              {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 8mm; }
          table { border-collapse: collapse !important; width: 100% !important; min-width: 0 !important; max-width: 100% !important; table-layout: auto !important; }
          th, td { border-color: #000 !important; word-break: break-word !important; }
          .overflow-x-auto { overflow: visible !important; }
          [class*="overflow"] { overflow: visible !important; }
          img { max-width: 100% !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  )
}