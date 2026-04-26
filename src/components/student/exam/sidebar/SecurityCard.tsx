// src/components/student/exam/sidebar/SecurityCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'

interface SecurityCardProps {
  tabSwitches: number
  fullscreenExits: number
  isOnline: boolean
}

export function SecurityCard({
  tabSwitches,
  fullscreenExits,
  isOnline,
}: SecurityCardProps) {
  return (
    <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e]">
      <CardContent className="p-4">
        <h4 className="font-medium text-white text-xs mb-2 flex items-center gap-1">
          <Shield className="h-3 w-3 text-[#c41e3a]" />
          Security Status
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Tab Switches:</span>
            <span
              className={cn(
                tabSwitches > 0 ? 'text-yellow-400' : 'text-green-400'
              )}
            >
              {tabSwitches}/{TAB_SWITCH_LIMIT}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fullscreen Exits:</span>
            <span
              className={cn(
                fullscreenExits > 0 ? 'text-yellow-400' : 'text-green-400'
              )}
            >
              {fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Network:</span>
            <span
              className={cn(isOnline ? 'text-green-400' : 'text-red-400')}
            >
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
