'use client'

import { Shield, Globe, Monitor, Wifi, WifiOff } from 'lucide-react'
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
  const items = [
    {
      label: 'Tab Switches',
      value: tabSwitches,
      limit: TAB_SWITCH_LIMIT,
      icon: Globe,
    },
    {
      label: 'Fullscreen Exits',
      value: fullscreenExits,
      limit: FULLSCREEN_EXIT_LIMIT,
      icon: Monitor,
    },
  ]

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="h-3 w-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em]">
            Security Status
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const warn = item.value >= item.limit - 1
            const active = item.value > 0
            return (
              <div
                key={item.label}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl ring-1',
                  warn
                    ? 'bg-gradient-to-r from-rose-50 to-red-50/50 dark:from-rose-950/40 dark:to-red-950/30 ring-rose-200 dark:ring-rose-900/50'
                    : active
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 ring-amber-200 dark:ring-amber-900/50'
                      : 'bg-slate-50 dark:bg-slate-800/60 ring-slate-100 dark:ring-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn(
                    'h-3.5 w-3.5',
                    warn ? 'text-rose-500 dark:text-rose-400' : active ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                  )} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                </div>
                <span className={cn(
                  'text-xs font-bold tabular-nums',
                  warn ? 'text-rose-600 dark:text-rose-400' : active ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {item.value}/{item.limit}
                </span>
              </div>
            )
          })}

          {/* Network */}
          <div className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl ring-1',
            isOnline
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/30 ring-emerald-200 dark:ring-emerald-900/50'
              : 'bg-gradient-to-r from-rose-50 to-red-50/50 dark:from-rose-950/40 dark:to-red-950/30 ring-rose-200 dark:ring-rose-900/50'
          )}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              )}
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Network</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full',
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              )} />
              <span className={cn(
                'text-xs font-bold',
                isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}>
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}