// src/components/staff/exams/edit/PreviewTab.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Brain, Award } from 'lucide-react'
import type { Question, TheoryQuestion, ExamDetailsForm } from './types'

interface PreviewTabProps {
  examDetails: ExamDetailsForm
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
}

export function PreviewTab({
  examDetails,
  questions,
  theoryQuestions,
  hasTheory
}: PreviewTabProps) {
  const totalQuestions = questions.length + (hasTheory ? theoryQuestions.length : 0)
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0) +
    (hasTheory ? theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0) : 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">{examDetails.title || 'Untitled Exam'}</h2>
          <p className="text-slate-500 mb-4">{examDetails.subject} • {examDetails.class}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-slate-500">Questions</p>
              <p className="text-lg font-bold">{totalQuestions}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <Award className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-slate-500">Total Points</p>
              <p className="text-lg font-bold">{totalPoints}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <Brain className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-lg font-bold">{examDetails.duration}m</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline">Pass Mark: {examDetails.pass_mark}%</Badge>
            <Badge variant="outline">Shuffle Q: {examDetails.shuffle_questions ? 'Yes' : 'No'}</Badge>
            <Badge variant="outline">Shuffle Options: {examDetails.shuffle_options ? 'Yes' : 'No'}</Badge>
            {examDetails.negative_marking && (
              <Badge variant="outline">Negative: -{examDetails.negative_marking_value}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Objective Questions ({questions.length})</h3>
          {questions.slice(0, 5).map((q, idx) => (
            <div key={q.id} className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm font-medium">{idx + 1}. {q.question_text}</p>
              <div className="ml-4 mt-1">
                {q.options?.map((opt, oi) => (
                  <p key={oi} className="text-xs text-slate-500">
                    {String.fromCharCode(65 + oi)}. {opt}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {questions.length > 5 && (
            <p className="text-sm text-slate-400">...and {questions.length - 5} more questions</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}