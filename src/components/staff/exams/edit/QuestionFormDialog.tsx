// src/components/staff/exams/edit/QuestionFormDialog.tsx - WITH DARK MODE
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Plus, AlertCircle, CheckCircle2, Save, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Question } from './types'

interface QuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<Question>
  onSave: (data: Partial<Question>) => void
  onCancel?: () => void
  defaultMark?: number
}

export function QuestionFormDialog({
  open, onOpenChange, initialData, onSave, onCancel, defaultMark = 0.5
}: QuestionFormDialogProps) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [points, setPoints] = useState<number>(defaultMark)
  const [isDraft, setIsDraft] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const draftStatus = initialData?.is_draft !== undefined ? initialData.is_draft : true
      const markValue = initialData?.points || defaultMark
      setQuestionText(initialData?.question_text || '')
      setOptions(initialData?.options && initialData.options.length > 0 ? initialData.options : ['', '', '', ''])
      setCorrectAnswer(initialData?.correct_answer || '')
      setPoints(markValue)
      setIsDraft(draftStatus)
    }
  }, [open, initialData, defaultMark])

  const isQuestionComplete = (): boolean => {
    const validOptions = options.filter(opt => opt.trim() !== '')
    return questionText.trim() !== '' && validOptions.length >= 2 && correctAnswer.trim() !== '' && validOptions.includes(correctAnswer)
  }

  const getValidOptions = (): string[] => options.filter(opt => opt.trim() !== '')

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    if (correctAnswer === options[index] && value.trim() === '') setCorrectAnswer('')
  }

  const handleAddOption = () => {
    if (options.length >= 6) return toast.error('Maximum 6 options allowed')
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    const validOptions = getValidOptions()
    if (validOptions.length <= 2) return toast.error('Minimum 2 options required')
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
    if (correctAnswer === options[index]) setCorrectAnswer('')
  }

  const handleSubmit = (saveAsDraft: boolean = false) => {
    if (!questionText.trim()) return toast.error('Please enter a question text')

    const validOptions = getValidOptions()
    if (saveAsDraft) {
      const data = { question_text: questionText.trim(), options: validOptions.length > 0 ? validOptions : ['', '', '', ''], correct_answer: correctAnswer || '', points: points || defaultMark, is_draft: true }
      setIsSubmitting(true); onSave(data); setTimeout(() => setIsSubmitting(false), 500); return
    }

    if (validOptions.length < 2) return toast.error('Please enter at least 2 options')
    if (!correctAnswer) return toast.error('Please select the correct answer')
    if (!validOptions.includes(correctAnswer)) return toast.error('Correct answer must match one of the options')

    const data = { question_text: questionText.trim(), options: validOptions, correct_answer: correctAnswer, points: points || defaultMark, is_draft: false }
    setIsSubmitting(true); onSave(data); setTimeout(() => setIsSubmitting(false), 500)
  }

  const handleClose = () => { if (!isSubmitting) { onOpenChange(false); if (onCancel) onCancel() } }

  const complete = isQuestionComplete()
  const validOptions = getValidOptions()
  const isEditing = !!initialData?.id

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Objective Question' : 'Add Objective Question'}
            {isDraft && !complete && <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800">Draft</Badge>}
            {complete && !isDraft && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Complete</Badge>}
            {!isEditing && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[10px]">{defaultMark} mark each</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {!complete && (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm whitespace-pre-line">
                {!questionText.trim() && '• Question text is required\n'}
                {validOptions.length < 2 && '• At least 2 options are required\n'}
                {!correctAnswer && '• Please select the correct answer'}
              </AlertDescription>
            </Alert>
          )}

          {complete && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4" /> Question is complete and ready for the exam.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="question-text" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Question Text <span className="text-red-500 dark:text-red-400">*</span></Label>
            <Textarea id="question-text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter your question here..." className="min-h-[80px] mt-1.5 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100" disabled={isSubmitting} />
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Options <span className="text-red-500 dark:text-red-400">*</span><span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2">({validOptions.length} of minimum 2)</span></Label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Enter the possible answers. Minimum 2 options, maximum 6.</p>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className={cn("flex items-center justify-center w-8 h-9 rounded-md text-sm font-medium",
                    opt.trim() && correctAnswer === opt 
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50" 
                      : opt.trim() ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" 
                      : "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600"
                  )}>{String.fromCharCode(65 + idx)}</div>
                  <Input value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + idx)}`} className={cn("flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white", correctAnswer === opt && opt.trim() && "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20")} disabled={isSubmitting} />
                  {options.length > 2 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveOption(idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={isSubmitting}><X className="h-4 w-4" /></Button>}
                  {opt.trim() && correctAnswer === opt && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 whitespace-nowrap">✓ Correct</Badge>}
                </div>
              ))}
            </div>
            {options.length < 6 && <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="mt-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300" disabled={isSubmitting}><Plus className="h-3 w-3 mr-1" /> Add Option</Button>}
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correct Answer {validOptions.length >= 2 && <span className="text-red-500 dark:text-red-400">*</span>}</Label>
            {validOptions.length >= 2 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {validOptions.map((opt) => {
                  const idx = validOptions.indexOf(opt)
                  return (
                    <Button key={idx} type="button" variant={correctAnswer === opt ? "default" : "outline"} onClick={() => setCorrectAnswer(opt)} className={cn("truncate", correctAnswer === opt ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white border-transparent" : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/50 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300", isSubmitting && "opacity-50 cursor-not-allowed")} disabled={isSubmitting}>
                      {String.fromCharCode(65 + idx)}. {opt.length > 25 ? opt.substring(0, 25) + '...' : opt}
                    </Button>
                  )
                })}
              </div>
            ) : (<p className="text-sm text-amber-600 dark:text-amber-500 mt-1.5">Please add at least 2 options to select the correct answer.</p>)}
            {correctAnswer && <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Selected: {correctAnswer}</p>}
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Points per Question</Label>
            <div className="flex items-center gap-4 mt-1.5">
              <Input type="number" value={points} onChange={(e) => setPoints(parseFloat(e.target.value) || defaultMark)} min={0.5} step={0.5} className="w-32 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" disabled={isSubmitting} />
              <span className="text-sm text-slate-500 dark:text-slate-400">Default: {defaultMark} mark</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={!questionText.trim() || isSubmitting} className="gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700">
            <Save className="h-4 w-4" />{isEditing ? 'Save as Draft' : 'Save as Draft'}
          </Button>
          <Button onClick={() => handleSubmit(false)} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white gap-2" disabled={!complete || isSubmitting}>
            <FileCheck className="h-4 w-4" />{isEditing ? 'Update Complete' : 'Add Complete Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}