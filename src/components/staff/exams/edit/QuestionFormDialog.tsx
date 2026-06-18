// src/components/staff/exams/edit/QuestionFormDialog.tsx - FULLY UPDATED

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Question } from './types'

interface QuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<Question>
  onSave: (data: Partial<Question>) => void
  onCancel?: () => void
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  onCancel
}: QuestionFormDialogProps) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [points, setPoints] = useState<number>(1)
  const [isDraft, setIsDraft] = useState(true)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setQuestionText(initialData?.question_text || '')
      setOptions(initialData?.options || ['', '', '', ''])
      setCorrectAnswer(initialData?.correct_answer || '')
      setPoints(initialData?.points || 1)
      setIsDraft(initialData?.is_draft !== undefined ? initialData.is_draft : true)
    }
  }, [open, initialData])

  // Check if question is complete
  const isQuestionComplete = (): boolean => {
    return questionText.trim() !== '' && 
           options.some(opt => opt.trim() !== '') &&
           correctAnswer.trim() !== ''
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error('Maximum 6 options allowed')
      return
    }
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Minimum 2 options required')
      return
    }
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
    if (correctAnswer === options[index]) {
      setCorrectAnswer('')
    }
  }

  const handleSubmit = (saveAsDraft: boolean = false) => {
    // If saving as draft, only require question text
    if (saveAsDraft) {
      if (!questionText.trim()) {
        toast.error('Please enter a question text')
        return
      }
      
      onSave({
        question_text: questionText.trim(),
        options: options.filter(opt => opt.trim()),
        correct_answer: correctAnswer || '',
        points: points,
        is_draft: true
      })
      return
    }

    // Full validation for complete question
    if (!questionText.trim()) {
      toast.error('Please enter a question')
      return
    }

    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      toast.error('Please enter at least 2 options')
      return
    }

    if (!correctAnswer) {
      toast.error('Please select the correct answer')
      return
    }

    if (!validOptions.includes(correctAnswer)) {
      toast.error('Correct answer must match one of the options')
      return
    }

    onSave({
      question_text: questionText.trim(),
      options: validOptions,
      correct_answer: correctAnswer,
      points: points,
      is_draft: false
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    if (onCancel) onCancel()
  }

  const complete = isQuestionComplete()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initialData?.id ? 'Edit Objective Question' : 'Add Objective Question'}
            {initialData?.is_draft && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Draft
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Status Alert */}
          {!complete && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 text-sm">
                This question is incomplete. Add options and correct answer to mark as complete.
              </AlertDescription>
            </Alert>
          )}

          {complete && (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700 text-sm">
                ✓ Question is complete and ready for the exam.
              </AlertDescription>
            </Alert>
          )}

          {/* Question Text */}
          <div>
            <Label htmlFor="question-text" className="text-sm font-semibold">
              Question Text <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              className="min-h-[80px] mt-1.5"
            />
          </div>

          {/* Options */}
          <div>
            <Label className="text-sm font-semibold">
              Options <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-400 mb-2">
              Enter the possible answers. Minimum 2 options, maximum 6.
            </p>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex items-center justify-center w-8 h-9 bg-slate-100 rounded-md text-sm font-medium">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-9 w-9 p-0 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Option
              </Button>
            )}
          </div>

          {/* Correct Answer */}
          <div>
            <Label className="text-sm font-semibold">Correct Answer</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {options.map((opt, idx) => (
                opt.trim() && (
                  <Button
                    key={idx}
                    type="button"
                    variant={correctAnswer === opt ? "default" : "outline"}
                    onClick={() => setCorrectAnswer(opt)}
                    className={correctAnswer === opt 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "border-gray-200 hover:border-emerald-300"
                    }
                  >
                    {String.fromCharCode(65 + idx)}. {opt.length > 30 ? opt.substring(0, 30) + '...' : opt}
                  </Button>
                )
              ))}
            </div>
            {correctAnswer && (
              <p className="text-xs text-emerald-600 mt-2">
                ✓ Selected: {correctAnswer}
              </p>
            )}
          </div>

          {/* Points */}
          <div>
            <Label className="text-sm font-semibold">Points</Label>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
              min={0.5}
              step={0.5}
              className="mt-1.5 w-32"
            />
            <p className="text-xs text-slate-400 mt-1">Recommended: 1 point per question</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          
          {/* Save as Draft button */}
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(true)}
            disabled={!questionText.trim()}
          >
            Save as Draft
          </Button>
          
          {/* Save Complete button */}
          <Button 
            onClick={() => handleSubmit(false)} 
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={!complete}
          >
            {initialData?.id ? 'Update' : 'Add'} Complete Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}