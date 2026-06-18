// src/components/staff/exams/edit/TheoryQuestionFormDialog.tsx - FULLY UPDATED

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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Plus, Layers, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TheoryQuestion, TheorySubQuestion } from './types'

interface TheoryQuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<TheoryQuestion>
  onSave: (data: Partial<TheoryQuestion>) => void
  onCancel?: () => void
}

export function TheoryQuestionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  onCancel
}: TheoryQuestionFormDialogProps) {
  const [questionText, setQuestionText] = useState('')
  const [points, setPoints] = useState(10)
  const [keywords, setKeywords] = useState<string[]>([])
  const [modelAnswer, setModelAnswer] = useState('')
  const [subQuestions, setSubQuestions] = useState<TheorySubQuestion[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [useSubQuestions, setUseSubQuestions] = useState(false)
  const [isDraft, setIsDraft] = useState(true)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setQuestionText(initialData?.question_text || '')
      setPoints(initialData?.points || 10)
      setKeywords(initialData?.keywords || [])
      setModelAnswer(initialData?.model_answer || '')
      setSubQuestions(initialData?.sub_questions || [])
      setUseSubQuestions(!!initialData?.sub_questions?.length)
      setIsDraft(initialData?.is_draft !== undefined ? initialData.is_draft : true)
      setKeywordInput('')
    }
  }, [open, initialData])

  // Check if question is complete
  const isQuestionComplete = (): boolean => {
    if (!questionText.trim()) return false
    if (useSubQuestions) {
      return subQuestions.length > 0 && 
             subQuestions.every(sq => sq.text.trim() !== '' && sq.points > 0)
    }
    return points > 0
  }

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()
    if (!keyword) return
    if (keywords.includes(keyword)) {
      toast.error('Keyword already added')
      return
    }
    if (keywords.length >= 10) {
      toast.error('Maximum 10 keywords per question')
      return
    }
    setKeywords([...keywords, keyword])
    setKeywordInput('')
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleAddSubQuestion = () => {
    setSubQuestions([...subQuestions, {
      id: Date.now().toString(),
      text: '',
      points: 5
    }])
  }

  const handleUpdateSubQuestion = (index: number, data: Partial<TheorySubQuestion>) => {
    const updated = [...subQuestions]
    updated[index] = { ...updated[index], ...data }
    setSubQuestions(updated)
  }

  const handleDeleteSubQuestion = (index: number) => {
    setSubQuestions(subQuestions.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    onOpenChange(false)
    if (onCancel) onCancel()
  }

  const handleSubmit = (saveAsDraft: boolean = false) => {
    // If saving as draft, only require question text
    if (saveAsDraft) {
      if (!questionText.trim()) {
        toast.error('Please enter a question text')
        return
      }
      
      onSave({
        question_text: questionText,
        points: points,
        sub_questions: subQuestions,
        keywords: keywords.length > 0 ? keywords : undefined,
        model_answer: modelAnswer.trim() || undefined,
        is_draft: true
      })
      return
    }

    // Full validation for complete question
    if (!questionText.trim()) {
      toast.error('Please enter a question')
      return
    }
    
    if (useSubQuestions) {
      if (subQuestions.length === 0) {
        toast.error('Please add at least one sub-question')
        return
      }
      
      for (let i = 0; i < subQuestions.length; i++) {
        const sq = subQuestions[i]
        if (!sq.text.trim()) {
          toast.error(`Sub-question ${String.fromCharCode(97 + i)} is empty`)
          return
        }
        if (sq.points < 1) {
          toast.error(`Sub-question ${String.fromCharCode(97 + i)} points must be at least 1`)
          return
        }
      }
      
      const totalPoints = subQuestions.reduce((sum, sq) => sum + sq.points, 0)
      
      onSave({
        question_text: questionText,
        points: totalPoints,
        sub_questions: subQuestions,
        keywords: keywords.length > 0 ? keywords : undefined,
        model_answer: modelAnswer.trim() || undefined,
        is_draft: false
      })
    } else {
      if (points < 1) {
        toast.error('Points must be at least 1')
        return
      }
      if (points > 50) {
        toast.error('Points cannot exceed 50')
        return
      }
      
      onSave({
        question_text: questionText,
        points,
        keywords: keywords.length > 0 ? keywords : undefined,
        model_answer: modelAnswer.trim() || undefined,
        is_draft: false
      })
    }
  }

  const complete = isQuestionComplete()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initialData?.id ? 'Edit Theory Question' : 'Add Theory Question'}
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
                {useSubQuestions 
                  ? 'Add sub-questions and points to mark as complete.'
                  : 'Add points to mark as complete.'}
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

          {/* Question Type Toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
            <Button
              type="button"
              size="sm"
              variant={!useSubQuestions ? "default" : "ghost"}
              onClick={() => setUseSubQuestions(false)}
              className="h-8"
            >
              Single Question
            </Button>
            <Button
              type="button"
              size="sm"
              variant={useSubQuestions ? "default" : "ghost"}
              onClick={() => setUseSubQuestions(true)}
              className="h-8"
            >
              <Layers className="h-3 w-3 mr-1" />
              Multi-part Question
            </Button>
          </div>

          {/* Question Text */}
          <div>
            <Label className="text-sm font-semibold">Question Text *</Label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              className="min-h-[120px] mt-1.5"
            />
          </div>

          {!useSubQuestions ? (
            <>
              <div>
                <Label className="text-sm font-semibold">Points</Label>
                <Input 
                  type="number" 
                  value={points} 
                  onChange={(e) => setPoints(parseInt(e.target.value) || 10)} 
                  min={1}
                  max={50}
                  className="mt-1.5 w-32"
                />
                <p className="text-xs text-slate-400 mt-1">Recommended: 5-20 points per question</p>
              </div>

              {/* Keywords */}
              <div>
                <Label className="text-sm font-semibold">Keywords (for grading)</Label>
                <p className="text-xs text-slate-400 mb-2">
                  Add keywords that should be present in student answers for partial credit
                </p>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., photosynthesis, energy, sunlight"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddKeyword} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Model Answer */}
              <div>
                <Label className="text-sm font-semibold">Model Answer (Optional)</Label>
                <Textarea
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="Enter a model answer or grading rubric..."
                  className="min-h-[100px] mt-1.5"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Sub-questions *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddSubQuestion}>
                    <Plus className="h-3 w-3 mr-1" /> Add Sub-question
                  </Button>
                </div>
                
                {subQuestions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-slate-500">No sub-questions added yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add sub-questions like (a), (b), (c) with their own points
                    </p>
                    <Button type="button" variant="link" size="sm" onClick={handleAddSubQuestion}>
                      Add your first sub-question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subQuestions.map((sq, idx) => (
                      <div key={sq.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">
                            Sub-question {String.fromCharCode(97 + idx)}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubQuestion(idx)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={sq.text}
                          onChange={(e) => handleUpdateSubQuestion(idx, { text: e.target.value })}
                          placeholder={`Enter sub-question ${String.fromCharCode(97 + idx)}`}
                          className="min-h-[60px]"
                        />
                        <div className="mt-2">
                          <Label className="text-xs">Points</Label>
                          <Input
                            type="number"
                            value={sq.points}
                            onChange={(e) => handleUpdateSubQuestion(idx, { points: parseInt(e.target.value) || 1 })}
                            min={1}
                            className="w-24 mt-1"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-3 bg-slate-50 rounded-lg mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total Points:</span>
                        <span className="font-bold text-purple-600">
                          {subQuestions.reduce((sum, sq) => sum + sq.points, 0)} marks
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(true)}
            disabled={!questionText.trim()}
          >
            Save as Draft
          </Button>
          
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