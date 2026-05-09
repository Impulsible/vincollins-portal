// components/layout/header/NotificationBell.tsx - FULLY RESPONSIVE POPOVER (SSR SAFE)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Award, BookOpen, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  created_at: string
}

interface NotificationBellProps {
  userId?: string
  role?: string
}

const getIcon = (type: string) => {
  switch (type) {
    case 'exam_graded': return <Award className="h-4 w-4 text-green-500" />
    case 'new_exam': return <BookOpen className="h-4 w-4 text-blue-500" />
    case 'needs_grading': return <AlertCircle className="h-4 w-4 text-orange-500" />
    case 'new_student': return <CheckCircle2 className="h-4 w-4 text-purple-500" />
    default: return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export default function NotificationBell({ userId, role }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [windowWidth, setWindowWidth] = useState(1024)
  const [mounted, setMounted] = useState(false)

  // ✅ SSR-safe window detection
  useEffect(() => {
    setMounted(true)
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    } catch {
      // Silently fail
    }
  }, [userId])

  useEffect(() => {
    if (open && userId) {
      loadNotifications()
    }
  }, [open, userId, loadNotifications])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleClick = async (notification: Notification) => {
    await markAsRead(notification.id)
    setOpen(false)
    if (notification.link) router.push(notification.link)
  }

  const getPopoverAlign = (): 'end' | 'center' | 'start' => {
    if (!mounted) return 'end'
    if (windowWidth < 480) return 'center'
    return 'end'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 rounded-full text-white hover:bg-white/20 transition-all flex items-center justify-center">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        align={getPopoverAlign()}
        sideOffset={8}
        className={cn(
          "p-0 rounded-2xl shadow-2xl border-0 overflow-hidden",
          "w-[calc(100vw-2rem)] max-w-[380px]",
          "sm:w-[380px]",
          "mx-4 sm:mx-0"
        )}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs bg-blue-100 text-blue-700">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        
        {/* Content */}
        <ScrollArea className="max-h-[50vh] sm:max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-10 sm:py-12 text-center px-4">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">We'll notify you when something arrives</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "px-4 sm:px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                    !n.read && "bg-blue-50/40 hover:bg-blue-50/60"
                  )}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shrink-0",
                      !n.read ? "bg-blue-100" : "bg-gray-100"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium leading-snug",
                          !n.read ? "text-gray-900" : "text-gray-600"
                        )}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-2 sm:p-3 border-t bg-gray-50/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => {
              setOpen(false)
              router.push(role === 'student' ? '/student/notifications' : '/staff/notifications')
            }}
          >
            View All Notifications
            <ChevronRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}