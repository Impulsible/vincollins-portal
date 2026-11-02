'use client'

import { Badge } from '@/components/ui/badge'
import { Camera, User, Hash, BookOpen, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import type { StudentProfile } from '@/app/student/exam/[id]/types'
import { cn } from '@/lib/utils'

interface StudentPhotoCardProps {
  profile: StudentProfile | null
  size?: 'small' | 'large'
}

export function StudentPhotoCard({
  profile,
  size = 'small',
}: StudentPhotoCardProps) {
  const isLarge = size === 'large'

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 px-3 py-2 overflow-hidden">
        <div className="absolute -top-6 -right-6 h-16 w-16 bg-white/10 rounded-full blur-xl" />
        <div className="relative flex items-center justify-center gap-1.5">
          <Camera className="h-3 w-3 text-white/80" />
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-[0.14em]">
            Candidate
          </span>
        </div>
      </div>

      {/* Photo */}
      <div className="relative">
        {profile?.photo_url ? (
          <div className={cn(
            'overflow-hidden',
            isLarge ? 'h-56' : 'h-44'
          )}>
            <Image
              src={profile.photo_url}
              alt={profile.full_name || 'Student'}
              width={isLarge ? 200 : 160}
              height={isLarge ? 240 : 200}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className={cn(
            'bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center',
            isLarge ? 'h-56' : 'h-44'
          )}>
            <User className={cn(
              'text-slate-300',
              isLarge ? 'h-20 w-20' : 'h-16 w-16'
            )} />
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

        {/* ID Badges overlaid */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
          <Badge className="flex-1 justify-center bg-white/20 backdrop-blur-md text-white ring-1 ring-white/25 border-0 py-0.5 text-[10px] font-bold">
            <Hash className="h-2.5 w-2.5 mr-1" />
            {profile?.vin_id || 'N/A'}
          </Badge>
          {profile?.admission_number && (
            <Badge className="flex-1 justify-center bg-white/15 backdrop-blur-md text-white ring-1 ring-white/20 border-0 py-0.5 text-[10px] font-bold">
              {profile.admission_number}
            </Badge>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-3 py-3 text-center bg-gradient-to-br from-slate-50 to-white">
        <p className="font-bold text-slate-900 text-sm truncate">
          {profile?.full_name || 'Student'}
        </p>
        <div className="flex items-center justify-center gap-3 mt-1.5 text-slate-500 text-[11px]">
          {profile?.class && (
            <span className="flex items-center gap-1 font-medium">
              <BookOpen className="h-3 w-3 text-indigo-500" />
              {profile.class}
            </span>
          )}
          {profile?.admission_number && (
            <span className="flex items-center gap-1 font-medium">
              <Hash className="h-3 w-3 text-indigo-500" />
              {profile.admission_number}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-emerald-600 font-semibold">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </div>
      </div>
    </div>
  )
}