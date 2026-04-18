/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/StudentRoster.tsx - FIXED - READS CORRECT DATA
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Search, GraduationCap, Mail, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Student {
  id: string
  full_name: string | null
  first_name?: string | null
  last_name?: string | null
  email: string
  class: string
  department?: string | null
  vin_id?: string | null
  photo_url?: string | null
  avatar_url?: string | null
  is_active?: boolean | null
  role?: string
}

interface StudentRosterProps {
  students?: Student[] // Made optional - will fetch internally if not provided
  fullView?: boolean
  compact?: boolean
  onViewAll?: () => void
  teacherClass?: string // Add teacher's assigned class
}

export function StudentRoster({ 
  students: externalStudents, 
  fullView = false, 
  compact = false, 
  onViewAll,
  teacherClass 
}: StudentRosterProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(!externalStudents)
  const [students, setStudents] = useState<Student[]>(externalStudents || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch students if not provided externally
  const fetchStudents = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true)
      console.log('📚 Fetching students...')
      
      // First try profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name')

      if (profilesError) {
        console.error('Error fetching from profiles:', profilesError)
      }

      // Also check users table for any missing students
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('full_name')

      if (usersError) {
        console.error('Error fetching from users:', usersError)
      }

      // Combine and deduplicate
      const allStudents: Student[] = []
      const seenIds = new Set<string>()

      // Process profiles
      if (profilesData) {
        profilesData.forEach((profile: any) => {
          if (!seenIds.has(profile.id)) {
            seenIds.add(profile.id)
            allStudents.push({
              id: profile.id,
              full_name: profile.full_name || profile.first_name && profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`.trim()
                : 'Student',
              first_name: profile.first_name,
              last_name: profile.last_name,
              email: profile.email || '',
              class: profile.class || 'Not Assigned',
              department: profile.department,
              vin_id: profile.vin_id,
              photo_url: profile.photo_url || profile.avatar_url,
              avatar_url: profile.avatar_url,
              is_active: profile.is_active ?? true,
              role: profile.role
            })
          }
        })
      }

      // Process users (only those not already in profiles)
      if (usersData) {
        usersData.forEach((user: any) => {
          if (!seenIds.has(user.id)) {
            seenIds.add(user.id)
            allStudents.push({
              id: user.id,
              full_name: user.full_name || user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`.trim()
                : user.email?.split('@')[0] || 'Student',
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email || '',
              class: user.class || 'Not Assigned',
              department: user.department,
              vin_id: user.vin_id,
              photo_url: user.photo_url || user.avatar_url,
              is_active: user.is_active ?? true,
              role: user.role
            })
          }
        })
      }

      // Filter by teacher's class if provided
      let filteredStudents = allStudents
      if (teacherClass) {
        filteredStudents = allStudents.filter(s => s.class === teacherClass)
        console.log(`📚 Filtered to ${teacherClass}: ${filteredStudents.length} students`)
      }

      console.log(`📚 Total students loaded: ${filteredStudents.length}`)
      setStudents(filteredStudents)
      
      if (showToast) {
        toast.success(`Loaded ${filteredStudents.length} students`)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [teacherClass])

  // Initial fetch if no external students provided
  useEffect(() => {
    if (!externalStudents) {
      fetchStudents()
    } else {
      setStudents(externalStudents)
      setLoading(false)
    }
  }, [externalStudents, fetchStudents])

  // Real-time subscription for student updates
  useEffect(() => {
    if (externalStudents) return // Don't subscribe if using external data

    const channel = supabase
      .channel('students-roster')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `role=eq.student` },
        () => {
          console.log('🔄 Student profiles changed, refreshing...')
          fetchStudents()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `role=eq.student` },
        () => {
          console.log('🔄 Student users changed, refreshing...')
          fetchStudents()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [externalStudents, fetchStudents])

  // Get unique classes and sort them
  const classes = useMemo(() => {
    const uniqueClasses = [...new Set(students.map(s => s.class).filter(Boolean))]
    return uniqueClasses.sort((a, b) => {
      const getClassOrder = (className: string) => {
        if (className.startsWith('JSS')) return parseInt(className.replace('JSS', '')) || 0
        if (className.startsWith('SS')) return 100 + (parseInt(className.replace('SS', '')) || 0)
        return 1000
      }
      return getClassOrder(a) - getClassOrder(b)
    })
  }, [students])

  // Filter students by class and search
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesClass = selectedClass === 'all' || student.class === selectedClass
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        student.full_name?.toLowerCase().includes(searchLower) ||
        student.first_name?.toLowerCase().includes(searchLower) ||
        student.last_name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.vin_id?.toLowerCase().includes(searchLower)
      return matchesClass && matchesSearch
    })
  }, [students, selectedClass, searchQuery])

  // Show 4 students in preview mode, all in full view
  const displayStudents = fullView ? filteredStudents : filteredStudents.slice(0, 4)

  // Get accurate student count
  const totalStudentsCount = students.length
  const filteredCount = filteredStudents.length

  // Get initials for avatar
  const getInitials = (student: Student): string => {
    // Try first_name + last_name first
    if (student.first_name && student.last_name) {
      return (student.first_name[0] + student.last_name[0]).toUpperCase()
    }
    
    // Try full_name
    if (student.full_name) {
      const parts = student.full_name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return student.full_name.slice(0, 2).toUpperCase()
    }
    
    // Fallback to email
    if (student.email) {
      const namePart = student.email.split('@')[0]
      return namePart.slice(0, 2).toUpperCase()
    }
    
    return 'ST'
  }

  // Get display name
  const getDisplayName = (student: Student): string => {
    if (student.full_name) return student.full_name
    if (student.first_name && student.last_name) return `${student.first_name} ${student.last_name}`
    if (student.first_name) return student.first_name
    if (student.last_name) return student.last_name
    if (student.email) return student.email.split('@')[0]
    return 'Student'
  }

  // Get avatar color
  const getAvatarColor = (student: Student): string => {
    const colors = [
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
    ]
    
    const name = getDisplayName(student)
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      router.push('/staff/students')
    }
  }

  const handleStudentClick = (studentId: string) => {
    router.push(`/staff/students/${studentId}`)
  }

  const handleRefresh = () => {
    fetchStudents(true)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-500">Loading students...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
      compact ? "" : ""
    )}>
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className={cn(
                "flex items-center gap-2",
                compact ? "text-base" : "text-lg font-semibold"
              )}>
                <Users className={cn("text-blue-600", compact ? "h-4 w-4" : "h-5 w-5")} />
                Student Roster
              </CardTitle>
              <CardDescription className={compact ? "text-xs" : ""}>
                {totalStudentsCount} student{totalStudentsCount !== 1 ? 's' : ''} enrolled
                {selectedClass !== 'all' && (
                  <span className="text-blue-600 dark:text-blue-400"> • {filteredCount} in {selectedClass}</span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            {!externalStudents && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            )}

            {/* Class Selector */}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className={cn(
                "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                compact ? "h-8 text-xs w-28" : "w-36"
              )}>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5" />
                    All Classes
                  </span>
                </SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View All Button - Only show in preview mode */}
            {!fullView && totalStudentsCount > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 group"
              >
                <span className="hidden sm:inline">View All</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar - Full view only */}
        {fullView && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or VIN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-1">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No students found</p>
            {searchQuery && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setSearchQuery('')}
                className="mt-1"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className={cn(
            fullView ? "max-h-[600px]" : "max-h-[280px]"
          )}>
            <AnimatePresence>
              <div className="space-y-1 pr-2">
                {displayStudents.map((student, index) => {
                  const displayName = getDisplayName(student)
                  
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group",
                        compact && "p-2",
                        "cursor-pointer"
                      )}
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <div className="relative">
                        <Avatar className={cn(
                          "ring-2 ring-white dark:ring-slate-900",
                          compact ? "h-8 w-8" : "h-9 w-9"
                        )}>
                          <AvatarImage src={student.photo_url || student.avatar_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-xs font-medium",
                            getAvatarColor(student)
                          )}>
                            {getInitials(student)}
                          </AvatarFallback>
                        </Avatar>
                        {student.is_active !== false && (
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <div className="h-2.5 w-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
                            compact ? "text-sm" : ""
                          )}>
                            {displayName}
                          </p>
                          <Badge 
                            variant="outline" 
                            className="text-[10px] shrink-0"
                          >
                            {student.class || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            {student.email || 'No email'}
                          </span>
                          {student.vin_id && fullView && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-[10px]">{student.vin_id}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {fullView && (
                        <Badge className={cn(
                          "text-xs shrink-0",
                          student.is_active !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                          {student.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      )}

                      <ArrowRight className={cn(
                        "h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity",
                        compact && "hidden"
                      )} />
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}