/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/ExamsList.tsx - UPDATED VERSION
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Eye, Send, Edit, Trash2, MoreVertical, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  has_theory: boolean
  status: string
  created_at: string
}

interface ExamsListProps {
  exams: Exam[]
  onRefresh: () => void
  compact?: boolean
}

export function ExamsList({ exams, onRefresh, compact = false }: ExamsListProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline">Draft</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending Approval</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Approved</Badge>
      case 'published': return <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>
      case 'archived': return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Archived</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSubmitForApproval = async (examId: string, examTitle: string) => {
    setSubmitting(examId)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error

      // Send notification to admin
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: any) => ({
          title: '📝 Exam Pending Approval',
          message: `${examTitle} has been submitted for approval.`,
          type: 'exam_approval',
          user_id: admin.id,
          exam_id: examId,
          read: false,
          action_url: `/admin?tab=exams`,
          created_at: new Date().toISOString()
        }))
        await supabase.from('notifications').insert(notifications)
      }

      toast.success('Exam submitted for approval!')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit exam')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDelete = async () => {
    if (!examToDelete) return
    
    setDeleting(examToDelete)
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete)

      if (error) throw error

      toast.success('Exam deleted successfully!')
      setDeleteDialogOpen(false)
      setExamToDelete(null)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete exam')
    } finally {
      setDeleting(null)
    }
  }

  const confirmDelete = (examId: string) => {
    setExamToDelete(examId)
    setDeleteDialogOpen(true)
  }

  const handleView = (examId: string) => {
    // For now, just show toast - we'll build the view page later
    toast.info('View exam details coming soon!')
    // router.push(`/staff/exams/${examId}`)
  }

  const handleEdit = (examId: string) => {
    // For now, just show toast - we'll build the edit page later
    toast.info('Edit exam coming soon!')
    // router.push(`/staff/exams/${examId}/edit`)
  }

  const handleViewSubmissions = (examId: string) => {
    router.push(`/staff/exams/${examId}/submissions`)
  }

  const handleEnterScores = (examId: string) => {
    router.push(`/staff/exams/${examId}/scores`)
  }

  const displayExams = compact ? exams.slice(0, 5) : exams

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                My Exams
              </CardTitle>
              <CardDescription>
                {exams.length} exam{exams.length !== 1 ? 's' : ''} created
              </CardDescription>
            </div>
            {compact && exams.length > 5 && (
              <Button variant="link" onClick={() => router.push('/staff?tab=exams')}>
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayExams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No exams created yet</p>
          ) : (
            displayExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{exam.title}</p>
                    {exam.has_theory && <Badge variant="secondary" className="text-xs">Theory</Badge>}
                    {getStatusBadge(exam.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{exam.subject} • {exam.class}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration} mins</span>
                    <span>{exam.total_questions} questions</span>
                    <span>{exam.total_marks} marks</span>
                    <span className="text-muted-foreground/70">
                      {formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={submitting === exam.id || deleting === exam.id}>
                      {submitting === exam.id || deleting === exam.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(exam.id)}>
                      <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                    
                    {exam.status === 'draft' && (
                      <>
                        <DropdownMenuItem onClick={() => handleEdit(exam.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSubmitForApproval(exam.id, exam.title)}>
                          <Send className="mr-2 h-4 w-4" /> Submit for Approval
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {exam.status === 'published' && (
                      <>
                        <DropdownMenuItem onClick={() => handleViewSubmissions(exam.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEnterScores(exam.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Enter Scores
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {exam.status !== 'published' && (
                      <DropdownMenuItem 
                        onClick={() => confirmDelete(exam.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The exam and all related data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}