import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft } from 'lucide-react'

// ✅ FIXED: Use absolute imports from @/app/student/
import { getInitials } from '@/app/student/utils/nameFormatter'

interface ProfileTabProps {
  profile: any
  profileDisplayName: string
  displayTotalSubjects: number
  handleTabChange: (tab: string) => void
}

export function ProfileTab({ profile, profileDisplayName, displayTotalSubjects, handleTabChange }: ProfileTabProps) {
  return (
    <motion.div 
      key="profile" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">My Profile</h1>
        <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {profile && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <Avatar className="h-24 w-24 shrink-0">
                  <AvatarImage src={profile.photo_url || undefined} />
                  <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                    {getInitials(profile.first_name, profile.last_name, profileDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 max-w-full">
                  <h2 className="text-xl sm:text-2xl font-bold break-words">{profileDisplayName}</h2>
                  <p className="text-slate-500 text-sm break-all">{profile.email}</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700">{profile.class}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">First Name</p>
                  <p className="font-medium break-words">{profile.first_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Middle Name</p>
                  <p className="font-medium break-words">{profile.middle_name || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Last Name</p>
                  <p className="font-medium break-words">{profile.last_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Display Name (Reports)</p>
                  <p className="font-medium break-words">{profile.display_name || profile.full_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">VIN ID</p>
                  <p className="font-medium break-words">{profile.vin_id || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="font-medium break-words">{profile.department}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Admission Year</p>
                  <p className="font-medium">{profile.admission_year || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="font-medium capitalize">{profile.role}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2">
                  <p className="text-xs text-slate-500">Total Subjects</p>
                  <p className="font-medium">{displayTotalSubjects} Subjects</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}