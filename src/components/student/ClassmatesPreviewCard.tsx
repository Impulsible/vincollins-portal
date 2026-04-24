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
      <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
            Classmates
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll}
            className="h-7 sm:h-8 text-xs sm:text-sm w-fit"
          >
            View All <ArrowRight className="ml-0.5 sm:ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-[11px] sm:text-xs">
          {classmates.length} student{classmates.length !== 1 ? 's' : ''} in <span className="font-medium text-emerald-600">{studentClass}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
        {classmates.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <UserPlus className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-slate-500">No classmates yet</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Other students will appear here once enrolled</p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {classmates.slice(0, 4).map((classmate) => {
                const displayName = classmate.display_name || classmate.full_name
                return (
                  <div key={classmate.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0">
                      <AvatarImage src={classmate.photo_url || undefined} />
                      <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs sm:text-sm", getAvatarColor(displayName))}>
                        {getInitials(classmate.first_name, classmate.last_name, displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[11px] sm:text-sm truncate line-clamp-1">
                        {displayName}
                      </p>
                      <p className="text-[9px] sm:text-xs text-slate-500 truncate line-clamp-1">
                        {classmate.email}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {classmates.length > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 sm:mt-3 text-emerald-600 h-8 sm:h-9 text-xs sm:text-sm"
                onClick={onViewAll}
              >
                View all {classmates.length} classmates
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}