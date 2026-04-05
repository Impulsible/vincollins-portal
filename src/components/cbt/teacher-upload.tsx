/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, Loader2, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import mammoth from 'mammoth'
import { toast } from 'sonner'

interface TeacherUploadProps {
  onClose: () => void
  onSuccess: () => void
}

export function TeacherUpload({ onClose, onSuccess }: TeacherUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [examData, setExamData] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    category: '',
    class: '',
    duration: 60,
    passing_score: 50,
    instructions: '',
    requires_access_code: false
  })

  const parseWordDocument = async (file: File) => {
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value
      
      // Parse questions from text
      const parsedQuestions = parseQuestions(text)
      
      setExamData({
        title: file.name.replace('.docx', ''),
        questions: parsedQuestions,
        total_questions: parsedQuestions.length
      })
      
      toast.success(`Successfully parsed ${parsedQuestions.length} questions`)
    } catch (error) {
      toast.error('Failed to parse document')
    } finally {
      setIsProcessing(false)
    }
  }

  const parseQuestions = (text: string) => {
    const lines = text.split('\n')
    const questions: any[] = []
    let currentQuestion: any = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      // Match question number (1., 1), etc.)
      const questionMatch = trimmed.match(/^(\d+)[\.\)]\s*(.+)/)
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion)
        }
        currentQuestion = {
          id: Date.now() + Math.random(),
          text: questionMatch[2],
          type: 'objective',
          options: [],
          correct_answer: '',
          points: 1
        }
      } 
      // Match options (A., B., etc.)
      else if (currentQuestion && trimmed.match(/^[A-D][\.\)]\s*(.+)/i)) {
        const optionMatch = trimmed.match(/^[A-D][\.\)]\s*(.+)/i)
        if (optionMatch) {
          currentQuestion.options.push(optionMatch[1])
        }
      }
      // Match answer
      else if (currentQuestion && trimmed.toLowerCase().match(/answer:?\s*(.+)/i)) {
        const answerMatch = trimmed.match(/answer:?\s*(.+)/i)
        if (answerMatch) {
          currentQuestion.correct_answer = answerMatch[1].trim()
        }
      }
      // Theory question
      else if (currentQuestion && trimmed.toLowerCase().includes('theory')) {
        currentQuestion.type = 'theory'
      }
    }
    
    if (currentQuestion) {
      questions.push(currentQuestion)
    }
    
    return questions
  }

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.name.endsWith('.docx')) {
      parseWordDocument(file)
    } else {
      toast.error('Please upload a valid .docx file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    disabled: isProcessing
  })

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: '',
        type: 'objective',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1
      }
    ])
  }

  const updateQuestion = (id: string, updates: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject || questions.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          questions,
          total_questions: questions.length
        })
      })
      
      if (response.ok) {
        toast.success('Exam uploaded successfully!')
        onSuccess()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save exam')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Upload Exam</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Word Document</TabsTrigger>
              <TabsTrigger value="manual">Create Manually</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              {!examData ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                    isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold">Upload Exam Document</p>
                  <p className="text-sm text-gray-500">Drag and drop or click to select a .docx file</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={examData.title} onChange={(e) => setExamData({ ...examData, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Questions Found</Label>
                    <p className="text-2xl font-bold">{examData.questions.length}</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setExamData(null)}>Upload Another</Button>
                    <Button onClick={() => {
                      setQuestions(examData.questions)
                      setFormData({ ...formData, title: examData.title })
                      setActiveTab('manual')
                    }}>
                      Review & Edit
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exam Title *</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior Secondary</SelectItem>
                      <SelectItem value="senior-science">Senior Science</SelectItem>
                      <SelectItem value="senior-arts">Senior Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class</Label>
                  <Input value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} placeholder="e.g., SS2, JSS3" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input type="number" value={formData.passing_score} onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })} />
                </div>
              </div>
              
              <div>
                <Label>Instructions</Label>
                <Textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={3} />
              </div>
              
              <div>
                <Label>Access Code Required</Label>
                <Select value={formData.requires_access_code ? 'yes' : 'no'} onValueChange={(v) => setFormData({ ...formData, requires_access_code: v === 'yes' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No - Open to all students</SelectItem>
                    <SelectItem value="yes">Yes - Students need access code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-semibold">Questions ({questions.length})</Label>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((q, idx) => (
                    <Card key={q.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold">Question {idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <Input 
                          placeholder="Question text"
                          value={q.text}
                          onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                        />
                        
                        <Select value={q.type} onValueChange={(v) => updateQuestion(q.id, { type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="objective">Objective (Multiple Choice)</SelectItem>
                            <SelectItem value="theory">Theory (Essay)</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {q.type === 'objective' && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <Input placeholder="Option A" value={q.options[0]} onChange={(e) => {
                                const newOptions = [...q.options]
                                newOptions[0] = e.target.value
                                updateQuestion(q.id, { options: newOptions })
                              }} />
                              <Input placeholder="Option B" value={q.options[1]} onChange={(e) => {
                                const newOptions = [...q.options]
                                newOptions[1] = e.target.value
                                updateQuestion(q.id, { options: newOptions })
                              }} />
                              <Input placeholder="Option C" value={q.options[2]} onChange={(e) => {
                                const newOptions = [...q.options]
                                newOptions[2] = e.target.value
                                updateQuestion(q.id, { options: newOptions })
                              }} />
                              <Input placeholder="Option D" value={q.options[3]} onChange={(e) => {
                                const newOptions = [...q.options]
                                newOptions[3] = e.target.value
                                updateQuestion(q.id, { options: newOptions })
                              }} />
                            </div>
                            <Input 
                              placeholder="Correct answer (A, B, C, or D)"
                              value={q.correct_answer}
                              onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                            />
                          </>
                        )}
                        
                        {q.type === 'theory' && (
                          <Textarea 
                            placeholder="Model answer (optional)"
                            value={q.correct_answer || ''}
                            onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                            rows={3}
                          />
                        )}
                        
                        <Input 
                          type="number"
                          placeholder="Points"
                          value={q.points}
                          onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) })}
                          className="w-32"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-primary">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Exam'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}