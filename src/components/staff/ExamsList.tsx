// components/staff/ExamsList.tsx - COMPLETE WITH AUTO-CALCULATION + DARK MODE
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, FileText, RefreshCw, ChevronRight, Award, BookOpen } from 'lucide-react'
import { Exam } from '@/lib/staff/types'
import { cn } from '@/lib/utils'

interface ExamsListProps {
  exams: Exam[]
  onRefresh: () => void
  compact?: boolean
}

export function ExamsList({ exams, onRefresh, compact = false }: ExamsListProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-0'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-0'
      case 'draft': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0'
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-0'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTotalMarks = (exam: Exam) => exam.total_marks || 0
  const getTotalQuestions = (exam: Exam) => exam.total_questions || 0

  if (exams.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-slate-500 mx-auto mb-2 sm:mb-3" />
        <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base">No exams found</p>
        <Button 
          variant="link" 
          size="sm" 
          onClick={onRefresh} 
          className="mt-2 text-emerald-600 dark:text-emerald-400"
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {exams.map((exam) => (
        <Card 
          key={exam.id} 
          className="hover:shadow-md dark:hover:shadow-slate-950/50 transition-all overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <CardContent className={cn("p-3 sm:p-4", compact && "p-2 sm:p-3")}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {exam.title || 'Untitled Exam'}
                  </h4>
                  <Badge className={cn("text-[10px] sm:text-xs", getStatusColor(exam.status))}>
                    {exam.status || 'Draft'}
                  </Badge>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                  {exam.subject || '—'} • {exam.class || '—'}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {exam.duration || 60} min
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {getTotalQuestions(exam)} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {getTotalMarks(exam)} marks
                  </span>
                  {exam.created_at && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {formatDate(exam.created_at)}
                    </span>
                  )}
                </div>
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500 flex-shrink-0 self-end sm:self-center" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}