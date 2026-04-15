/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/PendingExamsList.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  CheckCircle, XCircle, Eye, Clock, BookOpen, Brain, Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface PendingExam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  has_theory: boolean
  questions: any[]
  theory_questions: any[]
  instructions: string
  passing_percentage: number
  teacher_name: string
  department: string
  created_at: string
  created_by: string // ✅ Added created_by property
}

interface PendingExamsListProps {
  exams: PendingExam[]
  onRefresh: () => void
}

export function PendingExamsList({ exams, onRefresh }: PendingExamsListProps) {
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [publishSettings, setPublishSettings] = useState({
    starts_at: '',
    ends_at: '',
    proctoring_enabled: true,
    face_detection_required: true,
    fullscreen_required: true,
    tab_switch_limit: 2,
    randomize_questions: true,
    randomize_options: true
  })
  const [reviewNotes, setReviewNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!selectedExam) return
    if (!publishSettings.starts_at || !publishSettings.ends_at) {
      toast.error('Please set start and end times')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'published',
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: (await supabase.auth.getUser()).data.user?.id,
          starts_at: publishSettings.starts_at,
          ends_at: publishSettings.ends_at,
          proctoring_enabled: publishSettings.proctoring_enabled,
          face_detection_required: publishSettings.face_detection_required,
          fullscreen_required: publishSettings.fullscreen_required,
          tab_switch_limit: publishSettings.tab_switch_limit,
          randomize_questions: publishSettings.randomize_questions,
          randomize_options: publishSettings.randomize_options,
          review_notes: reviewNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedExam.id)

      if (error) throw error

      // Create notification for teacher - only if created_by exists
      if (selectedExam.created_by) {
        await supabase.from('notifications').insert({
          user_id: selectedExam.created_by,
          title: 'Exam Approved!',
          message: `Your exam "${selectedExam.title}" has been approved and published.`,
          type: 'exam_approved',
          read: false
        })
      }

      toast.success('Exam approved and published!')
      setShowReviewDialog(false)
      setSelectedExam(null)
      setReviewNotes('')
      setPublishSettings({
        starts_at: '',
        ends_at: '',
        proctoring_enabled: true,
        face_detection_required: true,
        fullscreen_required: true,
        tab_switch_limit: 2,
        randomize_questions: true,
        randomize_options: true
      })
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve exam')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedExam || !reviewNotes) {
      toast.error('Please provide review notes')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'rejected',
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedExam.id)

      if (error) throw error

      // Create notification for teacher - only if created_by exists
      if (selectedExam.created_by) {
        await supabase.from('notifications').insert({
          user_id: selectedExam.created_by,
          title: 'Exam Needs Revision',
          message: `Your exam "${selectedExam.title}" needs revision. Review notes: ${reviewNotes}`,
          type: 'exam_rejected',
          read: false
        })
      }

      toast.success('Exam rejected with feedback')
      setShowReviewDialog(false)
      setSelectedExam(null)
      setReviewNotes('')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject exam')
    } finally {
      setLoading(false)
    }
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No pending exams</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{exam.title}</h3>
                    {exam.has_theory && (
                      <Badge variant="secondary">
                        <Brain className="mr-1 h-3 w-3" /> Theory
                      </Badge>
                    )}
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Clock className="mr-1 h-3 w-3" /> Pending
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{exam.subject} • {exam.class}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{exam.total_questions} questions</span>
                    <span>{exam.total_marks} marks</span>
                    <span>{exam.duration} mins</span>
                    <span>Passing: {exam.passing_percentage}%</span>
                  </div>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Teacher:</span> {exam.teacher_name} ({exam.department})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {format(new Date(exam.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedExam(exam)
                      setShowReviewDialog(true)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" /> Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Exam</DialogTitle>
            <DialogDescription>
              Review the exam details and set publishing options.
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4 py-4">
              {/* Exam Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold">{selectedExam.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedExam.subject} • {selectedExam.class}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <span>Questions: {selectedExam.total_questions}</span>
                  <span>Marks: {selectedExam.total_marks}</span>
                  <span>Duration: {selectedExam.duration} mins</span>
                  <span>Passing: {selectedExam.passing_percentage}%</span>
                </div>
              </div>

              {/* Questions Preview */}
              <div>
                <Label>Objective Questions ({selectedExam.questions?.length || 0})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
                  {selectedExam.questions?.slice(0, 3).map((q, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                      {i + 1}. {q.question}
                    </div>
                  ))}
                  {selectedExam.questions?.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{selectedExam.questions.length - 3} more</p>
                  )}
                </div>
              </div>

              {selectedExam.has_theory && (
                <div>
                  <Label>Theory Questions ({selectedExam.theory_questions?.length || 0})</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
                    {selectedExam.theory_questions?.slice(0, 2).map((q, i) => (
                      <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                        {i + 1}. {q.question} ({q.marks} marks)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publishing Settings */}
              <div className="space-y-4">
                <Label>Publishing Settings</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={publishSettings.starts_at}
                      onChange={(e) => setPublishSettings({ ...publishSettings, starts_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={publishSettings.ends_at}
                      onChange={(e) => setPublishSettings({ ...publishSettings, ends_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Enable Proctoring</Label>
                    <Switch
                      checked={publishSettings.proctoring_enabled}
                      onCheckedChange={(v) => setPublishSettings({ ...publishSettings, proctoring_enabled: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Face Detection</Label>
                    <Switch
                      checked={publishSettings.face_detection_required}
                      onCheckedChange={(v) => setPublishSettings({ ...publishSettings, face_detection_required: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Fullscreen</Label>
                    <Switch
                      checked={publishSettings.fullscreen_required}
                      onCheckedChange={(v) => setPublishSettings({ ...publishSettings, fullscreen_required: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Randomize Questions</Label>
                    <Switch
                      checked={publishSettings.randomize_questions}
                      onCheckedChange={(v) => setPublishSettings({ ...publishSettings, randomize_questions: v })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Tab Switch Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={publishSettings.tab_switch_limit}
                    onChange={(e) => setPublishSettings({ ...publishSettings, tab_switch_limit: parseInt(e.target.value) || 2 })}
                  />
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <Label>Review Notes (Required for rejection)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes or feedback..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !reviewNotes}>
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}