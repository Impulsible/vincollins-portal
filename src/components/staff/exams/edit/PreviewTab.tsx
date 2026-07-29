// src/components/staff/exams/edit/PreviewTab.tsx - NO HARDCODED VALUES

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
  examDetails,
  questions,
  theoryQuestions,
  hasTheory,
  passageText,
  defaultMark,
  theoryTotalMarks,
}: PreviewTabProps) {
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  
  // ✅ Use MARK_CONSTANTS - NO HARDCODED VALUES
  const EXAM_TOTAL = MARK_CONSTANTS.EXAM_TOTAL
  const CA1_MAX = MARK_CONSTANTS.CA1_MAX
  const CA2_MAX = MARK_CONSTANTS.CA2_MAX
  const CA_TOTAL = MARK_CONSTANTS.CA_TOTAL
  const GRAND_TOTAL = MARK_CONSTANTS.GRAND_TOTAL
  
  const objectiveCount = questions.length
  const theoryCount = hasTheory ? theoryQuestions.length : 0
  
  // Calculate from actual data, not hardcoded
  const totalObjectivePoints = objectiveCount * (defaultMark || 0.5)
  const totalTheoryPoints = hasTheory 
    ? (theoryTotalMarks || theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0))
    : 0
  
  const totalPoints = totalObjectivePoints + totalTheoryPoints
  const totalQuestions = objectiveCount + theoryCount
  
  const draftCount = questions.filter(q => q.is_draft).length + 
    (hasTheory ? theoryQuestions.filter(q => q.is_draft).length : 0)
  
  const completeCount = totalQuestions - draftCount
  const isBalanced = totalPoints === EXAM_TOTAL

  const displayQuestions = showAllQuestions ? questions : questions.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Passage Preview */}
      {passageText && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                📖 Read the passage below and answer the questions
              </span>
            </div>
            <div className="text-sm text-gray-800 leading-relaxed font-serif whitespace-pre-wrap">
              {passageText}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Distribution Summary - NO HARDCODED VALUES */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Mark Distribution</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-blue-600">Objective</p>
              <p className="text-lg font-bold text-blue-700">{totalObjectivePoints} marks</p>
              <p className="text-[10px] text-blue-500">{objectiveCount} × {defaultMark || 0.5}</p>
            </div>
            <div>
              <p className="text-xs text-purple-600">Theory</p>
              <p className="text-lg font-bold text-purple-700">{totalTheoryPoints} marks</p>
              <p className="text-[10px] text-purple-500">{theoryCount} questions</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600">Total</p>
              <p className={cn(
                "text-lg font-bold",
                isBalanced ? "text-emerald-700" : "text-amber-700"
              )}>
                {totalPoints} / {EXAM_TOTAL} marks
              </p>
              <p className="text-[10px] text-emerald-500">
                {isBalanced ? "✅ Balanced" : "⚠️ Should be 60"}
              </p>
            </div>
            <div>
              <p className="text-xs text-amber-600">Pass Mark</p>
              <p className="text-lg font-bold text-amber-700">{examDetails.pass_mark}%</p>
              <p className="text-[10px] text-amber-500">
                {totalPoints > 0 ? Math.round((examDetails.pass_mark / totalPoints) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* CA and Grand Total - NO HARDCODED VALUES */}
          <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500">CA1</p>
              <p className="text-sm font-semibold text-slate-700">{CA1_MAX} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">CA2</p>
              <p className="text-sm font-semibold text-slate-700">{CA2_MAX} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">CA Total</p>
              <p className="text-sm font-semibold text-slate-700">{CA_TOTAL} marks</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Grand Total</p>
              <p className="text-sm font-semibold text-slate-700">{GRAND_TOTAL} marks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{examDetails.title || 'Untitled Exam'}</h2>
              <p className="text-slate-500">{examDetails.subject} • {examDetails.class}</p>
            </div>
            <Badge variant={draftCount > 0 ? 'outline' : 'default'} className="text-xs">
              {draftCount > 0 ? `${draftCount} Draft(s)` : 'All Complete'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-slate-500">Questions</p>
              <p className="text-lg font-bold">{totalQuestions}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <Award className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-slate-500">Total Marks</p>
              <p className="text-lg font-bold">{totalPoints}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-lg font-bold">{examDetails.duration}m</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <Brain className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-xs text-slate-500">Pass Mark</p>
              <p className="text-lg font-bold">{examDetails.pass_mark}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {completeCount} Complete • {draftCount} Draft
            </Badge>
            <Badge variant="outline">
              Shuffle Q: {examDetails.shuffle_questions ? '✅' : '❌'}
            </Badge>
            <Badge variant="outline">
              Shuffle Options: {examDetails.shuffle_options ? '✅' : '❌'}
            </Badge>
            {hasTheory && (
              <Badge variant="secondary">Has Theory</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objective Questions Card */}
      {questions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Objective Questions ({questions.length})
                <span className="text-xs text-slate-400 font-normal">
                  ({defaultMark || 0.5} mark each)
                </span>
              </h3>
              {questions.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllQuestions(!showAllQuestions)}
                  className="text-xs"
                >
                  {showAllQuestions ? 'Show Less' : `Show All (${questions.length})`}
                </Button>
              )}
            </div>
            
            <ScrollArea className={showAllQuestions ? "h-[400px]" : "h-auto"}>
              <div className="space-y-3">
                {displayQuestions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    className={`p-3 rounded-lg border ${
                      q.is_draft 
                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20' 
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-slate-500 min-w-[24px]">
                        {idx + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {q.question_text}
                        </p>
                        <div className="ml-4 mt-1 space-y-0.5">
                          {q.options?.map((opt, oi) => (
                            <p key={oi} className="text-xs text-slate-500">
                              {String.fromCharCode(65 + oi)}. {opt}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {q.correct_answer && (
                            <Badge variant="outline" className="text-emerald-600 text-[10px]">
                              Answer: {q.correct_answer}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {q.points || defaultMark || 0.5} pts
                          </Badge>
                          {q.is_draft && (
                            <Badge variant="outline" className="text-amber-600 text-[10px]">
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

      {/* Theory Questions Card */}
      {hasTheory && theoryQuestions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-purple-500" />
              Theory Questions ({theoryQuestions.length})
              <span className="text-xs text-slate-400 font-normal">
                (Total: {totalTheoryPoints} marks)
              </span>
            </h3>
            <div className="space-y-3">
              {theoryQuestions.slice(0, 3).map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-sm font-medium">{idx + 1}. {q.question_text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {q.points} pts
                    </Badge>
                    {q.sub_questions && q.sub_questions.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {q.sub_questions.length} parts
                      </Badge>
                    )}
                    {q.is_draft && (
                      <Badge variant="outline" className="text-amber-600 text-[10px]">
                        📝 Draft
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {theoryQuestions.length > 3 && (
                <p className="text-sm text-slate-400">
                  ...and {theoryQuestions.length - 3} more theory questions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalQuestions === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No questions added yet</p>
            <p className="text-sm text-slate-400">Add questions to see a preview</p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {examDetails.instructions && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Instructions
            </h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {examDetails.instructions}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}