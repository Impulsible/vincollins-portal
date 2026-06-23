// components/admin/report-cards/ReportCardApproval.tsx - COMPLETE FIXED VERSION
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
  School, Mail, Phone, Edit2, Save, Calendar
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

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
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'B2': case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'C4': case 'C5': case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'D7': case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
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
  status: 'generated' | 'pending' | 'approved' | 'published' | 'rejected'
  submitted_at: string
  school_name?: string
  student_email?: string
  student_phone?: string
  next_term_date?: string
}

interface ReportCardApprovalProps {
  onRefresh?: () => void
  hideBackButton?: boolean
}

const terms = ['First Term', 'Second Term', 'Third Term']
const academicYears = ['2024/2025', '2025/2026', '2026/2027']
const classes = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const getTermValue = (termLabel: string): string => {
  const map: Record<string, string> = { 'First Term': 'first', 'Second Term': 'second', 'Third Term': 'third' }
  return map[termLabel] || 'third'
}

const getTermLabel = (termValue: string): string => {
  const map: Record<string, string> = { 'first': 'First Term', 'second': 'Second Term', 'third': 'Third Term' }
  return map[termValue] || 'Third Term'
}

// Panel component for right column
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-gray-300 mb-2">
    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">{title}</div>
    <div className="p-2 text-[10px]">{children}</div>
  </div>
)

export function ReportCardApproval({ onRefresh, hideBackButton = false }: ReportCardApprovalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedClass, setSelectedClass] = useState<string>(searchParams?.get('class') || 'all')
  const [selectedTerm, setSelectedTerm] = useState<string>(() => {
    const termParam = searchParams?.get('term')
    if (termParam === 'first') return 'First Term'
    if (termParam === 'second') return 'Second Term'
    if (termParam === 'third') return 'Third Term'
    return 'Third Term'
  })
  const [selectedYear, setSelectedYear] = useState<string>(searchParams?.get('year') || '2025/2026')
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams?.get('status') || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [teacherComment, setTeacherComment] = useState('')
  const [editingPrincipal, setEditingPrincipal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>({})
  const [nextTermDate, setNextTermDate] = useState<string>('')
  const reportRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState({
    total: 0, generated: 0, pending: 0, approved: 0, published: 0, rejected: 0
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
      case 'published': return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'generated': return <Badge className="bg-purple-100 text-purple-700 border-purple-200"><FileText className="h-3 w-3 mr-1" />Generated</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDisplayName = (card: ReportCard): string => {
    return card.student_display_name || card.student_name || 'Unknown Student'
  }

  // Load profile
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

  // Load school settings
  useEffect(() => {
    const loadSchoolSettings = async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle()
      
      if (!error && data) {
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
    loadSchoolSettings()
  }, [])

  // Load next term date
  useEffect(() => {
    const loadNextTermDate = async () => {
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
    }
    loadNextTermDate()
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
        .order('submitted_at', { ascending: false })

      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Log the data to see what's coming from the database
      console.log('Report card data from DB:', data)

      // Fetch student emails, photos, and admission numbers
      const studentIds = data?.map(rc => rc.student_id).filter(Boolean) || []
      let studentData: Record<string, any> = {}
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, email, photo_url, admission_number, display_name, full_name')
          .in('id', studentIds)
        studentData = (students || []).reduce((acc, s) => {
          acc[s.id] = {
            email: s.email || '',
            photo_url: s.photo_url || '',
            admission_number: s.admission_number || '',
            display_name: s.display_name || s.full_name || ''
          }
          return acc
        }, {} as Record<string, any>)
      }

      const cards: ReportCard[] = (data || []).map((rc: any) => {
        // Debug: log each report card's comments
        console.log(`Report card for ${rc.student_name}:`, {
          teacher_comments: rc.teacher_comments,
          principal_comments: rc.principal_comments,
          status: rc.status
        })
        
        return {
          id: rc.id,
          student_id: rc.student_id,
          student_name: rc.student_name || 'Unknown',
          student_display_name: studentData[rc.student_id]?.display_name || rc.student_display_name || rc.display_name || rc.student_name,
          student_vin: rc.student_vin || 'N/A',
          student_admission_number: studentData[rc.student_id]?.admission_number || rc.student_admission_number || '',
          student_photo_url: studentData[rc.student_id]?.photo_url || rc.student_photo_url || '',
          class: rc.class,
          term: rc.term,
          academic_year: rc.academic_year,
          subjects_data: rc.subjects_data || [],
          teacher_comments: rc.teacher_comments || 'No comment available.',
          principal_comments: rc.principal_comments || 'No comment available.',
          class_teacher: rc.class_teacher || 'Unknown',
          average_score: rc.average_score || 0,
          total_score: rc.total_score || 0,
          status: rc.status || 'pending',
          submitted_at: rc.submitted_at || rc.generated_at || new Date().toISOString(),
          school_name: rc.school_name || 'Vincollins College',
          student_email: studentData[rc.student_id]?.email || '',
          student_phone: rc.student_phone || '',
          next_term_date: rc.next_term_date || nextTermDate || 'To be announced'
        }
      })

      let filtered = cards
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = cards.filter(c => 
          c.student_display_name?.toLowerCase().includes(q) ||
          c.student_name?.toLowerCase().includes(q) ||
          c.student_vin?.toLowerCase().includes(q) ||
          c.student_admission_number?.toLowerCase().includes(q)
        )
      }
      setReportCards(filtered)
      
      setStats({
        total: cards.length,
        generated: cards.filter(c => c.status === 'generated').length,
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
  }, [selectedTerm, selectedYear, selectedClass, selectedStatus, searchQuery, nextTermDate])

  useEffect(() => { loadReportCards() }, [loadReportCards])

  // Handle saving teacher comment
  const handleSaveTeacherComment = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          teacher_comments: teacherComment,
        })
        .eq('id', selectedCard.id)
      if (error) throw error
      toast.success('Teacher comment updated!')
      setEditingTeacher(false)
      // Update the selected card with the new comment
      setSelectedCard({ ...selectedCard, teacher_comments: teacherComment })
      loadReportCards()
      onRefresh?.()
    } catch (error) {
      console.error('Error updating teacher comment:', error)
      toast.error('Failed to update teacher comment')
    } finally { setProcessingAction(false) }
  }

  // Handle saving principal comment
  const handleSavePrincipalComment = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          principal_comments: principalComment,
        })
        .eq('id', selectedCard.id)
      if (error) throw error
      toast.success('Principal comment updated!')
      setEditingPrincipal(false)
      // Update the selected card with the new comment
      setSelectedCard({ ...selectedCard, principal_comments: principalComment })
      loadReportCards()
      onRefresh?.()
    } catch (error) {
      console.error('Error updating principal comment:', error)
      toast.error('Failed to update principal comment')
    } finally { setProcessingAction(false) }
  }

  const handleApproveCard = async () => {
    if (!selectedCard) return
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'approved',
          principal_comments: principalComment,
          teacher_comments: teacherComment,
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
          teacher_comments: teacherComment,
          published_by: profile?.id,
          published_at: new Date().toISOString()
        })
        .eq('id', selectedCard.id)
      if (error) throw error

      if (selectedCard.student_id) {
        await supabase.from('notifications').insert({
          user_id: selectedCard.student_id,
          title: 'Report Card Published!',
          message: `Your ${selectedCard.term} report card for ${selectedCard.academic_year} is now available.`,
          type: 'report_card_published',
          link: '/student/report-card',
          metadata: {
            report_card_id: selectedCard.id,
            term: selectedCard.term,
            year: selectedCard.academic_year
          }
        })

        if (selectedCard.student_email) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: selectedCard.student_email,
                subject: `Report Card Published - ${selectedCard.term} ${selectedCard.academic_year}`,
                template: 'report_card_published',
                data: {
                  student_name: getDisplayName(selectedCard),
                  term: selectedCard.term,
                  year: selectedCard.academic_year,
                  class: selectedCard.class,
                  average: selectedCard.average_score,
                  grade: getOverallGrade(selectedCard.average_score)
                }
              }
            })
          } catch (emailError) {
            console.error('Email error:', emailError)
          }
        }
      }

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

      if (selectedCard.student_id) {
        await supabase.from('notifications').insert({
          user_id: selectedCard.student_id,
          title: 'Report Card Needs Revision',
          message: `Your report card for ${selectedCard.term} ${selectedCard.academic_year} needs revision. Reason: ${rejectReason}`,
          type: 'report_card_rejected',
          link: '/student/report-card',
          metadata: {
            report_card_id: selectedCard.id,
            reason: rejectReason
          }
        })
      }

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

  const handleBulkPublish = async () => {
    const approvedCards = reportCards.filter(c => c.status === 'approved')
    if (approvedCards.length === 0) {
      toast.error('No approved report cards to publish')
      return
    }

    if (!confirm(`Publish ${approvedCards.length} approved report cards?`)) return

    setProcessingAction(true)
    let published = 0
    let failed = 0

    try {
      for (const card of approvedCards) {
        try {
          const { error } = await supabase
            .from('report_cards')
            .update({
              status: 'published',
              published_by: profile?.id,
              published_at: new Date().toISOString()
            })
            .eq('id', card.id)
          
          if (error) throw error
          
          if (card.student_id) {
            await supabase.from('notifications').insert({
              user_id: card.student_id,
              title: 'Report Card Published!',
              message: `Your ${card.term} report card for ${card.academic_year} is now available.`,
              type: 'report_card_published',
              link: '/student/report-card',
              metadata: {
                report_card_id: card.id,
                term: card.term,
                year: card.academic_year
              }
            })
          }
          published++
        } catch (err) {
          console.error('Error publishing card:', err)
          failed++
        }
      }

      toast.success(`Published ${published} report cards${failed > 0 ? `, ${failed} failed` : ''}`)
      loadReportCards()
      onRefresh?.()
    } finally {
      setProcessingAction(false)
    }
  }

  const handleBulkApprove = async () => {
    const generatedCards = reportCards.filter(c => c.status === 'generated')
    if (generatedCards.length === 0) {
      toast.error('No generated report cards to approve')
      return
    }

    if (!confirm(`Approve ${generatedCards.length} generated report cards?`)) return

    setProcessingAction(true)
    let approved = 0
    let failed = 0

    try {
      for (const card of generatedCards) {
        try {
          const { error } = await supabase
            .from('report_cards')
            .update({
              status: 'approved',
              approved_by: profile?.id,
              approved_at: new Date().toISOString()
            })
            .eq('id', card.id)
          
          if (error) throw error
          approved++
        } catch (err) {
          console.error('Error approving card:', err)
          failed++
        }
      }

      toast.success(`Approved ${approved} report cards${failed > 0 ? `, ${failed} failed` : ''}`)
      loadReportCards()
      onRefresh?.()
    } finally {
      setProcessingAction(false)
    }
  }

  const handleViewCard = (card: ReportCard) => {
    console.log('Viewing card:', {
      id: card.id,
      student: getDisplayName(card),
      principal_comments: card.principal_comments,
      teacher_comments: card.teacher_comments
    })
    setSelectedCard(card)
    setPrincipalComment(card.principal_comments || 'No comment available.')
    setTeacherComment(card.teacher_comments || 'No comment available.')
    setEditingPrincipal(false)
    setEditingTeacher(false)
    setShowReviewDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Prepare data for the report card view
  const displaySubjects = selectedCard ? sortSubjectsByOrder(selectedCard.subjects_data || []) : []
  const overallGrade = selectedCard ? getOverallGrade(selectedCard.average_score) : '—'
  const formattedAvg = selectedCard?.average_score?.toFixed(2) || '0.00'
  const bestSubject = displaySubjects.length > 0 ? displaySubjects.reduce((a, b) => (a.total || 0) > (b.total || 0) ? a : b) : null
  const worstSubject = displaySubjects.length > 0 ? displaySubjects.reduce((a, b) => (a.total || 0) < (b.total || 0) ? a : b) : null
  const showAreaForImprovement = worstSubject && (worstSubject.total || 0) < 50

  const termDisplay = selectedCard ? getTermLabel(selectedCard.term) : 'Third Term'
  
  // Format next term date
  const formattedNextTermDate = nextTermDate 
    ? new Date(nextTermDate).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

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
    <div className="space-y-6 p-4 max-w-full">
      {/* Back Button */}
      {!hideBackButton && (
        <div className="no-print">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/broad-sheet')}
            className="mb-2 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Broad Sheet
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Report Card Approval
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Review, approve, and publish student report cards
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {reportCards.filter(c => c.status === 'generated').length > 0 && (
            <Button 
              onClick={handleBulkApprove} 
              disabled={processingAction}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve All ({reportCards.filter(c => c.status === 'generated').length})
            </Button>
          )}
          {reportCards.filter(c => c.status === 'approved').length > 0 && (
            <Button 
              onClick={handleBulkPublish} 
              disabled={processingAction}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Publish All ({reportCards.filter(c => c.status === 'approved').length})
            </Button>
          )}
          <Button variant="outline" onClick={loadReportCards} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-l-4 border-l-slate-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">Generated</p>
                <p className="text-2xl font-bold text-purple-700">{stats.generated}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">Approved</p>
                <p className="text-2xl font-bold text-blue-700">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Published</p>
                <p className="text-2xl font-bold text-green-700">{stats.published}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {terms.map(term => <SelectItem key={term} value={term}>{term}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => <SelectItem key={cls} value={cls}>{cls === 'all' ? 'All Classes' : cls}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search student name or VIN..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-9" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5" />
              {selectedClass === 'all' ? 'All Classes' : selectedClass} - Report Cards
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {reportCards.length} records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No report cards found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Average</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCards.map((card) => {
                    const overallGrade = getOverallGrade(card.average_score)
                    return (
                      <TableRow key={card.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium">{getDisplayName(card)}</span>
                              {card.student_admission_number && (
                                <p className="text-xs text-slate-500">Adm: {card.student_admission_number}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{card.student_vin}</TableCell>
                        <TableCell className="font-mono text-xs">{card.student_admission_number || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {card.class}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          <span className={card.average_score >= 50 ? 'text-emerald-600' : 'text-red-600'}>
                            {card.average_score}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs font-bold px-2 py-0.5", getOverallGradeColor(overallGrade))}>
                            {overallGrade}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">{card.class_teacher}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewCard(card)}>
                              <Eye className="h-4 w-4 mr-1" />Review
                            </Button>
                            {card.status === 'generated' && (
                              <Button 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={async () => {
                                  setSelectedCard(card)
                                  await handleApproveCard()
                                }}
                                disabled={processingAction}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />Approve
                              </Button>
                            )}
                            {card.status === 'approved' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={async () => {
                                  setSelectedCard(card)
                                  await handlePublishCard()
                                }}
                                disabled={processingAction}
                              >
                                <Send className="h-4 w-4 mr-1" />Publish
                              </Button>
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
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-4">
          {selectedCard && (
            <div className="space-y-4 p-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  {getDisplayName(selectedCard)} - {selectedCard.class}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-4 text-sm">
                  <span>{selectedCard.term} {selectedCard.academic_year}</span>
                  <span className="text-slate-300">|</span>
                  <span>VIN: {selectedCard.student_vin}</span>
                  <span className="text-slate-300">|</span>
                  <span>Teacher: {selectedCard.class_teacher}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Status + Action Buttons */}
              <div className="no-print flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(selectedCard.status)}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-1" />Print
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleDownloadPDF()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="h-4 w-4 mr-1" />PDF
                  </Button>
                </div>
              </div>

              {/* FULL REPORT CARD */}
              <div ref={reportRef}>
                <div className="bg-white w-full max-w-[210mm] mx-auto text-black border-2 border-blue-900 print:border-2 print:border-blue-900 print:max-w-full print:mx-0 p-3 sm:p-4 print:p-3">
                  
                  {/* HEADER */}
                  <div className="border-b-2 border-blue-900 pb-2 sm:pb-3 mb-2 sm:mb-3 print:pb-2 print:mb-2">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      {/* LOGO */}
                      <div className="w-16 print:w-12">
                        {schoolSettings.logo ? (
                          <img src={schoolSettings.logo} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10" />
                        ) : (
                          <div className="w-14 h-14 border-2 border-blue-900 rounded flex items-center justify-center text-[8px] bg-blue-50">
                            <School className="h-8 w-8 text-blue-900" />
                          </div>
                        )}
                      </div>

                      {/* SCHOOL INFO */}
                      <div className="flex-1 text-center">
                        <h1 className="text-[14px] sm:text-[18px] font-bold uppercase text-blue-900 print:text-[15px] tracking-wide">
                          {schoolSettings.name || selectedCard.school_name || 'VINCOLLINS COLLEGE'}
                        </h1>
                        <p className="text-[8px] sm:text-[10px] print:text-[9px] text-gray-800">
                          {schoolSettings.address || '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos'}
                        </p>
                        <p className="text-[8px] sm:text-[10px] print:text-[9px] text-gray-800">
                          <Mail className="inline h-3 w-3 mr-1" /> {schoolSettings.email || 'vincollinscollege@gmail.com'} | 
                          <Phone className="inline h-3 w-3 mx-1" /> {schoolSettings.phone || '+234 912 1155 554'}
                        </p>
                        <p className="text-[7px] sm:text-[9px] italic text-amber-700 mt-0.5 sm:mt-1 print:text-[8px] font-medium">
                          "{schoolSettings.motto || 'Geared Towards Excellence'}"
                        </p>
                        <h2 className="font-bold mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] print:text-[12px] text-blue-900">
                          Student's Performance Report
                        </h2>
                        <p className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 font-semibold print:text-[9px] text-gray-800">
                          Academic Session: {selectedCard.academic_year}
                        </p>
                      </div>

                      {/* PHOTO */}
                      <div className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-blue-900 rounded overflow-hidden print:w-16 print:h-20 shrink-0">
                        {selectedCard.student_photo_url ? (
                          <img src={selectedCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[7px] sm:text-xs">
                            <User className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STUDENT INFO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-1.5 text-[9px] sm:text-[11px] mb-3 sm:mb-4 print:mb-3 print:text-[10px]">
                    <div className="flex flex-wrap">
                      <span className="font-bold w-24 sm:w-32 text-gray-800">Name:</span>
                      <span className="break-words text-black">{getDisplayName(selectedCard)}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-24 sm:w-32 text-gray-800">Admission No:</span>
                      <span className="text-black">{selectedCard.student_admission_number || '—'}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-24 sm:w-32 text-gray-800">Class:</span>
                      <span className="text-black">{selectedCard.class}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-24 sm:w-32 text-gray-800">Term:</span>
                      <span className="text-black">{termDisplay}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-24 sm:w-32 text-gray-800">Session:</span>
                      <span className="text-black">{selectedCard.academic_year}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-24 sm:w-32 text-gray-800">Next Term Begins:</span>
                      <span className="break-words text-black flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        {formattedNextTermDate}
                      </span>
                    </div>
                  </div>

                  {/* MAIN CONTENT */}
                  <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-3 sm:gap-4 print:grid-cols-[70%_30%] print:gap-3">
                    {/* LEFT COLUMN */}
                    <div className="min-w-0">
                      {/* SUBJECT TABLE */}
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
                              displaySubjects.map((subject, index) => {
                                const grade = subject.grade || getSubjectGrade(subject.total || 0)
                                return (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-400 px-1 sm:px-2 py-1 sm:py-1.5 break-words print:text-[9px] print:py-1 print:px-1.5 text-black font-medium">
                                      {subject.name || subject.subject}
                                    </td>
                                    <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">
                                      {subject.ca || 0}
                                    </td>
                                    <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">
                                      {subject.exam || 0}
                                    </td>
                                    <td className="border border-gray-400 text-center font-bold print:text-[9px] print:py-1 print:px-1 text-black">
                                      {subject.total || 0}
                                    </td>
                                    <td className="border border-gray-400 text-center print:py-1">
                                      <span className={getSubjectGradeStyle(grade)}>
                                        {grade}
                                      </span>
                                    </td>
                                    <td className="border border-gray-400 px-1 sm:px-2 py-1 sm:py-1.5 print:text-[9px] print:py-1 print:px-1.5 text-black">
                                      {subject.remark || getSubjectGradeRemark(grade)}
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                          <tfoot className="bg-blue-50 font-bold">
                            <tr>
                              <td colSpan={3} className="border border-gray-400 px-1 sm:px-2 py-1.5 sm:py-2 text-right print:text-[10px] print:py-1.5 text-black">
                                TOTAL / AVERAGE:
                              </td>
                              <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">
                                {selectedCard.total_score || 0}
                              </td>
                              <td className="border border-gray-400 text-center print:py-1.5">
                                <span className={cn("px-2 py-0.5 rounded text-xs font-bold", getOverallGradeColor(overallGrade))}>
                                  {overallGrade}
                                </span>
                              </td>
                              <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">
                                {formattedAvg}%
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* CLASS TEACHER'S REMARK */}
                      <div className="mt-3 border border-gray-300">
                        <div className="bg-purple-600 text-white px-2 py-1 text-[10px] font-bold flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            CLASS TEACHER'S REMARK
                          </div>
                          <div className="no-print">
                            {!editingTeacher ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[8px] text-white hover:text-white hover:bg-purple-700"
                                onClick={() => setEditingTeacher(true)}
                                disabled={selectedCard.status === 'published'}
                              >
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[8px] text-white hover:text-white hover:bg-purple-700"
                                onClick={handleSaveTeacherComment}
                                disabled={processingAction}
                              >
                                {processingAction ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                        {editingTeacher ? (
                          <Textarea
                            value={teacherComment}
                            onChange={(e) => setTeacherComment(e.target.value)}
                            className="rounded-none border-x-0 border-t-0 border-b-0 text-[10px] p-2 min-h-[60px]"
                            placeholder="Enter teacher's comment..."
                            disabled={selectedCard.status === 'published'}
                          />
                        ) : (
                          <div className="p-2 text-[10px] italic leading-relaxed bg-purple-50">
                            {teacherComment}
                          </div>
                        )}
                        <div className="px-2 pb-2 text-[9px] text-gray-500 border-t border-purple-200 pt-1">
                          Signed: {selectedCard.class_teacher || 'Class Teacher'}
                        </div>
                      </div>

                      {/* PRINCIPAL'S REMARK - Now properly showing from database */}
                      <div className="mt-2 border border-gray-300">
                        <div className="bg-blue-600 text-white px-2 py-1 text-[10px] font-bold flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            PRINCIPAL'S REMARK
                          </div>
                          <div className="no-print">
                            {!editingPrincipal ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[8px] text-white hover:text-white hover:bg-blue-700"
                                onClick={() => setEditingPrincipal(true)}
                                disabled={selectedCard.status === 'published'}
                              >
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[8px] text-white hover:text-white hover:bg-blue-700"
                                onClick={handleSavePrincipalComment}
                                disabled={processingAction}
                              >
                                {processingAction ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                        {editingPrincipal ? (
                          <Textarea
                            value={principalComment}
                            onChange={(e) => setPrincipalComment(e.target.value)}
                            className="rounded-none border-x-0 border-t-0 border-b-0 text-[10px] p-2 min-h-[60px]"
                            placeholder="Enter principal's comment..."
                            disabled={selectedCard.status === 'published'}
                          />
                        ) : (
                          <div className="p-2 text-[10px] italic leading-relaxed">
                            {principalComment}
                          </div>
                        )}
                      </div>

                      {/* GRADE SCALE */}
                      <div className="mt-3">
                        <div className="bg-blue-600 text-white text-[10px] px-2 py-1 font-bold">Grade Scale</div>
                        <div className="border border-gray-300 p-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[9px]">
                            <div><span className={getSubjectGradeStyle('A1')}>A1</span> 75-100</div>
                            <div><span className={getSubjectGradeStyle('B2')}>B2</span> 70-74</div>
                            <div><span className={getSubjectGradeStyle('B3')}>B3</span> 65-69</div>
                            <div><span className={getSubjectGradeStyle('C4')}>C4</span> 60-64</div>
                            <div><span className={getSubjectGradeStyle('C5')}>C5</span> 55-59</div>
                            <div><span className={getSubjectGradeStyle('C6')}>C6</span> 50-54</div>
                            <div><span className={getSubjectGradeStyle('D7')}>D7</span> 45-49</div>
                            <div><span className={getSubjectGradeStyle('E8')}>E8</span> 40-44</div>
                            <div><span className={getSubjectGradeStyle('F9')}>F9</span> 0-39</div>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-1 text-[9px]">
                            <div><span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", getOverallGradeColor('A'))}>A</span> 80-100</div>
                            <div><span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", getOverallGradeColor('B'))}>B</span> 70-79</div>
                            <div><span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", getOverallGradeColor('C'))}>C</span> 60-69</div>
                            <div><span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", getOverallGradeColor('P'))}>P</span> 50-59</div>
                            <div><span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", getOverallGradeColor('F'))}>F</span> 0-49</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-2 sm:space-y-3 print:space-y-2">
                      <Panel title="Performance Summary">
                        <div className="space-y-1">
                          <div className="flex justify-between"><span>Total Score</span><span className="font-bold">{selectedCard.total_score || 0}</span></div>
                          <div className="flex justify-between"><span>Average</span><span className="font-bold">{formattedAvg}%</span></div>
                          <div className="flex justify-between"><span>Grade</span><span className={getOverallGradeTextColor(overallGrade)}>{overallGrade}</span></div>
                          {bestSubject && (
                            <div className="flex justify-between text-emerald-600 pt-1 border-t">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Best Subject
                              </span>
                              <span className="font-bold">{bestSubject.name} ({bestSubject.total})</span>
                            </div>
                          )}
                          {showAreaForImprovement && (
                            <div className="flex justify-between text-red-600">
                              <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" /> Area for Improvement
                              </span>
                              <span className="font-bold">{worstSubject?.name} ({worstSubject?.total})</span>
                            </div>
                          )}
                        </div>
                      </Panel>

                      <Panel title="Affective Domain">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-[10px]">
                            <tbody>
                              {behaviorRatings.map((item) => (
                                <tr key={item.name}>
                                  <td className="border px-1 py-1">{item.name}</td>
                                  <td className="border text-center w-12 font-bold">{item.rating}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Panel>

                      <Panel title="Psychomotor Skills">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-[10px]">
                            <tbody>
                              {skillRatings.map((item) => (
                                <tr key={item.name}>
                                  <td className="border px-1 py-1">{item.name}</td>
                                  <td className="border text-center w-12 font-bold">{item.rating}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Panel>

                      <Panel title="Key To Ratings">
                        <div className="space-y-1 text-[9px]">
                          <div>5 - Excellent</div>
                          <div>4 - Very Good</div>
                          <div>3 - Good</div>
                          <div>2 - Fair</div>
                          <div>1 - Poor</div>
                        </div>
                      </Panel>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t-2 border-blue-900 mt-3 sm:mt-4 pt-1.5 sm:pt-2 text-center text-[7px] sm:text-[9px] text-gray-600 print:mt-3 print:pt-2 print:text-[8px]">
                    Powered by Vincollins Portal | {schoolSettings.motto || 'Geared Towards Excellence'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="no-print flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  {(selectedCard.status === 'generated' || selectedCard.status === 'pending') && (
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                      onClick={() => { setShowReviewDialog(false); setShowRejectDialog(true) }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />Reject
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Close</Button>
                  {selectedCard.status === 'generated' && (
                    <Button onClick={handleApproveCard} disabled={processingAction} className="bg-purple-600 hover:bg-purple-700 text-white">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                  )}
                  {selectedCard.status === 'pending' && (
                    <Button onClick={handleApproveCard} disabled={processingAction} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                  )}
                  {(selectedCard.status === 'approved' || selectedCard.status === 'pending' || selectedCard.status === 'generated') && (
                    <Button onClick={handlePublishCard} disabled={processingAction} className="bg-green-600 hover:bg-green-700 text-white">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Publish to Student
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
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />Reject Report Card?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this report card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Rejection Reason *</Label>
            <Textarea 
              placeholder="e.g., Scores need review, Missing subjects, etc." 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)} 
              rows={3} 
              className="mt-2" 
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectCard} 
              disabled={processingAction || !rejectReason} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
          @page { 
            size: A4 portrait; 
            margin: 0.5cm;
          }
          .bg-blue-700, .bg-blue-600, .bg-purple-600 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table { 
            border-collapse: collapse !important; 
            width: 100% !important; 
            min-width: 0 !important; 
            max-width: 100% !important; 
            table-layout: auto !important; 
          }
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