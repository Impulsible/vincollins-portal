// src/components/staff/exams/edit/PreviewTab.tsx - WITH DARK MODE
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, Brain, Award, Clock, FileText, Calculator } from 'lucide-react'
import { useState } from 'react'
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
  examDetails, questions, theoryQuestions, hasTheory, passageText, defaultMark, theoryTotalMarks,
}: PreviewTabProps) {
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  
  const EXAM_TOTAL = MARK_CONSTANTS.EXAM_TOTAL
  const CA1_MAX = MARK_CONSTANTS.CA1_MAX
  const CA2_MAX = MARK_CONSTANTS.CA2_MAX
  const CA_TOTAL = MARK_CONSTANTS.CA_TOTAL
  const GRAND_TOTAL = MARK_CONSTANTS.GRAND_TOTAL
  
  const objectiveCount = questions.length
  const theoryCount = hasTheory ? theoryQuestions.length : 0
  const totalObjectivePoints = objectiveCount * (defaultMark || 0.5)
  const totalTheoryPoints = hasTheory ? (theoryTotalMarks || theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0)) : 0
  const totalPoints = totalObjectivePoints + totalTheoryPoints
  const totalQuestions = objectiveCount + theoryCount
  const draftCount = questions.filter(q => q.is_draft).length + (hasTheory ? theoryQuestions.filter(q => q.is_draft).length : 0)
  const completeCount = totalQuestions - draftCount
  const isBalanced = totalPoints === EXAM_TOTAL

  const displayQuestions = showAllQuestions ? questions : questions.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Passage Preview */}
      {passageText && (
        <Card className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                📖 Read the passage below and answer the questions
              </span>
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">
              {passageText}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Distribution Summary */}
      <Card className="border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Mark Distribution</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Objective</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalObjectivePoints} marks</p>
              <p className="text-[10px] text-blue-500 dark:text-blue-400/70">{objectiveCount} × {defaultMark || 0.5}</p>
            </div>
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Theory</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{totalTheoryPoints} marks</p>
              <p className="text-[10px] text-purple-500 dark:text-purple-400/70">{theoryCount} questions</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Total</p>
              <p className={cn("text-lg font-bold", isBalanced ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                {totalPoints} / {EXAM_TOTAL} marks
              </p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400/70">
                {isBalanced ? "✅ Balanced" : "⚠️ Should be 60"}
              </p>
            </div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400">Pass Mark</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{examDetails.pass_mark}%</p>
              <p className="text-[10px] text-amber-500 dark:text-amber-400/70">
                {totalPoints > 0 ? Math.round((examDetails.pass_mark / totalPoints) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CA1</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA1_MAX} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CA2</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA2_MAX} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CA Total</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA_TOTAL} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Grand Total</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{GRAND_TOTAL} marks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Summary Card */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-100">{examDetails.title || 'Untitled Exam'}</h2>
              <p className="text-slate-500 dark:text-slate-400">{examDetails.subject} • {examDetails.class}</p>
            </div>
            <Badge variant={draftCount > 0 ? 'outline' : 'default'} className={cn("text-xs", draftCount > 0 ? "border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0")}>
              {draftCount > 0 ? `${draftCount} Draft(s)` : 'All Complete'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-transparent dark:border-slate-800">
              <FileText className="h-5 w-5 mx-auto mb-1 text-blue-500 dark:text-blue-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalQuestions}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-transparent dark:border-slate-800">
              <Award className="h-5 w-5 mx-auto mb-1 text-amber-500 dark:text-amber-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Marks</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalPoints}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-transparent dark:border-slate-800">
              <Clock className="h-5 w-5 mx-auto mb-1 text-purple-500 dark:text-purple-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{examDetails.duration}m</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center border border-transparent dark:border-slate-800">
              <Brain className="h-5 w-5 mx-auto mb-1 text-emerald-500 dark:text-emerald-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Pass Mark</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{examDetails.pass_mark}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{completeCount} Complete • {draftCount} Draft</Badge>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Shuffle Q: {examDetails.shuffle_questions ? '✅' : '❌'}</Badge>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Shuffle Options: {examDetails.shuffle_options ? '✅' : '❌'}</Badge>
            {hasTheory && <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30">Has Theory</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Objective Questions Card */}
      {questions.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <BookOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Objective Questions ({questions.length})
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({defaultMark || 0.5} mark each)</span>
              </h3>
              {questions.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllQuestions(!showAllQuestions)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                  {showAllQuestions ? 'Show Less' : `Show All (${questions.length})`}
                </Button>
              )}
            </div>
            
            <ScrollArea className={showAllQuestions ? "h-[400px]" : "h-auto"}>
              <div className="space-y-3">
                {displayQuestions.map((q, idx) => (
                  <div key={q.id} className={cn("p-3 rounded-lg border",
                    q.is_draft 
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50" 
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                  )}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 min-w-[24px]">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{q.question_text}</p>
                        <div className="ml-4 mt-1 space-y-0.5">
                          {q.options?.map((opt, oi) => (
                            <p key={oi} className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{String.fromCharCode(65 + oi)}.</span> {opt}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {q.correct_answer && <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">Answer: {q.correct_answer}</Badge>}
                          <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">{q.points || defaultMark || 0.5} pts</Badge>
                          {q.is_draft && <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px]">📝 Draft</Badge>}
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

      {/* Theory Questions Card */}
      {hasTheory && theoryQuestions.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
              <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              Theory Questions ({theoryQuestions.length})
              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">(Total: {totalTheoryPoints} marks)</span>
            </h3>
            <div className="space-y-3">
              {theoryQuestions.slice(0, 3).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{idx + 1}. {q.question_text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">{q.points} pts</Badge>
                    {q.sub_questions && q.sub_questions.length > 0 && (
                      <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">{q.sub_questions.length} parts</Badge>
                    )}
                    {q.is_draft && <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px]">📝 Draft</Badge>}
                  </div>
                </div>
              ))}
              {theoryQuestions.length > 3 && (
                <p className="text-sm text-slate-400 dark:text-slate-500">...and {theoryQuestions.length - 3} more theory questions</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalQuestions === 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No questions added yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Add questions to see a preview</p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {examDetails.instructions && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-6">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Instructions
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{examDetails.instructions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}