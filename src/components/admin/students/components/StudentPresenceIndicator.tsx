// components/admin/students/components/StudentPresenceIndicator.tsx

'use client'

import { cn } from '@/lib/utils'
import { UserCheck, UserMinus, UserX, Circle } from 'lucide-react'
import { PresenceStatus } from '../types'

interface StatusBadgeProps {
  status: PresenceStatus
  isActive: boolean
}

export function StatusBadge({ status, isActive }: StatusBadgeProps) {
  if (!isActive) {
    return (
      <span className="text-sm text-red-500 flex items-center gap-1">
        <Circle className="h-3 w-3" />
        Inactive
      </span>
    )
  }

  const config = {
    online: { icon: UserCheck, color: 'text-emerald-600', label: 'Online' },
    away: { icon: UserMinus, color: 'text-amber-600', label: 'Away' },
    offline: { icon: UserX, color: 'text-slate-500', label: 'Offline' },
  }

  const { icon: Icon, color, label } = config[status]

  return (
    <span className={cn('text-sm font-medium flex items-center gap-1.5', color)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}