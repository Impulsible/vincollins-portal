// src/components/student/exam/sidebar/StudentPhotoCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, User, Hash, BookOpen, GraduationCap, Mail } from 'lucide-react'
import Image from 'next/image'
import type { StudentProfile } from '@/app/student/exam/[id]/types'

interface StudentPhotoCardProps {
  profile: StudentProfile | null
  size?: 'small' | 'large' | 'xl'
}

export function StudentPhotoCard({
  profile,
  size = 'large',
}: StudentPhotoCardProps) {
  const dimensions = {
    small: { width: 160, height: 200, container: 'w-full h-44' },
    large: { width: 240, height: 300, container: 'w-full h-64' },
    xl: { width: 320, height: 400, container: 'w-full h-80' }
  }
  
  const currentSize = dimensions[size]

  return (
    <Card className="border border-gray-200 shadow-xl bg-white overflow-hidden rounded-2xl hover:shadow-2xl transition-shadow duration-300">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5">
        <h4 className="text-white text-sm font-semibold text-center flex items-center justify-center gap-2">
          <Camera className="h-4 w-4" />
          Candidate Information
        </h4>
      </div>
      
      {/* Photo Section - Larger and more prominent */}
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-b from-gray-50 to-gray-100">
          {profile?.photo_url ? (
            <div className={`${currentSize.container} overflow-hidden relative`}>
              <Image
                src={profile.photo_url}
                alt={profile.full_name || 'Student'}
                width={currentSize.width}
                height={currentSize.height}
                className="w-full h-full object-cover object-center"
                unoptimized
              />
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className={`${currentSize.container} bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center`}>
              <div className="bg-white p-4 rounded-full shadow-lg">
                <User className={size === 'xl' ? 'h-24 w-24 text-blue-500' : 'h-20 w-20 text-blue-500'} />
              </div>
              <p className="mt-3 text-gray-500 text-sm font-medium">No Photo Available</p>
            </div>
          )}
          
          {/* ID Badges - Enhanced styling */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <Badge className="flex-1 justify-center bg-blue-600/95 backdrop-blur-sm text-white py-1.5 text-xs font-semibold shadow-lg rounded-lg">
              ID: {profile?.vin_id || profile?.admission_number || 'N/A'}
            </Badge>
            {profile?.admission_number && profile?.vin_id !== profile?.admission_number && (
              <Badge className="flex-1 justify-center bg-gray-800/95 backdrop-blur-sm text-white py-1.5 text-xs font-semibold shadow-lg rounded-lg">
                Adm: {profile.admission_number}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Student Details - Expanded and more detailed */}
      <CardContent className="px-4 py-4 bg-white space-y-3">
        {/* Name */}
        <div className="text-center border-b border-gray-100 pb-3">
          <p className="text-gray-800 font-bold text-lg tracking-tight">
            {profile?.full_name || 'Student Name'}
          </p>
          <p className="text-gray-500 text-xs mt-1">Student</p>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {profile?.class && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Class</p>
                <p className="text-gray-700 font-medium text-sm">{profile.class}</p>
              </div>
            </div>
          )}
          
          {profile?.admission_number && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <Hash className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Admission No.</p>
                <p className="text-gray-700 font-medium text-sm">{profile.admission_number}</p>
              </div>
            </div>
          )}
          
          {profile?.department && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Department</p>
                <p className="text-gray-700 font-medium text-sm">{profile.department}</p>
              </div>
            </div>
          )}
          
          {profile?.email && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 col-span-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Email</p>
                <p className="text-gray-700 font-medium text-xs truncate">{profile.email}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}