import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ArrowRight, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ✅ FIXED: Import from the correct location
import { Classmate } from '@/app/student/types'
import { getInitials } from '@/app/student/utils/nameFormatter'
import { getAvatarColor } from '@/app/student/utils/constants'

interface ClassmatesPreviewCardProps {
  classmates: Classmate[]
  studentClass: string
  onViewAll: () => void
}

export function ClassmatesPreviewCard({ classmates, studentClass, onViewAll }: ClassmatesPreviewCardProps) {
  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600 shrink-0" />
            Classmates
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription>
          {classmates.length} student{classmates.length !== 1 ? 's' : ''} in {studentClass}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {classmates.length === 0 ? (
          <div className="text-center py-6">
            <UserPlus className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No classmates yet</p>
            <p className="text-xs text-slate-400">Other students will appear here once enrolled</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {classmates.slice(0, 4).map((classmate) => {
                const displayName = classmate.display_name || classmate.full_name
                return (
                  <div key={classmate.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={classmate.photo_url || undefined} />
                      <AvatarFallback className={cn("bg-gradient-to-br text-white text-sm", getAvatarColor(displayName))}>
                        {getInitials(classmate.first_name, classmate.last_name, displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{classmate.email}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {classmates.length > 4 && (
              <Button variant="ghost" size="sm" className="w-full mt-3 text-emerald-600" onClick={onViewAll}>
                View all {classmates.length} classmates
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}