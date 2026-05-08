// app/staff/assignments/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Loader2, ArrowLeft, Home, ChevronRight, Upload, FileText,
  Users, BookOpen, CheckCircle,
  FileIcon, ImageIcon, FileSpreadsheet, Eye, Send,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const departments = ['Science', 'Arts', 'Commercial', 'Technology', 'All']

const acceptedFileTypes = [
  '.pdf', '.doc', '.docx', '.txt', '.rtf',
  '.jpg', '.jpeg', '.png', '.gif',
  '.xlsx', '.xls', '.csv',
  '.ppt', '.pptx'
]

const fileTypeLabels: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'application/rtf': 'RTF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/csv': 'CSV',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX'
}

const getFileTypeIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return <ImageIcon className="h-4 w-4" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet className="h-4 w-4" />
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Eye className="h-4 w-4" />
  return <FileIcon className="h-4 w-4" />
}

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  uploaded: boolean
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    department: '',
    dueDate: '',
    dueTime: '23:59',
    totalMarks: 100,
    instructions: ''
  })

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/portal'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFileTypes.includes(ext)) return `File type ${ext} not supported`
    if (file.size > 50 * 1024 * 1024) return 'File must be under 50MB'
    return null
  }

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const newUploadFiles: UploadedFile[] = []
    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) { toast.error(`${file.name}: ${error}`) }
      else {
        newUploadFiles.push({
          id: Math.random().toString(36).substring(7),
          file, name: file.name, size: file.size, type: file.type, uploaded: false
        })
      }
    })
    if (newUploadFiles.length > 0) setFiles(prev => [...prev, ...newUploadFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className])
  }

  const uploadFiles = async (assignmentId: string): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      const filePath = `assignments/${assignmentId}/${file.name}`
      const { error } = await supabase.storage.from('assignment-files').upload(filePath, file.file, { cacheControl: '3600', upsert: false })
      if (error) { toast.error(`Failed to upload ${file.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('assignment-files').getPublicUrl(filePath)
      urls.push(publicUrl)
    }
    return urls
  }

  const handleSubmit = async () => {
    if (!form.title || !form.subject || selectedClasses.length === 0) {
      toast.error('Please fill all required fields and select at least one class')
      return
    }
    if (!form.dueDate) { toast.error('Please set a due date'); return }

    setSubmitting(true)
    try {
      const { data: assignment, error } = await supabase.from('assignments').insert({
        title: form.title,
        description: form.description,
        subject: form.subject,
        classes: selectedClasses,
        department: form.department || 'General',
        due_date: `${form.dueDate}T${form.dueTime}:00`,
        total_marks: form.totalMarks,
        instructions: form.instructions,
        created_by: profile?.id,
        created_by_name: profile?.full_name,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single()

      if (error) throw error

      if (files.length > 0) {
        const fileUrls = await uploadFiles(assignment.id)
        if (fileUrls.length > 0) {
          await supabase.from('assignments').update({ files: fileUrls, file_count: fileUrls.length }).eq('id', assignment.id)
        }
      }

      // Notify students
      for (const className of selectedClasses) {
        const { data: students } = await supabase.from('profiles').select('id').eq('class', className).eq('role', 'student')
        if (students?.length) {
          await supabase.from('notifications').insert(
            students.map(s => ({
              user_id: s.id,
              title: '📚 New Assignment',
              message: `"${form.title}" - ${form.subject}. Due: ${new Date(form.dueDate).toLocaleDateString()}`,
              type: 'assignment',
              link: '/student/assignments',
              created_at: new Date().toISOString()
            }))
          )
        }
      }

      toast.success(`Assignment published to ${selectedClasses.length} class(es)!`)
      router.push('/staff/assignments')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link href="/staff" className="hover:text-primary flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/staff/assignments" className="hover:text-primary">Assignments</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Create</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/staff/assignments')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Assignment</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Create and publish assignments to student classes</p>
      </div>

      {/* Assignment Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" />Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., First Term Mathematics Assignment" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the assignment..." rows={3} className="mt-1 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Subject *</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Mathematics" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Department</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Due Date *</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label className="text-sm">Due Time</Label>
              <Input type="time" value={form.dueTime} onChange={e => setForm({ ...form, dueTime: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Total Marks</Label>
            <Input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })} className="mt-1 w-32" min={1} max={1000} />
          </div>
        </CardContent>
      </Card>

      {/* Target Classes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />Target Classes *</CardTitle>
          <CardDescription>Select which classes will receive this assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <Badge
                key={cls}
                variant={selectedClasses.includes(cls) ? 'default' : 'outline'}
                className={cn("cursor-pointer px-4 py-2 text-sm", selectedClasses.includes(cls) && "bg-primary text-white")}
                onClick={() => handleClassToggle(cls)}
              >
                {selectedClasses.includes(cls) && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                {cls}
              </Badge>
            ))}
          </div>
          {selectedClasses.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">Sending to: {selectedClasses.join(', ')}</p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600" />Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="Special instructions for students..." rows={4} className="resize-none" />
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-orange-600" />Attachments</CardTitle>
          <CardDescription>PDF, Word, Excel, Images (Max 50MB each)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn("border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer", dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400")}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Drag & drop files, or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, TXT, RTF, JPG, PNG, GIF, XLSX, CSV, PPT, PPTX</p>
            <input id="file-upload" type="file" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} accept={acceptedFileTypes.join(',')} />
          </div>
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center shrink-0">{getFileTypeIcon(file.type)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)} • {fileTypeLabels[file.type] || file.type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={e => { e.stopPropagation(); removeFile(file.id) }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Publish Assignment
        </Button>
        <Button variant="outline" onClick={() => router.push('/staff/assignments')}>Cancel</Button>
      </div>
    </div>
  )
}