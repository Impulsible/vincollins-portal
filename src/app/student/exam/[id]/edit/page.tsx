/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/staff/exams/[id]/edit/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react' // ✅ Added useMemo
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress' // ✅ Moved import up
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog' // ✅ Moved import up
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  Loader2,
  FileText,
  Brain,
  Upload,
  FileUp,
  Download,
  AlertCircle,
  CheckCheck,
  Sparkles,
  Wand2,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Shield,
  Flag,
  Award,
  Edit,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import mammoth from 'mammoth'

interface Question {
  id: string
  question_text: string
  type: string
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

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  instructions: string
  status: string
  total_questions: number
  total_marks: number
  has_theory: boolean
  shuffle_questions: boolean
  shuffle_options: boolean
  negative_marking: boolean
  negative_marking_value: number
  pass_mark: number
  created_at: string
  published_at: string | null
  created_by: string
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

const jssSubjects = [
  'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Christian Religious Studies',
  'Islamic Religious Studies', 'Business Studies', 'Home Economics',
  'Agricultural Science', 'Physical and Health Education',
  'Computer Studies', 'Cultural and Creative Arts', 'French',
  'Hausa', 'Igbo', 'Yoruba'
]

const ssSubjects = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science'
]

// CBT Preview Component
function CBTPreview({ examDetails, questions, theoryQuestions, hasTheory }: {
  examDetails: any
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState((examDetails.duration || 60) * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const allQuestions = useMemo(() => {
    const objQuestions = questions.map(q => ({ ...q, type: 'objective' as const }))
    const thQuestions = hasTheory ? theoryQuestions.map(q => ({ ...q, type: 'theory' as const })) : []
    return [...objQuestions, ...thQuestions]
  }, [questions, theoryQuestions, hasTheory])
  
  const currentQuestion = allQuestions[currentIndex]
  const totalQuestions = allQuestions.length
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0
  
  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).length + Object.keys(theoryAnswers).length
  }, [selectedAnswers, theoryAnswers])

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            if (timerRef.current) clearInterval(timerRef.current)
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
  }, [isTimerRunning])

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
    const totalSeconds = (examDetails.duration || 60) * 60
    const percentLeft = (timeRemaining / totalSeconds) * 100
    
    if (percentLeft <= 10) return 'text-red-600 bg-red-100'
    if (percentLeft <= 25) return 'text-orange-600 bg-orange-100'
    return 'text-blue-600 bg-blue-100'
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

  useEffect(() => {
    setTimeRemaining((examDetails.duration || 60) * 60)
    setIsTimerRunning(true)
  }, [examDetails.duration])

  return (
    <div className="min-h-[500px] bg-gray-50 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{examDetails.title || 'Untitled Exam'}</h3>
            <p className="text-sm text-blue-100">{examDetails.subject} • {examDetails.class}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg font-bold",
              getTimerColor()
            )}>
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
            <Badge className="bg-white/20 text-white">
              <Award className="h-3 w-3 mr-1" /> Pass: {examDetails.pass_mark || 50}%
            </Badge>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-blue-100 mb-1">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-800" />
        </div>
      </div>

      <div className="bg-white border-b p-3">
        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
          {allQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => navigateToQuestion(idx)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-all flex-shrink-0 hover:scale-105",
                idx === currentIndex ? "ring-2 ring-blue-500 ring-offset-2" : "",
                q.type === 'theory' ? "bg-purple-100 text-purple-700 border border-purple-300" : "bg-gray-100 text-gray-600 border border-gray-300"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 min-h-[300px]">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={currentQuestion.type === 'theory' ? 'secondary' : 'outline'}>
                {currentQuestion.type === 'theory' ? <><Brain className="h-3 w-3 mr-1" /> Theory</> : <>Objective</>}
              </Badge>
              <Badge variant="outline">{currentQuestion.points} mark(s)</Badge>
            </div>

            <h4 className="text-lg font-medium mb-6">
              {currentIndex + 1}. {currentQuestion.question_text}
            </h4>

            {currentQuestion.type === 'theory' ? (
              <Textarea placeholder="Student answer will appear here..." rows={5} className="w-full" disabled />
            ) : (
              <div className="space-y-3">
                {(currentQuestion as Question).options?.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border-t p-4 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigateToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" /> Preview Mode
        </div>
        <Button variant="outline" onClick={() => navigateToQuestion(currentIndex + 1)} disabled={currentIndex === totalQuestions - 1}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function EditExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [hasTheory, setHasTheory] = useState(false)
  
  const [examDetails, setExamDetails] = useState({
    title: '',
    subject: '',
    class: '',
    duration: 60,
    instructions: '',
    pass_mark: 50,
    shuffle_questions: true,
    shuffle_options: true,
    negative_marking: false,
    negative_marking_value: 0.5
  })
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editingTheoryQuestion, setEditingTheoryQuestion] = useState<TheoryQuestion | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showTheoryDialog, setShowTheoryDialog] = useState(false)
  
  const authChecked = useRef(false)

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return []
    return examDetails.class.startsWith('JSS') ? jssSubjects : ssSubjects
  }, [examDetails.class])

  const loadExamData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name || 'Teacher',
          email: profileData.email || session.user.email || '',
          department: profileData.department || 'General',
          position: profileData.position || 'Teacher',
          photo_url: profileData.photo_url,
        })
      }

      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      
      const examWithDefaults = {
        ...examData,
        shuffle_questions: examData.shuffle_questions ?? true,
        shuffle_options: examData.shuffle_options ?? true,
        negative_marking: examData.negative_marking ?? false,
        negative_marking_value: examData.negative_marking_value ?? 0.5,
        pass_mark: examData.pass_mark ?? 50
      }
      
      setExam(examWithDefaults as Exam)
      setHasTheory(examData.has_theory || false)
      setExamDetails({
        title: examData.title || '',
        subject: examData.subject || '',
        class: examData.class || '',
        duration: examData.duration || 60,
        instructions: examData.description || examData.instructions || '',
        pass_mark: examData.pass_mark || 50,
        shuffle_questions: examWithDefaults.shuffle_questions,
        shuffle_options: examWithDefaults.shuffle_options,
        negative_marking: examWithDefaults.negative_marking,
        negative_marking_value: examWithDefaults.negative_marking_value
      })

      // Load objective questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .eq('type', 'objective')
        .order('order_number', { ascending: true })

      if (!questionsError && questionsData) {
        setQuestions(questionsData as Question[])
      }

      // Load theory questions
      if (examData.has_theory) {
        const { data: theoryData, error: theoryError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .eq('type', 'theory')
          .order('order_number', { ascending: true })

        if (!theoryError && theoryData) {
          setTheoryQuestions(theoryData as TheoryQuestion[])
        }
      }

    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => {
    if (!authChecked.current) {
      authChecked.current = true
      loadExamData()
    }
  }, [loadExamData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const handleSaveExam = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: examDetails.title,
          subject: examDetails.subject,
          class: examDetails.class,
          duration: examDetails.duration,
          description: examDetails.instructions,
          pass_mark: examDetails.pass_mark,
          shuffle_questions: examDetails.shuffle_questions,
          shuffle_options: examDetails.shuffle_options,
          negative_marking: examDetails.negative_marking,
          negative_marking_value: examDetails.negative_marking_value,
          has_theory: hasTheory,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error

      toast.success('Exam updated successfully!')
      router.push('/staff/exams')
    } catch (error) {
      console.error('Error updating exam:', error)
      toast.error('Failed to update exam')
    } finally {
      setSaving(false)
    }
  }

  const handleAddQuestion = async (questionData: Partial<Question>) => {
    try {
      const newQuestion = {
        exam_id: examId,
        question_text: questionData.question_text,
        type: 'objective',
        options: questionData.options,
        correct_answer: questionData.correct_answer,
        points: questionData.points || 1,
        order_number: questions.length + 1
      }

      const { data, error } = await supabase
        .from('questions')
        .insert([newQuestion])
        .select()
        .single()

      if (error) throw error

      setQuestions([...questions, data as Question])
      
      // Update total questions count
      await supabase
        .from('exams')
        .update({ total_questions: questions.length + 1 })
        .eq('id', examId)

      toast.success('Question added')
      setShowQuestionDialog(false)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error adding question:', error)
      toast.error('Failed to add question')
    }
  }

  const handleUpdateQuestion = async (questionId: string, questionData: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: questionData.question_text,
          options: questionData.options,
          correct_answer: questionData.correct_answer,
          points: questionData.points
        })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.map(q => q.id === questionId ? { ...q, ...questionData } : q))
      toast.success('Question updated')
      setShowQuestionDialog(false)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to update question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      const updatedQuestions = questions.filter(q => q.id !== questionId)
      setQuestions(updatedQuestions)
      
      await supabase
        .from('exams')
        .update({ total_questions: updatedQuestions.length })
        .eq('id', examId)

      toast.success('Question deleted')
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    }
  }

  const handleAddTheoryQuestion = async (questionData: Partial<TheoryQuestion>) => {
    try {
      const newQuestion = {
        exam_id: examId,
        question_text: questionData.question_text,
        type: 'theory',
        points: questionData.points || 5,
        order_number: theoryQuestions.length + 1
      }

      const { data, error } = await supabase
        .from('questions')
        .insert([newQuestion])
        .select()
        .single()

      if (error) throw error

      setTheoryQuestions([...theoryQuestions, data as TheoryQuestion])
      toast.success('Theory question added')
      setShowTheoryDialog(false)
      setEditingTheoryQuestion(null)
    } catch (error) {
      console.error('Error adding theory question:', error)
      toast.error('Failed to add theory question')
    }
  }

  const handleUpdateTheoryQuestion = async (questionId: string, questionData: Partial<TheoryQuestion>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: questionData.question_text,
          points: questionData.points
        })
        .eq('id', questionId)

      if (error) throw error

      setTheoryQuestions(theoryQuestions.map(q => q.id === questionId ? { ...q, ...questionData } : q))
      toast.success('Question updated')
      setShowTheoryDialog(false)
      setEditingTheoryQuestion(null)
    } catch (error) {
      console.error('Error updating theory question:', error)
      toast.error('Failed to update theory question')
    }
  }

  const handleDeleteTheoryQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this theory question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      setTheoryQuestions(theoryQuestions.filter(q => q.id !== questionId))
      toast.success('Question deleted')
    } catch (error) {
      console.error('Error deleting theory question:', error)
      toast.error('Failed to delete question')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72" />
          <div className="flex-1">
            <main className="pt-20 pb-8">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="space-y-6">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-96 w-full rounded-xl" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header onLogout={handleLogout} />
      
      <div className="flex">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="exams"
          setActiveTab={() => {}}
        />

        <div className="flex-1">
          <main className="pt-20 pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link href="/staff/exams">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Edit Exam
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {exam?.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/staff/exams/${examId}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button onClick={handleSaveExam} disabled={saving} className="bg-primary">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </motion.div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="questions">Objective ({questions.length})</TabsTrigger>
                  <TabsTrigger value="theory">Theory ({theoryQuestions.length})</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle>Exam Details</CardTitle>
                      <CardDescription>Edit the basic information about this exam</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Exam Title *</Label>
                          <Input 
                            value={examDetails.title} 
                            onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Label>Class *</Label>
                          <Select value={examDetails.class} onValueChange={(v) => setExamDetails({ ...examDetails, class: v, subject: '' })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Subject *</Label>
                          <Select value={examDetails.subject} onValueChange={(v) => setExamDetails({ ...examDetails, subject: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Duration (minutes) *</Label>
                          <Input 
                            type="number" 
                            value={examDetails.duration} 
                            onChange={(e) => setExamDetails({ ...examDetails, duration: parseInt(e.target.value) || 60 })} 
                          />
                        </div>
                        <div>
                          <Label>Pass Mark (%)</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={examDetails.pass_mark} 
                            onChange={(e) => setExamDetails({ ...examDetails, pass_mark: parseInt(e.target.value) || 50 })} 
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Instructions</Label>
                        <Textarea 
                          value={examDetails.instructions} 
                          onChange={(e) => setExamDetails({ ...examDetails, instructions: e.target.value })} 
                          rows={3}
                        />
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Shuffle Questions</Label>
                            <p className="text-xs text-muted-foreground">Randomize question order for each student</p>
                          </div>
                          <Switch 
                            checked={examDetails.shuffle_questions} 
                            onCheckedChange={(v) => setExamDetails({ ...examDetails, shuffle_questions: v })} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Shuffle Options</Label>
                            <p className="text-xs text-muted-foreground">Randomize answer options order</p>
                          </div>
                          <Switch 
                            checked={examDetails.shuffle_options} 
                            onCheckedChange={(v) => setExamDetails({ ...examDetails, shuffle_options: v })} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Negative Marking</Label>
                            <p className="text-xs text-muted-foreground">Deduct points for wrong answers</p>
                          </div>
                          <Switch 
                            checked={examDetails.negative_marking} 
                            onCheckedChange={(v) => setExamDetails({ ...examDetails, negative_marking: v })} 
                          />
                        </div>
                        {examDetails.negative_marking && (
                          <div>
                            <Label>Negative Marking Value</Label>
                            <Input 
                              type="number" 
                              step="0.5" 
                              value={examDetails.negative_marking_value} 
                              onChange={(e) => setExamDetails({ ...examDetails, negative_marking_value: parseFloat(e.target.value) })} 
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Include Theory Questions</Label>
                            <p className="text-xs text-muted-foreground">Add essay-type questions to this exam</p>
                          </div>
                          <Switch checked={hasTheory} onCheckedChange={setHasTheory} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Objective Questions Tab */}
                <TabsContent value="questions">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Objective Questions</CardTitle>
                        <CardDescription>{questions.length} questions</CardDescription>
                      </div>
                      <Button onClick={() => { setEditingQuestion(null); setShowQuestionDialog(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {questions.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-muted-foreground">No objective questions yet</p>
                          <Button variant="link" onClick={() => setShowQuestionDialog(true)}>Add your first question</Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {questions.map((q, idx) => (
                            <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {idx + 1}. {q.question_text}
                                  </p>
                                  <div className="ml-6 mt-2 space-y-1">
                                    {q.options?.map((opt, optIdx) => (
                                      <p key={optIdx} className="text-sm">
                                        <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                                      </p>
                                    ))}
                                  </div>
                                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                    Answer: {q.correct_answer} • {q.points} point(s)
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => { setEditingQuestion(q); setShowQuestionDialog(true); }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteQuestion(q.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Theory Questions Tab */}
                <TabsContent value="theory">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Theory Questions</CardTitle>
                        <CardDescription>{theoryQuestions.length} questions</CardDescription>
                      </div>
                      {hasTheory && (
                        <Button onClick={() => { setEditingTheoryQuestion(null); setShowTheoryDialog(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Theory Question
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {!hasTheory ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Theory questions are disabled. Enable them in the Details tab.
                          </AlertDescription>
                        </Alert>
                      ) : theoryQuestions.length === 0 ? (
                        <div className="text-center py-12">
                          <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-muted-foreground">No theory questions yet</p>
                          <Button variant="link" onClick={() => setShowTheoryDialog(true)}>Add your first theory question</Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {theoryQuestions.map((q, idx) => (
                            <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {idx + 1}. {q.question_text}
                                  </p>
                                  <Badge className="mt-2">{q.points} points</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => { setEditingTheoryQuestion(q); setShowTheoryDialog(true); }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteTheoryQuestion(q.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview">
                  <Card>
                    <CardHeader>
                      <CardTitle>CBT Preview</CardTitle>
                      <CardDescription>See how students will view this exam</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CBTPreview 
                        examDetails={examDetails}
                        questions={questions}
                        theoryQuestions={theoryQuestions}
                        hasTheory={hasTheory}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Objective Question'}</DialogTitle>
          </DialogHeader>
          <QuestionForm 
            initialData={editingQuestion || undefined}
            onSave={(data) => {
              if (editingQuestion) {
                handleUpdateQuestion(editingQuestion.id, data)
              } else {
                handleAddQuestion(data)
              }
            }}
            onCancel={() => {
              setShowQuestionDialog(false)
              setEditingQuestion(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Theory Question Dialog */}
      <Dialog open={showTheoryDialog} onOpenChange={setShowTheoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTheoryQuestion ? 'Edit Theory Question' : 'Add Theory Question'}</DialogTitle>
          </DialogHeader>
          <TheoryQuestionForm 
            initialData={editingTheoryQuestion || undefined}
            onSave={(data) => {
              if (editingTheoryQuestion) {
                handleUpdateTheoryQuestion(editingTheoryQuestion.id, data)
              } else {
                handleAddTheoryQuestion(data)
              }
            }}
            onCancel={() => {
              setShowTheoryDialog(false)
              setEditingTheoryQuestion(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Question Form Component
function QuestionForm({ initialData, onSave, onCancel }: { 
  initialData?: Partial<Question>
  onSave: (data: Partial<Question>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    question_text: initialData?.question_text || '',
    options: initialData?.options || ['', '', '', ''],
    correct_answer: initialData?.correct_answer || '',
    points: initialData?.points || 1
  })

  const handleSubmit = () => {
    if (!formData.question_text || !formData.correct_answer) {
      toast.error('Please fill in all required fields')
      return
    }
    onSave(formData)
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <Label>Question *</Label>
        <Textarea 
          value={formData.question_text} 
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} 
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Options</Label>
        {formData.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-6">{String.fromCharCode(65 + idx)}.</span>
            <Input 
              value={opt} 
              onChange={(e) => {
                const newOpts = [...formData.options]
                newOpts[idx] = e.target.value
                setFormData({ ...formData, options: newOpts })
              }} 
            />
          </div>
        ))}
      </div>
      <div>
        <Label>Correct Answer *</Label>
        <Select value={formData.correct_answer} onValueChange={(v) => setFormData({ ...formData, correct_answer: v })}>
          <SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger>
          <SelectContent>
            {formData.options.map((opt, i) => opt ? (
              <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</SelectItem>
            ) : null)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Points</Label>
        <Input 
          type="number" 
          step="0.5" 
          min="0.5" 
          value={formData.points} 
          onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 1 })} 
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{initialData ? 'Update' : 'Add'} Question</Button>
      </DialogFooter>
    </div>
  )
}

// Theory Question Form Component
function TheoryQuestionForm({ initialData, onSave, onCancel }: { 
  initialData?: Partial<TheoryQuestion>
  onSave: (data: Partial<TheoryQuestion>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    question_text: initialData?.question_text || '',
    points: initialData?.points || 5
  })

  const handleSubmit = () => {
    if (!formData.question_text) {
      toast.error('Please enter a question')
      return
    }
    onSave(formData)
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <Label>Question *</Label>
        <Textarea 
          value={formData.question_text} 
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} 
          rows={4}
        />
      </div>
      <div>
        <Label>Points</Label>
        <Input 
          type="number" 
          min="1" 
          max="100" 
          value={formData.points} 
          onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 5 })} 
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{initialData ? 'Update' : 'Add'} Question</Button>
      </DialogFooter>
    </div>
  )
}