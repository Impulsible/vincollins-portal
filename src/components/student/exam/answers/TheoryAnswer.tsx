// src/components/student/exam/answers/TheoryAnswer.tsx
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, Brain, Table as TableIcon, Image as ImageIcon } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

interface TheoryQuestion {
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

interface TheoryAnswerProps {
  answer: string
  onChange: (content: string) => void
  examId: string
  studentId?: string
  question?: TheoryQuestion // Add the question prop to display the question
  questionNumber?: number // Add question number
}

// ============ HELPER FUNCTIONS FOR RENDERING THEORY QUESTIONS ============

// Convert markdown table to HTML with Tailwind CSS classes
const convertTableToHtml = (tableLines: string[]): string => {
  let html = `
    <div class="overflow-x-auto my-4 shadow-lg rounded-xl border border-gray-200">
      <table class="min-w-full bg-white rounded-xl">
  `
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
      
      let rowClass = ''
      if (isHeader && !hasSeparator) {
        rowClass = 'bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300'
      } else {
        rowClass = 'bg-white hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200'
      }
      
      html += `<tr class="${rowClass}">`
      
      cells.forEach((cell: string, idx: number) => {
        const tag = isHeader && !hasSeparator ? 'th' : 'td'
        
        if (isHeader && !hasSeparator) {
          html += `<${tag} class="px-5 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300 last:border-r-0">${cell.trim()}</${tag}>`
        } else {
          html += `<${tag} class="px-5 py-3 text-sm text-gray-600 border-r border-gray-200 last:border-r-0">${cell.trim()}</${tag}>`
        }
      })
      
      html += '</table>'
      
      if (isHeader && hasSeparator) {
        isHeader = false
      }
    }
  }
  
  html += `
      </table>
    </div>
  `
  
  return html
}

// Enhanced content renderer with proper table detection
const renderContent = (text: string) => {
  if (!text) return null
  
  const lines = text.split('\n')
  let tableLines: string[] = []
  let inTable = false
  let tableStartIndex = -1
  let result: JSX.Element[] = []
  let currentIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const isTableRow = line.startsWith('|') && line.includes('|') && line.split('|').length >= 3
    
    if (isTableRow) {
      if (!inTable) {
        inTable = true
        tableStartIndex = i
      }
      tableLines.push(line)
    } else if (inTable && !isTableRow) {
      if (tableLines.length >= 2) {
        const tableHtml = convertTableToHtml(tableLines)
        
        if (tableStartIndex > currentIndex) {
          const beforeText = lines.slice(currentIndex, tableStartIndex).join('\n')
          if (beforeText.trim()) {
            result.push(
              <div key={`text-before-${currentIndex}`} className="whitespace-pre-wrap mb-3">
                {beforeText.split('\n').map((line, idx) => {
                  if (line.match(/^\d+\./)) {
                    return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
                  }
                  if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                    return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
                  }
                  if (line.match(/^\(?[ivx]+\)?\./i)) {
                    return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
                  }
                  if (line === '') return <br key={idx} />
                  return <p key={idx} className="mb-1">{line}</p>
                })}
              </div>
            )
          }
        }
        
        result.push(
          <div key={`table-${currentIndex}`} dangerouslySetInnerHTML={{ __html: tableHtml }} />
        )
        
        currentIndex = i
      }
      inTable = false
      tableLines = []
    }
  }
  
  if (inTable && tableLines.length >= 2) {
    const tableHtml = convertTableToHtml(tableLines)
    
    if (tableStartIndex > currentIndex) {
      const beforeText = lines.slice(currentIndex, tableStartIndex).join('\n')
      if (beforeText.trim()) {
        result.push(
          <div key={`text-before-final`} className="whitespace-pre-wrap mb-3">
            {beforeText.split('\n').map((line, idx) => {
              if (line.match(/^\d+\./)) {
                return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
              }
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
              }
              if (line === '') return <br key={idx} />
              return <p key={idx} className="mb-1">{line}</p>
            })}
          </div>
        )
      }
    }
    
    result.push(
      <div key={`table-final`} dangerouslySetInnerHTML={{ __html: tableHtml }} />
    )
    
    if (currentIndex + tableLines.length < lines.length) {
      const afterText = lines.slice(currentIndex + tableLines.length).join('\n')
      if (afterText.trim()) {
        result.push(
          <div key={`text-after-final`} className="whitespace-pre-wrap mt-3">
            {afterText.split('\n').map((line, idx) => {
              if (line.match(/^\d+\./)) {
                return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
              }
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
              }
              if (line === '') return <br key={idx} />
              return <p key={idx} className="mb-1">{line}</p>
            })}
          </div>
        )
      }
    }
    
    return <>{result}</>
  }
  
  if (result.length > 0) {
    return <>{result}</>
  }
  
  const imageMatch = text.match(/!\[(.*?)\]\((.*?)\)/)
  if (imageMatch) {
    return (
      <div className="my-3">
        <img src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full rounded-lg border mx-auto max-h-[200px] object-contain" />
        {imageMatch[1] && <p className="text-xs text-center text-muted-foreground mt-1">{imageMatch[1]}</p>}
      </div>
    )
  }
  
  const hasEquation = /[\d\+\-\*\/\(\)=]|x\^2|y\^2|√|∑|∫|π|θ|α|β|γ/.test(text)
  if (hasEquation && !text.includes('<table')) {
    return (
      <span className="font-mono text-sm" dangerouslySetInnerHTML={{ 
        __html: text
          .replace(/x\^2/g, 'x²')
          .replace(/y\^2/g, 'y²')
          .replace(/\n/g, '<br/>')
      }} />
    )
  }
  
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {text.split('\n').map((line, idx) => {
        if (line.match(/^\d+\./)) {
          return <p key={idx} className="mb-2 font-semibold text-blue-700">{line}</p>
        }
        if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
          return <p key={idx} className="mb-1 ml-4 text-gray-700">{line}</p>
        }
        if (line.match(/^\(?[ivx]+\)?\./i)) {
          return <p key={idx} className="mb-1 ml-8 text-purple-600">{line}</p>
        }
        if (line === '') return <br key={idx} />
        return <p key={idx} className="mb-1">{line}</p>
      })}
    </div>
  )
}

// Render sub-questions recursively
const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null
  
  const startCharCode = level === 0 ? 97 : 105
  
  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : 'ml-4 mt-2'}`}>
      <p className="text-xs font-semibold text-purple-700">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="pl-3 border-l-2 border-purple-200">
          <div className="font-medium">
            <span className="text-sm">{String.fromCharCode(startCharCode + idx)}.</span>
            <div className="inline ml-1 text-sm">{renderContent(sq.text)}</div>
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
  return (
    <div className="mb-6 p-5 bg-white rounded-xl border shadow-sm">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-0">
            <Brain className="h-3.5 w-3.5 mr-1" /> Theory Question
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">{question.marks} marks</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono">Q{questionNumber}</Badge>
      </div>
      
      {question.image_url && (
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
          {renderContent(question.question)}
        </div>
      </div>
      
      {question.sub_questions && question.sub_questions.length > 0 && (
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

  return (
    <div className="space-y-4">
      {/* Display the question with proper formatting */}
      {question && (
        <TheoryQuestionDisplay question={question} questionNumber={questionNumber} />
      )}
      
      {/* Answer area */}
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
          content={answer}
          onChange={onChange}
          placeholder="Type your answer here... Use the toolbar for formatting, images, and tables."
          minHeight="250px"
          maxHeight="500px"
          bucketName="exam-answers"
          folderPath={`${examId}/${studentId || 'anonymous'}`}
          onImageUpload={handleImageUpload}
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