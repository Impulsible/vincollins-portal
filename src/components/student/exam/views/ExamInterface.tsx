// src/components/student/exam/views/ExamInterface.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from '../question/QuestionCard'
import { QuestionNavigation } from '../question/QuestionNavigation'
import { QuestionPalette } from '../palette/QuestionPalette'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import {
  Clock, Send, Flag, Grid, AlertCircle,
  Wifi, WifiOff, Save, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import Image from 'next/image'
import { ExamSidebar } from '../sidebar/ExamSidebar'

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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-slate-500 text-lg font-medium">No questions available</p>
          <p className="text-slate-400 text-sm mt-1">This exam has no questions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      
      {/* ===== TOP BAR ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Student + Exam info */}
            <div className="flex items-center gap-3 min-w-0">
              {profile?.photo_url ? (
                <Image src={profile.photo_url} alt="" width={36} height={36} className="rounded-lg object-cover shrink-0" unoptimized />
              ) : (
                <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-blue-600 font-bold text-sm">{profile?.full_name?.[0] || 'S'}</span>
                </div>
              )}
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 truncate">{exam?.title}</p>
                <p className="text-xs text-slate-400 truncate">{profile?.full_name} • {exam?.subject}</p>
              </div>
            </div>

            {/* Center: Timer */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-lg font-bold",
              isWarning 
                ? "bg-red-50 text-red-600 animate-pulse" 
                : "bg-slate-100 text-slate-700"
            )}>
              <Clock className={cn("h-4 w-4", isWarning ? "text-red-500" : "text-slate-400")} />
              {formatTime(timeLeft)}
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-2">
              {/* Network */}
              {isOnline ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs gap-1 hidden sm:flex">
                  <Wifi className="h-3 w-3" /> Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs gap-1 hidden sm:flex">
                  <WifiOff className="h-3 w-3" /> Offline
                </Badge>
              )}
              
              {/* Auto-save */}
              {autoSaving ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs gap-1">
                  <Save className="h-3 w-3 animate-pulse" /> Saving
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs gap-1 hidden sm:flex">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </Badge>
              ) : null}

              {/* Security counters */}
              <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
                <span className={cn(tabSwitches > 0 && "text-amber-500 font-medium")}>Tab:{tabSwitches}/3</span>
                <span className="text-slate-300">•</span>
                <span className={cn(fullscreenExits > 0 && "text-amber-500 font-medium")}>FS:{fullscreenExits}/3</span>
              </div>

              {/* Submit */}
              <Button size="sm" onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs">
                <Send className="h-3.5 w-3.5 mr-1.5" /> Submit
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 flex items-center gap-2">
            <Progress value={progressPercentage} className="h-1.5 flex-1" />
            <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
              {answeredCount}/{allQuestions.length}
            </span>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        <div className="flex flex-col xl:flex-row gap-4">
          
          {/* Question Area */}
          <div className="flex-1 min-w-0 space-y-4">
            <QuestionCard
              question={currentQuestion}
              questionIndex={currentIndex}
              answer={answers[currentQuestion.id] || ''}
              isFlagged={isFlagged}
              examId={exam?.id || ''}
              studentId={profile?.id}
              onAnswer={(value) => onUpdateAnswer(currentQuestion.id, value)}
              onToggleFlag={() => onToggleFlag(currentQuestion.id)}
            />

            <QuestionNavigation
              currentIndex={currentIndex}
              totalQuestions={allQuestions.length}
              onPrevious={() => onNavigate('prev')}
              onNext={() => onNavigate('next')}
              onTogglePalette={onTogglePalette}
              onSubmit={onSubmit}
            />

            {showQuestionPalette && (
              <QuestionPalette
                questions={allQuestions}
                currentIndex={currentIndex}
                answers={answers}
                flaggedQuestions={flaggedQuestions}
                onGoToQuestion={onGoToQuestion}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:w-72 shrink-0">
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
    </div>
  )
}