// app/staff/notes/create/page.tsx - COMPLETE NOTES CREATION PAGE
'use client'

import { useState, useEffect, useRef } from 'react'
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
  Users, BookOpen, CheckCircle, Send, Trash2, Bold, Italic,
  Underline, List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Image as ImageIcon, Paperclip, Eye, Code, Strikethrough, X,
  Sparkles, FileIcon, FileSpreadsheet, Download, Clock
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// CONSTANTS
// ============================================
const allClasses = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

const jssClasses = ['JSS 1', 'JSS 2', 'JSS 3']
const ssClasses = ['SS 1', 'SS 2', 'SS 3']

const juniorSubjects = [
  'Mathematics', 'English Language', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'CRS', 'Business Studies',
  'Agricultural Science', 'Home Economics', 'Computer Science',
  'Physical & Health Education', 'French', 'Yoruba', 'Hausa', 'Igbo',
  'Creative & Cultural Arts'
]

const seniorSubjects = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Agricultural Science', 'Economics', 'Government', 'Literature in English',
  'CRS', 'Geography', 'Commerce', 'Accounting', 'Civic Education',
  'Computer Science', 'Further Mathematics', 'Technical Drawing',
  'Food and Nutrition', 'French', 'Yoruba', 'Hausa', 'Igbo',
  'Data Processing', 'Marketing', 'Insurance'
]

const acceptedFileTypes = [
  '.pdf', '.doc', '.docx', '.txt', '.rtf',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.xlsx', '.xls', '.csv',
  '.ppt', '.pptx', '.mp4', '.mp3'
]

const fileTypeIcons: Record<string, JSX.Element> = {
  'application/pdf': <FileText className="h-4 w-4 text-red-500" />,
  'application/msword': <FileText className="h-4 w-4 text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileText className="h-4 w-4 text-blue-500" />,
  'application/vnd.ms-excel': <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  'text/csv': <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  'application/vnd.ms-powerpoint': <Eye className="h-4 w-4 text-orange-500" />,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': <Eye className="h-4 w-4 text-orange-500" />,
}

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
}

export default function CreateNotePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const [form, setForm] = useState({
    title: '',
    subject: '',
    topic: '',
    term: 'first',
    week: '',
    duration: '40',
    content: '',
    objectives: '',
    summary: '',
    references: ''
  })

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  // Derived: determine if selected classes are JSS or SS
  const selectedLevel = selectedClasses.length > 0
    ? selectedClasses.some(c => jssClasses.includes(c)) && selectedClasses.some(c => ssClasses.includes(c))
      ? 'mixed'
      : selectedClasses.some(c => jssClasses.includes(c))
        ? 'jss'
        : 'ss'
    : 'jss'

  // Get subjects based on level
  const availableSubjects = selectedLevel === 'ss' ? seniorSubjects 
    : selectedLevel === 'jss' ? juniorSubjects 
    : [...new Set([...juniorSubjects, ...seniorSubjects])]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/portal'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  // ============================================
  // CLASS SELECTION
  // ============================================
  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className])
  }

  const selectAllJSS = () => setSelectedClasses(prev => [...new Set([...prev, ...jssClasses])])
  const selectAllSS = () => setSelectedClasses(prev => [...new Set([...prev, ...ssClasses])])
  const selectAll = () => setSelectedClasses([...allClasses])
  const clearAll = () => setSelectedClasses([])

  // ============================================
  // TEXT FORMATTING
  // ============================================
  const insertFormatting = (format: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = form.content
    const selected = text.substring(start, end)
    let replacement = ''

    switch (format) {
      case 'bold': replacement = `**${selected || 'bold text'}**`; break
      case 'italic': replacement = `*${selected || 'italic text'}*`; break
      case 'underline': replacement = `__${selected || 'underlined text'}__`; break
      case 'strikethrough': replacement = `~~${selected || 'strikethrough text'}~~`; break
      case 'h1': replacement = `\n# ${selected || 'Heading 1'}\n`; break
      case 'h2': replacement = `\n## ${selected || 'Heading 2'}\n`; break
      case 'h3': replacement = `\n### ${selected || 'Heading 3'}\n`; break
      case 'list': replacement = selected ? '\n' + selected.split('\n').map(l => `- ${l}`).join('\n') + '\n' : '\n- List item\n'; break
      case 'ordered': replacement = selected ? '\n' + selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n') + '\n' : '\n1. List item\n'; break
      case 'quote': replacement = selected ? '\n' + selected.split('\n').map(l => `> ${l}`).join('\n') + '\n' : '\n> Blockquote\n'; break
      case 'code': replacement = `\n\`\`\`\n${selected || 'code block'}\n\`\`\`\n`; break
      default: return
    }

    const newText = text.substring(0, start) + replacement + text.substring(end)
    setForm({ ...form, content: newText })

    setTimeout(() => {
      textarea.focus()
      const newCursor = start + replacement.length
      textarea.setSelectionRange(newCursor, newCursor)
    }, 0)
  }

  // ============================================
  // FILE HANDLING
  // ============================================
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    fileArray.forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFileTypes.includes(ext)) {
        toast.error(`${file.name}: Unsupported file type`)
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: File must be under 50MB`)
        return
      }
      setFiles(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        file, name: file.name, size: file.size, type: file.type
      }])
    })
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-purple-500" />
    return fileTypeIcons[type] || <FileIcon className="h-4 w-4 text-slate-500" />
  }

  // ============================================
  // SUBMIT
  // ============================================
  const uploadFiles = async (noteId: string): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      const filePath = `notes/${noteId}/${file.name}`
      const { error } = await supabase.storage.from('assignment-files').upload(filePath, file.file, { cacheControl: '3600', upsert: false })
      if (error) { toast.error(`Failed to upload ${file.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('assignment-files').getPublicUrl(filePath)
      urls.push(publicUrl)
    }
    return urls
  }

  const handleSubmit = async () => {
    if (!form.title || !form.subject || selectedClasses.length === 0) {
      toast.error('Please fill title, subject, and select at least one class')
      return
    }

    setSubmitting(true)
    try {
      const { data: note, error } = await supabase.from('notes').insert({
        title: form.title,
        subject: form.subject,
        topic: form.topic,
        class: selectedClasses,
        classes: selectedClasses,
        term: form.term,
        week: form.week ? parseInt(form.week) : null,
        duration: form.duration ? parseInt(form.duration) : 40,
        content: form.content,
        objectives: form.objectives,
        summary: form.summary,
        references: form.references,
        created_by: profile?.id,
        created_by_name: profile?.full_name,
        department: profile?.department || 'General',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single()

      if (error) throw error

      // Upload files
      if (files.length > 0) {
        const fileUrls = await uploadFiles(note.id)
        if (fileUrls.length > 0) {
          await supabase.from('notes').update({ files: fileUrls, file_count: fileUrls.length }).eq('id', note.id)
        }
      }

      // Notify students
      for (const className of selectedClasses) {
        const { data: students } = await supabase.from('profiles').select('id').eq('class', className).eq('role', 'student')
        if (students?.length) {
          await supabase.from('notifications').insert(
            students.map(s => ({
              user_id: s.id,
              title: '📝 New Lesson Note',
              message: `"${form.title}" - ${form.subject} (${form.topic || 'No topic'})`,
              type: 'note',
              link: '/student/notes',
              created_at: new Date().toISOString()
            }))
          )
        }
      }

      toast.success(`Note published to ${selectedClasses.length} class(es)!`)
      router.push('/staff/notes')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create note')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link href="/staff" className="hover:text-primary flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/staff/notes" className="hover:text-primary">Notes</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Create</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/staff/notes')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Lesson Note</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Create comprehensive lesson notes with attachments</p>
      </div>

      {/* Class Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />Target Classes *</CardTitle>
          <CardDescription>Select which classes receive this note</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Select */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAllJSS} className="text-xs h-8">All JSS</Button>
            <Button variant="outline" size="sm" onClick={selectAllSS} className="text-xs h-8">All SS</Button>
            <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-8">All Classes</Button>
            {selectedClasses.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-8 text-red-500"><X className="h-3 w-3 mr-1" />Clear</Button>
            )}
          </div>
          
          {/* JSS Classes */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Junior Secondary (JSS)</p>
            <div className="flex flex-wrap gap-2">
              {jssClasses.map(cls => (
                <Badge key={cls} variant={selectedClasses.includes(cls) ? 'default' : 'outline'}
                  className={cn("cursor-pointer px-4 py-2 text-sm", selectedClasses.includes(cls) && "bg-blue-600 text-white")}
                  onClick={() => handleClassToggle(cls)}>
                  {selectedClasses.includes(cls) && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}{cls}
                </Badge>
              ))}
            </div>
          </div>

          {/* SS Classes */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Senior Secondary (SS)</p>
            <div className="flex flex-wrap gap-2">
              {ssClasses.map(cls => (
                <Badge key={cls} variant={selectedClasses.includes(cls) ? 'default' : 'outline'}
                  className={cn("cursor-pointer px-4 py-2 text-sm", selectedClasses.includes(cls) && "bg-purple-600 text-white")}
                  onClick={() => handleClassToggle(cls)}>
                  {selectedClasses.includes(cls) && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}{cls}
                </Badge>
              ))}
            </div>
          </div>

          {selectedClasses.length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">Sending to {selectedClasses.length} class(es): {selectedClasses.join(', ')}</p>
          )}
        </CardContent>
      </Card>

      {/* Note Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" />Note Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Introduction to Algebra" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Subject *</Label>
              <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Topic</Label>
              <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g., Quadratic Equations" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Term</Label>
              <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Term</SelectItem>
                  <SelectItem value="second">Second Term</SelectItem>
                  <SelectItem value="third">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Week</Label>
              <Input type="number" value={form.week} onChange={e => setForm({ ...form, week: e.target.value })} placeholder="Week number" min={1} max={14} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Duration (minutes)</Label>
              <Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="mt-1 w-32" min={10} max={180} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-600" />Learning Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })}
            placeholder="By the end of the lesson, students should be able to:&#10;1. Define...&#10;2. Explain...&#10;3. Solve..." rows={4} className="resize-none" />
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600" />Lesson Content</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)} className="text-xs">
              <Eye className="h-4 w-4 mr-1" />{previewMode ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          {!previewMode && (
            <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-t-lg border border-b-0">
              <ToolbarButton icon={<Bold className="h-3.5 w-3.5" />} onClick={() => insertFormatting('bold')} title="Bold" />
              <ToolbarButton icon={<Italic className="h-3.5 w-3.5" />} onClick={() => insertFormatting('italic')} title="Italic" />
              <ToolbarButton icon={<Underline className="h-3.5 w-3.5" />} onClick={() => insertFormatting('underline')} title="Underline" />
              <ToolbarButton icon={<Strikethrough className="h-3.5 w-3.5" />} onClick={() => insertFormatting('strikethrough')} title="Strikethrough" />
              <div className="w-px bg-slate-300 mx-1" />
              <ToolbarButton icon={<Heading1 className="h-3.5 w-3.5" />} onClick={() => insertFormatting('h1')} title="Heading 1" />
              <ToolbarButton icon={<Heading2 className="h-3.5 w-3.5" />} onClick={() => insertFormatting('h2')} title="Heading 2" />
              <ToolbarButton icon={<Heading3 className="h-3.5 w-3.5" />} onClick={() => insertFormatting('h3')} title="Heading 3" />
              <div className="w-px bg-slate-300 mx-1" />
              <ToolbarButton icon={<List className="h-3.5 w-3.5" />} onClick={() => insertFormatting('list')} title="Bullet List" />
              <ToolbarButton icon={<ListOrdered className="h-3.5 w-3.5" />} onClick={() => insertFormatting('ordered')} title="Numbered List" />
              <div className="w-px bg-slate-300 mx-1" />
              <ToolbarButton icon={<Quote className="h-3.5 w-3.5" />} onClick={() => insertFormatting('quote')} title="Blockquote" />
              <ToolbarButton icon={<Code className="h-3.5 w-3.5" />} onClick={() => insertFormatting('code')} title="Code Block" />
            </div>
          )}
          
          {previewMode ? (
            <div className="min-h-[300px] p-4 border rounded-b-lg bg-white prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: form.content.replace(/\n/g, '<br/>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/~~(.*?)~~/g, '<s>$1</s>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
              }} />
            ) : (
              <Textarea ref={editorRef} value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                onPaste={(e) => {
                  const items = e.clipboardData?.items
                  if (items) {
                    for (const item of Array.from(items)) {
                      if (item.type.startsWith('image/')) {
                        e.preventDefault()
                        const file = item.getAsFile()
                        if (file) { handleFiles([file]); toast.success('Image pasted! Upload when saving.') }
                        return
                      }
                    }
                  }
                }}
                placeholder="Write your lesson content here...&#10;&#10;Use the toolbar above or markdown:&#10;# Heading 1&#10;## Heading 2&#10;**bold** *italic*&#10;- List item&#10;> Blockquote&#10;```code```"
                className="min-h-[350px] rounded-t-none border-t-0 font-mono text-sm resize-y" />
            )}
        </CardContent>
      </Card>

      {/* Summary & References */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })}
              placeholder="Key points and summary..." rows={4} className="resize-none" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">References</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.references} onChange={e => setForm({ ...form, references: e.target.value })}
              placeholder="Textbooks, websites, materials..." rows={4} className="resize-none" />
          </CardContent>
        </Card>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-orange-600" />Attachments</CardTitle>
          <CardDescription>PDF, Word, Excel, Images, Videos (Max 50MB each)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn("border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all",
            dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50")}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => document.getElementById('note-file-upload')?.click()}>
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Drag & drop files, or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, TXT, XLSX, PPT, JPG, PNG, MP4, MP3</p>
            <input id="note-file-upload" type="file" multiple className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)} accept={acceptedFileTypes.join(',')} />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center shrink-0">{getFileIcon(file.type)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 shrink-0"
                    onClick={e => { e.stopPropagation(); removeFile(file.id) }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Publish Note
        </Button>
        <Button variant="outline" onClick={() => router.push('/staff/notes')}>Cancel</Button>
      </div>
    </div>
  )
}

// Small toolbar button component
function ToolbarButton({ icon, onClick, title }: { icon: JSX.Element; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-slate-900">
      {icon}
    </button>
  )
}