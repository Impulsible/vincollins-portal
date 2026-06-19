// src/components/staff/exams/edit/QuestionFormDialog.tsx - COMPLETE FIXED VERSION

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
import { X, Plus, AlertCircle, CheckCircle2, Save, FileCheck } from 'lucide-react'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔵 QuestionFormDialog: Opening with initialData:', initialData)
      
      // ✅ Preserve the is_draft value from initialData
      const draftStatus = initialData?.is_draft !== undefined ? initialData.is_draft : true
      
      setQuestionText(initialData?.question_text || '')
      setOptions(initialData?.options && initialData.options.length > 0 
        ? initialData.options 
        : ['', '', '', '']
      )
      setCorrectAnswer(initialData?.correct_answer || '')
      setPoints(initialData?.points || 1)
      setIsDraft(draftStatus) // ✅ Use the preserved draft status
      
      console.log('🔵 QuestionFormDialog: isDraft set to:', draftStatus)
    }
  }, [open, initialData])

  // Check if question is complete
  const isQuestionComplete = (): boolean => {
    const validOptions = options.filter(opt => opt.trim() !== '')
    return questionText.trim() !== '' && 
           validOptions.length >= 2 &&
           correctAnswer.trim() !== '' &&
           validOptions.includes(correctAnswer)
  }

  const getValidOptions = (): string[] => {
    return options.filter(opt => opt.trim() !== '')
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    
    if (correctAnswer === options[index] && value.trim() === '') {
      setCorrectAnswer('')
    }
  }

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error('Maximum 6 options allowed')
      return
    }
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    const validOptions = getValidOptions()
    if (validOptions.length <= 2) {
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
    console.log('🔵 QuestionFormDialog: Submitting with saveAsDraft:', saveAsDraft)
    console.log('🔵 QuestionFormDialog: Current isDraft:', isDraft)
    
    // Validate question text
    if (!questionText.trim()) {
      toast.error('Please enter a question text')
      return
    }

    const validOptions = getValidOptions()
    
    // If saving as draft, only require question text
    if (saveAsDraft) {
      const data = {
        question_text: questionText.trim(),
        options: validOptions.length > 0 ? validOptions : ['', '', '', ''],
        correct_answer: correctAnswer || '',
        points: points,
        is_draft: true // ✅ Always set to true for draft
      }
      console.log('🔵 QuestionFormDialog: Saving as draft:', data)
      setIsSubmitting(true)
      onSave(data)
      setTimeout(() => setIsSubmitting(false), 500)
      return
    }

    // Full validation for complete question
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

    const data = {
      question_text: questionText.trim(),
      options: validOptions,
      correct_answer: correctAnswer,
      points: points,
      is_draft: false // ✅ Explicitly set to false for complete
    }
    console.log('🔵 QuestionFormDialog: Saving as complete:', data)
    setIsSubmitting(true)
    onSave(data)
    setTimeout(() => setIsSubmitting(false), 500)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      if (onCancel) onCancel()
    }
  }

  const complete = isQuestionComplete()
  const validOptions = getValidOptions()
  const isEditing = !!initialData?.id

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? 'Edit Objective Question' : 'Add Objective Question'}
            {isDraft && !complete && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Draft
              </Badge>
            )}
            {complete && !isDraft && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                Complete
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Status Alert */}
          {!complete && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 text-sm whitespace-pre-line">
                {!questionText.trim() && '• Question text is required\n'}
                {validOptions.length < 2 && '• At least 2 options are required\n'}
                {!correctAnswer && '• Please select the correct answer'}
              </AlertDescription>
            </Alert>
          )}

          {complete && (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700 text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Question is complete and ready for the exam.
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
              disabled={isSubmitting}
            />
          </div>

          {/* Options */}
          <div>
            <Label className="text-sm font-semibold">
              Options <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-slate-400 ml-2">
                ({validOptions.length} of minimum 2)
              </span>
            </Label>
            <p className="text-xs text-slate-400 mb-2">
              Enter the possible answers. Minimum 2 options, maximum 6.
            </p>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className={`flex items-center justify-center w-8 h-9 rounded-md text-sm font-medium ${
                    opt.trim() && correctAnswer === opt 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                      : opt.trim() 
                        ? 'bg-slate-100 text-slate-700' 
                        : 'bg-slate-50 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className={`flex-1 ${correctAnswer === opt && opt.trim() ? 'border-emerald-300 bg-emerald-50' : ''}`}
                    disabled={isSubmitting}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {opt.trim() && correctAnswer === opt && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 whitespace-nowrap">
                      ✓ Correct
                    </Badge>
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
                disabled={isSubmitting}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Option
              </Button>
            )}
          </div>

          {/* Correct Answer */}
          <div>
            <Label className="text-sm font-semibold">
              Correct Answer {validOptions.length >= 2 && <span className="text-red-500">*</span>}
            </Label>
            {validOptions.length >= 2 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {validOptions.map((opt) => {
                  const idx = validOptions.indexOf(opt)
                  return (
                    <Button
                      key={idx}
                      type="button"
                      variant={correctAnswer === opt ? "default" : "outline"}
                      onClick={() => setCorrectAnswer(opt)}
                      className={`${
                        correctAnswer === opt 
                          ? "bg-emerald-600 hover:bg-emerald-700" 
                          : "border-gray-200 hover:border-emerald-300"
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isSubmitting}
                    >
                      {String.fromCharCode(65 + idx)}. {opt.length > 25 ? opt.substring(0, 25) + '...' : opt}
                    </Button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-amber-600 mt-1.5">
                Please add at least 2 options to select the correct answer.
              </p>
            )}
            {correctAnswer && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Selected: {correctAnswer}
              </p>
            )}
          </div>

          {/* Points */}
          <div>
            <Label className="text-sm font-semibold">Points per Question</Label>
            <div className="flex items-center gap-4 mt-1.5">
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
                min={0.5}
                step={0.5}
                className="w-32"
                disabled={isSubmitting}
              />
              <span className="text-sm text-slate-500">Recommended: 1 point</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          {/* Save as Draft button */}
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(true)}
            disabled={!questionText.trim() || isSubmitting}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isEditing ? 'Save as Draft' : 'Save as Draft'}
          </Button>
          
          {/* Save Complete button */}
          <Button 
            onClick={() => handleSubmit(false)} 
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            disabled={!complete || isSubmitting}
          >
            <FileCheck className="h-4 w-4" />
            {isEditing ? 'Update Complete' : 'Add Complete Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}