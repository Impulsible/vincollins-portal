'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Users, FileText, RefreshCw, ChevronRight } from 'lucide-react'
import { Exam } from '@/lib/staff/types'
import { cn } from '@/lib/utils'

interface ExamsListProps {
  exams: Exam[]
  onRefresh: () => void
  compact?: boolean
}

export function ExamsList({ exams, onRefresh, compact = false }: ExamsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'ongoing': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'graded': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No exams scheduled</p>
        <Button variant="link" size="sm" onClick={onRefresh} className="mt-2">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <Card key={exam.id} className="hover:shadow-md transition-shadow">
          <CardContent className={cn("p-4", compact && "p-3")}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{exam.title}</h4>
                  <Badge className={cn("text-xs", getStatusColor(exam.status))}>
                    {exam.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{exam.subject} • {exam.class}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(exam.date)} • {exam.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {exam.total_questions || exam.question_count || 0} questions
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}