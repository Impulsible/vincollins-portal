// src/components/student/exam/header/StudentInfo.tsx

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { StudentProfile } from '@/app/student/exam/[id]/types'

interface StudentInfoProps {
  profile: StudentProfile | null
  examTitle?: string
  termName?: string
}

export function StudentInfo({ profile, examTitle, termName }: StudentInfoProps) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST'

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 border border-gray-600">
        <AvatarImage src={profile?.photo_url || undefined} />
        <AvatarFallback className="bg-[#2a2f3e] text-white text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-white leading-tight">
          {profile?.full_name || 'Student'}
        </p>
        <p className="text-[10px] text-gray-400">
          {examTitle || 'Exam'} · {termName || 'Term'}
        </p>
      </div>
    </div>
  )
}