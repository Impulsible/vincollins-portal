// src/components/student/exams/ExamFeatureBadges.tsx
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PenTool, Shield } from 'lucide-react'

interface ExamFeatureBadgesProps {
  hasTheory?: boolean
  proctoringEnabled?: boolean
  proctoringMessage?: string
}

export function ExamFeatureBadges({ hasTheory, proctoringEnabled, proctoringMessage = 'Camera required for this exam' }: ExamFeatureBadgesProps) {
  if (!hasTheory && !proctoringEnabled) return null
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {hasTheory && (
        <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
          <PenTool className="h-3 w-3 mr-1" /> Theory
        </Badge>
      )}
      {proctoringEnabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 cursor-help">
                <Shield className="h-3 w-3 mr-1" /> Proctored
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>{proctoringMessage}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}