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
  Loader2,
  CheckCircle2
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
      return (
        <Badge className="bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Published
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-0 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case 'draft':
      return (
        <Badge variant="outline" className="border-slate-300 dark:border-slate-700">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      )
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
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 sm:py-12 md:py-16">
          <div className="text-center px-4">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 sm:mb-4">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
              No exams found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search or create a new exam
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">All Exams</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                {exams.length} exam{exams.length !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* ========== MOBILE VIEW (xs to sm) ========== */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {exams.map((exam) => (
              <div key={exam.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      {exam.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {exam.subject || '—'} • {exam.class || '—'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(exam.status)}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="text-slate-500 flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {exam.duration || 60} min
                  </span>
                  <span className="text-slate-500">
                    {exam.total_questions || 0} Qs
                  </span>
                  <span className="text-slate-500">
                    {exam.total_marks || 0} pts
                  </span>
                  <span className="text-slate-400">
                    {formatDate(exam.created_at)}
                  </span>
                </div>
                
                <div className="flex items-center justify-end gap-0.5 pt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewExam(exam.id)}
                    className="h-7 w-7"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {exam.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditExam(exam.id)}
                      className="h-7 w-7"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => handleDuplicate(exam)} disabled={duplicating === exam.id}>
                        {duplicating === exam.id ? (
                          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Duplicating...</>
                        ) : (
                          <><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</>
                        )}
                      </DropdownMenuItem>
                      {exam.status === 'draft' && (
                        <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                          <Send className="mr-2 h-3.5 w-3.5" /> Submit
                        </DropdownMenuItem>
                      )}
                      {exam.status === 'published' && (
                        <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                          <Calculator className="mr-2 h-3.5 w-3.5" /> Scores
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(exam)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {/* ========== TABLET VIEW (sm to lg) ========== */}
          <div className="hidden sm:block lg:hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="text-xs py-3 px-3">Title</TableHead>
                  <TableHead className="text-xs px-3">Subject</TableHead>
                  <TableHead className="text-xs px-3">Class</TableHead>
                  <TableHead className="text-xs text-center px-3">Qs</TableHead>
                  <TableHead className="text-xs text-center px-3">Marks</TableHead>
                  <TableHead className="text-xs px-3">Status</TableHead>
                  <TableHead className="text-xs text-right px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="py-3 px-3">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{exam.title || 'Untitled'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(exam.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm px-3">{exam.subject || '—'}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant="outline" className="text-[10px]">{exam.class || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm px-3">{exam.total_questions || 0}</TableCell>
                    <TableCell className="text-center text-sm px-3">{exam.total_marks || 0}</TableCell>
                    <TableCell className="px-3">{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right px-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewExam(exam.id)} className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleDuplicate(exam)} disabled={duplicating === exam.id}>
                              {duplicating === exam.id ? (
                                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Duplicating...</>
                              ) : (
                                <><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</>
                              )}
                            </DropdownMenuItem>
                            {exam.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSubmitForApproval(exam.id)}>
                                <Send className="mr-2 h-3.5 w-3.5" /> Submit
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'published' && (
                              <DropdownMenuItem onClick={() => router.push(`/staff/exams/${exam.id}/scores`)}>
                                <Calculator className="mr-2 h-3.5 w-3.5" /> Scores
                              </DropdownMenuItem>
                            )}
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

          {/* ========== DESKTOP VIEW (lg and above) ========== */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="text-xs sm:text-sm py-3 px-4">Title</TableHead>
                  <TableHead className="text-xs sm:text-sm px-4">Subject</TableHead>
                  <TableHead className="text-xs sm:text-sm px-4">Class</TableHead>
                  <TableHead className="text-xs sm:text-sm text-center px-4">Questions</TableHead>
                  <TableHead className="text-xs sm:text-sm text-center px-4">Marks</TableHead>
                  <TableHead className="text-xs sm:text-sm text-center px-4">Duration</TableHead>
                  <TableHead className="text-xs sm:text-sm px-4">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm px-4">Created</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">{exam.title || 'Untitled'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm px-4">{exam.subject || '—'}</TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{exam.class || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm px-4">{exam.total_questions || 0}</TableCell>
                    <TableCell className="text-center text-sm px-4">{exam.total_marks || 0}</TableCell>
                    <TableCell className="text-center px-4">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {exam.duration || 60}m
                      </span>
                    </TableCell>
                    <TableCell className="px-4">{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-sm text-slate-500 px-4">{formatDate(exam.created_at)}</TableCell>
                    <TableCell className="text-right px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewExam(exam.id)}
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {exam.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditExam(exam.id)}
                            className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
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
                            <DropdownMenuItem onClick={() => handleDuplicate(exam)} disabled={duplicating === exam.id}>
                              {duplicating === exam.id ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Duplicating...</>
                              ) : (
                                <><Copy className="mr-2 h-4 w-4" /> Duplicate</>
                              )}
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
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDeleteClick(exam)}
                            >
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
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Responsive */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Exam</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{examToDelete?.title || 'this exam'}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-9 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto h-9 text-sm"
            >
              Delete Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}