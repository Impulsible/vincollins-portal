'use client'

import { Shield, Wifi, WifiOff, User, CheckCircle2, Flag, HelpCircle, Globe, Monitor, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import type { StudentProfile } from '@/app/student/exam/[id]/types'
import { motion } from 'framer-motion'

interface ExamSidebarProps {
  profile: StudentProfile | null
  exam: any
  answeredCount: number
  flaggedCount: number
  unansweredCount: number
  progressPercentage: number
  tabSwitches: number
  fullscreenExits: number
  isOnline: boolean
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

export function ExamSidebar({
  profile,
  answeredCount,
  flaggedCount,
  unansweredCount,
  progressPercentage,
  tabSwitches,
  fullscreenExits,
  isOnline,
}: ExamSidebarProps) {
  const securityItems = [
    {
      label: 'Tabs',
      value: tabSwitches,
      limit: 3,
      icon: Globe,
      warn: tabSwitches >= 2,
      active: tabSwitches > 0,
    },
    {
      label: 'Fullscreen',
      value: fullscreenExits,
      limit: 3,
      icon: Monitor,
      warn: fullscreenExits >= 2,
      active: fullscreenExits > 0,
    },
  ]

  return (
    <div className="space-y-3">
      {/* ──── PROGRESS CARD ──── */}
      <motion.div
        {...fadeUp(0)}
        className="rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden"
      >
        {/* Gradient accent */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

        <div className="p-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em]">
              Progress
            </span>
            <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent tabular-nums">
              {Math.round(progressPercentage)}%
            </span>
          </div>

          {/* Custom progress bar */}
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full"
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 ring-1 ring-emerald-200/60 p-2.5 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-emerald-700 tabular-nums leading-none">
                {answeredCount}
              </p>
              <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wider mt-1">
                Done
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 ring-1 ring-amber-200/60 p-2.5 text-center">
              <Flag className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-amber-700 tabular-nums leading-none">
                {flaggedCount}
              </p>
              <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider mt-1">
                Flagged
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 ring-1 ring-slate-200/60 p-2.5 text-center">
              <HelpCircle className="h-4 w-4 text-slate-400 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-slate-600 tabular-nums leading-none">
                {unansweredCount}
              </p>
              <p className="text-[9px] font-bold text-slate-500/70 uppercase tracking-wider mt-1">
                Left
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ──── CANDIDATE CARD ──── */}
      <motion.div
        {...fadeUp(0.08)}
        className="rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden"
      >
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 px-4 py-2.5 overflow-hidden">
          <div className="absolute -top-8 -right-8 h-20 w-20 bg-white/10 rounded-full blur-xl" />
          <div className="relative flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-white/15 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-[0.14em]">
              Candidate
            </span>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl blur-md opacity-30" />
            {profile?.photo_url ? (
              <Image
                src={profile.photo_url}
                alt=""
                width={44}
                height={44}
                className="relative rounded-xl object-cover ring-2 ring-white shadow-md"
                unoptimized
              />
            ) : (
              <div className="relative h-11 w-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md ring-2 ring-white">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-sm truncate leading-tight">
              {profile?.full_name || 'Student'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {profile?.vin_id || profile?.class || '—'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ──── SECURITY CARD ──── */}
      <motion.div
        {...fadeUp(0.16)}
        className="rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Shield className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em]">
              Security
            </span>
          </div>

          <div className="space-y-2">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl ring-1 transition-colors',
                  item.warn
                    ? 'bg-gradient-to-r from-rose-50 to-red-50/50 ring-rose-200'
                    : item.active
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50/50 ring-amber-200'
                      : 'bg-slate-50 ring-slate-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn(
                    'h-3.5 w-3.5',
                    item.warn ? 'text-rose-500' : item.active ? 'text-amber-500' : 'text-slate-400'
                  )} />
                  <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                </div>
                <span className={cn(
                  'text-xs font-bold tabular-nums',
                  item.warn ? 'text-rose-600' : item.active ? 'text-amber-600' : 'text-emerald-600'
                )}>
                  {item.value}/{item.limit}
                </span>
              </div>
            ))}

            {/* Network */}
            <div className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl ring-1',
              isOnline
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 ring-emerald-200'
                : 'bg-gradient-to-r from-rose-50 to-red-50/50 ring-rose-200'
            )}>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className="text-xs text-slate-600 font-medium">Network</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                )} />
                <span className={cn(
                  'text-xs font-bold',
                  isOnline ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}