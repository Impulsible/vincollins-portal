// src/components/student/exam/question/QuestionCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Flag, Hash, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/app/student/exam/[id]/utils/scoring'
import { ObjectiveAnswer } from '../answers/ObjectiveAnswer'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import { TextAnswer } from '../answers/TextAnswer'
import type { Question } from '@/app/student/exam/[id]/types'

interface QuestionCardProps {
  question: Question
  questionIndex: number
  answer: string
  isFlagged: boolean
  examId: string
  studentId?: string
  onAnswer: (value: string) => void
  onToggleFlag: () => void
}

export function QuestionCard({
  question, questionIndex, answer, isFlagged,
  examId, studentId, onAnswer, onToggleFlag,
}: QuestionCardProps) {
  const questionType = question.type || 'objective'
  const isTheory = questionType === 'theory'
  
  // Use order_number for display, fallback to questionIndex + 1
  const displayNumber = question.order_number || (questionIndex + 1)

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
      {/* Question Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            isTheory ? "bg-purple-100" : "bg-blue-100"
          )}>
            {isTheory ? (
              <FileText className="h-4 w-4 text-purple-600" />
            ) : (
              <Hash className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <span className="font-semibold text-slate-700 text-sm">
            {isTheory ? 'Theory ' : 'Question '}{displayNumber}
          </span>
          <Badge variant="outline" className={cn(
            "text-xs font-medium",
            isTheory 
              ? "bg-purple-50 text-purple-600 border-purple-200"
              : "bg-blue-50 text-blue-600 border-blue-200"
          )}>
            {isTheory ? 'Theory' : 'Objective'}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
            <Award className="h-4 w-4" />
            <span className="font-medium">{formatPoints(question.points || 1)}</span>
          </div>
          <button
            onClick={onToggleFlag}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isFlagged 
                ? "bg-amber-100 text-amber-600" 
                : "hover:bg-slate-100 text-slate-400"
            )}
          >
            <Flag className="h-4 w-4" fill={isFlagged ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6">
        {/* Question Text */}
        <div className={cn(
          "rounded-xl p-5 mb-5 border",
          isTheory ? "bg-purple-50 border-purple-100" : "bg-slate-50 border-slate-100"
        )}>
          <p className="text-slate-700 leading-relaxed text-base">
            {question.question_text || question.question}
          </p>
        </div>

        {/* Answer - key forces re-render on question change */}
        {isTheory ? (
          <TheoryAnswer 
            key={question.id}
            answer={answer} 
            onChange={onAnswer} 
            examId={examId} 
            studentId={studentId} 
          />
        ) : question.options && question.options.length > 0 ? (
          <ObjectiveAnswer 
            options={question.options} 
            selectedValue={answer} 
            onChange={onAnswer} 
          />
        ) : (
          <TextAnswer 
            answer={answer} 
            onChange={onAnswer} 
          />
        )}
      </CardContent>
    </Card>
  )
}