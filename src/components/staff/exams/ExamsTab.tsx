// components/staff/StaffExamsTab.tsx - FULLY RESPONSIVE WITH DATABASE INTEGRATION
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { 
  FileText, Plus, Search, Eye, Edit, Trash2, 
  CheckCircle2, Clock, AlertCircle, Loader2,
  Calendar, Users, BookOpen, RefreshCw, Download,
  Filter, ChevronRight, X, Archive, Send, Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

// ============================================
// TYPES - MATCHING YOUR DATABASE SCHEMA
// ============================================
interface Exam {
  id: string
  title: string
  description?: string
  subject: string
  class: string
  duration: number
  total_marks: number
  pass_mark: number
  instructions?: string
  status: 'draft' | 'pending' | 'published' | 'archived'
  has_theory: boolean
  created_by: string
  created_at: string
  updated_at: string
  questions?: any[]
  total_questions?: number
  teacher_name?: string
}

interface StaffExamsTabProps {
  staffProfile: any
}

// ============================================
// LOADING SKELETON - Responsive
// ============================================
function ExamsLoading() {
  return (
    <div className="w-full px-3 sm:px-4 py-3 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <div className="h-7 sm:h-8 w-32 sm:w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded mt-1 animate-pulse" />
        </div>
        <div className="h-8 sm:h-9 w-28 sm:w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 sm:h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-10 sm:h-12 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-64 sm:h-96 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function StaffExamsTab({ staffProfile }: StaffExamsTabProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
    archived: 0
  })

  // Subjects and Classes for filters
  const [subjects, setSubjects] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && staffProfile?.id) {
      loadExams()
      
      // Real-time subscription for exams
      const subscription = supabase
        .channel('staff_exams_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'exams',
            filter: `created_by=eq.${staffProfile.id}`
          },
          () => {
            loadExams()
          }
        )
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [mounted, staffProfile?.id])

  const loadExams = async () => {
    if (!staffProfile?.id) return
    
    setLoading(true)
    try {
      // Fetch exams from your database
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('created_by', staffProfile.id)
        .order('created_at', { ascending: false })

      if (examsError) throw examsError
      
      const formattedExams: Exam[] = (examsData || []).map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        class: exam.class,
        duration: exam.duration,
        total_marks: exam.total_marks,
        pass_mark: exam.pass_mark,
        instructions: exam.instructions,
        status: exam.status,
        has_theory: exam.has_theory,
        created_by: exam.created_by,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
        total_questions: exam.total_questions,
        teacher_name: exam.teacher_name
      }))
      
      setExams(formattedExams)
      
      // Update stats
      setStats({
        total: formattedExams.length,
        published: formattedExams.filter(e => e.status === 'published').length,
        pending: formattedExams.filter(e => e.status === 'pending').length,
        draft: formattedExams.filter(e => e.status === 'draft').length,
        archived: formattedExams.filter(e => e.status === 'archived').length
      })
      
      // Extract unique subjects and classes
      const uniqueSubjects = [...new Set(formattedExams.map(e => e.subject).filter(Boolean))]
      const uniqueClasses = [...new Set(formattedExams.map(e => e.class).filter(Boolean))]
      setSubjects(uniqueSubjects)
      setClasses(uniqueClasses)
      
    } catch (error) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadExams()
    toast.success('Exams refreshed')
  }

  const handleDeleteExam = async () => {
    if (!examToDelete) return
    
    setDeleting(true)
    try {
      // First delete associated questions
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('exam_id', examToDelete.id)
      
      if (questionsError) console.error('Error deleting questions:', questionsError)
      
      // Then delete the exam
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete.id)
      
      if (error) throw error
      
      toast.success('Exam deleted successfully')
      setShowDeleteDialog(false)
      setExamToDelete(null)
      loadExams()
    } catch (error) {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
    } finally {
      setDeleting(false)
    }
  }

  const updateExamStatus = async (id: string, status: 'draft' | 'published' | 'archived') => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
      
      if (error) throw error
      
      toast.success(`Exam ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'saved as draft'}`)
      loadExams()
    } catch (error) {
      console.error('Error updating exam status:', error)
      toast.error('Failed to update exam status')
    }
  }

  const handleDuplicateExam = async (exam: Exam) => {
    try {
      const newExam = {
        title: `${exam.title} (Copy)`,
        subject: exam.subject,
        class: exam.class,
        duration: exam.duration,
        pass_mark: exam.pass_mark,
        instructions: exam.instructions,
        description: exam.description,
        has_theory: exam.has_theory,
        status: 'draft',
        created_by: staffProfile.id,
        teacher_name: staffProfile?.full_name || 'Teacher',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('exams')
        .insert([newExam])
        .select()
        .single()
      
      if (error) throw error
      
      toast.success('Exam duplicated successfully')
      loadExams()
    } catch (error) {
      console.error('Error duplicating exam:', error)
      toast.error('Failed to duplicate exam')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />Published
        </Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
          <Clock className="h-3 w-3 mr-1" />Pending
        </Badge>
      case 'draft':
        return <Badge variant="outline" className="border-slate-300">
          <FileText className="h-3 w-3 mr-1" />Draft
        </Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0">
          <Archive className="h-3 w-3 mr-1" />Archived
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exam.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || exam.status === selectedStatus
    const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject
    const matchesClass = selectedClass === 'all' || exam.class === selectedClass
    
    return matchesSearch && matchesStatus && matchesSubject && matchesClass
  })

  if (!mounted) {
    return <ExamsLoading />
  }

  return (
    <AnimatePresence mode="wait">
      {mounted && (
        <motion.div
          key="exams-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full overflow-x-hidden"
        >
          <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  My Exams
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Create, manage, and publish exams for your students
                </p>
              </div>
              <Button 
                onClick={() => router.push('/staff/exams/create')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Exam
              </Button>
            </div>

            {/* Stats Cards - Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">Total Exams</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                    </div>
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">Published</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-green-700 dark:text-green-300">{stats.published}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
                    </div>
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Draft</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300">{stats.draft}</p>
                    </div>
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Archived</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300">{stats.archived}</p>
                    </div>
                    <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Bar - Responsive */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Search exams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 sm:h-9 text-sm"
                    />
                  </div>
                  
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-8 sm:h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-8 sm:h-9 text-sm">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-8 sm:h-9 text-sm">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    className="h-8 sm:h-9 text-sm"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exams Table - Responsive */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 border-b px-3 sm:px-5 pt-3 sm:pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Your Exams</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-500">Loading exams...</p>
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-500">No exams found</p>
                    <Button 
                      variant="link" 
                      onClick={() => router.push('/staff/exams/create')}
                      className="mt-1 text-xs sm:text-sm"
                    >
                      Create your first exam
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead className="text-xs">Title</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Subject</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Class</TableHead>
                          <TableHead className="text-center text-xs hidden lg:table-cell">Questions</TableHead>
                          <TableHead className="text-center text-xs hidden lg:table-cell">Marks</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs hidden xl:table-cell">Created</TableHead>
                          <TableHead className="text-right text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExams.map((exam) => (
                          <TableRow key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell className="font-medium text-xs sm:text-sm">
                              <div className="max-w-[150px] sm:max-w-[200px]">
                                <p className="font-semibold truncate">{exam.title}</p>
                                {exam.description && (
                                  <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">
                                    {exam.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">{exam.subject}</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">{exam.class}</TableCell>
                            <TableCell className="text-center text-xs hidden lg:table-cell">
                              <Badge variant="outline" className="text-[10px]">
                                {exam.total_questions || 0} Qs
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs hidden lg:table-cell">{exam.total_marks || 0} pts</TableCell>
                            <TableCell>{getStatusBadge(exam.status)}</TableCell>
                            <TableCell className="text-xs text-gray-500 hidden xl:table-cell">
                              {new Date(exam.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedExam(exam)
                                    setShowPreviewDialog(true)
                                  }}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/staff/exams/edit/${exam.id}`)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleDuplicateExam(exam)}>
                                      <Copy className="h-3.5 w-3.5 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    {exam.status === 'draft' && (
                                      <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'published')}>
                                        <Send className="h-3.5 w-3.5 mr-2" />
                                        Publish
                                      </DropdownMenuItem>
                                    )}
                                    {exam.status === 'published' && (
                                      <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'archived')}>
                                        <Archive className="h-3.5 w-3.5 mr-2" />
                                        Archive
                                      </DropdownMenuItem>
                                    )}
                                    {exam.status === 'archived' && (
                                      <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'draft')}>
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Restore
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setExamToDelete(exam)
                                        setShowDeleteDialog(true)
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Dialog - Responsive */}
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
              <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl rounded-xl max-h-[85vh] overflow-y-auto p-0">
                {selectedExam && (
                  <>
                    <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                      <DialogTitle className="text-base sm:text-lg">{selectedExam.title}</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        {selectedExam.subject} | {selectedExam.class}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="px-4 sm:px-6 py-2 space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-[10px] sm:text-xs text-gray-500">Duration</p>
                          <p className="text-xs sm:text-sm font-semibold">{selectedExam.duration} min</p>
                        </div>
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-[10px] sm:text-xs text-gray-500">Total Marks</p>
                          <p className="text-xs sm:text-sm font-semibold">{selectedExam.total_marks}</p>
                        </div>
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-[10px] sm:text-xs text-gray-500">Pass Mark</p>
                          <p className="text-xs sm:text-sm font-semibold">{selectedExam.pass_mark}%</p>
                        </div>
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-[10px] sm:text-xs text-gray-500">Questions</p>
                          <p className="text-xs sm:text-sm font-semibold">{selectedExam.total_questions || 0}</p>
                        </div>
                      </div>
                      
                      {selectedExam.description && (
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm mb-1">Description</h4>
                          <p className="text-xs sm:text-sm text-gray-600">{selectedExam.description}</p>
                        </div>
                      )}
                      
                      {selectedExam.instructions && (
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm mb-1">Instructions</h4>
                          <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap">{selectedExam.instructions}</p>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setShowPreviewDialog(false)} className="h-8 sm:h-9 text-sm order-2 sm:order-1">
                        Close
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowPreviewDialog(false)
                          router.push(`/staff/exams/edit/${selectedExam.id}`)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-sm order-1 sm:order-2"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit Exam
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base sm:text-lg">Delete Exam?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm">
                    Are you sure you want to delete "{examToDelete?.title}"? 
                    This action cannot be undone and all associated questions will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="h-8 sm:h-9 text-sm order-2 sm:order-1">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteExam}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 h-8 sm:h-9 text-sm order-1 sm:order-2"
                  >
                    {deleting ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Deleting...</>
                    ) : (
                      <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete Exam</>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}