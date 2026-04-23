'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  Calculator,
  Loader2
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

interface ExamTableProps {
  exams: Exam[]
  onViewExam: (id: string) => void
  onEditExam: (id: string) => void
  onDeleteExam: (id: string) => void
  onDuplicateExam: (id: string) => Promise<void>
  onSubmitForApproval: (id: string) => void
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending Approval</Badge>
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

export function ExamTable({
  exams,
  onViewExam,
  onEditExam,
  onDeleteExam,
  onDuplicateExam,
  onSubmitForApproval
}: ExamTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

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

  if (exams.length === 0) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="py-12 sm:py-16 md:py-20">
          <div className="text-center px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No exams found
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Try adjusting your search or create a new exam
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-xl overflow-hidden">
        {/* Header with proper responsive spacing - brought down */}
        <CardHeader className="pb-3 pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg md:text-xl text-slate-900 dark:text-white">
                All Exams
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">
                {exams.length} exam{exams.length !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Mobile Card View (xs to md) */}
          <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {exams.map((exam) => (
              <div key={exam.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm sm:text-base truncate">
                      {exam.title || 'Untitled'}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {exam.subject || '—'} • {exam.class || '—'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(exam.status)}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {exam.duration || 60} min
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    {exam.total_questions || 0} Qs • {exam.total_marks || 0} pts
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(exam.created_at)}
                  </span>
                </div>
                
                <div className="flex items-center justify-end gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewExam(exam.id)}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {exam.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditExam(exam.id)}
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDuplicate(exam)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {exam.status === 'draft' && (
                        <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Submit for Approval
                        </DropdownMenuItem>
                      )}
                      {exam.status === 'published' && (
                        <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                          <Calculator className="mr-2 h-4 w-4" />
                          Enter Scores
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(exam)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet View (md to lg) */}
          <div className="hidden lg:hidden xl:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="font-semibold py-3 px-4">Title</TableHead>
                  <TableHead className="font-semibold px-4">Subject</TableHead>
                  <TableHead className="font-semibold px-4">Class</TableHead>
                  <TableHead className="font-semibold text-center px-4">Questions</TableHead>
                  <TableHead className="font-semibold text-center px-4">Marks</TableHead>
                  <TableHead className="font-semibold text-center px-4">Duration</TableHead>
                  <TableHead className="font-semibold px-4">Status</TableHead>
                  <TableHead className="font-semibold text-right px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium py-3 px-4">
                      <div>
                        <p className="truncate max-w-[200px]">{exam.title || 'Untitled'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(exam.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">{exam.subject || '—'}</TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className="font-normal">{exam.class || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <span className="font-medium">{exam.total_questions || 0}</span>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <span className="font-medium">{exam.total_marks || 0}</span>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {exam.duration || 60}m
                      </span>
                    </TableCell>
                    <TableCell className="px-4">{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewExam(exam.id)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleDuplicate(exam)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {exam.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Submit for Approval
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(exam)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

          {/* Desktop Full Table View (xl and above) */}
          <div className="hidden xl:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="font-semibold py-4 px-6">Title</TableHead>
                  <TableHead className="font-semibold px-6">Subject</TableHead>
                  <TableHead className="font-semibold px-6">Class</TableHead>
                  <TableHead className="font-semibold text-center px-6">Questions</TableHead>
                  <TableHead className="font-semibold text-center px-6">Marks</TableHead>
                  <TableHead className="font-semibold text-center px-6">Duration</TableHead>
                  <TableHead className="font-semibold px-6">Status</TableHead>
                  <TableHead className="font-semibold px-6">Created</TableHead>
                  <TableHead className="font-semibold text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium py-4 px-6">
                      {exam.title || 'Untitled'}
                    </TableCell>
                    <TableCell className="px-6">{exam.subject || '—'}</TableCell>
                    <TableCell className="px-6">
                      <Badge variant="outline" className="font-normal">{exam.class || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <span className="font-medium">{exam.total_questions || 0}</span>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <span className="font-medium">{exam.total_marks || 0}</span>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {exam.duration || 60}m
                      </span>
                    </TableCell>
                    <TableCell className="px-6">{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="px-6 text-slate-500 dark:text-slate-400 text-sm">
                      {formatDate(exam.created_at)}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewExam(exam.id)}
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {exam.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditExam(exam.id)}
                            className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(exam)}
                              disabled={duplicating === exam.id}
                              className="cursor-pointer"
                            >
                              {duplicating === exam.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Duplicating...
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </>
                              )}
                            </DropdownMenuItem>
                            {exam.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)} className="cursor-pointer">
                                <Send className="mr-2 h-4 w-4" />
                                Submit for Approval
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'published' && (
                              <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)} className="cursor-pointer">
                                <Calculator className="mr-2 h-4 w-4" />
                                Enter Scores
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => handleDeleteClick(exam)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Responsive */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-4 sm:mx-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Exam</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{examToDelete?.title || 'this exam'}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}