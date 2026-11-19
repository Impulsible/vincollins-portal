// src/components/staff/exams/edit/ObjectiveQuestionsTab.tsx - WITH DARK MODE & TABLE/IMAGE SUPPORT
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { QuestionContent } from '@/components/shared/QuestionContent'
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Search,
  Copy,
  Upload,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Question } from './types'

interface ObjectiveQuestionsTabProps {
  questions: Question[]
  onAddQuestion: () => void
  onEditQuestion: (question: Question) => void
  onDeleteQuestion: (questionId: string) => void
  onBulkAdd?: (questions: Partial<Question>[]) => Promise<void> | void
  isSaving?: boolean
  defaultMark?: number
}

const QUESTIONS_PER_PAGE = 20
const BATCH_SIZE = 20

const parseBulkMCQs = (text: string, defaultPoints: number): Partial<Question>[] => {
  const lines = text.split(/\r?\n/)
  const questions: Partial<Question>[] = []
  let currentQuestion: Partial<Question> | null = null
  let currentOptions: string[] = []
  let currentCorrectAnswer = ''

  const questionPattern = /^(\d+)[\.\)]\s+(.*)/i
  const optionPattern = /^([A-E])[\.\)]\s+(.*)/i
  const answerPattern = /^(?:Answer|Correct\s*Answer|Ans):\s*([A-E])/i
  const marksPattern = /^Marks?:\s*([\d.]+)/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const marksMatch = line.match(marksPattern)
    if (marksMatch && currentQuestion) {
      currentQuestion.points = parseFloat(marksMatch[1])
      continue
    }

    const answerMatch = line.match(answerPattern)
    if (answerMatch && currentQuestion) {
      currentCorrectAnswer = answerMatch[1].toUpperCase()
      continue
    }

    const questionMatch = line.match(questionPattern)
    if (questionMatch) {
      if (currentQuestion && currentOptions.length > 0) {
        questions.push({
          ...currentQuestion,
          options: [...currentOptions],
          correct_answer: currentCorrectAnswer,
          points: currentQuestion.points || defaultPoints,
        })
      }
      currentQuestion = {
        question_text: questionMatch[2],
        points: defaultPoints,
      }
      currentOptions = []
      currentCorrectAnswer = ''
      continue
    }

    const optionMatch = line.match(optionPattern)
    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[2])
      continue
    }

    if (currentQuestion && !optionMatch && !answerMatch && !marksMatch) {
      currentQuestion.question_text = (currentQuestion.question_text || '') + '\n' + line
    }
  }

  if (currentQuestion && currentOptions.length > 0) {
    questions.push({
      ...currentQuestion,
      options: [...currentOptions],
      correct_answer: currentCorrectAnswer,
      points: currentQuestion.points || defaultPoints,
    })
  }

  return questions
}

export function ObjectiveQuestionsTab({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onBulkAdd,
  isSaving = false,
  defaultMark = 0.5,
}: ObjectiveQuestionsTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkPoints, setBulkPoints] = useState(defaultMark)
  const [parsedQuestions, setParsedQuestions] = useState<Partial<Question>[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [filterType, setFilterType] = useState<'all' | 'draft' | 'complete'>('all')

  const filteredQuestions = useMemo(() => {
    let result = questions
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (q) =>
          q.question_text?.toLowerCase().includes(query) ||
          q.options?.some((opt) => opt.toLowerCase().includes(query))
      )
    }
    if (filterType === 'draft') result = result.filter((q) => q.is_draft === true)
    else if (filterType === 'complete') result = result.filter((q) => q.is_draft === false)
    return result
  }, [questions, searchQuery, filterType])

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const currentQuestions = filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE)

  const draftCount = questions.filter((q) => q.is_draft === true).length
  const completeCount = questions.filter((q) => q.is_draft === false).length

  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (q.points || defaultMark), 0),
    [questions, defaultMark]
  )

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const handlePreviewBulk = () => {
    if (!bulkText.trim()) {
      toast.error('Please paste your questions')
      return
    }
    const parsed = parseBulkMCQs(bulkText, bulkPoints)
    if (parsed.length === 0) {
      toast.error('No questions found. Please check format.')
      return
    }
    setParsedQuestions(parsed)
    toast.success(`Detected ${parsed.length} questions`)
  }

  const handleImportBulk = async () => {
    if (parsedQuestions.length === 0) return
    if (!onBulkAdd) {
      toast.error('Bulk import not configured')
      return
    }

    setIsImporting(true)
    setImportStatus('processing')
    setImportProgress(0)

    try {
      let imported = 0
      for (let i = 0; i < parsedQuestions.length; i += BATCH_SIZE) {
        const batch = parsedQuestions.slice(i, i + BATCH_SIZE)
        await onBulkAdd(batch)
        imported += batch.length
        setImportProgress(Math.round((imported / parsedQuestions.length) * 100))
        if (i + BATCH_SIZE < parsedQuestions.length) {
          await new Promise((resolve) => setTimeout(resolve, 60))
        }
      }
      setImportStatus('success')
      toast.success(`Successfully imported ${parsedQuestions.length} questions`)
      setTimeout(() => {
        setShowBulkDialog(false)
        setBulkText('')
        setParsedQuestions([])
        setImportStatus('idle')
        setImportProgress(0)
      }, 1500)
    } catch {
      setImportStatus('error')
      toast.error('Failed to import questions')
    } finally {
      setIsImporting(false)
    }
  }

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }, [currentPage, totalPages])

  const isQuestionComplete = (q: Question) => {
    return !!(
      q.question_text?.trim() &&
      q.options?.some((opt) => opt && opt.trim()) &&
      q.correct_answer?.trim()
    )
  }

  return (
    <TooltipProvider>
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-slate-800 dark:text-slate-100 text-lg sm:text-xl">
              Objective Questions (MCQs)
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              {questions.length} questions • {totalPoints} total points
              {draftCount > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                  • {draftCount} draft(s)
                </span>
              )}
              {completeCount > 0 && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  • {completeCount} complete
                </span>
              )}
              {defaultMark > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • {defaultMark} mark each
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-9 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className={cn(
                  'h-9 text-xs',
                  filterType === 'all'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                All ({questions.length})
              </Button>
              <Button
                variant={filterType === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('draft')}
                className={cn(
                  'h-9 text-xs',
                  filterType === 'draft'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                <AlertTriangle className="mr-1 h-3 w-3" /> Drafts ({draftCount})
              </Button>
              <Button
                variant={filterType === 'complete' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('complete')}
                className={cn(
                  'h-9 text-xs',
                  filterType === 'complete'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Complete ({completeCount})
              </Button>
            </div>
            <Button
              onClick={() => setShowBulkDialog(true)}
              size="sm"
              variant="outline"
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs h-9"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Bulk Import
            </Button>
            <Button
              onClick={onAddQuestion}
              size="sm"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs h-9"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Question
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">No objective questions yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                Add single questions or use Bulk Import to paste whole exam sets.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={onAddQuestion} className="text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-800">
                  Add Question
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(true)} className="text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-800">
                  Bulk Import
                </Button>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {filterType === 'draft'
                  ? 'No draft questions found'
                  : filterType === 'complete'
                  ? 'No complete questions found'
                  : 'No questions match your search'}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  handleSearch('')
                  setFilterType('all')
                }}
                className="text-blue-600 dark:text-blue-400 text-xs"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[520px] pr-2">
                <div className="space-y-3">
                  {currentQuestions.map((q, idx) => {
                    const isComplete = isQuestionComplete(q)
                    const isDraft = q.is_draft === true
                    return (
                      <div
                        key={q.id || idx}
                        className={cn(
                          'p-3.5 sm:p-4 rounded-xl group transition-all border',
                          isDraft
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                            : isComplete
                            ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2">
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                #{startIndex + idx + 1}
                              </span>
                              {isDraft ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-950/40"
                                >
                                  📝 Draft
                                </Badge>
                              ) : isComplete ? (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                  ✅ Complete
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-500 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                                >
                                  ⚠️ Incomplete
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                              >
                                {q.points || defaultMark} pt{(q.points || defaultMark) !== 1 ? 's' : ''}
                              </Badge>
                              {q.image_url && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 gap-1"
                                >
                                  <ImageIcon className="h-2.5 w-2.5" /> Diagram
                                </Badge>
                              )}
                            </div>

                            <QuestionContent
                              text={q.question_text}
                              imageUrl={q.image_url || undefined}
                              imageCaption={q.image_caption || undefined}
                              className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200"
                            />

                            {q.options && q.options.length > 0 && (
                              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options.map((opt, optIdx) => {
                                  const letter = String.fromCharCode(65 + optIdx)
                                  const isCorrect =
                                    q.correct_answer === letter || q.correct_answer === opt
                                  return (
                                    <div
                                      key={optIdx}
                                      className={cn(
                                        'flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border transition-colors',
                                        isCorrect
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium'
                                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          'w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0',
                                          isCorrect
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        )}
                                      >
                                        {letter}
                                      </span>
                                      <span className="truncate">
                                        {opt || <span className="italic opacity-50">Empty</span>}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2.5 pt-1">
                              {q.correct_answer ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px]">
                                  Correct Answer: Option {q.correct_answer}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[10px]"
                                >
                                  ⚠️ No answer selected
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditQuestion(q)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteQuestion(q.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {startIndex + 1}-
                    {Math.min(startIndex + QUESTIONS_PER_PAGE, filteredQuestions.length)} of{' '}
                    {filteredQuestions.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-slate-200 dark:border-slate-800 h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((page, index) =>
                      typeof page === 'number' ? (
                        <Button
                          key={index}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'h-8 w-8 p-0 text-xs',
                            currentPage === page
                              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={index} className="px-1 text-slate-400 dark:text-slate-500 text-xs">
                          {page}
                        </span>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-slate-200 dark:border-slate-800 h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">
              Bulk Import Objective Questions
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Paste your questions in standard format. Each question should have options (A-D or A-E) and an answer key.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Default Points per Question
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={bulkPoints}
                onChange={(e) => setBulkPoints(parseFloat(e.target.value) || defaultMark)}
                className="w-32 mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Default: {defaultMark} mark per question
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Paste your questions
              </Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`1. What is the chemical formula for water?\nA) H2O2\nB) H2O\nC) HO2\nD) 2H2O\nAnswer: B\n\n2. Solve for x: 2x + 6 = 14\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B`}
                className="min-h-[280px] font-mono text-xs sm:text-sm mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            {parsedQuestions.length > 0 && !isImporting && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                <p className="font-semibold text-xs sm:text-sm mb-2 text-slate-800 dark:text-slate-200">
                  Preview ({parsedQuestions.length} questions detected):
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {parsedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex-1 truncate mr-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{idx + 1}.</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">
                          {q.question_text?.substring(0, 90)}...
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {q.correct_answer && (
                          <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px]">
                            Ans: {q.correct_answer}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                          {q.points || defaultMark} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isImporting && (
              <div className="border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-3 mb-3 text-blue-800 dark:text-blue-300">
                  {importStatus === 'processing' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  )}
                  {importStatus === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="text-sm font-semibold">
                    {importStatus === 'processing' ? 'Importing questions...' : 'Import Complete!'}
                  </span>
                </div>
                <Progress value={importProgress} className="h-2 bg-blue-100 dark:bg-blue-950" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              Cancel
            </Button>
            {!isImporting && parsedQuestions.length === 0 && (
              <Button
                variant="secondary"
                onClick={handlePreviewBulk}
                className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
              >
                Preview Questions
              </Button>
            )}
            {!isImporting && parsedQuestions.length > 0 && (
              <Button
                onClick={handleImportBulk}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Import {parsedQuestions.length} Questions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}