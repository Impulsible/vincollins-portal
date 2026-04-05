/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/exams/ExamCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, FileText, Trophy, FileQuestion, Send, Activity, BarChart3 } from 'lucide-react'

interface ExamCardProps {
  exam: any
  onAddQuestions: (exam: any) => void
  onPublish: (exam: any) => void
  onMonitor: (exam: any) => void
  onResults: (exam: any) => void
}

export function ExamCard({ exam, onAddQuestions, onPublish, onMonitor, onResults }: ExamCardProps) {
  const getStatusColor = () => {
    switch (exam.status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'ongoing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{exam.title}</CardTitle>
            <CardDescription>{exam.subject} - {exam.class}</CardDescription>
          </div>
          <Badge className={getStatusColor()}>{exam.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{new Date(exam.date).toLocaleDateString()}</span>
            <Clock className="h-4 w-4 text-gray-400 ml-2" />
            <span>{exam.duration} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>{exam.total_questions} questions</span>
            <Trophy className="h-4 w-4 text-gray-400 ml-2" />
            <span>{exam.total_marks} marks</span>
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-0 flex gap-2">
        {exam.status === 'draft' && (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onAddQuestions(exam)}>
              <FileQuestion className="mr-2 h-4 w-4" /> Questions
            </Button>
            <Button size="sm" className="flex-1" onClick={() => onPublish(exam)}>
              <Send className="mr-2 h-4 w-4" /> Publish
            </Button>
          </>
        )}
        {exam.status === 'published' && (
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onMonitor(exam)}>
            <Activity className="mr-2 h-4 w-4" /> Monitor
          </Button>
        )}
        {(exam.status === 'completed' || exam.status === 'grading') && (
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onResults(exam)}>
            <BarChart3 className="mr-2 h-4 w-4" /> Results
          </Button>
        )}
      </CardContent>
    </Card>
  )
}