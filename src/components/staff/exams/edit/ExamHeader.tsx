// src/components/staff/exams/edit/ExamHeader.tsx - WITH DARK MODE
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, Loader2, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface ExamHeaderProps {
  examId: string
  examTitle?: string
  term: string
  termName: string
  sessionYear: string
  saving: boolean
  onSave: () => void
  objectiveTotal?: number
  theoryTotal?: number
  examTotal?: number
  grandTotal?: number
}

export function ExamHeader({
  examId,
  examTitle,
  termName,
  sessionYear,
  saving,
  onSave,
  examTotal,
  grandTotal,
}: ExamHeaderProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          onClick={() => router.push('/staff/exams')}
          aria-label="Go back to exams"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white truncate">
            Edit Exam
          </h1>
          <div className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap text-sm">
            <span className="truncate">{examTitle || 'Untitled Exam'}</span>
            <Badge variant="outline" className="shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <Calendar className="h-3 w-3 mr-1" />
              {termName} {sessionYear}
            </Badge>
            {examTotal !== undefined && examTotal > 0 && (
              <Badge variant="outline" className="shrink-0 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400">
                {examTotal} marks
              </Badge>
            )}
            {grandTotal !== undefined && grandTotal > 0 && (
              <Badge variant="outline" className="shrink-0 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400">
                Grand: {grandTotal}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={() => router.push(`/staff/exams/${examId}`)}
          className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-sm"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </motion.div>
  )
}