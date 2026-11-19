// src/components/staff/exams/edit/QuestionPreviewModal.tsx - WITH TABLE RENDERING, DIAGRAM LIGHTBOX & DARK MODE
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  AlertCircle,
  Brain,
  Calculator,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionContent } from '@/components/shared/QuestionContent'

interface QuestionPreviewModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  index: number
  type?: 'objective' | 'theory'
  defaultMark?: number
  totalTheoryMarks?: number
  examTotal?: number
}

export function QuestionPreviewModal({
  question,
  open,
  onOpenChange,
  index,
  type = 'objective',
  defaultMark = 0.5,
  totalTheoryMarks = 0,
  examTotal = 60,
}: QuestionPreviewModalProps) {
  if (!question) return null

  const isObjective = type === 'objective' || question.type === 'objective'
  const isTheory = type === 'theory' || question.type === 'theory'
  const isDraft = question.is_draft === true

  const isComplete = isObjective
    ? question.correct_answer && question.options?.some((opt: string) => opt.trim())
    : question.question_text?.trim()

  const questionMarks = question.points !== undefined ? question.points : isObjective ? defaultMark : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Question {index} Preview
            </DialogTitle>
            <Badge
              className={cn(
                'border-0 font-medium',
                isObjective
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              )}
            >
              {isObjective ? 'Objective' : 'Theory'}
            </Badge>
            {isDraft ? (
              <Badge
                variant="outline"
                className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
              >
                📝 Draft
              </Badge>
            ) : isComplete ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                ✅ Complete
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-500 dark:text-amber-400 border-amber-300 dark:border-amber-800"
              >
                ⚠️ Incomplete
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0 font-semibold">
              {questionMarks} mark{questionMarks !== 1 ? 's' : ''}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* COMPREHENSION PASSAGE IF APPLICABLE */}
          {question.comprehension_passage && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                Comprehension Passage / Context
              </div>
              <QuestionContent text={question.comprehension_passage} />
            </div>
          )}

          {/* MAIN QUESTION TEXT & DIAGRAM */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <span className="font-bold text-blue-600 dark:text-blue-400 text-base leading-none pt-1">
                {index}.
              </span>
              <div className="flex-1">
                <QuestionContent
                  text={question.question_text || '_No question text provided_'}
                  imageUrl={question.image_url || undefined}
                  imageCaption={question.image_caption || undefined}
                />
              </div>
            </div>
          </div>

          {/* OBJECTIVE OPTIONS */}
          {isObjective && question.options && question.options.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Options:
                </p>
                <Badge
                  variant="outline"
                  className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  {questionMarks} mark{questionMarks !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt: string, idx: number) => {
                  const isCorrect = opt === question.correct_answer && opt.trim() !== ''
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-lg border text-sm transition-all',
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-medium'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0',
                          isCorrect
                            ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 truncate">
                        {opt || <span className="text-slate-400 italic">Empty option</span>}
                      </span>
                      {isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>

              {question.correct_answer && (
                <div className="flex items-center gap-2 mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Correct Answer: <span className="font-bold underline">{question.correct_answer}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* THEORY SUB-QUESTIONS */}
          {isTheory && question.sub_questions && question.sub_questions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                  Sub-questions
                </p>
                <Badge
                  variant="outline"
                  className="text-[10px] text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                >
                  Section Total: {questionMarks} marks
                </Badge>
              </div>
              <div className="space-y-2.5">
                {question.sub_questions.map((sq: any, sqIdx: number) => (
                  <div
                    key={sq.id || sqIdx}
                    className="border-l-2 border-purple-400 dark:border-purple-600 bg-slate-50/60 dark:bg-slate-900/60 pl-3.5 pr-3 py-2.5 rounded-r-lg space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                          ({String.fromCharCode(97 + sqIdx)})
                        </span>
                        <div className="flex-1">
                          <QuestionContent
                            text={sq.question_text || sq.text || '_No sub-question text_'}
                            imageUrl={sq.image_url || undefined}
                          />
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shrink-0 border border-purple-200 dark:border-purple-800/40"
                      >
                        {sq.points || 0} marks
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* THEORY MODEL ANSWER */}
          {isTheory && question.model_answer && (
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Model Answer / Marking Scheme:
              </p>
              <QuestionContent text={question.model_answer} />
            </div>
          )}

          {/* KEYWORDS */}
          {question.keywords && question.keywords.length > 0 && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Grading Keywords:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {question.keywords.map((k: string) => (
                  <Badge
                    key={k}
                    variant="outline"
                    className="text-xs bg-white dark:bg-slate-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                  >
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* MARK SUMMARY */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Marking Overview
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="text-center p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                  This Question
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {questionMarks} marks
                </p>
              </div>
              {isTheory && totalTheoryMarks > 0 && (
                <div className="text-center p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                    Theory Total
                  </p>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                    {totalTheoryMarks} marks
                  </p>
                </div>
              )}
              <div className="text-center p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                  Exam Total
                </p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {examTotal} marks
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}