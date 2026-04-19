// components/admin/report-cards/ReportCardApproval.tsx - UPDATED WITH DISPLAY NAME
'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, CheckCircle, XCircle, Eye, FileText,
  Search, RefreshCw, Award, BookOpen,
  ChevronRight, Calendar, Download,
  Send, Clock, AlertCircle, CheckCheck,
  GraduationCap, ChevronDown, ChevronUp,
  CheckCircle2, User, FileCheck, Users
} from 'lucide-react'

interface ReportCard {
  id: string
  student_id: string
  student_name: string
  student_display_name?: string  // ✅ Added - for proper report format
  student_vin: string
  class: string
  term: string
  academic_year: string
  subjects_data: any[]
  teacher_comments: string
  principal_comments: string
  class_teacher: string
  average_score: number
  status: 'pending' | 'approved' | 'published' | 'rejected'
  submitted_at: string
}

interface ReportCardApprovalProps {
  onRefresh?: () => void
}

const terms = ['First Term', 'Second Term', 'Third Term']
const academicYears = ['2024/2025', '2025/2026', '2026/2027']
const classes = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export function ReportCardApproval({ onRefresh }: ReportCardApprovalProps) {
  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term')
  const [selectedYear, setSelectedYear] = useState<string>('2024/2025')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, published: 0, rejected: 0
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getGradeColor = (grade: string): string => {
    if (!grade) return ''
    if (grade.startsWith('A')) return 'text-green-600'
    if (grade.startsWith('B')) return 'text-blue-600'
    if (grade.startsWith('C')) return 'text-yellow-600'
    return 'text-gray-600'
  }

  // ✅ Helper to get display name (fallback to student_name if display_name missing)
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

  // Load report cards - ✅ Updated to fetch display_name
  const loadReportCards = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('report_cards')
        .select('*')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .order('submitted_at', { ascending: false })

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
        student_display_name: rc.student_display_name || rc.display_name || rc.student_name, // ✅ Use display_name
        student_vin: rc.student_vin || 'N/A',
        class: rc.class,
        term: rc.term,
        academic_year: rc.academic_year,
        subjects_data: rc.subjects_data || [],
        teacher_comments: rc.teacher_comments || '',
        principal_comments: rc.principal_comments || '',
        class_teacher: rc.class_teacher || 'Unknown',
        average_score: rc.average_score || 0,
        status: rc.status || 'pending',
        submitted_at: rc.submitted_at || rc.created_at
      }))

      // Filter by search - ✅ Search both display_name and student_name
      let filtered = cards
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = cards.filter(c => 
          c.student_display_name?.toLowerCase().includes(query) ||
          c.student_name?.toLowerCase().includes(query) ||
          c.student_vin?.toLowerCase().includes(query)
        )
      }
      setReportCards(filtered)
      
      // Calculate stats
      const allCards = cards
      setStats({
        total: allCards.length,
        pending: allCards.filter(c => c.status === 'pending').length,
        approved: allCards.filter(c => c.status === 'approved').length,
        published: allCards.filter(c => c.status === 'published').length,
        rejected: allCards.filter(c => c.status === 'rejected').length
      })

    } catch (error) {
      console.error('Error loading report cards:', error)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedYear, selectedClass, selectedStatus, searchQuery])

  useEffect(() => {
    loadReportCards()
  }, [loadReportCards])

  // Approve report card
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
      console.error('Error approving report card:', error)
      toast.error('Failed to approve report card')
    } finally {
      setProcessingAction(false)
    }
  }

  // Publish report card
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

      // Notify student
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
      console.error('Error publishing report card:', error)
      toast.error('Failed to publish report card')
    } finally {
      setProcessingAction(false)
    }
  }

  // Reject report card
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
      console.error('Error rejecting report card:', error)
      toast.error('Failed to reject report card')
    } finally {
      setProcessingAction(false)
    }
  }

  // View report card
  const handleViewCard = (card: ReportCard) => {
    setSelectedCard(card)
    setPrincipalComment(card.principal_comments || '')
    setShowReviewDialog(true)
  }

  const getGrade = (score: number): string => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Report Card Approval
          </h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, and publish student report cards
          </p>
        </div>
        <Button variant="outline" onClick={loadReportCards}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
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
        <Card className="bg-yellow-50">
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
        <Card className="bg-blue-50">
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
        <Card className="bg-green-50">
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
        <Card className="bg-red-50">
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
          <CardTitle className="text-lg">
            {selectedClass === 'all' ? 'All Classes' : selectedClass} - Report Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No report cards found</p>
            </div>
          ) : (
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
                {reportCards.map((card) => {
                  const grade = getGrade(card.average_score)
                  const displayName = getDisplayName(card) // ✅ Use display name
                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="font-medium">{displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{card.student_vin}</TableCell>
                      <TableCell>{card.class}</TableCell>
                      <TableCell className="text-center font-bold">{card.average_score}%</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getGradeColor(grade)} variant="outline">
                          {grade}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{card.class_teacher}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCard(card)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog - ✅ Updated to show display name */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  {getDisplayName(selectedCard)} - {selectedCard.class}
                </DialogTitle>
                <DialogDescription>
                  {selectedCard.term} {selectedCard.academic_year} | VIN: {selectedCard.student_vin} | Teacher: {selectedCard.class_teacher}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(selectedCard.status)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Average Score</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedCard.average_score}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-xs text-purple-600">Grade</p>
                    <p className="text-2xl font-bold text-purple-700">{getGrade(selectedCard.average_score)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Subject Scores</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCard.subjects_data?.slice(0, 5).map((subject: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell className="text-center font-bold">{subject.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{subject.grade || getGrade(subject.total)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Teacher's Comments</h4>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg">
                    {selectedCard.teacher_comments || 'No comments provided.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Principal's Comments</h4>
                  <Textarea
                    placeholder="Enter principal's comments..."
                    value={principalComment}
                    onChange={(e) => setPrincipalComment(e.target.value)}
                    rows={3}
                    disabled={selectedCard.status === 'published'}
                  />
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between">
                <div>
                  {selectedCard.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      className="text-red-600"
                      onClick={() => {
                        setShowReviewDialog(false)
                        setShowRejectDialog(true)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                    Close
                  </Button>
                  
                  {selectedCard.status === 'pending' && (
                    <Button onClick={handleApproveCard} disabled={processingAction} className="bg-blue-600">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                  )}
                  
                  {selectedCard.status === 'approved' && (
                    <Button onClick={handlePublishCard} disabled={processingAction} className="bg-green-600">
                      {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Publish to Student
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
              className="bg-red-600 hover:bg-red-700"
            >
              {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}