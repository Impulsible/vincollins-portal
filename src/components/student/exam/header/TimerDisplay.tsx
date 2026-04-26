// src/components/student/exam/header/TimerDisplay.tsx
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/app/student/exam/[id]/utils/scoring'
import { TIME_WARNING_THRESHOLD } from '@/app/student/exam/[id]/constants'

interface TimerDisplayProps {
  timeLeft: number
}

export function TimerDisplay({ timeLeft }: TimerDisplayProps) {
  const isWarning = timeLeft < TIME_WARNING_THRESHOLD

  return (
    <div
      className={cn(
        "px-4 py-1.5 rounded-md font-mono text-xl font-bold",
        isWarning
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : "bg-[#0a0f1a] text-white border border-gray-700"
      )}
    >
      <Clock className="inline h-4 w-4 mr-1.5" />
      {formatTime(timeLeft)}
    </div>
  )
}
