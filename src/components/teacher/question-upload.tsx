// components/teacher/question-upload.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Question {
  question_text: string
  type: 'objective' | 'theory' | 'true-false'
  options: string[]
  correct_answer: string
  points: number
  explanation: string
  difficulty: string
}

interface QuestionUploadProps {
  examId: string
  onQuestionAdded: () => void
}

export function QuestionUpload({ examId, onQuestionAdded }: QuestionUploadProps) {
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: '', type: 'objective', options: ['', '', '', ''], correct_answer: '', points: 1, explanation: '', difficulty: 'beginner' }
  ])
  const [uploading, setUploading] = useState(false)

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', type: 'objective', options: ['', '', '', ''], correct_answer: '', points: 1, explanation: '', difficulty: 'beginner' }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const handleSubmit = async () => {
    setUploading(true)
    try {
      for (const question of questions) {
        if (!question.question_text) {
          toast.error('Please fill in all question texts')
          return
        }

        const response = await fetch(`/api/teacher/exams/${examId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question)
        })

        if (!response.ok) throw new Error('Failed to upload question')
      }

      toast.success(`${questions.length} question(s) uploaded successfully!`)
      onQuestionAdded()
      setQuestions([{ question_text: '', type: 'objective', options: ['', '', '', ''], correct_answer: '', points: 1, explanation: '', difficulty: 'beginner' }])
    } catch (error) {
      console.error('Error uploading questions:', error)
      toast.error('Failed to upload questions')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {questions.map((question, idx) => (
        <Card key={idx} className="relative">
          <CardContent className="pt-6">
            {questions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-500"
                onClick={() => removeQuestion(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <div className="space-y-4">
              <div>
                <Label>Question {idx + 1}</Label>
                <Textarea
                  placeholder="Enter question text..."
                  value={question.question_text}
                  onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(v) => updateQuestion(idx, 'type', v)}
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
                    value={question.difficulty}
                    onValueChange={(v) => updateQuestion(idx, 'difficulty', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {question.type === 'objective' && (
                <div>
                  <Label>Options (Select the correct answer)</Label>
                  <div className="space-y-2">
                    {question.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <RadioGroup
                          value={question.correct_answer}
                          onValueChange={(v) => updateQuestion(idx, 'correct_answer', v)}
                        >
                          <RadioGroupItem value={opt} />
                        </RadioGroup>
                        <Input
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...question.options]
                            newOptions[optIdx] = e.target.value
                            updateQuestion(idx, 'options', newOptions)
                          }}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.type === 'true-false' && (
                <div>
                  <Label>Correct Answer</Label>
                  <Select
                    value={question.correct_answer}
                    onValueChange={(v) => updateQuestion(idx, 'correct_answer', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={question.points}
                    onChange={(e) => updateQuestion(idx, 'points', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Explanation (Optional)</Label>
                  <Input
                    placeholder="Explain the correct answer..."
                    value={question.explanation}
                    onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4">
        <Button variant="outline" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Another Question
        </Button>
        <Button onClick={handleSubmit} disabled={uploading}>
          {uploading ? 'Uploading...' : `Upload ${questions.length} Question(s)`}
        </Button>
      </div>
    </div>
  )
}