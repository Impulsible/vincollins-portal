/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/exams/ExamApprovals.tsx - FIXED: Hide answers from admin view
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  FileText,
  Users,
  ChevronDown,
  ChevronRight,
  Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  pass_mark: number
  status: string
  created_at: string
  submitted_at: string
  approved_at?: string
  created_by: string
  teacher_name?: string
  department?: string
  instructions?: string
  has_theory?: boolean
}

interface ExamApprovalsProps {
  pendingExams: Exam[]
  approvedExams: Exam[]
  onApprove: (examId: string) => Promise<void>
  onReject: (examId: string, reason: string) => Promise<void>
  loading?: boolean
  onRefresh: () => void
}

export function ExamApprovals({
  pendingExams,
  approvedExams,
  onApprove,
  onReject,
  loading,
  onRefresh
}: ExamApprovalsProps) {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  
  // Question loading states
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Group exams by class
  const pendingByClass = pendingExams.reduce((acc, exam) => {
    if (!acc[exam.class]) acc[exam.class] = []
    acc[exam.class].push(exam)
    return acc
  }, {} as Record<string, Exam[]>)

  const approvedByClass = approvedExams.reduce((acc, exam) => {
    if (!acc[exam.class]) acc[exam.class] = []
    acc[exam.class].push(exam)
    return acc
  }, {} as Record<string, Exam[]>)

  // Load questions for an exam - NO ANSWERS INCLUDED
  const loadExamQuestions = async (examId: string) => {
    setLoadingQuestions(true)
    setExamQuestions([])
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, question_type, options, points, order_number, exam_id')
        .eq('exam_id', examId)
        .order('order_number', { ascending: true })

      if (error) throw error
      
      // Parse options if needed - EXCLUDE correct_answer
      const parsed = data?.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
      }))
      
      setExamQuestions(parsed || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleViewDetails = (exam: Exam) => {
    setSelectedExam(exam)
    loadExamQuestions(exam.id)
    setShowDetailsDialog(true)
  }

  const handleApprove = async () => {
    if (!selectedExam) return
    setProcessing(true)
    await onApprove(selectedExam.id)
    setProcessing(false)
    setShowApproveDialog(false)
    setSelectedExam(null)
  }

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason) return
    setProcessing(true)
    await onReject(selectedExam.id, rejectionReason)
    setProcessing(false)
    setShowRejectDialog(false)
    setRejectionReason('')
    setSelectedExam(null)
  }

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const classOrder = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

  const renderExamTable = (exams: Exam[], showActions: boolean = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Marks</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exams.map((exam) => (
          <TableRow key={exam.id}>
            <TableCell className="font-medium">{exam.title}</TableCell>
            <TableCell>{exam.subject}</TableCell>
            <TableCell>
              <Badge variant="outline">{exam.class}</Badge>
            </TableCell>
            <TableCell>{exam.teacher_name || 'Unknown'}</TableCell>
            <TableCell>{exam.total_questions || 0}</TableCell>
            <TableCell>{exam.total_marks || 0}</TableCell>
            <TableCell>{exam.duration} min</TableCell>
            <TableCell>{getStatusBadge(exam.status)}</TableCell>
            <TableCell>{formatDate(exam.submitted_at || exam.created_at)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleViewDetails(exam)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {showActions && exam.status === 'pending' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-green-600"
                      onClick={() => {
                        setSelectedExam(exam)
                        setShowApproveDialog(true)
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-600"
                      onClick={() => {
                        setSelectedExam(exam)
                        setShowRejectDialog(true)
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderClassGrouped = (groupedExams: Record<string, Exam[]>, showActions: boolean = true) => (
    <div className="space-y-4">
      {classOrder.map((className) => {
        const exams = groupedExams[className]
        if (!exams || exams.length === 0) return null
        
        const isExpanded = expandedClass === className
        
        return (
          <Card key={className} className="overflow-hidden">
            <button
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpandedClass(isExpanded ? null : className)}
            >
              <div className="flex items-center gap-4">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-lg">{className}</span>
                </div>
                <Badge className="ml-2">{exams.length} exam{exams.length !== 1 ? 's' : ''}</Badge>
              </div>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0">
                    {renderExamTable(exams, showActions)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )
      })}
    </div>
  )

  // Student Preview Component - Shows exam exactly as students will see it
  const StudentExamPreview = ({ exam, questions }: { exam: Exam, questions: any[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const currentQuestion = questions[currentIndex]

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Exam Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <h3 className="text-xl font-bold">{exam.title}</h3>
          <p className="text-sm text-blue-100">{exam.subject} • {exam.class}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <span>⏱️ {exam.duration} minutes</span>
            <span>📝 {exam.total_questions} questions</span>
            <span>⭐ {exam.total_marks} marks</span>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-gray-50 p-3 border-b">
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all
                  ${idx === currentIndex ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Question {currentIndex + 1} of {questions.length}</p>
        </div>

        {/* Question Display - NO ANSWERS */}
        <div className="p-6 min-h-[300px]">
          {currentQuestion && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={currentQuestion.question_type === 'theory' ? 'secondary' : 'outline'}>
                  {currentQuestion.question_type === 'theory' ? (
                    <><Brain className="h-3 w-3 mr-1" /> Theory</>
                  ) : 'Objective'}
                </Badge>
                <Badge variant="outline">{currentQuestion.points || 1} mark(s)</Badge>
              </div>
              
              <h4 className="text-lg font-medium mb-6">
                {currentIndex + 1}. {currentQuestion.question_text}
              </h4>

              {currentQuestion.question_type === 'theory' ? (
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-amber-700 text-sm">Essay question - students will type their answer here.</p>
                  <div className="mt-3 h-32 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Student answer area</span>
                  </div>
                </div>
              ) : (
                <RadioGroup className="space-y-3">
                  {currentQuestion.options?.map((opt: string, idx: number) => (
                    opt && (
                      <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <RadioGroupItem value={opt} id={`option-${idx}`} disabled />
                        <Label htmlFor={`option-${idx}`} className="flex-1">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                        </Label>
                      </div>
                    )
                  ))}
                </RadioGroup>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-gray-50 p-4 flex justify-between border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {questions.length}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentIndex(prev => prev + 1)}
            disabled={currentIndex === questions.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Exam Approvals
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Review and approve exams submitted by teachers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">
            Pending Approval
            {pendingExams.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white">
                {pendingExams.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Exams by Class</CardTitle>
              <CardDescription>
                {pendingExams.length} exam{pendingExams.length !== 1 ? 's' : ''} waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingExams.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    No pending exams
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    All caught up! No exams waiting for approval.
                  </p>
                </div>
              ) : (
                renderClassGrouped(pendingByClass, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Exams by Class</CardTitle>
              <CardDescription>
                {approvedExams.length} published exam{approvedExams.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedExams.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    No approved exams
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Approved exams will appear here.
                  </p>
                </div>
              ) : (
                renderClassGrouped(approvedByClass, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exam Details Dialog - STUDENT VIEW (No Answers) */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Preview - Student View</DialogTitle>
            <DialogDescription>
              This is exactly how students will see the exam. Answers are hidden.
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam && (
            <div className="space-y-4 py-4">
              {selectedExam.instructions && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <Label className="text-blue-800 dark:text-blue-300 font-medium">Instructions:</Label>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{selectedExam.instructions}</p>
                </div>
              )}

              {loadingQuestions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : examQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No questions found for this exam</p>
                </div>
              ) : (
                <StudentExamPreview exam={selectedExam} questions={examQuestions} />
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
            {selectedExam?.status === 'pending' && (
              <>
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => {
                    setShowDetailsDialog(false)
                    setShowRejectDialog(true)
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Send Back
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailsDialog(false)
                    setShowApproveDialog(true)
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve "{selectedExam?.title}"? 
              This will make it available to all eligible {selectedExam?.class} students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Back for Revision</DialogTitle>
            <DialogDescription>
              Please provide a reason for sending this exam back.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason for Rejection</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Questions need review, formatting issues, etc."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={processing || !rejectionReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}