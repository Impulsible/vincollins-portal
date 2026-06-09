// src/components/student/exam/views/ExamInterface.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuestionNavigation } from '../question/QuestionNavigation'
import { QuestionPalette } from '../palette/QuestionPalette'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import {
  Clock, Send, AlertCircle, Wifi, WifiOff, Save, CheckCircle2, Brain, Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import Image from 'next/image'
import { ExamSidebar } from '../sidebar/ExamSidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

// ============ TYPES ============
interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

interface TheoryQuestion {
  id: string
  type: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

// ============ HELPER FUNCTIONS FOR RENDERING THEORY QUESTIONS ============

// Convert markdown table to HTML with Tailwind CSS classes - Responsive
const convertTableToHtml = (tableLines: string[]): string => {
  let html = `
    <div class="overflow-x-auto my-3 sm:my-4 shadow-md sm:shadow-lg rounded-lg sm:rounded-xl border border-gray-200">
      <table class="min-w-full bg-white rounded-lg sm:rounded-xl">
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
          html += `<${tag} class="px-2 sm:px-3 md:px-5 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-300 last:border-r-0">${cell.trim()}</${tag}>`
        } else {
          html += `<${tag} class="px-2 sm:px-3 md:px-5 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 border-r border-gray-200 last:border-r-0">${cell.trim()}</${tag}>`
        }
      })
      
      html += '</tr>'
      
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
              <div key={`text-before-${currentIndex}`} className="whitespace-pre-wrap mb-2 sm:mb-3 text-xs sm:text-sm">
                {beforeText.split('\n').map((line, idx) => {
                  if (line.match(/^\d+\./)) {
                    return <p key={idx} className="mb-1 sm:mb-2 font-semibold text-blue-700 text-sm sm:text-base">{line}</p>
                  }
                  if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                    return <p key={idx} className="mb-0.5 sm:mb-1 ml-2 sm:ml-4 text-gray-700 text-xs sm:text-sm">{line}</p>
                  }
                  if (line.match(/^\(?[ivx]+\)?\./i)) {
                    return <p key={idx} className="mb-0.5 sm:mb-1 ml-4 sm:ml-8 text-purple-600 text-xs sm:text-sm">{line}</p>
                  }
                  if (line === '') return <br key={idx} />
                  return <p key={idx} className="mb-0.5 sm:mb-1 text-xs sm:text-sm">{line}</p>
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
          <div key={`text-before-final`} className="whitespace-pre-wrap mb-2 sm:mb-3 text-xs sm:text-sm">
            {beforeText.split('\n').map((line, idx) => {
              if (line.match(/^\d+\./)) {
                return <p key={idx} className="mb-1 sm:mb-2 font-semibold text-blue-700 text-sm sm:text-base">{line}</p>
              }
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-0.5 sm:mb-1 ml-2 sm:ml-4 text-gray-700 text-xs sm:text-sm">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-0.5 sm:mb-1 ml-4 sm:ml-8 text-purple-600 text-xs sm:text-sm">{line}</p>
              }
              if (line === '') return <br key={idx} />
              return <p key={idx} className="mb-0.5 sm:mb-1 text-xs sm:text-sm">{line}</p>
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
          <div key={`text-after-final`} className="whitespace-pre-wrap mt-2 sm:mt-3 text-xs sm:text-sm">
            {afterText.split('\n').map((line, idx) => {
              if (line.match(/^\d+\./)) {
                return <p key={idx} className="mb-1 sm:mb-2 font-semibold text-blue-700 text-sm sm:text-base">{line}</p>
              }
              if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
                return <p key={idx} className="mb-0.5 sm:mb-1 ml-2 sm:ml-4 text-gray-700 text-xs sm:text-sm">{line}</p>
              }
              if (line.match(/^\(?[ivx]+\)?\./i)) {
                return <p key={idx} className="mb-0.5 sm:mb-1 ml-4 sm:ml-8 text-purple-600 text-xs sm:text-sm">{line}</p>
              }
              if (line === '') return <br key={idx} />
              return <p key={idx} className="mb-0.5 sm:mb-1 text-xs sm:text-sm">{line}</p>
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
      <div className="my-2 sm:my-3">
        <img src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full rounded-lg border mx-auto max-h-[150px] sm:max-h-[200px] object-contain" />
        {imageMatch[1] && <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">{imageMatch[1]}</p>}
      </div>
    )
  }
  
  const hasEquation = /[\d\+\-\*\/\(\)=]|x\^2|y\^2|√|∑|∫|π|θ|α|β|γ/.test(text)
  if (hasEquation && !text.includes('<table')) {
    return (
      <span className="font-mono text-xs sm:text-sm" dangerouslySetInnerHTML={{ 
        __html: text
          .replace(/x\^2/g, 'x²')
          .replace(/y\^2/g, 'y²')
          .replace(/\n/g, '<br/>')
      }} />
    )
  }
  
  return (
    <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
      {text.split('\n').map((line, idx) => {
        if (line.match(/^\d+\./)) {
          return <p key={idx} className="mb-1 sm:mb-2 font-semibold text-blue-700 text-sm sm:text-base">{line}</p>
        }
        if (line.match(/^[a-z]\./i) || line.match(/^\([a-z]\)/i)) {
          return <p key={idx} className="mb-0.5 sm:mb-1 ml-2 sm:ml-4 text-gray-700 text-xs sm:text-sm">{line}</p>
        }
        if (line.match(/^\(?[ivx]+\)?\./i)) {
          return <p key={idx} className="mb-0.5 sm:mb-1 ml-4 sm:ml-8 text-purple-600 text-xs sm:text-sm">{line}</p>
        }
        if (line === '') return <br key={idx} />
        return <p key={idx} className="mb-0.5 sm:mb-1 text-xs sm:text-sm">{line}</p>
      })}
    </div>
  )
}

// Render sub-questions recursively - Responsive
const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null
  
  const startCharCode = level === 0 ? 97 : 105
  
  return (
    <div className={`space-y-1.5 sm:space-y-2 ${level > 0 ? 'ml-3 sm:ml-6 mt-1 sm:mt-2' : 'ml-2 sm:ml-4 mt-1 sm:mt-2'}`}>
      <p className="text-[10px] sm:text-xs font-semibold text-purple-700">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="pl-2 sm:pl-3 border-l-2 border-purple-200">
          <div className="font-medium">
            <span className="text-xs sm:text-sm">{String.fromCharCode(startCharCode + idx)}.</span>
            <div className="inline ml-1 text-xs sm:text-sm">{renderContent(sq.text)}</div>
            {sq.marks > 0 && <span className="ml-1 sm:ml-2 text-[9px] sm:text-xs text-muted-foreground">({sq.marks} marks)</span>}
          </div>
          {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
            renderSubQuestions(sq.sub_sub_questions, level + 1)
          )}
        </div>
      ))}
    </div>
  )
}

// Theory Question Display Component - Responsive
function TheoryQuestionDisplay({ question, questionNumber }: { question: TheoryQuestion; questionNumber: number }) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl border shadow-sm">
      <div className="flex flex-wrap justify-between items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
            <Brain className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> Theory
          </Badge>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{question.marks} marks</span>
        </div>
        <Badge variant="outline" className="text-[9px] sm:text-xs font-mono">Q{questionNumber}</Badge>
      </div>
      
      {question.image_url && (
        <div className="mb-3 sm:mb-4">
          <img 
            src={question.image_url} 
            alt={question.image_caption || 'Question diagram'} 
            className="max-w-full max-h-[180px] sm:max-h-[250px] rounded-lg border object-contain mx-auto shadow-sm" 
          />
          {question.image_caption && (
            <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1 sm:mt-2 italic">{question.image_caption}</p>
          )}
        </div>
      )}
      
      <div className="mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm font-semibold text-blue-600 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
          <span className="bg-blue-100 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs">?</span>
          Question {questionNumber}:
        </div>
        <div className="pl-1 sm:pl-2">
          {renderContent(question.question)}
        </div>
      </div>
      
      {question.sub_questions && question.sub_questions.length > 0 && (
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
          {renderSubQuestions(question.sub_questions, 0)}
        </div>
      )}
    </div>
  )
}

// Objective Question Card Component - Responsive
function ObjectiveQuestionCard({ question, questionIndex, answer, onAnswer, marks }: any) {
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']
  
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-3 sm:p-6">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3 sm:mb-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs">
            Objective Question
          </Badge>
          <span className="text-[10px] sm:text-sm text-slate-500">{marks} marks</span>
        </div>
        
        <div className="mb-3 sm:mb-6">
          <div className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-3 text-blue-600">
            Question {questionIndex + 1}:
          </div>
          <p className="text-xs sm:text-base text-slate-700">{question.question}</p>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {question.options?.map((option: string, idx: number) => (
            <label
              key={idx}
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-lg border-2 cursor-pointer transition-all text-xs sm:text-base",
                answer === option
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswer(e.target.value)}
                className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-base">
                <span className="font-semibold mr-1 sm:mr-2">{optionLetters[idx]}.</span>
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ExamInterfaceProps {
  exam: Exam | null
  profile: StudentProfile | null
  allQuestions: Question[]
  currentIndex: number
  answers: Record<string, string>
  flaggedQuestions: Set<string>
  answeredCount: number
  unansweredCount: number
  progressPercentage: number
  timeLeft: number
  tabSwitches: number
  fullscreenExits: number
  isOnline: boolean
  autoSaving: boolean
  lastSaved: Date | null
  showQuestionPalette: boolean
  onUpdateAnswer: (questionId: string, value: string) => void
  onToggleFlag: (questionId: string) => void
  onNavigate: (direction: 'prev' | 'next') => void
  onGoToQuestion: (index: number) => void
  onTogglePalette: () => void
  onSubmit: () => void
}

export function ExamInterface({
  exam, profile, allQuestions, currentIndex, answers, flaggedQuestions,
  answeredCount, unansweredCount, progressPercentage, timeLeft,
  tabSwitches, fullscreenExits, isOnline, autoSaving, lastSaved,
  showQuestionPalette, onUpdateAnswer, onToggleFlag, onNavigate,
  onGoToQuestion, onTogglePalette, onSubmit,
}: ExamInterfaceProps) {
  const currentQuestion = allQuestions[currentIndex]
  const isFlagged = currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false
  const isWarning = timeLeft < 300
  const isTheory = currentQuestion?.type === 'theory'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-4 sm:p-8">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
          </div>
          <p className="text-lg sm:text-xl text-slate-500 font-semibold">No questions available</p>
          <p className="text-sm sm:text-base text-slate-400 mt-2">This exam has no questions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      
      {/* ===== TOP BAR - Responsive ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Student + Exam info */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {profile?.photo_url ? (
                <Image src={profile.photo_url} alt="" width={32} height={32} className="rounded-lg sm:rounded-xl object-cover shrink-0 ring-2 ring-blue-100 sm:w-10 sm:h-10" unoptimized />
              ) : (
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ring-2 ring-blue-50">
                  <span className="text-blue-600 font-bold text-sm sm:text-base">{profile?.full_name?.[0] || 'S'}</span>
                </div>
              )}
              <div className="min-w-0 hidden xs:block">
                <p className="text-xs sm:text-base font-semibold text-slate-800 truncate leading-tight">{exam?.title}</p>
                <p className="text-[10px] sm:text-sm text-slate-400 truncate hidden sm:block">{profile?.full_name} • {exam?.subject}</p>
              </div>
            </div>

            {/* Center: Timer */}
            <div className={cn(
              "flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-5 py-1 sm:py-2 rounded-lg sm:rounded-xl font-mono text-base sm:text-2xl font-bold",
              isWarning 
                ? "bg-red-50 text-red-600 animate-pulse shadow-sm" 
                : "bg-slate-100 text-slate-700"
            )}>
              <Clock className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", isWarning ? "text-red-500" : "text-slate-400")} />
              <span className="text-sm sm:text-2xl">{formatTime(timeLeft)}</span>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Network Badge - hide on mobile */}
              {isOnline ? (
                <Badge variant="outline" className="hidden md:inline-flex bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] sm:text-xs gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5">
                  <Wifi className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> Online
                </Badge>
              ) : (
                <Badge variant="outline" className="hidden md:inline-flex bg-red-50 text-red-600 border-red-200 text-[10px] sm:text-xs gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2.5">
                  <WifiOff className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> Offline
                </Badge>
              )}
              
              {/* Auto-save badge */}
              {autoSaving ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] sm:text-xs gap-0.5 sm:gap-1.5 py-0.5 sm:py-1 px-1 sm:px-2.5">
                  <Save className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 animate-pulse" /> <span className="hidden sm:inline">Saving</span>
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="hidden sm:inline-flex bg-emerald-50 text-emerald-600 border-emerald-200 text-xs gap-1.5 py-1 px-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </Badge>
              ) : null}

              {/* Security counters - hide on mobile */}
              <div className="hidden md:flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 font-medium">
                <span className={cn(tabSwitches > 0 && "text-amber-500 font-semibold")}>Tab:{tabSwitches}/3</span>
                <span className="text-slate-300">•</span>
                <span className={cn(fullscreenExits > 0 && "text-amber-500 font-semibold")}>FS:{fullscreenExits}/3</span>
              </div>

              {/* Submit Button */}
              <Button size="sm" onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white h-7 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm font-semibold rounded-md sm:rounded-lg shadow-sm">
                <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1.5" /> <span className="hidden xs:inline">Submit</span>
              </Button>
            </div>
          </div>

          {/* Progress Bar - Responsive */}
          <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3">
            <Progress value={progressPercentage} className="h-1.5 sm:h-2 flex-1" />
            <span className="text-[10px] sm:text-sm text-slate-500 whitespace-nowrap tabular-nums font-medium">
              {answeredCount}/{allQuestions.length}
            </span>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT - Responsive Layout ===== */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 md:px-6 py-3 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          
          {/* Question Area - Takes full width on mobile/tablet */}
          <div className="flex-1 min-w-0 space-y-3 sm:space-y-5">
            {isTheory ? (
              // Theory Question - Display with full formatting
              <>
                <TheoryQuestionDisplay 
                  question={currentQuestion as TheoryQuestion}
                  questionNumber={currentIndex + 1}
                />
                <TheoryAnswer
                  answer={answers[currentQuestion.id] || ''}
                  onChange={(value) => onUpdateAnswer(currentQuestion.id, value)}
                  examId={exam?.id || ''}
                  studentId={profile?.id}
                  question={currentQuestion as TheoryQuestion}
                  questionNumber={currentIndex + 1}
                />
              </>
            ) : (
              // Objective Question
              <ObjectiveQuestionCard
                question={currentQuestion}
                questionIndex={currentIndex}
                answer={answers[currentQuestion.id] || ''}
                onAnswer={(value: string) => onUpdateAnswer(currentQuestion.id, value)}
                marks={currentQuestion.marks}
              />
            )}

            <QuestionNavigation
              currentIndex={currentIndex}
              totalQuestions={allQuestions.length}
              onPrevious={() => onNavigate('prev')}
              onNext={() => onNavigate('next')}
              onTogglePalette={onTogglePalette}
              onSubmit={onSubmit}
            />

            {showQuestionPalette && (
              <div className="animate-in slide-in-from-bottom-2 duration-200">
                <QuestionPalette
                  questions={allQuestions}
                  currentIndex={currentIndex}
                  answers={answers}
                  flaggedQuestions={flaggedQuestions}
                  onGoToQuestion={onGoToQuestion}
                />
              </div>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, shown in drawer, visible on lg screens */}
          <div className="hidden lg:block xl:w-72 w-64 shrink-0">
            <ExamSidebar
              profile={profile}
              exam={exam}
              answeredCount={answeredCount}
              flaggedCount={flaggedQuestions.size}
              unansweredCount={unansweredCount}
              progressPercentage={progressPercentage}
              tabSwitches={tabSwitches}
              fullscreenExits={fullscreenExits}
              isOnline={isOnline}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-[320px] p-0 bg-[#F8FAFC]">
          <div className="p-4">
            <ExamSidebar
              profile={profile}
              exam={exam}
              answeredCount={answeredCount}
              flaggedCount={flaggedQuestions.size}
              unansweredCount={unansweredCount}
              progressPercentage={progressPercentage}
              tabSwitches={tabSwitches}
              fullscreenExits={fullscreenExits}
              isOnline={isOnline}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}