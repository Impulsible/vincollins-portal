// src/components/student/exam/header/StudentInfo.tsx

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface StudentProfile {
  full_name?: string | null
  photo_url?: string | null
}

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
      <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
        <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Student'} />
        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="hidden sm:block min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight truncate">
          {profile?.full_name || 'Student'}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
          {examTitle || 'Exam'} · {termName || 'Term'}
        </p>
      </div>
    </div>
  )
}