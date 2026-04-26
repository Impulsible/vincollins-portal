// src/components/student/exam/sidebar/ExamSidebar.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Shield, Wifi, WifiOff, AlertTriangle, Camera, User } from 'lucide-react'
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
      {/* Progress Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-700 text-sm mb-3">Progress</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Completion</span>
                <span className="font-semibold text-blue-600">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                <p className="text-emerald-600 text-lg font-bold">{answeredCount}</p>
                <p className="text-emerald-500 text-[10px] font-medium uppercase">Done</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                <p className="text-amber-600 text-lg font-bold">{flaggedCount}</p>
                <p className="text-amber-500 text-[10px] font-medium uppercase">Flagged</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-slate-500 text-lg font-bold">{unansweredCount}</p>
                <p className="text-slate-400 text-[10px] font-medium uppercase">Left</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-center">
          <Camera className="h-4 w-4 text-white/80 mx-auto mb-0.5" />
          <p className="text-white text-xs font-medium">Candidate</p>
        </div>
        <CardContent className="p-4 flex flex-col items-center">
          {profile?.photo_url ? (
            <Image src={profile.photo_url} alt="" width={80} height={96} className="rounded-xl object-cover border-2 border-blue-100 shadow-sm" unoptimized />
          ) : (
            <div className="w-20 h-24 bg-blue-50 rounded-xl flex items-center justify-center border-2 border-blue-100">
              <User className="h-8 w-8 text-blue-300" />
            </div>
          )}
          <p className="font-semibold text-slate-700 text-sm mt-2 text-center truncate w-full">{profile?.full_name}</p>
          <p className="text-xs text-slate-400">{profile?.vin_id || profile?.class}</p>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-700 text-xs mb-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-500" /> Security
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Tab Switches</span>
              <span className={cn("font-medium", tabSwitches > 0 ? "text-amber-600" : "text-emerald-600")}>{tabSwitches}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fullscreen</span>
              <span className={cn("font-medium", fullscreenExits > 0 ? "text-amber-600" : "text-emerald-600")}>{fullscreenExits}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Network</span>
              <span className={cn("font-medium flex items-center gap-1", isOnline ? "text-emerald-600" : "text-red-500")}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}