// src/components/staff/exams/edit/EditExamPage.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Eye, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button' // ✅ ADD MISSING IMPORT
import { Card, CardContent } from '@/components/ui/card' // ✅ ADD MISSING IMPORT
import { Label } from '@/components/ui/label' // ✅ ADD MISSING IMPORT
import { Input } from '@/components/ui/input' // ✅ ADD MISSING IMPORT
import { ExamHeader } from './ExamHeader'
import { ExamDetailsTab } from './ExamDetailsTab'
import { ObjectiveQuestionsTab } from './ObjectiveQuestionsTab'
import { TheoryQuestionsTab } from './TheoryQuestionsTab'
import { PreviewTab } from './PreviewTab'
import { QuestionFormDialog } from './QuestionFormDialog'
import { TheoryQuestionFormDialog } from './TheoryQuestionFormDialog'
import type { Exam, Question, TheoryQuestion, ExamDetailsForm } from './types'
import { cn } from '@/lib/utils'

// Constants
const CURRENT_TERM = 'third'
const CURRENT_SESSION = '2025/2026'
const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const AVAILABLE_SESSIONS = ['2025/2026', '2026/2027']

const JSS_SUBJECTS = [
  'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Christian Religious Studies',
  'Islamic Religious Studies', 'Business Studies', 'Home Economics',
  'Agricultural Science', 'Physical and Health Education',
  'Information Technology', 'Security Education', 'Yoruba','Cultural and Creative Arts', 'French'
]

const SS_SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Data Processing', 'Further Mathematics', 'Civic Education', 'CRS','Financial Accounting', 'Agricultural Science'
]

interface EditExamPageProps {
  examId: string
}

export function EditExamPage({ examId }: EditExamPageProps) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([])
  const [hasTheory, setHasTheory] = useState(false)
  
  // Default points values
  const [objectivePointsPerQuestion, setObjectivePointsPerQuestion] = useState<number>(1)
  const [theoryPointsPerQuestion, setTheoryPointsPerQuestion] = useState<number>(5)
  
  const [examDetails, setExamDetails] = useState<ExamDetailsForm>({
    title: '',
    subject: '',
    class: '',
    duration: 60,
    instructions: '',
    pass_mark: 50,
    shuffle_questions: true,
    shuffle_options: true,
    negative_marking: false,
    negative_marking_value: 0.5,
    term: CURRENT_TERM,
    session_year: CURRENT_SESSION
  })
  
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showTheoryDialog, setShowTheoryDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editingTheoryQuestion, setEditingTheoryQuestion] = useState<TheoryQuestion | null>(null)

  // Computed values
  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return []
    return examDetails.class.startsWith('JSS') ? JSS_SUBJECTS : SS_SUBJECTS
  }, [examDetails.class])

  // DYNAMIC CALCULATIONS
  const objectiveCount = questions.length
  const theoryCount = theoryQuestions.length
  const totalQuestions = objectiveCount + theoryCount
  
  const totalObjectivePoints = objectiveCount * objectivePointsPerQuestion
  const totalTheoryPoints = theoryCount * theoryPointsPerQuestion
  const totalExamPoints = totalObjectivePoints + totalTheoryPoints
  const passMarkPercentage = totalExamPoints > 0 ? (examDetails.pass_mark / totalExamPoints) * 100 : 0

  // Update all existing questions when points per question changes
  const updateAllObjectivePoints = useCallback(async () => {
    if (questions.length === 0) return
    
    const { error } = await supabase
      .from('questions')
      .update({ points: objectivePointsPerQuestion })
      .eq('exam_id', examId)
      .eq('question_type', 'objective')

    if (error) {
      console.error('Error updating question points:', error)
      toast.error('Failed to update question points')
      return
    }
    
    setQuestions(prev => prev.map(q => ({ ...q, points: objectivePointsPerQuestion })))
    toast.success(`Updated ${questions.length} objective questions to ${objectivePointsPerQuestion} point(s) each`)
  }, [examId, questions.length, objectivePointsPerQuestion])

  const updateAllTheoryPoints = useCallback(async () => {
    if (theoryQuestions.length === 0) return
    
    const { error } = await supabase
      .from('questions')
      .update({ points: theoryPointsPerQuestion })
      .eq('exam_id', examId)
      .eq('question_type', 'theory')

    if (error) {
      console.error('Error updating theory points:', error)
      toast.error('Failed to update theory points')
      return
    }
    
    setTheoryQuestions(prev => prev.map(q => ({ ...q, points: theoryPointsPerQuestion })))
    toast.success(`Updated ${theoryQuestions.length} theory questions to ${theoryPointsPerQuestion} point(s) each`)
  }, [examId, theoryQuestions.length, theoryPointsPerQuestion])

  // Load exam data
  const loadExamData = useCallback(async () => {
    try {
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
        negative_marking_value: examWithDefaults.negative_marking_value,
        term: examData.term || CURRENT_TERM,
        session_year: examData.session_year || CURRENT_SESSION
      })

      // Load objective questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .eq('question_type', 'objective')
        .order('order_number', { ascending: true })

      if (questionsData && questionsData.length > 0) {
        const parsedQuestions = questionsData.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
        }))
        setQuestions(parsedQuestions as Question[])
        
        // Set points per question based on first question's points
        if (parsedQuestions[0]?.points) {
          setObjectivePointsPerQuestion(parsedQuestions[0].points)
        }
      }

      // Load theory questions if enabled
      if (examData.has_theory) {
        const { data: theoryData } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .eq('question_type', 'theory')
          .order('order_number', { ascending: true })

        if (theoryData && theoryData.length > 0) {
          setTheoryQuestions(theoryData as TheoryQuestion[])
          if (theoryData[0]?.points) {
            setTheoryPointsPerQuestion(theoryData[0].points)
          }
        }
      }

    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }, [examId])

  useEffect(() => {
    loadExamData()
  }, [loadExamData])

  // Update exam totals in database
  const updateExamTotals = useCallback(async () => {
    if (!examId) return
    
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          total_questions: totalQuestions,
          total_marks: totalExamPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating exam totals:', error)
    }
  }, [examId, totalQuestions, totalExamPoints])

  // Auto-save totals when questions or points change
  useEffect(() => {
    if (!loading && examId) {
      updateExamTotals()
    }
  }, [totalQuestions, totalExamPoints, objectivePointsPerQuestion, theoryPointsPerQuestion, loading, examId, updateExamTotals])

  // Save exam
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
          term: examDetails.term,
          session_year: examDetails.session_year,
          total_questions: totalQuestions,
          total_marks: totalExamPoints,
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

  // Question handlers
  const handleAddQuestion = async (data: Partial<Question>) => {
    try {
      const newQuestion = {
        exam_id: examId,
        question_text: data.question_text,
        question_type: 'objective',
        options: data.options,
        correct_answer: data.correct_answer,
        points: objectivePointsPerQuestion,
        order_number: questions.length + 1
      }

      const { data: result, error } = await supabase
        .from('questions')
        .insert([newQuestion])
        .select()
        .single()

      if (error) throw error

      setQuestions([...questions, { ...result, points: objectivePointsPerQuestion } as Question])
      toast.success(`Question added (${objectivePointsPerQuestion} point${objectivePointsPerQuestion !== 1 ? 's' : ''})`)
      setShowQuestionDialog(false)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error adding question:', error)
      toast.error('Failed to add question')
    }
  }

  const handleUpdateQuestion = async (questionId: string, data: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: data.question_text,
          options: data.options,
          correct_answer: data.correct_answer,
          points: data.points || objectivePointsPerQuestion
        })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.map(q => q.id === questionId ? { ...q, ...data, points: data.points || objectivePointsPerQuestion } : q))
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
      // Reorder remaining questions
      for (let i = 0; i < updatedQuestions.length; i++) {
        await supabase
          .from('questions')
          .update({ order_number: i + 1 })
          .eq('id', updatedQuestions[i].id)
      }
      
      setQuestions(updatedQuestions)
      toast.success('Question deleted')
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    }
  }

  // Theory question handlers
  const handleAddTheoryQuestion = async (data: Partial<TheoryQuestion>) => {
    try {
      const newQuestion = {
        exam_id: examId,
        question_text: data.question_text,
        question_type: 'theory',
        points: theoryPointsPerQuestion,
        order_number: theoryQuestions.length + 1
      }

      const { data: result, error } = await supabase
        .from('questions')
        .insert([newQuestion])
        .select()
        .single()

      if (error) throw error

      setTheoryQuestions([...theoryQuestions, { ...result, points: theoryPointsPerQuestion } as TheoryQuestion])
      toast.success(`Theory question added (${theoryPointsPerQuestion} point${theoryPointsPerQuestion !== 1 ? 's' : ''})`)
      setShowTheoryDialog(false)
      setEditingTheoryQuestion(null)
    } catch (error) {
      console.error('Error adding theory question:', error)
      toast.error('Failed to add theory question')
    }
  }

  const handleUpdateTheoryQuestion = async (questionId: string, data: Partial<TheoryQuestion>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: data.question_text,
          points: data.points || theoryPointsPerQuestion
        })
        .eq('id', questionId)

      if (error) throw error

      setTheoryQuestions(theoryQuestions.map(q => q.id === questionId ? { ...q, ...data, points: data.points || theoryPointsPerQuestion } : q))
      toast.success('Theory question updated')
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

      const updatedTheory = theoryQuestions.filter(q => q.id !== questionId)
      for (let i = 0; i < updatedTheory.length; i++) {
        await supabase
          .from('questions')
          .update({ order_number: i + 1 })
          .eq('id', updatedTheory[i].id)
      }
      
      setTheoryQuestions(updatedTheory)
      toast.success('Theory question deleted')
    } catch (error) {
      console.error('Error deleting theory question:', error)
      toast.error('Failed to delete theory question')
    }
  }

  // Points Summary Component
  const PointsSummary = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <h3 className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-300">Exam Points Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{objectiveCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Objective Qs</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{totalObjectivePoints}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Obj Points</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">({objectivePointsPerQuestion} pts each)</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{theoryCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Theory Qs</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{totalTheoryPoints}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Theory Points</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">({theoryPointsPerQuestion} pts each)</p>
          </div>
        </div>
        <div className="mt-2 sm:mt-3 pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium">Total Exam Points:</span>
          <span className="text-base sm:text-lg font-bold text-blue-700">{totalExamPoints}</span>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-muted-foreground">Pass Mark:</span>
          <span className="font-medium">{examDetails.pass_mark} / {totalExamPoints} ({Math.round(passMarkPercentage)}%)</span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-y-auto">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <ExamHeader
          examId={examId}
          examTitle={exam?.title}
          term={examDetails.term}
          termName={TERM_NAMES[examDetails.term]}
          sessionYear={examDetails.session_year}
          saving={saving}
          onSave={handleSaveExam}
        />

        {/* Dynamic Points Summary */}
        <PointsSummary />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-4 sm:mb-6 h-auto sm:h-10">
            <TabsTrigger value="details" className="text-xs sm:text-sm py-1.5 sm:py-2">Details</TabsTrigger>
            <TabsTrigger value="questions" className="text-xs sm:text-sm py-1.5 sm:py-2">
              Objective ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="theory" className="text-xs sm:text-sm py-1.5 sm:py-2">
              Theory ({theoryQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs sm:text-sm py-1.5 sm:py-2">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ExamDetailsTab
              formData={examDetails}
              onChange={(data) => setExamDetails({ ...examDetails, ...data })}
              availableSubjects={availableSubjects}
              classes={CLASSES}
              availableSessions={AVAILABLE_SESSIONS}
              currentSession={CURRENT_SESSION}
              hasTheory={hasTheory}
              onHasTheoryChange={setHasTheory}
            />
          </TabsContent>

          <TabsContent value="questions">
            {/* Points per question control for objective */}
            <div className="mb-4">
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <Label className="text-green-800 dark:text-green-300 font-medium text-sm">Objective Questions Points</Label>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={objectivePointsPerQuestion}
                    onChange={(e) => setObjectivePointsPerQuestion(parseFloat(e.target.value) || 1)}
                    className="w-24 bg-white h-8 sm:h-9 text-sm"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">point(s) per question</span>
                  {questions.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={updateAllObjectivePoints}
                      className="text-green-700 border-green-300 text-xs sm:text-sm"
                    >
                      Apply to all {questions.length} questions
                    </Button>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                  Total: {objectiveCount} × {objectivePointsPerQuestion} = {totalObjectivePoints} points
                </p>
              </div>
            </div>
            
            <ObjectiveQuestionsTab
              questions={questions}
              onAddQuestion={() => {
                setEditingQuestion(null)
                setShowQuestionDialog(true)
              }}
              onEditQuestion={(q) => {
                setEditingQuestion(q)
                setShowQuestionDialog(true)
              }}
              onDeleteQuestion={handleDeleteQuestion}
            />
          </TabsContent>

          <TabsContent value="theory">
            {/* Points per question control for theory */}
            <div className="mb-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <Label className="text-purple-800 dark:text-purple-300 font-medium text-sm">Theory Questions Points</Label>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={theoryPointsPerQuestion}
                    onChange={(e) => setTheoryPointsPerQuestion(parseInt(e.target.value) || 5)}
                    className="w-24 bg-white h-8 sm:h-9 text-sm"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">point(s) per question</span>
                  {theoryQuestions.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={updateAllTheoryPoints}
                      className="text-purple-700 border-purple-300 text-xs sm:text-sm"
                    >
                      Apply to all {theoryQuestions.length} questions
                    </Button>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                  Total: {theoryCount} × {theoryPointsPerQuestion} = {totalTheoryPoints} points
                </p>
              </div>
            </div>
            
            <TheoryQuestionsTab
              questions={theoryQuestions}
              hasTheory={hasTheory}
              onAddQuestion={() => {
                setEditingTheoryQuestion(null)
                setShowTheoryDialog(true)
              }}
              onEditQuestion={(q) => {
                setEditingTheoryQuestion(q)
                setShowTheoryDialog(true)
              }}
              onDeleteQuestion={handleDeleteTheoryQuestion}
            />
          </TabsContent>

          <TabsContent value="preview">
            <PreviewTab
              examDetails={examDetails}
              questions={questions}
              theoryQuestions={theoryQuestions}
              hasTheory={hasTheory}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <QuestionFormDialog
          open={showQuestionDialog}
          onOpenChange={setShowQuestionDialog}
          initialData={editingQuestion || undefined}
          onSave={(data) => {
            if (editingQuestion) {
              handleUpdateQuestion(editingQuestion.id, data)
            } else {
              handleAddQuestion(data)
            }
          }}
        />

        <TheoryQuestionFormDialog
          open={showTheoryDialog}
          onOpenChange={setShowTheoryDialog}
          initialData={editingTheoryQuestion || undefined}
          onSave={(data) => {
            if (editingTheoryQuestion) {
              handleUpdateTheoryQuestion(editingTheoryQuestion.id, data)
            } else {
              handleAddTheoryQuestion(data)
            }
          }}
        />
      </div>
    </div>
  )
}