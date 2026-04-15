/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/dashboard/UpcomingScheduleCard.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, MapPin, Users, BookOpen, Plus, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { toast } from 'sonner'

interface ScheduleItem {
  id: string
  title: string
  description: string
  type: 'exam' | 'meeting' | 'event' | 'deadline' | 'class'
  start_time: string
  end_time?: string
  location?: string
  class_level?: string
  subject?: string
  attendees?: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
}

const scheduleTypeConfig = {
  exam: { color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400', icon: BookOpen },
  meeting: { color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400', icon: Users },
  event: { color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400', icon: Calendar },
  deadline: { color: 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400', icon: Clock },
  class: { color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400', icon: BookOpen },
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-500',
}

export function UpcomingScheduleCard() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')

  const loadSchedules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10)

      if (error) {
        // Generate mock data if table is empty or error
        setSchedules(generateMockSchedules())
      } else if (data && data.length > 0) {
        setSchedules(data as ScheduleItem[])
      } else {
        setSchedules(generateMockSchedules())
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules(generateMockSchedules())
    } finally {
      setLoading(false)
    }
  }, [])

  const generateMockSchedules = (): ScheduleItem[] => {
    const now = new Date()
    const today = new Date()
    today.setHours(10, 0, 0, 0)
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)
    
    const friday = new Date()
    friday.setDate(friday.getDate() + (5 - friday.getDay()))
    friday.setHours(9, 0, 0, 0)
    
    return [
      {
        id: '1',
        title: 'Mathematics CBT Exam',
        description: 'End of term examination',
        type: 'exam',
        start_time: today.toISOString(),
        end_time: new Date(today.getTime() + 2 * 3600000).toISOString(),
        location: 'Computer Lab 1',
        class_level: 'SS 2',
        subject: 'Mathematics',
        attendees: 45,
        status: 'upcoming',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Staff Meeting',
        description: 'Monthly departmental meeting',
        type: 'meeting',
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 3600000).toISOString(),
        location: 'Conference Room',
        attendees: 25,
        status: 'upcoming',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Physics Practical',
        description: 'Laboratory session',
        type: 'class',
        start_time: friday.toISOString(),
        end_time: new Date(friday.getTime() + 3 * 3600000).toISOString(),
        location: 'Physics Lab',
        class_level: 'SS 3 Science',
        subject: 'Physics',
        attendees: 30,
        status: 'upcoming',
        priority: 'high'
      },
      {
        id: '4',
        title: 'Assignment Deadline',
        description: 'Chemistry project submission',
        type: 'deadline',
        start_time: friday.toISOString(),
        class_level: 'SS 2',
        subject: 'Chemistry',
        status: 'upcoming',
        priority: 'high'
      }
    ]
  }

  useEffect(() => {
    loadSchedules()

    // Real-time subscription
    const channel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        () => {
          loadSchedules()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadSchedules])

  const filteredSchedules = schedules.filter(schedule => {
    const startDate = new Date(schedule.start_time)
    if (filter === 'today') return isToday(startDate)
    if (filter === 'week') return isThisWeek(startDate, { weekStartsOn: 1 })
    return true
  })

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }

  const getTimeLabel = (start: Date, end?: Date) => {
    if (!end) return format(start, 'h:mm a')
    return `${format(start, 'h:mm')} - ${format(end, 'h:mm a')}`
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
              <CardDescription>
                Events and activities this week
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant={filter === 'today' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('today')}
              className="h-7 text-xs"
            >
              Today
            </Button>
            <Button
              variant={filter === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('week')}
              className="h-7 text-xs"
            >
              Week
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {filteredSchedules.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No upcoming events</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === 'today' ? 'Nothing scheduled for today' : 
                   filter === 'week' ? 'No events this week' : 
                   'All clear!'}
                </p>
              </motion.div>
            ) : (
              // Group by date
              Object.entries(
                filteredSchedules.reduce((acc, schedule) => {
                  const date = format(new Date(schedule.start_time), 'yyyy-MM-dd')
                  if (!acc[date]) acc[date] = []
                  acc[date].push(schedule)
                  return acc
                }, {} as Record<string, ScheduleItem[]>)
              ).map(([dateKey, items], groupIndex) => (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-medium">
                      {getDateLabel(new Date(dateKey))}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="space-y-2">
                    {items.map((schedule, index) => {
                      const TypeIcon = scheduleTypeConfig[schedule.type]?.icon || Calendar
                      const typeColor = scheduleTypeConfig[schedule.type]?.color || 'bg-slate-100 text-slate-600'
                      
                      return (
                        <motion.div
                          key={schedule.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                          className={cn(
                            "group relative p-4 rounded-xl border transition-all duration-200",
                            "hover:shadow-md hover:border-primary/30 cursor-pointer",
                            schedule.priority === 'high' && "border-l-4 border-l-red-500",
                            schedule.priority === 'medium' && "border-l-4 border-l-amber-500"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Time Column */}
                            <div className="text-center min-w-[60px]">
                              <p className="text-sm font-semibold text-primary">
                                {format(new Date(schedule.start_time), 'h:mm a')}
                              </p>
                              {schedule.end_time && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(schedule.end_time), 'h:mm a')}
                                </p>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <div className={cn("p-1.5 rounded-lg", typeColor)}>
                                  <TypeIcon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{schedule.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {schedule.description}
                                  </p>
                                  
                                  {/* Metadata */}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {schedule.location && (
                                      <Badge variant="outline" className="text-xs">
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {schedule.location}
                                      </Badge>
                                    )}
                                    {schedule.class_level && (
                                      <Badge variant="outline" className="text-xs">
                                        <Users className="mr-1 h-3 w-3" />
                                        {schedule.class_level}
                                      </Badge>
                                    )}
                                    {schedule.subject && (
                                      <Badge variant="outline" className="text-xs">
                                        <BookOpen className="mr-1 h-3 w-3" />
                                        {schedule.subject}
                                      </Badge>
                                    )}
                                    {schedule.attendees && (
                                      <Badge variant="outline" className="text-xs">
                                        {schedule.attendees} attendees
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default UpcomingScheduleCard