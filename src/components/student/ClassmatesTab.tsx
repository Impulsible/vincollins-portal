'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, ArrowLeft, Users, Mail, Grid3x3, List, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// ✅ FIXED: Use absolute imports from @/app/student/
import { getInitials } from '@/app/student/utils/nameFormatter'
import { getAvatarColor } from '@/app/student/utils/constants'
import { Classmate } from '@/app/student/types'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'

interface ClassmatesTabProps {
  profile: any
  stats: any
  handleTabChange: (tab: string) => void
}

export function ClassmatesTab({ profile, stats, handleTabChange }: ClassmatesTabProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  const filteredClassmates = stats.classmates.filter((classmate: Classmate) => {
    const displayName = classmate.display_name || classmate.full_name
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           classmate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (classmate.vin_id && classmate.vin_id.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <motion.div 
      key="classmates" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden space-y-4 sm:space-y-6"
    >
      {/* Header with navigation - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 sm:mb-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">My Classmates</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Students in <span className="font-semibold text-emerald-600">{profile?.class}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/student/classmates')}
            className="gap-1 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Full Roster</span>
            <span className="xs:hidden">Roster</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleTabChange('overview')}
            className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Back
          </Button>
        </div>
      </div>
      
      {/* Full Class Roster Component - Responsive */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <StudentClassRoster 
          studentClass={profile?.class}
          studentId={profile?.id}
          compact={false}
          onClassmateClick={(classmate) => {
            console.log('Clicked classmate:', classmate.display_name || classmate.full_name)
          }}
        />
      </div>

      {/* Quick Actions - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">
            <Users className="h-3 w-3 mr-1" />
            {stats.classmates.length} classmates
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/student/classmates')}
            className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            View Full Class Roster
          </Button>
        </div>
      </div>

      {/* Simple Grid View for quick access */}
      {filteredClassmates.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Classmates Found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No other students in your class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Search Bar - Responsive */}
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
            <Input
              placeholder="Search classmates by name, email, or VIN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white w-full"
            />
          </div>

          {/* View Mode Toggle - Responsive */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 w-7 sm:h-8 sm:w-8 p-0", viewMode === 'grid' && "bg-white shadow-sm")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 w-7 sm:h-8 sm:w-8 p-0", viewMode === 'list' && "bg-white shadow-sm")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {filteredClassmates.length} of {stats.classmates.length} shown
            </p>
          </div>

          {/* Classmates Grid - Responsive */}
          {viewMode === 'grid' ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredClassmates.map((classmate: Classmate) => {
                const displayName = classmate.display_name || classmate.full_name
                return (
                  <Card key={classmate.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto mb-3 sm:mb-4 ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all">
                        <AvatarImage src={classmate.photo_url || undefined} />
                        <AvatarFallback className={cn("bg-gradient-to-br text-white text-base sm:text-xl md:text-2xl", getAvatarColor(displayName))}>
                          {getInitials(classmate.first_name, classmate.last_name, displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 break-words line-clamp-2">
                        {displayName}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 mb-1 sm:mb-2 break-all line-clamp-1">
                        {classmate.email}
                      </p>
                      {classmate.vin_id && (
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-2 sm:mb-3">ID: {classmate.vin_id}</p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-1 sm:mt-2 w-full h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => window.location.href = `mailto:${classmate.email}`}
                      >
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Contact
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            // List View - Responsive
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {filteredClassmates.map((classmate: Classmate) => {
                    const displayName = classmate.display_name || classmate.full_name
                    return (
                      <div key={classmate.id} className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                            <AvatarImage src={classmate.photo_url || undefined} />
                            <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs sm:text-sm", getAvatarColor(displayName))}>
                              {getInitials(classmate.first_name, classmate.last_name, displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm sm:text-base break-words line-clamp-1">
                              {displayName}
                            </h3>
                            <p className="text-[11px] sm:text-sm text-slate-500 truncate">
                              {classmate.email}
                            </p>
                            {classmate.vin_id && (
                              <p className="text-[10px] sm:text-xs text-slate-400">ID: {classmate.vin_id}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.location.href = `mailto:${classmate.email}`}
                          className="self-end xs:self-center h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  )
}