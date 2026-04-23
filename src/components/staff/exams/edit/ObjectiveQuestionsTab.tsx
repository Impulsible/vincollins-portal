// src/components/staff/exams/edit/ObjectiveQuestionsTab.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'
import type { Question } from './types'

interface ObjectiveQuestionsTabProps {
  questions: Question[]
  onAddQuestion: () => void
  onEditQuestion: (question: Question) => void
  onDeleteQuestion: (questionId: string) => void
}

export function ObjectiveQuestionsTab({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion
}: ObjectiveQuestionsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Objective Questions</CardTitle>
          <CardDescription>{questions.length} questions</CardDescription>
        </div>
        <Button onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No objective questions yet</p>
            <Button variant="link" onClick={onAddQuestion}>Add your first question</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{idx + 1}. {q.question_text}</p>
                    {q.options && (
                      <div className="ml-6 mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-sm">
                            <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className="bg-green-100 text-green-700">Answer: {q.correct_answer}</Badge>
                      <Badge variant="outline">{q.points} point(s)</Badge>
                    </div>
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