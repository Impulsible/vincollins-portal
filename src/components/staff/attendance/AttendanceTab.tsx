// ============================================
// ATTENDANCE TAB - Matches student_presence table
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  TrendingUp,
  Calendar,
  Eye,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StudentPresence {
  id: string
  student_id: string
  status: 'online' | 'offline' | 'away'
  last_seen: string
  updated_at: string
  student?: {
    full_name: string
    class: string
    vin_id: string
  }
}

interface AttendanceStats {
  total: number
  online: number
  offline: number
  away: number
  attendance_rate: number
}

interface AttendanceTabProps {
  staffProfile: any
  termInfo: any
}

export function AttendanceTab({ staffProfile, termInfo }: AttendanceTabProps) {
  const [activeTab, setActiveTab] = useState('live')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [presenceData, setPresenceData] = useState<StudentPresence[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    online: 0,
    offline: 0,
    away: 0,
    attendance_rate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClasses()
    loadPresenceData()
    
    // Real-time subscription for presence updates
    const channel = supabase
      .channel('presence-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_presence'
      }, () => {
        loadPresenceData()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadPresenceData()
    }
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('class')
        .order('class')
      
      if (error) throw error
      
      const uniqueClasses = [...new Set(data.map(d => d.class))]
      setClasses(uniqueClasses)
      if (uniqueClasses.length > 0) {
        setSelectedClass(uniqueClasses[0])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadPresenceData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('student_presence')
        .select(`
          *,
          student:students!student_presence_student_id_fkey(
            id,
            class,
            vin_id,
            profiles!students_id_fkey(full_name)
          )
        `)
        .order('last_seen', { ascending: false })
      
      if (selectedClass) {
        query = query.eq('student.class', selectedClass)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const formatted = data?.map((p: any) => ({
        ...p,
        student: {
          ...p.student,
          full_name: p.student?.profiles?.full_name || 'Unknown'
        }
      })) || []
      
      setPresenceData(formatted)
      
      // Calculate stats
      const total = formatted.length
      const online = formatted.filter(p => p.status === 'online').length
      const offline = formatted.filter(p => p.status === 'offline').length
      const away = formatted.filter(p => p.status === 'away').length
      
      setStats({
        total,
        online,
        offline,
        away,
        attendance_rate: total > 0 ? (online / total) * 100 : 0
      })
      
    } catch (error) {
      console.error('Error loading presence data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPresence = presenceData.filter(p =>
    p.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.student?.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-700"><UserCheck className="h-3 w-3 mr-1" /> Online</Badge>
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-700"><UserX className="h-3 w-3 mr-1" /> Offline</Badge>
      case 'away':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Away</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Student Attendance
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track online student presence in real-time
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Online Now</p>
                <p className="text-2xl font-bold text-green-800">{stats.online}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600 font-medium">Away</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.away}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-800">{stats.attendance_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Label className="text-xs text-gray-500 mb-1.5 block">Filter by Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 relative">
              <Label className="text-xs text-gray-500 mb-1.5 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or VIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm bg-gray-50 border-0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0">
          <TabsTrigger 
            value="live"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-4 py-2"
          >
            <Activity className="h-4 w-4 mr-2" />
            Live Presence
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-2"
          >
            <Calendar className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Current Online Status
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time student presence tracking
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadPresenceData}>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Activity className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Loading presence data...</p>
                </div>
              ) : filteredPresence.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Student</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPresence.map((presence) => (
                      <TableRow key={presence.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              presence.status === 'online' && "bg-green-500",
                              presence.status === 'offline' && "bg-gray-400",
                              presence.status === 'away' && "bg-yellow-500"
                            )} />
                            {presence.student?.full_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {presence.student?.vin_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{presence.student?.class}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(presence.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {getTimeAgo(presence.last_seen)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Attendance History</p>
              <p className="text-sm text-gray-500 mt-1">
                View historical attendance records and generate reports
              </p>
              <Button variant="outline" className="mt-4">
                View History
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}