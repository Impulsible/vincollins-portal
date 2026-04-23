// components/staff/StaffExamsTab.tsx
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
  Filter, ChevronRight, X
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

// ============================================
// TYPES
// ============================================
interface Exam {
  id: string
  title: string
  description: string
  subject: string
  class: string
  duration: number
  total_marks: number
  passing_marks: number
  instructions: string
  status: 'draft' | 'published' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
  scheduled_for?: string
  end_time?: string
  questions?: any[]
  _count?: {
    questions: number
    submissions: number
  }
}

interface StaffExamsTabProps {
  staffProfile: any
}

// ============================================
// LOADING SKELETON
// ============================================
function ExamsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function StaffExamsTab({ staffProfile }: StaffExamsTabProps) {
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
    draft: 0,
    archived: 0
  })

  // Subjects and Classes for filters
  const [subjects, setSubjects] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])

  // ✅ Fix 1: Set mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Fix 2: Load exams with real-time subscription
  useEffect(() => {
    if (mounted && staffProfile?.id) {
      loadExams()
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('exams_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'exams',
            filter: `created_by=eq.${staffProfile.id}`
          },
          () => {
            // Reload exams when any change occurs
            loadExams()
          }
        )
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [mounted, staffProfile?.id])

  // Load exams from database
  const loadExams = async () => {
    if (!staffProfile?.id) return
    
    setLoading(true)
    try {
      // Fetch exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          questions:exam_questions(count)
        `)
        .eq('created_by', staffProfile.id)
        .order('created_at', { ascending: false })
      
      if (examsError) throw examsError
      
      // Transform data
      const formattedExams: Exam[] = (examsData || []).map((exam: any) => ({
        ...exam,
        _count: {
          questions: exam.questions?.[0]?.count || 0,
          submissions: 0
        }
      }))
      
      setExams(formattedExams)
      
      // Update stats
      setStats({
        total: formattedExams.length,
        published: formattedExams.filter(e => e.status === 'published').length,
        draft: formattedExams.filter(e => e.status === 'draft').length,
        archived: formattedExams.filter(e => e.status === 'archived').length
      })
      
      // Extract unique subjects and classes for filters
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
      
      toast.success(`Exam ${status}`)
      loadExams()
    } catch (error) {
      console.error('Error updating exam status:', error)
      toast.error('Failed to update exam status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />Published
        </Badge>
      case 'draft':
        return <Badge variant="outline">
          <FileText className="h-3 w-3 mr-1" />Draft
        </Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
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

  // ✅ Show loading until mounted
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
          className="space-y-6"
        >
          {/* Header with proper spacing */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                My Exams
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create, manage, and publish exams for your students
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/staff/exams/create'}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Total Exams</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Published</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.published}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Draft</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.draft}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Archived</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.archived}</p>
                  </div>
                  <Archive className="h-8 w-8 text-gray-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Exams List */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Your Exams</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                  <p className="text-gray-500">Loading exams...</p>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No exams found</p>
                  <Button 
                    variant="link" 
                    onClick={() => window.location.href = '/staff/exams/create'}
                    className="mt-2"
                  >
                    Create your first exam
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => (
                        <TableRow key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-semibold">{exam.title}</p>
                              {exam.description && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">
                                  {exam.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell>{exam.class}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {exam._count?.questions || 0} Qs
                            </Badge>
                          </TableCell>
                          <TableCell>{exam.total_marks} marks</TableCell>
                          <TableCell>{getStatusBadge(exam.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(exam.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExam(exam)
                                  setShowPreviewDialog(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = `/staff/exams/edit/${exam.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {exam.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'published')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Publish Exam
                                    </DropdownMenuItem>
                                  )}
                                  {exam.status === 'published' && (
                                    <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'archived')}>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive Exam
                                    </DropdownMenuItem>
                                  )}
                                  {exam.status === 'archived' && (
                                    <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'draft')}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Restore Exam
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setExamToDelete(exam)
                                      setShowDeleteDialog(true)
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Exam
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

          {/* Preview Dialog */}
          <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedExam?.title}</DialogTitle>
                <DialogDescription>
                  {selectedExam?.subject} | {selectedExam?.class}
                </DialogDescription>
              </DialogHeader>
              {selectedExam && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold">{selectedExam.duration} minutes</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Total Marks</p>
                      <p className="font-semibold">{selectedExam.total_marks}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Passing Marks</p>
                      <p className="font-semibold">{selectedExam.passing_marks}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Questions</p>
                      <p className="font-semibold">{selectedExam._count?.questions || 0}</p>
                    </div>
                  </div>
                  
                  {selectedExam.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedExam.description}
                      </p>
                    </div>
                  )}
                  
                  {selectedExam.instructions && (
                    <div>
                      <h4 className="font-semibold mb-2">Instructions</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedExam.instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => window.location.href = `/staff/exams/edit/${selectedExam?.id}`}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Exam
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{examToDelete?.title}"? 
                  This action cannot be undone and all associated questions will also be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteExam}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                  ) : (
                    <><Trash2 className="h-4 w-4 mr-2" />Delete Exam</>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Missing Archive icon - add to imports
function Archive(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  )
}