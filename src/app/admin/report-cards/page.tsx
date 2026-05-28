// app/admin/report-cards/page.tsx - WITH STORED AI-GENERATED COMMENTS

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, CheckCircle, XCircle, Eye, FileText,
  Users, Search, RefreshCw,
  Download, Send, Clock, CheckCheck,
  GraduationCap, ChevronDown, ChevronUp,
  CheckCircle2, User, FileSpreadsheet, Sparkles
} from 'lucide-react'

// ============================================
// WAEC GRADING COLORS
// ============================================
const getGradeColor = (grade: string) => {
  if (grade === 'A1') return 'bg-emerald-100 text-emerald-700'
  if (grade === 'B2' || grade === 'B3') return 'bg-blue-100 text-blue-700'
  if (grade === 'C4' || grade === 'C5' || grade === 'C6') return 'bg-cyan-100 text-cyan-700'
  if (grade === 'D7' || grade === 'E8') return 'bg-amber-100 text-amber-700'
  if (grade === 'F9') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-600'
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

interface ReportCard {
  id: string
  student_id: string
  student_name: string
  student_vin: string
  class: string
  term: string
  academic_year: string
  subjects_data: SubjectScore[]
  assessment_data: any
  teacher_comments: string
  principal_comments: string
  class_teacher: string
  total_score: number
  average_score: number
  status: 'generated' | 'approved' | 'published' | 'rejected'
  rejected_reason?: string
  generated_at?: string
}

interface ClassStats {
  className: string
  total: number
  generated: number
  approved: number
  published: number
  rejected: number
}

// ============================================
// CONSTANTS
// ============================================
const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const YEARS = ['2024/2025', '2025/2026', '2026/2027']
const CLASSES = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published': return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
    case 'approved': return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
    case 'generated': return <Badge className="bg-purple-100 text-purple-700"><FileText className="h-3 w-3 mr-1" />Generated</Badge>
    case 'rejected': return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

const getTermLabel = (term: string): string => {
  const found = TERMS.find(t => t.value === term)
  return found?.label || 'Third Term'
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminReportCardsPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [processing, setProcessing] = useState(false)
  const [bulkClass, setBulkClass] = useState('')
  
  const [stats, setStats] = useState({ total: 0, generated: 0, approved: 0, published: 0, rejected: 0 })

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) setProfile(data)
    }
    init()
  }, [])

  // ─── Load Report Cards ──────────────────────────────
  const loadReportCards = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('report_cards')
        .select('*')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .order('generated_at', { ascending: false })
        .limit(500)

      if (selectedClass !== 'all') query = query.eq('class', selectedClass)
      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus)

      const { data, error } = await query
      if (error) throw error

      // Get student profiles for names if needed
      const studentIds = [...new Set((data || []).map((rc: any) => rc.student_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, vin_id')
        .in('id', studentIds)

      const profileMap = new Map()
      profiles?.forEach(profile => {
        profileMap.set(profile.id, {
          name: profile.display_name || profile.full_name || 'Student',
          vin: profile.vin_id
        })
      })

      const cards: ReportCard[] = (data || []).map((rc: any) => {
        const profile = profileMap.get(rc.student_id)
        return {
          id: rc.id,
          student_id: rc.student_id,
          student_name: rc.student_name || profile?.name || 'Unknown',
          student_vin: rc.student_vin || profile?.vin || 'N/A',
          class: rc.class,
          term: rc.term,
          academic_year: rc.academic_year,
          subjects_data: rc.subjects_data || [],
          assessment_data: rc.assessment_data || {},
          teacher_comments: rc.teacher_comments || 'No comment available.',
          principal_comments: rc.principal_comments || 'No comment available.',
          class_teacher: rc.class_teacher || 'Unknown',
          total_score: rc.total_score || 0,
          average_score: rc.average_score || 0,
          status: rc.status || 'generated',
          rejected_reason: rc.rejected_reason,
          generated_at: rc.generated_at
        }
      })

      setReportCards(cards)
      
      setStats({
        total: cards.length,
        generated: cards.filter(c => c.status === 'generated').length,
        approved: cards.filter(c => c.status === 'approved').length,
        published: cards.filter(c => c.status === 'published').length,
        rejected: cards.filter(c => c.status === 'rejected').length,
      })

      if (selectedClass === 'all') {
        const map: Record<string, ClassStats> = {}
        cards.forEach(c => {
          if (!map[c.class]) {
            map[c.class] = { className: c.class, total: 0, generated: 0, approved: 0, published: 0, rejected: 0 }
          }
          map[c.class].total++
          if (c.status === 'generated') map[c.class].generated++
          if (c.status === 'approved') map[c.class].approved++
          if (c.status === 'published') map[c.class].published++
          if (c.status === 'rejected') map[c.class].rejected++
        })
        setClassStats(Object.values(map).sort((a, b) => a.className.localeCompare(b.className)))
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load report cards')
    } finally { setLoading(false) }
  }, [selectedTerm, selectedYear, selectedClass, selectedStatus])

  useEffect(() => { if (profile) loadReportCards() }, [profile, loadReportCards])

  // ─── Filtered Cards ─────────────────────────────────
  const filteredCards = reportCards.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.student_name.toLowerCase().includes(q) || c.student_vin?.toLowerCase().includes(q)
  })

  // ─── Actions ────────────────────────────────────────
  const handleViewCard = (card: ReportCard) => {
    setSelectedCard(card)
    setPrincipalComment(card.principal_comments || '')  // Show existing principal comment
    setShowReviewDialog(true)
  }

  const handleApproveCard = async () => {
    if (!selectedCard || !profile) return
    setProcessing(true)
    try {
      // Keep the existing principal_comments if not changed, otherwise use edited version
      const finalPrincipalComment = principalComment || selectedCard.principal_comments
      
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'approved',
          principal_comments: finalPrincipalComment,
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedCard.id)
      if (error) throw error
      toast.success('✅ Report card approved!')
      setShowReviewDialog(false)
      loadReportCards()
    } catch (err) { toast.error('Failed to approve') }
    finally { setProcessing(false) }
  }

  const handlePublishCard = async () => {
    if (!selectedCard || !profile) return
    setProcessing(true)
    try {
      const finalPrincipalComment = principalComment || selectedCard.principal_comments
      
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'published',
          principal_comments: finalPrincipalComment,
          published_by: profile.id,
          published_at: new Date().toISOString()
        })
        .eq('id', selectedCard.id)
      if (error) throw error
      toast.success('📢 Report card published to student!')
      setShowReviewDialog(false)
      loadReportCards()
    } catch (err) { toast.error('Failed to publish') }
    finally { setProcessing(false) }
  }

  const handleRejectCard = async () => {
    if (!selectedCard || !rejectReason.trim()) { toast.error('Provide a reason'); return }
    setProcessing(true)
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
    } catch (err) { toast.error('Failed to reject') }
    finally { setProcessing(false) }
  }

  const handleBulkApprove = async () => {
    if (!bulkClass) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('class', bulkClass)
        .eq('status', 'generated')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
      if (error) throw error
      toast.success(`✅ All generated in ${bulkClass} approved!`)
      setShowBulkDialog(false)
      setBulkClass('')
      loadReportCards()
    } catch (err) { toast.error('Failed') }
    finally { setProcessing(false) }
  }

  const handleBulkPublish = async () => {
    if (!bulkClass) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'published',
          published_by: profile?.id,
          published_at: new Date().toISOString()
        })
        .eq('class', bulkClass)
        .eq('status', 'approved')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
      if (error) throw error
      toast.success(`📢 All approved in ${bulkClass} published!`)
      setShowBulkDialog(false)
      setBulkClass('')
      loadReportCards()
    } catch (err) { toast.error('Failed') }
    finally { setProcessing(false) }
  }

  const handleExport = (className: string) => {
    const cards = className === 'all' ? reportCards : reportCards.filter(c => c.class === className)
    if (!cards.length) { toast.info('No data'); return }
    const headers = ['Name', 'VIN', 'Total', 'Average', 'Grade', 'Status', 'Teacher Comment', 'Principal Comment']
    const rows = cards.map(c => [
      c.student_name,
      c.student_vin,
      c.total_score,
      `${c.average_score}%`,
      c.average_score >= 75 ? 'A1' : c.average_score >= 70 ? 'B2' : c.average_score >= 65 ? 'B3' : c.average_score >= 60 ? 'C4' : c.average_score >= 55 ? 'C5' : c.average_score >= 50 ? 'C6' : c.average_score >= 45 ? 'D7' : c.average_score >= 40 ? 'E8' : 'F9',
      c.status,
      c.teacher_comments,
      c.principal_comments
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ReportCards_${className}_${getTermLabel(selectedTerm)}_${selectedYear.replace('/', '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  if (loading && !reportCards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <FileSpreadsheet className="h-12 w-12 text-blue-500" />
        </motion.div>
        <p className="text-slate-600 font-medium text-sm">Loading report cards...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Report Card Approval</h2>
          <p className="text-sm text-slate-500">
            {getTermLabel(selectedTerm)} {selectedYear} • {stats.generated} generated • {stats.published} published
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadReportCards} className="h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
          <Button size="sm" onClick={() => { setBulkClass(''); setShowBulkDialog(true) }} className="h-8 text-xs bg-blue-600">
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />Bulk Actions
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Generated', value: stats.generated, color: 'bg-purple-100 text-purple-700' },
          { label: 'Approved', value: stats.approved, color: 'bg-blue-100 text-blue-700' },
          { label: 'Published', value: stats.published, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-700' },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-lg p-2.5 text-center border", s.color)}>
            <p className="text-[9px] uppercase opacity-70">{s.label}</p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {CLASSES.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search name or VIN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content - All Classes View */}
      {selectedClass === 'all' ? (
        <div className="space-y-3">
          {classStats.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-16">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">No report cards found</h3>
                <p className="text-sm text-slate-500">No report cards for {getTermLabel(selectedTerm)} {selectedYear}</p>
              </CardContent>
            </Card>
          ) : classStats.map(cs => {
            const isOpen = expandedClass === cs.className
            const classCards = reportCards.filter(c => c.class === cs.className && (!searchQuery || c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.student_vin?.toLowerCase().includes(searchQuery.toLowerCase())))
            return (
              <Card key={cs.className} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedClass(isOpen ? null : cs.className)} className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-sm">{cs.className}</span>
                      <p className="text-xs text-slate-400">{cs.total} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-purple-600 font-medium">{cs.generated} generated</span>
                    <span className="text-emerald-600 font-medium">{cs.published} published</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); handleExport(cs.className) }}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs">Student</TableHead>
                            <TableHead className="text-xs">VIN</TableHead>
                            <TableHead className="text-center text-xs">Avg</TableHead>
                            <TableHead className="text-xs">Grade</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-right text-xs">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classCards.map(c => (
                            <TableRow key={c.id} className="hover:bg-slate-50/50">
                              <TableCell className="text-xs font-medium">{c.student_name}</TableCell>
                              <TableCell className="text-xs font-mono">{c.student_vin}</TableCell>
                              <TableCell className="text-center text-xs font-bold">{c.average_score}%</TableCell>
                              <TableCell className="text-center">
                                <Badge className={cn("text-[9px] font-bold", getGradeColor(
                                  c.average_score >= 75 ? 'A1' : c.average_score >= 70 ? 'B2' : c.average_score >= 65 ? 'B3' : 
                                  c.average_score >= 60 ? 'C4' : c.average_score >= 55 ? 'C5' : c.average_score >= 50 ? 'C6' :
                                  c.average_score >= 45 ? 'D7' : c.average_score >= 40 ? 'E8' : 'F9'
                                ))}>
                                  {c.average_score >= 75 ? 'A1' : c.average_score >= 70 ? 'B2' : c.average_score >= 65 ? 'B3' : 
                                   c.average_score >= 60 ? 'C4' : c.average_score >= 55 ? 'C5' : c.average_score >= 50 ? 'C6' :
                                   c.average_score >= 45 ? 'D7' : c.average_score >= 40 ? 'E8' : 'F9'}
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(c.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleViewCard(c)}>
                                  <Eye className="h-3 w-3 mr-1" />Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      ) : (
        // Single Class View
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredCards.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">No report cards</h3>
                <p className="text-sm text-slate-500">No report cards found for {selectedClass}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">VIN</TableHead>
                    <TableHead className="text-center text-xs">Avg</TableHead>
                    <TableHead className="text-xs">Grade</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Teacher</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map(c => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-xs font-medium">{c.student_name}</TableCell>
                      <TableCell className="text-xs font-mono">{c.student_vin}</TableCell>
                      <TableCell className="text-center text-xs font-bold">{c.average_score}%</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[9px] font-bold", getGradeColor(
                          c.average_score >= 75 ? 'A1' : c.average_score >= 70 ? 'B2' : c.average_score >= 65 ? 'B3' : 
                          c.average_score >= 60 ? 'C4' : c.average_score >= 55 ? 'C5' : c.average_score >= 50 ? 'C6' :
                          c.average_score >= 45 ? 'D7' : c.average_score >= 40 ? 'E8' : 'F9'
                        ))}>
                          {c.average_score >= 75 ? 'A1' : c.average_score >= 70 ? 'B2' : c.average_score >= 65 ? 'B3' : 
                           c.average_score >= 60 ? 'C4' : c.average_score >= 55 ? 'C5' : c.average_score >= 50 ? 'C6' :
                           c.average_score >= 45 ? 'D7' : c.average_score >= 40 ? 'E8' : 'F9'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">{c.class_teacher}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleViewCard(c)}>
                          <Eye className="h-3 w-3 mr-1" />Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Dialog - DISPLAYS STORED AI-GENERATED COMMENTS */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedCard.student_name}
                </DialogTitle>
                <DialogDescription>
                  {selectedCard.class} • VIN: {selectedCard.student_vin} • {getTermLabel(selectedCard.term)} {selectedCard.academic_year}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">{getStatusBadge(selectedCard.status)}</div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-purple-50 rounded-lg p-2">
                    <p className="text-[10px] text-purple-500 uppercase">Average</p>
                    <p className="text-lg font-bold text-purple-700">{selectedCard.average_score}%</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-[10px] text-emerald-500 uppercase">Total</p>
                    <p className="text-lg font-bold text-emerald-700">{selectedCard.total_score}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-[10px] text-blue-500 uppercase">Grade</p>
                    <Badge className={cn("text-sm font-bold", getGradeColor(
                      selectedCard.average_score >= 75 ? 'A1' : selectedCard.average_score >= 70 ? 'B2' : selectedCard.average_score >= 65 ? 'B3' :
                      selectedCard.average_score >= 60 ? 'C4' : selectedCard.average_score >= 55 ? 'C5' : selectedCard.average_score >= 50 ? 'C6' :
                      selectedCard.average_score >= 45 ? 'D7' : selectedCard.average_score >= 40 ? 'E8' : 'F9'
                    ))}>
                      {selectedCard.average_score >= 75 ? 'A1' : selectedCard.average_score >= 70 ? 'B2' : selectedCard.average_score >= 65 ? 'B3' :
                       selectedCard.average_score >= 60 ? 'C4' : selectedCard.average_score >= 55 ? 'C5' : selectedCard.average_score >= 50 ? 'C6' :
                       selectedCard.average_score >= 45 ? 'D7' : selectedCard.average_score >= 40 ? 'E8' : 'F9'}
                    </Badge>
                  </div>
                </div>
                
                {/* Subject Scores Table */}
                <div>
                  <p className="text-xs font-semibold mb-1">Subject Scores</p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Subject</TableHead>
                          <TableHead className="text-center text-xs">CA</TableHead>
                          <TableHead className="text-center text-xs">Exam</TableHead>
                          <TableHead className="text-center text-xs">Total</TableHead>
                          <TableHead className="text-center text-xs">Grade</TableHead>
                          <TableHead className="text-left text-xs">Remark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCard.subjects_data?.map((s: SubjectScore, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-medium">{s.name}</TableCell>
                            <TableCell className="text-center text-xs">{s.ca || '-'}</TableCell>
                            <TableCell className="text-center text-xs">{s.exam || '-'}</TableCell>
                            <TableCell className="text-center text-xs font-bold">{s.total}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn("text-[9px]", getGradeColor(s.grade))}>{s.grade}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{s.remark || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* AI-GENERATED TEACHER'S COMMENT (from stored data) */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-purple-600 text-white px-3 py-2 text-xs font-bold flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    CLASS TEACHER'S REMARK
                  </div>
                  <div className="p-3 text-xs bg-purple-50 leading-relaxed">
                    {selectedCard.teacher_comments || 'No comment available.'}
                  </div>
                </div>
                
                {/* PRINCIPAL'S COMMENT (from stored data - editable) */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-600 text-white px-3 py-2 text-xs font-bold flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    PRINCIPAL'S REMARK
                  </div>
                  <div className="p-3 bg-blue-50">
                    <Textarea
                      value={principalComment}
                      onChange={e => setPrincipalComment(e.target.value)}
                      rows={3}
                      className="text-xs bg-white border-blue-300"
                      placeholder="Edit principal's comment here..."
                      disabled={selectedCard.status === 'published'}
                    />
                    <p className="text-[10px] text-slate-500 mt-2">
                      You can edit this comment before approving or publishing.
                    </p>
                  </div>
                </div>
                
                {/* Rejection Reason if rejected */}
                {selectedCard.status === 'rejected' && selectedCard.rejected_reason && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-medium text-red-700">Rejection Reason:</p>
                    <p className="text-xs text-red-600 mt-1">{selectedCard.rejected_reason}</p>
                  </div>
                )}
              </div>
              
              {/* Dialog Footer Buttons */}
              <DialogFooter className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  {selectedCard.status === 'generated' && (
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { setShowReviewDialog(false); setShowRejectDialog(true) }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowReviewDialog(false)}>Close</Button>
                  {selectedCard.status === 'generated' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleApproveCard} disabled={processing}>
                      {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}Approve
                    </Button>
                  )}
                  {selectedCard.status === 'approved' && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePublishCard} disabled={processing}>
                      {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}Publish to Student
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Report Card?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for the teacher to review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g., Scores need review, missing subjects..."
            rows={3}
            className="text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectCard} disabled={processing || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700">
              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Actions</AlertDialogTitle>
            <AlertDialogDescription>
              Select a class to approve or publish all report cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1 block">Select Class</Label>
            <Select value={bulkClass} onValueChange={setBulkClass}>
              <SelectTrigger><SelectValue placeholder="Choose a class" /></SelectTrigger>
              <SelectContent>
                {CLASSES.filter(c => c !== 'all').map(c => {
                  const generated = reportCards.filter(rc => rc.class === c && rc.status === 'generated').length
                  const approved = reportCards.filter(rc => rc.class === c && rc.status === 'approved').length
                  return (
                    <SelectItem key={c} value={c}>
                      {c} ({generated} generated, {approved} approved)
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm" onClick={handleBulkApprove} disabled={!bulkClass || processing}>
              <CheckCircle className="h-4 w-4 mr-1" />Approve All Generated
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={handleBulkPublish} disabled={!bulkClass || processing}>
              <Send className="h-4 w-4 mr-1" />Publish All Approved
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}