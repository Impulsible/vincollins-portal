// app/admin/exams/page.tsx - PROFESSIONAL EXAM APPROVALS FOR ADMIN LAYOUT
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, RefreshCw, Eye, CheckCircle, XCircle, FileText,
  Users, ChevronDown, ChevronRight, Brain, AlertCircle,
  Search, Filter, Clock, Award, BookOpen, MonitorPlay,
  ArrowUpDown, LayoutGrid, List, CheckCircle2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────
interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  pass_mark?: number
  passing_percentage?: number
  status: string
  created_at: string
  submitted_at: string
  approved_at?: string
  created_by: string
  teacher_name?: string
  department?: string
  instructions?: string
  has_theory?: boolean
  randomize_questions?: boolean
  randomize_options?: boolean
  questions?: any[]
  theory_questions?: any[]
}

// ─── Constants ────────────────────────────────────────
const CLASS_ORDER = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Rejected' },
]

const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    case 'draft':
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Draft</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getClassColor = (className: string): string => {
  const colors: Record<string, string> = {
    'JSS 1': 'bg-amber-100 text-amber-700',
    'JSS 2': 'bg-rose-100 text-rose-700',
    'JSS 3': 'bg-cyan-100 text-cyan-700',
    'SS 1': 'bg-emerald-100 text-emerald-700',
    'SS 2': 'bg-blue-100 text-blue-700',
    'SS 3': 'bg-purple-100 text-purple-700',
  }
  return colors[className] || 'bg-slate-100 text-slate-600'
}

// ─── Main Component ───────────────────────────────────
export default function AdminExamsPage() {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  
  // Dialogs
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // Question preview
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [examTheoryQuestions, setExamTheoryQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      }
    }
    init()
  }, [])

  // ─── Load Exams ─────────────────────────────────────
  const loadExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      const formatted = (data || []).map((exam: any) => ({
        ...exam,
        teacher_name: exam.teacher_name || 'Unknown Teacher',
        department: exam.department || 'General'
      }))

      setExams(formatted)
    } catch (error: any) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadExams() }, [loadExams])

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('exams-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => loadExams())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadExams])

  // ─── Filtered Exams ─────────────────────────────────
  const filteredExams = exams.filter(exam => {
    // Tab filter
    if (activeTab === 'pending' && !['pending', 'draft', 'submitted'].includes(exam.status)) return false
    if (activeTab === 'published' && exam.status !== 'published') return false
    
    // Class filter
    if (selectedClass !== 'all' && exam.class !== selectedClass) return false
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        exam.title?.toLowerCase().includes(q) ||
        exam.subject?.toLowerCase().includes(q) ||
        exam.teacher_name?.toLowerCase().includes(q) ||
        exam.class?.toLowerCase().includes(q)
      )
    }
    
    return true
  })

  // Group by class
  const groupedExams = filteredExams.reduce((acc, exam) => {
    if (!acc[exam.class]) acc[exam.class] = []
    acc[exam.class].push(exam)
    return acc
  }, {} as Record<string, Exam[]>)

  // Stats
  const pendingCount = exams.filter(e => ['pending', 'draft', 'submitted'].includes(e.status)).length
  const publishedCount = exams.filter(e => e.status === 'published').length

  // ─── Load Questions ─────────────────────────────────
  const loadExamQuestions = async (exam: Exam) => {
    setLoadingQuestions(true)
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('questions, theory_questions, has_theory')
        .eq('id', exam.id)
        .single()

      if (error) throw error

      const obj = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || [])
      const theory = data.has_theory
        ? (typeof data.theory_questions === 'string' ? JSON.parse(data.theory_questions) : (data.theory_questions || []))
        : []

      setExamQuestions(obj)
      setExamTheoryQuestions(theory)
      setCurrentQuestionIndex(0)
    } catch (err) {
      console.error('Error loading questions:', err)
      toast.error('Failed to load questions')
    } finally {
      setLoadingQuestions(false)
    }
  }

  // ─── Actions ────────────────────────────────────────
  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam)
    loadExamQuestions(exam)
    setShowPreviewDialog(true)
  }

  const handleApprove = async () => {
    if (!selectedExam) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'published', approved_at: new Date().toISOString(), approved_by: profile?.id })
        .eq('id', selectedExam.id)
      if (error) throw error
      toast.success('✅ Exam published successfully!')
      setShowApproveDialog(false)
      setShowPreviewDialog(false)
      setSelectedExam(null)
      loadExams()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setProcessing(false) }
  }

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'draft', rejection_reason: rejectionReason, rejected_at: new Date().toISOString(), rejected_by: profile?.id })
        .eq('id', selectedExam.id)
      if (error) throw error
      toast.success('Exam sent back for revision')
      setShowRejectDialog(false)
      setShowPreviewDialog(false)
      setRejectionReason('')
      setSelectedExam(null)
      loadExams()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setProcessing(false) }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadExams()
    toast.success('Refreshed')
  }

  // ─── All Questions for Preview ──────────────────────
  const allPreviewQuestions = [
    ...examQuestions.map((q: any) => ({ ...q, type: 'objective' })),
    ...examTheoryQuestions.map((q: any) => ({ ...q, type: 'theory' }))
  ]
  const currentQuestion = allPreviewQuestions[currentQuestionIndex]

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <MonitorPlay className="h-14 w-14 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 print:space-y-1">
      {/* Header */}
      <div className="no-print">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Exam Approvals</h2>
            <p className="text-sm text-slate-500">{pendingCount} pending • {publishedCount} published</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8 text-xs">
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 no-print">
        {[
          { label: 'Total', value: exams.length, icon: FileText, color: 'text-slate-600 bg-slate-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Published', value: publishedCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Classes', value: Object.keys(groupedExams).length, icon: Users, color: 'text-blue-600 bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-lg p-2.5 text-center border", s.color)}>
            <p className="text-[9px] uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="no-print flex flex-col sm:flex-row gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="h-8">
            <TabsTrigger value="pending" className="text-xs h-7">
              Pending {pendingCount > 0 && <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-amber-500">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs h-7">
              Published {publishedCount > 0 && <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-emerald-500">{publishedCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {CLASS_ORDER.filter(c => exams.some(e => e.class === c)).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={viewMode === 'grouped' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('grouped')} className="h-8 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('list')} className="h-8 text-xs">
            <List className="h-3.5 w-3.5" />
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs w-[150px]" />
          </div>
        </div>
      </div>

      {/* Exam List */}
      {filteredExams.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No exams found</p>
            <p className="text-xs text-slate-400 mt-1">All caught up!</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-3">
          {CLASS_ORDER.map(className => {
            const classExams = groupedExams[className]
            if (!classExams?.length) return null
            const isOpen = expandedClass === className
            return (
              <Card key={className} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedClass(isOpen ? null : className)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <Badge className={cn("text-xs", getClassColor(className))}>{className}</Badge>
                    <span className="text-sm text-slate-500">{classExams.length} exam{classExams.length > 1 ? 's' : ''}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {classExams.filter(e => e.status === 'pending').length} pending
                  </Badge>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Title</TableHead>
                              <TableHead className="text-xs">Subject</TableHead>
                              <TableHead className="text-xs">Teacher</TableHead>
                              <TableHead className="text-xs text-center">Q's</TableHead>
                              <TableHead className="text-xs text-center">Marks</TableHead>
                              <TableHead className="text-xs text-center">Duration</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-xs">Submitted</TableHead>
                              <TableHead className="text-right text-xs">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classExams.map(exam => (
                              <TableRow key={exam.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-medium text-xs">{exam.title}</TableCell>
                                <TableCell className="text-xs">{exam.subject}</TableCell>
                                <TableCell className="text-xs">{exam.teacher_name}</TableCell>
                                <TableCell className="text-center text-xs">{exam.total_questions}</TableCell>
                                <TableCell className="text-center text-xs">{exam.total_marks}</TableCell>
                                <TableCell className="text-center text-xs">{exam.duration}m</TableCell>
                                <TableCell>{getStatusBadge(exam.status)}</TableCell>
                                <TableCell className="text-xs text-slate-400">{formatDate(exam.submitted_at || exam.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewExam(exam)}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    {activeTab === 'pending' && (
                                      <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"
                                          onClick={() => { setSelectedExam(exam); setShowApproveDialog(true) }}>
                                          <CheckCircle className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                                          onClick={() => { setSelectedExam(exam); setShowRejectDialog(true) }}>
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Teacher</TableHead>
                  <TableHead className="text-xs text-center">Questions</TableHead>
                  <TableHead className="text-xs text-center">Marks</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Submitted</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map(exam => (
                  <TableRow key={exam.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-xs">{exam.title}</TableCell>
                    <TableCell className="text-xs">{exam.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{exam.class}</Badge></TableCell>
                    <TableCell className="text-xs">{exam.teacher_name}</TableCell>
                    <TableCell className="text-center text-xs">{exam.total_questions}</TableCell>
                    <TableCell className="text-center text-xs">{exam.total_marks}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-xs text-slate-400">{formatDate(exam.submitted_at || exam.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewExam(exam)}><Eye className="h-3.5 w-3.5" /></Button>
                        {activeTab === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => { setSelectedExam(exam); setShowApproveDialog(true) }}><CheckCircle className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setSelectedExam(exam); setShowRejectDialog(true) }}><XCircle className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Exam Preview</DialogTitle>
            <DialogDescription className="text-xs">Student view — answers hidden</DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-slate-400">Title:</span><p className="font-medium">{selectedExam.title}</p></div>
                <div><span className="text-slate-400">Subject:</span><p className="font-medium">{selectedExam.subject}</p></div>
                <div><span className="text-slate-400">Class:</span><p className="font-medium">{selectedExam.class}</p></div>
                <div><span className="text-slate-400">Teacher:</span><p className="font-medium">{selectedExam.teacher_name}</p></div>
                <div><span className="text-slate-400">Questions:</span><p className="font-medium">{selectedExam.total_questions}</p></div>
                <div><span className="text-slate-400">Duration:</span><p className="font-medium">{selectedExam.duration} min</p></div>
              </div>
              {selectedExam.instructions && (
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{selectedExam.instructions}</AlertDescription></Alert>
              )}
              {loadingQuestions ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : allPreviewQuestions.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No questions found</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 p-3 flex flex-wrap gap-1.5 border-b">
                    {allPreviewQuestions.map((q: any, i: number) => (
                      <button key={i} onClick={() => setCurrentQuestionIndex(i)}
                        className={cn("w-7 h-7 rounded text-[10px] font-medium transition-all",
                          q.type === 'theory' 
                            ? (i === currentQuestionIndex ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700')
                            : (i === currentQuestionIndex ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600')
                        )}>{i + 1}</button>
                    ))}
                  </div>
                  <div className="p-4 min-h-[200px]">
                    {currentQuestion && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="text-[10px]" variant={currentQuestion.type === 'theory' ? 'secondary' : 'outline'}>
                            {currentQuestion.type === 'theory' ? <><Brain className="h-3 w-3 mr-1" />Theory</> : 'Objective'}
                          </Badge>
                          <span className="text-[10px] text-slate-400">{currentQuestion.marks || 1} mark(s)</span>
                        </div>
                        <p className="text-sm font-medium mb-4">{currentQuestionIndex + 1}. {currentQuestion.question || currentQuestion.question_text}</p>
                        {currentQuestion.type === 'theory' ? (
                          <div className="h-24 bg-slate-100 rounded border border-dashed flex items-center justify-center">
                            <span className="text-xs text-slate-400">Student answer area</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(currentQuestion.options || []).filter(Boolean).map((opt: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded border text-xs">
                                <span className="font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 p-3 flex justify-between border-t">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0}>← Prev</Button>
                    <span className="text-xs text-slate-400">{currentQuestionIndex + 1}/{allPreviewQuestions.length}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentQuestionIndex(i => Math.min(allPreviewQuestions.length - 1, i + 1))} disabled={currentQuestionIndex === allPreviewQuestions.length - 1}>Next →</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(false)}>Close</Button>
            {selectedExam && activeTab === 'pending' && (
              <>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setShowPreviewDialog(false); setShowRejectDialog(true) }}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                <Button size="sm" className="bg-emerald-600" onClick={() => { setShowPreviewDialog(false); setShowApproveDialog(true) }}><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Exam</DialogTitle>
            <DialogDescription>Publish "{selectedExam?.title}" to {selectedExam?.class} students?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleApprove} disabled={processing} className="bg-emerald-600">
              {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Back for Revision</DialogTitle>
            <DialogDescription>Provide a reason for the teacher</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain what needs to be fixed..." rows={3} className="text-sm" />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowRejectDialog(false); setRejectionReason('') }}>Cancel</Button>
            <Button size="sm" onClick={handleReject} disabled={processing || !rejectionReason.trim()} className="bg-red-600">
              {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Send Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}