'use client'

import { useState, useEffect } from 'react'
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
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

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
  
  // Question editing states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editQuestionForm, setEditQuestionForm] = useState<Partial<Question>>({})
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  })
  
  // Theory question states
  const [showAddTheory, setShowAddTheory] = useState(false)
  const [newTheory, setNewTheory] = useState<Partial<TheoryQuestion>>({
    question_text: '',
    points: 5
  })

  useEffect(() => {
    loadExamData()
  }, [examId])

  const loadExamData = async () => {
    setLoading(true)
    try {
      // Load exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      
      // Only allow editing draft exams
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
      toast.error('Failed to load exam data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDetails = async () => {
    if (!exam) return
    
    setSaving(true)
    try {
      const totalQuestions = questions.length + (editForm.has_theory ? theoryQuestions.length : 0)
      const totalObjectiveMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0)
      const totalTheoryMarks = editForm.has_theory ? theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0) : 0
      const totalMarks = totalObjectiveMarks + totalTheoryMarks

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
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error

      setExam({ ...exam, ...editForm, total_marks: totalMarks } as ExamDetails)
      toast.success('Exam details saved!')
    } catch (error) {
      console.error('Error saving exam:', error)
      toast.error('Failed to save exam details')
    } finally {
      setSaving(false)
    }
  }

  // Question CRUD operations
  const handleAddQuestion = async () => {
    if (!newQuestion.question_text || !newQuestion.correct_answer) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const questionData = {
        exam_id: examId,
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

  const handleUpdateQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: editQuestionForm.question_text,
          options: editQuestionForm.options,
          correct_answer: editQuestionForm.correct_answer,
          points: editQuestionForm.points
        })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, ...editQuestionForm } : q
      ))
      toast.success('Question updated!')
      setEditingQuestionId(null)
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to update question')
    }
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

  const handleAddTheory = async () => {
    if (!newTheory.question_text) {
      toast.error('Please enter a question')
      return
    }

    try {
      const questionData = {
        exam_id: examId,
        question_text: newTheory.question_text,
        question_type: 'theory',
        points: newTheory.points || 5,
        order_number: theoryQuestions.length + 1
      }

      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single()

      if (error) throw error

      setTheoryQuestions([...theoryQuestions, data as TheoryQuestion])
      toast.success('Theory question added!')
      setShowAddTheory(false)
      setNewTheory({ question_text: '', points: 5 })
    } catch (error) {
      console.error('Error adding theory question:', error)
      toast.error('Failed to add theory question')
    }
  }

  const handleDeleteTheory = async (questionId: string) => {
    if (!confirm('Delete this theory question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      setTheoryQuestions(theoryQuestions.filter(q => q.id !== questionId))
      toast.success('Theory question deleted')
    } catch (error) {
      console.error('Error deleting theory question:', error)
      toast.error('Failed to delete theory question')
    }
  }

  const handleFinish = async () => {
    await handleSaveDetails()
    onSave()
  }

  const totalObjectiveMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0)
  const totalTheoryMarks = theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Exam Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Edit Exam
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {exam.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleFinish} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save & Finish
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="objective">
            Objective ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="theory">
            Theory ({theoryQuestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>Edit basic exam information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="e.g., First Term Mathematics Exam"
                  />
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={editForm.subject || ''}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label>Class *</Label>
                  <Select
                    value={editForm.class}
                    onValueChange={(value) => setEditForm({ ...editForm, class: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (minutes) *</Label>
                  <Input
                    type="number"
                    value={editForm.duration || 60}
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 60 })}
                    min={5}
                  />
                </div>
                <div>
                  <Label>Pass Mark (%)</Label>
                  <Input
                    type="number"
                    value={editForm.pass_mark || 50}
                    onChange={(e) => setEditForm({ ...editForm, pass_mark: parseInt(e.target.value) || 50 })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              
              <div>
                <Label>Instructions / Description</Label>
                <Textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter exam instructions or description..."
                  rows={4}
                />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Shuffle Questions</Label>
                    <p className="text-xs text-slate-500">Randomize question order for each student</p>
                  </div>
                  <Switch
                    checked={editForm.shuffle_questions}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, shuffle_questions: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Shuffle Options</Label>
                    <p className="text-xs text-slate-500">Randomize option order for multiple choice questions</p>
                  </div>
                  <Switch
                    checked={editForm.shuffle_options}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, shuffle_options: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Theory Questions</Label>
                    <p className="text-xs text-slate-500">Enable essay/theory questions section</p>
                  </div>
                  <Switch
                    checked={editForm.has_theory}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, has_theory: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveDetails} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objective Questions Tab */}
        <TabsContent value="objective" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Objective Questions</CardTitle>
                <CardDescription>
                  {questions.length} questions • {totalObjectiveMarks} marks total
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddQuestion(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No objective questions yet</p>
                  <Button onClick={() => setShowAddQuestion(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      {editingQuestionId === q.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editQuestionForm.question_text || ''}
                            onChange={(e) => setEditQuestionForm({ ...editQuestionForm, question_text: e.target.value })}
                            placeholder="Question text"
                            className="min-h-[80px]"
                          />
                          <div className="space-y-2">
                            {editQuestionForm.options?.map((opt, optIdx) => (
                              <Input
                                key={optIdx}
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(editQuestionForm.options || [])]
                                  newOptions[optIdx] = e.target.value
                                  setEditQuestionForm({ ...editQuestionForm, options: newOptions })
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Correct Answer</Label>
                              <Select
                                value={editQuestionForm.correct_answer}
                                onValueChange={(value) => setEditQuestionForm({ ...editQuestionForm, correct_answer: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {['A', 'B', 'C', 'D'].map(letter => (
                                    <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={editQuestionForm.points}
                                onChange={(e) => setEditQuestionForm({ ...editQuestionForm, points: parseInt(e.target.value) || 1 })}
                                min={1}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateQuestion(q.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium flex-1">
                              <span className="text-slate-500 mr-2">{idx + 1}.</span>
                              {q.question_text}
                            </p>
                            <div className="flex items-center gap-1">
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
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          {q.options && (
                            <div className="ml-6 mt-2 space-y-1">
                              {q.options.map((opt, optIdx) => (
                                opt && (
                                  <p key={optIdx} className="text-sm">
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                    {opt}
                                    {String.fromCharCode(65 + optIdx) === q.correct_answer && (
                                      <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Correct</Badge>
                                    )}
                                  </p>
                                )
                              ))}
                            </div>
                          )}
                          <Badge variant="outline" className="mt-2">{q.points} pts</Badge>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theory Questions Tab */}
        <TabsContent value="theory" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Theory Questions</CardTitle>
                <CardDescription>
                  {theoryQuestions.length} questions • {totalTheoryMarks} marks total
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddTheory(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Theory Question
              </Button>
            </CardHeader>
            <CardContent>
              {theoryQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No theory questions yet</p>
                  <Button onClick={() => setShowAddTheory(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Theory Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {theoryQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium flex-1">
                          <span className="text-slate-500 mr-2">{idx + 1}.</span>
                          {q.question_text}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTheory(q.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="mt-2">{q.points} pts</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Objective Question Dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Objective Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question Text *</Label>
              <Textarea
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter your question"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {newQuestion.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 font-medium">{String.fromCharCode(65 + idx)}.</span>
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(newQuestion.options || [])]
                      newOptions[idx] = e.target.value
                      setNewQuestion({ ...newQuestion, options: newOptions })
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Correct Answer *</Label>
                <Select
                  value={newQuestion.correct_answer}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddQuestion(false)}>Cancel</Button>
            <Button onClick={handleAddQuestion}>Add Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Theory Question Dialog */}
      <Dialog open={showAddTheory} onOpenChange={setShowAddTheory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Theory Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question Text *</Label>
              <Textarea
                value={newTheory.question_text}
                onChange={(e) => setNewTheory({ ...newTheory, question_text: e.target.value })}
                placeholder="Enter your essay/theory question"
                className="min-h-[120px]"
              />
            </div>
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={newTheory.points}
                onChange={(e) => setNewTheory({ ...newTheory, points: parseInt(e.target.value) || 5 })}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTheory(false)}>Cancel</Button>
            <Button onClick={handleAddTheory}>Add Theory Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}