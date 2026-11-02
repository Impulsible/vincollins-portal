// src/components/student/exam/views/ExamInterface.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import {
  Clock, Send, AlertCircle, Wifi, WifiOff, Save,
  CheckCircle2, Menu, ChevronLeft, ChevronRight,
  Flag, Layers, Brain, FileText, BookOpen, Sparkles,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import Image from 'next/image'
import { ExamSidebar } from '../sidebar/ExamSidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { QuestionPalette } from '../palette/QuestionPalette'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  let html = `<div class="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm">
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
      ? 'bg-slate-50'
      : 'bg-white hover:bg-indigo-50/30 transition-colors'
    html += `<tr class="${rowClass} border-b border-slate-100">`
    cells.forEach(cell => {
      const tag = isHeader && !hasSeparator ? 'th' : 'td'
      const cls = isHeader && !hasSeparator
        ? 'px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-100 last:border-0'
        : 'px-4 py-2.5 text-sm text-slate-700 border-r border-slate-100 last:border-0'
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
        {rest && <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px]">{rest}</p>}
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    )
  }

  return (
    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px]">
      {cleanedText}
    </p>
  )
}

const renderSubQuestions = (subQuestions: any[], level = 0) => {
  if (!subQuestions?.length) return null
  const startCode = level === 0 ? 97 : 105

  return (
    <div className={cn('space-y-3 mt-3', level > 0 ? 'ml-6' : 'ml-2')}>
      <p className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-[0.14em]">
        {level === 0 ? 'Sub-questions' : 'Parts'}
      </p>
      {subQuestions.map((sq, idx) => (
        <div key={idx} className="flex gap-3 pl-3 border-l-2 border-fuchsia-200">
          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-100 to-purple-100 text-fuchsia-700 text-[11px] font-bold flex items-center justify-center mt-0.5 ring-1 ring-fuchsia-200/60">
            {String.fromCharCode(startCode + idx)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-800 leading-relaxed">
              {renderContent(sq.text)}
            </div>
            {sq.marks > 0 && (
              <span className="inline-block mt-1.5 text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-md bg-slate-100">
                {sq.marks} mark{sq.marks !== 1 ? 's' : ''}
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
  const objectiveQuestionText = removeMarksFromText(
    question?.question || question?.question_text || ''
  )
  const options: string[] = (question?.options || []).filter(Boolean)

  return (
    <div className="relative rounded-3xl border border-indigo-200/70 shadow-sm overflow-hidden bg-white">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-5 py-4 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-violet-300/20 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center shadow-lg">
              <FileText className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/70 uppercase tracking-[0.14em]">Objective</div>
              <div className="text-sm font-semibold text-white leading-tight">Multiple Choice</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs font-bold ring-1 ring-white/20">
              {marks} mark{marks !== 1 ? 's' : ''}
            </Badge>
            <div className="px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-sm">
              <span className="text-white text-[11px] font-bold">Q{questionIndex + 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shadow-md shadow-indigo-500/30">
            {questionIndex + 1}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[15px] text-slate-800 font-medium leading-relaxed">
              {objectiveQuestionText}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pl-0 sm:pl-11">
          {options.map((option, idx) => {
            const selected = answer === option
            return (
              <motion.label
                key={idx}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'group relative flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none overflow-hidden',
                  selected
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50/50 shadow-md shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 bg-white'
                )}
              >
                {selected && (
                  <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-blue-500" />
                )}
                <div className={cn(
                  'flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  selected
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500 shadow-sm'
                    : 'border-slate-300 group-hover:border-indigo-400 bg-white'
                )}>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-white"
                    />
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
                <div className="flex-1 flex items-start gap-2.5">
                  <span className={cn(
                    'flex-shrink-0 h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all',
                    selected
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                  )}>
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className={cn(
                    'text-[14px] leading-relaxed pt-1 transition-colors',
                    selected ? 'text-slate-900 font-medium' : 'text-slate-700'
                  )}>
                    {option}
                  </span>
                </div>
              </motion.label>
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
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold ring-1 ring-rose-200">
        <WifiOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    )
  }

  if (autoSaving) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold ring-1 ring-amber-200">
        <Save className="h-3.5 w-3.5 animate-pulse" />
        <span className="hidden sm:inline">Saving…</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Saved {relativeTime}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs">
      <Wifi className="h-3.5 w-3.5" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER PILL — pure display, driven by timeLeft prop
// ─────────────────────────────────────────────────────────────────────────────

function TimerPill({ timeLeft }: { timeLeft: number }) {
  const isWarning = timeLeft < 300
  const isDanger = timeLeft < 60

  return (
    <div className={cn(
      'relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-bold text-sm transition-all overflow-hidden ring-1',
      isDanger ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-rose-300 shadow-lg shadow-rose-500/30 animate-pulse' :
      isWarning ? 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 ring-amber-200 shadow-sm' :
      'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 ring-slate-200'
    )}>
      <Clock className={cn(
        'h-4 w-4 shrink-0',
        isDanger ? 'text-white' :
        isWarning ? 'text-amber-600' :
        'text-slate-500'
      )} />
      <span className="tabular-nums tracking-wider text-[15px]">
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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/70 ring-1 ring-slate-200">
      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-xs tabular-nums">
        <span className="font-bold text-slate-900">{currentIndex + 1}</span>
        <span className="text-slate-400 mx-1">/</span>
        <span className="text-slate-600">{total}</span>
      </span>
      <div className="h-3 w-px bg-slate-300" />
      <span className="text-[11px] text-emerald-600 font-semibold tabular-nums">
        {answeredCount} done
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="relative h-24 w-24 mx-auto mb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl blur-xl opacity-40" />
            <div className="relative h-24 w-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center ring-1 ring-slate-200">
              <AlertCircle className="h-11 w-11 text-slate-400" />
            </div>
          </div>
          <p className="text-slate-900 text-lg font-bold">No questions available</p>
          <p className="text-slate-500 text-sm mt-1.5">This exam has no questions yet.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

      {/* TOP BAR */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 shrink-0 text-slate-500 hover:bg-slate-100 rounded-xl"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-md opacity-40" />
                {profile?.photo_url ? (
                  <Image
                    src={profile.photo_url}
                    alt=""
                    width={38}
                    height={38}
                    className="relative rounded-full object-cover ring-2 ring-white shadow-md"
                    unoptimized
                  />
                ) : (
                  <div className="relative h-[38px] w-[38px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                    <span className="text-white font-bold text-sm">
                      {profile?.full_name?.[0]?.toUpperCase() || 'S'}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-sm sm:text-[15px] truncate leading-tight">
                  {exam?.title}
                </h1>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block mt-0.5">
                  <span className="font-medium">{profile?.full_name}</span>
                  <span className="text-slate-300 mx-1.5">·</span>
                  {exam?.subject}
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
              {/* ⏱️ Timer receives timeLeft from page.tsx — no local timer state here */}
              <TimerPill timeLeft={timeLeft} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFlag(currentQuestion.id)}
                className={cn(
                  'h-9 px-2.5 gap-1.5 rounded-xl transition-all',
                  isFlagged
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 ring-1 ring-amber-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                )}
              >
                <Flag className={cn('h-4 w-4', isFlagged && 'fill-amber-500 text-amber-600')} />
                <span className="hidden sm:inline text-xs font-semibold">
                  {isFlagged ? 'Flagged' : 'Flag'}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={onSubmit}
                className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white h-9 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-500/30 gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Submit</span>
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="relative flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full shadow-sm"
              />
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums shrink-0 font-medium">
              {answeredCount}/{allQuestions.length}
            </span>
          </div>
        </div>
      </header>

      {/* COMPREHENSION PASSAGE */}
      {exam?.passage_text && (
        <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-4 sm:pt-5">
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 shadow-sm">
            <div className="absolute -top-16 -right-16 h-40 w-40 bg-orange-200/40 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 bg-amber-200/40 rounded-full blur-3xl" />
            <div className="relative p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/30">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.14em]">Reading Passage</div>
                  <div className="text-xs text-amber-900/80 font-medium">Read carefully then answer the questions</div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-serif text-[15px] whitespace-pre-wrap bg-white/60 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-amber-100">
                {exam.passage_text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-5 sm:py-7">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="flex-1 min-w-0 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
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
              </motion.div>
            </AnimatePresence>

            {/* Navigation controls */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={() => onNavigate('prev')}
                disabled={isFirst}
                className="flex-1 h-12 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 gap-2 font-semibold text-sm disabled:opacity-40 shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden xs:inline">Previous</span>
              </Button>

              <Button
                variant="outline"
                onClick={onTogglePalette}
                className={cn(
                  'h-12 px-4 rounded-2xl gap-1.5 font-semibold text-sm transition-all shadow-sm',
                  showQuestionPalette
                    ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
                title="Question palette"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Palette</span>
              </Button>

              <Button
                onClick={() => isLast ? onSubmit() : onNavigate('next')}
                className={cn(
                  'flex-1 h-12 rounded-2xl gap-2 font-bold text-sm shadow-md transition-all',
                  isLast
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white shadow-indigo-500/30'
                )}
              >
                {isLast ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Finish & Submit
                  </>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>

            {/* Question Palette expand panel */}
            <AnimatePresence>
              {showQuestionPalette && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                        <Layers className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Question Palette
                      </span>
                    </div>
                    <div className="p-4">
                      <QuestionPalette
                        questions={allQuestions}
                        currentIndex={currentIndex}
                        answers={answers}
                        flaggedQuestions={flaggedQuestions}
                        onGoToQuestion={onGoToQuestion}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile question info */}
            <div className="flex md:hidden items-center justify-center gap-2 text-xs text-slate-500 py-2">
              <Circle className="h-2 w-2 fill-indigo-500 text-indigo-500" />
              <span>Question <span className="font-bold text-slate-700">{currentIndex + 1}</span> of {allQuestions.length}</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-600 font-semibold">{answeredCount} answered</span>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
            <div className="sticky top-[94px]">
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

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-[340px] p-0 bg-gradient-to-br from-slate-50 to-white">
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
