// src/components/staff/exams/edit/PreviewTab.tsx - WITH PASSAGE SUPPORT

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, Brain, Award, Clock, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { Question, TheoryQuestion, ExamDetailsForm } from './types'

interface PreviewTabProps {
  examDetails: ExamDetailsForm
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
  passageText?: string  // ✅ ADD THIS
}

export function PreviewTab({
  examDetails,
  questions,
  theoryQuestions,
  hasTheory,
  passageText,  // ✅ ADD THIS
}: PreviewTabProps) {
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  
  const totalQuestions = questions.length + (hasTheory ? theoryQuestions.length : 0)
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0) +
    (hasTheory ? theoryQuestions.reduce((sum, q) => sum + (q.points || 5), 0) : 0)
  
  const draftCount = questions.filter(q => q.is_draft).length + 
    (hasTheory ? theoryQuestions.filter(q => q.is_draft).length : 0)
  
  const completeCount = totalQuestions - draftCount

  const displayQuestions = showAllQuestions ? questions : questions.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* ✅ Passage Preview */}
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
            {examDetails.negative_marking && (
              <Badge variant="outline" className="text-red-500">
                Negative: -{examDetails.negative_marking_value}
              </Badge>
            )}
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
                            {q.points} pts
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