// components/admin/exams/AdminExamsTab.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, CheckCircle, XCircle, Clock, Shield, 
  RefreshCw, FileText, GraduationCap, BookOpen, 
  Timer, Target, Hash, User, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PendingExam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  has_theory: boolean
  passing_percentage: number
  teacher_name: string
  department: string
  created_at: string
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
  pendingExams, 
  publishedExams, 
  pendingExamsCount,
  onApprove, 
  onReject, 
  onRefresh, 
  refreshing
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
    <motion.div 
      key="exams" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 sm:space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center shadow-inner">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Exam Approvals
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-medium text-amber-600 dark:text-amber-500">{pendingExamsCount} pending</span> • {publishedExams.length} published
            </p>
          </div>
        </div>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-full sm:w-auto shadow-sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Pending Exams Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pending Review</h3>
          {pendingExamsCount > 0 && (
            <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-0 text-xs">
              {pendingExamsCount}
            </Badge>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {pendingExams.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border border-dashed border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    All caught up!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    There are no pending exams awaiting your approval at this time.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingExams.map((exam, idx) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md border border-amber-200/60 dark:border-amber-900/50 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 dark:bg-amber-600" />
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                              {exam.title}
                            </h3>
                            <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-0 hover:bg-amber-100 dark:hover:bg-amber-950/50">
                              Pending
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 mb-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              {exam.subject}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                              {exam.class}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {exam.teacher_name}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                              <Hash className="h-3 w-3 mr-1" /> {exam.total_questions} Questions
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                              <Target className="h-3 w-3 mr-1" /> {exam.total_marks} Marks
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                              <Timer className="h-3 w-3 mr-1" /> {exam.duration} mins
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                              Pass: {exam.passing_percentage}%
                            </Badge>
                            {exam.has_theory && (
                              <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium">
                                Has Theory
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 mt-2 lg:mt-0">
                          <Button 
                            onClick={() => handleApprove(exam)} 
                            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white w-full lg:w-32 h-9 sm:h-10 text-xs sm:text-sm"
                            disabled={approvingId === exam.id}
                          >
                            {approvingId === exam.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                            )}
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleReject(exam)}
                            className="border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full lg:w-32 h-9 sm:h-10 text-xs sm:text-sm"
                            disabled={approvingId === exam.id}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      <div className="absolute top-4 right-5 hidden sm:block text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                        Submitted: {new Date(exam.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Published Exams Section */}
      {publishedExams.length > 0 && (
        <div className="pt-2 sm:pt-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recently Published</h3>
            <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-0 text-xs">
              {publishedExams.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {publishedExams.slice(0, 10).map((exam: any) => (
              <Card key={exam.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate mb-1">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                      <span>{exam.subject}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>{exam.class}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:inline-block" />
                      <span className="hidden sm:inline-block truncate">{exam.teacher_name}</span>
                    </p>
                  </div>
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-none pointer-events-none text-[10px] sm:text-xs">
                    Published
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          {publishedExams.length > 10 && (
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
              Showing 10 most recent published exams
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}