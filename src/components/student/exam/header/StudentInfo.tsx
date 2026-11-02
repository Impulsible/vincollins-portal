'use client'

import Image from 'next/image'
import { User } from 'lucide-react'
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
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full blur-md opacity-30" />
        {profile?.photo_url ? (
          <Image
            src={profile.photo_url}
            alt={profile.full_name || 'Student'}
            width={36}
            height={36}
            className="relative h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-md"
            unoptimized
          />
        ) : (
          <div className="relative h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
            <span className="text-white font-bold text-xs">{initials}</span>
          </div>
        )}
      </div>
      <div className="hidden sm:block min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-tight truncate">
          {examTitle || profile?.full_name || 'Student'}
        </p>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">
          <span className="font-medium text-slate-600">
            {profile?.full_name || 'Student'}
          </span>
          {termName && (
            <>
              <span className="text-slate-300 mx-1.5">·</span>
              {termName}
            </>
          )}
        </p>
      </div>
    </div>
  )
}