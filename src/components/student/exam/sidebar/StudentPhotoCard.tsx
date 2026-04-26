// src/components/student/exam/sidebar/StudentPhotoCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, User } from 'lucide-react'
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
    ? { width: 192, height: 224, container: 'w-48 h-56' }
    : { width: 144, height: 176, container: 'w-36 h-44' }

  return (
    <Card className="border border-gray-700 shadow-lg bg-[#1a1f2e] overflow-hidden">
      <div className="bg-gradient-to-r from-[#c41e3a] to-[#e8354a] p-2">
        <h4 className="text-white text-xs font-medium text-center flex items-center justify-center gap-1">
          <Camera className="h-3 w-3" />
          Candidate
        </h4>
      </div>
      <CardContent className="p-4 flex justify-center">
        <div className="relative">
          {profile?.photo_url ? (
            <div className={`${dimensions.container} border-3 border-[#c41e3a] rounded-md overflow-hidden shadow-lg`}>
              <Image
                src={profile.photo_url}
                alt={profile.full_name}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className={`${dimensions.container} border-3 border-gray-600 rounded-md overflow-hidden bg-[#0a0f1a] flex items-center justify-center`}>
              <User className={size === 'large' ? 'h-20 w-20' : 'h-14 w-14 text-gray-500'} />
            </div>
          )}
          <div className="absolute -bottom-2 left-0 right-0">
            <Badge className="w-full justify-center bg-[#c41e3a] text-white py-0.5 text-xs">
              {profile?.vin_id || profile?.class || 'Student'}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-0 pb-3 text-center">
        <p className="text-white font-medium text-sm truncate px-2">
          {profile?.full_name}
        </p>
      </CardContent>
    </Card>
  )
}
