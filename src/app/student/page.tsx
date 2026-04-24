// components/student/ClassmatesTab.tsx - Add supabase import
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'  // ← ADD THIS IMPORT
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { 
  Users, Search, ArrowRight, ChevronRight, 
  GraduationCap, Mail, User, BookOpen, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Classmate {
  id: string
  full_name: string
  email: string
  vin_id?: string
  photo_url?: string
  class: string
  department?: string
}

interface ClassmatesTabProps {
  profile: any
  stats?: any
  router?: any
  setStats?: any
  setBannerStats?: any
  checkReportCardStatus?: any
  displayTotalSubjects?: number
  profileDisplayName?: string
  handleTabChange?: (tab: string) => void
  reportCardStatus?: any
  bannerStats?: any
}

export function ClassmatesTab({ profile, router }: ClassmatesTabProps) {
  const [loading, setLoading] = useState(true)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Limit to 4 for dashboard view
  const displayClassmates = classmates.slice(0, 4)
  const totalClassmates = classmates.length

  useEffect(() => {
    loadClassmates()
  }, [profile?.class])

  const loadClassmates = async () => {
    if (!profile?.class) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, vin_id, photo_url, class, department')
        .eq('class', profile.class)
        .eq('role', 'student')
        .neq('id', profile.id)
        .order('full_name')

      if (error) throw error
      setClassmates(data || [])
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

  const filteredClassmates = classmates.filter(classmate =>
    classmate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classmate.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Your Classmates
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/classmates">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24 mt-1" />
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Your Classmates
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/classmates">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No classmates found</p>
            <p className="text-xs text-muted-foreground mt-1">You're the only student in your class</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" />
          Your Classmates
          <Badge variant="secondary" className="ml-2">
            {totalClassmates}
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/classmates">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search - only show if there are many classmates */}
        {classmates.length > 4 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classmates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        
        <div className="space-y-3">
          {displayClassmates.map((classmate) => (
            <div 
              key={classmate.id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router?.push(`/student/classmates?student=${classmate.id}`)}
            >
              <Avatar className="h-10 w-10 ring-1 ring-slate-200">
                <AvatarImage src={classmate.photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-sm">
                  {getInitials(classmate.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{classmate.full_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <GraduationCap className="h-3 w-3" />
                    {classmate.class}
                  </span>
                  {classmate.department && (
                    <span className="flex items-center gap-0.5">
                      <BookOpen className="h-3 w-3" />
                      {classmate.department}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
        
        {classmates.length > 4 && (
          <div className="text-center pt-3 mt-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/classmates" className="text-muted-foreground">
                View all {totalClassmates} classmates
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}