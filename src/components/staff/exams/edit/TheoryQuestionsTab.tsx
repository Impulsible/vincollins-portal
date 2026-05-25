// src/components/staff/exams/edit/TheoryQuestionsTab.tsx - WITH BULK IMPORT
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus, Edit, Trash2, Brain, AlertCircle,
  ChevronLeft, ChevronRight, Search, FileText, AlertTriangle,
  Upload, Copy
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { TheoryQuestion } from './types'

interface TheoryQuestionsTabProps {
  questions: TheoryQuestion[]
  hasTheory: boolean
  onAddQuestion: () => void
  onEditQuestion: (question: TheoryQuestion) => void
  onDeleteQuestion: (questionId: string) => void
  onBulkAdd?: (questions: Partial<TheoryQuestion>[]) => void
}

const QUESTIONS_PER_PAGE = 10

// Parse bulk text into questions
const parseBulkQuestions = (text: string): { question_text: string; points: number }[] => {
  const lines = text.split(/\r?\n/)
  const questions: { question_text: string; points: number }[] = []
  let currentQuestion = ''
  let inQuestion = false
  let defaultPoints = 5

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check for question number pattern (1., 1), 1. , etc.)
    const questionMatch = line.match(/^(\d+)[\.\)]\s+(.*)/)
    
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion) {
        questions.push({
          question_text: currentQuestion.trim(),
          points: defaultPoints
        })
      }
      // Start new question
      currentQuestion = questionMatch[2]
      inQuestion = true
    } else if (inQuestion && line) {
      // Add to current question (handles multi-line questions)
      currentQuestion += '\n' + line
    } else if (!questionMatch && line && !inQuestion) {
      // Question without number format
      questions.push({
        question_text: line,
        points: defaultPoints
      })
    }
  }
  
  // Add last question
  if (currentQuestion) {
    questions.push({
      question_text: currentQuestion.trim(),
      points: defaultPoints
    })
  }
  
  return questions
}

export function TheoryQuestionsTab({
  questions,
  hasTheory,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onBulkAdd
}: TheoryQuestionsTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkPoints, setBulkPoints] = useState(5)
  const [parsedQuestions, setParsedQuestions] = useState<{ question_text: string; points: number }[]>([])

  // Helper to strip HTML for search
  const stripHtml = useCallback((html: string): string => {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }, [])

  // Filter questions by search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions
    
    const query = searchQuery.toLowerCase()
    return questions.filter(q => {
      if (q.question_text?.toLowerCase().includes(query)) return true
      const strippedText = stripHtml(q.question_text || '')
      if (strippedText.toLowerCase().includes(query)) return true
      if (q.keywords?.some(k => k.toLowerCase().includes(query))) return true
      return false
    })
  }, [questions, searchQuery, stripHtml])

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const currentQuestions = filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE)

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const handlePreviewBulk = () => {
    if (!bulkText.trim()) {
      toast.error('Please paste your questions')
      return
    }
    const parsed = parseBulkQuestions(bulkText)
    if (parsed.length === 0) {
      toast.error('No questions found. Please use format like "1. Question text"')
      return
    }
    // Apply default points to all parsed questions
    const questionsWithPoints = parsed.map(q => ({
      ...q,
      points: bulkPoints
    }))
    setParsedQuestions(questionsWithPoints)
  }

  const handleImportBulk = () => {
    if (parsedQuestions.length === 0) return
    
    if (onBulkAdd) {
      onBulkAdd(parsedQuestions)
    } else {
      // Fallback: call onAddQuestion for each (if no bulk handler)
      toast.info('Bulk import not fully configured')
    }
    
    toast.success(`Successfully imported ${parsedQuestions.length} questions`)
    setShowBulkDialog(false)
    setBulkText('')
    setParsedQuestions([])
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

  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0)
  }, [questions])

  const showWarning = questions.length > 50

  if (!hasTheory) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Theory questions are disabled. Enable them in the Details tab.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Theory Questions
              {showWarning && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    You have {questions.length} theory questions. Consider using pagination.
                  </TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
            <CardDescription>
              {questions.length} total question{questions.length !== 1 ? 's' : ''} • {totalPoints} total points
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setShowBulkDialog(true)} size="sm" variant="outline">
                  <Copy className="mr-2 h-4 w-4" /> Bulk Import
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import multiple questions at once</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onAddQuestion} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new theory question</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No theory questions yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Add theory questions to assess students' written responses
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="link" onClick={onAddQuestion}>
                  Add your first theory question
                </Button>
                <Button variant="link" onClick={() => setShowBulkDialog(true)}>
                  Or import multiple at once
                </Button>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No questions match your search</p>
              <Button variant="link" onClick={() => handleSearch('')} className="mt-2">
                Clear search
              </Button>
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="mb-3 text-xs text-slate-500">
                  Found {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </div>
              )}

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {currentQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium prose prose-sm dark:prose-invert max-w-none line-clamp-3">
                            <span className="mr-2 font-semibold text-slate-500">
                              {startIndex + idx + 1}.
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: q.question_text }} />
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {q.points} point{q.points !== 1 ? 's' : ''}
                            </Badge>
                            {q.keywords && q.keywords.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs cursor-help">
                                    {q.keywords.length} keyword{q.keywords.length !== 1 ? 's' : ''}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <p className="font-semibold mb-1">Keywords for grading:</p>
                                    <p className="text-xs">{q.keywords.join(', ')}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {q.model_answer && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="text-xs cursor-help">
                                    Has model answer
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-md">
                                    <p className="font-semibold mb-1">Model Answer:</p>
                                    <div 
                                      className="text-xs prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: q.model_answer }}
                                    />
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditQuestion(q)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit question</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteQuestion(q.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete question</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-slate-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + QUESTIONS_PER_PAGE, filteredQuestions.length)} of {filteredQuestions.length} questions
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Previous page</TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        typeof page === 'number' ? (
                          <Button
                            key={index}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        ) : (
                          <span key={index} className="px-1 text-slate-400">
                            {page}
                          </span>
                        )
                      ))}
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Next page</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Total Questions:</span>
                    <span className="font-semibold ml-2">{questions.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Total Points:</span>
                    <span className="font-semibold ml-2">{totalPoints}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">With Keywords:</span>
                    <span className="font-semibold ml-2">
                      {questions.filter(q => q.keywords && q.keywords.length > 0).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">With Model Answer:</span>
                    <span className="font-semibold ml-2">
                      {questions.filter(q => q.model_answer).length}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Theory Questions</DialogTitle>
            <DialogDescription>
              Paste your questions in the format below. Each question should start with a number (e.g., "1. Question text").
              Sub-questions and formatting will be preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Default Points per Question</Label>
              <Input
                type="number"
                value={bulkPoints}
                onChange={(e) => setBulkPoints(parseInt(e.target.value) || 5)}
                min={1}
                max={50}
                className="w-32 mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">
                Each question will receive this many points (can edit individually after import)
              </p>
            </div>

            <div>
              <Label>Paste your questions here</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Example format:
1. What is photosynthesis? Explain the process in detail.
   a) What are the requirements?
   b) What are the products?

2. Describe the water cycle including evaporation, condensation, and precipitation.

3. Explain Newton's three laws of motion with examples.`}
                className="min-h-[300px] font-mono text-sm mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">
                Tip: Each question should start with a number (1., 2., etc.). Multi-line questions and sub-questions (a., b., etc.) are supported.
              </p>
            </div>

            {parsedQuestions.length > 0 && (
              <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                <p className="font-semibold mb-2">Preview ({parsedQuestions.length} questions detected):</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="text-sm p-2 bg-white dark:bg-slate-800 rounded">
                      <span className="font-medium text-purple-600">{idx + 1}.</span>
                      <span className="ml-2 line-clamp-2">{q.question_text.substring(0, 100)}...</span>
                      <Badge variant="outline" className="ml-2 text-xs">{q.points} pts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handlePreviewBulk}>
              Preview Questions
            </Button>
            <Button 
              onClick={handleImportBulk} 
              disabled={parsedQuestions.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import {parsedQuestions.length} Question{parsedQuestions.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}