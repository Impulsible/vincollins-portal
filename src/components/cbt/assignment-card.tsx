/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'submitted' | 'graded'
  subject: string
}

interface AssignmentCardProps {
  assignment: Assignment
  onView?: (id: string) => void
}

export function AssignmentCard({ assignment, onView }: AssignmentCardProps) {
  const getStatusColor = () => {
    switch (assignment.status) {
      case 'submitted':
        return 'bg-green-100 text-green-700'
      case 'graded':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getStatusText = () => {
    switch (assignment.status) {
      case 'submitted':
        return 'Submitted'
      case 'graded':
        return 'Graded'
      default:
        return 'Pending'
    }
  }

  const isOverdue = new Date(assignment.due_date) < new Date() && assignment.status === 'pending'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{assignment.title}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">{assignment.subject}</p>
          </div>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
            {isOverdue && <span className="text-red-500">Overdue</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(assignment.id)}
            className="text-primary"
          >
            View
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}