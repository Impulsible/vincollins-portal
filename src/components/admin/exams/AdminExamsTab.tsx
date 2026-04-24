// components/admin/exams/AdminExamsTab.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PendingExam {
  id: string; title: string; subject: string; class: string;
  duration: number; total_questions: number; total_marks: number;
  has_theory: boolean; passing_percentage: number;
  teacher_name: string; department: string; created_at: string;
}

interface AdminExamsTabProps {
  pendingExams: PendingExam[]
  publishedExams: any[]
  pendingExamsCount: number
  onApprove: (exam: PendingExam) => Promise<void>
  onReject: (exam: PendingExam, reason: string) => Promise<void>
  onRefresh: () => void
  refreshing: boolean
}

export function AdminExamsTab({
  pendingExams, publishedExams, pendingExamsCount,
  onApprove, onReject, onRefresh, refreshing
}: AdminExamsTabProps) {
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const handleApprove = async (exam: PendingExam) => {
    if (!confirm(`Approve "${exam.title}"?\n\nPublish to ${exam.class} students?`)) return
    setApprovingId(exam.id)
    try {
      await onApprove(exam)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (exam: PendingExam) => {
    const reason = prompt('Reason for rejection (will be sent to teacher):')
    if (!reason) return
    try {
      await onReject(exam, reason)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Exam Approvals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            {pendingExamsCount} pending • {publishedExams.length} published
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" disabled={refreshing}>
          <Loader2 className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh
        </Button>
      </div>

      {/* Pending Exams */}
      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Pending Approval ({pendingExamsCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingExams.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-muted-foreground">All caught up! No pending exams.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingExams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{exam.title}</h3>
                        <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Subject:</span><p className="font-medium">{exam.subject}</p></div>
                        <div><span className="text-muted-foreground">Class:</span><p className="font-medium">{exam.class}</p></div>
                        <div><span className="text-muted-foreground">Teacher:</span><p className="font-medium">{exam.teacher_name}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 text-xs">
                        <Badge variant="outline">{exam.total_questions} questions</Badge>
                        <Badge variant="outline">{exam.total_marks} marks</Badge>
                        <Badge variant="outline">{exam.duration} mins</Badge>
                        <Badge variant="outline">Pass: {exam.passing_percentage}%</Badge>
                        {exam.has_theory && <Badge variant="secondary">Theory</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted: {new Date(exam.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2 self-end sm:self-center">
                      <Button onClick={() => handleApprove(exam)} className="bg-emerald-600 hover:bg-emerald-700" size="sm" disabled={approvingId === exam.id}>
                        {approvingId === exam.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}Approve
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" size="sm" onClick={() => handleReject(exam)}>
                        <XCircle className="h-4 w-4 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Published Exams */}
      {publishedExams.length > 0 && (
        <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Published Exams ({publishedExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {publishedExams.map((exam: any) => (
                <div key={exam.id} className="flex justify-between items-center p-4 border rounded-lg bg-emerald-50/50">
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-muted-foreground">{exam.subject} • {exam.class} • {exam.teacher_name}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">Published</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}