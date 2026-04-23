// src/components/staff/exams/edit/TheoryQuestionsTab.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, Brain, AlertCircle } from 'lucide-react'
import type { TheoryQuestion } from './types'

interface TheoryQuestionsTabProps {
  questions: TheoryQuestion[]
  hasTheory: boolean
  onAddQuestion: () => void
  onEditQuestion: (question: TheoryQuestion) => void
  onDeleteQuestion: (questionId: string) => void
}

export function TheoryQuestionsTab({
  questions,
  hasTheory,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion
}: TheoryQuestionsTabProps) {
  if (!hasTheory) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Theory questions are disabled. Enable them in the Details tab.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Theory Questions</CardTitle>
          <CardDescription>{questions.length} questions</CardDescription>
        </div>
        <Button onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" /> Add Theory Question
        </Button>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No theory questions yet</p>
            <Button variant="link" onClick={onAddQuestion}>Add your first theory question</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{idx + 1}. {q.question_text}</p>
                    <Badge className="mt-2 bg-purple-100 text-purple-700">{q.points} points</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEditQuestion(q)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteQuestion(q.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}