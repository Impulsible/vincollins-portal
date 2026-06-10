// src/components/student/exam/views/ExamInterface.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuestionNavigation } from '../question/QuestionNavigation'
import { QuestionPalette } from '../palette/QuestionPalette'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import {
  Clock, Send, AlertCircle, Wifi, WifiOff, Save, CheckCircle2, Menu,
  ChevronLeft, ChevronRight, Flag, HelpCircle, Layers, Brain, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import Image from 'next/image'
import { ExamSidebar } from '../sidebar/ExamSidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

// ============ HELPER FUNCTION TO REMOVE MARKS FROM QUESTION TEXT ============
const removeMarksFromText = (text: string): string => {
  if (!text) return ''
  
  // Remove patterns like "Marks: 0.5", "Marks: 1", "Marks: 2", "[10 marks]", etc.
  let cleaned = text
    .replace(/Marks?\s*:\s*\d+(?:\.\d+)?/gi, '')
    .replace(/\[\s*\d+\s*marks?\s*\]/gi, '')
    .replace(/\(\s*\d+\s*marks?\s*\)/gi, '')
    .replace(/\s*\d+\s*marks?\s*$/gi, '')
    .replace(/\n\s*\d+\s*marks?\s*\n/gi, '\n')
    .trim()
  
  // Clean up extra spaces and newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  return cleaned
}

// ============ TABLE CONVERSION WITH TAILWIND CSS ============
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
  html += '</tr></div>'
  return html
}

// ============ RENDER CONTENT WITH MARKS REMOVED ============
const renderContent = (text: string) => {
  if (!text) return null
  
  // Remove marks from the text first
  const cleanedText = removeMarksFromText(text)
  
  // Check for markdown tables
  const tableRegex = /(\n?\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const match = tableRegex.exec(cleanedText)
  
  if (match) {
    const tableLines = match[0].split('\n').filter(line => line.trim())
    const tableHtml = convertTableToHtml(tableLines)
    const remainingText = cleanedText.replace(match[0], '')
    
    return (
      <div className="space-y-4">
        {remainingText && (
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {remainingText}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    )
  }
  
  return (
    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
      {cleanedText}
    </div>
  )
}

// ============ RENDER SUB-QUESTIONS ============
const renderSubQuestions = (subQuestions: any[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null
  
  const startCharCode = level === 0 ? 97 : 105
  
  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : 'ml-4 mt-2'}`}>
      <p className="text-sm font-semibold text-purple-700">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="pl-3 border-l-2 border-purple-200">
          <div className="font-medium text-gray-800">
            {String.fromCharCode(startCharCode + idx)}. {renderContent(sq.text)}
            {sq.marks > 0 && <span className="ml-2 text-xs text-gray-500">({sq.marks} marks)</span>}
          </div>
          {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
            renderSubQuestions(sq.sub_sub_questions, level + 1)
          )}
        </div>
      ))}
    </div>
  )
}

// ============ THEORY QUESTION DISPLAY ============
function TheoryQuestionDisplay({ question, questionNumber }: { question: Question; questionNumber: number }) {
  const rawQuestionText = question.question || question.question_text || ''
  const questionText = removeMarksFromText(rawQuestionText)
  const marks = question.marks || question.points || 10
  
  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
              <Brain className="h-4 w-4 text-purple-700" />
            </div>
            <span className="text-sm font-semibold text-purple-800">Theory Question</span>
            <Badge className="bg-purple-200 text-purple-800 border-0">
              {marks} marks
            </Badge>
          </div>
          <div className="text-sm text-purple-600">
            Q<span className="font-semibold">{questionNumber}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {question.image_url && (
          <div className="mb-5">
            <img 
              src={question.image_url} 
              alt={question.image_caption || 'Question diagram'} 
              className="max-w-full max-h-[250px] rounded-lg border border-gray-200 object-contain mx-auto" 
            />
            {question.image_caption && (
              <p className="text-sm text-center text-gray-500 mt-2">{question.image_caption}</p>
            )}
          </div>
        )}
        
        <div className="mb-5">
          <div className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">?</span>
            Question {questionNumber}:
          </div>
          <div className="pl-3 border-l-3 border-purple-200">
            {renderContent(questionText)}
          </div>
        </div>
        
        {question.sub_questions && question.sub_questions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            {renderSubQuestions(question.sub_questions, 0)}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ OBJECTIVE QUESTION CARD ============
function ObjectiveQuestionCard({ 
  question, 
  questionIndex, 
  answer, 
  onAnswer, 
  marks 
}: { 
  question: any; 
  questionIndex: number; 
  answer: string; 
  onAnswer: (value: string) => void; 
  marks: number;
}) {
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']
  const rawQuestionText = question?.question || question?.question_text || ''
  const questionText = removeMarksFromText(rawQuestionText)
  const options = question?.options || []
  
  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-700" />
            </div>
            <span className="text-sm font-semibold text-blue-800">Multiple Choice</span>
            <Badge className="bg-blue-200 text-blue-800 border-0">
              {marks} mark{marks !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="text-sm text-blue-600">
            Q<span className="font-semibold">{questionIndex + 1}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-800 font-medium leading-relaxed">
            {questionText}
          </p>
        </div>
        
        <div className="space-y-3">
          {options.filter(Boolean).map((option: string, idx: number) => (
            <label
              key={idx}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                answer === option
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answer === option}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAnswer(e.target.value)}
                className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                <span className="font-semibold mr-2 text-gray-900">{optionLetters[idx]}.</span>
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ MAIN EXAM INTERFACE ============
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
  const isWarning = timeLeft < 300
  const isTheory = currentQuestion?.type === 'theory' || 
                   (currentQuestion?.sub_questions && currentQuestion.sub_questions.length > 0)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const isFlagged = currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-gray-300" />
          </div>
          <p className="text-gray-600 text-lg font-medium">No questions available</p>
          <p className="text-gray-400 text-sm mt-2">This exam has no questions yet.</p>
        </div>
      </div>
    )
  }

  const theoryQuestionData = {
    id: currentQuestion.id,
    question: currentQuestion.question || currentQuestion.question_text || '',
    question_text: currentQuestion.question_text || currentQuestion.question || '',
    marks: currentQuestion.marks || currentQuestion.points || 10,
    sub_questions: currentQuestion.sub_questions || [],
    image_url: currentQuestion.image_url,
    image_caption: currentQuestion.image_caption
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ===== TOP BAR ===== */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left Section */}
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setMobileSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              {profile?.photo_url ? (
                <Image src={profile.photo_url} alt="" width={40} height={40} className="rounded-full object-cover ring-2 ring-blue-100" unoptimized />
              ) : (
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{profile?.full_name?.[0] || 'S'}</span>
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{exam?.title}</h1>
                <p className="text-xs text-gray-500 truncate hidden sm:block">{profile?.full_name} • {exam?.subject}</p>
              </div>
            </div>

            {/* Timer Section */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold",
              isWarning ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"
            )}>
              <Clock className={cn("h-4 w-4", isWarning ? "text-red-500" : "text-gray-500")} />
              <span className="text-lg tracking-wide">{formatTime(timeLeft)}</span>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onToggleFlag(currentQuestion.id)}
                className="h-9 px-3"
              >
                <Flag className={cn("h-4 w-4", isFlagged ? "text-amber-500 fill-amber-500" : "text-gray-400")} />
                <span className="hidden sm:inline ml-1 text-xs">Flag</span>
              </Button>
              
              <Button 
                size="sm" 
                onClick={onSubmit} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-lg shadow-sm"
              >
                <Send className="h-4 w-4 mr-1.5" /> Submit
              </Button>
            </div>
          </div>

          {/* Progress Bar Section */}
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progressPercentage} className="h-1.5 flex-1" />
            <span className="text-xs text-gray-500 font-medium tabular-nums">
              {answeredCount}/{allQuestions.length}
            </span>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Question Area */}
          <div className="flex-1 min-w-0">
            {isTheory ? (
              <TheoryAnswer
                answer={answers[currentQuestion.id] || ''}
                onChange={(value: string) => onUpdateAnswer(currentQuestion.id, value)}
                examId={exam?.id || ''}
                studentId={profile?.id}
                question={theoryQuestionData}
                questionNumber={currentIndex + 1}
              />
            ) : (
              <ObjectiveQuestionCard
                question={currentQuestion}
                questionIndex={currentIndex}
                answer={answers[currentQuestion.id] || ''}
                onAnswer={(value: string) => onUpdateAnswer(currentQuestion.id, value)}
                marks={currentQuestion.marks || 0.5}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => onNavigate('prev')}
                disabled={currentIndex === 0}
                className="flex-1 h-11 rounded-lg border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={onTogglePalette}
                className="h-11 px-4 rounded-lg border-gray-300 hover:bg-gray-50"
              >
                <Layers className="h-4 w-4" />
              </Button>
              
              <Button
                variant={currentIndex === allQuestions.length - 1 ? "default" : "outline"}
                onClick={() => {
                  if (currentIndex === allQuestions.length - 1) {
                    onSubmit()
                  } else {
                    onNavigate('next')
                  }
                }}
                className={cn(
                  "flex-1 h-11 rounded-lg",
                  currentIndex === allQuestions.length - 1 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "border-gray-300 hover:bg-gray-50"
                )}
              >
                {currentIndex === allQuestions.length - 1 ? (
                  <>Submit <Send className="h-4 w-4 ml-2" /></>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>

            {/* Question Palette */}
            {showQuestionPalette && (
              <div className="mt-6">
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

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0">
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
        <SheetContent side="right" className="w-[85vw] max-w-[320px] p-0">
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