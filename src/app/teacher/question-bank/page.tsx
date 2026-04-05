/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Question {
  id: string
  question_text: string
  type: 'objective' | 'theory' | 'true-false'
  options?: string[]
  correct_answer: string | string[]
  points: number
  explanation?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  subject: string
  topic: string
  created_by: string
  created_at: string
  updated_at: string
}

// Mock data for demo
const mockQuestions: Question[] = [
  {
    id: '1',
    question_text: 'What is the capital of Nigeria?',
    type: 'objective',
    options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
    correct_answer: 'Abuja',
    points: 1,
    difficulty: 'beginner',
    subject: 'Geography',
    topic: 'African Capitals',
    created_by: 'teacher1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    question_text: 'Solve for x: 2x + 5 = 15',
    type: 'objective',
    options: ['5', '10', '7', '12'],
    correct_answer: '5',
    points: 2,
    difficulty: 'intermediate',
    subject: 'Mathematics',
    topic: 'Algebra',
    created_by: 'teacher1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    question_text: 'The cell is the basic unit of life. True or False?',
    type: 'true-false',
    correct_answer: 'true',
    points: 1,
    difficulty: 'beginner',
    subject: 'Biology',
    topic: 'Cell Biology',
    created_by: 'teacher1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const subjects = [
  'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
  'Geography', 'History', 'Economics', 'Government', 'Literature'
]

const topics = [
  'Algebra', 'Calculus', 'Cell Biology', 'Atomic Structure', 'Grammar',
  'Literature', 'African History', 'World Economics', 'Political Systems'
]

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function QuestionBankPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(mockQuestions)
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>(mockQuestions)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<Question>>({
    question_text: '',
    type: 'objective',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    difficulty: 'beginner',
    subject: '',
    topic: '',
    explanation: '',
  })

  // Mock user
  const user = session?.user || {
    id: 'teacher1',
    name: 'John Doe',
    email: 'teacher@vincollins.edu.ng',
    role: 'teacher'
  }

  const loadQuestions = useCallback(async () => {
    setIsLoading(true)
    try {
      // Using mock data instead of actual DB
      setQuestions(mockQuestions)
      setFilteredQuestions(mockQuestions)
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else {
      loadQuestions()
    }
  }, [status, router, loadQuestions])

  useEffect(() => {
    let filtered = [...questions]
    
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(q => q.subject === selectedSubject)
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty)
    }
    
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(q => q.topic === selectedTopic)
    }
    
    setFilteredQuestions(filtered)
  }, [searchQuery, selectedSubject, selectedDifficulty, selectedTopic, questions])

  const handleCreateQuestion = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedQuestion(null)
    setFormData({
      question_text: '',
      type: 'objective',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      difficulty: 'beginner',
      subject: '',
      topic: '',
      explanation: '',
    })
  }

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setFormData({
      ...question,
      options: question.options || ['', '', '', '']
    })
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setIsEditing(false)
    setIsCreating(false)
  }

  const handleSaveQuestion = async () => {
    if (!formData.question_text || !formData.subject || !formData.topic) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      if (isEditing && selectedQuestion) {
        // Update existing question
        const updatedQuestions = questions.map(q => 
          q.id === selectedQuestion.id 
            ? { 
                ...q, 
                ...formData, 
                updated_at: new Date().toISOString(),
                options: formData.type === 'objective' ? formData.options : undefined
              }
            : q
        )
        setQuestions(updatedQuestions)
        toast.success('Question updated successfully')
      } else {
        // Create new question
        const newQuestion: Question = {
          id: Date.now().toString(),
          question_text: formData.question_text!,
          type: formData.type!,
          options: formData.type === 'objective' ? formData.options : undefined,
          correct_answer: formData.correct_answer!,
          points: formData.points!,
          difficulty: formData.difficulty!,
          subject: formData.subject!,
          topic: formData.topic!,
          explanation: formData.explanation,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setQuestions([newQuestion, ...questions])
        toast.success('Question created successfully')
      }
      
      setIsCreating(false)
      setIsEditing(false)
      setSelectedQuestion(null)
    } catch (error) {
      console.error('Error saving question:', error)
      toast.error('Failed to save question')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    setIsLoading(true)
    try {
      setQuestions(questions.filter(q => q.id !== questionId))
      toast.success('Question deleted successfully')
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(null)
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge className="bg-green-100 text-green-700">Beginner</Badge>
      case 'intermediate':
        return <Badge className="bg-yellow-100 text-yellow-700">Intermediate</Badge>
      case 'advanced':
        return <Badge className="bg-red-100 text-red-700">Advanced</Badge>
      default:
        return <Badge variant="outline">{difficulty}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'objective':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Multiple Choice</Badge>
      case 'true-false':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700">True/False</Badge>
      case 'theory':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700">Theory</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-1">Create and manage your question database</p>
          </div>
          <Button onClick={handleCreateQuestion} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Question
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* List Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger>
                        <SelectValue placeholder="Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {difficulties.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No questions found</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((question) => (
                      <Card
                        key={question.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedQuestion?.id === question.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleViewQuestion(question)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {getTypeBadge(question.type)}
                                {getDifficultyBadge(question.difficulty)}
                                <Badge variant="outline">{question.subject}</Badge>
                                <Badge variant="outline">{question.topic}</Badge>
                              </div>
                              <p className="font-medium text-gray-900 mb-2">{question.question_text}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(question.created_at), 'MMM dd, yyyy')}
                                </span>
                                <span>{question.points} point(s)</span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditQuestion(question)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteQuestion(question.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail/Form Panel */}
          <div className="lg:col-span-1">
            {(isCreating || isEditing || selectedQuestion) ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {isCreating ? 'Create Question' : isEditing ? 'Edit Question' : 'Question Details'}
                    </CardTitle>
                    {!isCreating && !isEditing && selectedQuestion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQuestion(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(isCreating || isEditing) ? (
                    // Form View
                    <div className="space-y-4">
                      <div>
                        <Label>Question Text *</Label>
                        <Textarea
                          value={formData.question_text}
                          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                          placeholder="Enter question text..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Subject *</Label>
                          <Select
                            value={formData.subject}
                            onValueChange={(v) => setFormData({ ...formData, subject: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Topic *</Label>
                          <Select
                            value={formData.topic}
                            onValueChange={(v) => setFormData({ ...formData, topic: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                            <SelectContent>
                              {topics.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Question Type</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="objective">Multiple Choice</SelectItem>
                              <SelectItem value="true-false">True/False</SelectItem>
                              <SelectItem value="theory">Theory/Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <Select
                            value={formData.difficulty}
                            onValueChange={(v: any) => setFormData({ ...formData, difficulty: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {difficulties.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {formData.type === 'objective' && (
                        <div>
                          <Label>Options (Select the correct answer)</Label>
                          <div className="space-y-2 mt-2">
                            {(formData.options || ['', '', '', '']).map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="correctAnswer"
                                  checked={formData.correct_answer === opt}
                                  onChange={() => setFormData({ ...formData, correct_answer: opt })}
                                  className="w-4 h-4"
                                />
                                <Input
                                  placeholder={`Option ${idx + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...(formData.options || [])]
                                    newOptions[idx] = e.target.value
                                    setFormData({ ...formData, options: newOptions })
                                  }}
                                  className="flex-1"
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Select the radio button next to the correct answer</p>
                        </div>
                      )}
                      
                      {formData.type === 'true-false' && (
                        <div>
                          <Label>Correct Answer</Label>
                          <Select
                            value={formData.correct_answer as string}
                            onValueChange={(v) => setFormData({ ...formData, correct_answer: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min={1}
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          value={formData.explanation}
                          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                          placeholder="Explain the correct answer..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSaveQuestion} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreating(false)
                            setIsEditing(false)
                            setSelectedQuestion(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : selectedQuestion ? (
                    // Detail View
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(selectedQuestion.type)}
                        {getDifficultyBadge(selectedQuestion.difficulty)}
                      </div>
                      <div>
                        <Label>Question</Label>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                          {selectedQuestion.question_text}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Subject</Label>
                          <p className="font-medium">{selectedQuestion.subject}</p>
                        </div>
                        <div>
                          <Label>Topic</Label>
                          <p className="font-medium">{selectedQuestion.topic}</p>
                        </div>
                      </div>
                      {selectedQuestion.type === 'objective' && selectedQuestion.options && (
                        <div>
                          <Label>Options</Label>
                          <div className="space-y-2 mt-1">
                            {selectedQuestion.options.map((opt, idx) => (
                              <div key={idx} className={`p-2 rounded ${opt === selectedQuestion.correct_answer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                                {opt === selectedQuestion.correct_answer && (
                                  <CheckCircle className="h-4 w-4 text-green-500 inline ml-2" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedQuestion.type === 'true-false' && (
                        <div>
                          <Label>Correct Answer</Label>
                          <Badge className="mt-1 bg-green-100 text-green-700">
                            {selectedQuestion.correct_answer === 'true' ? 'True' : 'False'}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <Label>Points</Label>
                        <p>{selectedQuestion.points} point(s)</p>
                      </div>
                      {selectedQuestion.explanation && (
                        <div>
                          <Label>Explanation</Label>
                          <p className="text-gray-600 bg-blue-50 p-3 rounded-lg mt-1">
                            {selectedQuestion.explanation}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => handleEditQuestion(selectedQuestion)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a question to view details</p>
                  <Button variant="outline" className="mt-4" onClick={handleCreateQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Question
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}