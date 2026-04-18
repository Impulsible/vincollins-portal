/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/courses/page.tsx - STUDENT COURSES & STUDY NOTES PAGE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, FileText, Search, BookOpen, Download,
  Eye, ChevronRight, GraduationCap, Home,
  Filter, File, Video, Headphones, Image
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface StudyNote {
  id: string
  title: string
  subject: string
  class: string
  description: string
  file_url?: string
  file_name?: string
  file_type?: string
  teacher_name?: string
  created_at: string
}

export default function StudentCoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<StudyNote[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return File
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return Video
    if (['mp3', 'wav'].includes(ext || '')) return Headphones
    return FileText
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

      // Load study notes for student's class
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('class', studentProfile.class)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Error loading notes:', notesError)
        toast.error('Failed to load study notes')
        return
      }

      // Load teacher names
      const teacherIds = [...new Set((notesData || []).map(n => n.created_by).filter(Boolean))]
      const teacherMap: Record<string, string> = {}
      
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds)
        
        teachers?.forEach(t => { teacherMap[t.id] = t.full_name })
      }

      const processedNotes: StudyNote[] = (notesData || []).map(n => ({
        ...n,
        teacher_name: teacherMap[n.created_by] || 'Teacher'
      }))

      setNotes(processedNotes)
      setFilteredNotes(processedNotes)
      
      const subjects = [...new Set(processedNotes.map(n => n.subject))]
      setAvailableSubjects(subjects.sort())

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load study notes')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter notes
  useEffect(() => {
    let filtered = [...notes]

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(n => n.subject === subjectFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.subject.toLowerCase().includes(query) ||
        n.description?.toLowerCase().includes(query)
      )
    }

    setFilteredNotes(filtered)
  }, [notes, subjectFilter, searchQuery])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="courses"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">
              
              {/* Breadcrumb */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/student" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">My Courses & Notes</span>
                </div>
              </motion.div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-64 bg-white"
                    />
                  </div>
                  
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-[150px] bg-white">
                      <Filter className="h-4 w-4 mr-2" />
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

              {/* Notes Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.length === 0 ? (
                  <Card className="col-span-full border-0 shadow-lg bg-white">
                    <CardContent className="text-center py-16">
                      <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No study notes available
                      </h3>
                      <p className="text-muted-foreground">
                        Check back later for study materials from your teachers.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotes.map((note, index) => {
                    const FileIcon = getFileIcon(note.file_name)
                    
                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all h-full flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                                note.subject.includes('Math') ? "bg-blue-100" :
                                note.subject.includes('English') ? "bg-emerald-100" :
                                note.subject.includes('Science') ? "bg-purple-100" :
                                "bg-amber-100"
                              )}>
                                <FileIcon className={cn(
                                  "h-6 w-6",
                                  note.subject.includes('Math') ? "text-blue-600" :
                                  note.subject.includes('English') ? "text-emerald-600" :
                                  note.subject.includes('Science') ? "text-purple-600" :
                                  "text-amber-600"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base font-semibold truncate">
                                  {note.title}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">{note.subject}</Badge>
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col">
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                              {note.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-3 border-t">
                              <span className="text-xs text-slate-500">
                                {note.teacher_name} • {format(new Date(note.created_at), 'MMM dd')}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedNote(note)
                                    setShowDetailsDialog(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {note.file_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(note.file_url, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Note Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {selectedNote && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedNote.title}</DialogTitle>
                <DialogDescription>
                  {selectedNote.subject} • {selectedNote.teacher_name} • {format(new Date(selectedNote.created_at), 'MMM dd, yyyy')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                    {selectedNote.description || 'No description provided.'}
                  </p>
                </div>
                
                {selectedNote.file_url && (
                  <div>
                    <h4 className="font-semibold mb-2">Attachment</h4>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(selectedNote.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {selectedNote.file_name || 'Download File'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}