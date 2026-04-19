'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, LogIn, FileText, MonitorPlay, Award, Clock 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ActivityLog {
  id: string
  type: 'login' | 'exam_start' | 'exam_submit' | 'assignment_submit'
  student_name: string
  student_id: string
  details: string
  created_at: string
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    // Load recent activities
    const loadRecentActivities = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) {
        setActivities(data)
      }
    }
    
    loadRecentActivities()
    
    // Subscribe to real-time activities
    const channel = supabase
      .channel('live-activities')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setActivities(prev => [payload.new as ActivityLog, ...prev.slice(0, 49)])
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="h-4 w-4 text-blue-500" />
      case 'exam_start': return <MonitorPlay className="h-4 w-4 text-emerald-500" />
      case 'exam_submit': return <Award className="h-4 w-4 text-purple-500" />
      case 'assignment_submit': return <FileText className="h-4 w-4 text-amber-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return date.toLocaleTimeString()
  }
  
  return (
    <Card className="border-0 shadow-sm overflow-hidden h-full">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Live Activity Feed
          </CardTitle>
          <Badge className={cn(
            "text-xs",
            isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          )}>
            <div className={cn(
              "h-2 w-2 rounded-full mr-1.5",
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            {isConnected ? 'Live' : 'Reconnecting...'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <AnimatePresence>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-muted-foreground">No activity yet</p>
                <p className="text-xs text-slate-400 mt-1">Activities will appear here in real-time</p>
              </div>
            ) : (
              <div className="divide-y">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activity.student_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {activity.details}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}