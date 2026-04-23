// components/staff/exams/ExamViewer.tsx - COMPLETELY FIXED
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  Clock, 
  BookOpen, 
  Award, 
  Shuffle, 
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  Eye,
  Play,
  Calculator,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface ExamViewerProps {
  examId: string
  onBack: () => void
  onEdit: () => void
  onSubmitForApproval: (id: string) => void
}

interface ExamDetails {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions: number
  total_marks: number
  has_theory: boolean
  created_at: string
  description: string
  instructions: string
  shuffle_questions: boolean
  shuffle_options: boolean
  pass_mark: number
  created_by?: string
  teacher_name?: string
}

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  points: number
  order_number: number
}

interface TheoryQuestion {
  id: string
  question_text: string
  points: number
  order_number: number
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
        <CheckCircle className="h-3 w-3 mr-1" /> Published
      </Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
        <Clock className="h-3 w-3 mr-1" /> Pending Approval
      </Badge>
    case 'draft':
      return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0">
        <FileText className="h-3 w-3 mr-1" /> Draft
      </Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Loading Skeleton Component
function ExamViewerLoading({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export function ExamViewer({ examId, onBack, onEdit, onSubmitForApproval }: ExamViewerProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [submitting, setSubmitting] = useState(false)

  // Fix hydration: Set mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load exam details with real-time updates
  const loadExamDetails = useCallback(async () => {
    if (!examId) return
    
    setLoading(true)
    try {
      // Load exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_number', { ascending: true })

      if (questionsError) throw questionsError

      if (questionsData) {
        const objectiveQuestions = questionsData.filter((q: any) => 
          !q.question_type || q.question_type === 'objective' || q.question_type === 'mcq'
        )
        const theoryOnes = questionsData.filter((q: any) => 
          q.question_type === 'theory' || q.question_type === 'essay'
        )

        // Parse options for objective questions
        const parsedObjective = objectiveQuestions.map((q: any) => {
          let options = q.options
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options)
            } catch {
              options = ['', '', '', '']
            }
          }
          return { ...q, options: options || ['', '', '', ''] }
        })

        setQuestions(parsedObjective)
        setTheoryQuestions(theoryOnes)
      }
    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [examId])

  // Initial load
  useEffect(() => {
    if (mounted && examId) {
      loadExamDetails()
    }
  }, [mounted, examId, loadExamDetails])

  // Real-time subscription for exam updates
  useEffect(() => {
    if (!mounted || !examId) return

    const subscription = supabase
      .channel(`exam_${examId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exams',
          filter: `id=eq.${examId}`
        },
        (payload) => {
          setExam(payload.new as ExamDetails)
          toast.info('Exam status updated')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `exam_id=eq.${examId}`
        },
        () => {
          loadExamDetails()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted, examId, loadExamDetails])

  const handleSubmit = async () => {
    if (!exam) return
    
    if (questions.length === 0 && theoryQuestions.length === 0) {
      toast.error('Cannot submit an exam with no questions')
      return
    }

    setSubmitting(true)
    try {
      await onSubmitForApproval(examId)
      setExam({ ...exam, status: 'pending' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadExamDetails()
    toast.success('Refreshed exam data')
  }

  const totalQuestions = questions.length + theoryQuestions.length
  const totalObjectiveMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0)
  const totalTheoryMarks = theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0)
  const totalMarks = totalObjectiveMarks + totalTheoryMarks

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <ExamViewerLoading onBack={onBack} />
  }

  if (loading) {
    return <ExamViewerLoading onBack={onBack} />
  }

  if (!exam) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 pt-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Exam Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              The exam you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={onBack} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="exam-viewer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header with proper spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {exam.title}
                </h1>
                {getStatusBadge(exam.status)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {exam.subject} • {exam.class}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            {exam.status === 'draft' && (
              <>
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </>
            )}
            {exam.status === 'published' && (
              <Button onClick={() => router.push(`/staff/exams/${examId}/scores`)}>
                <Calculator className="mr-2 h-4 w-4" />
                Enter Scores
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/staff/exams/${examId}/preview`)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="objective">Objective ({questions.length})</TabsTrigger>
            {exam.has_theory && (
              <TabsTrigger value="theory">Theory ({theoryQuestions.length})</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Questions</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalQuestions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Marks</p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{totalMarks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{exam.duration} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pass Mark</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{exam.pass_mark}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>Created on {formatDate(exam.created_at)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</p>
                    <p className="text-slate-600 dark:text-slate-400">{exam.subject || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Class</p>
                    <p className="text-slate-600 dark:text-slate-400">{exam.class || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Shuffle Questions</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {exam.shuffle_questions ? (
                        <span className="flex items-center gap-1"><Shuffle className="h-3 w-3" /> Yes</span>
                      ) : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Shuffle Options</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {exam.shuffle_options ? (
                        <span className="flex items-center gap-1"><Shuffle className="h-3 w-3" /> Yes</span>
                      ) : 'No'}
                    </p>
                  </div>
                </div>
                
                {(exam.description || exam.instructions) && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Instructions</p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {exam.description || exam.instructions || 'No instructions provided.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Objective Questions Tab */}
          <TabsContent value="objective" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Objective Questions</CardTitle>
                <CardDescription>
                  {questions.length} questions • {totalObjectiveMarks} marks total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No objective questions yet</p>
                    <Button variant="link" onClick={onEdit} className="mt-2">
                      Add questions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium flex-1">
                            <span className="text-slate-500 mr-2">{idx + 1}.</span>
                            {q.question_text}
                          </p>
                          <Badge variant="outline">{q.points} pts</Badge>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="ml-6 mt-3 space-y-1">
                            {q.options.map((opt, optIdx) => (
                              opt && (
                                <p key={optIdx} className="text-sm">
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                  {opt}
                                  {String.fromCharCode(65 + optIdx) === q.correct_answer && (
                                    <Badge className="ml-2 bg-green-100 text-green-700 text-xs border-0">Correct</Badge>
                                  )}
                                </p>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theory Questions Tab */}
          {exam.has_theory && (
            <TabsContent value="theory" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Theory Questions</CardTitle>
                  <CardDescription>
                    {theoryQuestions.length} questions • {totalTheoryMarks} marks total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {theoryQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No theory questions yet</p>
                      <Button variant="link" onClick={onEdit} className="mt-2">
                        Add theory questions
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {theoryQuestions.map((q, idx) => (
                        <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium flex-1">
                              <span className="text-slate-500 mr-2">{idx + 1}.</span>
                              {q.question_text}
                            </p>
                            <Badge variant="outline">{q.points} pts</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </AnimatePresence>
  )
}

// Helper function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}