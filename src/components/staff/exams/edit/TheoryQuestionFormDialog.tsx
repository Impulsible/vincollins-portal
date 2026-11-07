// src/components/staff/exams/edit/TheoryQuestionFormDialog.tsx - WITH DARK MODE
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Plus, Layers, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { TheoryQuestion, TheorySubQuestion } from './types'

interface TheoryQuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<TheoryQuestion>
  onSave: (data: Partial<TheoryQuestion>) => void
  onCancel?: () => void
  defaultMark?: number
  totalTheoryMarks?: number
  theoryQuestionCount?: number
  examTotal?: number
}

export function TheoryQuestionFormDialog({
  open, onOpenChange, initialData, onSave, onCancel, defaultMark = 0.5, totalTheoryMarks = 0, theoryQuestionCount = 0, examTotal = 60,
}: TheoryQuestionFormDialogProps) {
  const [questionText, setQuestionText] = useState('')
  const [points, setPoints] = useState(10)
  const [keywords, setKeywords] = useState<string[]>([])
  const [modelAnswer, setModelAnswer] = useState('')
  const [subQuestions, setSubQuestions] = useState<TheorySubQuestion[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [useSubQuestions, setUseSubQuestions] = useState(false)
  const [isDraft, setIsDraft] = useState(true)

  const marksPerTheoryQuestion = theoryQuestionCount > 0 && totalTheoryMarks > 0 ? totalTheoryMarks / theoryQuestionCount : 0

  useEffect(() => {
    if (open) {
      setQuestionText(initialData?.question_text || '')
      setPoints(initialData?.points || (marksPerTheoryQuestion > 0 ? marksPerTheoryQuestion : 10))
      setKeywords(initialData?.keywords || [])
      setModelAnswer(initialData?.model_answer || '')
      setSubQuestions(initialData?.sub_questions || [])
      setUseSubQuestions(!!initialData?.sub_questions?.length)
      setIsDraft(initialData?.is_draft !== undefined ? initialData.is_draft : true)
      setKeywordInput('')
    }
  }, [open, initialData, marksPerTheoryQuestion])

  const isQuestionComplete = (): boolean => {
    if (!questionText.trim()) return false
    if (useSubQuestions) return subQuestions.length > 0 && subQuestions.every(sq => sq.text.trim() !== '' && sq.points > 0)
    return points > 0
  }

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()
    if (!keyword) return
    if (keywords.includes(keyword)) return toast.error('Keyword already added')
    if (keywords.length >= 10) return toast.error('Maximum 10 keywords per question')
    setKeywords([...keywords, keyword])
    setKeywordInput('')
  }

  const handleRemoveKeyword = (keyword: string) => setKeywords(keywords.filter(k => k !== keyword))

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword() }
  }

  const handleAddSubQuestion = () => {
    const subQuestionPoints = marksPerTheoryQuestion > 0 ? Math.round((marksPerTheoryQuestion / 2) * 100) / 100 : 5
    setSubQuestions([...subQuestions, { id: Date.now().toString(), text: '', points: subQuestionPoints }])
  }

  const handleUpdateSubQuestion = (index: number, data: Partial<TheorySubQuestion>) => {
    const updated = [...subQuestions]
    updated[index] = { ...updated[index], ...data }
    setSubQuestions(updated)
  }

  const handleDeleteSubQuestion = (index: number) => setSubQuestions(subQuestions.filter((_, i) => i !== index))

  const handleClose = () => { onOpenChange(false); if (onCancel) onCancel() }

  const handleSubmit = (saveAsDraft: boolean = false) => {
    if (saveAsDraft) {
      if (!questionText.trim()) return toast.error('Please enter a question text')
      onSave({ question_text: questionText, points, sub_questions: subQuestions, keywords: keywords.length > 0 ? keywords : undefined, model_answer: modelAnswer.trim() || undefined, is_draft: true })
      return
    }

    if (!questionText.trim()) return toast.error('Please enter a question')
    
    if (useSubQuestions) {
      if (subQuestions.length === 0) return toast.error('Please add at least one sub-question')
      for (let i = 0; i < subQuestions.length; i++) {
        const sq = subQuestions[i]
        if (!sq.text.trim()) return toast.error(`Sub-question ${String.fromCharCode(97 + i)} is empty`)
        if (sq.points < 1) return toast.error(`Sub-question ${String.fromCharCode(97 + i)} points must be at least 1`)
      }
      const totalPoints = subQuestions.reduce((sum, sq) => sum + sq.points, 0)
      onSave({ question_text: questionText, points: totalPoints, sub_questions: subQuestions, keywords: keywords.length > 0 ? keywords : undefined, model_answer: modelAnswer.trim() || undefined, is_draft: false })
    } else {
      if (points < 1) return toast.error('Points must be at least 1')
      if (points > 50) return toast.error('Points cannot exceed 50')
      onSave({ question_text: questionText, points, keywords: keywords.length > 0 ? keywords : undefined, model_answer: modelAnswer.trim() || undefined, is_draft: false })
    }
  }

  const complete = isQuestionComplete()
  const totalSubQuestionPoints = subQuestions.reduce((sum, sq) => sum + sq.points, 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap text-slate-900 dark:text-slate-100">
            {initialData?.id ? 'Edit Theory Question' : 'Add Theory Question'}
            {initialData?.is_draft && <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/30">📝 Draft</Badge>}
            {marksPerTheoryQuestion > 0 && !initialData?.id && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0 text-[10px]">{marksPerTheoryQuestion.toFixed(2)} marks each</Badge>}
            {totalTheoryMarks > 0 && <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-[10px]">Theory: {totalTheoryMarks} marks total</Badge>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Marks:</span>
            {marksPerTheoryQuestion > 0 && <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400">Per question: {marksPerTheoryQuestion.toFixed(2)}mk</Badge>}
            {totalTheoryMarks > 0 && <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400">Theory total: {totalTheoryMarks}mk</Badge>}
            {examTotal > 0 && <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400">Exam total: {examTotal}mk</Badge>}
            {useSubQuestions && subQuestions.length > 0 && <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400">Sub-questions: {subQuestions.length}</Badge>}
          </div>

          {!complete && (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                {useSubQuestions ? 'Add sub-questions and points to mark as complete.' : 'Add points to mark as complete.'}
              </AlertDescription>
            </Alert>
          )}

          {complete && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400 text-sm">✓ Question is complete and ready for the exam.</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
            <Button type="button" size="sm" variant={!useSubQuestions ? "default" : "ghost"} onClick={() => setUseSubQuestions(false)} className={cn("h-8", !useSubQuestions && "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm")}>Single Question</Button>
            <Button type="button" size="sm" variant={useSubQuestions ? "default" : "ghost"} onClick={() => setUseSubQuestions(true)} className={cn("h-8", useSubQuestions && "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm")}><Layers className="h-3 w-3 mr-1" />Multi-part Question</Button>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Question Text *</Label>
            <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter your question here..." className="min-h-[120px] mt-1.5 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
          </div>

          {!useSubQuestions ? (
            <>
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Points</Label>
                <Input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || (marksPerTheoryQuestion > 0 ? marksPerTheoryQuestion : 10))} min={1} max={50} className="mt-1.5 w-32 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                {marksPerTheoryQuestion > 0 && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Suggested: {marksPerTheoryQuestion.toFixed(2)} marks per question</p>}
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Keywords (for grading)</Label>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Add keywords that should be present in student answers for partial credit</p>
                <div className="flex gap-2">
                  <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="e.g., photosynthesis, energy, sunlight" className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                  <Button type="button" variant="outline" onClick={handleAddKeyword} size="sm" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"><Plus className="h-4 w-4" /></Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {keyword}
                        <button type="button" onClick={() => handleRemoveKeyword(keyword)} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Model Answer (Optional)</Label>
                <Textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} placeholder="Enter a model answer or grading rubric..." className="min-h-[100px] mt-1.5 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sub-questions *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddSubQuestion} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"><Plus className="h-3 w-3 mr-1" /> Add Sub-question</Button>
                </div>
                
                {subQuestions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No sub-questions added yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add sub-questions like (a), (b), (c) with their own points</p>
                    <Button type="button" variant="link" size="sm" onClick={handleAddSubQuestion} className="text-blue-600 dark:text-blue-400">Add your first sub-question</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subQuestions.map((sq, idx) => (
                      <div key={sq.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium text-slate-800 dark:text-slate-200">Sub-question {String.fromCharCode(97 + idx)}</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteSubQuestion(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><X className="h-4 w-4" /></Button>
                        </div>
                        <Textarea value={sq.text} onChange={(e) => handleUpdateSubQuestion(idx, { text: e.target.value })} placeholder={`Enter sub-question ${String.fromCharCode(97 + idx)}`} className="min-h-[60px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                        <div className="mt-2">
                          <Label className="text-xs text-slate-600 dark:text-slate-400">Points</Label>
                          <Input type="number" value={sq.points} onChange={(e) => handleUpdateSubQuestion(idx, { points: parseInt(e.target.value) || 1 })} min={1} className="w-24 mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mt-3 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Total Points:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{totalSubQuestionPoints} marks</span>
                      </div>
                      {marksPerTheoryQuestion > 0 && (
                        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                          <span>Per question:</span>
                          <span>{marksPerTheoryQuestion.toFixed(2)} marks</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={handleClose} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={!questionText.trim()} className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700">Save as Draft</Button>
          <Button onClick={() => handleSubmit(false)} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white" disabled={!complete}>
            {initialData?.id ? 'Update' : 'Add'} Complete Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}