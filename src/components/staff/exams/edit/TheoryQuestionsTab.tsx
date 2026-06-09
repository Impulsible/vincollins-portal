// src/components/staff/exams/edit/TheoryQuestionsTab.tsx - COMPLETE WITH PROPER TABLE RENDERING

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
  Plus, Edit, Trash2, FileText, Search,
  Copy, Upload, Loader2, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Layers, AlertTriangle,
  Sparkles, FileCode2, Split, Zap, Table as TableIcon
} from 'lucide-react'
import { toast } from 'sonner'
import type { TheoryQuestion, TheorySubQuestion } from './types'

interface TheoryQuestionsTabProps {
  questions: TheoryQuestion[]
  hasTheory: boolean
  onAddQuestion: () => void
  onEditQuestion: (question: TheoryQuestion) => void
  onDeleteQuestion: (questionId: string) => void
  onBulkAdd?: (questions: Partial<TheoryQuestion>[]) => Promise<void> | void
  isSaving?: boolean
}

const QUESTIONS_PER_PAGE = 10
const BATCH_SIZE = 5
const OPTIMAL_BATCH_SIZE = 8

// ==================== RENDER CONTENT WITH PROPER TABLE HANDLING ====================
// This function hides raw HTML and shows actual rendered tables
const renderContent = (text: string, maxLength?: number) => {
  if (!text) return null
  
  // Handle HTML tables - extract and render them as actual tables
  if (text.includes('<table') && text.includes('</table>')) {
    const tableMatch = text.match(/<table[\s\S]*?<\/table>/i)
    if (tableMatch) {
      return (
        <div className="overflow-x-auto my-2">
          <div 
            className="w-full [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-300 [&_td]:border-gray-300 [&_th]:p-1.5 [&_td]:p-1.5 [&_th]:bg-gray-100 [&_th]:font-semibold [&_table]:text-xs"
            dangerouslySetInnerHTML={{ __html: tableMatch[0] }}
          />
        </div>
      )
    }
  }
  
  // Handle markdown tables
  if (text.includes('|') && text.includes('---') && text.match(/\|.+\|/)) {
    const lines = text.split('\n').filter(line => line.includes('|'))
    const tableHtml = convertMarkdownTableToHtml(lines)
    if (tableHtml) {
      return (
        <div className="overflow-x-auto my-2">
          <div 
            className="w-full [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-300 [&_td]:border-gray-300 [&_th]:p-1.5 [&_td]:p-1.5 [&_th]:bg-gray-100 [&_th]:font-semibold [&_table]:text-xs"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      )
    }
  }
  
  let displayText = text
  if (maxLength && !text.includes('<table')) {
    displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  
  // Handle markdown images
  const imageMatch = displayText.match(/!\[(.*?)\]\((.*?)\)/)
  if (imageMatch) {
    return (
      <div className="my-2">
        <img src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full max-h-[80px] rounded border" />
        {imageMatch[1] && <p className="text-xs text-muted-foreground mt-1">{imageMatch[1]}</p>}
      </div>
    )
  }
  
  // Handle ASCII art charts
  if (displayText.includes('█') || displayText.includes('▓') || displayText.includes('▒') || displayText.includes('░')) {
    return <pre className="font-mono text-xs bg-gray-100 p-2 rounded my-2 whitespace-pre-wrap overflow-x-auto">{displayText}</pre>
  }
  
  // Clean up any stray HTML tags that might appear
  let cleanText = displayText
  cleanText = cleanText.replace(/<(?!(?:table|tr|td|th|tbody|thead)\b)[^>]*>/gi, '')
  
  // Regular text - preserve line breaks
  return <span dangerouslySetInnerHTML={{ __html: cleanText.replace(/\n/g, '<br/>') }} />
}

// Helper function to convert markdown table to HTML
const convertMarkdownTableToHtml = (tableLines: string[]): string => {
  let html = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 12px;">'
  let isHeader = true
  
  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false
      continue
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((cell: string) => cell.trim() !== '')
      if (cells.length === 0) continue
      html += '<tr>'
      cells.forEach((cell: string) => {
        const tag = isHeader ? 'th' : 'td'
        html += `<${tag} style="border: 1px solid #ccc; padding: 6px; text-align: left; ${isHeader ? 'background-color: #f3f4f6; font-weight: 600;' : ''}">${cell.trim()}</${tag}>`
      })
      html += '</tr>'
      isHeader = false
    }
  }
  html += '</table>'
  return html
}

// Helper to check if content contains a table
const hasTable = (text: string): boolean => {
  if (!text) return false
  return text.includes('<table') && text.includes('</table>')
}

// Helper to render sub-questions recursively with nested support
const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null
  
  const startCharCode = level === 0 ? 97 : 105 // 'a' = 97, 'i' = 105
  
  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : 'ml-4 mt-2'}`}>
      <p className="text-xs font-semibold text-purple-600">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={sq.id} className="pl-3 border-l-2 border-purple-200">
          <div className="text-sm">
            <span className="font-medium text-purple-600">
              {level === 0 ? String.fromCharCode(startCharCode + idx) : String.fromCharCode(startCharCode + idx)}.
            </span>
            <div className="inline ml-1">{renderContent(sq.text, 150)}</div>
            {sq.points && <span className="ml-2 text-xs text-muted-foreground">({sq.points} marks)</span>}
          </div>
          {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
            renderSubQuestions(sq.sub_sub_questions, level + 1)
          )}
        </div>
      ))}
    </div>
  )
}

// ==================== SMART PARSER WITH NESTED SUB-QUESTIONS ====================
const smartParseBulkQuestions = (text: string, defaultPoints: number): Partial<TheoryQuestion>[] => {
  const questions: Partial<TheoryQuestion>[] = []
  const normalizedText = text.replace(/\r\n/g, '\n')
  const questionBlocks = normalizedText.split(/\n(?=\d+\.\s+)/)
  
  for (const block of questionBlocks) {
    if (!block.trim()) continue
    
    const mainMatch = block.match(/^(\d+)\.\s+(.*?)(?=\n---|\nSub-questions:|\n\d+\s*marks?|\nMarks?:|$)/i)
    if (!mainMatch) continue
    
    let questionContent = mainMatch[2].trim()
    const marksMatch = block.match(/(?:^|\n)\s*(\d+)\s*marks?|marks?:?\s*(\d+)/i)
    const points = marksMatch ? parseInt(marksMatch[1] || marksMatch[2]) : defaultPoints
    
    // Extract additional content
    const afterMainMatch = block.match(/^(\d+)\.\s+.*?\n(.*?)(?=\n\d+\s*marks?|\nMarks?:|$)/i)
    if (afterMainMatch && afterMainMatch[2]) {
      const additionalContent = afterMainMatch[2].trim()
      if (additionalContent && 
          !additionalContent.toLowerCase().includes('sub-questions') &&
          !additionalContent.match(/^[a-z][\.\)]/i)) {
        questionContent += '\n\n' + additionalContent
      }
    }
    
    // Extract HTML tables - keep them as HTML for rendering
    const tableMatches = block.match(/<table[\s\S]*?<\/table>/gi)
    if (tableMatches && tableMatches.length > 0) {
      for (const table of tableMatches) {
        if (!questionContent.includes(table)) {
          questionContent += '\n\n' + table
        }
      }
    }
    
    // Extract any data/preface before tables
    const dataMatch = block.match(/([\d,\s]+)(?=\n\s*<table)/)
    if (dataMatch && dataMatch[1].trim() && !questionContent.includes(dataMatch[1])) {
      const dataText = dataMatch[1].trim()
      if (dataText.length > 0 && dataText.length < 500) {
        questionContent += '\n\nData: ' + dataText
      }
    }
    
    // Extract equations
    const equationLines: string[] = []
    const lines = block.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if ((trimmed.includes('=') || trimmed.match(/[\d\+\-\*\/\(\)]/)) && 
          !trimmed.toLowerCase().includes('sub-questions') && 
          !trimmed.toLowerCase().includes('marks') &&
          !trimmed.match(/^[a-z][\.\)]/i) &&
          trimmed.length > 0 &&
          trimmed.length < 200) {
        equationLines.push(trimmed)
      }
    }
    
    if (equationLines.length > 0) {
      const equationsText = equationLines.join('\n')
      if (!questionContent.includes(equationsText)) {
        questionContent += '\n\n' + equationsText
      }
    }
    
    // Extract sub-questions with nested support
    const subQuestionsList: TheorySubQuestion[] = []
    const subSectionMatch = block.match(/Sub-questions:\s*\n([\s\S]*?)(?=\n\s*\d+\s*marks?|\n\s*\d+\s*part\(s\)|$)/i)
    
    if (subSectionMatch) {
      const subText = subSectionMatch[1]
      const subItems = subText.split(/\n(?=[a-z][\.\)]\s+)/i)
      
      for (let i = 0; i < subItems.length; i++) {
        const subItem = subItems[i]
        const subMatch = subItem.match(/^(?:\(?([a-z])\)?[\.\)]\s+)(.*?)(?=\n\s*[a-z][\.\)]|\n\s*\(?[ivx]+|$)/i)
        if (subMatch) {
          let subContent = subMatch[2].trim()
          
          // Check for HTML tables within sub-questions
          const subTableMatch = subContent.match(/<table[\s\S]*?<\/table>/i)
          if (subTableMatch && !subContent.includes('<table')) {
            subContent = subTableMatch[0]
          }
          
          // Check for sub-sub-questions (roman numerals)
          const subSubPattern = /\(?(i{1,3}|iv|v|vi|vii|viii|ix|x)\)?[\.\)]\s+([^\(]+?)(?=(?:\(?(?:i{1,3}|iv|v|vi|vii|viii|ix|x)\)?[\.\)]|$))/gi
          const subSubMatches: Array<{ label: string; text: string }> = []
          let subSubMatch
          
          subSubPattern.lastIndex = 0
          while ((subSubMatch = subSubPattern.exec(subContent)) !== null) {
            subSubMatches.push({
              label: subSubMatch[1].toUpperCase(),
              text: subSubMatch[2].trim()
            })
          }
          
          if (subSubMatches.length > 0) {
            let mainText = subContent
            for (const ss of subSubMatches) {
              mainText = mainText.replace(new RegExp(`\\(?${ss.label}\\)?[\\.\)]\\s+${escapeRegex(ss.text)}`, 'i'), '')
            }
            mainText = mainText.trim()
            
            const subSubQuestions: TheorySubQuestion[] = subSubMatches.map((ss, idx) => ({
              id: `temp_${Date.now()}_${Math.random()}_${idx}`,
              text: ss.text,
              points: 3,
              keywords: [],
              model_answer: ''
            }))
            
            subQuestionsList.push({
              id: `temp_${Date.now()}_${Math.random()}_${i}`,
              text: mainText || subContent.substring(0, 100),
              points: 5 + (subSubMatches.length * 2),
              keywords: [],
              model_answer: '',
              sub_sub_questions: subSubQuestions
            })
          } else {
            // Check for sub-sub-questions on separate lines
            const subItemLines = subItem.split('\n')
            let mainText = ''
            const subSubQuestions: TheorySubQuestion[] = []
            
            for (let j = 0; j < subItemLines.length; j++) {
              const line = subItemLines[j].trim()
              const romanMatch = line.match(/^\(?(i{1,3}|iv|v|vi|vii|viii|ix|x)\)?[\.\)]\s+(.*)/i)
              
              if (romanMatch) {
                subSubQuestions.push({
                  id: `temp_${Date.now()}_${Math.random()}_${j}`,
                  text: romanMatch[2].trim(),
                  points: 3,
                  keywords: [],
                  model_answer: ''
                })
              } else if (subSubQuestions.length === 0) {
                mainText += (mainText ? ' ' : '') + line
              }
            }
            
            if (subSubQuestions.length > 0) {
              subQuestionsList.push({
                id: `temp_${Date.now()}_${Math.random()}_${i}`,
                text: mainText || subContent.substring(0, 100),
                points: 5 + (subSubQuestions.length * 2),
                keywords: [],
                model_answer: '',
                sub_sub_questions: subSubQuestions
              })
            } else {
              subQuestionsList.push({
                id: `temp_${Date.now()}_${Math.random()}_${i}`,
                text: subContent,
                points: 5,
                keywords: [],
                model_answer: ''
              })
            }
          }
        }
      }
    }
    
    // Fallback: simple sub-question detection
    if (subQuestionsList.length === 0) {
      const lines = block.split('\n')
      for (const line of lines) {
        const simpleMatch = line.match(/^[a-z][\.\)]\s+(.+)/i)
        if (simpleMatch) {
          subQuestionsList.push({
            id: `temp_${Date.now()}_${Math.random()}`,
            text: simpleMatch[1].trim(),
            points: 5,
            keywords: [],
            model_answer: ''
          })
        }
      }
    }
    
    questionContent = questionContent.replace(/^---$/gm, '').trim()
    
    const calculateTotalPoints = (subQs: TheorySubQuestion[]): number => {
      let total = 0
      for (const sq of subQs) {
        total += sq.points || 5
        if (sq.sub_sub_questions && sq.sub_sub_questions.length > 0) {
          total += calculateTotalPoints(sq.sub_sub_questions)
        }
      }
      return total
    }
    
    const totalPoints = subQuestionsList.length > 0 
      ? calculateTotalPoints(subQuestionsList)
      : points
    
    questions.push({
      question_text: questionContent,
      points: totalPoints,
      sub_questions: subQuestionsList.length > 0 ? subQuestionsList : undefined
    })
  }
  
  if (questions.length === 0) {
    return smartParseBulkQuestionsFallback(text, defaultPoints)
  }
  
  return questions
}

// Helper function to escape regex special characters
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Fallback parser for simpler formats
const smartParseBulkQuestionsFallback = (text: string, defaultPoints: number): Partial<TheoryQuestion>[] => {
  const lines = text.split(/\r?\n/)
  const questions: Partial<TheoryQuestion>[] = []
  let currentQuestion: Partial<TheoryQuestion> | null = null
  let currentSubQuestions: TheorySubQuestion[] = []
  let currentSubText = ''
  let inSubQuestion = false
  
  const mainPattern = /^(?:Question\s+)?(\d+)[\.\)]\s+(.*)/i
  const subPattern = /^\(?([a-z])\)?[\.\)]\s+(.*)/i
  const marksPattern = /^(?:Marks?\s*:\s*)?(\d+)\s*(?:marks?)?$/i

  const cleanText = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim()
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line || line === '---' || line === '___' || line.toLowerCase() === 'sub-questions:') continue

    const marksMatch = line.match(marksPattern)
    if (marksMatch && currentQuestion) {
      if (inSubQuestion && currentSubText) {
        currentSubQuestions.push({
          id: `temp_${Date.now()}_${i}`,
          text: cleanText(currentSubText),
          points: defaultPoints,
          keywords: [],
          model_answer: ''
        })
        currentSubText = ''
        inSubQuestion = false
      }
      if (currentSubQuestions.length > 0) {
        currentQuestion.sub_questions = currentSubQuestions
        currentQuestion.points = currentSubQuestions.reduce((sum, sq) => sum + (sq.points || defaultPoints), 0)
      }
      questions.push(currentQuestion)
      currentQuestion = null
      currentSubQuestions = []
      continue
    }

    const mainMatch = line.match(mainPattern)
    if (mainMatch) {
      if (currentQuestion) {
        if (inSubQuestion && currentSubText) {
          currentSubQuestions.push({
            id: `temp_${Date.now()}_${i}`,
            text: cleanText(currentSubText),
            points: defaultPoints,
            keywords: [],
            model_answer: ''
          })
        }
        if (currentSubQuestions.length > 0) {
          currentQuestion.sub_questions = currentSubQuestions
          currentQuestion.points = currentSubQuestions.reduce((sum, sq) => sum + (sq.points || defaultPoints), 0)
        }
        questions.push(currentQuestion)
      }
      currentQuestion = {
        question_text: cleanText(mainMatch[2]),
        points: defaultPoints,
        sub_questions: []
      }
      currentSubQuestions = []
      currentSubText = ''
      inSubQuestion = false
      continue
    }

    const subMatch = line.match(subPattern)
    if (subMatch && currentQuestion) {
      if (inSubQuestion && currentSubText) {
        currentSubQuestions.push({
          id: `temp_${Date.now()}_${i}`,
          text: cleanText(currentSubText),
          points: defaultPoints,
          keywords: [],
          model_answer: ''
        })
      }
      currentSubText = subMatch[2]
      inSubQuestion = true
      continue
    }

    if (inSubQuestion && currentQuestion) {
      currentSubText += ' ' + line
    } else if (currentQuestion) {
      currentQuestion.question_text += ' ' + line
    }
  }

  if (currentQuestion) {
    if (inSubQuestion && currentSubText) {
      currentSubQuestions.push({
        id: `temp_${Date.now()}_end`,
        text: cleanText(currentSubText),
        points: defaultPoints,
        keywords: [],
        model_answer: ''
      })
    }
    if (currentSubQuestions.length > 0) {
      currentQuestion.sub_questions = currentSubQuestions
      currentQuestion.points = currentSubQuestions.reduce((sum, sq) => sum + (sq.points || defaultPoints), 0)
    }
    questions.push(currentQuestion)
  }

  return questions
}

const simplePaste = (text: string, defaultPoints: number): Partial<TheoryQuestion>[] => {
  return [{
    question_text: text,
    points: defaultPoints,
    sub_questions: []
  }]
}

const splitIntoBatches = <T,>(items: T[], batchSize: number): T[][] => {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}

export function TheoryQuestionsTab({
  questions,
  hasTheory,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onBulkAdd,
  isSaving = false
}: TheoryQuestionsTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkPoints, setBulkPoints] = useState(10)
  const [parseMode, setParseMode] = useState<'smart' | 'simple'>('smart')
  const [autoBatch, setAutoBatch] = useState(true)
  const [batchSize, setBatchSize] = useState(OPTIMAL_BATCH_SIZE)
  const [parsedQuestions, setParsedQuestions] = useState<Partial<TheoryQuestion>[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [currentBatchProgress, setCurrentBatchProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)

  if (!hasTheory) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Theory questions are disabled. Enable them in the Details tab.</p>
        </CardContent>
      </Card>
    )
  }

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions
    const query = searchQuery.toLowerCase()
    return questions.filter(q => 
      q.question_text?.toLowerCase().includes(query) ||
      q.sub_questions?.some(sq => sq.text.toLowerCase().includes(query))
    )
  }, [questions, searchQuery])

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const currentQuestions = filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE)

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const handlePreview = () => {
    if (!bulkText.trim()) {
      toast.error('Please paste your questions')
      return
    }
    
    const startTime = performance.now()
    const parsed = parseMode === 'smart' 
      ? smartParseBulkQuestions(bulkText, bulkPoints)
      : simplePaste(bulkText, bulkPoints)
    const endTime = performance.now()
    
    if (parsed.length === 0) {
      toast.error('No questions detected. Please check the format.')
      return
    }
    
    setParsedQuestions(parsed)
    const estimatedSeconds = Math.ceil(parsed.length * 0.3)
    setEstimatedTime(estimatedSeconds)
    toast.success(`Detected ${parsed.length} question(s) in ${Math.round(endTime - startTime)}ms`)
  }

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return
    if (!onBulkAdd) {
      toast.error('Bulk import not configured')
      return
    }
    
    setIsImporting(true)
    setImportStatus('processing')
    setImportProgress(0)
    setCurrentBatchProgress(0)
    
    const effectiveBatchSize = autoBatch && parsedQuestions.length > 15 
      ? Math.max(3, Math.floor(parsedQuestions.length / 5))
      : batchSize
    
    const batches = splitIntoBatches(parsedQuestions, effectiveBatchSize)
    const totalBatches = batches.length
    
    toast.info(`Processing ${parsedQuestions.length} questions in ${totalBatches} batches...`)
    
    try {
      let importedCount = 0
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        const batchNumber = batchIndex + 1
        
        setCurrentBatchProgress(0)
        await onBulkAdd(batch)
        
        importedCount += batch.length
        const overallProgress = Math.round((importedCount / parsedQuestions.length) * 100)
        setImportProgress(overallProgress)
        setCurrentBatchProgress(100)
        
        if (batchNumber < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        toast.info(`Batch ${batchNumber}/${totalBatches} complete (${importedCount}/${parsedQuestions.length} questions)`, {
          duration: 1500
        })
      }
      
      setImportStatus('success')
      toast.success(`✅ Successfully imported ${parsedQuestions.length} question(s) in ${totalBatches} batches!`)
      
      setTimeout(() => {
        setShowBulkDialog(false)
        setBulkText('')
        setParsedQuestions([])
        setImportStatus('idle')
        setImportProgress(0)
        setCurrentBatchProgress(0)
        setEstimatedTime(null)
      }, 2000)
      
    } catch (error) {
      console.error('Import error:', error)
      setImportStatus('error')
      toast.error('Failed to import some questions. Please try again with smaller batch.')
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

  const totalPoints = useMemo(() => {
    const calculateTotal = (subQs?: TheorySubQuestion[]): number => {
      if (!subQs) return 0
      let total = 0
      for (const sq of subQs) {
        total += sq.points || 0
        if (sq.sub_sub_questions) {
          total += calculateTotal(sq.sub_sub_questions)
        }
      }
      return total
    }
    
    return questions.reduce((sum, q) => {
      let qTotal = q.points || 0
      if (q.sub_questions) {
        qTotal += calculateTotal(q.sub_questions)
      }
      return sum + qTotal
    }, 0)
  }, [questions])

  const totalSubQuestions = useMemo(() => {
    const countSubQs = (subQs?: TheorySubQuestion[]): number => {
      if (!subQs) return 0
      let count = subQs.length
      for (const sq of subQs) {
        if (sq.sub_sub_questions) {
          count += countSubQs(sq.sub_sub_questions)
        }
      }
      return count
    }
    
    return questions.reduce((sum, q) => sum + countSubQs(q.sub_questions), 0)
  }, [questions])

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Theory Questions
              {questions.length > 0 && <Badge variant="secondary">{questions.length} questions</Badge>}
              {questions.length > 20 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Zap className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>Using optimized batching for {questions.length} questions</TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
            <CardDescription>
              {totalSubQuestions} sub-question{totalSubQuestions !== 1 ? 's' : ''} • {totalPoints} total points
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
            <Button onClick={() => setShowBulkDialog(true)} size="sm" variant="outline">
              <Sparkles className="mr-2 h-4 w-4" /> Bulk Paste
            </Button>
            <Button onClick={onAddQuestion} size="sm" disabled={isSaving}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No theory questions yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Use "Bulk Paste" to import multiple questions at once
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="link" onClick={onAddQuestion}>Add manually</Button>
                <Button variant="link" onClick={() => setShowBulkDialog(true)}>Bulk paste questions</Button>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No questions match your search</p>
              <Button variant="link" onClick={() => handleSearch('')}>Clear search</Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {currentQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            <span className="font-bold text-purple-600">{startIndex + idx + 1}.</span>
                            <div className="inline ml-1">
                              {hasTable(q.question_text) ? (
                                <>
                                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <TableIcon className="h-3 w-3" />
                                    <span>Table included</span>
                                  </div>
                                  {renderContent(q.question_text)}
                                </>
                              ) : q.question_text.length > 200 ? (
                                <>
                                  {renderContent(q.question_text.substring(0, 200))}
                                  <span className="text-muted-foreground">...</span>
                                </>
                              ) : (
                                renderContent(q.question_text)
                              )}
                            </div>
                          </div>
                          
                          {/* Render nested sub-questions */}
                          {q.sub_questions && q.sub_questions.length > 0 && (
                            renderSubQuestions(q.sub_questions, 0)
                          )}
                          
                          <div className="flex gap-2 mt-3">
                            <Badge className="bg-purple-100 text-purple-700">
                              {q.points} marks
                            </Badge>
                            {q.sub_questions && q.sub_questions.length > 0 && (
                              <Badge variant="outline">
                                <Layers className="h-3 w-3 mr-1" />
                                {(() => {
                                  const countSubQs = (subQs?: TheorySubQuestion[]): number => {
                                    if (!subQs) return 0
                                    let count = subQs.length
                                    for (const sq of subQs) {
                                      if (sq.sub_sub_questions) {
                                        count += countSubQs(sq.sub_sub_questions)
                                      }
                                    }
                                    return count
                                  }
                                  return countSubQs(q.sub_questions)
                                })()} part(s)
                              </Badge>
                            )}
                            {hasTable(q.question_text) && (
                              <Badge variant="outline" className="border-blue-200 text-blue-600">
                                <TableIcon className="h-3 w-3 mr-1" />
                                Table
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => onEditQuestion(q)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onDeleteQuestion(q.id)} className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-slate-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + QUESTIONS_PER_PAGE, filteredQuestions.length)} of {filteredQuestions.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <Button key={index} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0">
                          {page}
                        </Button>
                      ) : (
                        <span key={index} className="px-1 text-slate-400">{page}</span>
                      )
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-slate-500">Total Questions:</span> <strong>{questions.length}</strong></div>
                  <div><span className="text-slate-500">Total Marks:</span> <strong>{totalPoints}</strong></div>
                  <div><span className="text-slate-500">Sub-questions:</span> <strong>{totalSubQuestions}</strong></div>
                  <div><span className="text-slate-500">Avg per Question:</span> <strong>{(totalPoints / questions.length).toFixed(1)} marks</strong></div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Paste Theory Questions</DialogTitle>
            <DialogDescription>
              Paste your questions and the system will automatically detect and split them into optimal batches for fast import.
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                Supports format: "1. Question... Sub-questions: a. ... b. ... i. ... ii. ... 10 marks"
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant={parseMode === 'smart' ? 'default' : 'outline'} onClick={() => setParseMode('smart')}>
                  <Sparkles className="h-3 w-3 mr-1" /> Smart Parse
                </Button>
                <Button size="sm" variant={parseMode === 'simple' ? 'default' : 'outline'} onClick={() => setParseMode('simple')}>
                  <FileCode2 className="h-3 w-3 mr-1" /> Simple Paste
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Auto-batch:</span>
                <Button size="sm" variant={autoBatch ? 'default' : 'outline'} onClick={() => setAutoBatch(!autoBatch)}>
                  <Split className="h-3 w-3 mr-1" />
                  {autoBatch ? 'On' : 'Off'}
                </Button>
                {!autoBatch && (
                  <Input type="number" value={batchSize} onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 5))} min={1} max={20} className="w-16 h-8 text-sm" />
                )}
              </div>
              
              <div>
                <Label className="text-sm">Default Marks per Question</Label>
                <Input type="number" value={bulkPoints} onChange={(e) => setBulkPoints(parseInt(e.target.value) || 10)} min={1} max={100} className="w-24 mt-1" />
              </div>
            </div>

            {parsedQuestions.length > 15 && (
              <Alert>
                <Split className="h-4 w-4" />
                <AlertDescription>
                  Detected {parsedQuestions.length} questions. Will import in {Math.ceil(parsedQuestions.length / (autoBatch ? OPTIMAL_BATCH_SIZE : batchSize))} batches.
                  {estimatedTime && ` Estimated time: ~${estimatedTime} seconds.`}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Paste your questions here</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`1. A trader bought 200 textbooks at ₦750 each...

Sub-questions:
a. Calculate the total cost price...
b. Calculate the total selling price...

10 marks

2. Solve the following equations:
i. 3x + 7 = 22
ii. 5y - 8 = 17

10 marks`}
                className="min-h-[300px] font-mono text-sm mt-1"
              />
            </div>

            {parsedQuestions.length > 0 && !isImporting && (
              <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                <p className="font-semibold mb-2">Preview ({parsedQuestions.length} questions detected):</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {parsedQuestions.slice(0, 5).map((q, idx) => (
                    <div key={idx} className="text-sm p-2 bg-white dark:bg-slate-800 rounded flex items-center justify-between">
                      <div className="flex-1 truncate">
                        <span className="font-medium text-purple-600">Q{idx + 1}:</span>
                        <span className="ml-2">{renderContent(q.question_text?.substring(0, 80) || '', 80)}</span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {q.sub_questions && q.sub_questions.length > 0 && <Badge variant="outline">{q.sub_questions.length} parts</Badge>}
                        <Badge variant="outline">{q.points} marks</Badge>
                      </div>
                    </div>
                  ))}
                  {parsedQuestions.length > 5 && <p className="text-xs text-slate-500 text-center pt-2">+ {parsedQuestions.length - 5} more questions</p>}
                </div>
              </div>
            )}

            {isImporting && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-3 mb-3">
                  {importStatus === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                  {importStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {importStatus === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {importStatus === 'processing' && `Importing... ${importProgress}%`}
                      {importStatus === 'success' && 'Import completed!'}
                      {importStatus === 'error' && 'Import failed'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {currentBatchProgress === 100 ? 'Batch complete, processing next...' : 'Saving questions...'}
                    </p>
                  </div>
                </div>
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  {Math.round((importProgress / 100) * parsedQuestions.length)} of {parsedQuestions.length} questions imported
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkDialog(false)} disabled={isImporting}>Cancel</Button>
            {!isImporting && parsedQuestions.length === 0 && <Button variant="secondary" onClick={handlePreview}>Preview Questions</Button>}
            {!isImporting && parsedQuestions.length > 0 && (
              <Button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="mr-2 h-4 w-4" />
                Import {parsedQuestions.length} Question{parsedQuestions.length !== 1 ? 's' : ''}
                {parsedQuestions.length > 15 && ` (${Math.ceil(parsedQuestions.length / (autoBatch ? OPTIMAL_BATCH_SIZE : batchSize))} batches)`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}