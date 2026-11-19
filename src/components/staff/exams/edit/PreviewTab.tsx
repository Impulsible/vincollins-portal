// src/components/staff/exams/edit/PreviewTab.tsx - WITH DARK MODE & TABLE/IMAGE SUPPORT
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QuestionContent } from '@/components/shared/QuestionContent'
import {
  BookOpen,
  Brain,
  Award,
  Clock,
  FileText,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MARK_CONSTANTS } from '../create/constants'
import type { Question, TheoryQuestion, ExamDetailsForm } from './types'

interface PreviewTabProps {
  examDetails: ExamDetailsForm
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
  passageText?: string
  defaultMark?: number
  theoryTotalMarks?: number
}

export function PreviewTab({
  examDetails,
  questions,
  theoryQuestions,
  hasTheory,
  passageText,
  defaultMark,
  theoryTotalMarks,
}: PreviewTabProps) {
  const [showAllObjective, setShowAllObjective] = useState(false)
  const [showAllTheory, setShowAllTheory] = useState(false)

  const EXAM_TOTAL = MARK_CONSTANTS.EXAM_TOTAL
  const CA1_MAX = MARK_CONSTANTS.CA1_MAX
  const CA2_MAX = MARK_CONSTANTS.CA2_MAX
  const CA_TOTAL = MARK_CONSTANTS.CA_TOTAL
  const GRAND_TOTAL = MARK_CONSTANTS.GRAND_TOTAL

  const objectiveCount = questions.length
  const theoryCount = hasTheory ? theoryQuestions.length : 0
  const totalObjectivePoints = objectiveCount * (defaultMark || 0.5)
  const totalTheoryPoints = hasTheory
    ? theoryTotalMarks || theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0)
    : 0
  const totalPoints = totalObjectivePoints + totalTheoryPoints
  const totalQuestions = objectiveCount + theoryCount
  const draftCount =
    questions.filter((q) => q.is_draft).length +
    (hasTheory ? theoryQuestions.filter((q) => q.is_draft).length : 0)
  const completeCount = totalQuestions - draftCount
  const isBalanced = totalPoints === EXAM_TOTAL

  const displayObjective = showAllObjective ? questions : questions.slice(0, 5)
  const displayTheory = showAllTheory ? theoryQuestions : theoryQuestions.slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Passage Preview */}
      {passageText && (
        <Card className="border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                📖 Comprehension Passage
              </span>
            </div>
            <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-3 sm:p-4 border border-amber-200/60 dark:border-amber-900/40">
              <QuestionContent
                text={passageText}
                className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Distribution Summary */}
      <Card className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Mark Distribution Breakdown
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Objective</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalObjectivePoints} marks</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{objectiveCount} × {defaultMark || 0.5} pt</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Theory</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{totalTheoryPoints} marks</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{theoryCount} questions</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Exam</p>
              <p className={cn("text-lg font-bold", isBalanced ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                {totalPoints} / {EXAM_TOTAL}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isBalanced ? "✅ Balanced (60)" : "⚠️ Target: 60"}
              </p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pass Mark</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{examDetails.pass_mark} pts</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {totalPoints > 0 ? Math.round((examDetails.pass_mark / totalPoints) * 100) : 0}% passing grade
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200/70 dark:border-blue-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CA1 Score</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA1_MAX} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CA2 Score</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA2_MAX} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CA Total</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA_TOTAL} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Grand Total (Exam + CA)</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{GRAND_TOTAL} marks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Summary Header */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{examDetails.title || 'Untitled Exam'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {examDetails.subject} • {examDetails.class} • {examDetails.term?.toUpperCase()} TERM ({examDetails.session_year})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={draftCount > 0 ? 'outline' : 'default'}
                className={cn(
                  "text-xs px-2.5 py-1",
                  draftCount > 0
                    ? "border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
                )}
              >
                {draftCount > 0 ? `${draftCount} Draft(s)` : 'All Complete'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800">
              <FileText className="h-5 w-5 mx-auto mb-1 text-blue-500 dark:text-blue-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalQuestions}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800">
              <Award className="h-5 w-5 mx-auto mb-1 text-amber-500 dark:text-amber-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Marks</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalPoints}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800">
              <Clock className="h-5 w-5 mx-auto mb-1 text-purple-500 dark:text-purple-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{examDetails.duration}m</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800">
              <Brain className="h-5 w-5 mx-auto mb-1 text-emerald-500 dark:text-emerald-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Pass Mark</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{examDetails.pass_mark} pts</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {completeCount} Complete • {draftCount} Draft
            </Badge>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Shuffle Questions: {examDetails.shuffle_questions ? '✅ Yes' : '❌ No'}
            </Badge>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Shuffle Options: {examDetails.shuffle_options ? '✅ Yes' : '❌ No'}
            </Badge>
            {hasTheory && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                Theory Section Enabled
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objective Questions Section */}
      {questions.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base">
                <BookOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Objective Questions ({questions.length})
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({defaultMark || 0.5} mark each)</span>
              </h3>
              {questions.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllObjective(!showAllObjective)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 gap-1"
                >
                  {showAllObjective ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Show Top 5
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" /> Show All ({questions.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            <ScrollArea className={showAllObjective ? "h-[540px] pr-2" : "h-auto"}>
              <div className="space-y-3.5">
                {displayObjective.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-xl border transition-all",
                      q.is_draft
                        ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50"
                        : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 min-w-[24px] mt-0.5">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <QuestionContent
                          text={q.question_text}
                          imageUrl={q.image_url || undefined}
                          imageCaption={q.image_caption || undefined}
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        />

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oi) => {
                              const letter = String.fromCharCode(65 + oi)
                              const isCorrect = q.correct_answer === letter || q.correct_answer === opt
                              return (
                                <div
                                  key={oi}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors",
                                    isCorrect
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium"
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0",
                                      isCorrect
                                        ? "bg-emerald-500 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                    )}
                                  >
                                    {letter}
                                  </span>
                                  <span className="truncate">{opt || <span className="italic opacity-50">Empty</span>}</span>
                                  {isCorrect && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 ml-auto flex-shrink-0" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Badges & Meta */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {q.points || defaultMark || 0.5} pt{q.points !== 1 ? 's' : ''}
                          </Badge>
                          {q.correct_answer && (
                            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-[10px]">
                              Correct: Option {q.correct_answer}
                            </Badge>
                          )}
                          {q.is_draft && (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-[10px]">
                              📝 Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Theory Questions Section */}
      {hasTheory && theoryQuestions.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base">
                <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                Theory Questions ({theoryQuestions.length})
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">(Total: {totalTheoryPoints} marks)</span>
              </h3>
              {theoryQuestions.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTheory(!showAllTheory)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 gap-1"
                >
                  {showAllTheory ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Show Top 3
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" /> Show All ({theoryQuestions.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            <ScrollArea className={showAllTheory ? "h-[540px] pr-2" : "h-auto"}>
              <div className="space-y-4">
                {displayTheory.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-xl border transition-all",
                      q.is_draft
                        ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50"
                        : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 min-w-[24px] mt-0.5">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0 space-y-3">
                        <QuestionContent
                          text={q.question_text}
                          imageUrl={q.image_url || undefined}
                          imageCaption={q.image_caption || undefined}
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        />

                        {/* Sub-questions breakdown */}
                        {q.sub_questions && q.sub_questions.length > 0 && (
                          <div className="space-y-2 pl-3 border-l-2 border-purple-200 dark:border-purple-800/60 my-2">
                            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                              Sub-questions ({q.sub_questions.length}):
                            </p>
                            {q.sub_questions.map((sub, sIdx) => (
                              <div key={sub.id || sIdx} className="text-xs text-slate-700 dark:text-slate-300">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {sub.label || `(${String.fromCharCode(97 + sIdx)})`}
                                </span>{' '}
                                {sub.question_text}{' '}
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                  [{sub.points || 0} marks]
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Model answer preview if available */}
                        {q.model_answer && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                              Model Answer / Guide:
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                              {q.model_answer}
                            </p>
                          </div>
                        )}

                        {/* Badges & Meta */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {q.points} pt{q.points !== 1 ? 's' : ''}
                          </Badge>
                          {q.sub_questions && q.sub_questions.length > 0 && (
                            <Badge variant="outline" className="text-[10px] border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30">
                              {q.sub_questions.length} part{q.sub_questions.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {q.keywords && q.keywords.length > 0 && (
                            <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                              {q.keywords.length} keyword{q.keywords.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {q.is_draft && (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-[10px]">
                              📝 Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalQuestions === 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-base">No questions added yet</p>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-1">
              Add objective or theory questions in the Questions tab to see the live preview.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {examDetails.instructions && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Student Instructions
            </h4>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <QuestionContent text={examDetails.instructions} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}