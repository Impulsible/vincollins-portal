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
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'published': return 'bg-blue-100 text-blue-700'
      case 'closed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
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
        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No assignments</p>
        <Button variant="link" size="sm" onClick={onRefresh} className="mt-2">
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
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className={cn("p-4", compact && "p-3")}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{assignment.title}</h4>
                      <Badge className={cn("text-xs", getStatusColor(assignment.status))}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{assignment.subject} • {assignment.class}</p>
                  </div>
                </div>
                
                {assignment.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{assignment.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "flex items-center gap-1",
                    isOverdue(assignment.due_date) && assignment.status !== 'closed' 
                      ? "text-red-600" 
                      : "text-gray-500"
                  )}>
                    <Clock className="h-3 w-3" />
                    Due: {formatDate(assignment.due_date)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Users className="h-3 w-3" />
                    {assignment.submission_count || 0} submissions
                  </span>
                </div>
                
                {assignment.status === 'published' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Submissions</span>
                      <span className="text-gray-700">
                        {assignment.submission_count || 0}/{assignment.total_marks || 0}
                      </span>
                    </div>
                    <Progress value={submissionRate} className="h-1.5" />
                  </div>
                )}
                
                {assignment.graded_count !== undefined && assignment.graded_count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
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