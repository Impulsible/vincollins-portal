/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/staff/exams/page.tsx - FULLY FIXED
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  PlusCircle, FileText, Trash2, Edit, Loader2,
  ArrowLeft, Search, Copy, Eye, MoreVertical, Send, Clock,
  ChevronLeft, ChevronRight, Play, X,
  Brain, Save, Flag, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Exam {
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
  instructions: string
  description: string
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

interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  position: string
  photo_url?: string
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export default function StaffExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list')
  const [questions, setQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  
  const [editExamDetails, setEditExamDetails] = useState<any>({})
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Question>>({})
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  })
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [previewMode, setPreviewMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [examStarted, setExamStarted] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const authChecked = useRef(false)

  // FIXED: Handle sidebar navigation
  const handleSidebarTabChange = (tab: string) => {
    switch (tab) {
      case 'overview':
        router.push('/staff')
        break
      case 'exams':
        router.push('/staff/exams')
        break
      case 'assignments':
        router.push('/staff/assignments')
        break
      case 'notes':
        router.push('/staff/notes')
        break
      case 'students':
        router.push('/staff/students')
        break
      default:
        router.push('/staff')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending Approval</Badge>
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const allQuestions = useMemo(() => {
    const objQuestions = questions.map(q => ({ ...q, question_type: 'objective' as const }))
    const thQuestions = selectedExam?.has_theory ? theoryQuestions.map(q => ({ ...q, question_type: 'theory' as const })) : []
    return [...objQuestions, ...thQuestions]
  }, [questions, theoryQuestions, selectedExam?.has_theory])

  const currentQuestion = allQuestions[currentIndex]
  const totalQuestions = allQuestions.length
  
  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).length + Object.keys(theoryAnswers).length
  }, [selectedAnswers, theoryAnswers])
  
  const answerProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  const totalObjectiveMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0)
  }, [questions])

  const totalTheoryMarks = useMemo(() => {
    return theoryQuestions.reduce((sum, q) => sum + (q.points || 0), 0)
  }, [theoryQuestions])

  const totalMarks = totalObjectiveMarks + totalTheoryMarks

  useEffect(() => {
    if (previewMode && examStarted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            toast.warning('Time is up! Exam would auto-submit.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [previewMode, examStarted, timeRemaining])

  const loadExams = useCallback(async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('created_by', profileId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setExams(data || [])
      setFilteredExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProfile = useCallback(async () => {
    if (authChecked.current) return
    authChecked.current = true
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/portal')
        return
      }

      const userProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || 
                   session.user.email?.split('@')[0] || 
                   'Teacher',
        email: session.user.email || '',
        department: session.user.user_metadata?.department || 'General',
        position: session.user.user_metadata?.position || 'Teacher',
        photo_url: session.user.user_metadata?.avatar_url || null,
      }
      
      setProfile(userProfile as StaffProfile)
      await loadExams(session.user.id)
      
    } catch (error) {
      console.error('Error loading profile:', error)
      setLoading(false)
    }
  }, [router, loadExams])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    let filtered = [...exams]
    
    if (searchQuery) {
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.subject && exam.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exam.class && exam.class.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter)
    }
    
    setFilteredExams(filtered)
  }, [exams, searchQuery, statusFilter])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const handleExamCreated = () => {
    loadProfile()
    setShowCreateDialog(false)
  }

  const loadQuestionsForExam = async (examId: string) => {
    setLoadingQuestions(true)
    
    try {
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_number', { ascending: true })

      if (questionsData && questionsData.length > 0) {
        const objectiveQuestions = questionsData.filter((q: any) => 
          !q.question_type || q.question_type === 'objective' || q.question_type === 'mcq'
        )
        const theoryOnes = questionsData.filter((q: any) => 
          q.question_type === 'theory' || q.question_type === 'essay'
        )
        
        if (objectiveQuestions.length > 0) {
          const parsed = objectiveQuestions.map((q: any) => {
            let options = q.options
            if (typeof options === 'string') {
              try {
                options = JSON.parse(options)
              } catch {
                options = ['', '', '', '']
              }
            }
            return { 
              ...q, 
              options: options || ['', '', '', ''], 
              points: q.points || 1 
            }
          })
          setQuestions(parsed as Question[])
        } else {
          setQuestions([])
        }
        
        if (theoryOnes.length > 0) {
          setTheoryQuestions(theoryOnes.map((q: any) => ({ ...q, points: q.points || 5 })) as TheoryQuestion[])
        } else {
          setTheoryQuestions([])
        }
      } else {
        setQuestions([])
        setTheoryQuestions([])
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleViewExam = async (exam: Exam) => {
    setSelectedExam(exam)
    setViewMode('view')
    await loadQuestionsForExam(exam.id)
  }

  const handleEditExam = async (exam: Exam) => {
    if (exam.status !== 'draft') {
      toast.error('Only draft exams can be edited')
      return
    }
    setSelectedExam(exam)
    setEditExamDetails({
      title: exam.title,
      subject: exam.subject,
      class: exam.class,
      duration: exam.duration,
      instructions: exam.description || exam.instructions || '',
      pass_mark: exam.pass_mark || 50,
      shuffle_questions: exam.shuffle_questions ?? true,
      shuffle_options: exam.shuffle_options ?? true,
      has_theory: exam.has_theory || false
    })
    setViewMode('edit')
    await loadQuestionsForExam(exam.id)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedExam(null)
    setQuestions([])
    setTheoryQuestions([])
    setPreviewMode(false)
    setExamStarted(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleSaveExamDetails = async () => {
    if (!selectedExam) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: editExamDetails.title,
          subject: editExamDetails.subject,
          class: editExamDetails.class,
          duration: editExamDetails.duration,
          description: editExamDetails.instructions,
          pass_mark: editExamDetails.pass_mark,
          shuffle_questions: editExamDetails.shuffle_questions,
          shuffle_options: editExamDetails.shuffle_options,
          has_theory: editExamDetails.has_theory,
          total_questions: questions.length,
          total_marks: totalMarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedExam.id)

      if (error) throw error

      setSelectedExam({ ...selectedExam, ...editExamDetails, total_marks: totalMarks })
      toast.success('Exam details saved!')
    } catch (error) {
      console.error('Error updating exam:', error)
      toast.error('Failed to save exam details')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!selectedExam) return
    
    if (questions.length === 0 && theoryQuestions.length === 0) {
      toast.error('Cannot submit an exam with no questions')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString(),
          total_marks: totalMarks
        })
        .eq('id', selectedExam.id)

      if (error) throw error

      toast.success('Exam submitted for approval!')
      
      setSelectedExam({ ...selectedExam, status: 'pending' })
      setExams(exams.map(e => e.id === selectedExam.id ? { ...e, status: 'pending' } : e))
      setFilteredExams(filteredExams.map(e => e.id === selectedExam.id ? { ...e, status: 'pending' } : e))
      
      handleBackToList()
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!examToDelete) return

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete.id)

      if (error) throw error

      toast.success('Exam deleted successfully')
      setExams(prev => prev.filter(e => e.id !== examToDelete.id))
      setFilteredExams(prev => prev.filter(e => e.id !== examToDelete.id))
      setDeleteDialogOpen(false)
      setExamToDelete(null)
    } catch (error) {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
    }
  }

  const handleDuplicateExam = async (exam: Exam) => {
    setDuplicating(exam.id)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const createdBy = session.user.id

      const { data: newExam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: `${exam.title} (Copy)`,
          subject: exam.subject,
          class: exam.class,
          duration: exam.duration,
          description: exam.description,
          pass_mark: exam.pass_mark,
          shuffle_questions: exam.shuffle_questions,
          shuffle_options: exam.shuffle_options,
          has_theory: exam.has_theory,
          status: 'draft',
          created_by: createdBy,
          total_questions: 0,
          total_marks: 0
        })
        .select()
        .single()

      if (examError) throw examError

      toast.success('Exam duplicated successfully')
      await loadExams(createdBy)
    } catch (error) {
      console.error('Error duplicating exam:', error)
      toast.error('Failed to duplicate exam')
    } finally {
      setDuplicating(null)
    }
  }

  const handleStartEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id)
    setEditForm({
      question_text: q.question_text,
      options: [...(q.options || ['', '', '', ''])],
      correct_answer: q.correct_answer,
      points: q.points
    })
  }

  const handleSaveQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: editForm.question_text,
          options: editForm.options,
          correct_answer: editForm.correct_answer,
          points: editForm.points
        })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, ...editForm } : q
      ))
      toast.success('Question updated!')
      setEditingQuestionId(null)
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to update question')
    }
  }

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.filter(q => q.id !== questionId))
      toast.success('Question deleted')
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    }
  }

  const handleAddQuestion = async () => {
    if (!selectedExam) return
    if (!newQuestion.question_text || !newQuestion.correct_answer) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const questionData = {
        exam_id: selectedExam.id,
        question_text: newQuestion.question_text,
        question_type: 'mcq',
        options: newQuestion.options,
        correct_answer: newQuestion.correct_answer,
        points: newQuestion.points || 1,
        order_number: questions.length + 1
      }

      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single()

      if (error) throw error

      setQuestions([...questions, { ...data, options: newQuestion.options } as Question])
      toast.success('Question added!')
      setShowAddQuestion(false)
      setNewQuestion({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1
      })
    } catch (error) {
      console.error('Error adding question:', error)
      toast.error('Failed to add question')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const totalSeconds = (selectedExam?.duration || 60) * 60
    const percentLeft = (timeRemaining / totalSeconds) * 100
    
    if (percentLeft <= 10) return 'text-red-600 bg-red-100'
    if (percentLeft <= 25) return 'text-orange-600 bg-orange-100'
    return 'text-blue-600 bg-blue-100'
  }

  const startPreview = () => {
    setTimeRemaining((selectedExam?.duration || 60) * 60)
    setCurrentIndex(0)
    setSelectedAnswers({})
    setTheoryAnswers({})
    setFlaggedQuestions(new Set())
    setExamStarted(false)
    setPreviewMode(true)
  }

  const handleStartExam = () => {
    setExamStarted(true)
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleTheoryAnswerChange = (questionId: string, answer: string) => {
    setTheoryAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const toggleFlag = (id: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72 shrink-0" />
          <div className="flex-1 min-w-0">
            <main className="pt-20 pb-8 min-h-[calc(100vh-5rem)]">
              <div className="container mx-auto px-4 max-w-7xl">
                <Skeleton className="h-12 w-48 mb-6" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full mb-4 rounded-xl" />)}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header onLogout={handleLogout} />
        
        <div className="flex">
          <div className={cn("shrink-0 transition-all duration-300", sidebarCollapsed ? "w-20" : "w-72")}>
            <StaffSidebar 
              profile={profile}
              onLogout={handleLogout}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              activeTab="exams"
              setActiveTab={handleSidebarTabChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            <main className="pt-20 pb-8 min-h-[calc(100vh-5rem)]">
              <div className="container mx-auto px-4 max-w-7xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mb-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Exams</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage your exams</p>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Exam
                    </Button>
                  </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search exams by title, subject, or class..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="draft">Drafts</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="published">Published</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-slate-900 dark:text-white">All Exams</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} total
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredExams.length === 0 ? (
                      <div className="text-center py-16">
                        <FileText className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          No exams found
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                          {statusFilter !== 'all' 
                            ? `No ${statusFilter} exams. Try changing the filter.` 
                            : 'Create your first exam to get started'}
                        </p>
                        {statusFilter === 'all' && (
                          <Button onClick={() => setShowCreateDialog(true)} size="lg">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create Your First Exam
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-semibold">Title</TableHead>
                              <TableHead className="font-semibold">Subject</TableHead>
                              <TableHead className="font-semibold">Class</TableHead>
                              <TableHead className="font-semibold text-center">Questions</TableHead>
                              <TableHead className="font-semibold text-center">Marks</TableHead>
                              <TableHead className="font-semibold text-center">Duration</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold">Created</TableHead>
                              <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredExams.map((exam) => (
                              <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-medium py-4">{exam.title || 'Untitled'}</TableCell>
                                <TableCell className="py-4">{exam.subject || '—'}</TableCell>
                                <TableCell className="py-4">
                                  <Badge variant="outline">{exam.class || '—'}</Badge>
                                </TableCell>
                                <TableCell className="text-center py-4">{exam.total_questions || 0}</TableCell>
                                <TableCell className="text-center py-4">{exam.total_marks || 0}</TableCell>
                                <TableCell className="text-center py-4">{exam.duration || 60} min</TableCell>
                                <TableCell className="py-4">{getStatusBadge(exam.status)}</TableCell>
                                <TableCell className="py-4 text-slate-500 dark:text-slate-400">
                                  {formatDate(exam.created_at)}
                                </TableCell>
                                <TableCell className="text-right py-4">
                                  <div className="flex justify-end gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleViewExam(exam)} 
                                      title="View"
                                      className="h-9 w-9"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {exam.status === 'draft' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleEditExam(exam)} 
                                        title="Edit"
                                        className="h-9 w-9"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDuplicateExam(exam)} 
                                          disabled={duplicating === exam.id}
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          {duplicating === exam.id ? 'Duplicating...' : 'Duplicate'}
                                        </DropdownMenuItem>
                                        {exam.status === 'draft' && (
                                          <DropdownMenuItem onClick={() => { 
                                            setSelectedExam(exam); 
                                            handleSubmitForApproval(); 
                                          }}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Submit for Approval
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-red-600 focus:text-red-600"
                                          onClick={() => { 
                                            setExamToDelete(exam); 
                                            setDeleteDialogOpen(true); 
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>

        <CreateExamDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog} 
          onSuccess={handleExamCreated} 
          teacherProfile={profile} 
        />
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this exam? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExam} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header onLogout={handleLogout} />
      
      <div className="flex">
        <div className={cn("shrink-0 transition-all duration-300", sidebarCollapsed ? "w-20" : "w-72")}>
          <StaffSidebar 
            profile={profile}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab="exams"
            setActiveTab={handleSidebarTabChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          <main className="pt-20 pb-8 min-h-[calc(100vh-5rem)]">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleBackToList}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedExam?.title}</h1>
                      {getStatusBadge(selectedExam?.status || 'draft')}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {selectedExam?.subject} • {selectedExam?.class} • {totalMarks} marks
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {viewMode === 'view' ? (
                    <>
                      {selectedExam?.status === 'draft' && (
                        <Button variant="outline" onClick={() => setViewMode('edit')}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      )}
                      <Button variant="outline" onClick={startPreview}>
                        <Play className="mr-2 h-4 w-4" /> Preview
                      </Button>
                      {selectedExam?.status === 'draft' && (
                        <Button onClick={handleSubmitForApproval} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          Submit for Approval
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setViewMode('view')}>
                        <Eye className="mr-2 h-4 w-4" /> Cancel Edit
                      </Button>
                      <Button onClick={handleSaveExamDetails} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {previewMode ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{selectedExam?.title}</h3>
                        <p className="text-sm text-blue-100">{selectedExam?.subject} • {selectedExam?.class}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg font-bold",
                          getTimerColor()
                        )}>
                          <Clock className="h-4 w-4" />
                          {formatTime(timeRemaining)}
                        </div>
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => setPreviewMode(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-blue-100 mb-1">
                        <span>Question {currentIndex + 1} of {totalQuestions}</span>
                        <span>{answeredCount} of {totalQuestions} answered</span>
                      </div>
                      <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-500 ease-out"
                          style={{ width: `${answerProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {!examStarted ? (
                    <div className="p-8 text-center">
                      <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Ready to start?</h3>
                      <p className="text-slate-500 mb-6">This is a preview of how students will see the exam.</p>
                      <div className="max-w-md mx-auto text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-6">
                        <p className="font-medium mb-2">Exam Instructions:</p>
                        <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                          <li>• Total Questions: {totalQuestions}</li>
                          <li>• Total Marks: {totalMarks}</li>
                          <li>• Duration: {selectedExam?.duration} minutes</li>
                          <li>• Pass Mark: {selectedExam?.pass_mark}%</li>
                        </ul>
                      </div>
                      <Button onClick={handleStartExam} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="mr-2 h-4 w-4" />
                        Start Exam Preview
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-slate-800 border-b p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {allQuestions.map((q, idx) => {
                            const isAnswered = q.question_type === 'theory' ? !!theoryAnswers[q.id] : !!selectedAnswers[q.id]
                            const isFlagged = flaggedQuestions.has(q.id)
                            const isCurrent = idx === currentIndex
                            
                            return (
                              <button
                                key={q.id}
                                onClick={() => navigateToQuestion(idx)}
                                className={cn(
                                  "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                                  isCurrent ? "ring-2 ring-blue-500 ring-offset-2" : "",
                                  q.question_type === 'theory'
                                    ? (isAnswered ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700")
                                    : (isAnswered ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"),
                                  isFlagged && "ring-2 ring-amber-400"
                                )}
                              >
                                {idx + 1}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-xs">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> Answered</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" /> Not Answered</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-500" /> Theory</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded ring-2 ring-amber-400" /> Flagged</span>
                        </div>
                      </div>

                      <div className="p-6 min-h-[400px]">
                        {currentQuestion && (
                          <div className="max-w-3xl mx-auto">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Badge variant={currentQuestion.question_type === 'theory' ? 'secondary' : 'outline'}>
                                  {currentQuestion.question_type === 'theory' ? <><Brain className="h-3 w-3 mr-1" /> Theory</> : 'Objective'}
                                </Badge>
                                <Badge variant="outline">{currentQuestion.points} mark(s)</Badge>
                              </div>
                              <button onClick={() => toggleFlag(currentQuestion.id)} className={cn("p-2 rounded-lg", flaggedQuestions.has(currentQuestion.id) ? "bg-amber-100 text-amber-700" : "hover:bg-gray-100")}>
                                <Flag className="h-4 w-4" />
                              </button>
                            </div>

                            <h4 className="text-lg font-medium mb-6">{currentIndex + 1}. {currentQuestion.question_text}</h4>

                            {currentQuestion.question_type === 'theory' ? (
                              <Textarea
                                value={theoryAnswers[currentQuestion.id] || ''}
                                onChange={(e) => handleTheoryAnswerChange(currentQuestion.id, e.target.value)}
                                placeholder="Type your answer here..."
                                rows={6}
                                className="w-full"
                              />
                            ) : (
                              <RadioGroup
                                value={selectedAnswers[currentQuestion.id] || ''}
                                onValueChange={(v) => handleAnswerSelect(currentQuestion.id, v)}
                                className="space-y-3"
                              >
                                {(currentQuestion as Question).options?.map((opt, idx) => (
                                  opt && (
                                    <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                                      <RadioGroupItem value={opt} id={`preview-${idx}`} />
                                      <Label htmlFor={`preview-${idx}`} className="flex-1 cursor-pointer">
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

                      <div className="bg-gray-50 dark:bg-slate-800 p-4 flex justify-between">
                        <Button variant="outline" onClick={() => navigateToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
                          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        {currentIndex === totalQuestions - 1 ? (
                          <Button className="bg-green-600 hover:bg-green-700">Submit Exam</Button>
                        ) : (
                          <Button variant="outline" onClick={() => navigateToQuestion(currentIndex + 1)}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Tabs defaultValue="objective" className="min-h-[400px]">
                  <TabsList className="mb-4">
                    <TabsTrigger value="objective">Objective ({questions.length})</TabsTrigger>
                    {selectedExam?.has_theory && <TabsTrigger value="theory">Theory ({theoryQuestions.length})</TabsTrigger>}
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="objective" className="min-h-[400px]">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Objective Questions</CardTitle>
                          <CardDescription>{questions.length} questions • {totalObjectiveMarks} marks</CardDescription>
                        </div>
                        {viewMode === 'edit' && (
                          <Button size="sm" onClick={() => setShowAddQuestion(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        {loadingQuestions ? (
                          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
                        ) : questions.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-muted-foreground">No objective questions yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {questions.map((q, idx) => (
                              <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                {viewMode === 'edit' && editingQuestionId === q.id ? (
                                  <div className="space-y-3">
                                    <Textarea value={editForm.question_text || ''} onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })} rows={2} />
                                    <div className="space-y-2">
                                      {editForm.options?.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                          <span className="w-6">{String.fromCharCode(65 + optIdx)}.</span>
                                          <Input value={opt} onChange={(e) => {
                                            const newOpts = [...(editForm.options || [])]
                                            newOpts[optIdx] = e.target.value
                                            setEditForm({ ...editForm, options: newOpts })
                                          }} />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <Select value={editForm.correct_answer} onValueChange={(v) => setEditForm({ ...editForm, correct_answer: v })}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          {editForm.options?.map((opt, i) => opt ? <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</SelectItem> : null)}
                                        </SelectContent>
                                      </Select>
                                      <Input type="number" step="0.5" value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: parseFloat(e.target.value) || 1 })} className="w-24" />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="outline" onClick={handleCancelEditQuestion}>Cancel</Button>
                                      <Button size="sm" onClick={() => handleSaveQuestion(q.id)}>Save</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-start justify-between">
                                      <p className="font-medium">{idx + 1}. {q.question_text}</p>
                                      {viewMode === 'edit' && (
                                        <div className="flex gap-1">
                                          <Button variant="ghost" size="icon" onClick={() => handleStartEditQuestion(q)}><Edit className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                      )}
                                    </div>
                                    {q.options && (
                                      <div className="ml-6 mt-2 space-y-1">
                                        {q.options.map((opt, optIdx) => opt && (
                                          <p key={optIdx} className="text-sm"><span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {opt}</p>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge className="bg-green-100 text-green-700">Answer: {q.correct_answer}</Badge>
                                      <Badge variant="outline">{q.points} point(s)</Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {selectedExam?.has_theory && (
                    <TabsContent value="theory" className="min-h-[400px]">
                      <Card>
                        <CardHeader>
                          <CardTitle>Theory Questions</CardTitle>
                          <CardDescription>{theoryQuestions.length} questions • {totalTheoryMarks} marks</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {theoryQuestions.length === 0 ? (
                            <div className="text-center py-8">
                              <Brain className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                              <p className="text-muted-foreground">No theory questions yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {theoryQuestions.map((q, idx) => (
                                <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                  <p className="font-medium">{idx + 1}. {q.question_text}</p>
                                  <Badge className="mt-2">{q.points} points</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  <TabsContent value="details" className="min-h-[400px]">
                    <Card>
                      <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
                      <CardContent>
                        {viewMode === 'edit' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label>Title</Label><Input value={editExamDetails.title} onChange={(e) => setEditExamDetails({ ...editExamDetails, title: e.target.value })} /></div>
                              <div><Label>Class</Label><Select value={editExamDetails.class} onValueChange={(v) => setEditExamDetails({ ...editExamDetails, class: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select></div>
                              <div><Label>Subject</Label><Input value={editExamDetails.subject} onChange={(e) => setEditExamDetails({ ...editExamDetails, subject: e.target.value })} /></div>
                              <div><Label>Duration (min)</Label><Input type="number" value={editExamDetails.duration} onChange={(e) => setEditExamDetails({ ...editExamDetails, duration: parseInt(e.target.value) || 60 })} /></div>
                            </div>
                            <div><Label>Instructions</Label><Textarea value={editExamDetails.instructions} onChange={(e) => setEditExamDetails({ ...editExamDetails, instructions: e.target.value })} rows={3} /></div>
                            <div className="space-y-3 pt-4 border-t">
                              <div className="flex items-center justify-between">
                                <Label>Shuffle Questions</Label>
                                <Switch checked={editExamDetails.shuffle_questions} onCheckedChange={(v) => setEditExamDetails({ ...editExamDetails, shuffle_questions: v })} />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label>Shuffle Options</Label>
                                <Switch checked={editExamDetails.shuffle_options} onCheckedChange={(v) => setEditExamDetails({ ...editExamDetails, shuffle_options: v })} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{selectedExam?.title}</p></div>
                            <div><p className="text-sm text-muted-foreground">Class</p><p className="font-medium">{selectedExam?.class}</p></div>
                            <div><p className="text-sm text-muted-foreground">Subject</p><p className="font-medium">{selectedExam?.subject}</p></div>
                            <div><p className="text-sm text-muted-foreground">Duration</p><p className="font-medium">{selectedExam?.duration} minutes</p></div>
                            <div><p className="text-sm text-muted-foreground">Pass Mark</p><p className="font-medium">{selectedExam?.pass_mark}%</p></div>
                            <div><p className="text-sm text-muted-foreground">Total Marks</p><p className="font-medium">{totalMarks}</p></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Question</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Question" value={newQuestion.question_text} onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })} rows={2} />
            <div className="space-y-2">
              {newQuestion.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6">{String.fromCharCode(65 + idx)}.</span>
                  <Input placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={opt} onChange={(e) => {
                    const newOpts = [...(newQuestion.options || [])]
                    newOpts[idx] = e.target.value
                    setNewQuestion({ ...newQuestion, options: newOpts })
                  }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newQuestion.correct_answer} onValueChange={(v) => setNewQuestion({ ...newQuestion, correct_answer: v })}>
                <SelectTrigger><SelectValue placeholder="Correct Answer" /></SelectTrigger>
                <SelectContent>
                  {newQuestion.options?.map((opt, i) => opt ? <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</SelectItem> : null)}
                </SelectContent>
              </Select>
              <Input type="number" step="0.5" placeholder="Points" value={newQuestion.points} onChange={(e) => setNewQuestion({ ...newQuestion, points: parseFloat(e.target.value) || 1 })} className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddQuestion(false)}>Cancel</Button>
            <Button onClick={handleAddQuestion}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}