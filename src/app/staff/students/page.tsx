// app/staff/students/page.tsx - FULLY RESPONSIVE, NO HORIZONTAL SCROLL
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StudentRoster } from '@/components/staff/StudentRoster'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Search, Filter, Download, RefreshCw, 
  Users, Loader2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function StudentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [classes, setClasses] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, classes: 0 })
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/portal')
        return
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        await loadStudents()
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/portal')
    }
  }

  const loadStudents = async (showToast = false) => {
    try {
      setRefreshing(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name')

      if (error) throw error

      const studentData = data || []
      setStudents(studentData)
      setFilteredStudents(studentData)

      const uniqueClasses = [...new Set(studentData.map(s => s.class).filter(Boolean))]
      setClasses(uniqueClasses.sort())

      setStats({
        total: studentData.length,
        active: studentData.filter(s => s.is_active !== false).length,
        classes: uniqueClasses.length
      })

      if (showToast) {
        toast.success(`Loaded ${studentData.length} students`)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let filtered = [...students]
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.class === selectedClass)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.full_name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.vin_id?.toLowerCase().includes(query)
      )
    }
    
    setFilteredStudents(filtered)
  }, [students, searchQuery, selectedClass])

  const handleExport = () => {
    const csv = [
      ['Full Name', 'Class', 'Email', 'VIN ID', 'Status'],
      ...filteredStudents.map(s => [
        s.full_name || 'N/A',
        s.class || 'N/A',
        s.email || 'N/A',
        s.vin_id || 'N/A',
        s.is_active !== false ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student_roster_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Roster exported successfully')
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-5 space-y-4 sm:space-y-5 md:space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
              Student Roster
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {filteredStudents.length} of {stats.total} students • {stats.classes} classes
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 sm:h-9 text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadStudents(true)} disabled={refreshing} className="h-8 sm:h-9">
              <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stats Cards - Responsive grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="p-2.5 sm:p-3 md:p-4 text-center">
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-400">
                {stats.total}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-2.5 sm:p-3 md:p-4 text-center">
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                {stats.active}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Active Students</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <CardContent className="p-2.5 sm:p-3 md:p-4 text-center">
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-400">
                {stats.classes}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Section */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or VIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white dark:bg-slate-800 w-full"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-sm">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Student Roster Table */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <StudentRoster students={filteredStudents} fullView />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}