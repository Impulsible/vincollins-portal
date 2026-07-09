'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import {
  Clock, Send, AlertCircle, Wifi, WifiOff, Save,
  CheckCircle2, Menu, ChevronLeft, ChevronRight,
  Flag, Layers, Brain, FileText, BookOpen, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import Image from 'next/image'
import { ExamSidebar } from '../sidebar/ExamSidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { QuestionPalette } from '../palette/QuestionPalette'
import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const removeMarksFromText = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/Marks?\s*:\s*\d+(?:\.\d+)?/gi, '')
    .replace(/\[\s*\d+\s*marks?\s*\]/gi, '')
    .replace(/\(\s*\d+\s*marks?\s*\)/gi, '')
    .replace(/\s*\d+\s*marks?\s*$/gi, '')
    .replace(/\n\s*\d+\s*marks?\s*\n/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const convertTableToHtml = (tableLines: string[]): string => {
  let html = `<div class="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-sm">
    <table class="min-w-full bg-white text-sm">`
  let isHeader = true
  let hasSeparator = false

  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false
      hasSeparator = true
      continue
    }
    if (!line.startsWith('|')) continue
    const cells = line.split('|').filter(c => c.trim() !== '')
    if (!cells.length) continue
    const rowClass = isHeader && !hasSeparator
      ? 'bg-gray-50'
      : 'bg-white hover:bg-blue-50/30 transition-colors'
    html += `<tr class="${rowClass} border-b border-gray-100">`
    cells.forEach(cell => {
      const tag = isHeader && !hasSeparator ? 'th' : 'td'
      const cls = isHeader && !hasSeparator
        ? 'px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-100 last:border-0'
        : 'px-4 py-2.5 text-sm text-gray-700 border-r border-gray-100 last:border-0'
      html += `<${tag} class="${cls}">${cell.trim()}</${tag}>`
    })
    html += '</tr>'
    if (isHeader && hasSeparator) isHeader = false
  }
  html += '</table></div>'
  return html
}

const renderContent = (text: string) => {
  if (!text) return null
  const cleanedText = removeMarksFromText(text)
  const tableRegex = /(\n?\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const match = tableRegex.exec(cleanedText)

  if (match) {
    const tableLines = match[0].split('\n').filter(l => l.trim())
    const tableHtml = convertTableToHtml(tableLines)
    const rest = cleanedText.replace(match[0], '')
    return (
      <div className="space-y-3">
        {rest && <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-[15px]">{rest}</p>}
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    )
  }

  return (
    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-[15px]">
      {cleanedText}
    </p>
  )
}

const renderSubQuestions = (subQuestions: any[], level = 0) => {
  if (!subQuestions?.length) return null
  const startCode = level === 0 ? 97 : 105

  return (
    <div className={cn('space-y-3 mt-3', level > 0 ? 'ml-6' : 'ml-2')}>
      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
        {level === 0 ? 'Sub-questions' : 'Parts'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="flex gap-3 pl-3 border-l-2 border-purple-200">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center mt-0.5">
            {String.fromCharCode(startCode + idx)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-800 leading-relaxed">
              {renderContent(sq.text)}
            </div>
            {sq.marks > 0 && (
              <span className="inline-block mt-1 text-[11px] text-gray-400 font-medium">
                ({sq.marks} mark{sq.marks !== 1 ? 's' : ''})
              </span>
            )}
            {sq.sub_sub_questions?.length > 0 &&
              renderSubQuestions(sq.sub_sub_questions, level + 1)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THEORY QUESTION DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

function TheoryQuestionDisplay({
  question,
  questionNumber,
}: {
  question: Question
  questionNumber: number
}) {
  const questionText = removeMarksFromText(
    question.question || question.question_text || ''
  )
  const marks = question.marks || question.points || 10

  return (
    <div className="rounded-2xl border border-purple-200 shadow-sm overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Theory Question</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
              {marks} marks
            </Badge>
            <span className="text-purple-200 text-xs">Q{questionNumber}</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {question.image_url && (
          <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <img
              src={question.image_url}
              alt={question.image_caption || 'Diagram'}
              className="max-h-[220px] max-w-full rounded-lg object-contain"
            />
            {question.image_caption && (
              <p className="text-xs text-gray-500 text-center">
                Fig: {question.image_caption}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center">
            {questionNumber}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            {renderContent(questionText)}
          </div>
        </div>

        {question.sub_questions && question.sub_questions.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            {renderSubQuestions(question.sub_questions)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTIVE QUESTION CARD
// ─────────────────────────────────────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function ObjectiveQuestionCard({
  question,
  questionIndex,
  answer,
  onAnswer,
  marks,
}: {
  question: any
  questionIndex: number
  answer: string
  onAnswer: (v: string) => void
  marks: number
}) {
  const questionText = removeMarksFromText(
    question?.question || question?.question_text || ''
  )
  const options: string[] = (question?.options || []).filter(Boolean)

  return (
    <div className="rounded-2xl border border-blue-200 shadow-sm overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Multiple Choice</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
              {marks} mark{marks !== 1 ? 's' : ''}
            </Badge>
            <span className="text-blue-200 text-xs">Q{questionIndex + 1}</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
            {questionIndex + 1}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[15px] text-gray-800 font-medium leading-relaxed">
              {questionText}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pl-0 sm:pl-10">
          {options.map((option, idx) => {
            const selected = answer === option
            return (
              <label
                key={idx}
                className={cn(
                  'group flex items-start gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none',
                  selected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                )}
              >
                <div className={cn(
                  'flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 group-hover:border-blue-400'
                )}>
                  {selected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={option}
                  checked={selected}
                  onChange={e => onAnswer(e.target.value)}
                  className="sr-only"
                />
                <span className="text-[14px] leading-relaxed text-gray-700 flex-1">
                  <span className={cn(
                    'font-bold mr-2',
                    selected ? 'text-blue-600' : 'text-gray-400'
                  )}>
                    {OPTION_LETTERS[idx]}.
                  </span>
                  {option}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE STATUS PILL
// ─────────────────────────────────────────────────────────────────────────────

function SaveStatus({
  autoSaving,
  lastSaved,
  isOnline,
}: {
  autoSaving: boolean
  lastSaved: Date | null
  isOnline: boolean
}) {
  const [relativeTime, setRelativeTime] = useState('')

  useEffect(() => {
    const update = () => {
      if (!lastSaved) {
        setRelativeTime('')
        return
      }
      const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (diff < 5) setRelativeTime('just now')
      else if (diff < 60) setRelativeTime(`${diff}s ago`)
      else setRelativeTime(`${Math.floor(diff / 60)}m ago`)
    }
    update()
    const t = setInterval(update, 5000)
    return () => clearInterval(t)
  }, [lastSaved])

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
        <WifiOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    )
  }

  if (autoSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
        <Save className="h-3.5 w-3.5 animate-pulse" />
        <span className="hidden sm:inline">Saving…</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Saved {relativeTime}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <Wifi className="h-3.5 w-3.5" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────────────────────────────────────

function TimerPill({ timeLeft }: { timeLeft: number }) {
  const isWarning = timeLeft < 300
  const isDanger = timeLeft < 60

  return (
    <div className={cn(
      'flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-bold text-sm transition-colors',
      isDanger ? 'bg-red-100 text-red-700 animate-pulse' :
      isWarning ? 'bg-amber-50 text-amber-700' :
      'bg-gray-100 text-gray-700'
    )}>
      <Clock className={cn(
        'h-4 w-4',
        isDanger ? 'text-red-500' :
        isWarning ? 'text-amber-500' :
        'text-gray-500'
      )} />
      <span className="tabular-nums tracking-wider text-base">
        {formatTime(timeLeft)}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION COUNTER PILL
// ─────────────────────────────────────────────────────────────────────────────

function QuestionCounter({
  currentIndex,
  total,
  answeredCount,
}: {
  currentIndex: number
  total: number
  answeredCount: number
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <BookOpen className="h-3.5 w-3.5 text-gray-400" />
      <span className="font-semibold text-gray-800">{currentIndex + 1}</span>
      <span className="text-gray-400">/</span>
      <span>{total}</span>
      <span className="ml-1 hidden sm:inline text-gray-400">
        · <span className="text-emerald-600 font-medium">{answeredCount} done</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXAM INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

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
  exam,
  profile,
  allQuestions,
  currentIndex,
  answers,
  flaggedQuestions,
  answeredCount,
  unansweredCount,
  progressPercentage,
  timeLeft,
  tabSwitches,
  fullscreenExits,
  isOnline,
  autoSaving,
  lastSaved,
  showQuestionPalette,
  onUpdateAnswer,
  onToggleFlag,
  onNavigate,
  onGoToQuestion,
  onTogglePalette,
  onSubmit,
}: ExamInterfaceProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const currentQuestion = allQuestions[currentIndex]
  const isFlagged = currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false
  const isTheory = currentQuestion?.type === 'theory' ||
    (currentQuestion?.sub_questions && currentQuestion.sub_questions.length > 0)
  const isLast = currentIndex === allQuestions.length - 1
  const isFirst = currentIndex === 0

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-gray-300" />
          </div>
          <p className="text-gray-600 text-lg font-semibold">No questions available</p>
          <p className="text-gray-400 text-sm mt-1">This exam has no questions yet.</p>
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
    image_url: currentQuestion.image_url ?? undefined,
    image_caption: currentQuestion.image_caption ?? undefined,
  }

  return (
    <div className="min-h-screen bg-gray-50/80">

      {/* ════════════════════════════════════════════════════════════════════
          TOP BAR
      ════════════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 shrink-0 text-gray-500"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {profile?.photo_url ? (
                <Image
                  src={profile.photo_url}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full object-cover ring-2 ring-blue-100 shrink-0"
                  unoptimized
                />
              ) : (
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm">
                    {profile?.full_name?.[0]?.toUpperCase() || 'S'}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 text-sm sm:text-[15px] truncate leading-tight">
                  {exam?.title}
                </h1>
                <p className="text-[11px] text-gray-400 truncate hidden sm:block">
                  {profile?.full_name} · {exam?.subject}
                </p>
              </div>
            </div>

            <div className="hidden md:flex shrink-0">
              <QuestionCounter
                currentIndex={currentIndex}
                total={allQuestions.length}
                answeredCount={answeredCount}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <SaveStatus autoSaving={autoSaving} lastSaved={lastSaved} isOnline={isOnline} />
              <TimerPill timeLeft={timeLeft} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFlag(currentQuestion.id)}
                className={cn(
                  'h-9 px-2.5 gap-1.5 rounded-lg transition-colors',
                  isFlagged
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Flag className={cn('h-4 w-4', isFlagged && 'fill-amber-500')} />
                <span className="hidden sm:inline text-xs font-medium">
                  {isFlagged ? 'Flagged' : 'Flag'}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={onSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl shadow-sm gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Submit</span>
              </Button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <Progress value={progressPercentage} className="h-1.5 flex-1 bg-gray-100" />
            <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
              {answeredCount}/{allQuestions.length} answered
            </span>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          COMPREHENSION PASSAGE
      ════════════════════════════════════════════════════════════════════ */}
      {exam?.passage_text && (
        <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-4 sm:pt-5">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                📖 Read the passage below and answer the questions
              </span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-serif text-[15px] whitespace-pre-wrap">
              {exam.passage_text}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-5 sm:py-7">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="flex-1 min-w-0 space-y-4">
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

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={() => onNavigate('prev')}
                disabled={isFirst}
                className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 font-medium text-sm disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden xs:inline">Previous</span>
              </Button>

              <Button
                variant="outline"
                onClick={onTogglePalette}
                className={cn(
                  'h-11 px-3.5 rounded-xl border-gray-200 gap-1.5 font-medium text-sm transition-colors',
                  showQuestionPalette
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                )}
                title="Question palette"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Palette</span>
              </Button>

              <Button
                onClick={() => isLast ? onSubmit() : onNavigate('next')}
                className={cn(
                  'flex-1 h-11 rounded-xl gap-2 font-semibold text-sm shadow-sm',
                  isLast
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
              >
                {isLast ? (
                  <>Finish & Submit <Send className="h-4 w-4" /></>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>

            {showQuestionPalette && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Question Palette
                  </span>
                </div>
                <div className="p-3">
                  <QuestionPalette
                    questions={allQuestions}
                    currentIndex={currentIndex}
                    answers={answers}
                    flaggedQuestions={flaggedQuestions}
                    onGoToQuestion={onGoToQuestion}
                  />
                </div>
              </div>
            )}

            <div className="flex md:hidden items-center justify-center gap-2 text-xs text-gray-500">
              <BookOpen className="h-3.5 w-3.5" />
              Question {currentIndex + 1} of {allQuestions.length}
              <span className="text-gray-300">·</span>
              <span className="text-emerald-600 font-medium">{answeredCount} answered</span>
            </div>
          </div>

          <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
            <div className="sticky top-[88px]">
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
          </aside>
        </div>
      </main>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-[340px] p-0 bg-white">
          <div className="h-full overflow-y-auto p-4">
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