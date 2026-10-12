// components/staff/AssignmentsList.tsx - DARK MODE
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Clock, Users, FileText, RefreshCw, CheckCircle } from 'lucide-react'
import { Assignment } from '@/lib/staff/types'
import { cn } from '@/lib/utils'

interface AssignmentsListProps {
  assignments: Assignment[]
  onRefresh: () => void
  compact?: boolean
}

export function AssignmentsList({ assignments, onRefresh, compact = false }: AssignmentsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-0'
      case 'published': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-0'
      case 'closed': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-0'
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-0'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-slate-400 text-sm">No assignments</p>
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
    <div className="space-y-3">
      {assignments.map((assignment) => {
        const submissionRate = assignment.submission_count 
          ? (assignment.submission_count / (assignment.total_marks || 30)) * 100 
          : 0
        
        return (
          <Card 
            key={assignment.id} 
            className="hover:shadow-md dark:hover:shadow-slate-950/50 transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <CardContent className={cn("p-4", compact && "p-3")}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {assignment.title}
                      </h4>
                      <Badge className={cn("text-xs", getStatusColor(assignment.status))}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {assignment.subject} • {assignment.class}
                    </p>
                  </div>
                </div>
                
                {assignment.description && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                    {assignment.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "flex items-center gap-1",
                    isOverdue(assignment.due_date) && assignment.status !== 'closed' 
                      ? "text-red-600 dark:text-red-400" 
                      : "text-gray-500 dark:text-slate-400"
                  )}>
                    <Clock className="h-3 w-3" />
                    Due: {formatDate(assignment.due_date)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                    <Users className="h-3 w-3" />
                    {assignment.submission_count || 0} submissions
                  </span>
                </div>
                
                {assignment.status === 'published' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-slate-400">Submissions</span>
                      <span className="text-gray-700 dark:text-slate-300">
                        {assignment.submission_count || 0}/{assignment.total_marks || 0}
                      </span>
                    </div>
                    <Progress 
                      value={submissionRate} 
                      className="h-1.5 bg-slate-100 dark:bg-slate-800" 
                    />
                  </div>
                )}
                
                {assignment.graded_count !== undefined && assignment.graded_count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    {assignment.graded_count} graded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}