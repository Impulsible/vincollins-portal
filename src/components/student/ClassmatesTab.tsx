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
      className="w-full overflow-hidden space-y-6"
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Classmates</h1>
          <p className="text-sm text-slate-500 mt-1">Students in {profile?.class}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/student/classmates')}
            className="gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Full Roster
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </div>
      </div>
      
      {/* Full Class Roster Component */}
      <StudentClassRoster 
        studentClass={profile?.class}
        studentId={profile?.id}
        compact={false}
        onClassmateClick={(classmate) => {
          console.log('Clicked classmate:', classmate.display_name || classmate.full_name)
        }}
      />

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700">
            {stats.classmates.length} classmates
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/student/classmates')}
          >
            <Users className="h-4 w-4 mr-2" />
            View Full Class Roster
          </Button>
        </div>
      </div>

      {/* Simple Grid View for quick access */}
      {filteredClassmates.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classmates Found</h3>
            <p className="text-muted-foreground">
              No other students in your class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search classmates by name, email, or VIN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white w-full"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0", viewMode === 'grid' && "bg-white shadow-sm")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0", viewMode === 'list' && "bg-white shadow-sm")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Classmates Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredClassmates.map((classmate: Classmate) => {
                const displayName = classmate.display_name || classmate.full_name
                return (
                  <Card key={classmate.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <CardContent className="p-6 text-center">
                      <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all">
                        <AvatarImage src={classmate.photo_url || undefined} />
                        <AvatarFallback className={cn("bg-gradient-to-br text-white text-2xl", getAvatarColor(displayName))}>
                          {getInitials(classmate.first_name, classmate.last_name, displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg mb-1 break-words">{displayName}</h3>
                      <p className="text-sm text-slate-500 mb-2 break-all">{classmate.email}</p>
                      {classmate.vin_id && (
                        <p className="text-xs text-slate-400 mb-3">ID: {classmate.vin_id}</p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => window.location.href = `mailto:${classmate.email}`}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredClassmates.map((classmate: Classmate) => {
                    const displayName = classmate.display_name || classmate.full_name
                    return (
                      <div key={classmate.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage src={classmate.photo_url || undefined} />
                            <AvatarFallback className={cn("bg-gradient-to-br text-white", getAvatarColor(displayName))}>
                              {getInitials(classmate.first_name, classmate.last_name, displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium break-words">{displayName}</h3>
                            <p className="text-sm text-slate-500 truncate">{classmate.email}</p>
                            {classmate.vin_id && (
                              <p className="text-xs text-slate-400">ID: {classmate.vin_id}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.location.href = `mailto:${classmate.email}`}
                        >
                          <Mail className="h-4 w-4" />
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