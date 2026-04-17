/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/report-cards/page.tsx - ADMIN REPORT CARD APPROVAL DASHBOARD
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
// Remove this import if AdminSidebar doesn't exist or comment it out
// import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
// Remove Accordion import if it doesn't exist or create the component
// import {
//   Accordion, AccordionContent, AccordionItem, AccordionTrigger,
// } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label' // Fixed: Added Label import
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, CheckCircle, XCircle, Eye, FileText,
  Users, Search, RefreshCw, Award, BookOpen,
  ChevronRight, Calendar, Filter, Download, Printer,
  Send, Clock, AlertCircle, TrendingUp, CheckCheck,
  GraduationCap, ChevronDown, ChevronUp, Sparkles,
  CheckCircle2, ArrowLeft, Star, User, Mail
} from 'lucide-react'

interface AdminProfile {
  id: string
  full_name: string
  email: string
  photo_url?: string
}

interface ReportCard {
  id: string
  student_id: string
  student_name: string
  student_vin: string
  student_class: string
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
  position: number
  class_highest: number
  class_average: number
  total_students: number
  status: 'pending' | 'approved' | 'published' | 'rejected'
  submitted_at: string
  approved_at?: string
  published_at?: string
  rejected_reason?: string
  submitted_by?: string
}

interface ClassStats {
  className: string
  total: number
  pending: number
  approved: number
  published: number
  rejected: number
}

interface StudentSummary {
  id: string
  name: string
  vin: string
  average: number
  grade: string
  status: string
}

const terms = ['First Term', 'Second Term', 'Third Term']
const academicYears = ['2024/2025', '2025/2026', '2026/2027']
const classes = ['all', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export default function AdminReportCardsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term')
  const [selectedYear, setSelectedYear] = useState<string>('2024/2025')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [filteredCards, setFilteredCards] = useState<ReportCard[]>([])
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [classSummaries, setClassSummaries] = useState<Record<string, StudentSummary[]>>({})
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [principalComment, setPrincipalComment] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  const [bulkSelectedClass, setBulkSelectedClass] = useState<string>('')
  
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, published: 0, rejected: 0
  })

  const formatProfileForHeader = (profile: AdminProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'admin' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

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
    if (grade.startsWith('D') || grade.startsWith('E')) return 'text-orange-600'
    if (grade === 'F9') return 'text-red-600'
    return 'text-gray-600'
  }

  const getGradeBgColor = (grade: string): string => {
    if (!grade) return ''
    if (grade.startsWith('A')) return 'bg-green-100'
    if (grade.startsWith('B')) return 'bg-blue-100'
    if (grade.startsWith('C')) return 'bg-yellow-100'
    if (grade.startsWith('D') || grade.startsWith('E')) return 'bg-orange-100'
    if (grade === 'F9') return 'bg-red-100'
    return 'bg-gray-100'
  }

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!profileData || profileData.role !== 'admin') {
          toast.error('Access denied')
          router.push('/portal')
          return
        }

        setProfile({
          id: session.user.id,
          full_name: profileData.full_name || 'Administrator',
          email: profileData.email || session.user.email || '',
          photo_url: profileData.photo_url
        })
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/portal')
      }
    }

    checkAuth()
  }, [router])

  // Load report cards
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
        student_vin: rc.student_vin || 'N/A',
        student_class: rc.class,
        class: rc.class,
        term: rc.term,
        academic_year: rc.academic_year,
        subjects_data: rc.subjects_data || [],
        assessment_data: rc.assessment_data || {},
        teacher_comments: rc.teacher_comments || '',
        principal_comments: rc.principal_comments || '',
        class_teacher: rc.class_teacher || 'Unknown',
        total_score: rc.total_score || 0,
        average_score: rc.average_score || 0,
        position: rc.position || 0,
        class_highest: rc.class_highest || 0,
        class_average: rc.class_average || 0,
        total_students: rc.total_students || 1,
        status: rc.status || 'pending',
        submitted_at: rc.submitted_at || rc.created_at,
        approved_at: rc.approved_at,
        published_at: rc.published_at,
        rejected_reason: rc.rejected_reason,
        submitted_by: rc.submitted_by
      }))

      setReportCards(cards)
      
      // Filter by search
      let filtered = cards
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = cards.filter(c => 
          c.student_name.toLowerCase().includes(query) ||
          c.student_vin?.toLowerCase().includes(query)
        )
      }
      setFilteredCards(filtered)
      
      // Calculate stats
      const total = cards.length
      const pending = cards.filter(c => c.status === 'pending').length
      const approved = cards.filter(c => c.status === 'approved').length
      const published = cards.filter(c => c.status === 'published').length
      const rejected = cards.filter(c => c.status === 'rejected').length
      
      setStats({ total, pending, approved, published, rejected })

      // Calculate class stats (only when viewing all classes)
      if (selectedClass === 'all') {
        const classMap: Record<string, ClassStats> = {}
        const summaryMap: Record<string, StudentSummary[]> = {}
        
        cards.forEach(card => {
          if (!classMap[card.class]) {
            classMap[card.class] = {
              className: card.class,
              total: 0, pending: 0, approved: 0, published: 0, rejected: 0
            }
            summaryMap[card.class] = []
          }
          classMap[card.class].total++
          classMap[card.class][card.status]++
          
          summaryMap[card.class].push({
            id: card.student_id,
            name: card.student_name,
            vin: card.student_vin,
            average: card.average_score,
            grade: card.average_score >= 75 ? 'A1' : 
                   card.average_score >= 70 ? 'B2' :
                   card.average_score >= 65 ? 'B3' :
                   card.average_score >= 60 ? 'C4' :
                   card.average_score >= 55 ? 'C5' :
                   card.average_score >= 50 ? 'C6' :
                   card.average_score >= 45 ? 'D7' :
                   card.average_score >= 40 ? 'E8' : 'F9',
            status: card.status
          })
        })
        
        // Sort summaries by average score
        Object.keys(summaryMap).forEach(className => {
          summaryMap[className].sort((a, b) => b.average - a.average)
        })
        
        setClassStats(Object.values(classMap).sort((a, b) => a.className.localeCompare(b.className)))
        setClassSummaries(summaryMap)
      }

    } catch (error) {
      console.error('Error loading report cards:', error)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedYear, selectedClass, selectedStatus, searchQuery])

  useEffect(() => {
    if (profile) {
      loadReportCards()
    }
  }, [profile, loadReportCards])

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  // View report card details
  const handleViewCard = (card: ReportCard) => {
    setSelectedCard(card)
    setPrincipalComment(card.principal_comments || '')
    setShowReviewDialog(true)
  }

  // Approve single report card
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

      toast.success(`Report card for ${selectedCard.student_name} approved!`)
      setShowReviewDialog(false)
      loadReportCards()
    } catch (error) {
      console.error('Error approving report card:', error)
      toast.error('Failed to approve report card')
    } finally {
      setProcessingAction(false)
    }
  }

  // Publish single report card (makes it visible to student)
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

      // Send notification to student
      await supabase.from('notifications').insert({
        user_id: selectedCard.student_id,
        title: 'Report Card Published!',
        message: `Your ${selectedCard.term} ${selectedCard.academic_year} report card is now available.`,
        type: 'report_card_published',
        link: '/student/report-card',
        metadata: { term: selectedCard.term, academic_year: selectedCard.academic_year }
      })

      toast.success(`Report card published for ${selectedCard.student_name}!`)
      setShowReviewDialog(false)
      loadReportCards()
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

      // Send notification to teacher
      await supabase.from('notifications').insert({
        user_id: selectedCard.submitted_by,
        title: 'Report Card Rejected',
        message: `${selectedCard.student_name}'s report card was rejected. Reason: ${rejectReason}`,
        type: 'report_card_rejected',
        link: `/staff/students/${selectedCard.student_id}`,
        metadata: { student_id: selectedCard.student_id, reason: rejectReason }
      })

      toast.success('Report card rejected')
      setShowRejectDialog(false)
      setShowReviewDialog(false)
      setRejectReason('')
      loadReportCards()
    } catch (error) {
      console.error('Error rejecting report card:', error)
      toast.error('Failed to reject report card')
    } finally {
      setProcessingAction(false)
    }
  }

  // Bulk approve all pending in a class
  const handleBulkApprove = async () => {
    if (!bulkSelectedClass) return
    
    setProcessingAction(true)
    try {
      const pendingCards = reportCards.filter(c => 
        c.class === bulkSelectedClass && c.status === 'pending'
      )
      
      if (pendingCards.length === 0) {
        toast.info('No pending report cards in this class')
        setShowBulkApproveDialog(false)
        setProcessingAction(false)
        return
      }

      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('class', bulkSelectedClass)
        .eq('status', 'pending')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      if (error) throw error

      toast.success(`${pendingCards.length} report cards approved for ${bulkSelectedClass}!`)
      setShowBulkApproveDialog(false)
      setBulkSelectedClass('')
      loadReportCards()
    } catch (error) {
      console.error('Error bulk approving:', error)
      toast.error('Failed to bulk approve report cards')
    } finally {
      setProcessingAction(false)
    }
  }

  // Bulk publish all approved in a class
  const handleBulkPublish = async () => {
    if (!bulkSelectedClass) return
    
    setProcessingAction(true)
    try {
      const approvedCards = reportCards.filter(c => 
        c.class === bulkSelectedClass && c.status === 'approved'
      )
      
      if (approvedCards.length === 0) {
        toast.info('No approved report cards in this class')
        setShowBulkApproveDialog(false)
        setProcessingAction(false)
        return
      }

      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'published',
          published_by: profile?.id,
          published_at: new Date().toISOString()
        })
        .eq('class', bulkSelectedClass)
        .eq('status', 'approved')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      if (error) throw error

      toast.success(`${approvedCards.length} report cards published for ${bulkSelectedClass}!`)
      setShowBulkApproveDialog(false)
      setBulkSelectedClass('')
      loadReportCards()
    } catch (error) {
      console.error('Error bulk publishing:', error)
      toast.error('Failed to bulk publish report cards')
    } finally {
      setProcessingAction(false)
    }
  }

  // Export class report cards
  const handleExportClass = (className: string) => {
    const classCards = reportCards.filter(c => c.class === className)
    if (classCards.length === 0) {
      toast.info('No report cards to export')
      return
    }
    
    const csv = [
      ['Student Name', 'VIN', 'Average Score', 'Grade', 'Status', 'Teacher', 'Submitted'],
      ...classCards.map(c => [
        c.student_name,
        c.student_vin,
        `${c.average_score}%`,
        c.average_score >= 75 ? 'A1' : c.average_score >= 70 ? 'B2' : c.average_score >= 65 ? 'B3' : c.average_score >= 60 ? 'C4' : c.average_score >= 55 ? 'C5' : c.average_score >= 50 ? 'C6' : c.average_score >= 45 ? 'D7' : c.average_score >= 40 ? 'E8' : 'F9',
        c.status,
        c.class_teacher,
        new Date(c.submitted_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${className}_${selectedTerm}_${selectedYear}_Report_Cards.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${classCards.length} report cards`)
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        {/* AdminSidebar removed - create or fix the component */}
        {/* <AdminSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="report-cards"
          setActiveTab={() => {}}
        /> */}
        
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 lg:px-6 py-6 max-w-7xl">
            
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Report Card Approval
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Review, approve, and publish student report cards
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadReportCards}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    onClick={() => {
                      setBulkSelectedClass('')
                      setShowBulkApproveDialog(true)
                    }}
                    className="bg-blue-600"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6"
            >
              <Card className="border-0 shadow-sm bg-white">
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
              <Card className="border-0 shadow-sm bg-yellow-50">
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
              <Card className="border-0 shadow-sm bg-blue-50">
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
              <Card className="border-0 shadow-sm bg-green-50">
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
              <Card className="border-0 shadow-sm bg-red-50">
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
            </motion.div>

            {/* Filters */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <Card className="border-0 shadow-sm bg-white">
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
            </motion.div>

            {/* Class Accordions (when viewing all classes) */}
            {selectedClass === 'all' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {classStats.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="text-center py-16">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No report cards found
                      </h3>
                      <p className="text-muted-foreground">
                        No report cards have been submitted for {selectedTerm} {selectedYear} yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  classStats.map((classStat) => (
                    <Card key={classStat.className} className="border-0 shadow-sm bg-white overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedClass(expandedClass === classStat.className ? null : classStat.className)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{classStat.className}</h3>
                              <p className="text-sm text-slate-500">{classStat.total} students</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Pending</p>
                                <p className="font-bold text-yellow-600">{classStat.pending}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Approved</p>
                                <p className="font-bold text-blue-600">{classStat.approved}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Published</p>
                                <p className="font-bold text-green-600">{classStat.published}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExportClass(classStat.className)
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {expandedClass === classStat.className ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedClass === classStat.className && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead>VIN</TableHead>
                                  <TableHead className="text-center">Average</TableHead>
                                  <TableHead className="text-center">Grade</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Teacher</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {classSummaries[classStat.className]?.map((student) => {
                                  const card = reportCards.find(c => c.student_id === student.id)
                                  return (
                                    <TableRow key={student.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-slate-500" />
                                          </div>
                                          <span className="font-medium">{student.name}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">{student.vin}</TableCell>
                                      <TableCell className="text-center font-bold">{student.average}%</TableCell>
                                      <TableCell className="text-center">
                                        <Badge className={cn(getGradeBgColor(student.grade), getGradeColor(student.grade))}>
                                          {student.grade}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                                      <TableCell className="text-sm text-slate-500">{card?.class_teacher || '—'}</TableCell>
                                      <TableCell className="text-right">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => card && handleViewCard(card)}
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))
                )}
              </motion.div>
            ) : (
              /* Single Class View - Table */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selectedClass} - Report Cards</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => handleExportClass(selectedClass)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredCards.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No report cards found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>VIN</TableHead>
                            <TableHead className="text-center">Average</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCards.map((card) => {
                            const grade = card.average_score >= 75 ? 'A1' : 
                                         card.average_score >= 70 ? 'B2' :
                                         card.average_score >= 65 ? 'B3' :
                                         card.average_score >= 60 ? 'C4' :
                                         card.average_score >= 55 ? 'C5' :
                                         card.average_score >= 50 ? 'C6' :
                                         card.average_score >= 45 ? 'D7' :
                                         card.average_score >= 40 ? 'E8' : 'F9'
                            return (
                              <TableRow key={card.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                      <User className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <span className="font-medium">{card.student_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{card.student_vin}</TableCell>
                                <TableCell className="text-center font-bold">{card.average_score}%</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={cn(getGradeBgColor(grade), getGradeColor(grade))}>
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
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Review Report Card Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  {selectedCard.student_name} - {selectedCard.class}
                </DialogTitle>
                <DialogDescription>
                  {selectedCard.term} {selectedCard.academic_year} | VIN: {selectedCard.student_vin} | 
                  Teacher: {selectedCard.class_teacher} | 
                  Submitted: {new Date(selectedCard.submitted_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">Current Status:</span>
                  {getStatusBadge(selectedCard.status)}
                </div>

                {/* Scores Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Average Score</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedCard.average_score}%</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-green-600">Total Score</p>
                    <p className="text-2xl font-bold text-green-700">{selectedCard.total_score}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-xs text-purple-600">Position</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {selectedCard.position || '—'} / {selectedCard.total_students || '—'}
                    </p>
                  </div>
                </div>

                {/* Subjects Table */}
                <div>
                  <h4 className="font-semibold mb-2">Subject Scores</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">CA1</TableHead>
                        <TableHead className="text-center">CA2</TableHead>
                        <TableHead className="text-center">Exam</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCard.subjects_data?.map((subject: any, idx: number) => {
                        const grade = subject.total >= 75 ? 'A1' : 
                                     subject.total >= 70 ? 'B2' :
                                     subject.total >= 65 ? 'B3' :
                                     subject.total >= 60 ? 'C4' :
                                     subject.total >= 55 ? 'C5' :
                                     subject.total >= 50 ? 'C6' :
                                     subject.total >= 45 ? 'D7' :
                                     subject.total >= 40 ? 'E8' : 'F9'
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell className="text-center">{subject.ca1 || '-'}</TableCell>
                            <TableCell className="text-center">{subject.ca2 || '-'}</TableCell>
                            <TableCell className="text-center">
                              {(subject.examObj || 0) + (subject.examTheory || 0)}
                            </TableCell>
                            <TableCell className="text-center font-bold">{subject.total}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn(getGradeBgColor(grade), getGradeColor(grade))}>
                                {subject.grade || grade}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Assessment */}
                {selectedCard.assessment_data && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Psychomotor Skills</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Handwriting:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.handwriting || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sports:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.sports || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Creativity:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.creativity || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Technical:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.technical || 3)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Behavioral Traits</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Punctuality:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.punctuality || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Neatness:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.neatness || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Politeness:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.politeness || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cooperation:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.cooperation || 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leadership:</span>
                          <span>{'⭐'.repeat(selectedCard.assessment_data.leadership || 3)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance */}
                {selectedCard.assessment_data && (
                  <div>
                    <h4 className="font-semibold mb-2">Attendance</h4>
                    <div className="flex gap-6">
                      <div>
                        <span className="text-sm text-slate-500">Present:</span>
                        <span className="ml-2 font-bold text-green-600">{selectedCard.assessment_data.daysPresent || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm text-slate-500">Absent:</span>
                        <span className="ml-2 font-bold text-red-600">{selectedCard.assessment_data.daysAbsent || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Teacher Comments */}
                <div>
                  <h4 className="font-semibold mb-2">Teacher's Comments</h4>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg">
                    {selectedCard.teacher_comments || 'No comments provided.'}
                  </p>
                </div>

                {/* Principal Comments Input */}
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

                {/* Rejection Reason (if rejected) */}
                {selectedCard.status === 'rejected' && selectedCard.rejected_reason && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="font-medium text-red-700">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{selectedCard.rejected_reason}</p>
                  </div>
                )}
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

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Report Card?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this report card. The teacher will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
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

      {/* Bulk Actions Dialog */}
      <AlertDialog open={showBulkApproveDialog} onOpenChange={setShowBulkApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Actions</AlertDialogTitle>
            <AlertDialogDescription>
              Select a class and action to perform on all report cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="bulk-class">Select Class</Label>
              <Select value={bulkSelectedClass} onValueChange={setBulkSelectedClass}>
                <SelectTrigger id="bulk-class" className="mt-2">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter(c => c !== 'all').map(cls => {
                    const pending = reportCards.filter(c => c.class === cls && c.status === 'pending').length
                    const approved = reportCards.filter(c => c.class === cls && c.status === 'approved').length
                    return (
                      <SelectItem key={cls} value={cls}>
                        {cls} ({pending} pending, {approved} approved)
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-blue-600"
                onClick={handleBulkApprove}
                disabled={!bulkSelectedClass || processingAction}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve All Pending
              </Button>
              <Button 
                className="flex-1 bg-green-600"
                onClick={handleBulkPublish}
                disabled={!bulkSelectedClass || processingAction}
              >
                <Send className="h-4 w-4 mr-2" />
                Publish All Approved
              </Button>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}