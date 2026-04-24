'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle, Search, Clock, FileText, Eye, Edit, MoreVertical, Copy, Send, Trash2, Calculator } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions: number
  total_marks: number
  has_theory: boolean
  created_at: string
  instructions: string
  description: string
  shuffle_questions: boolean
  shuffle_options: boolean
  pass_mark: number
  created_by?: string
  teacher_name?: string
}

interface ExamListProps {
  exams: Exam[]
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onCreateExam: () => void
  onViewExam: (id: string) => void
  onEditExam: (id: string) => void
  onDeleteExam: (id: string) => void
  onDuplicateExam: (id: string) => void
  onSubmitForApproval: (id: string) => void
  totalExams: number
  draftCount: number
  pendingCount: number
  publishedCount: number
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Published</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Pending</Badge>
    case 'draft':
      return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0">Draft</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function ExamList({
  exams,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateExam,
  onViewExam,
  onEditExam,
  onDeleteExam,
  onDuplicateExam,
  onSubmitForApproval,
  totalExams,
  draftCount,
  pendingCount,
  publishedCount
}: ExamListProps) {
  const router = useRouter()
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)

  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (examToDelete) {
      onDeleteExam(examToDelete.id)
      setDeleteDialogOpen(false)
      setExamToDelete(null)
    }
  }

  const handleDuplicate = async (exam: Exam) => {
    setDuplicating(exam.id)
    await onDuplicateExam(exam.id)
    setDuplicating(null)
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            My Exams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Create, manage, and track your examinations
          </p>
        </div>
        <Button
          onClick={onCreateExam}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto h-9 sm:h-10 text-sm"
        >
          <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Create Exam
        </Button>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <p className="text-[9px] sm:text-xs text-muted-foreground">Total Exams</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white">{totalExams}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <p className="text-[9px] sm:text-xs text-muted-foreground">Drafts</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <p className="text-[9px] sm:text-xs text-muted-foreground">Pending</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <p className="text-[9px] sm:text-xs text-muted-foreground">Published</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">{publishedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Responsive */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams by title, subject, or class..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={onStatusFilterChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-[320px] h-9 sm:h-10">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs sm:text-sm">Drafts</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="published" className="text-xs sm:text-sm">Published</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Exam Table/List - Responsive */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-white">All Exams</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                {exams.length} exam{exams.length !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {exams.length === 0 ? (
            <div className="py-12 sm:py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 sm:mb-4">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                No exams found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Try adjusting your search or create a new exam
              </p>
              <Button onClick={onCreateExam} variant="link" className="mt-3 text-emerald-600 text-sm">
                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                Create your first exam
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View - Card Layout */}
              <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((exam) => (
                  <div key={exam.id} className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {exam.title || 'Untitled'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {exam.subject || '—'} • {exam.class || '—'}
                        </p>
                      </div>
                      {getStatusBadge(exam.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.duration || 60} min
                      </span>
                      <span>
                        📝 {exam.total_questions || 0} Qs
                      </span>
                      <span>
                        🎯 {exam.total_marks || 0} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-slate-400">{formatDate(exam.created_at)}</span>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onViewExam(exam.id)} 
                          className="h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        {exam.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEditExam(exam.id)} 
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                              <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleDuplicate(exam)} disabled={duplicating === exam.id}>
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              {duplicating === exam.id ? 'Duplicating...' : 'Duplicate'}
                            </DropdownMenuItem>
                            {exam.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                                <Send className="mr-2 h-3.5 w-3.5" /> Submit for Approval
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'published' && (
                              <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                                <Calculator className="mr-2 h-3.5 w-3.5" /> Enter Scores
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(exam)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Class</TableHead>
                      <TableHead className="text-center text-xs">Questions</TableHead>
                      <TableHead className="text-center text-xs">Marks</TableHead>
                      <TableHead className="text-center text-xs">Duration</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          {exam.title || 'Untitled'}
                        </TableCell>
                        <TableCell className="text-sm">{exam.subject || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{exam.class || '—'}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">{exam.total_questions || 0}</TableCell>
                        <TableCell className="text-center text-sm font-medium">{exam.total_marks || 0}</TableCell>
                        <TableCell className="text-center text-sm">
                          <span className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />{exam.duration || 60}m
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(exam.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">{formatDate(exam.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => onViewExam(exam.id)} 
                              className="h-8 w-8"
                              title="View Exam"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {exam.status === 'draft' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => onEditExam(exam.id)} 
                                className="h-8 w-8"
                                title="Edit Exam"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDuplicate(exam)} disabled={duplicating === exam.id}>
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  {duplicating === exam.id ? 'Duplicating...' : 'Duplicate'}
                                </DropdownMenuItem>
                                {exam.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                                    <Send className="mr-2 h-3.5 w-3.5" /> Submit for Approval
                                  </DropdownMenuItem>
                                )}
                                {exam.status === 'published' && (
                                  <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                                    <Calculator className="mr-2 h-3.5 w-3.5" /> Enter Scores
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(exam)}>
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-md w-full mx-3 sm:mx-4 shadow-2xl">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Exam</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 sm:mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">{examToDelete?.title}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
                className="h-8 sm:h-9 text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                className="bg-red-600 hover:bg-red-700 h-8 sm:h-9 text-sm"
              >
                Delete Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}