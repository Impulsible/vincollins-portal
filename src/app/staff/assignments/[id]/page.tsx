// app/staff/assignments/[id]/page.tsx - COMPLETE WITH ENHANCED FILE PREVIEW + DARK MODE
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, ArrowLeft, Home, ChevronRight, Calendar, Clock,
  Users, FileText, Download, Eye, Edit,
  Send, CheckCircle, AlertCircle, Award,
  GraduationCap, FileSpreadsheet, Paperclip, Image as ImageIcon,
  X, Volume2, Video
} from 'lucide-react'
import Link from 'next/link'
import { format, isPast } from 'date-fns'

interface Assignment {
  id: string
  title: string
  description: string
  subject: string
  classes: string[]
  department: string
  due_date: string
  total_points: number
  instructions: string
  attachment_urls: string[]
  attachment_names?: string[]
  file_count: number
  status: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  student_class: string
  student_avatar?: string
  file_url: string
  file_name: string
  submitted_at: string
  score: number | null
  feedback: string | null
  status: string
  graded_by: string | null
  graded_at: string | null
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
  role: string
  photo_url?: string
}

interface HeaderUser {
  id: string
  name: string
  firstName: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  isAuthenticated: boolean
}

// ── Enhanced File Preview Modal with Dark Mode ───────────────────────────────
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
    setIsVideo(['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext || ''))
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
      console.error('Error loading text file:', err)
      setError('Could not load file content')
    } finally {
      setLoading(false)
    }
  }
  
  const getFileTypeLabel = () => {
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }
  
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
              <DialogTitle className="text-sm font-medium truncate text-slate-900 dark:text-white">{fileName}</DialogTitle>
              <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {getFileTypeLabel()}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.open(fileUrl, '_blank')}
                className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] bg-white dark:bg-slate-950">
          {isImage && (
            <div className="flex items-center justify-center min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={fileUrl} 
                alt={fileName} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  setError('Failed to load image')
                }}
              />
            </div>
          )}
          
          {isPdf && (
            <div className="w-full">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <FileText className="h-4 w-4 inline mr-1" />
                  PDF Document
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
              <iframe 
                src={`${fileUrl}#toolbar=0`} 
                className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                title={fileName}
              />
            </div>
          )}
          
          {isVideo && (
            <div className="w-full">
              <video 
                controls 
                className="w-full rounded-lg shadow-sm bg-black"
                style={{ maxHeight: '70vh' }}
              >
                <source src={fileUrl} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-md">
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-6 text-center mb-4 border border-slate-200 dark:border-slate-800">
                  <Volume2 className="h-12 w-12 mx-auto text-purple-500 dark:text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{fileName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Audio File</p>
                </div>
                <audio controls className="w-full">
                  <source src={fileUrl} />
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File Instead
                  </Button>
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
                {fileName.endsWith('.docx') || fileName.endsWith('.doc') ? (
                  <FileText className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                ) : fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ? (
                  <FileSpreadsheet className="h-10 w-10 text-green-500 dark:text-green-400" />
                ) : fileName.endsWith('.pptx') || fileName.endsWith('.ppt') ? (
                  <Eye className="h-10 w-10 text-orange-500 dark:text-orange-400" />
                ) : (
                  <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">{fileName}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {getFileTypeLabel()} files cannot be previewed directly
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`
                    window.open(googleDocsUrl, '_blank')
                  }}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Try Google Docs Viewer
                </Button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                Tip: Download the file to view it with Microsoft Office or compatible software
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function StaffAssignmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [gradeScore, setGradeScore] = useState<number>(0)
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile?.id) {
      loadAssignment()
      loadSubmissions()
    }
  }, [assignmentId, profile?.id])

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, photo_url')
        .eq('id', session.user.id)
        .single()
      
      if (data) setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/portal')
    }
  }

  const loadAssignment = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (error) {
      console.error('Error loading assignment:', error)
      toast.error('Failed to load assignment')
      router.push('/staff/assignments')
      return
    }

    console.log('📎 Assignment loaded:', {
      id: data.id,
      title: data.title,
      attachment_urls: data.attachment_urls,
      file_count: data.file_count,
      hasAttachments: !!(data.attachment_urls && data.attachment_urls.length > 0)
    })

    setAssignment(data)
  }

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      const studentIds = data?.map(s => s.student_id) || []
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, photo_url, first_name, last_name')
          .in('id', studentIds)

        const avatarMap = new Map()
        students?.forEach(s => {
          avatarMap.set(s.id, s.photo_url)
        })

        data?.forEach(s => {
          s.student_avatar = avatarMap.get(s.student_id)
        })
      }

      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeScore(submission.score || 0)
    setGradeFeedback(submission.feedback || '')
    setShowGradeDialog(true)
  }

  const submitGrade = async () => {
    if (!selectedSubmission) return

    if (gradeScore < 0 || gradeScore > (assignment?.total_points || 100)) {
      toast.error(`Score must be between 0 and ${assignment?.total_points}`)
      return
    }

    setGrading(true)
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score: gradeScore,
          feedback: gradeFeedback,
          status: 'graded',
          graded_by: profile?.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id)

      if (error) throw error

      toast.success('Grade submitted successfully!')
      
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.student_id,
        title: `📝 Assignment Graded: ${assignment?.title}`,
        message: `You received ${gradeScore}/${assignment?.total_points} on your assignment.${gradeFeedback ? ` Feedback: ${gradeFeedback}` : ''}`,
        type: 'grade',
        link: '/student/assignments',
        created_at: new Date().toISOString(),
        read: false
      })

      setShowGradeDialog(false)
      loadSubmissions()
    } catch (error) {
      console.error('Error grading:', error)
      toast.error('Failed to submit grade')
    } finally {
      setGrading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const formatProfileForHeader = (profile: StaffProfile | null): HeaderUser | undefined => {
    if (!profile) return undefined
    
    let headerRole: 'admin' | 'teacher' | 'student' = 'teacher'
    if (profile.role === 'admin') headerRole = 'admin'
    else if (profile.role === 'student') headerRole = 'student'
    
    return {
      id: profile.id,
      name: profile.full_name || 'Staff',
      firstName: profile.full_name?.split(' ')[0] || 'Staff',
      email: profile.email || '',
      role: headerRole,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const getSubmissionStats = () => {
    const total = submissions.length
    const graded = submissions.filter(s => s.status === 'graded').length
    const pending = submissions.filter(s => s.status === 'submitted').length
    const averageScore = graded > 0 
      ? submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / graded
      : 0
    
    return { total, graded, pending, averageScore: averageScore.toFixed(1) }
  }

  const stats = getSubmissionStats()
  const isOverdue = assignment ? isPast(new Date(assignment.due_date)) : false

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getFileIcon = (url: string, fileName?: string) => {
    const ext = (fileName || url).split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500 dark:text-red-400" />
      case 'doc':
      case 'docx': return <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return <ImageIcon className="h-4 w-4 text-green-500 dark:text-green-400" />
      case 'xls':
      case 'xlsx':
      case 'csv': return <FileSpreadsheet className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      case 'mp4':
      case 'webm':
      case 'mov': return <Video className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      case 'mp3':
      case 'wav':
      case 'ogg': return <Volume2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
      default: return <Paperclip className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    }
  }

  const getDisplayFileName = (assignment: Assignment, index: number): string => {
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

  if (loading || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm">Loading assignment details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 lg:pt-24 pb-12">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                
                {/* Breadcrumb */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    <Link href="/staff" className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" /> Dashboard
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/staff/assignments" className="hover:text-emerald-600 dark:hover:text-emerald-400">Assignments</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">{assignment.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/staff/assignments')}
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  </div>
                </div>

                {/* Assignment Header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={cn(
                          'border-0',
                          isOverdue 
                            ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400" 
                            : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                        )}>
                          {isOverdue ? 'Overdue' : assignment.status}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          {assignment.subject}
                        </Badge>
                        {assignment.department && (
                          <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {assignment.department}
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                        {assignment.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Created: {format(new Date(assignment.created_at), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          {assignment.total_points} marks
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {assignment.classes?.length || 0} class(es)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Target Classes */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Classes:</p>
                    <div className="flex flex-wrap gap-2">
                      {assignment.classes?.map(cls => (
                        <Badge 
                          key={cls} 
                          className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0"
                        >
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <TabsTrigger 
                      value="overview" 
                      className="rounded-lg text-sm text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="submissions" 
                      className="rounded-lg text-sm text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Submissions ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="statistics" 
                      className="rounded-lg text-sm text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Statistics
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        {assignment.description && (
                          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <CardHeader>
                              <CardTitle className="text-lg text-slate-800 dark:text-white">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{assignment.description}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {assignment.instructions && (
                          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <CardHeader>
                              <CardTitle className="text-lg text-slate-800 dark:text-white">Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{assignment.instructions}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Attachments Section */}
                        {(assignment.attachment_urls && assignment.attachment_urls.length > 0) || (assignment.file_count > 0) ? (
                          <Card className="border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                                <Paperclip className="h-5 w-5" />
                                Attachments
                                <Badge className="bg-emerald-600 dark:bg-emerald-600 text-white ml-2 border-0">
                                  {assignment.file_count || assignment.attachment_urls?.length || 0} file(s)
                                </Badge>
                              </CardTitle>
                              <CardDescription className="text-emerald-700 dark:text-emerald-400">
                                Click on any file to preview or download
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {assignment.attachment_urls?.map((url, index) => {
                                  const fileName = getDisplayFileName(assignment, index)
                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md dark:hover:shadow-slate-950/50 transition-all group"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                          {getFileIcon(url, fileName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{fileName}</p>
                                          <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {url.split('.').pop()?.toUpperCase() || 'FILE'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                          onClick={() => window.open(url, '_blank')}
                                          title="Download"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-emerald-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                          onClick={() => setPreviewFile({ url, name: fileName })}
                                          title="Preview"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                                Files are stored securely and can be downloaded by students
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/40">
                            <CardContent className="py-8 text-center">
                              <Paperclip className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                              <p className="text-sm text-slate-500 dark:text-slate-400">No attachments</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">No files have been uploaded for this assignment</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      <div className="space-y-6">
                        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <CardHeader>
                            <CardTitle className="text-lg text-slate-800 dark:text-white">Quick Stats</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Total Students</span>
                              <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{stats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Submitted</span>
                              <span className="font-bold text-green-600 dark:text-green-400">{stats.pending}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Graded</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{stats.graded}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Not Submitted</span>
                              <span className="font-bold text-orange-600 dark:text-orange-400">{stats.total - stats.pending - stats.graded}</span>
                            </div>
                            {stats.graded > 0 && (
                              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600 dark:text-slate-400">Average Score</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.averageScore}%</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Submissions Tab */}
                  <TabsContent value="submissions">
                    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-lg text-slate-800 dark:text-white">Student Submissions</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                          {stats.pending} pending, {stats.graded} graded out of {stats.total} total
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {submissions.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">No submissions yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {submissions.map((submission, index) => (
                              <motion.div
                                key={submission.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md dark:hover:shadow-slate-950/50 transition-shadow bg-white dark:bg-slate-900"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                                      <AvatarImage src={submission.student_avatar} />
                                      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                                        {getInitials(submission.student_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-semibold text-base text-slate-800 dark:text-slate-100">{submission.student_name}</h4>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                          <GraduationCap className="h-3 w-3 mr-1" />
                                          {submission.student_class}
                                        </Badge>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                          Submitted: {format(new Date(submission.submitted_at), 'MMM dd, h:mm a')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {submission.status === 'graded' && submission.score !== null && (
                                      <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-0">
                                        Score: {submission.score}/{assignment.total_points}
                                      </Badge>
                                    )}
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(submission.file_url, '_blank')}
                                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      File
                                    </Button>
                                    
                                    {submission.status !== 'graded' ? (
                                      <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                        onClick={() => handleGrade(submission)}
                                      >
                                        <Send className="h-4 w-4 mr-1" />
                                        Grade
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGrade(submission)}
                                        className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit Grade
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {submission.feedback && (
                                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-sm">
                                    <p className="text-slate-600 dark:text-slate-400">
                                      <span className="font-medium text-slate-700 dark:text-slate-300">Feedback:</span> {submission.feedback}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Statistics Tab */}
                  <TabsContent value="statistics">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <CardHeader>
                          <CardTitle className="text-lg text-slate-800 dark:text-white">Submission Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Total Students</span>
                              <span className="font-bold text-slate-800 dark:text-slate-100">{stats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Submitted</span>
                              <span className="font-bold text-green-600 dark:text-green-400">{stats.pending}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Graded</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{stats.graded}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Not Submitted</span>
                              <span className="font-bold text-orange-600 dark:text-orange-400">{stats.total - stats.pending - stats.graded}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Submission Rate</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {((stats.pending + stats.graded) / stats.total * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {stats.graded > 0 && (
                        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <CardHeader>
                            <CardTitle className="text-lg text-slate-800 dark:text-white">Grade Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Average Score</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.averageScore}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Highest Score</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {Math.max(...submissions.filter(s => s.score).map(s => s.score || 0))}/{assignment.total_points}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Lowest Score</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {Math.min(...submissions.filter(s => s.score).map(s => s.score || 0))}/{assignment.total_points}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
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

      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Grade Submission</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {selectedSubmission?.student_name} - {assignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="score" className="text-slate-700 dark:text-slate-300">
                Score (out of {assignment?.total_points})
              </Label>
              <Input
                id="score"
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(parseInt(e.target.value) || 0)}
                min={0}
                max={assignment?.total_points}
                className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="feedback" className="text-slate-700 dark:text-slate-300">
                Feedback (optional)
              </Label>
              <Textarea
                id="feedback"
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
                rows={4}
                className="mt-1 resize-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowGradeDialog(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitGrade} 
              disabled={grading} 
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {grading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Grade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}