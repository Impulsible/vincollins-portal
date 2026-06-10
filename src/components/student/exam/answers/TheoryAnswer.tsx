// src/components/student/exam/answers/TheoryAnswer.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, Brain } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

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

// ============ CONVERT TABLE TO HTML WITH TAILWIND CSS ============
const convertTableToHtml = (tableLines: string[]): string => {
  let html = '<div class="overflow-x-auto my-4 shadow-md rounded-lg border border-gray-200"><table class="min-w-full bg-white rounded-lg">'
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
      html += '<tr class="' + (isHeader && !hasSeparator ? 'bg-gray-100' : 'bg-white hover:bg-gray-50') + ' border-b border-gray-200">'
      cells.forEach((cell: string, idx: number) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        const classes = (isHeader && !hasSeparator)
          ? 'px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0'
          : 'px-4 py-3 text-sm text-gray-600 border-r border-gray-200 last:border-r-0'
        html += `<${tag} class="${classes}">${cell.trim()}</${tag}>`
      })
      html += '<tr>'
      if (isHeader && hasSeparator) isHeader = false
    }
  }
  html += '</table></div>'
  return html
}

// Parse and render content with tables
const renderFullContent = (text: string) => {
  if (!text) return null
  
  // Check for markdown tables
  const tableRegex = /(\n?\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const parts: JSX.Element[] = []
  let lastIndex = 0
  let match
  
  while ((match = tableRegex.exec(text)) !== null) {
    // Add text before table
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index)
      if (beforeText.trim()) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
            {beforeText.split('\n').map((line, idx) => {
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
              }
              if (line.trim()) return <p key={idx} className="mb-1">{line}</p>
              return <br key={idx} />
            })}
          </div>
        )
      }
    }
    
    // Add table
    const tableLines = match[0].split('\n').filter(line => line.trim())
    const tableHtml = convertTableToHtml(tableLines)
    parts.push(<div key={`table-${match.index}`} dangerouslySetInnerHTML={{ __html: tableHtml }} className="my-2" />)
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text after last table
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex)
    if (afterText.trim()) {
      parts.push(
        <div key={`text-after`} className="whitespace-pre-wrap text-sm leading-relaxed mt-3">
          {afterText.split('\n').map((line, idx) => {
            if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
              return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
            }
            if (line.match(/^\(?[ivx]+\)?\./i)) {
              return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
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
            return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
          }
          if (line.match(/^\(?[ivx]+\)?\./i)) {
            return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
          }
          if (line.match(/^\d+\./)) {
            return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
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
      <p className="text-sm font-semibold text-purple-700">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="pl-3 border-l-2 border-purple-200">
          <div className="font-medium">
            {String.fromCharCode(startCharCode + idx)}. {renderFullContent(sq.text)}
            {sq.marks > 0 && <span className="ml-2 text-xs text-muted-foreground">({sq.marks} marks)</span>}
          </div>
          {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
            renderSubQuestions(sq.sub_sub_questions, level + 1)
          )}
        </div>
      ))}
    </div>
  )
}

// Theory Question Display Component
function TheoryQuestionDisplay({ question, questionNumber }: { question: TheoryQuestion; questionNumber: number }) {
  const questionText = question?.question || question?.question_text || ''
  const marks = question?.marks || question?.points || 10
  
  if (!questionText) {
    return (
      <div className="mb-6 p-5 bg-yellow-50 rounded-xl border border-yellow-200">
        <p className="text-yellow-600">Loading question...</p>
      </div>
    )
  }
  
  return (
    <div className="mb-6 p-5 bg-white rounded-xl border shadow-sm">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-0">
            <Brain className="h-3.5 w-3.5 mr-1" /> Theory Question
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">{marks} marks</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono">Q{questionNumber}</Badge>
      </div>
      
      {question?.image_url && (
        <div className="mb-4">
          <img 
            src={question.image_url} 
            alt={question.image_caption || 'Question diagram'} 
            className="max-w-full max-h-[250px] rounded-lg border object-contain mx-auto shadow-sm" 
          />
          {question.image_caption && (
            <p className="text-xs text-center text-muted-foreground mt-2 italic">{question.image_caption}</p>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <div className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
          <span className="bg-blue-100 w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
          Question {questionNumber}:
        </div>
        <div className="pl-2">
          {renderFullContent(questionText)}
        </div>
      </div>
      
      {question?.sub_questions && question.sub_questions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
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
  // Local state for the answer (independent per question)
  const [localAnswer, setLocalAnswer] = useState(answer || '')

  // Update local state when prop changes (when navigating between questions)
  useEffect(() => {
    setLocalAnswer(answer || '')
  }, [answer, question?.id]) // Reset when question changes

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const filePath = `${examId}/${studentId || 'anonymous'}/${fileName}`

    const { data, error } = await supabase.storage
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
      {/* Display the question with proper formatting */}
      {question && (
        <TheoryQuestionDisplay question={question} questionNumber={questionNumber} />
      )}
      
      {/* Answer area with RichTextEditor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 text-sm font-medium">
            Your Answer
          </Label>
          <Badge variant="outline" className="text-xs text-gray-500">
            You can format your answer, insert images, and create tables
          </Badge>
        </div>

        <RichTextEditor
          content={localAnswer}
          onChange={handleChange}
          placeholder="Type your answer here... Use the toolbar for formatting, images, and tables."
          minHeight="250px"
          maxHeight="500px"
          bucketName="exam-answers"
          folderPath={`${examId}/${studentId || 'anonymous'}`}
          onImageUpload={handleImageUpload}
          key={question?.id} // Force re-render when question changes
        />

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Auto-saved every 30 seconds
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            Your answer will be graded by your teacher
          </span>
        </div>
      </div>
    </div>
  )
}