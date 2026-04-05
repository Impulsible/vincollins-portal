/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { 
  Search, 
  Download, 
  Calendar, 
  User, 
  Activity,
  Filter,
  AlertCircle,
  CheckCircle, 
  Edit, 
  Trash2, 
  LogIn, 
  LogOut,
  UserPlus,
  Settings,
  FileText,
  Shield
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  old_data: any
  new_data: any
  ip_address: string
  user_agent: string
  created_at: string
  user?: {
    email: string
    full_name: string
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [users, setUsers] = useState<{ id: string; email: string }[]>([])
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <Edit className="h-4 w-4 text-blue-500" />
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <Trash2 className="h-4 w-4 text-red-500" />
    }
    if (actionLower.includes('login')) {
      return <LogIn className="h-4 w-4 text-purple-500" />
    }
    if (actionLower.includes('logout')) {
      return <LogOut className="h-4 w-4 text-orange-500" />
    }
    if (actionLower.includes('register') || actionLower.includes('signup')) {
      return <UserPlus className="h-4 w-4 text-teal-500" />
    }
    if (actionLower.includes('setting')) {
      return <Settings className="h-4 w-4 text-gray-500" />
    }
    if (actionLower.includes('export') || actionLower.includes('download')) {
      return <FileText className="h-4 w-4 text-indigo-500" />
    }
    if (actionLower.includes('permission') || actionLower.includes('role')) {
      return <Shield className="h-4 w-4 text-yellow-500" />
    }
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('add')) return 'default'
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'secondary'
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'destructive'
    if (actionLower.includes('login')) return 'default'
    if (actionLower.includes('logout')) return 'secondary'
    return 'outline'
  }

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch audit logs with user info
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (logsError) throw logsError

      setLogs(logsData || [])
      setFilteredLogs(logsData || [])
      
      // Extract unique users for filter
      const uniqueUsers = new Map()
      logsData?.forEach((log: AuditLog) => {
        if (log.user_id && !uniqueUsers.has(log.user_id)) {
          uniqueUsers.set(log.user_id, {
            id: log.user_id,
            email: log.user?.email || 'Unknown User'
          })
        }
      })
      setUsers(Array.from(uniqueUsers.values()))
      
    } catch (error: any) {
      console.error('Error loading audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  // Filter logs based on search query and filters
  useEffect(() => {
    let filtered = [...logs]

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip_address?.includes(searchQuery)
      )
    }

    // Apply action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log =>
        log.action?.toLowerCase().includes(selectedAction.toLowerCase())
      )
    }

    // Apply user filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.user_id === selectedUser)
    }

    setFilteredLogs(filtered)
  }, [searchQuery, selectedAction, selectedUser, logs])

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent']
      const csvData = filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user?.email || 'Unknown',
        log.action,
        log.entity_type,
        log.entity_id,
        log.ip_address,
        log.user_agent
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Audit logs exported successfully')
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error('Failed to export audit logs')
    }
  }

  const getUniqueActions = () => {
    const actions = new Set<string>()
    logs.forEach(log => {
      if (log.action) {
        const actionLower = log.action.toLowerCase()
        if (actionLower.includes('create')) actions.add('create')
        else if (actionLower.includes('update')) actions.add('update')
        else if (actionLower.includes('delete')) actions.add('delete')
        else if (actionLower.includes('login')) actions.add('login')
        else if (actionLower.includes('logout')) actions.add('logout')
        else actions.add('other')
      }
    })
    return Array.from(actions)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-2">
                Track all activities and changes across the platform
              </p>
            </div>
            <Button 
              onClick={exportToCSV}
              className="inline-flex items-center gap-2"
              disabled={filteredLogs.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter audit logs by criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {getUniqueActions().map(action => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Filtered Logs</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
                  </div>
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date Range</p>
                    <p className="text-sm font-medium text-gray-900">
                      {logs.length > 0 
                        ? `${format(new Date(logs[logs.length - 1]?.created_at), 'MMM d')} - ${format(new Date(logs[0]?.created_at), 'MMM d, yyyy')}`
                        : 'No data'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Showing {filteredLogs.length} of {logs.length} total logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(new Date(log.created_at), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.user?.full_name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {log.user?.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <Badge variant={getActionBadgeVariant(log.action)}>
                                {log.action}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-900 capitalize">
                              {log.entity_type?.replace('_', ' ') || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {log.entity_id?.substring(0, 8) || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {log.ip_address || 'N/A'}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}