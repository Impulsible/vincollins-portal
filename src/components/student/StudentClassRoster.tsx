/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// components/student/StudentClassRoster.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Search, Mail, GraduationCap, Sparkles, UserCircle, Grid3x3, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

interface Classmate {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name: string
  display_name?: string | null
  email: string
  class: string
  vin_id?: string
  photo_url?: string | null
  is_active?: boolean
  department?: string
  admission_year?: number
}

interface StudentClassRosterProps {
  studentClass?: string
  studentId?: string
  compact?: boolean
  className?: string
  onClassmateClick?: (classmate: Classmate) => void
}

// Helper function to get best display name
function getBestDisplayName(classmate: Classmate): string {
  if (classmate.display_name) return classmate.display_name
  if (classmate.first_name && classmate.last_name) {
    return `${classmate.last_name} ${classmate.first_name}`
  }
  return classmate.full_name || 'Student'
}

export function StudentClassRoster({ 
  studentClass, 
  studentId, 
  compact = false,
  className,
  onClassmateClick 
}: StudentClassRosterProps) {
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Fetch classmates from the same class
  useEffect(() => {
    const fetchClassmates = async () => {
      if (!studentClass) {
        setLoading(false)
        return
      }

      try {
        // Fetch all students in the same class with all name fields
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, middle_name, last_name, full_name, display_name, email, class, photo_url, vin_id, department, admission_year')
          .eq('class', studentClass)
          .eq('role', 'student')
          .order('full_name')

        if (error) {
          console.error('Error fetching classmates:', error)
          return
        }

        if (data) {
          // Filter out the current student if studentId is provided
          const filteredData = studentId 
            ? data.filter(student => student.id !== studentId)
            : data

          setClassmates(filteredData.map((student: any) => ({
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            display_name: student.display_name,
            email: student.email,
            class: student.class,
            vin_id: student.vin_id,
            photo_url: student.photo_url,
            department: student.department,
            admission_year: student.admission_year,
            is_active: true
          })))
        }
      } catch (error) {
        console.error('Error in fetchClassmates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClassmates()

    // Set up real-time subscription for classmates
    const classmatesChannel = supabase
      .channel('classmates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `class=eq.${studentClass}`
        },
        () => {
          fetchClassmates()
        }
      )
      .subscribe()

    return () => {
      classmatesChannel.unsubscribe()
    }
  }, [studentClass, studentId])

  // Filter classmates by search
  const filteredClassmates = useMemo(() => {
    return classmates.filter(classmate => {
      const displayName = getBestDisplayName(classmate)
      return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classmate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classmate.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [classmates, searchQuery])

  // Get initials for avatar
  const getInitials = (classmate: Classmate): string => {
    const displayName = getBestDisplayName(classmate)
    if (!displayName) return 'S'
    const parts = displayName.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }

  // Get avatar color based on name
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

  if (loading) {
    return (
      <Card className={cn(
        "border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
        className
      )}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!studentClass) {
    return (
      <Card className={cn(
        "border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
        className
      )}>
        <CardContent className="py-8 text-center">
          <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Class not assigned</p>
          <p className="text-xs text-slate-400 mt-1">
            Please contact your administrator to assign a class.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 backdrop-blur-sm overflow-hidden",
      className
    )}>
      {/* Decorative header gradient */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>My Classmates</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ml-2">
                {classmates.length}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {studentClass} • {classmates.length} student{classmates.length !== 1 ? 's' : ''} enrolled
            </CardDescription>
          </div>
          
          {/* View mode toggle */}
          {!compact && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-sm"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'grid' && "bg-white dark:bg-slate-700 shadow-sm"
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Search bar */}
        {!compact && classmates.length > 0 && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search classmates by name, email, or VIN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {filteredClassmates.length === 0 ? (
          <div className="py-12 px-6 text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No classmates found matching "{searchQuery}"</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No classmates found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Students in {studentClass} will appear here once enrolled.
                </p>
              </>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <ScrollArea className={cn(
            "px-4",
            compact ? "max-h-[300px]" : "max-h-[450px]"
          )}>
            <AnimatePresence>
              <div className="space-y-1 pb-4">
                {filteredClassmates.map((classmate, index) => {
                  const displayName = getBestDisplayName(classmate)
                  return (
                    <motion.div
                      key={classmate.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group",
                        compact && "p-2"
                      )}
                      onClick={() => onClassmateClick?.(classmate)}
                    >
                      <div className="relative">
                        <Avatar className={cn(
                          "ring-2 ring-white dark:ring-slate-900 shadow-sm",
                          compact ? "h-8 w-8" : "h-10 w-10"
                        )}>
                          <AvatarImage src={classmate.photo_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-xs font-medium",
                            getAvatarColor(displayName)
                          )}>
                            {getInitials(classmate)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <div className="h-2.5 w-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium text-slate-900 dark:text-white truncate",
                            compact ? "text-sm" : ""
                          )}>
                            {displayName}
                          </p>
                          {!compact && classmate.vin_id && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {classmate.vin_id.slice(-6)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{classmate.email}</span>
                        </div>
                      </div>

                      {!compact && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                            Active
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        ) : (
          // Grid View
          <ScrollArea className="max-h-[450px] px-4 pb-4">
            <AnimatePresence>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredClassmates.map((classmate, index) => {
                  const displayName = getBestDisplayName(classmate)
                  return (
                    <motion.div
                      key={classmate.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
                      onClick={() => onClassmateClick?.(classmate)}
                    >
                      <div className="relative inline-block">
                        <Avatar className="h-16 w-16 ring-2 ring-white dark:ring-slate-900 shadow-md mx-auto">
                          <AvatarImage src={classmate.photo_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-lg font-medium",
                            getAvatarColor(displayName)
                          )}>
                            {getInitials(classmate)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <div className="h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                        </div>
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm mt-2 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {classmate.email.split('@')[0]}
                      </p>
                      {classmate.vin_id && (
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          {classmate.vin_id.slice(-6)}
                        </Badge>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}

        {/* Footer with class info */}
        {!compact && filteredClassmates.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Showing {filteredClassmates.length} of {classmates.length} classmates
              </span>
              <span className="text-slate-400">
                {studentClass}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}