// src/components/staff/exams/edit/ObjectiveQuestionsTab.tsx - WITH DARK MODE
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus, Edit, Trash2, FileText, Search,
  Copy, Upload, Loader2, CheckCircle2,
  ChevronLeft, ChevronRight, AlertTriangle
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
  const optionPattern = /^([A-D])[\.\)]\s+(.*)/i
  const answerPattern = /^Answer:\s*([A-D])/i
  const marksPattern = /^Marks?:\s*([\d.]+)/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const marksMatch = line.match(marksPattern)
    if (marksMatch && currentQuestion) { currentQuestion.points = parseFloat(marksMatch[1]); continue }

    const answerMatch = line.match(answerPattern)
    if (answerMatch && currentQuestion) { currentCorrectAnswer = answerMatch[1].toUpperCase(); continue }

    const questionMatch = line.match(questionPattern)
    if (questionMatch) {
      if (currentQuestion && currentOptions.length > 0 && currentCorrectAnswer) {
        questions.push({ ...currentQuestion, options: [...currentOptions], correct_answer: currentCorrectAnswer, points: currentQuestion.points || defaultPoints })
      }
      currentQuestion = { question_text: questionMatch[2], points: defaultPoints }
      currentOptions = []
      currentCorrectAnswer = ''
      continue
    }

    const optionMatch = line.match(optionPattern)
    if (optionMatch && currentQuestion) { currentOptions.push(optionMatch[2]); continue }

    if (currentQuestion && !optionMatch && !answerMatch && !marksMatch) { currentQuestion.question_text += ' ' + line }
  }

  if (currentQuestion && currentOptions.length > 0 && currentCorrectAnswer) {
    questions.push({ ...currentQuestion, options: [...currentOptions], correct_answer: currentCorrectAnswer, points: currentQuestion.points || defaultPoints })
  }

  return questions
}

export function ObjectiveQuestionsTab({
  questions, onAddQuestion, onEditQuestion, onDeleteQuestion, onBulkAdd,
  isSaving = false, defaultMark = 0.5,
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
      result = result.filter(q => 
        q.question_text?.toLowerCase().includes(query) ||
        q.options?.some(opt => opt.toLowerCase().includes(query))
      )
    }
    if (filterType === 'draft') result = result.filter(q => q.is_draft === true)
    else if (filterType === 'complete') result = result.filter(q => q.is_draft === false)
    return result
  }, [questions, searchQuery, filterType])

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const currentQuestions = filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE)

  const draftCount = questions.filter(q => q.is_draft === true).length
  const completeCount = questions.filter(q => q.is_draft === false).length

  const totalPoints = useMemo(() => questions.reduce((sum, q) => sum + (q.points || 0), 0), [questions])

  const handleSearch = useCallback((value: string) => { setSearchQuery(value); setCurrentPage(1) }, [])

  const handlePreviewBulk = () => {
    if (!bulkText.trim()) { toast.error('Please paste your questions'); return }
    const parsed = parseBulkMCQs(bulkText, bulkPoints)
    if (parsed.length === 0) { toast.error('No questions found. Check format.'); return }
    setParsedQuestions(parsed)
    toast.success(`Detected ${parsed.length} questions`)
  }

  const handleImportBulk = async () => {
    if (parsedQuestions.length === 0) return
    if (!onBulkAdd) { toast.error('Bulk import not configured'); return }
    
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
        if (i + BATCH_SIZE < parsedQuestions.length) await new Promise(resolve => setTimeout(resolve, 50))
      }
      setImportStatus('success')
      toast.success(`Successfully imported ${parsedQuestions.length} questions`)
      setTimeout(() => {
        setShowBulkDialog(false); setBulkText(''); setParsedQuestions([])
        setImportStatus('idle'); setImportProgress(0)
      }, 1500)
    } catch (error) {
      setImportStatus('error')
      toast.error('Failed to import questions')
    } finally { setIsImporting(false) }
  }

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...'); pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1); pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1); pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...'); pages.push(totalPages)
      }
    }
    return pages
  }, [currentPage, totalPages])

  const isQuestionComplete = (q: Question) => {
    return q.question_text?.trim() && q.options?.some(opt => opt.trim()) && q.correct_answer?.trim()
  }

  return (
    <TooltipProvider>
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-slate-800 dark:text-slate-100">Objective Questions (MCQs)</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {questions.length} questions • {totalPoints} total points
              {draftCount > 0 && <span className="ml-2 text-amber-600 dark:text-amber-500">• {draftCount} draft(s)</span>}
              {completeCount > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-500">• {completeCount} complete</span>}
              {defaultMark > 0 && <span className="ml-2 text-blue-600 dark:text-blue-400">• {defaultMark} mark each</span>}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-9 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex gap-1">
              <Button 
                variant={filterType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('all')}
                className={cn("h-9", filterType === 'all' ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300")}
              >
                All ({questions.length})
              </Button>
              <Button 
                variant={filterType === 'draft' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('draft')}
                className={cn("h-9", filterType === 'draft' ? "bg-amber-500 hover:bg-amber-600 text-white" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300")}
              >
                <AlertTriangle className="mr-1 h-3 w-3" /> Drafts ({draftCount})
              </Button>
              <Button 
                variant={filterType === 'complete' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('complete')}
                className={cn("h-9", filterType === 'complete' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300")}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Complete ({completeCount})
              </Button>
            </div>
            <Button onClick={() => setShowBulkDialog(true)} size="sm" variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Copy className="mr-2 h-4 w-4" /> Bulk Import
            </Button>
            <Button onClick={onAddQuestion} size="sm" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">No objective questions yet</p>
              <div className="flex gap-2 justify-center">
                <Button variant="link" onClick={onAddQuestion} className="text-blue-600 dark:text-blue-400">Add your first question</Button>
                <Button variant="link" onClick={() => setShowBulkDialog(true)} className="text-blue-600 dark:text-blue-400">Or import multiple</Button>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {filterType === 'draft' ? 'No draft questions found' : 
                 filterType === 'complete' ? 'No complete questions found' : 
                 'No questions match your search'}
              </p>
              <Button variant="link" onClick={() => { handleSearch(''); setFilterType('all'); }} className="text-blue-600 dark:text-blue-400">Clear filters</Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {currentQuestions.map((q, idx) => {
                    const isComplete = isQuestionComplete(q)
                    const isDraft = q.is_draft === true
                    return (
                      <div 
                        key={q.id} 
                        className={cn(
                          "p-4 rounded-xl group transition-all border",
                          isDraft 
                            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50" 
                            : isComplete 
                              ? "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/50"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">#{startIndex + idx + 1}</span>
                              {isDraft ? (
                                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/30">📝 Draft</Badge>
                              ) : isComplete ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">✅ Complete</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 dark:text-amber-400 border-amber-300 dark:border-amber-800">⚠️ Incomplete</Badge>
                              )}
                              <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{q.points || defaultMark} point(s)</Badge>
                            </div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{q.question_text}</p>
                            {q.options && q.options.length > 0 && (
                              <div className="ml-6 mt-2 space-y-1">
                                {q.options.map((opt, optIdx) => (
                                  <p key={optIdx} className="text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-medium text-slate-800 dark:text-slate-300">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                                  </p>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              {q.correct_answer ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Answer: {q.correct_answer}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 dark:text-amber-400 border-amber-300 dark:border-amber-800">No answer selected</Badge>
                              )}
                            </div>
                            {isDraft && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> This question is a draft. Complete it before publishing the exam.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button variant="ghost" size="sm" onClick={() => onEditQuestion(q)} className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDeleteQuestion(q.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4" />
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
                    Showing {startIndex + 1}-{Math.min(startIndex + QUESTIONS_PER_PAGE, filteredQuestions.length)} of {filteredQuestions.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border-slate-200 dark:border-slate-800">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <Button key={index} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0", currentPage === page ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300")}>
                          {page}
                        </Button>
                      ) : (<span key={index} className="px-1 text-slate-400 dark:text-slate-500">{page}</span>)
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border-slate-200 dark:border-slate-800">
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
            <DialogTitle className="text-slate-800 dark:text-slate-100">Bulk Import Multiple Choice Questions</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Paste your questions in the format below. Each question should have 4 options and an answer.
              Default mark is <strong className="text-slate-700 dark:text-slate-300">{defaultMark}</strong> per question.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Default Points per Question</Label>
              <Input type="number" step="0.5" min="0.5" value={bulkPoints} onChange={(e) => setBulkPoints(parseFloat(e.target.value) || defaultMark)} className="w-32 mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Default: {defaultMark} mark per question</p>
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300">Paste your questions</Label>
              <Textarea
                value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                placeholder={`1. What is the capital of France?\nA) London\nB) Berlin\nC) Paris\nD) Madrid\nAnswer: C`}
                className="min-h-[300px] font-mono text-sm mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {parsedQuestions.length > 0 && !isImporting && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <p className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Preview ({parsedQuestions.length} questions):</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="text-sm p-2 bg-white dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-purple-600 dark:text-purple-400">{idx + 1}.</span>
                      <span className="ml-2 text-slate-700 dark:text-slate-300">{q.question_text?.substring(0, 100)}...</span>
                      <Badge variant="outline" className="ml-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Answer: {q.correct_answer}</Badge>
                      <Badge variant="outline" className="ml-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{q.points || defaultMark} pts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isImporting && (
              <div className="border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-3 mb-3 text-blue-800 dark:text-blue-300">
                  {importStatus === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />}
                  {importStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
                  <span>{importStatus === 'processing' ? 'Importing...' : 'Complete!'}</span>
                </div>
                <Progress value={importProgress} className="h-2 bg-blue-100 dark:bg-blue-950" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Cancel</Button>
            {!isImporting && parsedQuestions.length === 0 && (
              <Button variant="secondary" onClick={handlePreviewBulk} className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700">Preview</Button>
            )}
            {!isImporting && parsedQuestions.length > 0 && (
              <Button onClick={handleImportBulk} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white">
                <Upload className="mr-2 h-4 w-4" /> Import {parsedQuestions.length} Questions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}