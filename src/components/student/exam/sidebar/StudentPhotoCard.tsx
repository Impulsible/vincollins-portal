// src/components/student/exam/sidebar/StudentPhotoCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, User, Hash, BookOpen } from 'lucide-react'
import Image from 'next/image'
import type { StudentProfile } from '@/app/student/exam/[id]/types'

interface StudentPhotoCardProps {
  profile: StudentProfile | null
  size?: 'small' | 'large'
}

export function StudentPhotoCard({
  profile,
  size = 'small',
}: StudentPhotoCardProps) {
  const dimensions = size === 'large' 
    ? { width: 200, height: 240, container: 'w-full h-56' }
    : { width: 160, height: 200, container: 'w-full h-44' }

  return (
    <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#c41e3a] to-[#e8354a] px-3 py-1.5">
        <h4 className="text-white text-xs font-medium text-center flex items-center justify-center gap-1">
          <Camera className="h-3 w-3" />
          Candidate
        </h4>
      </div>
      
      {/* Photo - Takes most of the space */}
      <CardContent className="p-0">
        <div className="relative">
          {profile?.photo_url ? (
            <div className={`${dimensions.container} overflow-hidden`}>
              <Image
                src={profile.photo_url}
                alt={profile.full_name || 'Student'}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className={`${dimensions.container} bg-[#0a0f1a] flex items-center justify-center`}>
              <User className={size === 'large' ? 'h-20 w-20 text-gray-600' : 'h-16 w-16 text-gray-600'} />
            </div>
          )}
          
          {/* ID Badges - Overlaid at bottom */}
          <div className="absolute bottom-1 left-2 right-2 flex gap-1">
            <Badge className="flex-1 justify-center bg-[#c41e3a]/90 backdrop-blur-sm text-white py-0.5 text-[10px] font-medium">
              {profile?.vin_id || 'N/A'}
            </Badge>
            {profile?.admission_number && (
              <Badge className="flex-1 justify-center bg-gray-800/90 backdrop-blur-sm text-white py-0.5 text-[10px] font-medium">
                {profile.admission_number}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Name & Details - Compact below photo */}
      <CardContent className="px-2 py-2 text-center bg-[#141824]">
        <p className="text-white font-semibold text-sm truncate">
          {profile?.full_name || 'Student'}
        </p>
        <div className="flex items-center justify-center gap-3 mt-1 text-gray-400 text-[11px]">
          {profile?.class && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {profile.class}
            </span>
          )}
          {profile?.admission_number && (
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {profile.admission_number}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}