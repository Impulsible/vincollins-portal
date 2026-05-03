// app/admin/report-cards/page.tsx - AUTO-DETECT TERM + LOADING TEXT
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
  CheckCircle2, User, FileSpreadsheet
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────
interface ReportCard {
  id: string
  student_id: string
  student_name: string
  student_vin: string
  class: string
  term: string
  academic_year: string
  subjects_data: any[]
  assessment_data: any
  teacher_comments: string
  principal_comments: string
  class_teacher: string
  total_score: number
  average_score: number
  status: 'pending' | 'approved' | 'published' | 'rejected'
  submitted_at: string
  rejected_reason?: string
}

interface ClassStats {
  className: string
  total: number
  pending: number
  approved: number
  published: number
  rejected: number
}

// ─── Auto-Detect Current Term & Session ───────────────
const getCurrentTermAndSession = () => {
  const now = new Date()
  const month = now.getMonth() // 0=January, 11=December
  const year = now.getFullYear()

  // Nigerian Secondary School Terms:
  // First Term:  September (8) - December (11)
  // Second Term: January (0) - April (3)
  // Third Term:  May (4) - July/August (6/7)

  if (month >= 8) {
    // September - December = First Term of new session
    return { term: 'First Term', session: `${year}/${year + 1}` }
  } else if (month >= 4) {
    // May - August = Third Term of current session
    return { term: 'Third Term', session: `${year - 1}/${year}` }
  } else {
    // January - April = Second Term of current session
    return { term: 'Second Term', session: `${year - 1}/${year}` }
  }
}

// ─── Constants ────────────────────────────────────────
const TERMS = ['First Term', 'Second Term', 'Third Term']
const YEARS = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028']
const CLASSES = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published': return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
    case 'approved': return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
    case 'pending': return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    case 'rejected': return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

const getGradeColor = (grade: string) => {
  if (grade?.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
  if (grade?.startsWith('B')) return 'bg-blue-100 text-blue-700'
  if (grade?.startsWith('C')) return 'bg-yellow-100 text-yellow-700'
  return 'bg-slate-100 text-slate-600'
}

// ─── Detect current term/session on load ──────────────
const { term: autoTerm, session: autoSession } = getCurrentTermAndSession()

// ─── Main Component ───────────────────────────────────
export default function AdminReportCardsPage() {
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('Loading report cards...')
  const [profile, setProfile] = useState<any>(null)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  
  // Filters - initialized with auto-detected values
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState<string>(autoTerm)
  const [selectedYear, setSelectedYear] = useState<string>(autoSession)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialogs
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [processing, setProcessing] = useState(false)
  const [bulkClass, setBulkClass] = useState('')
  
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, published: 0, rejected: 0 })

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoadingText('Verifying your account...')
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
    setLoadingText(`Loading ${selectedClass === 'all' ? 'all' : selectedClass} report cards...`)
    try {
      let query = supabase
        .from('report_cards')
        .select('*')
        .filter('term', 'eq', selectedTerm)
        .filter('academic_year', 'eq', selectedYear)
        .order('submitted_at', { ascending: false })
        .limit(500)

      if (selectedClass !== 'all') query = query.filter('class', 'eq', selectedClass)
      if (selectedStatus !== 'all') query = query.filter('status', 'eq', selectedStatus)

      setLoadingText('Fetching report cards from database...')
      const { data, error } = await query
      if (error) throw error

      setLoadingText('Processing report card data...')
      const cards: ReportCard[] = (data || []).map((rc: any) => ({
        id: rc.id, student_id: rc.student_id,
        student_name: rc.student_name || 'Unknown', student_vin: rc.student_vin || 'N/A',
        class: rc.class, term: rc.term, academic_year: rc.academic_year,
        subjects_data: rc.subjects_data || [], assessment_data: rc.assessment_data || {},
        teacher_comments: rc.teacher_comments || '', principal_comments: rc.principal_comments || '',
        class_teacher: rc.class_teacher || 'Unknown',
        total_score: rc.total_score || 0, average_score: rc.average_score || 0,
        status: rc.status || 'pending', submitted_at: rc.submitted_at || rc.created_at,
        rejected_reason: rc.rejected_reason
      }))

      setReportCards(cards)
      
      // Stats
      setStats({
        total: cards.length,
        pending: cards.filter(c => c.status === 'pending').length,
        approved: cards.filter(c => c.status === 'approved').length,
        published: cards.filter(c => c.status === 'published').length,
        rejected: cards.filter(c => c.status === 'rejected').length,
      })

      // Class stats
      if (selectedClass === 'all') {
        const map: Record<string, ClassStats> = {}
        cards.forEach(c => {
          if (!map[c.class]) map[c.class] = { className: c.class, total: 0, pending: 0, approved: 0, published: 0, rejected: 0 }
          map[c.class].total++
          const st = c.status as keyof Pick<ClassStats, 'pending' | 'approved' | 'published' | 'rejected'>
          if (st in map[c.class]) map[c.class][st]++
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
    setPrincipalComment(card.principal_comments || '')
    setShowReviewDialog(true)
  }

  const handleApproveCard = async () => {
    if (!selectedCard || !profile) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('report_cards').update({
        status: 'approved', principal_comments: principalComment,
        approved_by: profile.id, approved_at: new Date().toISOString()
      }).eq('id', selectedCard.id)
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
      const { error } = await supabase.from('report_cards').update({
        status: 'published', principal_comments: principalComment,
        published_by: profile.id, published_at: new Date().toISOString()
      }).eq('id', selectedCard.id)
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
      const { error } = await supabase.from('report_cards').update({
        status: 'rejected', rejected_reason: rejectReason,
        rejected_by: profile?.id, rejected_at: new Date().toISOString()
      }).eq('id', selectedCard.id)
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
      const { error } = await supabase.from('report_cards').update({
        status: 'approved', approved_by: profile?.id, approved_at: new Date().toISOString()
      }).filter('class', 'eq', bulkClass).eq('status', 'pending').filter('term', 'eq', selectedTerm).filter('academic_year', 'eq', selectedYear)
      if (error) throw error
      toast.success(`✅ All pending in ${bulkClass} approved!`)
      setShowBulkDialog(false); setBulkClass(''); loadReportCards()
    } catch (err) { toast.error('Failed') }
    finally { setProcessing(false) }
  }

  const handleBulkPublish = async () => {
    if (!bulkClass) return
    setProcessing(true)
    try {
      const { error } = await supabase.from('report_cards').update({
        status: 'published', published_by: profile?.id, published_at: new Date().toISOString()
      }).filter('class', 'eq', bulkClass).eq('status', 'approved').filter('term', 'eq', selectedTerm).filter('academic_year', 'eq', selectedYear)
      if (error) throw error
      toast.success(`📢 All approved in ${bulkClass} published!`)
      setShowBulkDialog(false); setBulkClass(''); loadReportCards()
    } catch (err) { toast.error('Failed') }
    finally { setProcessing(false) }
  }

  const handleExport = (className: string) => {
    const cards = className === 'all' ? reportCards : reportCards.filter(c => c.class === className)
    if (!cards.length) { toast.info('No data'); return }
    const csv = [['Name','VIN','Avg','Grade','Status'].join(','), ...cards.map(c => [c.student_name, c.student_vin, `${c.average_score}%`, c.average_score>=75?'A1':c.average_score>=65?'B2':c.average_score>=50?'C4':'F9', c.status].join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `ReportCards_${className}_${selectedTerm}_${selectedYear.replace('/', '_')}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  // ─── Loading State ──────────────────────────────────
  if (loading && !reportCards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <FileSpreadsheet className="h-12 w-12 text-blue-500" />
        </motion.div>
        <p className="text-slate-600 font-medium text-sm">{loadingText}</p>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-blue-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Report Card Approval</h2>
          <p className="text-sm text-slate-500">
            {selectedTerm} {selectedYear} • {stats.pending} pending • {stats.published} published
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
          { label: 'Total', value: stats.total, color: 'text-slate-600 bg-slate-50' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', value: stats.approved, color: 'text-blue-600 bg-blue-50' },
          { label: 'Published', value: stats.published, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600 bg-red-50' },
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
              <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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

      {/* Content */}
      {selectedClass === 'all' ? (
        <div className="space-y-3">
          {classStats.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-16">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">No report cards found</h3>
                <p className="text-sm text-slate-500">No report cards for {selectedTerm} {selectedYear}</p>
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
                    <span className="text-amber-600 font-medium">{cs.pending} pending</span>
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
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-right text-xs">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classCards.map(c => (
                            <TableRow key={c.id} className="hover:bg-slate-50/50">
                              <TableCell className="text-xs font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="h-3.5 w-3.5 text-slate-500" />
                                  </div>
                                  {c.student_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-mono">{c.student_vin}</TableCell>
                              <TableCell className="text-center text-xs font-bold">{c.average_score}%</TableCell>
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

      {/* Review Dialog */}
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
                  {selectedCard.class} • VIN: {selectedCard.student_vin} • {selectedCard.term} {selectedCard.academic_year}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">{getStatusBadge(selectedCard.status)}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-[10px] text-blue-500 uppercase">Average</p>
                    <p className="text-lg font-bold text-blue-700">{selectedCard.average_score}%</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-[10px] text-emerald-500 uppercase">Total</p>
                    <p className="text-lg font-bold text-emerald-700">{selectedCard.total_score}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <p className="text-[10px] text-purple-500 uppercase">Class</p>
                    <p className="text-lg font-bold text-purple-700">{selectedCard.class}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Subject Scores</p>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-center text-xs">CA</TableHead>
                        <TableHead className="text-center text-xs">Exam</TableHead>
                        <TableHead className="text-center text-xs">Total</TableHead>
                        <TableHead className="text-center text-xs">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCard.subjects_data?.map((s: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{s.name}</TableCell>
                          <TableCell className="text-center text-xs">{s.ca || '-'}</TableCell>
                          <TableCell className="text-center text-xs">{s.exam || '-'}</TableCell>
                          <TableCell className="text-center text-xs font-bold">{s.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-[10px]", getGradeColor(s.grade))}>{s.grade}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Teacher's Comments</p>
                  <p className="text-xs bg-slate-50 p-2 rounded-lg">{selectedCard.teacher_comments || 'No comments provided.'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Principal's Comments</p>
                  <Textarea
                    value={principalComment}
                    onChange={e => setPrincipalComment(e.target.value)}
                    rows={2}
                    className="text-xs"
                    placeholder="Enter principal's comments..."
                    disabled={selectedCard.status === 'published'}
                  />
                </div>
                {selectedCard.status === 'rejected' && selectedCard.rejected_reason && (
                  <div className="p-2 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-700">Rejection Reason:</p>
                    <p className="text-xs text-red-600">{selectedCard.rejected_reason}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex items-center justify-between">
                <div>
                  {selectedCard.status === 'pending' && (
                    <Button variant="outline" size="sm" className="text-red-600"
                      onClick={() => { setShowReviewDialog(false); setShowRejectDialog(true) }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowReviewDialog(false)}>Close</Button>
                  {selectedCard.status === 'pending' && (
                    <Button size="sm" className="bg-blue-600" onClick={handleApproveCard} disabled={processing}>
                      {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}Approve
                    </Button>
                  )}
                  {selectedCard.status === 'approved' && (
                    <Button size="sm" className="bg-emerald-600" onClick={handlePublishCard} disabled={processing}>
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
                  const pending = reportCards.filter(rc => rc.class === c && rc.status === 'pending').length
                  const approved = reportCards.filter(rc => rc.class === c && rc.status === 'approved').length
                  return (
                    <SelectItem key={c} value={c}>
                      {c} ({pending} pending, {approved} approved)
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm" onClick={handleBulkApprove} disabled={!bulkClass || processing}>
              <CheckCircle className="h-4 w-4 mr-1" />Approve All Pending
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