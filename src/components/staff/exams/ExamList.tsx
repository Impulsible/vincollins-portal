'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle, Search } from 'lucide-react'
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
import {
  FileText,
  Eye,
  Edit,
  MoreVertical,
  Copy,
  Send,
  Trash2,
  Clock,
  Calculator
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
    case 'draft':
      return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Draft</Badge>
    default:
      return <Badge>{status}</Badge>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            My Exams
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Create, manage, and track your examinations
          </p>
        </div>
        <Button
          onClick={onCreateExam}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Exams</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalExams}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Drafts</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Published</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{publishedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search exams by title, subject, or class..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 h-11"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={onStatusFilterChange} className="w-full lg:w-auto">
          <TabsList className="grid grid-cols-4 w-full min-w-[320px] h-11">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">All Exams</CardTitle>
              <CardDescription className="mt-1">
                {exams.length} exam{exams.length !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {exams.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No exams found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try adjusting your search or create a new exam
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((exam) => (
                  <div key={exam.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {exam.title || 'Untitled'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {exam.subject || '—'} • {exam.class || '—'}
                        </p>
                      </div>
                      {getStatusBadge(exam.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {exam.duration || 60} min
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {exam.total_questions || 0} Qs • {exam.total_marks || 0} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDate(exam.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewExam(exam.id)} className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {exam.status === 'draft' && (
                          <Button variant="ghost" size="icon" onClick={() => onEditExam(exam.id)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDuplicate(exam)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {exam.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                                <Send className="mr-2 h-4 w-4" /> Submit
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'published' && (
                              <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                                <Calculator className="mr-2 h-4 w-4" /> Scores
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(exam)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <Table className="hidden lg:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium">{exam.title || 'Untitled'}</TableCell>
                      <TableCell>{exam.subject || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.class || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{exam.total_questions || 0}</TableCell>
                      <TableCell className="text-center">{exam.total_marks || 0}</TableCell>
                      <TableCell className="text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />{exam.duration || 60}m
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(exam.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onViewExam(exam.id)} className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {exam.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => onEditExam(exam.id)} className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDuplicate(exam)} disabled={duplicating === exam.id}>
                                <Copy className="mr-2 h-4 w-4" />
                                {duplicating === exam.id ? 'Duplicating...' : 'Duplicate'}
                              </DropdownMenuItem>
                              {exam.status === 'draft' && (
                                <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                                  <Send className="mr-2 h-4 w-4" /> Submit for Approval
                                </DropdownMenuItem>
                              )}
                              {exam.status === 'published' && (
                                <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                                  <Calculator className="mr-2 h-4 w-4" /> Enter Scores
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(exam)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog - Simple inline version */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Exam</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold">{examToDelete?.title}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}