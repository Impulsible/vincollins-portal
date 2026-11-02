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
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 ring-1 ring-amber-200 text-amber-700 text-xs font-semibold">
        <Save className="h-3 w-3 animate-pulse" />
        <span>Saving…</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-xs font-semibold">
        <CheckCircle2 className="h-3 w-3" />
        <span>Saved</span>
      </div>
    )
  }

  return null
}