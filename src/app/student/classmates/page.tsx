// components/student/StudentClassRoster.tsx - Add search and filter support
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, GraduationCap, Mail, User, BookOpen, MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Classmate {
  id: string
  full_name: string
  display_name?: string
  email: string
  vin_id?: string
  photo_url?: string
  class: string
  department?: string
}

interface StudentClassRosterProps {
  studentClass?: string
  studentId?: string
  compact?: boolean
  searchQuery?: string
  departmentFilter?: string
  onClassmateClick?: (classmate: Classmate) => void
}

export function StudentClassRoster({ 
  studentClass, 
  studentId, 
  compact = false,
  searchQuery = '',
  departmentFilter,
  onClassmateClick 
}: StudentClassRosterProps) {
  const [loading, setLoading] = useState(true)
  const [classmates, setClassmates] = useState<Classmate[]>([])

  useEffect(() => {
    if (!studentClass) return
    loadClassmates()
  }, [studentClass])

  const loadClassmates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, email, vin_id, photo_url, class, department')
        .eq('class', studentClass)
        .eq('role', 'student')
        .order('full_name')

      if (error) throw error
      
      const filtered = (data || [])
        .filter((c: Classmate) => c.id !== studentId)
        .map((c: Classmate) => ({
          ...c,
          display_name: c.display_name || c.full_name
        }))
      
      setClassmates(filtered)
    } catch (error) {
      console.error('Error loading classmates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  // Apply filters
  let filteredClassmates = [...classmates]
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredClassmates = filteredClassmates.filter(c =>
      c.full_name?.toLowerCase().includes(query) ||
      c.display_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    )
  }
  
  if (departmentFilter && departmentFilter !== 'all') {
    filteredClassmates = filteredClassmates.filter(c => c.department === departmentFilter)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
                  <Skeleton className="h-3 sm:h-4 w-48 sm:w-56 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredClassmates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 sm:py-12">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-muted-foreground">No classmates found</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search' : 'You\'re the only student in your class'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredClassmates.map((classmate) => (
            <div
              key={classmate.id}
              className={cn(
                "flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer",
                compact ? "gap-2" : "gap-3 sm:gap-4"
              )}
              onClick={() => onClassmateClick?.(classmate)}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Avatar className={cn(
                  "ring-1 ring-slate-200",
                  compact ? "h-8 w-8 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"
                )}>
                  <AvatarImage src={classmate.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs sm:text-sm">
                    {getInitials(classmate.display_name || classmate.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    compact ? "text-sm" : "text-sm sm:text-base"
                  )}>
                    {classmate.display_name || classmate.full_name}
                  </p>
                  <div className={cn(
                    "flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-muted-foreground",
                    compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"
                  )}>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {classmate.class}
                    </span>
                    {classmate.department && (
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {classmate.department}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{classmate.email}</span>
                    </span>
                    {classmate.vin_id && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5">
                        ID: {classmate.vin_id}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <ChevronRight className={cn(
                "text-muted-foreground shrink-0",
                compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5"
              )} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}