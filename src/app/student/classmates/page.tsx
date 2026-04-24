// components/student/StudentClassRoster.tsx - BUILD ERROR FREE
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Users, GraduationCap, Mail, BookOpen, 
  ChevronRight, Search, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Classmate {
  id: string
  full_name: string
  display_name?: string
  email: string
  vin_id?: string
  photo_url?: string
  class: string
  department?: string
  admission_year?: number
}

interface StudentClassRosterProps {
  studentClass?: string
  studentId?: string
  compact?: boolean
  searchQuery?: string
  departmentFilter?: string
  onClassmateClick?: (classmate: Classmate) => void
  showHeader?: boolean
  title?: string
}

export function StudentClassRoster({ 
  studentClass, 
  studentId, 
  compact = false,
  searchQuery: externalSearchQuery = '',
  departmentFilter: externalDepartmentFilter,
  onClassmateClick,
  showHeader = true,
  title = 'Classmates'
}: StudentClassRosterProps) {
  const [loading, setLoading] = useState(true)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [internalDepartmentFilter, setInternalDepartmentFilter] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])

  const searchQuery = externalSearchQuery || internalSearchQuery
  const departmentFilter = externalDepartmentFilter || internalDepartmentFilter

  useEffect(() => {
    if (!studentClass) return
    loadClassmates()
  }, [studentClass])

  const loadClassmates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, email, vin_id, photo_url, class, department, admission_year')
        .eq('class', studentClass)
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (error) throw error
      
      const filtered = (data || [])
        .filter((c: Classmate) => c.id !== studentId)
        .map((c: Classmate) => ({
          ...c,
          display_name: c.display_name || c.full_name
        }))
      
      setClassmates(filtered)
      
      // Extract unique departments for filter
      const uniqueDepts = [...new Set(filtered.map(c => c.department).filter(Boolean))] as string[]
      setDepartments(uniqueDepts)
    } catch (error) {
      console.error('Error loading classmates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Apply filters
  let filteredClassmates = [...classmates]
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredClassmates = filteredClassmates.filter(c =>
      c.full_name?.toLowerCase().includes(query) ||
      c.display_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.vin_id?.toLowerCase().includes(query)
    )
  }
  
  if (departmentFilter && departmentFilter !== 'all') {
    filteredClassmates = filteredClassmates.filter(c => c.department === departmentFilter)
  }

  // Clear filters
  const clearFilters = () => {
    setInternalSearchQuery('')
    setInternalDepartmentFilter('all')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className={cn("p-4 sm:p-6", compact && "p-3 sm:p-4")}>
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
                  <Skeleton className="h-2 sm:h-3 w-40 sm:w-48 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (classmates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 sm:py-12">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-muted-foreground">No classmates found</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            You're the only student in your class
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3 border-b px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              {title}
              <Badge variant="secondary" className="ml-2 text-xs">
                {classmates.length}
              </Badge>
            </CardTitle>
            
            {/* Search and Filter Row */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search classmates..."
                  value={internalSearchQuery}
                  onChange={(e) => setInternalSearchQuery(e.target.value)}
                  className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              
              {departments.length > 0 && (
                <Select value={internalDepartmentFilter} onValueChange={setInternalDepartmentFilter}>
                  <SelectTrigger className="w-[110px] sm:w-[130px] h-8 sm:h-9 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {(internalSearchQuery || internalDepartmentFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn("p-0", !showHeader && "pt-4")}>
        {filteredClassmates.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No classmates match your filters</p>
            <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClassmates.map((classmate) => (
              <div
                key={classmate.id}
                className={cn(
                  "flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                  compact ? "gap-2" : "gap-3 sm:gap-4"
                )}
                onClick={() => onClassmateClick?.(classmate)}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Avatar className={cn(
                    "ring-1 ring-slate-200 dark:ring-slate-700 shrink-0",
                    compact ? "h-8 w-8 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"
                  )}>
                    <AvatarImage src={classmate.photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs sm:text-sm">
                      {getInitials(classmate.display_name || classmate.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate text-slate-900 dark:text-white",
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
                        <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
                          {classmate.email}
                        </span>
                      </span>
                      {classmate.vin_id && (
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5">
                          {classmate.vin_id}
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
        )}
      </CardContent>
    </Card>
  )
}