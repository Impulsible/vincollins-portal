// src/components/student/exam/sidebar/ExamSidebar.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Shield, Wifi, WifiOff, Camera, User, CheckCircle2, Flag, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import type { StudentProfile } from '@/app/student/exam/[id]/types'

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

export function ExamSidebar({
  profile, answeredCount, flaggedCount, unansweredCount,
  progressPercentage, tabSwitches, fullscreenExits, isOnline,
}: ExamSidebarProps) {
  return (
    <div className="space-y-3">
      {/* Progress */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-3.5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
            <span className="text-xs font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 mb-3" />
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-emerald-50 rounded-lg py-1.5 border border-emerald-100">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-emerald-600">{answeredCount}</p>
            </div>
            <div className="bg-amber-50 rounded-lg py-1.5 border border-amber-100">
              <Flag className="h-3 w-3 text-amber-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-amber-500">{flaggedCount}</p>
            </div>
            <div className="bg-slate-50 rounded-lg py-1.5 border border-slate-100">
              <HelpCircle className="h-3 w-3 text-slate-300 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-slate-400">{unansweredCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2 flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 text-white/70" />
          <span className="text-white text-xs font-medium">Candidate</span>
        </div>
        <CardContent className="p-3 flex items-center gap-3">
          {profile?.photo_url ? (
            <Image src={profile.photo_url} alt="" width={40} height={48} className="rounded-lg object-cover border-2 border-blue-100 shrink-0" unoptimized />
          ) : (
            <div className="h-12 w-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-blue-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-700 text-xs truncate">{profile?.full_name}</p>
            <p className="text-[10px] text-slate-400">{profile?.vin_id || profile?.class}</p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Security</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Tab Switches</span>
              <span className={cn("font-medium", tabSwitches > 0 ? "text-amber-500" : "text-emerald-500")}>{tabSwitches}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fullscreen</span>
              <span className={cn("font-medium", fullscreenExits > 0 ? "text-amber-500" : "text-emerald-500")}>{fullscreenExits}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Network</span>
              <span className={cn("font-medium flex items-center gap-1", isOnline ? "text-emerald-500" : "text-red-500")}>
                {isOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {isOnline ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}