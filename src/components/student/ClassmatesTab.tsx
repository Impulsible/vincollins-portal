// components/student/ClassmatesTab.tsx - SECURE VERSION (No IDs or Emails Displayed)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, ArrowLeft, Users, Grid3x3, List, ExternalLink, GraduationCap, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

// Helper functions
const getInitials = (firstName?: string | null, lastName?: string | null, fullName?: string): string => {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase()
  }
  if (fullName) {
    const parts = fullName.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return fullName.slice(0, 2).toUpperCase()
  }
  return 'ST'
}

const getAvatarColor = (name: string): string => {
  const colors = [
    'from-blue-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-green-500 to-emerald-500',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

// Types - REMOVED sensitive fields
interface Classmate {
  id: string  // Still needed internally but NOT displayed
  full_name: string
  display_name?: string | null
  class: string
  photo_url?: string | null
  department?: string
}

interface ClassmatesTabProps {
  profile: any
  stats?: any
  router?: any
  handleTabChange?: (tab: string) => void
}

export function ClassmatesTab({ profile, handleTabChange, router }: ClassmatesTabProps) {
  const [loading, setLoading] = React.useState(true)
  const [classmates, setClassmates] = React.useState<Classmate[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [displayCount, setDisplayCount] = React.useState(8)

  React.useEffect(() => {
    if (profile?.class) {
      loadClassmates()
    }
  }, [profile?.class])

  const loadClassmates = async () => {
    if (!profile?.class) return
    
    setLoading(true)
    try {
      // ✅ ONLY fetch public info - no email, no vin_id, no first_name/last_name
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, class, photo_url, department')
        .eq('class', profile.class)
        .eq('role', 'student')
        .neq('id', profile.id)
        .order('full_name', { ascending: true })

      if (error) throw error
      
      const formattedClassmates = (data || []).map((c: any) => ({
        id: c.id,
        full_name: c.full_name || 'Student',
        display_name: c.display_name,
        class: c.class,
        photo_url: c.photo_url,
        department: c.department
      }))
      
      setClassmates(formattedClassmates)
    } catch (error) {
      console.error('Error loading classmates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBestDisplayName = (classmate: Classmate): string => {
    if (classmate.display_name) return classmate.display_name
    return classmate.full_name || 'Student'
  }

  // ✅ Only search by name - no email or VIN search
  const filteredClassmates = classmates.filter((classmate) => {
    const displayName = getBestDisplayName(classmate)
    return displayName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const displayedClassmates = filteredClassmates.slice(0, displayCount)
  const hasMore = filteredClassmates.length > displayCount

  const loadMore = () => {
    setDisplayCount(prev => prev + 8)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6 text-center">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-3" />
                <Skeleton className="h-5 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto mb-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!profile?.class) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No class assigned</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please contact your administrator to assign a class.
          </p>
          {handleTabChange && (
            <Button variant="link" size="sm" onClick={() => handleTabChange('overview')} className="mt-3">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (classmates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-emerald-600" />
            My Classmates
            <Badge variant="secondary" className="ml-2">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No classmates found</p>
          <p className="text-xs text-muted-foreground mt-1">
            You're the only student in {profile.class}
          </p>
          {handleTabChange && (
            <Button variant="link" size="sm" onClick={() => handleTabChange('overview')} className="mt-3">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Classmates</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Students in <span className="font-semibold text-emerald-600">{profile.class}</span>
          </p>
        </div>
        {handleTabChange && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleTabChange('overview')}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Stats Badge */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">
          <Users className="h-3 w-3 mr-1" />
          {classmates.length} classmates
        </Badge>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
          <Input
            placeholder="Search classmates by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white w-full"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
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
            {displayedClassmates.length} of {filteredClassmates.length}
          </p>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedClassmates.map((classmate) => {
            const displayName = getBestDisplayName(classmate)
            return (
              <Card key={classmate.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <CardContent className="p-4 sm:p-5 text-center">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-3 sm:mb-4 ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all">
                    <AvatarImage src={classmate.photo_url || undefined} />
                    <AvatarFallback className={cn("bg-gradient-to-br text-white text-base sm:text-xl font-bold", getAvatarColor(displayName))}>
                      {getInitials(null, null, displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-sm sm:text-base mb-0.5 break-words line-clamp-2">
                    {displayName}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                      <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                      {classmate.class}
                    </Badge>
                    {classmate.department && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                        <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                        {classmate.department}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        // List View
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {displayedClassmates.map((classmate) => {
                const displayName = getBestDisplayName(classmate)
                return (
                  <div key={classmate.id} className="flex items-center justify-between gap-2 p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                        <AvatarImage src={classmate.photo_url || undefined} />
                        <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs sm:text-sm font-bold", getAvatarColor(displayName))}>
                          {getInitials(null, null, displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-sm sm:text-base break-words line-clamp-1">
                            {displayName}
                          </h3>
                          <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                            <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                            {classmate.class}
                          </Badge>
                          {classmate.department && (
                            <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                              <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                              {classmate.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadMore}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            Load More ({displayedClassmates.length} of {filteredClassmates.length})
          </Button>
        </div>
      )}

      <div className="text-center pt-2">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Showing classmates from {profile.class}
        </p>
      </div>
    </motion.div>
  )
}

export default ClassmatesTab