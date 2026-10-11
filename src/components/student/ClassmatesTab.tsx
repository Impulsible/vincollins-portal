// components/student/ClassmatesTab.tsx - DARK MODE + ACTIVE STATUS CHECK
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, ArrowLeft, Users, Grid3x3, List, GraduationCap, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

function extractYear(className: string | undefined | null): string {
  if (!className) return ''
  if (className.includes('SS1')) return 'SS1'
  if (className.includes('SS2')) return 'SS2'
  if (className.includes('SS3')) return 'SS3'
  if (className.includes('JSS1')) return 'JSS1'
  if (className.includes('JSS2')) return 'JSS2'
  if (className.includes('JSS3')) return 'JSS3'
  return className
}

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

interface Classmate {
  id: string
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

export function ClassmatesTab({ profile, handleTabChange }: ClassmatesTabProps) {
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
      const userClass = profile.class
      const userYear = extractYear(userClass)

      // Active students only — exclude archived peers
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, class, photo_url, department')
        .eq('role', 'student')
        .eq('is_active', true)
        .neq('id', profile.id)
        .ilike('class', `%${userYear}%`)
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

  const filteredClassmates = classmates.filter((classmate) => {
    const displayName = getBestDisplayName(classmate)
    return displayName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const displayedClassmates = filteredClassmates.slice(0, displayCount)
  const hasMore = filteredClassmates.length > displayCount

  const loadMore = () => {
    setDisplayCount(prev => prev + 8)
  }

  const displayYear = extractYear(profile?.class)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-9 w-24 bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-6 text-center">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-3 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-5 w-32 mx-auto mb-2 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-24 mx-auto mb-3 bg-slate-200 dark:bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!profile?.class) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No class assigned</p>
          {handleTabChange && (
            <Button
              variant="link"
              size="sm"
              onClick={() => handleTabChange('overview')}
              className="mt-3 text-emerald-600 dark:text-emerald-400 cursor-pointer"
            >
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">My Classmates</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {classmates.length} student{classmates.length !== 1 ? 's' : ''} in{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{displayYear}</span>
            {' '}• All Departments
          </p>
        </div>
        {handleTabChange && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleTabChange('overview')}
            className="h-8 sm:h-9 text-xs sm:text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Back
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs border-0">
          <Users className="h-3 w-3 mr-1" />
          {classmates.length} classmates
        </Badge>
        <Badge variant="outline" className="text-[10px] sm:text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <GraduationCap className="h-3 w-3 mr-1" />
          {displayYear}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search classmates by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 w-full"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer",
                viewMode === 'grid' && "bg-white dark:bg-slate-700 shadow-sm"
              )}
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-300" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer",
                viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-sm"
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedClassmates.map((classmate) => {
            const displayName = getBestDisplayName(classmate)
            return (
              <Card
                key={classmate.id}
                className="hover:shadow-lg transition-all duration-300 overflow-hidden group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl"
              >
                <CardContent className="p-4 sm:p-5 text-center">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-3 sm:mb-4 ring-4 ring-emerald-100 dark:ring-emerald-900/40 group-hover:ring-emerald-200 dark:group-hover:ring-emerald-800/60 transition-all">
                    <AvatarImage src={classmate.photo_url || undefined} />
                    <AvatarFallback className={cn("bg-gradient-to-br text-white text-base sm:text-xl font-bold", getAvatarColor(displayName))}>
                      {getInitials(null, null, displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-sm sm:text-base mb-0.5 break-words line-clamp-2 text-slate-800 dark:text-slate-100">
                    {displayName}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                      {classmate.class}
                    </Badge>
                    {classmate.department && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
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
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedClassmates.map((classmate) => {
                const displayName = getBestDisplayName(classmate)
                return (
                  <div
                    key={classmate.id}
                    className="flex items-center justify-between gap-2 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 ring-2 ring-slate-100 dark:ring-slate-800">
                        <AvatarImage src={classmate.photo_url || undefined} />
                        <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs sm:text-sm font-bold", getAvatarColor(displayName))}>
                          {getInitials(null, null, displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-sm sm:text-base break-words line-clamp-1 text-slate-800 dark:text-slate-100">
                            {displayName}
                          </h3>
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                            {classmate.class}
                          </Badge>
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

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Load More
          </Button>
        </div>
      )}

      {filteredClassmates.length === 0 && !loading && (
        <div className="text-center py-10">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {searchQuery ? 'No classmates match your search.' : 'No classmates found.'}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default ClassmatesTab