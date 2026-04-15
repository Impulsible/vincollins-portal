/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/dashboard/RecentActivityFeed.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  UserPlus, 
  FileText, 
  GraduationCap, 
  Award, 
  Clock,
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  MoreVertical,
  Calendar,
  Bell,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ActivityType = 'student' | 'staff' | 'exam' | 'result' | 'attendance' | 'submission' | 'system'

interface ActivityMetadata {
  student_name?: string
  staff_name?: string
  exam_title?: string
  class?: string
  score?: number
  status?: string
  count?: number
  position?: string
  rate?: number
}

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  read: boolean
  action_url?: string
  metadata?: ActivityMetadata
}

const activityIcons: Record<ActivityType, { icon: typeof UserPlus; color: string; gradient: string }> = {
  student: { icon: UserPlus, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  staff: { icon: Users, color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400', gradient: 'from-purple-500 to-pink-500' },
  exam: { icon: BookOpen, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400', gradient: 'from-amber-500 to-orange-500' },
  result: { icon: Award, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
  attendance: { icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400', gradient: 'from-green-500 to-emerald-500' },
  submission: { icon: FileText, color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400', gradient: 'from-rose-500 to-red-500' },
  system: { icon: Bell, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', gradient: 'from-slate-500 to-gray-500' },
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [unreadCount, setUnreadCount] = useState(0)

  // Generate mock activities
  const generateMockActivities = (): ActivityItem[] => {
    const now = new Date()
    return [
      {
        id: '1',
        type: 'student' as ActivityType,
        title: 'New Student Registered',
        description: 'John Doe has been enrolled in SS 2 Science',
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        read: false,
        metadata: { student_name: 'John Doe', class: 'SS 2 Science' }
      },
      {
        id: '2',
        type: 'exam' as ActivityType,
        title: 'Exam Published',
        description: 'Mathematics CBT exam for SS 3 is now live',
        timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
        read: false,
        metadata: { exam_title: 'Mathematics CBT', class: 'SS 3' }
      },
      {
        id: '3',
        type: 'submission' as ActivityType,
        title: 'New Submission',
        description: '15 students submitted English Language exam',
        timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
        read: true,
        metadata: { exam_title: 'English Language', count: 15 }
      },
      {
        id: '4',
        type: 'staff' as ActivityType,
        title: 'Staff Member Added',
        description: 'Dr. Sarah Johnson joined as Senior Teacher',
        timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
        read: true,
        metadata: { staff_name: 'Dr. Sarah Johnson', position: 'Senior Teacher' }
      },
      {
        id: '5',
        type: 'result' as ActivityType,
        title: 'Results Released',
        description: 'SS 2 Chemistry results have been published',
        timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
        read: true,
        metadata: { exam_title: 'Chemistry', class: 'SS 2' }
      },
      {
        id: '6',
        type: 'attendance' as ActivityType,
        title: 'High Attendance Today',
        description: '94% attendance rate across all classes',
        timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
        read: true,
        metadata: { rate: 94 }
      }
    ]
  }

  // Helper to create activity
  const createActivity = async (activity: Partial<ActivityItem>) => {
    try {
      await supabase.from('activities').insert({
        ...activity,
        created_at: new Date().toISOString(),
        read: false
      })
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }

  // Load activities
  const loadActivities = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    
    try {
      // Try to fetch from activities table
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // If table doesn't exist, use mock data
        if (error.code === '42P01') {
          const mockActivities = generateMockActivities()
          setActivities(mockActivities)
          setUnreadCount(mockActivities.filter(a => !a.read).length)
        } else {
          console.error('Error loading activities:', error)
          toast.error('Failed to load activities')
        }
      } else if (data) {
        const formattedActivities = data.map((item: any): ActivityItem => ({
          id: item.id,
          type: (item.type as ActivityType) || 'system',
          title: item.title,
          description: item.description,
          timestamp: item.created_at,
          read: item.read || false,
          action_url: item.action_url,
          metadata: item.metadata || {}
        }))
        setActivities(formattedActivities)
        setUnreadCount(formattedActivities.filter(a => !a.read).length)
      }
    } catch (error) {
      console.error('Error:', error)
      // Fallback to mock data
      const mockActivities = generateMockActivities()
      setActivities(mockActivities)
      setUnreadCount(mockActivities.filter(a => !a.read).length)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    loadActivities()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('activities-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          console.log('Real-time activity:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newActivity = payload.new as any
            setActivities(prev => [{
              id: newActivity.id,
              type: (newActivity.type as ActivityType) || 'system',
              title: newActivity.title,
              description: newActivity.description,
              timestamp: newActivity.created_at,
              read: false,
              action_url: newActivity.action_url,
              metadata: newActivity.metadata || {}
            }, ...prev])
            
            setUnreadCount(prev => prev + 1)
            toast.success(newActivity.title, {
              description: newActivity.description,
              icon: <Bell className="h-4 w-4" />
            })
          } else if (payload.eventType === 'UPDATE') {
            setActivities(prev => prev.map(activity => 
              activity.id === payload.new.id 
                ? { ...activity, ...payload.new, read: payload.new.read }
                : activity
            ))
          }
        }
      )
      .subscribe()

    // Also listen for student/staff/exam changes to create activities
    const studentChannel = supabase
      .channel('student-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.student' },
        async (payload) => {
          const activity: Partial<ActivityItem> = {
            type: 'student' as ActivityType,
            title: 'New Student Registered',
            description: `${payload.new.full_name} has been enrolled`,
            metadata: { student_name: payload.new.full_name, class: payload.new.class }
          }
          await createActivity(activity)
        }
      )
      .subscribe()

    const staffChannel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.staff' },
        async (payload) => {
          const activity: Partial<ActivityItem> = {
            type: 'staff' as ActivityType,
            title: 'New Staff Member Added',
            description: `${payload.new.full_name} joined as ${payload.new.position}`,
            metadata: { staff_name: payload.new.full_name, position: payload.new.position }
          }
          await createActivity(activity)
        }
      )
      .subscribe()

    const examChannel = supabase
      .channel('exam-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'exams' },
        async (payload) => {
          if (payload.new.status === 'published' && payload.old.status !== 'published') {
            const activity: Partial<ActivityItem> = {
              type: 'exam' as ActivityType,
              title: 'Exam Published',
              description: `${payload.new.title} is now available`,
              metadata: { exam_title: payload.new.title, class: payload.new.class }
            }
            await createActivity(activity)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(studentChannel)
      supabase.removeChannel(staffChannel)
      supabase.removeChannel(examChannel)
    }
  }, [loadActivities])

  // Mark activity as read
  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('activities')
        .update({ read: true })
        .eq('id', id)
      
      setActivities(prev => prev.map(a => 
        a.id === id ? { ...a, read: true } : a
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = activities.filter(a => !a.read).map(a => a.id)
      if (unreadIds.length === 0) return

      await supabase
        .from('activities')
        .update({ read: true })
        .in('id', unreadIds)
      
      setActivities(prev => prev.map(a => ({ ...a, read: true })))
      setUnreadCount(0)
      toast.success('All activities marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete activity
  const deleteActivity = async (id: string) => {
    try {
      await supabase.from('activities').delete().eq('id', id)
      setActivities(prev => prev.filter(a => a.id !== id))
      toast.success('Activity removed')
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  // Filter activities
  const filteredActivities = filter === 'all' 
    ? activities 
    : filter === 'unread'
      ? activities.filter(a => !a.read)
      : activities.filter(a => a.type === filter)

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'student', label: 'Students' },
    { value: 'staff', label: 'Staff' },
    { value: 'exam', label: 'Exams' },
    { value: 'submission', label: 'Submissions' },
  ]

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-muted/30 to-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Recent Activity
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Real-time updates from your school</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.map(option => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={cn(filter === option.value && "bg-primary/10")}
                  >
                    {option.label}
                    {filter === option.value && (
                      <CheckCircle className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mark all read */}
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="h-8"
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Mark all read
              </Button>
            )}

            {/* Refresh */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => loadActivities(true)}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            <AnimatePresence>
              {filteredActivities.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center py-16 px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No activities yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Activities will appear here in real-time
                  </p>
                </motion.div>
              ) : (
                filteredActivities.map((activity, index) => {
                  const IconComponent = activityIcons[activity.type]?.icon || Bell
                  const colorClass = activityIcons[activity.type]?.color || 'bg-slate-100 text-slate-600'
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "group relative flex items-start gap-4 p-4 transition-all duration-200",
                        "hover:bg-muted/50 cursor-pointer",
                        !activity.read && "bg-primary/5 border-l-4 border-l-primary"
                      )}
                      onClick={() => !activity.read && markAsRead(activity.id)}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "p-2.5 rounded-xl shrink-0 transition-all duration-200",
                        "group-hover:scale-105 group-hover:shadow-md",
                        colorClass
                      )}>
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              !activity.read && "font-semibold"
                            )}>
                              {activity.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {activity.description}
                            </p>
                            
                            {/* Metadata */}
                            {activity.metadata && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {activity.metadata.student_name && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="mr-1 h-3 w-3" />
                                    {activity.metadata.student_name}
                                  </Badge>
                                )}
                                {activity.metadata.staff_name && (
                                  <Badge variant="outline" className="text-xs">
                                    <GraduationCap className="mr-1 h-3 w-3" />
                                    {activity.metadata.staff_name}
                                  </Badge>
                                )}
                                {activity.metadata.exam_title && (
                                  <Badge variant="outline" className="text-xs">
                                    <BookOpen className="mr-1 h-3 w-3" />
                                    {activity.metadata.exam_title}
                                  </Badge>
                                )}
                                {activity.metadata.class && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.metadata.class}
                                  </Badge>
                                )}
                                {activity.metadata.score && (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    {activity.metadata.score}%
                                  </Badge>
                                )}
                                {activity.metadata.count && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.metadata.count} submissions
                                  </Badge>
                                )}
                                {activity.metadata.position && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.metadata.position}
                                  </Badge>
                                )}
                                {activity.metadata.rate && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    {activity.metadata.rate}% attendance
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Time and Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              <span title={format(new Date(activity.timestamp), 'PPpp')}>
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </span>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => markAsRead(activity.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as read
                                </DropdownMenuItem>
                                {activity.action_url && (
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => deleteActivity(activity.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!activity.read && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                      )}
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3 bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Real-time updates active</span>
            </div>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
              View all activities
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}