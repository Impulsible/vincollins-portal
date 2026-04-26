// src/components/student/exam/views/FullscreenPrompt.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Maximize2, AlertTriangle, Shield } from 'lucide-react'
import { FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface FullscreenPromptProps {
  fullscreenExits: number
  onReturnToFullscreen: () => void
}

export function FullscreenPrompt({
  fullscreenExits,
  onReturnToFullscreen,
}: FullscreenPromptProps) {
  const isLastWarning = fullscreenExits >= FULLSCREEN_EXIT_LIMIT - 1
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Auto-focus the return button
  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="max-w-md w-full border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className={cn(
          "p-6 text-center text-white",
          isLastWarning ? "bg-red-600" : "bg-amber-500"
        )}>
          <div className="inline-flex h-16 w-16 rounded-full bg-white/20 items-center justify-center mb-3">
            {isLastWarning ? (
              <AlertTriangle className="h-8 w-8 text-white" />
            ) : (
              <Maximize2 className="h-8 w-8 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold">
            {isLastWarning ? 'FINAL WARNING!' : 'Return to Fullscreen'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Fullscreen mode is required for this exam
          </p>
        </div>

        <CardContent className="p-6">
          {/* Violation Counter */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3">
              <span className="text-5xl font-bold text-gray-900">
                {fullscreenExits}
              </span>
              <span className="text-2xl text-gray-300">/</span>
              <span className="text-2xl text-gray-400">{FULLSCREEN_EXIT_LIMIT}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Fullscreen exits detected</p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-3">
              {Array.from({ length: FULLSCREEN_EXIT_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i < fullscreenExits ? "bg-red-500 w-4" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Warning Message */}
          <div className={cn(
            "rounded-lg p-4 mb-6 text-center border",
            isLastWarning
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          )}>
            <p className={cn(
              "font-semibold text-sm",
              isLastWarning ? "text-red-700" : "text-amber-700"
            )}>
              {isLastWarning
                ? '⚠️ ONE MORE EXIT WILL AUTO-SUBMIT YOUR EXAM!'
                : 'Your exam must remain in fullscreen mode. Exiting will be recorded as a violation.'}
            </p>
          </div>

          {/* Security Info */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
            <Shield className="h-3 w-3" />
            <span>Security violation #{fullscreenExits}</span>
          </div>

          {/* Action Button */}
          <Button
            ref={buttonRef}
            onClick={onReturnToFullscreen}
            size="lg"
            className={cn(
              "w-full h-14 text-base font-semibold",
              isLastWarning
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            <Maximize2 className="mr-2 h-5 w-5" />
            Return to Fullscreen Now
          </Button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Press F11 or click the button above to continue your exam
          </p>
        </CardContent>
      </Card>
    </div>
  )
}