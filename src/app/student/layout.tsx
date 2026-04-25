/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/courses/page.tsx - FIXED: Breadcrumb properly below header
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
  Eye, ChevronRight, Home,
  Filter, File, Video, Headphones, Image, Menu, X
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

// ========== NoSSR COMPONENT TO FIX HYDRATION ==========
function NoSSR({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  return <>{children}</>
}

// ========== TYPES ==========
interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  display_name?: string
  admission_year?: number
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
        first_name: profileData.first_name,
        middle_name: profileData.middle_name,
        last_name: profileData.last_name,
        display_name: profileData.display_name,
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: profileData.vin_id,
        photo_url: profileData.photo_url,
        admission_year: profileData.admission_year
      }
      setProfile(studentProfile)

      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('class', studentProfile.class)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

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
      <NoSSR>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <Header onLogout={handleLogout} />
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)] pt-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-emerald-600 mx-auto" />
              <p className="mt-3 text-sm sm:text-base text-slate-500">Loading study materials...</p>
            </div>
          </div>
        </div>
      </NoSSR>
    )
  }

  // ========== RENDER ==========
  return (
    <NoSSR>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        
        {/* Mobile Sidebar Toggle */}
        <button
          className="lg:hidden fixed top-16 left-3 z-50 bg-white p-2 rounded-lg shadow-md border"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50 top-16" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <div className={cn(
          "lg:hidden fixed top-16 left-0 z-50 h-[calc(100vh-64px)] w-72 bg-white shadow-xl transition-transform duration-300 overflow-y-auto",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <StudentSidebar
            profile={profile}
            onLogout={handleLogout}
            collapsed={false}
            onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            activeTab="courses"
            setActiveTab={() => {}}
          />
        </div>
        
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <StudentSidebar 
              profile={profile}
              onLogout={handleLogout}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              activeTab="courses"
              setActiveTab={() => {}}
            />
          </div>

          {/* Main Content Area */}
          <div className={cn(
            "flex-1 transition-all duration-300 w-full min-h-screen",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
          )}>
            {/* Header spacer - critical for fixed header */}
            <div className="h-14 sm:h-16 lg:h-[72px]" />
            
            <main className="pb-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                
                {/* Breadcrumb - properly spaced below header */}
                <div className="pt-2 pb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Link href="/student" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span>My Courses & Notes</span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground font-medium">{profile?.class}</span>
                  </div>
                </div>

                {/* Page Header */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Study Materials</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Access notes and resources shared by your teachers
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {profile?.class}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {filteredNotes.length} materials
                    </span>
                  </div>
                </div>
                
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by title, subject, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full bg-white h-10 text-sm rounded-lg border-slate-200 focus:ring-emerald-500"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                  
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-white h-10 text-sm rounded-lg">
                      <Filter className="h-4 w-4 mr-2 text-slate-400" />
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

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                  <Card className="border shadow-sm bg-white rounded-xl">
                    <CardContent className="text-center py-12">
                      {notes.length === 0 ? (
                        <>
                          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-gray-900 mb-1">No study notes available</h3>
                          <p className="text-sm text-muted-foreground">
                            Check back later for study materials from your teachers.
                          </p>
                        </>
                      ) : (
                        <>
                          <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-gray-900 mb-1">No results found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Try adjusting your search or filter
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSearchQuery(''); setSubjectFilter('all') }}
                          >
                            Clear filters
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredNotes.map((note, index) => {
                      const FileIcon = getFileIcon(note.file_name)
                      const colors = getSubjectColor(note.subject)
                      
                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        >
                          <Card className="border shadow-sm bg-white hover:shadow-md transition-all h-full flex flex-col rounded-xl">
                            <CardHeader className="pb-2 px-4 pt-4">
                              <div className="flex items-start gap-3">
                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                                  <FileIcon className={cn("h-4 w-4", colors.icon)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm font-semibold truncate">{note.title}</CardTitle>
                                  <Badge variant="outline" className="text-[10px] mt-1">
                                    {note.subject}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col px-4 pb-4">
                              <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                                {note.description || 'No description provided'}
                              </p>
                              <div className="flex items-center justify-between mt-auto pt-2 border-t">
                                <span className="text-[10px] text-slate-500 truncate">
                                  {note.teacher_name}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => { setSelectedNote(note); setShowDetailsDialog(true) }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {note.file_url && (
                                    <Button
                                      variant="ghost" 
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => window.open(note.file_url, '_blank')}
                                    >
                                      <Download className="h-3.5 w-3.5" />
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

        {/* Note Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="w-[90vw] max-w-md rounded-xl p-5">
            {selectedNote && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">{selectedNote.title}</DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{selectedNote.subject}</Badge>
                    <span>•</span>
                    <span>{selectedNote.teacher_name}</span>
                    <span>•</span>
                    <span>{format(new Date(selectedNote.created_at), 'MMM dd, yyyy')}</span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-3 py-3">
                  <div>
                    <h4 className="font-semibold text-xs mb-1">Description</h4>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {selectedNote.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  {selectedNote.file_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(selectedNote.file_url, '_blank')}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      {selectedNote.file_name || 'Download'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </NoSSR>
  )
}