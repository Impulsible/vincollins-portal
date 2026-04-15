/* eslint-disable @typescript-eslint/no-explicit-any */
// components/staff/CreateAssignmentDialog.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

interface CreateAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teacherProfile: any
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature']

export function CreateAssignmentDialog({ open, onOpenChange, onSuccess, teacherProfile }: CreateAssignmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class: '',
    description: '',
    due_date: '',
    total_marks: 100
  })

  const handleSubmit = async (publish = false) => {
    if (!formData.title || !formData.subject || !formData.class) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const assignmentData = {
        ...formData,
        status: publish ? 'published' : 'draft',
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
        created_by: teacherProfile?.id,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase.from('assignments').insert(assignmentData)

      if (error) throw error

      toast.success(publish ? 'Assignment published!' : 'Assignment saved as draft!')
      onSuccess()
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      toast.error(error.message || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>Create a new assignment for your students.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Algebra Worksheet"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject *</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class *</Label>
              <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter assignment description..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Total Marks</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}