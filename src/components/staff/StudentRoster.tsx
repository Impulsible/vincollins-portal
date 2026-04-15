// components/staff/StudentRoster.tsx - FULLY FIXED
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Search, GraduationCap, Mail, ArrowRight } from 'lucide-react'
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

interface Student {
  id: string
  full_name: string | null
  email: string
  class: string
  vin_id?: string | null
  photo_url?: string | null
  is_active?: boolean | null
}

interface StudentRosterProps {
  students: Student[]
  fullView?: boolean
  compact?: boolean
  onViewAll?: () => void
}

export function StudentRoster({ students, fullView = false, compact = false, onViewAll }: StudentRosterProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')

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
      const matchesSearch = 
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesClass && matchesSearch
    })
  }, [students, selectedClass, searchQuery])

  // Show 4 students in preview mode, all in full view
  const displayStudents = fullView ? filteredStudents : filteredStudents.slice(0, 4)

  // Get accurate student count based on filter
  const totalStudentsCount = students.length
  const filteredCount = filteredStudents.length

  // Get initials for avatar - with null safety
  const getInitials = (name?: string | null): string => {
    if (!name) return 'S'
    const trimmedName = name.trim()
    if (!trimmedName) return 'S'
    
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const firstChar = parts[0][0]
      const lastChar = parts[parts.length - 1][0]
      if (firstChar && lastChar) {
        return (firstChar + lastChar).toUpperCase()
      }
    }
    
    // Return first character or first two characters
    return trimmedName.slice(0, 2).toUpperCase()
  }

  // Get status color
  const getStatusColor = (isActive?: boolean | null) => {
    return isActive !== false 
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  // Get avatar gradient color - with null safety
  const getAvatarColor = (name?: string | null): string => {
    const colors = [
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
    ]
    
    // Handle null or undefined name
    if (!name) {
      return colors[0]
    }
    
    const trimmedName = name.trim()
    if (!trimmedName) {
      return colors[0]
    }
    
    const index = trimmedName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      router.push('/staff')
    }
  }

  const handleStudentClick = (studentId: string) => {
    router.push(`/staff/students/${studentId}`)
  }

  // Helper to safely get display name
  const getDisplayName = (student: Student): string => {
    return student.full_name || 'Student'
  }

  // Helper to safely get email display
  const getDisplayEmail = (student: Student): string => {
    return student.email || 'No email provided'
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
            {!fullView && (
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
                  const displayEmail = getDisplayEmail(student)
                  
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
                          <AvatarImage src={student.photo_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-xs font-medium",
                            getAvatarColor(displayName)
                          )}>
                            {getInitials(displayName)}
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
                            {displayEmail}
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
                          getStatusColor(student.is_active)
                        )}>
                          {student.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      )}

                      {/* Chevron indicator for clickable row */}
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