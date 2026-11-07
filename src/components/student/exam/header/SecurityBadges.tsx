'use client'

import { Globe, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'

interface SecurityBadgesProps {
  tabSwitches: number
  fullscreenExits: number
}

function getColor(count: number, limit: number) {
  if (count === 0) return {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-500 dark:text-emerald-400',
  }
  if (count >= limit - 1) return {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    ring: 'ring-rose-200 dark:ring-rose-900/50',
    text: 'text-rose-700 dark:text-rose-400',
    icon: 'text-rose-500 dark:text-rose-400',
  }
  return {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-900/50',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
  }
}

export function SecurityBadges({ tabSwitches, fullscreenExits }: SecurityBadgesProps) {
  const tabColor = getColor(tabSwitches, TAB_SWITCH_LIMIT)
  const fsColor = getColor(fullscreenExits, FULLSCREEN_EXIT_LIMIT)

  return (
    <>
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ring-1 text-xs font-semibold',
        tabColor.bg, tabColor.ring, tabColor.text
      )}>
        <Globe className={cn('h-3 w-3', tabColor.icon)} />
        <span>Tab: {tabSwitches}/{TAB_SWITCH_LIMIT}</span>
      </div>
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ring-1 text-xs font-semibold',
        fsColor.bg, fsColor.ring, fsColor.text
      )}>
        <Monitor className={cn('h-3 w-3', fsColor.icon)} />
        <span>FS: {fullscreenExits}/{FULLSCREEN_EXIT_LIMIT}</span>
      </div>
    </>
  )
}