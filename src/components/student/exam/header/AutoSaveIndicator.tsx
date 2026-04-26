// src/components/student/exam/header/AutoSaveIndicator.tsx
import { Badge } from '@/components/ui/badge'
import { Save, CheckCircle } from 'lucide-react'

interface AutoSaveIndicatorProps {
  autoSaving: boolean
  lastSaved: Date | null
}

export function AutoSaveIndicator({ autoSaving, lastSaved }: AutoSaveIndicatorProps) {
  if (autoSaving) {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 px-2 py-0.5 text-xs">
        <Save className="h-3 w-3 mr-1 animate-pulse" />
        Saving...
      </Badge>
    )
  }

  if (lastSaved) {
    return (
      <Badge className="bg-green-500/20 text-green-400 px-2 py-0.5 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Saved
      </Badge>
    )
  }

  return null
}
