// components/staff/exams/ExamEditor.tsx - FULLY RESPONSIVE WITH JSONB, AUTO-CALCULATION
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Save, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Loader2,
  BookOpen,
  Brain,
  Calculator,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Menu,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return
    
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)
    
    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
    // Fallback for older browsers
    else {
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [query])

  return matches
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

interface ExamEditorProps {
  examId: string
  onBack: () => void
  onCancel: () => void
  onSave: () => void
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
  questions?: any[]
  exam_type?: string
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

export function ExamEditor({ examId, onBack, onCancel, onSave }: ExamEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [editForm, setEditForm] = useState<Partial<ExamDetails>>({})
  const [questions, setQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [activeTab, setActiveTab] = useState('details')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  
  // Point settings
  const [objectivePointsPerQuestion, setObjectivePointsPerQuestion] = useState<number>(0.5)
  const [theoryPointsPerQuestion, setTheoryPointsPerQuestion] = useState<number>(5)
  
  // Question editing states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editQuestionForm, setEditQuestionForm] = useState<Partial<Question>>({})
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 0.5
  })
  
  // Theory question states
  const [showAddTheory, setShowAddTheory] = useState(false)
  const [newTheory, setNewTheory] = useState<Partial<TheoryQuestion>>({
    question_text: '',
    points: 5
  })

  // ✅ Auto-calculate totals
  const objectiveCount = questions.length
  const theoryCount = theoryQuestions.length
  const totalQuestions = objectiveCount + theoryCount
  const totalObjectiveMarks = questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const totalTheoryMarks = theoryQuestions.reduce((sum, q) => sum + (q.points || 0), 0)
  const totalMarks = totalObjectiveMarks + totalTheoryMarks
  const avgObjectivePoints = objectiveCount > 0 ? totalObjectiveMarks / objectiveCount : 0
  const avgTheoryPoints = theoryCount > 0 ? totalTheoryMarks / theoryCount : 0
  const passPercentage = totalMarks > 0 ? ((editForm.pass_mark || 50) / totalMarks) * 100 : 0

  useEffect(() => {
    loadExamData()
  }, [examId])

  // Close mobile menu on tab change
  useEffect(() => {
    setShowMobileMenu(false)
  }, [activeTab])

  const loadExamData = async () => {
    setLoading(true)
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      
      if (examData.status !== 'draft') {
        toast.error('Only draft exams can be edited')
        onBack()
        return
      }

      setExam(examData)
      setEditForm({
        title: examData.title,
        subject: examData.subject,
        class: examData.class,
        duration: examData.duration,
        description: examData.description || '',
        pass_mark: examData.pass_mark || 50,
        shuffle_questions: examData.shuffle_questions ?? true,
        shuffle_options: examData.shuffle_options ?? true,
        has_theory: examData.has_theory || false
      })

      // Extract questions from JSONB
      if (examData.questions && Array.isArray(examData.questions)) {
        const objective = examData.questions.filter((q: any) => q.type === 'objective' || q.type === 'mcq')
        const theory = examData.questions.filter((q: any) => q.type === 'theory')
        
        const parsedObjective = objective.map((q: any, idx: number) => ({
          id: q.id || crypto.randomUUID(),
          question_text: q.question,
          question_type: 'objective',
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer || '',
          points: q.marks || q.points || 0.5,
          order_number: q.order || idx + 1
        }))
        
        const parsedTheory = theory.map((q: any, idx: number) => ({
          id: q.id || crypto.randomUUID(),
          question_text: q.question,
          points: q.marks || q.points || 5,
          order_number: q.order || idx + 1
        }))
        
        setQuestions(parsedObjective)
        setTheoryQuestions(parsedTheory)
        
        if (parsedObjective.length > 0 && parsedObjective[0].points) {
          setObjectivePointsPerQuestion(parsedObjective[0].points)
        }
        if (parsedTheory.length > 0 && parsedTheory[0].points) {
          setTheoryPointsPerQuestion(parsedTheory[0].points)
        }
      }
    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam data')
    } finally {
      setLoading(false)
    }
  }

  // Update all objective questions points
  const updateAllObjectivePoints = () => {
    setQuestions(prev => prev.map(q => ({ ...q, points: objectivePointsPerQuestion })))
    toast.success(`All ${questions.length} objective questions set to ${objectivePointsPerQuestion} point(s)`)
  }

  const updateAllTheoryPoints = () => {
    setTheoryQuestions(prev => prev.map(q => ({ ...q, points: theoryPointsPerQuestion })))
    toast.success(`All ${theoryQuestions.length} theory questions set to ${theoryPointsPerQuestion} point(s)`)
  }

  const handleSaveDetails = async () => {
    setSaving(true)
    try {
      // Build questions array for JSONB
      const questionsArray: any[] = []
      
      questions.forEach((q, idx) => {
        questionsArray.push({
          id: q.id,
          type: 'objective',
          question: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.points,
          order: idx + 1
        })
      })
      
      theoryQuestions.forEach((q, idx) => {
        questionsArray.push({
          id: q.id,
          type: 'theory',
          question: q.question_text,
          marks: q.points,
          order: questions.length + idx + 1
        })
      })

      const { error } = await supabase
        .from('exams')
        .update({
          title: editForm.title,
          subject: editForm.subject,
          class: editForm.class,
          duration: editForm.duration,
          description: editForm.description,
          pass_mark: editForm.pass_mark,
          shuffle_questions: editForm.shuffle_questions,
          shuffle_options: editForm.shuffle_options,
          has_theory: editForm.has_theory,
          total_questions: totalQuestions,
          total_marks: totalMarks,
          questions: questionsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error

      toast.success(`Exam updated! Total: ${totalMarks} marks from ${totalQuestions} questions.`)
    } catch (error) {
      console.error('Error saving exam:', error)
      toast.error('Failed to save exam details')
    } finally {
      setSaving(false)
    }
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text || !newQuestion.correct_answer) {
      toast.error('Please fill in all required fields')
      return
    }

    const newQ: Question = {
      id: crypto.randomUUID(),
      question_text: newQuestion.question_text || '',
      question_type: 'objective',
      options: newQuestion.options || ['', '', '', ''],
      correct_answer: newQuestion.correct_answer || '',
      points: newQuestion.points || objectivePointsPerQuestion,
      order_number: questions.length + 1
    }
    
    setQuestions([...questions, newQ])
    toast.success(`Question added (${newQ.points} point(s))`)
    setShowAddQuestion(false)
    setNewQuestion({
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: objectivePointsPerQuestion
    })
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId) return
    
    setQuestions(questions.map(q => 
      q.id === editingQuestionId ? { ...q, ...editQuestionForm } : q
    ))
    toast.success('Question updated')
    setEditingQuestionId(null)
    setEditQuestionForm({})
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return
    setQuestions(questions.filter(q => q.id !== questionId))
    toast.success('Question deleted')
  }

  const handleAddTheory = async () => {
    if (!newTheory.question_text) {
      toast.error('Please enter a question')
      return
    }

    const newT: TheoryQuestion = {
      id: crypto.randomUUID(),
      question_text: newTheory.question_text || '',
      points: newTheory.points || theoryPointsPerQuestion,
      order_number: theoryQuestions.length + 1
    }
    
    setTheoryQuestions([...theoryQuestions, newT])
    toast.success(`Theory question added (${newT.points} point(s))`)
    setShowAddTheory(false)
    setNewTheory({ question_text: '', points: theoryPointsPerQuestion })
  }

  const handleDeleteTheory = async (questionId: string) => {
    if (!confirm('Delete this theory question?')) return
    setTheoryQuestions(theoryQuestions.filter(q => q.id !== questionId))
    toast.success('Theory question deleted')
  }

  const handleFinish = async () => {
    await handleSaveDetails()
    onSave()
  }

  // Points Summary Component
  const PointsSummary = () => (
    <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-3 sm:p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <h3 className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-300">Exam Points Summary</h3>
        </div>
        
        {/* Mobile: stacked stats */}
        <div className="block sm:hidden space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Objective</span>
            <div className="text-right">
              <span className="font-semibold text-sm">{objectiveCount} questions</span>
              <span className="text-xs text-muted-foreground ml-2">•</span>
              <span className="font-semibold text-sm ml-2">{totalObjectiveMarks} pts</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Theory</span>
            <div className="text-right">
              <span className="font-semibold text-sm">{theoryCount} questions</span>
              <span className="text-xs text-muted-foreground ml-2">•</span>
              <span className="font-semibold text-sm ml-2">{totalTheoryMarks} pts</span>
            </div>
          </div>
          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Total</span>
              <span className="text-base font-bold text-blue-700">{totalMarks} marks</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-muted-foreground">Pass Mark</span>
              <span className="text-xs font-medium">{editForm.pass_mark || 50} ({Math.round(passPercentage)}%)</span>
            </div>
            <Progress value={passPercentage} className="h-1.5 mt-2" />
          </div>
        </div>
        
        {/* Desktop: grid stats */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{objectiveCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Objective Qs</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{totalObjectiveMarks}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Obj Points</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">({avgObjectivePoints.toFixed(1)} pts avg)</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{theoryCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Theory Qs</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{totalTheoryMarks}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Theory Points</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">({avgTheoryPoints.toFixed(1)} pts avg)</p>
          </div>
        </div>
        
        {/* Desktop summary footer */}
        <div className="hidden sm:block mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-xs sm:text-sm font-medium">Total Exam Points:</span>
            <span className="text-base sm:text-lg font-bold text-blue-700">{totalMarks}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm mt-1">
            <span className="text-muted-foreground">Pass Mark:</span>
            <span className="font-medium">{editForm.pass_mark || 50} / {totalMarks} ({Math.round(passPercentage)}%)</span>
          </div>
          <Progress value={passPercentage} className="h-1.5 mt-2" />
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-6 w-32" /></div>
          <div className="flex gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
        </div>
        <Skeleton className="h-32 sm:h-40 w-full rounded-xl" />
        <Skeleton className="h-64 sm:h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-sm sm:text-base text-muted-foreground">Exam not found</p>
        <Button onClick={onBack} className="mt-4" size={isMobile ? "sm" : "default"}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">Edit Exam</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{exam.title}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {isMobile ? (
            <>
              <Button variant="outline" onClick={onCancel} size="sm" className="h-8 text-xs">
                Cancel
              </Button>
              <Button onClick={handleFinish} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel} className="h-9 text-sm">Cancel</Button>
              <Button onClick={handleFinish} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm">
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                Save & Finish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Points Summary */}
      <PointsSummary />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div 
          className={cn(
            "flex items-center justify-between gap-2 mb-4",
            isMobile ? "flex-col" : ""
          )}
        >
          <TabsList className={cn(
            "grid w-full grid-cols-3 h-auto p-1 bg-muted",
            isMobile ? "w-full" : "max-w-[320px] sm:max-w-md"
          )}>
            <TabsTrigger value="details" className="text-xs sm:text-sm py-1.5 px-2 sm:px-4" title="Exam Details">
              {isMobile ? (
                <span className="flex flex-col items-center">
                  <span>Details</span>
                </span>
              ) : (
                'Details'
              )}
            </TabsTrigger>
            <TabsTrigger value="objective" className="text-xs sm:text-sm py-1.5 px-2 sm:px-4" title="Objective Questions">
              {isMobile ? (
                <span className="flex flex-col items-center">
                  <span>Obj</span>
                  <span className="text-[10px]">({questions.length})</span>
                </span>
              ) : (
                `Objective (${questions.length})`
              )}
            </TabsTrigger>
            <TabsTrigger value="theory" className="text-xs sm:text-sm py-1.5 px-2 sm:px-4" title="Theory Questions">
              {isMobile ? (
                <span className="flex flex-col items-center">
                  <span>Theory</span>
                  <span className="text-[10px]">({theoryQuestions.length})</span>
                </span>
              ) : (
                `Theory (${theoryQuestions.length})`
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Quick add button on mobile */}
          {isMobile && activeTab !== 'details' && (
            <Button
              onClick={() => activeTab === 'objective' ? setShowAddQuestion(true) : setShowAddTheory(true)}
              size="sm"
              className="w-full h-8 text-xs"
            >
              <PlusCircle className="mr-1 h-3.5 w-3.5" />
              Add {activeTab === 'objective' ? 'Objective' : 'Theory'}
            </Button>
          )}
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-0 space-y-4">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-5 pt-3 sm:pt-4">
              <CardTitle className="text-base sm:text-lg">Exam Details</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Edit basic exam information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-5 pb-4 sm:pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs sm:text-sm">Title</Label>
                  <Input 
                    value={editForm.title || ''} 
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                    className="mt-1 h-9 sm:h-10 text-sm" 
                    placeholder="Exam title"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Subject</Label>
                  <Input 
                    value={editForm.subject || ''} 
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} 
                    className="mt-1 h-9 sm:h-10 text-sm" 
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Class</Label>
                  <Select value={editForm.class} onValueChange={(value) => setEditForm({ ...editForm, class: value })}>
                    <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Duration (min)</Label>
                  <Input 
                    type="number" 
                    value={editForm.duration || 60} 
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 60 })} 
                    className="mt-1 h-9 sm:h-10 text-sm" 
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Pass Mark (%)</Label>
                  <Input 
                    type="number" 
                    value={editForm.pass_mark || 50} 
                    onChange={(e) => setEditForm({ ...editForm, pass_mark: parseInt(e.target.value) || 50 })} 
                    className="mt-1 h-9 sm:h-10 text-sm" 
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Instructions / Description</Label>
                <Textarea 
                  value={editForm.description || ''} 
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                  rows={isMobile ? 2 : 3} 
                  className="mt-1 text-sm resize-none" 
                  placeholder="Enter exam instructions..."
                />
              </div>

              <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-3 border-t">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label className="text-xs sm:text-sm">Shuffle Questions</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Randomize question order</p>
                  </div>
                  <Switch 
                    checked={editForm.shuffle_questions} 
                    onCheckedChange={(checked) => setEditForm({ ...editForm, shuffle_questions: checked })} 
                    className="flex-shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label className="text-xs sm:text-sm">Shuffle Options</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Randomize option order</p>
                  </div>
                  <Switch 
                    checked={editForm.shuffle_options} 
                    onCheckedChange={(checked) => setEditForm({ ...editForm, shuffle_options: checked })} 
                    className="flex-shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label className="text-xs sm:text-sm">Include Theory Questions</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Enable essay questions</p>
                  </div>
                  <Switch 
                    checked={editForm.has_theory} 
                    onCheckedChange={(checked) => setEditForm({ ...editForm, has_theory: checked })} 
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSaveDetails} 
                  disabled={saving} 
                  size={isMobile ? "sm" : "default"} 
                  className="h-8 sm:h-9 text-sm"
                >
                  {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                  Save Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objective Questions Tab */}
        <TabsContent value="objective" className="mt-0 space-y-4">
          {/* Points per question control */}
          <div className="bg-green-50 dark:bg-green-950/30 p-3 sm:p-4 rounded-lg border border-green-200">
            <Label className="text-green-800 dark:text-green-300 font-medium text-xs sm:text-sm">Default Points per Objective Question</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={objectivePointsPerQuestion}
                  onChange={(e) => setObjectivePointsPerQuestion(parseFloat(e.target.value) || 0.5)}
                  className="w-20 sm:w-24 bg-white h-8 sm:h-9 text-sm"
                />
                <span className="text-xs text-muted-foreground">point(s)</span>
              </div>
              {questions.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={updateAllObjectivePoints} 
                  className="text-green-700 border-green-300 text-xs h-8 w-full sm:w-auto"
                >
                  Apply to all {questions.length}
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Current: {objectiveCount} × {objectivePointsPerQuestion} = {totalObjectiveMarks} points
            </p>
          </div>

          <Card>
            <CardHeader className={cn(
              "flex flex-row items-center justify-between gap-2 pb-2 px-3 sm:px-5 pt-3 sm:pt-4",
              isMobile ? "flex-wrap" : ""
            )}>
              <div>
                <CardTitle className="text-base sm:text-lg">Objective Questions</CardTitle>
                <CardDescription className="text-xs">{questions.length} questions • {totalObjectiveMarks} marks</CardDescription>
              </div>
              {!isMobile && (
                <Button onClick={() => setShowAddQuestion(true)} size="sm" className="h-8 text-xs">
                  <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Question
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-3 sm:px-5 pb-4 sm:pb-5">
              {questions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">No objective questions yet</p>
                  <Button onClick={() => setShowAddQuestion(true)} size={isMobile ? "sm" : "default"}>
                    Add Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      {editingQuestionId === q.id ? (
                        <div className="space-y-3">
                          <Textarea 
                            value={editQuestionForm.question_text || ''} 
                            onChange={(e) => setEditQuestionForm({ ...editQuestionForm, question_text: e.target.value })} 
                            className="min-h-[80px] text-sm" 
                            placeholder="Enter question text..."
                          />
                          <div className="space-y-2">
                            {editQuestionForm.options?.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="w-5 sm:w-6 text-xs sm:text-sm font-medium flex-shrink-0">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <Input 
                                  value={opt} 
                                  onChange={(e) => {
                                    const newOptions = [...(editQuestionForm.options || [])]
                                    newOptions[optIdx] = e.target.value
                                    setEditQuestionForm({ ...editQuestionForm, options: newOptions })
                                  }} 
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} 
                                  className="h-8 sm:h-9 text-sm" 
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                            <div>
                              <Label className="text-xs">Correct Answer</Label>
                              <Select 
                                value={editQuestionForm.correct_answer} 
                                onValueChange={(value) => setEditQuestionForm({ ...editQuestionForm, correct_answer: value })}
                              >
                                <SelectTrigger className="h-8 sm:h-9 text-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {['A', 'B', 'C', 'D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Points</Label>
                              <Input 
                                type="number" 
                                step="0.5" 
                                value={editQuestionForm.points} 
                                onChange={(e) => setEditQuestionForm({ ...editQuestionForm, points: parseFloat(e.target.value) || 0.5 })} 
                                className="h-8 sm:h-9 text-sm" 
                              />
                            </div>
                          </div>
                          <div className="flex gap-1.5 sm:gap-2 pt-1">
                            <Button size="sm" onClick={handleUpdateQuestion} className="h-8 text-xs flex-1 sm:flex-none">
                              <Check className="mr-1 h-3 w-3" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)} className="h-8 text-xs flex-1 sm:flex-none">
                              <X className="mr-1 h-3 w-3" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs sm:text-sm font-medium flex-1 min-w-0">
                              <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                              {q.question_text}
                            </p>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setEditingQuestionId(q.id)
                                  setEditQuestionForm({
                                    question_text: q.question_text,
                                    options: [...q.options],
                                    correct_answer: q.correct_answer,
                                    points: q.points
                                  })
                                }} 
                                className="h-7 w-7"
                                title="Edit question"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteQuestion(q.id)} 
                                className="h-7 w-7"
                                title="Delete question"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          {q.options && (
                            <div className="mt-1.5 pl-3 sm:pl-4 space-y-0.5">
                              {q.options.map((opt, optIdx) => opt && (
                                <p key={optIdx} className="text-[11px] sm:text-xs flex items-center gap-1">
                                  <span className="font-medium flex-shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                                  <span className="truncate">{opt}</span>
                                  {String.fromCharCode(65 + optIdx) === q.correct_answer && (
                                    <Check className="h-3 w-3 text-green-600 flex-shrink-0 ml-1" />
                                  )}
                                </p>
                              ))}
                            </div>
                          )}
                          <Badge variant="outline" className="text-[10px] bg-white/50">{q.points} pts</Badge>
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
        <TabsContent value="theory" className="mt-0 space-y-4">
          {!editForm.has_theory ? (
            <div className="text-center py-8 sm:py-12">
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground">Theory questions are disabled</p>
              <p className="text-xs text-muted-foreground mt-1">Enable theory in the Details tab first</p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('details')} 
                size={isMobile ? "sm" : "default"}
                className="mt-4"
              >
                Go to Details
              </Button>
            </div>
          ) : (
            <>
              {/* Points per question control */}
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 sm:p-4 rounded-lg border border-purple-200">
                <Label className="text-purple-800 dark:text-purple-300 font-medium text-xs sm:text-sm">Default Points per Theory Question</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      step="1" 
                      min="1" 
                      value={theoryPointsPerQuestion} 
                      onChange={(e) => setTheoryPointsPerQuestion(parseInt(e.target.value) || 5)} 
                      className="w-20 sm:w-24 bg-white h-8 sm:h-9 text-sm" 
                    />
                    <span className="text-xs text-muted-foreground">point(s)</span>
                  </div>
                  {theoryQuestions.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={updateAllTheoryPoints} 
                      className="text-purple-700 border-purple-300 text-xs h-8 w-full sm:w-auto"
                    >
                      Apply to all {theoryQuestions.length}
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Current: {theoryCount} × {theoryPointsPerQuestion} = {totalTheoryMarks} points
                </p>
              </div>

              <Card>
                <CardHeader className={cn(
                  "flex flex-row items-center justify-between gap-2 pb-2 px-3 sm:px-5 pt-3 sm:pt-4",
                  isMobile ? "flex-wrap" : ""
                )}>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Theory Questions</CardTitle>
                    <CardDescription className="text-xs">{theoryQuestions.length} questions • {totalTheoryMarks} marks</CardDescription>
                  </div>
                  {!isMobile && (
                    <Button onClick={() => setShowAddTheory(true)} size="sm" className="h-8 text-xs">
                      <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Question
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-3 sm:px-5 pb-4 sm:pb-5">
                  {theoryQuestions.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-3">No theory questions yet</p>
                      <Button onClick={() => setShowAddTheory(true)} size={isMobile ? "sm" : "default"}>
                        Add Your First Theory Question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {theoryQuestions.map((q, idx) => (
                        <div key={q.id} className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium">
                                <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                                {q.question_text}
                              </p>
                              <Badge variant="outline" className="mt-1.5 text-[10px] bg-white/50">{q.points} pts</Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteTheory(q.id)} 
                              className="h-7 w-7 flex-shrink-0"
                              title="Delete question"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Objective Question Dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className={cn(
          "max-w-2xl p-4 sm:p-5 md:p-6",
          isMobile ? "w-[95vw] max-h-[90vh] overflow-y-auto m-2" : ""
        )}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add Objective Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2">
            <div>
              <Label className="text-xs sm:text-sm">Question Text *</Label>
              <Textarea 
                value={newQuestion.question_text} 
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })} 
                className="min-h-[80px] sm:min-h-[100px] text-sm mt-1" 
                placeholder="Enter your question..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Options</Label>
              {newQuestion.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 sm:w-7 text-sm font-medium flex-shrink-0">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <Input 
                    value={opt} 
                    onChange={(e) => { 
                      const newOpts = [...(newQuestion.options || [])]; 
                      newOpts[idx] = e.target.value; 
                      setNewQuestion({ ...newQuestion, options: newOpts }) 
                    }} 
                    className="h-9 sm:h-10 text-sm" 
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs sm:text-sm">Correct Answer *</Label>
                <Select 
                  value={newQuestion.correct_answer} 
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, correct_answer: value })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm mt-1">
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Points</Label>
                <Input 
                  type="number" 
                  step="0.5" 
                  value={newQuestion.points} 
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseFloat(e.target.value) || 0.5 })} 
                  className="h-9 sm:h-10 text-sm mt-1" 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowAddQuestion(false)} className="h-9 text-sm w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddQuestion} className="h-9 text-sm w-full sm:w-auto">
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Theory Question Dialog */}
      <Dialog open={showAddTheory} onOpenChange={setShowAddTheory}>
        <DialogContent className={cn(
          "max-w-2xl p-4 sm:p-5 md:p-6",
          isMobile ? "w-[95vw] max-h-[90vh] overflow-y-auto m-2" : ""
        )}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add Theory Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2">
            <div>
              <Label className="text-xs sm:text-sm">Question Text *</Label>
              <Textarea 
                value={newTheory.question_text} 
                onChange={(e) => setNewTheory({ ...newTheory, question_text: e.target.value })} 
                className="min-h-[100px] sm:min-h-[120px] text-sm mt-1" 
                placeholder="Enter your theory question..."
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Points</Label>
              <Input 
                type="number" 
                value={newTheory.points} 
                onChange={(e) => setNewTheory({ ...newTheory, points: parseInt(e.target.value) || 5 })} 
                className="h-9 sm:h-10 text-sm mt-1" 
                min={1}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowAddTheory(false)} className="h-9 text-sm w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddTheory} className="h-9 text-sm w-full sm:w-auto">
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}