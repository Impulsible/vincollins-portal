// app/staff/assignments/page.tsx - WITH ATTACHMENT INDICATORS
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Plus, Search, Loader2, FileText, 
  Eye, Edit, RefreshCw, Users, Calendar,
  Clock, CheckCircle, AlertCircle, Paperclip, Award, BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format, isPast, differenceInDays } from 'date-fns'

export default function AssignmentsPage() {
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<any[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

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
        if (profileData.role !== 'staff' && profileData.role !== 'admin' && profileData.role !== 'teacher') {
          toast.error('Access denied. Staff only.')
          router.replace('/portal')
          return
        }
        setProfile(profileData)
        loadAssignments(profileData.id)
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/portal')
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async (userId: string, showToast = false) => {
    try {
      setRefreshing(true)
      
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAssignments(data || [])
      setFilteredAssignments(data || [])

      if (showToast) {
        toast.success(`Loaded ${data?.length || 0} assignments`)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let filtered = [...assignments]
    
    if (activeTab === 'published') {
      filtered = filtered.filter(a => a.status === 'published')
    } else if (activeTab === 'draft') {
      filtered = filtered.filter(a => a.status === 'draft')
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(a => isPast(new Date(a.due_date)) && a.status === 'published')
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(query) ||
        a.subject?.toLowerCase().includes(query) ||
        a.classes?.some((c: string) => c.toLowerCase().includes(query))
      )
    }
    
    setFilteredAssignments(filtered)
  }, [assignments, searchQuery, activeTab])

  const getStatusBadge = (assignment: any) => {
    if (assignment.status === 'draft') {
      return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>
    }
    
    if (isPast(new Date(assignment.due_date))) {
      return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
    }
    
    return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>
  }

  const getClassesDisplay = (classes: string[]) => {
    if (!classes || classes.length === 0) return 'No classes'
    if (classes.length <= 2) return classes.join(', ')
    return `${classes.slice(0, 2).join(', ')} +${classes.length - 2} more`
  }

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `${days} days left`
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-5 md:p-6 lg:p-7">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  const stats = {
    total: assignments.length,
    published: assignments.filter(a => a.status === 'published').length,
    drafts: assignments.filter(a => a.status === 'draft').length,
    overdue: assignments.filter(a => isPast(new Date(a.due_date)) && a.status === 'published').length
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-7 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your assignments
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => profile?.id && loadAssignments(profile.id, true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/staff/assignments/create')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Published</p>
                <p className="text-2xl font-bold text-green-700">{stats.published}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.drafts}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="published">Published ({stats.published})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({stats.drafts})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, subject, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first assignment'}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/staff/assignments/create')} className="bg-emerald-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/staff/assignments/${assignment.id}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{assignment.title}</h3>
                        {getStatusBadge(assignment)}
                        {/* ✅ Attachment Indicator */}
                        {assignment.attachment_urls && assignment.attachment_urls.length > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                            <Paperclip className="h-2.5 w-2.5 mr-0.5" />
                            {assignment.file_count || assignment.attachment_urls.length} file(s)
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {assignment.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {getClassesDisplay(assignment.classes || [assignment.class])}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          {assignment.total_points} marks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                        </span>
                        <span className={cn(
                          "flex items-center gap-1",
                          isPast(new Date(assignment.due_date)) ? "text-red-600" : "text-slate-500"
                        )}>
                          <Clock className="h-3.5 w-3.5" />
                          {getDaysRemaining(assignment.due_date)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/staff/assignments/${assignment.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/staff/assignments/${assignment.id}/edit`)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* ✅ Show file names on hover or in expanded view */}
                  {assignment.attachment_urls && assignment.attachment_urls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-2">
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">
                        {assignment.attachment_urls.map((url: string, i: number) => {
                          const fileName = decodeURIComponent(url.split('/').pop() || `file_${i + 1}`)
                          return (
                            <span key={i}>
                              {fileName}
                              {i < assignment.attachment_urls.length - 1 && ', '}
                            </span>
                          )
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}