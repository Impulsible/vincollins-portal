'use client'

import { Save, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoSaveIndicatorProps {
  autoSaving: boolean
  lastSaved: Date | null
}

export function AutoSaveIndicator({ autoSaving, lastSaved }: AutoSaveIndicatorProps) {
  if (autoSaving) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200 dark:ring-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-semibold">
        <Save className="h-3 w-3 animate-pulse" />
        <span>Saving…</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-200 dark:ring-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
        <CheckCircle2 className="h-3 w-3" />
        <span>Saved</span>
      </div>
    )
  }

  return null
}