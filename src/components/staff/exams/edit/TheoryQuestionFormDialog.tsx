// src/components/staff/exams/edit/TheoryQuestionFormDialog.tsx
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
import { toast } from 'sonner'
import type { TheoryQuestion } from './types'

interface TheoryQuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<TheoryQuestion>
  onSave: (data: Partial<TheoryQuestion>) => void
}

export function TheoryQuestionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave
}: TheoryQuestionFormDialogProps) {
  const [formData, setFormData] = useState({
    question_text: initialData?.question_text || '',
    points: initialData?.points || 5
  })

  const handleSubmit = () => {
    if (!formData.question_text) {
      toast.error('Please enter a question')
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Theory Question' : 'Add Theory Question'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Question Text *</Label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter your essay/theory question"
              className="min-h-[120px]"
            />
          </div>
          <div>
            <Label>Points</Label>
            <Input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 5 })} min={1} />
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