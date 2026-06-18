// src/components/staff/exams/edit/QuestionPreviewModal.tsx - UPDATED

'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, X, CheckCircle2, AlertCircle, BookOpen, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionPreviewModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  index: number
  type?: 'objective' | 'theory'
}

export function QuestionPreviewModal({ 
  question, 
  open, 
  onOpenChange, 
  index,
  type = 'objective'
}: QuestionPreviewModalProps) {
  const isObjective = type === 'objective' || question.type === 'objective'
  const isTheory = type === 'theory' || question.type === 'theory'
  const isDraft = question.is_draft === true
  
  // Determine if question is complete
  const isComplete = isObjective 
    ? question.correct_answer && question.options?.some((opt: string) => opt.trim())
    : question.question_text?.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">
              Question {index} Preview
            </DialogTitle>
            <Badge variant={isObjective ? 'default' : 'secondary'}>
              {isObjective ? 'Objective' : 'Theory'}
            </Badge>
            {isDraft ? (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                📝 Draft
              </Badge>
            ) : isComplete ? (
              <Badge className="bg-emerald-100 text-emerald-700">
                ✅ Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-500 border-amber-300">
                ⚠️ Incomplete
              </Badge>
            )}
          </div>
          <Badge className="bg-purple-100 text-purple-700">
            {question.points || 0} marks
          </Badge>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          {/* Question Text */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600">{index}.</span>
              <div className="prose prose-sm max-w-none">
                {question.question_text ? (
                  <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
                ) : (
                  <p className="text-slate-500 italic">No question text</p>
                )}
              </div>
            </div>
          </div>

          {/* Objective Question Options */}
          {isObjective && question.options && question.options.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-600">Options:</p>
              <div className="space-y-1.5">
                {question.options.map((opt: string, idx: number) => {
                  const isCorrect = opt === question.correct_answer
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-sm",
                        isCorrect 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <span className="font-medium text-slate-500 min-w-[24px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className={isCorrect ? "text-emerald-700 dark:text-emerald-400" : ""}>
                        {opt || <span className="text-slate-400 italic">Empty option</span>}
                      </span>
                      {isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                      )}
                    </div>
                  )
                })}
              </div>
              {question.correct_answer && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Correct Answer: {question.correct_answer}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Theory Question Sub-questions */}
          {isTheory && question.sub_questions && question.sub_questions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Sub-questions:
              </p>
              <div className="space-y-2 ml-2">
                {question.sub_questions.map((sq: any, sqIdx: number) => (
                  <div key={sq.id || sqIdx} className="border-l-2 border-purple-200 pl-4 py-1">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-purple-600 text-sm">
                        {String.fromCharCode(97 + sqIdx)}.
                      </span>
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: sq.text || 'No sub-question text' }} />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      [{sq.points || 0} marks]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Theory Model Answer */}
          {isTheory && question.model_answer && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-green-800 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Model Answer:
              </p>
              <div className="text-sm mt-1 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: question.model_answer }} />
              </div>
            </div>
          )}

          {/* Keywords */}
          {question.keywords && question.keywords.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Grading Keywords:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {question.keywords.map((k: string) => (
                  <Badge key={k} variant="outline" className="text-xs bg-white dark:bg-slate-900">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Image */}
          {question.image_url && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-600 mb-1">Diagram/Image:</p>
              <div className="border rounded-lg p-2 bg-white dark:bg-slate-900">
                <img 
                  src={question.image_url} 
                  alt={question.image_caption || 'Question diagram'} 
                  className="max-w-full max-h-[200px] mx-auto object-contain"
                />
                {question.image_caption && (
                  <p className="text-xs text-center text-slate-500 mt-1">{question.image_caption}</p>
                )}
              </div>
            </div>
          )}

          {/* Draft Warning */}
          {isDraft && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                This question is a draft. Complete it before publishing the exam.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}