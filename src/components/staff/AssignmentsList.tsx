/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/AssignmentsList.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Clock, Calendar, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

interface Assignment {
  id: string
  title: string
  subject: string
  class: string
  description: string
  due_date: string
  total_marks: number
  status: string
  created_at: string
}

interface AssignmentsListProps {
  assignments: Assignment[]
  onRefresh: () => void
  compact?: boolean
}

export function AssignmentsList({ assignments, onRefresh, compact = false }: AssignmentsListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline">Draft</Badge>
      case 'published': return <Badge className="bg-green-100 text-green-700">Published</Badge>
      case 'closed': return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const displayAssignments = compact ? assignments.slice(0, 3) : assignments

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Assignments
        </CardTitle>
        <CardDescription>{assignments.length} assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAssignments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No assignments yet</p>
        ) : (
          displayAssignments.map((assignment) => (
            <div key={assignment.id} className="p-3 rounded-xl bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{assignment.title}</p>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{assignment.subject} • {assignment.class}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date'}</span>
                    <span>{assignment.total_marks} marks</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                    <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}