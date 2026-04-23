// src/components/staff/exams/edit/EditExamPage.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Eye } from 'lucide-react'
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
const AVAILABLE_SESSIONS = ['2024/2025', '2025/2026', '2026/2027']

const JSS_SUBJECTS = [
  'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Christian Religious Studies',
  'Islamic Religious Studies', 'Business Studies', 'Home Economics',
  'Agricultural Science', 'Physical and Health Education',
  'Computer Studies', 'Cultural and Creative Arts', 'French'
]

const SS_SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science'
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

      if (questionsData) {
        const parsedQuestions = questionsData.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
        }))
        setQuestions(parsedQuestions as Question[])
      }

      // Load theory questions if enabled
      if (examData.has_theory) {
        const { data: theoryData } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .eq('question_type', 'theory')
          .order('order_number', { ascending: true })

        if (theoryData) {
          setTheoryQuestions(theoryData as TheoryQuestion[])
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

  // Save exam
  const handleSaveExam = async () => {
    setSaving(true)
    try {
      const totalMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0) + 
                         theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0)

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
          total_questions: questions.length + (hasTheory ? theoryQuestions.length : 0),
          total_marks: totalMarks,
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
        points: data.points || 1,
        order_number: questions.length + 1
      }

      const { data: result, error } = await supabase
        .from('questions')
        .insert([newQuestion])
        .select()
        .single()

      if (error) throw error

      setQuestions([...questions, result as Question])
      toast.success('Question added')
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
          points: data.points
        })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.map(q => q.id === questionId ? { ...q, ...data } : q))
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

      setQuestions(questions.filter(q => q.id !== questionId))
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
        points: data.points || 5,
        order_number: theoryQuestions.length + 1
      }

      const { data: result, error } = await supabase
        .from('questions')
        .insert([newQuestion])
        .select()
        .single()

      if (error) throw error

      setTheoryQuestions([...theoryQuestions, result as TheoryQuestion])
      toast.success('Theory question added')
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
          points: data.points
        })
        .eq('id', questionId)

      if (error) throw error

      setTheoryQuestions(theoryQuestions.map(q => q.id === questionId ? { ...q, ...data } : q))
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <ExamHeader
          examId={examId}
          examTitle={exam?.title}
          term={examDetails.term}
          termName={TERM_NAMES[examDetails.term]}
          sessionYear={examDetails.session_year}
          saving={saving}
          onSave={handleSaveExam}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-6 h-auto sm:h-10">
            <TabsTrigger value="details" className="text-xs sm:text-sm py-2">Details</TabsTrigger>
            <TabsTrigger value="questions" className="text-xs sm:text-sm py-2">
              Objective ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="theory" className="text-xs sm:text-sm py-2">
              Theory ({theoryQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs sm:text-sm py-2">
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