// src/components/student/exam/header/StudentInfo.tsx
import Image from 'next/image'
import { User } from 'lucide-react'
import type { StudentProfile } from '@/app/student/exam/[id]/types'

interface StudentInfoProps {
  profile: StudentProfile | null
  examTitle?: string
  termName?: string
}

export function StudentInfo({ profile, examTitle, termName }: StudentInfoProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {profile?.photo_url ? (
          <div className="h-10 w-10 rounded-md overflow-hidden border-2 border-[#c41e3a]">
            <Image
              src={profile.photo_url}
              alt={profile.full_name || 'Student'}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-md bg-[#c41e3a] flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      <div className="hidden sm:block">
        <h2 className="font-semibold text-white text-sm">{examTitle}</h2>
        <p className="text-xs text-gray-400">
          {profile?.full_name || 'Student'} • {termName}
        </p>
      </div>
    </div>
  )
}