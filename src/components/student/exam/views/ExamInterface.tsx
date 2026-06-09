// src/components/student/exam/views/ExamInterface.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from '../question/QuestionCard'
import { QuestionNavigation } from '../question/QuestionNavigation'
import { QuestionPalette } from '../palette/QuestionPalette'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import {
  Clock, Send, AlertCircle, Wifi, WifiOff, Save, CheckCircle2
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
          <div className="h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-slate-500 text-xl font-semibold">No questions available</p>
          <p className="text-slate-400 text-base mt-2">This exam has no questions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      
      {/* ===== TOP BAR ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left: Student + Exam info */}
            <div className="flex items-center gap-4 min-w-0">
              {profile?.photo_url ? (
                <Image src={profile.photo_url} alt="" width={42} height={42} className="rounded-xl object-cover shrink-0 ring-2 ring-blue-100" unoptimized />
              ) : (
                <div className="h-11 w-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-blue-50">
                  <span className="text-blue-600 font-bold text-base">{profile?.full_name?.[0] || 'S'}</span>
                </div>
              )}
              <div className="min-w-0 hidden sm:block">
                <p className="text-base font-semibold text-slate-800 truncate leading-tight">{exam?.title}</p>
                <p className="text-sm text-slate-400 truncate">{profile?.full_name} • {exam?.subject}</p>
              </div>
            </div>

            {/* Center: Timer */}
            <div className={cn(
              "flex items-center gap-2.5 px-5 py-2 rounded-xl font-mono text-2xl font-bold",
              isWarning 
                ? "bg-red-50 text-red-600 animate-pulse shadow-sm" 
                : "bg-slate-100 text-slate-700"
            )}>
              <Clock className={cn("h-5 w-5", isWarning ? "text-red-500" : "text-slate-400")} />
              {formatTime(timeLeft)}
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-3">
              {/* Network */}
              {isOnline ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs gap-1.5 py-1 px-2.5 hidden sm:inline-flex">
                  <Wifi className="h-3.5 w-3.5" /> Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs gap-1.5 py-1 px-2.5 hidden sm:inline-flex">
                  <WifiOff className="h-3.5 w-3.5" /> Offline
                </Badge>
              )}
              
              {/* Auto-save */}
              {autoSaving ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs gap-1.5 py-1 px-2.5">
                  <Save className="h-3.5 w-3.5 animate-pulse" /> Saving
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs gap-1.5 py-1 px-2.5 hidden sm:inline-flex">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </Badge>
              ) : null}

              {/* Security counters */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className={cn(tabSwitches > 0 && "text-amber-500 font-semibold")}>Tab:{tabSwitches}/3</span>
                <span className="text-slate-300">•</span>
                <span className={cn(fullscreenExits > 0 && "text-amber-500 font-semibold")}>FS:{fullscreenExits}/3</span>
              </div>

              {/* Submit */}
              <Button size="sm" onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-semibold rounded-lg shadow-sm">
                <Send className="h-4 w-4 mr-1.5" /> Submit
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progressPercentage} className="h-2 flex-1" />
            <span className="text-sm text-slate-500 whitespace-nowrap tabular-nums font-medium">
              {answeredCount}/{allQuestions.length} answered
            </span>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-6 py-6">
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Question Area */}
          <div className="flex-1 min-w-0 space-y-5">
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