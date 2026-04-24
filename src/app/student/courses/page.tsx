/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/courses/page.tsx - FULLY RESPONSIVE STUDENT COURSES & STUDY NOTES
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, FileText, Search, BookOpen, Download,
  Eye, ChevronRight, GraduationCap, Home,
  Filter, File, Video, Headphones, Image, Menu, X
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

// ========== TYPES ==========
interface StudentProfile {
  id: string; full_name: string; email: string; class: string
  department: string; vin_id?: string; photo_url?: string
}

interface StudyNote {
  id: string; title: string; subject: string; class: string
  description: string; file_url?: string; file_name?: string
  file_type?: string; teacher_name?: string; created_at: string
}

// ========== MAIN COMPONENT ==========
export default function StudentCoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<StudyNote[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // ========== HELPERS ==========
  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id, name: profile.full_name, email: profile.email,
      role: 'student' as const, avatar: profile.photo_url || undefined, isAuthenticated: true
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

  const getSubjectColor = (subject: string) => {
    if (subject.includes('Math')) return { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' }
    if (subject.includes('English')) return { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600' }
    if (subject.includes('Science') || subject.includes('Physics') || subject.includes('Chemistry') || subject.includes('Biology')) return { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' }
    if (subject.includes('Agricultural')) return { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' }
    if (subject.includes('Computer')) return { bg: 'bg-cyan-100', text: 'text-cyan-600', icon: 'text-cyan-600' }
    return { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-600' }
  }

  // ========== LOAD DATA ==========
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData || profileData.role !== 'student') {
        toast.error('Access denied'); router.push('/portal'); return
      }

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: (profileData as any).vin_id,
        photo_url: profileData.photo_url
      }
      setProfile(studentProfile)

      // Load notes for student's class
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('class', studentProfile.class)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      // Load teacher names
      const teacherIds = [...new Set((notesData || []).map(n => n.created_by).filter(Boolean))]
      const teacherMap: Record<string, string> = {}
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').in('id', teacherIds)
        teachers?.forEach(t => { teacherMap[t.id] = t.full_name })
      }

      const processedNotes: StudyNote[] = (notesData || []).map(n => ({
        ...n, teacher_name: teacherMap[n.created_by] || 'Teacher'
      }))

      setNotes(processedNotes)
      setFilteredNotes(processedNotes)
      setAvailableSubjects([...new Set(processedNotes.map(n => n.subject))].sort())

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load study notes')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  // Filter notes
  useEffect(() => {
    let filtered = [...notes]
    if (subjectFilter !== 'all') filtered = filtered.filter(n => n.subject === subjectFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q))
    }
    setFilteredNotes(filtered)
  }, [notes, subjectFilter, searchQuery])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out')
    router.push('/portal')
  }

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-3 text-sm sm:text-base text-slate-500">Loading study materials...</p>
          </div>
        </div>
      </div>
    )
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed top-20 left-3 z-50 bg-white p-2 rounded-lg shadow-md border"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="pt-20">
          <StudentSidebar
            profile={profile} onLogout={handleLogout} collapsed={false}
            onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            activeTab="courses" setActiveTab={() => {}}
          />
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <StudentSidebar 
            profile={profile} onLogout={handleLogout}
            collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab="courses" setActiveTab={() => {}}
          />
        </div>

        <div className={cn("flex-1 transition-all duration-300 w-full", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
          <main className="pt-16 sm:pt-20 lg:pt-24 pb-24 lg:pb-12 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="container mx-auto max-w-7xl">
              
              {/* Breadcrumb */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Link href="/student" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-foreground font-medium truncate">My Courses & Notes</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {profile?.class} • {filteredNotes.length} materials
                </p>
              </motion.div>

              {/* Header & Filters - Responsive */}
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Study Materials</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Access notes shared by your teachers</p>
                  </div>
                  <Badge className="self-start sm:self-center text-[10px] sm:text-xs">{profile?.class}</Badge>
                </div>
                
                {/* Search & Filter Bar - Stack on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-9 w-full bg-white h-9 sm:h-10 text-xs sm:text-sm"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                  
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-white h-9 sm:h-10 text-xs sm:text-sm">
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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

              {/* Notes Grid - Responsive columns */}
              {filteredNotes.length === 0 ? (
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="text-center py-12 sm:py-16 lg:py-20">
                    {notes.length === 0 ? (
                      <>
                        <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No study notes available</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                          Your teachers haven't shared any study materials for {profile?.class} yet.
                        </p>
                      </>
                    ) : (
                      <>
                        <Search className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No results found</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Try adjusting your search or filter
                        </p>
                        <Button variant="outline" size="sm" className="mt-3 sm:mt-4" onClick={() => { setSearchQuery(''); setSubjectFilter('all') }}>
                          Clear Filters
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredNotes.map((note, index) => {
                    const FileIcon = getFileIcon(note.file_name)
                    const colors = getSubjectColor(note.subject)
                    
                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all h-full flex flex-col group">
                          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0", colors.bg)}>
                                <FileIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", colors.icon)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm sm:text-base font-semibold truncate">{note.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-0.5 sm:mt-1">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">{note.subject}</Badge>
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col px-3 sm:px-4 pb-3 sm:pb-4">
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2 sm:mb-3">
                              {note.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3 border-t">
                              <span className="text-[10px] sm:text-xs text-slate-500 truncate mr-1">
                                {note.teacher_name}
                              </span>
                              <div className="flex gap-0.5 sm:gap-1 shrink-0">
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => { setSelectedNote(note); setShowDetailsDialog(true) }}
                                >
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                {note.file_url && (
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                    onClick={() => window.open(note.file_url, '_blank')}
                                  >
                                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Note Details Dialog - Responsive */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl lg:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          {selectedNote && (
            <>
              <DialogHeader className="space-y-2 sm:space-y-3">
                <DialogTitle className="text-lg sm:text-xl">{selectedNote.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Badge variant="outline">{selectedNote.subject}</Badge>
                  <span>•</span>
                  <span>{selectedNote.teacher_name}</span>
                  <span>•</span>
                  <span>{format(new Date(selectedNote.created_at), 'MMM dd, yyyy')}</span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Description</h4>
                  <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 sm:p-4 rounded-lg">
                    {selectedNote.description || 'No description provided.'}
                  </p>
                </div>
                
                {selectedNote.file_url && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Attachment</h4>
                    <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm" onClick={() => window.open(selectedNote.file_url, '_blank')}>
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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