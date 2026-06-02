/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/assignments/page.tsx - WITH ENHANCED FILE PREVIEW
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, FileText, Search, Calendar, Clock,
  Download, Eye, ChevronRight, BookOpen,
  User, Home, CheckCircle,
  AlertCircle, Upload, Paperclip, Filter, X, Award, Inbox,
  Image as ImageIcon, Video, Volume2, FileSpreadsheet
} from 'lucide-react'
import Link from 'next/link'
import { format, isPast, differenceInDays } from 'date-fns'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface Assignment {
  id: string
  title: string
  subject: string
  class: string
  classes?: string[]
  description: string
  instructions?: string
  due_date: string
  total_marks: number
  attachment_urls?: string[]
  attachment_names?: string[]
  file_count?: number
  teacher_name?: string
  created_by?: string
  created_by_name?: string
  status: string
  created_at: string
  submission?: {
    id: string
    file_url: string
    submitted_at: string
    score?: number
    feedback?: string
    status: string
  }
}

// Enhanced File Preview Modal for Students
function FilePreviewModal({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
  const [isImage, setIsImage] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [isAudio, setIsAudio] = useState(false)
  const [isText, setIsText] = useState(false)
  const [textContent, setTextContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    setIsImage(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || ''))
    setIsPdf(ext === 'pdf')
    setIsVideo(['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || ''))
    setIsAudio(['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || ''))
    setIsText(['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'csv'].includes(ext || ''))
    
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'csv'].includes(ext || '')) {
      loadTextContent()
    }
  }, [fileUrl, fileName])
  
  const loadTextContent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error('Failed to load file content')
      const text = await response.text()
      setTextContent(text.length > 50000 ? text.substring(0, 50000) + '\n\n... (file truncated, too large)' : text)
    } catch (err) {
      setError('Could not load file content')
    } finally {
      setLoading(false)
    }
  }
  
  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5 text-green-500" />
    if (isPdf) return <FileText className="h-5 w-5 text-red-500" />
    if (isVideo) return <Video className="h-5 w-5 text-blue-500" />
    if (isAudio) return <Volume2 className="h-5 w-5 text-purple-500" />
    if (isText) return <FileText className="h-5 w-5 text-slate-500" />
    return <Paperclip className="h-5 w-5 text-slate-500" />
  }
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl p-0">
        <DialogHeader className="p-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {getFileIcon()}
              <DialogTitle className="text-sm font-medium truncate">{fileName}</DialogTitle>
              <Badge variant="secondary" className="text-xs">
                {fileName.split('.').pop()?.toUpperCase() || 'FILE'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.open(fileUrl, '_blank')}
                className="h-8 w-8"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-8 w-8"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] bg-white">
          {/* Image Preview */}
          {isImage && (
            <div className="flex items-center justify-center min-h-[400px]">
              <img 
                src={fileUrl} 
                alt={fileName} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
          
          {/* PDF Preview */}
          {isPdf && (
            <div className="w-full">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  <FileText className="h-4 w-4 inline mr-1" />
                  PDF Document
                </p>
                <Button size="sm" variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
              <iframe 
                src={`${fileUrl}#toolbar=0`} 
                className="w-full h-[70vh] rounded-lg border"
                title={fileName}
              />
            </div>
          )}
          
          {/* Video Preview */}
          {isVideo && (
            <div className="w-full">
              <video 
                controls 
                className="w-full rounded-lg shadow-sm"
                style={{ maxHeight: '70vh' }}
              >
                <source src={fileUrl} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {/* Audio Preview */}
          {isAudio && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-md">
                <div className="bg-slate-100 rounded-lg p-6 text-center mb-4">
                  <Volume2 className="h-12 w-12 mx-auto text-purple-500 mb-2" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-slate-500">Audio File</p>
                </div>
                <audio controls className="w-full">
                  <source src={fileUrl} />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          )}
          
          {/* Text File Preview */}
          {isText && (
            <div className="w-full">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="ml-2 text-slate-500">Loading file content...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File Instead
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b text-xs text-slate-500 flex items-center justify-between">
                    <span>File Content</span>
                    <span className="text-[10px]">{textContent.length.toLocaleString()} characters</span>
                  </div>
                  <pre className="p-4 text-xs font-mono bg-slate-50 overflow-auto max-h-[60vh] whitespace-pre-wrap">
                    {textContent}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {/* Office Documents */}
          {!isImage && !isPdf && !isVideo && !isAudio && !isText && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {fileName.endsWith('.docx') || fileName.endsWith('.doc') ? (
                  <FileText className="h-10 w-10 text-blue-500" />
                ) : fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ? (
                  <FileSpreadsheet className="h-10 w-10 text-green-500" />
                ) : fileName.endsWith('.pptx') || fileName.endsWith('.ppt') ? (
                  <Eye className="h-10 w-10 text-orange-500" />
                ) : (
                  <FileText className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <h4 className="font-medium text-slate-800 mb-2">{fileName}</h4>
              <p className="text-sm text-slate-500 mb-4">
                Preview not available for this file type
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.open(fileUrl, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                {(fileName.endsWith('.docx') || fileName.endsWith('.doc') || 
                  fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                  fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) && (
                  <Button variant="outline" onClick={() => {
                    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`
                    window.open(googleDocsUrl, '_blank')
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Try Google Docs Viewer
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Tip: Download the file to view it with the appropriate software
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function StudentAssignmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    overdue: 0
  })

  const getInitials = (name?: string): string => {
    if (!name) return 'S'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      firstName: profile.full_name?.split(' ')[0] || 'Student',
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.submission?.status === 'graded') {
      return <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs"><CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />Graded</Badge>
    }
    if (assignment.submission) {
      return <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs"><CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />Submitted</Badge>
    }
    if (isPast(new Date(assignment.due_date))) {
      return <Badge className="bg-red-100 text-red-700 text-[10px] sm:text-xs"><AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />Overdue</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs"><Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />Pending</Badge>
  }

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `${days} days left`
  }

  const getDaysRemainingColor = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return 'text-red-600'
    if (days <= 2) return 'text-orange-600'
    return 'text-slate-500'
  }

  const getFileName = (assignment: Assignment, index: number): string => {
    if (assignment.attachment_names && assignment.attachment_names[index]) {
      return assignment.attachment_names[index]
    }
    const url = assignment.attachment_urls?.[index]
    if (url) {
      try {
        const decoded = decodeURIComponent(url)
        const parts = decoded.split('/')
        let fileName = parts[parts.length - 1]
        fileName = fileName.replace(/^\d+_/, '')
        return fileName
      } catch {
        return `Attachment ${index + 1}`
      }
    }
    return `Attachment ${index + 1}`
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData || profileData.role !== 'student') {
        toast.error('Access denied')
        router.push('/portal')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', profileData.id)
        .maybeSingle()

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: userData?.vin_id,
        photo_url: profileData.photo_url
      }

      setProfile(studentProfile)

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'published')
        .or(`classes.cs.{${studentProfile.class}},class.eq.${studentProfile.class}`)
        .order('due_date', { ascending: true })

      if (assignmentsError) {
        console.error('Error loading assignments:', assignmentsError)
        toast.error('Failed to load assignments')
        return
      }

      const assignmentIds = (assignmentsData || []).map(a => a.id)
      let submissionsMap: Record<string, any> = {}
      
      if (assignmentIds.length > 0) {
        const { data: submissionsData } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', studentProfile.id)
          .in('assignment_id', assignmentIds)

        submissionsData?.forEach(sub => {
          submissionsMap[sub.assignment_id] = sub
        })
      }

      const teacherIds = [...new Set((assignmentsData || []).map(a => a.created_by).filter(Boolean))]
      const teacherMap: Record<string, string> = {}
      
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds)
        
        teachers?.forEach(t => { teacherMap[t.id] = t.full_name })
      }

      const processedAssignments: Assignment[] = (assignmentsData || []).map(a => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        class: a.class,
        classes: a.classes,
        description: a.description,
        instructions: a.instructions,
        due_date: a.due_date,
        total_marks: a.total_points || a.total_marks || 0,
        attachment_urls: a.attachment_urls || [],
        attachment_names: a.attachment_names || [],
        file_count: a.file_count || (a.attachment_urls?.length || 0),
        teacher_name: a.created_by_name || teacherMap[a.created_by] || 'Teacher',
        created_by: a.created_by,
        created_by_name: a.created_by_name,
        status: a.status,
        created_at: a.created_at,
        submission: submissionsMap[a.id]
      }))

      setAssignments(processedAssignments)
      
      const subjects = [...new Set(processedAssignments.map(a => a.subject))]
      setAvailableSubjects(subjects.sort())

      const now = new Date()
      setStats({
        total: processedAssignments.length,
        pending: processedAssignments.filter(a => !a.submission && !isPast(new Date(a.due_date))).length,
        submitted: processedAssignments.filter(a => a.submission && a.submission.status !== 'graded').length,
        graded: processedAssignments.filter(a => a.submission?.status === 'graded').length,
        overdue: processedAssignments.filter(a => !a.submission && isPast(new Date(a.due_date))).length
      })

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    let filtered = [...assignments]

    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(a => !a.submission && !isPast(new Date(a.due_date)))
        break
      case 'submitted':
        filtered = filtered.filter(a => a.submission && a.submission.status !== 'graded')
        break
      case 'graded':
        filtered = filtered.filter(a => a.submission?.status === 'graded')
        break
      case 'overdue':
        filtered = filtered.filter(a => !a.submission && isPast(new Date(a.due_date)))
        break
    }

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(a => a.subject === subjectFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.subject.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      )
    }

    setFilteredAssignments(filtered)
  }, [assignments, activeTab, subjectFilter, searchQuery])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !selectedFile || !profile) return

    setSubmitting(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `submission-${selectedAssignment.id}-${Date.now()}.${fileExt}`
      const filePath = `assignment-submissions/${profile.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('assignment-files')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('assignment-files')
        .getPublicUrl(filePath)

      const { error: submitError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: profile.id,
          student_name: profile.full_name,
          student_class: profile.class,
          file_url: publicUrl,
          file_name: selectedFile.name,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        })

      if (submitError) throw submitError

      toast.success('Assignment submitted successfully!')
      setShowSubmitDialog(false)
      setSelectedFile(null)
      setSelectedAssignment(null)
      loadData()

    } catch (error: any) {
      console.error('Error submitting assignment:', error)
      toast.error(error.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-slate-600 text-sm">Loading assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="assignments"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="min-h-[calc(100vh-64px)] pt-20 lg:pt-24 pb-24 sm:pb-12">
            <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 max-w-7xl mx-auto">
              
              {/* Breadcrumb */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <Link href="/student" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-foreground font-medium">Assignments</span>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.total}</p>
                      </div>
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-yellow-50">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-yellow-600">Pending</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-700">{stats.pending}</p>
                      </div>
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-blue-600">Submitted</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">{stats.submitted}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-green-600">Graded</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-700">{stats.graded}</p>
                      </div>
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-red-50 col-span-2 sm:col-span-1">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-red-600">Overdue</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-700">{stats.overdue}</p>
                      </div>
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-red-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <div className="overflow-x-auto pb-2 sm:pb-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white p-1 rounded-xl shadow-sm border flex flex-nowrap">
                      <TabsTrigger value="all" className="rounded-lg text-[10px] sm:text-xs px-2 sm:px-3">All</TabsTrigger>
                      <TabsTrigger value="pending" className="rounded-lg text-[10px] sm:text-xs px-2 sm:px-3">Pending</TabsTrigger>
                      <TabsTrigger value="submitted" className="rounded-lg text-[10px] sm:text-xs px-2 sm:px-3">Submitted</TabsTrigger>
                      <TabsTrigger value="graded" className="rounded-lg text-[10px] sm:text-xs px-2 sm:px-3">Graded</TabsTrigger>
                      <TabsTrigger value="overdue" className="rounded-lg text-[10px] sm:text-xs px-2 sm:px-3">Overdue</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-sm w-full xs:w-48 sm:w-56 bg-white"
                    />
                  </div>
                  
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full xs:w-[130px] h-9 text-sm bg-white">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {availableSubjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assignments List */}
              <div className="space-y-3 pb-8">
                {filteredAssignments.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="text-center py-12 sm:py-16 md:py-20">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Inbox className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No assignments found</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
                        {activeTab === 'all' 
                          ? 'No assignments have been created for your class yet. Check back later for new assignments.'
                          : `No ${activeTab} assignments available at the moment.`}
                      </p>
                      {activeTab !== 'all' && stats.total > 0 && (
                        <Button variant="link" size="sm" onClick={() => setActiveTab('all')} className="mt-4 text-emerald-600">
                          View all assignments
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filteredAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "border-0 shadow-sm bg-white hover:shadow-md transition-shadow",
                        !assignment.submission && isPast(new Date(assignment.due_date)) && "border-l-4 border-l-red-500"
                      )}>
                        <CardContent className="p-3 sm:p-4 md:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0 bg-purple-100">
                                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{assignment.title}</h3>
                                    {assignment.attachment_urls && assignment.attachment_urls.length > 0 && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[9px] sm:text-[10px]">
                                        <Paperclip className="h-2.5 w-2.5 mr-0.5" />
                                        {assignment.file_count || assignment.attachment_urls.length} file(s)
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-0.5 sm:mt-1">
                                    <Badge variant="outline" className="text-[9px] sm:text-xs">{assignment.subject}</Badge>
                                    <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
                                      <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {assignment.teacher_name}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
                                      <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {assignment.total_marks} marks
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4">
                              <div className="text-left sm:text-right">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                  <span className={cn("text-[11px] sm:text-sm font-medium", getDaysRemainingColor(assignment.due_date))}>
                                    {getDaysRemaining(assignment.due_date)}
                                  </span>
                                  {getStatusBadge(assignment)}
                                </div>
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                                  Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                                </p>
                                {assignment.submission?.score !== undefined && (
                                  <p className="text-[11px] sm:text-sm font-bold text-green-600 mt-0.5 sm:mt-1">
                                    Score: {assignment.submission.score}/{assignment.total_marks}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-1.5 sm:gap-2">
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => { setSelectedAssignment(assignment); setShowDetailsDialog(true) }}
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                >
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                {!assignment.submission && (
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                                    onClick={() => { setSelectedAssignment(assignment); setShowSubmitDialog(true) }}>
                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                                    <span className="hidden xs:inline">Submit</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Assignment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          {selectedAssignment && (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 flex-wrap">
                  {selectedAssignment.title}
                  {selectedAssignment.attachment_urls && selectedAssignment.attachment_urls.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Paperclip className="h-3 w-3 mr-1" />
                      {selectedAssignment.file_count || selectedAssignment.attachment_urls.length} file(s)
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {selectedAssignment.subject} • {selectedAssignment.total_marks} marks • Due: {format(new Date(selectedAssignment.due_date), 'MMM dd, yyyy')} • Teacher: {selectedAssignment.teacher_name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                {selectedAssignment.description && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Description</h4>
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 sm:p-4 rounded-lg">{selectedAssignment.description}</p>
                  </div>
                )}
                
                {selectedAssignment.instructions && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Instructions</h4>
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 sm:p-4 rounded-lg whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                  </div>
                )}

                {/* Enhanced Attachments Section with Preview */}
                {selectedAssignment.attachment_urls && selectedAssignment.attachment_urls.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2 flex items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5" />
                      Attachments ({selectedAssignment.file_count || selectedAssignment.attachment_urls.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedAssignment.attachment_urls.map((fileUrl: string, i: number) => {
                        const fileName = getFileName(selectedAssignment, i)
                        const ext = fileName.split('.').pop()?.toLowerCase()
                        const canPreview = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'txt', 'md'].includes(ext || '')
                        
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="text-sm truncate flex-1">{fileName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {canPreview && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewFile({ url: fileUrl, name: fileName })}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Preview
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(fileUrl, '_blank')}
                                className="h-7 px-2 text-xs"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {selectedAssignment.submission && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Your Submission</h4>
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm">Submitted: {format(new Date(selectedAssignment.submission.submitted_at), 'MMM dd, yyyy hh:mm a')}</p>
                      {selectedAssignment.submission.score !== undefined && (
                        <div className="mt-2 sm:mt-3">
                          <p className="text-xs sm:text-sm font-medium">Score</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">{selectedAssignment.submission.score}/{selectedAssignment.total_marks}</p>
                          {selectedAssignment.submission.feedback && (
                            <div className="mt-2">
                              <p className="text-xs sm:text-sm font-medium">Feedback</p>
                              <p className="text-xs sm:text-sm text-slate-600">{selectedAssignment.submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Assignment Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Submit Assignment</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedAssignment?.title} • {selectedAssignment?.subject} • {selectedAssignment?.total_marks} marks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 sm:p-6 text-center hover:border-emerald-400 transition-colors">
              <input
                type="file" onChange={handleFileSelect}
                className="hidden" id="submission-file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
              />
              <label htmlFor="submission-file" className="cursor-pointer">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm font-medium text-emerald-600 break-all">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                  PDF, DOC, DOCX, TXT, JPG, PNG, PPT (Max 10MB)
                </p>
              </label>
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                  <span className="text-[11px] sm:text-sm truncate">{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-7 w-7 p-0">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="text-sm">Cancel</Button>
            <Button onClick={handleSubmitAssignment} disabled={!selectedFile || submitting} className="bg-emerald-600 text-sm">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
              Submit Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}