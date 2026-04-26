// src/components/student/exam/header/ExamHeader.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Send } from 'lucide-react'
import { StudentInfo } from './StudentInfo'
import { TimerDisplay } from './TimerDisplay'
import { NetworkStatus } from './NetworkStatus'
import { AutoSaveIndicator } from './AutoSaveIndicator'
import { SecurityBadges } from './SecurityBadges'
import type { StudentProfile } from '@/app/student/exam/[id]/types'
import { TERM_NAMES, CURRENT_TERM } from '@/app/student/exam/[id]/constants'

interface ExamHeaderProps {
  exam: any
  profile: StudentProfile | null
  timeLeft: number
  answeredCount: number
  totalQuestions: number
  flaggedCount: number
  progressPercentage: number
  tabSwitches: number
  fullscreenExits: number
  isOnline: boolean
  autoSaving: boolean
  lastSaved: Date | null
  onSubmit: () => void
}

export function ExamHeader({
  exam,
  profile,
  timeLeft,
  answeredCount,
  totalQuestions,
  flaggedCount,
  progressPercentage,
  tabSwitches,
  fullscreenExits,
  isOnline,
  autoSaving,
  lastSaved,
  onSubmit,
}: ExamHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#1a1f2e] border-b border-gray-700 shadow-lg">
      <div className="px-4 sm:px-6 py-2">
        {/* Main Row */}
        <div className="flex items-center justify-between">
          <StudentInfo
            profile={profile}
            examTitle={exam?.title}
            termName={TERM_NAMES[exam?.term || CURRENT_TERM]}
          />

          <div className="flex items-center gap-4">
            <NetworkStatus isOnline={isOnline} />
            <AutoSaveIndicator autoSaving={autoSaving} lastSaved={lastSaved} />
            <TimerDisplay timeLeft={timeLeft} />
          </div>

          <div className="flex items-center gap-2">
            <SecurityBadges
              tabSwitches={tabSwitches}
              fullscreenExits={fullscreenExits}
            />
            <Button
              size="sm"
              onClick={onSubmit}
              className="bg-[#c41e3a] hover:bg-[#a01830] text-white h-8 px-4"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Submit
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 pb-1">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>
              <strong className="text-white">{answeredCount}</strong> of{' '}
              {totalQuestions} answered
            </span>
            <span>{flaggedCount} flagged</span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-1.5 bg-gray-700 [&>div]:bg-[#c41e3a]"
          />
        </div>
      </div>
    </div>
  )
}
