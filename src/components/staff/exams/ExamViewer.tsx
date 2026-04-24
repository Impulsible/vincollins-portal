// components/staff/exams/ExamViewer.tsx - COMPLETE WITH AUTO-CALCULATION
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, Edit, Send, Calendar, Clock, 
  BookOpen, Award, CheckCircle, AlertCircle, 
  Eye, Loader2, Calculator, Shuffle, RotateCcw,
  Users, FileText, Brain, HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  type: string
  question: string
  options?: string[]
  correct_answer?: string
  marks: number
  order: number
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  pass_mark: number
  shuffle_questions: boolean
  shuffle_options: boolean
  has_theory: boolean
  status: string
  created_at: string
  description?: string
  instructions?: string
  questions?: Question[]
  total_questions?: number
  total_marks?: number
}

interface ExamViewerProps {
  examId: string
  onBack: () => void
  onEdit: () => void
  onSubmitForApproval: (id: string) => Promise<void>
}

export function ExamViewer({ examId, onBack, onEdit, onSubmitForApproval }: ExamViewerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [submitting, setSubmitting] = useState(false)

  const loadExamDetails = useCallback(async () => {
    if (!examId) return
    
    setLoading(true)
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      
      // Extract questions from JSONB
      let extractedQuestions: Question[] = []
      if (examData.questions && Array.isArray(examData.questions)) {
        extractedQuestions = examData.questions.map((q: any, idx: number) => ({
          id: q.id || crypto.randomUUID(),
          type: q.type || 'objective',
          question: q.question || q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks || q.points || 0.5,
          order: q.order || idx + 1
        }))
      }
      
      setExam(examData)
      setQuestions(extractedQuestions)
      
      // ✅ Auto-calculate totals from JSONB
      const totalMarks = extractedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)
      const totalQCount = extractedQuestions.length
      
      console.log('📊 Exam loaded:', { 
        title: examData.title, 
        totalQuestions: totalQCount, 
        totalMarks,
        questionsCount: extractedQuestions.length 
      })
      
    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam details')
    } finally {
      setLoading(false)
    }
  }, [examId])

  useEffect(() => {
    loadExamDetails()
  }, [loadExamDetails])

  const handleSubmit = async () => {
    if (!exam) return
    
    if (questions.length === 0) {
      toast.error('Cannot submit an exam with no questions')
      return
    }

    setSubmitting(true)
    try {
      await onSubmitForApproval(examId)
      setExam({ ...exam, status: 'pending' })
      toast.success('Exam submitted for approval')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
          <CheckCircle className="h-3 w-3 mr-1" /> Published
        </Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0">
          <FileText className="h-3 w-3 mr-1" /> Draft
        </Badge>
      default:
        return <Badge variant="outline">{status || 'Draft'}</Badge>
    }
  }

  const formatDate = (date: string) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ✅ Auto-calculate totals from questions array
  const objectiveQuestions = questions.filter(q => q.type === 'objective' || q.type === 'mcq')
  const theoryQuestions = questions.filter(q => q.type === 'theory')
  const objectiveCount = objectiveQuestions.length
  const theoryCount = theoryQuestions.length
  const totalQuestions = questions.length
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0)
  const passPercentage = exam?.pass_mark || 50
  const pointsNeeded = Math.ceil((passPercentage / 100) * totalMarks)

  if (loading) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32 mt-1" /></div>
          </div>
          <div className="flex gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-muted-foreground">Exam not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-bold">{exam.title}</h1>
              {getStatusBadge(exam.status)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {exam.subject} • {exam.class}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {exam.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit} className="h-8 sm:h-9 text-xs">
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Submit
              </Button>
            </>
          )}
          {exam.status === 'published' && (
            <Button size="sm" onClick={() => router.push(`/staff/exams/${examId}/scores`)} className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs">
              <Calculator className="h-3.5 w-3.5 mr-1" /> Enter Scores
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push(`/staff/exams/${examId}/preview`)} className="h-8 sm:h-9 text-xs">
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
        </div>
      </div>

      {/* Stats Cards - Auto-calculated */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-2.5 sm:p-3 text-center">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold">{totalQuestions}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Total Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-3 text-center">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold">{totalMarks}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Total Marks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-3 text-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold">{exam.duration}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-3 text-center">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold">{exam.pass_mark}%</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Pass Mark</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-2.5 sm:p-3">
            <p className="text-[9px] sm:text-xs text-muted-foreground mb-0.5">Points Needed</p>
            <Progress value={passPercentage} className="h-1.5 sm:h-2 mb-1" />
            <p className="text-xs font-medium">Need {pointsNeeded}/{totalMarks} points</p>
          </CardContent>
        </Card>
      </div>

      {/* Question Breakdown */}
      <div className="flex flex-wrap gap-2">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] sm:text-xs">
            📝 Objective: {objectiveCount} questions • {objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)} marks
            {objectiveCount > 0 && ` (${(objectiveQuestions.reduce((sum, q) => sum + q.marks, 0) / objectiveCount).toFixed(1)} pts avg)`}
          </span>
        </div>
        {theoryCount > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] sm:text-xs">
              ✍️ Theory: {theoryCount} questions • {theoryQuestions.reduce((sum, q) => sum + q.marks, 0)} marks
              {theoryCount > 0 && ` (${(theoryQuestions.reduce((sum, q) => sum + q.marks, 0) / theoryCount).toFixed(1)} pts avg)`}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[280px] sm:max-w-md grid-cols-2 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="questions" className="text-xs sm:text-sm py-1.5">
            Questions ({totalQuestions})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-5 pt-3">
              <CardTitle className="text-base sm:text-lg">Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 sm:px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Created</p><p className="text-xs">{formatDate(exam.created_at)}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Subject</p><p className="text-xs">{exam.subject}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Class</p><p className="text-xs">{exam.class}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Shuffle Questions</p><p className="text-xs">{exam.shuffle_questions ? 'Yes' : 'No'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Shuffle Options</p><p className="text-xs">{exam.shuffle_options ? 'Yes' : 'No'}</p></div>
                </div>
              </div>
              
              {exam.instructions && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">Instructions</p>
                  <p className="text-xs">{exam.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-4 space-y-4">
          {/* Objective Questions */}
          {objectiveQuestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-5 pt-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-sm sm:text-base">Objective Questions</CardTitle>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 pb-4 space-y-3">
                {objectiveQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs sm:text-sm font-medium flex-1">
                        {idx + 1}. {q.question}
                      </p>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {q.marks} pt{q.marks !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1 pl-2">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-[11px] sm:text-xs">
                            {String.fromCharCode(65 + optIdx)}. {opt}
                            {opt === q.correct_answer && <CheckCircle className="h-3 w-3 text-green-600 inline ml-1" />}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Theory Questions */}
          {theoryQuestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-5 pt-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-sm sm:text-base">Theory Questions</CardTitle>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {theoryQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 pb-4 space-y-3">
                {theoryQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs sm:text-sm font-medium flex-1">
                        {idx + 1}. {q.question}
                      </p>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {q.marks} pt{q.marks !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {totalQuestions === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No questions added to this exam yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}