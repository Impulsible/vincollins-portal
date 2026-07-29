// src/components/staff/exams/edit/ExamHeader.tsx - NO HARDCODED VALUES

'use client'

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
  // ✅ Optional: for mark summary display
  objectiveTotal?: number
  theoryTotal?: number
  examTotal?: number
  grandTotal?: number
}

export function ExamHeader({
  examId,
  examTitle,
  term,
  termName,
  sessionYear,
  saving,
  onSave,
  objectiveTotal,
  theoryTotal,
  examTotal,
  grandTotal,
}: ExamHeaderProps) {

  const handleBack = () => {
    window.location.href = '/staff/exams'
  }

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
          className="rounded-full shrink-0 hover:bg-slate-100"
          onClick={handleBack}
          aria-label="Go back to exams"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Edit Exam
          </h1>
          <div className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
            <span className="truncate">{examTitle || 'Untitled Exam'}</span>
            <Badge variant="outline" className="shrink-0">
              <Calendar className="h-3 w-3 mr-1" />
              {termName} {sessionYear}
            </Badge>
            {/* ✅ Optional mark summary - all from database */}
            {examTotal !== undefined && examTotal > 0 && (
              <Badge variant="outline" className="shrink-0 bg-emerald-50 border-emerald-200 text-emerald-700">
                {examTotal} marks
              </Badge>
            )}
            {grandTotal !== undefined && grandTotal > 0 && (
              <Badge variant="outline" className="shrink-0 bg-blue-50 border-blue-200 text-blue-700">
                Grand: {grandTotal}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={() => window.location.href = `/staff/exams/${examId}`}
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-primary"
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