// src/components/student/exams/ExamFeatureBadges.tsx - FIXED VERSION

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PenTool, Shield, Eye } from 'lucide-react'

interface ExamFeatureBadgesProps {
  hasTheory?: boolean
  proctoringEnabled?: boolean
  proctoringMessage?: string  // ✅ Optional dynamic message
}

export function ExamFeatureBadges({ 
  hasTheory, 
  proctoringEnabled,
  proctoringMessage = 'Camera required for this exam'  // ✅ Fallback only
}: ExamFeatureBadgesProps) {
  if (!hasTheory && !proctoringEnabled) return null

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {hasTheory && (
        <Badge
          variant="outline"
          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
        >
          <PenTool className="h-3 w-3 mr-1" />
          Theory
        </Badge>
      )}

      {proctoringEnabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs bg-red-50 text-red-700 border-red-200 cursor-help"
              >
                <Shield className="h-3 w-3 mr-1" />
                Proctored
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{proctoringMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}