/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/dashboard/RecentActivityFeed.tsx - GROUPED & IMPACTFUL
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Activity, UserPlus, FileText, Award, Clock,
  BookOpen, Users, CheckCircle, RefreshCw,
  Trash2, MoreVertical, Bell, MonitorPlay,
  FileCheck, MessageSquare, GraduationCap, TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { toast } from 'sonner'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ActivityType = 'student' | 'staff' | 'exam' | 'result' | 'submission' | 'system' | 'inquiry' | 'report'

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  read: boolean
  action_url?: string
  metadata?: Record<string, any>
}

const activityConfig: Record<ActivityType, { icon: any; color: string; bg: string; label: string }> = {
  student: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Student' },
  staff: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Staff' },
  exam: { icon: MonitorPlay, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Exam' },
  result: { icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Result' },
  submission: { icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', label: 'Submission' },
  system: { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', label: 'System' },
  inquiry: { icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', label: 'Inquiry' },
  report: { icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Report' },
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function groupActivitiesByDate(activities: ActivityItem[]) {
  const groups: { label: string; items: ActivityItem[] }[] = []
  const today: ActivityItem[] = []
  const yesterday: ActivityItem[] = []
  const thisWeek: ActivityItem[] = []
  const older: ActivityItem[] = []

  activities.forEach(activity => {
    const date = new Date(activity.timestamp)
    if (isToday(date)) today.push(activity)
    else if (isYesterday(date)) yesterday.push(activity)
    else if (date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) thisWeek.push(activity)
    else older.push(activity)
  })

  if (today.length) groups.push({ label: 'Today', items: today })
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday })
  if (thisWeek.length) groups.push({ label: 'This Week', items: thisWeek })
  if (older.length) groups.push({ label: 'Older', items: older })

  return groups
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState(true)

  const loadActivities = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100)
      if (data) {
        const formatted = data.map((item: any): ActivityItem => ({
          id: item.id,
          type: (item.type as ActivityType) || 'system',
          title: item.title || '',
          description: item.details || item.description || '',
          timestamp: item.created_at,
          read: item.read || false,
          action_url: item.link,
          metadata: item.metadata || {}
        }))
        setActivities(formatted)
      }
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { loadActivities() }, [loadActivities])

  useEffect(() => {
    const channel = supabase
      .channel('activity-feed-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const newItem = payload.new as any
        setActivities(prev => [{
          id: newItem.id, type: (newItem.type as ActivityType) || 'system',
          title: newItem.title || '', description: newItem.details || '',
          timestamp: newItem.created_at, read: false,
          action_url: newItem.link, metadata: {}
        }, ...prev])
        toast.success(newItem.title || 'New activity', { description: newItem.details })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const markAsRead = async (id: string) => {
    await supabase.from('activity_logs').update({ read: true }).eq('id', id)
    setActivities(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const markAllAsRead = async () => {
    const unreadIds = activities.filter(a => !a.read).map(a => a.id)
    if (unreadIds.length === 0) return
    await supabase.from('activity_logs').update({ read: true }).in('id', unreadIds)
    setActivities(prev => prev.map(a => ({ ...a, read: true })))
    toast.success('All marked as read')
  }

  const deleteActivity = async (id: string) => {
    await supabase.from('activity_logs').delete().eq('id', id)
    setActivities(prev => prev.filter(a => a.id !== id))
  }

  const filteredActivities = activeFilter === 'all'
    ? activities
    : activeFilter === 'unread'
      ? activities.filter(a => !a.read)
      : activities.filter(a => a.type === activeFilter)

  const groupedActivities = groupActivitiesByDate(filteredActivities)
  const unreadCount = activities.filter(a => !a.read).length

  const typeFilters = [
    { value: 'all', label: 'All', count: activities.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'exam', label: 'Exams', count: activities.filter(a => a.type === 'exam').length },
    { value: 'submission', label: 'Submissions', count: activities.filter(a => a.type === 'submission').length },
    { value: 'student', label: 'Students', count: activities.filter(a => a.type === 'student').length },
    { value: 'report', label: 'Reports', count: activities.filter(a => a.type === 'report').length },
  ]

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><div className="h-6 bg-slate-100 rounded w-32 animate-pulse" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" /><div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Activity Feed</h3>
            <p className="text-[10px] text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread • ` : ''}{activities.length} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] text-slate-500">
              <CheckCircle className="mr-1 h-3 w-3" />Clear all
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => loadActivities(true)} disabled={refreshing} className="h-7 w-7">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-7 w-7">
            <span className="text-[10px]">{expanded ? '−' : '+'}</span>
          </Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-4 py-2 border-b bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {typeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
              activeFilter === f.value
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full",
                activeFilter === f.value ? "bg-white/20" : "bg-slate-100"
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activity List - Grouped by Date */}
      {expanded && (
        <ScrollArea className="h-[500px]">
          {groupedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No activities</p>
              <p className="text-xs text-slate-400 mt-1">New activities will appear here</p>
            </div>
          ) : (
            <div className="px-3 py-2">
              {groupedActivities.map((group, groupIndex) => (
                <div key={group.label} className="mb-1">
                  {/* Date Header */}
                  <div className="flex items-center gap-3 py-2 px-1 sticky top-0 bg-white z-10">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400">{group.items.length}</span>
                  </div>

                  {/* Activities in this group */}
                  <div className="space-y-0.5">
                    {group.items.map((activity, index) => {
                      const config = activityConfig[activity.type] || activityConfig.system
                      const IconComponent = config.icon

                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (groupIndex * 10 + index) * 0.01 }}
                          className={cn(
                            "group relative flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                            "hover:bg-slate-50 border border-transparent hover:border-slate-200",
                            !activity.read && "bg-gradient-to-r from-blue-50/60 to-white border-blue-100"
                          )}
                          onClick={() => !activity.read && markAsRead(activity.id)}
                        >
                          {/* Left accent bar for unread */}
                          {!activity.read && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-full" />
                          )}

                          {/* Avatar/Icon */}
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                            config.bg
                          )}>
                            <IconComponent className={cn("h-4 w-4", config.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={cn("text-xs font-semibold", !activity.read && "text-slate-900")}>
                                    {activity.title}
                                  </p>
                                  <Badge className={cn("text-[9px] px-1.5 py-0 border-0", config.bg, config.color)}>
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                  {activity.description}
                                </p>
                              </div>

                              {/* Time & Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {format(new Date(activity.timestamp), 'h:mm a')}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36">
                                    {!activity.read && (
                                      <DropdownMenuItem onClick={() => markAsRead(activity.id)}>
                                        <CheckCircle className="mr-2 h-3.5 w-3.5" />Mark read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => deleteActivity(activity.id)} className="text-red-600">
                                      <Trash2 className="mr-2 h-3.5 w-3.5" />Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Metadata badges */}
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {activity.metadata.student_name && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {activity.metadata.student_name}
                                  </span>
                                )}
                                {activity.metadata.class && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {activity.metadata.class}
                                  </span>
                                )}
                                {activity.metadata.count && (
                                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                    {activity.metadata.count} students
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="border-t px-4 py-2 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-slate-400">Live</span>
        </div>
        <span className="text-[10px] text-slate-400">{filteredActivities.length} activities</span>
      </div>
    </Card>
  )
}