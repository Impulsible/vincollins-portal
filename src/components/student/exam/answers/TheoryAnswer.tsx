'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  AlertCircle, 
  Brain, 
  Minimize2, 
  Maximize2, 
  PenLine,
  FileText
} from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { supabase } from '@/lib/supabase'

interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

interface TheoryQuestion {
  id: string
  question?: string
  question_text?: string
  marks?: number
  points?: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

interface TheoryAnswerProps {
  answer: string
  onChange: (content: string) => void
  examId: string
  studentId?: string
  question?: TheoryQuestion
  questionNumber?: number
}

// Convert markdown-style table strings into styled HTML
const convertTableToHtml = (tableLines: string[]): string => {
  let html = '<div class="overflow-x-auto my-4 shadow-md rounded-lg border border-gray-200 dark:border-slate-700"><table class="min-w-full bg-white dark:bg-slate-900 rounded-lg">'
  let isHeader = true
  let hasSeparator = false

  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false
      hasSeparator = true
      continue
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((cell: string) => cell.trim() !== '')
      if (cells.length === 0) continue
      html += '<tr class="' + (isHeader && !hasSeparator 
        ? 'bg-gray-100 dark:bg-slate-800' 
        : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50') + ' border-b border-gray-200 dark:border-slate-700">'
      cells.forEach((cell: string) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        const classes = (isHeader && !hasSeparator)
          ? 'px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-300 border-r border-gray-200 dark:border-slate-700 last:border-r-0'
          : 'px-4 py-3 text-sm text-gray-600 dark:text-slate-400 border-r border-gray-200 dark:border-slate-700 last:border-r-0'
        html += `<${tag} class="${classes}">${cell.trim()}</${tag}>`
      })
      html += '</tr>'
      if (isHeader && hasSeparator) isHeader = false
    }
  }
  html += '</table></div>'
  return html
}

// Parse and render question content with embedded tables
const renderFullContent = (text: string) => {
  if (!text) return null

  const tableRegex = /(\n?\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const parts: JSX.Element[] = []
  let lastIndex = 0
  let match

  while ((match = tableRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index)
      if (beforeText.trim()) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
            {beforeText.split('\n').map((line, idx) => {
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-1 ml-4 text-gray-700 dark:text-slate-300">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-1 ml-8 text-purple-600 dark:text-purple-400">{line}</p>
              }
              if (line.trim()) return <p key={idx} className="mb-1">{line}</p>
              return <br key={idx} />
            })}
          </div>
        )
      }
    }

    const tableLines = match[0].split('\n').filter(line => line.trim())
    const tableHtml = convertTableToHtml(tableLines)
    parts.push(<div key={`table-${match.index}`} dangerouslySetInnerHTML={{ __html: tableHtml }} className="my-2" />)

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex)
    if (afterText.trim()) {
      parts.push(
        <div key={`text-after`} className="whitespace-pre-wrap text-sm leading-relaxed mt-3">
          {afterText.split('\n').map((line, idx) => {
            if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
              return <p key={idx} className="mb-1 ml-4 text-gray-700 dark:text-slate-300">{line}</p>
            }
            if (line.match(/^\(?[ivx]+\)?\./i)) {
              return <p key={idx} className="mb-1 ml-8 text-purple-600 dark:text-purple-400">{line}</p>
            }
            if (line.trim()) return <p key={idx} className="mb-1">{line}</p>
            return <br key={idx} />
          })}
        </div>
      )
    }
  }

  if (parts.length === 0) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {text.split('\n').map((line, idx) => {
          if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
            return <p key={idx} className="mb-1 ml-4 text-gray-700 dark:text-slate-300">{line}</p>
          }
          if (line.match(/^\(?[ivx]+\)?\./i)) {
            return <p key={idx} className="mb-1 ml-8 text-purple-600 dark:text-purple-400">{line}</p>
          }
          if (line.match(/^\d+\./)) {
            return <p key={idx} className="mb-2 font-semibold text-blue-700 dark:text-blue-400">{line}</p>
          }
          if (line.trim() === '') return <br key={idx} />
          return <p key={idx} className="mb-1">{line}</p>
        })}
      </div>
    )
  }

  return <div className="space-y-2">{parts}</div>
}

// Render sub-questions recursively
const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null
  const startCharCode = level === 0 ? 97 : 105

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : 'ml-4 mt-2'}`}>
      <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="pl-3 border-l-2 border-purple-200 dark:border-purple-800">
          <div className="font-medium">
            {String.fromCharCode(startCharCode + idx)}. {renderFullContent(sq.text)}
            {sq.marks > 0 && <span className="ml-2 text-xs text-muted-foreground dark:text-slate-500">({sq.marks} marks)</span>}
          </div>
          {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
            renderSubQuestions(sq.sub_sub_questions, level + 1)
          )}
        </div>
      ))}
    </div>
  )
}

function TheoryQuestionDisplay({ question, questionNumber }: { question: TheoryQuestion; questionNumber: number }) {
  const questionText = question?.question || question?.question_text || ''
  const marks = question?.marks || question?.points || 10

  if (!questionText) {
    return (
      <div className="mb-6 p-5 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-200 dark:border-yellow-900/50">
        <p className="text-yellow-600 dark:text-yellow-400">Loading question...</p>
      </div>
    )
  }

  return (
    <div className="mb-6 p-5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-0">
            <Brain className="h-3.5 w-3.5 mr-1" /> Theory Question
          </Badge>
          <span className="text-xs text-muted-foreground dark:text-slate-400 font-medium">{marks} marks</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono dark:border-slate-700 dark:text-slate-300">Q{questionNumber}</Badge>
      </div>

      {question?.image_url && (
        <div className="mb-4">
          <img 
            src={question.image_url} 
            alt={question.image_caption || 'Question diagram'} 
            className="max-w-full max-h-[250px] rounded-lg border border-gray-200 dark:border-slate-700 object-contain mx-auto shadow-sm" 
          />
          {question.image_caption && (
            <p className="text-xs text-center text-muted-foreground dark:text-slate-500 mt-2 italic">{question.image_caption}</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
          <span className="bg-blue-100 dark:bg-blue-950/40 w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
          Question {questionNumber}:
        </div>
        <div className="pl-2 text-gray-800 dark:text-slate-200">
          {renderFullContent(questionText)}
        </div>
      </div>

      {question?.sub_questions && question.sub_questions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
          {renderSubQuestions(question.sub_questions, 0)}
        </div>
      )}
    </div>
  )
}

export function TheoryAnswer({
  answer,
  onChange,
  examId,
  studentId,
  question,
  questionNumber = 1,
}: TheoryAnswerProps) {
  const [localAnswer, setLocalAnswer] = useState(answer || '')
  const [isMinimized, setIsMinimized] = useState(false)

  // Unique persistence key for this question inside this exam
  const storageKey = useMemo(() => {
    const qKey = question?.id || `q_index_${questionNumber}`
    return `cbt_theory_min_${examId}_${qKey}`
  }, [examId, question?.id, questionNumber])

  // Sync answer text when question changes
  useEffect(() => {
    setLocalAnswer(answer || '')
  }, [answer, question?.id])

  // Load manual minimize preference from localStorage on mount or question change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        setIsMinimized(JSON.parse(stored) === true)
      } else {
        // Defaults to open if student never manually minimized this question
        setIsMinimized(false)
      }
    } catch {
      setIsMinimized(false)
    }
  }, [storageKey])

  // Persist student manual minimize toggle
  const toggleMinimize = useCallback((targetState?: boolean) => {
    setIsMinimized((prev) => {
      const next = typeof targetState === 'boolean' ? targetState : !prev
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch (err) {
          console.warn('Could not persist minimize state to localStorage:', err)
        }
      }
      return next
    })
  }, [storageKey])

  // Extract clean text preview from HTML for the collapsed state
  const plainText = useMemo(() => {
    if (!localAnswer) return ''
    return localAnswer
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
  }, [localAnswer])

  const wordCount = useMemo(() => {
    if (!plainText) return 0
    return plainText.split(/\s+/).filter(Boolean).length
  }, [plainText])

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const filePath = `${examId}/${studentId || 'anonymous'}/${fileName}`

    const { error } = await supabase.storage
      .from('exam-answers')
      .upload(filePath, file)

    if (error) {
      console.error('Image upload failed:', error)
      throw error
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('exam-answers').getPublicUrl(filePath)

    return publicUrl
  }

  const handleChange = (value: string) => {
    setLocalAnswer(value)
    onChange(value)
  }

  return (
    <div className="space-y-4">
      {question && (
        <TheoryQuestionDisplay question={question} questionNumber={questionNumber} />
      )}

      <div className="space-y-3">
        {/* Answer Bar Header with Minimize/Expand Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-gray-800 dark:text-slate-200 text-sm font-semibold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Your Written Answer
            </Label>
            {wordCount > 0 ? (
              <Badge variant="secondary" className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-gray-400 dark:text-slate-500">
                Not answered
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleMinimize()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={isMinimized ? 'Expand answer box' : 'Minimize answer box to see question/passage better'}
          >
            {isMinimized ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Expand Answer Area</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Minimize Box</span>
              </>
            )}
          </button>
        </div>

        {/* Minimized Compact Bar View */}
        {isMinimized ? (
          <div
            onClick={() => toggleMinimize(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMinimize(false) }}
            className="p-4 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-400 dark:hover:border-purple-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <PenLine className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">Answer Area Minimized</span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">• Click anywhere to resume typing</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 truncate mt-0.5 max-w-xl">
                  {plainText ? `Draft: "${plainText.slice(0, 140)}${plainText.length > 140 ? '...' : ''}"` : 'No answer entered yet. Click to open editor.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleMinimize(false) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors flex-shrink-0 self-start sm:self-center"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Expand & Write
            </button>
          </div>
        ) : (
          /* Expanded Full Editor View */
          <div className="space-y-3 transition-opacity duration-200">
            <RichTextEditor
              content={localAnswer}
              onChange={handleChange}
              placeholder="Type your answer here... Use the toolbar for formatting, images, and tables."
              minHeight="240px"
              maxHeight="500px"
              bucketName="exam-answers"
              folderPath={`${examId}/${studentId || 'anonymous'}`}
              onImageUpload={handleImageUpload}
              key={question?.id}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  Auto-saved in real-time
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  Graded by your instructor
                </span>
              </div>
              <span className="text-gray-400 text-[11px]">
                Tip: You can minimize this box anytime to view passages and charts.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}