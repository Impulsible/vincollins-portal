// src/components/student/exam/header/SecurityBadges.tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'

interface SecurityBadgesProps {
  tabSwitches: number
  fullscreenExits: number
}

export function SecurityBadges({ tabSwitches, fullscreenExits }: SecurityBadgesProps) {
  const getTabColor = (count: number) => {
    if (count === 0) return 'bg-green-500/20 text-green-400'
    if (count === 1) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  const getFullscreenColor = (count: number) => {
    if (count === 0) return 'bg-green-500/20 text-green-400'
    if (count === 1) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <>
      <Badge className={cn("px-2 py-0.5 text-xs", getTabColor(tabSwitches))}>
        Tab: {tabSwitches}/{TAB_SWITCH_LIMIT}
      </Badge>
      <Badge className={cn("px-2 py-0.5 text-xs", getFullscreenColor(fullscreenExits))}>
        FS: {fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}
      </Badge>
    </>
  )
}
