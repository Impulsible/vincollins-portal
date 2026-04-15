/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/staff/UploadNoteDialog.tsx
'use client'

import { useState, useRef } from 'react'
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
import { Loader2, Upload, Save, Send, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface UploadNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teacherProfile: any
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature']

export function UploadNoteDialog({ open, onOpenChange, onSuccess, teacherProfile }: UploadNoteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class: '',
    description: ''
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size should be less than 50MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const filePath = `notes/${fileName}`

      const { error } = await supabase.storage
        .from('teaching-materials')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('teaching-materials')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleSubmit = async (publish = false) => {
    if (!formData.title || !formData.subject || !formData.class) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setLoading(true)
    setUploading(true)
    
    try {
      const fileUrl = await uploadFile(selectedFile)
      
      if (!fileUrl) {
        throw new Error('Failed to upload file')
      }

      const noteData = {
        ...formData,
        file_url: fileUrl,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        status: publish ? 'published' : 'draft',
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
        created_by: teacherProfile?.id,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase.from('notes').insert(noteData)

      if (error) throw error

      toast.success(publish ? 'Note published!' : 'Note saved as draft!')
      onSuccess()
      setFormData({ title: '', subject: '', class: '', description: '' })
      setSelectedFile(null)
    } catch (error: any) {
      console.error('Error creating note:', error)
      toast.error(error.message || 'Failed to upload note')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Study Note</DialogTitle>
          <DialogDescription>Upload study materials for your students.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Algebra Notes - Week 1"
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
              placeholder="Enter note description..."
              rows={2}
            />
          </div>
          
          <div>
            <Label>File *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, PPT, Images (Max 50MB)</p>
                </div>
              )}
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
            {(loading || uploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}