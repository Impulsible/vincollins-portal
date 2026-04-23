// src/components/staff/exams/edit/QuestionFormDialog.tsx
'use client'

import { useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Question } from './types'

interface QuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<Question>
  onSave: (data: Partial<Question>) => void
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave
}: QuestionFormDialogProps) {
  const [formData, setFormData] = useState({
    question_text: initialData?.question_text || '',
    options: initialData?.options || ['', '', '', ''],
    correct_answer: initialData?.correct_answer || '',
    points: initialData?.points || 1
  })

  const handleSubmit = () => {
    if (!formData.question_text || !formData.correct_answer) {
      toast.error('Please fill in all required fields')
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Question' : 'Add Objective Question'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Question Text *</Label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter your question"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            {formData.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 font-medium">{String.fromCharCode(65 + idx)}.</span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...formData.options]
                    newOptions[idx] = e.target.value
                    setFormData({ ...formData, options: newOptions })
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Correct Answer *</Label>
              <Select value={formData.correct_answer} onValueChange={(v) => setFormData({ ...formData, correct_answer: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Points</Label>
              <Input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })} min={1} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{initialData ? 'Update' : 'Add'} Question</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}