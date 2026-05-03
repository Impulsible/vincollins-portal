// app/staff/students/page.tsx - PROFESSIONAL STUDENT ROSTER (WITH AVATAR PHOTOS)
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  Search, Download, RefreshCw, Users, Loader2,
  GraduationCap, Home, ChevronRight, Filter, User
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (showToast = false) => {
    try {
      setRefreshing(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/portal'
        return
      }

      // Fetch students with photo_url and avatar_url
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          vin_id,
          class,
          role,
          is_active,
          photo_url,
          avatar_url,
          phone,
          created_at
        `)
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

      // Reset avatar errors
      setAvatarErrors({})

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

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const names = name.trim().split(/\s+/)
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return names[0].slice(0, 2).toUpperCase()
  }

  const getPhotoUrl = (student: any) => {
    return student.photo_url || student.avatar_url || null
  }

  const handleAvatarError = (studentId: string) => {
    setAvatarErrors(prev => ({ ...prev, [studentId]: true }))
  }

  const groupedStudents = filteredStudents.reduce((acc: Record<string, any[]>, student) => {
    const cls = student.class || 'Unassigned'
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(student)
    return acc
  }, {})

  const classOrder = Object.keys(groupedStudents).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
            <Users className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Loading Students</h2>
          <p className="text-sm text-slate-500">Please wait while we fetch the student roster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
        <Link href="/staff" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 font-medium">Students</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Student Roster</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {filteredStudents.length} of {stats.total} students • {stats.classes} classes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadData(true)} disabled={refreshing} className="h-9">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-blue-600/70">Total Students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
            <p className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.active}</p>
            <p className="text-[10px] sm:text-xs text-emerald-600/70">Active Students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.classes}</p>
            <p className="text-[10px] sm:text-xs text-purple-600/70">Classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-white"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-sm w-full sm:w-[180px] bg-white">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="All Classes" />
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

      {/* Student List - Grouped by Class */}
      {filteredStudents.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No students found</p>
          </CardContent>
        </Card>
      ) : (
        classOrder.map(cls => (
          <div key={cls} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 text-xs">
                {cls}
              </Badge>
              <span className="text-xs text-slate-400">
                {groupedStudents[cls].length} student{groupedStudents[cls].length !== 1 ? 's' : ''}
              </span>
            </div>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold w-[250px] sm:w-auto">Student</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Email</TableHead>
                        <TableHead className="text-center text-xs hidden md:table-cell">VIN</TableHead>
                        <TableHead className="text-center text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedStudents[cls].map(student => {
                        const photoUrl = getPhotoUrl(student)
                        const hasAvatarError = avatarErrors[student.id]
                        
                        return (
                          <TableRow key={student.id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-slate-100">
                                  {/* Show photo if available and no error */}
                                  {photoUrl && !hasAvatarError ? (
                                    <AvatarImage 
                                      src={photoUrl} 
                                      alt={student.full_name}
                                      onError={() => handleAvatarError(student.id)}
                                      className="object-cover"
                                    />
                                  ) : null}
                                  <AvatarFallback className={cn(
                                    "text-[10px] sm:text-xs font-medium",
                                    "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                                  )}>
                                    {getInitials(student.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">
                                    {student.full_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 sm:hidden">
                                    {student.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
                              {student.email || '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs text-slate-500 hidden md:table-cell font-mono">
                              {student.vin_id || '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn(
                                "text-[10px] px-2 py-0.5",
                                student.is_active !== false
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-100 text-red-600 hover:bg-red-100'
                              )}>
                                {student.is_active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  )
}