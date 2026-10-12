// app/staff/assignments/create/page.tsx - COMPLETE WITH ENHANCED FILE PREVIEW + DARK MODE
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Loader2, ArrowLeft, Home, ChevronRight, Upload, FileText,
  Users, BookOpen, CheckCircle,
  FileIcon, ImageIcon, FileSpreadsheet, Eye, Send,
  Trash2, Download, X, Volume2, Video, AlertCircle,
  Paperclip
} from 'lucide-react'
import Link from 'next/link'

const classes = [
  'JSS1', 'JSS2', 'JSS3',
  'SS1 Science', 'SS1 Arts', 'SS1 Commercial',
  'SS2 Science', 'SS2 Arts', 'SS2 Commercial',
  'SS3 Science', 'SS3 Arts', 'SS3 Commercial'
]

const departments = ['Science', 'Arts', 'Commercial', 'General']

const acceptedFileTypes = [
  '.pdf', '.doc', '.docx', '.txt', '.rtf',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.xlsx', '.xls', '.csv',
  '.ppt', '.pptx',
  '.mp4', '.webm', '.mov', '.mp3', '.wav'
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
  'image/webp': 'WEBP',
  'image/bmp': 'BMP',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/csv': 'CSV',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
  'video/quicktime': 'MOV',
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/ogg': 'OGG'
}

const getFileTypeIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return <ImageIcon className="h-4 w-4" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet className="h-4 w-4" />
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Eye className="h-4 w-4" />
  if (mimeType.includes('video')) return <Video className="h-4 w-4" />
  if (mimeType.includes('audio')) return <Volume2 className="h-4 w-4" />
  return <FileIcon className="h-4 w-4" />
}

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  uploaded: boolean
  previewUrl?: string
}

// Enhanced File Preview Modal for Create Page
function FilePreviewModal({ file, onClose }: { file: UploadedFile | null; onClose: () => void }) {
  const [isImage, setIsImage] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [isAudio, setIsAudio] = useState(false)
  const [isText, setIsText] = useState(false)
  const [textContent, setTextContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    setIsImage(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || ''))
    setIsPdf(ext === 'pdf')
    setIsVideo(['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || ''))
    setIsAudio(['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || ''))
    setIsText(['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'csv'].includes(ext || ''))
    
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'csv'].includes(ext || '') && file.previewUrl) {
      loadTextContent(file.previewUrl)
    }
  }, [file])
  
  const loadTextContent = async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load file content')
      const text = await response.text()
      setTextContent(text.length > 50000 ? text.substring(0, 50000) + '\n\n... (file truncated, too large)' : text)
    } catch (err) {
      setError('Could not load file content')
    } finally {
      setLoading(false)
    }
  }
  
  if (!file) return null
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {isImage && <ImageIcon className="h-5 w-5 text-green-500 dark:text-green-400" />}
              {isPdf && <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />}
              {isVideo && <Video className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
              {isAudio && <Volume2 className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
              {isText && <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
              {!isImage && !isPdf && !isVideo && !isAudio && !isText && <Paperclip className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
              <DialogTitle className="text-sm font-medium truncate text-slate-900 dark:text-white">{file.name}</DialogTitle>
              <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] bg-white dark:bg-slate-950">
          {isImage && file.previewUrl && (
            <div className="flex items-center justify-center min-h-[400px]">
              <img 
                src={file.previewUrl} 
                alt={file.name} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
          
          {isPdf && file.previewUrl && (
            <div className="w-full">
              <iframe 
                src={file.previewUrl} 
                className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700"
                title={file.name}
              />
            </div>
          )}
          
          {isVideo && file.previewUrl && (
            <div className="w-full">
              <video 
                controls 
                className="w-full rounded-lg shadow-sm bg-black"
                style={{ maxHeight: '70vh' }}
              >
                <source src={file.previewUrl} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && file.previewUrl && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-md">
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-6 text-center mb-4 border border-slate-200 dark:border-slate-800">
                  <Volume2 className="h-12 w-12 mx-auto text-purple-500 dark:text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Audio File</p>
                </div>
                <audio controls className="w-full">
                  <source src={file.previewUrl} />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          )}
          
          {isText && (
            <div className="w-full">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <p className="ml-2 text-slate-500 dark:text-slate-400">Loading file content...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-900 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>File Content</span>
                    <span className="text-[10px]">{textContent.length.toLocaleString()} characters</span>
                  </div>
                  <pre className="p-4 text-xs font-mono bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 overflow-auto max-h-[60vh] whitespace-pre-wrap">
                    {textContent}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {!isImage && !isPdf && !isVideo && !isAudio && !isText && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-800">
                <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">{file.name}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Preview not available for this file type
              </p>
              <Button 
                onClick={() => {
                  const url = URL.createObjectURL(file.file)
                  window.open(url, '_blank')
                  URL.revokeObjectURL(url)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

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
    if (!session) { 
      router.push('/portal')
      return 
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) setProfile(data)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFileTypes.includes(ext)) return `File type ${ext} not supported`
    if (file.size > 50 * 1024 * 1024) return 'File must be under 50MB'
    return null
  }

  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const newUploadFiles: UploadedFile[] = []
    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) { 
        toast.error(`${file.name}: ${error}`)
      } else {
        newUploadFiles.push({
          id: Math.random().toString(36).substring(7),
          file, 
          name: file.name, 
          size: file.size, 
          type: file.type, 
          uploaded: false,
          previewUrl: (file.type.startsWith('image/') || file.type === 'application/pdf' || 
                      file.type.startsWith('video/') || file.type.startsWith('audio/')) 
                      ? createPreviewUrl(file) : undefined
        })
      }
    })
    if (newUploadFiles.length > 0) setFiles(prev => [...prev, ...newUploadFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id)
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl)
    }
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className) 
        : [...prev, className]
    )
  }

  const handlePreview = (file: UploadedFile) => {
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const downloadFile = (file: UploadedFile) => {
    const url = URL.createObjectURL(file.file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloading ${file.name}`)
  }

  const uploadFiles = async (assignmentId: string): Promise<{ url: string; name: string }[]> => {
    const uploadedFiles: { url: string; name: string }[] = []
    
    for (const file of files) {
      try {
        const timestamp = Date.now()
        const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `assignments/${assignmentId}/${safeFileName}`
        
        console.log('📤 Uploading:', { originalName: file.name, storagePath: filePath })
        
        const { error: uploadError } = await supabase.storage
          .from('assignment-files')
          .upload(filePath, file.file, { 
            cacheControl: '3600', 
            upsert: true,
            contentType: file.type
          })
        
        if (uploadError) { 
          console.error(`Failed to upload ${file.name}:`, uploadError)
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
          continue 
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(filePath)
        
        console.log('✅ Public URL:', publicUrl)
        
        uploadedFiles.push({ 
          url: publicUrl, 
          name: file.name 
        })
        
        toast.success(`Uploaded: ${file.name}`)
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err)
        toast.error(`Error uploading ${file.name}`)
      }
    }
    return uploadedFiles
  }

  const handleSubmit = async () => {
    if (!form.title || !form.subject || selectedClasses.length === 0) {
      toast.error('Please fill all required fields and select at least one class')
      return
    }
    if (!form.dueDate) { 
      toast.error('Please set a due date')
      return 
    }

    setSubmitting(true)
    try {
      const assignmentData = {
        title: form.title,
        description: form.description || null,
        subject: form.subject,
        classes: selectedClasses,
        department: form.department || null,
        due_date: `${form.dueDate}T${form.dueTime}:00`,
        total_points: form.totalMarks,
        instructions: form.instructions || null,
        created_by: profile?.id,
        created_by_name: profile?.full_name,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachment_urls: [],
        attachment_names: [],
        file_count: 0
      }

      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .single()

      if (assignmentError) throw assignmentError

      let uploadedFiles: { url: string; name: string }[] = []
      if (files.length > 0) {
        uploadedFiles = await uploadFiles(assignment.id)
        
        if (uploadedFiles.length > 0) {
          const { error: updateError } = await supabase
            .from('assignments')
            .update({ 
              attachment_urls: uploadedFiles.map(f => f.url),
              attachment_names: uploadedFiles.map(f => f.name),
              file_count: uploadedFiles.length 
            })
            .eq('id', assignment.id)
          
          if (updateError) {
            console.error('Error updating files:', updateError)
            toast.warning('Assignment created but some files failed to attach')
          }
        }
      }

      try {
        const dueDateFormatted = new Date(form.dueDate).toLocaleDateString()
        for (const className of selectedClasses) {
          const { data: students } = await supabase
            .from('profiles')
            .select('id')
            .eq('class', className)
            .eq('role', 'student')
          
          if (students && students.length > 0) {
            const notifications = students.map(student => ({
              user_id: student.id,
              title: `📚 New Assignment: ${form.title}`,
              message: `${form.subject} assignment - Due: ${dueDateFormatted} | ${form.totalMarks} marks${uploadedFiles.length > 0 ? ` | ${uploadedFiles.length} file(s) attached` : ''}`,
              type: 'assignment',
              link: '/student/assignments',
              created_at: new Date().toISOString(),
              read: false,
              metadata: {
                assignment_id: assignment.id,
                subject: form.subject,
                file_count: uploadedFiles.length
              }
            }))
            
            for (let i = 0; i < notifications.length; i += 50) {
              const batch = notifications.slice(i, i + 50)
              await supabase.from('notifications').insert(batch)
            }
          }
        }
      } catch (notifError) {
        console.error('Notification error (non-critical):', notifError)
      }

      toast.success(`Assignment published! ${uploadedFiles.length} file(s) attached.`)
      router.push('/staff/assignments')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl)
        }
      })
    }
  }, [files])

  return (
    <div className="space-y-6 max-w-3xl pb-12 mx-auto transition-colors duration-300">
      {/* Enhanced File Preview Dialog */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewOpen(false)} />

      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <Link href="/staff" className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/staff/assignments" className="hover:text-emerald-600 dark:hover:text-emerald-400">Assignments</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-800 dark:text-slate-200 font-medium">Create</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/staff/assignments')}
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Create Assignment</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">Create and publish assignments to student classes</p>
      </div>

      {/* Assignment Details */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-slate-700 dark:text-slate-300">Title *</Label>
            <Input 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              placeholder="e.g., First Term Mathematics Assignment" 
              className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
            />
          </div>
          <div>
            <Label className="text-sm text-slate-700 dark:text-slate-300">Description</Label>
            <Textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              placeholder="Describe the assignment..." 
              rows={3} 
              className="mt-1 resize-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-700 dark:text-slate-300">Subject *</Label>
              <Input 
                value={form.subject} 
                onChange={e => setForm({ ...form, subject: e.target.value })} 
                placeholder="e.g., Mathematics" 
                className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              />
            </div>
            <div>
              <Label className="text-sm text-slate-700 dark:text-slate-300">Department</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-700 dark:text-slate-300">Due Date *</Label>
              <Input 
                type="date" 
                value={form.dueDate} 
                onChange={e => setForm({ ...form, dueDate: e.target.value })} 
                className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" 
                min={new Date().toISOString().split('T')[0]} 
              />
            </div>
            <div>
              <Label className="text-sm text-slate-700 dark:text-slate-300">Due Time</Label>
              <Input 
                type="time" 
                value={form.dueTime} 
                onChange={e => setForm({ ...form, dueTime: e.target.value })} 
                className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" 
              />
            </div>
          </div>
          <div>
            <Label className="text-sm text-slate-700 dark:text-slate-300">Total Marks</Label>
            <Input 
              type="number" 
              value={form.totalMarks} 
              onChange={e => setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })} 
              className="mt-1 w-32 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" 
              min={1} 
              max={1000} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Target Classes */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Target Classes *
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">Select which classes will receive this assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <Badge
                key={cls}
                variant={selectedClasses.includes(cls) ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm transition-all",
                  selectedClasses.includes(cls) 
                    ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white border-emerald-600" 
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                )}
                onClick={() => handleClassToggle(cls)}
              >
                {selectedClasses.includes(cls) && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                {cls}
              </Badge>
            ))}
          </div>
          {selectedClasses.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Sending to: <span className="font-medium text-slate-700 dark:text-slate-200">{selectedClasses.join(', ')}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={form.instructions} 
            onChange={e => setForm({ ...form, instructions: e.target.value })} 
            placeholder="Special instructions for students..." 
            rows={4} 
            className="resize-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
          />
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Attachments
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">PDF, Word, Excel, Images, Videos, Audio (Max 50MB each)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all",
              dragActive 
                ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            )}
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drag & drop files, or click to browse</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, DOC, DOCX, TXT, RTF, JPG, PNG, GIF, XLSX, CSV, PPT, PPTX, MP4, MP3</p>
            <input 
              id="file-upload" 
              type="file" 
              multiple 
              className="hidden" 
              onChange={e => e.target.files && handleFiles(e.target.files)} 
              accept={acceptedFileTypes.join(',')} 
            />
          </div>
          
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {files.map(file => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg group border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-400">
                      {file.type.startsWith('image/') && file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="h-10 w-10 object-cover rounded-lg" />
                      ) : (
                        getFileTypeIcon(file.type)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(file.size)} • {fileTypeLabels[file.type] || file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(file.type.startsWith('image/') || file.type === 'application/pdf' || 
                      file.type.startsWith('video/') || file.type.startsWith('audio/') ||
                      ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'].some(ext => file.name.endsWith(ext))) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        onClick={() => handlePreview(file)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/40"
                      onClick={() => downloadFile(file)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40" 
                      onClick={() => removeFile(file.id)}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={submitting} 
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 h-11 px-8"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Publish Assignment
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push('/staff/assignments')}
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}