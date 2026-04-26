// src/components/student/exam/sidebar/ProgressCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ProgressCardProps {
  answeredCount: number
  flaggedCount: number
  unansweredCount: number
  progressPercentage: number
}

export function ProgressCard({
  answeredCount,
  flaggedCount,
  unansweredCount,
  progressPercentage,
}: ProgressCardProps) {
  return (
    <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e]">
      <CardContent className="p-4">
        <h4 className="font-medium text-white text-sm mb-3">Exam Progress</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Completion</span>
              <span className="font-medium text-[#c41e3a]">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-1.5 bg-gray-700 [&>div]:bg-[#c41e3a]"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 rounded p-2 text-center border border-green-500/30">
              <p className="text-green-400 text-xs">Answered</p>
              <p className="text-lg font-bold text-green-300">{answeredCount}</p>
            </div>
            <div className="bg-yellow-500/10 rounded p-2 text-center border border-yellow-500/30">
              <p className="text-yellow-400 text-xs">Flagged</p>
              <p className="text-lg font-bold text-yellow-300">{flaggedCount}</p>
            </div>
            <div className="bg-gray-500/10 rounded p-2 text-center border border-gray-500/30">
              <p className="text-gray-400 text-xs">Remaining</p>
              <p className="text-lg font-bold text-gray-300">{unansweredCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
